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

interface OrshinSuugch {
  _id?: string;
  id?: number;
  ner: string;
  ovog: string;
  register?: string;
  utas?: string;
  email?: string;
  khayag?: string;
  nevtrekhNer?: string;
  tuluv?: string;
  baiguullagiinId?: string;
  [key: string]: any;
}

const fetcherJagsaalt = async ([
  url,
  token,
  baiguullagiinId,
  khuudaslalt,
  query,
]: [string, string, string | number, Khuudaslalt, Query]): Promise<any> => {
  try {
    const response = await uilchilgee(token).get(url, {
      params: {
        query: {
          baiguullagiinId,
          $or: [
            { ner: { $regex: khuudaslalt.search || "", $options: "i" } },
            { ovog: { $regex: khuudaslalt.search || "", $options: "i" } },
            { register: { $regex: khuudaslalt.search || "", $options: "i" } },
            { utas: { $regex: khuudaslalt.search || "", $options: "i" } },
            { email: { $regex: khuudaslalt.search || "", $options: "i" } },
          ],
          ...query,
        },
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    console.log("OrshinSuugch API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("OrshinSuugch API Error:", error);
    aldaaBarigch(error);
    throw error;
  }
};

export function useOrshinSuugchJagsaalt(
  token: string,
  baiguullagiinId: string | number,
  query: Query = {}
) {
  const [khuudaslalt, setOrshinSuugchKhuudaslalt] = useState<Khuudaslalt>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 100,
    search: "",
  });

  const shouldFetch = !!token && !!baiguullagiinId && baiguullagiinId !== "";

  console.log("useOrshinSuugchJagsaalt - Should Fetch:", {
    shouldFetch,
    token: !!token,
    baiguullagiinId,
    khuudaslalt,
  });

  const { data, mutate, isValidating, error }: SWRResponse<any, any> = useSWR(
    shouldFetch
      ? ["/orshinSuugch", token, baiguullagiinId, khuudaslalt, query]
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
    orshinSuugchGaralt: data,
    orshinSuugchJagsaaltMutate: mutate,
    setOrshinSuugchKhuudaslalt,
    isValidating,
    error,
  };
}

export default useOrshinSuugchJagsaalt;
