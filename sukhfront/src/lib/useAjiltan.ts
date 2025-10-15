import { useState } from "react";
import axios, { aldaaBarigch } from "../../lib/uilchilgee";
import useSWR, { SWRResponse } from "swr";

// Interfaces
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

const fetcherJagsaalt = (
  url: string,
  token: string,
  baiguullagiinId: string | number,
  khuudaslalt: Khuudaslalt,
  query: Query,
  barilgiinId?: string | number,
  select?: any
): Promise<any> =>
  axios(token)
    .get(url, {
      params: {
        query: {
          baiguullagiinId,
          barilguud: barilgiinId,
          erkh: { $nin: ["Admin"] },
          $or: [
            { ner: { $regex: khuudaslalt.search || "", $options: "i" } },
            { register: { $regex: khuudaslalt.search || "", $options: "i" } },
            { utas: { $regex: khuudaslalt.search || "", $options: "i" } },
          ],
          ...query,
        },
        select,
        ...khuudaslalt,
      },
    })
    .then((res) => res.data)
    .catch(aldaaBarigch);

// Hook for fetching the employee list
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

  const { data, mutate, isValidating }: SWRResponse<any, any> = useSWR(
    !!token && !!baiguullagiinId
      ? ["/ajiltan", token, baiguullagiinId, khuudaslalt, query, barilgiinId]
      : null,
    fetcherJagsaalt,
    { revalidateOnFocus: false }
  );

  return {
    ajilchdiinGaralt: data,
    ajiltniiJagsaaltMutate: mutate,
    setAjiltniiKhuudaslalt,
    isValidating,
  };
}

// Fetcher for single employee by token
const fetcher = (url: string, token: string) =>
  axios(token)
    .post(url)
    .then((res) => res.data)
    .catch(aldaaBarigch);

// Hook for fetching employee by token
function useAjiltan(token: string) {
  const { data, error, mutate }: SWRResponse<Ajiltan, any> = useSWR(
    !!token ? [`/tokenoorAjiltanAvya`, token] : null,
    fetcher
  );

  return { ajiltan: data, error, isLoading: !data, ajiltanMutate: mutate };
}

export default useAjiltan;
