"use client";

import { ReactNode, useEffect, useState } from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { ConfigProvider } from "antd";
import mn_MN from "antd/lib/locale/mn_MN";
import { Toaster } from "sonner";
import "@mantine/core/styles.css";
// Removed Mantine dates styles; using custom DatePicker component
import dayjs from "dayjs";
import "dayjs/locale/mn";
import { useRouter, usePathname } from "next/navigation";
import { parseCookies, destroyCookie } from "nookies";
import { SpinnerProvider, useSpinner } from "../../src/context/SpinnerContext";
import { SuccessOverlayHost } from "@/components/ui/SuccessOverlay";
import { ErrorOverlayHost } from "@/components/ui/ErrorOverlay";
import { mutate } from "swr";
import { socket } from "@/lib/uilchilgee";
import { SocketProvider } from "../context/SocketContext";
import { SearchProvider } from "@/context/SearchContext";
import { BuildingProvider } from "@/context/BuildingContext";
import RequestScopeSync from "@/context/RequestScopeSync";
import { TourProvider } from "@/context/TourContext";
import TourHost from "@/components/ui/TourHost";
import type { Socket } from "socket.io-client";
import ChatWidget from "@/components/ChatWidget";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  if (!token || token === "undefined" || token === "null") {
    console.log("🔑 [AuthCheck] Token is empty, undefined, or null string:", token);
    return false;
  }

  const payload = parseJwt(token);
  if (!payload) {
    console.log("🔑 [AuthCheck] Failed to decode JWT payload. Token:", token);
    return false;
  }
  if (!payload.id) {
    console.log("🔑 [AuthCheck] Token payload is missing 'id':", payload);
    return false;
  }

  // Require a valid expiration; tokens without exp are treated as invalid
  if (typeof payload.exp !== "number") {
    console.log("🔑 [AuthCheck] Token payload 'exp' is not a number:", payload.exp);
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp < currentTime) {
    console.log(`🔑 [AuthCheck] Token expired! exp: ${payload.exp}, current: ${currentTime}, diff: ${currentTime - payload.exp}s ago`);
    return false;
  }

  console.log("🔑 [AuthCheck] Token is valid. payload:", payload);
  return true;
}

const theme = createTheme({
  fontFamily: '"Segoe UI", sans-serif',
  fontSizes: {
    xs: '10px',
    sm: '11px',
    md: '13px',
    lg: '16px',
    xl: '20px',
  },
});

export default function ClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const mongolianLocale = {
    ...mn_MN,
    Table: {
      ...mn_MN?.Table,
      sortTitle: "Эрэмбэлэх",
      triggerDesc: "Буурахаар эрэмбэлэх",
      triggerAsc: "Өсөхөөр эрэмбэлэх",
      cancelSort: "Эрэмбэлэлтийг цуцлах",
    },
  };

  return (
    <ConfigProvider
      locale={mongolianLocale}
      theme={{
        token: {
          fontFamily: '"Segoe UI", sans-serif',
          fontSize: 13,
        },
      }}
    >
      <MantineProvider theme={theme}>
        <SpinnerProvider>
          <TourProvider>
            <TourHost />
            <LayoutContent>{children}</LayoutContent>
          </TourProvider>
        </SpinnerProvider>
      </MantineProvider>
    </ConfigProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: spinnerLoading } = useSpinner();
  const [authChecked, setAuthChecked] = useState(false);

  // Navigation feedback is handled by the shell's RouteProgress bar. The old
  // implementation blocked the entire viewport behind a blurred overlay on
  // every link click and only released it 150ms after the route had already
  // settled, which added that delay to every single navigation.

  useEffect(() => {
    // Proactively unregister any existing service workers from older builds
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations?.().then((regs) => {
          regs?.forEach((r) => r.unregister());
        });
      }
    } catch { }

    // Set global locale for date handling to Mongolian
    try {
      dayjs.locale("mn");
    } catch (_) { }

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
    } catch (_) { }

    const checkAuth = () => {
      const cookies = parseCookies();
      const token = cookies.tureestoken;

      // `/nevtrekh` дээр token нь тухайн хуудсан дээрээ үүсдэг тул энд
      // шалгах юм алга — эс тэгвээс код солигдохоос өмнө /login руу шидэнэ.
      if (
        pathname === "/login" ||
        pathname === "/nevtrekh" ||
        (pathname && pathname.startsWith("/pay/"))
      ) {
        // Always show login page or payment page
        setAuthChecked(true);
        return;
      }

      if (!token || !isTokenValid(token)) {

        if (token) {
          destroyCookie(null, "tureestoken", { path: "/" });
        }
        router.replace("/login");
        return;
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [pathname, router]);

  // Service worker registration removed: no offline persistence or queuing

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
            (key: any) => Array.isArray(key) && key[0] === "/orshinSuugch",
          );
          mutate((key: any) => Array.isArray(key) && key[0] === "/geree");
        } catch (err) {
          // If predicate-based mutate is unavailable, swallow the error.
        }
      };

      // Handle resident creation and updates for real-time sync
      const onResidentChanged = (data: any) => {
        try {
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/orshinSuugch",
          );
          mutate((key: any) => Array.isArray(key) && key[0] === "/geree");
        } catch (err) {
          // If predicate-based mutate is unavailable, swallow the error.
        }
      };

      s.on("orshinSuugch.deleted", onResidentDeleted);
      s.on("orshinSuugch.created", onResidentChanged);
      s.on("orshinSuugch.updated", onResidentChanged);
      s.on("geree.deleted", onResidentDeleted);

      // Employees: created/updated/deleted -> revalidate employee lists
      const onEmployeeChanged = (data: any) => {
        try {
          mutate((key: any) => Array.isArray(key) && key[0] === "/ajiltan");
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/tokenoorAjiltanAvya",
          );
        } catch (_) { }
      };
      s.on("ajiltan.created", onEmployeeChanged);
      s.on("ajiltan.updated", onEmployeeChanged);
      s.on("ajiltan.deleted", onEmployeeChanged);

      return () => {
        try {
          s.off("orshinSuugch.deleted", onResidentDeleted);
          s.off("orshinSuugch.created", onResidentChanged);
          s.off("orshinSuugch.updated", onResidentChanged);
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

  if (!authChecked) {
    return (
      <>
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/15 backdrop-blur-[2px] pointer-events-none transition-all duration-300">
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/80 border border-white/10 pointer-events-auto gap-3 shadow-2xl">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <span className="text-white/80 text-[10px] uppercase tracking-widest font-mono select-none">Уншиж байна...</span>
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
          {children}
          <ChatWidget />
          <Toaster position="top-right" richColors closeButton />
          <SuccessOverlayHost />
          <ErrorOverlayHost />

          {/* Explicit, app-driven loading overlay (not navigation) */}
          {spinnerLoading && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/15 backdrop-blur-[2px] pointer-events-none transition-all duration-300">
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/80 border border-white/10 pointer-events-auto gap-3 shadow-2xl">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
                <span className="text-white/80 text-[10px] uppercase tracking-widest font-mono select-none">Уншиж байна...</span>
              </div>
            </div>
          )}
        </BuildingProvider>
      </SearchProvider>
    </SocketProvider>
  );
}
