import { getVendorById } from "@/lib/vendors";
import type {
  FilterCategory,
  FilterSubType,
  VendorFiltersResponse,
  VendorRecord,
} from "@/lib/types";
import {
  getVendorDetails,
  getVendorFiltersCatalog,
  type VendorFilterApiItem,
  type VendorFilterSubTypeApiItem,
} from "@/services/vendors";

let vendorFilterAssignments: Record<string, string[]> = {};

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanLabel(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function formatBilingualLabel(label: { en: string; ar: string }) {
  return `${label.en.trim()} / ${label.ar.trim()}`;
}

function mapSubType(item: VendorFilterSubTypeApiItem): FilterSubType | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  const nameEn = cleanLabel(item.name?.en) || id;
  const nameAr = cleanLabel(item.name?.ar) || nameEn;

  return {
    id,
    name: { en: nameEn, ar: nameAr },
  };
}

function mapFilterCategory(item: VendorFilterApiItem): FilterCategory | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  const nameEn = cleanLabel(item.name?.en) || id;
  const nameAr = cleanLabel(item.name?.ar) || nameEn;
  const subTypes = (item.subTypes ?? [])
    .map(mapSubType)
    .filter((subType): subType is FilterSubType => subType !== null);

  return {
    id,
    name: { en: nameEn, ar: nameAr },
    subTypes,
  };
}

async function resolveVendor(vendorId: string): Promise<VendorRecord> {
  const cached = getVendorById(vendorId);
  if (cached) return { ...cached };

  try {
    const details = await getVendorDetails(vendorId);
    return {
      id: vendorId,
      published: Boolean(details.published),
      isDraft: false,
      englishName: cleanLabel(details.name?.en),
      arabicName: cleanLabel(details.name?.ar),
      createdAt: "",
      updatedAt: "",
    };
  } catch {
    return {
      id: vendorId,
      published: false,
      isDraft: false,
      englishName: "",
      arabicName: "",
      createdAt: "",
      updatedAt: "",
    };
  }
}

/** GET /admin/vendors/filters */
export async function fetchVendorFilters(
  vendorId: string,
): Promise<VendorFiltersResponse> {
  const [filters, vendor] = await Promise.all([
    getVendorFiltersCatalog(),
    resolveVendor(vendorId),
  ]);

  const categories = filters
    .map(mapFilterCategory)
    .filter((category): category is FilterCategory => category !== null);

  const validIds = new Set(
    categories.flatMap((category) =>
      category.subTypes.map((subType) => subType.id),
    ),
  );
  const selectedSubTypeIds = (vendorFilterAssignments[vendorId] ?? []).filter(
    (id) => validIds.has(id),
  );

  return {
    vendor,
    categories,
    selectedSubTypeIds,
  };
}

/** Swap for a real API call when available. */
export async function saveVendorFilters(
  vendorId: string,
  selectedSubTypeIds: string[],
) {
  await delay(280);

  const filters = await getVendorFiltersCatalog();
  const categories = filters
    .map(mapFilterCategory)
    .filter((category): category is FilterCategory => category !== null);

  const validIds = new Set(
    categories.flatMap((category) =>
      category.subTypes.map((subType) => subType.id),
    ),
  );
  vendorFilterAssignments[vendorId] = selectedSubTypeIds.filter((id) =>
    validIds.has(id),
  );
  return [...vendorFilterAssignments[vendorId]];
}

export function countSelectedInCategory(
  categoryId: string,
  categories: { id: string; subTypes: { id: string }[] }[],
  selectedIds: Set<string>,
) {
  const category = categories.find((entry) => entry.id === categoryId);
  if (!category) return 0;
  return category.subTypes.filter((subType) => selectedIds.has(subType.id))
    .length;
}
