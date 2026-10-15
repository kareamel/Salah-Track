// Small styling helpers shared by every SalahTrack page.

// Gentle "fade up" entrance animation (from tailwindcss-animate, already installed).
export const enter =
  "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both motion-reduce:animate-none";

// A white rounded card.
export const card = "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70";

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
