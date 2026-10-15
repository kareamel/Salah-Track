import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Home,
  LayoutDashboard,
  Loader2,
  LogIn,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Unlink,
} from "lucide-react";
import { card, enter } from "@/components/salahtrack/ui";
import type { PrayerRecordErrorKind } from "@/lib/prayer-records";
import { PRAYERS, TOTAL_PRAYERS, type Prayer, type PrayerName } from "@/lib/prayers";

/* -------------------------------------------------------------------------- */
/*  Display pieces for the NFC quick check-in page (/scan/[id])               */
/* -------------------------------------------------------------------------- */

export function TagVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
      <ShieldCheck className="size-3.5" />
      Your NFC tag
    </span>
  );
}

/* --------------------------- Quick confirmation --------------------------- */

export type CheckInError = { kind: PrayerRecordErrorKind; message: string };

/**
 * One prayer, shown big, with a single "Yes, I prayed" button. Pressing the
 * button IS the confirmation; nothing is saved until it's pressed.
 */
export function QuickConfirmCard({
  prayer,
  label,
  saving,
  error,
  loginHref,
  onConfirm,
}: {
  prayer: Prayer;
  /** e.g. "Next unrecorded prayer" or "Selected prayer". */
  label: string;
  saving: boolean;
  error: CheckInError | null;
  loginHref: string;
  onConfirm: () => void;
}) {
  const Icon = prayer.icon;

  return (
    <section
      className={`${enter} relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-6 pb-6 pt-7 text-white shadow-xl shadow-emerald-900/25`}
      aria-labelledby="quick-confirm-title"
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
      />

      <div className="relative flex flex-col items-center text-center">
        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-50 ring-1 ring-white/20">
          {label}
        </span>

        <div className="mt-5 grid size-20 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <Icon className="size-10" strokeWidth={1.75} />
        </div>

        <p lang="ar" dir="rtl" className="mt-4 text-lg text-emerald-100">
          {prayer.arabic}
        </p>
        <h1
          id="quick-confirm-title"
          className="mt-1 text-[28px] font-semibold leading-tight tracking-tight"
        >
          Have you completed {prayer.name}?
        </h1>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="relative mt-7 inline-flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-white text-lg font-semibold text-emerald-800 shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:bg-emerald-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:cursor-wait disabled:opacity-90"
      >
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Check className="size-6" strokeWidth={3} />
            {error ? "Try again" : "Yes, I prayed"}
          </>
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="relative mt-4 flex items-start gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white ring-1 ring-white/20"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p>{error.message}</p>
            {error.kind === "auth" && (
              <Link
                href={loginHref}
                className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
              >
                <LogIn className="size-4" />
                Log in again
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** "Choose another prayer": every other unrecorded prayer, in daily order. */
export function ChooseAnotherPrayer({
  options,
  open,
  onToggle,
  onChoose,
  disabled,
}: {
  options: Prayer[];
  open: boolean;
  onToggle: () => void;
  onChoose: (name: PrayerName) => void;
  disabled: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <section className={`${enter} delay-100`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls="other-prayers"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200/80 transition hover:bg-stone-50 active:scale-[0.99] disabled:opacity-60"
      >
        Choose another prayer
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id="other-prayers"
          className="mt-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {options.map((prayer) => {
            const Icon = prayer.icon;
            return (
              <li key={prayer.name}>
                <button
                  type="button"
                  onClick={() => onChoose(prayer.name)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-stone-200/80 transition hover:ring-emerald-300 active:scale-[0.98]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{prayer.name}</span>
                    <span lang="ar" dir="rtl" className="block text-xs text-stone-400">
                      {prayer.arabic}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------ After saving ------------------------------ */

export function CheckInSuccess({
  prayerName,
  completed,
  canRecordAnother,
  onRecordAnother,
}: {
  prayerName: PrayerName;
  completed: number;
  canRecordAnother: boolean;
  onRecordAnother: () => void;
}) {
  const allDone = completed >= TOTAL_PRAYERS;
  return (
    <section
      role="status"
      className={`${enter} ${card} flex flex-col items-center px-6 py-8 text-center`}
    >
      <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-700/30 animate-in zoom-in-50 duration-500">
        <Check className="size-10" strokeWidth={3} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        {prayerName} recorded
      </h1>
      <p className="mt-1 text-stone-500">May Allah accept it.</p>
      <p className="mt-4 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200/70">
        {allDone
          ? "All five prayers recorded today. MashaAllah!"
          : `${completed} of ${TOTAL_PRAYERS} recorded today`}
      </p>

      <div className="mt-6 grid w-full gap-2">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-700/25 transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          <LayoutDashboard className="size-4" />
          Go to dashboard
        </Link>
        {canRecordAnother && (
          <button
            type="button"
            onClick={onRecordAnother}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-stone-700 ring-1 ring-inset ring-stone-200 transition hover:bg-stone-50 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Record another prayer
          </button>
        )}
      </div>
    </section>
  );
}

export function AllRecordedCard() {
  return (
    <section
      className={`${enter} relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 px-6 py-8 text-center text-white shadow-xl shadow-emerald-900/25`}
    >
      <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-white/15 ring-1 ring-white/25">
        <Sparkles className="size-10" strokeWidth={1.75} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        All prayers recorded today
      </h1>
      <p className="mt-1 text-emerald-100">
        MashaAllah! See you at Fajr tomorrow, in sha Allah.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 active:scale-[0.98]"
      >
        <LayoutDashboard className="size-4" />
        Go to dashboard
      </Link>
    </section>
  );
}

/* -------------------------------- Progress -------------------------------- */

/** Today's five prayers as a strip: recorded ones are filled in. */
export function DayProgress({ recorded }: { recorded: Set<PrayerName> }) {
  return (
    <section className={`${enter} delay-75 ${card} p-4`}>
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-semibold">Today&apos;s progress</h2>
        <span className="text-sm tabular-nums text-stone-500">
          {recorded.size} of {TOTAL_PRAYERS}
        </span>
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1.5">
        {PRAYERS.map((prayer) => {
          const done = recorded.has(prayer.name);
          return (
            <li
              key={prayer.name}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors duration-500 ${
                done ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500"
              }`}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                <span className="size-3.5 rounded-full ring-1 ring-inset ring-stone-300" />
              )}
              {prayer.name}
              <span className="sr-only">{done ? "recorded" : "not recorded"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ----------------------------- Other states ------------------------------- */

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

/** Placeholder shaped like the quick-confirm screen, shown while loading. */
export function TagCheckingSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy
      aria-label="Loading your check-in"
    >
      <div className="flex h-[23rem] flex-col items-center rounded-[2rem] bg-gradient-to-br from-emerald-600/90 via-emerald-700/90 to-emerald-900/90 px-6 pt-7">
        <div className="h-5 w-40 animate-pulse rounded-full bg-white/20" />
        <div className="mt-5 size-20 animate-pulse rounded-3xl bg-white/15" />
        <div className="mt-5 h-7 w-56 animate-pulse rounded bg-white/20" />
        <div className="mt-auto mb-6 h-16 w-full animate-pulse rounded-2xl bg-white/25" />
      </div>
      <div className="h-[104px] animate-pulse rounded-3xl bg-white ring-1 ring-stone-200/70" />
    </div>
  );
}
