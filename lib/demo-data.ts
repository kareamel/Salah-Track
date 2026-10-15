import {
  CloudSun,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Temporary demonstration data, shared by every SalahTrack page.            */
/*  (This will be replaced with real data from Supabase in a later step.)     */
/* -------------------------------------------------------------------------- */

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export type Prayer = {
  name: PrayerName;
  arabic: string;
  time: string;
  icon: LucideIcon;
};

export const PRAYERS: Prayer[] = [
  { name: "Fajr", arabic: "الفجر", time: "05:12", icon: Sunrise },
  { name: "Dhuhr", arabic: "الظهر", time: "12:48", icon: Sun },
  { name: "Asr", arabic: "العصر", time: "16:05", icon: CloudSun },
  { name: "Maghrib", arabic: "المغرب", time: "18:31", icon: Sunset },
  { name: "Isha", arabic: "العشاء", time: "19:52", icon: Moon },
];

export const TOTAL_PRAYERS = PRAYERS.length;

// Which prayers start as "already confirmed" today when the page loads.
export const DEMO_TODAY_COMPLETED: Record<PrayerName, boolean> = {
  Fajr: true,
  Dhuhr: true,
  Asr: false,
  Maghrib: false,
  Isha: false,
};

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
