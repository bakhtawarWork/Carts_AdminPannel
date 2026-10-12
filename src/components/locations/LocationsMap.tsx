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
  draftPath: MapLatLng[] | null;
  fallbackCenter?: MapLatLng | null;
  onSelect: (subareaId: string) => void;
  onDraftPathChange: (path: MapLatLng[]) => void;
};

function readPath(polygon: google.maps.Polygon): MapLatLng[] {
  const path = polygon.getPath();
  if (!path) return [];
  const points: MapLatLng[] = [];
  for (let index = 0; index < path.getLength(); index += 1) {
    const point = path.getAt(index);
    if (point) {
      points.push({ lat: point.lat(), lng: point.lng() });
    }
  }
  return points;
}

function isPathEqual(a: MapLatLng[], b: MapLatLng[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (
      Math.abs(a[i].lat - b[i].lat) > 1e-7 ||
      Math.abs(a[i].lng - b[i].lng) > 1e-7
    ) {
      return false;
    }
  }
  return true;
}

function fitToSubareas(
  map: google.maps.Map,
  subareas: LocationMapSubarea[],
  fallbackCenter?: MapLatLng | null,
) {
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
  } else {
    map.setCenter(fallbackCenter ?? LOCATION_MAP_DEFAULT_CENTER);
    map.setZoom(fallbackCenter ? 13 : LOCATION_MAP_DEFAULT_ZOOM);
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
  draftPath,
  fallbackCenter,
  onSelect,
  onDraftPathChange,
}: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const onDraftPathChangeRef = useRef(onDraftPathChange);
  const editingRef = useRef(editing);
  const draftPathRef = useRef(draftPath);

  const draftElementsRef = useRef<{
    markers: google.maps.Marker[];
    polyline: google.maps.Polyline | null;
    polygon: google.maps.Polygon | null;
    polygonListeners: google.maps.MapsEventListener[];
  }>({
    markers: [],
    polyline: null,
    polygon: null,
    polygonListeners: [],
  });

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onDraftPathChangeRef.current = onDraftPathChange;
    editingRef.current = editing;
    draftPathRef.current = draftPath;
  }, [onSelect, onDraftPathChange, editing, draftPath]);

  // 1. Initialize Google Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !GOOGLE_MAPS_API_KEY) return;

    let cancelled = false;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: fallbackCenter ?? LOCATION_MAP_DEFAULT_CENTER,
          zoom: fallbackCenter ? 13 : LOCATION_MAP_DEFAULT_ZOOM,
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

  // 2. Render static polygons for non-editing subareas
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const listeners: google.maps.MapsEventListener[] = [];
    const polygons: google.maps.Polygon[] = [];
    const visible = visibleSubareas(subareas, selectedId, showAll);

    for (const subarea of visible) {
      if (editing && subarea.id === selectedId) continue;
      if (!subarea.path || subarea.path.length === 0) continue;

      const isSelected = subarea.id === selectedId;
      const polygon = new google.maps.Polygon({
        map,
        paths: subarea.path,
        strokeColor: "#e31e24",
        strokeOpacity: 1,
        strokeWeight: isSelected ? 2.5 : 1.5,
        fillColor: "#e31e24",
        fillOpacity: isSelected ? 0.22 : 0.08,
        clickable: !editing,
        editable: false,
        draggable: false,
        zIndex: isSelected ? 2 : 1,
      });

      if (!editing) {
        listeners.push(
          polygon.addListener("click", () => {
            onSelectRef.current(subarea.id);
          }),
        );
      }

      polygons.push(polygon);
    }

    return () => {
      listeners.forEach((listener) => listener.remove());
      polygons.forEach((polygon) => polygon.setMap(null));
    };
  }, [mapReady, subareas, selectedId, showAll, editing]);

  // 3. Map crosshair and click-to-place-dot listener when editing
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (!editing) {
      map.setOptions({ draggableCursor: null });
      return;
    }

    map.setOptions({ draggableCursor: "crosshair" });

    const clickListener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (!editingRef.current || !event.latLng) return;
        const newPoint: MapLatLng = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        const current = draftPathRef.current ?? [];
        onDraftPathChangeRef.current([...current, newPoint]);
      },
    );

    return () => {
      clickListener.remove();
      map.setOptions({ draggableCursor: null });
    };
  }, [mapReady, editing]);

  // 4. Render interactive draft elements: Dot 1 marker, Dot 2 marker + polyline, Dot 3+ editable polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const elements = draftElementsRef.current;

    if (!editing) {
      elements.markers.forEach((m) => m.setMap(null));
      elements.markers = [];
      if (elements.polyline) {
        elements.polyline.setMap(null);
        elements.polyline = null;
      }
      if (elements.polygon) {
        elements.polygonListeners.forEach((l) => l.remove());
        elements.polygonListeners = [];
        elements.polygon.setMap(null);
        elements.polygon = null;
      }
      return;
    }

    const currentPoints = draftPath ?? [];

    // If an editable polygon already exists and matches currentPoints, skip rebuilding so dragging is not interrupted
    if (elements.polygon) {
      const activePoints = readPath(elements.polygon);
      if (isPathEqual(activePoints, currentPoints)) {
        return;
      }
    }

    // Clean up temporary markers and polyline
    elements.markers.forEach((m) => m.setMap(null));
    elements.markers = [];
    if (elements.polyline) {
      elements.polyline.setMap(null);
      elements.polyline = null;
    }

    if (currentPoints.length === 0) {
      if (elements.polygon) {
        elements.polygonListeners.forEach((l) => l.remove());
        elements.polygonListeners = [];
        elements.polygon.setMap(null);
        elements.polygon = null;
      }
    } else if (currentPoints.length === 1) {
      if (elements.polygon) {
        elements.polygonListeners.forEach((l) => l.remove());
        elements.polygonListeners = [];
        elements.polygon.setMap(null);
        elements.polygon = null;
      }
      elements.markers.push(
        new google.maps.Marker({
          position: currentPoints[0],
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#e31e24",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
          },
          label: {
            text: "1",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "bold",
          },
          title: "Dot 1",
        }),
      );
    } else if (currentPoints.length === 2) {
      if (elements.polygon) {
        elements.polygonListeners.forEach((l) => l.remove());
        elements.polygonListeners = [];
        elements.polygon.setMap(null);
        elements.polygon = null;
      }
      currentPoints.forEach((point, index) => {
        elements.markers.push(
          new google.maps.Marker({
            position: point,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#e31e24",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2.5,
            },
            label: {
              text: String(index + 1),
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: "bold",
            },
            title: `Dot ${index + 1}`,
          }),
        );
      });
      elements.polyline = new google.maps.Polyline({
        path: currentPoints,
        map,
        strokeColor: "#e31e24",
        strokeOpacity: 1,
        strokeWeight: 2.5,
      });
    } else if (currentPoints.length >= 3) {
      if (elements.polygon) {
        elements.polygon.setPath(currentPoints);
      } else {
        const polygon = new google.maps.Polygon({
          map,
          paths: currentPoints,
          strokeColor: "#e31e24",
          strokeOpacity: 1,
          strokeWeight: 2.5,
          fillColor: "#e31e24",
          fillOpacity: 0.28,
          editable: true,
          draggable: false,
          clickable: false,
          zIndex: 10,
        });

        const path = polygon.getPath();
        if (path && typeof path.addListener === "function") {
          const emit = () => {
            onDraftPathChangeRef.current(readPath(polygon));
          };
          elements.polygonListeners.push(path.addListener("set_at", emit));
          elements.polygonListeners.push(path.addListener("insert_at", emit));
          elements.polygonListeners.push(path.addListener("remove_at", emit));
        }

        elements.polygon = polygon;
      }
    }
  }, [mapReady, editing, draftPath]);

  // Clean up all draft elements on unmount
  useEffect(() => {
    return () => {
      const elements = draftElementsRef.current;
      elements.markers.forEach((m) => m.setMap(null));
      if (elements.polyline) elements.polyline.setMap(null);
      if (elements.polygon) {
        elements.polygonListeners.forEach((l) => l.remove());
        elements.polygon.setMap(null);
      }
    };
  }, []);

  // 5. Fit bounds when viewing
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || editing) return;

    const visible = visibleSubareas(subareas, selectedId, showAll);
    if (visible.length > 0) {
      fitToSubareas(map, visible, fallbackCenter);
      return;
    }

    map.setCenter(fallbackCenter ?? LOCATION_MAP_DEFAULT_CENTER);
    map.setZoom(fallbackCenter ? 13 : LOCATION_MAP_DEFAULT_ZOOM);
  }, [mapReady, subareas, selectedId, showAll, fallbackCenter, editing]);

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
