import type {
  PromoCodeFormData,
  PromoCodeRecord,
  PromoCodeType,
} from "@/lib/types";
import { ApiError } from "@/services/api";
import {
  createPromoCode,
  type UpdatePromoCodePayload,
} from "@/services/promo-codes";

export const PROMO_CODE_TYPE_OPTIONS = [
  { value: "", label: "Select type" },
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "Percentage" },
] as const;

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toStartDateIso(value: string) {
  return `${value}T00:00:00.000Z`;
}

function toEndDateIso(value: string) {
  return `${value}T23:59:59.000Z`;
}

export function createEmptyPromoCodeForm(): PromoCodeFormData {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  return {
    code: "",
    maxUsageLimit: "-1",
    startDate: start,
    endDate: endDate.toISOString().slice(0, 10),
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
    vendorId: record.vendorId || "all",
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

/** Load promo for edit — GET /admin/promocode/:id → { promoCodes: { ... } } */
export async function fetchPromoCodeForm(
  id: string,
): Promise<PromoCodeFormData | null> {
  const { getPromoCodeDetails } = await import("@/services/promo-codes");
  const { mapPromoCodeApiItem } = await import("@/lib/promo-codes");

  const item = await getPromoCodeDetails(id);
  // Details `createdBy` is a vendor/admin user id, not the list tab key.
  const createdBy =
    item.createdBy?.toLowerCase() === "admin" ? "admin" : "vendor";
  const record = mapPromoCodeApiItem(item, createdBy);
  if (!record) return null;

  return promoFormFromRecord(record);
}

function toApiFieldValues(data: PromoCodeFormData): UpdatePromoCodePayload {
  if (data.promoCodeType !== "fixed" && data.promoCodeType !== "percentage") {
    throw new Error("Promo code type is required.");
  }

  return {
    code: data.code.trim(),
    maxUsages: Number(data.maxUsageLimit),
    startDate: toStartDateIso(data.startDate),
    endDate: toEndDateIso(data.endDate),
    promoType: data.promoCodeType,
    affectedVendors: data.vendorId.trim() || "all",
    amount: Number(data.amountQr),
    cartsShare: data.cartsSharePercent,
    live: data.isLive,
  };
}

/** Build PUT body with only fields that differ from the loaded promo. */
export function buildPromoCodeUpdatePayload(
  original: PromoCodeFormData,
  next: PromoCodeFormData,
): UpdatePromoCodePayload {
  const before = toApiFieldValues(original);
  const after = toApiFieldValues(next);
  const patch: UpdatePromoCodePayload = {};

  (Object.keys(after) as (keyof UpdatePromoCodePayload)[]).forEach((key) => {
    if (after[key] !== before[key]) {
      Object.assign(patch, { [key]: after[key] });
    }
  });

  return patch;
}

/** POST /admin/promocode/create or PUT /admin/promocode/update/:id (changed fields only). */
export async function savePromoCodeForm(
  data: PromoCodeFormData,
  original?: PromoCodeFormData | null,
) {
  const { invalidatePromoCodesListCache } = await import("@/lib/promo-codes");
  const { updatePromoCode } = await import("@/services/promo-codes");

  if (data.id) {
    if (!original) {
      throw new Error("Original promo code values are missing.");
    }

    const patch = buildPromoCodeUpdatePayload(original, data);
    if (Object.keys(patch).length === 0) {
      throw new Error("No changes to save.");
    }

    const result = await updatePromoCode(data.id, patch);
    invalidatePromoCodesListCache();

    return {
      ok: true as const,
      id: data.id,
      message: result.message,
    };
  }

  const payload = toApiFieldValues(data);
  const result = await createPromoCode({
    code: payload.code!,
    maxUsages: payload.maxUsages!,
    startDate: payload.startDate!,
    endDate: payload.endDate!,
    promoType: payload.promoType!,
    affectedVendors: payload.affectedVendors!,
    amount: payload.amount!,
    cartsShare: payload.cartsShare!,
    live: payload.live!,
  });

  invalidatePromoCodesListCache("admin");

  return {
    ok: true as const,
    id: result.data._id ?? result.data.id ?? "",
    message: result.message,
  };
}

export function getPromoCodeSaveErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.message.trim()) return error.message;
    const data = error.data;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (typeof record.data === "string" && record.data.trim()) {
        return record.data.trim();
      }
      if (typeof record.message === "string" && record.message.trim()) {
        return record.message.trim();
      }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not save promo code. Please try again.";
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
  if (Number.isNaN(limit) || limit < -1 || limit === 0) {
    return "Max usage limit must be -1 (unlimited) or a positive number.";
  }

  const amount = Number(data.amountQr);
  if (Number.isNaN(amount) || amount <= 0) {
    return data.promoCodeType === "percentage"
      ? "Amount (%) must be a positive number."
      : "Amount (QR) must be a positive number.";
  }

  if (data.promoCodeType === "percentage" && amount > 100) {
    return "Amount (%) must be between 1 and 100.";
  }

  if (data.promoCodeType === "percentage") {
    if (data.cartsSharePercent < 0 || data.cartsSharePercent > 100) {
      return "Carts share (%) must be between 0 and 100.";
    }
  } else if (data.promoCodeType === "fixed") {
    if (data.cartsSharePercent < 0 || data.cartsSharePercent > amount) {
      return "Carts share (QR) must be between 0 and the amount.";
    }
  }

  if (options?.isEdit && !data.id) {
    return "Promo code id is missing.";
  }

  return null;
}

/** Percentage: vendor % = 100 - carts %. Fixed: vendor QR = amount - carts QR. */
export function vendorsShareFromCarts(
  cartsShare: number,
  options?: { promoCodeType?: PromoCodeType | ""; amount?: number },
) {
  if (options?.promoCodeType === "fixed") {
    const amount = Number.isFinite(options.amount) ? (options.amount ?? 0) : 0;
    return Math.max(0, amount - cartsShare);
  }
  return Math.max(0, Math.min(100, 100 - cartsShare));
}

export function cartsShareSliderMax(
  promoCodeType: PromoCodeType | "",
  amountValue: string | number,
) {
  if (promoCodeType === "fixed") {
    const amount = Number(amountValue);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }
  return 100;
}

export function formatVendorHeader(english: string, arabic: string) {
  return `${english} / ${arabic}`;
}

export type { PromoCodeType };
