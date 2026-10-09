"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteBanner,
  fetchBanners,
  formatBannerRedirectionLabel,
  formatBannerTypeLabel,
  toggleBannerStatus,
} from "@/lib/banners";
import type { BannerRecord, BannerType } from "@/lib/types";

type BannerFilter = "all" | BannerType;

export default function AllBannersView() {
  const [filter, setFilter] = useState<BannerFilter>("all");
  const [items, setItems] = useState<BannerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load(nextFilter: BannerFilter = filter) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBanners(nextFilter);
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load banners.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const stats = useMemo(() => {
    const mainCount = items.filter((item) => item.type === "main").length;
    const subCount = items.filter((item) => item.type === "sub").length;
    return {
      total: items.length,
      mainCount: filter === "all" ? mainCount : filter === "main" ? items.length : 0,
      subCount: filter === "all" ? subCount : filter === "sub" ? items.length : 0,
    };
  }, [items, filter]);

  async function handleToggleStatus(banner: BannerRecord) {
    setTogglingId(banner.id);
    try {
      await toggleBannerStatus(banner.id, banner.isActive);
      setItems((prev) =>
        prev.map((item) =>
          item.id === banner.id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status.",
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(banner: BannerRecord) {
    const confirmed = window.confirm(`Delete banner "${banner.name}"?`);
    if (!confirmed) return;

    setDeletingId(banner.id);
    try {
      await deleteBanner(banner.id);
      await load(filter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete banner.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Banner
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            All banners
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage main and sub banners shown on the landing page.
          </p>
        </div>

        <Link
          href="/banners/new"
          className="inline-flex items-center justify-center self-start rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
        >
          Add banner
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        <FilterChip
          active={filter === "main"}
          onClick={() => setFilter("main")}
          label="Main banner"
        />
        <FilterChip
          active={filter === "sub"}
          onClick={() => setFilter("sub")}
          label="Sub banner"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Showing" value={stats.total} />
        <StatCard label="Main" value={stats.mainCount} />
        <StatCard label="Sub" value={stats.subCount} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          Loading banners…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-red-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium text-slate-700">No banners yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create a main or sub banner to get started.
          </p>
          <Link
            href="/banners/new"
            className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Add banner
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((banner) => (
            <article
              key={banner.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="relative aspect-[16/7] bg-slate-100">
                {banner.imageUrl ? (
                  <Image
                    src={banner.imageUrl}
                    alt={banner.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No image
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    banner.type === "main"
                      ? "bg-brand text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {formatBannerTypeLabel(banner.type)}
                </span>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {banner.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(banner)}
                        disabled={togglingId === banner.id}
                        title="Click to toggle status"
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold transition hover:opacity-80 disabled:opacity-60 ${
                          banner.isActive
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {togglingId === banner.id
                          ? "Updating…"
                          : banner.isActive
                            ? "Active"
                            : "Inactive"}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Sequence:{" "}
                      <span className="font-semibold tabular-nums text-slate-800">
                        {banner.sequence}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/banners/${banner.id}/edit`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === banner.id}
                      onClick={() => void handleDelete(banner)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === banner.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>

                {banner.type === "sub" ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Redirection path
                    </p>
                    <p className="mt-1 text-sm text-slate-800">
                      {formatBannerRedirectionLabel(banner.redirectionPath)}
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-brand text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}
