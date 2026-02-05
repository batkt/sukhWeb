"use client";

import { useEffect, useState } from "react";
import { adminUilchilgee } from "@/lib/uilchilgee";

export interface TuslamjAlkham {
  zurgiinId?: string;
  garchig?: string;
  tailbar?: string;
  garchigEN?: string;
  tailbarEN?: string;
  turul?: string;
  link?: string;
}

export interface Tuslamj {
  _id: string;
  garchig?: string;
  tailbar?: string;
  garchigEN?: string;
  tailbarEN?: string;
  system?: string;
  zurgiinId?: string;
  turul?: string;
  daraalal?: number;
  alkhamuud?: TuslamjAlkham[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetches tuslamj (help/announcements) from admin API for the given system.
 * When admin adds tuslamj at https://admin.zevtabs.mn/api/tuslamj with system="sukh",
 * they will display here.
 */
export function useTuslamj(system: string = "sukh") {
  const [list, setList] = useState<Tuslamj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTuslamj() {
      try {
        setLoading(true);
        setError(null);
        const res = await adminUilchilgee().get(
          `/tuslamjAvya/${encodeURIComponent(system)}`
        );
        const data = res.data;
        if (!cancelled && Array.isArray(data)) {
          // Sort by daraalal if present
          const sorted = [...data].sort(
            (a: Tuslamj, b: Tuslamj) =>
              (a.daraalal ?? 999) - (b.daraalal ?? 999)
          );
          setList(sorted);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg =
            e?.response?.data?.aldaa ||
            e?.response?.data?.message ||
            e?.message ||
            "Алдаа гарлаа";
          setError(String(msg));
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTuslamj();
    return () => {
      cancelled = true;
    };
  }, [system]);

  return { list, loading, error };
}
