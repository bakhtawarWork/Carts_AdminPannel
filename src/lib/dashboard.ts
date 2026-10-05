import type {
  AnalysisLink,
  DashboardCharts,
  DashboardStat,
  DashboardSummary,
} from "@/lib/types";

/**
 * Static dashboard metrics until a real API is available.
 * Replace `fetchDashboardSummary` with a fetch call — keep the return type.
 */
const MOCK_DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "active-vendors",
    label: "Active Vendors",
    value: 262,
    format: "number",
    icon: "vendors",
    tone: "sky",
  },
  {
    id: "orders-month",
    label: "Orders (August)",
    value: 0,
    format: "number",
    icon: "orders",
    tone: "amber",
  },
  {
    id: "orders-total",
    label: "Total Orders",
    value: 12437,
    format: "number",
    icon: "orders",
    tone: "brand",
  },
  {
    id: "income-month",
    label: "Total Income (August)",
    value: 0,
    format: "currency",
    currency: "QR",
    icon: "income",
    tone: "emerald",
  },
  {
    id: "income-total",
    label: "Total Income",
    value: 16267159,
    format: "currency",
    currency: "QR",
    icon: "income",
    tone: "emerald",
  },
  {
    id: "signups-month",
    label: "Customer Signups (August)",
    value: 0,
    format: "number",
    icon: "customers",
    tone: "violet",
  },
  {
    id: "signups-total",
    label: "Customer Signups",
    value: 11271,
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

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/** Swap this for: `const res = await fetch("/api/dashboard/summary"); return res.json();` */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  await delay();

  return {
    periodLabel: "August",
    stats: MOCK_DASHBOARD_STATS.map((stat) => ({ ...stat })),
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
