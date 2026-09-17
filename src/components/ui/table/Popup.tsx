"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type PopupPlacement =
  | "bottomLeft"
  | "bottom"
  | "bottomRight"
  | "top"
  | "topLeft"
  | "topRight";

type PopupProps = {
  open?: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
  onClose?: (e: Event | KeyboardEvent) => void;
  placement?: PopupPlacement;
  matchAnchorWidth?: boolean;
  offset?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

// Portal popup positioned to an anchor element.
export default function Popup({
  open,
  anchorRef,
  onClose,
  placement = "bottomLeft",
  matchAnchorWidth = false,
  offset = 4,
  className,
  style: styleProp,
  children,
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    visibility: "hidden",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const position = () => {
    const anchor = anchorRef && anchorRef.current;
    const popup = popupRef.current;
    if (!anchor || !popup) return;
    const rect = anchor.getBoundingClientRect();
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;

    const wantsTop = placement.startsWith("top");
    const fitsBelow = rect.bottom + offset + ph <= vh;
    const fitsAbove = rect.top - offset - ph >= 0;
    const showAbove = wantsTop ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
    const top = showAbove
      ? rect.top + sy - ph - offset
      : rect.bottom + sy + offset;

    let left: number;
    if (placement.endsWith("Right")) left = rect.right + sx - pw;
    else if (placement === "bottom" || placement === "top")
      left = rect.left + sx + rect.width / 2 - pw / 2;
    else left = rect.left + sx;
    left = Math.min(Math.max(left, sx + 8), sx + vw - pw - 8);

    const next: React.CSSProperties = { top, left, visibility: "visible" };
    if (matchAnchorWidth) next.minWidth = rect.width;
    // Агуулгаараа өргөссөн попап цонхны хүрээнээс хальж, зүүн талаараа
    // тасарч болзошгүй — иймд дэлгэцийн өргөнөөр таглана.
    next.maxWidth = Math.max(160, vw - 16);

    setStyle((prev) =>
      prev.top === next.top &&
      prev.left === next.left &&
      prev.visibility === next.visibility &&
      prev.minWidth === next.minWidth &&
      prev.maxWidth === next.maxWidth
        ? prev
        : next
    );
  };

  useIsoLayoutEffect(() => {
    if (!open || !mounted) return undefined;
    position();

    const onScroll = (e: Event) => {
      const popup = popupRef.current;
      const target = e?.target as Node | null;
      if (popup && target && (target as any).nodeType && popup.contains(target))
        return;
      position();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && popupRef.current) {
      ro = new ResizeObserver(() => position());
      ro.observe(popupRef.current);
    }

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (ro) ro.disconnect();
    };
  }, [open, mounted, children]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose(e);
    };
    const onDown = (e: MouseEvent) => {
      const anchor = anchorRef && anchorRef.current;
      const popup = popupRef.current;
      const target = e.target as Node;
      if (popup && popup.contains(target)) return;
      if (anchor && anchor.contains(target)) return;
      if (onClose) onClose(e);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose, anchorRef]);

  if (!mounted || !open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{ position: "absolute", zIndex: 1100, ...style, ...styleProp }}
      className={cn(
        "zt-popup-in rounded-md border border-[hsl(var(--zt-border))] bg-[hsl(var(--zt-card))] text-[hsl(var(--zt-fg))] shadow-md",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
