"use client";

import Link from "next/link";
import { formatBilingual } from "@/components/analysis/shared";
import { usePopularCategories } from "@/hooks/usePopularCategories";
import { formatCategoryDate } from "@/lib/popular-categories";
import type { PopularCategory } from "@/lib/types";

export default function PopularCategoriesView() {
  const { categories, loading, error } = usePopularCategories();

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
          Most Popular Categories
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Top categories ranked by number of orders.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white"
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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Created At</th>
                    <th className="px-5 py-3.5">Approve Status</th>
                    <th className="px-5 py-3.5 text-right">Number Of Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <CategoryRow key={category.id} category={category} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CategoryRow({ category }: { category: PopularCategory }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="max-w-[320px] px-5 py-4 font-medium text-slate-900">
        <span dir="auto">{formatBilingual(category.name, category.nameAr)}</span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
        {formatCategoryDate(category.createdAt)}
      </td>
      <td className="px-5 py-4 text-slate-500">
        {category.approveStatus ?? "—"}
      </td>
      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
        {category.orderCount.toLocaleString("en-US")}
      </td>
    </tr>
  );
}

function CategoryCard({ category }: { category: PopularCategory }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-semibold text-slate-900" dir="auto">
        {formatBilingual(category.name, category.nameAr)}
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-slate-500">Created At</dt>
          <dd className="text-right text-slate-700">
            {formatCategoryDate(category.createdAt)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-slate-500">Approve Status</dt>
          <dd className="text-right text-slate-700">
            {category.approveStatus ?? "—"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-slate-500">Orders</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {category.orderCount.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
