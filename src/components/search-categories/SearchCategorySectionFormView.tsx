"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEmptySearchCategoryItem,
  createEmptySearchCategorySectionForm,
  fetchSearchCategorySectionForm,
  formatSearchCategoryVendorLabel,
  saveSearchCategorySectionForm,
  validateSearchCategorySectionForm,
} from "@/lib/search-category-sections";
import { fetchVendors } from "@/lib/vendors";
import {
  createGalleryImageId,
  readImageFileAsDataUrl,
  validateOfferingImageFile,
} from "@/lib/offering-image-upload";
import type {
  SearchCategoryItem,
  SearchCategorySectionFormData,
  SearchCategoryVendorOption,
} from "@/lib/types";

const VENDOR_PAGE_SIZE = 50;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type SearchCategorySectionFormViewProps = {
  sectionId?: string;
};

export default function SearchCategorySectionFormView({
  sectionId,
}: SearchCategorySectionFormViewProps) {
  const router = useRouter();
  const isEdit = Boolean(sectionId);
  const [form, setForm] = useState<SearchCategorySectionFormData>(
    createEmptySearchCategorySectionForm(),
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<SearchCategoryVendorOption[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsLoadingMore, setVendorsLoadingMore] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorsHasMore, setVendorsHasMore] = useState(true);
  const vendorsPageRef = useRef(0);
  const vendorsRequestRef = useRef(false);
  const vendorsRef = useRef<SearchCategoryVendorOption[]>([]);

  const loadVendorPage = useCallback(async (page: number) => {
    if (vendorsRequestRef.current) return;
    vendorsRequestRef.current = true;
    if (page === 1) {
      setVendorsLoading(true);
      setVendorsError(null);
    } else {
      setVendorsLoadingMore(true);
    }

    try {
      const response = await fetchVendors({
        tab: "vendors",
        page,
        pageSize: VENDOR_PAGE_SIZE,
      });
      const mapped = response.items.map((vendor) => ({
        id: vendor.id,
        englishName: vendor.englishName,
        arabicName: vendor.arabicName,
      }));

      const base = page === 1 ? [] : vendorsRef.current;
      const seen = new Set(base.map((vendor) => vendor.id));
      const next = [...base];
      for (const vendor of mapped) {
        if (seen.has(vendor.id)) continue;
        seen.add(vendor.id);
        next.push(vendor);
      }
      vendorsRef.current = next;
      setVendors(next);
      setVendorsHasMore(mapped.length > 0 && next.length < response.total);
      vendorsPageRef.current = page;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not load vendors.";
      if (page === 1) {
        vendorsRef.current = [];
        setVendors([]);
        setVendorsHasMore(false);
      }
      setVendorsError(message);
    } finally {
      vendorsRequestRef.current = false;
      setVendorsLoading(false);
      setVendorsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadVendorPage(1);
  }, [loadVendorPage]);

  const loadMoreVendors = useCallback(() => {
    if (!vendorsHasMore || vendorsRequestRef.current) return;
    void loadVendorPage(vendorsPageRef.current + 1);
  }, [loadVendorPage, vendorsHasMore]);

  useEffect(() => {
    if (!sectionId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSearchCategorySectionForm(sectionId!);
        if (cancelled) return;
        if (!data) {
          setError("Search category section not found.");
          return;
        }
        setForm(data);
        setActiveCategoryId(data.categories[0]?.id ?? null);
      } catch {
        if (!cancelled) setError("Could not load search category section.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  useEffect(() => {
    if (!activeCategoryId && form.categories[0]) {
      setActiveCategoryId(form.categories[0].id);
      return;
    }
    if (
      activeCategoryId &&
      !form.categories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId(form.categories[0]?.id ?? null);
    }
  }, [activeCategoryId, form.categories]);

  const activeCategory =
    form.categories.find((category) => category.id === activeCategoryId) ??
    form.categories[0] ??
    null;

  const activeIndex = activeCategory
    ? form.categories.findIndex((category) => category.id === activeCategory.id)
    : -1;

  function updateSection<K extends keyof SearchCategorySectionFormData>(
    key: K,
    value: SearchCategorySectionFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function updateCategory(
    categoryId: string,
    updater: (category: SearchCategoryItem) => SearchCategoryItem,
  ) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === categoryId ? updater(category) : category,
      ),
    }));
    setError(null);
  }

  function addCategory() {
    const newItem = createEmptySearchCategoryItem();
    setForm((prev) => ({
      ...prev,
      categories: [...prev.categories, newItem],
    }));
    setActiveCategoryId(newItem.id);
    setError(null);
  }

  function removeCategory(categoryId: string) {
    const remaining = form.categories.filter(
      (category) => category.id !== categoryId,
    );
    const nextCategories =
      remaining.length > 0 ? remaining : [createEmptySearchCategoryItem()];

    if (activeCategoryId === categoryId) {
      setActiveCategoryId(nextCategories[nextCategories.length - 1].id);
    }

    setForm((prev) => ({
      ...prev,
      categories: nextCategories,
    }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateSearchCategorySectionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveSearchCategorySectionForm(form);
      router.push("/search-categories");
    } catch {
      setError("Could not save search category section. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading search category section…
      </div>
    );
  }

  if (isEdit && error && !form.id) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-12 text-center">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Link
          href="/search-categories"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <section className="mb-3 shrink-0 rounded-xl border border-slate-200/80 bg-white px-3 py-3 shadow-sm sm:px-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Field label="Section English Name" compact>
              <input
                type="text"
                value={form.englishName}
                onChange={(event) =>
                  updateSection("englishName", event.target.value)
                }
                placeholder="English name"
                className={inputClass}
              />
            </Field>
            <Field label="Section Arabic Name" compact>
              <input
                type="text"
                value={form.arabicName}
                onChange={(event) =>
                  updateSection("arabicName", event.target.value)
                }
                placeholder="Arabic name"
                dir="auto"
                className={inputClass}
              />
            </Field>
            <label className="inline-flex h-[42px] items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  updateSection("published", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
              />
              Section published
            </label>
          </div>
        </section>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </p>
              <button
                type="button"
                onClick={addCategory}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
              >
                + Add
              </button>
            </div>
            <div className="light-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
              {form.categories.map((category, index) => {
                const active = category.id === activeCategory?.id;
                const label =
                  category.englishName.trim() || `Category ${index + 1}`;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`mb-1 flex w-full items-start justify-between gap-2 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-brand text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          active ? "text-white/80" : "text-slate-500"
                        }`}
                        dir="auto"
                      >
                        {category.arabicName.trim() || "—"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : category.vendorIds.length > 0
                            ? "bg-brand/10 text-brand"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {category.vendorIds.length} vendor
                      {category.vendorIds.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            {activeCategory ? (
              <ActiveCategoryEditor
                category={activeCategory}
                index={activeIndex}
                vendors={vendors}
                vendorsLoading={vendorsLoading}
                vendorsLoadingMore={vendorsLoadingMore}
                vendorsError={vendorsError}
                vendorsHasMore={vendorsHasMore}
                onLoadMoreVendors={loadMoreVendors}
                canRemove={form.categories.length > 1}
                onChange={(updater) =>
                  updateCategory(activeCategory.id, updater)
                }
                onRemove={() => removeCategory(activeCategory.id)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
                Add a category to get started.
              </div>
            )}
          </section>
        </div>

        {error ? (
          <p className="mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 pt-2">
          <Link
            href="/search-categories"
            className="mr-auto inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </Link>
          <Link
            href="/search-categories"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <CancelIcon />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SaveIcon />
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ActiveCategoryEditor({
  category,
  index,
  vendors,
  vendorsLoading,
  vendorsLoadingMore,
  vendorsError,
  vendorsHasMore,
  onLoadMoreVendors,
  canRemove,
  onChange,
  onRemove,
}: {
  category: SearchCategoryItem;
  index: number;
  vendors: SearchCategoryVendorOption[];
  vendorsLoading: boolean;
  vendorsLoadingMore: boolean;
  vendorsError: string | null;
  vendorsHasMore: boolean;
  onLoadMoreVendors: () => void;
  canRemove: boolean;
  onChange: (updater: (category: SearchCategoryItem) => SearchCategoryItem) => void;
  onRemove: () => void;
}) {
  const vendorListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = vendorListRef.current;
    if (!list || vendorsLoading || vendorsLoadingMore || !vendorsHasMore) return;
    if (list.scrollHeight <= list.clientHeight + 8) {
      onLoadMoreVendors();
    }
  }, [
    vendors.length,
    vendorsLoading,
    vendorsLoadingMore,
    vendorsHasMore,
    onLoadMoreVendors,
  ]);

  function handleVendorScroll(event: React.UIEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const reachedEnd =
      list.scrollTop + list.clientHeight >= list.scrollHeight - 24;
    if (reachedEnd) onLoadMoreVendors();
  }
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function toggleVendor(vendorId: string) {
    onChange((current) => ({
      ...current,
      vendorIds: current.vendorIds.includes(vendorId)
        ? current.vendorIds.filter((id) => id !== vendorId)
        : [...current.vendorIds, vendorId],
    }));
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateOfferingImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onChange((current) => ({
        ...current,
        id: current.id || createGalleryImageId(),
        imageUrl: dataUrl,
      }));
    } catch {
      setUploadError("Could not read image file.");
    } finally {
      setUploading(false);
    }
  }

  const title =
    category.englishName.trim() || `Category ${index + 1}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
          <p className="truncate text-xs text-slate-500" dir="auto">
            {category.arabicName.trim() || "Arabic name not set"}
          </p>
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <DeleteIcon />
            Remove
          </button>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 px-4 py-4 sm:px-5 xl:grid-cols-2 xl:items-stretch">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="English Name" compact>
              <input
                type="text"
                value={category.englishName}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    englishName: event.target.value,
                  }))
                }
                placeholder="English name"
                className={inputClass}
              />
            </Field>
            <Field label="Arabic Name" compact>
              <input
                type="text"
                value={category.arabicName}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    arabicName: event.target.value,
                  }))
                }
                placeholder="Arabic name"
                dir="auto"
                className={inputClass}
              />
            </Field>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={category.published}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  published: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            Published?
          </label>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-600">
              Category image
            </p>
            <div className="flex items-start gap-3">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {category.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.imageUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="px-2 text-center text-[11px] text-slate-400">
                    No image
                  </span>
                )}
              </div>
              <label className="flex min-h-[6rem] flex-1 cursor-pointer flex-col justify-center gap-0.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 transition hover:border-brand/40 hover:bg-brand-soft/10">
                <span className="text-sm font-medium text-slate-700">
                  {uploading ? "Uploading…" : "Choose image"}
                </span>
                <span className="text-xs text-slate-500">
                  JPG, PNG, WebP, or GIF · max 5MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
            {uploadError ? (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Vendors
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Select vendors linked to this category only.
          </p>
          <ul
            ref={vendorListRef}
            onScroll={handleVendorScroll}
            className="scrollbar-hide mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain rounded-lg border border-slate-200 bg-slate-50/50 p-1.5"
          >
            {vendorsLoading && vendors.length === 0 ? (
              <li className="px-2.5 py-3 text-sm text-slate-500">
                Loading vendors…
              </li>
            ) : vendorsError && vendors.length === 0 ? (
              <li className="px-2.5 py-3 text-sm text-red-600">{vendorsError}</li>
            ) : vendors.length === 0 ? (
              <li className="px-2.5 py-3 text-sm text-slate-500">
                No vendors found.
              </li>
            ) : (
              vendors.map((vendor) => {
                const selected = category.vendorIds.includes(vendor.id);
                return (
                  <li key={vendor.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 transition ${
                        selected ? "bg-brand/5 ring-1 ring-brand/15" : "hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleVendor(vendor.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                      />
                      <span className="min-w-0 text-sm text-slate-800" dir="auto">
                        {formatSearchCategoryVendorLabel(vendor)}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
            {vendorsLoadingMore ? (
              <li className="px-2.5 py-3 text-sm text-slate-500">
                Loading more vendors…
              </li>
            ) : null}
            {vendorsError && vendors.length > 0 ? (
              <li className="px-2.5 py-2 text-xs text-red-600">{vendorsError}</li>
            ) : null}
          </ul>
          <p className="mt-2 shrink-0 text-xs text-slate-500">
            {category.vendorIds.length} vendor
            {category.vendorIds.length === 1 ? "" : "s"} selected
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span
        className={`block text-xs font-medium uppercase tracking-wide text-slate-600 ${
          compact ? "mb-1.5" : "mb-2"
        }`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function CancelIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
