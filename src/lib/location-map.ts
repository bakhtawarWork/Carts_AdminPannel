export type MapLatLng = {
  lat: number;
  lng: number;
};

export type LocationMapSubarea = {
  id: string;
  locationId: string;
  nameEn: string;
  nameAr: string;
  path: MapLatLng[];
};

export type LocationMapGroup = {
  id: string;
  nameEn: string;
  nameAr: string;
  subareas: LocationMapSubarea[];
};

export type CreateLocationPayload = {
  locationId: string;
  nameEn: string;
  nameAr: string;
};

const QATAR_CENTER: MapLatLng = { lat: 25.3548, lng: 51.1839 };

export const LOCATION_MAP_DEFAULT_CENTER = QATAR_CENTER;
export const LOCATION_MAP_DEFAULT_ZOOM = 8;

function clonePath(path: MapLatLng[]): MapLatLng[] {
  return path.map((point) => ({ lat: point.lat, lng: point.lng }));
}

export function cloneLocationMapGroups(
  groups: LocationMapGroup[],
): LocationMapGroup[] {
  return groups.map((group) => ({
    ...group,
    subareas: group.subareas.map((subarea) => ({
      ...subarea,
      path: clonePath(subarea.path),
    })),
  }));
}

export function formatLocationPair(nameEn: string, nameAr: string) {
  const english = nameEn.trim();
  const arabic = nameAr.trim();
  if (english && arabic) return `${english} / ${arabic}`;
  return english || arabic;
}

export function formatSubareaOption(subarea: LocationMapSubarea) {
  return formatLocationPair(subarea.nameEn, subarea.nameAr) || subarea.id;
}

export function flattenSubareas(groups: LocationMapGroup[]) {
  return groups.flatMap((group) => group.subareas);
}

export function findSubarea(groups: LocationMapGroup[], subareaId: string) {
  for (const group of groups) {
    const match = group.subareas.find((item) => item.id === subareaId);
    if (match) return match;
  }
  return undefined;
}

export function findLocationGroup(groups: LocationMapGroup[], locationId: string) {
  return groups.find((group) => group.id === locationId);
}

/** Convert GeoJSON Polygon coordinates (`[lng, lat]`) when the API is wired. */
export function pathFromGeoJsonPolygon(coordinates: number[][][]): MapLatLng[] {
  const ring = coordinates[0] ?? [];
  return ring.flatMap(([lng, lat]) =>
    typeof lat === "number" && typeof lng === "number" ? [{ lat, lng }] : [],
  );
}

export function defaultPolygonAround(center: MapLatLng, size = 0.018): MapLatLng[] {
  return [
    { lat: center.lat + size, lng: center.lng - size * 1.2 },
    { lat: center.lat + size * 0.7, lng: center.lng + size },
    { lat: center.lat - size, lng: center.lng + size * 0.9 },
    { lat: center.lat - size * 0.8, lng: center.lng - size },
  ];
}

export function centroidOfPath(path: MapLatLng[]): MapLatLng {
  if (path.length === 0) return QATAR_CENTER;
  const total = path.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: total.lat / path.length, lng: total.lng / path.length };
}

let nextId = 1;

function dummyId(prefix: string) {
  nextId += 1;
  return `${prefix}_${nextId}`;
}

/**
 * Dummy locations around Qatar. Replaces GET /admin/locations geometry later.
 * Existing vendor delivery-area helpers in `src/lib/locations.ts` are unchanged.
 */
const DUMMY_LOCATION_GROUPS: LocationMapGroup[] = [
  {
    id: "loc_al_khor",
    nameEn: "Al Khor",
    nameAr: "الخور",
    subareas: [
      {
        id: "sub_madinat_al_kaaban",
        locationId: "loc_al_khor",
        nameEn: "Madinat Al Kaaban",
        nameAr: "مدينة الكعبان",
        path: [
          { lat: 25.812, lng: 51.402 },
          { lat: 25.818, lng: 51.438 },
          { lat: 25.801, lng: 51.472 },
          { lat: 25.778, lng: 51.461 },
          { lat: 25.764, lng: 51.428 },
          { lat: 25.772, lng: 51.398 },
          { lat: 25.792, lng: 51.392 },
        ],
      },
      {
        id: "sub_al_thakhira",
        locationId: "loc_al_khor",
        nameEn: "Al Thakhira",
        nameAr: "الذخيرة",
        path: [
          { lat: 25.758, lng: 51.528 },
          { lat: 25.762, lng: 51.548 },
          { lat: 25.754, lng: 51.568 },
          { lat: 25.742, lng: 51.574 },
          { lat: 25.728, lng: 51.562 },
          { lat: 25.722, lng: 51.538 },
          { lat: 25.732, lng: 51.522 },
          { lat: 25.746, lng: 51.518 },
        ],
      },
    ],
  },
  {
    id: "loc_doha",
    nameEn: "Doha",
    nameAr: "الدوحة",
    subareas: [
      {
        id: "sub_lusail",
        locationId: "loc_doha",
        nameEn: "Lusail",
        nameAr: "لوسيل",
        path: [
          { lat: 25.448, lng: 51.478 },
          { lat: 25.456, lng: 51.512 },
          { lat: 25.438, lng: 51.528 },
          { lat: 25.412, lng: 51.518 },
          { lat: 25.408, lng: 51.486 },
          { lat: 25.426, lng: 51.468 },
        ],
      },
      {
        id: "sub_west_bay",
        locationId: "loc_doha",
        nameEn: "West Bay",
        nameAr: "الخليج الغربي",
        path: [
          { lat: 25.342, lng: 51.512 },
          { lat: 25.348, lng: 51.538 },
          { lat: 25.334, lng: 51.548 },
          { lat: 25.316, lng: 51.542 },
          { lat: 25.312, lng: 51.518 },
          { lat: 25.324, lng: 51.508 },
        ],
      },
    ],
  },
];

export async function fetchLocationMapGroups(): Promise<LocationMapGroup[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  return cloneLocationMapGroups(DUMMY_LOCATION_GROUPS);
}

export function createLocationOrSubarea(
  groups: LocationMapGroup[],
  payload: CreateLocationPayload,
): LocationMapGroup[] {
  const nameEn = payload.nameEn.trim();
  const nameAr = payload.nameAr.trim();
  const next = cloneLocationMapGroups(groups);

  if (payload.locationId === "new") {
    const locationId = dummyId("loc");
    const center = QATAR_CENTER;
    next.push({
      id: locationId,
      nameEn,
      nameAr,
      subareas: [
        {
          id: dummyId("sub"),
          locationId,
          nameEn,
          nameAr,
          path: defaultPolygonAround(center, 0.04),
        },
      ],
    });
    return next;
  }

  const group = next.find((item) => item.id === payload.locationId);
  if (!group) return next;

  const nearby = group.subareas[0]?.path ?? [];
  const center = nearby.length ? centroidOfPath(nearby) : QATAR_CENTER;
  group.subareas.push({
    id: dummyId("sub"),
    locationId: group.id,
    nameEn,
    nameAr,
    path: defaultPolygonAround(
      { lat: center.lat - 0.03, lng: center.lng + 0.03 },
      0.016,
    ),
  });
  return next;
}

export function updateSubareaPath(
  groups: LocationMapGroup[],
  subareaId: string,
  path: MapLatLng[],
): LocationMapGroup[] {
  return cloneLocationMapGroups(groups).map((group) => ({
    ...group,
    subareas: group.subareas.map((subarea) =>
      subarea.id === subareaId ? { ...subarea, path: clonePath(path) } : subarea,
    ),
  }));
}

export function validateCreateLocation(payload: CreateLocationPayload) {
  if (!payload.locationId) return "Select a location, or create a new one.";
  if (!payload.nameEn.trim()) return "English name is required.";
  if (!payload.nameAr.trim()) return "Arabic name is required.";
  return null;
}
