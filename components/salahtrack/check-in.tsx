import Link from "next/link";
import {
  CheckCircle2,
  Home,
  Settings,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { card, enter } from "@/components/salahtrack/ui";
import { TOTAL_PRAYERS } from "@/lib/prayers";

/* -------------------------------------------------------------------------- */
/*  Display pieces for the NFC check-in page (/scan/[id])                     */
/* -------------------------------------------------------------------------- */

export function TagVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
      <ShieldCheck className="size-3.5" />
      Your NFC tag
    </span>
  );
}

/** Compact progress: "3 of 5 recorded today" with five segments. */
export function CheckInProgress({
  completed,
  loading,
}: {
  completed: number;
  loading: boolean;
}) {
  const allDone = completed >= TOTAL_PRAYERS;
  return (
    <section
      className={`${enter} delay-75 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-5 text-white shadow-xl shadow-emerald-900/20`}
      aria-busy={loading}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-emerald-200">
        Today&apos;s progress
      </p>
      <p className="mt-1 text-xl font-semibold">
        {loading
          ? "Loading…"
          : allDone
            ? "All five recorded. MashaAllah!"
            : `${completed} of ${TOTAL_PRAYERS} recorded today`}
      </p>
      <div
        className="mt-4 grid grid-cols-5 gap-1.5"
        role="progressbar"
        aria-label="Prayers recorded today"
        aria-valuemin={0}
        aria-valuemax={TOTAL_PRAYERS}
        aria-valuenow={loading ? 0 : completed}
      >
        {Array.from({ length: TOTAL_PRAYERS }, (_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-colors duration-500 ${
              !loading && i < completed ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

/** Shown after a prayer is saved. */
export function RecordedBanner({ prayerName }: { prayerName: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200/80 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      <p>
        <span className="font-semibold">{prayerName} recorded.</span> May Allah
        accept it.
      </p>
    </div>
  );
}

/** The tag doesn't exist, was removed, or belongs to another account. */
export function TagNotFound() {
  return (
    <section
      className={`${enter} ${card} flex flex-col items-center py-8 text-center`}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-stone-100 text-stone-500">
        <Unlink className="size-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">
        This NFC link isn&apos;t linked to your account
      </h2>
      <p className="mt-1 max-w-[18rem] text-sm text-stone-500">
        The tag may have been removed, or it may belong to a different
        account. You can register your own tag in Settings.
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-2">
        <Link
          href="/settings"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-200 transition hover:bg-stone-50 active:scale-[0.98]"
        >
          <Home className="size-4" />
          Home
        </Link>
      </div>
    </section>
  );
}

export function TagCheckingSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Checking your NFC tag">
      <div className="h-[108px] animate-pulse rounded-3xl bg-stone-200/70" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white ring-1 ring-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
