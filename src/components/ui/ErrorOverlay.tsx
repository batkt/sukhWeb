"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type OpenPayload = { message: string; duration?: number };

const EVENT = "error-overlay:open";

export function openErrorOverlay(message: string, duration = 3000) {
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
  const [duration, setDuration] = useState(3000);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<OpenPayload>;
      const d = ce?.detail || { message: "", duration: 3000 };
      const msg = d.message || "";
      setMessage(msg);
      setDuration(d.duration || 3000);
      // Consider messages with newlines or long text as multiline/error lists and
      // render a larger, non-auto-closing panel.
      const multi =
        typeof msg === "string" && (msg.includes("\n") || msg.length > 300);
      setIsMultiline(multi);
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
    if (isMultiline) {
      // Keep multiline errors visible until user closes
      return;
    }
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

  // If this is a multiline/large error message, show a centered modal with
  // scrollable details and copy/close controls. Otherwise show a small toast
  // in the top-right like before.
  if (isMultiline && open) {
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
        />
        <div className="relative z-10 w-[min(90vw,900px)] max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold">Алдааны жагсаалт</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(message)}
                className="btn-minimal px-3 py-1 text-sm"
              >
                Хуулах
              </button>
              <button
                onClick={() => setOpen(false)}
                className="btn px-3 py-1 text-sm bg-slate-100 rounded"
              >
                Хаах
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-700 overflow-auto max-h-[64vh] p-2 border border-gray-100 rounded">
            {message.split("\n").map((line, i) => (
              <div key={i} className="py-1 border-b last:border-b-0">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>,
      container
    );
  }

  return createPortal(
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="fixed inset-0 z-[10000] pointer-events-none"
    >
      <div className="absolute top-4 md:top-6 right-4 md:right-6 left-auto translate-x-0 flex flex-col items-end gap-2">
        <div
          role="alert"
          onClick={() => setOpen(false)}
          className="menu-surface rounded-2xl shadow-xl px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 w-full max-w-2xl pointer-events-auto cursor-pointer"
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
