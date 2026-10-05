"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collectionRoutes,
  type CollectionSection,
} from "@/lib/collection-routes";
import {
  createEmptySubCollectionForm,
  fetchPopularCollectionById,
  savePopularSubCollectionForm,
  subCollectionToFormData,
  validateSubCollectionForm,
} from "@/lib/popular-collections";
import type { PopularSubCollectionFormData } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function PopularSubCollectionFormView({
  collectionId,
  subId,
  section = "popular",
}: {
  collectionId: string;
  subId?: string;
  section?: CollectionSection;
}) {
  const routes = collectionRoutes(section);
  const router = useRouter();
  const isEdit = Boolean(subId);
  const [parentName, setParentName] = useState("");
  const [form, setForm] = useState<PopularSubCollectionFormData>(
    createEmptySubCollectionForm(collectionId),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const parent = await fetchPopularCollectionById(collectionId);
        if (cancelled) return;
        if (!parent) {
          setError("Collection not found.");
          return;
        }
        setParentName(parent.englishName);
        if (subId) {
          const sub = parent.subCollections.find((entry) => entry.id === subId);
          if (!sub) {
            setError("Sub-collection not found.");
            return;
          }
          setForm(subCollectionToFormData(sub));
        } else {
          setForm(createEmptySubCollectionForm(collectionId));
        }
      } catch {
        if (!cancelled) setError("Could not load sub-collection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, subId]);

  function update<K extends keyof PopularSubCollectionFormData>(
    key: K,
    value: PopularSubCollectionFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateSubCollectionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await savePopularSubCollectionForm(form);
      router.push(routes.detail(collectionId));
    } catch {
      setError("Could not save sub-collection. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error && !form.englishName && isEdit) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link
          href={routes.detail(collectionId)}
          className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
        >
          ← Back to collection
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <Link
          href={routes.detail(collectionId)}
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to {parentName || "collection"}
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
          {isEdit ? "Edit sub-collection" : "Add sub-collection"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? `Update this group inside ${parentName || "the collection"}.`
            : "After saving, you can keep adding more sub-collections from the collection page."}
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
              placeholder="Sub-collection name"
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
              placeholder="اسم المجموعة الفرعية"
              dir="rtl"
              className={inputClass}
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => update("published", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
          />
          Published
        </label>
      </section>

      <div className="flex justify-end gap-2">
        <Link
          href={routes.detail(collectionId)}
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
