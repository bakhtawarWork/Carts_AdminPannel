"use client";

import {
  Area,
  AreaChart,
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

function formatIncome(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

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
          Trends and distribution across orders, income, and vendors.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Orders & income trend
              </h4>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: BRAND }}
                />
                Orders
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: EMERALD }}
                />
                Income
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts.trends}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMERALD} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="orders"
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="income"
                  orientation="right"
                  tickFormatter={formatIncome}
                  tick={{ fill: SLATE, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    const numeric = typeof value === "number" ? value : Number(value);
                    if (name === "income") {
                      return [
                        `${new Intl.NumberFormat("en-US").format(numeric)} QR`,
                        "Income",
                      ];
                    }
                    return [
                      new Intl.NumberFormat("en-US").format(numeric),
                      name === "orders" ? "Orders" : "Signups",
                    ];
                  }}
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={BRAND}
                  strokeWidth={2.5}
                  fill="url(#ordersFill)"
                  name="orders"
                />
                <Area
                  yAxisId="income"
                  type="monotone"
                  dataKey="income"
                  stroke={EMERALD}
                  strokeWidth={2.5}
                  fill="url(#incomeFill)"
                  name="income"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Orders by service
            </h4>
            <p className="text-xs text-slate-500">Share of total volume</p>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Top vendors by orders
            </h4>
            <p className="text-xs text-slate-500">Leading partners this period</p>
          </div>
          <div className="h-64 w-full">
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
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Customer signups
            </h4>
            <p className="text-xs text-slate-500">Monthly acquisition trend</p>
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
