"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Moon, UserRound } from "lucide-react";
import {
  LoadErrorCard,
  PrayerConfirmDialog,
  PrayerListSkeleton,
  PrayerRow,
} from "@/components/salahtrack/prayer-checklist";
import { StreakCard, WeeklyCard } from "@/components/salahtrack/stats-cards";
import { ToastMessage } from "@/components/salahtrack/toast";
import {
  enter,
  SampleBadge,
  type LoadStatus,
} from "@/components/salahtrack/ui";
import { toLocalDateString } from "@/lib/local-date";
import {
  fetchAccountStartDate,
  fetchPrayerHistory,
} from "@/lib/prayer-records";
import {
  buildDayMap,
  lastSevenDays,
  streakSummary,
  type DayMap,
} from "@/lib/prayer-stats";
import {
  PRAYERS,
  TOTAL_PRAYERS,
  type Prayer,
  type PrayerName,
} from "@/lib/prayers";
import { useToday } from "@/lib/use-today";
import { useTodayPrayers } from "@/lib/use-today-prayers";

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const now = useToday();
  // The user's local calendar date, e.g. "2026-10-15" (not UTC).
  const prayerDate = now ? toLocalDateString(now) : null;

  // Today's checklist: loading, confirming and undoing (shared with the NFC
  // check-in page).
  const today = useTodayPrayers(prayerDate);
  const { records, status, completedCount } = today;

  // Full history for the streak and weekly statistics. Loaded alongside
  // today's records; today's part is then kept up to date from `records`.
  const [history, setHistory] = useState<DayMap | null>(null);
  const [accountStart, setAccountStart] = useState<string | null>(null);
  const [statsStatus, setStatsStatus] = useState<LoadStatus>("loading");
  const [statsReloadKey, setStatsReloadKey] = useState(0);

  useEffect(() => {
    if (!prayerDate) return;
    let cancelled = false;
    setStatsStatus("loading");

    Promise.all([fetchPrayerHistory(), fetchAccountStartDate()])
      .then(([entries, start]) => {
        if (cancelled) return;
        setHistory(buildDayMap(entries));
        setAccountStart(start);
        setStatsStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [prayerDate, statsReloadKey]);

  const allDone = completedCount === TOTAL_PRAYERS;
  const nextPrayer =
    status === "ready" ? PRAYERS.find((p) => !records[p.name]) : undefined;

  // Statistics: the loaded history, with today replaced by the live checklist
  // so confirming or undoing a prayer updates the streak and chart instantly.
  const stats = useMemo(() => {
    if (!history || !prayerDate) return null;
    const days = new Map(history);
    if (status === "ready") {
      days.set(prayerDate, new Set(Object.keys(records) as PrayerName[]));
    }
    return {
      streak: streakSummary(days, prayerDate),
      week: lastSevenDays(days, prayerDate, accountStart),
    };
  }, [history, records, status, prayerDate, accountStart]);

  return (
    <>
      <Header />
      <Welcome now={now} />

      <ProgressCard
        status={status}
        completedCount={completedCount}
        allDone={allDone}
        nextPrayer={nextPrayer}
      />

      <section className={`${enter} delay-200`}>
        <div className="mb-1 flex items-baseline justify-between px-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Today&apos;s prayers
          </h2>
          <span className="text-sm text-stone-500">Tap to confirm</span>
        </div>
        <p className="mb-3 flex items-center gap-2 px-1 text-xs text-stone-500">
          <SampleBadge>Sample times</SampleBadge>
          Real times for your location are coming soon.
        </p>

        {status === "error" ? (
          <LoadErrorCard message={today.loadError} onRetry={today.reload} />
        ) : status === "loading" ? (
          <PrayerListSkeleton />
        ) : (
          <ul className="flex flex-col gap-3">
            {PRAYERS.map((prayer) => (
              <PrayerRow
                key={prayer.name}
                prayer={prayer}
                done={Boolean(records[prayer.name])}
                isNext={nextPrayer?.name === prayer.name}
                onPress={() => today.openDialog(prayer)}
              />
            ))}
          </ul>
        )}
      </section>

      <StreakCard
        status={statsStatus}
        summary={stats?.streak ?? null}
        onRetry={() => setStatsReloadKey((k) => k + 1)}
      />
      <WeeklyCard
        status={statsStatus}
        week={stats?.week ?? null}
        onRetry={() => setStatsReloadKey((k) => k + 1)}
      />

      {today.pending && (
        <PrayerConfirmDialog
          pending={today.pending}
          now={now}
          saving={today.saving}
          error={today.dialogError}
          onConfirm={today.confirmPending}
          onCancel={today.closeDialog}
        />
      )}

      {today.toast && <ToastMessage toast={today.toast} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function Header() {
  return (
    <header className={`${enter} flex items-center justify-between`}>
      <div className="flex items-center gap-2.5">
        <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/25">
          <Moon className="size-5" strokeWidth={2.25} />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          Salah<span className="text-emerald-600">Track</span>
        </span>
      </div>
      <Link
        href="/settings"
        aria-label="Profile and settings"
        className="grid size-10 place-items-center rounded-full bg-white text-stone-500 shadow-sm ring-1 ring-stone-200/70 transition active:scale-95"
      >
        <UserRound className="size-5" />
      </Link>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Welcome heading with today's date                                         */
/* -------------------------------------------------------------------------- */

function Welcome({ now }: { now: Date | null }) {
  const gregorian = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Islamic (Hijri) date, built into the browser - no extra library needed.
  const hijri = now
    ? new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : null;

  return (
    <section className={`${enter} delay-75`}>
      <p className="text-sm font-medium text-emerald-700">Assalamu alaikum</p>
      <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">
        Welcome back
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        {gregorian ? (
          <span>{gregorian}</span>
        ) : (
          <span className="h-4 w-44 animate-pulse rounded bg-stone-200" />
        )}
        {hijri && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/70">
            {hijri}
          </span>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress card                                                             */
/* -------------------------------------------------------------------------- */

function ProgressCard({
  status,
  completedCount,
  allDone,
  nextPrayer,
}: {
  status: LoadStatus;
  completedCount: number;
  allDone: boolean;
  nextPrayer: Prayer | undefined;
}) {
  const ready = status === "ready";

  return (
    <section
      className={`${enter} delay-150 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 text-white shadow-xl shadow-emerald-900/20`}
    >
      {/* Decorative Islamic star pattern */}
      <EightPointStar className="absolute -right-10 -top-10 size-44 text-white/[0.07]" />
      <EightPointStar className="absolute -bottom-12 left-6 size-28 text-white/[0.05]" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-200">
            Today&apos;s progress
          </p>
          <p className="mt-2 text-xl font-semibold leading-snug">
            {status === "loading"
              ? "Loading your prayers…"
              : status === "error"
                ? "Couldn't load today's prayers"
                : allDone
                  ? "All prayers completed. MashaAllah!"
                  : `${completedCount} of ${TOTAL_PRAYERS} prayers completed`}
          </p>
          {ready && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50 ring-1 ring-white/15 backdrop-blur">
              {nextPrayer ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Next: {nextPrayer.name} · {nextPrayer.time}
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  See you at Fajr tomorrow
                </>
              )}
            </p>
          )}
        </div>
        <ProgressRing
          value={ready ? completedCount : 0}
          total={TOTAL_PRAYERS}
          loading={status === "loading"}
        />
      </div>
    </section>
  );
}

function ProgressRing({
  value,
  total,
  loading,
}: {
  value: number;
  total: number;
  loading: boolean;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / total);

  return (
    <div
      className="relative size-28 shrink-0"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label="Prayers completed today"
      aria-busy={loading}
    >
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-white/15"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-white transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <Loader2 className="size-7 animate-spin text-white/70" />
        ) : (
          <span className="text-3xl font-semibold tabular-nums">
            {value}
            <span className="text-lg text-white/60">/{total}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function EightPointStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <rect x="20" y="20" width="60" height="60" fill="currentColor" />
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        fill="currentColor"
        transform="rotate(45 50 50)"
      />
    </svg>
  );
}

