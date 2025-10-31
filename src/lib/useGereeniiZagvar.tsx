import { useState } from "react";
import useSWR, { SWRResponse } from "swr";
import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";

interface Khuudaslalt {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  search?: string;
  [key: string]: any;
}

interface Query {
  [key: string]: any;
}

export interface GereeZagvar {
  _id?: string;
  ner: string;
  tailbar?: string;
  turul?: string;
  aguulga: string;
  baiguullagiinId: string;
  barilgiinId?: string;
  zuunTolgoi?: string;
  baruunTolgoi?: string;
  zuunKhul?: string;
  baruunKhul?: string;
  uusgesenOgnoo?: string;
  zasvarlasanOgnoo?: string;
  status?: string;
  [key: string]: any;
}

interface GereeZagvarResponse {
  khuudasniiDugaar: number;
  khuudasniiKhemjee: number;
  jagsaalt: GereeZagvar[];
  niitMur: number;
  niitKhuudas: number;
  success?: boolean;
  message?: string;
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
  string,
  Khuudaslalt,
  Query,
  string | undefined
]): Promise<GereeZagvarResponse> => {
  try {
    const queryObj: any = {
      baiguullagiinId,
      ...query,
    };

    if (barilgiinId) {
      queryObj.barilgiinId = barilgiinId;
    }

    if (khuudaslalt.search && khuudaslalt.search.trim() !== "") {
      queryObj.$or = [
        { ner: { $regex: khuudaslalt.search, $options: "i" } },
        { tailbar: { $regex: khuudaslalt.search, $options: "i" } },
        { turul: { $regex: khuudaslalt.search, $options: "i" } },
      ];
    }

    const response = await uilchilgee(token).get(url, {
      params: {
        query: JSON.stringify(queryObj),
        khuudasniiDugaar: khuudaslalt.khuudasniiDugaar,
        khuudasniiKhemjee: khuudaslalt.khuudasniiKhemjee,
      },
    });

    return response.data;
  } catch (error: any) {
    aldaaBarigch(error);
    throw error;
  }
};

export function useGereeniiZagvar(
  query: Query = {},
  supToken?: string,
  supBaiguullagiinId?: string,
  supBarilgiinId?: string
) {
  const {
    token: contextToken,
    ajiltan,
    barilgiinId: contextBarilgiinId,
  } = useAuth();
  const token = supToken || contextToken;
  const baiguullagiinId = supBaiguullagiinId || ajiltan?.baiguullagiinId;
  const barilgiinId = supBarilgiinId || contextBarilgiinId;

  const [khuudaslalt, setZagvarKhuudaslalt] = useState<Khuudaslalt>({
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 100,
    search: "",
  });

  const shouldFetch = !!token && !!baiguullagiinId && baiguullagiinId !== "";

  const { data, mutate, isValidating }: SWRResponse<GereeZagvarResponse, any> =
    useSWR(
      shouldFetch
        ? [
            "/gereeniiZagvar",
            token,
            baiguullagiinId,
            khuudaslalt,
            query,
            barilgiinId,
          ]
        : null,
      fetcherJagsaalt,
      {
        revalidateOnFocus: false,
      }
    );

  return {
    zagvaruud: data?.jagsaalt || [],
    zagvarJagsaaltMutate: mutate,
    setZagvarKhuudaslalt,
    isValidating,
    niitMur: data?.niitMur || 0,
    niitKhuudas: data?.niitKhuudas || 0,
  };
}

export function useGereeZagvarCRUD() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const zagvarUusgekh = async (
    zagvarData: Partial<GereeZagvar>
  ): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const payload: any = {
        ner: zagvarData.ner,
        tailbar: zagvarData.tailbar || "",
        turul: zagvarData.turul || "",
        aguulga: zagvarData.aguulga || "",
        baiguullagiinId: ajiltan.baiguullagiinId,
        zuunTolgoi: zagvarData.zuunTolgoi || "<p></p>",
        baruunTolgoi: zagvarData.baruunTolgoi || "<p></p>",
        zuunKhul: zagvarData.zuunKhul || "<p></p>",
        baruunKhul: zagvarData.baruunKhul || "<p></p>",
      };

      // Only add barilgiinId if it exists
      if (barilgiinId) {
        payload.barilgiinId = barilgiinId;
      }

      const response = await uilchilgee(token).post("/gereeniiZagvar", payload);

      if (
        response.data.success ||
        response.status === 200 ||
        response.data === "Amjilttai"
      ) {
        toast.success(response.data.message || "Загвар амжилттай үүсгэгдлээ");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const zagvarZasakh = async (
    id: string,
    zagvarData: Partial<GereeZagvar>
  ): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const payload: any = {
        _id: id,
        ner: zagvarData.ner,
        tailbar: zagvarData.tailbar || "",
        turul: zagvarData.turul || "",
        aguulga: zagvarData.aguulga || "",
        baiguullagiinId: ajiltan.baiguullagiinId,
        zuunTolgoi: zagvarData.zuunTolgoi || "<p></p>",
        baruunTolgoi: zagvarData.baruunTolgoi || "<p></p>",
        zuunKhul: zagvarData.zuunKhul || "<p></p>",
        baruunKhul: zagvarData.baruunKhul || "<p></p>",
      };

      if (zagvarData.barilgiinId) {
        payload.barilgiinId = zagvarData.barilgiinId;
      } else if (barilgiinId) {
        payload.barilgiinId = barilgiinId;
      }

      const response = await uilchilgee(token).put(
        `/gereeniiZagvar/${id}`,
        payload
      );

      if (
        response.data.success ||
        response.status === 200 ||
        response.data === "Amjilttai"
      ) {
        toast.success(response.data.message || "Загвар амжилттай засагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  const zagvarUstgakh = async (id: string): Promise<boolean> => {
    if (!token || !ajiltan?.baiguullagiinId) {
      toast.error("Нэвтрэх шаардлагатай");
      return false;
    }

    try {
      const response = await uilchilgee(token).delete(`/gereeniiZagvar/${id}`, {
        data: {
          baiguullagiinId: ajiltan.baiguullagiinId,
        },
      });

      if (
        response.data.success ||
        response.status === 200 ||
        response.data === "Amjilttai"
      ) {
        toast.success(response.data.message || "Загвар амжилттай устгагдлаа");
        return true;
      }
      return false;
    } catch (error: any) {
      aldaaBarigch(error);
      return false;
    }
  };

  return {
    zagvarUusgekh,
    zagvarZasakh,
    zagvarUstgakh,
  };
}
