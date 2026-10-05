import { PROMO_CODES_SECTION_META } from "@/lib/nav";

export function PromoCodesSectionPlaceholder({ path }: { path: string }) {
  const meta = PROMO_CODES_SECTION_META[path] ?? {
    title: "Promo Codes",
    description: "Promo code management section.",
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Promo Codes
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {meta.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
        <p className="text-sm font-medium text-slate-900">Coming next</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
          This section is ready in the sidebar. Tables, filters, and API-backed
          data for{" "}
          <span className="font-medium text-slate-700">{meta.title}</span> can
          be added here using the same static-to-API pattern as the dashboard.
        </p>
      </section>
    </div>
  );
}
