"use client";

import React from "react";
import { cn } from "@/lib/utils";

function pageWindow(current: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const push = (p: number | string) => pages.push(p);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
    return pages;
  }
  push(1);
  if (current > 4) push("…l");
  for (
    let i = Math.max(2, current - 2);
    i <= Math.min(totalPages - 1, current + 2);
    i++
  )
    push(i);
  if (current < totalPages - 3) push("…r");
  push(totalPages);
  return pages;
}

export type PaginationProps = {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: (string | number)[];
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  size?: "small" | "middle" | "large";
  disabled?: boolean;
  className?: string;
};

export default function Pagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal,
  size,
  disabled,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === current) return;
    onChange(p, pageSize);
  };
  const small = size === "small";

  // Одоогийн хуудасны хэмжээ жагсаалтад байхгүй бол нэмж эрэмбэлнэ —
  // эс бөгөөс select утгагүй (хоосон) харагдана.
  const sizeOptions = React.useMemo(() => {
    const opts = pageSizeOptions.map((o) => Number(o));
    if (!opts.includes(Number(pageSize))) opts.push(Number(pageSize));
    return opts.sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  const defaultTotal = (t: number, range: [number, number]) => (
    <>
      Нийт <span className="font-medium text-[hsl(var(--zt-fg))]">{t}</span> мөрөөс{" "}
      {range[0]}–{range[1]}
    </>
  );
  const renderTotal = showTotal || defaultTotal;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-1.5 px-1 py-1.5 text-[11px]",
        className
      )}
    >
      <span className="mr-auto text-[11px] text-[hsl(var(--zt-muted-fg))]">
        {renderTotal(total, [
          total === 0 ? 0 : (current - 1) * pageSize + 1,
          Math.min(current * pageSize, total),
        ])}
      </span>
      <button
        type="button"
        aria-label="previous page"
        disabled={disabled || current <= 1}
        onClick={() => go(current - 1)}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-[hsl(var(--zt-input))] bg-[hsl(var(--zt-card))] text-[hsl(var(--zt-muted-fg))] transition-colors hover:border-[hsl(var(--zt-primary)/0.6)] hover:text-[hsl(var(--zt-primary))] disabled:pointer-events-none disabled:opacity-40",
          small ? "h-6 w-6" : "h-7 w-7"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {pageWindow(current, totalPages).map((p) =>
        typeof p === "string" ? (
          <span key={p} className="px-1 text-[hsl(var(--zt-muted-fg))]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => go(p)}
            className={cn(
              "inline-flex min-w-7 items-center justify-center rounded-md border px-1.5 text-[11px] transition-colors",
              small ? "h-6" : "h-7",
              p === current
                ? "border-[hsl(var(--zt-primary))] bg-[hsl(var(--zt-primary)/0.1)] font-medium text-[hsl(var(--zt-primary))]"
                : "border-[hsl(var(--zt-input))] bg-[hsl(var(--zt-card))] text-[hsl(var(--zt-fg))] hover:border-[hsl(var(--zt-primary)/0.6)] hover:text-[hsl(var(--zt-primary))]"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        aria-label="next page"
        disabled={disabled || current >= totalPages}
        onClick={() => go(current + 1)}
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-[hsl(var(--zt-input))] bg-[hsl(var(--zt-card))] text-[hsl(var(--zt-muted-fg))] transition-colors hover:border-[hsl(var(--zt-primary)/0.6)] hover:text-[hsl(var(--zt-primary))] disabled:pointer-events-none disabled:opacity-40",
          small ? "h-6 w-6" : "h-7 w-7"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 -rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showSizeChanger && (
        <span className="relative hidden sm:inline-flex">
          <select
            aria-label="page size"
            disabled={disabled}
            value={pageSize}
            onChange={(e) => onChange(1, Number(e.target.value))}
            className={cn(
              "appearance-none cursor-pointer rounded-md border border-[hsl(var(--zt-input))] bg-[hsl(var(--zt-card))] pl-2 pr-6 text-[11px] text-[hsl(var(--zt-fg))] outline-none transition-colors hover:border-[hsl(var(--zt-primary)/0.6)]",
              small ? "h-6" : "h-7"
            )}
          >
            {sizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / хуудас
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-[hsl(var(--zt-muted-fg))]">
            ▾
          </span>
        </span>
      )}
    </div>
  );
}
