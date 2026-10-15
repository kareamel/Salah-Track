// Small styling helpers shared by every SalahTrack page.

import { AlertCircle, RotateCcw } from "lucide-react";

// Gentle "fade up" entrance animation (from tailwindcss-animate, already installed).
export const enter =
  "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both motion-reduce:animate-none";

// A white rounded card.
export const card = "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70";

// Where a piece of data loaded from Supabase currently is.
export type LoadStatus = "loading" | "ready" | "error";

// Small label for things that still show example values, not real data.
export function SampleBadge({ children = "Sample data" }: { children?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80">
      {children}
    </span>
  );
}

// Compact "couldn't load" message with a retry button, for use inside cards.
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/70"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition active:scale-95 hover:bg-rose-100"
      >
        <RotateCcw className="size-3.5" />
        Retry
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className={enter}>
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
    </header>
  );
}
