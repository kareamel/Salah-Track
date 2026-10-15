"use client";

import { useState } from "react";
import { CircleCheck, Nfc, Smartphone, Tag } from "lucide-react";
import { card, enter, PageHeader } from "@/components/salahtrack/ui";

const STEPS = [
  {
    icon: Tag,
    title: "Place your tag",
    text: "Stick a SalahTrack NFC tag near where you pray.",
  },
  {
    icon: Smartphone,
    title: "Tap after praying",
    text: "Hold the top of your phone close to the tag.",
  },
  {
    icon: CircleCheck,
    title: "Prayer confirmed",
    text: "The current prayer is marked as done automatically.",
  },
];

export default function ScanPage() {
  // Visual only for now - real NFC scanning will be added in a later step.
  const [scanning, setScanning] = useState(false);

  return (
    <>
      <PageHeader
        title="Scan"
        subtitle="Log a prayer by tapping your phone on a SalahTrack NFC tag."
      />

      <section
        className={`${enter} delay-75 ${card} flex flex-col items-center overflow-hidden py-10 text-center`}
      >
        {/* Animated scan circle */}
        <div className="relative grid size-44 place-items-center">
          <span className="absolute inset-0 rounded-full bg-emerald-50 ring-1 ring-emerald-100" />
          {scanning && (
            <>
              <span className="absolute inset-6 animate-ping rounded-full bg-emerald-400/25 [animation-duration:1.8s] motion-reduce:animate-none" />
              <span className="absolute inset-2 animate-ping rounded-full bg-emerald-400/15 [animation-delay:600ms] [animation-duration:1.8s] motion-reduce:animate-none" />
            </>
          )}
          <span
            className={`relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-700/30 transition-transform duration-500 ${
              scanning ? "scale-110" : ""
            }`}
          >
            <Nfc className="size-10" />
          </span>
        </div>

        <h2 className="mt-8 text-xl font-semibold tracking-tight">
          {scanning ? "Hold near your tag" : "Ready to scan"}
        </h2>
        <p className="mt-1 max-w-[16rem] text-sm text-stone-500">
          {scanning
            ? "Keep your phone still until you feel a vibration."
            : "Tap the button below, then bring your phone close to the tag."}
        </p>

        <button
          type="button"
          onClick={() => setScanning((s) => !s)}
          className={`mt-6 inline-flex h-12 min-w-[180px] items-center justify-center rounded-full px-6 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            scanning
              ? "bg-white text-stone-700 ring-1 ring-inset ring-stone-300 hover:bg-stone-50"
              : "bg-emerald-600 text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-700"
          }`}
        >
          {scanning ? "Cancel" : "Start scanning"}
        </button>

        <p className="mt-4 text-xs text-stone-400">
          Demo only. NFC will be connected in a later step.
        </p>
      </section>

      {/* How it works */}
      <section className={`${enter} delay-200 ${card}`}>
        <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
        <ol className="mt-4 flex flex-col gap-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon className="size-5" />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-stone-500">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
