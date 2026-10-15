// The five daily prayers, in order. These must match the values allowed in
// the prayer_records.prayer_name column.
export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export type PrayerName = (typeof PRAYER_NAMES)[number];
