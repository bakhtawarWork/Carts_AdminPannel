"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCustomerOrders,
  fetchCustomerProfile,
  formatCustomerMoney,
} from "@/lib/customers";
import {
  formatOrderDateTime,
  formatPaymentLine,
  formatStatusLabel,
} from "@/lib/orders";
import type { CustomerOrderRecord } from "@/lib/types";

type CustomerOrdersViewProps = {
  customerId: string;
};

export default function CustomerOrdersView({
  customerId,
}: CustomerOrdersViewProps) {
  const [customerName, setCustomerName] = useState("Customer");
  const [orders, setOrders] = useState<CustomerOrderRecord[]>([]);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setHeaderLoading(true);
    fetchCustomerProfile(customerId)
      .then((profile) => {
        if (!cancelled && profile?.name) setCustomerName(profile.name);
      })
      .catch(() => {
        if (!cancelled) setCustomerName("Customer");
      })
      .finally(() => {
        if (!cancelled) setHeaderLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useEffect(() => {
    let cancelled = false;

    setOrdersLoading(true);
    setError(null);

    fetchCustomerOrders(customerId)
      .then((items) => {
        if (!cancelled) setOrders(items);
      })
      .catch((caught) => {
        if (!cancelled) {
          setOrders([]);
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load customer orders.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Customers
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Orders — {headerLoading ? "…" : customerName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Order history for this customer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/customers/${customerId}`}
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

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {ordersLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : orders.length === 0 && !error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">
              This customer has no orders in the system.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Event date</th>
                    <th className="px-5 py-3.5">Placed on</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </>
        )}
      </section>

      {!ordersLoading && orders.length > 0 ? (
        <p className="text-sm text-slate-500">
          {orders.length} order{orders.length === 1 ? "" : "s"} shown
        </p>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: CustomerOrderRecord }) {
  return (
    <tr className="align-middle hover:bg-slate-50/70">
      <td className="px-5 py-4 font-medium tabular-nums text-slate-900">
        {order.orderId}
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-5 py-4 text-slate-600">
        {formatOrderDateTime(order.eventDate)}
      </td>
      <td className="px-5 py-4 text-slate-600">
        {formatOrderDateTime(order.createdAt)}
      </td>
      <td className="px-5 py-4 text-slate-600">
        {formatPaymentLine(order.paymentMethod, order.paymentStatus)}
      </td>
      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
        {formatCustomerMoney(order.totalPrice, order.currency)}
      </td>
      <td className="px-5 py-4 text-right">
        <Link
          href={`/orders/${order.orderId}`}
          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function OrderCard({ order }: { order: CustomerOrderRecord }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Order ID
          </p>
          <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
            {order.orderId}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Event</dt>
          <dd className="text-right text-slate-700">
            {formatOrderDateTime(order.eventDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Placed</dt>
          <dd className="text-right text-slate-700">
            {formatOrderDateTime(order.createdAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Payment</dt>
          <dd className="text-right text-slate-700">
            {formatPaymentLine(order.paymentMethod, order.paymentStatus)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold text-slate-900">
            {formatCustomerMoney(order.totalPrice, order.currency)}
          </dd>
        </div>
      </dl>
      <Link
        href={`/orders/${order.orderId}`}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        View order
      </Link>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("cancel") || normalized.includes("reject")
      ? "bg-red-50 text-red-700 ring-red-200"
      : normalized.includes("deliver") || normalized.includes("complete")
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${tone}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
