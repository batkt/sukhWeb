"use client";

import { ReactNode, useEffect, useState } from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { ConfigProvider, theme as antdTheme } from "antd";
import mn_MN from "antd/lib/locale/mn_MN";
import { Toaster, toast } from "sonner";
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
import { socket, OOR_TOKHOOROMJ_TULKHUUR } from "@/lib/uilchilgee";
import { SocketProvider } from "../context/SocketContext";
import { SearchProvider } from "@/context/SearchContext";
import { BuildingProvider } from "@/context/BuildingContext";
import RequestScopeSync from "@/context/RequestScopeSync";
import { TourProvider } from "@/context/TourContext";
import TourHost from "@/components/ui/TourHost";
import type { Socket } from "socket.io-client";
import ChatWidget from "@/components/ChatWidget";
import AiTuslakh from "@/components/AiTuslakh";

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
    return false;
  }

  const payload = parseJwt(token);
  if (!payload) {
    return false;
  }
  if (!payload.id) {
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

  // antd-ийн бүх бүрэлдэхүүн (confirm, popconfirm, dropdown, message...)
  // харанхуй горимд хар үсэгтэй харагддаг байв — <html class="dark">-ийг
  // ажиглаж antd-ийн өөрийн харанхуй алгоритмыг асаана.
  // Өөр төхөөрөмжөөс нэвтэрсний улмаас гарсан бол тэр мэдэгдлийг ЭНД
  // харуулна. `uilchilgee.ts` нь гаргахдаа чиглүүлэлт хийдэг тул тэнд
  // харуулсан toast агшин зуур алга болно — иймд sessionStorage-оор
  // дамжуулж, шинэ хуудсан дээр нь нэг удаа гаргана.
  useEffect(() => {
    try {
      const medegdel = sessionStorage.getItem(OOR_TOKHOOROMJ_TULKHUUR);
      if (!medegdel) return;
      sessionStorage.removeItem(OOR_TOKHOOROMJ_TULKHUUR);
      toast.error(medegdel, { duration: 10000 });
    } catch (_aldaa) {
      // sessionStorage хаалттай байж болно.
    }
  }, []);

  const [kharankhui, setKharankhui] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const shinechlekh = () =>
      setKharankhui(
        root.classList.contains("dark") ||
          root.getAttribute("data-mode") === "dark"
      );
    shinechlekh();
    const ajiglagch = new MutationObserver(shinechlekh);
    ajiglagch.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-mode"],
    });
    return () => ajiglagch.disconnect();
  }, []);

  return (
    <ConfigProvider
      locale={mongolianLocale}
      theme={{
        algorithm: kharankhui ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: '"Segoe UI", sans-serif',
          fontSize: 13,
        },
      }}
    >
      <MantineProvider theme={theme} forceColorScheme={kharankhui ? "dark" : "light"}>
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

      const isPublicPath =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/nevtrekh" ||
        pathname === "/app/account-delete" ||
        Boolean(pathname && pathname.startsWith("/pay/")) ||
        Boolean(pathname && pathname.startsWith("/zogsool-qr/"));

      if (isPublicPath) {
        // Always show public pages without requiring authentication
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
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[color:var(--panel)] border border-white/10 pointer-events-auto gap-3 shadow-2xl">
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
          {/* Нэвтрэх болон нийтийн хуудсууд дээр чат товчийг харуулахгүй */}
          {pathname !== "/login" &&
            pathname !== "/signup" &&
            pathname !== "/nevtrekh" &&
            !pathname?.startsWith("/pay/") &&
            !pathname?.startsWith("/zogsool-qr/") && (
              <>
                <ChatWidget />
                <AiTuslakh />
              </>
            )}
          <Toaster position="top-right" richColors closeButton />
          <SuccessOverlayHost />
          <ErrorOverlayHost />

          {/* Explicit, app-driven loading overlay (not navigation) */}
          {spinnerLoading && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/15 backdrop-blur-[2px] pointer-events-none transition-all duration-300">
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[color:var(--panel)] border border-white/10 pointer-events-auto gap-3 shadow-2xl">
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
