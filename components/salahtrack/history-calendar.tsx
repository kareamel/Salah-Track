import { CalendarX2, Check, Sparkles } from "lucide-react";
import { mondayFirstWeekday, toLocalDate } from "@/lib/local-date";
import type { PrayerHistoryEntry } from "@/lib/prayer-records";
import { PRAYERS_PER_DAY, type CalendarDay } from "@/lib/prayer-stats";
import { PRAYERS } from "@/lib/prayers";

const WEEKDAYS = [
  { short: "M", long: "Monday" },
  { short: "T", long: "Tuesday" },
  { short: "W", long: "Wednesday" },
  { short: "T", long: "Thursday" },
  { short: "F", long: "Friday" },
  { short: "S", long: "Saturday" },
  { short: "S", long: "Sunday" },
];

/* -------------------------------------------------------------------------- */
/*  Month grid                                                                */
/* -------------------------------------------------------------------------- */

export function MonthCalendar({
  days,
  selected,
  onSelect,
}: {
  days: CalendarDay[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  // Empty cells before the 1st so it lines up under the right weekday.
  const leadingBlanks = days.length > 0 ? mondayFirstWeekday(days[0].date) : 0;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-2" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span
            key={d.long}
            className="text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400"
          >
            {d.short}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden />
        ))}
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            selected={day.date === selected}
            onSelect={onSelect}
          />
        ))}
      </div>

      <Legend />
    </div>
  );
}

function DayCell({
  day,
  selected,
  onSelect,
}: {
  day: CalendarDay;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const disabled = day.isFuture;
  const muted = day.isFuture || day.beforeAccount;

  const label = toLocalDate(day.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const description = day.isFuture
    ? "upcoming"
    : `${day.count} of ${PRAYERS_PER_DAY} prayers recorded`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(day.date)}
      aria-pressed={selected}
      aria-label={`${label}${day.isToday ? " (today)" : ""}: ${description}`}
      className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
        day.status === "complete"
          ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-700/25"
          : day.status === "partial"
            ? "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-300"
            : muted
              ? "text-stone-300"
              : "text-stone-700 hover:bg-stone-100"
      } ${disabled ? "cursor-default" : "active:scale-95"} ${
        selected ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-white" : ""
      }`}
    >
      <span className={day.isToday ? "font-bold" : undefined}>
        {day.dayOfMonth}
      </span>
      {day.status === "partial" && (
        <span className="text-[9px] font-semibold leading-none text-emerald-600">
          {day.count}/{PRAYERS_PER_DAY}
        </span>
      )}
      {day.isToday && (
        <span
          aria-hidden
          className={`absolute bottom-1 size-1 rounded-full ${
            day.status === "complete" ? "bg-white" : "bg-emerald-600"
          } ${day.status === "partial" ? "hidden" : ""}`}
        />
      )}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-500">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-gradient-to-br from-emerald-500 to-emerald-700" />
        All 5 recorded
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-emerald-50 ring-1 ring-inset ring-emerald-300" />
        Some recorded
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded ring-1 ring-inset ring-stone-200" />
        None recorded
      </span>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div aria-label="Loading calendar">
      <div className="grid grid-cols-7 gap-1.5 pb-2">
        {WEEKDAYS.map((d) => (
          <span key={d.long} className="mx-auto h-3 w-3 rounded bg-stone-100" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }, (_, i) => (
          <span
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-stone-100"
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Selected day                                                              */
/* -------------------------------------------------------------------------- */

export function DayDetail({
  day,
  entries,
}: {
  day: CalendarDay;
  entries: PrayerHistoryEntry[];
}) {
  const date = toLocalDate(day.date);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const fullDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const recordedAt = new Map(entries.map((e) => [e.prayer_name, e.completed_at]));

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{day.isToday ? "Today" : weekday}</p>
          <p className="text-sm text-stone-500">
            {day.isToday ? `${weekday} ${fullDate}` : fullDate}
          </p>
        </div>
        {day.status === "complete" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
            <Sparkles className="size-3.5" />
            All 5 recorded
          </span>
        ) : day.status === "partial" ? (
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-stone-600">
            {day.count} of {PRAYERS_PER_DAY} recorded
          </span>
        ) : null}
      </div>

      {day.count === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-stone-50 px-4 py-6 text-center">
          <div className="grid size-11 place-items-center rounded-full bg-white text-stone-400 ring-1 ring-stone-200">
            <CalendarX2 className="size-5" />
          </div>
          <p className="text-sm font-medium text-stone-700">
            No prayers recorded on this day
          </p>
          <p className="max-w-[16rem] text-xs text-stone-500">
            {day.beforeAccount
              ? "This is before you started using SalahTrack."
              : day.isToday
                ? "Confirm your prayers on the Home screen and they'll appear here."
                : "Only prayers you confirm in SalahTrack are shown here."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {PRAYERS.map((prayer) => {
            const at = recordedAt.get(prayer.name);
            const Icon = prayer.icon;
            return (
              <li
                key={prayer.name}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                  at ? "bg-emerald-50/80" : "bg-stone-50"
                }`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    at ? "bg-emerald-600 text-white" : "bg-white text-stone-400 ring-1 ring-stone-200"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <p className="flex-1 font-medium">{prayer.name}</p>
                {at ? (
                  <span className="flex items-center gap-1 text-sm text-emerald-700">
                    <Check className="size-4" strokeWidth={3} />
                    {new Date(at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-sm text-stone-400">Not recorded</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
