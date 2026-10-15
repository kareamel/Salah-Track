// Run with: npm test
// Uses Node's built-in test runner (no extra libraries).

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  addDays,
  addMonths,
  daysInMonth,
  endOfMonth,
  mondayFirstWeekday,
  startOfMonth,
  toLocalDateString,
} from "./local-date.ts";
import { PRAYER_NAMES } from "./prayer-names.ts";
import {
  buildDayMap,
  currentStreak,
  dayStatus,
  isCompleteDay,
  lastSevenDays,
  longestStreak,
  monthDays,
  monthSummary,
  streakSummary,
  type PrayerEntry,
} from "./prayer-stats.ts";

/* --------------------------------- Helpers -------------------------------- */

/** All five prayers on `date`. */
function fullDay(date: string): PrayerEntry[] {
  return PRAYER_NAMES.map((prayer_name) => ({ prayer_date: date, prayer_name }));
}

/** The first `count` prayers on `date`. */
function partialDay(date: string, count: number): PrayerEntry[] {
  return fullDay(date).slice(0, count);
}

/** Full days for every date from `from` to `to` (inclusive). */
function fullDays(from: string, to: string): PrayerEntry[] {
  const entries: PrayerEntry[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) entries.push(...fullDay(d));
  return entries;
}

function map(...groups: PrayerEntry[][]) {
  return buildDayMap(groups.flat());
}

/** Runs `fn` with the process time zone set to `tz`, then restores it. */
function inTimeZone(tz: string, fn: () => void) {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

/* ------------------------------ Date helpers ------------------------------ */

describe("local dates", () => {
  test("toLocalDateString uses the local calendar day around midnight", () => {
    for (const tz of [
      "Europe/London",
      "Asia/Riyadh",
      "America/New_York",
      "Australia/Sydney",
      "Pacific/Kiritimati", // UTC+14
      "Pacific/Pago_Pago", // UTC-11
    ]) {
      inTimeZone(tz, () => {
        assert.equal(toLocalDateString(new Date(2026, 9, 15, 0, 0, 0)), "2026-10-15", tz);
        assert.equal(toLocalDateString(new Date(2026, 9, 15, 0, 30)), "2026-10-15", tz);
        assert.equal(toLocalDateString(new Date(2026, 9, 15, 23, 59, 59)), "2026-10-15", tz);
        assert.equal(toLocalDateString(new Date(2026, 9, 16, 0, 0, 0)), "2026-10-16", tz);
        assert.equal(toLocalDateString(new Date(2026, 0, 1, 0, 5)), "2026-01-01", tz);
        assert.equal(toLocalDateString(new Date(2025, 11, 31, 23, 55)), "2025-12-31", tz);
      });
    }
  });

  test("the time-zone switch really applies (toISOString gets these wrong)", () => {
    inTimeZone("Asia/Riyadh", () => {
      const justAfterMidnight = new Date(2026, 9, 15, 0, 30);
      assert.equal(justAfterMidnight.toISOString().slice(0, 10), "2026-10-14");
      assert.equal(toLocalDateString(justAfterMidnight), "2026-10-15");
    });
    inTimeZone("America/New_York", () => {
      const lateEvening = new Date(2026, 9, 15, 23, 45);
      assert.equal(lateEvening.toISOString().slice(0, 10), "2026-10-16");
      assert.equal(toLocalDateString(lateEvening), "2026-10-15");
    });
  });

  test("addDays crosses month, year and leap-day boundaries", () => {
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-10-01", -1), "2026-09-30");
    assert.equal(addDays("2025-12-31", 1), "2026-01-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2026-02-28", 1), "2026-03-01"); // not a leap year
    assert.equal(addDays("2028-02-28", 1), "2028-02-29"); // leap year
    assert.equal(addDays("2028-02-29", 1), "2028-03-01");
    assert.equal(addDays("2026-10-15", -6), "2026-10-09");
  });

  test("addDays is not affected by summer-time changes", () => {
    for (const tz of ["Europe/London", "America/New_York", "Australia/Sydney"]) {
      inTimeZone(tz, () => {
        assert.equal(addDays("2026-03-28", 1), "2026-03-29", tz); // EU clocks forward
        assert.equal(addDays("2026-03-29", 1), "2026-03-30", tz);
        assert.equal(addDays("2026-10-25", 1), "2026-10-26", tz); // EU clocks back
        assert.equal(addDays("2026-11-01", -1), "2026-10-31", tz); // US clocks back
        assert.equal(addDays("2026-04-05", 1), "2026-04-06", tz); // AU clocks back
      });
    }
  });

  test("month helpers", () => {
    assert.equal(startOfMonth("2026-10-15"), "2026-10-01");
    assert.equal(endOfMonth("2026-02-10"), "2026-02-28");
    assert.equal(endOfMonth("2028-02-10"), "2028-02-29");
    assert.equal(daysInMonth("2026-04-01"), 30);
    assert.equal(daysInMonth("2026-12-01"), 31);
    assert.equal(addMonths("2026-01-31", -1), "2025-12-01");
    assert.equal(addMonths("2026-12-15", 1), "2027-01-01");
    assert.equal(mondayFirstWeekday("2026-10-12"), 0); // Monday
    assert.equal(mondayFirstWeekday("2026-10-18"), 6); // Sunday
  });
});

/* ------------------------------- Day map ---------------------------------- */

describe("buildDayMap", () => {
  test("duplicate prayers on the same day count once", () => {
    const m = map(
      fullDay("2026-10-14"),
      [{ prayer_date: "2026-10-14", prayer_name: "Fajr" }],
    );
    assert.equal(m.get("2026-10-14")?.size, 5);
  });

  test("five records that include a duplicate are not a complete day", () => {
    const m = map([
      { prayer_date: "2026-10-14", prayer_name: "Fajr" },
      { prayer_date: "2026-10-14", prayer_name: "Fajr" },
      { prayer_date: "2026-10-14", prayer_name: "Dhuhr" },
      { prayer_date: "2026-10-14", prayer_name: "Asr" },
      { prayer_date: "2026-10-14", prayer_name: "Maghrib" },
    ]);
    assert.equal(isCompleteDay(m, "2026-10-14"), false);
  });

  test("unknown prayer names are ignored", () => {
    const m = map(partialDay("2026-10-14", 4), [
      { prayer_date: "2026-10-14", prayer_name: "Tahajjud" },
    ]);
    assert.equal(isCompleteDay(m, "2026-10-14"), false);
  });
});

/* ------------------------------- Streaks ---------------------------------- */

describe("currentStreak", () => {
  const today = "2026-10-15";

  test("no records → 0", () => {
    assert.equal(currentStreak(map(), today), 0);
    assert.deepEqual(streakSummary(map(), today), {
      current: 0,
      longest: 0,
      todayComplete: false,
      hasAnyRecords: false,
    });
  });

  test("complete today counts today", () => {
    assert.equal(currentStreak(map(fullDays("2026-10-13", "2026-10-15")), today), 3);
  });

  test("only today complete → 1", () => {
    assert.equal(currentStreak(map(fullDay(today)), today), 1);
  });

  test("incomplete today does not break the streak (counts to yesterday)", () => {
    const m = map(fullDays("2026-10-11", "2026-10-14"), partialDay(today, 2));
    assert.equal(currentStreak(m, today), 4);
  });

  test("nothing recorded yet today still keeps yesterday's streak", () => {
    assert.equal(currentStreak(map(fullDays("2026-10-11", "2026-10-14")), today), 4);
  });

  test("an incomplete yesterday breaks the streak", () => {
    const m = map(fullDays("2026-10-10", "2026-10-13"), partialDay("2026-10-14", 4));
    assert.equal(currentStreak(m, today), 0);
  });

  test("an unrecorded day in the middle ends the streak", () => {
    const m = map(fullDays("2026-10-01", "2026-10-10"), fullDays("2026-10-12", "2026-10-14"));
    assert.equal(currentStreak(m, today), 3);
  });

  test("an incomplete earlier day ends the streak", () => {
    const m = map(
      fullDays("2026-10-08", "2026-10-11"),
      partialDay("2026-10-12", 3),
      fullDays("2026-10-13", "2026-10-15"),
    );
    assert.equal(currentStreak(m, today), 3);
  });

  test("streak continues across a month boundary", () => {
    const m = map(fullDays("2026-09-28", "2026-10-02"));
    assert.equal(currentStreak(m, "2026-10-02"), 5);
  });

  test("streak continues across a year boundary", () => {
    const m = map(fullDays("2025-12-30", "2026-01-02"));
    assert.equal(currentStreak(m, "2026-01-02"), 4);
  });

  test("streak continues over a leap day", () => {
    const m = map(fullDays("2028-02-27", "2028-03-01"));
    assert.equal(currentStreak(m, "2028-03-01"), 4);
  });

  test("streak continues over summer-time changes", () => {
    inTimeZone("Europe/London", () => {
      const m = map(fullDays("2026-10-23", "2026-10-27"));
      assert.equal(currentStreak(m, "2026-10-27"), 5);
    });
  });

  test("after midnight: yesterday's incomplete day now breaks the streak", () => {
    // At 23:59 on the 15th, the 15th is "today" and still in progress.
    const m = map(fullDays("2026-10-12", "2026-10-14"), partialDay("2026-10-15", 3));
    assert.equal(currentStreak(m, "2026-10-15"), 3);
    // One minute later it is the 16th: the 15th has ended incomplete.
    assert.equal(currentStreak(m, "2026-10-16"), 0);
  });

  test("after midnight: a completed yesterday keeps the streak going", () => {
    const m = map(fullDays("2026-10-12", "2026-10-15"));
    assert.equal(currentStreak(m, "2026-10-15"), 4);
    assert.equal(currentStreak(m, "2026-10-16"), 4); // the 16th has just begun
  });

  test("records dated in the future don't extend the streak", () => {
    const m = map(fullDays("2026-10-14", "2026-10-17"));
    assert.equal(currentStreak(m, today), 2);
  });
});

describe("longestStreak", () => {
  const today = "2026-10-15";

  test("no records → 0", () => {
    assert.equal(longestStreak(map(), today), 0);
  });

  test("finds the longest run in older history", () => {
    const m = map(
      fullDays("2026-01-01", "2026-01-21"), // 21 days
      fullDays("2026-03-01", "2026-03-05"), // 5 days
      fullDays("2026-10-13", "2026-10-15"), // current: 3 days
    );
    assert.equal(longestStreak(m, today), 21);
    assert.equal(currentStreak(m, today), 3);
  });

  test("a partial day splits a run", () => {
    const m = map(
      fullDays("2026-05-01", "2026-05-04"),
      partialDay("2026-05-05", 4),
      fullDays("2026-05-06", "2026-05-08"),
    );
    assert.equal(longestStreak(m, today), 4);
  });

  test("runs across month and year boundaries count as one", () => {
    assert.equal(longestStreak(map(fullDays("2025-12-25", "2026-01-05")), today), 12);
    assert.equal(longestStreak(map(fullDays("2026-02-20", "2026-03-10")), today), 19);
  });

  test("is never shorter than the current streak", () => {
    const m = map(fullDays("2026-10-01", "2026-10-15"));
    assert.equal(longestStreak(m, today), 15);
    assert.equal(currentStreak(m, today), 15);
  });

  test("ignores future-dated records", () => {
    assert.equal(longestStreak(map(fullDays("2026-10-14", "2026-10-20")), today), 2);
  });
});

/* ------------------------------ Last 7 days ------------------------------- */

describe("lastSevenDays", () => {
  const today = "2026-10-15";

  test("covers the last seven local days ending today", () => {
    const week = lastSevenDays(map(), today, null);
    assert.deepEqual(
      week.days.map((d) => d.date),
      ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"],
    );
    assert.equal(week.days[6].isToday, true);
  });

  test("empty week → zeros", () => {
    const week = lastSevenDays(map(), today, null);
    assert.equal(week.recorded, 0);
    assert.equal(week.possible, 35);
    assert.equal(week.percent, 0);
    assert.equal(week.completeDays, 0);
  });

  test("counts recorded prayers per day out of five", () => {
    const m = map(fullDay("2026-10-13"), partialDay("2026-10-14", 3), partialDay(today, 2));
    const week = lastSevenDays(m, today, null);
    assert.deepEqual(week.days.map((d) => d.count), [0, 0, 0, 0, 5, 3, 2]);
    assert.equal(week.recorded, 10);
    assert.equal(week.percent, Math.round((10 / 35) * 100));
    assert.equal(week.completeDays, 1);
  });

  test("duplicates are not counted twice", () => {
    const m = map(fullDay(today), fullDay(today));
    assert.equal(lastSevenDays(m, today, null).recorded, 5);
  });

  test("days before sign-up don't count towards possible prayers", () => {
    const m = map(fullDay("2026-10-14"), partialDay(today, 3));
    const week = lastSevenDays(m, today, "2026-10-14");
    assert.equal(week.possible, 10); // 2 days × 5
    assert.equal(week.recorded, 8);
    assert.equal(week.percent, 80);
    assert.equal(week.dailyAverage, 4);
    assert.deepEqual(week.days.map((d) => d.counted), [false, false, false, false, false, true, true]);
  });

  test("works across a month boundary", () => {
    const week = lastSevenDays(map(fullDays("2026-09-28", "2026-10-02")), "2026-10-02", null);
    assert.equal(week.days[0].date, "2026-09-26");
    assert.equal(week.completeDays, 5);
  });

  test("records outside the window are ignored", () => {
    const m = map(fullDay("2026-10-08"), fullDay("2026-10-16"));
    assert.equal(lastSevenDays(m, today, null).recorded, 0);
  });
});

/* ---------------------------- Month calendar ------------------------------ */

describe("monthDays", () => {
  test("returns every day of the month with its status", () => {
    const m = map(fullDay("2026-02-03"), partialDay("2026-02-04", 2));
    const days = monthDays(m, "2026-02-15", "2026-10-15", null);
    assert.equal(days.length, 28);
    assert.equal(days[0].date, "2026-02-01");
    assert.equal(days[2].status, "complete");
    assert.equal(days[3].status, "partial");
    assert.equal(days[4].status, "none");
    assert.deepEqual(monthSummary(days), { recorded: 7, completeDays: 1, partialDays: 1 });
  });

  test("leap-year February has 29 days", () => {
    assert.equal(monthDays(map(), "2028-02-01", "2028-12-01", null).length, 29);
  });

  test("marks today, future days and days before sign-up", () => {
    const days = monthDays(map(), "2026-10-01", "2026-10-15", "2026-10-05");
    assert.equal(days[3].beforeAccount, true); // 4 Oct
    assert.equal(days[4].beforeAccount, false); // 5 Oct
    assert.equal(days[14].isToday, true); // 15 Oct
    assert.equal(days[15].isFuture, true); // 16 Oct
  });

  test("dayStatus thresholds", () => {
    assert.equal(dayStatus(0), "none");
    assert.equal(dayStatus(1), "partial");
    assert.equal(dayStatus(4), "partial");
    assert.equal(dayStatus(5), "complete");
  });
});
