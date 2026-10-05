"use client";

import { useEffect, useState } from "react";
import { fetchPopularCollectionById } from "@/lib/popular-collections";
import type { PopularCollection } from "@/lib/types";

export function usePopularCollection(id: string | undefined) {
  const [collection, setCollection] = useState<PopularCollection | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPopularCollectionById(id!);
        if (cancelled) return;
        if (!data) {
          setError("Collection not found.");
          setCollection(null);
          return;
        }
        setCollection(data);
      } catch {
        if (!cancelled) setError("Unable to load collection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  function reload() {
    setReloadKey((value) => value + 1);
  }

  return { collection, loading, error, reload };
}
