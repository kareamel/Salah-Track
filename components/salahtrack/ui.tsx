// Small styling helpers shared by every SalahTrack page.

// Gentle "fade up" entrance animation (from tailwindcss-animate, already installed).
export const enter =
  "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both motion-reduce:animate-none";

// A white rounded card.
export const card = "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70";

// Small label for cards that still show example numbers, not real data.
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80">
      Sample data
    </span>
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
