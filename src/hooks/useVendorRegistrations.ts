"use client";

import { useEffect, useState } from "react";
import { fetchVendorRegistrations } from "@/lib/vendor-registrations";
import type {
  VendorRegistrationCategory,
  VendorRegistrationRecord,
  VendorRegistrationsQuery,
} from "@/lib/types";

const DEFAULT_PAGE_SIZE = 8;

export type VendorRegistrationFilters = {
  company: string;
  category: VendorRegistrationCategory | "";
  licensed: "all" | "yes" | "no";
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize?: number;
  sortDir: "asc" | "desc";
};

export function useVendorRegistrations(filters: VendorRegistrationFilters) {
  const [items, setItems] = useState<VendorRegistrationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query: VendorRegistrationsQuery = {
      company: filters.company || undefined,
      category: filters.category || undefined,
      licensed: filters.licensed,
      createdFrom: filters.createdFrom || undefined,
      createdTo: filters.createdTo || undefined,
      page: filters.page,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
      sortDir: filters.sortDir,
    };

    setLoading(true);
    setError(null);

    fetchVendorRegistrations(query)
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
  }, [
    filters.company,
    filters.category,
    filters.licensed,
    filters.createdFrom,
    filters.createdTo,
    filters.page,
    filters.pageSize,
    filters.sortDir,
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
