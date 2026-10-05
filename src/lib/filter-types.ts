import { FILTER_CATALOG } from "@/lib/vendor-filters-data";
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

/** Swap for: `const res = await fetch("/api/filter-types"); return mapBackendFilterResponse(await res.json());` */
export async function fetchFilterTypes(): Promise<FilterCategory[]> {
  await delay();
  return getFilterCatalog();
}

export async function fetchFilterTypeById(
  id: string,
): Promise<FilterCategory | null> {
  await delay();
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
  await delay(280);

  const category = formDataToCategory(form);
  const existingIndex = filterTypesStore.findIndex(
    (entry) => entry.id === category.id,
  );

  if (existingIndex === -1) {
    filterTypesStore = [...filterTypesStore, category];
  } else {
    filterTypesStore = filterTypesStore.map((entry, index) =>
      index === existingIndex ? category : entry,
    );
  }

  return cloneCategory(category);
}

export async function deleteFilterType(id: string): Promise<boolean> {
  await delay(200);
  const before = filterTypesStore.length;
  filterTypesStore = filterTypesStore.filter((entry) => entry.id !== id);
  return filterTypesStore.length < before;
}

/** Replace local store when API data is loaded. */
export function replaceFilterTypesCatalog(categories: FilterCategory[]) {
  filterTypesStore = deepCloneCatalog(categories);
}
