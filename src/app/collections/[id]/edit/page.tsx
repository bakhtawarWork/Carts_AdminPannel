"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchCollectionById, saveCollection } from "@/lib/collections";

export default function EditCollectionPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();

  const [englishName, setEnglishName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const col = await fetchCollectionById(id);
        if (cancelled) return;
        if (!col) {
          setError("Collection not found.");
          return;
        }
        setEnglishName(col.englishName);
        setArabicName(col.arabicName);
        setPublished(col.published);
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
  }, [id]);

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

    setSubmitting(true);
    setError(null);
    try {
      await saveCollection({
        id,
        englishName: englishName.trim(),
        arabicName: arabicName.trim(),
        published,
      });
      router.push("/collections");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update collection.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/collections"
          className="hover:text-brand transition font-medium"
        >
          Collections
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Edit</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Edit Collection
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Edit Collection Details
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the collection names and published status.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
              English Name <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              placeholder="e.g. EID SPECIALS"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
              Arabic Name <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              dir="rtl"
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              placeholder="مثال: تشكيلة العيد"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
              />
              <span className="text-sm font-medium text-slate-700">
                Published
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <Link
              href="/collections"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
