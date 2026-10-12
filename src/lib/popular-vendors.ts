import type { PopularVendor } from "@/lib/types";
import { getPopularVendors } from "@/services/dashboard";

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

/** GET /adminadvanced/popular-vendor */
export async function fetchPopularVendors(): Promise<PopularVendor[]> {
  const vendors = await getPopularVendors();

  return vendors.flatMap((item) => {
    const id = item._id ?? "";
    if (!id) return [];

    const imageUrl =
      item.images?.find((image) => image.cdnUrl)?.cdnUrl ||
      item.logo?.cdnUrl ||
      "";

    return [
      {
        id,
        published: Boolean(item.published) && !item._deleted,
        imageUrl,
        name: clean(item.name?.en) || id,
        nameAr: clean(item.name?.ar) || undefined,
        orderCount: toCount(item.numberOfOrders),
      },
    ];
  });
}
