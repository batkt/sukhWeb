import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "../../lib/uilchilgee";

interface ZardalItem {
  _id: string;
  ner: string;
  turul: string;
  tariff: number;
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
  baiguullagiinId?: string;
  barilgiinId?: string;
  zardliinTurul?: string; // e.g., "Лифт"
  bodokhArga?: string; // e.g., "тогтмол"
  tariffUsgeer?: string; // e.g., "₮"
  nuatNemekhEsekh?: boolean; // API expects this
}

interface UseAshiglaltiinZardluudReturn {
  zardluud: ZardalItem[];
  isLoading: boolean;
  error: any;
  mutate: () => Promise<any>;
  addZardal: (data: Partial<ZardalItem>) => Promise<void>;
  updateZardal: (id: string, data: Partial<ZardalItem>) => Promise<void>;
  deleteZardal: (id: string) => Promise<void>;
}

export function useAshiglaltiinZardluud(overrides?: {
  token?: string;
  baiguullagiinId?: string | number;
  barilgiinId?: string | number | null;
}): UseAshiglaltiinZardluudReturn {
  const auth = useAuth();
  const token = overrides?.token ?? auth.token;
  const currentOrg =
    overrides?.baiguullagiinId ?? auth.ajiltan?.baiguullagiinId;
  const currentBarilga =
    overrides?.barilgiinId ?? auth.barilgiinId ?? undefined;
  const [pageSize] = useState(100);

  const shouldFetch = !!token && !!currentOrg;

  const { data, error, mutate } = useSWR(
    shouldFetch
      ? ["/api/ashiglaltiinZardluud", token, currentOrg, currentBarilga]
      : null,
    async ([url, token, baiguullagiinId, barilgiinId]) => {
      const response = await uilchilgee(token).get(url, {
        params: {
          baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: pageSize,
        },
      });
      const list: ZardalItem[] = response.data?.jagsaalt || [];
      if (!Array.isArray(list) || list.length === 0) return [] as ZardalItem[];

      // Prefer branch-specific entries; fallback to org-level (no barilgiinId)
      const keyOf = (it: any) =>
        `${String(it.zardliinTurul || "").trim()}::${String(
          it.ner || ""
        ).trim()}`;
      const groups = new Map<string, ZardalItem[]>();
      for (const it of list) {
        const k = keyOf(it);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(it);
      }
      const pickLatest = (arr: ZardalItem[]) =>
        [...arr].sort(
          (a: any, b: any) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
            new Date(a?.updatedAt || a?.createdAt || 0).getTime()
        )[0];

      const chosen: ZardalItem[] = [];
      const barilgaStr = barilgiinId ? String(barilgiinId) : "";
      for (const [, arr] of groups) {
        const branchMatches = barilgaStr
          ? arr.filter((x) => String(x?.barilgiinId || "") === barilgaStr)
          : [];
        if (branchMatches.length > 0) {
          chosen.push(pickLatest(branchMatches));
          continue;
        }
        const orgDefaults = arr.filter(
          (x) => x?.barilgiinId == null || String(x.barilgiinId) === ""
        );
        if (orgDefaults.length > 0) {
          chosen.push(pickLatest(orgDefaults));
        } else {
          chosen.push(pickLatest(arr));
        }
      }

      return chosen;
    }
  );

  const addZardal = async (
    zardalData: Partial<ZardalItem> & { lift?: string | null }
  ) => {
    if (!token || !currentOrg) return;

    await uilchilgee(token).post("/ashiglaltiinZardluud", {
      ner: zardalData.ner ?? "Лифт",
      turul: zardalData.turul ?? "лифт",
      zardliinTurul:
        zardalData.zardliinTurul ??
        ((zardalData as any).lift === "Лифт" ? "Лифт" : "Энгийн"),
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariff: zardalData.tariff ?? 50000,
      tariffUsgeer: zardalData.tariffUsgeer ?? "₮",
      suuriKhuraamj: zardalData.suuriKhuraamj ?? 0,
      nuatNemekhEsekh:
        zardalData.nuatNemekhEsekh ??
        (typeof zardalData.nuatBodokhEsekh === "boolean"
          ? zardalData.nuatBodokhEsekh
          : false),
      baiguullagiinId: String(currentOrg),
      ...(currentBarilga ? { barilgiinId: String(currentBarilga) } : {}),
    });

    mutate();
  };

  const updateZardal = async (
    id: string,
    zardalData: Partial<ZardalItem> & { lift?: string | null }
  ) => {
    if (!token || !currentOrg) return;

    await uilchilgee(token).put(`/ashiglaltiinZardluud/${id}`, {
      ...zardalData,
      zardliinTurul:
        zardalData.zardliinTurul ??
        ((zardalData as any).lift === "Лифт" ? "Лифт" : "Энгийн"),
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariffUsgeer: zardalData.tariffUsgeer ?? "₮",
      nuatNemekhEsekh:
        zardalData.nuatNemekhEsekh ??
        (typeof zardalData.nuatBodokhEsekh === "boolean"
          ? zardalData.nuatBodokhEsekh
          : undefined),
      baiguullagiinId: String(currentOrg),
      ...(currentBarilga ? { barilgiinId: String(currentBarilga) } : {}),
    });

    mutate();
  };

  const deleteZardal = async (id: string) => {
    if (!token || !currentOrg) return;

    await uilchilgee(token).delete(`/ashiglaltiinZardluud/${id}`);
    mutate();
  };

  return {
    zardluud: data || [],
    isLoading: !error && !data,
    error,
    mutate,
    addZardal,
    updateZardal,
    deleteZardal,
  };
}
