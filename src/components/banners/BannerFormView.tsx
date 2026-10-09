"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BANNER_REDIRECTION_OPTIONS,
  BANNER_TYPE_OPTIONS,
  createEmptyBannerForm,
  fetchBannerById,
  formatBannerTypeLabel,
  saveBannerForm,
  updateBannerForm,
  validateBannerForm,
  validateBannerImageFile,
} from "@/lib/banners";
import { readImageFileAsDataUrl } from "@/lib/offering-image-upload";
import type { BannerFormData, BannerType } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type BannerFormViewProps = {
  bannerId?: string;
};

export default function BannerFormView({ bannerId }: BannerFormViewProps = {}) {
  const router = useRouter();
  const isEdit = Boolean(bannerId);
  const [form, setForm] = useState<BannerFormData>(createEmptyBannerForm("main"));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bannerId) return;

    let cancelled = false;

    async function loadBanner() {
      setLoading(true);
      setError(null);
      try {
        const record = await fetchBannerById(bannerId!);
        if (cancelled) return;
        setForm({
          type: record.type,
          name: record.name,
          nameAr: record.nameAr ?? "",
          imageUrl: record.imageUrl,
          sequence: String(record.sequence),
          isActive: record.isActive,
          redirectionPath: record.redirectionPath ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load banner.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBanner();

    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  function update<K extends keyof BannerFormData>(
    key: K,
    value: BannerFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function setType(type: BannerType) {
    setForm((prev) => ({
      ...prev,
      type,
      redirectionPath: type === "main" ? "" : prev.redirectionPath,
    }));
    setError(null);
  }

  async function onImageChange(file: File | undefined) {
    if (!file) return;
    const validation = await validateBannerImageFile(file, form.type);
    if (validation) {
      setError(validation);
      return;
    }
    try {
      const url = await readImageFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        imageUrl: url,
        imageFileName: file.name,
        imageFileType: file.type || "image/jpeg",
      }));
    } catch {
      setError("Could not read image file.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateBannerForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && bannerId) {
        await updateBannerForm(bannerId, form);
      } else {
        await saveBannerForm(form);
      }
      router.push("/banners");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not ${isEdit ? "update" : "save"} banner. Please try again.`,
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading banner details…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
          Banner
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {isEdit ? "Edit banner" : "Add banner"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update banner details, sequence, or image."
            : "Choose banner type, then fill in the required fields."}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {formatBannerTypeLabel(form.type)} details
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-600">
              Image
            </p>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {form.imageUrl ? (
                <Image
                  src={form.imageUrl}
                  alt={form.name || "Banner preview"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-400">
                  Upload a banner image
                </div>
              )}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Upload image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  void onImageChange(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {form.type === "main"
                ? "Required aspect ratio: 1.10:1 – 1.40:1"
                : "Required aspect ratio: 2.70:1 – 3.50:1"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Banner type">
              <select
                value={form.type}
                onChange={(event) =>
                  setType(event.target.value as BannerType)
                }
                className={inputClass}
              >
                {BANNER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Banner name (EN)">
              <input
                type="text"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Enter banner name"
                className={inputClass}
              />
            </Field>

            <Field label="Banner name (AR)">
              <input
                type="text"
                dir="rtl"
                value={form.nameAr ?? ""}
                onChange={(event) => update("nameAr", event.target.value)}
                placeholder="أدخل اسم البانر بالعربية"
                className={inputClass}
              />
            </Field>

            <Field label="Sequence">
              <input
                type="number"
                min={1}
                step={1}
                value={form.sequence}
                onChange={(event) => update("sequence", event.target.value)}
                placeholder="1"
                className={inputClass}
              />
            </Field>

            {form.type === "sub" ? (
              <Field label="Redirection path">
                <select
                  value={form.redirectionPath}
                  onChange={(event) =>
                    update("redirectionPath", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select screen</option>
                  {BANNER_REDIRECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label="Status">
              <label className="inline-flex h-[42px] w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => update("isActive", event.target.checked)}
                  className="h-5 w-5 shrink-0 rounded border-slate-300 accent-brand"
                />
                <span className="text-sm font-semibold text-slate-900">
                  Active
                </span>
              </label>
            </Field>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Link
            href="/banners"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Update banner" : "Save banner"}
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
