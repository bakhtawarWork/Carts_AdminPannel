"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateLocationModal } from "@/components/locations/CreateLocationModal";
import { LocationsMap } from "@/components/locations/LocationsMap";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import {
  createLocationApi,
  createSubareaApi,
} from "@/services/locations";
import {
  centroidOfPath,
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
  const [originalPathBeforeEdit, setOriginalPathBeforeEdit] =
    useState<MapLatLng[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchLocationMapGroups()
      .then((items) => {
        if (cancelled) return;
        setGroups(items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load locations.");
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

  const fallbackCenter = useMemo(() => {
    if (!selected) return null;
    const parentGroup = groups.find((g) =>
      g.subareas.some((s) => s.id === selected.id),
    );
    const siblingWithPath = parentGroup?.subareas.find((s) => s.path.length > 0);
    if (siblingWithPath) {
      return centroidOfPath(siblingWithPath.path);
    }
    return null;
  }, [groups, selected]);

  function selectSubarea(id: string) {
    if (editing) return;
    setSelectedId(id);
    setShowAll(false);
    setError(null);
    const target = id ? findSubarea(groups, id) : undefined;
    if (target && target.path.length === 0) {
      setMessage(
        "This subarea has no polygon yet. Click 'Edit' and click on the map to place dots.",
      );
    } else {
      setMessage(null);
    }
  }

  function startEdit() {
    if (!selected) return;
    setEditing(true);
    setOriginalPathBeforeEdit(selected.path);
    setDraftPath(selected.path.length > 0 ? [...selected.path] : []);
    setShowAll(false);
    setError(null);
    setMessage(null);
  }

  function handleUndoDot() {
    setError(null);
    setDraftPath((current) => {
      if (!current || current.length === 0) return [];
      return current.slice(0, -1);
    });
  }

  function handleClearDots() {
    setError(null);
    setDraftPath([]);
  }

  function cancelEdit() {
    if (selectedId && originalPathBeforeEdit !== null) {
      setGroups((current) =>
        updateSubareaPath(current, selectedId, originalPathBeforeEdit),
      );
    }
    setEditing(false);
    setDraftPath(null);
    setOriginalPathBeforeEdit(null);
    setError(null);
    setMessage(null);
  }

  function saveEdit() {
    if (!selectedId) {
      setEditing(false);
      return;
    }
    const finalPath = draftPath ?? [];
    if (finalPath.length > 0 && finalPath.length < 3) {
      setError(
        "Please place at least 3 dots to form an enclosed delivery area, or click 'Clear dots'.",
      );
      return;
    }
    setError(null);
    setGroups((current) => updateSubareaPath(current, selectedId, finalPath));
    setEditing(false);
    setDraftPath(null);
    setOriginalPathBeforeEdit(null);
    setMessage(
      finalPath.length >= 3
        ? `Area saved successfully with ${finalPath.length} boundary points.`
        : "Area polygon cleared.",
    );
  }

  async function handleCreate(payload: {
    locationId: string;
    nameEn: string;
    nameAr: string;
  }) {
    if (payload.locationId === "new") {
      await createLocationApi({
        name: { en: payload.nameEn, ar: payload.nameAr },
      });
      setMessage(`Location "${payload.nameEn}" created successfully.`);
    } else {
      await createSubareaApi(payload.locationId, {
        name: { en: payload.nameEn, ar: payload.nameAr },
      });
      setMessage(`Subarea "${payload.nameEn}" created successfully.`);
    }

    // Refresh groups from live backend API
    const updated = await fetchLocationMapGroups();
    setGroups(updated);

    // If subarea was created, find it and select it
    if (payload.locationId !== "new") {
      const parentGroup = updated.find((g) => g.id === payload.locationId);
      const newSubarea =
        parentGroup?.subareas.find(
          (s) =>
            s.nameEn.toLowerCase() === payload.nameEn.toLowerCase() ||
            s.nameAr === payload.nameAr,
        ) ?? parentGroup?.subareas.at(-1);

      if (newSubarea) {
        setSelectedId(newSubarea.id);
        setShowAll(false);
        setMessage(
          `Subarea "${payload.nameEn}" created. Click 'Edit' and click on the map to draw its boundary dots.`,
        );
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">
            Locations
          </p>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Select a subarea to view its polygon, or click Edit to place boundary dots on the map.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={(draftPath?.length ?? 0) > 0 && (draftPath?.length ?? 0) < 3}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save area
              </button>
              <button
                type="button"
                onClick={handleUndoDot}
                disabled={!draftPath || draftPath.length === 0}
                className={outlineButtonClass}
                title="Remove last dot"
              >
                Undo dot
              </button>
              <button
                type="button"
                onClick={handleClearDots}
                disabled={!draftPath || draftPath.length === 0}
                className={outlineButtonClass}
                title="Clear all dots to start over"
              >
                Clear dots
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className={outlineButtonClass}
              >
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

      {editing ? (
        <div className="flex items-center justify-between rounded-xl border border-brand/20 bg-brand-soft/40 px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5 text-slate-800">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand" />
            </span>
            <span className="font-semibold text-brand">Drawing Mode:</span>
            <span>
              {!draftPath || draftPath.length === 0
                ? "Click anywhere on the map to place dot 1."
                : draftPath.length === 1
                  ? "Dot 1 placed. Click on the map to place dot 2."
                  : draftPath.length === 2
                    ? "Dot 2 placed. Click to place dot 3 to enclose the delivery area."
                    : `Area enclosed (${draftPath.length} dots). Click map to add more dots, or drag white corner handles to adjust.`}
            </span>
          </div>
          <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
            {draftPath ? `${draftPath.length} dot${draftPath.length === 1 ? "" : "s"}` : "0 dots"}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!editing && message ? (
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
            draftPath={editing ? draftPath : null}
            fallbackCenter={fallbackCenter}
            onSelect={selectSubarea}
            onDraftPathChange={setDraftPath}
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
      <h3 className="mt-4 text-base font-semibold text-slate-900">
        Google Maps API key required
      </h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Add{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        to your environment and reload to view interactive delivery areas.
      </p>
    </div>
  );
}

function MapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
