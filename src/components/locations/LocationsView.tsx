"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateLocationModal } from "@/components/locations/CreateLocationModal";
import { LocationsMap } from "@/components/locations/LocationsMap";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import {
  createLocationOrSubarea,
  fetchLocationMapGroups,
  findSubarea,
  flattenSubareas,
  formatLocationPair,
  formatSubareaOption,
  updateSubareaPath,
  type LocationMapGroup,
  type MapLatLng,
} from "@/lib/location-map";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const outlineButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function LocationsView() {
  const [groups, setGroups] = useState<LocationMapGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftPath, setDraftPath] = useState<MapLatLng[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchLocationMapGroups()
      .then((items) => {
        if (cancelled) return;
        setGroups(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load dummy location data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subareas = useMemo(() => flattenSubareas(groups), [groups]);
  const selected = selectedId ? findSubarea(groups, selectedId) : undefined;
  const hasKey = Boolean(GOOGLE_MAPS_API_KEY);

  function selectSubarea(id: string) {
    if (editing) return;
    setSelectedId(id);
    setShowAll(false);
    setMessage(null);
  }

  function startEdit() {
    if (!selected) return;
    setEditing(true);
    setDraftPath(selected.path);
    setShowAll(false);
    setMessage(null);
  }

  function cancelEdit() {
    setEditing(false);
    setDraftPath(null);
  }

  function saveEdit() {
    if (!selectedId || !draftPath) {
      setEditing(false);
      setDraftPath(null);
      return;
    }
    setGroups((current) => updateSubareaPath(current, selectedId, draftPath));
    setEditing(false);
    setDraftPath(null);
    setMessage("Polygon saved locally. Backend save will be wired later.");
  }

  function handleCreate(payload: {
    locationId: string;
    nameEn: string;
    nameAr: string;
  }) {
    const next = createLocationOrSubarea(groups, payload);
    const created =
      payload.locationId === "new"
        ? next[next.length - 1]?.subareas[0]
        : next
            .find((group) => group.id === payload.locationId)
            ?.subareas.at(-1);

    setGroups(next);
    setCreateOpen(false);
    if (created) {
      setSelectedId(created.id);
      setShowAll(false);
    }
    setMessage(
      payload.locationId === "new"
        ? "New location created locally with a starter polygon. Select Edit to reshape it."
        : "Subarea created locally with a starter polygon. Select Edit to reshape it.",
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Locations
          </p>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Select a subarea to view its polygon, then edit vertices on the map.
            Using dummy data only — live APIs are not called from this page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <button type="button" onClick={saveEdit} className={outlineButtonClass}>
                Save
              </button>
              <button type="button" onClick={cancelEdit} className={outlineButtonClass}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create location / subarea
              </button>
              <button
                type="button"
                onClick={startEdit}
                disabled={!selected || !hasKey}
                className={outlineButtonClass}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAll(true);
                  setMessage(null);
                }}
                disabled={loading || subareas.length === 0 || !hasKey}
                className={outlineButtonClass}
              >
                Show all areas
              </button>
            </>
          )}
        </div>
      </div>

      <label className="block max-w-xl">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
          Select subarea to edit *
        </span>
        <select
          value={selectedId}
          disabled={editing || loading}
          onChange={(event) => selectSubarea(event.target.value)}
          className={selectClass}
        >
          <option value="">Choose a subarea</option>
          {groups.map((group) => (
            <optgroup
              key={group.id}
              label={formatLocationPair(group.nameEn, group.nameAr)}
            >
              {group.subareas.map((subarea) => (
                <option key={subarea.id} value={subarea.id}>
                  {formatSubareaOption(subarea)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {!hasKey ? (
          <MissingKeyState />
        ) : loading ? (
          <div className="h-full min-h-[28rem] animate-pulse bg-slate-100" />
        ) : (
          <LocationsMap
            subareas={subareas}
            selectedId={selectedId || null}
            showAll={showAll}
            editing={editing}
            onSelect={selectSubarea}
            onPathChange={setDraftPath}
          />
        )}
      </section>

      {createOpen ? (
        <CreateLocationModal
          groups={groups}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      ) : null}
    </div>
  );
}

function MissingKeyState() {
  return (
    <div className="flex h-full min-h-[28rem] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <MapIcon />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-900">
        Google Maps API key is missing
      </p>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Add your key to the project-root{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          .env
        </code>{" "}
        file as{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>
        , then restart{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          npm run dev
        </code>
        .
      </p>
    </div>
  );
}

function MapIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4.5 3.75 6.75v13.5L9 18M9 4.5l6 2.25M9 4.5v13.5m6-11.25 5.25-2.25v13.5L15 18m0-11.25V18m0 0-6 2.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
