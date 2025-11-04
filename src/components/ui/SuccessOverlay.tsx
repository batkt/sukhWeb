"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
// Use a simple SVG instead of a Lottie animation for a minimal, non-animated success indicator

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
  const [container, setContainer] = useState<HTMLElement | null>(null);

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

  // Resolve a stable portal container inside the React tree to avoid hydration mismatches
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("portal-root") as HTMLElement | null;
    setContainer(el || document.body);
  }, []);

  if (!container) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 z-[3000] pointer-events-none"
    >
      <div className="absolute top-4 md:top-6 right-4 md:right-6 left-auto translate-x-0 flex flex-col items-end gap-2">
        <div
          role="status"
          onClick={() => setOpen(false)}
          className="menu-surface rounded-2xl shadow-xl px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 max-w-sm pointer-events-auto cursor-pointer"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 pointer-events-none select-none flex items-center justify-center">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="12"
                fill="var(--success-bg, #ecfdf5)"
              />
              <path
                d="M7 12.5l2.5 2.5L17 8"
                stroke="var(--success, #0f766e)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
