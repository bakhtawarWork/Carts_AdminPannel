"use client";

import { useMemo, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useVendorRegistrations } from "@/hooks/useVendorRegistrations";
import {
  formatCategoryLabel,
  formatRegistrationDate,
  instagramHref,
  isRegistrationLicensed,
} from "@/lib/vendor-registrations";
import type { VendorRegistrationRecord } from "@/lib/types";

const PAGE_SIZE = 20;

export default function VendorRegistrationsView() {
  const [page, setPage] = useState(1);

  const { items, total, loading, error } = useVendorRegistrations({
    page,
    pageSize: PAGE_SIZE,
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">
            {loading
              ? "Loading…"
              : `${total} registration${total === 1 ? "" : "s"}`}
          </p>
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
              Vendor signup requests will appear here.
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
