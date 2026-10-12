import type { PopularCategory } from "@/lib/types";
import { getPopularCategories } from "@/services/dashboard";

function clean(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

export function formatCategoryDate(value: string) {
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

/** GET /adminadvanced/popular-categories */
export async function fetchPopularCategories(): Promise<PopularCategory[]> {
  const categories = await getPopularCategories();

  return categories.flatMap((item) => {
    const id = item._id ?? "";
    if (!id) return [];

    return [
      {
        id,
        name: clean(item.name?.en) || id,
        nameAr: clean(item.name?.ar) || undefined,
        createdAt: item.createdAt ?? "",
        approveStatus: item.approveStatus?.trim() || null,
        orderCount: toCount(item.numberOfOrders),
      },
    ];
  });
}
