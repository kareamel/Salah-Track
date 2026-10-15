import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isTagId } from "@/lib/nfc-link";

/* -------------------------------------------------------------------------- */
/*  The signed-in user's NFC tag in public.nfc_tags.                          */
/*                                                                            */
/*  `user_id` is never sent from the app: the database fills it in with      */
/*  auth.uid(), and Row Level Security only lets each user see, add and      */
/*  delete their own row. A tag id on its own grants nothing.                */
/* -------------------------------------------------------------------------- */

export type NfcTag = { id: string; created_at: string };

const TABLE = "nfc_tags";
const COLUMNS = "id, created_at";

export type NfcTagErrorKind =
  | "duplicate"
  | "not-found"
  | "auth"
  | "network"
  | "unknown";

/** An error with a friendly message that is safe to show to the user. */
export class NfcTagError extends Error {
  kind: NfcTagErrorKind;
  constructor(kind: NfcTagErrorKind, message: string) {
    super(message);
    this.name = "NfcTagError";
    this.kind = kind;
  }
}

function toFriendlyError(error: PostgrestError) {
  if (error.code === "23505") {
    return new NfcTagError(
      "duplicate",
      "You already have a registered NFC tag.",
    );
  }
  if (error.code === "42501" || error.code?.startsWith("PGRST30")) {
    return new NfcTagError(
      "auth",
      "Your session has expired. Please log in again.",
    );
  }
  if (/fetch|network/i.test(error.message)) {
    return new NfcTagError(
      "network",
      "Couldn't reach the server. Check your internet connection and try again.",
    );
  }
  return new NfcTagError("unknown", "Something went wrong. Please try again.");
}

/** The user's registered tag, or null if they haven't registered one. */
export async function fetchMyNfcTag(): Promise<NfcTag | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw toFriendlyError(error);
  return (data?.[0] as NfcTag | undefined) ?? null;
}

/** Creates the user's tag. The database generates the id (the link). */
export async function registerNfcTag(): Promise<NfcTag> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({})
    .select(COLUMNS)
    .single();
  if (error) throw toFriendlyError(error);
  return data as NfcTag;
}

/** Deletes the user's tag. Its link stops working immediately. */
export async function removeNfcTag(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw toFriendlyError(error);
  if (!data || data.length === 0) {
    throw new NfcTagError("not-found", "That tag was already removed.");
  }
}

/**
 * Checks that `tagId` is a tag registered to the signed-in user.
 * Returns false for malformed ids, removed tags and other users' tags (RLS
 * hides those, so they look exactly like tags that don't exist).
 */
export async function isMyNfcTag(tagId: string): Promise<boolean> {
  if (!isTagId(tagId)) return false;
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", tagId)
    .limit(1);
  if (error) throw toFriendlyError(error);
  return (data?.length ?? 0) > 0;
}
