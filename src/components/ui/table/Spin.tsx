"use client";

import React from "react";
import { cn } from "@/lib/utils";

function Spinner({
  size = "default",
  className,
}: {
  size?: "small" | "default" | "large";
  className?: string;
}) {
  const px =
    size === "small" ? "h-4 w-4" : size === "large" ? "h-8 w-8" : "h-6 w-6";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin text-[hsl(var(--zt-primary))]", px, className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Spin({
  spinning = true,
  size = "default",
  tip,
  className,
  wrapperClassName,
  children,
  ...rest
}: {
  spinning?: boolean;
  size?: "small" | "default" | "large";
  tip?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (children === undefined) {
    if (!spinning) return null;
    return (
      <div
        className={cn("inline-flex flex-col items-center gap-2", className)}
        {...rest}
      >
        <Spinner size={size} />
        {tip && (
          <div className="text-sm text-[hsl(var(--zt-muted-fg))]">{tip}</div>
        )}
      </div>
    );
  }
  return (
    <div className={cn("relative", wrapperClassName)} {...rest}>
      {spinning && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[hsl(var(--zt-card)/0.6)] backdrop-blur-[1px]">
          <Spinner size={size} />
          {tip && (
            <div className="text-sm text-[hsl(var(--zt-muted-fg))]">{tip}</div>
          )}
        </div>
      )}
      <div
        className={cn(
          spinning && "pointer-events-none select-none opacity-60",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
