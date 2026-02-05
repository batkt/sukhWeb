"use client";

import { useEffect, useState } from "react";
import { adminUilchilgee } from "@/lib/uilchilgee";

export interface TsonkhTokhirgooItem {
  _id?: string;
  garchig?: string;
  tailbar?: string;
  zurgiinId?: string;
  link?: string;
  [key: string]: any;
}

export interface Tsonkh {
  _id: string;
  system?: string;
  zam: string;
  ner: string;
  tolgoi?: string;
  tailbar?: string;
  tailbarEN?: string;
  zaavar?: string;
  zaavarEN?: string;
  tokhirgoo?: TsonkhTokhirgooItem[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches tsonkh (sections with tokhirgoo) from admin API for the given system.
 * Used to display context-specific help/instructions per page (zam path).
 */
export function useTsonkh(system: string = "sukh") {
  const [list, setList] = useState<Tsonkh[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTsonkh() {
      try {
        setLoading(true);
        setError(null);
        const res = await adminUilchilgee().get(`/tsonkhAvya/${encodeURIComponent(system)}`, {
          params: {
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
          },
        });
        const data = res.data;
        const jagsaalt = Array.isArray(data?.jagsaalt) ? data.jagsaalt : Array.isArray(data) ? data : [];
        if (!cancelled) {
          setList(jagsaalt);
        }
      } catch (e: any) {
        // Admin API may return 500/403 (e.g. "Эрх байхгүй") - fail silently, show empty
        if (!cancelled) {
          setList([]);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTsonkh();
    return () => {
      cancelled = true;
    };
  }, [system]);

  return { list, loading, error };
}
