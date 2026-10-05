"use client";

import { useEffect, useState } from "react";
import { fetchOrders } from "@/lib/orders";
import type { OrderListTab, OrderRecord, OrdersQuery } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 8;

export type OrderFilters = {
  tab: OrderListTab;
  orderId: string;
  vendorId: string;
  eventDate: string;
  cancellationStatus: "any" | "cancelled" | "not_cancelled";
  orderStatus: string;
  updatedInLast4Days: "any" | "yes" | "no";
  page: number;
  pageSize?: number;
  sortDir?: "asc" | "desc";
};

export function useOrders(filters: OrderFilters) {
  const [items, setItems] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(filters.page);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query: OrdersQuery = {
      tab: filters.tab,
      orderId: filters.orderId || undefined,
      vendorId: filters.vendorId || undefined,
      eventDate: filters.eventDate || undefined,
      cancellationStatus: filters.cancellationStatus,
      orderStatus: filters.orderStatus || undefined,
      updatedInLast4Days: filters.updatedInLast4Days,
      page: filters.page,
      pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
      sortDir: filters.sortDir ?? "desc",
    };

    setLoading(true);
    setError(null);

    fetchOrders(query)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setTotal(response.total);
        setPage(response.page);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load orders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.tab,
    filters.orderId,
    filters.vendorId,
    filters.eventDate,
    filters.cancellationStatus,
    filters.orderStatus,
    filters.updatedInLast4Days,
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
