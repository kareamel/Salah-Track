"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarSkeleton,
  DayDetail,
  MonthCalendar,
} from "@/components/salahtrack/history-calendar";
import {
  card,
  enter,
  InlineError,
  PageHeader,
  type LoadStatus,
} from "@/components/salahtrack/ui";
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  toLocalDate,
  toLocalDateString,
} from "@/lib/local-date";
import {
  fetchAccountStartDate,
  fetchPrayerHistory,
  type PrayerHistoryEntry,
} from "@/lib/prayer-records";
import { buildDayMap, monthDays, monthSummary } from "@/lib/prayer-stats";
import { useToday } from "@/lib/use-today";

export default function HistoryPage() {
  const now = useToday();
  const today = now ? toLocalDateString(now) : null;
  const thisMonth = today ? startOfMonth(today) : null;

  // The month being shown ("YYYY-MM-01"). Starts on the current month.
  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const month = chosenMonth ?? thisMonth;

  // The day the user tapped (null = default selection).
  const [chosenDate, setChosenDate] = useState<string | null>(null);

  // The user's sign-up date: no browsing to months before it.
  const [accountStart, setAccountStart] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchAccountStartDate()
      .then((start) => {
        if (!cancelled) setAccountStart(start);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Only the shown month's records are loaded from Supabase.
  const [entries, setEntries] = useState<PrayerHistoryEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    setStatus("loading");

    fetchPrayerHistory({ from: month, to: endOfMonth(month) })
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [month, reloadKey]);

  const days = useMemo(
    () =>
      month && today
        ? monthDays(buildDayMap(entries), month, today, accountStart)
        : [],
    [entries, month, today, accountStart],
  );
  const summary = monthSummary(days);

  // Selected day: the one tapped in this month, otherwise today (when viewing
  // the current month).
  const selected =
    chosenDate && month && chosenDate.startsWith(month.slice(0, 7))
      ? chosenDate
      : month === thisMonth
        ? today
        : null;
  const selectedDay = days.find((d) => d.date === selected);
  const selectedEntries = entries.filter((e) => e.prayer_date === selected);

  const canGoBack =
    month !== null && (!accountStart || month > startOfMonth(accountStart));
  const canGoForward = month !== null && thisMonth !== null && month < thisMonth;

  function changeMonth(delta: number) {
    if (!month) return;
    setChosenMonth(addMonths(month, delta));
    setChosenDate(null);
  }

  const monthLabel = month
    ? toLocalDate(month).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "";
  const ready = status === "ready" && today !== null;

  return (
    <>
      <PageHeader title="History" subtitle="Your recorded prayers, day by day." />

      {/* Calendar */}
      <section className={`${enter} delay-75 ${card}`}>
        <div className="mb-4 flex items-center justify-between">
          <MonthButton
            direction="previous"
            disabled={!canGoBack}
            onClick={() => changeMonth(-1)}
          />
          <h2
            className="text-lg font-semibold tracking-tight"
            aria-live="polite"
          >
            {monthLabel || (
              <span className="block h-6 w-32 animate-pulse rounded bg-stone-200" />
            )}
          </h2>
          <MonthButton
            direction="next"
            disabled={!canGoForward}
            onClick={() => changeMonth(1)}
          />
        </div>

        {status === "error" ? (
          <InlineError
            message="Couldn't load this month."
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        ) : ready ? (
          <MonthCalendar
            days={days}
            selected={selected}
            onSelect={setChosenDate}
          />
        ) : (
          <CalendarSkeleton />
        )}
      </section>

      {/* Month summary */}
      <section className={`${enter} delay-150 grid grid-cols-3 gap-3`}>
        <StatTile
          value={ready ? String(summary.recorded) : null}
          label="Prayers recorded"
          highlight
        />
        <StatTile
          value={ready ? String(summary.completeDays) : null}
          label="Complete days"
        />
        <StatTile
          value={ready ? String(summary.partialDays) : null}
          label="Partial days"
        />
      </section>

      {/* Selected day */}
      {ready && (
        <section className={`${enter} delay-200 ${card}`}>
          {selectedDay ? (
            <DayDetail day={selectedDay} entries={selectedEntries} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="grid size-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CalendarDays className="size-5" />
              </div>
              <p className="text-sm font-medium text-stone-700">
                Select a day
              </p>
              <p className="text-xs text-stone-500">
                Tap any day in the calendar to see which prayers were recorded.
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function MonthButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === "previous" ? "Previous" : "Next"} month`}
      className="grid size-10 place-items-center rounded-full text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50 active:scale-95 disabled:cursor-default disabled:text-stone-300 disabled:ring-stone-100 disabled:hover:bg-transparent disabled:active:scale-100"
    >
      <Icon className="size-5" />
    </button>
  );
}

function StatTile({
  value,
  label,
  highlight = false,
}: {
  value: string | null;
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
      {value === null ? (
        <span
          className={`mx-auto block h-7 w-8 animate-pulse rounded ${
            highlight ? "bg-white/20" : "bg-stone-200"
          }`}
        />
      ) : (
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      )}
      <p
        className={`text-xs ${highlight ? "text-emerald-100" : "text-stone-500"}`}
      >
        {label}
      </p>
    </div>
  );
}
