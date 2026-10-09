import type {
  VendorDeliveryAreaEntry,
  VendorFormData,
  VendorImageAsset,
  VendorServiceFields,
  VendorServiceId,
} from "@/lib/types";
import { readImageFileAsDataUrl } from "@/lib/offering-image-upload";
import {
  createVendor,
  createVendorDraft,
  getVendorDetails,
  updateVendor,
  type CreateVendorImagePayload,
  type CreateVendorPayload,
  type CreateVendorServiceMap,
  type UpdateVendorAreaCost,
  type UpdateVendorContactInfo,
  type UpdateVendorDeletedImage,
  type UpdateVendorImageUpload,
  type UpdateVendorPayload,
  type UpdateVendorServiceImages,
  type UpdateVendorServiceMap,
  type VendorDetailApiItem,
  type VendorDetailAreaApiItem,
  type VendorDetailImageApiItem,
} from "@/services/vendors";

export const VENDOR_SERVICES: {
  id: VendorServiceId;
  label: string;
}[] = [
  { id: "catering", label: "Catering" },
  { id: "delivery", label: "Delivery" },
  { id: "setups", label: "Setups" },
  { id: "hospitality", label: "Hospitality" },
  { id: "feasts", label: "Feasts" },
];

function emptyServiceFields(): VendorServiceFields {
  return {
    images: [],
    minNotice: "",
    capacity: "",
    deliveryAreas: [],
  };
}

export function createEmptyVendorForm(): VendorFormData {
  return {
    englishName: "",
    englishTagline: "",
    englishShortDescription: "",
    arabicName: "",
    arabicTagline: "",
    arabicShortDescription: "",
    logo: null,
    initialLogoKey: undefined,
    deletedLogoKeys: [],
    email: "",
    secondaryEmail: "",
    accountingEmails: [],
    mobile: "",
    phone: "",
    published: false,
    doublePoints: false,
    percentage: "100",
    order: 0,
    isFullyBooked: false,
    minimumOrderAmountCatering: "0",
    minimumOrderAmountDelivery: "0",
    minimumOrderTimeInHours: "0",
    collectionIds: [],
    servicesOffered: [],
    services: {
      catering: emptyServiceFields(),
      delivery: emptyServiceFields(),
      setups: emptyServiceFields(),
      hospitality: emptyServiceFields(),
      feasts: emptyServiceFields(),
    },
    initialServiceImageKeys: {},
    deletedServiceImageKeys: {},
  };
}

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SERVICE_IDS = new Set<VendorServiceId>(
  VENDOR_SERVICES.map((service) => service.id),
);

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function imageSource(item: VendorDetailImageApiItem | string) {
  if (typeof item === "string") return item.trim();
  const candidates = [
    item.url,
    item.src,
    item.path,
    item.value,
    item.image,
    item.cdnUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

function extractVendorImageKey(item: VendorDetailImageApiItem | string): string {
  if (typeof item === "string") {
    const match = item.match(/(vendors\/[^?#]+)/);
    return match ? match[1] : "";
  }
  if (item.key && item.key.trim()) return item.key.trim();
  const target =
    item.url || item.src || item.path || item.value || item.image || item.cdnUrl || "";
  const match = target.match(/(vendors\/[^?#]+)/);
  return match ? match[1] : "";
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

function mapImage(
  item: VendorDetailImageApiItem | string,
  fallbackTitle: string,
): VendorImageAsset | null {
  const url = imageSource(item);
  if (!url) return null;

  const record = typeof item === "string" ? null : item;
  const title = cleanText(record?.name || record?.title) || fallbackTitle;
  const key = extractVendorImageKey(item);
  return {
    id:
      record?._id ||
      record?.id ||
      `img-${Math.random().toString(16).slice(2, 10)}`,
    url,
    title,
    alt: cleanText(record?.alt) || title,
    key: key || undefined,
    isExisting: true,
  };
}

function mapImages(
  items: Array<VendorDetailImageApiItem | string> | null | undefined,
  fallbackTitle: string,
) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => mapImage(item, fallbackTitle))
    .filter((item): item is VendorImageAsset => item !== null);
}

function mapDeliveryAreas(
  items: VendorDetailAreaApiItem[] | null | undefined,
): VendorDeliveryAreaEntry[] {
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    const areaId = item.areaId?.trim();
    if (!areaId) return [];
    return [
      {
        id: item._id || item.id || `area-${areaId}`,
        areaId,
        cost: numberText(item.fees) || "0",
      },
    ];
  });
}

function mapVendorDetails(
  vendorId: string,
  detail: VendorDetailApiItem,
): VendorFormData {
  const base = createEmptyVendorForm();
  const englishName = cleanText(detail.name?.en);
  const servicesOffered = (detail.serviceCategories ?? []).filter(
    (id): id is VendorServiceId => SERVICE_IDS.has(id as VendorServiceId),
  );
  const logo =
    mapImages(detail.images, englishName || "Vendor logo")[0] ??
    mapImages(detail.logoImg, englishName || "Vendor logo")[0] ??
    null;

  const initialLogoKey = logo?.key;

  const initialServiceImageKeys: Partial<Record<VendorServiceId, string[]>> = {};
  const services = { ...base.services };
  for (const service of VENDOR_SERVICES) {
    const id = service.id;
    const rawVendorImages = detail.vendorImages ?? detail.vendorimages;
    const mappedImages = mapImages(rawVendorImages?.[id], service.label);
    initialServiceImageKeys[id] = mappedImages
      .map((img) => img.key)
      .filter(Boolean) as string[];
    services[id] = {
      images: mappedImages,
      minNotice: numberText(detail.minimumNotice?.[id]),
      capacity: numberText(detail.capacity?.[id]),
      deliveryAreas: mapDeliveryAreas(detail.deliveryAreasAndCost?.[id]),
    };
  }

  const secondaryEmail = cleanText(detail.contactInfo?.secondaryEmail);
  const accountingEmails = Array.isArray(detail.contactInfo?.accountingEmails)
    ? detail.contactInfo.accountingEmails.map(cleanText).filter(Boolean)
    : [];
  const rawOrder = detail.order;
  const order =
    typeof rawOrder === "number" && Number.isFinite(rawOrder)
      ? rawOrder
      : Number(rawOrder) || 0;
  const isFullyBooked = Boolean(detail.isFullyBooked);
  const minimumOrderAmountCatering = numberText(
    detail.minimumOrderAmountCatering,
  );
  const minimumOrderAmountDelivery = numberText(
    detail.minimumOrderAmountDelivery,
  );
  const minimumOrderTimeInHours = numberText(detail.minimumOrderTimeInHours);
  const collectionIds = mapCollectionIds(detail.collectionIds);

  return {
    ...base,
    id: detail._id || detail.id || vendorId,
    englishName,
    englishTagline: cleanText(detail.tagline?.en),
    englishShortDescription: cleanText(detail.shortDescription?.en),
    arabicName: cleanText(detail.name?.ar),
    arabicTagline: cleanText(detail.tagline?.ar),
    arabicShortDescription: cleanText(detail.shortDescription?.ar),
    logo,
    initialLogoKey,
    deletedLogoKeys: [],
    initialServiceImageKeys,
    deletedServiceImageKeys: {},
    email: cleanText(detail.contactInfo?.primaryEmail),
    secondaryEmail,
    accountingEmails,
    mobile: cleanText(detail.contactInfo?.mobile),
    phone: cleanText(detail.contactInfo?.phone),
    published: Boolean(detail.published),
    doublePoints: Boolean(detail.doublePointReward),
    percentage: numberText(detail.percentage),
    order,
    isFullyBooked,
    minimumOrderAmountCatering,
    minimumOrderAmountDelivery,
    minimumOrderTimeInHours,
    collectionIds,
    servicesOffered,
    services,
  };
}

/** GET /admin/vendors/details?vendorId= — new vendor form when id is omitted. */
export async function fetchVendorForm(
  id?: string,
): Promise<VendorFormData | null> {
  if (!id) return createEmptyVendorForm();
  return mapVendorDetails(id, await getVendorDetails(id));
}

function toNumberOrNull(value: string, enabled: boolean): number | null {
  if (!enabled) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFees(cost: string): number {
  const parsed = Number(cost);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercentage(value: string): number {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

async function toImagePayload(
  image: VendorImageAsset | null,
): Promise<CreateVendorImagePayload[]> {
  if (!image) return [];

  if (image.file) {
    const value = await readImageFileAsDataUrl(image.file);
    return [
      {
        name: image.file.name || image.title || "image.png",
        size: image.file.size,
        type: image.file.type || "image/png",
        value,
      },
    ];
  }

  if (image.url.startsWith("data:image/")) {
    const mime = image.url.slice(5, image.url.indexOf(";")) || "image/png";
    return [
      {
        name: image.title || "image.png",
        size: 0,
        type: mime,
        value: image.url,
      },
    ];
  }

  if (image.url.startsWith("blob:")) {
    const blob = await fetch(image.url).then((response) => response.blob());
    const file = new File([blob], image.title || "image.png", {
      type: blob.type || "image/png",
    });
    const value = await readImageFileAsDataUrl(file);
    return [
      {
        name: file.name,
        size: file.size,
        type: file.type,
        value,
      },
    ];
  }

  return [];
}

async function toCreateVendorPayload(
  data: VendorFormData,
  mode: "save" | "draft",
): Promise<CreateVendorPayload> {
  const vendorimages: CreateVendorServiceMap<CreateVendorImagePayload[]> = {
    catering: [],
    delivery: [],
    setups: [],
    hospitality: [],
    feasts: [],
  };
  const deliveryAreasAndCost: CreateVendorPayload["deliveryAreasAndCost"] = {
    catering: [],
    delivery: [],
    setups: [],
    hospitality: [],
    feasts: [],
  };
  const minimumNotice: CreateVendorServiceMap<number | null> = {
    catering: null,
    delivery: null,
    setups: null,
    hospitality: null,
    feasts: null,
  };
  const capacity: CreateVendorServiceMap<number | null> = {
    catering: null,
    delivery: null,
    setups: null,
    hospitality: null,
    feasts: null,
  };

  for (const service of VENDOR_SERVICES) {
    const id = service.id;
    const enabled = data.servicesOffered.includes(id);
    const fields = data.services[id];

    vendorimages[id] = enabled
      ? (
          await Promise.all(fields.images.map((image) => toImagePayload(image)))
        ).flat()
      : [];
    deliveryAreasAndCost[id] = enabled
      ? fields.deliveryAreas.map((entry) => ({
          areaId: entry.areaId,
          fees: toFees(entry.cost),
        }))
      : [];
    minimumNotice[id] = toNumberOrNull(fields.minNotice, enabled);
    capacity[id] = toNumberOrNull(fields.capacity, enabled);
  }

  return {
    name: {
      en: data.englishName.trim(),
      ar: data.arabicName.trim(),
    },
    tagline: {
      en: data.englishTagline.trim(),
      ar: data.arabicTagline.trim(),
    },
    shortDescription: {
      en: data.englishShortDescription.trim(),
      ar: data.arabicShortDescription.trim(),
    },
    contactInfo: {
      primaryEmail: data.email.trim(),
      mobile: data.mobile.trim(),
      phone: data.phone.trim(),
    },
    published: mode === "draft" ? false : data.published,
    percentage: toPercentage(data.percentage),
    serviceCategories: [...data.servicesOffered],
    deliveryAreasAndCost,
    minimumNotice,
    capacity,
    vendorimages,
    logoImg: await toImagePayload(data.logo),
    doublePointReward: data.doublePoints,
  };
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

async function toNewImageUpload(
  image: VendorImageAsset,
): Promise<UpdateVendorImageUpload | null> {
  if (image.file) {
    const value = await readImageFileAsDataUrl(image.file);
    return {
      name: image.file.name || image.title || "image.png",
      size: image.file.size,
      type: image.file.type || "image/png",
      value,
    };
  }

  if (image.url.startsWith("data:image/")) {
    const mime = image.url.slice(5, image.url.indexOf(";")) || "image/png";
    return {
      name: image.title || "image.png",
      size:
        typeof image.size === "number" && image.size > 0
          ? image.size
          : getBase64ByteLength(image.url),
      type: mime,
      value: image.url,
    };
  }

  if (image.url.startsWith("blob:")) {
    const blob = await fetch(image.url).then((response) => response.blob());
    const file = new File([blob], image.title || "image.png", {
      type: blob.type || "image/png",
    });
    const value = await readImageFileAsDataUrl(file);
    return {
      name: file.name,
      size: file.size,
      type: file.type || "image/png",
      value,
    };
  }

  return null;
}

export async function toUpdateVendorPayload(
  data: VendorFormData,
  mode: "save" | "draft",
): Promise<UpdateVendorPayload> {
  const deliveryAreasAndCost: UpdateVendorServiceMap<UpdateVendorAreaCost[]> = {
    catering: [],
    delivery: [],
    setups: [],
    hospitality: [],
    feasts: [],
  };
  const minimumNotice: UpdateVendorServiceMap<number | null> = {
    catering: null,
    delivery: null,
    setups: null,
    hospitality: null,
    feasts: null,
  };
  const capacity: UpdateVendorServiceMap<number | null> = {
    catering: null,
    delivery: null,
    setups: null,
    hospitality: null,
    feasts: null,
  };

  const vendorimages: Partial<Record<VendorServiceId, UpdateVendorServiceImages>> = {};

  for (const service of VENDOR_SERVICES) {
    const id = service.id;
    const enabled = data.servicesOffered.includes(id);
    const fields = data.services[id];

    deliveryAreasAndCost[id] = enabled
      ? fields.deliveryAreas.map((entry) => ({
          areaId: entry.areaId,
          fees: toFees(entry.cost),
        }))
      : [];
    minimumNotice[id] = toNumberOrNull(fields.minNotice, enabled);
    capacity[id] = toNumberOrNull(fields.capacity, enabled);

    const remainingKeys = new Set(
      fields.images.map((img) => img.key?.trim()).filter(Boolean) as string[],
    );
    const initialKeys = data.initialServiceImageKeys?.[id] ?? [];
    const autoDeleted = initialKeys.filter((key) => key && !remainingKeys.has(key));
    const allDeletedKeys = Array.from(
      new Set([
        ...(data.deletedServiceImageKeys?.[id] ?? []),
        ...autoDeleted,
      ]),
    ).filter(Boolean);

    const deletedImages: UpdateVendorDeletedImage[] = allDeletedKeys.map((key) => ({
      key,
    }));

    const newUploads = await Promise.all(
      fields.images.map((img) => toNewImageUpload(img)),
    );
    const newImages = newUploads.filter(
      (u): u is UpdateVendorImageUpload => u !== null,
    );

    if (deletedImages.length > 0 || newImages.length > 0) {
      vendorimages[id] = {
        ...(deletedImages.length > 0 ? { deletedImages } : {}),
        ...(newImages.length > 0 ? { newImages } : {}),
      };
    }
  }

  let logoImg: UpdateVendorPayload["logoImg"] | undefined;
  const logoNewUpload = data.logo ? await toNewImageUpload(data.logo) : null;
  const logoNewImages = logoNewUpload ? [logoNewUpload] : [];

  const initialLogoKey = data.initialLogoKey?.trim();
  const currentLogoKey = data.logo?.key?.trim();
  const logoAutoDeleted =
    initialLogoKey && (!currentLogoKey || currentLogoKey !== initialLogoKey)
      ? [initialLogoKey]
      : [];
  const logoDeletedKeys = Array.from(
    new Set([
      ...(data.deletedLogoKeys ?? []),
      ...logoAutoDeleted,
    ]),
  ).filter(Boolean);
  const logoDeletedImages: UpdateVendorDeletedImage[] = logoDeletedKeys.map(
    (key) => ({ key }),
  );

  if (logoDeletedImages.length > 0 || logoNewImages.length > 0) {
    logoImg = {
      ...(logoDeletedImages.length > 0
        ? { deletedImages: logoDeletedImages }
        : {}),
      ...(logoNewImages.length > 0 ? { newImages: logoNewImages } : {}),
    };
  }

  const order =
    typeof data.order === "number" && Number.isFinite(data.order)
      ? data.order
      : Number(data.order) || 0;

  function toAmountNumber(val: unknown): number {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim()) {
      const parsed = Number(val.trim());
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }

  return {
    name: {
      en: data.englishName.trim(),
      ar: data.arabicName.trim(),
    },
    tagline: {
      en: data.englishTagline.trim(),
      ar: data.arabicTagline.trim(),
    },
    shortDescription: {
      en: data.englishShortDescription.trim(),
      ar: data.arabicShortDescription.trim(),
    },
    published: mode === "draft" ? false : Boolean(data.published),
    percentage: toPercentage(data.percentage),
    order,
    isFullyBooked: Boolean(data.isFullyBooked),
    doublePointReward: Boolean(data.doublePoints),
    serviceCategories: [...data.servicesOffered],
    deliveryAreasAndCost,
    minimumNotice,
    capacity,
    minimumOrderAmountCatering: toAmountNumber(data.minimumOrderAmountCatering),
    minimumOrderAmountDelivery: toAmountNumber(data.minimumOrderAmountDelivery),
    minimumOrderTimeInHours: toAmountNumber(data.minimumOrderTimeInHours),
    contactInfo: {
      primaryEmail: data.email.trim(),
      secondaryEmail: data.secondaryEmail?.trim() ?? "",
      accountingEmails: Array.isArray(data.accountingEmails)
        ? data.accountingEmails.map((e) => e.trim()).filter(Boolean)
        : [],
      mobile: data.mobile.trim(),
      phone: data.phone.trim(),
    },
    collectionIds: Array.isArray(data.collectionIds) ? data.collectionIds : [],
    vendorimages,
    ...(logoImg ? { logoImg } : {}),
  };
}

export async function saveVendorForm(
  data: VendorFormData,
  mode: "save" | "draft",
): Promise<{ ok: true; id: string; mode: "save" | "draft"; message: string }> {
  if (data.id) {
    const payload = await toUpdateVendorPayload(data, mode);
    const updated = await updateVendor(data.id, payload);

    const { invalidateVendorFilterOptionsCache } = await import("@/lib/vendors");
    invalidateVendorFilterOptionsCache();

    return {
      ok: true,
      id: data.id,
      mode,
      message: updated.message,
    };
  }

  const payload = await toCreateVendorPayload(data, mode);
  const created =
    mode === "draft"
      ? await createVendorDraft(payload)
      : await createVendor(payload);

  const { invalidateVendorFilterOptionsCache } = await import("@/lib/vendors");
  invalidateVendorFilterOptionsCache();

  return {
    ok: true,
    id: created.id,
    mode,
    message: created.message,
  };
}

export type VendorFormPanel = "profile" | "business" | "operations";

export type VendorServiceFieldErrors = {
  images?: string;
  minNotice?: string;
  capacity?: string;
  deliveryAreas?: string;
};

export type VendorFormFieldErrors = {
  englishName?: string;
  arabicName?: string;
  englishTagline?: string;
  arabicTagline?: string;
  englishShortDescription?: string;
  arabicShortDescription?: string;
  logo?: string;
  email?: string;
  mobile?: string;
  servicesOffered?: string;
  services?: Partial<Record<VendorServiceId, VendorServiceFieldErrors>>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFilled(value: string) {
  return Boolean(value.trim());
}

function isValidNumber(value: string) {
  const parsed = Number(value.trim());
  return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
}

export function validateVendorProfile(
  data: VendorFormData,
): VendorFormFieldErrors {
  const errors: VendorFormFieldErrors = {};
  if (!isFilled(data.englishName)) {
    errors.englishName = "English name is required.";
  }
  if (!isFilled(data.arabicName)) {
    errors.arabicName = "Arabic name is required.";
  }
  if (!isFilled(data.englishTagline)) {
    errors.englishTagline = "English tagline is required.";
  }
  if (!isFilled(data.arabicTagline)) {
    errors.arabicTagline = "Arabic tagline is required.";
  }
  if (!isFilled(data.englishShortDescription)) {
    errors.englishShortDescription = "English short description is required.";
  }
  if (!isFilled(data.arabicShortDescription)) {
    errors.arabicShortDescription = "Arabic short description is required.";
  }
  if (!data.logo) {
    errors.logo = "Vendor logo is required.";
  }
  return errors;
}

export function validateVendorBusiness(
  data: VendorFormData,
): VendorFormFieldErrors {
  const errors: VendorFormFieldErrors = {};
  const email = data.email.trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!isFilled(data.mobile)) {
    errors.mobile = "Mobile is required.";
  }
  if (data.servicesOffered.length === 0) {
    errors.servicesOffered = "Select at least one service.";
  }
  return errors;
}

export function validateVendorOperations(
  data: VendorFormData,
): VendorFormFieldErrors {
  const services: NonNullable<VendorFormFieldErrors["services"]> = {};

  for (const service of VENDOR_SERVICES) {
    if (!data.servicesOffered.includes(service.id)) continue;

    const fields = data.services[service.id];
    const serviceErrors: VendorServiceFieldErrors = {};

    if (fields.images.length === 0) {
      serviceErrors.images = `${service.label} image is required.`;
    }
    if (!isValidNumber(fields.minNotice)) {
      serviceErrors.minNotice = `${service.label} minimum notice is required.`;
    }
    if (!isValidNumber(fields.capacity)) {
      serviceErrors.capacity = `${service.label} capacity is required.`;
    }
    if (fields.deliveryAreas.length === 0) {
      serviceErrors.deliveryAreas = `${service.label} delivery area is required.`;
    } else if (
      fields.deliveryAreas.some((entry) => !isValidNumber(entry.cost))
    ) {
      serviceErrors.deliveryAreas = `${service.label} delivery cost is required.`;
    }

    if (Object.keys(serviceErrors).length > 0) {
      services[service.id] = serviceErrors;
    }
  }

  return Object.keys(services).length > 0 ? { services } : {};
}

export function validateVendorFormPanel(
  data: VendorFormData,
  panel: VendorFormPanel,
): VendorFormFieldErrors {
  if (panel === "profile") return validateVendorProfile(data);
  if (panel === "business") return validateVendorBusiness(data);
  return validateVendorOperations(data);
}

export function validateVendorForm(data: VendorFormData): VendorFormFieldErrors {
  return {
    ...validateVendorProfile(data),
    ...validateVendorBusiness(data),
    ...validateVendorOperations(data),
  };
}

export function firstVendorFormError(
  errors: VendorFormFieldErrors,
): string | null {
  const topLevel =
    errors.englishName ||
    errors.arabicName ||
    errors.englishTagline ||
    errors.arabicTagline ||
    errors.englishShortDescription ||
    errors.arabicShortDescription ||
    errors.logo ||
    errors.email ||
    errors.mobile ||
    errors.servicesOffered;
  if (topLevel) return topLevel;

  for (const service of VENDOR_SERVICES) {
    const serviceErrors = errors.services?.[service.id];
    const message =
      serviceErrors?.images ||
      serviceErrors?.minNotice ||
      serviceErrors?.capacity ||
      serviceErrors?.deliveryAreas;
    if (message) return message;
  }

  return null;
}

export function firstInvalidVendorPanel(
  errors: VendorFormFieldErrors,
): VendorFormPanel {
  if (
    errors.englishName ||
    errors.arabicName ||
    errors.englishTagline ||
    errors.arabicTagline ||
    errors.englishShortDescription ||
    errors.arabicShortDescription ||
    errors.logo
  ) {
    return "profile";
  }
  if (errors.email || errors.mobile || errors.servicesOffered) {
    return "business";
  }
  return "operations";
}
