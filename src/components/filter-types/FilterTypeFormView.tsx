"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createEmptyFilterTypeForm,
  fetchFilterTypeForm,
  saveFilterTypeForm,
  validateFilterTypeForm,
} from "@/lib/filter-types";
import type { FilterTypeFormData, FilterTypeSubTypeFormRow } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type FilterTypeFormViewProps = {
  filterTypeId?: string;
};

export default function FilterTypeFormView({
  filterTypeId,
}: FilterTypeFormViewProps) {
  const router = useRouter();
  const isEdit = Boolean(filterTypeId);
  const [form, setForm] = useState<FilterTypeFormData>(createEmptyFilterTypeForm());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filterTypeId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFilterTypeForm(filterTypeId!);
        if (cancelled) return;
        if (!data) {
          setError("Filter type not found.");
          return;
        }
        setForm(data);
      } catch {
        if (!cancelled) setError("Could not load filter type.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [filterTypeId]);

  const previewInitial = useMemo(() => {
    const label = form.nameEn.trim();
    return label ? label.charAt(0).toUpperCase() : "?";
  }, [form.nameEn]);

  const filledSubTypes = useMemo(
    () =>
      form.subTypes.filter(
        (subType) => subType.nameEn.trim() || subType.nameAr.trim(),
      ),
    [form.subTypes],
  );

  function updateField<K extends keyof FilterTypeFormData>(
    key: K,
    value: FilterTypeFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function updateSubType(
    index: number,
    updater: (row: FilterTypeSubTypeFormRow) => FilterTypeSubTypeFormRow,
  ) {
    setForm((prev) => ({
      ...prev,
      subTypes: prev.subTypes.map((row, rowIndex) =>
        rowIndex === index ? updater(row) : row,
      ),
    }));
    setError(null);
  }

  function addSubType() {
    setForm((prev) => ({
      ...prev,
      subTypes: [...prev.subTypes, { nameEn: "", nameAr: "" }],
    }));
    setError(null);
  }

  function removeSubType(index: number) {
    setForm((prev) => ({
      ...prev,
      subTypes: prev.subTypes.filter((_, rowIndex) => rowIndex !== index),
    }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateFilterTypeForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveFilterTypeForm(form);
      router.push("/filter-types");
    } catch {
      setError("Could not save filter type. Please try again.");
    } finally {
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
          href="/filter-types"
          className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
        >
          ← Back to filter types
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/filter-types"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand"
          >
            <BackIcon />
            Filter types
          </Link>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {isEdit ? "Edit filter type" : "Create filter type"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? "Update the category name and manage its sub-types."
              : "Add a bilingual category and the sub-types customers can filter by."}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <header className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                  <CategoryIcon />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Category details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shown as the main filter group in the app
                  </p>
                </div>
              </div>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <BilingualField
                label="English name"
                value={form.nameEn}
                onChange={(value) => updateField("nameEn", value)}
                placeholder="e.g. Gatherings"
              />
              <BilingualField
                label="Arabic name"
                value={form.nameAr}
                onChange={(value) => updateField("nameAr", value)}
                placeholder="e.g. تجمعات"
                rtl
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <LayersIcon />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Sub-types
                  </h3>
                  <p className="text-xs text-slate-500">
                    {form.subTypes.length} item
                    {form.subTypes.length === 1 ? "" : "s"} in this group
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-3 p-5">
              {form.subTypes.map((subType, index) => (
                <div
                  key={subType.id ?? `row-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                        {index + 1}
                      </span>
                      Sub-type {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubType(index)}
                      disabled={form.subTypes.length === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RemoveIcon />
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <BilingualField
                      label="English"
                      value={subType.nameEn}
                      onChange={(value) =>
                        updateSubType(index, (row) => ({ ...row, nameEn: value }))
                      }
                      placeholder="English label"
                      compact
                    />
                    <BilingualField
                      label="Arabic"
                      value={subType.nameAr}
                      onChange={(value) =>
                        updateSubType(index, (row) => ({ ...row, nameAr: value }))
                      }
                      placeholder="Arabic label"
                      rtl
                      compact
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addSubType}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/30 bg-brand-soft/40 px-4 py-4 text-sm font-semibold text-brand transition hover:border-brand/50 hover:bg-brand-soft"
              >
                <PlusIcon />
                Add sub-type
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Live preview
              </p>
            </div>

            <div className="p-4">
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex">
                  <div className="flex w-14 shrink-0 items-center justify-center bg-gradient-to-b from-brand-soft to-white py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
                      {previewInitial}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 p-3">
                    <p className="truncate font-semibold text-slate-900">
                      {form.nameEn.trim() || "English name"}
                    </p>
                    <p className="truncate text-sm text-slate-500" dir="rtl">
                      {form.nameAr.trim() || "Arabic name"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {filledSubTypes.length || form.subTypes.length} sub-type
                      {(filledSubTypes.length || form.subTypes.length) === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(filledSubTypes.length ? filledSubTypes : form.subTypes)
                      .slice(0, 6)
                      .map((subType, index) => (
                        <span
                          key={subType.id ?? `preview-${index}`}
                          className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                        >
                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                          <span className="truncate">
                            {subType.nameEn.trim() || "Sub-type"}
                          </span>
                        </span>
                      ))}
                    {form.subTypes.length > 6 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                        +{form.subTypes.length - 6}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tips
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Keep category names short and recognizable.</li>
              <li>Sub-types appear as selectable chips in vendor filters.</li>
              <li>Both English and Arabic labels are required.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/filter-types"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SaveIcon />
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create filter type"}
          </button>
        </div>
      </div>
    </form>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  placeholder,
  rtl = false,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rtl?: boolean;
  compact?: boolean;
}) {
  return (
    <label className={`block ${compact ? "text-xs" : "text-sm"}`}>
      <span
        className={`mb-1.5 block font-medium text-slate-700 ${compact ? "text-xs" : ""}`}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={rtl ? "rtl" : undefined}
        className={inputClass}
      />
    </label>
  );
}

function BackIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function RemoveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m8 8 8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
