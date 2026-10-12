import { api } from "@/services/api";
import { COLLECTION_ENDPOINTS } from "@/services/endpoints";

export type ApiLocalizedName = {
  en?: string;
  ar?: string;
};

export type ApiOfferingVendor = {
  _id?: string;
  id?: string;
  name?: ApiLocalizedName | string;
  logo?: {
    cdnUrl?: string;
    url?: string;
    key?: string;
  };
};

export type ApiOfferingItem = {
  _id?: string;
  id?: string;
  name?: ApiLocalizedName | string;
  ordersCount?: number;
  orderCount?: number;
  serviceType?: string;
  serviceCategory?: string;
  images?: Array<{ cdnUrl?: string; url?: string; key?: string } | string>;
  image?: { cdnUrl?: string; url?: string } | string;
  _vendor?: ApiOfferingVendor | string;
};

export type ApiSubCategoryOfferingPayload = {
  offeringId: string;
  vendorId: string;
};

export type ApiSubCategory = {
  _id?: string;
  id?: string;
  name?: ApiLocalizedName | string;
  offerings?: Array<ApiOfferingItem | ApiSubCategoryOfferingPayload | string>;
};

export type ApiCollectionItem = {
  _id?: string;
  id?: string;
  name?: ApiLocalizedName | string;
  englishImages?: Array<unknown> | string;
  arabicImages?: Array<unknown> | string;
  subCategories?: ApiSubCategory[];
  createdAt?: string;
  updatedAt?: string;
};

export type ApiCollection = {
  _id?: string;
  id?: string;
  name?: ApiLocalizedName | string;
  published?: boolean;
  mainCategory?: ApiCollectionItem[];
  items?: ApiCollectionItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type ApiCollectionsResponse = {
  status?: boolean;
  message?: string;
  data?:
    | {
        collections?: ApiCollection[];
        total?: number;
      }
    | ApiCollection[];
};

export type ApiOfferingsResponse = {
  status?: boolean;
  message?: string;
  data?:
    | {
        offerings?: ApiOfferingItem[];
      }
    | ApiOfferingItem[];
};

export type ApiGenericResponse = {
  status?: boolean;
  message?: string;
  data?: unknown;
};

export function unwrapItemRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;

  if (Array.isArray(raw)) {
    return raw.length > 0 ? unwrapItemRecord(raw[0]) : null;
  }

  const obj = raw as Record<string, unknown>;

  // Check if wrapped in data
  if (obj.data && typeof obj.data === "object") {
    const fromData = unwrapItemRecord(obj.data);
    if (fromData) return fromData;
  }

  // Check if wrapped in item
  if (obj.item && typeof obj.item === "object") {
    const fromItem = unwrapItemRecord(obj.item);
    if (fromItem) return fromItem;
  }

  // Check if wrapped in mainCategory
  if (obj.mainCategory && typeof obj.mainCategory === "object") {
    const fromMain = unwrapItemRecord(obj.mainCategory);
    if (fromMain) return fromMain;
  }

  // Check if wrapped in collectionItem
  if (obj.collectionItem && typeof obj.collectionItem === "object") {
    const fromCol = unwrapItemRecord(obj.collectionItem);
    if (fromCol) return fromCol;
  }

  // Check if wrapped in result
  if (obj.result && typeof obj.result === "object") {
    const fromRes = unwrapItemRecord(obj.result);
    if (fromRes) return fromRes;
  }

  return obj;
}

// 3.1 Get All Collections (Admin View)
export async function getCollectionsApi(params?: {
  page?: number;
  limit?: number;
  itemPage?: number;
  itemLimit?: number;
}) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 50),
    itemPage: String(params?.itemPage ?? 1),
    itemLimit: String(params?.itemLimit ?? 50),
  });

  const response = await api.get<ApiCollectionsResponse>(
    `${COLLECTION_ENDPOINTS.list}?${query.toString()}`,
  );

  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (response?.data && Array.isArray(response.data.collections)) {
    return response.data.collections;
  }
  return [];
}

// 3.2 Get Sorted Offerings
export async function getSortedOfferingsApi(): Promise<ApiOfferingItem[]> {
  const response = await api.get<ApiOfferingsResponse>(
    COLLECTION_ENDPOINTS.sortedOfferings,
  );

  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (response?.data && Array.isArray(response.data.offerings)) {
    return response.data.offerings;
  }
  return [];
}

// 3.3 Search Offerings
export async function searchOfferingsApi(
  key: string,
): Promise<ApiOfferingItem[]> {
  if (!key.trim()) return [];

  const response = await api.get<ApiOfferingsResponse>(
    COLLECTION_ENDPOINTS.searchOfferings(key.trim()),
  );

  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (response?.data && Array.isArray(response.data.offerings)) {
    return response.data.offerings;
  }
  return [];
}

// 3.4 Get Single Collection Item with Offerings
export async function getCollectionItemApi(
  id: string,
): Promise<Record<string, unknown> | null> {
  const response = await api.get<unknown>(
    COLLECTION_ENDPOINTS.getItem(id),
  );

  return unwrapItemRecord(response);
}

// 3.7 Create Collection
export async function createCollectionApi(payload: {
  name: { en: string; ar: string };
  published: boolean;
}) {
  return await api.post<ApiGenericResponse>(COLLECTION_ENDPOINTS.create, {
    name: {
      en: payload.name.en,
      ar: payload.name.ar,
    },
    published: payload.published,
    mainCategory: [],
  });
}

// 3.8 Add Item to Collection
export async function addCollectionItemApi(
  collectionId: string,
  payload: {
    name: { en: string; ar: string };
    englishImages: unknown[];
    arabicImages: unknown[];
    subCategories: Array<{
      name: { en: string; ar: string };
      offerings: Array<{ offeringId: string; vendorId: string }> | string[];
    }>;
  },
) {
  return await api.post<ApiGenericResponse>(
    COLLECTION_ENDPOINTS.addItem(collectionId),
    payload,
  );
}

// 3.9 Update Collection
export async function updateCollectionApi(
  id: string,
  payload: {
    name: { en: string; ar: string };
    published: boolean;
  },
) {
  return await api.put<ApiGenericResponse>(COLLECTION_ENDPOINTS.update(id), {
    "name.en": payload.name.en,
    "name.ar": payload.name.ar,
    name: {
      en: payload.name.en,
      ar: payload.name.ar,
    },
    published: payload.published,
  });
}

// 3.10 Update Collection Item
export async function updateCollectionItemApi(
  id: string,
  payload: {
    name: { en: string; ar: string };
    englishImages: unknown[];
    arabicImages: unknown[];
    subCategories: Array<{
      name: { en: string; ar: string };
      offerings: Array<{ offeringId: string; vendorId: string }> | string[];
    }>;
  },
) {
  return await api.put<ApiGenericResponse>(
    COLLECTION_ENDPOINTS.updateItem(id),
    payload,
  );
}

// 3.11 Delete Collection Item
export async function deleteCollectionItemApi(id: string) {
  return await api.delete<ApiGenericResponse>(COLLECTION_ENDPOINTS.deleteItem(id));
}

// 3.12 Delete Collection
export async function deleteCollectionApi(id: string) {
  return await api.delete<ApiGenericResponse>(COLLECTION_ENDPOINTS.delete(id));
}
