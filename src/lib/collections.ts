import type {
  Collection,
  CollectionFormData,
  CollectionItem,
  CollectionItemFormData,
  CollectionItemSubCategory,
  CollectionOffering,
} from "@/lib/collections-types";
import {
  type ApiCollection,
  type ApiOfferingItem,
  type ApiOfferingVendor,
  addCollectionItemApi,
  createCollectionApi,
  deleteCollectionApi,
  deleteCollectionItemApi,
  getCollectionItemApi,
  getCollectionsApi,
  getSortedOfferingsApi,
  searchOfferingsApi,
  unwrapItemRecord,
  updateCollectionApi,
  updateCollectionItemApi,
} from "@/services/collections";

function extractImageUrl(raw: unknown): string {
  if (!raw) return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
      if (trimmed.includes("carts-prod-assets.s3.eu-central-1.amazonaws.com")) {
        return trimmed.replace(
          "https://carts-prod-assets.s3.eu-central-1.amazonaws.com",
          "https://dqvxie7kr8emt.cloudfront.net",
        );
      }
      if (trimmed.includes("carts-qa.s3.ap-southeast-1.amazonaws.com")) {
        return trimmed.replace(
          "https://carts-qa.s3.ap-southeast-1.amazonaws.com",
          "https://dpnc6bgmngzpy.cloudfront.net",
        );
      }
      return trimmed;
    }
    if (trimmed.startsWith("vendors/") || trimmed.startsWith("offerings/")) {
      return `https://dqvxie7kr8emt.cloudfront.net/${trimmed}`;
    }
    return trimmed;
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
    return "";
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // 1. Cloudfront cdnUrl has highest priority (S3 direct urls return 403 Forbidden)
    if (typeof obj.cdnUrl === "string" && obj.cdnUrl.trim()) {
      return obj.cdnUrl.trim();
    }
    // 2. Direct url with S3 to Cloudfront mapping
    if (typeof obj.url === "string" && obj.url.trim()) {
      const u = obj.url.trim();
      if (u.includes("carts-prod-assets.s3.eu-central-1.amazonaws.com")) {
        return u.replace(
          "https://carts-prod-assets.s3.eu-central-1.amazonaws.com",
          "https://dqvxie7kr8emt.cloudfront.net",
        );
      }
      if (u.includes("carts-qa.s3.ap-southeast-1.amazonaws.com")) {
        return u.replace(
          "https://carts-qa.s3.ap-southeast-1.amazonaws.com",
          "https://dpnc6bgmngzpy.cloudfront.net",
        );
      }
      return u;
    }
    if (typeof obj.location === "string" && obj.location.trim()) return obj.location.trim();
    if (typeof obj.path === "string" && obj.path.trim()) return obj.path.trim();
    if (typeof obj.src === "string" && obj.src.trim()) return obj.src.trim();
    if (typeof obj.link === "string" && obj.link.trim()) return obj.link.trim();
    if (typeof obj.value === "string" && obj.value.trim()) return obj.value.trim();
    if (typeof obj.image === "string" && obj.image.trim()) return obj.image.trim();
    if (typeof obj.filename === "string" && obj.filename.trim()) {
      const fn = obj.filename.trim();
      if (fn.startsWith("http://") || fn.startsWith("https://")) return fn;
    }
    if (typeof obj.key === "string" && obj.key.trim()) {
      const key = obj.key.trim();
      if (key.startsWith("http://") || key.startsWith("https://")) return key;
      if (key.startsWith("vendors/") || key.startsWith("offerings/")) {
        return `https://dqvxie7kr8emt.cloudfront.net/${key}`;
      }
    }

    if (obj.image) {
      const nested = extractImageUrl(obj.image);
      if (nested) return nested;
    }
    if (obj.logo) {
      const nested = extractImageUrl(obj.logo);
      if (nested) return nested;
    }

    // Inspect nested arrays (like vendorImages.catering, vendorImages.delivery)
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        const nested = extractImageUrl(obj[key]);
        if (nested) return nested;
      }
    }
  }

  return "";
}

function formatImagePayload(imageStr: string): unknown[] {
  const trimmed = imageStr.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    const mime = match?.[1] || "image/jpeg";
    const ext = mime.split("/")[1] || "jpeg";
    return [
      {
        name: `collection-item-${Date.now()}.${ext}`,
        type: mime,
        value: trimmed,
        url: trimmed,
        cdnUrl: trimmed,
      },
    ];
  }

  return [trimmed];
}

function extractLocalizedName(raw: unknown): { en: string; ar: string } {
  if (!raw) return { en: "", ar: "" };

  if (typeof raw === "string") {
    if (raw.includes(" / ")) {
      const parts = raw.split(" / ");
      return { en: parts[0].trim(), ar: parts[1]?.trim() || "" };
    }
    return { en: raw.trim(), ar: "" };
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const en =
      typeof obj.en === "string"
        ? obj.en
        : typeof obj.english === "string"
          ? obj.english
          : typeof obj.en_US === "string"
            ? obj.en_US
            : "";
    const ar =
      typeof obj.ar === "string"
        ? obj.ar
        : typeof obj.arabic === "string"
          ? obj.arabic
          : typeof obj.ar_SA === "string"
            ? obj.ar_SA
            : "";
    return { en: en.trim(), ar: ar.trim() };
  }

  return { en: "", ar: "" };
}

function extractItemNames(obj: Record<string, unknown>): { en: string; ar: string } {
  if (obj.name) {
    const parsed = extractLocalizedName(obj.name);
    if (parsed.en || parsed.ar) return parsed;
  }

  if (obj.title) {
    const parsed = extractLocalizedName(obj.title);
    if (parsed.en || parsed.ar) return parsed;
  }

  const en =
    (typeof obj.englishName === "string" ? obj.englishName : "") ||
    (typeof obj.nameEn === "string" ? obj.nameEn : "") ||
    (typeof obj.name_en === "string" ? obj.name_en : "") ||
    (typeof obj.titleEn === "string" ? obj.titleEn : "") ||
    (typeof obj.title_en === "string" ? obj.title_en : "") ||
    (typeof obj.enName === "string" ? obj.enName : "") ||
    "";

  const ar =
    (typeof obj.arabicName === "string" ? obj.arabicName : "") ||
    (typeof obj.nameAr === "string" ? obj.nameAr : "") ||
    (typeof obj.name_ar === "string" ? obj.name_ar : "") ||
    (typeof obj.titleAr === "string" ? obj.titleAr : "") ||
    (typeof obj.title_ar === "string" ? obj.title_ar : "") ||
    (typeof obj.arName === "string" ? obj.arName : "") ||
    "";

  return { en: en.trim(), ar: ar.trim() };
}

function extractItemImages(obj: Record<string, unknown>): {
  englishImage: string;
  arabicImage: string;
} {
  let englishImage =
    extractImageUrl(obj.englishImages) ||
    extractImageUrl(obj.englishImage) ||
    extractImageUrl(obj.english_images) ||
    extractImageUrl(obj.english_image) ||
    extractImageUrl(obj.enImages) ||
    extractImageUrl(obj.enImage);

  let arabicImage =
    extractImageUrl(obj.arabicImages) ||
    extractImageUrl(obj.arabicImage) ||
    extractImageUrl(obj.arabic_images) ||
    extractImageUrl(obj.arabic_image) ||
    extractImageUrl(obj.arImages) ||
    extractImageUrl(obj.arImage);

  if (obj.images && typeof obj.images === "object" && !Array.isArray(obj.images)) {
    const imgs = obj.images as Record<string, unknown>;
    if (!englishImage) englishImage = extractImageUrl(imgs.en) || extractImageUrl(imgs.english);
    if (!arabicImage) arabicImage = extractImageUrl(imgs.ar) || extractImageUrl(imgs.arabic);
  }

  if (Array.isArray(obj.images) && obj.images.length > 0) {
    if (!englishImage) englishImage = extractImageUrl(obj.images[0]);
    if (!arabicImage) arabicImage = extractImageUrl(obj.images[1] ?? obj.images[0]);
  }

  if (!englishImage && obj.image) {
    englishImage = extractImageUrl(obj.image);
  }
  if (!arabicImage && englishImage) {
    arabicImage = englishImage;
  }

  return { englishImage, arabicImage };
}

export const DEFAULT_OFFERING_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120' fill='none'%3E%3Crect width='160' height='120' fill='%23F1F5F9'/%3E%3Cpath d='M80 50c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm-20 28l12-16 8 10 12-16 16 22H60z' fill='%23CBD5E1'/%3E%3C/svg%3E";

function extractOfferingThumb(raw: Record<string, unknown>): string {
  // 1. Check offering's own photos / images
  let thumb =
    extractImageUrl(raw.images) ||
    extractImageUrl(raw.image) ||
    extractImageUrl(raw.offeringimages) ||
    extractImageUrl(raw.offeringImages) ||
    extractImageUrl(raw.gallery) ||
    extractImageUrl(raw.thumbnail) ||
    extractImageUrl(raw.thumb) ||
    extractImageUrl(raw.coverImage) ||
    extractImageUrl(raw.cover) ||
    extractImageUrl(raw.photo) ||
    extractImageUrl(raw.photos) ||
    extractImageUrl(raw.itemImages) ||
    extractImageUrl(raw.itemImage);

  if (thumb) return thumb;

  // 2. Check vendor logo / images
  if (raw._vendor && typeof raw._vendor === "object") {
    const v = raw._vendor as Record<string, unknown>;
    thumb =
      extractImageUrl(v.logo) ||
      extractImageUrl(v.images) ||
      extractImageUrl(v.image) ||
      extractImageUrl(v.profileImage) ||
      extractImageUrl(v.logoImg) ||
      extractImageUrl(v.banner) ||
      extractImageUrl(v.vendorImages);

    if (thumb) return thumb;
  }

  if (raw.vendorId && typeof raw.vendorId === "object") {
    const v = raw.vendorId as Record<string, unknown>;
    thumb =
      extractImageUrl(v.logo) ||
      extractImageUrl(v.images) ||
      extractImageUrl(v.image) ||
      extractImageUrl(v.profileImage) ||
      extractImageUrl(v.logoImg) ||
      extractImageUrl(v.banner) ||
      extractImageUrl(v.vendorImages);

    if (thumb) return thumb;
  }

  // 3. Fallback top-level logo
  if (raw.logo) {
    thumb = extractImageUrl(raw.logo);
    if (thumb) return thumb;
  }

  return DEFAULT_OFFERING_PLACEHOLDER;
}

function extractIdString(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj._id === "string") return obj._id.trim();
    if (typeof obj.id === "string") return obj.id.trim();
    if (typeof obj.$oid === "string") return obj.$oid.trim();
    if (obj._id && typeof obj._id === "object") {
      const nested = obj._id as Record<string, unknown>;
      if (typeof nested.$oid === "string") return nested.$oid.trim();
    }
  }
  return "";
}

function mapOfferingItem(raw: unknown): CollectionOffering {
  if (!raw || typeof raw !== "object") {
    const offId = String(raw || "").trim();
    return {
      id: offId,
      thumb: DEFAULT_OFFERING_PLACEHOLDER,
      vendorName: "Vendor",
      offeringName: offId ? `Offering (${offId.slice(-6)})` : "Offering",
      serviceType: "catering",
      orderCount: 0,
      vendorId: undefined,
      vendorID: undefined,
    };
  }

  const rawObj = raw as Record<string, unknown>;

  // Check if offering is wrapped in `offeringId` or `offering` (as in GET /collections/get-item/:id)
  const offeringObj =
    (rawObj.offeringId && typeof rawObj.offeringId === "object"
      ? (rawObj.offeringId as Record<string, unknown>)
      : null) ||
    (rawObj.offering && typeof rawObj.offering === "object"
      ? (rawObj.offering as Record<string, unknown>)
      : null) ||
    rawObj;

  // Check if vendor is in `vendorId`, `vendorID`, `_vendor`, or `vendor`
  const vendorObj =
    (rawObj.vendorId && typeof rawObj.vendorId === "object"
      ? (rawObj.vendorId as Record<string, unknown>)
      : null) ||
    (rawObj.vendorID && typeof rawObj.vendorID === "object"
      ? (rawObj.vendorID as Record<string, unknown>)
      : null) ||
    (rawObj._vendor && typeof rawObj._vendor === "object"
      ? (rawObj._vendor as Record<string, unknown>)
      : null) ||
    (rawObj.vendor && typeof rawObj.vendor === "object"
      ? (rawObj.vendor as Record<string, unknown>)
      : null) ||
    (offeringObj.vendorId && typeof offeringObj.vendorId === "object"
      ? (offeringObj.vendorId as Record<string, unknown>)
      : null) ||
    (offeringObj.vendorID && typeof offeringObj.vendorID === "object"
      ? (offeringObj.vendorID as Record<string, unknown>)
      : null) ||
    (offeringObj._vendor && typeof offeringObj._vendor === "object"
      ? (offeringObj._vendor as Record<string, unknown>)
      : null) ||
    (offeringObj.vendor && typeof offeringObj.vendor === "object"
      ? (offeringObj.vendor as Record<string, unknown>)
      : null);

  // Extract vendor ID:
  const rawVendorId =
    (vendorObj ? extractIdString(vendorObj._id) || extractIdString(vendorObj.id) : "") ||
    extractIdString(rawObj.vendorId) ||
    extractIdString(rawObj.vendorID) ||
    extractIdString(rawObj._vendor) ||
    extractIdString(rawObj.vendor) ||
    extractIdString(offeringObj.vendorId) ||
    extractIdString(offeringObj.vendorID) ||
    extractIdString(offeringObj._vendor) ||
    extractIdString(offeringObj.vendor);
  const realVendorId = rawVendorId.trim();

  // The true offering ID: prefer offeringObj._id over the wrapper row rawObj._id
  const realId = String(
    extractIdString(offeringObj._id) ||
      extractIdString(offeringObj.id) ||
      (typeof rawObj.offeringId === "string" ? rawObj.offeringId.trim() : null) ||
      extractIdString(rawObj._id) ||
      extractIdString(rawObj.id) ||
      "",
  ).trim();

  // Offering Names:
  const offeringNames = extractItemNames(offeringObj);
  const nameEn =
    offeringNames.en ||
    (typeof offeringObj.name === "string" ? offeringObj.name.trim() : "") ||
    "";
  const nameAr = offeringNames.ar || undefined;

  // Vendor Names:
  let vendorNameEn = "";
  let vendorNameAr: string | undefined = undefined;

  if (vendorObj) {
    const vNames = extractItemNames(vendorObj);
    vendorNameEn =
      vNames.en ||
      (typeof vendorObj.name === "string" ? vendorObj.name.trim() : "") ||
      "";
    vendorNameAr = vNames.ar || undefined;
  } else if (typeof rawObj._vendor === "string" && !/^[0-9a-fA-F]{24}$/.test(rawObj._vendor.trim())) {
    vendorNameEn = rawObj._vendor.trim();
  } else if (typeof rawObj.vendor === "string" && !/^[0-9a-fA-F]{24}$/.test(rawObj.vendor.trim())) {
    vendorNameEn = rawObj.vendor.trim();
  } else if (typeof offeringObj._vendor === "string" && !/^[0-9a-fA-F]{24}$/.test(offeringObj._vendor.trim())) {
    vendorNameEn = offeringObj._vendor.trim();
  } else if (typeof offeringObj.vendor === "string" && !/^[0-9a-fA-F]{24}$/.test(offeringObj.vendor.trim())) {
    vendorNameEn = offeringObj.vendor.trim();
  }

  // Service Type:
  let serviceType =
    (typeof offeringObj.serviceType === "string" ? offeringObj.serviceType : "") ||
    (typeof offeringObj.serviceCategory === "string" ? offeringObj.serviceCategory : "") ||
    (typeof rawObj.serviceType === "string" ? rawObj.serviceType : "") ||
    (typeof rawObj.serviceCategory === "string" ? rawObj.serviceCategory : "") ||
    "";

  if (!serviceType && vendorObj) {
    if (Array.isArray(vendorObj.serviceCategories) && vendorObj.serviceCategories.length > 0) {
      serviceType = String(vendorObj.serviceCategories[0]);
    } else if (typeof vendorObj.serviceType === "string") {
      serviceType = vendorObj.serviceType;
    }
  }
  if (!serviceType) {
    serviceType = "catering";
  }

  // Image Thumbnail:
  let thumb =
    extractOfferingThumb(offeringObj) ||
    (vendorObj ? extractOfferingThumb(vendorObj) : "") ||
    extractOfferingThumb(rawObj);

  if (!thumb || thumb === DEFAULT_OFFERING_PLACEHOLDER) {
    if (vendorObj) {
      const vThumb =
        extractImageUrl(vendorObj.logo) ||
        extractImageUrl(vendorObj.images) ||
        extractImageUrl(vendorObj.vendorImages);
      if (vThumb) thumb = vThumb;
    }
  }

  const combinedOfferingName = nameAr
    ? `${nameEn} / ${nameAr}`
    : nameEn || (realId ? `Offering (${realId.slice(-6)})` : "Offering");

  const combinedVendorName = vendorNameAr
    ? `${vendorNameEn} / ${vendorNameAr}`
    : vendorNameEn || "Vendor";

  const orderCount =
    (typeof offeringObj.ordersCount === "number" ? offeringObj.ordersCount : null) ??
    (typeof offeringObj.orderCount === "number" ? offeringObj.orderCount : null) ??
    (typeof rawObj.ordersCount === "number" ? rawObj.ordersCount : null) ??
    (typeof rawObj.orderCount === "number" ? rawObj.orderCount : null) ??
    0;

  return {
    id: realId,
    thumb: thumb?.trim() || DEFAULT_OFFERING_PLACEHOLDER,
    vendorName: combinedVendorName,
    vendorNameAr,
    offeringName: combinedOfferingName,
    offeringNameAr: nameAr,
    serviceType,
    orderCount,
    vendorId: realVendorId || undefined,
    vendorID: realVendorId || undefined,
  };
}

function extractItemSubCategories(
  obj: Record<string, unknown>,
): CollectionItemSubCategory[] {
  const rawSubs =
    (Array.isArray(obj.subCategories) ? obj.subCategories : null) ||
    (Array.isArray(obj.subcategories) ? obj.subcategories : null) ||
    (Array.isArray(obj.sub_categories) ? obj.sub_categories : null) ||
    (Array.isArray(obj.subCategory) ? obj.subCategory : null) ||
    (Array.isArray(obj.categories) ? obj.categories : null) ||
    (Array.isArray(obj.tabs) ? obj.tabs : null) ||
    [];

  return rawSubs.map((rawSub, idx) => {
    if (!rawSub || typeof rawSub !== "object") {
      return {
        id: `sub-${idx}`,
        englishName: `Sub Category ${idx + 1}`,
        arabicName: `تصنيف فرعي ${idx + 1}`,
        offerings: [],
      };
    }
    const subObj = rawSub as Record<string, unknown>;
    const subId = String(subObj._id ?? subObj.id ?? `sub-${idx}`);
    const names = extractItemNames(subObj);

    const rawOfferings =
      (Array.isArray(subObj.offerings) ? subObj.offerings : null) ||
      (Array.isArray(subObj.offering) ? subObj.offering : null) ||
      (Array.isArray(subObj.offeringIds) ? subObj.offeringIds : null) ||
      (Array.isArray(subObj.items) ? subObj.items : null) ||
      [];

    const offerings: CollectionOffering[] = rawOfferings.map((off, oIdx) => {
      if (off && typeof off === "object") {
        return mapOfferingItem(off as ApiOfferingItem);
      }
      const offId = String(off);
      return {
        id: offId,
        thumb: DEFAULT_OFFERING_PLACEHOLDER,
        vendorName: "Vendor",
        offeringName: `Offering (${offId.slice(-6)})`,
        serviceType: "catering",
        orderCount: 0,
      };
    });

    return {
      id: subId,
      englishName: names.en || `Sub Category ${idx + 1}`,
      arabicName: names.ar || names.en || `تصنيف فرعي ${idx + 1}`,
      offerings,
    };
  });
}

function mapApiItemToCollectionItem(
  rawItem: unknown,
  collectionId: string,
): CollectionItem {
  const item = unwrapItemRecord(rawItem) || {};

  const itemId = String(item._id ?? item.id ?? "");
  const names = extractItemNames(item);
  const images = extractItemImages(item);
  const subCategories = extractItemSubCategories(item);

  return {
    id: itemId,
    collectionId,
    englishName: names.en,
    arabicName: names.ar,
    englishImage: images.englishImage,
    arabicImage: images.arabicImage,
    subCategories,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
  };
}

function mapApiCollection(col: ApiCollection): Collection {
  const colId = col._id ?? col.id ?? "";
  const names = extractItemNames(col as unknown as Record<string, unknown>);
  const rawItems = col.mainCategory ?? col.items ?? [];

  return {
    id: colId,
    englishName: names.en,
    arabicName: names.ar,
    published: Boolean(col.published),
    createdAt: col.createdAt,
    items: rawItems.map((item) => mapApiItemToCollectionItem(item, colId)),
  };
}

export async function fetchCollections(): Promise<Collection[]> {
  const data = await getCollectionsApi();
  return data.map(mapApiCollection);
}

export async function fetchCollectionById(
  id: string,
): Promise<Collection | null> {
  const collections = await fetchCollections();
  return collections.find((c) => c.id === id) ?? null;
}

export async function saveCollection(
  form: CollectionFormData,
): Promise<Collection> {
  if (form.id) {
    await updateCollectionApi(form.id, {
      name: {
        en: form.englishName.trim(),
        ar: form.arabicName.trim(),
      },
      published: form.published,
    });
    return {
      id: form.id,
      englishName: form.englishName.trim(),
      arabicName: form.arabicName.trim(),
      published: form.published,
      items: [],
    };
  }

  const created = await createCollectionApi({
    name: {
      en: form.englishName.trim(),
      ar: form.arabicName.trim(),
    },
    published: form.published,
  });

  const createdId =
    (created?.data as { _id?: string; id?: string })?._id ??
    (created?.data as { _id?: string; id?: string })?.id ??
    "";

  return {
    id: createdId,
    englishName: form.englishName.trim(),
    arabicName: form.arabicName.trim(),
    published: form.published,
    items: [],
  };
}

export async function toggleCollectionPublished(
  id: string,
  published: boolean,
): Promise<boolean> {
  const col = await fetchCollectionById(id);
  if (!col) return false;

  await updateCollectionApi(id, {
    name: {
      en: col.englishName,
      ar: col.arabicName,
    },
    published,
  });
  return true;
}

export async function deleteCollection(id: string): Promise<boolean> {
  await deleteCollectionApi(id);
  return true;
}

export function isRealUrl(str?: string): boolean {
  if (!str) return false;
  const s = str.trim();
  return (s.startsWith("http://") || s.startsWith("https://")) && !s.includes("data:image");
}

export function pickBestThumb(a?: string, b?: string): string {
  if (isRealUrl(a)) return a!.trim();
  if (isRealUrl(b)) return b!.trim();
  const cleanA = a?.trim() || "";
  const cleanB = b?.trim() || "";
  if (cleanA && cleanA !== DEFAULT_OFFERING_PLACEHOLDER) return cleanA;
  if (cleanB && cleanB !== DEFAULT_OFFERING_PLACEHOLDER) return cleanB;
  return DEFAULT_OFFERING_PLACEHOLDER;
}

export function pickBestName(a?: string, b?: string, fallback = ""): string {
  const cleanA = a?.trim() || "";
  const cleanB = b?.trim() || "";
  if (cleanA.includes(" / ")) return cleanA;
  if (cleanB.includes(" / ")) return cleanB;
  if (cleanA && cleanA !== "Vendor" && cleanA !== "Offering" && !cleanA.startsWith("Offering (")) return cleanA;
  if (cleanB && cleanB !== "Vendor" && cleanB !== "Offering" && !cleanB.startsWith("Offering (")) return cleanB;
  return cleanA || cleanB || fallback;
}

async function enrichItemOfferings(item: CollectionItem): Promise<CollectionItem> {
  if (!item.subCategories || item.subCategories.length === 0) return item;
  try {
    const sorted = await getSortedOfferingsApi().catch(() => []);
    const offeringMap = new Map<string, CollectionOffering>();
    for (const raw of sorted) {
      const mapped = mapOfferingItem(raw);
      if (mapped.id) {
        offeringMap.set(mapped.id.trim(), mapped);
      }
    }

    return {
      ...item,
      subCategories: item.subCategories.map((sub) => ({
        ...sub,
        offerings: sub.offerings.map((off) => {
          const match = offeringMap.get(off.id.trim());
          const resolvedVendorId =
            off.vendorId ||
            off.vendorID ||
            match?.vendorId ||
            match?.vendorID ||
            undefined;

          if (!match) {
            return {
              ...off,
              thumb: off.thumb?.trim() || DEFAULT_OFFERING_PLACEHOLDER,
              vendorId: resolvedVendorId,
              vendorID: resolvedVendorId,
            };
          }
          return {
            id: off.id,
            thumb: pickBestThumb(off.thumb, match.thumb),
            vendorName: pickBestName(off.vendorName, match.vendorName, "Vendor"),
            vendorNameAr: off.vendorNameAr || match.vendorNameAr,
            offeringName: pickBestName(
              off.offeringName,
              match.offeringName,
              `Offering (${off.id.slice(-6)})`,
            ),
            offeringNameAr: off.offeringNameAr || match.offeringNameAr,
            serviceType: off.serviceType || match.serviceType || "catering",
            orderCount: off.orderCount || match.orderCount || 0,
            vendorId: resolvedVendorId,
            vendorID: resolvedVendorId,
          };
        }),
      })),
    };
  } catch {
    return item;
  }
}

export async function fetchCollectionItemById(
  collectionId: string,
  itemId: string,
): Promise<CollectionItem | null> {
  // Strategy 1: Call GET /collections/get-item/:id (Endpoint 3.4)
  try {
    const apiItem = await getCollectionItemApi(itemId);
    if (apiItem) {
      const mapped = mapApiItemToCollectionItem(apiItem, collectionId);
      if (
        mapped.englishName ||
        mapped.arabicName ||
        mapped.englishImage ||
        mapped.arabicImage ||
        mapped.subCategories.length > 0
      ) {
        return await enrichItemOfferings(mapped);
      }
    }
  } catch {
    // ignore and fallback
  }

  // Strategy 2: Look up across collections via GET /collections
  try {
    const collections = await fetchCollections();
    const targetCol = collections.find((c) => c.id === collectionId);
    const itemInCol = targetCol?.items.find((item) => item.id === itemId);
    if (itemInCol) return await enrichItemOfferings(itemInCol);

    for (const col of collections) {
      const match = col.items.find((item) => item.id === itemId);
      if (match) return await enrichItemOfferings(match);
    }
  } catch {
    // ignore
  }

  return null;
}

export async function saveCollectionItem(
  form: CollectionItemFormData,
): Promise<void> {
  // Check if any offering across any subCategory is missing vendorId
  const missingVendorIds = form.subCategories.some((sub) =>
    sub.offerings.some((o) => !(o.vendorId || o.vendorID)?.trim()),
  );

  let fallbackMap: Map<string, string> | null = null;
  if (missingVendorIds) {
    try {
      const available = await fetchAvailableOfferings();
      fallbackMap = new Map<string, string>();
      for (const off of available) {
        const vId = (off.vendorId || off.vendorID || "").trim();
        if (off.id && vId) {
          fallbackMap.set(off.id.trim(), vId);
        }
      }

      // If any offering is still missing, search by offering name
      for (const sub of form.subCategories) {
        for (const o of sub.offerings) {
          const offId = (o.id || "").trim();
          const currentVId = (
            o.vendorId ||
            o.vendorID ||
            fallbackMap.get(offId) ||
            ""
          ).trim();
          if (!currentVId && o.offeringName) {
            try {
              const searchRes = await searchOfferingsApi(o.offeringName);
              for (const raw of searchRes) {
                const mapped = mapOfferingItem(raw);
                if (mapped.id === offId && (mapped.vendorId || mapped.vendorID)) {
                  fallbackMap.set(offId, (mapped.vendorId || mapped.vendorID)!);
                  break;
                }
              }
            } catch {
              // ignore search error
            }
          }
        }
      }
    } catch {
      // ignore fallback error
    }
  }

  const payload = {
    name: {
      en: form.englishName.trim(),
      ar: form.arabicName.trim(),
    },
    englishImages: formatImagePayload(form.englishImage),
    arabicImages: formatImagePayload(form.arabicImage),
    subCategories: form.subCategories.map((sub) => ({
      name: {
        en: sub.englishName.trim(),
        ar: sub.arabicName.trim(),
      },
      offerings: sub.offerings.map((o) => {
        const offId = (o.id || "").trim();
        const vId = (
          o.vendorId ||
          o.vendorID ||
          (fallbackMap ? fallbackMap.get(offId) : "") ||
          ""
        ).trim();

        return {
          offeringId: offId,
          vendorId: vId,
        };
      }),
    })),
  };

  if (form.id) {
    await updateCollectionItemApi(form.id, payload);
  } else {
    await addCollectionItemApi(form.collectionId, payload);
  }
}

export async function deleteCollectionItem(
  collectionId: string,
  itemId: string,
): Promise<boolean> {
  await deleteCollectionItemApi(itemId);
  return true;
}

export async function fetchAvailableOfferings(
  query = "",
  tab: "top" | "search" = "top",
): Promise<CollectionOffering[]> {
  const trimmed = query.trim();

  if (tab === "search" && trimmed) {
    try {
      const searchResults = await searchOfferingsApi(trimmed);
      return searchResults.map(mapOfferingItem);
    } catch {
      // fallback
    }
  }

  const list = await getSortedOfferingsApi();
  const mapped = list.map(mapOfferingItem);

  if (trimmed) {
    const q = trimmed.toLowerCase();
    return mapped.filter(
      (o) =>
        o.offeringName.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q) ||
        o.serviceType.toLowerCase().includes(q) ||
        (o.offeringNameAr && o.offeringNameAr.includes(q)) ||
        (o.vendorNameAr && o.vendorNameAr.includes(q)),
    );
  }

  return mapped;
}
