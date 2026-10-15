import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

function errorPage(message: string) {
  return `/auth/error?error=${encodeURIComponent(message)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), origin);

  // Link from an email template that uses {{ .TokenHash }}.
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    redirect(error ? errorPage(error.message) : next);
  }

  // Link from Supabase's default email template ({{ .ConfirmationURL }}),
  // which sends the user back here with a one-time ?code=.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    redirect(error ? errorPage(error.message) : next);
  }

  redirect(errorPage("No token hash or code"));
}
