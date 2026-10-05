"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import {
  createOfferingCategory,
  deleteOfferingCategory,
  fetchOfferingCategories,
  updateOfferingCategory,
} from "@/lib/offering-categories";
import type { OfferingCategoryRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function OfferingCategoriesView() {
  const [items, setItems] = useState<OfferingCategoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEnglish, setNewEnglish] = useState("");
  const [newArabic, setNewArabic] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editArabic, setEditArabic] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const skipPageLoadRef = useRef(false);

  const loadCategories = useCallback(
    async (targetPage: number, refresh = false) => {
      setCardsLoading(true);
      try {
        const response = await fetchOfferingCategories(
          {
            page: targetPage,
            pageSize: PAGE_SIZE,
          },
          { refresh },
        );
        setItems(response.items);
        setTotal(response.total);
        setPage((current) => {
          if (current !== response.page) {
            skipPageLoadRef.current = true;
          }
          return response.page;
        });
      } catch {
        setError("Unable to load offering categories.");
      } finally {
        setCardsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (skipPageLoadRef.current) {
      skipPageLoadRef.current = false;
      return;
    }
    void loadCategories(page);
  }, [loadCategories, page]);

  async function handleAdd() {
    if (!newEnglish.trim() || !newArabic.trim()) {
      setSuccess(null);
      setError("English and Arabic names are required.");
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createOfferingCategory({
        englishName: newEnglish,
        arabicName: newArabic,
      });
      setNewEnglish("");
      setNewArabic("");
      setSuccess(created.message);
      await loadCategories(1, true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not add category.",
      );
    } finally {
      setAdding(false);
    }
  }

  function startEdit(category: OfferingCategoryRecord) {
    setEditingId(category.id);
    setEditEnglish(category.englishName);
    setEditArabic(category.arabicName);
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditEnglish("");
    setEditArabic("");
  }

  async function handleSaveEdit(id: string) {
    if (!editEnglish.trim() || !editArabic.trim()) {
      setError("English and Arabic names are required.");
      return;
    }

    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      await updateOfferingCategory(id, {
        englishName: editEnglish,
        arabicName: editArabic,
      });
      cancelEdit();
      await loadCategories(page);
    } catch {
      setError("Could not update category.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      await deleteOfferingCategory(id);
      if (editingId === id) cancelEdit();
      await loadCategories(page);
    } catch {
      setError("Could not delete category.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Vendors
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Offering Categories
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {total.toLocaleString("en-US")} categories in the catalog
          </p>
        </div>
      </div>

      <article className="rounded-2xl border-2 border-dashed border-brand/30 bg-brand-soft/30 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
            <PlusIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Add new</p>
            <p className="text-xs text-slate-600">
              Create a bilingual offering category
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BilingualField
            label="English"
            value={newEnglish}
            onChange={setNewEnglish}
            placeholder="English"
          />
          <BilingualField
            label="Arabic"
            value={newArabic}
            onChange={setNewArabic}
            placeholder="Arabic"
            rtl
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add new"}
          </button>
        </div>
      </article>

      {success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {cardsLoading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            Loading categories…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            No offering categories yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {items.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                editing={editingId === category.id}
                editEnglish={editEnglish}
                editArabic={editArabic}
                busy={savingId === category.id}
                onEditEnglishChange={setEditEnglish}
                onEditArabicChange={setEditArabic}
                onStartEdit={() => startEdit(category)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => handleSaveEdit(category.id)}
                onDelete={() => handleDelete(category.id)}
              />
            ))}
          </div>
        )}

        {!cardsLoading && total > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <PaginationBar
              total={total}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  editing,
  editEnglish,
  editArabic,
  busy,
  onEditEnglishChange,
  onEditArabicChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  category: OfferingCategoryRecord;
  editing: boolean;
  editEnglish: string;
  editArabic: string;
  busy: boolean;
  onEditEnglishChange: (value: string) => void;
  onEditArabicChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  const initial = category.englishName.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-brand-soft to-white py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
            {initial}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <ApproveStatusBadge status={category.approveStatus} />
            <CardActions
              editing={editing}
              busy={busy}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
            />
          </div>

          {editing ? (
            <div className="mt-3 space-y-3">
              <BilingualField
                label="English"
                value={editEnglish}
                onChange={onEditEnglishChange}
              />
              <BilingualField
                label="Arabic"
                value={editArabic}
                onChange={onEditArabicChange}
                rtl
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  English
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {category.englishName}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Arabic
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800" dir="auto">
                  {category.arabicName}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              ID
            </p>
            <p className="mt-0.5 break-all font-mono text-[11px] leading-relaxed text-slate-600">
              {category.id}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatApproveStatus(status?: string | null) {
  if (!status?.trim()) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function ApproveStatusBadge({ status }: { status?: string | null }) {
  const normalized = status?.trim().toLowerCase() ?? "";
  const styles =
    normalized === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "pending"
        ? "bg-amber-50 text-amber-700"
        : normalized === "rejected"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-500";

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}
    >
      {formatApproveStatus(status)}
    </span>
  );
}

function BilingualField({
  label,
  value,
  onChange,
  placeholder,
  rtl = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rtl?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={rtl ? "auto" : undefined}
        className={inputClass}
      />
    </label>
  );
}

function CardActions({
  editing,
  busy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  editing: boolean;
  busy: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={busy}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={busy}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onStartEdit}
        disabled={busy}
        aria-label="Edit category"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
      >
        <EditIcon />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label="Delete category"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="m13.8 5.7 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
