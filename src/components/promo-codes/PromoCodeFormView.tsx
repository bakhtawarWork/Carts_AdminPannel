"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useVendorFilterOptions } from "@/hooks/useVendorFilterOptions";
import {
  PROMO_CODE_TYPE_OPTIONS,
  cartsShareSliderMax,
  createEmptyPromoCodeForm,
  fetchPromoCodeForm,
  formatVendorHeader,
  getPromoCodeSaveErrorMessage,
  savePromoCodeForm,
  validatePromoCodeForm,
  vendorsShareFromCarts,
} from "@/lib/promo-code-form";
import { getVendorById } from "@/lib/vendors";
import type { PromoCodeFormData, PromoCodeType } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type PromoCodeFormViewProps = {
  promoId?: string;
};

export default function PromoCodeFormView({ promoId }: PromoCodeFormViewProps) {
  const router = useRouter();
  const isEdit = Boolean(promoId);
  const [form, setForm] = useState<PromoCodeFormData>(createEmptyPromoCodeForm);
  const [original, setOriginal] = useState<PromoCodeFormData | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { options: vendorOptions, loading: vendorsLoading } =
    useVendorFilterOptions({ enabled: !isEdit });

  useEffect(() => {
    if (!promoId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPromoCodeForm(promoId!);
        if (cancelled) return;
        if (!data) {
          setError("Promo code not found.");
          return;
        }
        setForm(data);
        setOriginal(data);
      } catch {
        if (!cancelled) setError("Could not load promo code.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [promoId]);

  function updateField<K extends keyof PromoCodeFormData>(
    key: K,
    value: PromoCodeFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validatePromoCodeForm(form, { isEdit });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await savePromoCodeForm(form, isEdit ? original : null);
      router.push("/promo-codes");
    } catch (caught) {
      setError(getPromoCodeSaveErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading promo code…
      </div>
    );
  }

  const isPercentage = form.promoCodeType === "percentage";
  const amountNumber = Number(form.amountQr);
  const shareMax = cartsShareSliderMax(form.promoCodeType, form.amountQr);
  const cartsShareValue = Math.min(
    Math.max(0, form.cartsSharePercent),
    shareMax || 0,
  );
  const vendorsShare = vendorsShareFromCarts(cartsShareValue, {
    promoCodeType: form.promoCodeType,
    amount: Number.isFinite(amountNumber) ? amountNumber : 0,
  });
  const shareUnit = isPercentage ? "%" : "QR";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <section className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <InfoIcon />
            {isEdit ? (
              <p className="text-sm font-semibold text-slate-900" dir="auto">
                {formatVendorHeader(form.vendorEnglish, form.vendorArabic)}
              </p>
            ) : (
              <h3 className="text-sm font-semibold text-slate-900">About Code</h3>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Code">
              <input
                type="text"
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder="Code"
                className={inputClass}
              />
            </Field>

            {!isEdit ? (
              <Field label="Vendor">
                <select
                  value={form.vendorId}
                  disabled={vendorsLoading}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const vendor =
                      nextId === "all" ? null : getVendorById(nextId);
                    setForm((prev) => ({
                      ...prev,
                      vendorId: nextId,
                      vendorEnglish: vendor?.englishName ?? "",
                      vendorArabic: vendor?.arabicName ?? "",
                    }));
                    setError(null);
                  }}
                  className={inputClass}
                >
                  <option value="all">
                    {vendorsLoading ? "Loading vendors…" : "All"}
                  </option>
                  {vendorOptions.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label="Max usage limit (-1 = unlimited)">
              <input
                type="number"
                value={form.maxUsageLimit}
                onChange={(event) =>
                  updateField("maxUsageLimit", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Promo code type">
              <select
                value={form.promoCodeType}
                onChange={(event) => {
                  const nextType = event.target.value as PromoCodeType | "";
                  setForm((prev) => {
                    if (nextType === prev.promoCodeType) return prev;

                    if (nextType === "percentage") {
                      const amount = Number(prev.amountQr);
                      return {
                        ...prev,
                        promoCodeType: nextType,
                        amountQr:
                          Number.isFinite(amount) && amount > 0 && amount <= 100
                            ? prev.amountQr
                            : "",
                        cartsSharePercent: Math.min(
                          100,
                          Math.max(0, prev.cartsSharePercent),
                        ),
                      };
                    }

                    if (nextType === "fixed") {
                      return {
                        ...prev,
                        promoCodeType: nextType,
                        cartsSharePercent: Math.min(
                          Math.max(0, prev.cartsSharePercent),
                          Number(prev.amountQr) || 0,
                        ),
                      };
                    }

                    return { ...prev, promoCodeType: nextType };
                  });
                  setError(null);
                }}
                className={inputClass}
              >
                {PROMO_CODE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="End date">
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="flex items-end">
              <label className="flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3">
                <input
                  type="checkbox"
                  checked={form.isLive}
                  onChange={(event) =>
                    updateField("isLive", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                />
                <span className="text-sm font-semibold text-slate-900">
                  Live?
                </span>
              </label>
            </div>

            <Field label={isPercentage ? "Amount (%)" : "Amount (QR)"}>
              <input
                type="number"
                min="0"
                max={isPercentage ? 100 : undefined}
                value={form.amountQr}
                onChange={(event) => {
                  const nextAmount = event.target.value;
                  setForm((prev) => {
                    const max = cartsShareSliderMax(
                      prev.promoCodeType,
                      nextAmount,
                    );
                    return {
                      ...prev,
                      amountQr: nextAmount,
                      cartsSharePercent: Math.min(
                        Math.max(0, prev.cartsSharePercent),
                        max,
                      ),
                    };
                  });
                  setError(null);
                }}
                className={inputClass}
              />
            </Field>

            <Field
              label={isPercentage ? "Carts share (%)" : "Carts share (QR)"}
            >
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                <input
                  type="range"
                  min={0}
                  max={shareMax || 0}
                  step={1}
                  value={cartsShareValue}
                  disabled={shareMax <= 0}
                  onChange={(event) =>
                    updateField(
                      "cartsSharePercent",
                      Number(event.target.value),
                    )
                  }
                  className="w-full accent-brand disabled:opacity-50"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>0{shareUnit === "%" ? "%" : ""}</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {cartsShareValue}
                    {shareUnit === "%" ? "%" : ` ${shareUnit}`}
                  </span>
                  <span>
                    {shareMax}
                    {shareUnit === "%" ? "%" : ""}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Vendors share:{" "}
                  <span className="font-semibold text-slate-800">
                    {vendorsShare}
                    {shareUnit === "%" ? "%" : ` ${shareUnit}`}
                  </span>
                </p>
              </div>
            </Field>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <Link
            href="/promo-codes"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <CancelIcon />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SaveIcon />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoIcon() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 11v5M12 8h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function CancelIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.2 8.2 15.8 15.8M15.8 8.2 8.2 15.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
