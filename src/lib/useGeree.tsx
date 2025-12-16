import { useState } from "react";
import useSWR, { SWRResponse } from "swr";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
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
  toot?: string | number;
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
    // Add search filters (support searching by apartment number "toot" as string)
    const search = khuudaslalt.search || "";
    queryObj.$or = [
      { ner: { $regex: search, $options: "i" } },
      { gereeniiDugaar: { $regex: search, $options: "i" } },
      { register: { $regex: search, $options: "i" } },
      { toot: { $regex: search, $options: "i" } },
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
    let data = response.data;
    let list = Array.isArray(data?.jagsaalt)
      ? data.jagsaalt
      : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.data?.jagsaalt)
      ? data.data.jagsaalt
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    // If empty, try non-stringified nested query as a fallback
    if (!list || list.length === 0) {
      const respAlt = await uilchilgee(token).get(url, {
        params: { ...paramsBase, query: queryObj },
      });
      data = respAlt.data;
      list = Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data?.list)
        ? data.list
        : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.data?.jagsaalt)
        ? data.data.jagsaalt
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
    }

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
        : Array.isArray(d2?.list)
        ? d2.list
        : Array.isArray(d2?.rows)
        ? d2.rows
        : Array.isArray(d2?.data?.jagsaalt)
        ? d2.data.jagsaalt
        : Array.isArray(d2?.data)
        ? d2.data
        : Array.isArray(d2)
        ? d2
        : [];
      // Client-side enforcement for org
      const toStr = (v: any) => (v == null ? "" : String(v));
      const filtered2 = l2.filter(
        (it: any) => toStr(it?.baiguullagiinId) === toStr(baiguullagiinId)
      );
      if (Array.isArray(d2?.jagsaalt)) {
        const serverTotal2 = Number((d2 as any)?.niitMur);
        const pageSizeNum2 = Number((d2 as any)?.khuudasniiKhemjee);
        return {
          ...d2,
          jagsaalt: filtered2,
          niitMur: isNaN(serverTotal2) ? filtered2.length : serverTotal2,
          niitKhuudas:
            !isNaN(serverTotal2) && pageSizeNum2
              ? Math.max(1, Math.ceil(serverTotal2 / pageSizeNum2))
              : (d2 as any)?.niitKhuudas ?? 1,
        } as GereeResponse;
      }
      return filtered2 as Geree[];
    }

    // Client-side enforcement for org/branch
    const toStr = (v: any) => (v == null ? "" : String(v));
    const filtered = list.filter((it: any) => {
      // Must match organization
      const orgOk = toStr(it?.baiguullagiinId) === toStr(baiguullagiinId);
      if (!orgOk) return false;

      // If no branch is selected, keep it
      if (!barilgiinId) return true;

      // Backend may return various field names or omit branch field entirely
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId
      );

      // If item has no explicit branch id, don't filter it out since server already scoped
      if (itemBid === "") return true;

      return itemBid === toStr(barilgiinId);
    });
    if (Array.isArray(data?.jagsaalt)) {
      const serverTotal = Number((data as any)?.niitMur);
      const pageSizeNum = Number((data as any)?.khuudasniiKhemjee);
      return {
        ...data,
        jagsaalt: filtered,
        niitMur: isNaN(serverTotal) ? filtered.length : serverTotal,
        niitKhuudas:
          !isNaN(serverTotal) && pageSizeNum
            ? Math.max(1, Math.ceil(serverTotal / pageSizeNum))
            : (data as any)?.niitKhuudas ?? 1,
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

      if (response.status === 200 || response.data.success !== false) {
        // toast.success(response.data.message || "Гэрээ амжилттай засагдлаа");
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
