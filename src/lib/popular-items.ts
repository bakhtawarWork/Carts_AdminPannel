import type { PopularItem } from "@/lib/types";

/**
 * Static popular items until a real API is available.
 * Replace `fetchPopularItems` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_ITEMS: PopularItem[] = [];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Swap this for: `const res = await fetch("/api/analysis/popular-items"); return res.json();` */
export async function fetchPopularItems(): Promise<PopularItem[]> {
  await delay();
  return MOCK_POPULAR_ITEMS.map((item) => ({ ...item }));
}
