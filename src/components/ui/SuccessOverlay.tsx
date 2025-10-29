"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type OpenPayload = { message: string; duration?: number };

const EVENT = "success-overlay:open";

export function openSuccessOverlay(message: string, duration = 1600) {
  if (typeof window !== "undefined") {
    const ev = new CustomEvent<OpenPayload>(EVENT, {
      detail: { message, duration },
    } as any);
    window.dispatchEvent(ev);
  }
}

export function SuccessOverlayHost() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(1600);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<OpenPayload>;
      const d = ce?.detail || { message: "", duration: 1600 };
      setMessage(d.message || "");
      setDuration(d.duration || 1600);
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
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 z-[2200] pointer-events-none"
    >
      <div className="absolute top-4 left-1/2 md:top-6 -translate-x-1/2 flex flex-col items-center gap-2">
        <div
          role="status"
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
              src="https://lottie.host/1e137598-a331-458b-9385-c1ff5fd7bf8d/6jwr8TV0n5.lottie"
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
