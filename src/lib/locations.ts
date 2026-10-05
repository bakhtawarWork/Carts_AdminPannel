import type { DeliveryAreaGroup, DeliveryAreaOption } from "@/lib/types";
import { getLocations, type LocationApiItem } from "@/services/locations";

function cleanName(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function formatPair(nameEn: string, nameAr: string) {
  if (nameEn && nameAr) return `${nameEn} - ${nameAr}`;
  return nameEn || nameAr;
}

export function formatDeliveryAreaGroupLabel(group: DeliveryAreaGroup) {
  const names = formatPair(group.nameEn, group.nameAr);
  return names ? `Area: ${names}` : "Area";
}

export function formatDeliverySubareaLabel(area: DeliveryAreaOption) {
  return formatPair(area.nameEn, area.nameAr) || area.id;
}

export function mapLocationsToAreaGroups(
  items: LocationApiItem[],
): DeliveryAreaGroup[] {
  return items.flatMap((location) => {
    const id = location._id ?? location.id ?? "";
    const nameEn = cleanName(location.name?.en);
    const nameAr = cleanName(location.name?.ar);
    if (!id) return [];

    const subareas = (location.subareas ?? []).flatMap((subarea) => {
      const subId = subarea._id ?? subarea.id ?? "";
      if (!subId) return [];

      return [
        {
          id: subId,
          nameEn: cleanName(subarea.name?.en),
          nameAr: cleanName(subarea.name?.ar),
          zoneEn: nameEn,
          zoneAr: nameAr,
        } satisfies DeliveryAreaOption,
      ];
    });

    if (subareas.length === 0) return [];

    return [{ id, nameEn, nameAr, subareas }];
  });
}

export function findDeliverySubarea(
  groups: DeliveryAreaGroup[],
  areaId: string,
) {
  for (const group of groups) {
    const match = group.subareas.find((item) => item.id === areaId);
    if (match) return match;
  }
  return undefined;
}

let cachedGroups: DeliveryAreaGroup[] | null = null;
let pending: Promise<DeliveryAreaGroup[]> | null = null;

/** GET /admin/locations — cached after first successful load. */
export async function fetchDeliveryAreaGroups() {
  if (cachedGroups) return cachedGroups;

  if (!pending) {
    pending = getLocations()
      .then((items) => {
        cachedGroups = mapLocationsToAreaGroups(items);
        return cachedGroups;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}
