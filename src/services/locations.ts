import { ApiError, api } from "@/services/api";
import { LOCATION_ENDPOINTS } from "@/services/endpoints";

type LocationName = {
  en?: string;
  ar?: string;
};

export type LocationSubareaApiItem = {
  _id?: string;
  id?: string;
  name?: LocationName;
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
  data?: {
    locations?: LocationApiItem[];
  };
};

/** GET /admin/locations — area names and subareas only; geometry is ignored. */
export async function getLocations() {
  const payload = await api.get<LocationsApiResponse>(LOCATION_ENDPOINTS.list);

  if (payload?.status === false) {
    throw new ApiError(
      payload.message ?? "Could not load locations.",
      400,
      payload,
    );
  }

  return payload.data?.locations ?? [];
}
