import type { UserRecord, UsersQuery, UsersResponse } from "@/lib/types";

const INITIAL_USERS: UserRecord[] = [
  {
    id: "user-1",
    name: "test",
    mobile: "+97456588886",
    smsVerified: true,
    blocked: false,
    email: "",
    joinedAt: "2026-02-06T10:00:00.000Z",
    role: "customer",
  },
  {
    id: "user-2",
    name: "Bakhtawar Jamadar",
    mobile: "+97455105133",
    smsVerified: true,
    blocked: false,
    email: "bakhtawarjamadar99@gmail.com",
    joinedAt: "2026-02-05T14:30:00.000Z",
    role: "customer",
  },
  {
    id: "user-3",
    name: "HMR",
    mobile: "+97433121549",
    smsVerified: true,
    blocked: false,
    email: "",
    joinedAt: "2026-02-05T09:15:00.000Z",
    role: "vendor",
  },
  {
    id: "user-4",
    name: "BUYcar",
    mobile: "+97466643893",
    smsVerified: true,
    blocked: false,
    email: "",
    joinedAt: "2026-02-03T16:45:00.000Z",
    role: "vendor",
  },
  {
    id: "user-5",
    name: "Maryam Albuainain",
    mobile: "+97433445566",
    smsVerified: true,
    blocked: false,
    email: "maryam.albuainain@example.com",
    joinedAt: "2026-01-28T11:20:00.000Z",
    role: "customer",
  },
  {
    id: "user-6",
    name: "Ahmed Al-Kuwari",
    mobile: "+97477889900",
    smsVerified: false,
    blocked: false,
    email: "ahmed.kuwari@example.com",
    joinedAt: "2026-01-25T08:00:00.000Z",
    role: "customer",
  },
  {
    id: "user-7",
    name: "Sara Al-Thani",
    mobile: "+97455667788",
    smsVerified: true,
    blocked: true,
    email: "sara.thani@example.com",
    joinedAt: "2026-01-20T13:10:00.000Z",
    role: "customer",
  },
  {
    id: "user-8",
    name: "Khalid Mansour",
    mobile: "+97466778899",
    smsVerified: true,
    blocked: false,
    email: "khalid.mansour@example.com",
    joinedAt: "2026-01-18T17:35:00.000Z",
    role: "vendor",
  },
  {
    id: "user-9",
    name: "Noora Al-Ansari",
    mobile: "+97444556677",
    smsVerified: false,
    blocked: false,
    email: "",
    joinedAt: "2026-01-15T10:50:00.000Z",
    role: "customer",
  },
  {
    id: "user-10",
    name: "Omar Hassan",
    mobile: "+97433221100",
    smsVerified: true,
    blocked: false,
    email: "omar.hassan@example.com",
    joinedAt: "2026-01-12T15:25:00.000Z",
    role: "vendor",
  },
  {
    id: "user-11",
    name: "Fatima Al-Mohannadi",
    mobile: "+97499887766",
    smsVerified: true,
    blocked: false,
    email: "fatima.m@example.com",
    joinedAt: "2026-01-08T09:40:00.000Z",
    role: "customer",
  },
  {
    id: "user-12",
    name: "Yousef Al-Marri",
    mobile: "+97411223344",
    smsVerified: true,
    blocked: false,
    email: "yousef.marri@example.com",
    joinedAt: "2026-01-05T12:00:00.000Z",
    role: "vendor",
  },
];

let usersStore: UserRecord[] = INITIAL_USERS.map((user) => ({ ...user }));

export const USER_ROLE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
] as const;

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatUserJoinDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function parseDateStart(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value: string) {
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function filterUsers(items: UserRecord[], query: UsersQuery) {
  const needle = query.search?.trim().toLowerCase() ?? "";
  const joinedFrom = query.joinedFrom ? parseDateStart(query.joinedFrom) : null;
  const joinedTo = query.joinedTo ? parseDateEnd(query.joinedTo) : null;

  return items.filter((user) => {
    if (query.role && user.role !== query.role) return false;

    if (needle) {
      const haystack = [user.name, user.mobile, user.email]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    const joinedAt = new Date(user.joinedAt).getTime();
    if (joinedFrom && joinedAt < joinedFrom.getTime()) return false;
    if (joinedTo && joinedAt > joinedTo.getTime()) return false;

    return true;
  });
}

function sortUsers(items: UserRecord[], sortDir: "asc" | "desc" = "desc") {
  return [...items].sort((left, right) => {
    const delta =
      new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime();
    return sortDir === "asc" ? delta : -delta;
  });
}

export async function fetchUsers(query: UsersQuery): Promise<UsersResponse> {
  await delay();

  const filtered = sortUsers(
    filterUsers(usersStore, query),
    query.sortDir ?? "desc",
  );

  const start = (query.page - 1) * query.pageSize;
  const items = filtered.slice(start, start + query.pageSize);

  return {
    items,
    total: filtered.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function fetchUsersForExport(
  query: Omit<UsersQuery, "page" | "pageSize">,
): Promise<UserRecord[]> {
  await delay(120);
  return sortUsers(filterUsers(usersStore, query), query.sortDir ?? "desc");
}

export async function fetchUserById(id: string): Promise<UserRecord | null> {
  await delay();
  return usersStore.find((user) => user.id === id) ?? null;
}

export async function setUserBlocked(
  id: string,
  blocked: boolean,
): Promise<UserRecord | null> {
  await delay(120);
  const index = usersStore.findIndex((user) => user.id === id);
  if (index === -1) return null;
  usersStore[index] = { ...usersStore[index], blocked };
  return usersStore[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  await delay(120);
  const before = usersStore.length;
  usersStore = usersStore.filter((user) => user.id !== id);
  return usersStore.length < before;
}

export function usersToCsv(users: UserRecord[]) {
  const headers = [
    "Name",
    "Mobile",
    "SMS Verified",
    "Blocked",
    "Email",
    "Join Date",
    "Role",
  ];

  const rows = users.map((user) => [
    user.name,
    user.mobile,
    String(user.smsVerified),
    String(user.blocked),
    user.email || "-",
    formatUserJoinDate(user.joinedAt),
    user.role,
  ]);

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export function downloadUsersCsv(users: UserRecord[], filename: string) {
  const csv = usersToCsv(users);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
