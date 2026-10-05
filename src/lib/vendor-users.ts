import { getVendorById } from "@/lib/vendors";
import type {
  VendorRecord,
  VendorUserFormData,
  VendorUserRecord,
  VendorUsersResponse,
} from "@/lib/types";
import {
  getVendorUsers,
  type VendorUserApiItem,
} from "@/services/vendors";

let vendorUsersState: VendorUserRecord[] = [
  {
    id: "vu-1",
    vendorId: "vnd-16",
    name: "Creams Sweets Cafe",
    email: "hamid.alzamel@creams-sweets.com",
    mobile: "+97460001523",
    blocked: false,
    createdAt: "2024-02-10T09:00:00.000Z",
  },
  {
    id: "vu-2",
    vendorId: "vnd-6",
    name: "Sable Sweets Manager",
    email: "manager@sablesweets.qa",
    mobile: "+97455112233",
    blocked: false,
    createdAt: "2024-06-18T11:30:00.000Z",
  },
  {
    id: "vu-3",
    vendorId: "vnd-2",
    name: "Melenzane Admin",
    email: "admin@melenzane.qa",
    mobile: "+97433445566",
    blocked: false,
    createdAt: "2024-03-15T08:45:00.000Z",
  },
  {
    id: "vu-4",
    vendorId: "vnd-2",
    name: "Kitchen Lead",
    email: "kitchen@melenzane.qa",
    mobile: "+97477889900",
    blocked: true,
    createdAt: "2025-01-20T14:20:00.000Z",
  },
  {
    id: "vu-5",
    vendorId: "vnd-4",
    name: "My Fair Sweets Owner",
    email: "owner@myfairsweets.com",
    mobile: "+97466778899",
    blocked: false,
    createdAt: "2023-12-01T10:00:00.000Z",
  },
];

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createUserId() {
  return `vu-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`;
}

function normalizeForm(input: VendorUserFormData) {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    mobile: input.mobile.trim(),
    password: input.password,
  };
}

function mapVendorUser(
  item: VendorUserApiItem,
  vendorId: string,
): VendorUserRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  return {
    id,
    vendorId: item._vendor || vendorId,
    name: item.name?.trim() || "—",
    email: item.email?.trim() || "—",
    mobile: item.mobile?.trim() || "—",
    blocked: Boolean(item.isBlocked),
    createdAt: item.createdAt ?? "",
  };
}

function vendorForUsers(vendorId: string): VendorRecord {
  const cached = getVendorById(vendorId);
  if (cached) return { ...cached };

  return {
    id: vendorId,
    published: false,
    isDraft: false,
    englishName: "",
    arabicName: "",
    createdAt: "",
    updatedAt: "",
  };
}

/** GET /admin/vendors/users?vendorId= */
export async function fetchVendorUsers(
  vendorId: string,
): Promise<VendorUsersResponse> {
  const users = await getVendorUsers(vendorId);
  const items = users
    .map((user) => mapVendorUser(user, vendorId))
    .filter((user): user is VendorUserRecord => user !== null);

  return {
    vendor: vendorForUsers(vendorId),
    items,
    total: items.length,
  };
}

/** Swap for a real API call when available. */
export async function createVendorUser(
  vendorId: string,
  input: VendorUserFormData,
) {
  await delay(240);
  const values = normalizeForm(input);
  if (!values.name || !values.email || !values.mobile || !values.password) {
    throw new Error("All fields are required.");
  }

  const record: VendorUserRecord = {
    id: createUserId(),
    vendorId,
    name: values.name,
    email: values.email,
    mobile: values.mobile,
    blocked: false,
    createdAt: new Date().toISOString(),
  };
  vendorUsersState = [record, ...vendorUsersState];
  return { ...record };
}

/** Swap for a real API call when available. */
export async function updateVendorUser(
  vendorId: string,
  userId: string,
  input: VendorUserFormData,
) {
  await delay(220);
  const values = normalizeForm(input);
  if (!values.name || !values.email || !values.mobile) {
    throw new Error("Name, email, and mobile are required.");
  }

  const index = vendorUsersState.findIndex(
    (user) => user.id === userId && user.vendorId === vendorId,
  );
  if (index === -1) return null;

  vendorUsersState[index] = {
    ...vendorUsersState[index],
    name: values.name,
    email: values.email,
    mobile: values.mobile,
  };
  return { ...vendorUsersState[index] };
}

/** Swap for a real API call when available. */
export async function setVendorUserBlocked(
  vendorId: string,
  userId: string,
  blocked: boolean,
) {
  await delay(180);
  const index = vendorUsersState.findIndex(
    (user) => user.id === userId && user.vendorId === vendorId,
  );
  if (index === -1) return null;

  vendorUsersState[index] = {
    ...vendorUsersState[index],
    blocked,
  };
  return { ...vendorUsersState[index] };
}

export function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
