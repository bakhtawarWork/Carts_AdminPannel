"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  createEmptyBilingualLine,
  createEmptyOptionItem,
  createEmptyOptionSection,
  fetchOfferingForm,
  OFFERING_TYPE_OPTIONS,
  saveAndApproveOfferingForm,
  saveVendorOfferingForm,
} from "@/lib/offering-form";
import {
  formatOfferingCategoryLabel,
  listOfferingCategories,
} from "@/lib/offering-categories";
import {
  createGalleryImageId,
  MAX_OFFERING_IMAGE_SIZE_MB,
  readImageFileAsDataUrl,
  validateOfferingImageFile,
} from "@/lib/offering-image-upload";
import type {
  OfferingBilingualLine,
  OfferingCategoryRecord,
  OfferingFormData,
  OfferingGalleryImage,
  OfferingOptionItem,
  OfferingOptionSection,
} from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type OfferingFormViewProps = {
  vendorId?: string;
  offeringId?: string;
  approvalId?: string;
};

export default function OfferingFormView({
  vendorId,
  offeringId,
  approvalId,
}: OfferingFormViewProps) {
  const router = useRouter();
  const isApprovalMode = Boolean(approvalId);
  const isCreateMode = !isApprovalMode && !offeringId;
  const [form, setForm] = useState<OfferingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<OfferingCategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const items = await listOfferingCategories();
        if (cancelled) return;
        setCategories(items);
        setCategoriesError(null);
      } catch (caught) {
        if (cancelled) return;
        setCategoriesError(
          caught instanceof Error
            ? caught.message
            : "Could not load offering categories.",
        );
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOfferingForm({ vendorId, offeringId, approvalId });
        if (cancelled) return;
        if (!data) {
          setError("Offering not found.");
          return;
        }
        setForm(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load offering.",
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
  }, [vendorId, offeringId, approvalId]);

  function updateField<K extends keyof OfferingFormData>(
    key: K,
    value: OfferingFormData[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setError(null);
  }

  function updateList(
    key: keyof Pick<
      OfferingFormData,
      | "requirements"
      | "includedFood"
      | "drinks"
      | "presentation"
      | "decorations"
      | "furniture"
      | "equipment"
      | "notes"
    >,
    next: OfferingBilingualLine[],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
  }

  function updateSections(
    key: "requiredOptions" | "addOns",
    next: OfferingOptionSection[],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    if (!form.englishName.trim() || !form.arabicName.trim()) {
      setError("English and Arabic names are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isApprovalMode) {
        await saveAndApproveOfferingForm(form);
        router.push("/vendors/offering-approval");
        return;
      }

      await saveVendorOfferingForm(form);
      router.push(`/vendors/${form.vendorId}/offerings`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isApprovalMode
            ? "Could not save and approve offering."
            : "Could not save offering.",
      );
    } finally {
      setSaving(false);
    }
  }

  const backHref = isApprovalMode
    ? "/vendors/offering-approval"
    : `/vendors/${form?.vendorId ?? vendorId}/offerings`;

  const pageTitle = isCreateMode ? "Create Offering" : "Edit Offering";
  const pageSubtitle = isApprovalMode
    ? "Review vendor submission, make changes, then save and approve."
    : isCreateMode
      ? "Add a new offering for this vendor."
      : "Update offering details for this vendor.";
  const submitLabel = isApprovalMode ? "Save & approve" : "Save";

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Loading offering…
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-12 text-center text-sm text-red-700">
        {error ?? "Offering not found."}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="form-scroll min-h-0 flex-1 space-y-5 pr-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Vendors
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{pageSubtitle}</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex items-center justify-center self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {isApprovalMode ? "Back to approvals" : "Back to offerings"}
        </Link>
      </div>

      <FormSection title="About offering" hint="Bilingual name and short description">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="English name">
            <input
              type="text"
              value={form.englishName}
              onChange={(event) => updateField("englishName", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Arabic name">
            <input
              type="text"
              value={form.arabicName}
              onChange={(event) => updateField("arabicName", event.target.value)}
              className={inputClass}
              dir="auto"
            />
          </Field>
          <Field label="English short description">
            <input
              type="text"
              value={form.englishShortDescription}
              onChange={(event) =>
                updateField("englishShortDescription", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Arabic short description">
            <input
              type="text"
              value={form.arabicShortDescription}
              onChange={(event) =>
                updateField("arabicShortDescription", event.target.value)
              }
              className={inputClass}
              dir="auto"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Offering gallery"
        hint="Upload images shown to customers for this offering"
      >
        <OfferingGalleryEditor
          gallery={form.gallery}
          onGalleryChange={(updater) =>
            setForm((prev) =>
              prev ? { ...prev, gallery: updater(prev.gallery) } : prev,
            )
          }
        />
      </FormSection>

      <FormSection title="Offering details" hint="Type, category, pricing, and service rules">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Offering type">
            <select
              value={form.offeringType}
              onChange={(event) => updateField("offeringType", event.target.value)}
              className={inputClass}
            >
              {OFFERING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Offering category">
            <select
              value={form.categoryId}
              onChange={(event) => updateField("categoryId", event.target.value)}
              disabled={categoriesLoading || Boolean(categoriesError)}
              className={inputClass}
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories…"
                  : categoriesError
                    ? "Could not load categories"
                    : categories.length === 0
                      ? "No categories found"
                      : "Choose a category…"}
              </option>
              {form.categoryId &&
              !categories.some((category) => category.id === form.categoryId) ? (
                <option value={form.categoryId}>{form.categoryId}</option>
              ) : null}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatOfferingCategoryLabel(category)}
                </option>
              ))}
            </select>
            {categoriesError ? (
              <p className="mt-1.5 text-xs text-red-600">{categoriesError}</p>
            ) : null}
          </Field>

          <ToggleField
            label="Published?"
            checked={form.published}
            onChange={(checked) => updateField("published", checked)}
          />
          <ToggleField
            label="Female service?"
            checked={form.femaleService}
            onChange={(checked) => updateField("femaleService", checked)}
          />

          <Field label="Minimum qty (starting)">
            <input
              type="number"
              min={1}
              value={form.minimumQty}
              onChange={(event) => updateField("minimumQty", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Max qty">
            <input
              type="number"
              min={1}
              value={form.maxQty}
              onChange={(event) => updateField("maxQty", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Item price (QR)">
            <input
              type="number"
              min={0}
              value={form.itemPriceQr}
              onChange={(event) => updateField("itemPriceQr", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Starting price (QR)">
            <input
              type="number"
              min={0}
              value={form.startingPriceQr}
              onChange={(event) =>
                updateField("startingPriceQr", event.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="Max time in hours">
            <input
              type="number"
              min={0}
              value={form.maxTimeHours}
              onChange={(event) => updateField("maxTimeHours", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Setup time in hours">
            <input
              type="number"
              min={0}
              value={form.setupTimeHours}
              onChange={(event) =>
                updateField("setupTimeHours", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Minimum notice (hours)">
            <input
              type="number"
              min={0}
              value={form.minimumNotice}
              onChange={(event) =>
                updateField("minimumNotice", event.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Service availability"
            hint="-1 = no limit; keep as -1 unless you want to limit daily orders"
          >
            <input
              type="number"
              value={form.serviceAvailability}
              onChange={(event) =>
                updateField("serviceAvailability", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field
            label="Service availability code"
            hint="-1 = no limit; use the same code to check across multiple offerings"
          >
            <input
              type="number"
              value={form.serviceAvailabilityCode}
              onChange={(event) =>
                updateField("serviceAvailabilityCode", event.target.value)
              }
              className={inputClass}
            />
          </Field>

          <Field label="English capacity note">
            <input
              type="text"
              value={form.englishCapacityNote}
              onChange={(event) =>
                updateField("englishCapacityNote", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Arabic capacity note">
            <input
              type="text"
              value={form.arabicCapacityNote}
              onChange={(event) =>
                updateField("arabicCapacityNote", event.target.value)
              }
              className={inputClass}
              dir="auto"
            />
          </Field>
        </div>
      </FormSection>

      <BilingualListSection
        title="Requirements"
        items={form.requirements}
        addLabel="Add requirement"
        onChange={(next) => updateList("requirements", next)}
      />

      <BilingualListSection
        title="Included food"
        hint="Food included in this offering"
        items={form.includedFood}
        addLabel="Add food"
        onChange={(next) => updateList("includedFood", next)}
      />

      <BilingualListSection
        title="Drinks"
        items={form.drinks}
        addLabel="Add drink"
        onChange={(next) => updateList("drinks", next)}
      />

      <BilingualListSection
        title="Presentation"
        items={form.presentation}
        addLabel="Add presentation"
        onChange={(next) => updateList("presentation", next)}
      />

      <BilingualListSection
        title="Decorations"
        items={form.decorations}
        addLabel="Add decoration"
        onChange={(next) => updateList("decorations", next)}
      />

      <BilingualListSection
        title="Furniture"
        items={form.furniture}
        addLabel="Add furniture"
        onChange={(next) => updateList("furniture", next)}
      />

      <BilingualListSection
        title="Equipment"
        items={form.equipment}
        addLabel="Add equipment"
        onChange={(next) => updateList("equipment", next)}
      />

      <BilingualListSection
        title="Notes"
        items={form.notes}
        addLabel="Add note"
        onChange={(next) => updateList("notes", next)}
      />

      <OptionSectionsEditor
        title="Required options"
        hint="Here you can add options users must select from"
        addLabel="Add section"
        kind="required"
        sections={form.requiredOptions}
        onChange={(next) => updateSections("requiredOptions", next)}
      />

      <OptionSectionsEditor
        title="Add ons"
        hint="Here you can add optional add ons for users to choose from"
        addLabel="Add section"
        kind="addon"
        sections={form.addOns}
        onChange={(next) => updateSections("addOns", next)}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white pt-3">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function OfferingGalleryEditor({
  gallery,
  onGalleryChange,
}: {
  gallery: OfferingGalleryImage[];
  onGalleryChange: (
    updater: (current: OfferingGalleryImage[]) => OfferingGalleryImage[],
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (!files.length) return;

    setUploadError(null);
    setUploading(true);

    const validUploads: OfferingGalleryImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validationError = validateOfferingImageFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        const url = await readImageFileAsDataUrl(file);
        validUploads.push({
          id: createGalleryImageId(),
          url,
          alt: file.name.replace(/\.[^.]+$/, "") || "Uploaded image",
          name: file.name,
          type: file.type || "image/png",
        });
      } catch {
        errors.push(`${file.name}: Could not preview this image. Try another file.`);
      }
    }

    setUploading(false);

    if (errors.length) {
      setUploadError(errors.join(" "));
    }

    if (validUploads.length) {
      onGalleryChange((current) => [...current, ...validUploads]);
    }
  }

  function removeImage(imageId: string) {
    setUploadError(null);
    onGalleryChange((current) =>
      current.filter((image) => image.id !== imageId),
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={uploading}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <UploadIcon />
        {uploading ? "Uploading…" : "Upload image"}
      </button>

      <p className="text-xs text-slate-500">
        JPG, PNG, WebP, or GIF · max {MAX_OFFERING_IMAGE_SIZE_MB}MB per image
      </p>

      {uploadError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {uploadError}
        </p>
      ) : null}

      {gallery.length === 0 ? (
        <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 text-center text-sm text-slate-500">
          No images uploaded yet. Use the button above to add offering photos.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((image, index) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <GalleryImagePreview
                src={image.url}
                alt={image.alt}
                index={index}
              />
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-2">
                <span className="truncate text-xs text-slate-500">
                  {image.alt}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryImagePreview({
  src,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-slate-100 px-3 text-center text-xs text-red-600">
        <span>Could not display image.</span>
        <span className="text-slate-500">Upload JPG, PNG, WebP, or GIF.</span>
        <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
          {index + 1}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="aspect-[4/3] w-full object-cover"
        onError={() => setBroken(true)}
      />
      <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
        {index + 1}
      </span>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V7m0 0 3.5 3.5M12 7 8.5 10.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FormSection({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-2">
          <InfoIcon />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-slate-400">{hint}</p> : null}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-brand" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function BilingualListEditor({
  items,
  addLabel,
  onChange,
}: {
  items: OfferingBilingualLine[];
  addLabel: string;
  onChange: (items: OfferingBilingualLine[]) => void;
}) {
  function updateItem(id: string, patch: Partial<OfferingBilingualLine>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No items added yet.</p>
      ) : (
        <>
          <div className="hidden gap-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 md:grid md:grid-cols-[auto_1fr_1fr]">
            <span className="w-9" />
            <span>English</span>
            <span>Arabic</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 md:grid-cols-[auto_1fr_1fr] md:items-start"
            >
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                aria-label="Remove row"
              >
                ×
              </button>
              <input
                type="text"
                value={item.english}
                onChange={(event) =>
                  updateItem(item.id, { english: event.target.value })
                }
                placeholder="English"
                className={inputClass}
              />
              <input
                type="text"
                value={item.arabic}
                onChange={(event) =>
                  updateItem(item.id, { arabic: event.target.value })
                }
                placeholder="Arabic"
                dir="auto"
                className={inputClass}
              />
            </div>
          ))}
        </>
      )}
      <button
        type="button"
        onClick={() => onChange([...items, createEmptyBilingualLine()])}
        className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10"
      >
        {addLabel}
      </button>
    </div>
  );
}

function BilingualListSection({
  title,
  hint,
  items,
  addLabel,
  onChange,
}: {
  title: string;
  hint?: string;
  items: OfferingBilingualLine[];
  addLabel: string;
  onChange: (items: OfferingBilingualLine[]) => void;
}) {
  return (
    <FormSection title={title} hint={hint}>
      <BilingualListEditor items={items} addLabel={addLabel} onChange={onChange} />
    </FormSection>
  );
}

function OptionSectionsEditor({
  title,
  hint,
  addLabel,
  kind,
  sections,
  onChange,
}: {
  title: string;
  hint: string;
  addLabel: string;
  kind: "required" | "addon";
  sections: OfferingOptionSection[];
  onChange: (sections: OfferingOptionSection[]) => void;
}) {
  const isRequired = kind === "required";
  const compactInputClass =
    "w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

  function updateSection(id: string, patch: Partial<OfferingOptionSection>) {
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    );
  }

  function removeSection(id: string) {
    onChange(sections.filter((section) => section.id !== id));
  }

  function addOption(sectionId: string) {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, options: [...section.options, createEmptyOptionItem()] }
          : section,
      ),
    );
  }

  function updateOption(
    sectionId: string,
    optionId: string,
    patch: Partial<OfferingOptionItem>,
  ) {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              options: section.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
              ),
            }
          : section,
      ),
    );
  }

  function removeOption(sectionId: string, optionId: string) {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (section.options.length <= 1) return section;
        return {
          ...section,
          options: section.options.filter((option) => option.id !== optionId),
        };
      }),
    );
  }

  return (
    <FormSection
      title={title}
      hint={hint}
      action={
        <button
          type="button"
          onClick={() => onChange([...sections, createEmptyOptionSection(kind)])}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
        >
          {addLabel}
        </button>
      }
    >
      {sections.length === 0 ? (
        <p className="text-sm text-slate-500">No sections added yet.</p>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addOption(section.id)}
                  className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover"
                >
                  Add option
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                  aria-label="Remove section"
                >
                  ×
                </button>
                <input
                  type="text"
                  value={section.titleEnglish}
                  onChange={(event) =>
                    updateSection(section.id, {
                      titleEnglish: event.target.value,
                    })
                  }
                  placeholder="English name"
                  className={`${inputClass} min-w-[10rem] flex-1`}
                />
                <input
                  type="text"
                  value={section.titleArabic}
                  onChange={(event) =>
                    updateSection(section.id, {
                      titleArabic: event.target.value,
                    })
                  }
                  placeholder="Arabic name"
                  dir="auto"
                  className={`${inputClass} min-w-[10rem] flex-1`}
                />
                {isRequired ? (
                  <input
                    type="number"
                    min="1"
                    value={section.requiredNumbers ?? "1"}
                    onChange={(event) =>
                      updateSection(section.id, {
                        requiredNumbers: event.target.value,
                      })
                    }
                    className={`${compactInputClass} ${
                      Number(section.requiredNumbers ?? "0") < 1
                        ? "border-red-400 text-red-600"
                        : ""
                    }`}
                    aria-label="Required numbers"
                  />
                ) : null}
              </div>

              <div className="ml-6 space-y-2 border-l border-slate-200 pl-4 sm:ml-10">
                {section.options.map((option) => {
                  const canDeleteOption = section.options.length > 1;

                  return (
                  <div
                    key={option.id}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {canDeleteOption ? (
                      <button
                        type="button"
                        onClick={() => removeOption(section.id, option.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                        aria-label="Remove option"
                      >
                        ×
                      </button>
                    ) : (
                      <span className="h-9 w-9 shrink-0" aria-hidden />
                    )}
                    <input
                      type="text"
                      value={option.english}
                      onChange={(event) =>
                        updateOption(section.id, option.id, {
                          english: event.target.value,
                        })
                      }
                      placeholder="English name"
                      className={`${inputClass} min-w-[9rem] flex-1`}
                    />
                    <input
                      type="text"
                      value={option.arabic}
                      onChange={(event) =>
                        updateOption(section.id, option.id, {
                          arabic: event.target.value,
                        })
                      }
                      placeholder="Arabic name"
                      dir="auto"
                      className={`${inputClass} min-w-[9rem] flex-1`}
                    />
                    {!isRequired ? (
                      <>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          Price
                          <input
                            type="number"
                            min="0"
                            value={option.price ?? ""}
                            onChange={(event) =>
                              updateOption(section.id, option.id, {
                                price: event.target.value,
                              })
                            }
                            placeholder="0"
                            className={compactInputClass}
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          Max Qty
                          <input
                            type="number"
                            min="0"
                            value={option.maxQty ?? ""}
                            onChange={(event) =>
                              updateOption(section.id, option.id, {
                                maxQty: event.target.value,
                              })
                            }
                            placeholder="0"
                            className={compactInputClass}
                          />
                        </label>
                      </>
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

function InfoIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 11v5M12 8.5v.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
