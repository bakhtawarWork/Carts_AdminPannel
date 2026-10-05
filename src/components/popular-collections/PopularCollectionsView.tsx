"use client";

import Link from "next/link";
import { useState } from "react";
import { PublishedStatusInline } from "@/components/ui/PublishedStatus";
import { usePopularCollections } from "@/hooks/usePopularCollections";
import {
  collectionRoutes,
  type CollectionSection,
} from "@/lib/collection-routes";
import {
  deletePopularCollection,
  getServiceCategoryLabel,
} from "@/lib/popular-collections";
import type { PopularCollection } from "@/lib/types";

export default function PopularCollectionsView({
  section = "popular",
}: {
  section?: CollectionSection;
}) {
  const routes = collectionRoutes(section);
  const { collections, loading, error, reload } = usePopularCollections();
  const [deleteTarget, setDeleteTarget] = useState<PopularCollection | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);

    try {
      const deleted = await deletePopularCollection(deleteTarget.id);
      if (!deleted) {
        setActionError("Collection not found.");
        return;
      }
      setMessage(`"${deleteTarget.englishName}" was deleted.`);
      setDeleteTarget(null);
      await reload();
    } catch {
      setActionError("Could not delete collection.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            {routes.sectionLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {routes.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Create collections, then open one to add, edit, or remove its
            sub-collections.
          </p>
        </div>
        <Link
          href={routes.newHref}
          className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Add collection
        </Link>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error || actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">
              No collections yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add a collection first. Sub-collections can be added after saving.
            </p>
            <Link
              href={routes.newHref}
              className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Add collection
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {collections.map((collection) => (
              <li key={collection.id} className="p-4 sm:px-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <Link
                    href={routes.detail(collection.id)}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-xl p-1 -m-1 transition hover:bg-slate-50"
                  >
                    <CollectionThumb
                      src={collection.imageUrl}
                      alt={collection.englishName}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-slate-900">
                        {collection.englishName}
                      </p>
                      <p className="text-sm text-slate-500" dir="rtl">
                        {collection.arabicName}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <PublishedStatusInline published={collection.published} />
                        {collection.popular ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Popular
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-500">
                          {getServiceCategoryLabel(collection.serviceCategoryId)}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {collection.subCollections.length} sub-collection
                          {collection.subCollections.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={routes.edit(collection.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(collection);
                        setActionError(null);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete collection?"
          body={`This will remove "${deleteTarget.englishName}" and all of its sub-collections.`}
          busy={deleting}
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}

export function CollectionThumb({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        No image
      </div>
    );
  }

  return (
    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  busy,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  busy: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/40"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{body}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
