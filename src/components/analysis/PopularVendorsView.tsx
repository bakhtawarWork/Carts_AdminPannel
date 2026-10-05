"use client";

import Link from "next/link";
import {
  AnalysisThumb,
  PublishedBadge,
  formatBilingual,
} from "@/components/analysis/shared";
import { usePopularVendors } from "@/hooks/usePopularVendors";
import type { PopularVendor } from "@/lib/types";

export default function PopularVendorsView() {
  const { vendors, loading, error } = usePopularVendors();

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to dashboard
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Most Popular Vendors
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Top vendors ranked by number of orders.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Published</th>
                    <th className="px-5 py-3.5">Images</th>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5 text-right">Number Of Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vendor) => (
                    <PopularVendorRow key={vendor.id} vendor={vendor} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {vendors.map((vendor) => (
              <PopularVendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PopularVendorRow({ vendor }: { vendor: PopularVendor }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <PublishedBadge published={vendor.published} />
      </td>
      <td className="px-5 py-4">
        <AnalysisThumb src={vendor.imageUrl} alt={vendor.name} />
      </td>
      <td className="max-w-[320px] px-5 py-4 font-medium text-slate-900">
        <span dir="auto">{formatBilingual(vendor.name, vendor.nameAr)}</span>
      </td>
      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
        {vendor.orderCount.toLocaleString("en-US")}
      </td>
    </tr>
  );
}

function PopularVendorCard({ vendor }: { vendor: PopularVendor }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex gap-3">
        <AnalysisThumb src={vendor.imageUrl} alt={vendor.name} />
        <div className="min-w-0 flex-1">
          <PublishedBadge published={vendor.published} />
          <p className="mt-2 text-sm font-semibold text-slate-900" dir="auto">
            {formatBilingual(vendor.name, vendor.nameAr)}
          </p>
          <p className="mt-3 text-sm font-semibold tabular-nums text-slate-900">
            {vendor.orderCount.toLocaleString("en-US")}{" "}
            <span className="font-medium text-slate-500">orders</span>
          </p>
        </div>
      </div>
    </article>
  );
}
