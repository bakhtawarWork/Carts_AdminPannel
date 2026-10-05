"use client";

import { useEffect, useState } from "react";
import { fetchVipUsers } from "@/lib/vip-users";
import type { VipUser, VipUsersQuery } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 10;

export function useVipUsers(filters: {
  name: string;
  phone: string;
  page: number;
  pageSize?: number;
}) {
  const [items, setItems] = useState<VipUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query: VipUsersQuery = {
      name: filters.name,
      phone: filters.phone,
      page: filters.page,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    };

    setLoading(true);
    setError(null);

    fetchVipUsers(query)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load VIP users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.name, filters.phone, filters.page, filters.pageSize]);

  return {
    items,
    total,
    page,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
    loading,
    error,
  };
}
