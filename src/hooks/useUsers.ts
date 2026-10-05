"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUsers } from "@/lib/users";
import type { UserRecord, UserRole } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 10;

type UseUsersParams = {
  search: string;
  role: "" | UserRole;
  joinedFrom: string;
  joinedTo: string;
  page: number;
  pageSize?: number;
  sortDir: "asc" | "desc";
};

export function useUsers({
  search,
  role,
  joinedFrom,
  joinedTo,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  sortDir,
}: UseUsersParams) {
  const [items, setItems] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchUsers({
      search: search || undefined,
      role: role || undefined,
      joinedFrom: joinedFrom || undefined,
      joinedTo: joinedTo || undefined,
      page,
      pageSize,
      sortDir,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, role, joinedFrom, joinedTo, page, pageSize, sortDir, refreshKey]);

  return { items, total, loading, error, reload };
}
