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
  getVendorOfferings,
  type VendorOfferingApiItem,
} from "@/services/offerings";
import { getVendorDetails } from "@/services/vendors";

const UNCATEGORIZED_TAB_ID = "__uncategorized__";

let vendorOfferingsState: VendorOfferingRecord[] = [
  {
    id: "off-tp-1",
    vendorId: "vnd-1",
    name: { en: "Test Payment", ar: "Test payment" },
    approveStatus: "approved",
    published: true,
    category: {
      id: "65b23fed9ba0330f75fc9644",
      name: { en: "Adults Package", ar: "باقة الكبار" },
    },
    thumbUrl:
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=320&h=240&fit=crop",
    thumbAlt: "Test Payment offering",
    startingPrice: 0,
    price: 0,
    createdAt: "2025-11-23T07:57:34.188Z",
    updatedAt: "2025-11-23T07:57:34.861Z",
  },
  {
    id: "off-tp-2",
    vendorId: "vnd-1",
    name: { en: "Weekend Brunch Box", ar: "صندوق برنش نهاية الأسبوع" },
    approveStatus: "pending",
    published: false,
    category: {
      id: "65b241889ba0330f75fc9646",
      name: { en: "Breakfast Buffet", ar: "بوفيه الإفطار" },
    },
    thumbUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=320&h=240&fit=crop",
    thumbAlt: "Weekend brunch offering",
    startingPrice: 450,
    price: 45,
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-02-12T11:20:00.000Z",
  },
  {
    id: "off-tp-3",
    vendorId: "vnd-1",
    name: { en: "Uncategorized Sample", ar: "عرض بدون فئة" },
    approveStatus: "approved",
    published: true,
    category: null,
    thumbUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=320&h=240&fit=crop",
    thumbAlt: "Uncategorized offering",
    startingPrice: 200,
    price: 25,
    createdAt: "2026-02-01T14:00:00.000Z",
    updatedAt: "2026-02-15T08:30:00.000Z",
  },
  {
    id: "off-ss-1",
    vendorId: "vnd-6",
    name: { en: "Signature Dessert Table", ar: "طاولة حلويات مميزة" },
    approveStatus: "approved",
    published: true,
    category: {
      id: "65b242aa9ba0330f75fc9647",
      name: { en: "Cake", ar: "كيك" },
    },
    thumbUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=320&h=240&fit=crop",
    thumbAlt: "Dessert table offering",
    startingPrice: 1200,
    price: 80,
    createdAt: "2025-09-05T10:00:00.000Z",
    updatedAt: "2026-01-20T16:45:00.000Z",
  },
];

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

/** Swap for a real API call when available. */
export async function copyVendorOffering(vendorId: string, offeringId: string) {
  await delay(200);
  const source = vendorOfferingsState.find(
    (offering) => offering.vendorId === vendorId && offering.id === offeringId,
  );
  if (!source) return null;

  const copy: VendorOfferingRecord = {
    ...structuredClone(source),
    id: createOfferingId(),
    name: {
      en: `[Copy] ${source.name.en}`,
      ar: `[نسخة] ${source.name.ar}`,
    },
    approveStatus: "pending",
    published: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  vendorOfferingsState = [copy, ...vendorOfferingsState];
  return copy;
}

/** Swap for a real API call when available. */
export async function deleteVendorOffering(vendorId: string, offeringId: string) {
  await delay(180);
  const next = vendorOfferingsState.filter(
    (offering) =>
      !(offering.vendorId === vendorId && offering.id === offeringId),
  );
  if (next.length === vendorOfferingsState.length) return false;
  vendorOfferingsState = next;
  return true;
}

export { UNCATEGORIZED_TAB_ID };
