import { ApiError, api } from "@/services/api";
import { OFFERING_ENDPOINTS } from "@/services/endpoints";

export type OfferingCategoryApiItem = {
  id?: string;
  _id?: string;
  name?: string;
  approveStatus?: string;
  nameObj?: {
    en?: string;
    ar?: string;
  };
};

export type OfferingCategoriesApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    offeringCategories?: OfferingCategoryApiItem[];
  };
};

export type OfferingApprovalApiItem = {
  _id?: string;
  id?: string;
  published?: boolean;
  thumb?: string;
  vendor?: string;
  englishName?: string;
  arabicName?: string;
  created?: string;
  updated?: string;
  offeringCategory?: string;
  approveStatus?: string;
};

export type OfferingApprovalListApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    total?: number | string;
    offerings?: OfferingApprovalApiItem[];
  };
};

export type OfferingApprovalStatus = "created" | "deleteRequested";

function toCount(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** GET /offerings/approval-list?status=created|deleted */
export async function getOfferingApprovalList(status: OfferingApprovalStatus) {
  const params = new URLSearchParams({ status });
  const payload = await api.get<OfferingApprovalListApiResponse>(
    `${OFFERING_ENDPOINTS.approvalList}?${params.toString()}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load offering approvals.",
      400,
      payload,
    );
  }

  const offerings = payload.data?.offerings ?? [];
  return {
    offerings,
    total: toCount(payload.data?.total, offerings.length),
  };
}

export type OfferingDecisionApiResponse = {
  status?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

async function decideOffering(
  path: string,
  id: string,
  failureMessage: string,
  successMessage: string,
) {
  const params = new URLSearchParams({ id });
  const response = await api.put<OfferingDecisionApiResponse>(
    `${path}?${params.toString()}`,
  );

  if (response?.status === false) {
    throw new ApiError(response.message ?? failureMessage, 400, response);
  }

  return {
    message: response?.message?.trim() || successMessage,
  };
}

/** PUT /admin/offerings/approve?id= */
export function approveOffering(id: string) {
  return decideOffering(
    OFFERING_ENDPOINTS.approve,
    id,
    "Could not approve offering.",
    "Offering approved successfully",
  );
}

/** PUT /admin/offerings/reject?id= */
export function rejectOffering(id: string) {
  return decideOffering(
    OFFERING_ENDPOINTS.reject,
    id,
    "Could not reject offering.",
    "Offering rejected successfully",
  );
}

/** PUT /admin/offerings/approve-delete?id= */
export function approveOfferingDelete(id: string) {
  return decideOffering(
    OFFERING_ENDPOINTS.approveDelete,
    id,
    "Could not approve deletion.",
    "Offering deletion approved successfully",
  );
}

export type OfferingDetailName = {
  en?: string;
  ar?: string;
};

export type OfferingDetailNamedItem = {
  _id?: string;
  name?: OfferingDetailName;
};

export type OfferingDetailImage = {
  _id?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
};

export type OfferingDetailApiItem = {
  _id?: string;
  _vendor?: { _id?: string } | string;
  name?: OfferingDetailName;
  shortDescription?: OfferingDetailName;
  published?: boolean;
  categoryId?: { _id?: string } | string;
  serviceCategory?: string;
  startingPrice?: number | string | null;
  price?: number | string | null;
  minimumQuantity?: number | string | null;
  maxQuantity?: number | string | null;
  minimumNotice?: number | string | null;
  images?: OfferingDetailImage[] | null;
  setupTimeInHours?: number | string | null;
  maxTimeInHours?: number | string | null;
  femaleServiceAvailable?: boolean;
  serviceAvailability?: number | string | null;
  serviceAvailabilitySharedCode?: number | string | null;
  requiredOptions?: Array<{
    _id?: string;
    name?: OfferingDetailName;
    requiredNumber?: number | string | null;
    options?: OfferingDetailNamedItem[] | null;
  }> | null;
  addOns?: Array<{
    _id?: string;
    name?: OfferingDetailName;
    addOns?: Array<
      OfferingDetailNamedItem & {
        price?: number | string | null;
        max?: number | string | null;
      }
    > | null;
  }> | null;
  food?: OfferingDetailNamedItem[] | null;
  notes?: OfferingDetailNamedItem[] | null;
  presentation?: OfferingDetailNamedItem[] | null;
  decorations?: OfferingDetailNamedItem[] | null;
  furniture?: OfferingDetailNamedItem[] | null;
  equipment?: OfferingDetailNamedItem[] | null;
  drinks?: OfferingDetailNamedItem[] | null;
  requirements?: OfferingDetailNamedItem[] | null;
  enoughFor?: OfferingDetailName;
};

export type OfferingDetailApiResponse = {
  status?: boolean;
  message?: string;
  data?: OfferingDetailApiItem;
};

/** GET /admin/offerings/details?id= */
export async function getOfferingDetails(id: string) {
  const params = new URLSearchParams({ id });
  const payload = await api.get<OfferingDetailApiResponse>(
    `${OFFERING_ENDPOINTS.details}?${params.toString()}`,
  );

  if (payload?.status === false || !payload.data) {
    throw new ApiError(
      payload?.message ?? "Could not load offering details.",
      400,
      payload,
    );
  }

  return payload.data;
}

export type VendorOfferingApiImage = {
  _id?: string;
  key?: string;
  url?: string;
  cdnUrl?: string;
  filename?: string;
};

export type VendorOfferingApiCategory = {
  _id?: string;
  id?: string;
  name?: {
    en?: string;
    ar?: string;
  };
};

export type VendorOfferingApiItem = {
  _id?: string;
  id?: string;
  name?: {
    en?: string;
    ar?: string;
  };
  published?: boolean;
  approveStatus?: string;
  _deleted?: boolean;
  _vendor?: string;
  startingPrice?: number | string | null;
  price?: number | string | null;
  categoryId?: VendorOfferingApiCategory | string | null;
  images?: VendorOfferingApiImage[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorOfferingsApiResponse = {
  status?: boolean;
  message?: string;
  data?: VendorOfferingApiItem[];
};

/** GET /admin/offerings/vendors?vendorId= */
export async function getVendorOfferings(vendorId: string) {
  const params = new URLSearchParams({ vendorId });
  const payload = await api.get<VendorOfferingsApiResponse>(
    `${OFFERING_ENDPOINTS.byVendor}?${params.toString()}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor offerings.",
      400,
      payload,
    );
  }

  return payload.data ?? [];
}

/** PUT /admin/offerings/reject-delete?id= */
export function rejectOfferingDelete(id: string) {
  return decideOffering(
    OFFERING_ENDPOINTS.rejectDelete,
    id,
    "Could not reject deletion.",
    "Offering deletion rejected successfully",
  );
}

export async function getOfferingCategories() {
  const payload = await api.get<OfferingCategoriesApiResponse>(
    OFFERING_ENDPOINTS.categories,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load offering categories.",
      400,
      payload,
    );
  }

  return payload.data?.offeringCategories ?? [];
}

export type CreateOfferingNamedItem = {
  name: {
    en: string;
    ar: string;
  };
};

export type CreateOfferingRequiredOption = {
  name: {
    en: string;
    ar: string;
  };
  requiredNumber: number;
  options: CreateOfferingNamedItem[];
};

export type CreateOfferingAddOnItem = {
  name: {
    en: string;
    ar: string;
  };
  price: number;
  max: number;
};

export type CreateOfferingAddOnGroup = {
  name: {
    en: string;
    ar: string;
  };
  addOns: CreateOfferingAddOnItem[];
};

export type CreateOfferingImagePayload = {
  name: string;
  type: string;
  value: string;
};

export type CreateOfferingPayload = {
  vendorId: string;
  name: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  published: boolean;
  categoryId: string;
  serviceCategory: string;
  startingPrice: string;
  price: string;
  minimumQuantity: string;
  maxQuantity: string;
  minimumNotice: string;
  setupTimeInHours: string;
  maxTimeInHours: string;
  femaleServiceAvailable: boolean;
  serviceAvailability: number;
  serviceAvailabilitySharedCode: string;
  requiredOptions: CreateOfferingRequiredOption[];
  addOns: CreateOfferingAddOnGroup[];
  food: CreateOfferingNamedItem[];
  notes: CreateOfferingNamedItem[];
  presentation: CreateOfferingNamedItem[];
  decorations: CreateOfferingNamedItem[];
  furniture: CreateOfferingNamedItem[];
  equipment: CreateOfferingNamedItem[];
  drinks: CreateOfferingNamedItem[];
  requirements: CreateOfferingNamedItem[];
  enoughFor: { en: string; ar: string };
  offeringimages: CreateOfferingImagePayload[];
};

export type CreateOfferingApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    _id?: string;
    id?: string;
  };
};

/** POST /admin/offerings */
export async function createOffering(payload: CreateOfferingPayload) {
  const response = await api.post<CreateOfferingApiResponse>(
    OFFERING_ENDPOINTS.list,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not create offering.",
      400,
      response,
    );
  }

  const id = response.data?._id ?? response.data?.id;
  if (!id) {
    throw new ApiError("No offering id was returned.", 200, response);
  }

  return {
    id,
    message: response.message?.trim() || "Offering created successfully",
  };
}

export type CreateOfferingCategoryPayload = {
  name: {
    en: string;
    ar: string;
  };
};

export type CreateOfferingCategoryApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    _id?: string;
    id?: string;
  };
};

export async function createOfferingCategoryApi(
  payload: CreateOfferingCategoryPayload,
) {
  const response = await api.post<CreateOfferingCategoryApiResponse>(
    OFFERING_ENDPOINTS.categories,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not create offering category.",
      400,
      response,
    );
  }

  const id = response.data?._id ?? response.data?.id;
  if (!id) {
    throw new ApiError(
      "Category created but no id was returned.",
      200,
      response,
    );
  }

  return { id, message: response.message };
}
