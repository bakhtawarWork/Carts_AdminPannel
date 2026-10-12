import { ApiError, api } from "@/services/api";
import { LOCATION_ENDPOINTS } from "@/services/endpoints";

export type LocationName = {
  en?: string;
  ar?: string;
};

export type LocationGeometry = {
  type?: string;
  coordinates?: number[][][] | number[][][][] | unknown;
};

export type LocationSubareaApiItem = {
  _id?: string;
  id?: string;
  name?: LocationName;
  createdAt?: string;
  updatedAt?: string;
  geometry?: LocationGeometry;
};

export type LocationApiItem = {
  _id?: string;
  id?: string;
  name?: LocationName;
  subareas?: LocationSubareaApiItem[];
};

export type LocationsApiResponse = {
  status?: boolean;
  message?: string;
  data?:
    | {
        locations?: LocationApiItem[];
      }
    | LocationApiItem[];
};

/** GET /admin/locations */
export async function getLocations(): Promise<LocationApiItem[]> {
  const payload = await api.get<LocationsApiResponse>(LOCATION_ENDPOINTS.list);

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load locations.",
      400,
      payload,
    );
  }

  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (payload?.data && Array.isArray(payload.data.locations)) {
    return payload.data.locations;
  }

  return [];
}

export type CreateLocationPayload = {
  name: {
    en: string;
    ar: string;
  };
};

export type CreateLocationApiResponse = {
  status?: boolean;
  message?: string;
  data?:
    | {
        result?: LocationApiItem;
        location?: LocationApiItem;
      }
    | LocationApiItem;
};

/** POST /admin/locations/createlocation */
export async function createLocationApi(
  payload: CreateLocationPayload,
): Promise<LocationApiItem> {
  const response = await api.post<CreateLocationApiResponse>(
    LOCATION_ENDPOINTS.createLocation,
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not create location.",
      400,
      response,
    );
  }

  const data = response?.data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.result && typeof obj.result === "object") {
      return obj.result as LocationApiItem;
    }
    if (obj.location && typeof obj.location === "object") {
      return obj.location as LocationApiItem;
    }
    return obj as unknown as LocationApiItem;
  }

  return response as unknown as LocationApiItem;
}

export type CreateSubareaPayload = {
  name: {
    en: string;
    ar: string;
  };
};

export type CreateSubareaApiResponse = {
  status?: boolean;
  message?: string;
  data?: unknown;
};

/** POST /admin/locations/:locationId/subareas */
export async function createSubareaApi(
  locationId: string,
  payload: CreateSubareaPayload,
): Promise<unknown> {
  const response = await api.post<CreateSubareaApiResponse>(
    LOCATION_ENDPOINTS.createSubarea(locationId),
    payload,
  );

  if (response?.status === false) {
    throw new ApiError(
      response.message ?? "Could not create subarea.",
      400,
      response,
    );
  }

  return response?.data ?? response;
}
