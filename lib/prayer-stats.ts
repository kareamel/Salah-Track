import { addDays, daysInMonth, startOfMonth } from "./local-date.ts";
import { PRAYER_NAMES, type PrayerName } from "./prayer-names.ts";

/* -------------------------------------------------------------------------- */
/*  Prayer statistics, calculated from prayer_records rows.                  */
/*                                                                            */
/*  These are pure functions (no React, no Supabase) so they can be tested   */
/*  on their own: see lib/prayer-stats.test.ts.                              */
/*                                                                            */
/*  Wording rule: a prayer without a record is "not recorded". It is never   */
/*  treated as proof that the prayer was not performed.                      */
/* -------------------------------------------------------------------------- */

export const PRAYERS_PER_DAY = PRAYER_NAMES.length;

const VALID_NAMES = new Set<string>(PRAYER_NAMES);

/** The minimum a row needs for statistics. */
export type PrayerEntry = { prayer_date: string; prayer_name: string };

/** Local date ("YYYY-MM-DD") → the different prayers recorded that day. */
export type DayMap = Map<string, Set<PrayerName>>;

/** Groups rows by date. Duplicates and unknown prayer names are ignored. */
export function buildDayMap(entries: Iterable<PrayerEntry>): DayMap {
  const map: DayMap = new Map();
  for (const { prayer_date, prayer_name } of entries) {
    if (!VALID_NAMES.has(prayer_name)) continue;
    let prayers = map.get(prayer_date);
    if (!prayers) {
      prayers = new Set();
      map.set(prayer_date, prayers);
    }
    prayers.add(prayer_name as PrayerName);
  }
  return map;
}

/** How many different prayers were recorded on `date` (0–5). */
export function countForDay(map: DayMap, date: string) {
  return map.get(date)?.size ?? 0;
}

/** A complete day has all five different prayers recorded. */
export function isCompleteDay(map: DayMap, date: string) {
  return countForDay(map, date) === PRAYERS_PER_DAY;
}

/* ------------------------------- Streaks ---------------------------------- */

/**
 * Consecutive complete days up to now.
 *
 * - If today is complete, the streak includes today.
 * - If today is not complete yet, the streak is not broken: it is counted up
 *   to yesterday instead (today still has time left).
 * - Any earlier day that is not complete ends the streak.
 */
export function currentStreak(map: DayMap, today: string) {
  let day = isCompleteDay(map, today) ? today : addDays(today, -1);
  let streak = 0;
  while (isCompleteDay(map, day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** The longest run of consecutive complete days, up to and including today. */
export function longestStreak(map: DayMap, today: string) {
  const completeDays = [...map.keys()]
    .filter((date) => date <= today && isCompleteDay(map, date))
    .sort(); // "YYYY-MM-DD" strings sort in date order

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of completeDays) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return longest;
}

export type StreakSummary = {
  current: number;
  longest: number;
  todayComplete: boolean;
  hasAnyRecords: boolean;
};

export function streakSummary(map: DayMap, today: string): StreakSummary {
  return {
    current: currentStreak(map, today),
    longest: longestStreak(map, today),
    todayComplete: isCompleteDay(map, today),
    hasAnyRecords: [...map.values()].some((prayers) => prayers.size > 0),
  };
}

/* ------------------------------ Last 7 days ------------------------------- */

export type WeekDay = {
  date: string;
  count: number;
  isToday: boolean;
  /** False for days before the user's account existed (no records possible). */
  counted: boolean;
};

export type WeekSummary = {
  days: WeekDay[];
  recorded: number;
  /** 5 × the number of days that count (days since the account was created). */
  possible: number;
  /** Whole-number percentage of `possible`; 0 when nothing is possible. */
  percent: number;
  completeDays: number;
  /** Average prayers recorded per counted day. */
  dailyAverage: number;
};

/**
 * The last seven local calendar days, oldest first, ending with today.
 *
 * Days before `accountStart` (the user's sign-up date) don't count towards the
 * possible total, so a new user isn't shown as missing days they couldn't
 * record. Pass null if the sign-up date is unknown (all 7 days count).
 */
export function lastSevenDays(
  map: DayMap,
  today: string,
  accountStart: string | null,
): WeekSummary {
  const days: WeekDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = addDays(today, -back);
    const count = countForDay(map, date);
    days.push({
      date,
      count,
      isToday: back === 0,
      counted: accountStart === null || date >= accountStart || count > 0,
    });
  }

  const countedDays = days.filter((d) => d.counted);
  const recorded = countedDays.reduce((sum, d) => sum + d.count, 0);
  const possible = countedDays.length * PRAYERS_PER_DAY;

  return {
    days,
    recorded,
    possible,
    percent: possible > 0 ? Math.round((recorded / possible) * 100) : 0,
    completeDays: countedDays.filter((d) => d.count === PRAYERS_PER_DAY).length,
    dailyAverage: countedDays.length > 0 ? recorded / countedDays.length : 0,
  };
}

/* ---------------------------- Month calendar ------------------------------ */

export type DayStatus = "complete" | "partial" | "none";

export type CalendarDay = {
  date: string;
  dayOfMonth: number;
  count: number;
  status: DayStatus;
  isToday: boolean;
  isFuture: boolean;
  beforeAccount: boolean;
};

export function dayStatus(count: number): DayStatus {
  if (count >= PRAYERS_PER_DAY) return "complete";
  return count > 0 ? "partial" : "none";
}

/** Every day of the month containing `monthDate`, with its status. */
export function monthDays(
  map: DayMap,
  monthDate: string,
  today: string,
  accountStart: string | null,
): CalendarDay[] {
  const first = startOfMonth(monthDate);
  const total = daysInMonth(first);
  const days: CalendarDay[] = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(first, i);
    const count = countForDay(map, date);
    days.push({
      date,
      dayOfMonth: i + 1,
      count,
      status: dayStatus(count),
      isToday: date === today,
      isFuture: date > today,
      beforeAccount: accountStart !== null && date < accountStart && count === 0,
    });
  }
  return days;
}

export function monthSummary(days: CalendarDay[]) {
  return {
    recorded: days.reduce((sum, d) => sum + d.count, 0),
    completeDays: days.filter((d) => d.status === "complete").length,
    partialDays: days.filter((d) => d.status === "partial").length,
  };
}
