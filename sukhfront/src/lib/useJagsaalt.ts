import useSWR from "swr";
import { useMemo, useState } from "react";
import uilchilgee from "../../lib/uilchilgee";
import { aldaaBarigch } from "../../components/aldaaBarigch";
import { parseCookies } from "nookies";

function searchGenerator(keys: any, search: any) {
  if (keys.length > 0)
    return keys.map((key: any) => ({
      [key]: { $regex: search, $options: "i" },
    }));
  return undefined;
}

const fetcher = async (
  token: any,
  url: any,
  query: any,
  order: any,
  select: any,
  options: any,
  searchKeys = []
) => {
  try {
    const tukhainQuery = {
      $or: searchGenerator(searchKeys, options.search),
      ...query,
    };
    const requery = JSON.stringify(tukhainQuery);
    const response = await uilchilgee(token).get(url, {
      params: {
        query: requery,
        order: JSON.stringify(order),
        select,
        ...options,
      },
    });
    return response.data;
  } catch (error) {
    aldaaBarigch(error);
    throw error;
  }
};

let timeout: any = null;

function useJagsaaltGeree(
  url: any,
  query: any,
  order?: any,
  select?: any,
  searchKeys?: any,
  supToken?: any,
  khuudasniiKhemjee?: any
) {
  const cookieData = parseCookies();
  const token = cookieData.tureestoken;
  const [khuudaslalt, setKhuudaslalt] = useState({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: khuudasniiKhemjee || 500,
    search: "",
    jagsaalt: [],
  });

  const { data, mutate, isValidating } = useSWR(
    (token || supToken) && url && query !== "jagsaaltAvahgui"
      ? [token || supToken, url, query, order, select, khuudaslalt, searchKeys]
      : null,
    ([token, url, query, order, select, options, searchKeys]) =>
      fetcher(token, url, query, order, select, options, searchKeys),
    {
      revalidateOnFocus: false,
    }
  );

  function next() {
    if (data && khuudaslalt?.khuudasniiDugaar < data?.niitKhuudas) {
      setKhuudaslalt((prev: any) => ({
        ...prev,
        jagsaalt: [...prev.jagsaalt, ...(data?.jagsaalt || [])],
        khuudasniiDugaar: prev.khuudasniiDugaar + 1,
      }));
    }
  }
  function prev() {
    if (data && khuudaslalt?.khuudasniiDugaar > 0) {
      setKhuudaslalt((prev: any) => ({
        ...prev,
        jagsaalt: [...prev.jagsaalt, ...(data?.jagsaalt || [])],
        khuudasniiDugaar: prev.khuudasniiDugaar - 1,
      }));
    }
  }

  function refresh() {
    setKhuudaslalt((prev) => ({
      ...prev,
      jagsaalt: [],
      khuudasniiDugaar: 1,
    }));
    mutate();
  }

  function onSearch(search: any) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setKhuudaslalt((prev) => ({
        ...prev,
        search,
        jagsaalt: [],
        khuudasniiDugaar: 1,
      }));
    }, 300);
  }

  const jagsaalt = useMemo(
    () => [...(khuudaslalt?.jagsaalt || []), ...(data?.jagsaalt || [])],
    [khuudaslalt, data]
  );

  return {
    data,
    mutate,
    jagsaalt,
    next,
    prev,
    refresh,
    onSearch,
    isValidating,
    setKhuudaslalt,
    khuudaslalt,
  };
}

export default useJagsaaltGeree;
