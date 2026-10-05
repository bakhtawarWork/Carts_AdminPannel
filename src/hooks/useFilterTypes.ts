"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchFilterTypes } from "@/lib/filter-types";
import type { FilterCategory } from "@/lib/types";

export function useFilterTypes() {
  const [items, setItems] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchFilterTypes()
      .then((categories) => {
        if (cancelled) return;
        setItems(categories);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load filter types.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { items, loading, error, reload };
}
