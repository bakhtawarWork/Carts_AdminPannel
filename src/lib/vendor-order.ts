import type { VendorOrderItem, VendorOrderResponse } from "@/lib/types";
import { getVendorSequence, updateVendorSequence } from "@/services/vendors";

function mapVendor(item: {
  _id?: string;
  id?: string;
  order?: number;
  name?: { en?: string; ar?: string };
}): VendorOrderItem | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  return {
    id,
    englishName: item.name?.en?.replace(/\s+/g, " ").trim() || "",
    arabicName: item.name?.ar?.replace(/\s+/g, " ").trim() || "",
  };
}

export function formatVendorOrderLabel(item: VendorOrderItem, index: number) {
  return `${index + 1} - ${item.englishName} / ${item.arabicName}`;
}

/** GET /admin/vendors/sequence */
export async function fetchVendorOrder(): Promise<VendorOrderResponse> {
  const vendors = await getVendorSequence();
  const items = vendors
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(mapVendor)
    .filter((item): item is VendorOrderItem => item !== null);

  return { items };
}

/** PUT /admin/vendors/sequence */
export async function saveVendorOrder(vendorId: string, newOrder: number) {
  return updateVendorSequence({ vendorId, newOrder });
}

export function reorderVendorItems(
  items: VendorOrderItem[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
