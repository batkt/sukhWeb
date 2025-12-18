"use client";

import React, {
  useState,
  useContext,
  createContext,
  useMemo,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { parseCookies, setCookie, destroyCookie } from "nookies";
import uilchilgee, { aldaaBarigch } from "@/lib/uilchilgee";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { Baiguullaga } from "@/types/baiguullaga";
import { AxiosError } from "axios";
import moment from "moment";

export interface Ajiltan {
  _id: string;
  ner: string;
  nevtrekhNer: string;
  erkh: string;
  baiguullagiinId: string;
  barilguud?: string[];
  salbaruud?: Array<{
    salbariinId: string;
    duusakhOgnoo: string;
  }>;
  tsonkhniiErkhuud?: any[];
}

interface LoginResponse {
  success: boolean;
  token: string;
  result: Ajiltan;
}

interface AuthContextType {
  token: string | null;
  ajiltan: Ajiltan | null;
  baiguullaga: Baiguullaga | undefined;
  baiguullagaMutate: any;
  ajiltanMutate: (ajiltan: Ajiltan) => void;
  setToken: (token: string | null) => void;
  barilgaSoliyo: (id: string, ajiltan: Ajiltan) => boolean;
  barilgiinId: string | null;
  newterya: (khereglech: {
    nevtrekhNer: string;
    nuutsUg: string;
    namaigsana?: boolean;
  }) => Promise<boolean>;
  garya: () => void;
  isLoading: boolean;
  baiguulgiinErkhiinJagsaalt: any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const useBarilga = () => {
  const [barilgiinId, setBarilgiinId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const barilgaSoliyo = useCallback((id: string, ajiltan: Ajiltan): boolean => {
    const tukhainBarilga = ajiltan?.salbaruud?.find(
      (salbar) => salbar?.salbariinId === id
    );

    if (!tukhainBarilga && ajiltan?.erkh !== "Admin") {
      toast.error("Ажилтанд барилгын тохиргоо хийгдээгүй байна");
      return false;
    }

    if (tukhainBarilga) {
      const duusakhOgnoo = moment(tukhainBarilga.duusakhOgnoo).startOf("day");
      const today = moment().startOf("day");

      if (duusakhOgnoo.isBefore(today)) {
        toast.error("Тухайн барилгын лиценз дууссан байна");
        return false;
      }
    }

    setBarilgiinId(id);
    const isProduction =
      typeof window !== "undefined" && window.location.protocol === "https:";
    setCookie(null, "barilgiinId", id, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      secure: isProduction,
      sameSite: "lax",
    });
    return true;
  }, []);

  useEffect(() => {
    if (isInitialized) return;

    const initializeBarilga = async () => {
      try {
        const cookies = parseCookies();
        const cookieBarilgiinId = cookies.barilgiinId;

        if (cookieBarilgiinId && cookieBarilgiinId !== "undefined") {
          setBarilgiinId(cookieBarilgiinId);
        }
        setIsInitialized(true);
      } catch (error) {
        setIsInitialized(true);
      }
    };

    initializeBarilga();
  }, [isInitialized]);

  return { barilgiinId, barilgaSoliyo };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [ajiltan, setAjiltan] = useState<Ajiltan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [baiguulgiinErkhiinJagsaalt, setBaiguulgiinErkhiinJagsaalt] = useState<
    any[]
  >([]);

  const { baiguullaga, baiguullagaMutate } = useBaiguullaga(
    token,
    ajiltan?.baiguullagiinId || null
  );
  const { barilgaSoliyo, barilgiinId } = useBarilga();

  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || isInitializing.current) return;

    isInitializing.current = true;

    const loadAuthData = () => {
      try {
        const cookies = parseCookies();
        const storedToken = cookies.tureestoken;

        if (
          storedToken &&
          storedToken !== "undefined" &&
          storedToken !== "null"
        ) {
          setTokenState(storedToken);

          const storedAjiltan = localStorage.getItem("ajiltan");
          if (
            storedAjiltan &&
            storedAjiltan !== "undefined" &&
            storedAjiltan !== "null"
          ) {
            try {
              const parsedAjiltan = JSON.parse(storedAjiltan);
              setAjiltan(parsedAjiltan);
            } catch (error) {
              localStorage.removeItem("ajiltan");
            }
          }
        } else {
          // Clean up invalid tokens
          destroyCookie(null, "tureestoken", { path: "/" });
          localStorage.removeItem("ajiltan");
        }

        const erkh = localStorage.getItem("baiguulgiinErkhiinJagsaalt");
        if (erkh) {
          try {
            setBaiguulgiinErkhiinJagsaalt(JSON.parse(erkh));
          } catch (error) {}
        }

        hasInitialized.current = true;
      } catch (error) {
        hasInitialized.current = true;
      } finally {
        setIsLoading(false);
        isInitializing.current = false;
      }
    };

    loadAuthData();
  }, []);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      // Session cookie only (no maxAge) so it doesn't persist across browser restarts
      // In production (HTTPS), cookies need secure flag; sameSite prevents CSRF
      const isProduction =
        typeof window !== "undefined" && window.location.protocol === "https:";
      setCookie(null, "tureestoken", newToken, {
        path: "/",
        secure: isProduction,
        sameSite: "lax",
      });
    } else {
      destroyCookie(null, "tureestoken", { path: "/" });
    }
  }, []);

  const ajiltanMutate = useCallback((newAjiltan: Ajiltan) => {
    setAjiltan(newAjiltan);
    localStorage.setItem("ajiltan", JSON.stringify(newAjiltan));
  }, []);

  const performOnlineLogin = async (khereglech: {
    nevtrekhNer: string;
    nuutsUg: string;
  }) => {
    const response = await uilchilgee().post<LoginResponse>(
      "/ajiltanNevtrey",
      khereglech
    );

    if (response.status === 200 && response.data) {
      // Fetch permissions; if it fails, default to empty modules (no offline fallback)
      let permissionsData: any = { moduluud: [] };
      try {
        const res = await uilchilgee(response.data.token).post(
          "/erkhiinMedeelelAvya"
        );
        permissionsData = res.data || { moduluud: [] };
      } catch (_) {}

      return {
        token: response.data.token,
        result: response.data.result,
        permissionsData,
      };
    } else {
      throw new Error("Хэрэглэгчийн мэдээлэл буруу байна");
    }
  };

  const ekhniiTsonkhruuOchyo = (
    ajiltan: Ajiltan,
    token: string,
    setBaiguulgiinErkhiinJagsaalt: (data: any[]) => void,
    permissionsData?: any
  ) => {
    if (permissionsData?.moduluud) {localStorage.setItem(
        "baiguulgiinErkhiinJagsaalt",
        JSON.stringify(permissionsData.moduluud)
      );
      setBaiguulgiinErkhiinJagsaalt(permissionsData.moduluud);
    }
  };

  const processSuccessfulLogin = useCallback(
    async (loginData: {
      token: string;
      result: Ajiltan;
      permissionsData: any;
    }) => {
      const { token: loginToken, result, permissionsData } = loginData;

      setToken(loginToken);
      ajiltanMutate(result);

      if (result?.barilguud?.length || result.erkh === "Admin") {
        let solikhBarilgaOldsonEsekh = false;

        if (Array.isArray(result?.salbaruud)) {
          for (const salbar of result.salbaruud) {
            if (result.erkh !== "Admin") {
              for (const barilga of result.barilguud || []) {
                if (salbar?.salbariinId === barilga) {
                  const duusakhOgnoo = moment(salbar.duusakhOgnoo).startOf(
                    "day"
                  );
                  const today = moment().startOf("day");

                  if (duusakhOgnoo.isAfter(today)) {
                    solikhBarilgaOldsonEsekh = true;
                    barilgaSoliyo(salbar.salbariinId, result);
                    break;
                  }
                }
              }
            } else {
              const duusakhOgnoo = moment(salbar.duusakhOgnoo).startOf("day");
              const today = moment().startOf("day");

              if (duusakhOgnoo.isAfter(today)) {
                solikhBarilgaOldsonEsekh = true;
                barilgaSoliyo(salbar.salbariinId, result);
                break;
              }
            }
            if (solikhBarilgaOldsonEsekh) break;
          }

          if (!solikhBarilgaOldsonEsekh) {
            toast.error("Лицензийн хугацаа дууссан байна!");
            return false;
          }
        } else {
          toast.error("Лицензийн хугацаа дууссан байна!");
          return false;
        }
      }

      if (permissionsData) {
        ekhniiTsonkhruuOchyo(
          result,
          loginToken,
          setBaiguulgiinErkhiinJagsaalt,
          permissionsData
        );
      }

      toast.success("Амжилттай нэвтэрлээ");
      return true;
    },
    [ajiltanMutate, barilgaSoliyo, setToken]
  );

  const auth = useMemo<AuthContextType>(
    () => ({
      newterya: async (khereglech: {
        nevtrekhNer: string;
        nuutsUg: string;
        namaigsana?: boolean;
      }): Promise<boolean> => {
        if (!khereglech.nevtrekhNer) {
          toast.error("Нэвтрэх нэр талбарыг бөглөнө үү");
          return false;
        }
        if (!khereglech.nuutsUg) {
          toast.error("Нууц үг талбарыг бөглөнө үү");
          return false;
        }

        try {
          const loginResult = await performOnlineLogin(khereglech);
          const success = await processSuccessfulLogin(loginResult);
          return success || false;
        } catch (error: any) {
          const axiosError = error as AxiosError<{ aldaa?: string }>;

          if (axiosError.response?.data?.aldaa) {
            toast.error(axiosError.response.data.aldaa);
          } else if (axiosError.response?.status === 401) {
            toast.error("Нэвтрэх нэр эсвэл нууц үг буруу байна");
          } else if (axiosError.response?.status === 404) {
            toast.error("Хэрэглэгч олдсонгүй");
          } else {
            aldaaBarigch(error);
          }

          return false;
        }
      },

      garya: () => {
        try {
          setTokenState(null);
          setAjiltan(null);

          destroyCookie(null, "tureestoken", { path: "/" });
          destroyCookie(null, "barilgiinId", { path: "/" });

          localStorage.removeItem("ajiltan");
          localStorage.removeItem("baiguulgiinErkhiinJagsaalt");
          localStorage.removeItem("newtrekhNerTurees");

          window.location.href = "/";
        } catch (error) {
          window.location.href = "/";
        }
      },

      token,
      ajiltan,
      baiguullaga,
      baiguullagaMutate,
      ajiltanMutate,
      setToken,
      barilgaSoliyo,
      barilgiinId,
      isLoading,
      baiguulgiinErkhiinJagsaalt,
    }),
    [
      token,
      ajiltan,
      baiguullaga,
      barilgiinId,
      isLoading,
      baiguulgiinErkhiinJagsaalt,
      barilgaSoliyo,
      processSuccessfulLogin,
      ajiltanMutate,
      baiguullagaMutate,
      setToken,
    ]
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};