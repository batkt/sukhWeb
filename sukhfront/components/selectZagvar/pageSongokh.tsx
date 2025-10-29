"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ bottom: 0, right: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: window.innerHeight - rect.top + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const dropdown = open && (
    <div
      ref={dropdownRef}
      role="listbox"
      className="fixed w-28 page-surface rounded-xl p-1 shadow-lg z-[9999]"
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="option"
            aria-selected={active}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
  );

  return (
    <>
      <div ref={ref} className={`relative ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          className="page-surface inline-flex items-center gap-2 rounded-2xl text-sm px-3 py-1.5 focus-visible:outline-none"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {value}
          <ChevronDown className="w-4 h-4 transform rotate-180" />
        </button>
      </div>

      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
