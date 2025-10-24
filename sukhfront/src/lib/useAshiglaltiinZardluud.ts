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
  mutate: () => Promise<void>;
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
      ? ["/ashiglaltiinZardluud", token, currentOrg, currentBarilga]
      : null,
    async ([url, token, baiguullagiinId, barilgiinId]) => {
      const response = await uilchilgee(token).get(url, {
        params: {
          baiguullagiinId,
          barilgiinId,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: pageSize,
        },
      });
      return response.data?.jagsaalt || [];
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
      barilgiinId: auth.ajiltan?.barilguud?.[0] || "",
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
      barilgiinId: auth.ajiltan?.barilguud?.[0] || "",
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
