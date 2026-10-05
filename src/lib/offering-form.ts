import { approveOfferingApproval } from "@/lib/offering-approval";
import { upsertVendorOfferingFromForm } from "@/lib/vendor-offerings";
import type {
  OfferingBilingualLine,
  OfferingFormData,
  OfferingGalleryImage,
  OfferingOptionItem,
  OfferingOptionSection,
} from "@/lib/types";
import {
  createOffering,
  getOfferingDetails,
  type CreateOfferingAddOnGroup,
  type CreateOfferingImagePayload,
  type CreateOfferingNamedItem,
  type CreateOfferingPayload,
  type CreateOfferingRequiredOption,
  type OfferingDetailApiItem,
  type OfferingDetailNamedItem,
} from "@/services/offerings";

export const OFFERING_TYPE_OPTIONS = [
  { value: "catering", label: "Catering" },
  { value: "cart", label: "Cart" },
  { value: "live-station", label: "Live Station" },
] as const;

const offeringFormsByKey: Record<string, OfferingFormData> = {};

function createLineId() {
  return `line-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

function formStorageKey(vendorId: string, offeringId: string | null) {
  return offeringId ? `${vendorId}:${offeringId}` : `${vendorId}:new`;
}

export function createEmptyOfferingForm(vendorId: string): OfferingFormData {
  return {
    vendorId,
    offeringId: null,
    englishName: "",
    arabicName: "",
    englishShortDescription: "",
    arabicShortDescription: "",
    gallery: [],
    offeringType: "catering",
    categoryId: "",
    published: false,
    femaleService: false,
    minimumQty: "1",
    maxQty: "50",
    itemPriceQr: "0",
    startingPriceQr: "0",
    maxTimeHours: "0",
    setupTimeHours: "0",
    minimumNotice: "",
    serviceAvailability: "-1",
    serviceAvailabilityCode: "-1",
    englishCapacityNote: "",
    arabicCapacityNote: "",
    requirements: [],
    includedFood: [],
    drinks: [],
    presentation: [],
    decorations: [],
    furniture: [],
    equipment: [],
    notes: [],
    requiredOptions: [],
    addOns: [],
  };
}

function createBreakfastPackageForm(
  vendorId: string,
  offeringId: string | null,
  approvalId?: string,
): OfferingFormData {
  return {
    ...createEmptyOfferingForm(vendorId),
    offeringId,
    approvalId,
    englishName: "Breakfast Package for 20 people",
    arabicName: "المجموعة الافطار لـ ٢٠ شخص",
    englishShortDescription: "Buffet,Occasions Catering",
    arabicShortDescription: "بوفيه، تقديم الطعام للمناسبات",
    gallery: [
      {
        id: "img-1",
        url: "https://images.unsplash.com/photo-1519167758481-83f29da8c2f3?w=320&h=240&fit=crop",
        alt: "Banquet table setup",
      },
      {
        id: "img-2",
        url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=320&h=240&fit=crop",
        alt: "Gold charger place setting",
      },
    ],
    categoryId: "lunch-dinner-buffet",
    femaleService: true,
    minimumQty: "20",
    maxQty: "150",
    itemPriceQr: "120",
    startingPriceQr: "2400",
    maxTimeHours: "5",
    setupTimeHours: "1",
    serviceAvailabilityCode: "333",
    englishCapacityNote: "20 Persons with option to add count",
    arabicCapacityNote: "٢٠ شخص مع إمكانية زيادة العدد",
    requirements: [
      {
        id: "req-1",
        english: "Electric outlet",
        arabic: "توصيلات كهربائية",
      },
    ],
    includedFood: [
      {
        id: "food-1",
        english:
          "Bakeries ( Mix Croissant, Mix Bread, Mix Muffin, Mix Danish )",
        arabic: "مخبوزات ( كرواسون مشكل، خبز مشكل، مافن مشكل، دانش مشكل )",
      },
      {
        id: "food-2",
        english:
          "Cold Appetizers ( Hummos, Green Salad, Olive, Mix Cheese, Labna, ... )",
        arabic:
          "مقبلات باردة ( حمص، سلطة خضراء، زيتون، أجبان مشكلة، لبنة، ... )",
      },
      {
        id: "food-3",
        english: "Hot Appetizers ( Mini Sandwich, Mini Fatyer )",
        arabic: "مقبلات ساخنة ( ساندويتش صغير، فطائر صغيرة )",
      },
      {
        id: "food-4",
        english: "4 Choices of the Main course",
        arabic: "٤ خيارات من الطبق الرئيسي",
      },
    ],
    drinks: [
      {
        id: "drink-1",
        english: "Drinks : Water",
        arabic: "المشروبات :مياه معدنيه",
      },
      {
        id: "drink-2",
        english: "2 Choices of Juices",
        arabic: "اختيار نوعين من العصائر",
      },
      {
        id: "drink-3",
        english:
          "Tea & Coffee : Coffee Machine, Turkish Coffee, Karak, Tea, Qatari Coffee",
        arabic:
          "(شاي و قهوة (ماكينة القهوة، قهوة تركية، كرك، شاي، قهوة قطرية",
      },
    ],
  };
}

function createSeafoodForm(
  vendorId: string,
  offeringId: string | null,
  approvalId?: string,
): OfferingFormData {
  return {
    ...createBreakfastPackageForm(vendorId, offeringId, approvalId),
    englishName: "Weekend Seafood Platter",
    arabicName: "طبق مأكولات بحرية لعطلة نهاية الأسبوع",
    englishShortDescription: "Fresh seafood selection for weekends",
    arabicShortDescription: "تشكيلة مأكولات بحرية طازجة لعطلة نهاية الأسبوع",
    categoryId: "65b24c449ba0330f75fc9651",
    minimumQty: "10",
    maxQty: "80",
    itemPriceQr: "85",
    startingPriceQr: "850",
    englishCapacityNote: "Per platter serving",
    arabicCapacityNote: "لكل طبق تقديم",
    gallery: [
      {
        id: "img-sea-1",
        url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=320&h=240&fit=crop",
        alt: "Seafood platter",
      },
    ],
    includedFood: [
      {
        id: "food-sea-1",
        english: "Grilled fish, prawns, and calamari",
        arabic: "سمك مشوي، جمبري، وكاليماري",
      },
    ],
    drinks: [],
    requirements: [],
  };
}

function createDeleteTestForm(
  vendorId: string,
  offeringId: string | null,
  approvalId?: string,
): OfferingFormData {
  return {
    ...createBreakfastPackageForm(vendorId, offeringId, approvalId),
    englishName: "[Copy] Testing for delete",
    arabicName: "اختبار للحذف",
    englishShortDescription: "Test offering pending deletion approval",
    arabicShortDescription: "عرض تجريبي بانتظار الموافقة على الحذف",
    categoryId: "burger-station",
    published: true,
    gallery: [
      {
        id: "img-del-1",
        url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=320&h=240&fit=crop",
        alt: "Burger station offering",
      },
    ],
  };
}

function createTestPaymentForm(
  vendorId: string,
  offeringId: string,
): OfferingFormData {
  return {
    ...createEmptyOfferingForm(vendorId),
    offeringId,
    englishName: "Test Payment",
    arabicName: "Test payment",
    englishShortDescription: "Test Payment",
    arabicShortDescription: "Test payment",
    categoryId: "65b23fed9ba0330f75fc9644",
    published: true,
    gallery: [
      {
        id: "img-tp-1",
        url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=320&h=240&fit=crop",
        alt: "Test Payment offering",
      },
    ],
  };
}

offeringFormsByKey["vnd-9:oa-2"] = createSeafoodForm("vnd-9", null, "oa-2");
offeringFormsByKey["vnd-6:oa-1"] = createDeleteTestForm("vnd-6", null, "oa-1");
offeringFormsByKey["vnd-1:off-tp-1"] = createTestPaymentForm(
  "vnd-1",
  "off-tp-1",
);

function delay(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createEmptyBilingualLine(): OfferingBilingualLine {
  return { id: createLineId(), english: "", arabic: "" };
}

export function createEmptyOptionItem(): OfferingOptionItem {
  return { id: createLineId(), english: "", arabic: "", price: "", maxQty: "" };
}

export function createEmptyOptionSection(kind: "required" | "addon" = "required") {
  return {
    id: createLineId(),
    titleEnglish: "",
    titleArabic: "",
    ...(kind === "required" ? { requiredNumbers: "1" } : {}),
    options: [createEmptyOptionItem()],
  };
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function numberText(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function recordId(value?: string) {
  return value || `line-${Math.random().toString(16).slice(2, 10)}`;
}

function vendorIdFromDetail(detail: OfferingDetailApiItem, fallback?: string) {
  if (typeof detail._vendor === "string" && detail._vendor.trim()) {
    return detail._vendor.trim();
  }
  if (detail._vendor && typeof detail._vendor === "object" && detail._vendor._id) {
    return detail._vendor._id;
  }
  return fallback ?? "";
}

function categoryIdFromDetail(detail: OfferingDetailApiItem) {
  if (typeof detail.categoryId === "string") return detail.categoryId.trim();
  return detail.categoryId?._id?.trim() ?? "";
}

function mapNamedLines(items: OfferingDetailNamedItem[] | null | undefined) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const english = cleanText(item.name?.en);
    const arabic = cleanText(item.name?.ar);
    if (!english && !arabic) return [];
    return [{ id: recordId(item._id), english, arabic }];
  });
}

function mapOfferingDetails(
  detail: OfferingDetailApiItem,
  input: { vendorId?: string; approvalId?: string },
): OfferingFormData {
  const base = createEmptyOfferingForm(vendorIdFromDetail(detail, input.vendorId));
  const images = (detail.images ?? []).flatMap((image) => {
    const url = image.cdnUrl?.trim() || image.url?.trim() || "";
    if (!url) return [];
    const filename = cleanText(image.filename) || "image";
    return [
      {
        id: recordId(image._id),
        url,
        alt: filename.replace(/\.[^.]+$/, "") || filename,
        name: filename,
      },
    ];
  });

  return {
    ...base,
    vendorId: vendorIdFromDetail(detail, input.vendorId),
    offeringId: detail._id ?? input.approvalId ?? null,
    approvalId: input.approvalId,
    englishName: cleanText(detail.name?.en),
    arabicName: cleanText(detail.name?.ar),
    englishShortDescription: cleanText(detail.shortDescription?.en),
    arabicShortDescription: cleanText(detail.shortDescription?.ar),
    gallery: images,
    offeringType: cleanText(detail.serviceCategory) || base.offeringType,
    categoryId: categoryIdFromDetail(detail),
    published: Boolean(detail.published),
    femaleService: Boolean(detail.femaleServiceAvailable),
    minimumQty: numberText(detail.minimumQuantity),
    maxQty: numberText(detail.maxQuantity),
    itemPriceQr: numberText(detail.price),
    startingPriceQr: numberText(detail.startingPrice),
    maxTimeHours: numberText(detail.maxTimeInHours),
    setupTimeHours: numberText(detail.setupTimeInHours),
    minimumNotice: numberText(detail.minimumNotice),
    serviceAvailability: numberText(detail.serviceAvailability),
    serviceAvailabilityCode: numberText(detail.serviceAvailabilitySharedCode),
    englishCapacityNote: cleanText(detail.enoughFor?.en),
    arabicCapacityNote: cleanText(detail.enoughFor?.ar),
    requirements: mapNamedLines(detail.requirements),
    includedFood: mapNamedLines(detail.food),
    drinks: mapNamedLines(detail.drinks),
    presentation: mapNamedLines(detail.presentation),
    decorations: mapNamedLines(detail.decorations),
    furniture: mapNamedLines(detail.furniture),
    equipment: mapNamedLines(detail.equipment),
    notes: mapNamedLines(detail.notes),
    requiredOptions: (detail.requiredOptions ?? []).map((section) => ({
      id: recordId(section._id),
      titleEnglish: cleanText(section.name?.en),
      titleArabic: cleanText(section.name?.ar),
      requiredNumbers: numberText(section.requiredNumber) || "1",
      options: (section.options ?? []).map((option) => ({
        id: recordId(option._id),
        english: cleanText(option.name?.en),
        arabic: cleanText(option.name?.ar),
      })),
    })),
    addOns: (detail.addOns ?? []).map((section) => ({
      id: recordId(section._id),
      titleEnglish: cleanText(section.name?.en),
      titleArabic: cleanText(section.name?.ar),
      options: (section.addOns ?? []).map((option) => ({
        id: recordId(option._id),
        english: cleanText(option.name?.en),
        arabic: cleanText(option.name?.ar),
        price: numberText(option.price),
        maxQty: numberText(option.max),
      })),
    })),
  };
}

export type FetchOfferingFormInput = {
  vendorId?: string;
  offeringId?: string;
  approvalId?: string;
};

/** GET /admin/offerings/details?id= when editing. Empty form when creating. */
export async function fetchOfferingForm(
  input: FetchOfferingFormInput,
): Promise<OfferingFormData | null> {
  const id = input.offeringId || input.approvalId;
  if (!id) {
    if (!input.vendorId) return null;
    return createEmptyOfferingForm(input.vendorId);
  }

  return mapOfferingDetails(await getOfferingDetails(id), input);
}

function toNamedLines(items: OfferingBilingualLine[]): CreateOfferingNamedItem[] {
  return items
    .filter((item) => item.english.trim() || item.arabic.trim())
    .map((item) => ({
      name: {
        en: item.english.trim(),
        ar: item.arabic.trim(),
      },
    }));
}

function toRequiredOptions(
  sections: OfferingOptionSection[],
): CreateOfferingRequiredOption[] {
  return sections
    .map((section) => {
      const options = section.options
        .filter((option) => option.english.trim() || option.arabic.trim())
        .map((option) => ({
          name: {
            en: option.english.trim(),
            ar: option.arabic.trim(),
          },
        }));
      const requiredNumber = Number(section.requiredNumbers ?? "1");

      return {
        name: {
          en: section.titleEnglish.trim(),
          ar: section.titleArabic.trim(),
        },
        requiredNumber: Number.isFinite(requiredNumber) ? requiredNumber : 1,
        options,
      };
    })
    .filter(
      (section) =>
        section.name.en || section.name.ar || section.options.length > 0,
    );
}

function toAddOnGroups(
  sections: OfferingOptionSection[],
): CreateOfferingAddOnGroup[] {
  return sections
    .map((section) => {
      const addOns = section.options
        .filter((option) => option.english.trim() || option.arabic.trim())
        .map((option) => {
          const price = Number(option.price ?? "");
          const max = Number(option.maxQty ?? "");
          return {
            name: {
              en: option.english.trim(),
              ar: option.arabic.trim(),
            },
            price: Number.isFinite(price) ? price : 0,
            max: Number.isFinite(max) ? max : 0,
          };
        });

      return {
        name: {
          en: section.titleEnglish.trim(),
          ar: section.titleArabic.trim(),
        },
        addOns,
      };
    })
    .filter(
      (section) =>
        section.name.en || section.name.ar || section.addOns.length > 0,
    );
}

function toOfferingImages(
  gallery: OfferingGalleryImage[],
): CreateOfferingImagePayload[] {
  return gallery.flatMap((image) => {
    if (!image.url.startsWith("data:image/")) return [];

    const mime =
      image.type ||
      image.url.slice(5, image.url.indexOf(";")) ||
      "image/png";
    const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "png";

    return [
      {
        name: image.name || `${image.alt || "image"}.${ext}`,
        type: mime,
        value: image.url,
      },
    ];
  });
}

function toAvailability(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : -1;
}

async function toCreateOfferingPayload(
  data: OfferingFormData,
): Promise<CreateOfferingPayload> {
  return {
    vendorId: data.vendorId,
    name: {
      en: data.englishName.trim(),
      ar: data.arabicName.trim(),
    },
    shortDescription: {
      en: data.englishShortDescription.trim(),
      ar: data.arabicShortDescription.trim(),
    },
    published: data.published,
    categoryId: data.categoryId,
    serviceCategory: data.offeringType,
    startingPrice: data.startingPriceQr.trim(),
    price: data.itemPriceQr.trim(),
    minimumQuantity: data.minimumQty.trim(),
    maxQuantity: data.maxQty.trim(),
    minimumNotice: data.minimumNotice.trim(),
    setupTimeInHours: data.setupTimeHours.trim(),
    maxTimeInHours: data.maxTimeHours.trim(),
    femaleServiceAvailable: data.femaleService,
    serviceAvailability: toAvailability(data.serviceAvailability),
    serviceAvailabilitySharedCode: data.serviceAvailabilityCode.trim(),
    requiredOptions: toRequiredOptions(data.requiredOptions),
    addOns: toAddOnGroups(data.addOns),
    food: toNamedLines(data.includedFood),
    notes: toNamedLines(data.notes),
    presentation: toNamedLines(data.presentation),
    decorations: toNamedLines(data.decorations),
    furniture: toNamedLines(data.furniture),
    equipment: toNamedLines(data.equipment),
    drinks: toNamedLines(data.drinks),
    requirements: toNamedLines(data.requirements),
    enoughFor: {
      en: data.englishCapacityNote.trim(),
      ar: data.arabicCapacityNote.trim(),
    },
    offeringimages: toOfferingImages(data.gallery),
  };
}

export async function saveVendorOfferingForm(data: OfferingFormData) {
  if (!data.offeringId) {
    const created = await createOffering(await toCreateOfferingPayload(data));
    const withId = { ...data, offeringId: created.id };
    const saved = upsertVendorOfferingFromForm(withId);
    const key = formStorageKey(data.vendorId, saved.id);
    offeringFormsByKey[key] = structuredClone(withId);
    return saved;
  }

  await delay(280);
  const saved = upsertVendorOfferingFromForm(data);
  const key = formStorageKey(data.vendorId, saved.id);
  offeringFormsByKey[key] = structuredClone({ ...data, offeringId: saved.id });
  return saved;
}

/** Swap for a real API call when available. */
export async function saveAndApproveOfferingForm(data: OfferingFormData) {
  await delay(280);
  if (!data.approvalId) {
    throw new Error("Approval id is required.");
  }

  const key = `${data.vendorId}:${data.approvalId}`;
  offeringFormsByKey[key] = structuredClone(data);
  if (data.offeringId) {
    offeringFormsByKey[formStorageKey(data.vendorId, data.offeringId)] =
      structuredClone(data);
    upsertVendorOfferingFromForm({ ...data, offeringId: data.offeringId });
  }
  await approveOfferingApproval(data.approvalId);
  return true;
}
