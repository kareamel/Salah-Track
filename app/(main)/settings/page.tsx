"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  Compass,
  Info,
  UserRound,
  Vibrate,
  type LucideIcon,
} from "lucide-react";
import { enter, PageHeader } from "@/components/salahtrack/ui";

export default function SettingsPage() {
  // Visual only for now - these settings are not saved yet.
  const [reminders, setReminders] = useState(true);
  const [showHijri, setShowHijri] = useState(true);
  const [haptics, setHaptics] = useState(false);

  return (
    <>
      <PageHeader title="Settings" />

      {/* Profile */}
      <section
        className={`${enter} delay-75 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70`}
      >
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700">
          <UserRound className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Guest</p>
          <p className="text-sm text-stone-500">
            Sign in to keep your progress safe
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
          Soon
        </span>
      </section>

      <SettingsGroup title="Prayers" delay="delay-150">
        <SettingsRow
          icon={Bell}
          title="Prayer reminders"
          description="Get a notification at each prayer time"
        >
          <Toggle
            label="Prayer reminders"
            checked={reminders}
            onChange={setReminders}
          />
        </SettingsRow>
        <SettingsRow
          icon={Compass}
          title="Calculation method"
          description="Muslim World League"
        >
          <ChevronRight className="size-4 shrink-0 text-stone-300" />
        </SettingsRow>
        <SettingsRow icon={Clock} title="Time format">
          <Value text="24-hour" />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Display" delay="delay-200">
        <SettingsRow
          icon={CalendarDays}
          title="Show Hijri date"
          description="On the home screen, next to today's date"
        >
          <Toggle
            label="Show Hijri date"
            checked={showHijri}
            onChange={setShowHijri}
          />
        </SettingsRow>
        <SettingsRow
          icon={Vibrate}
          title="Vibrate on confirm"
          description="A short buzz when you confirm a prayer"
        >
          <Toggle
            label="Vibrate on confirm"
            checked={haptics}
            onChange={setHaptics}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="About" delay="delay-300">
        <SettingsRow icon={Info} title="Version">
          <span className="text-sm text-stone-500">0.1.0 (demo)</span>
        </SettingsRow>
      </SettingsGroup>

      <p className={`${enter} delay-500 text-center text-xs text-stone-400`}>
        Settings are not saved yet. They will be in a later step.
      </p>
    </>
  );
}

function SettingsGroup({
  title,
  delay,
  children,
}: {
  title: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${enter} ${delay}`}>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-stone-400">
        {title}
      </h2>
      <div className="divide-y divide-stone-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-stone-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Value({ text }: { text: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm text-stone-500">
      {text}
      <ChevronRight className="size-4 text-stone-300" />
    </span>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-stone-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
