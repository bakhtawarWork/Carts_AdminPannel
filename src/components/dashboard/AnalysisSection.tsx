import Link from "next/link";
import type { AnalysisLink, StatTone } from "@/lib/types";

const toneStyles: Record<
  StatTone,
  { bar: string; badge: string; text: string }
> = {
  brand: {
    bar: "bg-brand",
    badge: "bg-brand-soft text-brand",
    text: "group-hover:text-brand",
  },
  slate: {
    bar: "bg-slate-500",
    badge: "bg-slate-100 text-slate-600",
    text: "group-hover:text-slate-800",
  },
  emerald: {
    bar: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
    text: "group-hover:text-emerald-700",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    text: "group-hover:text-amber-700",
  },
  violet: {
    bar: "bg-violet-600",
    badge: "bg-violet-50 text-violet-700",
    text: "group-hover:text-violet-700",
  },
  sky: {
    bar: "bg-sky-600",
    badge: "bg-sky-50 text-sky-700",
    text: "group-hover:text-sky-700",
  },
};

export function AnalysisSection({ links }: { links: AnalysisLink[] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900">
          Analysis
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Explore popular items, vendors, categories, collections, and VIP users.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {links.map((link) => {
          const styles = toneStyles[link.tone];

          return (
            <Link
              key={link.id}
              href={link.href}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
            >
              <span
                className={`absolute inset-y-0 left-0 w-1 ${styles.bar}`}
                aria-hidden
              />
              <div className="pl-2">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
                >
                  Report
                </span>
                <p
                  className={`mt-2 text-sm font-semibold uppercase tracking-wide text-slate-900 transition ${styles.text}`}
                >
                  {link.title}
                </p>
                {link.description ? (
                  <p className="mt-1 text-xs text-slate-500">{link.description}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
