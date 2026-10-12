import { API_BASE_URL } from "@/lib/api-config";
import { api } from "@/services/api";
import { DASHBOARD_ENDPOINTS } from "@/services/endpoints";

/** `/adminadvanced/*` sits beside `/admin`, not under it. */
function advancedUrl(path: string) {
  const origin = API_BASE_URL.replace(/\/admin$/i, "");
  return `${origin}/admin/adminadvanced/${path.replace(/^\//, "")}`;
}

export type DashboardGeneralStatsApi = {
  activeVendors?: number;
  ordersLastMonth?: number;
  allOrders?: number;
  totalIncomeLastMonth?: number;
  totalIncome?: number;
  signUpsLastMonth?: number;
  totalSignups?: number;
  totalVendorAccounts?: number;
  totalAdminAccounts?: number;
};

export type BilingualName = {
  en?: string;
  ar?: string;
};

export type PopularOfferingApiItem = {
  _id?: string;
  name?: BilingualName;
  startingPrice?: number;
  published?: boolean;
  _deleted?: boolean;
  images?: Array<{ cdnUrl?: string }> | null;
  _vendor?: {
    name?: BilingualName;
    logo?: { cdnUrl?: string };
  } | null;
  numberOfOrders?: number;
};

export type PopularOfferingsApiResponse = {
  offers?: PopularOfferingApiItem[];
};

export type PopularVendorApiItem = {
  _id?: string;
  name?: BilingualName;
  _deleted?: boolean;
  published?: boolean;
  images?: Array<{ cdnUrl?: string }> | null;
  logo?: { cdnUrl?: string };
  numberOfOrders?: number;
};

export type PopularVendorsApiResponse = {
  vendorDetails?: PopularVendorApiItem[];
};

export type PopularCategoryApiItem = {
  _id?: string;
  name?: BilingualName;
  createdAt?: string;
  approveStatus?: string | null;
  numberOfOrders?: number;
};

export type PopularCategoriesApiResponse = {
  allCategories?: PopularCategoryApiItem[];
};

export type VipUserApiItem = {
  id?: string;
  name?: string;
  mobile?: string;
  noOfOrders?: number;
  totalMoneySpent?: number;
};

export type VipUsersApiResponse = {
  data?: VipUserApiItem[];
  total?: number;
};

export type VipUsersApiQuery = {
  skip: number;
  take: number;
  name?: string;
  mobile?: string;
};

/** GET /admin/dashboardgeneralstats */
export async function getDashboardGeneralStats() {
  const payload = await api.get<DashboardGeneralStatsApi>(
    DASHBOARD_ENDPOINTS.generalStats,
  );
  return payload ?? {};
}

/** GET /adminadvanced/popular-offerings */
export async function getPopularOfferings() {
  const payload = await api.get<PopularOfferingsApiResponse>(
    advancedUrl("popular-offerings"),
  );
  return payload?.offers ?? [];
}

/** GET /adminadvanced/popular-vendor */
export async function getPopularVendors() {
  const payload = await api.get<PopularVendorsApiResponse>(
    advancedUrl("popular-vendor"),
  );
  return payload?.vendorDetails ?? [];
}

/** GET /adminadvanced/popular-categories */
export async function getPopularCategories() {
  const payload = await api.get<PopularCategoriesApiResponse>(
    advancedUrl("popular-categories"),
  );
  return payload?.allCategories ?? [];
}

/** GET /adminadvanced/vip-users?skip=&take=&name=&mobile= */
export async function getVipUsers(query: VipUsersApiQuery) {
  const params = new URLSearchParams();
  params.set("skip", String(Math.max(0, query.skip)));
  params.set("take", String(Math.max(1, query.take)));
  if (query.name?.trim()) params.set("name", query.name.trim());
  if (query.mobile?.trim()) params.set("mobile", query.mobile.trim());

  const payload = await api.get<VipUsersApiResponse>(
    `${advancedUrl("vip-users")}?${params.toString()}`,
  );

  return {
    users: payload?.data ?? [],
    total: payload?.total ?? payload?.data?.length ?? 0,
  };
}
