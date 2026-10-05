"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveStatusLabel,
  copyVendorOffering,
  deleteVendorOffering,
  deriveOfferingCategories,
  fetchVendorOfferings,
  formatBilingualLabel,
  formatOfferingPrice,
  offeringMatchesCategory,
} from "@/lib/vendor-offerings";
import type { VendorOfferingRecord } from "@/lib/types";

type VendorOfferingsViewProps = {
  vendorId: string;
};

type CategoryTab = "all" | string;

export default function VendorOfferingsView({
  vendorId,
}: VendorOfferingsViewProps) {
  const [vendorName, setVendorName] = useState<{ en: string; ar: string } | null>(
    null,
  );
  const [offerings, setOfferings] = useState<VendorOfferingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorOfferingRecord | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadOfferings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVendorOfferings(vendorId);
      setVendorName(response.vendor.name);
      setOfferings(response.offerings);
    } catch (caught) {
      setVendorName(null);
      setOfferings([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load vendor offerings.",
      );
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void loadOfferings();
  }, [loadOfferings]);

  const categories = useMemo(
    () => deriveOfferingCategories(offerings),
    [offerings],
  );

  const filteredOfferings = useMemo(() => {
    if (activeTab === "all") return offerings;
    return offerings.filter((offering) =>
      offeringMatchesCategory(offering, activeTab),
    );
  }, [activeTab, offerings]);

  const groupedOfferings = useMemo(() => {
    if (activeTab !== "all") {
      return [
        {
          id: activeTab,
          label:
            categories.find((category) => category.id === activeTab)?.name ??
            filteredOfferings[0]?.category?.name ?? {
              en: "Offerings",
              ar: "العروض",
            },
          items: filteredOfferings,
        },
      ];
    }

    const groups = categories
      .map((category) => ({
        id: category.id,
        label: category.name,
        items: offerings.filter((offering) =>
          offeringMatchesCategory(offering, category.id),
        ),
      }))
      .filter((group) => group.items.length > 0);

    return groups;
  }, [activeTab, categories, filteredOfferings, offerings]);

  const approvedCount = offerings.filter(
    (offering) => offering.approveStatus === "approved",
  ).length;
  const publishedCount = offerings.filter((offering) => offering.published).length;

  async function handleCopy(offeringId: string) {
    setBusyId(offeringId);
    setError(null);
    setMessage(null);
    try {
      await copyVendorOffering(vendorId, offeringId);
      await loadOfferings();
      setMessage("Offering copied. The duplicate is pending approval.");
    } catch {
      setError("Could not copy offering.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError(null);
    setMessage(null);
    try {
      await deleteVendorOffering(vendorId, deleteTarget.id);
      setDeleteTarget(null);
      await loadOfferings();
      setMessage("Offering deleted.");
    } catch {
      setError("Could not delete offering.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading offerings…
      </div>
    );
  }

  if (!vendorName) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-12 text-center text-sm text-red-700">
        {error ?? "Vendor not found."}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
              <Link href="/vendors" className="hover:underline">
                Vendors
              </Link>
              <span className="mx-1.5 text-slate-400">/</span>
              <span>Offerings</span>
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {formatBilingualLabel(vendorName)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage offerings grouped by category for this vendor.
            </p>
          </div>

          <Link
            href={`/vendors/${vendorId}/offerings/new`}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            <PlusIcon />
            Create offering
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total offerings" value={offerings.length} />
          <StatCard label="Approved" value={approvedCount} tone="success" />
          <StatCard label="Published" value={publishedCount} tone="brand" />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="light-scroll flex gap-2 overflow-x-auto pb-1">
            <CategoryChip
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label="All categories"
              count={offerings.length}
            />
            {categories.map((category) => {
              const count = offerings.filter((offering) =>
                offeringMatchesCategory(offering, category.id),
              ).length;
              return (
                <CategoryChip
                  key={category.id}
                  active={activeTab === category.id}
                  onClick={() => setActiveTab(category.id)}
                  label={formatBilingualLabel(category.name)}
                  count={count}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="light-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        {filteredOfferings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            No offerings in this category yet.
          </div>
        ) : (
          <div className="space-y-6 pb-2">
            {groupedOfferings.map((group) => (
              <section key={group.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    {formatBilingualLabel(group.label)}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {group.items.length} offering
                    {group.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {group.items.map((offering) => (
                    <OfferingCard
                      key={offering.id}
                      offering={offering}
                      vendorId={vendorId}
                      busy={busyId === offering.id}
                      onCopy={() => handleCopy(offering.id)}
                      onDelete={() => setDeleteTarget(offering)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {message ? (
        <p className="mt-3 shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}

      {deleteTarget ? (
        <ConfirmModal
          title="Delete offering"
          message={`Delete "${deleteTarget.name.en.trim()}"? This cannot be undone.`}
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

function OfferingCard({
  offering,
  vendorId,
  busy,
  onCopy,
  onDelete,
}: {
  offering: VendorOfferingRecord;
  vendorId: string;
  busy: boolean;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {offering.thumbUrl ? (
            // Remote offering thumbs come from the API CDN/S3 host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offering.thumbUrl}
              alt={offering.thumbAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-slate-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ApproveBadge status={offering.approveStatus} />
            <PublishedBadge published={offering.published} />
          </div>
          <h4 className="mt-2 font-semibold text-slate-900">
            {offering.name.en.trim()}
          </h4>
          <p className="mt-0.5 text-sm text-slate-600" dir="auto">
            {offering.name.ar.trim()}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            From {formatOfferingPrice(offering.startingPrice)} ·{" "}
            {formatOfferingPrice(offering.price)} per item
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <ActionChip label="Copy" onClick={onCopy} disabled={busy}>
          <CopyIcon />
        </ActionChip>
        <Link
          href={`/vendors/${vendorId}/offerings/${offering.id}/edit`}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <EditIcon />
          Edit
        </Link>
        <ActionChip
          label="Delete"
          onClick={onDelete}
          disabled={busy}
          danger
        >
          <DeleteIcon />
        </ActionChip>
      </div>
    </article>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
        active
          ? "bg-brand text-white shadow-sm"
          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="max-w-[220px] truncate">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] ${
          active ? "bg-white/20 text-white" : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ApproveBadge({
  status,
}: {
  status: VendorOfferingRecord["approveStatus"];
}) {
  const styles = {
    approved: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  }[status];

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {approveStatusLabel(status)}
    </span>
  );
}

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        published
          ? "bg-slate-100 text-slate-600"
          : "bg-slate-50 text-slate-400"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "brand";
}) {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-900",
    success: "border-emerald-100 bg-emerald-50/60 text-emerald-800",
    brand: "border-red-100 bg-red-50/60 text-red-800",
  }[tone];

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function ConfirmModal({
  title,
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
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
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="px-5 py-4 text-sm leading-relaxed text-slate-600">
          {message}
        </p>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 16V6a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m4 20 1.2-4.2L15.3 5.7a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L8.2 20H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8l8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
