"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublishedStatusInline } from "@/components/ui/PublishedStatus";
import {
  CollectionThumb,
  ConfirmDialog,
} from "@/components/popular-collections/PopularCollectionsView";
import { usePopularCollection } from "@/hooks/usePopularCollection";
import {
  collectionRoutes,
  type CollectionSection,
} from "@/lib/collection-routes";
import {
  deletePopularCollection,
  deletePopularSubCollection,
  getServiceCategoryLabel,
} from "@/lib/popular-collections";
import type { PopularSubCollection } from "@/lib/types";

export default function PopularCollectionDetailView({
  collectionId,
  section = "popular",
}: {
  collectionId: string;
  section?: CollectionSection;
}) {
  const routes = collectionRoutes(section);
  const router = useRouter();
  const { collection, loading, error, reload } =
    usePopularCollection(collectionId);
  const [deleteCollection, setDeleteCollection] = useState(false);
  const [deleteSub, setDeleteSub] = useState<PopularSubCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmDeleteCollection() {
    setBusy(true);
    setActionError(null);
    try {
      await deletePopularCollection(collectionId);
      router.push(routes.listHref);
    } catch {
      setActionError("Could not delete collection.");
      setBusy(false);
    }
  }

  async function confirmDeleteSub() {
    if (!deleteSub) return;
    setBusy(true);
    setActionError(null);
    try {
      await deletePopularSubCollection(collectionId, deleteSub.id);
      setMessage(`"${deleteSub.englishName}" was deleted.`);
      setDeleteSub(null);
      reload();
    } catch {
      setActionError("Could not delete sub-collection.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Collection not found."}
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
    <div className="space-y-5">
      <div>
        <Link
          href={routes.listHref}
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to collections
        </Link>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CollectionThumb
            src={collection.imageUrl}
            alt={collection.englishName}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {collection.englishName}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500" dir="rtl">
              {collection.arabicName}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PublishedStatusInline published={collection.published} />
              {collection.popular ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Popular
                </span>
              ) : null}
              <span className="text-xs text-slate-500">
                {getServiceCategoryLabel(collection.serviceCategoryId)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={routes.edit(collection.id)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit collection
            </Link>
            <button
              type="button"
              onClick={() => setDeleteCollection(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Sub-collections
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Nested groups inside this collection. Each can be published,
              edited, or removed.
            </p>
          </div>
          <Link
            href={routes.subNew(collection.id)}
            className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
          >
            Add sub-collection
          </Link>
        </div>

        {collection.subCollections.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">
              No sub-collections yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              After saving a collection you can add items to it here.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Published</th>
                    <th className="px-5 py-3.5">English name</th>
                    <th className="px-5 py-3.5">Arabic name</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collection.subCollections.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <PublishedStatusInline published={sub.published} />
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {sub.englishName}
                      </td>
                      <td className="px-5 py-4 text-slate-600" dir="rtl">
                        {sub.arabicName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={routes.subEdit(collection.id, sub.id)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteSub(sub)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {collection.subCollections.map((sub) => (
                <article
                  key={sub.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <PublishedStatusInline published={sub.published} />
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {sub.englishName}
                  </p>
                  <p className="text-sm text-slate-500" dir="rtl">
                    {sub.arabicName}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={routes.subEdit(collection.id, sub.id)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteSub(sub)}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {deleteCollection ? (
        <ConfirmDialog
          title="Delete collection?"
          body={`This will remove "${collection.englishName}" and all of its sub-collections.`}
          busy={busy}
          confirmLabel="Delete"
          onCancel={() => setDeleteCollection(false)}
          onConfirm={() => void confirmDeleteCollection()}
        />
      ) : null}

      {deleteSub ? (
        <ConfirmDialog
          title="Delete sub-collection?"
          body={`This will remove "${deleteSub.englishName}" from ${collection.englishName}.`}
          busy={busy}
          confirmLabel="Delete"
          onCancel={() => setDeleteSub(null)}
          onConfirm={() => void confirmDeleteSub()}
        />
      ) : null}
    </div>
  );
}
