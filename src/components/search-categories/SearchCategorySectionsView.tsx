"use client";

import Link from "next/link";
import { useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PublishedStatusInline } from "@/components/ui/PublishedStatus";
import { useSearchCategorySections } from "@/hooks/useSearchCategorySections";
import {
  deleteSearchCategorySection,
} from "@/lib/search-category-sections";
import type { SearchCategorySectionRecord } from "@/lib/types";

const PAGE_SIZE = 8;

type ModalMode = "delete" | null;

export default function SearchCategorySectionsView() {
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [activeSection, setActiveSection] =
    useState<SearchCategorySectionRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { items, total, loading, error, reload } = useSearchCategorySections(
    page,
    PAGE_SIZE,
  );

  function openDelete(section: SearchCategorySectionRecord) {
    setActiveSection(section);
    setModalMode("delete");
    setActionError(null);
  }

  function closeModal() {
    setModalMode(null);
    setActiveSection(null);
    setActionError(null);
  }

  async function handleDelete() {
    if (!activeSection) return;

    setSaving(true);
    setActionError(null);

    try {
      await deleteSearchCategorySection(activeSection.id);
      setMessage("Section deleted successfully.");
      closeModal();
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await reload(nextPage);
    } catch {
      setActionError("Could not delete section.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Search Categories
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Search Categories Sections
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage homepage search category groupings and visibility.
          </p>
        </div>

        <Link
          href="/search-categories/new"
          className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover sm:self-auto"
        >
          Add
        </Link>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {actionError && !modalMode ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-16 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3.5">Published?</th>
                    <th className="px-4 py-3.5">English Name</th>
                    <th className="px-4 py-3.5">Arabic Name</th>
                    <th className="px-4 py-3.5">Categories</th>
                    <th className="px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No search category sections yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((section) => (
                      <SectionRow
                        key={section.id}
                        section={section}
                        onDelete={() => openDelete(section)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No search category sections yet.
                </p>
              ) : (
                items.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onDelete={() => openDelete(section)}
                  />
                ))
              )}
            </div>
          </>
        )}

        <PaginationBar
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {modalMode === "delete" && activeSection ? (
        <DeleteModal
          section={activeSection}
          saving={saving}
          error={actionError}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

function SectionRow({
  section,
  onDelete,
}: {
  section: SearchCategorySectionRecord;
  onDelete: () => void;
}) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <PublishedStatusInline published={section.published} />
      </td>
      <td className="px-4 py-4 font-medium text-slate-900">
        {section.englishName}
      </td>
      <td className="px-4 py-4 text-slate-700" dir="auto">
        {section.arabicName}
      </td>
      <td className="px-4 py-4 text-slate-600">{section.categoryCount}</td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <IconActionLink
            href={`/search-categories/${section.id}/edit`}
            label={`Edit ${section.englishName}`}
          >
            <EditIcon />
          </IconActionLink>
          <IconActionButton
            label={`Delete ${section.englishName}`}
            onClick={onDelete}
            danger
          >
            <DeleteIcon />
          </IconActionButton>
        </div>
      </td>
    </tr>
  );
}

function SectionCard({
  section,
  onDelete,
}: {
  section: SearchCategorySectionRecord;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{section.englishName}</p>
          <p className="mt-1 text-sm text-slate-600" dir="auto">
            {section.arabicName}
          </p>
        </div>
        <PublishedStatusInline published={section.published} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Categories</dt>
          <dd className="font-medium text-slate-700">{section.categoryCount}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end gap-2">
        <IconActionLink
          href={`/search-categories/${section.id}/edit`}
          label={`Edit ${section.englishName}`}
        >
          <EditIcon />
        </IconActionLink>
        <IconActionButton
          label={`Delete ${section.englishName}`}
          onClick={onDelete}
          danger
        >
          <DeleteIcon />
        </IconActionButton>
      </div>
    </article>
  );
}

function DeleteModal({
  section,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  section: SearchCategorySectionRecord;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title="Delete section" onClose={onClose}>
      <p className="text-sm text-slate-600">
        Delete <span className="font-semibold text-slate-900">{section.englishName}</span>?
        This section contains {section.categoryCount} categor
        {section.categoryCount === 1 ? "y" : "ies"}.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Deleting…" : "Delete"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function IconActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
    >
      {children}
    </Link>
  );
}

function IconActionButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {children}
    </button>
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
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
