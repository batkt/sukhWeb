'use client';

import { useEffect, useRef } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scriptId = "dotlottie-wc-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.type = "module";
      s.src =
        "https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.5/dist/dotlottie-wc.js";
      s.async = true;
      document.head.appendChild(s);
    }

    const container = bgRef.current;
    if (!container) return;

    const el = document.createElement("dotlottie-wc");
    el.setAttribute(
      "src",
      "https://lottie.host/a344ba9a-6ffc-49c3-95cf-66e9949a4011/Mjr72rR0Yw.lottie"
    );
    el.setAttribute("autoplay", "");
    el.setAttribute("loop", "");
    Object.assign(el.style, {
      width: "140%",
      height: "140%",
      transform: "translate(-10%, -10%)",
      opacity: "0.12",
      mixBlendMode: "screen",
      pointerEvents: "none",
      filter: "saturate(1.05) contrast(1.02)",
    });
    container.appendChild(el);

    return () => {
      try {
        if (container.contains(el)) container.removeChild(el);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <div
        ref={bgRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          display: "block",
          mixBlendMode: "screen",
          WebkitMaskImage: "linear-gradient(180deg, transparent, black 12%)",
        }}
      />
      {children}
    </div>
  );
}
