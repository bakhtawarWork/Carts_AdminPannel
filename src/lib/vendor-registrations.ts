import type {
  VendorRegistrationCategory,
  VendorRegistrationLicensed,
  VendorRegistrationRecord,
  VendorRegistrationsQuery,
  VendorRegistrationsResponse,
} from "@/lib/types";
import {
  getVendorRegistrations,
  type VendorRegistrationApiItem,
} from "@/services/vendors";
import { VENDOR_ENDPOINTS } from "@/services/endpoints";

const MOCK_REGISTRATION_API_ITEMS: VendorRegistrationApiItem[] = [
  {
    _id: "6a9ffef6b8e3b987ebdef996",
    businessName: "Artisan Pizza & Carts",
    category: "restaurant",
    licensed: "Yes",
    instagram: "@artisanpizza",
    contact: {
      name: "Ahmed Ali",
      email: "ahmed@example.com",
      phone: "+965 99112233",
    },
    createdAt: "2026-09-08T12:26:30.463Z",
    updatedAt: "2026-09-08T12:26:30.463Z",
    __v: 0,
  },
  {
    _id: "vr-1",
    businessName: "Test",
    category: "setups",
    licensed: "Yes",
    instagram: "bakhtawar.j@reapmind.com",
    contact: {
      name: "Bakhtawar Jamadar",
      email: "bakhtawar0111@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-09-04T10:00:00.000Z",
    updatedAt: "2025-09-04T10:00:00.000Z",
  },
  {
    _id: "vr-2",
    businessName: "Test",
    category: "setups",
    licensed: "Yes",
    instagram: "Bakagak",
    contact: {
      name: "Fi frun",
      email: "test01@gmail.com",
      phone: "+917 (70) 934 6780",
    },
    createdAt: "2025-09-04T09:30:00.000Z",
    updatedAt: "2025-09-04T09:30:00.000Z",
  },
  {
    _id: "vr-3",
    businessName: "Bakhtawar",
    category: "setups",
    licensed: "Yes",
    instagram: "Bakagak",
    contact: {
      name: "Bakhtawar Jamadar",
      email: "bakhtawar0111@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-07-21T14:15:00.000Z",
    updatedAt: "2025-07-21T14:15:00.000Z",
  },
  {
    _id: "vr-4",
    businessName: "Testing",
    category: "restaurant",
    licensed: "Yes",
    instagram: "Test",
    contact: {
      name: "Bakhtawar Jamadar",
      email: "bakhtawar0111@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-07-07T11:00:00.000Z",
    updatedAt: "2025-07-07T11:00:00.000Z",
  },
  {
    _id: "vr-5",
    businessName: "Bakhtawar",
    category: "setups",
    licensed: "Yes",
    instagram: "Bakagak",
    contact: {
      name: "Bakhtawar Jamadar",
      email: "bakhtawar0111@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-06-22T16:45:00.000Z",
    updatedAt: "2025-06-22T16:45:00.000Z",
  },
  {
    _id: "vr-6",
    businessName: "Bakhtawar",
    category: "setups",
    licensed: "Yes",
    instagram: "Test",
    contact: {
      name: "Bakeri",
      email: "test01@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-03-19T08:20:00.000Z",
    updatedAt: "2025-03-19T08:20:00.000Z",
  },
  {
    _id: "vr-7",
    businessName: "Testing",
    category: "restaurant",
    licensed: "Yes",
    instagram: "Test",
    contact: {
      name: "Baker",
      email: "test01@gmail.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2025-03-08T13:10:00.000Z",
    updatedAt: "2025-03-08T13:10:00.000Z",
  },
  {
    _id: "vr-8",
    businessName: "Qwerty business",
    category: "restaurant",
    licensed: "Yes",
    instagram: "HTTPS://qwertt.co",
    contact: {
      name: "Aafan Momin",
      email: "ewetrtt@reapmind.com",
      phone: "+974 (56) 588 886",
    },
    createdAt: "2024-09-18T10:30:00.000Z",
    updatedAt: "2024-09-18T10:30:00.000Z",
  },
];

export const REGISTRATION_CATEGORY_OPTIONS: {
  value: VendorRegistrationCategory | "";
  label: string;
}[] = [
  { value: "", label: "All categories" },
  { value: "setups", label: "Setups" },
  { value: "restaurant", label: "Restaurant" },
];

export const LICENSED_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "yes", label: "Licensed" },
  { value: "no", label: "Not licensed" },
] as const;

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDayStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

function toDayEnd(value: string) {
  return new Date(`${value}T23:59:59.999Z`).getTime();
}

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

export function isRegistrationLicensed(
  licensed: VendorRegistrationLicensed | string,
) {
  return licensed.trim().toLowerCase() === "yes";
}

export function formatRegistrationDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCategoryLabel(category: VendorRegistrationCategory) {
  return category === "setups" ? "Setups" : "Restaurant";
}

export function instagramHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("@") && trimmed.includes(".")) {
    return `mailto:${trimmed}`;
  }

  const handle = trimmed.replace(/^@/, "");
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

function toCategory(value?: string): VendorRegistrationCategory {
  return value === "restaurant" ? "restaurant" : "setups";
}

function toLicensed(value?: string): VendorRegistrationLicensed {
  return isRegistrationLicensed(value ?? "") ? "Yes" : "No";
}

export function mapVendorRegistration(
  item: VendorRegistrationApiItem,
): VendorRegistrationRecord | null {
  const id = clean(item._id) || clean(item.id);
  if (!id) return null;

  return {
    _id: id,
    businessName: clean(item.businessName),
    category: toCategory(item.category),
    licensed: toLicensed(item.licensed),
    instagram: clean(item.instagram),
    contact: {
      name: clean(item.contact?.name),
      email: clean(item.contact?.email),
      phone: clean(item.contact?.phone),
    },
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

function filterRegistrations(
  items: VendorRegistrationRecord[],
  query: VendorRegistrationsQuery,
) {
  const companyNeedle = query.company?.trim().toLowerCase() ?? "";
  const createdFrom = query.createdFrom ? toDayStart(query.createdFrom) : null;
  const createdTo = query.createdTo ? toDayEnd(query.createdTo) : null;

  return items.filter((item) => {
    if (companyNeedle) {
      const haystack = [
        item.businessName,
        item.contact.name,
        item.contact.email,
        item.contact.phone,
        item.instagram,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(companyNeedle)) return false;
    }

    if (query.category && item.category !== query.category) return false;

    if (query.licensed === "yes" && !isRegistrationLicensed(item.licensed)) {
      return false;
    }
    if (query.licensed === "no" && isRegistrationLicensed(item.licensed)) {
      return false;
    }

    const createdAt = new Date(item.createdAt).getTime();
    if (createdFrom !== null && createdAt < createdFrom) return false;
    if (createdTo !== null && createdAt > createdTo) return false;

    return true;
  });
}

function paginateRegistrations(
  items: VendorRegistrationRecord[],
  query: VendorRegistrationsQuery,
): VendorRegistrationsResponse {
  const sortDir = query.sortDir ?? "desc";
  const filtered = filterRegistrations(items, query).sort((left, right) => {
    const delta =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return sortDir === "asc" ? delta : -delta;
  });

  const page = Math.max(1, query.page);
  const pageSize = Math.max(1, query.pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

async function fetchMockVendorRegistrations(
  query: VendorRegistrationsQuery,
): Promise<VendorRegistrationsResponse> {
  await delay();

  const items = MOCK_REGISTRATION_API_ITEMS.map(mapVendorRegistration).filter(
    (item): item is VendorRegistrationRecord => item !== null,
  );

  return paginateRegistrations(items, query);
}

/** GET vendor registrations. Uses mock data until the endpoint path is set. */
export async function fetchVendorRegistrations(
  query: VendorRegistrationsQuery,
): Promise<VendorRegistrationsResponse> {
  if (!VENDOR_ENDPOINTS.registrations) {
    return fetchMockVendorRegistrations(query);
  }

  const licensed =
    query.licensed === "yes"
      ? "Yes"
      : query.licensed === "no"
        ? "No"
        : undefined;

  const payload = await getVendorRegistrations({
    page: Math.max(1, query.page),
    limit: Math.max(1, query.pageSize),
    businessName: query.company?.trim() || undefined,
    category: query.category || undefined,
    licensed,
    createdFrom: query.createdFrom || undefined,
    createdTo: query.createdTo || undefined,
    sortDir: query.sortDir,
  });

  const items = payload.result
    .map(mapVendorRegistration)
    .filter((item): item is VendorRegistrationRecord => item !== null);

  return {
    items,
    total: payload.paging.total,
    page: payload.paging.page,
    pageSize: payload.paging.limit,
  };
}
