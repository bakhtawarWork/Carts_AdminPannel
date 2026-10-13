"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCustomerProfile,
  formatCustomerDateTime,
  formatCustomerMoney,
} from "@/lib/customers";
import type { CustomerProfile } from "@/lib/types";

type CustomerProfileViewProps = {
  customerId: string;
};

export default function CustomerProfileView({
  customerId,
}: CustomerProfileViewProps) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCustomerProfile(customerId);
        if (cancelled) return;
        if (!data) {
          setError("Customer not found.");
          return;
        }
        setCustomer(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load customer profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Customer not found."}
        </p>
        <Link
          href="/customers"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Customers
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {customer.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Customer profile</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/customers/${customer.id}/orders`}
            className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            View orders
          </Link>
          <Link
            href="/customers"
            className="inline-flex items-center justify-center self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to customers
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Name" value={customer.name} />
          <DetailItem label="Email" value={customer.email} />
          <DetailItem label="Mobile" value={customer.mobile} />
          <DetailItem
            label="Preferred language"
            value={customer.preferredLanguage}
          />
          <DetailItem
            label="SMS verified"
            value={customer.smsVerified ? "Yes" : "No"}
          />
          <DetailItem
            label="Account blocked"
            value={customer.isBlocked ? "Yes" : "No"}
          />
          <DetailItem
            label="Member since"
            value={formatCustomerDateTime(customer.createdAt)}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900">Order summary</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Total orders"
            value={String(customer.totalNoOfOrders)}
          />
          <DetailItem
            label="Successful orders"
            value={String(customer.successfulOrders)}
          />
          <DetailItem
            label="Cancelled orders"
            value={String(customer.cancelledOrders)}
          />
          <DetailItem
            label="Active orders"
            value={String(customer.activeOrders)}
          />
          <DetailItem
            label="Rejected orders"
            value={String(customer.rejectedOrders)}
          />
          <DetailItem
            label="Total money spent"
            value={formatCustomerMoney(
              customer.totalMoneySpent,
              customer.currency,
            )}
          />
          {customer.successfulOrderCount > 0 ? (
            <DetailItem
              label="Paid orders (spend count)"
              value={String(customer.successfulOrderCount)}
            />
          ) : null}
        </dl>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
