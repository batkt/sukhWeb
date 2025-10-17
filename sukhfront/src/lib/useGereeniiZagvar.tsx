import { useState } from "react";
import useSWR, { SWRResponse } from "swr";
import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";

interface Khuudaslalt {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  search?: string;
  [key: string]: any;
}

interface Query {
  [key: string]: any;
}

export interface GereeZagvar {
  _id?: string;
  ner: string;
  tailbar?: string;
  aguulga: string;
  turul?: string;
  baiguullagiinId: string;
  barilgiinId?: string;
  uusgesenOgnoo?: string;
  zasvarlasanOgnoo?: string;
  status?: string;
  [key: string]: any;
}

interface GereeZagvarResponse {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  jagsaalt: GereeZagvar[];
  niitMur: number;
  niitKhuudas: number;
  success?: boolean;
  message?: string;
}

const fetcherJagsaalt = async ([
  url,
  token,
  baiguullagiinId,
  khuudaslalt,
  query,
  barilgiinId,
]: [
  string,
  string,
  string,
  Khuudaslalt,
  Query,
  string | undefined
]): Promise<GereeZagvarResponse> => {
  try {
    const response = await uilchilgee(token).get(url, {
      params: {
        baiguullagiinId,
        query: {
          baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
          $or: [
            { ner: { $regex: khuudaslalt.search || "", $options: "i" } },
            { tailbar: { $regex: khuudaslalt.search || "", $options: "i" } },
          ],
          ...query,
        },
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("GereeZagvar API Error:", error);
    aldaaBarigch(error);
    throw error;
  }
};

export function useGereeniiZagvar(
  query: Query = {},
  supToken?: string,
  supBaiguullagiinId?: string,
  supBarilgiinId?: string
) {
  const {
    token: contextToken,
    ajiltan,
    barilgiinId: contextBarilgiinId,
  } = useAuth();
  const token = supToken || contextToken;
  const baiguullagiinId = supBaiguullagiinId || ajiltan?.baiguullagiinId;
  const barilgiinId = supBarilgiinId || contextBarilgiinId;

  const [khuudaslalt, setZagvarKhuudaslalt] = useState<Khuudaslalt>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 100,
    search: "",
  });

  const shouldFetch = !!token && !!baiguullagiinId && baiguullagiinId !== "";

  const { data, mutate, isValidating }: SWRResponse<GereeZagvarResponse, any> =
    useSWR(
      shouldFetch
        ? [
            "/gereeniiZagvar",
            token,
            baiguullagiinId,
            khuudaslalt,
            query,
            barilgiinId,
          ]
        : null,
      fetcherJagsaalt,
      {
        revalidateOnFocus: false,
        onError: (err: any) => {
          console.error("SWR Error:", err);
        },
      }
    );

  return {
    zagvaruud: data?.jagsaalt || [],
    zagvarJagsaaltMutate: mutate,
    setZagvarKhuudaslalt,
    isValidating,
  };
}

export function useGereeZagvarCRUD() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const zagvarUusgekh = async (
    zagvarData: Partial<GereeZagvar>
  ): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).post<GereeZagvarResponse>(
        "/gereeniiZagvar",
        {
          ...zagvarData,
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: barilgiinId || undefined,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Загвар амжилттай үүсгэгдлээ");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const zagvarZasakh = async (
    id: string,
    zagvarData: Partial<GereeZagvar>
  ): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).put<GereeZagvarResponse>(
        `/gereeniiZagvar/${id}`,
        {
          ...zagvarData,
          baiguullagiinId: ajiltan.baiguullagiinId,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Загвар амжилттай засагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const zagvarUstgakh = async (id: string): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).delete<GereeZagvarResponse>(
        `/gereeniiZagvar/${id}`,
        {
          data: {
            baiguullagiinId: ajiltan.baiguullagiinId,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Загвар амжилттай устгагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  return {
    zagvarUusgekh,
    zagvarZasakh,
    zagvarUstgakh,
  };
}

export default useGereeniiZagvar;
