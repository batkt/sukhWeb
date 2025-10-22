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

export function useAshiglaltiinZardluud(): UseAshiglaltiinZardluudReturn {
  const { token, ajiltan } = useAuth();
  const [pageSize] = useState(100);

  const shouldFetch = !!token && !!ajiltan?.baiguullagiinId;

  const { data, error, mutate } = useSWR(
    shouldFetch
      ? [`/ashiglaltiinZardluud`, token, ajiltan.baiguullagiinId]
      : null,
    async ([url, token, baiguullagiinId]) => {
      const response = await uilchilgee(token).get(url, {
        params: {
          baiguullagiinId,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: pageSize,
        },
      });
      return response.data?.jagsaalt || [];
    }
  );

  const addZardal = async (zardalData: Partial<ZardalItem>) => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    await uilchilgee(token).post("/ashiglaltiinZardluud", {
      ...zardalData,
      baiguullagiinId: ajiltan.baiguullagiinId,
      barilgiinId: ajiltan.barilguud?.[0] || "",
    });

    mutate();
  };

  const updateZardal = async (id: string, zardalData: Partial<ZardalItem>) => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    await uilchilgee(token).put(`/ashiglaltiinZardluud/${id}`, {
      ...zardalData,
      baiguullagiinId: ajiltan.baiguullagiinId,
      barilgiinId: ajiltan.barilguud?.[0] || "",
    });

    mutate();
  };

  const deleteZardal = async (id: string) => {
    if (!token || !ajiltan?.baiguullagiinId) return;

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
