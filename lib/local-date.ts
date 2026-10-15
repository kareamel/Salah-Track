/* -------------------------------------------------------------------------- */
/*  Calendar-date helpers.                                                    */
/*                                                                            */
/*  Dates are plain "YYYY-MM-DD" strings for the user's LOCAL calendar day,  */
/*  the same format as prayer_records.prayer_date. Day arithmetic is done in */
/*  UTC on purpose: it never shifts because of time zones or summer-time     */
/*  changes. Only toLocalDateString() looks at the user's time zone.         */
/* -------------------------------------------------------------------------- */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function format(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parse(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
}

/**
 * The user's local calendar date as "YYYY-MM-DD".
 *
 * Deliberately avoids `date.toISOString()`, which converts to UTC and can give
 * yesterday's or tomorrow's date for users near midnight.
 */
export function toLocalDateString(date: Date) {
  return format(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** "2026-10-31" + 1 → "2026-11-01". Works across months, years and leap days. */
export function addDays(date: string, days: number) {
  const [year, month, day] = parse(date);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return format(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  );
}

/** "2026-10-15" → "2026-10-01" */
export function startOfMonth(date: string) {
  const [year, month] = parse(date);
  return format(year, month, 1);
}

/** "2026-10-01" + 1 → "2026-11-01" (any day of the month is accepted). */
export function addMonths(date: string, months: number) {
  const [year, month] = parse(date);
  const result = new Date(Date.UTC(year, month - 1 + months, 1));
  return format(result.getUTCFullYear(), result.getUTCMonth() + 1, 1);
}

/** Number of days in the month containing `date` (handles leap years). */
export function daysInMonth(date: string) {
  const [year, month] = parse(date);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "2026-02-10" → "2026-02-28" */
export function endOfMonth(date: string) {
  const [year, month] = parse(date);
  return format(year, month, daysInMonth(date));
}

/** Day of the week with Monday = 0 … Sunday = 6. */
export function mondayFirstWeekday(date: string) {
  const [year, month, day] = parse(date);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** A Date at local midnight, for display with toLocaleDateString(). */
export function toLocalDate(date: string) {
  const [year, month, day] = parse(date);
  return new Date(year, month - 1, day);
}
