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

/** GET /admin/vendors/registrations */
export async function fetchVendorRegistrations(
  query: VendorRegistrationsQuery,
): Promise<VendorRegistrationsResponse> {
  const payload = await getVendorRegistrations({
    page: Math.max(1, query.page),
    limit: Math.max(1, query.pageSize),
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
