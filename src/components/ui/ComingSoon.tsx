"use client";

import React from "react";

type Props = {
  label?: string;
  description?: string;
  blockClicks?: boolean;
  className?: string;
};

/**
 * Full-surface overlay that shows a "Тун удахгүй" message and blocks user interactions beneath.
 * Usage:
 *   <div className="relative">
 *     ...page content...
 *     <ComingSoon />
 *   </div>
 */
export default function ComingSoon({
  label = "Тун удахгүй",
  description = "Энэ хэсэг удахгүй нээгдэнэ",
  blockClicks = true,
  className = "",
}: Props) {
  return (
    <div
      className={`absolute inset-0 z-[200] flex items-center justify-center ${
        blockClicks ? "pointer-events-auto" : "pointer-events-none"
      } ${className}`}
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-black/30 dark:bg-black/40 backdrop-blur-sm" />
      <div className="relative mx-4 rounded-2xl px-5 py-4 text-center shadow-xl neu-panel">
        <div className="text-sm  tracking-wide text-theme/90 uppercase">
          {label}
        </div>
        <div className="mt-1 text-xs text-theme/70">{description}</div>
      </div>
    </div>
  );
}
