"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  DeliveryAreaGroup,
  VendorFormData,
  VendorImageAsset,
  VendorServiceId,
} from "@/lib/types";
import {
  VENDOR_SERVICES,
  createEmptyVendorForm,
  fetchVendorForm,
  firstInvalidVendorPanel,
  firstVendorFormError,
  saveVendorForm,
  validateVendorForm,
  validateVendorFormPanel,
  type VendorFormFieldErrors,
  type VendorFormPanel,
} from "@/lib/vendor-form";
import {
  fetchDeliveryAreaGroups,
  findDeliverySubarea,
  formatDeliveryAreaGroupLabel,
  formatDeliverySubareaLabel,
} from "@/lib/locations";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

type FormPanel = VendorFormPanel;

const PANELS: {
  id: FormPanel;
  step: number;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "profile",
    step: 1,
    title: "Profile & brand",
    subtitle: "Bilingual identity and logo",
  },
  {
    id: "business",
    step: 2,
    title: "Business settings",
    subtitle: "Contact and service flags",
  },
  {
    id: "operations",
    step: 3,
    title: "Service operations",
    subtitle: "Images, capacity, and delivery",
  },
];

type VendorFormViewProps = {
  vendorId?: string;
};

export default function VendorFormView({ vendorId }: VendorFormViewProps) {
  const router = useRouter();
  const isEdit = Boolean(vendorId);
  const [form, setForm] = useState<VendorFormData>(createEmptyVendorForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState<"save" | "draft" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<FormPanel>("profile");
  const [deliveryAreaGroups, setDeliveryAreaGroups] = useState<
    DeliveryAreaGroup[]
  >([]);
  const [deliveryAreasLoading, setDeliveryAreasLoading] = useState(true);
  const [deliveryAreasError, setDeliveryAreasError] = useState<string | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<VendorFormFieldErrors>({});

  useEffect(() => {
    let cancelled = false;

    async function loadAreas() {
      setDeliveryAreasLoading(true);
      try {
        const groups = await fetchDeliveryAreaGroups();
        if (cancelled) return;
        setDeliveryAreaGroups(groups);
        setDeliveryAreasError(null);
      } catch (caught) {
        if (cancelled) return;
        setDeliveryAreasError(
          caught instanceof Error
            ? caught.message
            : "Could not load delivery areas.",
        );
      } finally {
        if (!cancelled) setDeliveryAreasLoading(false);
      }
    }

    void loadAreas();
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
        const data = await fetchVendorForm(vendorId);
        if (cancelled) return;
        if (!data) {
          setError("Vendor not found.");
          return;
        }
        setForm(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load vendor form.",
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
  }, [vendorId]);

  function clearFieldError(key: keyof VendorFormFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearServiceFieldError(
    serviceId: VendorServiceId,
    key: "images" | "minNotice" | "capacity" | "deliveryAreas",
  ) {
    setFieldErrors((prev) => {
      const current = prev.services?.[serviceId];
      if (!current?.[key]) return prev;
      const nextService = { ...current };
      delete nextService[key];
      const services = { ...prev.services };
      if (Object.keys(nextService).length === 0) {
        delete services[serviceId];
      } else {
        services[serviceId] = nextService;
      }
      return { ...prev, services };
    });
  }

  function applyValidation(errors: VendorFormFieldErrors) {
    const message = firstVendorFormError(errors);
    setFieldErrors(errors);
    if (message) {
      setError(message);
      setMessage(null);
      return false;
    }
    setError(null);
    return true;
  }

  function goToPanel(next: FormPanel) {
    const currentIndex = PANELS.findIndex((panel) => panel.id === activePanel);
    const nextIndex = PANELS.findIndex((panel) => panel.id === next);
    if (nextIndex > currentIndex) {
      for (let index = currentIndex; index < nextIndex; index += 1) {
        const panel = PANELS[index]?.id;
        if (!panel) continue;
        const errors = validateVendorFormPanel(form, panel);
        if (!applyValidation(errors)) {
          setActivePanel(panel);
          return;
        }
      }
    }
    setError(null);
    setActivePanel(next);
  }

  function updateField<K extends keyof VendorFormData>(
    key: K,
    value: VendorFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (
      key === "englishName" ||
      key === "arabicName" ||
      key === "englishTagline" ||
      key === "arabicTagline" ||
      key === "englishShortDescription" ||
      key === "arabicShortDescription" ||
      key === "logo" ||
      key === "email" ||
      key === "mobile" ||
      key === "servicesOffered"
    ) {
      clearFieldError(key);
    }
  }

  function updateServiceField(
    serviceId: VendorServiceId,
    key: "minNotice" | "capacity",
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: {
          ...prev.services[serviceId],
          [key]: value,
        },
      },
    }));
    clearServiceFieldError(serviceId, key);
  }

  function addDeliveryArea(serviceId: VendorServiceId, areaId: string) {
    setForm((prev) => {
      const existing = prev.services[serviceId].deliveryAreas;
      if (existing.some((entry) => entry.areaId === areaId)) return prev;
      return {
        ...prev,
        services: {
          ...prev.services,
          [serviceId]: {
            ...prev.services[serviceId],
            deliveryAreas: [
              ...existing,
              { id: `da-${Date.now()}`, areaId, cost: "0" },
            ],
          },
        },
      };
    });
    clearServiceFieldError(serviceId, "deliveryAreas");
  }

  function removeDeliveryArea(serviceId: VendorServiceId, entryId: string) {
    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: {
          ...prev.services[serviceId],
          deliveryAreas: prev.services[serviceId].deliveryAreas.filter(
            (entry) => entry.id !== entryId,
          ),
        },
      },
    }));
    clearServiceFieldError(serviceId, "deliveryAreas");
  }

  function updateDeliveryAreaCost(
    serviceId: VendorServiceId,
    entryId: string,
    cost: string,
  ) {
    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: {
          ...prev.services[serviceId],
          deliveryAreas: prev.services[serviceId].deliveryAreas.map((entry) =>
            entry.id === entryId ? { ...entry, cost } : entry,
          ),
        },
      },
    }));
    clearServiceFieldError(serviceId, "deliveryAreas");
  }

  function toggleService(serviceId: VendorServiceId) {
    setForm((prev) => {
      const selected = prev.servicesOffered.includes(serviceId);
      return {
        ...prev,
        servicesOffered: selected
          ? prev.servicesOffered.filter((id) => id !== serviceId)
          : [...prev.servicesOffered, serviceId],
      };
    });
    clearFieldError("servicesOffered");
  }

  function setLogo(logo: VendorImageAsset | null) {
    updateField("logo", logo);
  }

  function addServiceImages(serviceId: VendorServiceId, files: File[]) {
    if (files.length === 0) return;

    setForm((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceId]: {
          ...prev.services[serviceId],
          images: [
            ...prev.services[serviceId].images,
            ...files.map((file, index) => ({
              id: `img-${Date.now().toString(16)}-${index}-${Math.random()
                .toString(16)
                .slice(2, 8)}`,
              url: URL.createObjectURL(file),
              title: file.name || serviceId,
              alt: file.name || serviceId,
              file,
            })),
          ],
        },
      },
    }));
    clearServiceFieldError(serviceId, "images");
  }

  function removeServiceImage(serviceId: VendorServiceId, imageId: string) {
    setForm((prev) => {
      const current = prev.services[serviceId].images;
      const removed = current.find((image) => image.id === imageId);
      if (removed?.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }

      return {
        ...prev,
        services: {
          ...prev.services,
          [serviceId]: {
            ...prev.services[serviceId],
            images: current.filter((image) => image.id !== imageId),
          },
        },
      };
    });
  }

  function isServiceEnabled(serviceId: VendorServiceId) {
    return form.servicesOffered.includes(serviceId);
  }

  async function handleSubmit(mode: "save" | "draft") {
    if (mode === "save" && activePanel !== "operations") return;

    if (mode === "save") {
      const errors = validateVendorForm(form);
      if (!applyValidation(errors)) {
        setActivePanel(firstInvalidVendorPanel(errors));
        return;
      }
    }

    setSaving(mode);
    setMessage(null);
    setError(null);
    try {
      const result = await saveVendorForm(form, mode);
      setMessage(result.message);
      if (!isEdit) {
        router.replace("/vendors");
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save vendor.",
      );
    } finally {
      setSaving(null);
    }
  }

  const activeIndex = PANELS.findIndex((panel) => panel.id === activePanel);
  const progress = ((activeIndex + 1) / PANELS.length) * 100;
  const isLastStep = activePanel === "operations";
  const formScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    formScrollRef.current?.scrollTo({ top: 0 });
  }, [activePanel]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
        <div className="h-[32rem] animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
      </div>
    );
  }

  if (error && !form.englishName && isEdit) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {error}{" "}
        <button
          type="button"
          onClick={() => router.push("/vendors")}
          className="font-semibold text-brand underline"
        >
          Back to vendors
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand">
            Vendor workspace
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {isEdit ? "Edit Vendor" : "Add Vendor"}
          </h1>
        </div>
        <Link
          href="/vendors"
          className="text-sm font-medium text-brand hover:text-brand-hover"
        >
          ← Back to vendors
        </Link>
      </div>

      {error ? (
        <p className="mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-2 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          event.preventDefault();
          if (isLastStep) void handleSubmit("save");
        }}
      >
        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden max-lg:grid-rows-[auto_minmax(0,1fr)] lg:h-full lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-4">
          {/* Sidebar navigator + live preview */}
          <aside className="flex min-h-0 shrink-0 flex-col gap-2 overflow-hidden lg:h-full lg:max-h-full lg:gap-3">
            <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="bg-gradient-to-br from-brand to-[#b8181d] px-3 py-3 text-white sm:px-4 sm:py-4">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">
                  Live preview
                </p>
                <div className="mt-2 flex items-center gap-2.5 sm:mt-3 sm:gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white/10 sm:h-14 sm:w-14 sm:rounded-xl">
                    {form.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logo.url}
                        alt={form.logo.alt}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-white/70 sm:text-lg">
                        {(form.englishName || "V").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold sm:text-base">
                      {form.englishName || "Untitled vendor"}
                    </p>
                    <p
                      className={`line-clamp-2 text-xs sm:text-sm ${
                        form.englishShortDescription ||
                        form.arabicShortDescription
                          ? "text-white/80"
                          : "italic text-white/50"
                      }`}
                      dir="auto"
                    >
                      {form.englishShortDescription ||
                        form.arabicShortDescription ||
                        "Short description"}
                    </p>
                  </div>
                </div>
                {form.servicesOffered.length > 0 ? (
                  <PreviewServiceChips services={form.servicesOffered} />
                ) : null}
              </div>

              <div className="border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <nav
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:p-2"
              aria-label="Form sections"
            >
              {PANELS.map((panel) => {
                const isActive = activePanel === panel.id;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => goToPanel(panel.id)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? "bg-brand-soft text-brand"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isActive
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {panel.step}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        {panel.title}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          isActive ? "text-brand/70" : "text-slate-400"
                        }`}
                      >
                        {panel.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto hidden shrink-0 flex-col gap-1.5 pt-2 lg:flex">
              <button
                type="button"
                onClick={() => router.push("/vendors")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => void handleSubmit("draft")}
                className="rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-sm font-semibold text-brand transition hover:bg-[#f8dede] disabled:opacity-70"
              >
                {saving === "draft" ? "Saving…" : "Save as draft"}
              </button>
              <button
                type="submit"
                disabled={saving !== null || !isLastStep}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving === "save" ? "Saving…" : "Save"}
              </button>
            </div>
          </aside>

          {/* Main workspace panel */}
          <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden max-lg:min-h-[50vh]">
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
                  Step {PANELS[activeIndex]?.step} of {PANELS.length}
                </p>
                <h2 className="text-base font-semibold text-slate-900">
                  {PANELS[activeIndex]?.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {PANELS[activeIndex]?.subtitle}
                </p>
              </div>

              <div
                ref={formScrollRef}
                className="form-scroll min-h-0 flex-1 p-4"
              >
                {activePanel === "profile" ? (
                  <div className="space-y-6">
                    <PanelBlock title="About Vendor">
                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                          <div className="divide-y divide-slate-200">
                            <p className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              English
                            </p>
                            <MirrorField
                              label="English Name"
                              value={form.englishName}
                              onChange={(v) => updateField("englishName", v)}
                              required
                              error={fieldErrors.englishName}
                            />
                            <MirrorField
                              label="English Tagline"
                              value={form.englishTagline}
                              onChange={(v) => updateField("englishTagline", v)}
                              required
                              error={fieldErrors.englishTagline}
                            />
                            <MirrorField
                              label="English Short Description"
                              value={form.englishShortDescription}
                              onChange={(v) =>
                                updateField("englishShortDescription", v)
                              }
                              required
                              error={fieldErrors.englishShortDescription}
                            />
                          </div>
                          <div className="divide-y divide-slate-200">
                            <p className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Arabic
                            </p>
                            <MirrorField
                              label="Arabic Name"
                              value={form.arabicName}
                              onChange={(v) => updateField("arabicName", v)}
                              dir="auto"
                              required
                              error={fieldErrors.arabicName}
                            />
                            <MirrorField
                              label="Arabic Tagline"
                              value={form.arabicTagline}
                              onChange={(v) => updateField("arabicTagline", v)}
                              dir="auto"
                              required
                              error={fieldErrors.arabicTagline}
                            />
                            <MirrorField
                              label="Arabic Short Description"
                              value={form.arabicShortDescription}
                              onChange={(v) =>
                                updateField("arabicShortDescription", v)
                              }
                              dir="auto"
                              required
                              error={fieldErrors.arabicShortDescription}
                            />
                          </div>
                        </div>
                      </div>
                    </PanelBlock>

                    <PanelBlock title="Vendor Logo" required>
                      <Hint>
                        Image size should be 500px × 500px and less than 200kb
                      </Hint>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div
                          className={`flex shrink-0 justify-center rounded-2xl border border-dashed bg-slate-50/80 p-6 sm:w-48 ${
                            fieldErrors.logo
                              ? "border-red-300"
                              : "border-slate-200"
                          }`}
                        >
                          {form.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={form.logo.url}
                              alt={form.logo.alt}
                              className="h-28 w-28 rounded-xl object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-white text-xs text-slate-400">
                              No logo
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="mb-2 text-sm font-medium text-slate-700">
                            Vendor Logo <RequiredMark />
                          </p>
                          <ImagePicker
                            image={form.logo}
                            onChange={setLogo}
                            defaultTitle={form.englishName || "Vendor logo"}
                            hidePreview
                            error={fieldErrors.logo}
                          />
                        </div>
                      </div>
                    </PanelBlock>
                  </div>
                ) : null}

                {activePanel === "business" ? (
                  <div className="space-y-6">
                    <PanelBlock title="Contact Info">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <ContactTile
                          label="Email"
                          type="email"
                          value={form.email}
                          onChange={(v) => updateField("email", v)}
                          icon="email"
                          required
                          error={fieldErrors.email}
                        />
                        <ContactTile
                          label="Mobile"
                          value={form.mobile}
                          onChange={(v) => updateField("mobile", v)}
                          icon="mobile"
                          required
                          error={fieldErrors.mobile}
                        />
                        <ContactTile
                          label="Phone"
                          value={form.phone}
                          onChange={(v) => updateField("phone", v)}
                          icon="phone"
                        />
                      </div>
                    </PanelBlock>

                    <PanelBlock title="Service Details">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <ToggleField
                          label="Published?"
                          checked={form.published}
                          onChange={(checked) =>
                            updateField("published", checked)
                          }
                        />
                        <ToggleField
                          label="Double Points?"
                          checked={form.doublePoints}
                          onChange={(checked) =>
                            updateField("doublePoints", checked)
                          }
                        />
                        <TextField
                          label="Percentage"
                          value={form.percentage}
                          onChange={(value) => updateField("percentage", value)}
                        />
                      </div>

                      <div
                        className={`mt-5 rounded-xl border bg-slate-50/50 p-4 ${
                          fieldErrors.servicesOffered
                            ? "border-red-300"
                            : "border-slate-200"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          Services Offered <RequiredMark />
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Pick services to unlock their operation settings in the
                          next step.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {VENDOR_SERVICES.map((service) => {
                            const active = isServiceEnabled(service.id);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => toggleService(service.id)}
                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                                  active
                                    ? "border-brand bg-brand text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                {service.label}
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors.servicesOffered ? (
                          <FieldError message={fieldErrors.servicesOffered} />
                        ) : null}
                      </div>
                    </PanelBlock>
                  </div>
                ) : null}

                {activePanel === "operations" ? (
                  <div className="space-y-5">
                    <PanelBlock title="Vendor Images">
                      <Hint>
                        Image size should be 900px × 500px and less than 200kb
                      </Hint>
                    </PanelBlock>

                    {VENDOR_SERVICES.map((service) => {
                      const enabled = isServiceEnabled(service.id);
                      const svc = form.services[service.id];
                      const serviceErrors = fieldErrors.services?.[service.id];
                      const hasServiceErrors = Boolean(
                        enabled &&
                          (serviceErrors?.images ||
                            serviceErrors?.minNotice ||
                            serviceErrors?.capacity ||
                            serviceErrors?.deliveryAreas),
                      );
                      return (
                        <article
                          key={service.id}
                          className={`overflow-hidden rounded-2xl border transition ${
                            hasServiceErrors
                              ? "border-red-300 bg-white"
                              : enabled
                                ? "border-slate-200 bg-white"
                                : "border-slate-100 bg-slate-50/50 opacity-60"
                          }`}
                        >
                          <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                                  enabled
                                    ? "bg-brand text-white"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                              >
                                {service.label.charAt(0)}
                              </span>
                              <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                  {service.label}
                                </h3>
                                <p className="text-xs text-slate-500">
                                  {enabled
                                    ? "Configure images, notice, capacity & delivery"
                                    : "Enable this service in step 2"}
                                </p>
                              </div>
                            </div>
                            {!enabled ? (
                              <button
                                type="button"
                                onClick={() => toggleService(service.id)}
                                className="shrink-0 rounded-lg border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
                              >
                                Enable
                              </button>
                            ) : null}
                          </header>

                          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Service images {enabled ? <RequiredMark /> : null}
                              </p>
                              <ServiceImagePicker
                                images={svc.images}
                                disabled={!enabled}
                                error={serviceErrors?.images}
                                onAdd={(files) =>
                                  addServiceImages(service.id, files)
                                }
                                onRemove={(imageId) =>
                                  removeServiceImage(service.id, imageId)
                                }
                              />
                            </div>
                            <TextField
                              label="Minimum Notice"
                              required={enabled}
                              disabled={!enabled}
                              value={svc.minNotice}
                              error={serviceErrors?.minNotice}
                              onChange={(value) =>
                                updateServiceField(
                                  service.id,
                                  "minNotice",
                                  value,
                                )
                              }
                              placeholder={`${service.label} min notice`}
                            />
                            <TextField
                              label="Capacity Per Day"
                              required={enabled}
                              disabled={!enabled}
                              value={svc.capacity}
                              error={serviceErrors?.capacity}
                              onChange={(value) =>
                                updateServiceField(
                                  service.id,
                                  "capacity",
                                  value,
                                )
                              }
                              placeholder={`${service.label} capacity`}
                            />
                          </div>

                          <div className="border-t border-slate-100 px-4 pb-4 sm:px-5">
                            <DeliveryAreasField
                              disabled={!enabled}
                              required={enabled}
                              serviceLabel={service.label}
                              entries={svc.deliveryAreas}
                              areaGroups={deliveryAreaGroups}
                              areasLoading={deliveryAreasLoading}
                              areasError={deliveryAreasError}
                              error={serviceErrors?.deliveryAreas}
                              onAdd={(areaId) =>
                                addDeliveryArea(service.id, areaId)
                              }
                              onRemove={(entryId) =>
                                removeDeliveryArea(service.id, entryId)
                              }
                              onCostChange={(entryId, cost) =>
                                updateDeliveryAreaCost(
                                  service.id,
                                  entryId,
                                  cost,
                                )
                              }
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() =>
                    setActivePanel(PANELS[activeIndex - 1]?.id ?? "profile")
                  }
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>
                {activeIndex < PANELS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      goToPanel(PANELS[activeIndex + 1]?.id ?? "operations")
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Continue →
                  </button>
                ) : (
                  <div className="flex gap-2 lg:hidden">
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={() => void handleSubmit("draft")}
                      className="rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-sm font-semibold text-brand"
                    >
                      Draft
                    </button>
                    <button
                      type="submit"
                      disabled={saving !== null || !isLastStep}
                      className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                )}
              </footer>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function DeliveryAreasField({
  disabled = false,
  required = false,
  serviceLabel,
  entries,
  areaGroups,
  areasLoading = false,
  areasError = null,
  error,
  onAdd,
  onRemove,
  onCostChange,
}: {
  disabled?: boolean;
  required?: boolean;
  serviceLabel: string;
  entries: { id: string; areaId: string; cost: string }[];
  areaGroups: DeliveryAreaGroup[];
  areasLoading?: boolean;
  areasError?: string | null;
  error?: string;
  onAdd: (areaId: string) => void;
  onRemove: (entryId: string) => void;
  onCostChange: (entryId: string, cost: string) => void;
}) {
  const [pickerValue, setPickerValue] = useState("");
  const usedAreaIds = new Set(entries.map((entry) => entry.areaId));
  const availableGroups = areaGroups
    .map((group) => ({
      ...group,
      subareas: group.subareas.filter((area) => !usedAreaIds.has(area.id)),
    }))
    .filter((group) => group.subareas.length > 0);
  const availableCount = availableGroups.reduce(
    (total, group) => total + group.subareas.length,
    0,
  );

  function handleAdd() {
    if (!pickerValue || disabled) return;
    onAdd(pickerValue);
    setPickerValue("");
  }

  const placeholder = areasLoading
    ? "Loading areas…"
    : areasError
      ? "Could not load areas"
      : availableCount === 0
        ? "All areas added"
        : "Choose a delivery area…";

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <div
        className={`rounded-lg border bg-slate-50/80 p-2.5 sm:p-3 ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div>
            <p className="text-xs font-semibold text-slate-900">
              Delivery Areas & Cost {required ? <RequiredMark /> : null}
            </p>
            <p className="text-[11px] text-slate-500">{serviceLabel}</p>
          </div>
          {entries.length > 0 ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
              {entries.length} area{entries.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
          <select
            disabled={
              disabled || areasLoading || Boolean(areasError) || availableCount === 0
            }
            value={pickerValue}
            onChange={(event) => setPickerValue(event.target.value)}
            className={`${inputClass} min-w-0 flex-1 py-2 text-xs`}
          >
            <option value="">{placeholder}</option>
            {availableGroups.map((group) => (
              <optgroup
                key={group.id}
                label={formatDeliveryAreaGroupLabel(group)}
              >
                {group.subareas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {formatDeliverySubareaLabel(area)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={disabled || !pickerValue}
            onClick={handleAdd}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon />
            Add
          </button>
        </div>
        {areasError ? (
          <p className="mt-1.5 text-[11px] text-red-600">{areasError}</p>
        ) : null}
        {error ? <FieldError message={error} /> : null}
      </div>

      {entries.length > 0 ? (
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {entries.map((entry) => {
            const area = findDeliverySubarea(areaGroups, entry.areaId);
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
              >
                <span className="h-8 w-0.5 shrink-0 rounded-full bg-brand" />

                <div className="min-w-0 flex-1">
                  {area?.zoneEn ? (
                    <p className="truncate text-[9px] font-semibold tracking-wide text-brand uppercase">
                      {area.zoneEn}
                    </p>
                  ) : null}
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {area?.nameEn ?? entry.areaId}
                  </p>
                  {area?.nameAr ? (
                    <p className="truncate text-[10px] text-slate-500" dir="auto">
                      {area.nameAr}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex h-8 overflow-hidden rounded-md border border-slate-200 bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20">
                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-1.5 text-[10px] font-semibold text-slate-500">
                      QR
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={disabled}
                      value={entry.cost}
                      onChange={(event) =>
                        onCostChange(entry.id, event.target.value)
                      }
                      aria-label="Delivery cost"
                      placeholder="0"
                      className="w-12 border-0 bg-transparent px-1.5 text-xs text-slate-900 outline-none sm:w-14"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(entry.id)}
                    aria-label="Remove area"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3">
          <MapPinIcon />
          <p className="text-[11px] text-slate-500">
            No areas added — choose one above and click Add.
          </p>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 6v12M6 12h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5h6v2M10 11v5M14 11v5M6 7l1 12h10l1-12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-300"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function PreviewServiceChips({
  services,
}: {
  services: VendorServiceId[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -88 : 88,
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-2 flex items-center gap-0.5 sm:mt-3">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll services left"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/25"
      >
        <ChevronIcon direction="left" />
      </button>
      <div
        ref={scrollRef}
        className="chip-scroll flex min-w-0 flex-1 gap-1 overflow-x-auto"
      >
        {services.map((id) => {
          const label = VENDOR_SERVICES.find((s) => s.id === id)?.label ?? id;
          return (
            <span
              key={id}
              className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase"
            >
              {label}
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll services right"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/25"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "m14 7-5 5 5 5" : "m10 7 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelBlock({
  title,
  required = false,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="h-4 w-1 rounded-full bg-brand" />
        {title}
        {required ? <RequiredMark /> : null}
      </h3>
      {children}
    </section>
  );
}

function RequiredMark() {
  return (
    <span className="text-brand" aria-hidden>
      *
    </span>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1.5 text-xs text-red-600">{message}</p>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-brand/10 bg-brand-soft/70 px-3 py-2 text-sm text-brand">
      {children}
    </p>
  );
}

function MirrorField({
  label,
  value,
  onChange,
  dir,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="grid grid-cols-[minmax(6rem,9rem)_1fr] items-start gap-2 px-3 py-2.5">
      <span className="pt-2 text-right text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
        {label.replace(/^(English|Arabic) /, "")}
        {required ? (
          <>
            {" "}
            <RequiredMark />
          </>
        ) : null}
      </span>
      <span>
        <input
          type="text"
          value={value}
          dir={dir}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-md border bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-slate-200 focus:border-brand focus:ring-brand/20"
          }`}
        />
        {error ? <FieldError message={error} /> : null}
      </span>
    </label>
  );
}

function ContactTile({
  label,
  value,
  onChange,
  type = "text",
  icon,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon: "email" | "mobile" | "phone";
  required?: boolean;
  error?: string;
}) {
  return (
    <label
      className={`block rounded-xl border bg-slate-50/50 p-4 transition focus-within:ring-2 ${
        error
          ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-200"
          : "border-slate-200 focus-within:border-brand focus-within:ring-brand/20"
      }`}
    >
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ContactIcon type={icon} />
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function ContactIcon({ type }: { type: "email" | "mobile" | "phone" }) {
  const common = "h-4 w-4 text-brand";
  if (type === "email") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 6h16v12H4V6Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="m4 7 8 6 8-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "mobile") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="7"
          y="3"
          width="10"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path d="M11 18h2" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8.5a10 10 0 0 1 12 0M8 11h8M9.5 14h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  dir,
  placeholder,
  disabled = false,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className={`block ${disabled ? "opacity-50" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? (
          <>
            {" "}
            <RequiredMark />
          </>
        ) : null}
      </span>
      <input
        type={type}
        value={value}
        dir={dir}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : ""
        }`}
      />
      {error ? <FieldError message={error} /> : null}
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
    <label className="flex h-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-slate-300">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-brand" : "bg-slate-200"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
}

function ServiceImagePicker({
  images,
  onAdd,
  onRemove,
  disabled = false,
  error,
}: {
  images: VendorImageAsset[];
  onAdd: (files: File[]) => void;
  onRemove: (imageId: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (files.length === 0) return;
    onAdd(files);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3.5 py-2.5 text-sm font-semibold transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-brand/30 bg-brand-soft/50 text-brand"
        }`}
      >
        <UploadIcon />
        Add Images
      </button>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                className="h-24 w-full object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(image.id)}
                aria-label={`Remove ${image.title}`}
                className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/70 text-white transition hover:bg-brand disabled:opacity-50"
              >
                ×
              </button>
              <p className="truncate px-2 py-1.5 text-xs text-slate-500">
                {image.title}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`flex h-24 items-center justify-center rounded-xl border border-dashed bg-white text-xs ${
            error ? "border-red-300 text-red-500" : "border-slate-200 text-slate-400"
          }`}
        >
          No images
        </div>
      )}
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

function ImagePicker({
  image,
  onChange,
  disabled = false,
  defaultTitle = "Image",
  hidePreview = false,
  error,
}: {
  image: VendorImageAsset | null;
  onChange: (image: VendorImageAsset | null) => void;
  disabled?: boolean;
  defaultTitle?: string;
  hidePreview?: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (image?.url.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
    }

    const url = URL.createObjectURL(file);
    onChange({
      id: `img-${Date.now()}`,
      url,
      title: file.name || defaultTitle,
      alt: defaultTitle,
      file,
    });
  }

  function handleRemove() {
    if (image?.url.startsWith("blob:")) {
      URL.revokeObjectURL(image.url);
    }
    onChange(null);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand/30 bg-brand-soft/50 px-3.5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UploadIcon />
        Add Image
      </button>
      {image && !hidePreview ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt}
            className="h-24 w-full object-cover"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={handleRemove}
            aria-label="Remove image"
            className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/70 text-white transition hover:bg-brand disabled:opacity-50"
          >
            ×
          </button>
          <p className="truncate px-2 py-1.5 text-xs text-slate-500">
            {image.title}
          </p>
        </div>
      ) : image && hidePreview ? (
        <button
          type="button"
          disabled={disabled}
          onClick={handleRemove}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Remove image
        </button>
      ) : !hidePreview ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-400">
          No image
        </div>
      ) : null}
      {error ? <FieldError message={error} /> : null}
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
        d="M5 18h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
