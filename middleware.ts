import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Publicly accessible paths (no auth needed)
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/signup",
  "/offline.html",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Allow static and PWA files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
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

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Read auth cookie (set by app on login)
  const token = cookies.get("tureestoken")?.value;

  // If missing token, redirect to login (do not preserve the original URL)
  if (!token || token === "undefined" || token === "null") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = ""; // clear any search params
    return NextResponse.redirect(url);
  }

  // Otherwise allow request
  return NextResponse.next();
}

// Match all routes except Next.js internals and static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|images/|icons/).*)",
  ],
};
