import type {
  CustomerRecord,
  CustomersQuery,
  CustomersResponse,
} from "@/lib/types";

const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: "cust-1",
    name: "Maryam Albuainain",
    orderCount: 56,
    totalSpent: 42213,
    currency: "QR",
    lastOrderedAt: "2026-08-28T14:22:00.000Z",
  },
  {
    id: "cust-2",
    name: "Ahmed Al-Kuwari",
    orderCount: 48,
    totalSpent: 38950,
    currency: "QR",
    lastOrderedAt: "2026-08-27T09:15:00.000Z",
  },
  {
    id: "cust-3",
    name: "Sara Al-Thani",
    orderCount: 42,
    totalSpent: 35120,
    currency: "QR",
    lastOrderedAt: "2026-08-26T18:40:00.000Z",
  },
  {
    id: "cust-4",
    name: "Khalid Mansour",
    orderCount: 39,
    totalSpent: 29840,
    currency: "QR",
    lastOrderedAt: "2026-08-25T11:05:00.000Z",
  },
  {
    id: "cust-5",
    name: "Noora Al-Ansari",
    orderCount: 37,
    totalSpent: 27610,
    currency: "QR",
    lastOrderedAt: "2026-08-24T16:30:00.000Z",
  },
  {
    id: "cust-6",
    name: "Omar Hassan",
    orderCount: 34,
    totalSpent: 25400,
    currency: "QR",
    lastOrderedAt: "2026-08-23T08:50:00.000Z",
  },
  {
    id: "cust-7",
    name: "Fatima Al-Mohannadi",
    orderCount: 31,
    totalSpent: 23150,
    currency: "QR",
    lastOrderedAt: "2026-08-22T20:10:00.000Z",
  },
  {
    id: "cust-8",
    name: "Yousef Al-Marri",
    orderCount: 29,
    totalSpent: 21890,
    currency: "QR",
    lastOrderedAt: "2026-08-21T13:25:00.000Z",
  },
  {
    id: "cust-9",
    name: "Hessa Al-Naimi",
    orderCount: 27,
    totalSpent: 20110,
    currency: "QR",
    lastOrderedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "cust-10",
    name: "Jassim Al-Kuwari",
    orderCount: 25,
    totalSpent: 18940,
    currency: "QR",
    lastOrderedAt: "2026-08-19T15:45:00.000Z",
  },
  {
    id: "cust-11",
    name: "Aisha Rahman",
    orderCount: 24,
    totalSpent: 17620,
    currency: "QR",
    lastOrderedAt: "2026-08-18T12:30:00.000Z",
  },
  {
    id: "cust-12",
    name: "Mohammed Saleh",
    orderCount: 22,
    totalSpent: 16480,
    currency: "QR",
    lastOrderedAt: "2026-08-17T09:20:00.000Z",
  },
  {
    id: "cust-13",
    name: "Layla Al-Emadi",
    orderCount: 19,
    totalSpent: 14250,
    currency: "QR",
    lastOrderedAt: "2026-08-15T17:55:00.000Z",
  },
  {
    id: "cust-14",
    name: "Faisal Al-Dosari",
    orderCount: 15,
    totalSpent: 11890,
    currency: "QR",
    lastOrderedAt: "2026-08-12T14:10:00.000Z",
  },
  {
    id: "cust-15",
    name: "Amna Al-Farsi",
    orderCount: 9,
    totalSpent: 6540,
    currency: "QR",
    lastOrderedAt: "2026-08-08T11:40:00.000Z",
  },
];

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
