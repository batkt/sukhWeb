"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "sidebar-collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

interface SidebarContextValue {
  /** Rail mode on desktop. Visual state lives on <html data-sidebar>, this mirrors it for JS. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Off-canvas drawer below the desktop breakpoint. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function applyCollapsed(next: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-sidebar", next ? "rail" : "full");
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* private mode — visual state still applies for this session */
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Starts false on both server and client so hydration always matches; the
  // pre-paint script in layout.tsx has already applied the real width via CSS,
  // so there is no visible flash while this syncs.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "rail");
  }, []);

  // matchMedia fires only when the breakpoint is actually crossed, unlike a
  // resize listener that fired setState on every pixel of a window drag.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      applyCollapsed(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen, isDesktop }),
    [collapsed, toggleCollapsed, mobileOpen, isDesktop],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
