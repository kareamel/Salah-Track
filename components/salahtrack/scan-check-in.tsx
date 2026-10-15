"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckInProgress,
  RecordedBanner,
  TagCheckingSkeleton,
  TagNotFound,
  TagVerifiedBadge,
} from "@/components/salahtrack/check-in";
import {
  LoadErrorCard,
  PrayerConfirmDialog,
  PrayerListSkeleton,
  PrayerRow,
} from "@/components/salahtrack/prayer-checklist";
import { ToastMessage } from "@/components/salahtrack/toast";
import { enter, InlineError, PageHeader } from "@/components/salahtrack/ui";
import { toLocalDateString } from "@/lib/local-date";
import { isMyNfcTag } from "@/lib/nfc-tags";
import { PRAYERS, TOTAL_PRAYERS } from "@/lib/prayers";
import { useToday } from "@/lib/use-today";
import { useTodayPrayers } from "@/lib/use-today-prayers";

type TagStatus = "checking" | "valid" | "not-found" | "error";

/**
 * NFC check-in page. A physical tag will hold this URL.
 *
 * - The server proxy sends logged-out visitors to login first, and the login
 *   page brings them back here afterwards. The tag id never bypasses login.
 * - The tag must belong to the signed-in user (Row Level Security hides
 *   everyone else's tags, so they look like they don't exist).
 * - Nothing is recorded automatically and no prayer is suggested: the user
 *   picks a prayer and confirms it, using the same saving logic as Home.
 */
export function ScanCheckIn() {
  const { id } = useParams<{ id: string }>();
  const now = useToday();
  const prayerDate = now ? toLocalDateString(now) : null;

  // 1–2. Check the tag belongs to this account (and wasn't removed).
  const [tagStatus, setTagStatus] = useState<TagStatus>("checking");
  const [tagReloadKey, setTagReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setTagStatus("checking");
    isMyNfcTag(id)
      .then((mine) => {
        if (!cancelled) setTagStatus(mine ? "valid" : "not-found");
      })
      .catch(() => {
        if (!cancelled) setTagStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, tagReloadKey]);

  // 4–10. Today's prayers: only loaded once the tag is verified. Completed
  // prayers can't be undone here (that stays on the dashboard).
  const today = useTodayPrayers(tagStatus === "valid" ? prayerDate : null, {
    allowUndo: false,
  });
  const { records, status } = today;
  const allDone = today.completedCount === TOTAL_PRAYERS;

  const dateLabel = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PageHeader title="NFC check-in" subtitle={dateLabel ?? " "} />

      {tagStatus === "checking" && <TagCheckingSkeleton />}

      {tagStatus === "error" && (
        <InlineError
          message="Couldn't check your NFC tag."
          onRetry={() => setTagReloadKey((k) => k + 1)}
        />
      )}

      {tagStatus === "not-found" && <TagNotFound />}

      {tagStatus === "valid" && (
        <>
          <CheckInProgress
            completed={today.completedCount}
            loading={status !== "ready"}
          />

          {today.lastRecorded && <RecordedBanner prayerName={today.lastRecorded} />}

          <section className={`${enter} delay-150`}>
            <div className="mb-3 px-1">
              <TagVerifiedBadge />
              <div className="mt-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {allDone ? "Today's prayers" : "Which prayer did you complete?"}
                </h2>
                <p className="text-sm text-stone-500">
                  {allDone
                    ? "Everything is recorded for today."
                    : "Choose it below. Nothing is saved until you confirm."}
                </p>
              </div>
            </div>

            {status === "error" ? (
              <LoadErrorCard message={today.loadError} onRetry={today.reload} />
            ) : status === "loading" ? (
              <PrayerListSkeleton />
            ) : (
              <ul className="flex flex-col gap-3">
                {PRAYERS.map((prayer) => (
                  <PrayerRow
                    key={prayer.name}
                    prayer={prayer}
                    done={Boolean(records[prayer.name])}
                    isNext={false}
                    onPress={() => today.openDialog(prayer)}
                    variant="check-in"
                  />
                ))}
              </ul>
            )}
          </section>

          <Link
            href="/dashboard"
            className={`${enter} delay-200 mx-auto inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50`}
          >
            Go to Home
          </Link>
        </>
      )}

      {today.pending && (
        <PrayerConfirmDialog
          pending={today.pending}
          now={now}
          saving={today.saving}
          error={today.dialogError}
          onConfirm={today.confirmPending}
          onCancel={today.closeDialog}
        />
      )}

      {/* Success is shown by the banner above; only errors use a toast here. */}
      {today.toast?.tone === "error" && <ToastMessage toast={today.toast} />}
    </>
  );
}
