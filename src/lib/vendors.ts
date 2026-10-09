import type { VendorRecord, VendorsQuery, VendorsResponse } from "@/lib/types";
import {
  deleteVendor,
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

export async function removeVendor(id: string) {
  const result = await deleteVendor(id);
  vendorCache.delete(id);
  invalidateVendorFilterOptionsCache();
  return result;
}

export type VendorFilterOption = { id: string; label: string };

/** API allows limit ≤ 50; page through until all vendors are loaded for dropdowns. */
const VENDOR_OPTIONS_PAGE_SIZE = 50;

function vendorOptionFromRecord(vendor: VendorRecord): VendorFilterOption {
  return {
    id: vendor.id,
    label: vendor.arabicName
      ? `${vendor.englishName} / ${vendor.arabicName}`
      : vendor.englishName || vendor.id,
  };
}

function appendVendorOptions(
  options: VendorFilterOption[],
  seen: Set<string>,
  vendors: VendorListApiItem[],
) {
  const batch = vendors
    .map((item) => mapVendor(item, false))
    .filter((item): item is VendorRecord => item !== null);

  rememberVendors(batch);

  for (const vendor of batch) {
    if (seen.has(vendor.id)) continue;
    seen.add(vendor.id);
    options.push(vendorOptionFromRecord(vendor));
  }

  return batch.length;
}

/** Network load of every vendor page for dropdowns (page 1, then remaining pages in parallel). */
async function loadVendorFilterOptionsFromApi(): Promise<VendorFilterOption[]> {
  const options: VendorFilterOption[] = [];
  const seen = new Set<string>();

  const first = await getVendors({
    page: 1,
    limit: VENDOR_OPTIONS_PAGE_SIZE,
  });

  const firstCount = appendVendorOptions(options, seen, first.vendors);
  const total = first.total;
  const pageCount = Math.max(1, Math.ceil(total / VENDOR_OPTIONS_PAGE_SIZE));

  if (pageCount > 1 && firstCount > 0) {
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        getVendors({
          page: index + 2,
          limit: VENDOR_OPTIONS_PAGE_SIZE,
        }),
      ),
    );

    for (const payload of rest) {
      appendVendorOptions(options, seen, payload.vendors);
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

let vendorFilterOptionsCache: VendorFilterOption[] | null = null;
let vendorFilterOptionsLoad: Promise<VendorFilterOption[]> | null = null;

/**
 * Vendor options for dropdowns — fetched once per session, shared across screens.
 * Concurrent callers share the same in-flight promise.
 */
export function ensureVendorFilterOptionsLoaded(): Promise<VendorFilterOption[]> {
  if (vendorFilterOptionsCache) {
    return Promise.resolve(vendorFilterOptionsCache);
  }

  if (!vendorFilterOptionsLoad) {
    vendorFilterOptionsLoad = loadVendorFilterOptionsFromApi()
      .then((options) => {
        vendorFilterOptionsCache = options;
        return options;
      })
      .catch((error) => {
        vendorFilterOptionsLoad = null;
        throw error;
      });
  }

  return vendorFilterOptionsLoad;
}

/** @deprecated Prefer ensureVendorFilterOptionsLoaded / useVendorFilterOptions — same cached result. */
export function fetchVendorFilterOptions(): Promise<VendorFilterOption[]> {
  return ensureVendorFilterOptionsLoaded();
}

/** Drop session cache (e.g. after creating a vendor) so the next dropdown load refetches. */
export function invalidateVendorFilterOptionsCache() {
  vendorFilterOptionsCache = null;
  vendorFilterOptionsLoad = null;
}
