import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toLocalDateString } from "@/lib/local-date";
import type { PrayerName } from "@/lib/prayer-names";

/* -------------------------------------------------------------------------- */
/*  Reading and writing the signed-in user's rows in public.prayer_records.  */
/*                                                                            */
/*  Row Level Security in Supabase makes sure each user can only see, add    */
/*  and delete their own records. `user_id` is filled in automatically by    */
/*  the database (default auth.uid()), so the app never sends it.            */
/* -------------------------------------------------------------------------- */

export type PrayerRecord = {
  id: string;
  prayer_date: string; // "YYYY-MM-DD", the user's local calendar date
  prayer_name: PrayerName;
  completed_at: string;
};

const TABLE = "prayer_records";
const COLUMNS = "id, prayer_date, prayer_name, completed_at";

export type PrayerRecordErrorKind =
  | "duplicate" // already recorded (unique rule: one per user, prayer and date)
  | "not-found" // nothing to undo (already removed, e.g. in another tab)
  | "auth" // not signed in, or the session has expired
  | "network" // could not reach Supabase
  | "unknown";

/** An error with a friendly message that is safe to show to the user. */
export class PrayerRecordError extends Error {
  constructor(
    public kind: PrayerRecordErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "PrayerRecordError";
  }
}

function toFriendlyError(
  error: PostgrestError,
  action: "load" | "save" | "remove",
) {
  // 23505 = unique_violation in PostgreSQL.
  if (error.code === "23505") {
    return new PrayerRecordError(
      "duplicate",
      "This prayer is already recorded for today.",
    );
  }
  // 42501 = permission denied / row level security; PGRST30x = JWT problems.
  if (error.code === "42501" || error.code?.startsWith("PGRST30")) {
    return new PrayerRecordError(
      "auth",
      "Your session has expired. Please log in again.",
    );
  }
  if (/fetch|network/i.test(error.message)) {
    return new PrayerRecordError(
      "network",
      "Couldn't reach the server. Check your internet connection and try again.",
    );
  }
  const verb = { load: "loading", save: "saving", remove: "removing" }[action];
  return new PrayerRecordError(
    "unknown",
    `Something went wrong while ${verb} your prayer. Please try again.`,
  );
}

/** All of the user's records for one local date. */
export async function fetchPrayerRecords(prayerDate: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("prayer_date", prayerDate);

  if (error) throw toFriendlyError(error, "load");
  return data as PrayerRecord[];
}

/** Records a prayer as completed. Resolves only after the database saved it. */
export async function addPrayerRecord(
  prayerDate: string,
  prayerName: PrayerName,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ prayer_date: prayerDate, prayer_name: prayerName })
    .select(COLUMNS)
    .single();

  if (error) throw toFriendlyError(error, "save");
  return data as PrayerRecord;
}

/* -------------------------------------------------------------------------- */
/*  History (for statistics and the History page)                            */
/* -------------------------------------------------------------------------- */

export type PrayerHistoryEntry = {
  prayer_date: string;
  prayer_name: PrayerName;
  completed_at: string;
};

// Supabase returns at most 1,000 rows per request by default (the project can
// set a lower limit). We keep asking for the next page until an empty page
// comes back, so statistics are never silently based on part of the history.
const PAGE_SIZE = 1000;

/**
 * The user's records, oldest first. Pass `range` to limit it to some dates
 * (e.g. one month); leave it out to get the full history (for all-time
 * statistics like the longest streak).
 */
export async function fetchPrayerHistory(range?: {
  from: string;
  to: string;
}): Promise<PrayerHistoryEntry[]> {
  const supabase = createClient();
  const entries: PrayerHistoryEntry[] = [];

  for (;;) {
    let query = supabase
      .from(TABLE)
      .select("prayer_date, prayer_name, completed_at")
      .order("prayer_date", { ascending: true })
      .order("id", { ascending: true }); // stable order between pages
    if (range) {
      query = query.gte("prayer_date", range.from).lte("prayer_date", range.to);
    }

    const { data, error } = await query.range(
      entries.length,
      entries.length + PAGE_SIZE - 1,
    );
    if (error) throw toFriendlyError(error, "load");
    if (!data || data.length === 0) break;
    entries.push(...(data as PrayerHistoryEntry[]));
  }

  return entries;
}

/**
 * The local date the user's account was created, or null if unknown. Days
 * before this can't have records, so they don't count as "possible" prayers.
 */
export async function fetchAccountStartDate(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.created_at) return null;
  return toLocalDateString(new Date(data.user.created_at));
}

/** Deletes one of the user's records (used to undo a mistake). */
export async function deletePrayerRecord(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw toFriendlyError(error, "remove");
  if (!data || data.length === 0) {
    throw new PrayerRecordError(
      "not-found",
      "That record was already removed.",
    );
  }
}
