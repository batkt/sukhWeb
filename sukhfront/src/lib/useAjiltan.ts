import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
import { parseCookies } from "nookies";
import useSWR, { KeyedMutator } from "swr";
import { AxiosError } from "axios";

interface UserContext {
  ezenId?: string;
  baiguullagiinId?: string;
  barilgiinId?: string;
}

interface AjiltanData {
  jagsaalt?: any[];
  ezenJagsaalt?: any[];
  [key: string]: any;
}

const fetcher = async (
  url: string,
  token: string,
  userContext: UserContext
): Promise<AjiltanData> => {
  try {
    if (userContext && userContext.ezenId) {
      const response = await uilchilgee(token).post(url, {
        baiguullagiinId: userContext.baiguullagiinId,
        barilgiinId: userContext.barilgiinId,
        ezenId: userContext.ezenId,
        token,
      });

      const filteredData = filterJagsaaltByUser(
        response.data,
        userContext.ezenId
      );
      return filteredData;
    } else {
      const response = await uilchilgee(token).post(url);
      return response.data;
    }
  } catch (error) {
    aldaaBarigch(error as AxiosError<{ aldaa?: string }>);
    throw error;
  }
};

export function filterJagsaaltByUser(
  data: AjiltanData,
  userId: string
): AjiltanData {
  if (!data || !userId) return data;

  const filtered: AjiltanData = { ...data };

  if (data.jagsaalt && Array.isArray(data.jagsaalt)) {
    filtered.jagsaalt = data.jagsaalt.filter(
      (item: any) => item._id === userId
    );
  }

  if (data.ezenJagsaalt && Array.isArray(data.ezenJagsaalt)) {
    filtered.ezenJagsaalt = data.ezenJagsaalt.filter(
      (item: any) => item.ezemshigchiinId === userId
    );
  }

  return filtered;
}

interface UseAjiltanReturn {
  ajiltan: AjiltanData | null;
  error: any;
  isLoading: boolean;
  ajiltanMutate: KeyedMutator<AjiltanData>;
  userContext: UserContext;
  hasToken: boolean;
  isReady: boolean;
}

export function useAjiltan(): UseAjiltanReturn {
  const cookieData = parseCookies();
  const token = cookieData.tureestoken;

  const userContext: UserContext = {
    ezenId: cookieData.ezenId,
    baiguullagiinId: cookieData.baiguullagiinId,
    barilgiinId: cookieData.barilgiinId,
  };

  const shouldFetch = Boolean(token);

  const { data, error, isLoading, mutate } = useSWR<AjiltanData>(
    shouldFetch ? [`/tokenoorKhariltsagchAvya`, token, userContext] : null,
    ([url, token, userContext]: [string, string, UserContext]) =>
      fetcher(url, token, userContext),
    {
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      fallbackData: undefined,
      loadingTimeout: 3000,
    }
  );

  return {
    ajiltan: data || null,
    error,
    isLoading,
    ajiltanMutate: mutate,
    userContext,
    hasToken: shouldFetch,
    isReady: !isLoading && (data !== undefined || error !== undefined),
  };
}
