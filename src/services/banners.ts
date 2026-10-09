import { ApiError, api } from "@/services/api";
import { BANNER_ENDPOINTS } from "@/services/endpoints";

export type BannerApiImage = {
  key?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
};

export type BannerApiItem = {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  type: "main" | "sub";
  position: number;
  destination?: string;
  image?: BannerApiImage;
  status: "active" | "inactive";
  _deleted?: boolean;
  actionType?: string;
  referenceId?: string | null;
  externalUrl?: string | null;
  createdBy?: string;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBannerPayload = {
  name: {
    en: string;
    ar?: string;
  };
  type: "main" | "sub";
  position: number;
  destination?: string;
  status: "active" | "inactive";
  actionType?: string;
  referenceId?: string | null;
  image: {
    name: string;
    value: string;
    type: string;
  };
};

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export type GetBannersParams = {
  type?: "main" | "sub" | "all";
  status?: "active" | "inactive" | "deleted" | "all";
  page?: number;
  limit?: number;
  search?: string;
};

export type GetBannersApiResponse = {
  success: boolean;
  message?: string;
  data: {
    banners: BannerApiItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type BannerSingleApiResponse = {
  success: boolean;
  message?: string;
  data: {
    banner: BannerApiItem;
  };
};

export type DeleteBannerApiResponse = {
  success: boolean;
  message?: string;
  data: {
    _id: string;
    deleted: boolean;
  };
};

export async function createBanner(payload: CreateBannerPayload) {
  const response = await api.post<BannerSingleApiResponse>(
    BANNER_ENDPOINTS.create,
    payload,
  );

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not create banner.",
      400,
      response,
    );
  }

  return response.data?.banner;
}

export async function getBanners(params: GetBannersParams = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.search !== undefined && params.search.trim()) {
    query.set("search", params.search.trim());
  }

  const qs = query.toString();
  const endpoint = qs ? `${BANNER_ENDPOINTS.list}?${qs}` : BANNER_ENDPOINTS.list;

  const response = await api.get<GetBannersApiResponse>(endpoint);

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not retrieve banners.",
      400,
      response,
    );
  }

  return response.data;
}

export async function getBannerById(id: string) {
  const response = await api.get<BannerSingleApiResponse>(
    BANNER_ENDPOINTS.details(id),
  );

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not retrieve banner.",
      400,
      response,
    );
  }

  return response.data?.banner;
}

export async function updateBanner(id: string, payload: UpdateBannerPayload) {
  const response = await api.put<BannerSingleApiResponse>(
    BANNER_ENDPOINTS.update(id),
    payload,
  );

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not update banner.",
      400,
      response,
    );
  }

  return response.data?.banner;
}

export async function updateBannerStatus(
  id: string,
  status: "active" | "inactive",
) {
  const response = await api.patch<BannerSingleApiResponse>(
    BANNER_ENDPOINTS.status(id),
    { status },
  );

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not update banner status.",
      400,
      response,
    );
  }

  return response.data?.banner;
}

export async function deleteBannerApi(id: string) {
  const response = await api.delete<DeleteBannerApiResponse>(
    BANNER_ENDPOINTS.delete(id),
  );

  if (response?.success === false) {
    throw new ApiError(
      response.message ?? "Could not delete banner.",
      400,
      response,
    );
  }

  return response.data;
}
