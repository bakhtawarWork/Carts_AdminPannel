import { ApiError, api } from "@/services/api";
import { PROMO_CODE_ENDPOINTS } from "@/services/endpoints";
import type { PromoCodeListTab } from "@/lib/types";

export type PromoCodeAffectedVendorApi = {
  _id?: string;
  id?: string;
  name?: {
    en?: string;
    ar?: string;
  };
};

export type PromoCodeApiItem = {
  _id?: string;
  id?: string;
  maxUsages?: number;
  currentUsage?: number;
  promoType?: string;
  /** List APIs may send an id string; details sends a populated vendor object. */
  affectedVendors?: string | PromoCodeAffectedVendorApi;
  /** List (vendor-created) display name from backend. */
  vendorName?: string | { en?: string; ar?: string };
  amount?: number;
  cartsShare?: number;
  vendorShare?: number;
  live?: boolean;
  _deleted?: boolean;
  createdBy?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PromoCodesApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    promoCodes?: PromoCodeApiItem[];
  };
};

/** GET /admin/promocode/promocode?createdBy=admin|vendor */
export async function getPromoCodes(createdBy: PromoCodeListTab) {
  const params = new URLSearchParams({ createdBy });
  const payload = await api.get<PromoCodesApiResponse>(
    `${PROMO_CODE_ENDPOINTS.list}?${params.toString()}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load promo codes.",
      400,
      payload,
    );
  }

  return (payload.data?.promoCodes ?? []).filter((item) => !item._deleted);
}

export type CreatePromoCodePayload = {
  code: string;
  maxUsages: number;
  startDate: string;
  endDate: string;
  promoType: "percentage" | "fixed";
  affectedVendors: string;
  amount: number;
  cartsShare: number;
  live: boolean;
};

export type CreatePromoCodeApiResponse = {
  status?: boolean;
  message?: string;
  data?: PromoCodeApiItem;
};

export type PromoCodeDetailsApiResponse = {
  status?: boolean;
  message?: string;
  promoCodes?: PromoCodeApiItem;
  data?:
    | PromoCodeApiItem
    | {
        promoCodes?: PromoCodeApiItem;
        promoCode?: PromoCodeApiItem;
      };
};

function extractPromoCodeDetails(
  response: PromoCodeDetailsApiResponse,
): PromoCodeApiItem | null {
  if (response.promoCodes && typeof response.promoCodes === "object") {
    return response.promoCodes;
  }

  const data = response.data;
  if (!data || typeof data !== "object") return null;

  if ("promoCodes" in data && data.promoCodes) return data.promoCodes;
  if ("promoCode" in data && data.promoCode) return data.promoCode;
  if ("_id" in data || "id" in data || "code" in data) {
    return data as PromoCodeApiItem;
  }

  return null;
}

/** GET /admin/promocode/:id — body shape: { promoCodes: { ... } } */
export async function getPromoCodeDetails(id: string) {
  const response = await api.get<PromoCodeDetailsApiResponse>(
    `${PROMO_CODE_ENDPOINTS.details}/${encodeURIComponent(id)}`,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not load promo code.",
      400,
      response,
    );
  }

  const item = extractPromoCodeDetails(response);

  if (!item || item._deleted) {
    throw new ApiError(
      response.message ?? "Promo code not found.",
      404,
      response,
    );
  }

  return item;
}

/** POST /admin/promocode/create */
export async function createPromoCode(payload: CreatePromoCodePayload) {
  const response = await api.post<CreatePromoCodeApiResponse>(
    PROMO_CODE_ENDPOINTS.create,
    payload,
  );

  if (response?.status === false || !response.data) {
    throw new ApiError(
      response.message ?? "Could not create promo code.",
      400,
      response,
    );
  }

  return {
    message: response.message?.trim() || "Promo code created successfully",
    data: response.data,
  };
}

export type UpdatePromoCodePayload = Partial<{
  code: string;
  maxUsages: number;
  startDate: string;
  endDate: string;
  promoType: "percentage" | "fixed";
  affectedVendors: string;
  amount: number;
  cartsShare: number;
  live: boolean;
}>;

export type UpdatePromoCodeApiResponse = {
  status?: boolean;
  message?: string | { updateData?: UpdatePromoCodePayload };
  data?: string | PromoCodeApiItem;
};

function updatePromoCodeMessage(response: UpdatePromoCodeApiResponse) {
  if (typeof response.data === "string" && response.data.trim()) {
    return response.data.trim();
  }
  if (typeof response.message === "string" && response.message.trim()) {
    return response.message.trim();
  }
  return "Promo code updated successfully";
}

/** PUT /admin/promocode/update/:id — body contains only changed fields */
export async function updatePromoCode(
  id: string,
  payload: UpdatePromoCodePayload,
) {
  const response = await api.put<UpdatePromoCodeApiResponse>(
    `${PROMO_CODE_ENDPOINTS.update}/${encodeURIComponent(id)}`,
    payload,
  );

  if (response?.status === false) {
    const failure =
      typeof response.message === "string"
        ? response.message
        : typeof response.data === "string"
          ? response.data
          : "Could not update promo code.";
    throw new ApiError(failure, 400, response);
  }

  return {
    message: updatePromoCodeMessage(response),
    updateData:
      typeof response.message === "object"
        ? (response.message.updateData ?? payload)
        : payload,
  };
}

export type DeletePromoCodeApiResponse = {
  status?: boolean;
  message?: string;
};

/** DELETE /admin/promocode/delete/:id */
export async function deletePromoCode(id: string) {
  const response = await api.delete<DeletePromoCodeApiResponse>(
    `${PROMO_CODE_ENDPOINTS.delete}/${encodeURIComponent(id)}`,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not delete promo code.",
      400,
      response,
    );
  }

  return {
    message: response.message?.trim() || "Promo code deleted successfully",
  };
}
