import type {
  SearchCategorySectionFormData,
  SearchCategorySectionRecord,
  SearchCategorySectionsQuery,
  SearchCategorySectionsResponse,
  SearchCategoryVendorOption,
} from "@/lib/types";
import {
  createSearchCategorySection,
  deleteSearchCategorySectionApi,
  getSearchCategorySectionById,
  getSearchCategorySections,
  updateSearchCategorySection,
  type SearchCategorySectionApiItem,
} from "@/services/search-categories";

export const SEARCH_CATEGORY_VENDOR_OPTIONS: SearchCategoryVendorOption[] = [];

function createCategoryId() {
  return `sc-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`;
}

export function createEmptySearchCategorySectionForm(): SearchCategorySectionFormData {
  return {
    englishName: "",
    arabicName: "",
    published: true,
    categories: [createEmptySearchCategoryItem()],
  };
}

export function createEmptySearchCategoryItem(): SearchCategorySectionFormData["categories"][number] {
  return {
    id: createCategoryId(),
    englishName: "",
    arabicName: "",
    published: true,
    imageUrl: "",
    vendorIds: [],
  };
}

export function formatSearchCategoryVendorLabel(
  vendor: SearchCategoryVendorOption,
) {
  return `${vendor.englishName} / ${vendor.arabicName}`;
}

export async function fetchSearchCategorySections(
  query: SearchCategorySectionsQuery,
): Promise<SearchCategorySectionsResponse> {
  const data = await getSearchCategorySections({
    page: query.page,
    limit: query.pageSize,
    search: query.search,
    published: query.published,
  });

  const rawSections: SearchCategorySectionApiItem[] =
    data?.sections ?? (Array.isArray(data) ? (data as SearchCategorySectionApiItem[]) : []);

  const items: SearchCategorySectionRecord[] = rawSections.map((sec) => {
    let categoryCount = 0;
    if (typeof sec.categories === "number") {
      categoryCount = sec.categories;
    } else if (Array.isArray(sec.categories)) {
      categoryCount = sec.categories.length;
    } else if (Array.isArray(sec.searchCategories)) {
      categoryCount = sec.searchCategories.length;
    }

    return {
      id: sec._id,
      published: Boolean(sec.published),
      englishName: sec.englishName ?? sec.name?.en ?? "",
      arabicName: sec.arabicName ?? sec.name?.ar ?? "",
      categoryCount,
    };
  });

  return {
    items,
    total: data?.totalRecords ?? data?.total ?? items.length,
    page: data?.currentPage ?? data?.page ?? query.page,
    pageSize: data?.limit ?? query.pageSize,
  };
}

export async function fetchSearchCategorySectionForm(
  id: string,
): Promise<SearchCategorySectionFormData | null> {
  const section = await getSearchCategorySectionById(id);
  if (!section) return null;

  const rawCategories =
    (Array.isArray(section.categories) ? section.categories : null) ??
    (Array.isArray(section.searchCategories) ? section.searchCategories : null) ??
    [];

  const categories: SearchCategorySectionFormData["categories"] =
    rawCategories.map((cat) => {
      const vendorIds = Array.isArray(cat.vendors)
        ? cat.vendors.map((v) =>
            typeof v === "string" ? v : v._id || (v as { id?: string }).id || "",
          )
        : [];

      const firstImage = cat.images?.[0];
      const imageUrl = firstImage?.cdnUrl || firstImage?.url || "";

      return {
        id: cat._id || createCategoryId(),
        englishName: cat.englishName ?? cat.name?.en ?? "",
        arabicName: cat.arabicName ?? cat.name?.ar ?? "",
        published: cat.published ?? true,
        imageUrl,
        vendorIds,
        images: cat.images ?? [],
      };
    });

  return {
    id: section._id,
    englishName: section.englishName ?? section.name?.en ?? "",
    arabicName: section.arabicName ?? section.name?.ar ?? "",
    published: Boolean(section.published),
    categories:
      categories.length > 0 ? categories : [createEmptySearchCategoryItem()],
  };
}

export async function saveSearchCategorySectionForm(
  data: SearchCategorySectionFormData,
): Promise<SearchCategorySectionRecord> {
  const filledCategories = data.categories.filter(
    (category) =>
      category.englishName.trim().length > 0 ||
      category.arabicName.trim().length > 0,
  );

  const categoriesPayload = filledCategories.map((category) => {
    const item: Record<string, unknown> = {
      englishName: category.englishName.trim(),
      arabicName: category.arabicName.trim(),
      published: category.published,
      vendors: category.vendorIds,
    };
    if (category.id && !category.id.startsWith("sc-")) {
      item._id = category.id;
    }
    if (category.images && category.images.length > 0) {
      item.images = category.images;
    }
    return item;
  });

  const hasFiles = filledCategories.some((cat) => cat.file instanceof File);

  let resultSection: SearchCategorySectionApiItem;

  if (hasFiles) {
    const formData = new FormData();
    formData.append("englishName", data.englishName.trim());
    if (data.arabicName.trim()) {
      formData.append("arabicName", data.arabicName.trim());
    }
    formData.append("published", String(data.published));
    formData.append("categories", JSON.stringify(categoriesPayload));

    for (const cat of filledCategories) {
      if (cat.file instanceof File) {
        formData.append("files", cat.file);
      }
    }

    if (data.id) {
      resultSection = await updateSearchCategorySection(data.id, formData);
    } else {
      resultSection = await createSearchCategorySection(formData);
    }
  } else {
    const jsonPayload = {
      englishName: data.englishName.trim(),
      arabicName: data.arabicName.trim() || undefined,
      published: data.published,
      categories: categoriesPayload,
    };

    if (data.id) {
      resultSection = await updateSearchCategorySection(data.id, jsonPayload);
    } else {
      resultSection = await createSearchCategorySection(jsonPayload);
    }
  }

  const rawCategories =
    resultSection.categories ?? resultSection.searchCategories;
  let categoryCount = 0;
  if (typeof rawCategories === "number") {
    categoryCount = rawCategories;
  } else if (Array.isArray(rawCategories)) {
    categoryCount = rawCategories.length;
  } else {
    categoryCount = categoriesPayload.length;
  }

  return {
    id: resultSection._id,
    published: Boolean(resultSection.published),
    englishName:
      resultSection.englishName ??
      resultSection.name?.en ??
      data.englishName.trim(),
    arabicName:
      resultSection.arabicName ??
      resultSection.name?.ar ??
      data.arabicName.trim(),
    categoryCount,
  };
}

export function validateSearchCategorySectionForm(
  data: SearchCategorySectionFormData,
): string | null {
  if (!data.englishName.trim()) {
    return "English name is required for the section.";
  }

  const filledCategories = data.categories.filter(
    (category) =>
      category.englishName.trim().length > 0 ||
      category.arabicName.trim().length > 0,
  );

  if (filledCategories.length === 0) {
    return "At least one category is required.";
  }

  for (const category of filledCategories) {
    if (!category.englishName.trim()) {
      return "Each category must have an English name.";
    }
  }

  return null;
}

export async function setSearchCategorySectionPublished(
  id: string,
  published: boolean,
): Promise<SearchCategorySectionRecord | null> {
  const result = await updateSearchCategorySection(id, { published });
  if (!result) return null;

  return {
    id: result._id,
    published: Boolean(result.published),
    englishName: result.englishName ?? result.name?.en ?? "",
    arabicName: result.arabicName ?? result.name?.ar ?? "",
    categoryCount:
      typeof result.categories === "number"
        ? result.categories
        : Array.isArray(result.categories)
          ? result.categories.length
          : Array.isArray(result.searchCategories)
            ? result.searchCategories.length
            : 0,
  };
}

export async function deleteSearchCategorySection(id: string): Promise<boolean> {
  await deleteSearchCategorySectionApi(id);
  return true;
}
