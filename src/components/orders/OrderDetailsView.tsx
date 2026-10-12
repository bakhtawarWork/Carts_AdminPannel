"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cancelOrderByAdmin,
  fetchOrderDetail,
  formatApprovedLabel,
  formatDecidedLabel,
  formatJoinDate,
  formatOrderDateTime,
  formatRelativeTime,
  formatStatusLabel,
  isCancellationPending,
} from "@/lib/orders";
import type { OrderCancellationRequest, OrderDetail } from "@/lib/types";

type OrderDetailsViewProps = {
  orderId: string;
};

export default function OrderDetailsView({ orderId }: OrderDetailsViewProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderDetail(orderId);
        if (cancelled) return;
        if (!data) {
          setError("Order not found.");
          return;
        }
        setOrder(data);
      } catch {
        if (!cancelled) setError("Unable to load order details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  function handleCancellationDecision(
    requestId: string,
    decision: "approve" | "reject",
  ) {
    setOrder((current) => {
      if (!current) return current;
      const now = new Date().toISOString();
      return {
        ...current,
        cancellationRequests: current.cancellationRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                decided: true,
                decidedBy: "admin",
                decidedDate: now,
                approved: decision === "approve",
              }
            : request,
        ),
      };
    });
  }

  async function handleCancelOrder() {
    if (cancelling) return;

    setCancelling(true);
    setCancelFeedback(null);

    try {
      const targetId = order?.orderNumber ?? orderId;
      const response = await cancelOrderByAdmin(targetId, { isApproved: true });

      setCancelFeedback({
        type: "success",
        text: response?.message || "Order canceled successfully",
      });

      try {
        const fresh = await fetchOrderDetail(String(targetId));
        if (fresh) {
          setOrder(fresh);
          return;
        }
      } catch {
        // Fall back to local state update if refetching fails
      }

      setOrder((current) => {
        if (!current) return current;
        const now = new Date().toISOString();
        return {
          ...current,
          status: "canceled",
          isCancelled: true,
          history: [
            ...current.history,
            {
              id: `hist-cancel-${Date.now()}`,
              date: now,
              status: "canceled",
              by: "admin",
            },
          ],
        };
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel order.";
      setCancelFeedback({
        type: "error",
        text: message,
      });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading order details…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-red-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {error ?? "Order not found."}
        </div>
        <BackLink />
      </div>
    );
  }

  const ratingLabel =
    order.vendor.rating === null
      ? `/ 100 (${order.vendor.reviewCount} reviews)`
      : `${order.vendor.rating} / 100 (${order.vendor.reviewCount} reviews)`;

  const isOrderCancelled = Boolean(
    order.isCancelled ||
      order.status?.toLowerCase() === "canceled" ||
      order.status?.toLowerCase() === "cancelled",
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BackLink />
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-white sm:px-5">
          <p className="text-sm font-semibold tracking-wide">
            ORDER# {order.orderNumber}
            <span className="mx-2 text-slate-400">|</span>
            <span className="uppercase">{formatStatusLabel(order.status)}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DetailCard title="Order details" className="xl:col-span-1">
          <InfoRow label="Status" value={formatStatusLabel(order.status)} />
          <DateRow label="Order date" value={order.orderDate} />
          <DateRow label="Event date" value={order.deliveryDate} />
        </DetailCard>

        <DetailCard title="Payment details" className="xl:col-span-1">
          <InfoRow label="Payment method" value={order.paymentMethod} />
          <InfoRow label="Payment status" value={order.paymentStatus} />
          <InfoRow
            label="Sub total"
            value={`${order.subTotal.toLocaleString("en-US")} ${order.currency}`}
          />
          <InfoRow
            label="Delivery charges"
            value={`${order.deliveryCharges.toLocaleString("en-US")} ${order.currency}`}
          />
          <InfoRow
            label="Total price"
            value={`${order.totalPrice.toLocaleString("en-US")} ${order.currency}`}
            emphasis
          />
        </DetailCard>

        <DetailCard title="Vendor" className="xl:col-span-1">
          <InfoRow
            label="Name"
            value={`${order.vendor.englishName} ${order.vendor.arabicName}`}
          />
          <InfoRow label="Rating" value={ratingLabel} />
        </DetailCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <DetailCard title="Customer address">
          <InfoRow label="Area" value={formatAreaLabel(order.address)} />
          <InfoRow label="Street" value={order.address.street || "—"} />
          <InfoRow label="Building" value={order.address.building || "—"} />
          <InfoRow label="Floor" value={order.address.floor || "—"} />
          <InfoRow label="Apartment" value={order.address.apartment || "—"} />
          <InfoRow label="Mobile" value={order.address.mobile || "—"} />
          {order.address.mapsUrl ? (
            <a
              href={order.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Open in Maps
            </a>
          ) : null}
        </DetailCard>

        <DetailCard title="Customer">
          <InfoRow label="Name" value={order.customer.name} />
          <InfoRow label="Mobile" value={order.customer.mobile} />
          <InfoRow label="Email" value={order.customer.email} />
          <InfoRow
            label="Join date"
            value={formatJoinDate(order.customer.joinDate)}
          />
        </DetailCard>
      </div>

      <DetailCard title="Order history">
        <ol className="space-y-0">
          {order.history.map((entry, index) => (
            <li
              key={entry.id}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {index < order.history.length - 1 ? (
                <span
                  className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-slate-200"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-brand bg-brand-soft" />
              <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatOrderDateTime(entry.date)}
                    </p>
                    <p className="mt-0.5 text-xs text-red-600">
                      {formatRelativeTime(entry.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{formatStatusLabel(entry.status)}</Badge>
                    <Badge tone="slate">By {entry.by}</Badge>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!isOrderCancelled ? (
          <div className="mt-4 flex flex-col gap-2">
            {cancelFeedback ? (
              <div
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  cancelFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {cancelFeedback.text}
              </div>
            ) : null}

            <div>
              <button
                type="button"
                onClick={() => void handleCancelOrder()}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Canceling order…</span>
                  </>
                ) : (
                  <span>Cancel order</span>
                )}
              </button>
            </div>
          </div>
        ) : cancelFeedback ? (
          <div
            className={`mt-4 rounded-lg px-3.5 py-2 text-sm font-medium ${
              cancelFeedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {cancelFeedback.text}
          </div>
        ) : null}
      </DetailCard>

      <DetailCard title="Cancelation requests">
        {order.cancellationRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No cancelation requests
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Initiator, reason, decision, and approval details will appear
              here when a request is submitted.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {order.cancellationRequests.map((request) => (
              <CancellationRequestCard
                key={request.id}
                request={request}
                showActions={!isOrderCancelled}
                onDecision={handleCancellationDecision}
              />
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
}

function CancellationRequestCard({
  request,
  onDecision,
  showActions = true,
}: {
  request: OrderCancellationRequest;
  onDecision: (requestId: string, decision: "approve" | "reject") => void;
  showActions?: boolean;
}) {
  const pending = isCancellationPending(request);

  const gridColsClass = showActions
    ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1fr)_0.6fr_0.8fr_1fr_0.7fr_auto]"
    : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1fr)_0.6fr_0.8fr_1fr_0.7fr]";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className={`hidden lg:grid ${gridColsClass} lg:gap-3 lg:border-b lg:border-slate-100 lg:bg-slate-50/80 lg:px-4 lg:py-2.5 lg:text-[11px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-slate-500`}
      >
        <span>Initiator</span>
        <span>Initiated date</span>
        <span>Cancelation reason</span>
        <span>Decided?</span>
        <span>Decided by</span>
        <span>Decided date</span>
        <span>Approved?</span>
        {showActions ? <span className="text-right">Actions</span> : null}
      </div>

      <div
        className={`grid gap-3 p-4 ${gridColsClass} lg:items-center lg:gap-3 lg:px-4 lg:py-3`}
      >
        <InfoRow label="Initiator" value={request.initiator} compact />
        <DateRow label="Initiated date" value={request.initiatedDate} compact />
        <InfoRow
          label="Cancelation reason"
          value={request.cancellationReason || "—"}
          compact
        />
        <InfoRow
          label="Decided?"
          value={formatDecidedLabel(request.decided)}
          compact
        />
        <InfoRow label="Decided by" value={request.decidedBy ?? "—"} compact />
        <InfoRow
          label="Decided date"
          value={
            request.decidedDate
              ? formatOrderDateTime(request.decidedDate)
              : "—"
          }
          compact
        />
        <InfoRow
          label="Approved?"
          value={formatApprovedLabel(request.approved)}
          compact
        />

        {showActions ? (
          <div className="flex flex-col gap-2 lg:items-end">
            {pending ? (
              <>
                <button
                  type="button"
                  onClick={() => onDecision(request.id, "approve")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onDecision(request.id, "reject")}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
                >
                  Reject
                </button>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-500">Resolved</span>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatAreaLabel(address: OrderDetail["address"]) {
  const area = [address.areaEnglish, address.areaArabic]
    .filter(Boolean)
    .join(" / ");
  const zone = [address.zoneEnglish, address.zoneArabic]
    .filter(Boolean)
    .join(" / ");

  if (zone && area) return `(${zone}) ${area}`;
  return area || zone || "—";
}

function BackLink() {
  return (
    <Link
      href="/orders"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m14 6-6 6 6 6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back to all orders
    </Link>
  );
}

function DetailCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
        {title}
      </h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  emphasis = false,
  compact = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`text-sm ${emphasis ? "font-semibold text-slate-900" : "text-slate-800"}`}
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}

function DateRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-800">{formatOrderDateTime(value)}</p>
      <p className="text-xs text-red-600">{formatRelativeTime(value)}</p>
    </div>
  );
}

function Badge({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "slate";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        tone === "brand"
          ? "bg-brand-soft text-brand"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}
