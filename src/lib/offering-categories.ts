import {
  createOfferingCategoryApi,
  deleteOfferingCategoryApi,
  getOfferingCategories,
  updateOfferingCategoryApi,
  type OfferingCategoryApiItem,
} from "@/services/offerings";
import type {
  OfferingCategoriesQuery,
  OfferingCategoriesResponse,
  OfferingCategoryRecord,
} from "@/lib/types";

function cleanName(value?: string) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function namesFromApiItem(item: OfferingCategoryApiItem) {
  if (item.nameObj) {
    return {
      en: cleanName(item.nameObj.en),
      ar: cleanName(item.nameObj.ar),
    };
  }

  if (item.name && typeof item.name === "object") {
    return {
      en: cleanName(item.name.en),
      ar: cleanName(item.name.ar),
    };
  }

  const plain = typeof item.name === "string" ? cleanName(item.name) : "";
  return { en: plain, ar: "" };
}

function mapCategory(item: OfferingCategoryApiItem): OfferingCategoryRecord | null {
  const id = item.id ?? item._id ?? "";
  if (!id) return null;

  const { en, ar } = namesFromApiItem(item);

  return {
    id,
    englishName: en || id,
    arabicName: ar,
    approveStatus: item.approveStatus?.trim() || null,
  };
}

let offeringCategoriesState: OfferingCategoryRecord[] = [];
let loadedFromApi = false;

async function loadCategoriesFromApi() {
  const items = await getOfferingCategories();
  offeringCategoriesState = items
    .map(mapCategory)
    .filter((item): item is OfferingCategoryRecord => item !== null);
  loadedFromApi = true;
}

async function ensureCategoriesLoaded() {
  if (loadedFromApi) return;
  await loadCategoriesFromApi();
}

/** GET /admin/offerings/categories on first load, then paginate locally. */
export async function fetchOfferingCategories(
  query: OfferingCategoriesQuery,
  options?: { refresh?: boolean },
): Promise<OfferingCategoriesResponse> {
  if (options?.refresh) {
    await loadCategoriesFromApi();
  } else {
    await ensureCategoriesLoaded();
  }

  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(
    1,
    Math.ceil(offeringCategoriesState.length / pageSize) || 1,
  );
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: offeringCategoriesState
      .slice(start, start + pageSize)
      .map((item) => ({ ...item })),
    total: offeringCategoriesState.length,
    page,
    pageSize,
  };
}

/** GET /admin/offerings/categories — full list for dropdowns. */
export async function listOfferingCategories() {
  await ensureCategoriesLoaded();
  return offeringCategoriesState.map((item) => ({ ...item }));
}

export function getCachedOfferingCategory(id: string) {
  return offeringCategoriesState.find((item) => item.id === id) ?? null;
}

export function formatOfferingCategoryLabel(category: OfferingCategoryRecord) {
  if (category.englishName && category.arabicName) {
    return `${category.englishName} / ${category.arabicName}`;
  }
  return category.englishName || category.arabicName || category.id;
}

export async function createOfferingCategory(input: {
  englishName: string;
  arabicName: string;
}) {
  const created = await createOfferingCategoryApi({
    name: {
      en: input.englishName.trim(),
      ar: input.arabicName.trim(),
    },
  });

  return {
    id: created.id,
    message: created.message?.trim() || "Category created successfully",
  };
}

/** PATCH /admin/offering/category/updateOffering/:id */
export async function updateOfferingCategory(
  id: string,
  input: { englishName: string; arabicName: string },
) {
  const response = await updateOfferingCategoryApi(id, {
    name: {
      en: input.englishName.trim(),
      ar: input.arabicName.trim(),
    },
  });

  const updated = response.data ? mapCategory(response.data) : null;
  if (updated) {
    const index = offeringCategoriesState.findIndex((item) => item.id === id);
    if (index === -1) {
      offeringCategoriesState = [...offeringCategoriesState, updated];
    } else {
      offeringCategoriesState = offeringCategoriesState.map((item, itemIndex) =>
        itemIndex === index ? updated : item,
      );
    }
    return updated;
  }

  await loadCategoriesFromApi();
  return getCachedOfferingCategory(id);
}

/** DELETE /admin/offering/category/deleteOffering/:id */
export async function deleteOfferingCategory(id: string) {
  const { message } = await deleteOfferingCategoryApi(id);
  offeringCategoriesState = offeringCategoriesState.filter(
    (item) => item.id !== id,
  );
  return { deleted: true, message };
}
