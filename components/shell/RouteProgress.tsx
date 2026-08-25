"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top-of-viewport progress bar.
 *
 * Replaces the old full-screen blurred overlay, which blocked the UI on every
 * link click and only cleared 150ms *after* the route had already settled.
 * This paints one 2px compositor-only bar and never intercepts pointer events,
 * so the current page stays interactive while the next one loads.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // A settled route means the navigation finished.
  useEffect(() => {
    clearTimers();
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement)?.closest?.("a");
      if (!link || !link.href || link.target || link.hasAttribute("download")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(link.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      setActive(true);
      // Safety net: if the route never resolves, don't leave the bar running.
      timers.current.push(window.setTimeout(() => setActive(false), 8000));
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimers();
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`shell-progress ${active ? "is-active" : ""}`}
      role="presentation"
    />
  );
}
