"use client";

import { AlertCircle, Check, RotateCcw } from "lucide-react";
import { ConfirmSheet } from "@/components/salahtrack/confirm-sheet";
import type { PendingAction } from "@/lib/use-today-prayers";
import { PRAYERS, type Prayer } from "@/lib/prayers";

/* -------------------------------------------------------------------------- */
/*  Shared pieces of the daily prayer checklist, used by the dashboard and   */
/*  the NFC check-in page (/scan/[id]).                                      */
/* -------------------------------------------------------------------------- */

/**
 * One prayer with its Confirm/Done button.
 *
 * `variant="check-in"` (NFC page) hides the sample times and the "Up next"
 * hint, so nothing suggests which prayer to record, and a completed prayer
 * can't be undone there (undo stays on the dashboard).
 */
export function PrayerRow({
  prayer,
  done,
  isNext,
  onPress,
  variant = "dashboard",
}: {
  prayer: Prayer;
  done: boolean;
  isNext: boolean;
  onPress: () => void;
  variant?: "dashboard" | "check-in";
}) {
  const Icon = prayer.icon;
  const checkIn = variant === "check-in";
  const highlightNext = isNext && !checkIn;

  return (
    <li
      className={`flex items-center gap-4 rounded-2xl p-4 ring-1 transition-all duration-300 ${
        done
          ? "bg-emerald-50/80 ring-emerald-200/80"
          : highlightNext
            ? "bg-white shadow-md shadow-emerald-900/5 ring-emerald-300"
            : "bg-white shadow-sm ring-stone-200/70"
      }`}
    >
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${
          done
            ? "bg-emerald-600 text-white"
            : "bg-stone-100 text-stone-500"
        }`}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold">{prayer.name}</p>
          <p lang="ar" dir="rtl" className="text-sm text-stone-400">
            {prayer.arabic}
          </p>
        </div>
        {checkIn ? (
          <p className="mt-0.5 text-sm text-stone-500">
            {done ? (
              <span className="text-emerald-700">Recorded today</span>
            ) : (
              "Not recorded yet"
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-stone-500">
            <span className="tabular-nums">{prayer.time}</span>
            {" · "}
            {done ? (
              <span className="text-emerald-700">Prayed</span>
            ) : highlightNext ? (
              <span className="font-medium text-emerald-700">Up next</span>
            ) : (
              "Upcoming"
            )}
          </p>
        )}
      </div>

      {checkIn && done ? (
        <span
          aria-label={`${prayer.name} recorded`}
          className="inline-flex h-10 min-w-[96px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-700/25"
        >
          <Check className="size-4" strokeWidth={3} />
          Done
        </span>
      ) : (
      <button
        type="button"
        onClick={onPress}
        aria-pressed={done}
        aria-haspopup="dialog"
        aria-label={
          done ? `Undo ${prayer.name} record` : `Confirm ${prayer.name}`
        }
        className={`inline-flex h-10 min-w-[96px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          done
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/25 hover:bg-emerald-700"
            : "bg-white text-emerald-700 ring-1 ring-inset ring-emerald-600/30 hover:bg-emerald-50"
        }`}
      >
        {done ? (
          <>
            <Check
              className="size-4 animate-in zoom-in-50 duration-300"
              strokeWidth={3}
            />
            Done
          </>
        ) : (
          "Confirm"
        )}
      </button>
      )}
    </li>
  );
}

export function PrayerListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-label="Loading prayers">
      {PRAYERS.map((prayer) => (
        <li
          key={prayer.name}
          className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70"
        >
          <div className="size-11 shrink-0 animate-pulse rounded-xl bg-stone-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-stone-100" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-full bg-stone-100" />
        </li>
      ))}
    </ul>
  );
}

export function LoadErrorCard({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200/70"
    >
      <div className="grid size-11 place-items-center rounded-full bg-rose-50 text-rose-500">
        <AlertCircle className="size-6" />
      </div>
      <p className="text-sm text-stone-600">
        {message ?? "Something went wrong. Please try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition active:scale-95 hover:bg-emerald-700"
      >
        <RotateCcw className="size-4" />
        Try again
      </button>
    </div>
  );
}


/** The "Did you pray Asr?" / "Remove Asr?" confirmation. */
export function PrayerConfirmDialog({
  pending,
  now,
  saving,
  error,
  onConfirm,
  onCancel,
}: {
  pending: PendingAction;
  now: Date | null;
  saving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { prayer, action } = pending;
  const isUndo = action === "undo";
  const dateLabel = now?.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <ConfirmSheet
      icon={prayer.icon}
      tone={isUndo ? "neutral" : "primary"}
      title={isUndo ? `Remove ${prayer.name}?` : `Did you pray ${prayer.name}?`}
      description={
        isUndo
          ? `This deletes today's ${prayer.name} record. You can confirm it again later.`
          : `This records ${prayer.name} as completed${
              dateLabel ? ` for ${dateLabel}` : " for today"
            }.`
      }
      confirmLabel={isUndo ? "Remove record" : `Yes, I prayed ${prayer.name}`}
      busyLabel={isUndo ? "Removing…" : "Saving…"}
      saving={saving}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
