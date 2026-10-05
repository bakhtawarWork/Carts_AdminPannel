const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
]);

export const MAX_OFFERING_IMAGE_SIZE_MB = 5;

export function validateOfferingImageFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeAllowed = file.type ? ALLOWED_IMAGE_TYPES.has(file.type) : false;
  const extensionAllowed = ALLOWED_IMAGE_EXTENSIONS.has(extension);

  if (!typeAllowed && !extensionAllowed) {
    return "Only JPG, PNG, WebP, or GIF images are allowed.";
  }

  const maxBytes = MAX_OFFERING_IMAGE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Image must be ${MAX_OFFERING_IMAGE_SIZE_MB}MB or smaller.`;
  }

  if (file.size === 0) {
    return "Image file is empty.";
  }

  return null;
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        resolve(reader.result);
        return;
      }
      reject(new Error("Invalid image data."));
    };

    reader.onerror = () => {
      reject(new Error("Could not read image file."));
    };

    reader.readAsDataURL(file);
  });
}

export function createGalleryImageId() {
  return `img-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}
