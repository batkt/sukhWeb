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
    image?: string;
    video?: string;
    side?: "top" | "bottom" | "left" | "right" | "auto";
  };
};

type StepsMap = Record<string, DriverStep[]>;

interface TourContextValue {
  registerSteps: (id: string, steps: DriverStep[]) => void;
  start: (id?: string) => void;
  disable: (key?: string) => void;
  enable: (key?: string) => void;
  disabled: boolean;
  hasShownOnce: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

const DISABLED_KEY = "app-tour-disabled";
const GLOBAL_DISABLED_KEY = "app-tour-disabled-global";

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [stepsMap, setStepsMap] = useState<StepsMap>({});
  const driverRef = useRef<Driver | null>(null);
  const [disabledPages, setDisabledPages] = useState<Record<string, boolean>>({});
  const [shownPages, setShownPages] = useState<Record<string, boolean>>({});
  const [globalDisabled, setGlobalDisabled] = useState<boolean>(false);

  // read persisted flags
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(GLOBAL_DISABLED_KEY) === "1") {
        setGlobalDisabled(true);
      }
      const keys = Object.keys(localStorage).filter(k => k.startsWith(DISABLED_KEY));
      const map: Record<string, boolean> = {};
      keys.forEach(k => {
        const pageKey = k.replace(DISABLED_KEY + "-", "");
        if (localStorage.getItem(k) === "1") map[pageKey] = true;
      });
      setDisabledPages(map);
    } catch {}
  }, []);

  const ensureDriver = useCallback(async () => {
    if (driverRef.current) return driverRef.current;
    const mod = await import("driver.js");
    const d = (mod as any).driver || (mod as any).default?.driver || (mod as any);
    const instance = typeof d === "function" ? d : d.driver?.bind(d) ?? null;
    
    const driverConfig = {
      showProgress: true,
      overlayColor: "rgba(0, 0, 0, 0.75)",
      nextBtnText: "Дараагийн",
      prevBtnText: "Өмнөх",
      doneBtnText: "Дуусгах",
      closeBtnText: "Хаах",
      stagePadding: 8,
      smoothScroll: true,
      popoverClass: "premium-driver-popover",
      progressText: "{{current}} / {{total}}",
      onPopoverRender: (popover: any, { config, state }: any) => {
        // Custom rendering for images/videos in description if they exist in the step
        const step = state.activeStep;
        if (step?.popover?.image || step?.popover?.video) {
          const descriptionEl = popover.description;
          if (descriptionEl) {
            const mediaHtml = step.popover.video 
              ? `<div class="driver-media-container"><video src="${step.popover.video}" autoplay loop muted playsinline></video></div>`
              : `<div class="driver-media-container"><img src="${step.popover.image}" alt="tour step" /></div>`;
            
            // Prepend media to description if not already there
            if (!descriptionEl.querySelector(".driver-media-container")) {
              descriptionEl.insertAdjacentHTML("afterbegin", mediaHtml);
            }
          }
        }

        // Add "Don't show again" button to the footer
        const footer = popover.footer || popover.wrapper?.querySelector(".driver-popover-footer");
        if (footer && !footer.querySelector(".driver-stop-tour-btn")) {
          const stopBtn = document.createElement("button");
          stopBtn.className = "driver-stop-tour-btn";
          stopBtn.innerHTML = "Дахин харуулахгүй";
          stopBtn.onclick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const currentKey = pathname || "global";
            disable(currentKey);
            driverRef.current?.destroy();
          };
          footer.prepend(stopBtn);
        }
      }
    };

    driverRef.current = instance ? instance(driverConfig) : null;
    return driverRef.current;
  }, [pathname]);

  const start = useCallback(
    async (id?: string) => {
      if (globalDisabled) return;
      const key = id || pathname || "global";
      if (disabledPages[key]) return;
      const steps = stepsMap[key] || stepsMap["global"];
      if (!steps || steps.length === 0) return;
      
      const mod = await import("driver.js");
      const factory = (mod as any).driver || (mod as any).default?.driver || (mod as any);
      
      const drv = typeof factory === "function"
        ? factory({
            showProgress: true,
            overlayColor: "rgba(0, 0, 0, 0.7)",
            stagePadding: 8,
            nextBtnText: "Дараагийн",
            prevBtnText: "Өмнөх",
            doneBtnText: "Дуусгах",
            closeBtnText: "Хаах",
            popoverClass: "premium-driver-popover",
            progressText: "{{current}} / {{total}}",
            steps: steps as any,
            onPopoverRender: (popover: any, { config, state }: any) => {
              const step = state.activeStep;
              if (step?.popover?.image || step?.popover?.video) {
                const descriptionEl = popover.description;
                if (descriptionEl && !descriptionEl.querySelector(".driver-media-container")) {
                  const mediaHtml = step.popover.video 
                    ? `<div class="driver-media-container video-mode"><video src="${step.popover.video}" autoplay loop muted playsinline class="rounded-xl w-full mb-3 shadow-lg"></video></div>`
                    : `<div class="driver-media-container image-mode"><img src="${step.popover.image}" alt="step" class="rounded-xl w-full mb-3 shadow-lg object-cover max-h-40" /></div>`;
                  descriptionEl.insertAdjacentHTML("afterbegin", mediaHtml);
                }
              }

              // Add "Don't show again" button to the footer
              const footer = popover.footer || popover.wrapper?.querySelector(".driver-popover-footer");
              if (footer && !footer.querySelector(".driver-stop-tour-btn")) {
                const stopBtn = document.createElement("button");
                stopBtn.className = "driver-stop-tour-btn";
                stopBtn.innerHTML = "Дахин харуулахгүй";
                stopBtn.onclick = (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  disable();
                  drv.destroy();
                };
                footer.prepend(stopBtn);
              }
            }
          })
        : null;

      if (!drv) return;
      
      const origScrollIntoView = (Element.prototype as any).scrollIntoView;
      const origScrollTo = (window as any).scrollTo;

      const disableScrollFns = () => {
        try { (Element.prototype as any).scrollIntoView = function() {}; } catch (e) {}
        try { (window as any).scrollTo = function() {}; } catch (e) {}
      };

      const restoreScrollFns = () => {
        try { (Element.prototype as any).scrollIntoView = origScrollIntoView; } catch (e) {}
        try { (window as any).scrollTo = origScrollTo; } catch (e) {}
      };

      disableScrollFns();

      const safeRestore = () => {
        restoreScrollFns();
        try {
          drv.destroy();
        } catch (e) {}
      };

      drv.drive();
      setShownPages((prev) => ({ ...prev, [key]: true }));
    },
    [disabledPages, pathname, stepsMap, globalDisabled]
  );

  const registerSteps = useCallback((id: string, steps: DriverStep[]) => {
    setStepsMap((m) => ({ ...m, [id]: steps }));
  }, []);

  const disable = useCallback((key?: string) => {
    setGlobalDisabled(true);
    try {
      localStorage.setItem(GLOBAL_DISABLED_KEY, "1");
    } catch {}
    const k = key || pathname || "global";
    setDisabledPages((prev) => ({ ...prev, [k]: true }));
    try {
      localStorage.setItem(`${DISABLED_KEY}-${k}`, "1");
    } catch {}
  }, [pathname]);

  const enable = useCallback((key?: string) => {
    setGlobalDisabled(false);
    try {
      localStorage.removeItem(GLOBAL_DISABLED_KEY);
    } catch {}
    const k = key || pathname || "global";
    setDisabledPages((prev) => {
      const next = { ...prev };
      delete next[k];
      return next;
    });
    try {
      localStorage.removeItem(`${DISABLED_KEY}-${k}`);
    } catch {}
  }, [pathname]);

  // Auto start logic
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (globalDisabled) return;
    const key = pathname || "global";
    if (disabledPages[key]) return;
    if (shownPages[key]) return;
    const steps = stepsMap[key] || stepsMap["global"];
    if (!steps || steps.length === 0) return;
    const t = setTimeout(() => start(key), 600);
    return () => clearTimeout(t);
  }, [disabledPages, pathname, start, stepsMap, shownPages, globalDisabled]);

  const value = useMemo(
    () => ({ 
      registerSteps, 
      start, 
      disable, 
      enable, 
      disabled: globalDisabled || !!disabledPages[pathname || "global"], 
      hasShownOnce: !!shownPages[pathname || "global"] 
    }),
    [registerSteps, start, disable, enable, globalDisabled, disabledPages, shownPages, pathname]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function useRegisterTourSteps(id: string, steps: DriverStep[]) {
  const { registerSteps } = useTour();
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
