import type { BannerFormData, BannerRecord, BannerType } from "@/lib/types";
import { validateOfferingImageFile } from "@/lib/offering-image-upload";
import {
  type BannerApiItem,
  type CreateBannerPayload,
  type GetBannersParams,
  type UpdateBannerPayload,
  createBanner,
  deleteBannerApi,
  getBannerById,
  getBanners,
  updateBanner,
  updateBannerStatus,
} from "@/services/banners";
import { uploadBannerImage } from "@/services/uploads";
import type { BannerImageAsset, BannerPlatformImageField } from "@/lib/types";

export const BANNER_IMAGE_WIDTH = 375;
export const BANNER_IMAGE_HEIGHT = 335;

export const BANNER_TYPE_OPTIONS = [
  { value: "main", label: "Main banner" },
  { value: "sub", label: "Sub banner" },
] as const;

export const BANNER_REDIRECTION_OPTIONS = [
  { value: "vendor_details", label: "Vendor details" },
  { value: "offerings_details", label: "Offering details" },
] as const;

export type BannerRedirectionPath =
  (typeof BANNER_REDIRECTION_OPTIONS)[number]["value"];

export function mapApiBannerToRecord(item: BannerApiItem): BannerRecord {
  const nameEn =
    typeof item.name === "object" && item.name !== null
      ? (item.name.en ?? "")
      : String(item.name ?? "");
  const nameAr =
    typeof item.name === "object" && item.name !== null
      ? item.name.ar
      : undefined;

  const androidImage = mapImageAsset(item.androidImage) ?? mapImageAsset(item.image);
  const iosImage = mapImageAsset(item.iosImage);

  const imageUrl =
    androidImage?.cdnUrl ||
    androidImage?.url ||
    item.image?.cdnUrl ||
    (item as { cdnUrl?: string }).cdnUrl ||
    item.image?.url ||
    iosImage?.cdnUrl ||
    (typeof item.image === "string" ? item.image : "");

  let redirectionPath: string | undefined = undefined;
  if (typeof item.destination === "string") {
    const trimmed = item.destination.trim();
    if (trimmed) redirectionPath = trimmed;
  } else if (item.destination && typeof item.destination === "object") {
    const d = item.destination as Record<string, unknown>;
    const val =
      (typeof d.destination === "string" && d.destination) ||
      (typeof d.url === "string" && d.url) ||
      (typeof d.path === "string" && d.path) ||
      (typeof d.id === "string" && d.id) ||
      (typeof d._id === "string" && d._id);
    if (val && typeof val === "string") {
      redirectionPath = val.trim();
    }
  } else if (item.destination != null) {
    const str = String(item.destination).trim();
    if (str && str !== "[object Object]") {
      redirectionPath = str;
    }
  }

  if (!redirectionPath && item.referenceId) {
    if (item.actionType === "vendor") {
      redirectionPath = `vendors/${item.referenceId}`;
    } else if (item.actionType === "offering") {
      redirectionPath = `offerings/${item.referenceId}`;
    }
  }

  return {
    id: item._id,
    type: item.type,
    name: nameEn || nameAr || "Untitled Banner",
    nameAr,
    imageUrl,
    androidImage,
    iosImage,
    sequence: item.position ?? 1,
    isActive: item.status === "active",
    redirectionPath,
    actionType: item.actionType,
    referenceId: item.referenceId,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

function emptyPlatformImageField(): BannerPlatformImageField {
  return {
    previewUrl: "",
    pendingFile: null,
    uploaded: null,
  };
}

function mapImageAsset(image?: {
  key?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
}): BannerImageAsset | null {
  if (!image?.key || !image.url || !image.cdnUrl || !image.filename) {
    return null;
  }
  return {
    key: image.key,
    url: image.url,
    cdnUrl: image.cdnUrl,
    filename: image.filename,
  };
}

export function platformImageFieldFromAsset(
  asset: BannerImageAsset | null | undefined,
): BannerPlatformImageField {
  if (!asset) {
    return emptyPlatformImageField();
  }
  return {
    previewUrl: asset.cdnUrl || asset.url,
    pendingFile: null,
    uploaded: asset,
  };
}

export function createEmptyBannerForm(type: BannerType = "main"): BannerFormData {
  return {
    type,
    name: "",
    nameAr: "",
    androidImage: emptyPlatformImageField(),
    iosImage: emptyPlatformImageField(),
    sequence: "1",
    isActive: true,
    redirectionPath: "",
    selectedVendorId: "",
    selectedOfferingId: "",
  };
}

async function resolvePlatformImageAsset(
  field: BannerPlatformImageField,
  platformLabel: "Android" | "iOS",
): Promise<BannerImageAsset> {
  if (field.pendingFile) {
    const uploaded = await uploadBannerImage(field.pendingFile);
    return {
      key: uploaded.key,
      url: uploaded.url,
      cdnUrl: uploaded.cdnUrl,
      filename: uploaded.filename,
    };
  }

  if (field.uploaded) {
    return field.uploaded;
  }

  throw new Error(`${platformLabel} banner image is required.`);
}

function hasPlatformImage(field: BannerPlatformImageField) {
  return Boolean(field.pendingFile || field.uploaded?.key || field.previewUrl.trim());
}

export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image dimensions."));
    };

    image.src = objectUrl;
  });
}

export const MAIN_BANNER_MIN_ASPECT_RATIO = 1.10;
export const MAIN_BANNER_MAX_ASPECT_RATIO = 1.12 / 0.8; // 1.40
export const SUB_BANNER_MIN_ASPECT_RATIO = 2.70;
export const SUB_BANNER_MAX_ASPECT_RATIO = 2.80 / 0.8; // 3.50

/** iOS main banner design size (dp); width ÷ height ≈ 0.78:1 */
export const IOS_MAIN_BANNER_WIDTH_DP = 1680;
export const IOS_MAIN_BANNER_HEIGHT_DP = 2164;
export const IOS_MAIN_BANNER_MAX_ASPECT_RATIO =
  IOS_MAIN_BANNER_WIDTH_DP / IOS_MAIN_BANNER_HEIGHT_DP;
/** Same relative slack below target as Android main (1.10 vs ~1.12). */
export const IOS_MAIN_BANNER_MIN_ASPECT_RATIO =
  IOS_MAIN_BANNER_MAX_ASPECT_RATIO * (MAIN_BANNER_MIN_ASPECT_RATIO / 1.12);

export function formatBannerAspectRatioRange(min: number, max: number) {
  return `${min.toFixed(2)}:1 – ${max.toFixed(2)}:1`;
}

function validateSubBannerAspectRatio(
  ratio: number,
  width: number,
  height: number,
): string | null {
  if (ratio <= SUB_BANNER_MIN_ASPECT_RATIO || ratio > SUB_BANNER_MAX_ASPECT_RATIO) {
    return `Sub banner aspect ratio must be greater than 2.70:1 and up to 3.50:1 (uploaded image is ${width}×${height}px, ratio ${ratio.toFixed(2)}:1).`;
  }
  return null;
}

/** File type/size + aspect ratio validation for Android main and sub banner uploads. */
export async function validateBannerImageFile(
  file: File,
  type: BannerType = "main",
): Promise<string | null> {
  const fileError = validateOfferingImageFile(file);
  if (fileError) return fileError;

  try {
    const { width, height } = await readImageDimensions(file);
    if (!width || !height) {
      return "Could not determine image dimensions.";
    }

    const ratio = width / height;

    if (type === "main") {
      if (ratio <= MAIN_BANNER_MIN_ASPECT_RATIO || ratio > MAIN_BANNER_MAX_ASPECT_RATIO) {
        return `Main banner aspect ratio must be greater than 1.10:1 and up to 1.40:1 (uploaded image is ${width}×${height}px, ratio ${ratio.toFixed(2)}:1).`;
      }
    } else {
      return validateSubBannerAspectRatio(ratio, width, height);
    }
  } catch {
    return "Could not read image dimensions. Please try another file.";
  }

  return null;
}

/** File type/size + aspect ratio validation for iOS main and sub banner uploads. */
export async function validateBannerIosImageFile(
  file: File,
  type: BannerType = "main",
): Promise<string | null> {
  const fileError = validateOfferingImageFile(file);
  if (fileError) return fileError;

  try {
    const { width, height } = await readImageDimensions(file);
    if (!width || !height) {
      return "Could not determine image dimensions.";
    }

    const ratio = width / height;

    if (type === "main") {
      const minLabel = IOS_MAIN_BANNER_MIN_ASPECT_RATIO.toFixed(2);
      const maxLabel = IOS_MAIN_BANNER_MAX_ASPECT_RATIO.toFixed(2);
      if (
        ratio <= IOS_MAIN_BANNER_MIN_ASPECT_RATIO ||
        ratio > IOS_MAIN_BANNER_MAX_ASPECT_RATIO
      ) {
        return `iOS main banner aspect ratio must be greater than ${minLabel}:1 and up to ${maxLabel}:1 (1680×2164 dp, uploaded image is ${width}×${height}px, ratio ${ratio.toFixed(2)}:1).`;
      }
    } else {
      return validateSubBannerAspectRatio(ratio, width, height);
    }
  } catch {
    return "Could not read image dimensions. Please try another file.";
  }

  return null;
}

export function formatBannerTypeLabel(type: BannerType) {
  return type === "main" ? "Main banner" : "Sub banner";
}

export function formatBannerRedirectionLabel(path?: unknown): string {
  if (!path) return "—";

  let str = "";
  if (typeof path === "string") {
    str = path.trim();
  } else if (typeof path === "object" && path !== null) {
    const obj = path as Record<string, unknown>;
    const val =
      (typeof obj.destination === "string" && obj.destination) ||
      (typeof obj.url === "string" && obj.url) ||
      (typeof obj.path === "string" && obj.path) ||
      (typeof obj.label === "string" && obj.label) ||
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.id === "string" && obj.id) ||
      (typeof obj._id === "string" && obj._id);
    str = val ? val.trim() : "";
  } else {
    str = String(path).trim();
    if (str === "[object Object]") str = "";
  }

  if (!str) return "—";

  if (str === "vendor_details" || str.startsWith("vendors/")) {
    return "Vendor details";
  }
  if (str === "offerings_details" || str.startsWith("offerings/")) {
    return "Offering details";
  }
  const match = BANNER_REDIRECTION_OPTIONS.find((option) => option.value === str);
  return match?.label ?? str;
}

export function validateBannerForm(data: BannerFormData): string | null {
  if (!data.name.trim()) return "Banner name is required.";
  if (!hasPlatformImage(data.androidImage)) {
    return "Android banner image is required.";
  }
  if (!hasPlatformImage(data.iosImage)) {
    return "iOS banner image is required.";
  }

  const sequence = Number(data.sequence);
  if (!Number.isFinite(sequence) || sequence < 1 || !Number.isInteger(sequence)) {
    return "Sequence must be a whole number of 1 or greater.";
  }

  if (data.type === "sub") {
    if (!data.redirectionPath.trim()) {
      return "Redirection path is required for sub banners.";
    }
    if (data.redirectionPath === "vendor_details") {
      if (!data.selectedVendorId) {
        return "Please select a vendor for redirection.";
      }
    } else if (data.redirectionPath === "offerings_details") {
      if (!data.selectedVendorId) {
        return "Please select a vendor.";
      }
      if (!data.selectedOfferingId) {
        return "Please select an offering for redirection.";
      }
    } else {
      return "Select a valid redirection screen.";
    }
  }

  return null;
}

export async function fetchBanners(
  type?: BannerType | "all",
): Promise<BannerRecord[]> {
  const params: GetBannersParams = {
    type: type && type !== "all" ? type : "all",
    status: "all",
    limit: 100,
  };
  const data = await getBanners(params);
  const items = data?.banners ?? [];
  return items.map(mapApiBannerToRecord);
}

export async function saveBannerForm(
  data: BannerFormData,
): Promise<BannerRecord> {
  const englishName = data.name.trim();
  const arabicName = data.nameAr?.trim() || englishName;

  const [androidImage, iosImage] = await Promise.all([
    resolvePlatformImageAsset(data.androidImage, "Android"),
    resolvePlatformImageAsset(data.iosImage, "iOS"),
  ]);

  const payload: CreateBannerPayload = {
    name: {
      en: englishName,
      ar: arabicName,
    },
    type: data.type,
    position: Number(data.sequence) || 1,
    status: data.isActive ? "active" : "inactive",
    androidImage,
    iosImage,
  };

  if (data.type === "sub") {
    if (data.redirectionPath === "vendor_details" && data.selectedVendorId) {
      payload.destination = `vendors/${data.selectedVendorId}`;
      payload.actionType = "vendor";
      payload.referenceId = data.selectedVendorId;
    } else if (data.redirectionPath === "offerings_details" && data.selectedOfferingId) {
      payload.destination = `offerings/${data.selectedOfferingId}`;
      payload.actionType = "offering";
      payload.referenceId = data.selectedOfferingId;
    } else if (data.redirectionPath?.trim()) {
      payload.destination = data.redirectionPath.trim();
    }
  }

  const created = await createBanner(payload);
  if (!created) {
    throw new Error("No banner returned from server.");
  }
  return mapApiBannerToRecord(created);
}

export async function deleteBanner(id: string): Promise<boolean> {
  await deleteBannerApi(id);
  return true;
}

export async function fetchBannerById(id: string): Promise<BannerRecord> {
  const item = await getBannerById(id);
  if (!item) {
    throw new Error("Banner not found.");
  }
  return mapApiBannerToRecord(item);
}

export async function updateBannerForm(
  id: string,
  data: BannerFormData,
): Promise<BannerRecord> {
  const englishName = data.name.trim();
  const arabicName = data.nameAr?.trim() || englishName;

  const [androidImage, iosImage] = await Promise.all([
    resolvePlatformImageAsset(data.androidImage, "Android"),
    resolvePlatformImageAsset(data.iosImage, "iOS"),
  ]);

  const payload: UpdateBannerPayload = {
    name: {
      en: englishName,
      ar: arabicName,
    },
    type: data.type,
    position: Number(data.sequence) || 1,
    status: data.isActive ? "active" : "inactive",
  };

  if (data.type === "sub") {
    if (data.redirectionPath === "vendor_details" && data.selectedVendorId) {
      payload.destination = `vendors/${data.selectedVendorId}`;
      payload.actionType = "vendor";
      payload.referenceId = data.selectedVendorId;
    } else if (data.redirectionPath === "offerings_details" && data.selectedOfferingId) {
      payload.destination = `offerings/${data.selectedOfferingId}`;
      payload.actionType = "offering";
      payload.referenceId = data.selectedOfferingId;
    } else if (data.redirectionPath?.trim()) {
      payload.destination = data.redirectionPath.trim();
    }
  } else {
    payload.destination = "";
    payload.actionType = "";
    payload.referenceId = null;
  }

  payload.androidImage = androidImage;
  payload.iosImage = iosImage;

  const updated = await updateBanner(id, payload);
  if (!updated) {
    throw new Error("No banner returned from server.");
  }
  return mapApiBannerToRecord(updated);
}

export async function toggleBannerStatus(
  id: string,
  currentStatus: boolean,
): Promise<BannerRecord> {
  const nextStatus = currentStatus ? "inactive" : "active";
  const updated = await updateBannerStatus(id, nextStatus);
  if (!updated) {
    throw new Error("No banner returned from server.");
  }
  return mapApiBannerToRecord(updated);
}

