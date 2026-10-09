import { approveOfferingApproval } from "@/lib/offering-approval";
import { upsertVendorOfferingFromForm } from "@/lib/vendor-offerings";
import type {
  OfferingBilingualLine,
  OfferingFormData,
  OfferingGalleryImage,
  OfferingOptionItem,
  OfferingOptionSection,
} from "@/lib/types";
import {
  createOffering,
  getOfferingDetails,
  updateOffering,
  type CreateOfferingAddOnGroup,
  type CreateOfferingImagePayload,
  type CreateOfferingNamedItem,
  type CreateOfferingPayload,
  type CreateOfferingRequiredOption,
  type OfferingDetailApiItem,
  type OfferingDetailNamedItem,
  type UpdateOfferingExistingImage,
  type UpdateOfferingImageUpload,
  type UpdateOfferingPayload,
} from "@/services/offerings";

export const OFFERING_TYPE_OPTIONS = [
  { value: "catering", label: "Catering" },
  { value: "delivery", label: "Delivery" },
  { value: "setups", label: "Setups" },
  { value: "hospitality", label: "Hospitality" },
  { value: "feasts", label: "Feasts" },
] as const;

const offeringFormsByKey: Record<string, OfferingFormData> = {};

function createLineId() {
  return `line-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

function formStorageKey(vendorId: string, offeringId: string | null) {
  return offeringId ? `${vendorId}:${offeringId}` : `${vendorId}:new`;
}

export function createEmptyOfferingForm(vendorId: string): OfferingFormData {
  return {
    vendorId,
    offeringId: null,
    englishName: "",
    arabicName: "",
    englishShortDescription: "",
    arabicShortDescription: "",
    gallery: [],
    initialExistingImageKeys: [],
    deletedImageKeys: [],
    order: 1,
    approveStatus: "approved",
    collectionIds: [],
    offeringType: "catering",
    categoryId: "",
    published: false,
    femaleService: false,
    minimumQty: "1",
    maxQty: "50",
    itemPriceQr: "0",
    startingPriceQr: "0",
    maxTimeHours: "0",
    setupTimeHours: "0",
    minimumNotice: "",
    serviceAvailability: "-1",
    serviceAvailabilityCode: "-1",
    englishCapacityNote: "",
    arabicCapacityNote: "",
    requirements: [],
    includedFood: [],
    drinks: [],
    presentation: [],
    decorations: [],
    furniture: [],
    equipment: [],
    notes: [],
    requiredOptions: [],
    addOns: [],
  };
}


function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createEmptyBilingualLine(): OfferingBilingualLine {
  return { id: createLineId(), english: "", arabic: "" };
}

export function createEmptyOptionItem(): OfferingOptionItem {
  return { id: createLineId(), english: "", arabic: "", price: "", maxQty: "" };
}

export function createEmptyOptionSection(kind: "required" | "addon" = "required") {
  return {
    id: createLineId(),
    titleEnglish: "",
    titleArabic: "",
    ...(kind === "required" ? { requiredNumbers: "1" } : {}),
    options: [createEmptyOptionItem()],
  };
}

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function recordId(value?: string) {
  return value || `line-${Math.random().toString(16).slice(2, 10)}`;
}

function vendorIdFromDetail(detail: OfferingDetailApiItem, fallback?: string) {
  if (typeof detail._vendor === "string" && detail._vendor.trim()) {
    return detail._vendor.trim();
  }
  if (detail._vendor && typeof detail._vendor === "object" && detail._vendor._id) {
    return detail._vendor._id;
  }
  return fallback ?? "";
}

function categoryIdFromDetail(detail: OfferingDetailApiItem) {
  if (typeof detail.categoryId === "string") return detail.categoryId.trim();
  return detail.categoryId?._id?.trim() ?? "";
}

function mapNamedLines(items: OfferingDetailNamedItem[] | null | undefined) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const english = cleanText(item.name?.en);
    const arabic = cleanText(item.name?.ar);
    if (!english && !arabic) return [];
    return [{ id: recordId(item._id), english, arabic }];
  });
}

function extractImageKey(image: {
  key?: string;
  url?: string;
  cdnUrl?: string;
}): string {
  if (image.key && image.key.trim()) return image.key.trim();
  const target = image.url || image.cdnUrl || "";
  const match = target.match(/(?:carts\/|offerings\/)(offerings\/.+)$/);
  if (match) return match[1];
  const simpleMatch = target.match(/(offerings\/[^?#]+)/);
  if (simpleMatch) return simpleMatch[1];
  return "";
}

function mapCollectionIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (
        item &&
        typeof item === "object" &&
        "_id" in item &&
        typeof item._id === "string"
      ) {
        return item._id.trim();
      }
      if (
        item &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string"
      ) {
        return item.id.trim();
      }
      return "";
    })
    .filter(Boolean);
}

function mapOfferingDetails(
  detail: OfferingDetailApiItem,
  input: { vendorId?: string; approvalId?: string },
): OfferingFormData {
  const base = createEmptyOfferingForm(vendorIdFromDetail(detail, input.vendorId));
  const images = (detail.images ?? []).flatMap((image) => {
    const rawUrl = image.url?.trim() || "";
    const rawCdnUrl = image.cdnUrl?.trim() || "";
    const previewUrl = rawCdnUrl || rawUrl;
    if (!previewUrl) return [];
    const filename = cleanText(image.filename) || "image.jpg";
    const alt =
      cleanText(image.alt) || filename.replace(/\.[^.]+$/, "") || filename;
    const key = extractImageKey(image);
    return [
      {
        id: recordId(image._id),
        url: previewUrl,
        originalUrl: rawUrl || previewUrl,
        cdnUrl: rawCdnUrl || previewUrl,
        key,
        filename,
        alt,
        name: filename,
        isExisting: true,
      },
    ];
  });

  const initialExistingImageKeys = images
    .map((image) => image.key)
    .filter(Boolean) as string[];

  const rawOrder = detail.order;
  const order =
    typeof rawOrder === "number" && Number.isFinite(rawOrder)
      ? rawOrder
      : Number(rawOrder) || 1;

  const approveStatus = cleanText(detail.approveStatus) || "approved";
  const collectionIds = mapCollectionIds(detail.collectionIds);

  return {
    ...base,
    vendorId: vendorIdFromDetail(detail, input.vendorId),
    offeringId: detail._id ?? input.approvalId ?? null,
    approvalId: input.approvalId,
    englishName: cleanText(detail.name?.en),
    arabicName: cleanText(detail.name?.ar),
    englishShortDescription: cleanText(detail.shortDescription?.en),
    arabicShortDescription: cleanText(detail.shortDescription?.ar),
    gallery: images,
    initialExistingImageKeys,
    deletedImageKeys: [],
    order,
    approveStatus,
    collectionIds,
    offeringType: cleanText(detail.serviceCategory) || base.offeringType,
    categoryId: categoryIdFromDetail(detail),
    published: Boolean(detail.published),
    femaleService: Boolean(detail.femaleServiceAvailable),
    minimumQty: numberText(detail.minimumQuantity),
    maxQty: numberText(detail.maxQuantity),
    itemPriceQr: numberText(detail.price),
    startingPriceQr: numberText(detail.startingPrice),
    maxTimeHours: numberText(detail.maxTimeInHours),
    setupTimeHours: numberText(detail.setupTimeInHours),
    minimumNotice: numberText(detail.minimumNotice),
    serviceAvailability: numberText(detail.serviceAvailability),
    serviceAvailabilityCode: numberText(detail.serviceAvailabilitySharedCode),
    englishCapacityNote: cleanText(detail.enoughFor?.en),
    arabicCapacityNote: cleanText(detail.enoughFor?.ar),
    requirements: mapNamedLines(detail.requirements),
    includedFood: mapNamedLines(detail.food),
    drinks: mapNamedLines(detail.drinks),
    presentation: mapNamedLines(detail.presentation),
    decorations: mapNamedLines(detail.decorations),
    furniture: mapNamedLines(detail.furniture),
    equipment: mapNamedLines(detail.equipment),
    notes: mapNamedLines(detail.notes),
    requiredOptions: (detail.requiredOptions ?? []).map((section) => ({
      id: recordId(section._id),
      titleEnglish: cleanText(section.name?.en),
      titleArabic: cleanText(section.name?.ar),
      requiredNumbers: numberText(section.requiredNumber) || "1",
      options: (section.options ?? []).map((option) => ({
        id: recordId(option._id),
        english: cleanText(option.name?.en),
        arabic: cleanText(option.name?.ar),
      })),
    })),
    addOns: (detail.addOns ?? []).map((section) => ({
      id: recordId(section._id),
      titleEnglish: cleanText(section.name?.en),
      titleArabic: cleanText(section.name?.ar),
      options: (section.addOns ?? []).map((option) => ({
        id: recordId(option._id),
        english: cleanText(option.name?.en),
        arabic: cleanText(option.name?.ar),
        price: numberText(option.price),
        maxQty: numberText(option.max),
      })),
    })),
  };
}

export type FetchOfferingFormInput = {
  vendorId?: string;
  offeringId?: string;
  approvalId?: string;
};

/** GET /admin/offerings/details?id= when editing. Empty form when creating. */
export async function fetchOfferingForm(
  input: FetchOfferingFormInput,
): Promise<OfferingFormData | null> {
  const id = input.offeringId || input.approvalId;
  if (!id) {
    if (!input.vendorId) return null;
    return createEmptyOfferingForm(input.vendorId);
  }

  return mapOfferingDetails(await getOfferingDetails(id), input);
}

function toNamedLines(items: OfferingBilingualLine[]): CreateOfferingNamedItem[] {
  return items
    .filter((item) => item.english.trim() || item.arabic.trim())
    .map((item) => ({
      name: {
        en: item.english.trim(),
        ar: item.arabic.trim(),
      },
    }));
}

function toRequiredOptions(
  sections: OfferingOptionSection[],
): CreateOfferingRequiredOption[] {
  return sections
    .map((section) => {
      const options = section.options
        .filter((option) => option.english.trim() || option.arabic.trim())
        .map((option) => ({
          name: {
            en: option.english.trim(),
            ar: option.arabic.trim(),
          },
        }));
      const requiredNumber = Number(section.requiredNumbers ?? "1");

      return {
        name: {
          en: section.titleEnglish.trim(),
          ar: section.titleArabic.trim(),
        },
        requiredNumber: Number.isFinite(requiredNumber) ? requiredNumber : 1,
        options,
      };
    })
    .filter(
      (section) =>
        section.name.en || section.name.ar || section.options.length > 0,
    );
}

function toAddOnGroups(
  sections: OfferingOptionSection[],
): CreateOfferingAddOnGroup[] {
  return sections
    .map((section) => {
      const addOns = section.options
        .filter((option) => option.english.trim() || option.arabic.trim())
        .map((option) => {
          const price = Number(option.price ?? "");
          const max = Number(option.maxQty ?? "");
          return {
            name: {
              en: option.english.trim(),
              ar: option.arabic.trim(),
            },
            price: Number.isFinite(price) ? price : 0,
            max: Number.isFinite(max) ? max : 0,
          };
        });

      return {
        name: {
          en: section.titleEnglish.trim(),
          ar: section.titleArabic.trim(),
        },
        addOns,
      };
    })
    .filter(
      (section) =>
        section.name.en || section.name.ar || section.addOns.length > 0,
    );
}

function getBase64ByteLength(dataUrl: string): number {
  const parts = dataUrl.split(",");
  if (parts.length < 2) return 0;
  const base64 = parts[1];
  let padding = 0;
  if (base64.endsWith("==")) {
    padding = 2;
  } else if (base64.endsWith("=")) {
    padding = 1;
  }
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function toOfferingImages(
  gallery: OfferingGalleryImage[],
): UpdateOfferingImageUpload[] {
  return gallery.flatMap((image) => {
    if (!image.url.startsWith("data:image/")) return [];

    const mime =
      image.type ||
      image.url.slice(5, image.url.indexOf(";")) ||
      "image/jpeg";
    const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "jpeg";
    const name = image.name || `${image.alt || "image"}.${ext}`;
    const size =
      typeof image.size === "number" && image.size > 0
        ? image.size
        : getBase64ByteLength(image.url);

    return [
      {
        name,
        type: mime,
        size,
        value: image.url,
      },
    ];
  });
}

function toExistingImagesPayload(
  gallery: OfferingGalleryImage[],
): UpdateOfferingExistingImage[] {
  return gallery.flatMap((image) => {
    if (image.url.startsWith("data:image/")) return [];

    const filename = image.filename || image.name || "image.jpg";
    const alt = image.alt || filename.replace(/\.[^.]+$/, "") || "image";

    return [
      {
        url: image.originalUrl || image.url,
        cdnUrl: image.cdnUrl || image.url,
        key: image.key || "",
        filename,
        alt,
      },
    ];
  });
}

function toAvailability(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : -1;
}

async function toCreateOfferingPayload(
  data: OfferingFormData,
): Promise<CreateOfferingPayload> {
  return {
    vendorId: data.vendorId,
    name: {
      en: data.englishName.trim(),
      ar: data.arabicName.trim(),
    },
    shortDescription: {
      en: data.englishShortDescription.trim(),
      ar: data.arabicShortDescription.trim(),
    },
    published: data.published,
    categoryId: data.categoryId,
    serviceCategory: data.offeringType,
    startingPrice: data.startingPriceQr.trim(),
    price: data.itemPriceQr.trim(),
    minimumQuantity: data.minimumQty.trim(),
    maxQuantity: data.maxQty.trim(),
    minimumNotice: data.minimumNotice.trim(),
    setupTimeInHours: data.setupTimeHours.trim(),
    maxTimeInHours: data.maxTimeHours.trim(),
    femaleServiceAvailable: data.femaleService,
    serviceAvailability: toAvailability(data.serviceAvailability),
    serviceAvailabilitySharedCode: data.serviceAvailabilityCode.trim(),
    requiredOptions: toRequiredOptions(data.requiredOptions),
    addOns: toAddOnGroups(data.addOns),
    food: toNamedLines(data.includedFood),
    notes: toNamedLines(data.notes),
    presentation: toNamedLines(data.presentation),
    decorations: toNamedLines(data.decorations),
    furniture: toNamedLines(data.furniture),
    equipment: toNamedLines(data.equipment),
    drinks: toNamedLines(data.drinks),
    requirements: toNamedLines(data.requirements),
    enoughFor: {
      en: data.englishCapacityNote.trim(),
      ar: data.arabicCapacityNote.trim(),
    },
    offeringimages: toOfferingImages(data.gallery),
  };
}

export function toUpdateOfferingPayload(
  data: OfferingFormData,
): UpdateOfferingPayload {
  const price = Number(data.itemPriceQr);
  const startingPrice = Number(data.startingPriceQr);
  const minimumQuantity = Number(data.minimumQty);
  const maxQuantity = Number(data.maxQty);
  const minimumNotice = Number(data.minimumNotice);
  const setupTimeInHours = Number(data.setupTimeHours);
  const maxTimeInHours = Number(data.maxTimeHours);
  const order =
    typeof data.order === "number" && Number.isFinite(data.order)
      ? data.order
      : Number(data.order) || 1;

  const remainingKeys = new Set(
    data.gallery
      .filter((image) => !image.url.startsWith("data:image/"))
      .map((image) => image.key?.trim())
      .filter(Boolean) as string[],
  );

  const initialKeys = data.initialExistingImageKeys ?? [];
  const autoDetectedDeletedKeys = initialKeys.filter(
    (key) => key && !remainingKeys.has(key),
  );

  const deletedImageKeys = Array.from(
    new Set([
      ...(data.deletedImageKeys ?? []),
      ...autoDetectedDeletedKeys,
    ]),
  ).filter(Boolean);

  return {
    name: {
      en: data.englishName.trim(),
      ar: data.arabicName.trim(),
    },
    shortDescription: {
      en: data.englishShortDescription.trim(),
      ar: data.arabicShortDescription.trim(),
    },
    serviceCategory: data.offeringType.trim(),
    categoryId: data.categoryId.trim(),
    vendorId: data.vendorId.trim(),
    price: Number.isFinite(price) ? price : 0,
    minimumQuantity: Number.isFinite(minimumQuantity) ? minimumQuantity : 0,
    maxQuantity: Number.isFinite(maxQuantity) ? maxQuantity : 0,
    startingPrice: Number.isFinite(startingPrice) ? startingPrice : 0,
    minimumNotice: Number.isFinite(minimumNotice) ? minimumNotice : 0,
    setupTimeInHours: Number.isFinite(setupTimeInHours) ? setupTimeInHours : 0,
    maxTimeInHours: Number.isFinite(maxTimeInHours) ? maxTimeInHours : 0,
    published: Boolean(data.published),
    femaleServiceAvailable: Boolean(data.femaleService),
    order,
    approveStatus: data.approveStatus?.trim() || "approved",
    enoughFor: {
      en: data.englishCapacityNote.trim(),
      ar: data.arabicCapacityNote.trim(),
    },
    requiredOptions: toRequiredOptions(data.requiredOptions),
    addOns: toAddOnGroups(data.addOns),
    food: toNamedLines(data.includedFood),
    requirements: toNamedLines(data.requirements),
    notes: toNamedLines(data.notes),
    collectionIds: Array.isArray(data.collectionIds) ? data.collectionIds : [],
    images: toExistingImagesPayload(data.gallery),
    deletedImageKeys,
    offeringimages: toOfferingImages(data.gallery),
  };
}

export async function saveVendorOfferingForm(data: OfferingFormData) {
  if (!data.offeringId) {
    const created = await createOffering(await toCreateOfferingPayload(data));
    const withId = { ...data, offeringId: created.id };
    const saved = upsertVendorOfferingFromForm(withId);
    const key = formStorageKey(data.vendorId, saved.id);
    offeringFormsByKey[key] = structuredClone(withId);
    return saved;
  }

  const payload = toUpdateOfferingPayload(data);
  await updateOffering(data.offeringId, payload);
  const saved = upsertVendorOfferingFromForm(data);
  const key = formStorageKey(data.vendorId, saved.id);
  offeringFormsByKey[key] = structuredClone({ ...data, offeringId: saved.id });
  return saved;
}

/** Swap for a real API call when available. */
export async function saveAndApproveOfferingForm(data: OfferingFormData) {
  const targetId = data.offeringId || data.approvalId;
  if (!targetId) {
    throw new Error("Approval id is required.");
  }

  if (data.offeringId) {
    const payload = toUpdateOfferingPayload(data);
    await updateOffering(data.offeringId, payload);
  }

  if (data.approvalId) {
    await approveOfferingApproval(data.approvalId);
  }

  const key = `${data.vendorId}:${targetId}`;
  offeringFormsByKey[key] = structuredClone(data);
  if (data.offeringId) {
    offeringFormsByKey[formStorageKey(data.vendorId, data.offeringId)] =
      structuredClone(data);
    upsertVendorOfferingFromForm({ ...data, offeringId: data.offeringId });
  }
  return true;
}
