import type { PopularCategory } from "@/lib/types";

/**
 * Static popular categories until a real API is available.
 * Replace `fetchPopularCategories` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_CATEGORIES: PopularCategory[] = [
  {
    id: "cat-1",
    name: "Desserts Box",
    nameAr: "علب الحلويات",
    createdAt: "2019-06-23T12:15:00.000Z",
    approveStatus: null,
    orderCount: 774,
  },
  {
    id: "cat-2",
    name: "Coffee Station",
    nameAr: "ستيشن القهوة",
    createdAt: "2019-01-16T16:15:00.000Z",
    approveStatus: null,
    orderCount: 455,
  },
  {
    id: "cat-3",
    name: "Lunch and Dinner Buffet",
    nameAr: "بوفيه الغداء و العشاء",
    createdAt: "2018-12-01T20:04:00.000Z",
    approveStatus: null,
    orderCount: 409,
  },
  {
    id: "cat-4",
    name: "Kids station",
    nameAr: "ستيشن الاطفال",
    createdAt: "2019-02-04T16:31:00.000Z",
    approveStatus: null,
    orderCount: 343,
  },
  {
    id: "cat-5",
    name: "Mini buffet",
    nameAr: "ميني بوفيه",
    createdAt: "2018-08-28T15:17:00.000Z",
    approveStatus: null,
    orderCount: 327,
  },
  {
    id: "cat-6",
    name: "Sandwiches Box",
    nameAr: "علب الساندوتشات",
    createdAt: "2019-06-23T12:15:00.000Z",
    approveStatus: null,
    orderCount: 249,
  },
  {
    id: "cat-7",
    name: "Live Station",
    nameAr: "الطبخ المباشر",
    createdAt: "2018-08-28T15:14:00.000Z",
    approveStatus: null,
    orderCount: 168,
  },
  {
    id: "cat-8",
    name: "Sharing Package",
    nameAr: "باقة المشاركة",
    createdAt: "2019-05-06T14:13:00.000Z",
    approveStatus: null,
    orderCount: 93,
  },
];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatCategoryDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Swap this for: `const res = await fetch("/api/analysis/popular-categories"); return res.json();` */
export async function fetchPopularCategories(): Promise<PopularCategory[]> {
  await delay();
  return MOCK_POPULAR_CATEGORIES.map((category) => ({ ...category }));
}
