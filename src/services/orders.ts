import { ApiError, api } from "@/services/api";
import { ORDER_ENDPOINTS } from "@/services/endpoints";
import type { OrderListTab } from "@/lib/types";

export type OrderListApiVendor = {
  en?: string;
  ar?: string;
};

export type OrderListApiItem = {
  orderId?: number | string;
  vendor?: OrderListApiVendor;
  eventDate?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalPrice?: number | string;
};

export type OrdersListApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
    data?: OrderListApiItem[];
  };
};

export type OrdersListQueryParams = {
  orderType: OrderListTab;
  page: number;
  limit: number;
  orderId?: string;
  vendorId?: string;
  eventDate?: string;
  cancellationStatus?: "cancelled" | "not_cancelled";
  status?: string;
  updatedInLast4Days?: "yes" | "no";
};

function toCount(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toOrdersSearch(query: OrdersListQueryParams) {
  const params = new URLSearchParams();
  params.set("orderType", query.orderType);
  params.set("page", String(Math.max(1, query.page)));
  params.set("limit", String(Math.max(1, query.limit)));

  if (query.orderId) params.set("orderId", query.orderId);
  if (query.vendorId) params.set("vendorId", query.vendorId);
  if (query.eventDate) params.set("eventDate", query.eventDate);
  if (query.cancellationStatus) {
    params.set("cancellationStatus", query.cancellationStatus);
  }
  if (query.status) params.set("status", query.status);
  if (query.updatedInLast4Days) {
    params.set("updatedInLast4Days", query.updatedInLast4Days);
  }

  return params.toString();
}

/** GET /admin/orders?orderType=&page=&limit= */
export async function getOrders(query: OrdersListQueryParams) {
  const payload = await api.get<OrdersListApiResponse>(
    `${ORDER_ENDPOINTS.list}?${toOrdersSearch(query)}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load orders.",
      400,
      payload,
    );
  }

  const items = payload.data?.data ?? [];
  return {
    items,
    pagination: {
      page: toCount(payload.data?.pagination?.page, query.page),
      limit: toCount(payload.data?.pagination?.limit, query.limit),
      total: toCount(payload.data?.pagination?.total, items.length),
      totalPages: toCount(payload.data?.pagination?.totalPages, 1),
    },
  };
}

export type OrderDetailApiBilingual = {
  en?: string;
  ar?: string;
};

export type OrderDetailApiHistoryItem = {
  date?: string;
  status?: string;
  by?: string;
};

export type OrderDetailApiCancelationRequest = {
  _id?: string;
  id?: string;
  initiator?: string;
  initiatedDate?: string;
  initiatedAt?: string;
  cancellationReason?: string;
  cancelationReason?: string;
  decided?: boolean | null;
  decidedBy?: string | null;
  decidedDate?: string | null;
  approved?: boolean | null;
};

export type OrderDetailApiData = {
  orderId?: number | string;
  status?: string;
  orderDetails?: {
    status?: string;
    orderDate?: string;
    eventDate?: string;
  };
  paymentDetails?: {
    paymentMethod?: string;
    paymentStatus?: string;
    subTotal?: number | string;
    deliveryCharges?: number | string;
    totalPrice?: number | string;
  };
  customerAddress?: {
    area?: OrderDetailApiBilingual;
    zone?: OrderDetailApiBilingual;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    mobile?: string;
    mapsUrl?: string;
  };
  orderHistory?: OrderDetailApiHistoryItem[];
  cancelationRequests?: OrderDetailApiCancelationRequest[];
  cancellationRequests?: OrderDetailApiCancelationRequest[];
  vendor?: {
    name?: OrderDetailApiBilingual;
    rating?: number | null;
    reviewCount?: number | null;
  };
  customer?: {
    name?: string;
    mobile?: string;
    email?: string;
    joinDate?: string;
  };
};

export type OrderDetailApiResponse = {
  status?: boolean;
  message?: string;
  data?: OrderDetailApiData;
};

/** GET /admin/orders/orderDetails/:id */
export async function getOrderDetails(orderId: string) {
  const payload = await api.get<OrderDetailApiResponse>(
    `${ORDER_ENDPOINTS.details}/${encodeURIComponent(orderId)}`,
  );

  if (payload?.status === false || !payload.data) {
    throw new ApiError(
      payload.message ?? "Could not load order details.",
      400,
      payload,
    );
  }

  return payload.data;
}
