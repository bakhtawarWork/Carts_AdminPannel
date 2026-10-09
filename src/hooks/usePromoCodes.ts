"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPromoCodes } from "@/lib/promo-codes";
import type { PromoCodeListTab, PromoCodeRecord, PromoCodesQuery } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 6;

export type PromoCodeFilters = {
  tab: PromoCodeListTab;
  page: number;
  pageSize?: number;
};

export function usePromoCodes(filters: PromoCodeFilters) {
  const [items, setItems] = useState<PromoCodeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadedTabRef = useRef<PromoCodeListTab | null>(null);
  const reloadKeyRef = useRef(0);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const query: PromoCodesQuery = {
      tab: filters.tab,
      page: filters.page,
      pageSize,
    };

    const tabChanged = loadedTabRef.current !== filters.tab;
    if (tabChanged) loadedTabRef.current = filters.tab;

    const isExplicitRefresh = reloadKey !== reloadKeyRef.current;
    reloadKeyRef.current = reloadKey;

    setError(null);
    if (tabChanged || isExplicitRefresh) {
      setLoading(true);
    }

    fetchPromoCodes(query)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load promo codes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.tab, filters.page, filters.pageSize, reloadKey]);

  return {
    items,
    total,
    page,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    loading,
    error,
    refresh,
  };
}
