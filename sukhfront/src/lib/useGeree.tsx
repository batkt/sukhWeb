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
  ovog?: string;
  register?: string;
  turul?: "Үндсэн" | "Түр";
  davkhar: string;
  toot: number;
  gereeniiDugaar: string;
  gereeniiOgnoo?: string;
  ekhlekhOgnoo?: string;
  duusakhOgnoo?: string;
  tulukhOgnoo?: string;
  khugatsaa?: string;
  utas?: string[];
  email?: string;
  mail?: string;
  baiguullagiinId: string;
  barilgiinId: string;
  bairNer?: string;
  baingiinKhayag?: string;
  aimag?: string;
  duureg?: string;
  horoo?: string;
  orts?: string;
  niitTulbur?: number;
  suhTulbur?: number;
  suhTulburFormatted?: string;
  suhTulburUsgeer?: string;
  uilchilgeeniiZardal?: number;
  suhNer?: string;
  suhRegister?: string;
  suhUtas?: string[];
  suhMail?: string;
  temdeglel?: string;
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

  const { data, mutate, isValidating }: SWRResponse<GereeResponse, any> =
    useSWR(
      shouldFetch
        ? ["/geree", token, baiguullagiinId, khuudaslalt, query, barilgiinId]
        : null,
      fetcherJagsaalt,
      {
        revalidateOnFocus: false,
        onError: (err: any) => {},
        onSuccess: (data: any) => {},
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
        "/geree",
        {
          ...gereeData,
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: barilgiinId,
        }
      );

      if (response.status === 200 || response.data.success !== false) {
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
        `/geree/${id}`,
        {
          ...gereeData,
          _id: id,
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
        `/geree/${id}`,
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
