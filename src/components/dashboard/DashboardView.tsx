"use client";

import { AnalysisSection } from "@/components/dashboard/AnalysisSection";
import { DashboardChartsSection } from "@/components/dashboard/DashboardCharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { formatStatValue } from "@/lib/dashboard";

export default function DashboardView() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardSummary();

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Overview
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Key metrics for your operations
          {data?.periodLabel ? ` · ${data.periodLabel}` : ""}.
        </p>
      </section>

      {loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-[108px] animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
          <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                displayValue={formatStatValue(stat)}
                icon={stat.icon}
                tone={stat.tone}
              />
            ))}
          </section>

          <DashboardChartsSection charts={data.charts} />

          <AnalysisSection links={data.analysis} />
        </>
      ) : null}
    </div>
  );
}
