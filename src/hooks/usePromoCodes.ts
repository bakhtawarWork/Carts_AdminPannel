"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    const query: PromoCodesQuery = {
      tab: filters.tab,
      page: filters.page,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    };

    setLoading(true);
    setError(null);

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
  }, [filters.tab, filters.page, filters.pageSize]);

  return {
    items,
    total,
    page,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    loading,
    error,
  };
}
