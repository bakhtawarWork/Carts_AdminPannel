import type { PopularCategory } from "@/lib/types";

/**
 * Static popular categories until a real API is available.
 * Replace `fetchPopularCategories` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_CATEGORIES: PopularCategory[] = [];

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
