import type {
  PromoCodeFormData,
  PromoCodeRecord,
  PromoCodeType,
} from "@/lib/types";

export const PROMO_CODE_TYPE_OPTIONS = [
  { value: "", label: "Select type" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed" },
  { value: "free_delivery", label: "Free delivery" },
] as const;

export const PROMO_CODE_VENDOR_OPTIONS = [
  { value: "all", label: "All" },
  { value: "v-enjoy", label: "Enjoy Sweets / إنجوي سويت للتجارة والزهور" },
  { value: "v-hundred", label: "Hundred Coffee / هاندريد كوفي" },
  {
    value: "v-art-chocolate",
    label:
      "The Art of Chocolate - For Events & Gifting / فن الشوكولاتة - للمناسبات و الهدايا",
  },
  { value: "v-melenzane", label: "Melenzane / ملنزاني" },
  { value: "v-larc", label: "LARC / لارك" },
  { value: "v-sultan", label: "Al Sultan / السلطان" },
  { value: "v-exit55", label: "Exit 55 / اكزت ٥٥" },
  { value: "v-sable", label: "Sable Sweets / حلويات سابليه" },
  { value: "v-pearl", label: "Pearl Events / لؤلؤة للمناسبات" },
] as const;

function delay(ms = 320) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateInput(value: string) {
  return value.slice(0, 10);
}

export function createEmptyPromoCodeForm(): PromoCodeFormData {
  return {
    code: "",
    maxUsageLimit: "-1",
    startDate: "2026-08-31",
    endDate: "2026-09-07",
    promoCodeType: "",
    vendorId: "all",
    vendorEnglish: "",
    vendorArabic: "",
    isLive: false,
    amountQr: "",
    cartsSharePercent: 0,
  };
}

export function promoFormFromRecord(record: PromoCodeRecord): PromoCodeFormData {
  return {
    id: record.id,
    code: record.code,
    maxUsageLimit:
      record.usageLimit === null ? "-1" : String(record.usageLimit),
    startDate: toDateInput(record.startDate),
    endDate: toDateInput(record.endDate),
    promoCodeType: record.promoCodeType,
    vendorId: record.vendorId,
    vendorEnglish: record.vendorEnglish,
    vendorArabic: record.vendorArabic,
    isLive: record.isActive,
    amountQr:
      record.amountQr !== null
        ? String(record.amountQr)
        : String(record.amountPercent),
    cartsSharePercent: record.cartsSharePercent,
  };
}

/** Swap for a real API call when available. */
export async function fetchPromoCodeForm(
  id: string,
): Promise<PromoCodeFormData | null> {
  await delay();
  const { getPromoCodeById } = await import("@/lib/promo-codes");
  const record = getPromoCodeById(id);
  if (!record || record.createdBy !== "vendor") return null;
  return promoFormFromRecord(record);
}

/** Swap for a real API call when available. */
export async function savePromoCodeForm(data: PromoCodeFormData) {
  await delay();
  return {
    ok: true as const,
    id: data.id ?? `promo-${data.code.toLowerCase() || "new"}`,
  };
}

export function validatePromoCodeForm(
  data: PromoCodeFormData,
  options?: { isEdit?: boolean },
): string | null {
  if (!data.code.trim()) return "Code is required.";
  if (!data.startDate) return "Start date is required.";
  if (!data.endDate) return "End date is required.";
  if (data.endDate < data.startDate) {
    return "End date must be on or after the start date.";
  }
  if (!data.promoCodeType) return "Promo code type is required.";
  const limit = Number(data.maxUsageLimit);
  if (Number.isNaN(limit) || limit < -1) {
    return "Max usage limit must be -1 (unlimited) or a positive number.";
  }

  if (options?.isEdit || data.promoCodeType === "fixed") {
    const amount = Number(data.amountQr);
    if (Number.isNaN(amount) || amount <= 0) {
      return "Amount (QR) must be a positive number.";
    }
  }

  if (data.cartsSharePercent < 0 || data.cartsSharePercent > 100) {
    return "Carts share must be between 0 and 100.";
  }

  return null;
}

export function vendorsShareFromCarts(cartsShare: number) {
  return Math.max(0, Math.min(100, 100 - cartsShare));
}

export function formatVendorHeader(english: string, arabic: string) {
  return `${english} / ${arabic}`;
}

export type { PromoCodeType };
