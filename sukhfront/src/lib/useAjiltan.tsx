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
    const response = await uilchilgee(token).get(url, {
      params: {
        query: {
          baiguullagiinId,
          ...(barilgiinId ? { barilguud: barilgiinId } : {}),
          erkh: { $nin: ["Admin"] },
          $or: [
            { ner: { $regex: khuudaslalt.search || "", $options: "i" } },
            { register: { $regex: khuudaslalt.search || "", $options: "i" } },
            { utas: { $regex: khuudaslalt.search || "", $options: "i" } },
          ],
          ...query,
        },
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    console.log("Ajiltan API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Ajiltan API Error:", error);
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

  const shouldFetch = !!token && !!baiguullagiinId && baiguullagiinId !== "";

  console.log("useAjiltniiJagsaalt - Should Fetch:", {
    shouldFetch,
    token: !!token,
    baiguullagiinId,
    khuudaslalt,
  });

  const { data, mutate, isValidating, error }: SWRResponse<any, any> = useSWR(
    shouldFetch
      ? ["/ajiltan", token, baiguullagiinId, khuudaslalt, query, barilgiinId]
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
