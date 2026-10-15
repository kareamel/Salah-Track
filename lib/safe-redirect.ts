// Where to send the user after logging in (or confirming their email).

export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * Returns `next` only if it points to a page inside this app (e.g.
 * "/scan/abc" or "/history?x=1"). Anything that would leave the site, such
 * as "https://evil.example", "//evil.example" or "/\evil.example", falls back
 * to the dashboard. This stops "open redirect" tricks.
 */
export function safeNextPath(next: string | null | undefined, origin: string) {
  if (!next) return DEFAULT_AFTER_LOGIN;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return DEFAULT_AFTER_LOGIN;
    return url.pathname + url.search + url.hash;
  } catch {
    return DEFAULT_AFTER_LOGIN;
  }
}
