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

export type CustomerMoneySpentApiItem = {
  _id?: string;
  total?: number;
  count?: number;
};

export type CustomerUserDetailsApi = {
  _id?: string;
  id?: string;
  smsVerified?: boolean;
  isBlocked?: boolean;
  name?: string;
  email?: string;
  mobile?: string;
  createdAt?: string;
  preferredLanguage?: string;
  totalNoOfOrders?: number;
  successfulOrders?: number;
  cancelledOrders?: number;
  activeOrders?: number;
  rejectedOrders?: number;
  totalMoneySpent?: CustomerMoneySpentApiItem[] | number;
};

export type CustomerOrderDetailsApiResponse = {
  status?: boolean;
  message?: string | { userDetails?: CustomerUserDetailsApi };
  data?: string;
};

/** GET /admin/customers/:id/order-details */
export async function getCustomerOrderDetails(id: string) {
  const payload = await api.get<CustomerOrderDetailsApiResponse>(
    CUSTOMER_ENDPOINTS.orderDetails(id),
  );

  if (payload?.status === false) {
    const failureMessage =
      typeof payload.message === "string"
        ? payload.message
        : "Could not load customer profile.";
    throw new ApiError(failureMessage, 400, payload);
  }

  const userDetails =
    typeof payload.message === "object" && payload.message !== null
      ? payload.message.userDetails
      : undefined;

  if (!userDetails) {
    throw new ApiError("Customer profile was not returned.", 200, payload);
  }

  return userDetails;
}

export type CustomerOrderPaymentApi = {
  method?: string;
  totalPrice?: number;
  status?: string;
  subTotalPrice?: number;
  deliveryCost?: number;
  cartsPercentage?: number;
  redeemedPoints?: number;
  rewardDiscountAmount?: number;
  awardedPoints?: number;
};

export type CustomerOrderApiItem = {
  _id?: string;
  id?: string;
  orderId?: string | number;
  status?: string;
  eventDate?: string;
  createdAt?: string;
  payment?: CustomerOrderPaymentApi;
};

export type CustomerOrdersApiResponse = {
  status?: boolean;
  message?: string | { orders?: CustomerOrderApiItem[] };
  data?: string;
};

/** GET /admin/customers/:id/orders */
export async function getCustomerOrders(customerId: string) {
  const payload = await api.get<CustomerOrdersApiResponse>(
    CUSTOMER_ENDPOINTS.orders(customerId),
  );

  if (payload?.status === false) {
    const failureMessage =
      typeof payload.message === "string"
        ? payload.message
        : "Could not load customer orders.";
    throw new ApiError(failureMessage, 400, payload);
  }

  const orders =
    typeof payload.message === "object" && payload.message !== null
      ? payload.message.orders ?? []
      : [];

  return orders;
}
