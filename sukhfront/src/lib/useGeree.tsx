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

export interface Geree {
  _id?: string;
  ner: string;
  gereeTurul: "Үндсэн гэрээ" | "Түр гэрээ";
  davkhar: string;
  toot: string;
  startDate: string;
  gereeniiDugaar: string;
  utas?: string;
  email?: string;
  baiguullagiinId: string;
  barilgiinId: string;
  register?: string;
  status?: string;
  [key: string]: any;
}

interface GereeResponse {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  jagsaalt: Geree[];
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
]): Promise<any> => {
  try {
    const response = await uilchilgee(token).get(url, {
      params: {
        baiguullagiinId,
        query: {
          baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
          $or: [
            { ner: { $regex: khuudaslalt.search || "", $options: "i" } },
            {
              gereeniiDugaar: {
                $regex: khuudaslalt.search || "",
                $options: "i",
              },
            },
            { register: { $regex: khuudaslalt.search || "", $options: "i" } },
          ],
          ...query,
        },
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    console.log("Geree API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Geree API Error:", error);
    aldaaBarigch(error);
    throw error;
  }
};

export function useGereeJagsaalt(
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

  const [khuudaslalt, setGereeKhuudaslalt] = useState<Khuudaslalt>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 100,
    search: "",
  });

  const shouldFetch = !!token && !!baiguullagiinId && baiguullagiinId !== "";

  console.log("useGereeJagsaalt - Should Fetch:", {
    shouldFetch,
    token: !!token,
    baiguullagiinId,
    barilgiinId,
    khuudaslalt,
  });

  const { data, mutate, isValidating }: SWRResponse<GereeResponse, any> =
    useSWR(
      shouldFetch
        ? ["/geree", token, baiguullagiinId, khuudaslalt, query, barilgiinId]
        : null,
      fetcherJagsaalt,
      {
        revalidateOnFocus: false,
        onError: (err: any) => {
          console.error("SWR Error:", err);
        },
        onSuccess: (data: any) => {
          console.log("SWR Success:", data);
        },
      }
    );

  return {
    gereeGaralt: data,
    gereeJagsaaltMutate: mutate,
    setGereeKhuudaslalt,
    isValidating,
  };
}

export function useGereeCRUD() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const gereeUusgekh = async (gereeData: Partial<Geree>): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId || !barilgiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).post<GereeResponse>(
        "/gereeUusgey",
        {
          ...gereeData,
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: barilgiinId,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Гэрээ амжилттай үүсгэгдлээ");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const gereeZasakh = async (
    id: string,
    gereeData: Partial<Geree>
  ): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId || !barilgiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).put<GereeResponse>(
        `/gereeZasya/${id}`,
        {
          ...gereeData,
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: barilgiinId,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Гэрээ амжилттай засагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const gereeUstgakh = async (id: string): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).delete<GereeResponse>(
        `/gereeUstgaya/${id}`,
        {
          data: {
            baiguullagiinId: ajiltan.baiguullagiinId,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Гэрээ амжилттай устгагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  return {
    gereeUusgekh,
    gereeZasakh,
    gereeUstgakh,
  };
}

export default useGereeJagsaalt;
