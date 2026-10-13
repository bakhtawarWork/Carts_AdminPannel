import type {
  AnalysisLink,
  DashboardCharts,
  DashboardStat,
  DashboardSummary,
} from "@/lib/types";
import { getDashboardGeneralStats } from "@/services/dashboard";
import {
  getCustomerSignupStats,
  getTopVendorOrderStats,
  getVendorServiceOrderStats,
  type TopVendorStatsItem,
} from "@/services/order-stats";

const STAT_CARDS: Array<Omit<DashboardStat, "value">> = [
  {
    id: "active-vendors",
    label: "Active Vendors",
    format: "number",
    icon: "vendors",
    tone: "sky",
  },
  {
    id: "orders-month",
    label: "Orders (Last month)",
    format: "number",
    icon: "orders",
    tone: "amber",
  },
  {
    id: "orders-total",
    label: "Total Orders",
    format: "number",
    icon: "orders",
    tone: "brand",
  },
  {
    id: "income-month",
    label: "Total Income (Last month)",
    format: "currency",
    currency: "QR",
    icon: "income",
    tone: "emerald",
  },
  {
    id: "income-total",
    label: "Total Income",
    format: "currency",
    currency: "QR",
    icon: "income",
    tone: "emerald",
  },
  {
    id: "signups-month",
    label: "Customer Signups (Last month)",
    format: "number",
    icon: "customers",
    tone: "violet",
  },
  {
    id: "signups-total",
    label: "Customer Signups",
    format: "number",
    icon: "customers",
    tone: "violet",
  },
];

const MOCK_ANALYSIS_LINKS: AnalysisLink[] = [
  {
    id: "popular-items",
    title: "Most Popular Items",
    href: "/popular/items",
    tone: "amber",
    description: "Top selling products",
  },
  {
    id: "popular-vendors",
    title: "Most Popular Vendors",
    href: "/popular/vendors",
    tone: "brand",
    description: "Vendors by volume",
  },
  {
    id: "popular-categories",
    title: "Most Popular Categories",
    href: "/popular/categories",
    tone: "sky",
    description: "Category performance",
  },
  {
    id: "popular-collections",
    title: "Popular Collections",
    href: "/popular",
    tone: "violet",
    description: "Collections and sub-collections",
  },
  {
    id: "vip-users",
    title: "VIP Users",
    href: "/dashboard/analysis/vip-users",
    tone: "emerald",
    description: "High-value customers",
  },
];

const SERVICE_LABELS: Record<string, string> = {
  catering: "Catering",
  delivery: "Delivery",
  setups: "Setups",
  hospitality: "Hospitality",
  feasts: "Feasts",
};

const SERVICE_ORDER = [
  "catering",
  "delivery",
  "setups",
  "hospitality",
  "feasts",
] as const;

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function formatStatValue(stat: DashboardStat) {
  if (stat.format === "currency") {
    const amount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stat.value);
    return `${amount} ${stat.currency ?? "QR"}`;
  }

  return new Intl.NumberFormat("en-US").format(stat.value);
}

function mapCategoryShare(data: Awaited<ReturnType<typeof getVendorServiceOrderStats>>) {
  const byService = data.byService ?? {};
  const counts = SERVICE_ORDER.map((key) => ({
    key,
    count: toNumber(byService[key]),
  }));
  const total =
    toNumber(data.totalOrders) ||
    counts.reduce((sum, entry) => sum + entry.count, 0);

  return counts.map(({ key, count }) => ({
    name: SERVICE_LABELS[key] ?? key,
    value:
      total > 0 ? Math.round((count / total) * 1000) / 10 : count,
  }));
}

function mapSignupTrends(data: Awaited<ReturnType<typeof getCustomerSignupStats>>) {
  return (data.monthly ?? []).map((item) => ({
    month: item.month?.trim() || item.label?.trim() || "—",
    orders: 0,
    income: 0,
    signups: toNumber(item.count),
  }));
}

function vendorLabelFromStats(item: TopVendorStatsItem) {
  if (typeof item.name === "string" && item.name.trim()) {
    return item.name.trim();
  }
  if (item.name && typeof item.name === "object") {
    const en = item.name.en?.trim();
    const ar = item.name.ar?.trim();
    if (en && ar) return `${en} / ${ar}`;
    return en || ar || "";
  }
  return item.englishName?.trim() || item.arabicName?.trim() || "Vendor";
}

function mapTopVendors(data: Awaited<ReturnType<typeof getTopVendorOrderStats>>) {
  return (data.topVendors ?? []).map((item) => ({
    name: vendorLabelFromStats(item),
    orders:
      toNumber(item.orderCount) ||
      toNumber(item.orders) ||
      toNumber(item.count) ||
      toNumber(item.numberOfOrders),
  }));
}

async function fetchDashboardCharts(): Promise<DashboardCharts> {
  const [vendorService, signups, topVendors] = await Promise.all([
    getVendorServiceOrderStats(),
    getCustomerSignupStats(),
    getTopVendorOrderStats(),
  ]);

  return {
    trends: mapSignupTrends(signups),
    categoryShare: mapCategoryShare(vendorService),
    topVendors: mapTopVendors(topVendors),
    ordersByServiceMonth: vendorService.month?.trim(),
    topVendorsMonth: topVendors.month?.trim(),
    signupsPeriod: signups.period?.trim(),
  };
}

/** GET /admin/dashboardgeneralstats + order-stats chart endpoints */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [stats, charts] = await Promise.all([
    getDashboardGeneralStats(),
    fetchDashboardCharts(),
  ]);
  const values: Record<string, number> = {
    "active-vendors": toNumber(stats.activeVendors),
    "orders-month": toNumber(stats.ordersLastMonth),
    "orders-total": toNumber(stats.allOrders),
    "income-month": toNumber(stats.totalIncomeLastMonth),
    "income-total": toNumber(stats.totalIncome),
    "signups-month": toNumber(stats.signUpsLastMonth),
    "signups-total": toNumber(stats.totalSignups),
  };

  const periodLabel =
    charts.ordersByServiceMonth ||
    charts.topVendorsMonth ||
    charts.signupsPeriod ||
    "Last month";

  return {
    periodLabel,
    stats: STAT_CARDS.map((stat) => ({
      ...stat,
      value: values[stat.id] ?? 0,
    })),
    analysis: MOCK_ANALYSIS_LINKS.map((link) => ({ ...link })),
    charts,
  };
}
