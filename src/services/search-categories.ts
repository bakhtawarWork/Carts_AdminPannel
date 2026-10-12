import { ApiError, api } from "@/services/api";
import { SEARCH_CATEGORY_ENDPOINTS } from "@/services/endpoints";

export type SearchCategoryApiImage = {
  key?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
};

export type SearchCategoryItemDto = {
  _id?: string;
  englishName?: string;
  arabicName?: string;
  name?: {
    en?: string;
    ar?: string;
  };
  published?: boolean;
  vendors?: Array<string | { _id: string; [key: string]: unknown }>;
  images?: SearchCategoryApiImage[];
};

export type SearchCategorySectionApiItem = {
  _id: string;
  englishName?: string;
  arabicName?: string;
  name?: {
    en?: string;
    ar?: string;
  };
  published?: boolean;
  categories?: number | SearchCategoryItemDto[];
  searchCategories?: SearchCategoryItemDto[];
  createdAt?: string;
  updatedAt?: string;
};

export type GetSearchCategorySectionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
};

export type GetSearchCategorySectionsApiResponse = {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: {
    sections?: SearchCategorySectionApiItem[];
    totalRecords?: number;
    total?: number;
    currentPage?: number;
    page?: number;
    totalPages?: number;
    limit?: number;
  };
};

export type SearchCategorySectionSingleApiResponse = {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: SearchCategorySectionApiItem | { section: SearchCategorySectionApiItem };
};

export type DeleteSearchCategorySectionApiResponse = {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: unknown;
};

export type CreateSearchCategoryPayload = {
  englishName: string;
  arabicName?: string;
  published?: boolean;
  categories?: SearchCategoryItemDto[] | string;
};

export type UpdateSearchCategoryPayload = Partial<CreateSearchCategoryPayload>;

/**
 * GET /search-categories
 * Paginated list of search category sections
 */
export async function getSearchCategorySections(
  params: GetSearchCategorySectionsParams = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search !== undefined && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.published !== undefined) {
    query.set("published", String(params.published));
  }

  const qs = query.toString();
  const endpoint = qs
    ? `${SEARCH_CATEGORY_ENDPOINTS.list}?${qs}`
    : SEARCH_CATEGORY_ENDPOINTS.list;

  const response =
    await api.get<GetSearchCategorySectionsApiResponse>(endpoint);

  if (
    response?.status === false ||
    (response as unknown as { success?: boolean })?.success === false
  ) {
    throw new ApiError(
      response.message ?? "Could not retrieve search category sections.",
      400,
      response,
    );
  }

  return response.data;
}

/**
 * GET /search-categories/:id
 * Single search category section details by ID
 */
export async function getSearchCategorySectionById(id: string) {
  const response =
    await api.get<SearchCategorySectionSingleApiResponse>(
      SEARCH_CATEGORY_ENDPOINTS.details(id),
    );

  if (
    response?.status === false ||
    (response as unknown as { success?: boolean })?.success === false
  ) {
    throw new ApiError(
      response.message ?? "Could not retrieve search category section details.",
      400,
      response,
    );
  }

  if (response.data && "section" in response.data && response.data.section) {
    return response.data.section;
  }

  return response.data as SearchCategorySectionApiItem;
}

/**
 * POST /search-categories
 * Create search category section (JSON or multipart/form-data)
 */
export async function createSearchCategorySection(
  payload: FormData | CreateSearchCategoryPayload,
) {
  const response =
    await api.post<SearchCategorySectionSingleApiResponse>(
      SEARCH_CATEGORY_ENDPOINTS.create,
      payload,
    );

  if (
    response?.status === false ||
    (response as unknown as { success?: boolean })?.success === false
  ) {
    throw new ApiError(
      response.message ?? "Could not create search category section.",
      400,
      response,
    );
  }

  if (response.data && "section" in response.data && response.data.section) {
    return response.data.section;
  }

  return response.data as SearchCategorySectionApiItem;
}

/**
 * PUT /search-categories/:id
 * Update search category section (JSON or multipart/form-data)
 */
export async function updateSearchCategorySection(
  id: string,
  payload: FormData | UpdateSearchCategoryPayload,
) {
  const response =
    await api.put<SearchCategorySectionSingleApiResponse>(
      SEARCH_CATEGORY_ENDPOINTS.update(id),
      payload,
    );

  if (
    response?.status === false ||
    (response as unknown as { success?: boolean })?.success === false
  ) {
    throw new ApiError(
      response.message ?? "Could not update search category section.",
      400,
      response,
    );
  }

  if (response.data && "section" in response.data && response.data.section) {
    return response.data.section;
  }

  return response.data as SearchCategorySectionApiItem;
}

/**
 * DELETE /search-categories/:id
 * Delete search category section by ID
 */
export async function deleteSearchCategorySectionApi(id: string) {
  const response =
    await api.delete<DeleteSearchCategorySectionApiResponse>(
      SEARCH_CATEGORY_ENDPOINTS.delete(id),
    );

  if (
    response?.status === false ||
    (response as unknown as { success?: boolean })?.success === false
  ) {
    throw new ApiError(
      response.message ?? "Could not delete search category section.",
      400,
      response,
    );
  }

  return response.data;
}
