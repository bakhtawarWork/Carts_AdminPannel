"use client";

import Link from "next/link";
import type { CustomerRecord } from "@/lib/types";

type CustomerOrdersViewProps = {
  customer: CustomerRecord;
};

export default function CustomerOrdersView({ customer }: CustomerOrdersViewProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Customers
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Orders — {customer.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Order history for this customer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View profile
          </Link>
          <Link
            href="/customers"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to customers
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white px-5 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <p className="text-sm font-medium text-slate-900">No orders to show yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Customer order history will appear here once the orders API is connected.
        </p>
      </section>
    </div>
  );
}
