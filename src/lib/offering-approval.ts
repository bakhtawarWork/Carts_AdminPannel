import type {
  OfferingApprovalRecord,
  OfferingApprovalTab,
  OfferingApprovalsQuery,
  OfferingApprovalsResponse,
} from "@/lib/types";
import {
  approveOffering,
  approveOfferingDelete,
  getOfferingApprovalList,
  rejectOffering,
  rejectOfferingDelete,
  type OfferingApprovalApiItem,
  type OfferingApprovalStatus,
} from "@/services/offerings";

let offeringApprovalsState: OfferingApprovalRecord[] = [];

const approvalCache = new Map<string, OfferingApprovalRecord>();

const STATUS_BY_TAB: Record<OfferingApprovalTab, OfferingApprovalStatus> = {
  new: "created",
  delete: "deleteRequested",
};

export function formatOfferingApprovalDate(value: string) {
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

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function splitBilingual(value?: string) {
  const text = cleanText(value);
  if (!text) return { english: "—", arabic: "" };

  const separator = text.search(/\s+\/\s+/);
  if (separator === -1) return { english: text, arabic: "" };

  const english = text.slice(0, separator).trim();
  const arabic = text.slice(separator).replace(/^\s*\/\s*/, "").trim();
  return {
    english: english || "—",
    arabic,
  };
}

function mapApproval(
  item: OfferingApprovalApiItem,
  tab: OfferingApprovalTab,
): OfferingApprovalRecord | null {
  const id = item._id ?? item.id;
  if (!id) return null;

  const vendor = splitBilingual(item.vendor);
  const category = splitBilingual(item.offeringCategory);
  const englishName = cleanText(item.englishName) || "—";

  return {
    id,
    vendorId: "",
    requestType: tab,
    published: Boolean(item.published),
    thumbUrl: item.thumb?.trim() ?? "",
    thumbAlt: englishName,
    vendorEnglish: vendor.english,
    vendorArabic: vendor.arabic,
    englishName,
    arabicName: cleanText(item.arabicName) || "—",
    createdAt: item.created ?? "",
    updatedAt: item.updated ?? "",
    categoryEnglish: category.english,
    categoryArabic: category.arabic,
  };
}

/** GET /offerings/approval-list?status=created for New, status=deleted for Delete. */
export async function fetchOfferingApprovals(
  query: OfferingApprovalsQuery,
): Promise<OfferingApprovalsResponse> {
  const payload = await getOfferingApprovalList(STATUS_BY_TAB[query.tab]);
  const items = payload.offerings
    .map((item) => mapApproval(item, query.tab))
    .filter((item): item is OfferingApprovalRecord => item !== null);

  for (const item of items) approvalCache.set(item.id, item);

  const pageSize = Math.max(1, query.pageSize);
  const total = Math.max(payload.total, items.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

function removeLocalApproval(id: string) {
  approvalCache.delete(id);
  offeringApprovalsState = offeringApprovalsState.filter(
    (item) => item.id !== id,
  );
}

/** PUT /admin/offerings/approve?id= — new offering requests. */
export async function approveOfferingApproval(id: string) {
  const result = await approveOffering(id);
  removeLocalApproval(id);
  return result;
}

/** PUT /admin/offerings/reject?id= — new offering requests. */
export async function rejectOfferingApproval(id: string) {
  const result = await rejectOffering(id);
  removeLocalApproval(id);
  return result;
}

/** PUT /admin/offerings/approve-delete?id= */
export async function approveOfferingDeletion(id: string) {
  const result = await approveOfferingDelete(id);
  removeLocalApproval(id);
  return result;
}

/** PUT /admin/offerings/reject-delete?id= */
export async function rejectOfferingDeletion(id: string) {
  const result = await rejectOfferingDelete(id);
  removeLocalApproval(id);
  return result;
}

export function getOfferingApprovalById(id: string) {
  const cached = approvalCache.get(id);
  if (cached) return { ...cached };

  const record = offeringApprovalsState.find((item) => item.id === id);
  return record ? { ...record } : null;
}
