"use client";

import { useEffect, useState } from "react";
import { fetchVendors } from "@/lib/vendors";
import type { VendorListTab, VendorRecord, VendorsQuery } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 8;

export type VendorFilters = {
  tab: VendorListTab;
  published: "all" | "published" | "unpublished";
  name: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
  page: number;
  pageSize?: number;
};

export function useVendors(filters: VendorFilters) {
  const [items, setItems] = useState<VendorRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query: VendorsQuery = {
      tab: filters.tab,
      published: filters.published,
      name: filters.name,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      updatedFrom: filters.updatedFrom || undefined,
      updatedTo: filters.updatedTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    };

    setLoading(true);
    setError(null);

    fetchVendors(query)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Unable to load vendors.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.tab,
    filters.published,
    filters.name,
    filters.createdFrom,
    filters.createdTo,
    filters.updatedFrom,
    filters.updatedTo,
    filters.page,
    filters.pageSize,
  ]);

  return {
    items,
    total,
    page,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    loading,
    error,
  };
}
