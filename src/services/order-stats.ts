import { ApiError, api } from "@/services/api";
import { ORDER_STATS_ENDPOINTS } from "@/services/endpoints";

type StatsApiResponse<T> = {
  status?: boolean;
  message?: string;
  data?: T;
};

export type VendorServiceCountData = {
  month?: string;
  startDate?: string;
  endDate?: string;
  totalOrders?: number;
  byService?: Partial<
    Record<
      "catering" | "delivery" | "setups" | "hospitality" | "feasts",
      number
    >
  >;
};

export type CustomerSignupsMonthlyItem = {
  month?: string;
  year?: number;
  label?: string;
  count?: number;
};

export type CustomerSignupsData = {
  period?: string;
  totalSignups?: number;
  monthly?: CustomerSignupsMonthlyItem[];
};

export type TopVendorStatsItem = {
  _id?: string;
  id?: string;
  vendorId?: string;
  name?: string | { en?: string; ar?: string };
  englishName?: string;
  arabicName?: string;
  orderCount?: number;
  orders?: number;
  count?: number;
  numberOfOrders?: number;
};

export type TopVendorsData = {
  month?: string;
  startDate?: string;
  endDate?: string;
  topVendors?: TopVendorStatsItem[];
};

async function getStats<T>(path: string, failureMessage: string) {
  const payload = await api.get<StatsApiResponse<T>>(path);

  if (payload?.status === false) {
    throw new ApiError(payload.message ?? failureMessage, 400, payload);
  }

  if (!payload.data) {
    throw new ApiError(failureMessage, 200, payload);
  }

  return payload.data;
}

/** GET /admin/order-stats/stats/vendor-service-count */
export function getVendorServiceOrderStats() {
  return getStats<VendorServiceCountData>(
    ORDER_STATS_ENDPOINTS.vendorServiceCount,
    "Could not load orders by service.",
  );
}

/** GET /admin/order-stats/stats/customer-signups */
export function getCustomerSignupStats() {
  return getStats<CustomerSignupsData>(
    ORDER_STATS_ENDPOINTS.customerSignups,
    "Could not load customer signup stats.",
  );
}

/** GET /admin/order-stats/stats/top-vendors */
export function getTopVendorOrderStats() {
  return getStats<TopVendorsData>(
    ORDER_STATS_ENDPOINTS.topVendors,
    "Could not load top vendors.",
  );
}
