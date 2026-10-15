import type { Metadata } from "next";
import { AuthGuard } from "@/components/salahtrack/auth-guard";
import { BottomNav } from "@/components/salahtrack/bottom-nav";

export const metadata: Metadata = {
  title: "SalahTrack",
  description: "Track your five daily prayers.",
};

// This layout wraps every page inside the app/(main) folder (Dashboard,
// History, Scan and Settings), so they all share the same background and
// bottom navigation. The "(main)" folder name does not appear in the URL.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-stone-50 text-stone-900">
      {/* Soft emerald glow behind the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-transparent"
      />

      <main className="relative mx-auto flex max-w-md flex-col gap-6 px-5 pb-36 pt-6">
        {children}
      </main>

      <BottomNav />
      <AuthGuard />
    </div>
  );
}
