// Pure helpers for NFC tag links (no React, no Supabase), tested in
// lib/nfc-link.test.ts.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True if `value` looks like a tag id (a UUID). Checked before any query. */
export function isTagId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** The app path for a tag: "/scan/{id}". */
export function scanPath(tagId: string) {
  return `/scan/${tagId}`;
}

/** The full link to write to a tag, e.g. "https://example.com/scan/{id}". */
export function scanUrl(origin: string, tagId: string) {
  return `${origin.replace(/\/+$/, "")}${scanPath(tagId)}`;
}

/**
 * True when the link only works on this computer (localhost or plain http),
 * so it can't be written to a physical tag yet.
 */
export function isLocalOnlyOrigin(origin: string) {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol !== "https:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost")
    );
  } catch {
    return true;
  }
}
