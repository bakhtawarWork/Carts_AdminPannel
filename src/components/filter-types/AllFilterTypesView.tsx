"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFilterTypes } from "@/hooks/useFilterTypes";
import { deleteFilterType } from "@/lib/filter-types";
import type { FilterCategory } from "@/lib/types";

const VISIBLE_SUB_TYPES = 8;

export default function AllFilterTypesView() {
  const { items, loading, error, reload } = useFilterTypes();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FilterCategory | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

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
      (sum, category) => sum + category.subTypes.length,
      0,
    );
    const largest = items.reduce(
      (max, category) => Math.max(max, category.subTypes.length),
      0,
    );
    return {
      categories: items.length,
      subTypes: subTypeCount,
      largest,
    };
  }, [items]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    setActionError(null);
    setMessage(null);
    setDeletingId(deleteTarget.id);

    try {
      const deleted = await deleteFilterType(deleteTarget.id);
      if (!deleted) {
        setActionError("Filter type not found.");
        return;
      }
      setMessage(`"${deleteTarget.name.en.trim()}" removed successfully.`);
      setDeleteTarget(null);
      reload();
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

        <Link
          href="/filter-types/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover lg:self-auto"
        >
          <PlusIcon />
          New filter type
        </Link>
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
              <Link
                href="/filter-types/new"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Create filter type
              </Link>
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
    </div>
  );
}

function FilterTypeCard({
  category,
  accentIndex,
  deleting,
  onDelete,
}: {
  category: FilterCategory;
  accentIndex: number;
  deleting: boolean;
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
            <Link
              href={`/filter-types/${category.id}/edit`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
            >
              <EditIcon />
              Edit
            </Link>
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
