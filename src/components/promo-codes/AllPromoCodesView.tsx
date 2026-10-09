"use client";

import { useState } from "react";
import Link from "next/link";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import {
  deletePromoCodeById,
  formatActiveLabel,
  formatAuditStamp,
  formatPercent,
  formatPromoDateTime,
  formatRelativeTime,
  formatUsageLine,
  getPromoCodeDeleteErrorMessage,
} from "@/lib/promo-codes";
import type { PromoCodeListTab, PromoCodeRecord } from "@/lib/types";

const PAGE_SIZE = 6;

export default function AllPromoCodesView() {
  const [tab, setTab] = useState<PromoCodeListTab>("admin");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PromoCodeRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { items, total, loading, error, refresh } = usePromoCodes({
    tab,
    page,
    pageSize: PAGE_SIZE,
  });

  function switchTab(next: PromoCodeListTab) {
    setTab(next);
    setPage(1);
    setActionError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setActionError(null);
    try {
      await deletePromoCodeById(deleteTarget.id);
      const nextTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE) || 1);
      if (page > maxPage) setPage(maxPage);
      setDeleteTarget(null);
      refresh();
    } catch (caught) {
      setActionError(getPromoCodeDeleteErrorMessage(caught));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Promo Codes
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            All Promo Codes
          </h2>
        </div>

        <Link
          href="/promo-codes/new"
          className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover sm:self-auto"
        >
          Add
        </Link>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "admin"} onClick={() => switchTab("admin")}>
          Created By Admin
        </TabButton>
        <TabButton
          active={tab === "vendor"}
          onClick={() => switchTab("vendor")}
        >
          Created By Vendor
        </TabButton>
      </div>

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          Loading promo codes…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-red-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          No promo codes in this category yet.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((promo) => (
            <PromoTicketCard
              key={promo.id}
              promo={promo}
              showEdit={tab === "vendor"}
              deleting={deleting && deleteTarget?.id === promo.id}
              onDelete={() => {
                setActionError(null);
                setDeleteTarget(promo);
              }}
            />
          ))}
        </div>
      )}

      {!loading && !error && total > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <PaginationBar
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      {deleteTarget ? (
        <ConfirmDeleteDialog
          code={deleteTarget.code}
          busy={deleting}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}

function PromoTicketCard({
  promo,
  showEdit,
  deleting,
  onDelete,
}: {
  promo: PromoCodeRecord;
  showEdit: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const usagePercent =
    promo.usageLimit === null
      ? promo.usageCount > 0
        ? 8
        : 0
      : Math.min(100, (promo.usageCount / promo.usageLimit) * 100);

  const amountLabel =
    promo.promoCodeType === "fixed" && promo.amountQr !== null
      ? promo.amountQr
      : promo.amountPercent;
  const amountSuffix =
    promo.promoCodeType === "fixed" && promo.amountQr !== null ? "QR" : "%";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex">
        <div className="flex w-[88px] shrink-0 flex-col items-center justify-center border-r border-dashed border-slate-200 bg-gradient-to-b from-brand-soft to-white px-3 py-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
            Code
          </p>
          <p className="mt-1 break-all text-sm font-bold leading-tight text-slate-900">
            {promo.code}
          </p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-brand">
            {amountLabel}
            <span className="text-sm">{amountSuffix}</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            off
          </p>
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <ActiveBadge isActive={promo.isActive} />
            <div className="flex items-center gap-2">
              {showEdit ? (
                <Link
                  href={`/promo-codes/${promo.id}/edit`}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
                >
                  Edit
                </Link>
              ) : null}
              <DeleteButton
                code={promo.code}
                deleting={deleting}
                onDelete={onDelete}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Validity window
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <ValidityBlock label="Start" value={promo.startDate} />
              <span className="hidden self-center text-slate-300 sm:block">→</span>
              <ValidityBlock label="End" value={promo.endDate} />
            </div>
          </div>

          <div
            className={`mt-4 grid gap-3 ${
              promo.createdBy === "vendor" ? "sm:grid-cols-2" : ""
            }`}
          >
            <MetaBlock label="Usage">
              <p className="font-semibold tabular-nums text-slate-900">
                {formatUsageLine(promo.usageCount, promo.usageLimit)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </MetaBlock>

            {promo.createdBy === "vendor" ? (
              <MetaBlock label="Vendor">
                <p className="font-medium text-slate-900">
                  {promo.vendorEnglish || "—"}
                </p>
                {promo.vendorArabic ? (
                  <p className="mt-0.5 text-sm text-slate-600" dir="auto">
                    {promo.vendorArabic}
                  </p>
                ) : null}
              </MetaBlock>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Discount share
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <ShareChip
                label="Amount"
                value={
                  promo.promoCodeType === "fixed"
                    ? `${promo.amountQr ?? promo.amountPercent} QR`
                    : formatPercent(promo.amountPercent)
                }
              />
              <ShareChip
                label="Carts Share"
                value={
                  promo.promoCodeType === "fixed"
                    ? `${promo.cartsSharePercent} QR`
                    : formatPercent(promo.cartsSharePercent)
                }
              />
              <ShareChip
                label="Vendors Share"
                value={
                  promo.promoCodeType === "fixed"
                    ? `${promo.vendorsSharePercent} QR`
                    : formatPercent(promo.vendorsSharePercent)
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <p>{formatAuditStamp("C", promo.createdAt)}</p>
            <p>{formatAuditStamp("U", promo.updatedAt)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ValidityBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{formatPromoDateTime(value)}</p>
      <p className="mt-0.5 text-xs text-red-600">{formatRelativeTime(value)}</p>
    </div>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ShareChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {formatActiveLabel(isActive)}
    </span>
  );
}

function DeleteButton({
  code,
  deleting,
  onDelete,
}: {
  code: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      aria-label={`Delete promo code ${code}`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {deleting ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

function ConfirmDeleteDialog({
  code,
  busy,
  onCancel,
  onConfirm,
}: {
  code: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={busy}
        className="absolute inset-0 bg-slate-950/40"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Delete promo code
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Are you sure you want to delete &quot;{code}&quot;? This cannot be
            undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
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
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-brand text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
