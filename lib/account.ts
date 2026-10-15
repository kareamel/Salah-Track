import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/*  The signed-in user's account, from Supabase Auth.                        */
/*  Only real fields are returned. Nothing is invented: if Supabase doesn't  */
/*  provide a value, it is null and the Settings page leaves it out.         */
/* -------------------------------------------------------------------------- */

export type AccountInfo = {
  email: string | null;
  emailConfirmed: boolean;
  createdAt: string | null; // ISO timestamp
  lastSignInAt: string | null; // ISO timestamp
  provider: string | null; // e.g. "email"
};

/** Loads the current user, checked with the Supabase server (not just cached). */
export async function fetchAccount(): Promise<AccountInfo> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Couldn't load your account. Please try again.");
  }
  const user = data.user;
  return {
    email: user.email ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    provider:
      typeof user.app_metadata?.provider === "string"
        ? user.app_metadata.provider
        : null,
  };
}

/**
 * Signs out using the same Supabase call as the starter's LogoutButton, then
 * does a full page load of the login screen. A full load (instead of a
 * client-side route change) clears every page and piece of data kept in
 * memory, so nothing from the signed-in session can be shown afterwards.
 */
export async function signOutAndGoToLogin() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Couldn't log out. Please try again.");
  window.location.replace("/auth/login");
}
