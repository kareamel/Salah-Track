"use client";

import { useEffect, useState } from "react";
import { toLocalDateString } from "@/lib/local-date";

/**
 * Today's date, read in the browser (not on the server) so it always matches
 * the user's own time zone. It is `null` for a split second while the page
 * first loads, so show a placeholder until it arrives.
 *
 * If the app stays open past midnight, the date updates within a minute (or as
 * soon as the user comes back to the tab).
 */
export function useToday() {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());

    function refreshIfNewDay() {
      setToday((prev) => {
        const now = new Date();
        return prev && toLocalDateString(prev) === toLocalDateString(now)
          ? prev
          : now;
      });
    }

    const timer = setInterval(refreshIfNewDay, 60_000);
    window.addEventListener("focus", refreshIfNewDay);
    document.addEventListener("visibilitychange", refreshIfNewDay);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshIfNewDay);
      document.removeEventListener("visibilitychange", refreshIfNewDay);
    };
  }, []);

  return today;
}
