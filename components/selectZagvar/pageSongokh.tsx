"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

export default function PageSongokh({
  value,
  onChange,
  options = [50, 100, 500, 1000],
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  options?: number[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0, width: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Temporary position before measuring dropdown height
      setPosition({
        top: rect.top, // will adjust later
        right: window.innerWidth - rect.right,
        width: rect.width,
      });

      // Wait for dropdown to render to measure its height
      requestAnimationFrame(() => {
        if (dropdownRef.current) {
          const dropdownHeight = dropdownRef.current.offsetHeight;
          // Position dropdown above the button
          setPosition({
            top: rect.top - dropdownHeight - 8,
            right: window.innerWidth - rect.right,
            width: rect.width,
          });
        }
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
      className="fixed page-surface rounded-xl p-1 shadow-lg z-[9999]"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: position.width ? `${position.width}px` : undefined,
        minWidth: 0,
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
            className={`w-full text-left px-3 py-1 rounded-2xl text-sm transition-colors ${
              active ? "bg-black/10 " : "hover:bg-black/8"
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
          className={`page-surface inline-flex items-center gap-2 rounded-2xl text-sm px-3 py-1.5 focus-visible:outline-none ${className}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {value}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
