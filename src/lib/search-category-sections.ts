import type {
  SearchCategorySectionFormData,
  SearchCategorySectionRecord,
  SearchCategorySectionsQuery,
  SearchCategorySectionsResponse,
  SearchCategoryVendorOption,
} from "@/lib/types";

export const SEARCH_CATEGORY_VENDOR_OPTIONS: SearchCategoryVendorOption[] = [
  {
    id: "v-f-planner",
    englishName: "The F Planner",
    arabicName: "ذا اف بلانر",
  },
  {
    id: "v-kovalenko",
    englishName: "Kovalenko vendor",
    arabicName: "Kovalenko vendor",
  },
  {
    id: "v-liwan",
    englishName: "Al Liwan",
    arabicName: "الليوان",
  },
  {
    id: "v-melenzane",
    englishName: "Melenzane",
    arabicName: "ملنزاني",
  },
  {
    id: "v-larc",
    englishName: "LARC",
    arabicName: "لارك",
  },
  {
    id: "v-sultan",
    englishName: "Al Sultan",
    arabicName: "السلطان",
  },
  {
    id: "v-exit55",
    englishName: "Exit 55",
    arabicName: "اكزت ٥٥",
  },
];

type SearchCategorySectionDetail = SearchCategorySectionRecord & {
  categories: SearchCategorySectionFormData["categories"];
};

let sectionsState: SearchCategorySectionDetail[] = [
  {
    id: "scs-1",
    published: true,
    englishName: "Top Categories",
    arabicName: "افضل الاصناف",
    categoryCount: 2,
    categories: [
      {
        id: "sc-1",
        englishName: "Birthday",
        arabicName: "عيد ميلاد",
        published: true,
        imageUrl:
          "https://images.unsplash.com/photo-1464349095439-e9a21285bc5c?w=200&h=200&fit=crop",
        vendorIds: ["v-f-planner", "v-liwan"],
      },
      {
        id: "sc-2",
        englishName: "Wedding",
        arabicName: "زفاف",
        published: true,
        imageUrl:
          "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop",
        vendorIds: ["v-kovalenko"],
      },
    ],
  },
  {
    id: "scs-2",
    published: true,
    englishName: "Other",
    arabicName: "أخرى",
    categoryCount: 0,
    categories: [],
  },
  {
    id: "scs-3",
    published: true,
    englishName: "Cinema & Snacks",
    arabicName: "سينما وسناكات",
    categoryCount: 1,
    categories: [
      {
        id: "sc-4",
        englishName: "Popcorn",
        arabicName: "فشار",
        published: true,
        imageUrl:
          "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=200&h=200&fit=crop",
        vendorIds: ["v-melenzane", "v-exit55"],
      },
    ],
  },
];

function delay(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSectionId() {
  return `scs-${Date.now()}`;
}

function createCategoryId() {
  return `sc-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`;
}

function normalizeCategory(
  category: SearchCategorySectionFormData["categories"][number],
): SearchCategorySectionFormData["categories"][number] {
  return {
    ...category,
    vendorIds: category.vendorIds ?? [],
  };
}

function toListRecord(section: SearchCategorySectionDetail): SearchCategorySectionRecord {
  return {
    id: section.id,
    published: section.published,
    englishName: section.englishName,
    arabicName: section.arabicName,
    categoryCount: section.categories.length,
  };
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
  await delay();

  const start = (query.page - 1) * query.pageSize;
  const items = sectionsState.slice(start, start + query.pageSize).map(toListRecord);

  return {
    items,
    total: sectionsState.length,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function fetchSearchCategorySectionForm(
  id: string,
): Promise<SearchCategorySectionFormData | null> {
  await delay();

  const section = sectionsState.find((item) => item.id === id);
  if (!section) return null;

  return {
    id: section.id,
    englishName: section.englishName,
    arabicName: section.arabicName,
    published: section.published,
    categories:
      section.categories.length > 0
        ? section.categories.map(normalizeCategory)
        : [createEmptySearchCategoryItem()],
  };
}

export async function saveSearchCategorySectionForm(
  data: SearchCategorySectionFormData,
): Promise<SearchCategorySectionRecord> {
  await delay();

  const categories = data.categories
    .map((category) => ({
      ...normalizeCategory(category),
      englishName: category.englishName.trim(),
      arabicName: category.arabicName.trim(),
    }))
    .filter(
      (category) => category.englishName.length > 0 || category.arabicName.length > 0,
    );

  const payload: SearchCategorySectionDetail = {
    id: data.id ?? createSectionId(),
    published: data.published,
    englishName: data.englishName.trim(),
    arabicName: data.arabicName.trim(),
    categoryCount: categories.length,
    categories,
  };

  if (data.id) {
    sectionsState = sectionsState.map((section) =>
      section.id === data.id ? payload : section,
    );
  } else {
    sectionsState = [payload, ...sectionsState];
  }

  return toListRecord(payload);
}

export function validateSearchCategorySectionForm(
  data: SearchCategorySectionFormData,
): string | null {
  if (!data.englishName.trim()) {
    return "English name is required for the section.";
  }

  if (!data.arabicName.trim()) {
    return "Arabic name is required for the section.";
  }

  const filledCategories = data.categories.filter(
    (category) =>
      category.englishName.trim().length > 0 ||
      category.arabicName.trim().length > 0,
  );

  for (const category of filledCategories) {
    if (!category.englishName.trim() || !category.arabicName.trim()) {
      return "Each category must have both English and Arabic names.";
    }
  }

  return null;
}

export async function setSearchCategorySectionPublished(
  id: string,
  published: boolean,
): Promise<SearchCategorySectionRecord | null> {
  await delay();

  let updated: SearchCategorySectionRecord | null = null;

  sectionsState = sectionsState.map((section) => {
    if (section.id !== id) return section;

    const next = { ...section, published };
    updated = toListRecord(next);
    return next;
  });

  return updated;
}

export async function deleteSearchCategorySection(id: string): Promise<boolean> {
  await delay();

  const before = sectionsState.length;
  sectionsState = sectionsState.filter((section) => section.id !== id);
  return sectionsState.length < before;
}
