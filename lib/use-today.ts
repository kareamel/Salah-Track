"use client";

import { useEffect, useState } from "react";

/**
 * Today's date, read in the browser (not on the server) so it always matches
 * the user's own time zone. It is `null` for a split second while the page
 * first loads, so show a placeholder until it arrives.
 */
export function useToday() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);
  return today;
}

/** Returns a copy of `date` moved back by `days` days. */
export function daysBefore(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(date.getDate() - days);
  return copy;
}
