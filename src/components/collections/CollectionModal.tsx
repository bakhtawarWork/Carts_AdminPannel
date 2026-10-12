"use client";

import { useState, useEffect } from "react";
import type { Collection, CollectionFormData } from "@/lib/collections-types";

type CollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CollectionFormData) => Promise<void>;
  collection?: Collection | null;
};

export default function CollectionModal({
  isOpen,
  onClose,
  onSave,
  collection,
}: CollectionModalProps) {
  const [englishName, setEnglishName] = useState("");
  const [arabicName, setArabicName] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setEnglishName(collection.englishName);
        setArabicName(collection.arabicName);
        setPublished(collection.published);
      } else {
        setEnglishName("");
        setArabicName("");
        setPublished(true);
      }
      setError(null);
    }
  }, [isOpen, collection]);

  if (!isOpen) return null;

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
      await onSave({
        id: collection?.id,
        englishName: englishName.trim(),
        arabicName: arabicName.trim(),
        published,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save collection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="border-b border-slate-100 bg-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {collection ? "Edit Collection" : "Create New Collection"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-700 mb-1.5">
              English Name <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              placeholder="e.g. EID SPECIALS"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              autoFocus
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
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
            <p className="mt-1 text-xs text-slate-500">
              Visible on client applications when published.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : collection
                  ? "Update Collection"
                  : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
