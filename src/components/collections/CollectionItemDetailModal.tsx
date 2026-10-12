"use client";

import { useState } from "react";
import type { CollectionItem } from "@/lib/collections-types";
import { DEFAULT_OFFERING_PLACEHOLDER } from "@/lib/collections";

type CollectionItemDetailModalProps = {
  item: CollectionItem | null;
  onClose: () => void;
};

export default function CollectionItemDetailModal({
  item,
  onClose,
}: CollectionItemDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!item) return null;

  const currentSub = item.subCategories[activeTab] ?? item.subCategories[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="border-b border-slate-100 bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {item.englishName} <span className="mx-2 text-slate-300">/</span>{" "}
              <span dir="rtl" className="text-slate-700 font-medium">
                {item.arabicName}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Collection Item Details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Images side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-2">
                English Image
              </span>
              <img
                src={item.englishImage?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                alt={item.englishName || "English Image"}
                className="h-44 w-full object-cover rounded-lg shadow-xs bg-slate-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    DEFAULT_OFFERING_PLACEHOLDER;
                }}
              />
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {item.englishName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-2">
                Arabic Image
              </span>
              <img
                src={item.arabicImage?.trim() || item.englishImage?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                alt={item.arabicName || "Arabic Image"}
                className="h-44 w-full object-cover rounded-lg shadow-xs bg-slate-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    DEFAULT_OFFERING_PLACEHOLDER;
                }}
              />
              <p className="mt-2 text-sm font-semibold text-slate-800" dir="rtl">
                {item.arabicName}
              </p>
            </div>
          </div>

          {/* Sub Categories & Offerings */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Sub Categories &amp; Offerings ({item.subCategories.length})
            </h4>

            {item.subCategories.length > 1 && (
              <div className="flex border-b border-slate-200 gap-2">
                {item.subCategories.map((sub, idx) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`py-2 px-3 text-xs font-semibold border-b-2 transition ${
                      activeTab === idx
                        ? "border-brand text-brand"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {sub.englishName} / {sub.arabicName}
                  </button>
                ))}
              </div>
            )}

            {currentSub && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>
                    Category: <strong className="text-slate-900">{currentSub.englishName}</strong>
                  </span>
                  <span dir="rtl">
                    الاسم بالعربي: <strong className="text-slate-900">{currentSub.arabicName}</strong>
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Assigned Offerings ({currentSub.offerings.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSub.offerings.map((off) => (
                      <div
                        key={off.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-xs"
                      >
                        <img
                          src={off.thumb?.trim() || DEFAULT_OFFERING_PLACEHOLDER}
                          alt={off.offeringName || "Offering"}
                          className="h-12 w-16 object-cover rounded-lg border border-slate-200 bg-slate-100"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_OFFERING_PLACEHOLDER;
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {off.offeringName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {off.vendorName}
                          </p>
                          <p className="text-[10px] font-medium text-brand">
                            {off.serviceType} • {off.orderCount} orders
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
