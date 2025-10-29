import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
import useSWR, { KeyedMutator } from "swr";
import { AxiosError } from "axios";

export interface Baiguullaga {
  _id: string;
  ner: string;
  dans?: string;
  khayag?: string;
  utas?: string;
  bankNer?: string;
  email?: string;
  register?: string;
  merchantTin?: string;
  // eBarimt and nuat flags stored on the organization level
  eBarimtAutomataarIlgeekh?: boolean;
  eBarimtAshiglakhEsekh?: boolean;
  eBarimtShine?: boolean;
  nuatTulukhEsekh?: boolean;
  duureg?:
    | string
    | {
        _id?: string;
        ner: string;
        kod: string;
        ded?: Array<{
          _id: string;
          ner: string;
          kod: string;
        }>;
      };
  horoo?:
    | string
    | {
        _id?: string;
        ner: string;
        kod: string;
      };
  tokhirgoo?: {
    merchantTin?: string;
    duuregNer?: string;
    districtCode?: string;
    sohCode?: string;
    // small set of settings that can live under tokhirgoo
    aldangiinKhuvi?: number;
    aldangiChuluulukhKhonog?: number;
    baritsaaAvakhSar?: number;
    horoo?: {
      ner: string;
      kod: string;
    };
  };
  // Buildings array
  barilguud?: Array<any>;
}

const fetcher = async (
  url: string,
  token: string,
  baiguullagiinId: string
): Promise<Baiguullaga> => {
  try {
    const response = await uilchilgee(token).get(`${url}/${baiguullagiinId}`);
    return response.data;
  } catch (error) {
    aldaaBarigch(error as AxiosError<{ aldaa?: string }>);
    throw error;
  }
};

interface UseBaiguullagaReturn {
  baiguullaga: Baiguullaga | undefined;
  baiguullagaMutate: KeyedMutator<Baiguullaga>;
  isLoading: boolean;
  error: any;
}

function useBaiguullaga(
  token: string | null,
  baiguullagiinId: string | null
): UseBaiguullagaReturn {
  const { data, mutate, error, isLoading } = useSWR<Baiguullaga>(
    token && baiguullagiinId ? ["/baiguullaga", token, baiguullagiinId] : null,
    ([url, token, baiguullagiinId]: [string, string, string]) =>
      fetcher(url, token, baiguullagiinId),
    { revalidateOnFocus: false }
  );

  return {
    baiguullaga: data,
    baiguullagaMutate: mutate,
    isLoading,
    error,
  };
}

export default useBaiguullaga;
