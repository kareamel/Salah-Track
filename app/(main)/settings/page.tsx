"use client";

import { useEffect, useState } from "react";
import { NfcRegistration } from "@/components/salahtrack/nfc-registration";
import {
  AboutSection,
  AccountSection,
  PrayerTrackingSection,
} from "@/components/salahtrack/settings-sections";
import { PageHeader, type LoadStatus } from "@/components/salahtrack/ui";
import {
  fetchAccount,
  signOutAndGoToLogin,
  type AccountInfo,
} from "@/lib/account";

export default function SettingsPage() {
  // The signed-in user's real account details from Supabase.
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchAccount()
      .then((info) => {
        if (cancelled) return;
        setAccount(info);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // The browser's time zone, e.g. "Europe/London" (read in the browser only).
  const [timeZone, setTimeZone] = useState<string | null>(null);
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? null);
  }, []);

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function logOut() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await signOutAndGoToLogin(); // leaves the page on success
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error ? error.message : "Couldn't log out.",
      );
      setLoggingOut(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" />

      <AccountSection
        status={status}
        account={account}
        onRetry={() => setReloadKey((k) => k + 1)}
        onLogout={logOut}
        loggingOut={loggingOut}
        logoutError={logoutError}
      />
      <PrayerTrackingSection timeZone={timeZone} />
      <NfcRegistration />
      <AboutSection />
    </>
  );
}
