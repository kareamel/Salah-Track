"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Nfc, Settings, type LucideIcon } from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "History", href: "/history", icon: History },
  { label: "Scan", href: "/scan", icon: Nfc },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  // The current URL, e.g. "/history". Used to highlight the active tab.
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),16px)]"
    >
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[28px] bg-white/85 p-2 shadow-xl shadow-stone-900/10 ring-1 ring-stone-200/80 backdrop-blur-xl">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          const isScan = label === "Scan";

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className="group flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition active:scale-95"
            >
              <span className="flex h-10 items-center">
                <span
                  className={`grid place-items-center rounded-2xl transition-all duration-300 ${
                    isScan
                      ? `size-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-700/30 ${
                          active ? "ring-4 ring-emerald-100" : ""
                        }`
                      : active
                        ? "h-8 w-14 bg-emerald-100 text-emerald-700"
                        : "h-8 w-14 text-stone-400 group-hover:text-stone-600"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active ? "text-emerald-700" : "text-stone-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
