import { useState } from "react";
import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
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

interface Ajiltan {
  _id?: string;
  id?: number;
  ner: string;
  register?: string;
  utas?: string;
  [key: string]: any;
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
  string | number,
  Khuudaslalt,
  Query,
  string | number | undefined
]): Promise<any> => {
  try {
    // Build the query object (do not include org/branch in query)
    const queryObj: any = {
      erkh: { $nin: ["Admin"] },
      ...query,
    };
    // Ensure org/branch are also present inside query for backends
    // that only filter by the nested query object.
    if (baiguullagiinId != null && baiguullagiinId !== "") {
      queryObj.baiguullagiinId = baiguullagiinId;
    }
    if (barilgiinId != null && barilgiinId !== "") {
      queryObj.barilgiinId = barilgiinId;
    }

    // Add search filters
    if (khuudaslalt.search && khuudaslalt.search.trim() !== "") {
      queryObj.$or = [
        { ner: { $regex: khuudaslalt.search, $options: "i" } },
        { register: { $regex: khuudaslalt.search, $options: "i" } },
        { utas: { $regex: khuudaslalt.search, $options: "i" } },
      ];
    }

    const response = await uilchilgee(token).get(url, {
      params: {
        baiguullagiinId,
        ...(barilgiinId ? { barilgiinId } : {}),
        // Keep stringified query to preserve existing API behavior
        query: JSON.stringify(queryObj),
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    // Client-side guard: strictly enforce org/branch
    const raw = response.data || {};
    const list = Array.isArray(raw?.jagsaalt)
      ? raw.jagsaalt
      : Array.isArray(raw)
      ? raw
      : [];
    const toStr = (v: any) => (v == null ? "" : String(v));
    const filtered = list.filter((it: any) => {
      const orgOk = toStr(it?.baiguullagiinId) === toStr(baiguullagiinId);
      if (!orgOk) return false;
      if (!barilgiinId) return true;
      // Some records may not have barilgiinId; allow them only when no branch filter.
      return (
        it?.barilgiinId == null || toStr(it.barilgiinId) === toStr(barilgiinId)
      );
    });
    if (Array.isArray(raw?.jagsaalt)) {
      return {
        ...raw,
        jagsaalt: filtered,
        niitMur: filtered.length,
        // Estimate pages based on page size if present
        niitKhuudas: raw?.khuudasniiKhemjee
          ? Math.max(
              1,
              Math.ceil(filtered.length / Number(raw.khuudasniiKhemjee))
            )
          : raw?.niitKhuudas ?? 1,
      };
    }
    return filtered;
  } catch (error: any) {
    aldaaBarigch(error);
    throw error;
  }
};

export function useAjiltniiJagsaalt(
  token: string,
  baiguullagiinId: string | number,
  barilgiinId?: string | number,
  query: Query = {}
) {
  const [khuudaslalt, setAjiltniiKhuudaslalt] = useState<Khuudaslalt>({
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
      ? ["/ajiltan", token, baiguullagiinId, khuudaslalt, query, barilgiinId]
      : null,
    fetcherJagsaalt,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    ajilchdiinGaralt: data,
    ajiltniiJagsaaltMutate: mutate,
    setAjiltniiKhuudaslalt,
    isValidating,
    error,
  };
}

const fetcherToken = async ([url, token]: [
  string,
  string
]): Promise<Ajiltan> => {
  try {
    const response = await uilchilgee(token).post(url);
    return response.data;
  } catch (error: any) {
    aldaaBarigch(error);
    throw error;
  }
};

function useAjiltan(token: string) {
  const { data, error, mutate }: SWRResponse<Ajiltan, any> = useSWR(
    !!token ? [`/tokenoorAjiltanAvya`, token] : null,
    fetcherToken
  );

  return {
    ajiltan: data,
    error,
    isLoading: !data && !error,
    ajiltanMutate: mutate,
  };
}

export default useAjiltan;
