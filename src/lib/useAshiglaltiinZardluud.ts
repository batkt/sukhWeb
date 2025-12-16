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
  tariffUsgeer?: string; // e.g., "₮"
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
      ? [`/baiguullaga/${currentOrg}`, token, currentBarilga]
      : null,
    async ([url, token, barilgaId]) => {
      const response = await uilchilgee(token).get(url);
      const org = response.data;
      const barilga = org.barilguud?.find((b: any) => b._id === barilgaId);
      if (!barilga) return [] as ZardalItem[];
      return barilga.tokhirgoo?.ashiglaltiinZardluud || [];
    },
    {
      dedupingInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
    }
  );

  const addZardal = async (
    zardalData: Partial<ZardalItem>
  ) => {
    if (!token || !currentOrg || !currentBarilga) return;

    const orgResp = await uilchilgee(token).get(`/baiguullaga/${currentOrg}`);
    const org = orgResp.data;
    const barilga = org.barilguud?.find((b: any) => b._id === currentBarilga);
    if (!barilga) throw new Error("Building not found");

    if (!barilga.tokhirgoo) barilga.tokhirgoo = {};
    if (!barilga.tokhirgoo.ashiglaltiinZardluud)
      barilga.tokhirgoo.ashiglaltiinZardluud = [];

    const newItem: ZardalItem = {
      ner: zardalData.ner ?? "Лифт",
      turul: zardalData.turul ?? "лифт",
      zardliinTurul: zardalData.zardliinTurul ?? "Энгийн",
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariff: zardalData.tariff ?? 50000,
      tariffUsgeer: zardalData.tariffUsgeer ?? "₮",
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
    };

    barilga.tokhirgoo.ashiglaltiinZardluud.push(newItem);

    await updateMethod("baiguullaga", token, org);
    mutate();
  };

  const updateZardal = async (
    id: string,
    zardalData: Partial<ZardalItem>
  ) => {
    if (!token || !currentOrg || !currentBarilga) return;

    const orgResp = await uilchilgee(token).get(`/baiguullaga/${currentOrg}`);
    const org = orgResp.data;
    const barilga = org.barilguud?.find((b: any) => b._id === currentBarilga);
    if (!barilga) throw new Error("Building not found");

    if (!barilga.tokhirgoo?.ashiglaltiinZardluud) return;

    const index = barilga.tokhirgoo.ashiglaltiinZardluud.findIndex(
      (item: any) => item._id === id
    );
    if (index === -1) return;

    barilga.tokhirgoo.ashiglaltiinZardluud[index] = {
      ...barilga.tokhirgoo.ashiglaltiinZardluud[index],
      ...zardalData,
      bodokhArga: zardalData.bodokhArga ?? "тогтмол",
      tariffUsgeer: zardalData.tariffUsgeer ?? "₮",
      nuatNemekhEsekh:
        zardalData.nuatNemekhEsekh ??
        (typeof zardalData.nuatBodokhEsekh === "boolean"
          ? zardalData.nuatBodokhEsekh
          : undefined),
    };

    await updateMethod("baiguullaga", token, org);
    mutate();
  };

  const deleteZardal = async (id: string) => {
    if (!token || !currentOrg || !currentBarilga) return;

    const orgResp = await uilchilgee(token).get(`/baiguullaga/${currentOrg}`);
    const org = orgResp.data;
    const barilga = org.barilguud?.find((b: any) => b._id === currentBarilga);
    if (!barilga) throw new Error("Building not found");

    if (!barilga.tokhirgoo?.ashiglaltiinZardluud) return;

    barilga.tokhirgoo.ashiglaltiinZardluud =
      barilga.tokhirgoo.ashiglaltiinZardluud.filter(
        (item: any) => item._id !== id
      );

    await updateMethod("baiguullaga", token, org);
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
