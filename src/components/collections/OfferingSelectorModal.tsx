"use client";

import { useEffect, useState } from "react";
import type { CollectionOffering } from "@/lib/collections-types";
import {
  DEFAULT_OFFERING_PLACEHOLDER,
  fetchAvailableOfferings,
} from "@/lib/collections";

type OfferingSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selected: CollectionOffering[]) => void;
  initialSelected?: CollectionOffering[];
};

export default function OfferingSelectorModal({
  isOpen,
  onClose,
  onSave,
  initialSelected = [],
}: OfferingSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"top" | "search">("top");
  const [searchQuery, setSearchQuery] = useState("");
  const [offerings, setOfferings] = useState<CollectionOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, CollectionOffering>>(
    {},
  );

  useEffect(() => {
    if (isOpen) {
      const map: Record<string, CollectionOffering> = {};
      initialSelected.forEach((o) => {
        map[o.id] = o;
      });
      setSelectedMap(map);
      setActiveTab("top");
      setSearchQuery("");
    }
  }, [isOpen, initialSelected]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const list = await fetchAvailableOfferings(
          activeTab === "search" ? searchQuery : "",
          activeTab,
        );
        if (!cancelled) {
          setOfferings(list);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, searchQuery]);

  if (!isOpen) return null;

  function toggleOffering(offering: CollectionOffering) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[offering.id]) {
        delete next[offering.id];
      } else {
        next[offering.id] = offering;
      }
      return next;
    });
  }

  function handleSave() {
    onSave(Object.values(selectedMap));
    onClose();
  }

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Tabs with Brand Theme */}
        <div className="flex w-full border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold transition ${
              activeTab === "top"
                ? "bg-brand text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Top ordered Offerings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold transition ${
              activeTab === "search"
                ? "bg-brand text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            Search Offerings
          </button>
        </div>

        {/* Search Bar when Search Tab is Active */}
        {activeTab === "search" && (
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offerings by vendor, title or type..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Offerings Table */}
        <div className="flex-1 overflow-y-auto max-h-[480px]">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : offerings.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-800">
                No offerings found
              </p>
              {activeTab === "search" && (
                <p className="text-xs text-slate-500 mt-1">
                  Try another search keyword
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="py-3 px-4 text-center w-24">Thumb</th>
                  <th className="py-3 px-4 text-center">Vendor</th>
                  <th className="py-3 px-4 text-center">Offerings</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">
                    Service Type
                  </th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">
                    No. Orders
                  </th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {offerings.map((item) => {
                  const isSelected = Boolean(selectedMap[item.id]);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-brand/5" : ""
                      }`}
                    >
                      {/* Thumb */}
                      <td className="py-3 px-4 text-center align-middle">
                        <img
                          src={item.thumb?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                          alt={item.offeringName || "Offering"}
                          className="h-12 w-16 object-cover rounded-lg border border-slate-200 shadow-xs mx-auto bg-slate-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_OFFERING_PLACEHOLDER;
                          }}
                        />
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4 text-center text-slate-700 font-medium">
                        {item.vendorName}
                      </td>

                      {/* Offerings */}
                      <td className="py-3 px-4 text-center text-slate-900 font-medium">
                        {item.offeringName}
                      </td>

                      {/* Service Type */}
                      <td className="py-3 px-4 text-center capitalize text-slate-700">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {item.serviceType}
                        </span>
                      </td>

                      {/* No. Orders */}
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {item.orderCount}
                      </td>

                      {/* Actions (Red Brand Theme) */}
                      <td className="py-3 px-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => toggleOffering(item)}
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                            isSelected
                              ? "bg-brand text-white shadow-xs hover:bg-brand-hover ring-2 ring-brand/20"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer with Brand Red styling */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-hover transition"
          >
            Save {selectedCount > 0 ? `(${selectedCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
