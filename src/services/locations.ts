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
