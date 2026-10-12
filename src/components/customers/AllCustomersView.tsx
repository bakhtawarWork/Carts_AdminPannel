"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useCustomers } from "@/hooks/useCustomers";
import {
  formatCustomerLastOrdered,
  formatCustomerMoney,
} from "@/lib/customers";
import type { CustomerRecord } from "@/lib/types";

const PAGE_SIZE = 10;

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AllCustomersView() {
  const [nameQuery, setNameQuery] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(nameQuery);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [nameQuery]);

  const { items, total, loading, error } = useCustomers(debouncedName, page, PAGE_SIZE);

  function clearSearch() {
    setNameQuery("");
    setDebouncedName("");
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Customers
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Customers
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Browse customer profiles, order counts, and total spend.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1 text-sm">
              <span className="mb-1.5 block font-medium text-slate-700">
                Search by name
              </span>
              <input
                type="text"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
                placeholder="Search by name"
                className={inputClassName}
              />
            </label>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5 text-center">No. of Orders</th>
                    <th className="px-5 py-3.5 text-right">Total money spent</th>
                    <th className="px-5 py-3.5">Last ordered at</th>
                    <th className="px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        No customers match this search.
                      </td>
                    </tr>
                  ) : (
                    items.map((customer) => (
                      <CustomerRow key={customer.id} customer={customer} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No customers match this search.
                </p>
              ) : (
                items.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
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

function CustomerRow({ customer }: { customer: CustomerRecord }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-5 py-4 font-medium text-slate-900">{customer.name}</td>
      <td className="px-5 py-4 text-center text-slate-700">
        {customer.orderCount}
      </td>
      <td className="px-5 py-4 text-right font-medium text-slate-900">
        {formatCustomerMoney(customer.totalSpent, customer.currency)}
      </td>
      <td className="px-5 py-4 text-slate-600">
        {formatCustomerLastOrdered(customer.lastOrderedAt)}
      </td>
      <td className="px-5 py-4">
        <CustomerActions customer={customer} />
      </td>
    </tr>
  );
}

function CustomerCard({ customer }: { customer: CustomerRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-900">{customer.name}</p>
        <CustomerActions customer={customer} compact />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">No. of orders</dt>
          <dd className="font-medium text-slate-700">{customer.orderCount}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Total spent</dt>
          <dd className="font-medium text-slate-700">
            {formatCustomerMoney(customer.totalSpent, customer.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Last ordered</dt>
          <dd className="text-slate-700">
            {formatCustomerLastOrdered(customer.lastOrderedAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function CustomerActions({
  customer,
  compact = false,
}: {
  customer: CustomerRecord;
  compact?: boolean;
}) {
  const buttonClass = compact
    ? "inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
    : "inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition";

  return (
    <div
      className={`flex ${compact ? "shrink-0 flex-col gap-1.5" : "flex-wrap gap-1.5"}`}
      role="group"
      aria-label={`Actions for ${customer.name}`}
    >
      <Link
        href={`/customers/${customer.id}`}
        className={`${buttonClass} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      >
        View profile
      </Link>
      <Link
        href={`/customers/${customer.id}/orders`}
        className={`${buttonClass} bg-brand text-white shadow-sm hover:bg-brand-hover`}
      >
        View orders
      </Link>
    </div>
  );
}
