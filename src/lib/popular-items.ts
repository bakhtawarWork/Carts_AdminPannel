import type { PopularItem } from "@/lib/types";
import { getPopularOfferings } from "@/services/dashboard";

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

/** GET /adminadvanced/popular-offerings */
export async function fetchPopularItems(): Promise<PopularItem[]> {
  const offers = await getPopularOfferings();

  return offers.flatMap((item) => {
    const id = item._id ?? "";
    if (!id) return [];

    return [
      {
        id,
        published: Boolean(item.published) && !item._deleted,
        imageUrl: item.images?.find((image) => image.cdnUrl)?.cdnUrl ?? "",
        name: clean(item.name?.en) || id,
        nameAr: clean(item.name?.ar) || undefined,
        vendor: clean(item._vendor?.name?.en),
        vendorAr: clean(item._vendor?.name?.ar) || undefined,
        orderCount: toCount(item.numberOfOrders),
      },
    ];
  });
}
