"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardCharts } from "@/lib/types";

const BRAND = "#E31E24";
const EMERALD = "#059669";
const SKY = "#0284C7";
const AMBER = "#D97706";
const VIOLET = "#7C3AED";
const SLATE = "#64748B";

const CATEGORY_COLORS = [BRAND, EMERALD, SKY, AMBER, VIOLET];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
  fontSize: 12,
};

export function DashboardChartsSection({ charts }: { charts: DashboardCharts }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Insights
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          Performance overview
        </h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Distribution across orders, vendors, and signups.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Orders by service
            </h4>
            <p className="text-xs text-slate-500">
              {charts.ordersByServiceMonth
                ? `Share of orders · ${charts.ordersByServiceMonth}`
                : "Share of total volume"}
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.categoryShare}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {charts.categoryShare.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    `${typeof value === "number" ? value : Number(value)}%`,
                    "Share",
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#475569" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Top vendors by orders
            </h4>
            <p className="text-xs text-slate-500">
              {charts.topVendorsMonth
                ? `Leading partners · ${charts.topVendorsMonth}`
                : "Leading partners this period"}
            </p>
          </div>
          <div className="h-64 w-full">
            {charts.topVendors.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No vendor orders for this period.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.topVendors}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    new Intl.NumberFormat("en-US").format(
                      typeof value === "number" ? value : Number(value),
                    ),
                    "Orders",
                  ]}
                />
                <Bar dataKey="orders" fill={BRAND} radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Customer signups
            </h4>
            <p className="text-xs text-slate-500">
              {charts.signupsPeriod
                ? `Monthly signups · ${charts.signupsPeriod}`
                : "Monthly acquisition trend"}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.trends}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    new Intl.NumberFormat("en-US").format(
                      typeof value === "number" ? value : Number(value),
                    ),
                    "Signups",
                  ]}
                />
                <Bar dataKey="signups" fill={VIOLET} radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
