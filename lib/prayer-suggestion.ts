import { PRAYER_NAMES, type PrayerName } from "./prayer-names.ts";

/* -------------------------------------------------------------------------- */
/*  Which prayer to suggest on the NFC check-in screen.                      */
/*                                                                            */
/*  For now this is deliberately NOT time-based: SalahTrack's prayer times   */
/*  are still sample data, so using them could suggest the wrong prayer.     */
/*  Instead it suggests the next unrecorded prayer in the daily order.       */
/*                                                                            */
/*  To switch to real prayer times later, add a new strategy here and keep   */
/*  the same return shape. The page only reads `prayer` and `label`.         */
/* -------------------------------------------------------------------------- */

export type SuggestionReason = "next-unrecorded";

export type PrayerSuggestion = {
  prayer: PrayerName;
  reason: SuggestionReason;
  /** Shown to the user above the suggested prayer. */
  label: string;
};

export const SUGGESTION_LABELS: Record<SuggestionReason, string> = {
  "next-unrecorded": "Next unrecorded prayer",
};

/**
 * The first prayer in Fajr → Dhuhr → Asr → Maghrib → Isha order that has no
 * record today, or null when all five are recorded.
 */
export function suggestNextUnrecorded(
  recorded: Iterable<PrayerName>,
): PrayerSuggestion | null {
  const done = new Set(recorded);
  const prayer = PRAYER_NAMES.find((name) => !done.has(name));
  if (!prayer) return null;
  return {
    prayer,
    reason: "next-unrecorded",
    label: SUGGESTION_LABELS["next-unrecorded"],
  };
}

/** Prayers without a record today, in daily order (for "Choose another"). */
export function unrecordedPrayers(recorded: Iterable<PrayerName>): PrayerName[] {
  const done = new Set(recorded);
  return PRAYER_NAMES.filter((name) => !done.has(name));
}
