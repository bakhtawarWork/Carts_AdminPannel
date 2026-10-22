import {
  createPopularCollectionApi,
  createSubCollectionApi,
  deletePopularCollectionApi,
  deleteSubCollectionApi,
  getPopularCollectionByIdApi,
  getPopularCollectionsApi,
  getSubCollectionsApi,
  updatePopularCollectionApi,
  updateSubCollectionApi,
  type ApiPopularCollection,
  type ApiPopularSubCollection,
} from "@/services/popular-collections";
import type {
  PopularCollection,
  PopularCollectionFormData,
  PopularCollectionServiceOption,
  PopularSubCollection,
  PopularSubCollectionFormData,
} from "@/lib/types";

export const POPULAR_COLLECTION_SERVICE_OPTIONS: PopularCollectionServiceOption[] =
  [
    { id: "catering", englishName: "Catering", arabicName: "تموين" },
    { id: "delivery", englishName: "Delivery", arabicName: "توصيل" },
    { id: "setups", englishName: "Setups", arabicName: "تجهيزات" },
    { id: "hospitality", englishName: "Hospitality", arabicName: "ضيافة" },
    { id: "feasts", englishName: "Feasts", arabicName: "ولائم" },
  ];

function dataUrlToFile(dataUrl: string, filename = "collection.jpg"): File | null {
  if (typeof window === "undefined") return null;
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : "image/jpeg";
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new File([array], filename, { type: mime });
  } catch {
    return null;
  }
}

export function mapApiCollectionToFrontend(
  apiItem: ApiPopularCollection,
): PopularCollection {
  const nameObj =
    typeof apiItem.name === "object" && apiItem.name !== null
      ? apiItem.name
      : null;
  const englishName =
    nameObj?.en ??
    (typeof apiItem.name === "string" ? apiItem.name : "") ??
    "";
  const arabicName = nameObj?.ar ?? "";

  let imageUrl = "";
  if (typeof apiItem.image === "string") {
    imageUrl = apiItem.image;
  } else if (apiItem.image && typeof apiItem.image === "object") {
    imageUrl =
      apiItem.image.cdnUrl ||
      apiItem.image.url ||
      apiItem.image.filename ||
      "";
  }

  const subCollections: PopularSubCollection[] = Array.isArray(
    apiItem.subCollections,
  )
    ? apiItem.subCollections.map((sub) => {
        const subNameObj =
          typeof sub.name === "object" && sub.name !== null
            ? sub.name
            : null;
        return {
          id: sub._id || (sub as unknown as { id?: string }).id || "",
          collectionId: apiItem._id || "",
          englishName:
            subNameObj?.en ??
            (typeof sub.name === "string" ? sub.name : "") ??
            "",
          arabicName: subNameObj?.ar ?? "",
          published: Boolean(sub.published),
          order: sub.order,
        };
      })
    : [];

  return {
    id: apiItem._id || (apiItem as unknown as { id?: string }).id || "",
    englishName,
    arabicName,
    published: Boolean(apiItem.published),
    popular: Boolean(apiItem.isPopular),
    serviceCategoryId: apiItem.legacyServiceCategory ?? "",
    imageUrl,
    order: apiItem.order,
    subCollections,
  };
}

export function mapApiSubCollectionToFrontend(
  sub: ApiPopularSubCollection,
  collectionId: string,
): PopularSubCollection {
  const subNameObj =
    typeof sub.name === "object" && sub.name !== null ? sub.name : null;
  return {
    id: sub._id || (sub as unknown as { id?: string }).id || "",
    collectionId,
    englishName:
      subNameObj?.en ??
      (typeof sub.name === "string" ? sub.name : "") ??
      "",
    arabicName: subNameObj?.ar ?? "",
    published: Boolean(sub.published),
    order: sub.order,
  };
}

export function getServiceCategoryLabel(id: string) {
  const match = POPULAR_COLLECTION_SERVICE_OPTIONS.find(
    (option) => option.id === id,
  );
  return match ? match.englishName : "Unassigned";
}

export function createEmptyCollectionForm(): PopularCollectionFormData {
  return {
    englishName: "",
    arabicName: "",
    published: false,
    popular: false,
    serviceCategoryId: "",
    imageUrl: "",
    imageFile: null,
  };
}

export function collectionToFormData(
  collection: PopularCollection,
): PopularCollectionFormData {
  return {
    id: collection.id,
    englishName: collection.englishName,
    arabicName: collection.arabicName,
    published: collection.published,
    popular: collection.popular,
    serviceCategoryId: collection.serviceCategoryId,
    imageUrl: collection.imageUrl,
    imageFile: null,
    order: collection.order,
  };
}

export function createEmptySubCollectionForm(
  collectionId: string,
): PopularSubCollectionFormData {
  return {
    collectionId,
    englishName: "",
    arabicName: "",
    published: false,
  };
}

export function subCollectionToFormData(
  sub: PopularSubCollection,
): PopularSubCollectionFormData {
  return {
    id: sub.id,
    collectionId: sub.collectionId,
    englishName: sub.englishName,
    arabicName: sub.arabicName,
    published: sub.published,
    order: sub.order,
  };
}

export function validateCollectionForm(form: PopularCollectionFormData) {
  if (!form.englishName.trim()) return "English name is required.";
  if (!form.arabicName.trim()) return "Arabic name is required.";
  if (!form.imageUrl.trim() && !form.imageFile) return "Select an image.";
  return null;
}

export function validateSubCollectionForm(form: PopularSubCollectionFormData) {
  if (!form.englishName.trim()) return "English name is required.";
  if (!form.arabicName.trim()) return "Arabic name is required.";
  return null;
}

/**
 * Fetch all popular collections from backend API
 */
export async function fetchPopularCollections(): Promise<PopularCollection[]> {
  const result = await getPopularCollectionsApi({ limit: 100 });
  return result.collections.map(mapApiCollectionToFrontend);
}

/**
 * Fetch popular collection by ID, with sub-collections
 */
export async function fetchPopularCollectionById(
  id: string,
): Promise<PopularCollection | null> {
  const apiItem = await getPopularCollectionByIdApi(id);
  if (!apiItem) return null;

  const frontend = mapApiCollectionToFrontend(apiItem);

  // If subcollections were not populated on the main item, fetch them explicitly
  if (!frontend.subCollections || frontend.subCollections.length === 0) {
    try {
      const subs = await getSubCollectionsApi(id);
      if (subs && subs.length > 0) {
        frontend.subCollections = subs.map((s) =>
          mapApiSubCollectionToFrontend(s, id),
        );
      }
    } catch {
      // ignore fallback error
    }
  }

  return frontend;
}

/**
 * Create or update popular collection via multipart/form-data
 */
export async function savePopularCollectionForm(
  form: PopularCollectionFormData,
): Promise<PopularCollection> {
  const formData = new FormData();
  formData.append("name.en", form.englishName.trim());
  formData.append("name.ar", form.arabicName.trim());
  formData.append("published", String(form.published));
  formData.append("isPopular", String(form.popular));

  if (form.serviceCategoryId) {
    formData.append("legacyServiceCategory", form.serviceCategoryId);
  }

  formData.append("order", String(Math.round(Number(form.order ?? 1))));

  let fileToUpload: File | Blob | null = form.imageFile ?? null;
  if (!fileToUpload && form.imageUrl?.startsWith("data:")) {
    fileToUpload = dataUrlToFile(form.imageUrl, "collection.jpg");
  }

  if (fileToUpload) {
    formData.append("file", fileToUpload);
  }

  if (form.id) {
    const updated = await updatePopularCollectionApi(form.id, formData);
    return mapApiCollectionToFrontend(updated);
  } else {
    const created = await createPopularCollectionApi(formData);
    return mapApiCollectionToFrontend(created);
  }
}

/**
 * Delete popular collection by ID
 */
export async function deletePopularCollection(id: string): Promise<boolean> {
  return await deletePopularCollectionApi(id);
}

/**
 * Create or update popular sub-collection via JSON
 */
export async function savePopularSubCollectionForm(
  form: PopularSubCollectionFormData,
): Promise<PopularSubCollection> {
  const payload = {
    name: {
      en: form.englishName.trim(),
      ar: form.arabicName.trim(),
    },
    published: form.published,
    order: form.order ?? 1,
  };

  if (form.id) {
    const updated = await updateSubCollectionApi(
      form.collectionId,
      form.id,
      payload,
    );
    return mapApiSubCollectionToFrontend(updated, form.collectionId);
  } else {
    const created = await createSubCollectionApi(form.collectionId, payload);
    return mapApiSubCollectionToFrontend(created, form.collectionId);
  }
}

/**
 * Delete popular sub-collection by ID
 */
export async function deletePopularSubCollection(
  collectionId: string,
  subId: string,
): Promise<boolean> {
  return await deleteSubCollectionApi(collectionId, subId);
}
