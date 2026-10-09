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

  const imageUrl =
    item.image?.cdnUrl ||
    (item as { cdnUrl?: string }).cdnUrl ||
    item.image?.url ||
    (typeof item.image === "string" ? item.image : "");

  return {
    id: item._id,
    type: item.type,
    name: nameEn || nameAr || "Untitled Banner",
    nameAr,
    imageUrl,
    sequence: item.position ?? 1,
    isActive: item.status === "active",
    redirectionPath: item.destination || undefined,
    actionType: item.actionType,
    referenceId: item.referenceId,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

export function createEmptyBannerForm(type: BannerType = "main"): BannerFormData {
  return {
    type,
    name: "",
    nameAr: "",
    imageUrl: "",
    sequence: "1",
    isActive: true,
    redirectionPath: "",
    selectedVendorId: "",
    selectedOfferingId: "",
  };
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

/** File type/size + aspect ratio validation for main and sub banner uploads. */
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
      if (ratio <= SUB_BANNER_MIN_ASPECT_RATIO || ratio > SUB_BANNER_MAX_ASPECT_RATIO) {
        return `Sub banner aspect ratio must be greater than 2.70:1 and up to 3.50:1 (uploaded image is ${width}×${height}px, ratio ${ratio.toFixed(2)}:1).`;
      }
    }
  } catch {
    return "Could not read image dimensions. Please try another file.";
  }

  return null;
}

export function formatBannerTypeLabel(type: BannerType) {
  return type === "main" ? "Main banner" : "Sub banner";
}

export function formatBannerRedirectionLabel(path?: string) {
  if (!path) return "—";
  if (path === "vendor_details" || path.startsWith("vendors/")) {
    return "Vendor details";
  }
  if (path === "offerings_details" || path.startsWith("offerings/")) {
    return "Offering details";
  }
  const match = BANNER_REDIRECTION_OPTIONS.find((option) => option.value === path);
  return match?.label ?? path;
}

export function validateBannerForm(data: BannerFormData): string | null {
  if (!data.name.trim()) return "Banner name is required.";
  if (!data.imageUrl.trim()) return "Banner image is required.";

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

  const payload: CreateBannerPayload = {
    name: {
      en: englishName,
      ar: arabicName,
    },
    type: data.type,
    position: Number(data.sequence) || 1,
    status: data.isActive ? "active" : "inactive",
    image: {
      name: data.imageFileName || "banner.jpg",
      value: data.imageUrl.trim(),
      type: data.imageFileType || "image/jpeg",
    },
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

  const payload: UpdateBannerPayload = {
    name: {
      en: englishName,
      ar: arabicName,
    },
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
  }

  if (data.imageUrl.startsWith("data:")) {
    payload.image = {
      name: data.imageFileName || "banner.jpg",
      value: data.imageUrl.trim(),
      type: data.imageFileType || "image/jpeg",
    };
  }

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

