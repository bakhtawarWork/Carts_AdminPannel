"use client";

import { useEffect, useState } from "react";
import {
  ensureVendorFilterOptionsLoaded,
  type VendorFilterOption,
} from "@/lib/vendors";

/** Shared vendor dropdown options — one session fetch, reused across screens. */
export function useVendorFilterOptions(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [vendorOptions, setVendorOptions] = useState<VendorFilterOption[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    ensureVendorFilterOptionsLoaded()
      .then((next) => {
        if (cancelled) return;
        setVendorOptions(next);
      })
      .catch(() => {
        if (!cancelled) {
          setVendorOptions([]);
          setError("Unable to load vendors.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { options: vendorOptions, vendorOptions, loading, error };
}
