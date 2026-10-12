import type {
  AnalysisLink,
  DashboardCharts,
  DashboardStat,
  DashboardSummary,
} from "@/lib/types";
import { getDashboardGeneralStats } from "@/services/dashboard";

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

const MOCK_DASHBOARD_CHARTS: DashboardCharts = {
  trends: [
    { month: "Mar", orders: 920, income: 1180000, signups: 640 },
    { month: "Apr", orders: 1040, income: 1325000, signups: 710 },
    { month: "May", orders: 1185, income: 1492000, signups: 790 },
    { month: "Jun", orders: 1310, income: 1618000, signups: 860 },
    { month: "Jul", orders: 1460, income: 1784000, signups: 940 },
    { month: "Aug", orders: 980, income: 1210000, signups: 520 },
  ],
  categoryShare: [
    { name: "Catering", value: 34 },
    { name: "Delivery", value: 28 },
    { name: "Setups", value: 14 },
    { name: "Hospitality", value: 16 },
    { name: "Feasts", value: 8 },
  ],
  topVendors: [
    { name: "Melenzane", orders: 842 },
    { name: "Harbor Cafe", orders: 716 },
    { name: "Palm Leaf", orders: 628 },
    { name: "City Buffet", orders: 504 },
    { name: "Golden Tray", orders: 448 },
  ],
};

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

/** GET /admin/dashboardgeneralstats — charts stay local until a charts API exists. */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const stats = await getDashboardGeneralStats();
  const values: Record<string, number> = {
    "active-vendors": toNumber(stats.activeVendors),
    "orders-month": toNumber(stats.ordersLastMonth),
    "orders-total": toNumber(stats.allOrders),
    "income-month": toNumber(stats.totalIncomeLastMonth),
    "income-total": toNumber(stats.totalIncome),
    "signups-month": toNumber(stats.signUpsLastMonth),
    "signups-total": toNumber(stats.totalSignups),
  };

  return {
    periodLabel: "Last month",
    stats: STAT_CARDS.map((stat) => ({
      ...stat,
      value: values[stat.id] ?? 0,
    })),
    analysis: MOCK_ANALYSIS_LINKS.map((link) => ({ ...link })),
    charts: {
      trends: MOCK_DASHBOARD_CHARTS.trends.map((point) => ({ ...point })),
      categoryShare: MOCK_DASHBOARD_CHARTS.categoryShare.map((item) => ({
        ...item,
      })),
      topVendors: MOCK_DASHBOARD_CHARTS.topVendors.map((item) => ({ ...item })),
    },
  };
}
