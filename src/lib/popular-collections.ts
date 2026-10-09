import type {
  PopularCollection,
  PopularCollectionFormData,
  PopularCollectionServiceOption,
  PopularSubCollection,
  PopularSubCollectionFormData,
} from "@/lib/types";

export const POPULAR_COLLECTION_SERVICE_OPTIONS: PopularCollectionServiceOption[] =
  [
    { id: "catering", englishName: "Catering", arabicName: "تموين" },
    { id: "delivery", englishName: "Delivery", arabicName: "توصيل" },
    { id: "setups", englishName: "Setups", arabicName: "تجهيزات" },
    { id: "hospitality", englishName: "Hospitality", arabicName: "ضيافة" },
    { id: "feasts", englishName: "Feasts", arabicName: "ولائم" },
  ];

function cloneCollection(collection: PopularCollection): PopularCollection {
  return {
    ...collection,
    subCollections: collection.subCollections.map((sub) => ({ ...sub })),
  };
}

let collectionsStore: PopularCollection[] = [];

function delay(ms = 240) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getServiceCategoryLabel(id: string) {
  const match = POPULAR_COLLECTION_SERVICE_OPTIONS.find(
    (option) => option.id === id,
  );
  return match ? match.englishName : "Unassigned";
}

export function createEmptyCollectionForm(): PopularCollectionFormData {
  return {
    englishName: "",
    arabicName: "",
    published: false,
    popular: false,
    serviceCategoryId: "",
    imageUrl: "",
  };
}

export function collectionToFormData(
  collection: PopularCollection,
): PopularCollectionFormData {
  return {
    id: collection.id,
    englishName: collection.englishName,
    arabicName: collection.arabicName,
    published: collection.published,
    popular: collection.popular,
    serviceCategoryId: collection.serviceCategoryId,
    imageUrl: collection.imageUrl,
  };
}

export function createEmptySubCollectionForm(
  collectionId: string,
): PopularSubCollectionFormData {
  return {
    collectionId,
    englishName: "",
    arabicName: "",
    published: false,
  };
}

export function subCollectionToFormData(
  sub: PopularSubCollection,
): PopularSubCollectionFormData {
  return {
    id: sub.id,
    collectionId: sub.collectionId,
    englishName: sub.englishName,
    arabicName: sub.arabicName,
    published: sub.published,
  };
}

export function validateCollectionForm(form: PopularCollectionFormData) {
  if (!form.englishName.trim()) return "English name is required.";
  if (!form.arabicName.trim()) return "Arabic name is required.";
  if (!form.serviceCategoryId) return "Select a service category.";
  if (!form.imageUrl.trim()) return "Select an image.";
  return null;
}

export function validateSubCollectionForm(form: PopularSubCollectionFormData) {
  if (!form.englishName.trim()) return "English name is required.";
  if (!form.arabicName.trim()) return "Arabic name is required.";
  return null;
}

export async function fetchPopularCollections(): Promise<PopularCollection[]> {
  await delay();
  return collectionsStore.map(cloneCollection);
}

export async function fetchPopularCollectionById(
  id: string,
): Promise<PopularCollection | null> {
  await delay();
  const collection = collectionsStore.find((entry) => entry.id === id);
  return collection ? cloneCollection(collection) : null;
}

export async function savePopularCollectionForm(
  form: PopularCollectionFormData,
): Promise<PopularCollection> {
  await delay(280);

  const existing = collectionsStore.find((entry) => entry.id === form.id);
  const collection: PopularCollection = {
    id: form.id ?? createId("pc"),
    englishName: form.englishName.trim(),
    arabicName: form.arabicName.trim(),
    published: form.published,
    popular: form.popular,
    serviceCategoryId: form.serviceCategoryId,
    imageUrl: form.imageUrl.trim(),
    subCollections: existing?.subCollections.map((sub) => ({ ...sub })) ?? [],
  };

  if (existing) {
    collectionsStore = collectionsStore.map((entry) =>
      entry.id === collection.id ? collection : entry,
    );
  } else {
    collectionsStore = [...collectionsStore, collection];
  }

  return cloneCollection(collection);
}

export async function deletePopularCollection(id: string): Promise<boolean> {
  await delay(200);
  const before = collectionsStore.length;
  collectionsStore = collectionsStore.filter((entry) => entry.id !== id);
  return collectionsStore.length < before;
}

export async function savePopularSubCollectionForm(
  form: PopularSubCollectionFormData,
): Promise<PopularSubCollection> {
  await delay(280);

  const parent = collectionsStore.find(
    (entry) => entry.id === form.collectionId,
  );
  if (!parent) {
    throw new Error("Collection not found.");
  }

  const sub: PopularSubCollection = {
    id: form.id ?? createId("psc"),
    collectionId: parent.id,
    englishName: form.englishName.trim(),
    arabicName: form.arabicName.trim(),
    published: form.published,
  };

  const exists = parent.subCollections.some((entry) => entry.id === sub.id);
  const nextSubs = exists
    ? parent.subCollections.map((entry) => (entry.id === sub.id ? sub : entry))
    : [...parent.subCollections, sub];

  collectionsStore = collectionsStore.map((entry) =>
    entry.id === parent.id ? { ...entry, subCollections: nextSubs } : entry,
  );

  return { ...sub };
}

export async function deletePopularSubCollection(
  collectionId: string,
  subId: string,
): Promise<boolean> {
  await delay(200);
  const parent = collectionsStore.find((entry) => entry.id === collectionId);
  if (!parent) return false;

  const before = parent.subCollections.length;
  const nextSubs = parent.subCollections.filter((entry) => entry.id !== subId);
  collectionsStore = collectionsStore.map((entry) =>
    entry.id === collectionId ? { ...entry, subCollections: nextSubs } : entry,
  );
  return nextSubs.length < before;
}
