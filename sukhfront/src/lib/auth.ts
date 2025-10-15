import { setCookie, destroyCookie, parseCookies } from "nookies";

export async function createSession(
  token: string,
  zochinTurul: string,
  mashiniiDugaar?: string | string[],
  userContext?: {
    ezenId?: string;
    baiguullagiinId?: string;
    barilgiinId?: string;
    utas?: string;
    zochinTusBurUneguiMinut?: number;
    zochinErkhiinToo?: number;
    davtamjiinTurul?: string;
  },
  vehicleIds?: string[]
) {
  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: false,
  };

  try {
    setCookie(null, "tureestoken", token, cookieOptions);
    setCookie(null, "zochinTurul", zochinTurul, cookieOptions);

    if (userContext) {
      if (userContext.ezenId) {
        setCookie(null, "ezenId", userContext.ezenId, cookieOptions);
      }
      if (userContext.baiguullagiinId) {
        setCookie(
          null,
          "baiguullagiinId",
          userContext.baiguullagiinId,
          cookieOptions
        );
      }
      if (userContext.barilgiinId) {
        setCookie(null, "barilgiinId", userContext.barilgiinId, cookieOptions);
      }
      if (userContext.utas) {
        setCookie(null, "utas", userContext.utas, cookieOptions);
      }
      if (userContext.zochinTusBurUneguiMinut) {
        setCookie(
          null,
          "zochinTusBurUneguiMinut",
          userContext.zochinTusBurUneguiMinut.toString(),
          cookieOptions
        );
      }
      if (userContext.zochinErkhiinToo) {
        setCookie(
          null,
          "zochinErkhiinToo",
          userContext.zochinErkhiinToo.toString(),
          cookieOptions
        );
      }
      if (userContext.davtamjiinTurul) {
        setCookie(
          null,
          "davtamjiinTurul",
          userContext.davtamjiinTurul,
          cookieOptions
        );
      }
    }

    if (mashiniiDugaar) {
      if (Array.isArray(mashiniiDugaar)) {
        setCookie(
          null,
          "mashiniiDugaarList",
          JSON.stringify(mashiniiDugaar),
          cookieOptions
        );
        if (mashiniiDugaar.length > 0) {
          setCookie(null, "mashiniiDugaar", mashiniiDugaar[0], cookieOptions);
        }
      } else {
        setCookie(null, "mashiniiDugaar", mashiniiDugaar, cookieOptions);
        setCookie(
          null,
          "mashiniiDugaarList",
          JSON.stringify([mashiniiDugaar]),
          cookieOptions
        );
      }
    }

    // Store vehicle IDs if provided
    if (vehicleIds && vehicleIds.length > 0) {
      setCookie(null, "vehicleIds", JSON.stringify(vehicleIds), cookieOptions);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    throw error;
  }
}

export function verifySession() {
  const cookies = parseCookies();

  let mashiniiDugaarList: string[] = [];
  try {
    mashiniiDugaarList = cookies.mashiniiDugaarList
      ? JSON.parse(cookies.mashiniiDugaarList)
      : [];
  } catch {
    mashiniiDugaarList = cookies.mashiniiDugaar ? [cookies.mashiniiDugaar] : [];
  }

  let vehicleIds: string[] = [];
  try {
    vehicleIds = cookies.vehicleIds ? JSON.parse(cookies.vehicleIds) : [];
  } catch {
    vehicleIds = [];
  }

  return {
    isAuthenticated: !!(cookies.tureestoken && cookies.zochinTurul),
    token: cookies.tureestoken,
    role: cookies.zochinTurul,
    mashiniiDugaar: cookies.mashiniiDugaar,
    mashiniiDugaarList,
    baiguullagiinId: cookies.baiguullagiinId,
    ezenId: cookies.ezenId,
    barilgiinId: cookies.barilgiinId,
    utas: cookies.utas,
    zochinTusBurUneguiMinut: cookies.zochinTusBurUneguiMinut
      ? parseInt(cookies.zochinTusBurUneguiMinut)
      : undefined,
    zochinErkhiinToo: cookies.zochinErkhiinToo
      ? parseInt(cookies.zochinErkhiinToo)
      : undefined,
    davtamjiinTurul: cookies.davtamjiinTurul,
    vehicleIds,
  };
}

export async function logout() {
  try {
    destroyCookie(null, "tureestoken", { path: "/" });
    destroyCookie(null, "zochinTurul", { path: "/" });
    destroyCookie(null, "mashiniiDugaar", { path: "/" });
    destroyCookie(null, "mashiniiDugaarList", { path: "/" });
    destroyCookie(null, "baiguullagiinId", { path: "/" });
    destroyCookie(null, "ezenId", { path: "/" });
    destroyCookie(null, "barilgiinId", { path: "/" });
    destroyCookie(null, "utas", { path: "/" });
    destroyCookie(null, "zochinTusBurUneguiMinut", { path: "/" });
    destroyCookie(null, "zochinErkhiinToo", { path: "/" });
    destroyCookie(null, "davtamjiinTurul", { path: "/" });
    destroyCookie(null, "vehicleIds", { path: "/" });

    window.location.href = "/login";
  } catch (error) {
    window.location.href = "/login";
  }
}

export { destroyCookie } from "nookies";
