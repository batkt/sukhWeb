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
  /**
   * Хэрэглэгчийн СОНГОЛТ (localStorage-д хадгалагдана). Хулганаар түр
   * дэлгэсэн үед энэ утга ӨӨРЧЛӨГДӨХГҮЙ.
   */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Хулганаар түр дэлгэх - хумисан үед л үйлчилнэ, сонголтыг хадгална. */
  peeking: boolean;
  setPeeking: (v: boolean) => void;
  /**
   * Дэлгэц дээр ҮНЭХЭЭР нарийн (rail) байгаа эсэх: хумисан + түр
   * дэлгээгүй + том дэлгэц. Компонентууд харагдацаа үүгээр шийднэ.
   */
  railMode: boolean;
  /** Force rail mode — used by the click-outside handler in AppShell. */
  collapse: () => void;
  /** Off-canvas drawer below the desktop breakpoint. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

/**
 * Сонголтыг л хадгална. <html data-sidebar> атрибутыг доорх effect нь
 * БОДИТ (peek-ийг тооцсон) утгаар тавьдаг тул энд хөндөхгүй.
 */
function saveCollapsed(next: boolean) {
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
  const [peeking, setPeeking] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const railMode = collapsed && !peeking && isDesktop;

  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "rail");
  }, []);

  // Бодит харагдацыг <html data-sidebar> дээр тусгана. Түр дэлгэсэн үед
  // "full" болж бүх CSS дүрэм ажиллана - тусдаа peek дүрэм бичих шаардлагагүй.
  //
  // Үүнээс гадна peek-ийг ТУСДАА атрибутаар тэмдэглэнэ. Учир нь түр
  // дэлгэсэн үед хажуугийн цэс агуулгыг ТҮЛХЭХ ЁСГҮЙ - зөвхөн дээгүүр нь
  // тэлнэ. Түлхэх тохиолдолд .shell-main-ий margin анимацлагдаж, кадр
  // бүрт бүх документ дахин байрлал боддог тул удаан мэдрэгддэг байв.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute(
      "data-sidebar",
      collapsed && !peeking ? "rail" : "full",
    );
    if (collapsed && peeking) {
      root.setAttribute("data-sidebar-peek", "1");
    } else {
      root.removeAttribute("data-sidebar-peek");
    }
  }, [collapsed, peeking]);

  // Жижиг дэлгэц рүү шилжихэд түр дэлгэсэн төлөв гацаж үлдэхээс сэргийлнэ
  useEffect(() => {
    if (!isDesktop) setPeeking(false);
  }, [isDesktop]);

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
    // Товчоор сольсон бол түр дэлгэсэн төлөвийг цуцална - эс тэгвээс
    // "хумих" дарсан ч хулганы улмаас дэлгэгдсэн хэвээр үлдэнэ.
    setPeeking(false);
    setCollapsed((prev) => {
      const next = !prev;
      saveCollapsed(next);
      return next;
    });
  }, []);

  const collapse = useCallback(() => {
    setPeeking(false);
    setCollapsed((prev) => {
      if (prev) return prev;
      saveCollapsed(true);
      return true;
    });
  }, []);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      collapse,
      peeking,
      setPeeking,
      railMode,
      mobileOpen,
      setMobileOpen,
      isDesktop,
    }),
    [collapsed, toggleCollapsed, collapse, peeking, railMode, mobileOpen, isDesktop],
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
