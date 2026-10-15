import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  Clock,
  Compass,
  Info,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  MailWarning,
  MapPin,
  Nfc,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  ComingSoonBadge,
  enter,
  InlineError,
  type LoadStatus,
} from "@/components/salahtrack/ui";
import type { AccountInfo } from "@/lib/account";

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                           */
/* -------------------------------------------------------------------------- */

export function SettingsSection({
  title,
  badge,
  delay,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${enter} ${delay}`}>
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          {title}
        </h2>
        {badge}
      </div>
      <div className="divide-y divide-stone-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {children}
      </div>
    </section>
  );
}

/**
 * A read-only row: icon, title, optional description and an optional value
 * on the right. Rows are never buttons unless they actually do something.
 */
export function InfoRow({
  icon: Icon,
  title,
  description,
  value,
  comingSoon = false,
  stacked = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  value?: React.ReactNode;
  comingSoon?: boolean;
  /** Small label on top, value underneath (for long values like dates). */
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="flex items-center gap-4 px-5 py-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-stone-500">{title}</p>
          <p className="font-medium">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          comingSoon ? "bg-stone-100 text-stone-400" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={`font-medium ${comingSoon ? "text-stone-500" : ""}`}>
            {title}
          </p>
          {comingSoon && <ComingSoonBadge />}
        </div>
        {description && (
          <p className="text-sm text-stone-500">{description}</p>
        )}
      </div>
      {!comingSoon && value !== undefined && (
        <span className="shrink-0 text-right text-sm text-stone-500">
          {value}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Account                                                                   */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerLabel(provider: string) {
  if (provider === "email") return "Email and password";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function AccountSection({
  status,
  account,
  onRetry,
  onLogout,
  loggingOut,
  logoutError,
}: {
  status: LoadStatus;
  account: AccountInfo | null;
  onRetry: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  logoutError: string | null;
}) {
  const ready = status === "ready" && account !== null;

  return (
    <SettingsSection title="Account" delay="delay-75">
      {/* Who is signed in */}
      <div className="flex items-center gap-4 px-5 py-5">
        {ready ? (
          <div
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-semibold text-white shadow-md shadow-emerald-700/25"
          >
            {(account.email?.charAt(0) ?? "?").toUpperCase()}
          </div>
        ) : (
          <div className="size-14 shrink-0 animate-pulse rounded-full bg-stone-100" />
        )}

        <div className="min-w-0 flex-1">
          {status !== "error" && (
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              Signed in as
            </p>
          )}
          {ready ? (
            <>
              <p className="truncate font-semibold" title={account.email ?? undefined}>
                {account.email ?? "No email address"}
              </p>
              {account.emailConfirmed ? (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="size-3.5" />
                  Email verified
                </span>
              ) : (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <MailWarning className="size-3.5" />
                  Email not verified
                </span>
              )}
            </>
          ) : status === "loading" ? (
            <div className="mt-1 space-y-2">
              <div className="h-4 w-44 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
            </div>
          ) : null}
        </div>
      </div>

      {status === "error" && (
        <div className="px-5 py-4">
          <InlineError message="Couldn't load your account." onRetry={onRetry} />
        </div>
      )}

      {/* Real account details (only those Supabase provides) */}
      {ready && account.createdAt && (
        <InfoRow
          icon={CalendarDays}
          title="Member since"
          stacked
          value={formatDate(account.createdAt)}
        />
      )}
      {ready && account.lastSignInAt && (
        <InfoRow
          icon={Clock}
          title="Last signed in"
          stacked
          value={formatDateTime(account.lastSignInAt)}
        />
      )}
      {ready && account.provider && (
        <InfoRow
          icon={LogIn}
          title="Sign-in method"
          stacked
          value={providerLabel(account.provider)}
        />
      )}
      {status === "loading" && (
        <div className="space-y-3 px-5 py-4">
          <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
        </div>
      )}

      {/* Log out: always available, even if account details failed to load */}
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-rose-600 ring-1 ring-inset ring-rose-200 transition-all duration-200 hover:bg-rose-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-wait disabled:opacity-70"
        >
          {loggingOut ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Logging out…
            </>
          ) : (
            <>
              <LogOut className="size-4" />
              Log out
            </>
          )}
        </button>
        {logoutError && (
          <p
            role="alert"
            className="mt-3 flex items-center justify-center gap-1.5 text-sm text-rose-600"
          >
            <AlertCircle className="size-4" />
            {logoutError}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  Prayer tracking                                                           */
/* -------------------------------------------------------------------------- */

export function PrayerTrackingSection({ timeZone }: { timeZone: string | null }) {
  return (
    <SettingsSection title="Prayer tracking" delay="delay-150">
      {/* How tracking works today (real behaviour, read-only) */}
      <InfoRow
        icon={CalendarClock}
        title="Prayer day"
        description={`Prayers are saved to your local calendar date${
          timeZone ? ` (${timeZone})` : ""
        }`}
      />
      <InfoRow
        icon={CircleCheck}
        title="Complete day"
        description="All five prayers recorded on the same date"
      />
      <InfoRow
        icon={ShieldCheck}
        title="Confirm before saving"
        description="You're always asked before a prayer is recorded or removed"
      />

      {/* Not built yet */}
      <InfoRow
        icon={MapPin}
        title="Prayer times for your location"
        description="Home currently shows sample times"
        comingSoon
      />
      <InfoRow icon={Compass} title="Calculation method" comingSoon />
      <InfoRow icon={Bell} title="Prayer reminders" comingSoon />
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  NFC bracelet                                                              */
/* -------------------------------------------------------------------------- */

export function NfcSection() {
  return (
    <SettingsSection
      title="NFC bracelet"
      badge={<ComingSoonBadge />}
      delay="delay-200"
    >
      <div className="flex items-start gap-4 px-5 py-5">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-stone-100 text-stone-400">
          <Nfc className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-700">Connect your bracelet</p>
          <p className="mt-0.5 text-sm text-stone-500">
            Soon you&apos;ll be able to tap your SalahTrack bracelet against your
            phone to record a prayer.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  About                                                                     */
/* -------------------------------------------------------------------------- */

export function AboutSection() {
  return (
    <SettingsSection title="About SalahTrack" delay="delay-300">
      <InfoRow
        icon={Info}
        title="SalahTrack"
        description="Track your five daily prayers. This is a development preview."
      />
      <InfoRow
        icon={Lock}
        title="Your data"
        description="Your prayer records are stored securely and only your account can see them"
      />
    </SettingsSection>
  );
}
