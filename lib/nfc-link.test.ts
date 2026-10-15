// Run with: npm test

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isLocalOnlyOrigin, isTagId, scanPath, scanUrl } from "./nfc-link.ts";

const tag = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("isTagId", () => {
  test("accepts UUIDs (any letter case)", () => {
    assert.equal(isTagId(tag), true);
    assert.equal(isTagId(tag.toUpperCase()), true);
  });

  test("rejects anything else before it reaches the database", () => {
    for (const bad of [
      null,
      undefined,
      "",
      "abc",
      "not-a-uuid-at-all-0000000000000000",
      `${tag}x`,
      ` ${tag}`,
      `${tag}/extra`,
      "' or 1=1 --",
      "3f2b8c1e9a4d4e6f8b7a1c2d3e4f5a6b", // no dashes
    ]) {
      assert.equal(isTagId(bad), false, String(bad));
    }
  });
});

describe("scan links", () => {
  test("scanPath uses the /scan/{id} format", () => {
    assert.equal(scanPath(tag), `/scan/${tag}`);
  });

  test("scanUrl joins origin and path without double slashes", () => {
    assert.equal(scanUrl("http://localhost:3000", tag), `http://localhost:3000/scan/${tag}`);
    assert.equal(scanUrl("https://salahtrack.example/", tag), `https://salahtrack.example/scan/${tag}`);
  });

  test("local test links are recognised", () => {
    assert.equal(isLocalOnlyOrigin("http://localhost:3000"), true);
    assert.equal(isLocalOnlyOrigin("http://127.0.0.1:3000"), true);
    assert.equal(isLocalOnlyOrigin("http://192.168.1.24:3000"), true); // not https
    assert.equal(isLocalOnlyOrigin("https://app.localhost"), true);
    assert.equal(isLocalOnlyOrigin("https://salahtrack.example"), false);
  });
});
