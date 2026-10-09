import type { VipUser, VipUsersQuery, VipUsersResponse } from "@/lib/types";

/**
 * Static VIP users until a real API is available.
 * Replace `fetchVipUsers` with a fetch call — keep the query/response shape.
 */
const MOCK_VIP_USERS: VipUser[] = [];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatMoneySpent(amount: number, currency = "QR") {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function filterVipUsers(users: VipUser[], query: VipUsersQuery) {
  const nameNeedle = query.name?.trim().toLowerCase() ?? "";
  const phoneNeedle = query.phone?.trim().toLowerCase() ?? "";

  return users.filter((user) => {
    const matchesName =
      !nameNeedle || user.name.toLowerCase().includes(nameNeedle);
    const matchesPhone =
      !phoneNeedle || user.phone.toLowerCase().includes(phoneNeedle);
    return matchesName && matchesPhone;
  });
}

/**
 * Swap this for a real API call, e.g.
 * `fetch(\`/api/analysis/vip-users?name=...\`)`
 */
export async function fetchVipUsers(
  query: VipUsersQuery,
): Promise<VipUsersResponse> {
  await delay();

  const filtered = filterVipUsers(MOCK_VIP_USERS, query);
  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize).map((user) => ({ ...user })),
    total: filtered.length,
    page,
    pageSize,
  };
}
