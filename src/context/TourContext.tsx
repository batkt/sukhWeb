"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type Driver = any;
type DriverStep = {
  element?: string | Element | null;
  popover?: {
    title?: string;
    description?: string;
    side?: "top" | "bottom" | "left" | "right" | "auto";
  };
};

type StepsMap = Record<string, DriverStep[]>;

interface TourContextValue {
  registerSteps: (id: string, steps: DriverStep[]) => void;
  start: (id?: string) => void;
  disable: () => void;
  enable: () => void;
  disabled: boolean;
  hasShownOnce: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

const DISABLED_KEY = "app-tour-disabled";
const SHOWN_ONCE_KEY = "app-tour-shown-once";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [stepsMap, setStepsMap] = useState<StepsMap>({});
  const driverRef = useRef<Driver | null>(null);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [hasShownOnce, setHasShownOnce] = useState<boolean>(false);

  // read persisted flags
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dis = localStorage.getItem(DISABLED_KEY) === "1";
      const shown = localStorage.getItem(SHOWN_ONCE_KEY) === "1";
      setDisabled(dis);
      setHasShownOnce(shown);
    } catch {}
  }, []);

  const ensureDriver = useCallback(async () => {
    if (driverRef.current) return driverRef.current;
    const mod = await import("driver.js");
    // CSS is imported via TourHost to avoid SSR errors
    const d =
      (mod as any).driver || (mod as any).default?.driver || (mod as any);
    // New API in v1 exports driver() function; fallback to default if needed
    const instance = typeof d === "function" ? d : d.driver?.bind(d) ?? null;
    driverRef.current = instance
      ? instance({
          showProgress: true,
          overlayColor: "rgba(0,0,0,0.55)",
          // Mongolian labels for the controls
          nextBtnText: "Дараагийн",
          prevBtnText: "Өмнөх",
          doneBtnText: "Дуусгах",
          closeBtnText: "Хаах",
          stagePadding: 4,
          // Prevent driver from auto-scrolling the page; prefer leaving page position unchanged
          smoothScroll: false,
          scrollTo: false,
          scrollIntoViewOptions: {
            behavior: "auto",
            block: "nearest",
            inline: "nearest",
          },
        })
      : null;
    return driverRef.current;
  }, []);

  const start = useCallback(
    async (id?: string) => {
      if (disabled) return;
      const key = id || pathname || "global";
      const steps = stepsMap[key] || stepsMap["global"];
      if (!steps || steps.length === 0) return;
      const drvFactory = await ensureDriver();
      if (!drvFactory) return;

      // Re-create per run for fresh steps resolution
      const mod = await import("driver.js");
      const factory =
        (mod as any).driver || (mod as any).default?.driver || (mod as any);
      const drv =
        typeof factory === "function"
          ? factory({
              showProgress: true,
              overlayColor: "rgba(0,0,0,0.55)",
              stagePadding: 4,
              // Mongolian labels for controls
              nextBtnText: "Дараагийн",
              prevBtnText: "Өмнөх",
              doneBtnText: "Дуусгах",
              closeBtnText: "Хаах",
              // Prevent driver from auto-scrolling the page while touring
              smoothScroll: false,
              scrollTo: false,
              scrollIntoViewOptions: {
                behavior: "auto",
                block: "nearest",
                inline: "nearest",
              },
              steps: steps as any,
            })
          : null;
      if (!drv) return;
      // Prevent driver.js from forcing page scroll by temporarily disabling
      // native scrolling helpers. We'll restore them when the tour ends.
      const origScrollIntoView = (Element.prototype as any).scrollIntoView;
      const origScrollTo = (window as any).scrollTo;

      const disableScrollFns = () => {
        try {
          (Element.prototype as any).scrollIntoView = function () {
            /* noop to avoid driver scrolling */
          };
        } catch (e) {}
        try {
          (window as any).scrollTo = function () {
            /* noop to avoid driver scrolling */
          };
        } catch (e) {}
      };

      const restoreScrollFns = () => {
        try {
          (Element.prototype as any).scrollIntoView = origScrollIntoView;
        } catch (e) {}
        try {
          (window as any).scrollTo = origScrollTo;
        } catch (e) {}
      };

      disableScrollFns();

      // Attach handlers to restore scroll functions when the tour stops/finishes
      const safeRestore = () => {
        restoreScrollFns();
        try {
          drv.off?.("stop", safeRestore);
          drv.off?.("destroy", safeRestore);
          drv.off?.("complete", safeRestore);
        } catch (e) {}
        // clear fallback timer
        try {
          if ((safeRestore as any)._timer) {
            clearTimeout((safeRestore as any)._timer);
            (safeRestore as any)._timer = undefined;
          }
        } catch (e) {}
      };

      // Some driver.js versions emit 'stop' or 'complete' events; listen to both.
      try {
        drv.on?.("stop", safeRestore);
        drv.on?.("destroy", safeRestore);
        drv.on?.("complete", safeRestore);
      } catch (e) {}

      // Fallback: ensure restoration after 10 minutes to avoid permanently broken scrolling
      (safeRestore as any)._timer = setTimeout(safeRestore, 10 * 60 * 1000);

      drv.drive();
      try {
        localStorage.setItem(SHOWN_ONCE_KEY, "1");
        setHasShownOnce(true);
      } catch {}
    },
    [disabled, ensureDriver, pathname, stepsMap]
  );

  const registerSteps = useCallback((id: string, steps: DriverStep[]) => {
    setStepsMap((m) => ({ ...m, [id]: steps }));
  }, []);

  const disable = useCallback(() => {
    setDisabled(true);
    try {
      localStorage.setItem(DISABLED_KEY, "1");
    } catch {}
  }, []);

  const enable = useCallback(() => {
    setDisabled(false);
    try {
      localStorage.removeItem(DISABLED_KEY);
    } catch {}
  }, []);

  // Auto start on first visit when steps exist
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (disabled || hasShownOnce) return;
    const key = pathname || "global";
    const steps = stepsMap[key] || stepsMap["global"];
    if (!steps || steps.length === 0) return;
    const t = setTimeout(() => start(key), 600);
    return () => clearTimeout(t);
  }, [disabled, hasShownOnce, pathname, start, stepsMap]);

  const value = useMemo(
    () => ({ registerSteps, start, disable, enable, disabled, hasShownOnce }),
    [registerSteps, start, disable, enable, disabled, hasShownOnce]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

// Helper hook for pages/components to register their steps
export function useRegisterTourSteps(id: string, steps: DriverStep[]) {
  const { registerSteps } = useTour();
  // Create a stable signature for the steps to prevent infinite update loops
  const stepsKey = useMemo(() => {
    try {
      return JSON.stringify(steps ?? []);
    } catch {
      return "__invalid__";
    }
  }, [steps]);
  const lastKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    if (lastKeyRef.current === stepsKey) return;
    registerSteps(id, steps);
    lastKeyRef.current = stepsKey;
  }, [id, stepsKey, registerSteps, steps]);
}

export type { DriverStep };
