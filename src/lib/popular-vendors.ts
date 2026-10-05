import type { PopularVendor } from "@/lib/types";

/**
 * Static popular vendors until a real API is available.
 * Replace `fetchPopularVendors` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_VENDORS: PopularVendor[] = [
  {
    id: "vendor-1",
    published: false,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=240&h=160&fit=crop",
    name: "Patè Sucrè",
    nameAr: "باتيه سيكري",
    orderCount: 702,
  },
  {
    id: "vendor-2",
    published: true,
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=240&h=160&fit=crop",
    name: "Melenzane",
    nameAr: "ملنزاني",
    orderCount: 689,
  },
  {
    id: "vendor-3",
    published: true,
    imageUrl:
      "https://images.unsplash.com/photo-1548907040-4baa0d1d1e5f?w=240&h=160&fit=crop",
    name: "My Fair Sweets",
    nameAr: "حلويات ماي فير",
    orderCount: 500,
  },
  {
    id: "vendor-4",
    published: true,
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=240&h=160&fit=crop",
    name: "Exit 55",
    nameAr: "اكزت ٥٥",
    orderCount: 291,
  },
];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Swap this for: `const res = await fetch("/api/analysis/popular-vendors"); return res.json();` */
export async function fetchPopularVendors(): Promise<PopularVendor[]> {
  await delay();
  return MOCK_POPULAR_VENDORS.map((vendor) => ({ ...vendor }));
}
