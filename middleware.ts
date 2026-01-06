import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Publicly accessible paths (no auth needed)
const PUBLIC_PATHS = new Set<string>([
  "/login",
  "/signup",
  "/app/account-delete",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/")
  ) {
    return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // When user visits the login page, always clear auth-related cookies
  if (pathname === "/login") {
    const res = NextResponse.next();
    try {
      res.cookies.delete("tureestoken");
      res.cookies.delete("barilgiinId");
    } catch {}
    return res;
  }

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Read auth cookie (set by app on login)
  const token = cookies.get("tureestoken")?.value;

  // Helper: lightweight JWT parse to check exp without secret
  const isTokenValid = (tok: string | undefined): boolean => {
    if (!tok || tok === "undefined" || tok === "null") return false;
    const parts = tok.split(".");
    if (parts.length < 2) return false;
    try {
      const payloadRaw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      // Use WebAPI atob in Edge runtime
      const json = decodeURIComponent(
        atob(payloadRaw)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(json);
      if (payload && typeof payload === "object") {
        // Require a valid expiration claim; tokens without exp are treated as invalid
        if (typeof payload.exp !== "number") return false;
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) return false;
        // Also require an id/subject field
        if (!payload.id && !payload.sub) return false;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // If missing/invalid token, redirect to login and clear cookie
  if (!isTokenValid(token)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = ""; // clear any search params
    const res = NextResponse.redirect(url);
    // Proactively clear bad cookie on the way out
    res.cookies.delete("tureestoken");
    return res;
  }

  // Otherwise allow request
  return NextResponse.next();
}

// Match all routes except Next.js internals and static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|icons/).*)"],
};
