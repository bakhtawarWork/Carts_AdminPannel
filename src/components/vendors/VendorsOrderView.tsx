"use client";

import { useEffect, useState } from "react";
import {
  fetchVendorOrder,
  reorderVendorItems,
  saveVendorOrder,
} from "@/lib/vendor-order";
import type { VendorOrderItem } from "@/lib/types";

export default function VendorsOrderView() {
  const [items, setItems] = useState<VendorOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchVendorOrder();
        if (!cancelled) setItems(response.items);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load vendor order.",
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
  }, []);

  async function persistOrder(
    vendorId: string,
    newOrder: number,
    previousItems: VendorOrderItem[],
  ) {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await saveVendorOrder(vendorId, newOrder);
      setMessage(result.message);
    } catch (caught) {
      setItems(previousItems);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save vendor order.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex || saving) {
      setDraggedIndex(null);
      setOverIndex(null);
      return;
    }

    const moved = items[draggedIndex];
    const previousItems = items;
    const nextItems = reorderVendorItems(items, draggedIndex, targetIndex);
    const newOrder = nextItems.findIndex((item) => item.id === moved.id);

    setItems(nextItems);
    setDraggedIndex(null);
    setOverIndex(null);

    if (newOrder < 0 || newOrder === draggedIndex) return;
    void persistOrder(moved.id, newOrder, previousItems);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Vendors
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Vendors Order
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Drag vendors up or down to change the display sequence.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          Loading vendor order…
        </div>
      ) : error && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-red-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          {error}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
            <p className="text-sm font-semibold text-slate-900">
              Vendor sequence
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {items.length} vendors · {saving ? "Saving…" : "Drag to reorder"}
            </p>
          </div>

          <ul className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <li
                key={item.id}
                draggable={!saving}
                onDragStart={() => {
                  if (saving) return;
                  setDraggedIndex(index);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverIndex(index);
                }}
                onDragLeave={() => {
                  setOverIndex((current) => (current === index ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(index);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setOverIndex(null);
                }}
                className={`flex items-center gap-3 px-4 py-3.5 transition sm:px-5 ${
                  draggedIndex === index
                    ? "bg-brand-soft/70 opacity-60"
                    : overIndex === index && draggedIndex !== null
                      ? "bg-brand-soft/40"
                      : "bg-white hover:bg-slate-50/80"
                }`}
              >
                <button
                  type="button"
                  aria-label={`Drag ${item.englishName}`}
                  className="cursor-grab text-slate-400 active:cursor-grabbing"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <DragHandleIcon />
                </button>

                <span className="min-w-[2rem] text-sm font-semibold tabular-nums text-brand">
                  {index + 1}
                </span>

                <p className="min-w-0 flex-1 text-sm text-slate-800" dir="auto">
                  <span className="font-medium text-slate-900">
                    {item.englishName}
                  </span>
                  <span className="text-slate-500"> / </span>
                  <span>{item.arabicName}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
      {error && items.length > 0 ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6h10M9 12h10M9 18h10M5 6h.01M5 12h.01M5 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
