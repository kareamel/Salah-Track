"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Flame, Moon, Trophy, UserRound } from "lucide-react";
import { card, enter } from "@/components/salahtrack/ui";
import {
  DEMO_BEST_STREAK,
  DEMO_MISSED_BY_DAY,
  DEMO_STREAK,
  DEMO_TODAY_COMPLETED,
  PRAYERS,
  TOTAL_PRAYERS,
  type Prayer,
  type PrayerName,
} from "@/lib/demo-data";
import { daysBefore, useToday } from "@/lib/use-today";

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const now = useToday();
  const [completed, setCompleted] = useState(DEMO_TODAY_COMPLETED);

  const completedCount = PRAYERS.filter((p) => completed[p.name]).length;
  const allDone = completedCount === TOTAL_PRAYERS;
  const nextPrayer = PRAYERS.find((p) => !completed[p.name]);
  const streak = DEMO_STREAK + (allDone ? 1 : 0);

  function togglePrayer(name: PrayerName) {
    setCompleted((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <>
      <Header />
      <Welcome now={now} />

      <ProgressCard
        completedCount={completedCount}
        allDone={allDone}
        nextPrayer={nextPrayer}
      />

      <section className={`${enter} delay-200`}>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Today&apos;s prayers
          </h2>
          <span className="text-sm text-stone-500">Tap to confirm</span>
        </div>
        <ul className="flex flex-col gap-3">
          {PRAYERS.map((prayer) => (
            <PrayerRow
              key={prayer.name}
              prayer={prayer}
              done={completed[prayer.name]}
              isNext={nextPrayer?.name === prayer.name}
              onToggle={() => togglePrayer(prayer.name)}
            />
          ))}
        </ul>
      </section>

      <StreakCard streak={streak} allDone={allDone} />
      <WeeklyCard now={now} todayCount={completedCount} />
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
  completedCount,
  allDone,
  nextPrayer,
}: {
  completedCount: number;
  allDone: boolean;
  nextPrayer: Prayer | undefined;
}) {
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
            {allDone
              ? "All prayers completed. MashaAllah!"
              : `${completedCount} of ${TOTAL_PRAYERS} prayers completed`}
          </p>
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
        </div>
        <ProgressRing value={completedCount} total={TOTAL_PRAYERS} />
      </div>
    </section>
  );
}

function ProgressRing({ value, total }: { value: number; total: number }) {
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
        <span className="text-3xl font-semibold tabular-nums">
          {value}
          <span className="text-lg text-white/60">/{total}</span>
        </span>
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
/*  A single prayer with its confirmation button                              */
/* -------------------------------------------------------------------------- */

function PrayerRow({
  prayer,
  done,
  isNext,
  onToggle,
}: {
  prayer: Prayer;
  done: boolean;
  isNext: boolean;
  onToggle: () => void;
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
        onClick={onToggle}
        aria-pressed={done}
        aria-label={
          done ? `Undo ${prayer.name} confirmation` : `Confirm ${prayer.name}`
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

/* -------------------------------------------------------------------------- */
/*  Streak card                                                               */
/* -------------------------------------------------------------------------- */

function StreakCard({ streak, allDone }: { streak: number; allDone: boolean }) {
  return (
    <section className={`${enter} delay-300 ${card}`}>
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-500">
          <Flame className="size-7" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-500">Daily streak</p>
          <p className="text-2xl font-semibold tracking-tight">
            <span className="tabular-nums">{streak}</span>{" "}
            {streak === 1 ? "day" : "days"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
          <Trophy className="size-3.5 text-amber-500" />
          Best {DEMO_BEST_STREAK}
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
        {allDone
          ? "Streak extended! Keep it going tomorrow, in sha Allah."
          : "Complete all 5 prayers today to extend your streak."}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Weekly statistics                                                         */
/* -------------------------------------------------------------------------- */

function WeeklyCard({ now, todayCount }: { now: Date | null; todayCount: number }) {
  // The last 7 days, oldest first: 6 demo days + today's live count.
  const previousDays = DEMO_MISSED_BY_DAY.slice(0, 6)
    .map((missed) => TOTAL_PRAYERS - missed.length)
    .reverse();
  const counts = [...previousDays, todayCount];

  const days = counts.map((count, i) => {
    const daysAgo = counts.length - 1 - i;
    const label = now
      ? daysBefore(now, daysAgo).toLocaleDateString("en-GB", { weekday: "short" })
      : "";
    return { count, label, isToday: daysAgo === 0 };
  });

  const totalPrayed = counts.reduce((sum, c) => sum + c, 0);
  const totalPossible = counts.length * TOTAL_PRAYERS;
  const percent = Math.round((totalPrayed / totalPossible) * 100);
  const perfectDays = counts.filter((c) => c === TOTAL_PRAYERS).length;

  return (
    <section className={`${enter} delay-500 ${card}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">This week</h2>
          <p className="text-sm text-stone-500">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-emerald-700">
            {percent}%
          </p>
          <p className="text-xs text-stone-500">completion</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="mt-5 flex items-end gap-2">
        {days.map((day, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end overflow-hidden rounded-xl bg-stone-100">
              <div
                className={`w-full rounded-xl transition-[height] duration-700 ease-out ${
                  day.count === TOTAL_PRAYERS
                    ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                    : "bg-emerald-200"
                }`}
                style={{ height: `${(day.count / TOTAL_PRAYERS) * 100}%` }}
              />
            </div>
            <span
              className={`h-4 text-xs ${
                day.isToday ? "font-semibold text-emerald-700" : "text-stone-400"
              }`}
            >
              {day.isToday ? "Today" : day.label}
            </span>
          </div>
        ))}
      </div>

      {/* Summary numbers */}
      <div className="mt-5 grid grid-cols-3 divide-x divide-stone-200 rounded-2xl bg-stone-50 py-3 text-center">
        <Stat value={`${totalPrayed}/${totalPossible}`} label="Prayers" />
        <Stat value={String(perfectDays)} label="Perfect days" />
        <Stat
          value={(totalPrayed / counts.length).toFixed(1)}
          label="Daily avg"
        />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
