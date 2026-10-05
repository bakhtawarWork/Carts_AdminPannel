import type { VendorRecord, VendorsQuery, VendorsResponse } from "@/lib/types";
import {
  getDraftVendors,
  getVendors,
  type VendorListApiItem,
} from "@/services/vendors";

const vendorCache = new Map<string, VendorRecord>();

function cleanName(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function mapVendor(
  item: VendorListApiItem,
  isDraft: boolean,
): VendorRecord | null {
  const id = item._id ?? item.id;
  if (!id || item._deleted) return null;

  return {
    id,
    published: Boolean(item.published),
    isDraft,
    englishName: cleanName(item.name?.en),
    arabicName: cleanName(item.name?.ar),
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

function rememberVendors(items: VendorRecord[]) {
  for (const item of items) {
    vendorCache.set(item.id, item);
  }
}

function statusFromQuery(query: VendorsQuery) {
  if (query.published === "published") return "published";
  if (query.published === "unpublished") return "unpublished";
  return undefined;
}

export function formatVendorDate(value: string) {
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

/** GET /admin/vendors or GET /admin/vendors/draft — page & limit always; other params only when set. */
export async function fetchVendors(
  query: VendorsQuery,
): Promise<VendorsResponse> {
  const name = query.name?.trim();
  const isDraft = query.tab === "draft";
  const listQuery = {
    page: Math.max(1, query.page),
    limit: Math.max(1, query.pageSize),
    name: name || undefined,
    createdFrom: query.createdFrom || undefined,
    createdTo: query.createdTo || undefined,
    updatedFrom: query.updatedFrom || undefined,
    updatedTo: query.updatedTo || undefined,
  };
  const payload = isDraft
    ? await getDraftVendors(listQuery)
    : await getVendors({
        ...listQuery,
        status: statusFromQuery(query),
      });

  const items = payload.vendors
    .map((item) => mapVendor(item, isDraft))
    .filter((item): item is VendorRecord => item !== null);

  rememberVendors(items);

  return {
    items,
    total: payload.total,
    page: Math.max(1, query.page),
    pageSize: Math.max(1, query.pageSize),
  };
}

export function getVendorById(id: string) {
  return vendorCache.get(id) ?? null;
}
