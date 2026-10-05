import type { PopularItem } from "@/lib/types";

/**
 * Static popular items until a real API is available.
 * Replace `fetchPopularItems` with a fetch call — keep the return type.
 */
const MOCK_POPULAR_ITEMS: PopularItem[] = [
  {
    id: "item-1",
    published: true,
    imageUrl:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=240&h=160&fit=crop",
    name: "Spring Sable",
    nameAr: "سبرينغ سابليه",
    vendor: "Sable Sweets",
    vendorAr: "حلويات سابليه",
    orderCount: 245,
  },
  {
    id: "item-2",
    published: false,
    imageUrl:
      "https://images.unsplash.com/photo-1555244162-803834f70033?w=240&h=160&fit=crop",
    name: "Mini Buffet for 5 to 8 people",
    nameAr: "ميني بوفيه من ٥ إلى ٨ أشخاص",
    vendor: "Melenzane",
    vendorAr: "ملنزاني",
    orderCount: 216,
  },
  {
    id: "item-3",
    published: true,
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=240&h=160&fit=crop",
    name: "Melenzane Buffet for 15 people",
    nameAr: "بوفيه ملنزاني ل ١٥ شخص",
    vendor: "Melenzane",
    vendorAr: "ملنزاني",
    orderCount: 197,
  },
];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Swap this for: `const res = await fetch("/api/analysis/popular-items"); return res.json();` */
export async function fetchPopularItems(): Promise<PopularItem[]> {
  await delay();
  return MOCK_POPULAR_ITEMS.map((item) => ({ ...item }));
}
