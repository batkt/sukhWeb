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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed inset-0 z-[2201] pointer-events-none"
    >
      <div className="absolute top-4 left-1/2 md:top-6 -translate-x-1/2 flex flex-col items-center gap-2">
        <div
          role="alert"
          onClick={() => setOpen(false)}
          className="menu-surface rounded-2xl shadow-xl px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 max-w-sm pointer-events-auto cursor-pointer"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
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
    document.body
  );
}
