import {
  CloudSun,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";

import type { PrayerName } from "@/lib/prayer-names";

export type { PrayerName };

// The five daily prayers with display details.
export type Prayer = {
  name: PrayerName;
  arabic: string;
  // Sample time only. Real prayer times (based on location) come later.
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
