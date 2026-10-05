"use client";

import { useEffect, useState } from "react";
import { fetchPopularVendors } from "@/lib/popular-vendors";
import type { PopularVendor } from "@/lib/types";

export function usePopularVendors() {
  const [vendors, setVendors] = useState<PopularVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPopularVendors()
      .then((data) => {
        if (!cancelled) setVendors(data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load popular vendors.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { vendors, loading, error };
}
