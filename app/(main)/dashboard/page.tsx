"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Loader2,
  Moon,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { StreakCard, WeeklyCard } from "@/components/salahtrack/stats-cards";
import {
  enter,
  SampleBadge,
  type LoadStatus,
} from "@/components/salahtrack/ui";
import { toLocalDateString } from "@/lib/local-date";
import {
  addPrayerRecord,
  deletePrayerRecord,
  fetchAccountStartDate,
  fetchPrayerHistory,
  fetchPrayerRecords,
  PrayerRecordError,
  type PrayerRecord,
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

type RecordsByPrayer = Partial<Record<PrayerName, PrayerRecord>>;
type PendingAction = { prayer: Prayer; action: "complete" | "undo" };
type Toast = { tone: "success" | "error"; message: string };

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const now = useToday();
  // The user's local calendar date, e.g. "2026-10-15" (not UTC).
  const prayerDate = now ? toLocalDateString(now) : null;

  // Today's saved records from Supabase, keyed by prayer name.
  const [records, setRecords] = useState<RecordsByPrayer>({});
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The confirmation dialog, and whether it is currently saving.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [toast, setToast] = useState<Toast | null>(null);

  // Load today's records whenever the date changes (or "Try again" is pressed).
  useEffect(() => {
    if (!prayerDate) return;
    let cancelled = false;
    setStatus("loading");
    setLoadError(null);

    fetchPrayerRecords(prayerDate)
      .then((rows) => {
        if (cancelled) return;
        setRecords(Object.fromEntries(rows.map((r) => [r.prayer_name, r])));
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(messageFor(error));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [prayerDate, reloadKey]);

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

  // Hide messages automatically after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.tone === "error" ? 5000 : 2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const completedCount = PRAYERS.filter((p) => records[p.name]).length;
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

  function openDialog(prayer: Prayer) {
    if (status !== "ready") return;
    setDialogError(null);
    setPending({ prayer, action: records[prayer.name] ? "undo" : "complete" });
  }

  function closeDialog() {
    if (saving) return;
    setPending(null);
    setDialogError(null);
  }

  // Runs only after the user confirms in the dialog.
  async function confirmPending() {
    if (!pending || !prayerDate) return;
    const { prayer, action } = pending;
    setSaving(true);
    setDialogError(null);

    try {
      if (action === "complete") {
        const saved = await addPrayerRecord(prayerDate, prayer.name);
        // The database confirmed the save, so now update the screen.
        setRecords((prev) => ({ ...prev, [saved.prayer_name]: saved }));
        setToast({
          tone: "success",
          message: `${prayer.name} recorded. May Allah accept it.`,
        });
      } else {
        const existing = records[prayer.name];
        if (existing) await deletePrayerRecord(existing.id);
        setRecords((prev) => {
          const next = { ...prev };
          delete next[prayer.name];
          return next;
        });
        setToast({ tone: "success", message: `${prayer.name} record removed.` });
      }
      setPending(null);
    } catch (error: unknown) {
      const kind = error instanceof PrayerRecordError ? error.kind : "unknown";
      if (kind === "duplicate" || kind === "not-found") {
        // The screen was out of date (e.g. changed in another tab). Close the
        // dialog and reload the real state from the database.
        setPending(null);
        setReloadKey((k) => k + 1);
        setToast({ tone: "error", message: messageFor(error) });
      } else {
        // Keep the dialog open so the user can try again.
        setDialogError(messageFor(error));
      }
    } finally {
      setSaving(false);
    }
  }

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
          <LoadErrorCard
            message={loadError}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
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
                onPress={() => openDialog(prayer)}
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

      {pending && (
        <ConfirmDialog
          pending={pending}
          now={now}
          saving={saving}
          error={dialogError}
          onConfirm={confirmPending}
          onCancel={closeDialog}
        />
      )}

      {toast && <ToastMessage toast={toast} />}
    </>
  );
}

function messageFor(error: unknown) {
  return error instanceof PrayerRecordError
    ? error.message
    : "Something went wrong. Please try again.";
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

/* -------------------------------------------------------------------------- */
/*  Prayer list                                                               */
/* -------------------------------------------------------------------------- */

function PrayerRow({
  prayer,
  done,
  isNext,
  onPress,
}: {
  prayer: Prayer;
  done: boolean;
  isNext: boolean;
  onPress: () => void;
}) {
  const Icon = prayer.icon;

  return (
    <li
      className={`flex items-center gap-4 rounded-2xl p-4 ring-1 transition-all duration-300 ${
        done
          ? "bg-emerald-50/80 ring-emerald-200/80"
          : isNext
            ? "bg-white shadow-md shadow-emerald-900/5 ring-emerald-300"
            : "bg-white shadow-sm ring-stone-200/70"
      }`}
    >
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${
          done
            ? "bg-emerald-600 text-white"
            : "bg-stone-100 text-stone-500"
        }`}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold">{prayer.name}</p>
          <p lang="ar" dir="rtl" className="text-sm text-stone-400">
            {prayer.arabic}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-stone-500">
          <span className="tabular-nums">{prayer.time}</span>
          {" · "}
          {done ? (
            <span className="text-emerald-700">Prayed</span>
          ) : isNext ? (
            <span className="font-medium text-emerald-700">Up next</span>
          ) : (
            "Upcoming"
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onPress}
        aria-pressed={done}
        aria-haspopup="dialog"
        aria-label={
          done ? `Undo ${prayer.name} record` : `Confirm ${prayer.name}`
        }
        className={`inline-flex h-10 min-w-[96px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          done
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/25 hover:bg-emerald-700"
            : "bg-white text-emerald-700 ring-1 ring-inset ring-emerald-600/30 hover:bg-emerald-50"
        }`}
      >
        {done ? (
          <>
            <Check
              className="size-4 animate-in zoom-in-50 duration-300"
              strokeWidth={3}
            />
            Done
          </>
        ) : (
          "Confirm"
        )}
      </button>
    </li>
  );
}

function PrayerListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-label="Loading prayers">
      {PRAYERS.map((prayer) => (
        <li
          key={prayer.name}
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70"
        >
          <div className="size-11 shrink-0 animate-pulse rounded-xl bg-stone-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-full bg-stone-100" />
        </li>
      ))}
    </ul>
  );
}

function LoadErrorCard({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200/70"
    >
      <div className="grid size-11 place-items-center rounded-full bg-rose-50 text-rose-500">
        <AlertCircle className="size-6" />
      </div>
      <p className="text-sm text-stone-600">
        {message ?? "Something went wrong. Please try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition active:scale-95 hover:bg-emerald-700"
      >
        <RotateCcw className="size-4" />
        Try again
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Confirmation dialog                                                       */
/* -------------------------------------------------------------------------- */

function ConfirmDialog({
  pending,
  now,
  saving,
  error,
  onConfirm,
  onCancel,
}: {
  pending: PendingAction;
  now: Date | null;
  saving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { prayer, action } = pending;
  const Icon = prayer.icon;
  const isUndo = action === "undo";
  const confirmRef = useRef<HTMLButtonElement>(null);

  const dateLabel = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Always call the latest onCancel from the Escape key handler below.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  // When the dialog opens: focus the main button and let Escape close it.
  useEffect(() => {
    confirmRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Dimmed background - tapping it cancels */}
      <div
        aria-hidden
        onClick={onCancel}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="relative w-full max-w-md rounded-t-3xl bg-white px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-6 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:mx-4 sm:rounded-3xl sm:pb-6"
      >
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${
            isUndo
              ? "bg-stone-100 text-stone-600"
              : "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/25"
          }`}
        >
          <Icon className="size-7" />
        </div>

        <h2
          id="confirm-title"
          className="mt-4 text-center text-xl font-semibold tracking-tight"
        >
          {isUndo ? `Remove ${prayer.name}?` : `Did you pray ${prayer.name}?`}
        </h2>
        <p
          id="confirm-description"
          className="mt-1 text-center text-sm text-stone-500"
        >
          {isUndo
            ? `This deletes today's ${prayer.name} record. You can confirm it again later.`
            : `This records ${prayer.name} as completed${
                dateLabel ? ` for ${dateLabel}` : " for today"
              }.`}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/70"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 ${
              isUndo
                ? "bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-500"
                : "bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isUndo ? "Removing…" : "Saving…"}
              </>
            ) : error ? (
              "Try again"
            ) : isUndo ? (
              "Remove record"
            ) : (
              `Yes, I prayed ${prayer.name}`
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-12 rounded-full text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastMessage({ toast }: { toast: Toast }) {
  const isError = toast.tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className="fixed inset-x-0 bottom-28 z-40 flex justify-center px-5"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
          isError ? "bg-rose-600" : "bg-stone-900"
        }`}
      >
        {isError ? (
          <AlertCircle className="size-4 shrink-0" />
        ) : (
          <Check className="size-4 shrink-0 text-emerald-400" strokeWidth={3} />
        )}
        {toast.message}
      </div>
    </div>
  );
}
