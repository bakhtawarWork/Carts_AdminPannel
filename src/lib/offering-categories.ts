import { createOfferingCategoryApi, getOfferingCategories } from "@/services/offerings";
import type {
  OfferingCategoriesQuery,
  OfferingCategoriesResponse,
  OfferingCategoryRecord,
} from "@/lib/types";

function mapCategory(item: {
  id?: string;
  _id?: string;
  name?: string;
  approveStatus?: string;
  nameObj?: { en?: string; ar?: string };
}): OfferingCategoryRecord | null {
  const id = item.id ?? item._id ?? "";
  if (!id) return null;

  return {
    id,
    englishName: item.nameObj?.en?.trim() || item.name?.trim() || "",
    arabicName: item.nameObj?.ar?.trim() || "",
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

export async function updateOfferingCategory(
  id: string,
  input: { englishName: string; arabicName: string },
) {
  await ensureCategoriesLoaded();
  const index = offeringCategoriesState.findIndex((item) => item.id === id);
  if (index === -1) return null;

  offeringCategoriesState[index] = {
    ...offeringCategoriesState[index],
    englishName: input.englishName.trim(),
    arabicName: input.arabicName.trim(),
  };
  return { ...offeringCategoriesState[index] };
}

export async function deleteOfferingCategory(id: string) {
  await ensureCategoriesLoaded();
  const next = offeringCategoriesState.filter((item) => item.id !== id);
  if (next.length === offeringCategoriesState.length) return false;
  offeringCategoriesState = next;
  return true;
}
