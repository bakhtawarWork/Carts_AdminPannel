import type {
  OrderCancellationRequest,
  OrderDetail,
  OrderHistoryEntry,
  OrderListTab,
  OrderRecord,
  OrdersQuery,
  OrdersResponse,
  OrderStatus,
} from "@/lib/types";
import {
  getOrderDetails,
  getOrders,
  type OrderDetailApiCancelationRequest,
  type OrderDetailApiData,
  type OrderDetailApiHistoryItem,
  type OrderListApiItem,
  type OrdersListQueryParams,
} from "@/services/orders";

const DEFAULT_CURRENCY = "QAR";

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "onhold", label: "On hold" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const CANCELLATION_STATUS_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "cancelled", label: "Cancelled" },
  { value: "not_cancelled", label: "Not cancelled" },
] as const;

export const UPDATED_LAST_4_DAYS_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

function toOrdersApiQuery(query: OrdersQuery): OrdersListQueryParams {
  const cancellationStatus =
    query.cancellationStatus === "cancelled" ||
    query.cancellationStatus === "not_cancelled"
      ? query.cancellationStatus
      : undefined;

  const updatedInLast4Days =
    query.updatedInLast4Days === "yes" || query.updatedInLast4Days === "no"
      ? query.updatedInLast4Days
      : undefined;

  return {
    orderType: query.tab,
    page: Math.max(1, query.page),
    limit: Math.max(1, query.pageSize),
    orderId: query.orderId?.trim() || undefined,
    vendorId: query.vendorId?.trim() || undefined,
    eventDate: query.eventDate?.trim() || undefined,
    cancellationStatus,
    status: query.orderStatus?.trim() || undefined,
    updatedInLast4Days,
  };
}

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isCancelledStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  return normalized === "cancelled" || normalized === "canceled";
}

function toOrderStatus(value?: string): OrderStatus | string {
  const status = clean(value).toLowerCase();
  if (!status) return "onhold";
  if (status === "canceled") return "cancelled";
  return status;
}

export function mapOrderListItem(
  item: OrderListApiItem,
  tab: OrderListTab,
): OrderRecord | null {
  const orderNumber = toNumber(item.orderId, NaN);
  if (!Number.isFinite(orderNumber)) return null;

  const status = toOrderStatus(item.status);
  const eventDate = item.eventDate ?? "";

  return {
    id: String(orderNumber),
    orderNumber,
    vendorId: "",
    vendorEnglish: clean(item.vendor?.en),
    vendorArabic: clean(item.vendor?.ar),
    orderDate: eventDate,
    deliveryDate: eventDate,
    status,
    statusUpdatedAt: eventDate,
    isLate: false,
    paymentMethod: clean(item.paymentMethod) || "Cash",
    paymentStatus: clean(item.paymentStatus).toLowerCase() || "pending",
    totalPrice: toNumber(item.totalPrice),
    currency: DEFAULT_CURRENCY,
    isCancelled: isCancelledStatus(String(status)),
    isCompleted: tab === "completed",
  };
}

export function formatOrderDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value: string, base = Date.now()) {
  if (!value) return "";
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return "";

  const diffMs = target - base;
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMs < hour) {
    const minutes = Math.round(diffMs / minute);
    return `(${rtf.format(minutes, "minute")})`;
  }
  if (absMs < day) {
    const hours = Math.round(diffMs / hour);
    return `(${rtf.format(hours, "hour")})`;
  }
  if (absMs < month) {
    const days = Math.round(diffMs / day);
    return `(${rtf.format(days, "day")})`;
  }
  if (absMs < year) {
    const months = Math.round(diffMs / month);
    return `(${rtf.format(months, "month")})`;
  }
  const years = Math.round(diffMs / year);
  return `(${rtf.format(years, "year")})`;
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function formatPaymentLine(method: string, status: string): string {
  return `${method} (${status})`;
}

/** GET /admin/orders */
export async function fetchOrders(query: OrdersQuery): Promise<OrdersResponse> {
  const payload = await getOrders(toOrdersApiQuery(query));

  const items = payload.items
    .map((item) => mapOrderListItem(item, query.tab))
    .filter((item): item is OrderRecord => item !== null);

  return {
    items,
    total: payload.pagination.total,
    page: payload.pagination.page,
    pageSize: payload.pagination.limit,
  };
}

export async function fetchOrdersForExport(
  query: Omit<OrdersQuery, "page" | "pageSize">,
): Promise<OrderRecord[]> {
  const first = await getOrders(
    toOrdersApiQuery({ ...query, page: 1, pageSize: 20 }),
  );

  const total = Math.max(1, first.pagination.total);
  const payload =
    total <= first.items.length
      ? first
      : await getOrders(
          toOrdersApiQuery({ ...query, page: 1, pageSize: total }),
        );

  return payload.items
    .map((item) => mapOrderListItem(item, query.tab))
    .filter((item): item is OrderRecord => item !== null);
}

export function ordersToCsv(orders: OrderRecord[]) {
  const headers = [
    "Order Id",
    "Vendor",
    "Order Date",
    "Delivery Date",
    "Status",
    "Status Last Update",
    "Late",
    "Payment Method",
    "Payment Status",
    "Total Price",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    `${order.vendorEnglish} / ${order.vendorArabic}`,
    formatOrderDateTime(order.orderDate),
    formatOrderDateTime(order.deliveryDate),
    order.status,
    formatOrderDateTime(order.statusUpdatedAt),
    order.isLate ? "Late" : "",
    order.paymentMethod,
    order.paymentStatus,
    `${order.totalPrice} ${order.currency}`,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

export function downloadOrdersCsv(orders: OrderRecord[], filename: string) {
  const csv = ordersToCsv(orders);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function mapOrderHistoryEntry(
  item: OrderDetailApiHistoryItem,
  index: number,
): OrderHistoryEntry {
  return {
    id: `hist-${index}-${item.date ?? index}`,
    date: item.date ?? "",
    status: toOrderStatus(item.status),
    by: clean(item.by) || "—",
  };
}

function mapCancellationRequest(
  item: OrderDetailApiCancelationRequest,
  index: number,
): OrderCancellationRequest {
  return {
    id: clean(item._id) || clean(item.id) || `cancel-${index}`,
    initiator: clean(item.initiator) || "—",
    initiatedDate: item.initiatedDate ?? item.initiatedAt ?? "",
    cancellationReason:
      clean(item.cancellationReason) || clean(item.cancelationReason),
    decided: typeof item.decided === "boolean" ? item.decided : null,
    decidedBy: item.decidedBy ? clean(item.decidedBy) : null,
    decidedDate: item.decidedDate ?? null,
    approved: typeof item.approved === "boolean" ? item.approved : null,
  };
}

function mapOrderDetail(data: OrderDetailApiData): OrderDetail | null {
  const orderNumber = toNumber(data.orderId, NaN);
  if (!Number.isFinite(orderNumber)) return null;

  const status = toOrderStatus(data.status ?? data.orderDetails?.status);
  const orderDate = data.orderDetails?.orderDate ?? "";
  const eventDate = data.orderDetails?.eventDate ?? "";
  const payment = data.paymentDetails;
  const address = data.customerAddress;
  const cancelRequests =
    data.cancelationRequests ?? data.cancellationRequests ?? [];

  return {
    id: String(orderNumber),
    orderNumber,
    vendorId: "",
    vendorEnglish: clean(data.vendor?.name?.en),
    vendorArabic: clean(data.vendor?.name?.ar),
    orderDate,
    deliveryDate: eventDate,
    status,
    statusUpdatedAt: orderDate,
    isLate: false,
    paymentMethod: clean(payment?.paymentMethod) || "Cash",
    paymentStatus: clean(payment?.paymentStatus).toLowerCase() || "pending",
    totalPrice: toNumber(payment?.totalPrice),
    currency: DEFAULT_CURRENCY,
    isCancelled: isCancelledStatus(String(status)),
    isCompleted: isCancelledStatus(String(status))
      ? true
      : String(status).toLowerCase() === "delivered",
    subTotal: toNumber(payment?.subTotal),
    deliveryCharges: toNumber(payment?.deliveryCharges),
    address: {
      zoneEnglish: clean(address?.zone?.en),
      zoneArabic: clean(address?.zone?.ar),
      areaEnglish: clean(address?.area?.en),
      areaArabic: clean(address?.area?.ar),
      street: clean(address?.street),
      building: clean(address?.building),
      floor: clean(address?.floor),
      apartment: clean(address?.apartment),
      mobile: clean(address?.mobile),
      mapsUrl: clean(address?.mapsUrl),
    },
    customer: {
      name: clean(data.customer?.name),
      mobile: clean(data.customer?.mobile),
      email: clean(data.customer?.email),
      joinDate: data.customer?.joinDate ?? "",
    },
    vendor: {
      englishName: clean(data.vendor?.name?.en),
      arabicName: clean(data.vendor?.name?.ar),
      rating:
        typeof data.vendor?.rating === "number" ? data.vendor.rating : null,
      reviewCount: toNumber(data.vendor?.reviewCount),
    },
    history: (data.orderHistory ?? []).map(mapOrderHistoryEntry),
    cancellationRequests: cancelRequests.map(mapCancellationRequest),
  };
}

/** GET /admin/orders/orderDetails/:id */
export async function fetchOrderDetail(id: string): Promise<OrderDetail | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const data = await getOrderDetails(trimmed);
  return mapOrderDetail(data);
}

export function formatJoinDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDecidedLabel(value: boolean | null) {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}

export function isCancellationPending(request: {
  decided: boolean | null;
}) {
  return request.decided === false || request.decided === null;
}

export function formatApprovedLabel(value: boolean | null) {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}
