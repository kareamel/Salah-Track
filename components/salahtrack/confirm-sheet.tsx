"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, Loader2, type LucideIcon } from "lucide-react";

/**
 * A confirmation dialog that slides up from the bottom on phones (centred on
 * larger screens). Nothing happens until the main button is pressed.
 * Used for confirming/undoing prayers and for removing an NFC tag.
 */
export function ConfirmSheet({
  icon: Icon,
  tone,
  title,
  description,
  confirmLabel,
  busyLabel,
  saving,
  error,
  onConfirm,
  onCancel,
}: {
  icon: LucideIcon;
  /** primary = emerald (positive), neutral = dark (undo), danger = red. */
  tone: "primary" | "neutral" | "danger";
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  saving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Always call the latest onCancel from the Escape key handler below.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  // When the dialog opens: focus the main button and let Escape close it.
  useEffect(() => {
    confirmRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const iconStyle = {
    primary:
      "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/25",
    neutral: "bg-stone-100 text-stone-600",
    danger: "bg-rose-50 text-rose-600",
  }[tone];

  const buttonStyle = {
    primary:
      "bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-700 focus-visible:ring-emerald-500",
    neutral:
      "bg-stone-900 text-white hover:bg-stone-800 focus-visible:ring-stone-500",
    danger:
      "bg-rose-600 text-white shadow-lg shadow-rose-700/20 hover:bg-rose-700 focus-visible:ring-rose-500",
  }[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Dimmed background - tapping it cancels */}
      <div
        aria-hidden
        onClick={onCancel}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="relative w-full max-w-md rounded-t-3xl bg-white px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-6 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:mx-4 sm:rounded-3xl sm:pb-6"
      >
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${iconStyle}`}
        >
          <Icon className="size-7" />
        </div>

        <h2
          id="confirm-title"
          className="mt-4 text-center text-xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <p
          id="confirm-description"
          className="mt-1 text-center text-sm text-stone-500"
        >
          {description}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/70"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80 ${buttonStyle}`}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {busyLabel}
              </>
            ) : error ? (
              "Try again"
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-12 rounded-full text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
