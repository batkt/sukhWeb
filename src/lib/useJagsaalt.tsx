import useSWR from "swr";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import { AxiosError } from "axios";

interface SearchQuery {
  [key: string]: any;
  $or?: any[];
}

interface KhuudaslaltState<T> {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  search: string;
  jagsaalt: T[];
}

interface FetcherResponse<T> {
  jagsaalt: T[];
  niitKhuudas: number;
  niitToo: number;
}

function searchGenerator(keys: string[], search: string) {
  if (keys.length > 0 && search) {
    return keys.map((key) => ({ [key]: { $regex: search, $options: "i" } }));
  }
  return undefined;
}

async function fetcher<T>(
  token: string,
  url: string,
  query: SearchQuery,
  order: any,
  select: any,
  { search = "", jagsaalt, ...khuudaslalt }: KhuudaslaltState<T>,
  searchKeys: string[] = []
): Promise<FetcherResponse<T>> {
  try {
    const response = await uilchilgee(token).get(url, {
      params: {
        query: {
          ...query,
          $or: searchGenerator(searchKeys, search),
        },
        order,
        select,
        ...khuudaslalt,
      },
    });
    return response.data;
  } catch (error) {
    aldaaBarigch(error as AxiosError<{ aldaa?: string }>);
    throw error;
  }
}

let timeout: NodeJS.Timeout | null = null;

interface UseJagsaaltReturn<T> {
  data: FetcherResponse<T> | undefined;
  mutate: () => void;
  jagsaalt: T[];
  next: () => void;
  refresh: () => void;
  onSearch: (search: string) => void;
  isValidating: boolean;
  setKhuudaslalt: React.Dispatch<React.SetStateAction<KhuudaslaltState<T>>>;
  khuudaslalt: KhuudaslaltState<T>;
}

function useJagsaalt<T = any>(
  url: string,
  query?: SearchQuery,
  order?: any,
  select?: any,
  searchKeys: string[] = [],
  supToken?: string,
  khuudasniiKhemjee: number = 100
): UseJagsaaltReturn<T> {
  const { token: contextToken } = useAuth();
  const token = supToken || contextToken;

  const [khuudaslalt, setKhuudaslalt] = useState<KhuudaslaltState<T>>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: khuudasniiKhemjee > 0 ? khuudasniiKhemjee : 100,
    search: "",
    jagsaalt: [],
  });

  const { data, mutate, isValidating } = useSWR<FetcherResponse<T>>(
    token && url
      ? [token, url, query, order, select, khuudaslalt, searchKeys]
      : null,
    ([tkn, url, query, order, select, khuudaslalt, searchKeys]: [
      string,
      string,
      SearchQuery | undefined,
      any,
      any,
      KhuudaslaltState<T>,
      string[]
    ]) =>
      fetcher<T>(tkn, url, query || {}, order, select, khuudaslalt, searchKeys),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  function next() {
    if (data && khuudaslalt.khuudasniiDugaar < data.niitKhuudas) {
      setKhuudaslalt((prev) => ({
        ...prev,
        jagsaalt: [...prev.jagsaalt, ...(data.jagsaalt || [])],
        khuudasniiDugaar: prev.khuudasniiDugaar + 1,
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

  function onSearch(search: string) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      setKhuudaslalt((prev) => ({
        ...prev,
        search,
        jagsaalt: [],
        khuudasniiDugaar: 1,
      }));
    }, 300);
  }

  const jagsaalt = useMemo(() => {
    return data?.jagsaalt || [];
  }, [data]);

  return {
    data,
    mutate,
    jagsaalt,
    next,
    refresh,
    onSearch,
    isValidating,
    setKhuudaslalt,
    khuudaslalt,
  };
}

export default useJagsaalt;
