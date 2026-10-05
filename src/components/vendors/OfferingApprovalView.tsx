"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PublishedStatus } from "@/components/ui/PublishedStatus";
import {
  approveOfferingApproval,
  approveOfferingDeletion,
  fetchOfferingApprovals,
  formatOfferingApprovalDate,
  rejectOfferingApproval,
  rejectOfferingDeletion,
} from "@/lib/offering-approval";
import type { OfferingApprovalRecord, OfferingApprovalTab } from "@/lib/types";

const PAGE_SIZE = 8;

export default function OfferingApprovalView() {
  const [tab, setTab] = useState<OfferingApprovalTab>("new");
  const [items, setItems] = useState<OfferingApprovalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApprovals = useCallback(
    async (targetTab: OfferingApprovalTab, targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchOfferingApprovals({
          tab: targetTab,
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      } catch (caught) {
        setItems([]);
        setTotal(0);
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load offering approvals.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadApprovals(tab, page);
  }, [loadApprovals, tab, page]);

  function switchTab(next: OfferingApprovalTab) {
    setTab(next);
    setPage(1);
    setMessage(null);
  }

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const result =
        tab === "new"
          ? await approveOfferingApproval(id)
          : await approveOfferingDeletion(id);
      setMessage(result.message);
      await loadApprovals(tab, page);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : tab === "delete"
            ? "Could not approve deletion."
            : "Could not approve offering.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const result =
        tab === "new"
          ? await rejectOfferingApproval(id)
          : await rejectOfferingDeletion(id);
      setMessage(result.message);
      await loadApprovals(tab, page);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : tab === "delete"
            ? "Could not reject deletion."
            : "Could not reject offering.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const emptyMessage =
    tab === "delete"
      ? "No deletion requests waiting for approval."
      : "No new offerings waiting for approval.";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Vendors
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Offering Approval
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {tab === "delete"
            ? "Vendor deletion requests waiting for your approval"
            : "New vendor offerings waiting for approval"}
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <TabButton active={tab === "new"} onClick={() => switchTab("new")}>
          <StatusDot />
          New offering approval
        </TabButton>
        <TabButton active={tab === "delete"} onClick={() => switchTab("delete")}>
          <StatusDot tone="red" />
          Delete offering approval
        </TabButton>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          Loading offering approvals…
        </div>
      ) : error && items.length === 0 ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-16 text-center text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              tab={tab}
              busy={busyId === item.id}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              editHref={`/vendors/offering-approval/${item.id}/edit`}
            />
          ))}
        </div>
      )}

      {!loading && total > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <PaginationBar
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {message}
        </p>
      ) : null}
      {error && items.length > 0 ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}
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
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function ApprovalCard({
  item,
  tab,
  busy,
  onApprove,
  onReject,
  editHref,
}: {
  item: OfferingApprovalRecord;
  tab: OfferingApprovalTab;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  editHref: string;
}) {
  const approveLabel = tab === "delete" ? "Approve deletion" : "Approve";
  const rejectLabel = tab === "delete" ? "Reject deletion" : "Reject";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      {tab === "delete" ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          Vendor requested to delete this offering — approve to remove it from the
          catalog.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <PublishedStatus published={item.published} />

          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {item.thumbUrl ? (
              // Remote offering thumbs come from the API host.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbUrl}
                alt={item.thumbAlt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-slate-400">
                No image
              </div>
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              Thumb
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoPanel label="Vendor">
              <p className="font-medium text-slate-900">{item.vendorEnglish}</p>
              <p className="mt-0.5 text-sm text-slate-600" dir="auto">
                {item.vendorArabic}
              </p>
            </InfoPanel>

            <InfoPanel label="Offering category">
              <p className="font-medium text-slate-900">
                {item.categoryEnglish}
              </p>
              <p className="mt-0.5 text-sm text-slate-600" dir="auto">
                {item.categoryArabic}
              </p>
            </InfoPanel>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InfoPanel label="English name">
              <p className="text-sm font-semibold text-slate-900">
                {item.englishName}
              </p>
            </InfoPanel>
            <InfoPanel label="Arabic name">
              <p className="text-sm font-semibold text-slate-900" dir="auto">
                {item.arabicName}
              </p>
            </InfoPanel>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoPanel label="Created">
              <p className="text-sm text-slate-800">
                {formatOfferingApprovalDate(item.createdAt)}
              </p>
            </InfoPanel>
            <InfoPanel label="Updated">
              <p className="text-sm text-slate-800">
                {formatOfferingApprovalDate(item.updatedAt)}
              </p>
            </InfoPanel>
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <ActionButton
            label={approveLabel}
            tone="approve"
            disabled={busy}
            onClick={onApprove}
          />
          <ActionButton
            label={rejectLabel}
            tone="reject"
            disabled={busy}
            onClick={onReject}
          />
          <Link
            href={editHref}
            className={`min-w-[108px] rounded-lg px-4 py-2 text-center text-sm font-semibold transition bg-amber-500 text-white hover:bg-amber-600 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            Edit
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50/90 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  tone: "approve" | "reject" | "edit";
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles = {
    approve: "bg-emerald-600 text-white hover:bg-emerald-700",
    reject: "bg-brand text-white hover:bg-brand-hover",
    edit: "bg-amber-500 text-white hover:bg-amber-600",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[108px] rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {label}
    </button>
  );
}

function StatusDot({ tone = "brand" }: { tone?: "brand" | "red" }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${
        tone === "red" ? "bg-red-500" : "bg-brand"
      }`}
    />
  );
}
