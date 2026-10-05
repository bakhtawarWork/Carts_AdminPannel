"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from "@/lib/google-maps";
import {
  LOCATION_MAP_DEFAULT_CENTER,
  LOCATION_MAP_DEFAULT_ZOOM,
  type LocationMapSubarea,
  type MapLatLng,
} from "@/lib/location-map";

type LocationsMapProps = {
  subareas: LocationMapSubarea[];
  selectedId: string | null;
  showAll: boolean;
  editing: boolean;
  onSelect: (subareaId: string) => void;
  onPathChange: (path: MapLatLng[]) => void;
};

function readPath(polygon: google.maps.Polygon): MapLatLng[] {
  const path = polygon.getPath();
  const points: MapLatLng[] = [];
  for (let index = 0; index < path.getLength(); index += 1) {
    const point = path.getAt(index);
    points.push({ lat: point.lat(), lng: point.lng() });
  }
  return points;
}

function fitToSubareas(map: google.maps.Map, subareas: LocationMapSubarea[]) {
  const bounds = new google.maps.LatLngBounds();
  let hasPoint = false;
  for (const subarea of subareas) {
    for (const point of subarea.path) {
      bounds.extend(point);
      hasPoint = true;
    }
  }
  if (hasPoint) {
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }
}

function visibleSubareas(
  subareas: LocationMapSubarea[],
  selectedId: string | null,
  showAll: boolean,
) {
  if (showAll) return subareas;
  return subareas.filter((subarea) => subarea.id === selectedId);
}

export function LocationsMap({
  subareas,
  selectedId,
  showAll,
  editing,
  onSelect,
  onPathChange,
}: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPathChangeRef = useRef(onPathChange);
  const editingRef = useRef(editing);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onPathChangeRef.current = onPathChange;
    editingRef.current = editing;
  }, [onSelect, onPathChange, editing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !GOOGLE_MAPS_API_KEY) return;

    let cancelled = false;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: LOCATION_MAP_DEFAULT_CENTER,
          zoom: LOCATION_MAP_DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        setMapReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        mapRef.current = null;
        setLoadError(
          "Could not load Google Maps. Check the API key and that Maps JavaScript API is enabled.",
        );
      });

    return () => {
      cancelled = true;
      mapRef.current = null;
      setMapReady(false);
      container.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const listeners: google.maps.MapsEventListener[] = [];
    const polygons = new Map<string, google.maps.Polygon>();
    const visible = visibleSubareas(subareas, selectedId, showAll);

    for (const subarea of visible) {
      const isSelected = subarea.id === selectedId;
      const isEditable = editing && isSelected;
      const polygon = new google.maps.Polygon({
        map,
        paths: subarea.path,
        strokeColor: "#e31e24",
        strokeOpacity: 1,
        strokeWeight: isSelected ? 2.5 : 1.5,
        fillColor: isEditable ? "#334155" : "#e31e24",
        fillOpacity: isSelected ? (isEditable ? 0.42 : 0.22) : 0.08,
        clickable: !editing || isSelected,
        editable: isEditable,
        draggable: false,
        zIndex: isSelected ? 2 : 1,
      });

      listeners.push(
        polygon.addListener("click", () => {
          if (editingRef.current) return;
          onSelectRef.current(subarea.id);
        }),
      );

      if (isEditable) {
        const path = polygon.getPath();
        const emit = () => onPathChangeRef.current(readPath(polygon));
        listeners.push(path.addListener("set_at", emit));
        listeners.push(path.addListener("insert_at", emit));
        listeners.push(path.addListener("remove_at", emit));
      }

      polygons.set(subarea.id, polygon);
    }

    return () => {
      listeners.forEach((listener) => listener.remove());
      polygons.forEach((polygon) => polygon.setMap(null));
    };
  }, [mapReady, subareas, selectedId, showAll, editing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || editing) return;

    const visible = visibleSubareas(subareas, selectedId, showAll);
    if (visible.length > 0) {
      fitToSubareas(map, visible);
      return;
    }

    map.setCenter(LOCATION_MAP_DEFAULT_CENTER);
    map.setZoom(LOCATION_MAP_DEFAULT_ZOOM);
  }, [mapReady, subareas, selectedId, showAll, editing]);

  return (
    <div className="relative h-full min-h-[28rem] w-full">
      <div ref={containerRef} className="h-full min-h-[28rem] w-full" />
      {!mapReady && !loadError ? (
        <div className="absolute inset-0 animate-pulse bg-slate-100" />
      ) : null}
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 px-6 text-center">
          <p className="max-w-md text-sm text-slate-600">{loadError}</p>
        </div>
      ) : null}
    </div>
  );
}
