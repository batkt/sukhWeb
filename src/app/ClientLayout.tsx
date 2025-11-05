"use client";

import { ReactNode, useEffect, useState } from "react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
// Removed Mantine dates styles; using custom DatePicker component
import dayjs from "dayjs";
import "dayjs/locale/mn";
import { useRouter, usePathname } from "next/navigation";
import { parseCookies, destroyCookie } from "nookies";
import { SpinnerProvider, useSpinner } from "../../src/context/SpinnerContext";
import { SuccessOverlayHost } from "@/components/ui/SuccessOverlay";
import { ErrorOverlayHost } from "@/components/ui/ErrorOverlay";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { mutate } from "swr";
import { socket } from "../../lib/uilchilgee";
import { SocketProvider } from "../context/SocketContext";
import { SearchProvider } from "@/context/SearchContext";
import { BuildingProvider } from "@/context/BuildingContext";
import RequestScopeSync from "@/context/RequestScopeSync";
import { TourProvider } from "@/context/TourContext";
import TourHost from "@/components/ui/TourHost";
import type { Socket } from "socket.io-client";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  if (!token || token === "undefined" || token === "null") {
    return false;
  }

  const payload = parseJwt(token);
  if (!payload || !payload.id) {
    return false;
  }

  // Require a valid expiration; tokens without exp are treated as invalid
  if (typeof payload.exp !== "number") {
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp < currentTime) {
    return false;
  }

  return true;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <SpinnerProvider>
        <TourProvider>
          <TourHost />
          <LayoutContent>{children}</LayoutContent>
        </TourProvider>
      </SpinnerProvider>
    </MantineProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: spinnerLoading } = useSpinner();
  const [authChecked, setAuthChecked] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Set global locale for date handling to Mongolian
    try {
      dayjs.locale("mn");
    } catch (_) {}

    // Apply saved theme on every route change (so login page also follows theme)
    try {
      const root = document.documentElement;
      // Mode (light/dark)
      const savedMode =
        (typeof window !== "undefined" &&
          (localStorage.getItem("theme-mode") as "light" | "dark" | null)) ||
        null;
      const mode =
        savedMode ||
        (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");
      root.setAttribute("data-mode", mode);
      if (mode === "dark") root.classList.add("dark");
      else root.classList.remove("dark");

      // Color theme (blue-gradient, colorful, white-gray, green)
      const savedTheme =
        (typeof window !== "undefined" && localStorage.getItem("app-theme")) ||
        "colorful";
      root.setAttribute("data-theme", savedTheme);
    } catch (_) {}

    const checkAuth = () => {
      const cookies = parseCookies();
      const token = cookies.tureestoken;
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(online);
      // Consider cached session valid in offline mode if we have ajiltan locally
      const hasCachedUser =
        typeof window !== "undefined" &&
        (() => {
          try {
            const a = localStorage.getItem("ajiltan");
            return !!(a && a !== "undefined" && a !== "null");
          } catch {
            return false;
          }
        })();

      if (pathname === "/login") {
        // Always show login page (no redirect to /khynalt even if token exists)
        // Allow offline login if we have a cached session
        if (!online && hasCachedUser) {
          setAuthChecked(true);
          return;
        }
        setAuthChecked(true);
        return;
      }

      if (!token || !isTokenValid(token)) {
        // If offline but we have a cached session, let user continue working
        if (!online && hasCachedUser) {
          setAuthChecked(true);
          return;
        }
        if (token) {
          destroyCookie(null, "tureestoken", { path: "/" });
          localStorage.removeItem("ajiltan");
        }
        router.replace("/login");
        return;
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [pathname, router]);

  // Register the service worker once on the client
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      // Wait for the app to settle
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Listen to updates
            if (reg && reg.active) {
              // noop for now
            }
          })
          .catch(() => {
            // ignore registration errors
          });
      });
    }
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Initialize socket listeners for real-time updates (refresh SWR caches)
  const [skt, setSkt] = useState<Socket | null>(null);

  useEffect(() => {
    try {
      const s = socket();
      setSkt(s);

      const onResidentDeleted = (data: any) => {
        // Revalidate any SWR keys that start with "/orshinSuugch" and "/geree"
        try {
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/orshinSuugch"
          );
          mutate((key: any) => Array.isArray(key) && key[0] === "/geree");
        } catch (err) {
          // If predicate-based mutate is unavailable, swallow the error.
        }
      };

      s.on("orshinSuugch.deleted", onResidentDeleted);
      s.on("geree.deleted", onResidentDeleted);

      // Employees: created/updated/deleted -> revalidate employee lists
      const onEmployeeChanged = (data: any) => {
        try {
          mutate((key: any) => Array.isArray(key) && key[0] === "/ajiltan");
        } catch (_) {}
      };
      s.on("ajiltan.created", onEmployeeChanged);
      s.on("ajiltan.updated", onEmployeeChanged);
      s.on("ajiltan.deleted", onEmployeeChanged);

      return () => {
        try {
          s.off("orshinSuugch.deleted", onResidentDeleted);
          s.off("geree.deleted", onResidentDeleted);
          s.off("ajiltan.created", onEmployeeChanged);
          s.off("ajiltan.updated", onEmployeeChanged);
          s.off("ajiltan.deleted", onEmployeeChanged);
          s.disconnect();
        } catch (e) {
          // ignore during cleanup
        }
      };
    } catch (e) {
      // ignore socket init errors in SSR/edge cases
    }
  }, []);

  if (!authChecked || spinnerLoading) {
    return (
      <>
        <div
          className="fixed inset-0 z-[2000] grid place-items-center"
          style={{
            background:
              "color-mix(in oklch, var(--surface-bg), transparent 10%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div className="menu-surface p-8 rounded-3xl flex flex-col items-center gap-5">
            <div className="w-[160px] h-[160px]">
              <DotLottieReact
                src="https://lottie.host/5386a522-13d7-4766-b11e-78c8c868b2d6/ljDPLtL4kH.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="text-sm text-muted-foreground">Түр хүлээнэ үү…</div>
          </div>
        </div>
        {/* Always mount overlay hosts so they can receive events during loading */}
        <SuccessOverlayHost />
        <ErrorOverlayHost />
      </>
    );
  }

  return (
    <SocketProvider socket={skt}>
      <SearchProvider>
        <BuildingProvider>
          <RequestScopeSync />
          {/* Optionally, small offline badge */}
          {!isOnline && (
            <div className="fixed bottom-3 right-3 z-[2000] px-3 py-1 rounded-full text-xs bg-yellow-500/90 text-black shadow">
              Оффлайн горим
            </div>
          )}
          {children}
          <SuccessOverlayHost />
          <ErrorOverlayHost />
        </BuildingProvider>
      </SearchProvider>
    </SocketProvider>
  );
}
