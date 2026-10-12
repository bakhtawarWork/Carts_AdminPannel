"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OfferingSelectorModal from "./OfferingSelectorModal";
import type {
  Collection,
  CollectionItemFormData,
  CollectionItemSubCategory,
  CollectionOffering,
} from "@/lib/collections-types";
import {
  DEFAULT_OFFERING_PLACEHOLDER,
  fetchAvailableOfferings,
  fetchCollectionById,
  fetchCollectionItemById,
  pickBestName,
  pickBestThumb,
  saveCollectionItem,
} from "@/lib/collections";
import { readImageFileAsDataUrl } from "@/lib/offering-image-upload";

type SubCategoryForm = {
  id: string;
  englishName: string;
  arabicName: string;
  offerings: CollectionOffering[];
};

type CollectionItemFormViewProps = {
  collectionId: string;
  itemId?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function CollectionItemFormView({
  collectionId,
  itemId,
}: CollectionItemFormViewProps) {
  const router = useRouter();
  const isEdit = Boolean(itemId);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [englishName, setEnglishName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [englishImage, setEnglishImage] = useState("");
  const [arabicImage, setArabicImage] = useState("");

  const [subCategories, setSubCategories] = useState<SubCategoryForm[]>([
    {
      id: `sub-init-${Date.now()}`,
      englishName: "Top 10 items",
      arabicName: "أهم 10 عناصر",
      offerings: [],
    },
  ]);

  // Modal state for selecting offerings
  const [offeringModalIndex, setOfferingModalIndex] = useState<number | null>(
    null,
  );

  const enFileInputRef = useRef<HTMLInputElement>(null);
  const arFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [col, item, availableOfferings] = await Promise.all([
          fetchCollectionById(collectionId).catch(() => null),
          itemId
            ? fetchCollectionItemById(collectionId, itemId).catch(() => null)
            : Promise.resolve(null),
          fetchAvailableOfferings().catch(() => []),
        ]);

        if (cancelled) return;

        if (col) {
          setCollection(col);
        }

        if (itemId) {
          if (!item) {
            setError("Collection item not found.");
            return;
          }

          setEnglishName(item.englishName || "");
          setArabicName(item.arabicName || "");
          setEnglishImage(item.englishImage || "");
          setArabicImage(item.arabicImage || "");

          const offeringMap = new Map<string, CollectionOffering>();
          for (const o of availableOfferings) {
            if (o.id) offeringMap.set(o.id.trim(), o);
          }

          if (item.subCategories && item.subCategories.length > 0) {
            setSubCategories(
              item.subCategories.map(
                (s: CollectionItemSubCategory, idx: number) => ({
                  id: s.id || `sub-${idx}-${Date.now()}`,
                  englishName: s.englishName || "",
                  arabicName: s.arabicName || "",
                  offerings: (s.offerings || []).map(
                    (off: CollectionOffering) => {
                      const resolved = offeringMap.get(off.id?.trim() || "");
                      const vId =
                        off.vendorId ||
                        off.vendorID ||
                        resolved?.vendorId ||
                        resolved?.vendorID ||
                        undefined;
                      return {
                        id: off.id,
                        thumb: pickBestThumb(off.thumb, resolved?.thumb),
                        vendorName: pickBestName(
                          off.vendorName,
                          resolved?.vendorName,
                          "Vendor",
                        ),
                        vendorNameAr: off.vendorNameAr || resolved?.vendorNameAr,
                        offeringName: pickBestName(
                          off.offeringName,
                          resolved?.offeringName,
                          `Offering (${off.id.slice(-6)})`,
                        ),
                        offeringNameAr:
                          off.offeringNameAr || resolved?.offeringNameAr,
                        serviceType:
                          off.serviceType || resolved?.serviceType || "catering",
                        orderCount:
                          off.orderCount ?? resolved?.orderCount ?? 0,
                        vendorId: vId,
                        vendorID: vId,
                      };
                    },
                  ),
                }),
              ),
            );
          } else {
            setSubCategories([
              {
                id: `sub-init-${Date.now()}`,
                englishName: "",
                arabicName: "",
                offerings: [],
              },
            ]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load collection item details.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, itemId]);

  async function handleEnImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setEnglishImage(dataUrl);
    } catch {
      setError("Could not read English image file.");
    }
  }

  async function handleArImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setArabicImage(dataUrl);
    } catch {
      setError("Could not read Arabic image file.");
    }
  }

  function handleClearEnImage() {
    setEnglishImage("");
    if (enFileInputRef.current) enFileInputRef.current.value = "";
  }

  function handleClearArImage() {
    setArabicImage("");
    if (arFileInputRef.current) arFileInputRef.current.value = "";
  }

  function updateSubCategory(
    index: number,
    field: "englishName" | "arabicName",
    value: string,
  ) {
    setSubCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addSubCategory() {
    setSubCategories((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        englishName: "",
        arabicName: "",
        offerings: [],
      },
    ]);
  }

  function removeSubCategory(index: number) {
    if (subCategories.length <= 1) return;
    setSubCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSaveOfferingsForSub(offerings: CollectionOffering[]) {
    if (offeringModalIndex === null) return;
    setSubCategories((prev) => {
      const next = [...prev];
      next[offeringModalIndex] = {
        ...next[offeringModalIndex],
        offerings,
      };
      return next;
    });
    setOfferingModalIndex(null);
  }

  function removeOfferingFromSub(subIndex: number, offeringId: string) {
    setSubCategories((prev) => {
      const next = [...prev];
      next[subIndex] = {
        ...next[subIndex],
        offerings: next[subIndex].offerings.filter((o) => o.id !== offeringId),
      };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!englishName.trim()) {
      setError("English Name is required.");
      return;
    }
    if (!arabicName.trim()) {
      setError("Arabic Name is required.");
      return;
    }
    if (!englishImage.trim()) {
      setError("English Image is required.");
      return;
    }
    if (!arabicImage.trim()) {
      setError("Arabic Image is required.");
      return;
    }

    if (subCategories.length === 0) {
      setError("At least one sub category is required.");
      return;
    }

    for (let i = 0; i < subCategories.length; i++) {
      const sub = subCategories[i];
      if (!sub.englishName.trim()) {
        setError(`Sub category #${i + 1} English Name is required.`);
        return;
      }
      if (!sub.arabicName.trim()) {
        setError(`Sub category #${i + 1} Arabic Name is required.`);
        return;
      }
      if (sub.offerings.length === 0) {
        setError(
          `Sub category "${sub.englishName || `#${i + 1}`}" requires at least one offering selected.`,
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CollectionItemFormData = {
        id: itemId,
        collectionId,
        englishName: englishName.trim(),
        arabicName: arabicName.trim(),
        englishImage: englishImage.trim(),
        arabicImage: arabicImage.trim(),
        subCategories: subCategories.map((s) => ({
          id: s.id,
          englishName: s.englishName.trim(),
          arabicName: s.arabicName.trim(),
          offerings: s.offerings,
        })),
      };

      await saveCollectionItem(payload);
      router.push("/collections");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save collection item.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-60 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const isValid =
    englishName.trim() &&
    arabicName.trim() &&
    englishImage.trim() &&
    arabicImage.trim() &&
    subCategories.every(
      (s) => s.englishName.trim() && s.arabicName.trim() && s.offerings.length > 0,
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/collections"
            className="hover:text-brand transition font-medium"
          >
            Collections
          </Link>
          <span>/</span>
          {collection && (
            <span className="text-slate-800 font-semibold">
              {collection.englishName}
            </span>
          )}
        </div>
        <Link
          href="/collections"
          className="text-xs font-semibold text-brand hover:underline"
        >
          ← Back to Collections
        </Link>
      </div>

      {/* Main Title Block */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Collection Item
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 uppercase">
            {isEdit ? "Edit Collection Item" : "New Collection Item"}{" "}
            {!isValid && (
              <span className="text-brand font-medium text-sm normal-case">
                (incomplete)
              </span>
            )}
          </h1>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Item Details &amp; Images
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* English Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                English Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="e.g. Top 10 items"
                className={inputClass}
              />
            </div>

            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                Arabic Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
                placeholder="مثال: أهم 10 عناصر"
                className={inputClass}
              />
            </div>

            {/* English Image */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                English Image <span className="text-brand">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearEnImage}
                  title="Clear image"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold"
                >
                  ✕
                </button>
                <div className="relative flex-1">
                  <input
                    ref={enFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEnImageChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 border border-slate-200 p-1.5 rounded-lg bg-white"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Image size should be 900px x 500px and less than 200kb
              </p>

              {englishImage?.trim() && (
                <div className="mt-2.5 relative inline-block">
                  <img
                    src={englishImage.trim()}
                    alt="English preview"
                    className="h-20 w-36 object-cover rounded-lg border border-slate-200 shadow-xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        DEFAULT_OFFERING_PLACEHOLDER;
                    }}
                  />
                </div>
              )}
            </div>

            {/* Arabic Image */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                Arabic Image <span className="text-brand">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearArImage}
                  title="Clear image"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold"
                >
                  ✕
                </button>
                <div className="relative flex-1">
                  <input
                    ref={arFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleArImageChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 border border-slate-200 p-1.5 rounded-lg bg-white"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Image size should be 900px x 500px and less than 200kb
              </p>

              {arabicImage?.trim() && (
                <div className="mt-2.5 relative inline-block">
                  <img
                    src={arabicImage.trim()}
                    alt="Arabic preview"
                    className="h-20 w-36 object-cover rounded-lg border border-slate-200 shadow-xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        DEFAULT_OFFERING_PLACEHOLDER;
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Sub Categories &amp; Offerings
            </h2>
            <span className="text-xs text-slate-500">
              Each sub-category must have at least one offering selected
            </span>
          </div>

          {subCategories.map((sub, index) => (
            <div
              key={sub.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                    TAB #{index + 1}
                  </span>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Sub Category ({sub.englishName || "Untitled"})
                  </h3>
                </div>
                {subCategories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubCategory(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                  >
                    Remove Tab
                  </button>
                )}
              </div>

              {/* Sub Category Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                    English Name <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    value={sub.englishName}
                    onChange={(e) =>
                      updateSubCategory(index, "englishName", e.target.value)
                    }
                    placeholder="e.g. Top 10 items"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
                    Arabic Name <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={sub.arabicName}
                    onChange={(e) =>
                      updateSubCategory(index, "arabicName", e.target.value)
                    }
                    placeholder="مثال: أهم 10 عناصر"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Select Offerings */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-2.5">
                  Select Offerings <span className="text-brand">*</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Brand dashed plus button matching Red theme spec */}
                  <button
                    type="button"
                    onClick={() => setOfferingModalIndex(index)}
                    title="Select offerings"
                    className="flex h-16 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand/30 bg-brand-soft text-brand hover:border-brand hover:bg-[#f8dede] transition shadow-xs group"
                  >
                    <span className="text-2xl font-light leading-none group-hover:scale-110 transition-transform">
                      +
                    </span>
                    <span className="text-[10px] font-semibold mt-1">Add</span>
                  </button>

                  {/* Selected Offerings List */}
                  {sub.offerings.map((offering) => {
                    const thumbUrl =
                      offering.thumb?.trim() || DEFAULT_OFFERING_PLACEHOLDER;
                    return (
                      <div
                        key={offering.id}
                        className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-xs max-w-xs hover:border-slate-300 transition"
                      >
                        <img
                          src={thumbUrl}
                          alt={offering.offeringName || "Offering"}
                          className="h-12 w-16 object-cover rounded-lg border border-slate-200 bg-slate-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_OFFERING_PLACEHOLDER;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {offering.offeringName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {offering.vendorName}
                          </p>
                          <p className="text-[10px] font-medium text-brand">
                            {offering.serviceType} • {offering.orderCount} orders
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOfferingFromSub(index, offering.id)}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-red-500 transition"
                          title="Remove offering"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {sub.offerings.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    * At least one offering must be added to this sub-category. Click &quot;+ Add&quot; to select.
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Add New Sub Category Button (Brand soft theme) */}
          <div>
            <button
              type="button"
              onClick={addSubCategory}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-soft px-4 py-2 text-xs font-semibold text-brand hover:bg-[#f8dede] transition shadow-xs"
            >
              <span>+</span> Add New Sub Category
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/collections"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Create Collection Item"}
          </button>
        </div>
      </form>

      {/* Offerings Selector Modal */}
      {offeringModalIndex !== null && (
        <OfferingSelectorModal
          isOpen={offeringModalIndex !== null}
          initialSelected={subCategories[offeringModalIndex]?.offerings || []}
          onClose={() => setOfferingModalIndex(null)}
          onSave={handleSaveOfferingsForSub}
        />
      )}
    </div>
  );
}
