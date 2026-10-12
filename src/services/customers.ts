import { ApiError, api } from "@/services/api";
import { CUSTOMER_ENDPOINTS } from "@/services/endpoints";

export type CustomerApiItem = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  preferredLanguage?: string;
  smsVerified?: boolean;
  isBlocked?: boolean;
  noOfOrders?: number;
  totalMoneySpent?: number;
  lastOrderDate?: string;
};

export type CustomersListApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    users?: CustomerApiItem[];
    pagination?: {
      currentPage?: number;
      limit?: number;
      totalUsers?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      hasPrevPage?: boolean;
    };
  };
};

export type CustomersListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

function toCount(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toCustomersSearch(query: CustomersListQueryParams) {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, query.page)));
  params.set("limit", String(Math.max(1, query.limit)));
  if (query.search?.trim()) params.set("search", query.search.trim());
  return params.toString();
}

/** GET /admin/customers?page=&limit=&search= */
export async function getCustomers(query: CustomersListQueryParams) {
  const payload = await api.get<CustomersListApiResponse>(
    `${CUSTOMER_ENDPOINTS.list}?${toCustomersSearch(query)}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load customers.",
      400,
      payload,
    );
  }

  const users = payload.data?.users ?? [];
  const pagination = payload.data?.pagination;

  return {
    users,
    pagination: {
      page: toCount(pagination?.currentPage, query.page),
      limit: toCount(pagination?.limit, query.limit),
      total: toCount(pagination?.totalUsers, users.length),
      totalPages: toCount(pagination?.totalPages, 1),
    },
  };
}
