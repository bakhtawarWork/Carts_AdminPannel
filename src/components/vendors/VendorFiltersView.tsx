"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countSelectedInCategory,
  fetchVendorFilters,
  formatBilingualLabel,
  saveVendorFilters,
} from "@/lib/vendor-filters";
import type { FilterCategory, VendorRecord } from "@/lib/types";

type VendorFiltersViewProps = {
  vendorId: string;
};

export default function VendorFiltersView({ vendorId }: VendorFiltersViewProps) {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVendorFilters(vendorId);
      setVendor(response.vendor);
      setCategories(response.categories);
      setSavedIds(response.selectedSubTypeIds);
      setSelectedIds(new Set(response.selectedSubTypeIds));
      setActiveCategoryId(response.categories[0]?.id ?? null);
    } catch (caught) {
      setVendor(null);
      setCategories([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load vendor filters.",
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  const activeCategory = categories.find(
    (category) => category.id === activeCategoryId,
  );

  const isDirty = useMemo(() => {
    if (savedIds.length !== selectedIds.size) return true;
    return savedIds.some((id) => !selectedIds.has(id));
  }, [savedIds, selectedIds]);

  const totalSelected = selectedIds.size;
  const totalAvailable = categories.reduce(
    (sum, category) => sum + category.subTypes.length,
    0,
  );

  function toggleSubType(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMessage(null);
  }

  function selectAllInCategory(category: FilterCategory) {
    setSelectedIds((current) => {
      const next = new Set(current);
      category.subTypes.forEach((subType) => next.add(subType.id));
      return next;
    });
    setMessage(null);
  }

  function clearCategory(category: FilterCategory) {
    setSelectedIds((current) => {
      const next = new Set(current);
      category.subTypes.forEach((subType) => next.delete(subType.id));
      return next;
    });
    setMessage(null);
  }

  function handleCancel() {
    router.push("/vendors");
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const nextIds = await saveVendorFilters(
        vendorId,
        Array.from(selectedIds),
      );
      setSavedIds(nextIds);
      setSelectedIds(new Set(nextIds));
      setMessage("Vendor filters saved successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save vendor filters.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading filter types…
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-12 text-center text-sm text-red-700">
        {error ?? "Vendor not found."}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
              Vendors
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Filter Types
            </h2>
            <p className="mt-1 text-sm text-slate-500" dir="auto">
              {[vendor.englishName, vendor.arabicName]
                .filter(Boolean)
                .join(" / ") || vendor.id}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose which discovery filters apply to this vendor in the app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill
              label="Selected"
              value={`${totalSelected} of ${totalAvailable}`}
            />
            {isDirty ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Unsaved changes
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categories
            </p>
          </div>
          <div className="light-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {categories.map((category) => {
              const selectedCount = countSelectedInCategory(
                category.id,
                categories,
                selectedIds,
              );
              const active = category.id === activeCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`mb-1 flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {category.name.en}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        active ? "text-white/80" : "text-slate-500"
                      }`}
                      dir="auto"
                    >
                      {category.name.ar}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : selectedCount > 0
                          ? "bg-brand/10 text-brand"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selectedCount}/{category.subTypes.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {activeCategory ? (
            <>
              <div className="shrink-0 flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {formatBilingualLabel(activeCategory.name)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {countSelectedInCategory(
                      activeCategory.id,
                      categories,
                      selectedIds,
                    )}{" "}
                    of {activeCategory.subTypes.length} selected in this category
                  </p>
                </div>
                <CategoryBulkActions
                  category={activeCategory}
                  selectedIds={selectedIds}
                  onSelectAll={() => selectAllInCategory(activeCategory)}
                  onClear={() => clearCategory(activeCategory)}
                />
              </div>
              <div className="light-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeCategory.subTypes.map((subType) => (
                    <FilterToggleCard
                      key={subType.id}
                      subType={subType}
                      selected={selectedIds.has(subType.id)}
                      onToggle={() => toggleSubType(subType.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 py-16 text-sm text-slate-500">
              No filter categories available.
            </div>
          )}
        </section>
      </div>

      {message || error ? (
        <div className="shrink-0 space-y-2 pt-3">
          {message ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 shrink-0 border-t border-slate-200 bg-white pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {totalSelected} filter{totalSelected === 1 ? "" : "s"} will be
            assigned to this vendor.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterToggleCard({
  subType,
  selected,
  onToggle,
}: {
  subType: FilterCategory["subTypes"][number];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-brand bg-brand/5 ring-2 ring-brand/15"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {subType.name.en}
          </p>
          <p className="mt-1 text-sm text-slate-600" dir="auto">
            {subType.name.ar}
          </p>
        </div>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            selected
              ? "border-brand bg-brand text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
    </button>
  );
}

function CategoryBulkActions({
  category,
  selectedIds,
  onSelectAll,
  onClear,
}: {
  category: FilterCategory;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const selectedCount = category.subTypes.filter((subType) =>
    selectedIds.has(subType.id),
  ).length;
  const allSelected = selectedCount === category.subTypes.length;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onSelectAll}
        disabled={allSelected}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Select all
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={selectedCount === 0}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear
      </button>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
