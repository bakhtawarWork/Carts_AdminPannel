import type { StatIcon, StatTone } from "@/lib/types";

const toneStyles: Record<StatTone, { badge: string; icon: string }> = {
  brand: {
    badge: "bg-brand-soft",
    icon: "text-brand",
  },
  slate: {
    badge: "bg-slate-100",
    icon: "text-slate-600",
  },
  emerald: {
    badge: "bg-emerald-50",
    icon: "text-emerald-700",
  },
  amber: {
    badge: "bg-amber-50",
    icon: "text-amber-700",
  },
  violet: {
    badge: "bg-violet-50",
    icon: "text-violet-700",
  },
  sky: {
    badge: "bg-sky-50",
    icon: "text-sky-700",
  },
};

function StatGlyph({ icon }: { icon: StatIcon }) {
  const common = "h-5 w-5";

  switch (icon) {
    case "vendors":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21a9 9 0 1 0-9-9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M12 3a9 9 0 0 1 9 9H12V3Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "orders":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 7h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.7L6.2 4.5A1.5 1.5 0 0 0 4.7 3.2H3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.25" fill="currentColor" />
          <circle cx="17" cy="20" r="1.25" fill="currentColor" />
        </svg>
      );
    case "income":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 16.5 9.5 11l3.5 3.5L20 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 7.5h5v5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "customers":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M5.5 19.2a6.5 6.5 0 0 1 13 0"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function StatCard({
  label,
  displayValue,
  icon,
  tone,
}: {
  label: string;
  displayValue: string;
  icon: StatIcon;
  tone: StatTone;
}) {
  const styles = toneStyles[tone];

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[1.65rem] font-semibold leading-none tracking-tight text-slate-900">
            {displayValue}
          </p>
          <p className="mt-2.5 text-sm font-medium text-slate-500">{label}</p>
        </div>
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.badge} ${styles.icon}`}
        >
          <StatGlyph icon={icon} />
        </span>
      </div>
    </article>
  );
}
