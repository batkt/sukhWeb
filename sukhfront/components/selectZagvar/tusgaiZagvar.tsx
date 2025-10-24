"use client";
import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: Option[]; // optional now
  children?: ReactNode; // support <option> children
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  // When used on white surfaces, don't inherit themed text colors
  // and use neutral colors for better contrast.
  tone?: "theme" | "neutral";
}

export default function TusgaiZagvar({
  value,
  onChange,
  options,
  children,
  placeholder = "Сонгох",
  className = "",
  disabled = false,
  tone = "theme",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Support reading <option> children as fallback
  const childOptions: Option[] = [];
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach((child: any) => {
      if (child?.props?.value !== undefined) {
        childOptions.push({
          value: child.props.value,
          label: child.props.children,
        });
      }
    });
  }

  const mergedOptions = options && options.length > 0 ? options : childOptions;
  const selectedOption = mergedOptions.find((opt) => opt.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`btn-neu w-full justify-between cursor-pointer flex items-center ${
          tone === "neutral"
            ? "!bg-white !text-slate-900 !border !border-gray-300 hover:!bg-gray-50"
            : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`block truncate text-left flex-1 min-w-0 ${
            tone === "neutral" ? "!text-slate-900" : ""
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          } ${tone === "neutral" ? "text-slate-500" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 w-full max-h-60 z-[90] menu-surface rounded-2xl overflow-hidden shadow-lg ${
            tone === "neutral"
              ? "!bg-white !text-slate-900 !border !border-gray-200"
              : ""
          }`}
          role="listbox"
        >
          <ul className="py-2 overflow-y-auto max-h-60">
            {mergedOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors truncate ${
                    tone === "neutral"
                      ? opt.value === value
                        ? "font-semibold text-slate-900 bg-gray-50"
                        : "text-slate-700 hover:bg-gray-50"
                      : opt.value === value
                      ? "font-semibold text-theme"
                      : "text-theme hover:bg-black/8"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
