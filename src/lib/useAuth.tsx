"use client";

import React, {
  useState,
  useContext,
  createContext,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import { parseCookies, setCookie, destroyCookie } from "nookies";
import uilchilgee, { aldaaBarigch } from "../../lib/uilchilgee";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { Baiguullaga } from "@/types/baiguullaga";
import { AxiosError } from "axios";

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
  barilgaSoliyo: (id: string, ajiltan: Ajiltan) => void;
  barilgiinId: string | null;
  newterya: (khereglech: {
    nevtrekhNer: string;
    nuutsUg: string;
    namaigsana?: boolean;
  }) => Promise<boolean>;
  garya: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const useBarilga = () => {
  const [barilgiinId, setBarilgiinId] = useState<string | null>(null);

  useEffect(() => {
    const loadBarilga = async () => {
      const cookies = parseCookies();
      if (cookies.barilgiinId && cookies.barilgiinId !== "undefined") {
        setBarilgiinId(cookies.barilgiinId);
      }
    };
    loadBarilga();
  }, []);

  const barilgaSoliyo = (id: string, ajiltan: Ajiltan) => {
    const tukhainBarilga = ajiltan?.salbaruud?.find(
      (salbar) => salbar?.salbariinId === id
    );

    if (!tukhainBarilga && ajiltan?.erkh !== "Admin") {
      toast.error("Ажилтанд барилгын тохиргоо хийгдээгүй байна");
      return false;
    }

    if (tukhainBarilga) {
      const duusakhOgnoo = new Date(tukhainBarilga.duusakhOgnoo);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      duusakhOgnoo.setHours(0, 0, 0, 0);

      if (duusakhOgnoo < today) {
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
  };

  return { barilgiinId, barilgaSoliyo };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [ajiltan, setAjiltan] = useState<Ajiltan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { baiguullaga, baiguullagaMutate } = useBaiguullaga(
    token,
    ajiltan?.baiguullagiinId || null
  );
  const { barilgaSoliyo, barilgiinId } = useBarilga();

  // Load token and ajiltan from cookies/localStorage on mount
  useEffect(() => {
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

          // Load ajiltan from localStorage (session continuity), but this
          // does NOT bypass login as middleware enforces token presence.
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
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const setToken = (newToken: string | null) => {
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
  };

  const ajiltanMutate = (newAjiltan: Ajiltan) => {
    setAjiltan(newAjiltan);
    // Store in localStorage for persistence
    localStorage.setItem("ajiltan", JSON.stringify(newAjiltan));
  };

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

        // Do not persist username or any remember-me data

        try {
          const response = await uilchilgee().post<LoginResponse>(
            "/ajiltanNevtrey",
            khereglech
          );

          if (response.status === 200 && response.data) {
            const { token: newToken, result } = response.data;

            if (
              result.erkh !== "Admin" &&
              (!result.tsonkhniiErkhuud || result.tsonkhniiErkhuud.length < 1)
            ) {
              toast.error("Хэрэглэгчийн эрхийн тохиргоо хийгдээгүй байна");
              return false;
            }

            // Set token in both state and cookie
            setToken(newToken);

            // Set ajiltan in both state and localStorage
            ajiltanMutate(result);

            if (
              (result?.barilguud && result.barilguud.length > 0) ||
              result.erkh === "Admin"
            ) {
              let solikhBarilgaOldsonEsekh = false;

              if (Array.isArray(result?.salbaruud)) {
                for (const salbar of result.salbaruud) {
                  if (result.erkh !== "Admin") {
                    for (const barilga of result.barilguud || []) {
                      if (salbar?.salbariinId === barilga) {
                        const duusakhOgnoo = new Date(salbar.duusakhOgnoo);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        duusakhOgnoo.setHours(0, 0, 0, 0);

                        if (duusakhOgnoo > today) {
                          solikhBarilgaOldsonEsekh = true;
                          barilgaSoliyo(salbar.salbariinId, result);
                          break;
                        }
                      }
                    }
                  } else {
                    const duusakhOgnoo = new Date(salbar.duusakhOgnoo);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    duusakhOgnoo.setHours(0, 0, 0, 0);

                    if (duusakhOgnoo > today) {
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

            toast.success("Амжилттай нэвтэрлээ");
            return true;
          } else {
            toast.error("Хэрэглэгчийн мэдээлэл буруу байна");
            return false;
          }
        } catch (error: any) {
          const axiosError = error as AxiosError<{ aldaa?: string }>;

          // Check for specific error messages
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
        setTokenState(null);
        setAjiltan(null);
        localStorage.removeItem("ajiltan");
        destroyCookie(null, "tureestoken", { path: "/" });
        destroyCookie(null, "barilgiinId", { path: "/" });
        window.location.href = "/";
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
    }),
    [token, ajiltan, baiguullaga, barilgiinId, isLoading, barilgaSoliyo]
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
