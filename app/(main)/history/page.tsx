"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { enter, PageHeader } from "@/components/salahtrack/ui";
import { DEMO_MISSED_BY_DAY, PRAYERS, TOTAL_PRAYERS } from "@/lib/demo-data";
import { daysBefore, useToday } from "@/lib/use-today";

const RANGES = [7, 14] as const;
type Range = (typeof RANGES)[number];

export default function HistoryPage() {
  const today = useToday();
  const [range, setRange] = useState<Range>(7);

  // Previous days, newest first (yesterday is daysAgo = 1).
  const days = DEMO_MISSED_BY_DAY.slice(0, range).map((missed, i) => ({
    daysAgo: i + 1,
    missed,
    count: TOTAL_PRAYERS - missed.length,
  }));

  const prayed = days.reduce((sum, d) => sum + d.count, 0);
  const possible = days.length * TOTAL_PRAYERS;
  const perfectDays = days.filter((d) => d.count === TOTAL_PRAYERS).length;

  return (
    <>
      <PageHeader title="History" subtitle="Your prayers from previous days" />

      {/* 7 days / 14 days switch */}
      <div
        role="tablist"
        aria-label="Time range"
        className={`${enter} delay-75 grid grid-cols-2 rounded-2xl bg-stone-200/60 p-1`}
      >
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            onClick={() => setRange(r)}
            className={`rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
              range === r
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Last {r} days
          </button>
        ))}
      </div>

      {/* Summary */}
      <section className={`${enter} delay-150 grid grid-cols-3 gap-3`}>
        <StatTile
          value={`${Math.round((prayed / possible) * 100)}%`}
          label="Completion"
          highlight
        />
        <StatTile value={String(perfectDays)} label="Perfect days" />
        <StatTile value={String(possible - prayed)} label="Missed" />
      </section>

      {/* One card per day */}
      <ul className="flex flex-col gap-3">
        {days.map((day, i) => (
          <li
            key={`${range}-${day.daysAgo}`}
            className={`${enter} rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70`}
            style={{ animationDelay: `${200 + i * 40}ms` }}
          >
            <DayCard today={today} {...day} />
          </li>
        ))}
      </ul>
    </>
  );
}

function DayCard({
  today,
  daysAgo,
  missed,
  count,
}: {
  today: Date | null;
  daysAgo: number;
  missed: string[];
  count: number;
}) {
  const date = today ? daysBefore(today, daysAgo) : null;
  const title =
    daysAgo === 1
      ? "Yesterday"
      : date?.toLocaleDateString("en-GB", { weekday: "long" });
  const subtitle = date?.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  const perfect = count === TOTAL_PRAYERS;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {title ? (
            <p className="font-semibold">{title}</p>
          ) : (
            <span className="block h-5 w-24 animate-pulse rounded bg-stone-200" />
          )}
          <p className="h-5 text-sm text-stone-500">{subtitle}</p>
        </div>
        {perfect ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
            <Sparkles className="size-3.5" />
            Perfect day
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-stone-600">
            {count}/{TOTAL_PRAYERS} prayed
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {PRAYERS.map((prayer) => {
          const done = !missed.includes(prayer.name);
          return (
            <div
              key={prayer.name}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium ${
                done
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <X className="size-4" strokeWidth={3} />
              )}
              {prayer.name}
              <span className="sr-only">{done ? "prayed" : "missed"}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3 text-center ring-1 ${
        highlight
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white ring-emerald-700 shadow-md shadow-emerald-900/15"
          : "bg-white ring-stone-200/70 shadow-sm"
      }`}
    >
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p
        className={`text-xs ${highlight ? "text-emerald-100" : "text-stone-500"}`}
      >
        {label}
      </p>
    </div>
  );
}
