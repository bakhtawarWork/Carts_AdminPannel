import type {
  OrderRecord,
  OrderVendorOption,
  OrdersQuery,
  OrdersResponse,
  OrderDetail,
} from "@/lib/types";

const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "ord-1000860",
    orderNumber: 1000860,
    vendorId: "v-larc",
    vendorEnglish: "LARC",
    vendorArabic: "لارك",
    orderDate: "2026-03-27T15:19:00.000Z",
    deliveryDate: "2026-03-31T15:00:00.000Z",
    status: "onhold",
    statusUpdatedAt: "2026-03-27T15:19:00.000Z",
    isLate: true,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 3600,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000856",
    orderNumber: 1000856,
    vendorId: "v-sultan",
    vendorEnglish: "Al Sultan",
    vendorArabic: "السلطان",
    orderDate: "2026-03-25T18:05:00.000Z",
    deliveryDate: "2026-03-28T18:00:00.000Z",
    status: "onhold",
    statusUpdatedAt: "2026-03-25T18:05:00.000Z",
    isLate: true,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 1800,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000850",
    orderNumber: 1000850,
    vendorId: "v-sultan",
    vendorEnglish: "Al Sultan",
    vendorArabic: "السلطان",
    orderDate: "2026-03-24T11:30:00.000Z",
    deliveryDate: "2026-03-27T11:30:00.000Z",
    status: "onhold",
    statusUpdatedAt: "2026-03-24T11:30:00.000Z",
    isLate: true,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 1800,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000845",
    orderNumber: 1000845,
    vendorId: "v-larc",
    vendorEnglish: "LARC",
    vendorArabic: "لارك",
    orderDate: "2026-03-23T08:15:00.000Z",
    deliveryDate: "2026-03-26T08:00:00.000Z",
    status: "onhold",
    statusUpdatedAt: "2026-03-23T08:15:00.000Z",
    isLate: true,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 3600,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000838",
    orderNumber: 1000838,
    vendorId: "v-melenzane",
    vendorEnglish: "Melenzane",
    vendorArabic: "ملنزاني",
    orderDate: "2026-08-28T10:00:00.000Z",
    deliveryDate: "2026-08-30T14:00:00.000Z",
    status: "confirmed",
    statusUpdatedAt: "2026-08-29T09:12:00.000Z",
    isLate: false,
    paymentMethod: "Card",
    paymentStatus: "successful",
    totalPrice: 2450,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000831",
    orderNumber: 1000831,
    vendorId: "v-exit55",
    vendorEnglish: "Exit 55",
    vendorArabic: "اكزت ٥٥",
    orderDate: "2026-08-27T16:45:00.000Z",
    deliveryDate: "2026-08-29T12:00:00.000Z",
    status: "preparing",
    statusUpdatedAt: "2026-08-30T08:30:00.000Z",
    isLate: false,
    paymentMethod: "Online",
    paymentStatus: "successful",
    totalPrice: 5200,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000824",
    orderNumber: 1000824,
    vendorId: "v-larc",
    vendorEnglish: "LARC",
    vendorArabic: "لارك",
    orderDate: "2026-08-26T07:20:00.000Z",
    deliveryDate: "2026-08-28T18:30:00.000Z",
    status: "onhold",
    statusUpdatedAt: "2026-08-27T11:00:00.000Z",
    isLate: false,
    paymentMethod: "Cash",
    paymentStatus: "pending",
    totalPrice: 4100,
    currency: "QR",
    isCancelled: false,
    isCompleted: false,
  },
  {
    id: "ord-1000815",
    orderNumber: 1000815,
    vendorId: "v-sable",
    vendorEnglish: "Sable Sweets",
    vendorArabic: "حلويات سابليه",
    orderDate: "2026-08-25T13:10:00.000Z",
    deliveryDate: "2026-08-27T09:00:00.000Z",
    status: "cancelled",
    statusUpdatedAt: "2026-08-26T10:05:00.000Z",
    isLate: false,
    paymentMethod: "Card",
    paymentStatus: "failed",
    totalPrice: 950,
    currency: "QR",
    isCancelled: true,
    isCompleted: false,
  },
  {
    id: "ord-1000802",
    orderNumber: 1000802,
    vendorId: "v-pearl",
    vendorEnglish: "Pearl Events",
    vendorArabic: "لؤلؤة للمناسبات",
    orderDate: "2026-08-20T09:00:00.000Z",
    deliveryDate: "2026-08-22T17:00:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-08-22T17:45:00.000Z",
    isLate: false,
    paymentMethod: "Online",
    paymentStatus: "successful",
    totalPrice: 7800,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
  {
    id: "ord-1000795",
    orderNumber: 1000795,
    vendorId: "v-sultan",
    vendorEnglish: "Al Sultan",
    vendorArabic: "السلطان",
    orderDate: "2026-08-18T11:30:00.000Z",
    deliveryDate: "2026-08-20T19:00:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-08-20T19:30:00.000Z",
    isLate: false,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 2200,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
  {
    id: "ord-1000788",
    orderNumber: 1000788,
    vendorId: "v-melenzane",
    vendorEnglish: "Melenzane",
    vendorArabic: "ملنزاني",
    orderDate: "2026-08-15T14:20:00.000Z",
    deliveryDate: "2026-08-17T12:00:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-08-17T12:15:00.000Z",
    isLate: false,
    paymentMethod: "Card",
    paymentStatus: "successful",
    totalPrice: 1650,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
  {
    id: "ord-1000771",
    orderNumber: 1000771,
    vendorId: "v-exit55",
    vendorEnglish: "Exit 55",
    vendorArabic: "اكزت ٥٥",
    orderDate: "2026-08-10T08:45:00.000Z",
    deliveryDate: "2026-08-12T20:00:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-08-12T20:10:00.000Z",
    isLate: false,
    paymentMethod: "Online",
    paymentStatus: "successful",
    totalPrice: 6300,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
  {
    id: "ord-1000760",
    orderNumber: 1000760,
    vendorId: "v-larc",
    vendorEnglish: "LARC",
    vendorArabic: "لارك",
    orderDate: "2026-08-05T10:00:00.000Z",
    deliveryDate: "2026-08-07T16:00:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-08-07T16:20:00.000Z",
    isLate: false,
    paymentMethod: "Cash",
    paymentStatus: "successful",
    totalPrice: 3900,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
  {
    id: "ord-1000752",
    orderNumber: 1000752,
    vendorId: "v-sable",
    vendorEnglish: "Sable Sweets",
    vendorArabic: "حلويات سابليه",
    orderDate: "2026-07-28T12:00:00.000Z",
    deliveryDate: "2026-07-30T10:30:00.000Z",
    status: "delivered",
    statusUpdatedAt: "2026-07-30T10:45:00.000Z",
    isLate: false,
    paymentMethod: "Card",
    paymentStatus: "successful",
    totalPrice: 1100,
    currency: "QR",
    isCancelled: false,
    isCompleted: true,
  },
];

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "onhold", label: "On hold" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "delivered", label: "Delivered" },
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

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatOrderDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string, base = Date.now()) {
  const target = new Date(value).getTime();
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

export function formatPaymentLine(
  method: string,
  status: string,
): string {
  return `${method} (${status})`;
}

function toDayStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

function toDayEnd(value: string) {
  return new Date(`${value}T23:59:59.999Z`).getTime();
}

function isWithinLast4Days(value: string, now = Date.now()) {
  const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
  const stamp = new Date(value).getTime();
  return stamp >= fourDaysAgo && stamp <= now;
}

function filterOrders(orders: OrderRecord[], query: OrdersQuery) {
  const orderIdNeedle = query.orderId?.trim() ?? "";
  const eventDay = query.eventDate ? toDayStart(query.eventDate) : null;
  const eventDayEnd = query.eventDate ? toDayEnd(query.eventDate) : null;

  return orders
    .filter((order) => {
      const matchesTab =
        query.tab === "completed" ? order.isCompleted : !order.isCompleted;
      if (!matchesTab) return false;

      if (orderIdNeedle && !String(order.orderNumber).includes(orderIdNeedle)) {
        return false;
      }

      if (query.vendorId && order.vendorId !== query.vendorId) return false;

      if (eventDay !== null && eventDayEnd !== null) {
        const delivery = new Date(order.deliveryDate).getTime();
        if (delivery < eventDay || delivery > eventDayEnd) return false;
      }

      if (query.cancellationStatus === "cancelled" && !order.isCancelled) {
        return false;
      }
      if (query.cancellationStatus === "not_cancelled" && order.isCancelled) {
        return false;
      }

      if (query.orderStatus && order.status !== query.orderStatus) return false;

      if (query.updatedInLast4Days === "yes") {
        if (!isWithinLast4Days(order.statusUpdatedAt)) return false;
      }
      if (query.updatedInLast4Days === "no") {
        if (isWithinLast4Days(order.statusUpdatedAt)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const diff =
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      return query.sortDir === "asc" ? diff : -diff;
    });
}

export function getOrderVendorOptions(): OrderVendorOption[] {
  const seen = new Map<string, OrderVendorOption>();
  for (const order of MOCK_ORDERS) {
    if (!seen.has(order.vendorId)) {
      seen.set(order.vendorId, {
        id: order.vendorId,
        label: `${order.vendorEnglish} / ${order.vendorArabic}`,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

/** Swap this for a real API call when available. */
export async function fetchOrders(query: OrdersQuery): Promise<OrdersResponse> {
  await delay();

  const filtered = filterOrders(MOCK_ORDERS, query);
  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize).map((order) => ({ ...order })),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function fetchOrdersForExport(
  query: Omit<OrdersQuery, "page" | "pageSize">,
): Promise<OrderRecord[]> {
  await delay(120);
  return filterOrders(MOCK_ORDERS, {
    ...query,
    page: 1,
    pageSize: MOCK_ORDERS.length,
  });
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

export function getOrderById(id: string) {
  return MOCK_ORDERS.find((order) => order.id === id) ?? null;
}

const ORDER_DETAIL_OVERRIDES: Record<string, Partial<OrderDetail>> = {
  "ord-1000860": {
    subTotal: 3600,
    deliveryCharges: 0,
    address: {
      zoneEnglish: "Doha Center",
      zoneArabic: "مركز الدوحة",
      areaEnglish: "Al Jasra",
      areaArabic: "الجسرة",
      street: "Doha",
      building: "",
      floor: "",
      apartment: "",
      mobile: "+97456588886",
      mapsUrl: "https://maps.google.com/?q=Al+Jasra,Doha,Qatar",
    },
    customer: {
      name: "test",
      mobile: "+97456588886",
      email: "test11@gmail.com",
      joinDate: "2026-02-06T00:00:00.000Z",
    },
    vendor: {
      englishName: "LARC",
      arabicName: "لارك",
      rating: null,
      reviewCount: 0,
    },
    history: [
      {
        id: "hist-1",
        date: "2026-03-27T15:19:00.000Z",
        status: "onhold",
        by: "customer",
      },
    ],
    cancellationRequests: [
      {
        id: "cancel-req-1",
        initiator: "customer",
        initiatedDate: "2026-08-31T10:25:00.000Z",
        cancellationReason: "",
        decided: false,
        decidedBy: null,
        decidedDate: null,
        approved: null,
      },
    ],
  },
};

function buildOrderDetail(order: OrderRecord): OrderDetail {
  const override = ORDER_DETAIL_OVERRIDES[order.id] ?? {};
  return {
    ...order,
    subTotal: override.subTotal ?? order.totalPrice,
    deliveryCharges: override.deliveryCharges ?? 0,
    address: override.address ?? {
      zoneEnglish: "Doha",
      zoneArabic: "الدوحة",
      areaEnglish: "Central",
      areaArabic: "وسط",
      street: "Doha",
      building: "",
      floor: "",
      apartment: "",
      mobile: "+97400000000",
      mapsUrl: "https://maps.google.com/?q=Doha,Qatar",
    },
    customer: override.customer ?? {
      name: "Guest customer",
      mobile: "+97400000000",
      email: "guest@example.com",
      joinDate: order.orderDate,
    },
    vendor: override.vendor ?? {
      englishName: order.vendorEnglish,
      arabicName: order.vendorArabic,
      rating: 85,
      reviewCount: 12,
    },
    history: override.history ?? [
      {
        id: `${order.id}-hist-1`,
        date: order.orderDate,
        status: order.status,
        by: "customer",
      },
    ],
    cancellationRequests: override.cancellationRequests ?? [],
  };
}

/** Swap for a real API call when available. */
export async function fetchOrderDetail(id: string): Promise<OrderDetail | null> {
  await delay();
  const order = getOrderById(id);
  if (!order) return null;
  return buildOrderDetail(order);
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
