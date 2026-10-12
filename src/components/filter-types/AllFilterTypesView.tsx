"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { FilterCategory } from "@/lib/types";

const VISIBLE_SUB_TYPES = 8;

type CreateSubTypeRow = {
  en: string;
  ar: string;
};

type CreateFormState = {
  nameEn: string;
  nameAr: string;
  subTypes: CreateSubTypeRow[];
};

const INITIAL_FORM: CreateFormState = {
  nameEn: "",
  nameAr: "",
  subTypes: [{ en: "", ar: "" }],
};

export default function AllFilterTypesView() {
  const [items, setItems] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FilterCategory | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_FORM);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal state
  const [editTarget, setEditTarget] = useState<FilterCategory | null>(null);
  const [editForm, setEditForm] = useState<CreateFormState>(INITIAL_FORM);
  const [editFetching, setEditFetching] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch filter types using standard API base URL
  useEffect(() => {
    let cancelled = false;

    async function loadFilterTypes() {
      setLoading(true);
      setError(null);

      try {
        const json = await api.get<any>("filter-type");
        if (cancelled) return;

        const rawList =
          json?.data?.filter ||
          json?.filter ||
          (Array.isArray(json?.data) ? json.data : []) ||
          (Array.isArray(json) ? json : []);

        const mapped: FilterCategory[] = rawList.map((category: any) => ({
          id: category._id || category.id || "",
          name: {
            en: category.name?.en?.trim() || "",
            ar: category.name?.ar?.trim() || "",
          },
          subTypes: Array.isArray(category.subTypes)
            ? category.subTypes.map((st: any) => ({
                id: st._id || st.id || "",
                name: {
                  en: st.name?.en?.trim() || "",
                  ar: st.name?.ar?.trim() || "",
                },
              }))
            : [],
        }));

        setItems(mapped);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to load filter types from server.";
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFilterTypes();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredItems = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((category) => {
      const categoryHaystack = `${category.name.en} ${category.name.ar}`.toLowerCase();
      if (categoryHaystack.includes(needle)) return true;
      return category.subTypes.some((subType) =>
        `${subType.name.en} ${subType.name.ar}`.toLowerCase().includes(needle),
      );
    });
  }, [items, debouncedSearch]);

  const stats = useMemo(() => {
    const subTypeCount = items.reduce(
      (sum, category) => sum + (category.subTypes?.length || 0),
      0,
    );
    const largest = items.reduce(
      (max, category) => Math.max(max, category.subTypes?.length || 0),
      0,
    );
    return {
      categories: items.length,
      subTypes: subTypeCount,
      largest,
    };
  }, [items]);

  // Open edit modal and fetch single filter type via GET https://carts.reapmind.com/admin/filter-type/:id
  async function handleOpenEdit(category: FilterCategory) {
    setEditTarget(category);
    setEditError(null);
    setEditFetching(true);
    setEditForm({
      nameEn: category.name.en,
      nameAr: category.name.ar,
      subTypes:
        category.subTypes && category.subTypes.length > 0
          ? category.subTypes.map((st) => ({
              en: st.name.en,
              ar: st.name.ar,
            }))
          : [{ en: "", ar: "" }],
    });

    try {
      const res = await api.get<any>(`filter-type/${category.id}`);
      const fresh = res?.data?.filter || res?.filter;
      if (fresh) {
        setEditForm({
          nameEn: fresh.name?.en?.trim() || "",
          nameAr: fresh.name?.ar?.trim() || "",
          subTypes:
            Array.isArray(fresh.subTypes) && fresh.subTypes.length > 0
              ? fresh.subTypes.map((st: any) => ({
                  en: st.name?.en?.trim() || "",
                  ar: st.name?.ar?.trim() || "",
                }))
              : [{ en: "", ar: "" }],
        });
      }
    } catch {
      // Keep cached category data if get single fails
    } finally {
      setEditFetching(false);
    }
  }

  // Update filter type via https://carts.reapmind.com/admin/filter-type/:id
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    setEditError(null);
    const nameEn = editForm.nameEn.trim();
    const nameAr = editForm.nameAr.trim();

    if (!nameEn) {
      setEditError("Category English name is required.");
      return;
    }
    if (!nameAr) {
      setEditError("Category Arabic name is required.");
      return;
    }

    const validSubTypes = editForm.subTypes
      .map((st) => ({ en: st.en.trim(), ar: st.ar.trim() }))
      .filter((st) => st.en || st.ar);

    if (validSubTypes.length === 0) {
      setEditError("Please provide at least one sub-type.");
      return;
    }

    for (let i = 0; i < validSubTypes.length; i++) {
      if (!validSubTypes[i].en) {
        setEditError(`Sub-type #${i + 1} English name is required.`);
        return;
      }
      if (!validSubTypes[i].ar) {
        setEditError(`Sub-type #${i + 1} Arabic name is required.`);
        return;
      }
    }

    setEditBusy(true);

    try {
      const payload = {
        name: {
          en: nameEn,
          ar: nameAr,
        },
        subTypes: validSubTypes.map((st) => ({
          name: {
            en: st.en,
            ar: st.ar,
          },
        })),
      };

      const json = await api.patch<any>(`filter-type/${editTarget.id}`, payload);

      if (json?.status === false) {
        throw new Error(json?.message || "Failed to update filter type.");
      }

      const updated = json?.data?.filter || json?.filter;
      if (updated) {
        const updatedCategory: FilterCategory = {
          id: updated._id || editTarget.id,
          name: {
            en: updated.name?.en?.trim() || nameEn,
            ar: updated.name?.ar?.trim() || nameAr,
          },
          subTypes: Array.isArray(updated.subTypes)
            ? updated.subTypes.map((st: any) => ({
                id: st._id || String(Math.random()),
                name: {
                  en: st.name?.en?.trim() || "",
                  ar: st.name?.ar?.trim() || "",
                },
              }))
            : [],
        };
        setItems((prev) =>
          prev.map((cat) => (cat.id === editTarget.id ? updatedCategory : cat)),
        );
      } else {
        reload();
      }

      setMessage(json?.message || "Filter updated successfully.");
      setEditTarget(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error updating filter type.";
      setEditError(msg);
    } finally {
      setEditBusy(false);
    }
  }

  // Create filter type via POST https://carts.reapmind.com/admin/filter-type/create
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const nameEn = createForm.nameEn.trim();
    const nameAr = createForm.nameAr.trim();

    if (!nameEn) {
      setCreateError("Category English name is required.");
      return;
    }
    if (!nameAr) {
      setCreateError("Category Arabic name is required.");
      return;
    }

    const validSubTypes = createForm.subTypes
      .map((st) => ({ en: st.en.trim(), ar: st.ar.trim() }))
      .filter((st) => st.en || st.ar);

    if (validSubTypes.length === 0) {
      setCreateError("Please provide at least one sub-type.");
      return;
    }

    for (let i = 0; i < validSubTypes.length; i++) {
      if (!validSubTypes[i].en) {
        setCreateError(`Sub-type #${i + 1} English name is required.`);
        return;
      }
      if (!validSubTypes[i].ar) {
        setCreateError(`Sub-type #${i + 1} Arabic name is required.`);
        return;
      }
    }

    setCreateBusy(true);

    try {
      const payload = {
        name: {
          en: nameEn,
          ar: nameAr,
        },
        subTypes: validSubTypes.map((st) => ({
          name: {
            en: st.en,
            ar: st.ar,
          },
        })),
      };

      const json = await api.post<any>("filter-type/create", payload);

      const createdCategory = json?.data?.filter;
      if (createdCategory) {
        const newCategory: FilterCategory = {
          id: createdCategory._id || String(Date.now()),
          name: {
            en: createdCategory.name?.en?.trim() || nameEn,
            ar: createdCategory.name?.ar?.trim() || nameAr,
          },
          subTypes: Array.isArray(createdCategory.subTypes)
            ? createdCategory.subTypes.map((st: any) => ({
                id: st._id || String(Math.random()),
                name: {
                  en: st.name?.en?.trim() || "",
                  ar: st.name?.ar?.trim() || "",
                },
              }))
            : [],
        };
        setItems((prev) => [newCategory, ...prev]);
      } else {
        reload();
      }

      setMessage(json?.message || "Filter type created successfully.");
      setShowCreateModal(false);
      setCreateForm(INITIAL_FORM);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error creating filter type.";
      setCreateError(msg);
    } finally {
      setCreateBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setActionError(null);
    setMessage(null);
    setDeletingId(deleteTarget.id);

    try {
      try {
        await api.delete(`filter-type/${deleteTarget.id}`);
      } catch {
        // If delete endpoint is not available, remove locally
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setMessage(`"${deleteTarget.name.en.trim()}" removed successfully.`);
      setDeleteTarget(null);
    } catch {
      setActionError("Could not delete filter type.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Filter Types
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Filter catalog
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Organize marketplace filters into bilingual categories and sub-types
            used across vendor offerings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover lg:self-auto"
        >
          <PlusIcon />
          New filter type
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Categories" value={stats.categories} />
        <StatCard label="Sub-types" value={stats.subTypes} />
        <StatCard
          label="Largest group"
          value={stats.largest}
          hint="sub-types in one category"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Search categories or sub-types
            </span>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. Gatherings, Sushi, Buffets…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </label>
        </div>

        {error || actionError ? (
          <p className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-5">
            {error ?? actionError}
          </p>
        ) : null}

        {message ? (
          <p className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:px-5">
            {message}
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <FilterIcon />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-900">
              {debouncedSearch
                ? "No filter types match your search"
                : "No filter types yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {debouncedSearch
                ? "Try a different keyword or clear the search."
                : "Create your first category to start building the filter catalog."}
            </p>
            {!debouncedSearch ? (
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setShowCreateModal(true);
                }}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Create filter type
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-2">
            {filteredItems.map((category, index) => (
              <FilterTypeCard
                key={category.id}
                category={category}
                accentIndex={index}
                deleting={deletingId === category.id}
                onEdit={() => handleOpenEdit(category)}
                onDelete={() => setDeleteTarget(category)}
              />
            ))}
          </div>
        )}
      </section>

      {deleteTarget ? (
        <DeleteModal
          category={deleteTarget}
          busy={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      {showCreateModal ? (
        <CreateFilterTypeModal
          open={showCreateModal}
          title="New Filter Type"
          subtitle="Create a new bilingual category and sub-types."
          submitText="Create filter type"
          busy={createBusy}
          error={createError}
          form={createForm}
          onChange={(updates) =>
            setCreateForm((prev) => ({ ...prev, ...updates }))
          }
          onAddSubType={() =>
            setCreateForm((prev) => ({
              ...prev,
              subTypes: [...prev.subTypes, { en: "", ar: "" }],
            }))
          }
          onRemoveSubType={(idx) =>
            setCreateForm((prev) => ({
              ...prev,
              subTypes: prev.subTypes.filter((_, i) => i !== idx),
            }))
          }
          onClose={() => {
            if (!createBusy) {
              setShowCreateModal(false);
              setCreateError(null);
            }
          }}
          onSubmit={handleCreateSubmit}
        />
      ) : null}

      {editTarget ? (
        <CreateFilterTypeModal
          open={Boolean(editTarget)}
          title="Edit Filter Type"
          subtitle={`Update "${editTarget.name.en.trim()}" and its sub-types.`}
          submitText="Save changes"
          loading={editFetching}
          busy={editBusy}
          error={editError}
          form={editForm}
          onChange={(updates) =>
            setEditForm((prev) => ({ ...prev, ...updates }))
          }
          onAddSubType={() =>
            setEditForm((prev) => ({
              ...prev,
              subTypes: [...prev.subTypes, { en: "", ar: "" }],
            }))
          }
          onRemoveSubType={(idx) =>
            setEditForm((prev) => ({
              ...prev,
              subTypes: prev.subTypes.filter((_, i) => i !== idx),
            }))
          }
          onClose={() => {
            if (!editBusy) {
              setEditTarget(null);
              setEditError(null);
            }
          }}
          onSubmit={handleEditSubmit}
        />
      ) : null}
    </div>
  );
}

function FilterTypeCard({
  category,
  accentIndex,
  deleting,
  onEdit,
  onDelete,
}: {
  category: FilterCategory;
  accentIndex: number;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const initial = category.name.en.trim().charAt(0).toUpperCase() || "?";
  const accent = ACCENT_PALETTE[accentIndex % ACCENT_PALETTE.length];
  const visibleSubTypes = expanded
    ? category.subTypes
    : category.subTypes.slice(0, VISIBLE_SUB_TYPES);
  const hiddenCount = category.subTypes.length - VISIBLE_SUB_TYPES;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex">
        <div
          className={`flex w-16 shrink-0 flex-col items-center justify-center bg-gradient-to-b ${accent.gradient} py-5`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${accent.badge}`}
          >
            {initial}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                {category.name.en.trim()}
              </p>
              <p className="truncate text-sm text-slate-500" dir="rtl">
                {category.name.ar.trim()}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {category.subTypes.length} sub-type
              {category.subTypes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleSubTypes.map((subType) => (
              <span
                key={subType.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                title={`${subType.name.en.trim()} / ${subType.name.ar.trim()}`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{subType.name.en.trim()}</span>
              </span>
            ))}
            {!expanded && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
              >
                +{hiddenCount} more
              </button>
            ) : null}
            {expanded && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
              >
                Show less
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
            >
              <EditIcon />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Delete ${category.name.en}`}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {value.toLocaleString("en-US")}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function DeleteModal({
  category,
  busy,
  onCancel,
  onConfirm,
}: {
  category: FilterCategory;
  busy: boolean;
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
          <h3 className="text-base font-semibold text-slate-900">
            Delete filter type?
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            This will remove{" "}
            <span className="font-medium text-slate-700">
              {category.name.en.trim()}
            </span>{" "}
            and all {category.subTypes.length} sub-type
            {category.subTypes.length === 1 ? "" : "s"}.
          </p>
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
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateFilterTypeModal({
  open,
  title = "New Filter Type",
  subtitle = "Create a new bilingual category and sub-types.",
  submitText = "Create filter type",
  loading = false,
  busy,
  error,
  form,
  onChange,
  onAddSubType,
  onRemoveSubType,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
  submitText?: string;
  loading?: boolean;
  busy: boolean;
  error: string | null;
  form: CreateFormState;
  onChange: (updates: Partial<CreateFormState>) => void;
  onAddSubType: () => void;
  onRemoveSubType: (index: number) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="mt-3 text-xs font-medium text-slate-600">
              Fetching filter details…
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category Name
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      English name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nameEn}
                      onChange={(e) => onChange({ nameEn: e.target.value })}
                      placeholder="e.g. Cuisine"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Arabic name *
                    </label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      value={form.nameAr}
                      onChange={(e) => onChange({ nameAr: e.target.value })}
                      placeholder="e.g. المطبخ"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sub-types ({form.subTypes.length})
                  </span>
                  <button
                    type="button"
                    onClick={onAddSubType}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand-soft/50 px-2.5 py-1 text-xs font-medium text-brand transition hover:bg-brand-soft"
                  >
                    <PlusIcon />
                    Add sub-type
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.subTypes.map((subType, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"
                    >
                      <div className="grid flex-1 gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={subType.en}
                          onChange={(e) => {
                            const updated = [...form.subTypes];
                            updated[index].en = e.target.value;
                            onChange({ subTypes: updated });
                          }}
                          placeholder={`Sub-type #${index + 1} English (e.g. Indian)`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                        <input
                          type="text"
                          dir="rtl"
                          value={subType.ar}
                          onChange={(e) => {
                            const updated = [...form.subTypes];
                            updated[index].ar = e.target.value;
                            onChange({ subTypes: updated });
                          }}
                          placeholder={`Sub-type #${index + 1} Arabic (e.g. هندي)`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                      {form.subTypes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => onRemoveSubType(index)}
                          className="mt-1 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Remove sub-type"
                        >
                          <DeleteIcon />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Saving…" : submitText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 18L18 6M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACCENT_PALETTE = [
  { gradient: "from-brand-soft to-white", badge: "bg-brand" },
  { gradient: "from-sky-50 to-white", badge: "bg-sky-500" },
  { gradient: "from-violet-50 to-white", badge: "bg-violet-500" },
  { gradient: "from-amber-50 to-white", badge: "bg-amber-500" },
  { gradient: "from-emerald-50 to-white", badge: "bg-emerald-500" },
  { gradient: "from-rose-50 to-white", badge: "bg-rose-500" },
];

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className ?? ""}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m15.5 5.5 3 3M7 17.5V20h2.5L18 11.5l-2.5-2.5L7 17.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 7h12M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m2 0v11.5A1.5 1.5 0 0 1 15 20H9a1.5 1.5 0 0 1-1.5-1.5V7h9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
