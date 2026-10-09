import type {
  CustomerRecord,
  CustomersQuery,
  CustomersResponse,
} from "@/lib/types";

const MOCK_CUSTOMERS: CustomerRecord[] = [];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatCustomerMoney(amount: number, currency = "QR") {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

export function formatCustomerLastOrdered(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function filterCustomers(items: CustomerRecord[], query: CustomersQuery) {
  const nameNeedle = query.name?.trim().toLowerCase() ?? "";

  return items.filter((customer) => {
    if (!nameNeedle) return true;
    return customer.name.toLowerCase().includes(nameNeedle);
  });
}

export async function fetchCustomers(
  query: CustomersQuery,
): Promise<CustomersResponse> {
  await delay();

  const filtered = filterCustomers(MOCK_CUSTOMERS, query).sort(
    (left, right) =>
      new Date(right.lastOrderedAt).getTime() -
      new Date(left.lastOrderedAt).getTime(),
  );

  const start = (query.page - 1) * query.pageSize;
  const items = filtered.slice(start, start + query.pageSize);

  return {
    items,
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function fetchCustomerById(
  id: string,
): Promise<CustomerRecord | null> {
  await delay();
  return MOCK_CUSTOMERS.find((customer) => customer.id === id) ?? null;
}
