"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useOrders } from "@/hooks/useOrders";
import {
  CANCELLATION_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  UPDATED_LAST_4_DAYS_OPTIONS,
  downloadOrdersCsv,
  fetchOrdersForExport,
  formatOrderDateTime,
  formatPaymentLine,
  formatRelativeTime,
  formatStatusLabel,
  getOrderVendorOptions,
} from "@/lib/orders";
import type { OrderListTab, OrderRecord } from "@/lib/types";

const PAGE_SIZE = 8;

const EMPTY_FILTERS = {
  orderId: "",
  vendorId: "",
  eventDate: "",
  cancellationStatus: "any" as const,
  orderStatus: "",
  updatedInLast4Days: "any" as const,
};

export default function AllOrdersView() {
  const [tab, setTab] = useState<OrderListTab>("active");
  const [orderId, setOrderId] = useState("");
  const [debouncedOrderId, setDebouncedOrderId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [cancellationStatus, setCancellationStatus] =
    useState<"any" | "cancelled" | "not_cancelled">("any");
  const [orderStatus, setOrderStatus] = useState("");
  const [updatedInLast4Days, setUpdatedInLast4Days] =
    useState<"any" | "yes" | "no">("any");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [exporting, setExporting] = useState(false);

  const vendorOptions = useMemo(() => getOrderVendorOptions(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedOrderId(orderId);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [orderId]);

  const { items, total, loading, error } = useOrders({
    tab,
    orderId: debouncedOrderId,
    vendorId,
    eventDate,
    cancellationStatus,
    orderStatus,
    updatedInLast4Days,
    page,
    pageSize: PAGE_SIZE,
    sortDir,
  });

  function resetFilters() {
    setOrderId(EMPTY_FILTERS.orderId);
    setDebouncedOrderId(EMPTY_FILTERS.orderId);
    setVendorId(EMPTY_FILTERS.vendorId);
    setEventDate(EMPTY_FILTERS.eventDate);
    setCancellationStatus(EMPTY_FILTERS.cancellationStatus);
    setOrderStatus(EMPTY_FILTERS.orderStatus);
    setUpdatedInLast4Days(EMPTY_FILTERS.updatedInLast4Days);
    setPage(1);
  }

  function switchTab(next: OrderListTab) {
    setTab(next);
    resetFilters();
  }

  function toggleSort() {
    setSortDir((current) => (current === "desc" ? "asc" : "desc"));
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await fetchOrdersForExport({
        tab,
        orderId: debouncedOrderId || undefined,
        vendorId: vendorId || undefined,
        eventDate: eventDate || undefined,
        cancellationStatus,
        orderStatus: orderStatus || undefined,
        updatedInLast4Days,
        sortDir,
      });
      downloadOrdersCsv(rows, `orders-${tab}-${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(false);
    }
  }

  const activeFilterCount = [
    debouncedOrderId,
    vendorId,
    eventDate,
    cancellationStatus !== "any" ? cancellationStatus : "",
    orderStatus,
    updatedInLast4Days !== "any" ? updatedInLast4Days : "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
              Orders
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              All Orders
            </h2>
          </div>

          <nav
            aria-label="Order tabs"
            className="flex gap-6 border-b border-slate-200 sm:self-end"
          >
            <TabLink active={tab === "active"} onClick={() => switchTab("active")}>
              Active orders
            </TabLink>
            <TabLink
              active={tab === "completed"}
              onClick={() => switchTab("completed")}
            >
              Completed orders
            </TabLink>
          </nav>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
        >
          <ExportIcon />
          {exporting ? "Exporting…" : "Export excel file"}
        </button>
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
              <FilterField label="Order Id">
                <input
                  type="text"
                  inputMode="numeric"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="Search by order id"
                  className={inputClassName}
                />
              </FilterField>

              <FilterField label="Vendor">
                <select
                  value={vendorId}
                  onChange={(event) => {
                    setVendorId(event.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  <option value="">All vendors</option>
                  {vendorOptions.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Event Date">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => {
                    setEventDate(event.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                />
              </FilterField>

              <FilterField label="Cancellation status">
                <select
                  value={cancellationStatus}
                  onChange={(event) => {
                    setCancellationStatus(
                      event.target.value as typeof cancellationStatus,
                    );
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {CANCELLATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Order status">
                <select
                  value={orderStatus}
                  onChange={(event) => {
                    setOrderStatus(event.target.value);
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || "any"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Updated in last 4 days">
                <select
                  value={updatedInLast4Days}
                  onChange={(event) => {
                    setUpdatedInLast4Days(
                      event.target.value as typeof updatedInLast4Days,
                    );
                    setPage(1);
                  }}
                  className={inputClassName}
                >
                  {UPDATED_LAST_4_DAYS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
        <div className="hidden border-b border-slate-100 bg-slate-50/80 px-5 py-3 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_auto] lg:gap-4 lg:text-xs lg:font-semibold lg:uppercase lg:tracking-wide lg:text-slate-500">
          <span>Order Id</span>
          <span>Vendor</span>
          <button
            type="button"
            onClick={toggleSort}
            className="inline-flex items-center gap-1 text-left transition hover:text-slate-800"
          >
            Order Date
            <SortIcon direction={sortDir} />
          </button>
          <span>Delivery Date</span>
          <span>Status</span>
          <span>P. Method (status)</span>
          <span>Total Price</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            Loading orders…
          </div>
        ) : error ? (
          <div className="px-5 py-14 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            No orders match these filters.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((order) => (
              <OrderListItem key={order.id} order={order} onSort={toggleSort} sortDir={sortDir} />
            ))}
          </ul>
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

function OrderListItem({
  order,
  onSort,
  sortDir,
}: {
  order: OrderRecord;
  onSort: () => void;
  sortDir: "asc" | "desc";
}) {
  return (
    <li className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_auto] lg:items-center lg:gap-4">
        <OrderIdCell orderNumber={order.orderNumber} />
        <VendorCell english={order.vendorEnglish} arabic={order.vendorArabic} />
        <DateCell label="Order Date" value={order.orderDate} />
        <DateCell label="Delivery Date" value={order.deliveryDate} />
        <StatusCell order={order} />
        <PaymentCell order={order} />
        <PriceCell price={order.totalPrice} currency={order.currency} />
        <ActionsCell orderId={order.id} />
      </div>

      <article className="space-y-4 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <OrderIdCell orderNumber={order.orderNumber} />
            <div className="mt-2">
              <VendorCell english={order.vendorEnglish} arabic={order.vendorArabic} />
            </div>
          </div>
          <ActionsCell orderId={order.id} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DateCell label="Order Date" value={order.orderDate} />
          <DateCell label="Delivery Date" value={order.deliveryDate} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatusCell order={order} />
          <PaymentCell order={order} />
          <PriceCell price={order.totalPrice} currency={order.currency} />
        </div>

        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 lg:hidden"
        >
          Sort by order date
          <SortIcon direction={sortDir} />
        </button>
      </article>
    </li>
  );
}

function OrderIdCell({ orderNumber }: { orderNumber: number }) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-900">
      {orderNumber}
    </span>
  );
}

function VendorCell({
  english,
  arabic,
}: {
  english: string;
  arabic: string;
}) {
  return (
    <div>
      <p className="font-medium text-slate-900">{english}</p>
      <p className="mt-0.5 text-sm text-slate-600" dir="auto">
        {arabic}
      </p>
    </div>
  );
}

function DateCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
        {label}
      </p>
      <p className="text-sm text-slate-800">{formatOrderDateTime(value)}</p>
      <p className="mt-0.5 text-xs text-amber-700">{formatRelativeTime(value)}</p>
    </div>
  );
}

function StatusCell({ order }: { order: OrderRecord }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
        Status
      </p>
      <p className="text-sm font-semibold capitalize text-slate-900">
        {formatStatusLabel(order.status)}
      </p>
      <p className="mt-0.5 text-xs text-amber-700">
        (last update: {formatRelativeTime(order.statusUpdatedAt).slice(1, -1)})
      </p>
      {order.isLate ? (
        <span className="mt-1.5 inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Late
        </span>
      ) : null}
    </div>
  );
}

function PaymentCell({ order }: { order: OrderRecord }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
        P. Method (status)
      </p>
      <p className="text-sm text-slate-800">
        {formatPaymentLine(order.paymentMethod, order.paymentStatus)}
      </p>
    </div>
  );
}

function PriceCell({
  price,
  currency,
}: {
  price: number;
  currency: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
        Total Price
      </p>
      <p className="text-sm font-semibold tabular-nums text-slate-900">
        {price.toLocaleString("en-US")} {currency}
      </p>
    </div>
  );
}

function ActionsCell({ orderId }: { orderId: string }) {
  return (
    <div className="flex justify-start lg:justify-end">
      <Link
        href={`/orders/${orderId}`}
        className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
        aria-label={`View details for order ${orderId}`}
      >
        Details
      </Link>
    </div>
  );
}

function TabLink({
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
      className={`-mb-px border-b-2 pb-2.5 text-sm font-semibold transition ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
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

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

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

function SortIcon({ direction }: { direction: "asc" | "desc" }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition ${direction === "asc" ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
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

function ExportIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v10M8.5 10.5 12 14l3.5-3.5M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
