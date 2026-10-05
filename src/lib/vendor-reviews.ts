import type {
  BilingualLabel,
  VendorReviewRecord,
  VendorReviewsResponse,
} from "@/lib/types";
import {
  getVendorReviews,
  type VendorReviewApiItem,
} from "@/services/vendors";

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function toScore(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function mapReview(
  item: VendorReviewApiItem,
  vendorId: string,
): VendorReviewRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  return {
    id,
    vendorId: item._vendor || vendorId,
    orderId: cleanText(item._order),
    userName: cleanText(item.userId?.name) || "—",
    reviewText: cleanText(item.reviewText),
    serviceScore: toScore(item.serviceScore),
    qualityScore: toScore(item.qualityScore),
    respectOfTimeScore: toScore(item.respectOfTimeScore),
    presentationScore: toScore(item.presentationScore),
    deliveryScore: toScore(item.deliveryScore),
    createdAt: item.createdAt ?? "",
  };
}

function formatReviewDate(value: string) {
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

export function formatVendorReviewDate(value: string) {
  return formatReviewDate(value);
}

export function formatReviewScore(value: number | null) {
  return value === null ? "—" : String(value);
}

/** GET /admin/vendors/reviews?vendorId= */
export async function fetchVendorReviews(
  vendorId: string,
): Promise<VendorReviewsResponse> {
  const payload = await getVendorReviews(vendorId);
  const vendorIdFromApi = payload.vendor?._id ?? payload.vendor?.id ?? vendorId;

  const name: BilingualLabel = {
    en: cleanText(payload.vendor?.name?.en) || vendorIdFromApi,
    ar:
      cleanText(payload.vendor?.name?.ar) ||
      cleanText(payload.vendor?.name?.en) ||
      vendorIdFromApi,
  };

  const reviews = payload.reviews
    .map((item) => mapReview(item, vendorIdFromApi))
    .filter((item): item is VendorReviewRecord => item !== null);

  return {
    vendor: {
      id: vendorIdFromApi,
      name,
    },
    reviews,
  };
}
