// Run with: npm test

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "./safe-redirect.ts";

const origin = "http://localhost:3000";
const tag = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("safeNextPath", () => {
  test("no value → dashboard", () => {
    assert.equal(safeNextPath(null, origin), DEFAULT_AFTER_LOGIN);
    assert.equal(safeNextPath(undefined, origin), DEFAULT_AFTER_LOGIN);
    assert.equal(safeNextPath("", origin), DEFAULT_AFTER_LOGIN);
  });

  test("pages inside the app are kept, including the NFC scan URL", () => {
    assert.equal(safeNextPath(`/scan/${tag}`, origin), `/scan/${tag}`);
    assert.equal(safeNextPath("/history?x=1#top", origin), "/history?x=1#top");
    assert.equal(safeNextPath("/auth/update-password", origin), "/auth/update-password");
  });

  test("anything leaving the site falls back to the dashboard", () => {
    const backslash = String.fromCharCode(92);
    for (const evil of [
      "https://evil.example",
      "http://evil.example/scan/x",
      "//evil.example",
      "/" + backslash + "evil.example",
      backslash + backslash + "evil.example",
      "/\t/evil.example",
      "javascript:alert(1)",
      "http://localhost:3000.evil.example/",
      "https://localhost:3000/", // different scheme = different origin
      "http://[bad",
    ]) {
      assert.equal(safeNextPath(evil, origin), DEFAULT_AFTER_LOGIN, evil);
    }
  });

  test("works with a production origin", () => {
    const prod = "https://salahtrack.example";
    assert.equal(safeNextPath(`/scan/${tag}`, prod), `/scan/${tag}`);
    assert.equal(safeNextPath("https://evil.example", prod), DEFAULT_AFTER_LOGIN);
  });
});
