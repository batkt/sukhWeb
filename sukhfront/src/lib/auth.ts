import { setCookie, destroyCookie, parseCookies } from "nookies";

export interface SessionData {
  token: string;
}

/**
 * Create a new session by storing the token in cookies
 */
export async function createSession(token: string): Promise<void> {
  setCookie(null, "tureestoken", token, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

/**
 * Verify if a valid session exists
 */
export async function verifySession(): Promise<boolean> {
  const cookies = parseCookies();
  const token = cookies.tureestoken;
  return !!token && token !== "undefined" && token !== "null";
}

/**
 * Get the current session token
 */
export function getSession(): string | null {
  const cookies = parseCookies();
  const token = cookies.tureestoken;

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

/**
 * Logout by destroying all session cookies and localStorage
 */
export async function logout(): Promise<void> {
  destroyCookie(null, "tureestoken", { path: "/" });
  destroyCookie(null, "barilgiinId", { path: "/" });

  // Clear any localStorage items
  if (typeof window !== "undefined") {
    localStorage.removeItem("newtrekhNerTurees");
    localStorage.removeItem("baiguulgiinErkhiinJagsaalt");
    localStorage.removeItem("ajiltan");
  }
}

/**
 * Update session token
 */
export async function updateSession(token: string): Promise<void> {
  await createSession(token);
}
