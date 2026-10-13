import type {
  CustomerRecord,
  CustomersQuery,
  CustomersResponse,
} from "@/lib/types";
import type { CustomerOrderRecord, CustomerProfile } from "@/lib/types";
import {
  getCustomerOrderDetails,
  getCustomerOrders,
  getCustomers,
  type CustomerApiItem,
  type CustomerOrderApiItem,
  type CustomerUserDetailsApi,
} from "@/services/customers";

const customerCache = new Map<string, CustomerRecord>();

function cleanName(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function mapCustomer(item: CustomerApiItem): CustomerRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  const record: CustomerRecord = {
    id,
    name: cleanName(item.name) || "—",
    orderCount: toCount(item.noOfOrders),
    totalSpent: toCount(item.totalMoneySpent),
    currency: "QR",
    lastOrderedAt: item.lastOrderDate ?? "",
  };

  customerCache.set(id, record);
  return record;
}

function rememberCustomers(items: CustomerRecord[]) {
  for (const item of items) {
    customerCache.set(item.id, item);
  }
}

export function formatCustomerMoney(amount: number, currency = "QR") {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

export function formatCustomerLastOrdered(value: string) {
  return formatCustomerDateTime(value);
}

export function formatCustomerDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function moneySpentFromDetails(
  value: CustomerUserDetailsApi["totalMoneySpent"],
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { total: value, count: 0 };
  }

  if (!Array.isArray(value) || value.length === 0) {
    return { total: 0, count: 0 };
  }

  const total = value.reduce(
    (sum, entry) => sum + toCount(entry.total),
    0,
  );
  const count = value.reduce((sum, entry) => sum + toCount(entry.count), 0);
  return { total, count };
}

function mapCustomerProfile(details: CustomerUserDetailsApi): CustomerProfile | null {
  const id = details._id ?? details.id;
  if (!id) return null;

  const spend = moneySpentFromDetails(details.totalMoneySpent);

  return {
    id,
    name: cleanName(details.name) || "—",
    email: cleanName(details.email) || "—",
    mobile: cleanName(details.mobile) || "—",
    preferredLanguage: cleanName(details.preferredLanguage) || "—",
    smsVerified: Boolean(details.smsVerified),
    isBlocked: Boolean(details.isBlocked),
    createdAt: details.createdAt ?? "",
    totalNoOfOrders: toCount(details.totalNoOfOrders),
    successfulOrders: toCount(details.successfulOrders),
    cancelledOrders: toCount(details.cancelledOrders),
    activeOrders: toCount(details.activeOrders),
    rejectedOrders: toCount(details.rejectedOrders),
    totalMoneySpent: spend.total,
    successfulOrderCount: spend.count,
    currency: "QR",
  };
}

function mapCustomerOrder(item: CustomerOrderApiItem): CustomerOrderRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  const orderId =
    item.orderId !== undefined && item.orderId !== null
      ? String(item.orderId)
      : id;

  return {
    id,
    orderId,
    status: cleanName(item.status) || "—",
    eventDate: item.eventDate ?? "",
    createdAt: item.createdAt ?? "",
    paymentMethod: cleanName(item.payment?.method) || "—",
    paymentStatus: cleanName(item.payment?.status) || "—",
    totalPrice: toCount(item.payment?.totalPrice),
    currency: "QR",
  };
}

/** GET /admin/customers/:id/orders */
export async function fetchCustomerOrders(
  customerId: string,
): Promise<CustomerOrderRecord[]> {
  const orders = await getCustomerOrders(customerId);

  return orders
    .map(mapCustomerOrder)
    .filter((order): order is CustomerOrderRecord => order !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

/** GET /admin/customers/:id/order-details */
export async function fetchCustomerProfile(
  id: string,
): Promise<CustomerProfile | null> {
  const details = await getCustomerOrderDetails(id);
  const profile = mapCustomerProfile(details);
  if (!profile) return null;

  customerCache.set(profile.id, {
    id: profile.id,
    name: profile.name,
    orderCount: profile.totalNoOfOrders,
    totalSpent: profile.totalMoneySpent,
    currency: profile.currency,
    lastOrderedAt: "",
  });

  return profile;
}

/** GET /admin/customers */
export async function fetchCustomers(
  query: CustomersQuery,
): Promise<CustomersResponse> {
  const page = Math.max(1, query.page);
  const pageSize = Math.max(1, query.pageSize);
  const payload = await getCustomers({
    page,
    limit: pageSize,
    search: query.name,
  });

  const items = payload.users
    .map(mapCustomer)
    .filter((customer): customer is CustomerRecord => customer !== null);

  rememberCustomers(items);

  return {
    items,
    total: payload.pagination.total,
    page: payload.pagination.page,
    pageSize: payload.pagination.limit || pageSize,
  };
}

/** Uses cache from list loads; otherwise scans paginated list until the id is found. */
export async function fetchCustomerById(
  id: string,
): Promise<CustomerRecord | null> {
  const cached = customerCache.get(id);
  if (cached) return { ...cached };

  const limit = 50;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const payload = await getCustomers({ page, limit });
    totalPages = Math.max(1, payload.pagination.totalPages);

    for (const user of payload.users) {
      const record = mapCustomer(user);
      if (record?.id === id) return record;
    }

    page += 1;
  }

  return customerCache.get(id) ?? null;
}
