import type {
  PromoCodeRecord,
  PromoCodesQuery,
  PromoCodesResponse,
} from "@/lib/types";

const MOCK_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: "promo-100",
    code: "100",
    isActive: false,
    createdBy: "admin",
    startDate: "2024-04-07T02:30:00.000Z",
    endDate: "2024-04-14T02:30:00.000Z",
    usageCount: 0,
    usageLimit: null,
    vendorId: "v-hundred",
    vendorEnglish: "Hundred Coffee",
    vendorArabic: "هاندريد كوفي",
    promoCodeType: "percentage",
    amountPercent: 10,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 10,
    createdAt: "2024-04-07T12:35:00.000Z",
    updatedAt: "2024-09-13T04:02:00.000Z",
  },
  {
    id: "promo-artem102",
    code: "ARTEM102",
    isActive: false,
    createdBy: "admin",
    startDate: "2024-08-31T02:30:00.000Z",
    endDate: "2024-09-07T02:30:00.000Z",
    usageCount: 0,
    usageLimit: null,
    vendorId: "v-art-chocolate",
    vendorEnglish: "The Art of Chocolate - For Events & Gifting",
    vendorArabic: "فن الشوكولاتة - للمناسبات و الهدايا",
    promoCodeType: "percentage",
    amountPercent: 10,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 10,
    createdAt: "2024-08-31T10:15:00.000Z",
    updatedAt: "2024-10-02T06:40:00.000Z",
  },
  {
    id: "promo-summer25",
    code: "SUMMER25",
    isActive: true,
    createdBy: "admin",
    startDate: "2026-06-01T06:00:00.000Z",
    endDate: "2026-08-31T20:00:00.000Z",
    usageCount: 3,
    usageLimit: null,
    vendorId: "v-melenzane",
    vendorEnglish: "Melenzane",
    vendorArabic: "ملنزاني",
    promoCodeType: "percentage",
    amountPercent: 15,
    amountQr: null,
    cartsSharePercent: 5,
    vendorsSharePercent: 10,
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-08-28T14:22:00.000Z",
  },
  {
    id: "promo-welcome10",
    code: "WELCOME10",
    isActive: true,
    createdBy: "admin",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:00.000Z",
    usageCount: 128,
    usageLimit: 500,
    vendorId: "v-larc",
    vendorEnglish: "LARC",
    vendorArabic: "لارك",
    promoCodeType: "percentage",
    amountPercent: 10,
    amountQr: null,
    cartsSharePercent: 10,
    vendorsSharePercent: 0,
    createdAt: "2025-12-15T11:30:00.000Z",
    updatedAt: "2026-08-30T08:15:00.000Z",
  },
  {
    id: "promo-feast50",
    code: "FEAST50",
    isActive: false,
    createdBy: "admin",
    startDate: "2025-03-01T08:00:00.000Z",
    endDate: "2025-03-31T20:00:00.000Z",
    usageCount: 47,
    usageLimit: 50,
    vendorId: "v-exit55",
    vendorEnglish: "Exit 55",
    vendorArabic: "اكزت ٥٥",
    promoCodeType: "percentage",
    amountPercent: 20,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 20,
    createdAt: "2025-02-20T16:45:00.000Z",
    updatedAt: "2025-04-01T07:10:00.000Z",
  },
  {
    id: "promo-enjoy100",
    code: "ENJOY100",
    isActive: false,
    createdBy: "vendor",
    startDate: "2023-10-21T00:00:00.000Z",
    endDate: "2023-10-31T23:59:00.000Z",
    usageCount: 0,
    usageLimit: 1,
    vendorId: "v-enjoy",
    vendorEnglish: "Enjoy Sweets",
    vendorArabic: "إنجوي سويت للتجارة والزهور",
    promoCodeType: "fixed",
    amountPercent: 0,
    amountQr: 100,
    cartsSharePercent: 0,
    vendorsSharePercent: 100,
    createdAt: "2023-10-21T10:00:00.000Z",
    updatedAt: "2023-10-21T10:00:00.000Z",
  },
  {
    id: "promo-vendor-001",
    code: "SABLE15",
    isActive: true,
    createdBy: "vendor",
    startDate: "2026-07-01T06:00:00.000Z",
    endDate: "2026-09-30T18:00:00.000Z",
    usageCount: 12,
    usageLimit: null,
    vendorId: "v-sable",
    vendorEnglish: "Sable Sweets",
    vendorArabic: "حلويات سابليه",
    promoCodeType: "percentage",
    amountPercent: 15,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 15,
    createdAt: "2026-06-25T13:20:00.000Z",
    updatedAt: "2026-08-27T10:05:00.000Z",
  },
  {
    id: "promo-vendor-002",
    code: "SULTAN20",
    isActive: true,
    createdBy: "vendor",
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2026-08-31T23:59:00.000Z",
    usageCount: 8,
    usageLimit: 100,
    vendorId: "v-sultan",
    vendorEnglish: "Al Sultan",
    vendorArabic: "السلطان",
    promoCodeType: "percentage",
    amountPercent: 20,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 20,
    createdAt: "2026-07-28T08:00:00.000Z",
    updatedAt: "2026-08-29T19:30:00.000Z",
  },
  {
    id: "promo-vendor-003",
    code: "PEARL5",
    isActive: false,
    createdBy: "vendor",
    startDate: "2026-05-10T06:00:00.000Z",
    endDate: "2026-06-10T18:00:00.000Z",
    usageCount: 2,
    usageLimit: 25,
    vendorId: "v-pearl",
    vendorEnglish: "Pearl Events",
    vendorArabic: "لؤلؤة للمناسبات",
    promoCodeType: "percentage",
    amountPercent: 5,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 5,
    createdAt: "2026-05-05T15:40:00.000Z",
    updatedAt: "2026-06-12T09:55:00.000Z",
  },
  {
    id: "promo-vendor-004",
    code: "HCNEW",
    isActive: true,
    createdBy: "vendor",
    startDate: "2026-08-15T06:00:00.000Z",
    endDate: "2026-10-15T18:00:00.000Z",
    usageCount: 0,
    usageLimit: null,
    vendorId: "v-hundred",
    vendorEnglish: "Hundred Coffee",
    vendorArabic: "هاندريد كوفي",
    promoCodeType: "percentage",
    amountPercent: 10,
    amountQr: null,
    cartsSharePercent: 0,
    vendorsSharePercent: 10,
    createdAt: "2026-08-14T11:00:00.000Z",
    updatedAt: "2026-08-14T11:00:00.000Z",
  },
];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatPromoDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string, base = Date.now()) {
  const target = new Date(value).getTime();
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

function filterPromoCodes(codes: PromoCodeRecord[], query: PromoCodesQuery) {
  return codes
    .filter((code) => code.createdBy === query.tab)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/** Swap this for a real API call when available. */
export async function fetchPromoCodes(
  query: PromoCodesQuery,
): Promise<PromoCodesResponse> {
  await delay();

  const filtered = filterPromoCodes(MOCK_PROMO_CODES, query);
  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize).map((code) => ({ ...code })),
    total: filtered.length,
    page,
    pageSize,
  };
}

export function countPromoCodesByTab(tab: PromoCodesQuery["tab"]) {
  return MOCK_PROMO_CODES.filter((code) => code.createdBy === tab).length;
}

export function getPromoCodeById(id: string) {
  return MOCK_PROMO_CODES.find((code) => code.id === id) ?? null;
}
