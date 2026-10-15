// Run with: npm test

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  suggestNextUnrecorded,
  unrecordedPrayers,
} from "./prayer-suggestion.ts";

describe("suggestNextUnrecorded", () => {
  test("nothing recorded → Fajr", () => {
    assert.equal(suggestNextUnrecorded([])?.prayer, "Fajr");
  });

  test("follows Fajr → Dhuhr → Asr → Maghrib → Isha order", () => {
    assert.equal(suggestNextUnrecorded(["Fajr"])?.prayer, "Dhuhr");
    assert.equal(suggestNextUnrecorded(["Fajr", "Dhuhr"])?.prayer, "Asr");
    assert.equal(suggestNextUnrecorded(["Fajr", "Dhuhr", "Asr"])?.prayer, "Maghrib");
    assert.equal(suggestNextUnrecorded(["Fajr", "Dhuhr", "Asr", "Maghrib"])?.prayer, "Isha");
  });

  test("fills the earliest gap, whatever order prayers were recorded in", () => {
    assert.equal(suggestNextUnrecorded(["Isha", "Asr"])?.prayer, "Fajr");
    assert.equal(suggestNextUnrecorded(["Fajr", "Asr", "Isha"])?.prayer, "Dhuhr");
  });

  test("duplicates don't matter", () => {
    assert.equal(suggestNextUnrecorded(["Fajr", "Fajr"])?.prayer, "Dhuhr");
  });

  test("all five recorded → null", () => {
    assert.equal(
      suggestNextUnrecorded(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]),
      null,
    );
  });

  test("is labelled as the next unrecorded prayer, not the current prayer", () => {
    const suggestion = suggestNextUnrecorded([]);
    assert.equal(suggestion?.reason, "next-unrecorded");
    assert.equal(suggestion?.label, "Next unrecorded prayer");
    assert.doesNotMatch(suggestion?.label ?? "", /current/i);
  });
});

describe("unrecordedPrayers", () => {
  test("lists every prayer without a record, in order", () => {
    assert.deepEqual(unrecordedPrayers(["Dhuhr", "Maghrib"]), ["Fajr", "Asr", "Isha"]);
    assert.deepEqual(unrecordedPrayers([]), ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]);
    assert.deepEqual(unrecordedPrayers(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]), []);
  });
});
