import type {
  CustomerRecord,
  CustomersQuery,
  CustomersResponse,
} from "@/lib/types";
import {
  getCustomers,
  type CustomerApiItem,
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
