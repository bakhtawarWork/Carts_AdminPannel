import { api } from "@/services/api";
import { POPULAR_COLLECTION_ENDPOINTS } from "@/services/endpoints";

export type ApiPopularCollectionImage = {
  key?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
};

export type ApiPopularSubCollection = {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  published?: boolean;
  order?: number;
};

export type ApiPopularCollection = {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  published?: boolean;
  order?: number;
  isPopular?: boolean;
  legacyServiceCategory?: string;
  subCollections?: ApiPopularSubCollection[];
  image?: ApiPopularCollectionImage | string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPopularCollectionsListResponse = {
  status?: boolean;
  message?: string;
  data?: {
    collections?: ApiPopularCollection[];
    totalRecords?: number;
    currentPage?: number;
    totalPages?: number;
    limit?: number;
  } | ApiPopularCollection[];
};

export type ApiPopularCollectionDetailResponse = {
  status?: boolean;
  message?: string;
  data?:
    | ApiPopularCollection
    | {
        collection?: ApiPopularCollection;
        result?: ApiPopularCollection;
      };
};

export type ApiPopularSubCollectionsResponse = {
  status?: boolean;
  message?: string;
  data?:
    | ApiPopularSubCollection[]
    | {
        subCollections?: ApiPopularSubCollection[];
        result?: ApiPopularSubCollection;
        _id?: string;
        name?: { en: string; ar?: string };
        published?: boolean;
        order?: number;
      };
};

export type ApiSubCollectionItem = {
  _id: string;
  name: { en: string; ar?: string };
  orderInSubCollection?: number;
  isPlaceFixed?: boolean;
  _linkId?: string;
  images?: unknown[];
  vendor?: {
    name?: { en: string; ar?: string };
    deliveryAreasAndCost?: unknown[];
    serviceHours?: unknown;
  };
};

export type ApiSubCollectionFullData = {
  _id: string;
  name: { en: string; ar?: string };
  offerings?: ApiSubCollectionItem[];
  vendors?: ApiSubCollectionItem[];
};

export type CreatePopularCollectionPayload = {
  englishName: string;
  arabicName: string;
  published?: boolean;
  isPopular?: boolean;
  order?: number;
  legacyServiceCategory?: string;
  file?: File | Blob | null;
};

export type UpdatePopularCollectionPayload = Partial<CreatePopularCollectionPayload>;

export type CreatePopularSubCollectionPayload = {
  name: {
    en: string;
    ar: string;
  };
  published?: boolean;
  order?: number;
};

export type UpdatePopularSubCollectionPayload = Partial<CreatePopularSubCollectionPayload>;

export function buildPopularCollectionFormData(
  payload: CreatePopularCollectionPayload | UpdatePopularCollectionPayload,
): FormData {
  const formData = new FormData();
  if (payload.englishName !== undefined) {
    formData.append("name.en", payload.englishName.trim());
  }
  if (payload.arabicName !== undefined) {
    formData.append("name.ar", payload.arabicName.trim());
  }
  if (payload.published !== undefined) {
    formData.append("published", String(payload.published));
  }
  if (payload.isPopular !== undefined) {
    formData.append("isPopular", String(payload.isPopular));
  }
  formData.append("order", String(Math.round(Number(payload.order ?? 1))));
  if (payload.legacyServiceCategory !== undefined) {
    formData.append("legacyServiceCategory", payload.legacyServiceCategory);
  }
  if (payload.file) {
    formData.append("file", payload.file);
  }
  return formData;
}

function unwrapCollectionItem(raw: unknown): ApiPopularCollection | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.collection && typeof obj.collection === "object") {
    return obj.collection as ApiPopularCollection;
  }
  if (obj.result && typeof obj.result === "object") {
    return obj.result as ApiPopularCollection;
  }
  if ("_id" in obj || "name" in obj) {
    return obj as unknown as ApiPopularCollection;
  }
  return null;
}

function unwrapSubCollectionItem(raw: unknown): ApiPopularSubCollection | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.result && typeof obj.result === "object") {
    return obj.result as ApiPopularSubCollection;
  }
  if (obj.subCollection && typeof obj.subCollection === "object") {
    return obj.subCollection as ApiPopularSubCollection;
  }
  if ("_id" in obj || "name" in obj) {
    return obj as unknown as ApiPopularSubCollection;
  }
  return null;
}

/**
 * 2.1 GET ALL MAIN COLLECTIONS (Paginated)
 * Endpoint: GET /popular-collections
 */
export async function getPopularCollectionsApi(params?: {
  page?: number;
  limit?: number;
  isPublished?: boolean;
}): Promise<{
  collections: ApiPopularCollection[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set("page", String(params.page));
  if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params?.isPublished !== undefined)
    searchParams.set("isPublished", String(params.isPublished));

  const query = searchParams.toString();
  const url = query
    ? `${POPULAR_COLLECTION_ENDPOINTS.list}?${query}`
    : POPULAR_COLLECTION_ENDPOINTS.list;

  const response = await api.get<ApiPopularCollectionsListResponse>(url);

  if (Array.isArray(response?.data)) {
    return {
      collections: response.data,
      totalRecords: response.data.length,
      currentPage: 1,
      totalPages: 1,
      limit: response.data.length,
    };
  }

  if (response?.data && typeof response.data === "object") {
    const list = Array.isArray(response.data.collections)
      ? response.data.collections
      : [];
    return {
      collections: list,
      totalRecords: response.data.totalRecords ?? list.length,
      currentPage: response.data.currentPage ?? 1,
      totalPages: response.data.totalPages ?? 1,
      limit: response.data.limit ?? list.length,
    };
  }

  return {
    collections: [],
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  };
}

/**
 * 2.2 CREATE MAIN COLLECTION
 * Endpoint: POST /popular-collections
 * Content-Type: multipart/form-data
 */
export async function createPopularCollectionApi(
  payload: FormData | CreatePopularCollectionPayload,
): Promise<ApiPopularCollection> {
  const body =
    payload instanceof FormData
      ? payload
      : buildPopularCollectionFormData(payload);

  const response = await api.post<ApiPopularCollectionDetailResponse>(
    POPULAR_COLLECTION_ENDPOINTS.create,
    body,
  );

  const unwrapped = unwrapCollectionItem(response?.data ?? response);
  if (!unwrapped) {
    throw new Error(response?.message || "Failed to create collection.");
  }
  return unwrapped;
}

/**
 * 2.3 GET MAIN COLLECTION BY ID
 * Endpoint: GET /popular-collections/:id
 */
export async function getPopularCollectionByIdApi(
  id: string,
): Promise<ApiPopularCollection | null> {
  const response = await api.get<ApiPopularCollectionDetailResponse>(
    POPULAR_COLLECTION_ENDPOINTS.details(id),
  );

  return unwrapCollectionItem(response?.data ?? response);
}

/**
 * 2.4 UPDATE MAIN COLLECTION
 * Endpoint: PUT /popular-collections/:id
 * Content-Type: multipart/form-data
 */
export async function updatePopularCollectionApi(
  id: string,
  payload: FormData | UpdatePopularCollectionPayload,
): Promise<ApiPopularCollection> {
  const body =
    payload instanceof FormData
      ? payload
      : buildPopularCollectionFormData(payload);

  const response = await api.put<ApiPopularCollectionDetailResponse>(
    POPULAR_COLLECTION_ENDPOINTS.update(id),
    body,
  );

  const unwrapped = unwrapCollectionItem(response?.data ?? response);
  if (!unwrapped) {
    throw new Error(response?.message || "Failed to update collection.");
  }
  return unwrapped;
}

/**
 * 2.5 DELETE MAIN COLLECTION
 * Endpoint: DELETE /popular-collections/:id
 */
export async function deletePopularCollectionApi(id: string): Promise<boolean> {
  await api.delete(POPULAR_COLLECTION_ENDPOINTS.delete(id));
  return true;
}

/**
 * 2.6 GET SUBCOLLECTIONS OF A MAIN COLLECTION
 * Endpoint: GET /popular-collections/:id/subcollection
 */
export async function getSubCollectionsApi(
  collectionId: string,
): Promise<ApiPopularSubCollection[]> {
  const response = await api.get<ApiPopularSubCollectionsResponse>(
    POPULAR_COLLECTION_ENDPOINTS.subcollections(collectionId),
  );

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    Array.isArray((response.data as { subCollections?: ApiPopularSubCollection[] }).subCollections)
  ) {
    return (response.data as { subCollections: ApiPopularSubCollection[] }).subCollections;
  }

  return [];
}

/**
 * 2.7 CREATE SUBCOLLECTION
 * Endpoint: POST /popular-collections/:id/subcollection
 * Content-Type: application/json
 */
export async function createSubCollectionApi(
  collectionId: string,
  payload: CreatePopularSubCollectionPayload,
): Promise<ApiPopularSubCollection> {
  const response = await api.post<ApiPopularSubCollectionsResponse>(
    POPULAR_COLLECTION_ENDPOINTS.createSubcollection(collectionId),
    payload,
  );

  const unwrapped = unwrapSubCollectionItem(response?.data ?? response);
  if (!unwrapped) {
    throw new Error(response?.message || "Failed to create sub-collection.");
  }
  return unwrapped;
}

/**
 * 2.8 GET SUBCOLLECTION DATA (Full details with Offerings and Vendors)
 * Endpoint: GET /popular-collections/:id/subcollection/:subId
 */
export async function getSubCollectionDataApi(
  collectionId: string,
  subId: string,
): Promise<ApiSubCollectionFullData | null> {
  const response = await api.get<{
    status?: boolean;
    message?: string;
    data?:
      | ApiSubCollectionFullData
      | {
          result?: ApiSubCollectionFullData;
          subCollection?: ApiSubCollectionFullData;
        };
  }>(POPULAR_COLLECTION_ENDPOINTS.subcollectionData(collectionId, subId));

  const data = response?.data ?? response;
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (obj.result && typeof obj.result === "object") {
    return obj.result as ApiSubCollectionFullData;
  }
  if (obj.subCollection && typeof obj.subCollection === "object") {
    return obj.subCollection as ApiSubCollectionFullData;
  }
  return obj as unknown as ApiSubCollectionFullData;
}

/**
 * 2.9 GET SUBCOLLECTION DETAILS (Lightweight projection)
 * Endpoint: GET /popular-collections/:id/subcollection/details/:subId
 */
export async function getSubCollectionDetailsApi(
  collectionId: string,
  subId: string,
): Promise<ApiSubCollectionFullData | null> {
  const response = await api.get<{
    status?: boolean;
    message?: string;
    data?: ApiSubCollectionFullData;
  }>(POPULAR_COLLECTION_ENDPOINTS.subcollectionDetails(collectionId, subId));

  return response?.data ?? (response as unknown as ApiSubCollectionFullData) ?? null;
}

/**
 * 2.10 UPDATE SUBCOLLECTION
 * Endpoint: PUT /popular-collections/:id/subcollection/:subId
 * Content-Type: application/json
 */
export async function updateSubCollectionApi(
  collectionId: string,
  subId: string,
  payload: UpdatePopularSubCollectionPayload,
): Promise<ApiPopularSubCollection> {
  const response = await api.put<ApiPopularSubCollectionsResponse>(
    POPULAR_COLLECTION_ENDPOINTS.updateSubcollection(collectionId, subId),
    payload,
  );

  const unwrapped = unwrapSubCollectionItem(response?.data ?? response);
  if (!unwrapped) {
    throw new Error(response?.message || "Failed to update sub-collection.");
  }
  return unwrapped;
}

/**
 * 2.11 DELETE SUBCOLLECTION
 * Endpoint: DELETE /popular-collections/:id/subcollection/:subId
 */
export async function deleteSubCollectionApi(
  collectionId: string,
  subId: string,
): Promise<boolean> {
  await api.delete(
    POPULAR_COLLECTION_ENDPOINTS.deleteSubcollection(collectionId, subId),
  );
  return true;
}

/**
 * 2.12 GET ITEMS IN SUBCOLLECTION BY TYPE
 * Endpoint: GET /popular-collections/:id/subcollection/:subId/items/:type
 */
export async function getSubCollectionItemsApi(
  collectionId: string,
  subId: string,
  type: "offerings" | "vendors",
): Promise<ApiSubCollectionItem[]> {
  const response = await api.get<{
    status?: boolean;
    message?: string;
    data?: ApiSubCollectionItem[];
  }>(POPULAR_COLLECTION_ENDPOINTS.subcollectionItems(collectionId, subId, type));

  return Array.isArray(response?.data) ? response.data : [];
}

/**
 * 2.13 ADD ITEMS TO SUBCOLLECTION (Batch Add)
 * Endpoint: POST /popular-collections/:id/subcollection/:subId/items
 * Content-Type: application/json
 */
export async function addSubCollectionItemsApi(
  collectionId: string,
  subId: string,
  payload: {
    type: "offerings" | "vendors";
    itemIds: string[];
  },
): Promise<boolean> {
  await api.post(
    POPULAR_COLLECTION_ENDPOINTS.addSubcollectionItems(collectionId, subId),
    payload,
  );
  return true;
}

/**
 * 2.14 UPDATE ITEM ORDER / FIXED PLACE IN SUBCOLLECTION
 * Endpoint: PUT /popular-collections/:id/subcollection/:subId/items/:type/:itemId
 * Content-Type: application/json
 */
export async function updateSubCollectionItemApi(
  collectionId: string,
  subId: string,
  type: "offerings" | "vendors",
  itemId: string,
  payload: {
    order?: number;
    isPlaceFixed?: boolean;
  },
): Promise<unknown> {
  return await api.put(
    POPULAR_COLLECTION_ENDPOINTS.updateSubcollectionItem(
      collectionId,
      subId,
      type,
      itemId,
    ),
    payload,
  );
}

/**
 * 2.15 REMOVE ITEM FROM SUBCOLLECTION
 * Endpoint: DELETE /popular-collections/:id/subcollection/:subId/items/:type/:itemId
 */
export async function removeSubCollectionItemApi(
  collectionId: string,
  subId: string,
  type: "offerings" | "vendors",
  itemId: string,
): Promise<boolean> {
  await api.delete(
    POPULAR_COLLECTION_ENDPOINTS.deleteSubcollectionItem(
      collectionId,
      subId,
      type,
      itemId,
    ),
  );
  return true;
}
