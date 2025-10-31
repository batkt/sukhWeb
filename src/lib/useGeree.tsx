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
    // Build unified query object
    const queryObj: any = {
      ...query,
    };
    // Ensure org/branch also exist in nested query (some backends read only nested query)
    if (baiguullagiinId != null && baiguullagiinId !== "") {
      queryObj.baiguullagiinId = baiguullagiinId;
    }
    if (barilgiinId != null && barilgiinId !== "") {
      queryObj.barilgiinId = barilgiinId;
    }
    // Add search filters
    const search = khuudaslalt.search || "";
    queryObj.$or = [
      { ner: { $regex: search, $options: "i" } },
      { gereeniiDugaar: { $regex: search, $options: "i" } },
      { register: { $regex: search, $options: "i" } },
    ];

    const paramsBase: any = {
      baiguullagiinId,
      khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
      khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      query: JSON.stringify(queryObj),
    };
    if (barilgiinId) paramsBase.barilgiinId = barilgiinId;

    // Primary fetch (branch-scoped if barilgiinId exists)
    const response = await uilchilgee(token).get(url, { params: paramsBase });
    const data = response.data;
    const list = Array.isArray(data?.jagsaalt)
      ? data.jagsaalt
      : Array.isArray(data)
      ? data
      : [];

    // If branch-scoped query returns empty, try org-wide fallback
    if (barilgiinId && (!list || list.length === 0)) {
      const resp2 = await uilchilgee(token).get(url, {
        params: {
          ...paramsBase,
          barilgiinId: undefined,
          query: JSON.stringify({ ...queryObj, barilgiinId: undefined }),
        },
      });
      const d2 = resp2.data;
      const l2 = Array.isArray(d2?.jagsaalt)
        ? d2.jagsaalt
        : Array.isArray(d2)
        ? d2
        : [];
      // Client-side enforcement for org
      const toStr = (v: any) => (v == null ? "" : String(v));
      const filtered2 = l2.filter(
        (it: any) => toStr(it?.baiguullagiinId) === toStr(baiguullagiinId)
      );
      if (Array.isArray(d2?.jagsaalt)) {
        return {
          ...d2,
          jagsaalt: filtered2,
          niitMur: filtered2.length,
          niitKhuudas: d2?.khuudasniiKhemjee
            ? Math.max(
                1,
                Math.ceil(filtered2.length / Number(d2.khuudasniiKhemjee))
              )
            : d2?.niitKhuudas ?? 1,
        } as GereeResponse;
      }
      return filtered2 as Geree[];
    }

    // Client-side enforcement for org/branch
    const toStr = (v: any) => (v == null ? "" : String(v));
    const filtered = list.filter((it: any) => {
      const orgOk = toStr(it?.baiguullagiinId) === toStr(baiguullagiinId);
      if (!orgOk) return false;
      if (!barilgiinId) return true;
      return (
        it?.barilgiinId == null || toStr(it.barilgiinId) === toStr(barilgiinId)
      );
    });
    if (Array.isArray(data?.jagsaalt)) {
      return {
        ...data,
        jagsaalt: filtered,
        niitMur: filtered.length,
        niitKhuudas: data?.khuudasniiKhemjee
          ? Math.max(
              1,
              Math.ceil(filtered.length / Number(data.khuudasniiKhemjee))
            )
          : data?.niitKhuudas ?? 1,
      } as GereeResponse;
    }
    return filtered as Geree[];
  } catch (error: any) {
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
      const response = await uilchilgee(token).post<GereeResponse>("/geree", {
        ...gereeData,
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: barilgiinId,
      });

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
