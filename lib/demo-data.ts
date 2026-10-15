import type { PrayerName } from "@/lib/prayers";

/* -------------------------------------------------------------------------- */
/*  Temporary sample statistics (streak, weekly chart and History page).      */
/*  Today's prayers on the dashboard are real and come from Supabase.         */
/*  These will be replaced with real statistics in a later step.              */
/* -------------------------------------------------------------------------- */

// Prayers missed on each previous day. The first entry is yesterday,
// the second is the day before yesterday, and so on (14 days in total).
export const DEMO_MISSED_BY_DAY: PrayerName[][] = [
  [],
  [],
  [],
  [],
  [],
  ["Fajr"],
  [],
  ["Asr", "Isha"],
  [],
  [],
  ["Fajr"],
  [],
  [],
  [],
];

// Consecutive days (up to yesterday) where all 5 prayers were completed.
const firstImperfectDay = DEMO_MISSED_BY_DAY.findIndex((m) => m.length > 0);
export const DEMO_STREAK =
  firstImperfectDay === -1 ? DEMO_MISSED_BY_DAY.length : firstImperfectDay;

export const DEMO_BEST_STREAK = 21;
