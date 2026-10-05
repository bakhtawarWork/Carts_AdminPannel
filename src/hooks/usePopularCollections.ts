"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPopularCollections } from "@/lib/popular-collections";
import type { PopularCollection } from "@/lib/types";

export function usePopularCollections() {
  const [collections, setCollections] = useState<PopularCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPopularCollections();
      setCollections(data);
    } catch {
      setError("Unable to load popular collections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { collections, loading, error, reload };
}
