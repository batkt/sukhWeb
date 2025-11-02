"use client";

import { ReactNode, useEffect, useState } from "react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
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

  if (payload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return false;
    }
  }

  return true;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <SpinnerProvider>
        <LayoutContent>{children}</LayoutContent>
      </SpinnerProvider>
    </MantineProvider>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: spinnerLoading } = useSpinner();
  const [authChecked, setAuthChecked] = useState(false);

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

      // Color theme (blue-gradient, colorful, white-gray)
      const savedTheme =
        (typeof window !== "undefined" && localStorage.getItem("app-theme")) ||
        "";
      root.removeAttribute("data-theme");
      if (savedTheme && savedTheme !== "colorful") {
        root.setAttribute("data-theme", savedTheme);
      }
    } catch (_) {}

    const checkAuth = () => {
      const cookies = parseCookies();
      const token = cookies.tureestoken;

      if (pathname === "/login") {
        // If already authenticated, redirect away from login
        if (token && isTokenValid(token)) {
          router.replace("/khynalt");
          return;
        }
        setAuthChecked(true);
        return;
      }

      if (!token || !isTokenValid(token)) {
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

      return () => {
        try {
          s.off("orshinSuugch.deleted", onResidentDeleted);
          s.off("geree.deleted", onResidentDeleted);
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
      <div
        className="fixed inset-0 z-[2000] grid place-items-center"
        style={{
          background: "color-mix(in oklch, var(--surface-bg), transparent 10%)",
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
    );
  }

  return (
    <SocketProvider socket={skt}>
      <SearchProvider>
        <BuildingProvider>
          <RequestScopeSync />
          {children}
          <SuccessOverlayHost />
          <ErrorOverlayHost />
        </BuildingProvider>
      </SearchProvider>
    </SocketProvider>
  );
}
