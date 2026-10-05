import type { VipUser, VipUsersQuery, VipUsersResponse } from "@/lib/types";

/**
 * Static VIP users until a real API is available.
 * Replace `fetchVipUsers` with a fetch call — keep the query/response shape.
 */
const MOCK_VIP_USERS: VipUser[] = [
  {
    id: "vip-1",
    name: "Maryam Albuainain",
    phone: "+97430000138",
    orderCount: 56,
    totalSpent: 42213,
    currency: "QR",
  },
  {
    id: "vip-2",
    name: "Ahmed Al-Kuwari",
    phone: "+97430000241",
    orderCount: 48,
    totalSpent: 38950,
    currency: "QR",
  },
  {
    id: "vip-3",
    name: "Sara Al-Thani",
    phone: "+97455123456",
    orderCount: 42,
    totalSpent: 35120,
    currency: "QR",
  },
  {
    id: "vip-4",
    name: "Khalid Mansour",
    phone: "+97433445566",
    orderCount: 39,
    totalSpent: 29840,
    currency: "QR",
  },
  {
    id: "vip-5",
    name: "Noora Al-Ansari",
    phone: "+97466778899",
    orderCount: 37,
    totalSpent: 27610,
    currency: "QR",
  },
  {
    id: "vip-6",
    name: "Omar Hassan",
    phone: "+97430000987",
    orderCount: 34,
    totalSpent: 25400,
    currency: "QR",
  },
  {
    id: "vip-7",
    name: "Fatima Al-Mohannadi",
    phone: "+97455551234",
    orderCount: 31,
    totalSpent: 23150,
    currency: "QR",
  },
  {
    id: "vip-8",
    name: "Yousef Al-Marri",
    phone: "+97431112233",
    orderCount: 29,
    totalSpent: 21890,
    currency: "QR",
  },
  {
    id: "vip-9",
    name: "Hessa Al-Naimi",
    phone: "+97444445555",
    orderCount: 27,
    totalSpent: 20110,
    currency: "QR",
  },
  {
    id: "vip-10",
    name: "Jassim Al-Kuwari",
    phone: "+97436667788",
    orderCount: 25,
    totalSpent: 18940,
    currency: "QR",
  },
  {
    id: "vip-11",
    name: "Aisha Rahman",
    phone: "+97439990011",
    orderCount: 24,
    totalSpent: 17620,
    currency: "QR",
  },
  {
    id: "vip-12",
    name: "Mohammed Saleh",
    phone: "+97432223344",
    orderCount: 22,
    totalSpent: 16480,
    currency: "QR",
  },
  {
    id: "vip-13",
    name: "Lina Faraj",
    phone: "+97458889900",
    orderCount: 21,
    totalSpent: 15330,
    currency: "QR",
  },
  {
    id: "vip-14",
    name: "Hamad Al-Dosari",
    phone: "+97430112233",
    orderCount: 20,
    totalSpent: 14200,
    currency: "QR",
  },
  {
    id: "vip-15",
    name: "Reem Al-Attiyah",
    phone: "+97457776655",
    orderCount: 19,
    totalSpent: 13150,
    currency: "QR",
  },
  {
    id: "vip-16",
    name: "Sultan Al-Hajri",
    phone: "+97434445566",
    orderCount: 18,
    totalSpent: 12480,
    currency: "QR",
  },
  {
    id: "vip-17",
    name: "Maha Al-Sulaiti",
    phone: "+97456667788",
    orderCount: 17,
    totalSpent: 11820,
    currency: "QR",
  },
  {
    id: "vip-18",
    name: "Nasser Al-Emadi",
    phone: "+97431234567",
    orderCount: 16,
    totalSpent: 10990,
    currency: "QR",
  },
  {
    id: "vip-19",
    name: "Dana Al-Khalifa",
    phone: "+97459876543",
    orderCount: 15,
    totalSpent: 10140,
    currency: "QR",
  },
  {
    id: "vip-20",
    name: "Ali Al-Meadhadi",
    phone: "+97433334444",
    orderCount: 14,
    totalSpent: 9650,
    currency: "QR",
  },
  {
    id: "vip-21",
    name: "Maryam Hassan",
    phone: "+97430005555",
    orderCount: 13,
    totalSpent: 8920,
    currency: "QR",
  },
  {
    id: "vip-22",
    name: "Tariq Al-Baker",
    phone: "+97437778899",
    orderCount: 12,
    totalSpent: 8340,
    currency: "QR",
  },
  {
    id: "vip-23",
    name: "Shaikha Al-Jaber",
    phone: "+97454443322",
    orderCount: 11,
    totalSpent: 7780,
    currency: "QR",
  },
  {
    id: "vip-24",
    name: "Faisal Al-Kaabi",
    phone: "+97436665544",
    orderCount: 10,
    totalSpent: 7120,
    currency: "QR",
  },
  {
    id: "vip-25",
    name: "Amna Al-Farsi",
    phone: "+97451112233",
    orderCount: 9,
    totalSpent: 6540,
    currency: "QR",
  },
];

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
