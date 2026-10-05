"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollectionThumb } from "@/components/popular-collections/PopularCollectionsView";
import {
  collectionRoutes,
  type CollectionSection,
} from "@/lib/collection-routes";
import {
  collectionToFormData,
  createEmptyCollectionForm,
  fetchPopularCollectionById,
  POPULAR_COLLECTION_SERVICE_OPTIONS,
  savePopularCollectionForm,
  validateCollectionForm,
} from "@/lib/popular-collections";
import {
  readImageFileAsDataUrl,
  validateOfferingImageFile,
} from "@/lib/offering-image-upload";
import type { PopularCollectionFormData } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function PopularCollectionFormView({
  collectionId,
  section = "popular",
}: {
  collectionId?: string;
  section?: CollectionSection;
}) {
  const routes = collectionRoutes(section);
  const router = useRouter();
  const isEdit = Boolean(collectionId);
  const [form, setForm] = useState<PopularCollectionFormData>(
    createEmptyCollectionForm(),
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPopularCollectionById(collectionId!);
        if (cancelled) return;
        if (!data) {
          setError("Collection not found.");
          return;
        }
        setForm(collectionToFormData(data));
      } catch {
        if (!cancelled) setError("Could not load collection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  function update<K extends keyof PopularCollectionFormData>(
    key: K,
    value: PopularCollectionFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function onImageChange(file: File | undefined) {
    if (!file) return;
    const validation = validateOfferingImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    try {
      const url = await readImageFileAsDataUrl(file);
      update("imageUrl", url);
    } catch {
      setError("Could not read image file.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateCollectionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await savePopularCollectionForm(form);
      router.push(routes.detail(saved.id));
    } catch {
      setError("Could not save collection. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (isEdit && error && !form.id) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link
          href={routes.listHref}
          className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
        >
          ← Back to collections
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <Link
          href={form.id ? routes.detail(form.id) : routes.listHref}
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
          {isEdit ? "Edit collection" : "Add collection"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update this collection. Sub-collections are managed on the collection page."
            : "Save the collection first. You can add sub-collections after that."}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              English name
            </span>
            <input
              value={form.englishName}
              onChange={(event) => update("englishName", event.target.value)}
              placeholder="Collection name"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Arabic name
            </span>
            <input
              value={form.arabicName}
              onChange={(event) => update("arabicName", event.target.value)}
              placeholder="اسم المجموعة"
              dir="rtl"
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => update("published", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            Published
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(event) => update("popular", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            Popular
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Service category
          </span>
          <select
            value={form.serviceCategoryId}
            onChange={(event) => update("serviceCategoryId", event.target.value)}
            className={inputClass}
          >
            <option value="">Select service category</option>
            {POPULAR_COLLECTION_SERVICE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.englishName} / {option.arabicName}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <CollectionThumb src={form.imageUrl} alt={form.englishName || "Collection"} />
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Image
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => void onImageChange(event.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Link
          href={form.id ? routes.detail(form.id) : routes.listHref}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
