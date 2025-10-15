import { aldaaBarigch } from "../../components/aldaaBarigch";
import uilchilgee from "../../lib/uilchilgee";
import { parseCookies } from "nookies";
import useSWR from "swr";

const fetcher = async (url: string, token: string, userContext: any) => {
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
    aldaaBarigch(error);
    throw error;
  }
};

export function useAjiltan() {
  const cookieData = parseCookies();
  const token = cookieData.tureestoken;

  const userContext = {
    ezenId: cookieData.ezenId,
    baiguullagiinId: cookieData.baiguullagiinId,
    barilgiinId: cookieData.barilgiinId,
  };

  const shouldFetch = Boolean(token);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? [`/tokenoorKhariltsagchAvya`, token, userContext] : null,
    ([url, token, userContext]) => fetcher(url, token, userContext),
    {
      revalidateOnFocus: false,

      errorRetryCount: 3,
      errorRetryInterval: 1000,

      fallbackData: null,

      loadingTimeout: 3000,
    }
  );

  return {
    ajiltan: data,
    error,
    isLoading,
    ajiltanMutate: mutate,
    userContext,

    hasToken: shouldFetch,
    isReady: !isLoading && (data !== undefined || error !== undefined),
  };
}

export function filterJagsaaltByUser(data: any, userId: string) {
  if (!data || !userId) return data;

  const filtered = { ...data };

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
