"use client";

import { useEffect, useMemo, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useVendorRegistrations } from "@/hooks/useVendorRegistrations";
import {
  formatCategoryLabel,
  formatRegistrationDate,
  instagramHref,
  isRegistrationLicensed,
  LICENSED_FILTER_OPTIONS,
  REGISTRATION_CATEGORY_OPTIONS,
} from "@/lib/vendor-registrations";
import type { VendorRegistrationRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const EMPTY_FILTERS = {
  company: "",
  category: "" as const,
  licensed: "all" as const,
  createdFrom: "",
  createdTo: "",
};

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function VendorRegistrationsView() {
  const [company, setCompany] = useState("");
  const [debouncedCompany, setDebouncedCompany] = useState("");
  const [category, setCategory] = useState<typeof EMPTY_FILTERS.category>("");
  const [licensed, setLicensed] = useState<typeof EMPTY_FILTERS.licensed>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCompany(company);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [company]);

  const { items, total, loading, error } = useVendorRegistrations({
    company: debouncedCompany,
    category,
    licensed,
    createdFrom,
    createdTo,
    page,
    pageSize: PAGE_SIZE,
    sortDir,
  });

  const stats = useMemo(() => {
    const licensedCount = items.filter((item) =>
      isRegistrationLicensed(item.licensed),
    ).length;
    const setupsCount = items.filter((item) => item.category === "setups").length;
    const restaurantCount = items.filter(
      (item) => item.category === "restaurant",
    ).length;
    return { licensedCount, setupsCount, restaurantCount };
  }, [items]);

  function resetFilters() {
    setCompany(EMPTY_FILTERS.company);
    setDebouncedCompany(EMPTY_FILTERS.company);
    setCategory(EMPTY_FILTERS.category);
    setLicensed(EMPTY_FILTERS.licensed);
    setCreatedFrom(EMPTY_FILTERS.createdFrom);
    setCreatedTo(EMPTY_FILTERS.createdTo);
    setPage(1);
  }

  function toggleSort() {
    setSortDir((current) => (current === "desc" ? "asc" : "desc"));
    setPage(1);
  }

  const activeFilterCount = [
    debouncedCompany,
    category,
    licensed !== "all" ? licensed : "",
    createdFrom,
    createdTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Vendors
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Registration
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Vendor signup requests with company details and contact information.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="On this page" value={items.length} />
        <StatCard label="Licensed" value={stats.licensedCount} tone="success" />
        <StatCard
          label="Categories"
          value={`${stats.setupsCount} setups · ${stats.restaurantCount} restaurant`}
          text
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Refine results</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {activeFilterCount === 0
                ? "No filters applied"
                : `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
            </p>
          </div>
          <ChevronIcon open={filtersOpen} />
        </button>

        {filtersOpen ? (
          <div className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <FilterField label="Search">
                <input
                  type="text"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Business name, contact, email, phone…"
                  className={inputClassName}
                />
              </FilterField>

              <FilterField label="Category">
                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(
                      event.target.value as typeof category,
                    );
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {REGISTRATION_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Licensed">
                <select
                  value={licensed}
                  onChange={(event) => {
                    setLicensed(event.target.value as typeof licensed);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {LICENSED_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Created from">
                <input
                  type="date"
                  value={createdFrom}
                  onChange={(event) => {
                    setCreatedFrom(event.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                />
              </FilterField>

              <FilterField label="Created to">
                <input
                  type="date"
                  value={createdTo}
                  onChange={(event) => {
                    setCreatedTo(event.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                />
              </FilterField>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">
            {loading ? "Loading…" : `${total} registration${total === 1 ? "" : "s"}`}
          </p>
          <button
            type="button"
            onClick={toggleSort}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Created {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>

        {error ? (
          <div className="px-5 py-12 text-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="px-5 py-16 text-center text-sm text-slate-500">
            Loading registrations…
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">
              No registrations found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
            {items.map((registration) => (
              <RegistrationCard
                key={registration._id}
                registration={registration}
              />
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <PaginationBar
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

function RegistrationCard({
  registration,
}: {
  registration: VendorRegistrationRecord;
}) {
  const instagramLink = instagramHref(registration.instagram);
  const phoneHref = registration.contact.phone.replace(/\s/g, "");

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              {formatRegistrationDate(registration.createdAt)}
            </p>
            <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
              {registration.businessName}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CategoryBadge category={registration.category} />
            <LicensedBadge licensed={registration.licensed} />
          </div>
        </div>
      </div>

      <dl className="space-y-3 px-4 py-4 sm:px-5">
        <DetailRow label="Name" value={registration.contact.name} />
        <DetailRow
          label="Email"
          value={
            registration.contact.email ? (
              <a
                href={`mailto:${registration.contact.email}`}
                className="break-all text-brand transition hover:text-brand-hover hover:underline"
              >
                {registration.contact.email}
              </a>
            ) : (
              <span className="text-slate-400">—</span>
            )
          }
        />
        <DetailRow
          label="Phone"
          value={
            phoneHref ? (
              <a
                href={`tel:${phoneHref}`}
                className="text-slate-800 transition hover:text-brand"
              >
                {registration.contact.phone}
              </a>
            ) : (
              <span className="text-slate-400">—</span>
            )
          }
        />
        <DetailRow
          label="Instagram"
          value={
            instagramLink ? (
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-cyan-600 transition hover:text-cyan-700 hover:underline"
              >
                {registration.instagram}
              </a>
            ) : (
              <span className="text-slate-400">—</span>
            )
          }
        />
      </dl>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-start sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function CategoryBadge({
  category,
}: {
  category: VendorRegistrationRecord["category"];
}) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
      {formatCategoryLabel(category)}
    </span>
  );
}

function LicensedBadge({
  licensed,
}: {
  licensed: VendorRegistrationRecord["licensed"];
}) {
  const isLicensed = isRegistrationLicensed(licensed);

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isLicensed
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isLicensed ? "Licensed" : "Not licensed"}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
  text = false,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "success";
  text?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold text-slate-900 ${
          text ? "text-sm leading-snug" : "text-2xl"
        } ${tone === "success" ? "text-emerald-700" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
