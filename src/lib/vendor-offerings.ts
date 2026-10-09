import { getVendorById } from "@/lib/vendors";
import { getCachedOfferingCategory } from "@/lib/offering-categories";
import type {
  BilingualLabel,
  OfferingApproveStatus,
  OfferingFormData,
  VendorOfferingCategory,
  VendorOfferingRecord,
  VendorOfferingsResponse,
} from "@/lib/types";
import {
  copyOffering,
  deleteOffering,
  getVendorOfferings,
  type VendorOfferingApiItem,
} from "@/services/offerings";
import { getVendorDetails } from "@/services/vendors";

const UNCATEGORIZED_TAB_ID = "__uncategorized__";

let vendorOfferingsState: VendorOfferingRecord[] = [];

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createOfferingId() {
  return `off-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`;
}

export function formatBilingualLabel(label: BilingualLabel) {
  return `${label.en.trim()} / ${label.ar.trim()}`;
}

export function formatOfferingPrice(value: number) {
  if (value <= 0) return "—";
  return `${value.toLocaleString()} QR`;
}

export function approveStatusLabel(status: VendorOfferingRecord["approveStatus"]) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending";
  return "Rejected";
}

export function deriveOfferingCategories(offerings: VendorOfferingRecord[]) {
  const map = new Map<string, VendorOfferingRecord["category"] & object>();

  for (const offering of offerings) {
    if (offering.category) {
      map.set(offering.category.id, offering.category);
    }
  }

  const categories = Array.from(map.values()).sort((a, b) =>
    a.name.en.localeCompare(b.name.en),
  );

  const hasUncategorized = offerings.some((offering) => !offering.category);
  if (hasUncategorized) {
    categories.push({
      id: UNCATEGORIZED_TAB_ID,
      name: {
        en: "Offering without Category",
        ar: "تقدم بدون فئة",
      },
    });
  }

  return categories;
}

export function offeringMatchesCategory(
  offering: VendorOfferingRecord,
  categoryId: string,
) {
  if (categoryId === UNCATEGORIZED_TAB_ID) return offering.category === null;
  return offering.category?.id === categoryId;
}

export function getVendorOfferingById(vendorId: string, offeringId: string) {
  const offering = vendorOfferingsState.find(
    (item) => item.vendorId === vendorId && item.id === offeringId,
  );
  return offering ? { ...offering } : null;
}

function resolveCategory(categoryId: string): VendorOfferingCategory | null {
  if (!categoryId) return null;

  const cached = getCachedOfferingCategory(categoryId);
  if (cached) {
    return {
      id: cached.id,
      name: {
        en: cached.englishName || cached.id,
        ar: cached.arabicName || cached.englishName || cached.id,
      },
    };
  }

  return {
    id: categoryId,
    name: { en: categoryId, ar: categoryId },
  };
}

export function upsertVendorOfferingFromForm(data: OfferingFormData) {
  const now = new Date().toISOString();
  const category = resolveCategory(data.categoryId);
  const thumb = data.gallery[0];
  const startingPrice = Number(data.startingPriceQr) || 0;
  const price = Number(data.itemPriceQr) || 0;

  if (data.offeringId) {
    const index = vendorOfferingsState.findIndex(
      (item) => item.vendorId === data.vendorId && item.id === data.offeringId,
    );
    if (index !== -1) {
      vendorOfferingsState[index] = {
        ...vendorOfferingsState[index],
        name: { en: data.englishName.trim(), ar: data.arabicName.trim() },
        published: data.published,
        category,
        thumbUrl:
          thumb?.url ?? vendorOfferingsState[index].thumbUrl,
        thumbAlt: thumb?.alt ?? data.englishName.trim(),
        startingPrice,
        price,
        updatedAt: now,
      };
      return { ...vendorOfferingsState[index] };
    }
  }

  const record: VendorOfferingRecord = {
    id: data.offeringId ?? createOfferingId(),
    vendorId: data.vendorId,
    name: { en: data.englishName.trim(), ar: data.arabicName.trim() },
    approveStatus: "approved",
    published: data.published,
    category,
    thumbUrl:
      thumb?.url ??
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=320&h=240&fit=crop",
    thumbAlt: thumb?.alt ?? data.englishName.trim(),
    startingPrice,
    price,
    createdAt: now,
    updatedAt: now,
  };
  vendorOfferingsState = [record, ...vendorOfferingsState];
  return { ...record };
}

function cleanLabel(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function toAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeApproveStatus(value?: string): OfferingApproveStatus {
  const status = value?.trim().toLowerCase();
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

function mapVendorOffering(
  item: VendorOfferingApiItem,
  vendorId: string,
): VendorOfferingRecord | null {
  const id = item._id ?? item.id;
  if (!id || item._deleted) return null;

  const nameEn = cleanLabel(item.name?.en) || "Untitled offering";
  const nameAr = cleanLabel(item.name?.ar) || nameEn;
  const image = item.images?.find((entry) => entry.cdnUrl || entry.url);
  const thumbUrl = cleanLabel(image?.cdnUrl) || cleanLabel(image?.url);

  let category: VendorOfferingCategory | null = null;
  if (item.categoryId && typeof item.categoryId === "object") {
    const categoryId = item.categoryId._id ?? item.categoryId.id;
    if (categoryId) {
      category = {
        id: categoryId,
        name: {
          en: cleanLabel(item.categoryId.name?.en) || categoryId,
          ar:
            cleanLabel(item.categoryId.name?.ar) ||
            cleanLabel(item.categoryId.name?.en) ||
            categoryId,
        },
      };
    }
  } else if (typeof item.categoryId === "string" && item.categoryId.trim()) {
    category = resolveCategory(item.categoryId.trim());
  }

  return {
    id,
    vendorId: item._vendor || vendorId,
    name: { en: nameEn, ar: nameAr },
    approveStatus: normalizeApproveStatus(item.approveStatus),
    published: Boolean(item.published),
    category,
    thumbUrl,
    thumbAlt: nameEn,
    startingPrice: toAmount(item.startingPrice),
    price: toAmount(item.price),
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

async function resolveVendorName(vendorId: string): Promise<BilingualLabel> {
  const cached = getVendorById(vendorId);
  if (cached?.englishName || cached?.arabicName) {
    return {
      en: cached.englishName || cached.arabicName,
      ar: cached.arabicName || cached.englishName,
    };
  }

  try {
    const details = await getVendorDetails(vendorId);
    return {
      en: cleanLabel(details.name?.en) || vendorId,
      ar: cleanLabel(details.name?.ar) || cleanLabel(details.name?.en) || vendorId,
    };
  } catch {
    return { en: vendorId, ar: vendorId };
  }
}

/** GET /admin/offerings/vendors?vendorId= */
export async function fetchVendorOfferings(
  vendorId: string,
): Promise<VendorOfferingsResponse> {
  const [items, vendorName] = await Promise.all([
    getVendorOfferings(vendorId),
    resolveVendorName(vendorId),
  ]);

  const offerings = items
    .map((item) => mapVendorOffering(item, vendorId))
    .filter((item): item is VendorOfferingRecord => item !== null);

  return {
    vendor: {
      id: vendorId,
      name: vendorName,
    },
    offerings,
  };
}

/** POST /offerings/:id/copy */
export async function copyVendorOffering(
  offeringId: string,
  targetVendorId: string,
) {
  return copyOffering(offeringId, { targetVendorId });
}

export async function deleteVendorOffering(
  vendorId: string,
  offeringId: string,
) {
  const result = await deleteOffering(offeringId);
  vendorOfferingsState = vendorOfferingsState.filter(
    (offering) =>
      !(offering.vendorId === vendorId && offering.id === offeringId),
  );
  return result;
}

export { UNCATEGORIZED_TAB_ID };
