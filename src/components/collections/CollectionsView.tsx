"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Collection,
  CollectionFormData,
  CollectionItem,
} from "@/lib/collections-types";
import {
  DEFAULT_OFFERING_PLACEHOLDER,
  deleteCollection,
  deleteCollectionItem,
  fetchCollections,
  saveCollection,
  toggleCollectionPublished,
} from "@/lib/collections";
import CollectionModal from "./CollectionModal";
import CollectionItemDetailModal from "./CollectionItemDetailModal";

export default function CollectionsView() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Collection modal state (create / edit collection)
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Collection | null>(null);

  // View item modal state
  const [viewingItem, setViewingItem] = useState<CollectionItem | null>(null);

  // Delete confirmations
  const [deleteTargetCol, setDeleteTargetCol] = useState<Collection | null>(
    null,
  );
  const [deleteTargetItem, setDeleteTargetItem] = useState<{
    collectionId: string;
    item: CollectionItem;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCollections();
      setCollections(data);
    } catch {
      setError("Failed to load collections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveCollection(formData: CollectionFormData) {
    const saved = await saveCollection(formData);
    setMessage(
      formData.id
        ? `Collection "${saved.englishName}" updated.`
        : `Collection "${saved.englishName}" created successfully.`,
    );
    await loadData();
  }

  async function handleTogglePublished(collection: Collection) {
    const nextState = !collection.published;
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collection.id ? { ...c, published: nextState } : c,
      ),
    );
    try {
      await toggleCollectionPublished(collection.id, nextState);
    } catch {
      // rollback
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collection.id ? { ...c, published: collection.published } : c,
        ),
      );
      setError("Could not update published status.");
    }
  }

  async function confirmDeleteCollection() {
    if (!deleteTargetCol) return;
    setDeleting(true);
    try {
      await deleteCollection(deleteTargetCol.id);
      setMessage(`Collection "${deleteTargetCol.englishName}" was deleted.`);
      setDeleteTargetCol(null);
      await loadData();
    } catch {
      setError("Failed to delete collection.");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDeleteItem() {
    if (!deleteTargetItem) return;
    setDeleting(true);
    try {
      await deleteCollectionItem(
        deleteTargetItem.collectionId,
        deleteTargetItem.item.id,
      );
      setMessage(
        `Collection item "${deleteTargetItem.item.englishName}" was deleted.`,
      );
      setDeleteTargetItem(null);
      await loadData();
    } catch {
      setError("Failed to delete collection item.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header matching Theme */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Collections
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Collections Management
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Create collections with names and published status, then add collection items with linked offerings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCol(null);
            setIsColModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-hover"
        >
          <span className="text-base leading-none">+</span> Add Collection
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-brand hover:text-brand-hover font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200/80 p-6"
            />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-base font-semibold text-slate-900">
            No collections yet
          </p>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Click &quot;Add Collection&quot; to create your first collection with names and published status.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingCol(null);
              setIsColModalOpen(true);
            }}
            className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition shadow-xs"
          >
            + Add Collection
          </button>
        </div>
      ) : (
        /* List of Collections matching red brand theme and refined layout */
        <div className="space-y-8">
          {collections.map((collection) => (
            <CollectionCardSection
              key={collection.id}
              collection={collection}
              onTogglePublished={() => handleTogglePublished(collection)}
              onEdit={() => {
                setEditingCol(collection);
                setIsColModalOpen(true);
              }}
              onDelete={() => setDeleteTargetCol(collection)}
              onAddNewItem={() => {
                router.push(`/collections/${collection.id}/items/new`);
              }}
              onViewItem={(item) => setViewingItem(item)}
              onEditItem={(item) => {
                router.push(`/collections/${collection.id}/items/${item.id}/edit`);
              }}
              onDeleteItem={(item) => {
                setDeleteTargetItem({ collectionId: collection.id, item });
              }}
            />
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Collection */}
      <CollectionModal
        isOpen={isColModalOpen}
        collection={editingCol}
        onClose={() => {
          setIsColModalOpen(false);
          setEditingCol(null);
        }}
        onSave={handleSaveCollection}
      />

      {/* Modal: View Collection Item Details */}
      {viewingItem && (
        <CollectionItemDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}

      {/* Confirm Delete Collection Dialog */}
      {deleteTargetCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Delete Collection?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong>&quot;{deleteTargetCol.englishName}&quot;</strong> and all of its
              items? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTargetCol(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteCollection}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                {deleting ? "Deleting..." : "Delete Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Collection Item Dialog */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Delete Collection Item?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove item{" "}
              <strong>&quot;{deleteTargetItem.item.englishName}&quot;</strong> from this
              collection?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTargetItem(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteItem}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                {deleting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Renders each Collection Section matching Red Theme
function CollectionCardSection({
  collection,
  onTogglePublished,
  onEdit,
  onDelete,
  onAddNewItem,
  onViewItem,
  onEditItem,
  onDeleteItem,
}: {
  collection: Collection;
  onTogglePublished: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNewItem: () => void;
  onViewItem: (item: CollectionItem) => void;
  onEditItem: (item: CollectionItem) => void;
  onDeleteItem: (item: CollectionItem) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {/* Collection Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
        {/* Left Title: English / Arabic + Count */}
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
            {collection.englishName}
            <span className="mx-2 text-slate-300">/</span>
            <span dir="rtl" className="text-slate-600 font-medium">
              {collection.arabicName}
            </span>
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {collection.items.length} {collection.items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Right Action Controls: Published Checkbox, Delete, Edit, Add New (Red Theme) */}
        <div className="flex items-center gap-2.5">
          {/* Published checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
            <input
              type="checkbox"
              checked={collection.published}
              onChange={onTogglePublished}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span>Published</span>
          </label>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Delete
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Edit
          </button>

          {/* Add New Button (Brand Red Theme) */}
          <button
            type="button"
            onClick={onAddNewItem}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-hover"
          >
            <span>+</span> Add New
          </button>
        </div>
      </div>

      {/* Collection Items Horizontal List */}
      <div className="relative p-5 sm:p-6 bg-slate-50/50">
        {collection.items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No items in this collection yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add collection items with images and offerings to showcase here.
            </p>
            <button
              type="button"
              onClick={onAddNewItem}
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-hover transition shadow-xs"
            >
              + Add First Collection Item
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex items-stretch gap-4 overflow-x-auto pb-3 scroll-smooth"
              style={{
                scrollbarWidth: "thin",
              }}
            >
              {collection.items.map((item) => (
                <div
                  key={item.id}
                  className="w-64 shrink-0 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    {/* English Image */}
                    <div>
                      <div className="h-32 w-full overflow-hidden rounded-lg bg-slate-100 border border-slate-100">
                        <img
                          src={item.englishImage?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                          alt={item.englishName || "Collection item"}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_OFFERING_PLACEHOLDER;
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-center text-xs font-semibold uppercase text-slate-800 truncate">
                        {item.englishName}
                      </p>
                    </div>

                    {/* Arabic Image */}
                    <div>
                      <div className="h-32 w-full overflow-hidden rounded-lg bg-slate-100 border border-slate-100">
                        <img
                          src={item.arabicImage?.trim() || item.englishImage?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                          alt={item.arabicName || "Collection item"}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_OFFERING_PLACEHOLDER;
                          }}
                        />
                      </div>
                      <p
                        dir="rtl"
                        className="mt-1.5 text-center text-xs font-semibold text-slate-800 truncate"
                      >
                        {item.arabicName}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: View, Edit, Delete (Red / Brand / Slate styling) */}
                  <div className="mt-3.5 flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onViewItem(item)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="flex-1 rounded-lg border border-brand/20 bg-brand-soft py-1.5 text-center text-xs font-semibold text-brand hover:bg-[#f8dede] transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item)}
                      className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-center text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Navigation Arrows */}
            {collection.items.length > 3 && (
              <div className="flex items-center justify-between pt-3 px-1">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  aria-label="Scroll left"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 shadow-xs transition"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  aria-label="Scroll right"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 shadow-xs transition"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
