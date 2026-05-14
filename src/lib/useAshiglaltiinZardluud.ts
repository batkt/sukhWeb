import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import updateMethod from "../../tools/function/updateMethod";

interface ZardalItem {
  _id?: string;
  ner: string;
  turul: string;
  tariff: number;
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
  baiguullagiinId?: string;
  barilgiinId?: string;
  zardliinTurul?: string; // e.g., "Лифт"
  bodokhArga?: string; // e.g., "тогтмол"
  tariffUsgeer?: string; // e.g., ""
  nuatNemekhEsekh?: boolean; // API expects this
  tsakhilgaanUrjver?: number;
  tsakhilgaanChadal?: number;
  tsakhilgaanDemjikh?: number;
  togtmolUtga?: number;
  choloolugdsonDavkhar?: boolean;
  dun?: number;
  ognoonuud?: string[];
  tseverUsDun?: number;
  bokhirUsDun?: number;
  usKhalaasniiDun?: number;
  tailbar?: string;
  // Electricity meter-based fields
  zaalt?: boolean;
  zaaltTariff?: number;
  zaaltDefaultDun?: number;
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
    shouldFetch && currentBarilga
      ? ["/ashiglaltiinZardluud", token, currentBarilga]
      : null,
    async ([url, token, barilgaId]) => {
      const response = await uilchilgee(token).get(url, {
        params: { 
          query: JSON.stringify({ barilgiinId: barilgaId }),
          khuudasniiKhemjee: 50 
        },
      });
      return response.data?.jagsaalt || response.data || [];
    },
    {
      dedupingInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
    }
  );

  const addZardal = async (zardalData: Partial<ZardalItem>) => {
    if (!token || !currentOrg || !currentBarilga) return;

    const payload = {
      ...zardalData,
      baiguullagiinId: currentOrg,
      barilgiinId: currentBarilga,
      ner: zardalData.ner ?? "Лифт",
      turul: zardalData.turul ?? "лифт",
      zardliinTurul: zardalData.zardliinTurul ?? "Энгийн",
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariff: zardalData.tariff ?? 50000,
      tariffUsgeer: zardalData.tariffUsgeer ?? "",
      suuriKhuraamj: zardalData.suuriKhuraamj ?? 0,
      nuatNemekhEsekh:
        zardalData.nuatNemekhEsekh ??
        (typeof zardalData.nuatBodokhEsekh === "boolean"
          ? zardalData.nuatBodokhEsekh
          : false),
      tsakhilgaanUrjver: 1,
      tsakhilgaanChadal: 0,
      tsakhilgaanDemjikh: 0,
      togtmolUtga: 0,
      choloolugdsonDavkhar: false,
      dun: 0,
      ognoonuud: [],
      nuatBodokhEsekh: zardalData.nuatBodokhEsekh ?? false,
      tseverUsDun: 0,
      bokhirUsDun: 0,
      usKhalaasniiDun: 0,
      tailbar: zardalData.tailbar ?? "",
      zaalt: zardalData.zaalt ?? false,
      zaaltTariff: zardalData.zaaltTariff ?? 0,
      zaaltDefaultDun: zardalData.zaaltDefaultDun ?? 0,
    };

    await uilchilgee(token).post("/ashiglaltiinZardluud", payload);
    mutate();
  };

  const updateZardal = async (id: string, zardalData: Partial<ZardalItem>) => {
    if (!token || !currentOrg || !currentBarilga) return;

    const payload = {
      ...zardalData,
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariffUsgeer: zardalData.tariffUsgeer ?? "",
      nuatNemekhEsekh:
        zardalData.nuatNemekhEsekh ??
        (typeof zardalData.nuatBodokhEsekh === "boolean"
          ? zardalData.nuatBodokhEsekh
          : undefined),
    };

    await uilchilgee(token).put(`/ashiglaltiinZardluud/${id}`, payload);
    mutate();
  };

  const deleteZardal = async (id: string) => {
    if (!token || !currentOrg || !currentBarilga) return;
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
