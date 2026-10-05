"use client";

import { useEffect, useState } from "react";
import { fetchCustomers } from "@/lib/customers";
import type { CustomerRecord } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 10;

export function useCustomers(
  name: string,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
) {
  const [items, setItems] = useState<CustomerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchCustomers({
      name: name || undefined,
      page,
      pageSize,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load customers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, page, pageSize]);

  return { items, total, loading, error };
}
