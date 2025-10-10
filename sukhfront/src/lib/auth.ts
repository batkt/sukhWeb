import { setCookie, destroyCookie, parseCookies } from "nookies";
import { DecodedToken } from "./../../lib/uilchilgee"

export async function createSession(token: string, user: DecodedToken) {
  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: false,
  };

  try {
    setCookie(null, "tureestoken", token, cookieOptions);
    setCookie(null, "userId", user.id, cookieOptions);
    setCookie(null, "ner", user.ner, cookieOptions);
    setCookie(null, "erkh", user.erkh, cookieOptions);
    setCookie(null, "baiguullagiinId", user.baiguullagiinId, cookieOptions);
    setCookie(null, "baiguullagiinNer", user.baiguullagiinNer, cookieOptions);

    if (user.utas) {
      setCookie(null, "utas", user.utas, cookieOptions);
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    return true;
  } catch (error) {
    throw error;
  }
}

export function verifySession() {
  const cookies = parseCookies();

  return {
    isAuthenticated: !!cookies.tureestoken,
    token: cookies.tureestoken,
    userId: cookies.userId,
    ner: cookies.ner,
    erkh: cookies.erkh,
    baiguullagiinId: cookies.baiguullagiinId,
    baiguullagiinNer: cookies.baiguullagiinNer,
    utas: cookies.utas,
  };
}

export async function logout() {
  try {
    destroyCookie(null, "tureestoken", { path: "/" });
    destroyCookie(null, "userId", { path: "/" });
    destroyCookie(null, "ner", { path: "/" });
    destroyCookie(null, "erkh", { path: "/" });
    destroyCookie(null, "baiguullagiinId", { path: "/" });
    destroyCookie(null, "baiguullagiinNer", { path: "/" });
    destroyCookie(null, "utas", { path: "/" });

    window.location.href = "/login";
  } catch (error) {
    window.location.href = "/login";
  }
}
