import { ApiError, api } from "@/services/api";
import { VENDOR_ENDPOINTS } from "@/services/endpoints";

export type VendorSequenceApiItem = {
  _id?: string;
  id?: string;
  order?: number;
  name?: {
    en?: string;
    ar?: string;
  };
};

export type VendorSequenceApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    vendors?: VendorSequenceApiItem[];
  };
};

export async function getVendorSequence() {
  const payload = await api.get<VendorSequenceApiResponse>(
    VENDOR_ENDPOINTS.sequence,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor sequence.",
      400,
      payload,
    );
  }

  return payload.data?.vendors ?? [];
}

export type UpdateVendorSequencePayload = {
  vendorId: string;
  newOrder: number;
};

export type UpdateVendorSequenceApiResponse = {
  status?: boolean;
  message?: string;
};

export async function updateVendorSequence(
  payload: UpdateVendorSequencePayload,
) {
  const response = await api.put<UpdateVendorSequenceApiResponse>(
    VENDOR_ENDPOINTS.sequence,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not update vendor sequence.",
      400,
      response,
    );
  }

  return {
    message: response.message?.trim() || "Vendor order saved.",
  };
}

export type VendorListApiItem = {
  _id?: string;
  id?: string;
  published?: boolean;
  _deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  name?: {
    en?: string;
    ar?: string;
  };
};

export type VendorListApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    vendors?: VendorListApiItem[];
    total_records?: string | number;
    total_pages?: string | number;
  };
};

export type VendorListQueryParams = {
  page: number;
  limit: number;
  status?: string;
  name?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
};

function toCount(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toVendorListSearch(query: VendorListQueryParams) {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, query.page)));
  params.set("limit", String(Math.max(1, query.limit)));

  if (query.status) params.set("status", query.status);
  if (query.name) params.set("name", query.name);
  if (query.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query.createdTo) params.set("createdTo", query.createdTo);
  if (query.updatedFrom) params.set("updatedFrom", query.updatedFrom);
  if (query.updatedTo) params.set("updatedTo", query.updatedTo);

  return params.toString();
}

export type CreateVendorImagePayload = {
  name: string;
  size: number;
  type: string;
  value: string;
};

export type CreateVendorAreaCostPayload = {
  areaId: string;
  fees: number;
};

export type CreateVendorServiceMap<T> = {
  catering: T;
  delivery: T;
  setups: T;
  hospitality: T;
  feasts: T;
};

export type CreateVendorPayload = {
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  contactInfo: {
    primaryEmail: string;
    mobile: string;
    phone: string;
  };
  published: boolean;
  percentage: number;
  serviceCategories: string[];
  deliveryAreasAndCost: CreateVendorServiceMap<CreateVendorAreaCostPayload[]>;
  minimumNotice: CreateVendorServiceMap<number | null>;
  capacity: CreateVendorServiceMap<number | null>;
  vendorimages: CreateVendorServiceMap<CreateVendorImagePayload[]>;
  logoImg: CreateVendorImagePayload[];
  doublePointReward: boolean;
};

export type CreateVendorApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    _id?: string;
    id?: string;
  };
};

/** POST /admin/vendors */
export async function createVendor(payload: CreateVendorPayload) {
  return postVendor(
    VENDOR_ENDPOINTS.list,
    payload,
    "Could not create vendor.",
    "Vendor created successfully",
  );
}

/** POST /admin/vendors/draft */
export async function createVendorDraft(payload: CreateVendorPayload) {
  return postVendor(
    VENDOR_ENDPOINTS.draft,
    payload,
    "Could not save vendor draft.",
    "Draft vendor created successfully",
  );
}

async function postVendor(
  path: string,
  payload: CreateVendorPayload,
  failureMessage: string,
  successMessage: string,
) {
  const response = await api.post<CreateVendorApiResponse>(path, payload);

  if (response?.status === false) {
    throw new ApiError(response.message ?? failureMessage, 400, response);
  }

  const id = response.data?._id ?? response.data?.id;
  if (!id) {
    throw new ApiError("No vendor id was returned.", 200, response);
  }

  return {
    id,
    message: response.message?.trim() || successMessage,
  };
}

export type VendorUserVendorApi = {
  _id?: string;
  id?: string;
  name?: { en?: string; ar?: string };
  logo?: {
    key?: string;
    url?: string;
    cdnUrl?: string;
  };
};

export type VendorUserApiItem = {
  _id?: string;
  id?: string;
  preferredLanguage?: string;
  gender?: string;
  smsVerified?: boolean;
  isBlocked?: boolean;
  role?: string;
  /** List may send vendor id string; details may send populated vendor object. */
  _vendor?: string | VendorUserVendorApi;
  name?: string;
  email?: string;
  mobile?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorUsersApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    users?: VendorUserApiItem[];
  };
};

export type VendorUserDetailsApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    user?: VendorUserApiItem;
  };
};

/** GET /admin/vendors/users?vendorId= */
export async function getVendorUsers(vendorId: string) {
  const params = new URLSearchParams({ vendorId });
  const payload = await api.get<VendorUsersApiResponse>(
    `${VENDOR_ENDPOINTS.users}?${params.toString()}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor users.",
      400,
      payload,
    );
  }

  return payload.data?.users ?? [];
}

/** GET /admin/vendors/users/:userId */
export async function getVendorUserById(userId: string) {
  const payload = await api.get<VendorUserDetailsApiResponse>(
    `${VENDOR_ENDPOINTS.users}/${encodeURIComponent(userId)}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor user.",
      400,
      payload,
    );
  }

  const user = payload.data?.user;
  if (!user) {
    throw new ApiError(
      payload.message ?? "Vendor user not found.",
      404,
      payload,
    );
  }

  return user;
}

export type CreateVendorUserPayload = {
  vendorId: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  preferredLanguage?: string;
  gender?: string;
};

export type CreateVendorUserApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    user?: VendorUserApiItem;
  };
};

/** POST /vendors/users */
export async function createVendorUserRequest(
  payload: CreateVendorUserPayload,
) {
  const response = await api.post<CreateVendorUserApiResponse>(
    VENDOR_ENDPOINTS.users,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not create vendor user.",
      400,
      response,
    );
  }

  const user = response.data?.user;
  if (!user) {
    throw new ApiError(
      response.message ?? "Vendor user created but no user data returned.",
      200,
      response,
    );
  }

  return {
    message: response.message?.trim() || "Vendor user created successfully",
    user,
  };
}

export type UpdateVendorUserPayload = {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
  preferredLanguage?: string;
  isBlocked: boolean;
};

export type UpdateVendorUserApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    user?: VendorUserApiItem;
  };
};

/** PUT /admin/vendors/users/:userId (with PATCH fallback) */
export async function updateVendorUserRequest(
  userId: string,
  payload: UpdateVendorUserPayload,
) {
  try {
    const response = await api.put<UpdateVendorUserApiResponse>(
      `${VENDOR_ENDPOINTS.users}/${encodeURIComponent(userId)}`,
      payload,
    );

    if (response?.status === false) {
      throw new ApiError(
        response.message ?? "Could not update vendor user.",
        400,
        response,
      );
    }

    const user = response.data?.user;
    if (!user) {
      throw new ApiError(
        response.message ?? "Could not update vendor user.",
        400,
        response,
      );
    }

    return {
      message: response.message?.trim() || "Vendor user updated successfully",
      user,
    };
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      const response = await api.patch<UpdateVendorUserApiResponse>(
        `${VENDOR_ENDPOINTS.users}/${encodeURIComponent(userId)}`,
        payload,
      );

      if (response?.status === false) {
        throw new ApiError(
          response.message ?? "Could not update vendor user.",
          400,
          response,
        );
      }

      const user = response.data?.user;
      if (!user) {
        throw new ApiError(
          response.message ?? "Could not update vendor user.",
          400,
          response,
        );
      }

      return {
        message: response.message?.trim() || "Vendor user updated successfully",
        user,
      };
    }
    throw err;
  }
}

export type VendorDetailImageApiItem = {
  _id?: string;
  id?: string;
  key?: string;
  name?: string;
  title?: string;
  alt?: string;
  url?: string;
  cdnUrl?: string;
  src?: string;
  path?: string;
  value?: string;
  image?: string;
};

export type VendorDetailAreaApiItem = {
  _id?: string;
  id?: string;
  areaId?: string;
  fees?: number | string | null;
};

export type VendorDetailServiceMap<T> = {
  catering?: T;
  delivery?: T;
  setups?: T;
  hospitality?: T;
  feasts?: T;
};

export type VendorDetailApiItem = {
  _id?: string;
  id?: string;
  name?: { en?: string; ar?: string };
  tagline?: { en?: string; ar?: string };
  shortDescription?: { en?: string; ar?: string };
  contactInfo?: {
    primaryEmail?: string;
    secondaryEmail?: string;
    accountingEmails?: string[];
    mobile?: string;
    phone?: string;
  };
  vendorImages?: VendorDetailServiceMap<
    Array<VendorDetailImageApiItem | string> | null
  >;
  vendorimages?: VendorDetailServiceMap<
    Array<VendorDetailImageApiItem | string> | null
  >;
  images?: Array<VendorDetailImageApiItem | string> | null;
  logoImg?: Array<VendorDetailImageApiItem | string> | null;
  minimumNotice?: VendorDetailServiceMap<number | string | null>;
  capacity?: VendorDetailServiceMap<number | string | null>;
  serviceCategories?: string[];
  published?: boolean;
  doublePointReward?: boolean;
  percentage?: number | string | null;
  deliveryAreasAndCost?: VendorDetailServiceMap<VendorDetailAreaApiItem[] | null>;
  order?: number | null;
  isFullyBooked?: boolean;
  minimumOrderAmountCatering?: number | string | null;
  minimumOrderAmountDelivery?: number | string | null;
  minimumOrderTimeInHours?: number | string | null;
  collectionIds?: string[] | Array<{ _id?: string }> | null;
};

export type VendorDetailApiResponse = {
  status?: boolean;
  message?: string;
  data?: VendorDetailApiItem;
};

/** GET /admin/vendors/details?vendorId= */
export async function getVendorDetails(vendorId: string) {
  const params = new URLSearchParams({ vendorId });
  const payload = await api.get<VendorDetailApiResponse>(
    `${VENDOR_ENDPOINTS.details}?${params.toString()}`,
  );

  if (payload?.status === false || !payload.data) {
    throw new ApiError(
      payload?.message ?? "Could not load vendor details.",
      400,
      payload,
    );
  }

  return payload.data;
}

export type UpdateVendorImageUpload = {
  name: string;
  size: number;
  type: string;
  value: string;
};

export type UpdateVendorDeletedImage = {
  key: string;
};

export type UpdateVendorServiceImages = {
  deletedImages?: UpdateVendorDeletedImage[];
  newImages?: UpdateVendorImageUpload[];
};

export type UpdateVendorAreaCost = {
  areaId: string;
  fees: number;
};

export type UpdateVendorServiceMap<T> = {
  catering: T;
  delivery: T;
  setups: T;
  hospitality: T;
  feasts: T;
};

export type UpdateVendorContactInfo = {
  primaryEmail: string;
  secondaryEmail: string;
  accountingEmails: string[];
  mobile: string;
  phone: string;
};

export type UpdateVendorPayload = {
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  published: boolean;
  percentage: number;
  order: number;
  isFullyBooked: boolean;
  doublePointReward: boolean;
  serviceCategories: string[];
  deliveryAreasAndCost: UpdateVendorServiceMap<UpdateVendorAreaCost[]>;
  minimumNotice: UpdateVendorServiceMap<number | null>;
  capacity: UpdateVendorServiceMap<number | null>;
  minimumOrderAmountCatering: number;
  minimumOrderAmountDelivery: number;
  minimumOrderTimeInHours: number;
  contactInfo: UpdateVendorContactInfo;
  collectionIds: string[];
  vendorimages: Partial<Record<string, UpdateVendorServiceImages>>;
  logoImg?: {
    deletedImages?: UpdateVendorDeletedImage[];
    newImages?: UpdateVendorImageUpload[];
  };
};

export type UpdateVendorApiResponse = {
  status?: boolean;
  message?: string;
  data?: unknown;
};

/** PUT /vendors/:id */
export async function updateVendor(id: string, payload: UpdateVendorPayload) {
  const response = await api.put<UpdateVendorApiResponse>(
    `${VENDOR_ENDPOINTS.list}/${encodeURIComponent(id)}`,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not update vendor.",
      400,
      response,
    );
  }

  return {
    id,
    message: response.message?.trim() || "Vendor updated successfully",
    data: response.data,
  };
}

export type DeleteVendorApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    _id?: string;
    id?: string;
    deleted?: boolean;
  };
};

/** DELETE /vendors/:id */
export async function deleteVendor(id: string) {
  const response = await api.delete<DeleteVendorApiResponse>(
    `${VENDOR_ENDPOINTS.list}/${encodeURIComponent(id)}`,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not delete vendor.",
      400,
      response,
    );
  }

  return {
    id: response.data?._id ?? response.data?.id ?? id,
    message: response.message?.trim() || "Vendor deleted successfully",
    data: response.data,
  };
}

export type VendorPolicyApiItem = {
  _id?: string;
  policy?: {
    en?: string;
    ar?: string;
  };
};

export type VendorPolicyApiResponse = {
  status?: boolean;
  message?: string;
  result?: VendorPolicyApiItem;
  data?: VendorPolicyApiItem | { result?: VendorPolicyApiItem };
};

function vendorPolicyFromPayload(payload: VendorPolicyApiResponse) {
  if (payload.result?.policy) return payload.result;

  const data = payload.data;
  if (!data) return null;
  if ("policy" in data && data.policy) return data;
  if ("result" in data && data.result?.policy) return data.result;
  return null;
}

/** GET /admin/vendors/policy */
export async function getVendorPolicy() {
  const payload = await api.get<VendorPolicyApiResponse>(VENDOR_ENDPOINTS.policy);

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor policy.",
      400,
      payload,
    );
  }

  const policy = vendorPolicyFromPayload(payload);
  if (!policy) {
    throw new ApiError(
      payload?.message ?? "Could not load vendor policy.",
      400,
      payload,
    );
  }

  return policy;
}

export async function getVendors(query: VendorListQueryParams) {
  return getVendorList(VENDOR_ENDPOINTS.list, query, "Could not load vendors.");
}

/** GET /admin/vendors/draft — page & limit always; other filters only when set. */
export async function getDraftVendors(
  query: Omit<VendorListQueryParams, "status">,
) {
  return getVendorList(
    VENDOR_ENDPOINTS.draft,
    query,
    "Could not load draft vendors.",
  );
}

async function getVendorList(
  path: string,
  query: VendorListQueryParams,
  failureMessage: string,
) {
  const payload = await api.get<VendorListApiResponse>(
    `${path}?${toVendorListSearch(query)}`,
  );

  if (payload?.status === false) {
    throw new ApiError(payload.message ?? failureMessage, 400, payload);
  }

  const vendors = payload.data?.vendors ?? [];
  return {
    vendors,
    total: toCount(payload.data?.total_records, vendors.length),
  };
}

export type VendorRegistrationApiContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type VendorRegistrationApiItem = {
  _id?: string;
  id?: string;
  businessName?: string;
  category?: string;
  licensed?: string;
  instagram?: string;
  contact?: VendorRegistrationApiContact;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type VendorRegistrationsApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    paging?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
    result?: VendorRegistrationApiItem[];
  };
};

export type VendorRegistrationListQueryParams = {
  page: number;
  limit: number;
};

function toVendorRegistrationSearch(query: VendorRegistrationListQueryParams) {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, query.page)));
  params.set("limit", String(Math.max(1, query.limit)));
  return params.toString();
}

/** GET /admin/vendors/registrations */
export async function getVendorRegistrations(
  query: VendorRegistrationListQueryParams,
) {
  const payload = await api.get<VendorRegistrationsApiResponse>(
    `${VENDOR_ENDPOINTS.registrations}?${toVendorRegistrationSearch(query)}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor registrations.",
      400,
      payload,
    );
  }

  const result = payload.data?.result ?? [];
  return {
    result,
    paging: {
      page: toCount(payload.data?.paging?.page, query.page),
      limit: toCount(payload.data?.paging?.limit, query.limit),
      total: toCount(payload.data?.paging?.total, result.length),
      totalPages: toCount(payload.data?.paging?.totalPages, 1),
    },
  };
}

export type VendorFilterSubTypeApiItem = {
  _id?: string;
  id?: string;
  name?: {
    en?: string;
    ar?: string;
  };
};

export type VendorFilterApiItem = {
  _id?: string;
  id?: string;
  name?: {
    en?: string;
    ar?: string;
  };
  subTypes?: VendorFilterSubTypeApiItem[] | null;
};

export type VendorFiltersApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    filter?: VendorFilterApiItem[];
  };
};

/** GET /admin/vendors/filters */
export async function getVendorFiltersCatalog() {
  const payload = await api.get<VendorFiltersApiResponse>(
    VENDOR_ENDPOINTS.filters,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor filters.",
      400,
      payload,
    );
  }

  return payload.data?.filter ?? [];
}

export type VendorReviewUserApiItem = {
  _id?: string;
  id?: string;
  name?: string;
};

export type VendorReviewApiItem = {
  _id?: string;
  id?: string;
  reviewText?: string | null;
  serviceScore?: number | string | null;
  qualityScore?: number | string | null;
  respectOfTimeScore?: number | string | null;
  presentationScore?: number | string | null;
  deliveryScore?: number | string | null;
  _order?: string;
  _vendor?: string;
  userId?: VendorReviewUserApiItem | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorReviewsApiResponse = {
  status?: boolean;
  message?: string;
  data?: {
    reviews?: VendorReviewApiItem[];
    vendor?: {
      _id?: string;
      id?: string;
      name?: {
        en?: string;
        ar?: string;
      };
    };
  };
};

/** GET /admin/vendors/reviews?vendorId= */
export async function getVendorReviews(vendorId: string) {
  const params = new URLSearchParams({ vendorId });
  const payload = await api.get<VendorReviewsApiResponse>(
    `${VENDOR_ENDPOINTS.reviews}?${params.toString()}`,
  );

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load vendor reviews.",
      400,
      payload,
    );
  }

  return {
    reviews: payload.data?.reviews ?? [],
    vendor: payload.data?.vendor ?? null,
  };
}
