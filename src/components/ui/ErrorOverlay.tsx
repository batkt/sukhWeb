"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type OpenPayload = { message: string; duration?: number };

const EVENT = "error-overlay:open";

export function openErrorOverlay(message: string, duration = 1800) {
  if (typeof window !== "undefined") {
    const ev = new CustomEvent<OpenPayload>(EVENT, {
      detail: { message, duration },
    } as any);
    window.dispatchEvent(ev);
  }
}

export function ErrorOverlayHost() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(1800);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<OpenPayload>;
      const d = ce?.detail || { message: "", duration: 1800 };
      setMessage(d.message || "");
      setDuration(d.duration || 1800);
      setOpen(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener(EVENT, handler as any);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(EVENT, handler as any);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(t);
  }, [open, duration]);

  // Resolve a stable portal container inside the React tree to avoid hydration mismatches
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("portal-root") as HTMLElement | null;
    setContainer(el || document.body);
  }, []);

  if (!container) return null;

  return createPortal(
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed inset-0 z-[3001] pointer-events-none"
    >
      <div className="absolute top-4 md:top-6 right-4 md:right-6 left-auto translate-x-0 flex flex-col items-end gap-2">
        <div
          role="alert"
          onClick={() => setOpen(false)}
          className="menu-surface rounded-2xl shadow-xl px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 max-w-sm pointer-events-auto cursor-pointer"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 pointer-events-none select-none">
            <DotLottieReact
              src="https://lottie.host/5aea1127-81c6-4443-9827-de127a822b22/mktUID9WY2.lottie"
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="text-sm md:text-base font-semibold text-theme">
            {message}
          </div>
        </div>
      </div>
    </div>,
    container
  );
}
