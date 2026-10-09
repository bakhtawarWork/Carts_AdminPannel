import { getVendorById } from "@/lib/vendors";
import type {
  VendorRecord,
  VendorUserFormData,
  VendorUserRecord,
  VendorUsersResponse,
} from "@/lib/types";
import { ApiError } from "@/services/api";
import {
  createVendorUserRequest,
  getVendorUserById,
  getVendorUsers,
  updateVendorUserRequest,
  type CreateVendorUserPayload,
  type UpdateVendorUserPayload,
  type VendorUserApiItem,
} from "@/services/vendors";

let vendorUsersState: VendorUserRecord[] = [];

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createUserId() {
  return `vu-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`;
}

function normalizeForm(input: VendorUserFormData) {
  return {
    name: (input.name || "").trim(),
    email: (input.email || "").trim(),
    mobile: (input.mobile || "").trim(),
    password: (input.password || "").trim(),
    preferredLanguage: input.preferredLanguage?.trim() || undefined,
    gender: input.gender?.trim() || undefined,
    isBlocked: Boolean(input.isBlocked),
  };
}

function resolveVendorId(
  value: VendorUserApiItem["_vendor"],
  fallbackVendorId: string,
) {
  if (!value) return fallbackVendorId;
  if (typeof value === "string") return value.trim() || fallbackVendorId;
  return value._id?.trim() || value.id?.trim() || fallbackVendorId;
}

function mapVendorUser(
  item: VendorUserApiItem,
  vendorId: string,
): VendorUserRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  return {
    id,
    vendorId: resolveVendorId(item._vendor, vendorId),
    name: item.name?.trim() || "—",
    email: item.email?.trim() || "—",
    mobile: item.mobile?.trim() || "—",
    preferredLanguage: item.preferredLanguage?.trim() || "en",
    blocked: Boolean(item.isBlocked),
    createdAt: item.createdAt ?? "",
  };
}

export function vendorUserFormFromRecord(
  record: VendorUserRecord,
): VendorUserFormData {
  return {
    name: record.name === "—" ? "" : record.name,
    email: record.email === "—" ? "" : record.email,
    mobile: record.mobile === "—" ? "" : record.mobile,
    password: "",
    preferredLanguage: record.preferredLanguage || "en",
    isBlocked: record.blocked,
  };
}

export function getVendorUserSaveErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message.trim()) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not save vendor user. Please try again.";
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

/** GET /admin/vendors/users/:userId — used when opening the edit popup. */
export async function fetchVendorUserById(
  userId: string,
  vendorId: string,
): Promise<VendorUserRecord> {
  const item = await getVendorUserById(userId);
  const record = mapVendorUser(item, vendorId);
  if (!record) {
    throw new Error("Vendor user not found.");
  }
  return record;
}

/** POST /vendors/users */
export async function createVendorUser(
  vendorId: string,
  input: VendorUserFormData,
) {
  const values = normalizeForm(input);
  if (!values.name || !values.email || !values.mobile || !values.password) {
    throw new Error("All fields are required.");
  }

  const payload: CreateVendorUserPayload = {
    vendorId,
    name: values.name,
    email: values.email,
    mobile: values.mobile,
    password: values.password,
  };

  if (values.preferredLanguage) {
    payload.preferredLanguage = values.preferredLanguage;
  }
  if (values.gender) {
    payload.gender = values.gender;
  }

  return createVendorUserRequest(payload);
}

/** PATCH /admin/vendors/users/:userId */
export async function updateVendorUser(
  vendorId: string,
  userId: string,
  input: VendorUserFormData,
) {
  const values = normalizeForm(input);
  if (!values.name || !values.email || !values.mobile) {
    throw new Error("Name, email, and mobile are required.");
  }

  const payload: UpdateVendorUserPayload = {
    name: values.name,
    email: values.email,
    mobile: values.mobile,
    password: values.password,
    isBlocked: values.isBlocked,
  };

  if (values.preferredLanguage) {
    payload.preferredLanguage = values.preferredLanguage;
  }

  const result = await updateVendorUserRequest(userId, payload);

  const record = mapVendorUser(result.user, vendorId);
  if (!record) {
    throw new Error(result.message);
  }

  return {
    ...record,
    message: result.message,
  };
}

/** Update vendor user blocked status via API */
export async function setVendorUserBlocked(
  vendorId: string,
  userId: string,
  blocked: boolean,
  user?: Partial<VendorUserRecord>,
) {
  const payload: UpdateVendorUserPayload = {
    isBlocked: blocked,
  };

  if (user?.name && user.name !== "—") {
    payload.name = user.name;
  }
  if (user?.email && user.email !== "—") {
    payload.email = user.email;
  }
  if (user?.mobile && user.mobile !== "—") {
    payload.mobile = user.mobile;
  }

  const result = await updateVendorUserRequest(userId, payload);
  const record = mapVendorUser(result.user, vendorId);

  return {
    record,
    message: result.message,
  };
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
