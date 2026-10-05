"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PublishedStatusInline } from "@/components/ui/PublishedStatus";
import { useVendors } from "@/hooks/useVendors";
import { formatVendorDate } from "@/lib/vendors";
import type { VendorListTab, VendorRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const EMPTY_FILTERS = {
  published: "all" as const,
  name: "",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: "",
};

export default function AllVendorsView() {
  const [tab, setTab] = useState<VendorListTab>("vendors");
  const [published, setPublished] = useState<"all" | "published" | "unpublished">(
    "all",
  );
  const [name, setName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(name);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [name]);

  const { items, total, loading, error } = useVendors({
    tab,
    published,
    name: debouncedName,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    page,
    pageSize: PAGE_SIZE,
  });

  function resetFilters() {
    setPublished(EMPTY_FILTERS.published);
    setName(EMPTY_FILTERS.name);
    setDebouncedName(EMPTY_FILTERS.name);
    setCreatedFrom(EMPTY_FILTERS.createdFrom);
    setCreatedTo(EMPTY_FILTERS.createdTo);
    setUpdatedFrom(EMPTY_FILTERS.updatedFrom);
    setUpdatedTo(EMPTY_FILTERS.updatedTo);
    setPage(1);
  }

  const isDraftTab = tab === "draft";

  function switchTab(next: VendorListTab) {
    setTab(next);
    setPublished(EMPTY_FILTERS.published);
    setName(EMPTY_FILTERS.name);
    setDebouncedName(EMPTY_FILTERS.name);
    setCreatedFrom(EMPTY_FILTERS.createdFrom);
    setCreatedTo(EMPTY_FILTERS.createdTo);
    setUpdatedFrom(EMPTY_FILTERS.updatedFrom);
    setUpdatedTo(EMPTY_FILTERS.updatedTo);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <TabButton
            active={tab === "vendors"}
            onClick={() => switchTab("vendors")}
          >
            Vendors
          </TabButton>
          <TabButton
            active={tab === "draft"}
            onClick={() => switchTab("draft")}
          >
            Draft vendors
          </TabButton>
        </div>

        {!isDraftTab ? (
          <Link
            href="/vendors/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Add
          </Link>
        ) : null}
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div
          className={`grid gap-3 ${
            isDraftTab
              ? "lg:grid-cols-[1.2fr_1.4fr_1.4fr_auto]"
              : "lg:grid-cols-[1fr_1.2fr_1.4fr_1.4fr_auto]"
          }`}
        >
          {!isDraftTab ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Published
              </span>
              <select
                value={published}
                onChange={(event) => {
                  setPublished(
                    event.target.value as "all" | "published" | "unpublished",
                  );
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="unpublished">Not published</option>
              </select>
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Search by name"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <DateRangeField
            label="Date of creation"
            start={createdFrom}
            end={createdTo}
            onStartChange={(value) => {
              setCreatedFrom(value);
              setPage(1);
            }}
            onEndChange={(value) => {
              setCreatedTo(value);
              setPage(1);
            }}
          />

          <DateRangeField
            label="Date of last update"
            start={updatedFrom}
            end={updatedTo}
            onStartChange={(value) => {
              setUpdatedFrom(value);
              setPage(1);
            }}
            onEndChange={(value) => {
              setUpdatedTo(value);
              setPage(1);
            }}
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              {isDraftTab ? (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3.5">English Name</th>
                      <th className="px-4 py-3.5">Arabic Name</th>
                      <th className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1">
                          Created
                          <SortIcon />
                        </span>
                      </th>
                      <th className="px-4 py-3.5">Updated</th>
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
                          No draft vendors match these filters.
                        </td>
                      </tr>
                    ) : (
                      items.map((vendor) => (
                        <DraftVendorRow key={vendor.id} vendor={vendor} />
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3.5">Published?</th>
                      <th className="px-4 py-3.5">English Name</th>
                      <th className="px-4 py-3.5">Arabic Name</th>
                      <th className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1">
                          Created
                          <SortIcon />
                        </span>
                      </th>
                      <th className="px-4 py-3.5">Updated</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No vendors match these filters.
                        </td>
                      </tr>
                    ) : (
                      items.map((vendor) => (
                        <VendorRow key={vendor.id} vendor={vendor} />
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="grid gap-3 p-4 xl:hidden">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  {isDraftTab
                    ? "No draft vendors match these filters."
                    : "No vendors match these filters."}
                </p>
              ) : isDraftTab ? (
                items.map((vendor) => (
                  <DraftVendorCard key={vendor.id} vendor={vendor} />
                ))
              ) : (
                items.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
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
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function DateRangeField({
  label,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  label: string;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <fieldset className="block text-sm">
      <legend className="mb-1.5 font-medium text-slate-700">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            From date
          </span>
          <input
            type="date"
            value={start}
            onChange={(event) => onStartChange(event.target.value)}
            aria-label={`${label} from date`}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            To date
          </span>
          <input
            type="date"
            value={end}
            onChange={(event) => onEndChange(event.target.value)}
            aria-label={`${label} to date`}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>
    </fieldset>
  );
}

function VendorRow({ vendor }: { vendor: VendorRecord }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <PublishedStatusInline published={vendor.published} />
      </td>
      <td className="px-4 py-4 font-medium text-slate-900">
        {vendor.englishName}
      </td>
      <td className="px-4 py-4 text-slate-700" dir="auto">
        {vendor.arabicName}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatVendorDate(vendor.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatVendorDate(vendor.updatedAt)}
      </td>
      <td className="px-4 py-4">
        <VendorActions vendorId={vendor.id} />
      </td>
    </tr>
  );
}

function DraftVendorRow({ vendor }: { vendor: VendorRecord }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-4 py-4 font-medium text-slate-900">
        {vendor.englishName}
      </td>
      <td className="px-4 py-4 text-slate-700" dir="auto">
        {vendor.arabicName}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatVendorDate(vendor.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
        {formatVendorDate(vendor.updatedAt)}
      </td>
      <td className="px-4 py-4">
        <DraftActions vendorId={vendor.id} />
      </td>
    </tr>
  );
}

function VendorCard({ vendor }: { vendor: VendorRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{vendor.englishName}</p>
          <p className="mt-1 text-sm text-slate-600" dir="auto">
            {vendor.arabicName}
          </p>
        </div>
        <PublishedStatusInline published={vendor.published} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Created</dt>
          <dd className="text-slate-700">{formatVendorDate(vendor.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Updated</dt>
          <dd className="text-slate-700">{formatVendorDate(vendor.updatedAt)}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <VendorActions vendorId={vendor.id} />
      </div>
    </article>
  );
}

function DraftVendorCard({ vendor }: { vendor: VendorRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div>
        <p className="font-semibold text-slate-900">{vendor.englishName}</p>
        <p className="mt-1 text-sm text-slate-600" dir="auto">
          {vendor.arabicName}
        </p>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Created</dt>
          <dd className="text-slate-700">{formatVendorDate(vendor.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Updated</dt>
          <dd className="text-slate-700">{formatVendorDate(vendor.updatedAt)}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <DraftActions vendorId={vendor.id} />
      </div>
    </article>
  );
}

function VendorActions({ vendorId }: { vendorId: string }) {
  const quickActions = [
    { label: "Offerings", href: `/vendors/${vendorId}/offerings` },
    { label: "Users", href: `/vendors/${vendorId}/users` },
    { label: "Filters", href: `/vendors/${vendorId}/filters` },
    { label: "Reviews", href: `/vendors/${vendorId}/reviews` },
  ] as const;

  return (
    <div className="flex w-[160px] flex-col gap-2">
      <div
        className="grid grid-cols-2 gap-1.5"
        role="group"
        aria-label="Vendor quick links"
      >
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-2 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-hover"
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/vendors/${vendorId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <EditIcon />
          Edit
        </Link>
        <button
          type="button"
          aria-label="Delete vendor"
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          <DeleteIcon />
          Delete
        </button>
      </div>
    </div>
  );
}

function DraftActions({ vendorId }: { vendorId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/vendors/${vendorId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        <EditIcon />
        Edit
      </Link>
      <button
        type="button"
        aria-label="Delete draft vendor"
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
      >
        <DeleteIcon />
        Delete
      </button>
    </div>
  );
}

function SortIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
