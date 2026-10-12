import { FILTER_CATALOG } from "@/lib/vendor-filters-data";
import { api } from "@/services/api";
import type {
  BilingualLabel,
  FilterCategory,
  FilterSubType,
  FilterTypeFormData,
} from "@/lib/types";

export type BackendFilterResponse = {
  filter: Array<{
    _id: string;
    name: BilingualLabel;
    subTypes: Array<{
      _id: string;
      name: BilingualLabel;
    }>;
  }>;
};

function cloneCategory(category: FilterCategory): FilterCategory {
  return {
    ...category,
    name: { ...category.name },
    subTypes: category.subTypes.map((subType) => ({
      ...subType,
      name: { ...subType.name },
    })),
  };
}

function deepCloneCatalog(catalog: FilterCategory[]) {
  return catalog.map(cloneCategory);
}

let filterTypesStore: FilterCategory[] = deepCloneCatalog(FILTER_CATALOG);

function delay(ms = 240) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mapBackendFilterResponse(
  response: BackendFilterResponse,
): FilterCategory[] {
  return response.filter.map((category) => ({
    id: category._id,
    name: {
      en: category.name.en.trim(),
      ar: category.name.ar.trim(),
    },
    subTypes: category.subTypes.map((subType) => ({
      id: subType._id,
      name: {
        en: subType.name.en.trim(),
        ar: subType.name.ar.trim(),
      },
    })),
  }));
}

/** Shared catalog used by vendor filter assignment screens. */
export function getFilterCatalog(): FilterCategory[] {
  return filterTypesStore.map(cloneCategory);
}

export function formatBilingualLabel(label: BilingualLabel) {
  return `${label.en.trim()} / ${label.ar.trim()}`;
}

export function createEmptyFilterTypeForm(): FilterTypeFormData {
  return {
    nameEn: "",
    nameAr: "",
    subTypes: [{ nameEn: "", nameAr: "" }],
  };
}

export function filterTypeToFormData(category: FilterCategory): FilterTypeFormData {
  return {
    id: category.id,
    nameEn: category.name.en,
    nameAr: category.name.ar,
    subTypes: category.subTypes.map((subType) => ({
      id: subType.id,
      nameEn: subType.name.en,
      nameAr: subType.name.ar,
    })),
  };
}

export function validateFilterTypeForm(form: FilterTypeFormData) {
  if (!form.nameEn.trim()) return "English name is required.";
  if (!form.nameAr.trim()) return "Arabic name is required.";
  if (form.subTypes.length === 0) return "Add at least one sub type.";

  for (let index = 0; index < form.subTypes.length; index += 1) {
    const subType = form.subTypes[index];
    if (!subType.nameEn.trim()) {
      return `Sub type ${index + 1}: English name is required.`;
    }
    if (!subType.nameAr.trim()) {
      return `Sub type ${index + 1}: Arabic name is required.`;
    }
  }

  return null;
}

function formDataToCategory(form: FilterTypeFormData): FilterCategory {
  const categoryId = form.id ?? createId("filter");

  const subTypes: FilterSubType[] = form.subTypes.map((subType) => ({
    id: subType.id ?? createId("subtype"),
    name: {
      en: subType.nameEn.trim(),
      ar: subType.nameAr.trim(),
    },
  }));

  return {
    id: categoryId,
    name: {
      en: form.nameEn.trim(),
      ar: form.nameAr.trim(),
    },
    subTypes,
  };
}

export async function fetchFilterTypes(): Promise<FilterCategory[]> {
  try {
    const json = await api.get<any>("filter-type");
    const rawList =
      json?.data?.filter ||
      json?.filter ||
      (Array.isArray(json?.data) ? json.data : []) ||
      (Array.isArray(json) ? json : []);

    const mapped: FilterCategory[] = rawList.map((category: any) => ({
      id: category._id || category.id || "",
      name: {
        en: category.name?.en?.trim() || "",
        ar: category.name?.ar?.trim() || "",
      },
      subTypes: Array.isArray(category.subTypes)
        ? category.subTypes.map((st: any) => ({
            id: st._id || st.id || "",
            name: {
              en: st.name?.en?.trim() || "",
              ar: st.name?.ar?.trim() || "",
            },
          }))
        : [],
    }));

    if (mapped.length > 0) {
      filterTypesStore = deepCloneCatalog(mapped);
    }
    return mapped;
  } catch {
    await delay();
    return getFilterCatalog();
  }
}

export async function fetchFilterTypeById(
  id: string,
): Promise<FilterCategory | null> {
  try {
    const json = await api.get<any>(`filter-type/${id}`);
    const filter = json?.data?.filter || json?.filter;
    if (filter) {
      return {
        id: filter._id || filter.id || id,
        name: {
          en: filter.name?.en?.trim() || "",
          ar: filter.name?.ar?.trim() || "",
        },
        subTypes: Array.isArray(filter.subTypes)
          ? filter.subTypes.map((st: any) => ({
              id: st._id || st.id || "",
              name: {
                en: st.name?.en?.trim() || "",
                ar: st.name?.ar?.trim() || "",
              },
            }))
          : [],
      };
    }
  } catch {
    // Fallback to local store
  }
  const category = filterTypesStore.find((entry) => entry.id === id);
  return category ? cloneCategory(category) : null;
}

export async function fetchFilterTypeForm(
  id: string,
): Promise<FilterTypeFormData | null> {
  const category = await fetchFilterTypeById(id);
  return category ? filterTypeToFormData(category) : null;
}

export async function saveFilterTypeForm(
  form: FilterTypeFormData,
): Promise<FilterCategory> {
  const payload = {
    name: {
      en: form.nameEn.trim(),
      ar: form.nameAr.trim(),
    },
    subTypes: form.subTypes
      .filter((st) => st.nameEn.trim() || st.nameAr.trim())
      .map((st) => ({
        name: {
          en: st.nameEn.trim(),
          ar: st.nameAr.trim(),
        },
      })),
  };

  if (form.id) {
    const json = await api.patch<any>(`filter-type/${form.id}`, payload);
    const updated = json?.data?.filter || json?.filter;
    if (updated) {
      const category: FilterCategory = {
        id: updated._id || form.id,
        name: {
          en: updated.name?.en?.trim() || form.nameEn.trim(),
          ar: updated.name?.ar?.trim() || form.nameAr.trim(),
        },
        subTypes: Array.isArray(updated.subTypes)
          ? updated.subTypes.map((st: any) => ({
              id: st._id || "",
              name: {
                en: st.name?.en?.trim() || "",
                ar: st.name?.ar?.trim() || "",
              },
            }))
          : [],
      };
      return category;
    }
  } else {
    const json = await api.post<any>("filter-type/create", payload);
    const created = json?.data?.filter || json?.filter;
    if (created) {
      const category: FilterCategory = {
        id: created._id || "",
        name: {
          en: created.name?.en?.trim() || form.nameEn.trim(),
          ar: created.name?.ar?.trim() || form.nameAr.trim(),
        },
        subTypes: Array.isArray(created.subTypes)
          ? created.subTypes.map((st: any) => ({
              id: st._id || "",
              name: {
                en: st.name?.en?.trim() || "",
                ar: st.name?.ar?.trim() || "",
              },
            }))
          : [],
      };
      return category;
    }
  }

  const category = formDataToCategory(form);
  return cloneCategory(category);
}

export async function deleteFilterType(id: string): Promise<boolean> {
  try {
    await api.delete(`filter-type/${id}`);
    return true;
  } catch {
    const before = filterTypesStore.length;
    filterTypesStore = filterTypesStore.filter((entry) => entry.id !== id);
    return filterTypesStore.length < before;
  }
}

/** Replace local store when API data is loaded. */
export function replaceFilterTypesCatalog(categories: FilterCategory[]) {
  filterTypesStore = deepCloneCatalog(categories);
}
