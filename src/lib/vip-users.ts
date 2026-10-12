import type { VipUser, VipUsersQuery, VipUsersResponse } from "@/lib/types";
import { getVipUsers } from "@/services/dashboard";

export function formatMoneySpent(amount: number, currency = "QR") {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function mapUser(item: {
  id?: string;
  name?: string;
  mobile?: string;
  noOfOrders?: number;
  totalMoneySpent?: number;
}): VipUser | null {
  const id = item.id?.trim();
  if (!id) return null;

  return {
    id,
    name: item.name?.replace(/\s+/g, " ").trim() || "—",
    phone: item.mobile?.trim() || "",
    orderCount: toCount(item.noOfOrders),
    totalSpent: toCount(item.totalMoneySpent),
    currency: "QR",
  };
}

/** GET /adminadvanced/vip-users — skip/take from the current page. */
export async function fetchVipUsers(
  query: VipUsersQuery,
): Promise<VipUsersResponse> {
  const page = Math.max(1, query.page);
  const pageSize = Math.max(1, query.pageSize);
  const payload = await getVipUsers({
    skip: (page - 1) * pageSize,
    take: pageSize,
    name: query.name,
    mobile: query.phone,
  });

  const items = payload.users
    .map(mapUser)
    .filter((user): user is VipUser => user !== null);

  return {
    items,
    total: toCount(payload.total) || items.length,
    page,
    pageSize,
  };
}
