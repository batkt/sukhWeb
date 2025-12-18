import { useState } from "react";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import useSWR, { SWRResponse } from "swr";

interface Khuudaslalt {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  search?: string;
  [key: string]: any;
}

interface Query {
  [key: string]: any;
}

interface OrshinSuugch {
  _id?: string;
  id?: number;
  ner: string;
  davkhar: string;
  ovog: string;
  register?: string;
  utas?: string;
  soh?: string;
  email?: string;
  turul?: string;
  khayag?: string;
  nevtrekhNer?: string;
  tuluv?: string;
  toot?: string | number;
  baiguullagiinId?: string;
  tsahilgaaniiZaalt?: string | number;
  [key: string]: any;
}

const fetcherJagsaalt = async ([
  url,
  token,
  baiguullagiinId,
  barilgiinId,
  khuudaslalt,
  query,
]: [
  string,
  string,
  string | number,
  string | number | null | undefined,
  Khuudaslalt,
  Query
]): Promise<any> => {
  try {
    // Build the query object for residents (mirror employee/contract list behavior)
    const queryObj: any = {
      ...query,
    };
    // Ensure org/branch also exist in query for servers filtering by nested query only
    if (baiguullagiinId != null && baiguullagiinId !== "") {
      queryObj.baiguullagiinId = baiguullagiinId;
    }
    if (barilgiinId != null && barilgiinId !== "") {
      queryObj.barilgiinId = barilgiinId;
    }

    // Add search filters (resident fields)
    if (khuudaslalt.search && khuudaslalt.search.trim() !== "") {
      queryObj.$or = [
        { ovog: { $regex: khuudaslalt.search, $options: "i" } },
        { ner: { $regex: khuudaslalt.search, $options: "i" } },
        { register: { $regex: khuudaslalt.search, $options: "i" } },
        { utas: { $regex: khuudaslalt.search, $options: "i" } },
        { toot: { $regex: khuudaslalt.search, $options: "i" } },
        { khayag: { $regex: khuudaslalt.search, $options: "i" } },
      ];
    }

    // Prefer sending org/branch as top-level params (consistent with other endpoints)
    const paramsBase: any = {
      baiguullagiinId,
      khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
      khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      // Stringify query for backends expecting JSON in params
      query: JSON.stringify(queryObj),
    };

    if (barilgiinId) paramsBase.barilgiinId = barilgiinId;

    // Helper to normalize server responses to an object shape
    const normalize = (d: any, fallbackPageSize?: number) => {
      const lst = Array.isArray(d?.jagsaalt)
        ? d.jagsaalt
        : Array.isArray(d?.list)
        ? d.list
        : Array.isArray(d?.rows)
        ? d.rows
        : Array.isArray(d?.data?.jagsaalt)
        ? d.data.jagsaalt
        : Array.isArray(d?.data)
        ? d.data
        : Array.isArray(d)
        ? d
        : [];
      const pageSize = Number(
        d?.khuudasniiKhemjee ||
          fallbackPageSize ||
          khuudaslalt.khuudasniiKhemjee
      );
      return {
        khuudasniiDugaar: Number(
          d?.khuudasniiDugaar || khuudaslalt.khuudasniiDugaar || 1
        ),
        khuudasniiKhemjee: pageSize,
        jagsaalt: lst,
        niitMur: Number(d?.niitMur ?? lst.length),
        niitKhuudas:
          d?.niitKhuudas != null
            ? Number(d.niitKhuudas)
            : pageSize
            ? Math.max(0, Math.ceil(lst.length / pageSize))
            : 0,
      };
    };

    // First try with stringified query
    let response = await uilchilgee(token).get(url, { params: paramsBase });
    let data = normalize(response.data);

    // If empty, retry with non-stringified nested query
    if (!data.jagsaalt || data.jagsaalt.length === 0) {
      const respAlt = await uilchilgee(token).get(url, {
        params: { ...paramsBase, query: queryObj },
      });
      data = normalize(respAlt.data, paramsBase.khuudasniiKhemjee);
    }

    // Client-side enforcement for org/branch (strict when branch is selected)
    const toStr = (v: any) => (v == null ? "" : String(v));
    const list = data.jagsaalt || [];
    const orgOnly = (list || []).filter(
      (it: any) => toStr(it?.baiguullagiinId) === toStr(baiguullagiinId)
    );
    const branchAware = orgOnly.filter((it: any) => {
      if (!barilgiinId) return true;
      // Support alternate field names for building id
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId
      );
      return itemBid === toStr(barilgiinId);
    });
    const finalList = branchAware;
    const serverTotal = Number((data as any)?.niitMur);
    const pageSizeNum = Number((data as any)?.khuudasniiKhemjee);
    return {
      ...data,
      jagsaalt: finalList,
      niitMur: isNaN(serverTotal) ? finalList.length : serverTotal,
      niitKhuudas:
        !isNaN(serverTotal) && pageSizeNum
          ? Math.max(0, Math.ceil(serverTotal / pageSizeNum))
          : (data as any)?.niitKhuudas ?? 0,
    };
  } catch (error: any) {
    aldaaBarigch(error);
    throw error;
  }
};

export function useOrshinSuugchJagsaalt(
  token: string,
  baiguullagiinId: string | number,
  query: Query = {},
  barilgiinId?: string | number | null
) {
  const [khuudaslalt, setOrshinSuugchKhuudaslalt] = useState<Khuudaslalt>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 100,
    search: "",
  });

  const shouldFetch =
    !!token &&
    !!baiguullagiinId &&
    baiguullagiinId !== "" &&
    baiguullagiinId !== "undefined" &&
    baiguullagiinId !== "null";

  const { data, mutate, isValidating, error }: SWRResponse<any, any> = useSWR(
    shouldFetch
      ? [
          "/orshinSuugch",
          token,
          baiguullagiinId,
          barilgiinId,
          khuudaslalt,
          query,
        ]
      : null,
    fetcherJagsaalt,
    {
      revalidateOnFocus: false,
      onError: (err: any) => {},
      onSuccess: (data: any) => {},
    }
  );

  return {
    orshinSuugchGaralt: data,
    orshinSuugchJagsaaltMutate: mutate,
    setOrshinSuugchKhuudaslalt,
    isValidating,
    error,
  };
}

export default useOrshinSuugchJagsaalt;
