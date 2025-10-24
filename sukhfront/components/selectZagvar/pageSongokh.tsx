"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PageSongokh({
  value,
  onChange,
  options = [10, 50, 100],
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  options?: number[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className="page-surface inline-flex items-center gap-2 rounded-2xl text-sm px-3 py-1.5 focus-visible:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-28 page-surface rounded-xl p-1 z-[90]"
        >
          {options.map((opt) => {
            const active = opt === value;
            return (
              <button
                key={opt}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-2xl text-sm transition-colors ${
                  active ? "bg-black/10 font-semibold" : "hover:bg-black/8"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
