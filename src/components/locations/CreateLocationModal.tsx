"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  formatLocationPair,
  validateCreateLocation,
  type CreateLocationPayload,
  type LocationMapGroup,
} from "@/lib/location-map";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

type CreateLocationModalProps = {
  groups: LocationMapGroup[];
  onClose: () => void;
  onCreate: (payload: CreateLocationPayload) => void;
};

export function CreateLocationModal({
  groups,
  onClose,
  onCreate,
}: CreateLocationModalProps) {
  const [locationId, setLocationId] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = { locationId, nameEn, nameAr };
    const validationError = validateCreateLocation(payload);
    if (validationError) {
      setError(validationError);
      return;
    }
    onCreate(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            Create location / subarea
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose an existing location to add a subarea, or start a new
            location. Dummy data only — nothing is sent to the backend yet.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Select location
            </span>
            <select
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setError(null);
              }}
              className={inputClass}
            >
              <option value="">Choose a location</option>
              <option value="new">Create as new location</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {formatLocationPair(group.nameEn, group.nameAr)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Name in English *
            </span>
            <input
              type="text"
              value={nameEn}
              onChange={(event) => {
                setNameEn(event.target.value);
                setError(null);
              }}
              className={inputClass}
              placeholder="e.g. Al Thakhira"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Name in Arabic *
            </span>
            <input
              type="text"
              dir="rtl"
              value={nameAr}
              onChange={(event) => {
                setNameAr(event.target.value);
                setError(null);
              }}
              className={inputClass}
              placeholder="مثال: الذخيرة"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
