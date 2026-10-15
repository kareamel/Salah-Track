"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useParams } from "next/navigation";
import {
  AllRecordedCard,
  CheckInSuccess,
  ChooseAnotherPrayer,
  DayProgress,
  QuickConfirmCard,
  TagCheckingSkeleton,
  TagNotFound,
  TagVerifiedBadge,
  type CheckInError,
} from "@/components/salahtrack/check-in";
import { LoadErrorCard } from "@/components/salahtrack/prayer-checklist";
import { InlineError } from "@/components/salahtrack/ui";
import { toLocalDateString } from "@/lib/local-date";
import { scanPath } from "@/lib/nfc-link";
import { isMyNfcTag, NfcTagError } from "@/lib/nfc-tags";
import {
  suggestNextUnrecorded,
  unrecordedPrayers,
} from "@/lib/prayer-suggestion";
import { PRAYERS, type PrayerName } from "@/lib/prayers";
import { useToday } from "@/lib/use-today";
import { useTodayPrayers } from "@/lib/use-today-prayers";

type TagStatus = "checking" | "valid" | "not-found" | "auth" | "error";

const PRAYER_BY_NAME = Object.fromEntries(PRAYERS.map((p) => [p.name, p])) as Record<
  PrayerName,
  (typeof PRAYERS)[number]
>;

/**
 * NFC quick check-in. A physical tag holds this page's URL.
 *
 * - Logged-out visitors are sent to login by the server proxy and brought
 *   back here afterwards. The tag id never bypasses login.
 * - The tag must belong to the signed-in user (RLS hides other users' tags).
 * - Nothing is saved when the page opens. One prayer is suggested (the next
 *   unrecorded one, see lib/prayer-suggestion.ts) and the big "Yes, I
 *   prayed" button is the explicit confirmation that saves it.
 */
export function ScanCheckIn() {
  const { id } = useParams<{ id: string }>();
  const now = useToday();
  const prayerDate = now ? toLocalDateString(now) : null;

  // Check the tag belongs to this account (and wasn't removed).
  const [tagStatus, setTagStatus] = useState<TagStatus>("checking");
  const [tagReloadKey, setTagReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTagStatus("checking");
    isMyNfcTag(id)
      .then((mine) => {
        if (!cancelled) setTagStatus(mine ? "valid" : "not-found");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTagStatus(
          error instanceof NfcTagError && error.kind === "auth"
            ? "auth"
            : "error",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, tagReloadKey]);

  // Today's records load at the same time as the tag check (they're the
  // user's own rows either way), so the screen appears as fast as possible.
  // They're only shown once the tag is verified.
  const today = useTodayPrayers(prayerDate, { allowUndo: false });
  const { records, status } = today;
  const recorded = new Set(Object.keys(records) as PrayerName[]);

  // What to show in the big card: the prayer the user picked with "Choose
  // another prayer" (if still unrecorded), otherwise the suggestion.
  const suggestion = suggestNextUnrecorded(recorded);
  const [chosen, setChosen] = useState<PrayerName | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState<CheckInError | null>(null);
  const [justRecorded, setJustRecorded] = useState<PrayerName | null>(null);

  const target =
    chosen && !recorded.has(chosen) ? chosen : (suggestion?.prayer ?? null);
  const targetLabel =
    target && target !== suggestion?.prayer
      ? "Selected prayer"
      : (suggestion?.label ?? "");
  const otherOptions = unrecordedPrayers(recorded)
    .filter((name) => name !== target)
    .map((name) => PRAYER_BY_NAME[name]);

  // The button press itself is the confirmation; no second popup.
  async function confirm() {
    if (!target) return;
    setError(null);
    const result = await today.recordPrayer(PRAYER_BY_NAME[target]);
    if (result.ok) {
      setJustRecorded(result.prayer);
      setChosen(null);
      setChoosing(false);
    } else {
      setError({ kind: result.kind, message: result.message });
    }
  }

  function choose(name: PrayerName) {
    setChosen(name);
    setChoosing(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recordAnother() {
    setJustRecorded(null);
    setError(null);
  }

  const dateLabel = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const loginHref = `/auth/login?next=${encodeURIComponent(scanPath(id))}`;

  if (tagStatus === "not-found") return <TagNotFound />;

  if (tagStatus === "auth") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200/70">
        <p className="text-sm text-stone-600">
          Your session has expired. Please log in again to record your prayer.
        </p>
        <Link
          href={loginHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-700"
        >
          <LogIn className="size-4" />
          Log in again
        </Link>
      </div>
    );
  }

  if (tagStatus === "error") {
    return (
      <InlineError
        message="Couldn't check your NFC tag."
        onRetry={() => setTagReloadKey((k) => k + 1)}
      />
    );
  }

  if (tagStatus === "checking" || status === "loading") {
    return (
      <>
        <CheckInHeader dateLabel={dateLabel} verified={false} />
        <TagCheckingSkeleton />
      </>
    );
  }

  return (
    <>
      <CheckInHeader dateLabel={dateLabel} verified />

      {status === "error" ? (
        <LoadErrorCard message={today.loadError} onRetry={today.reload} />
      ) : justRecorded ? (
        <CheckInSuccess
          prayerName={justRecorded}
          completed={recorded.size}
          canRecordAnother={recorded.size < PRAYERS.length}
          onRecordAnother={recordAnother}
        />
      ) : target ? (
        <>
          <QuickConfirmCard
            prayer={PRAYER_BY_NAME[target]}
            label={targetLabel}
            saving={today.recordingPrayer !== null}
            error={error}
            loginHref={loginHref}
            onConfirm={confirm}
          />
          <ChooseAnotherPrayer
            options={otherOptions}
            open={choosing}
            onToggle={() => setChoosing((open) => !open)}
            onChoose={choose}
            disabled={today.recordingPrayer !== null}
          />
        </>
      ) : (
        <AllRecordedCard />
      )}

      {status === "ready" && <DayProgress recorded={recorded} />}

      {!justRecorded && target && (
        <Link
          href="/dashboard"
          className="mx-auto inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Open dashboard
        </Link>
      )}
    </>
  );
}

export function CheckInHeader({
  dateLabel,
  verified,
}: {
  dateLabel: string | undefined;
  verified: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight">
          Salah<span className="text-emerald-600">Track</span>
        </p>
        <p className="h-5 truncate text-sm text-stone-500">{dateLabel}</p>
      </div>
      {verified && <TagVerifiedBadge />}
    </header>
  );
}
