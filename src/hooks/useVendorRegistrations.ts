"use client";

import { useEffect, useState } from "react";
import { fetchVendorRegistrations } from "@/lib/vendor-registrations";
import type { VendorRegistrationRecord } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 20;

export type VendorRegistrationFilters = {
  page: number;
  pageSize?: number;
};

export function useVendorRegistrations(filters: VendorRegistrationFilters) {
  const [items, setItems] = useState<VendorRegistrationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchVendorRegistrations({
      page: filters.page,
      pageSize,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load vendor registrations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.page, pageSize]);

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
  };
}
