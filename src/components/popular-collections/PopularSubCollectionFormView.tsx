"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collectionRoutes,
  type CollectionSection,
} from "@/lib/collection-routes";
import {
  createEmptySubCollectionForm,
  fetchPopularCollectionById,
  savePopularSubCollectionForm,
  subCollectionToFormData,
  validateSubCollectionForm,
} from "@/lib/popular-collections";
import {
  addSubCollectionItemsApi,
  getSubCollectionDataApi,
  getSubCollectionItemsApi,
  removeSubCollectionItemApi,
  type ApiSubCollectionItem,
} from "@/services/popular-collections";
import { fetchAvailableOfferings } from "@/lib/collections";
import type { CollectionOffering } from "@/lib/collections-types";
import {
  ensureVendorFilterOptionsLoaded,
  type VendorFilterOption,
} from "@/lib/vendors";
import type { PopularSubCollectionFormData } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

function getItemId(item: ApiSubCollectionItem | Record<string, unknown>): string {
  const obj = item as Record<string, unknown>;
  return String(obj._id || obj.id || "");
}

function getItemEnglishName(item: ApiSubCollectionItem | Record<string, unknown>): string {
  const obj = item as Record<string, unknown>;
  if (typeof obj.name === "object" && obj.name !== null) {
    const nameObj = obj.name as Record<string, unknown>;
    return String(nameObj.en || nameObj.ar || "");
  }
  return String(obj.name || obj.englishName || "");
}

function getItemArabicName(item: ApiSubCollectionItem | Record<string, unknown>): string {
  const obj = item as Record<string, unknown>;
  if (typeof obj.name === "object" && obj.name !== null) {
    const nameObj = obj.name as Record<string, unknown>;
    return String(nameObj.ar || "");
  }
  return String(obj.arabicName || "");
}

function getItemVendorName(item: ApiSubCollectionItem | Record<string, unknown>): string {
  const obj = item as Record<string, unknown>;
  if (obj.vendor && typeof obj.vendor === "object") {
    const vObj = obj.vendor as Record<string, unknown>;
    if (vObj.name && typeof vObj.name === "object") {
      const nameObj = vObj.name as Record<string, unknown>;
      return String(nameObj.en || nameObj.ar || "-");
    }
    return String(vObj.name || "-");
  }
  return "-";
}

function SearchableDropdown({
  placeholder,
  options,
  onSelect,
  disabled,
  busy,
}: {
  placeholder: string;
  options: Array<{ id: string; label: string; subLabel?: string }>;
  onSelect: (id: string) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)),
    );
  }, [options, search]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className={open ? "text-slate-900 font-medium" : "text-slate-500"}>
          {busy ? "Updating…" : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search…"
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50 p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-slate-500">
                {search ? "No matches found" : "No available options"}
              </li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(opt.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-xs transition hover:bg-slate-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-900">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-slate-500 text-[11px] mt-0.5">
                        {opt.subLabel}
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function PopularSubCollectionFormView({
  collectionId,
  subId,
  section = "popular",
}: {
  collectionId: string;
  subId?: string;
  section?: CollectionSection;
}) {
  const routes = collectionRoutes(section);
  const router = useRouter();

  const [activeSubId, setActiveSubId] = useState<string | undefined>(subId);
  const isEdit = Boolean(activeSubId);

  const [parentName, setParentName] = useState("");
  const [form, setForm] = useState<PopularSubCollectionFormData>(
    createEmptySubCollectionForm(collectionId),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [itemActionError, setItemActionError] = useState<string | null>(null);

  // Attached items inside this subcollection
  const [attachedVendors, setAttachedVendors] = useState<ApiSubCollectionItem[]>([]);
  const [attachedOfferings, setAttachedOfferings] = useState<ApiSubCollectionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Available options for selection dropdowns
  const [availableVendors, setAvailableVendors] = useState<VendorFilterOption[]>([]);
  const [availableOfferings, setAvailableOfferings] = useState<CollectionOffering[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Busy indicators for item operations
  const [addingVendor, setAddingVendor] = useState(false);
  const [addingOffering, setAddingOffering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadSubCollectionItems(targetSubId: string) {
    setItemsLoading(true);
    try {
      const fullData = await getSubCollectionDataApi(collectionId, targetSubId);

      let vList: ApiSubCollectionItem[] = fullData?.vendors ?? [];
      let oList: ApiSubCollectionItem[] = fullData?.offerings ?? [];

      if (vList.length === 0) {
        try {
          const vItems = await getSubCollectionItemsApi(
            collectionId,
            targetSubId,
            "vendors",
          );
          if (vItems && vItems.length > 0) vList = vItems;
        } catch {
          // ignore fallback
        }
      }

      if (oList.length === 0) {
        try {
          const oItems = await getSubCollectionItemsApi(
            collectionId,
            targetSubId,
            "offerings",
          );
          if (oItems && oItems.length > 0) oList = oItems;
        } catch {
          // ignore fallback
        }
      }

      setAttachedVendors(vList);
      setAttachedOfferings(oList);
    } catch {
      // ignore
    } finally {
      setItemsLoading(false);
    }
  }

  async function loadAvailableOptions() {
    setOptionsLoading(true);
    try {
      const [vendors, offerings] = await Promise.all([
        ensureVendorFilterOptionsLoaded().catch(() => []),
        fetchAvailableOfferings().catch(() => []),
      ]);
      setAvailableVendors(vendors);
      setAvailableOfferings(offerings);
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const parent = await fetchPopularCollectionById(collectionId);
        if (cancelled) return;
        if (!parent) {
          setError("Collection not found.");
          return;
        }
        setParentName(parent.englishName);

        if (subId) {
          setActiveSubId(subId);
          const sub = parent.subCollections.find((entry) => entry.id === subId);
          if (sub) {
            setForm(subCollectionToFormData(sub));
          } else {
            setForm({
              id: subId,
              collectionId,
              englishName: "",
              arabicName: "",
              published: true,
            });
          }
          void loadSubCollectionItems(subId);
          void loadAvailableOptions();
        } else {
          setActiveSubId(undefined);
          setForm(createEmptySubCollectionForm(collectionId));
        }
      } catch {
        if (!cancelled) setError("Could not load sub-collection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [collectionId, subId]);

  function update<K extends keyof PopularSubCollectionFormData>(
    key: K,
    value: PopularSubCollectionFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateSubCollectionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setItemActionError(null);

    try {
      if (!activeSubId) {
        // Step 1: Create sub-collection
        const created = await savePopularSubCollectionForm(form);
        setActiveSubId(created.id);
        setForm((prev) => ({ ...prev, id: created.id }));
        router.replace(routes.subEdit(collectionId, created.id), {
          scroll: false,
        });
        setSuccessMessage(
          "Sub-collection created! You can now select vendors and offerings below.",
        );
        void loadSubCollectionItems(created.id);
        void loadAvailableOptions();
      } else {
        // Update existing sub-collection info and finish
        await savePopularSubCollectionForm({ ...form, id: activeSubId });
        router.push(routes.detail(collectionId));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save sub-collection. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVendor(vendorId: string) {
    if (!activeSubId || !vendorId) return;
    setAddingVendor(true);
    setItemActionError(null);
    setSuccessMessage(null);
    try {
      await addSubCollectionItemsApi(collectionId, activeSubId, {
        type: "vendors",
        itemIds: [vendorId],
      });
      await loadSubCollectionItems(activeSubId);
      setSuccessMessage("Vendor added successfully.");
    } catch (err: unknown) {
      setItemActionError(
        err instanceof Error ? err.message : "Could not add vendor.",
      );
    } finally {
      setAddingVendor(false);
    }
  }

  async function handleRemoveVendor(vendorId: string) {
    if (!activeSubId || !vendorId) return;
    setRemovingId(`vendor-${vendorId}`);
    setItemActionError(null);
    try {
      await removeSubCollectionItemApi(
        collectionId,
        activeSubId,
        "vendors",
        vendorId,
      );
      setAttachedVendors((prev) => prev.filter((v) => getItemId(v) !== vendorId));
      setSuccessMessage("Vendor removed successfully.");
    } catch (err: unknown) {
      setItemActionError(
        err instanceof Error ? err.message : "Could not remove vendor.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAddOffering(offeringId: string) {
    if (!activeSubId || !offeringId) return;
    setAddingOffering(true);
    setItemActionError(null);
    setSuccessMessage(null);
    try {
      await addSubCollectionItemsApi(collectionId, activeSubId, {
        type: "offerings",
        itemIds: [offeringId],
      });
      await loadSubCollectionItems(activeSubId);
      setSuccessMessage("Offering added successfully.");
    } catch (err: unknown) {
      setItemActionError(
        err instanceof Error ? err.message : "Could not add offering.",
      );
    } finally {
      setAddingOffering(false);
    }
  }

  async function handleRemoveOffering(offeringId: string) {
    if (!activeSubId || !offeringId) return;
    setRemovingId(`offering-${offeringId}`);
    setItemActionError(null);
    try {
      await removeSubCollectionItemApi(
        collectionId,
        activeSubId,
        "offerings",
        offeringId,
      );
      setAttachedOfferings((prev) => prev.filter((o) => getItemId(o) !== offeringId));
      setSuccessMessage("Offering removed successfully.");
    } catch (err: unknown) {
      setItemActionError(
        err instanceof Error ? err.message : "Could not remove offering.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  // Filter out already attached vendors & offerings from dropdown options
  const attachedVendorIds = useMemo(
    () => new Set(attachedVendors.map(getItemId)),
    [attachedVendors],
  );
  const unattachedVendorOptions = useMemo(
    () =>
      availableVendors
        .filter((v) => !attachedVendorIds.has(v.id))
        .map((v) => ({ id: v.id, label: v.label })),
    [availableVendors, attachedVendorIds],
  );

  const attachedOfferingIds = useMemo(
    () => new Set(attachedOfferings.map(getItemId)),
    [attachedOfferings],
  );
  const unattachedOfferingOptions = useMemo(
    () =>
      availableOfferings
        .filter((o) => !attachedOfferingIds.has(o.id))
        .map((o) => ({
          id: o.id,
          label: o.offeringName,
          subLabel: o.vendorName
            ? `Vendor: ${o.vendorName}${o.offeringNameAr ? ` · ${o.offeringNameAr}` : ""}`
            : o.offeringNameAr,
        })),
    [availableOfferings, attachedOfferingIds],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error && !form.englishName && isEdit) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link
          href={routes.detail(collectionId)}
          className="inline-flex text-sm font-semibold text-brand hover:text-brand-hover"
        >
          ← Back to collection
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <Link
          href={routes.detail(collectionId)}
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to {parentName || "collection"}
        </Link>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 uppercase">
          {isEdit ? "Edit Sub Collection [Valid]" : "Add Sub Collection"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? `Manage details, vendors, and offerings inside ${parentName || "the collection"}.`
            : "Save the sub-collection first to enable adding vendors and offerings."}
        </p>
      </div>

      {successMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {error || itemActionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? itemActionError}
        </p>
      ) : null}

      {/* Main Details Section */}
      <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              English Name (Required)
            </span>
            <input
              value={form.englishName}
              onChange={(event) => update("englishName", event.target.value)}
              placeholder="ABCD"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Arabic Name (Required)
            </span>
            <input
              value={form.arabicName}
              onChange={(event) => update("arabicName", event.target.value)}
              placeholder="ABCD"
              dir="rtl"
              className={inputClass}
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => update("published", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
          />
          Published?
        </label>
      </section>

      {/* Vendors Section (Appears after sub-collection is saved) */}
      {isEdit ? (
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Add Vendors If Needed
            </label>
            <div className="mt-2">
              <SearchableDropdown
                placeholder="Select vendors"
                options={unattachedVendorOptions}
                onSelect={(vendorId) => void handleAddVendor(vendorId)}
                busy={addingVendor}
                disabled={optionsLoading}
              />
            </div>
          </div>

          {/* Vendors Table (Choice A) */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Attached Vendors ({attachedVendors.length})
              </span>
              {itemsLoading ? (
                <span className="text-xs text-slate-400">Loading items…</span>
              ) : null}
            </div>

            {attachedVendors.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5">Vendor Name (EN)</th>
                      <th className="px-4 py-2.5">Vendor Name (AR)</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {attachedVendors.map((vendor) => {
                      const vId = getItemId(vendor);
                      const isRemoving = removingId === `vendor-${vId}`;
                      return (
                        <tr key={vId} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {getItemEnglishName(vendor) || vId}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600" dir="rtl">
                            {getItemArabicName(vendor)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => void handleRemoveVendor(vId)}
                              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                            >
                              {isRemoving ? "Removing…" : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No vendors added yet. Use the dropdown above to add vendors to this sub-collection.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* Offerings Section (Appears after sub-collection is saved) */}
      {isEdit ? (
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Add Offerings If Needed
            </label>
            <div className="mt-2">
              <SearchableDropdown
                placeholder="Select offerings"
                options={unattachedOfferingOptions}
                onSelect={(offeringId) => void handleAddOffering(offeringId)}
                busy={addingOffering}
                disabled={optionsLoading}
              />
            </div>
          </div>

          {/* Offerings Table (Choice A) */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Attached Offerings ({attachedOfferings.length})
              </span>
              {itemsLoading ? (
                <span className="text-xs text-slate-400">Loading items…</span>
              ) : null}
            </div>

            {attachedOfferings.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5">Offering Name</th>
                      <th className="px-4 py-2.5">Vendor</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {attachedOfferings.map((offering) => {
                      const oId = getItemId(offering);
                      const isRemoving = removingId === `offering-${oId}`;
                      return (
                        <tr key={oId} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            <div>{getItemEnglishName(offering) || oId}</div>
                            {getItemArabicName(offering) ? (
                              <div className="text-slate-500 text-[11px]" dir="rtl">
                                {getItemArabicName(offering)}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {getItemVendorName(offering)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => void handleRemoveOffering(oId)}
                              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                            >
                              {isRemoving ? "Removing…" : "Remove"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No offerings added yet. Use the dropdown above to add offerings to this sub-collection.
              </p>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs text-slate-500">
          💡 Enter the sub-collection names above and click <strong className="font-semibold text-slate-700">Save</strong>. You will then be able to add vendors and offerings.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Link
          href={routes.detail(collectionId)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ✕ Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70 shadow-xs"
        >
          {saving ? "Saving…" : "✓ Save"}
        </button>
      </div>
    </form>
  );
}
