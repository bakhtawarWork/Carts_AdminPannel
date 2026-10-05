"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSearchCategorySections } from "@/lib/search-category-sections";
import type { SearchCategorySectionRecord } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 8;

export function useSearchCategorySections(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const [items, setItems] = useState<SearchCategorySectionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchSearchCategorySections({
        page: targetPage,
        pageSize,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch {
      setError("Unable to load search category sections.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    void reload(page);
  }, [page, reload]);

  return {
    items,
    total,
    loading,
    error,
    reload,
  };
}
