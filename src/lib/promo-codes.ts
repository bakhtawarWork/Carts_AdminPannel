import type {
  PromoCodeListTab,
  PromoCodeRecord,
  PromoCodeType,
  PromoCodesQuery,
  PromoCodesResponse,
} from "@/lib/types";
import {
  deletePromoCode as deletePromoCodeRequest,
  getPromoCodes,
  type PromoCodeAffectedVendorApi,
  type PromoCodeApiItem,
} from "@/services/promo-codes";
import { getVendorById } from "@/lib/vendors";
import { ApiError } from "@/services/api";

const promoCodeCache = new Map<string, PromoCodeRecord>();
const promoListByTab = new Map<PromoCodeListTab, PromoCodeRecord[]>();
const promoListInflight = new Map<
  PromoCodeListTab,
  Promise<PromoCodeRecord[]>
>();

export function invalidatePromoCodesListCache(tab?: PromoCodeListTab) {
  if (tab) promoListByTab.delete(tab);
  else promoListByTab.clear();
}

async function loadPromoCodesForTab(
  tab: PromoCodeListTab,
  options?: { refresh?: boolean },
): Promise<PromoCodeRecord[]> {
  if (!options?.refresh) {
    const cached = promoListByTab.get(tab);
    if (cached) return cached;
  } else {
    promoListByTab.delete(tab);
  }

  let inflight = promoListInflight.get(tab);
  if (!inflight) {
    inflight = (async () => {
      // Vendor display names come from API `vendorName` — no vendors list fetch needed.
      const payload = await getPromoCodes(tab);
      const mapped = payload
        .map((item) => mapPromoCodeApiItem(item, tab))
        .filter((item): item is PromoCodeRecord => item !== null)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      rememberPromoCodes(mapped);
      promoListByTab.set(tab, mapped);
      return mapped;
    })().finally(() => {
      promoListInflight.delete(tab);
    });
    promoListInflight.set(tab, inflight);
  }

  return inflight;
}

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toPromoType(value?: string): PromoCodeType {
  const type = clean(value).toLowerCase();
  if (type === "fixed") return "fixed";
  if (type === "percentage") return "percentage";
  if (type === "free_delivery") return "free_delivery";
  return "percentage";
}

function resolveVendorNameField(value: PromoCodeApiItem["vendorName"]): {
  english: string;
  arabic: string;
} {
  if (!value) return { english: "", arabic: "" };
  if (typeof value === "string") {
    return { english: clean(value), arabic: "" };
  }
  return {
    english: clean(value.en),
    arabic: clean(value.ar),
  };
}

function resolveVendorNames(
  vendorId: string,
  fromApi?: { english?: string; arabic?: string },
) {
  const vendor = vendorId ? getVendorById(vendorId) : null;
  return {
    vendorEnglish:
      clean(fromApi?.english) ||
      vendor?.englishName ||
      (vendorId && vendorId !== "all" ? vendorId : "—"),
    vendorArabic: clean(fromApi?.arabic) || vendor?.arabicName || "",
  };
}

function resolveAffectedVendor(value: PromoCodeApiItem["affectedVendors"]): {
  vendorId: string;
  english?: string;
  arabic?: string;
} {
  if (!value) return { vendorId: "" };

  if (typeof value === "string") {
    return { vendorId: clean(value) };
  }

  const nested = value as PromoCodeAffectedVendorApi;
  return {
    vendorId: clean(nested._id) || clean(nested.id),
    english: clean(nested.name?.en),
    arabic: clean(nested.name?.ar),
  };
}

export function mapPromoCodeApiItem(
  item: PromoCodeApiItem,
  tab: PromoCodeListTab,
): PromoCodeRecord | null {
  const id = clean(item._id) || clean(item.id);
  if (!id) return null;

  const promoCodeType = toPromoType(item.promoType);
  const amount = toNumber(item.amount);
  const affected = resolveAffectedVendor(item.affectedVendors);
  const vendorId = affected.vendorId || "all";
  const fromVendorName = resolveVendorNameField(item.vendorName);
  const names = resolveVendorNames(vendorId === "all" ? "" : vendorId, {
    english: fromVendorName.english || affected.english,
    arabic: fromVendorName.arabic || affected.arabic,
  });

  return {
    id,
    code: clean(item.code),
    isActive: Boolean(item.live),
    createdBy: tab,
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    usageCount: toNumber(item.currentUsage),
    usageLimit: (() => {
      const max = toNumber(item.maxUsages, -1);
      return max < 0 ? null : max;
    })(),
    vendorId,
    vendorEnglish: names.vendorEnglish,
    vendorArabic: names.vendorArabic,
    promoCodeType,
    amountPercent: amount,
    amountQr: promoCodeType === "fixed" ? amount : null,
    cartsSharePercent: toNumber(item.cartsShare),
    vendorsSharePercent: toNumber(item.vendorShare),
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

function rememberPromoCodes(items: PromoCodeRecord[]) {
  for (const item of items) {
    promoCodeCache.set(item.id, item);
  }
}

export function formatPromoDateTime(value: string) {
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

export function formatRelativeTime(value: string, base = Date.now()) {
  if (!value) return "";
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return "";

  const diffMs = target - base;
  const absMs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  if (absMs < month) {
    return rtf.format(Math.round(diffMs / day), "day");
  }
  if (absMs < year) {
    return rtf.format(Math.round(diffMs / month), "month");
  }
  return rtf.format(Math.round(diffMs / year), "year");
}

export function formatActiveLabel(isActive: boolean) {
  return isActive ? "Active" : "Not active";
}

export function formatUsageLine(count: number, limit: number | null) {
  const limitLabel = limit === null ? "Infinity" : String(limit);
  return `${count} / ${limitLabel}`;
}

export function formatPercent(value: number) {
  return `${value} %`;
}

export function formatAuditStamp(prefix: "C" | "U", value: string) {
  return `${prefix}:${formatPromoDateTime(value)}`;
}

/** GET /admin/promocode/promocode?createdBy=admin|vendor — list cached per tab; pagination is client-side. */
export async function fetchPromoCodes(
  query: PromoCodesQuery & { refresh?: boolean },
): Promise<PromoCodesResponse> {
  const mapped = await loadPromoCodesForTab(query.tab, {
    refresh: query.refresh,
  });

  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(mapped.length / pageSize) || 1);
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: mapped.slice(start, start + pageSize).map((code) => ({ ...code })),
    total: mapped.length,
    page,
    pageSize,
  };
}

export function countPromoCodesByTab(tab: PromoCodesQuery["tab"]) {
  return Array.from(promoCodeCache.values()).filter(
    (code) => code.createdBy === tab,
  ).length;
}

export function getPromoCodeById(id: string) {
  return promoCodeCache.get(id) ?? null;
}

function removePromoCodeFromCaches(id: string) {
  const existing = promoCodeCache.get(id);
  promoCodeCache.delete(id);

  if (existing) {
    const list = promoListByTab.get(existing.createdBy);
    if (list) {
      promoListByTab.set(
        existing.createdBy,
        list.filter((item) => item.id !== id),
      );
    }
    return;
  }

  for (const [tab, list] of promoListByTab) {
    const next = list.filter((item) => item.id !== id);
    if (next.length !== list.length) {
      promoListByTab.set(tab, next);
    }
  }
}

/** DELETE /admin/promocode/delete/:id */
export async function deletePromoCodeById(id: string) {
  const result = await deletePromoCodeRequest(id);
  removePromoCodeFromCaches(id);
  return result;
}

export function getPromoCodeDeleteErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not delete promo code. Please try again.";
}
