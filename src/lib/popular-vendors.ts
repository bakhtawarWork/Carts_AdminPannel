import type { PopularVendor } from "@/lib/types";

/**
 * Static popular vendors until a real API is available.
 * Replace `fetchPopularVendors` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_VENDORS: PopularVendor[] = [];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Swap this for: `const res = await fetch("/api/analysis/popular-vendors"); return res.json();` */
export async function fetchPopularVendors(): Promise<PopularVendor[]> {
  await delay();
  return MOCK_POPULAR_VENDORS.map((vendor) => ({ ...vendor }));
}
