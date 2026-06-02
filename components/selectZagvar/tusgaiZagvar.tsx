"use client";
import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  title?: string;
  isOccupied?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: Option[]; // optional now
  children?: ReactNode; // support <option> children
  placeholder?: string;
  data?: string;
  required?: boolean;
  className?: string;

  disabled?: boolean;
  // When used on white surfaces, don't inherit themed text colors
  // and use neutral colors for better contrast.
  tone?: "theme" | "neutral";
  allowCustomInput?: boolean;
}

export default function TusgaiZagvar({
  value,
  onChange,
  options,
  children,
  data,
  placeholder = "Сонгох",
  required = false,
  className = "",
  disabled = false,
  tone = "theme",
  allowCustomInput = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const [portalStyle, setPortalStyle] = useState<{
    top: string;
    left: string;
    width: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideTrigger = ref.current && ref.current.contains(target);
      const clickedInsidePortal =
        portalRef.current && portalRef.current.contains(target);
      if (!clickedInsideTrigger && !clickedInsidePortal) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Position the portal dropdown when opened
  useLayoutEffect(() => {
    if (!isOpen) {
      setPortalStyle(null);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPortalStyle({ 
      top: `${r.bottom}px`, 
      left: `${r.left}px`, 
      width: `${r.width}px` 
    });

    // Reposition the portal on scroll/resize instead of closing it so the user
    // can scroll the page while the dropdown stays open.
    let raf = 0 as number | null;
    const recalc = () => {
      if (!el) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r2 = el.getBoundingClientRect();
        setPortalStyle({ 
          top: `${r2.bottom}px`, 
          left: `${r2.left}px`, 
          width: `${r2.width}px` 
        });
      }) as unknown as number;
    };

    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isOpen]);

  // Ensure only one custom select is open at a time across the page
  useEffect(() => {
    const onAnotherOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string } | undefined;
      if (detail?.id && detail.id !== instanceId.current) {
        setIsOpen(false);
      }
    };
    window.addEventListener(
      "tusgai-select-open",
      onAnotherOpen as EventListener
    );
    return () =>
      window.removeEventListener(
        "tusgai-select-open",
        onAnotherOpen as EventListener
      );
  }, []);

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

  const trimmedValue = value.trim();

  // Filter list while typing (combobox behaviour)
  const filteredOptions =
    allowCustomInput && trimmedValue
      ? mergedOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(trimmedValue.toLowerCase()) ||
            opt.value.toLowerCase().includes(trimmedValue.toLowerCase())
        )
      : mergedOptions;

  // Show typed value as the first selectable entry when it is not already an exact match
  const typedCustomEntry =
    allowCustomInput && trimmedValue && !mergedOptions.some((opt) => opt.value === trimmedValue)
      ? { value: trimmedValue, label: trimmedValue }
      : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {allowCustomInput ? (
        <div className="w-full h-full flex items-center justify-between">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (!disabled && !isOpen) {
                window.dispatchEvent(
                  new CustomEvent("tusgai-select-open", {
                    detail: { id: instanceId.current },
                  })
                );
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            onFocus={() => {
              if (!disabled) {
                window.dispatchEvent(
                  new CustomEvent("tusgai-select-open", {
                    detail: { id: instanceId.current },
                  })
                );
                setIsOpen(true);
              }
            }}
            className={`w-full h-full px-2.5 bg-transparent border-none outline-none focus:ring-0 text-sm ${
              tone === "neutral" ? "!text-slate-900" : "text-theme"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              const next = !isOpen;
              if (next) {
                window.dispatchEvent(
                  new CustomEvent("tusgai-select-open", {
                    detail: { id: instanceId.current },
                  })
                );
              }
              setIsOpen(next);
            }}
            disabled={disabled}
            className="h-full px-2 flex items-center justify-center cursor-pointer border-none bg-transparent"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              } ${tone === "neutral" ? "text-slate-500" : ""}`}
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            const next = !isOpen;
            if (next) {
              window.dispatchEvent(
                new CustomEvent("tusgai-select-open", {
                  detail: { id: instanceId.current },
                })
              );
            }
            setIsOpen(next);
          }}
          disabled={disabled}
          className={`btn-minimal w-full justify-between cursor-pointer flex items-center h-full ${
            tone === "neutral" ? "!text-slate-900" : ""
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
      )}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={portalRef}
            role="listbox"
            style={{
              position: "fixed",
              top: portalStyle?.top ?? "0px",
              left: portalStyle?.left ?? "0px",
              width: portalStyle?.width ?? "auto",
              // Must be above modal shells (some use z-[12001]+).
              zIndex: 13000,
            } as React.CSSProperties}
          >
            <div
              className={`mt-2 w-full max-h-60 rounded-2xl overflow-hidden shadow-xl bg-[color:var(--surface-bg)] backdrop-blur-xl border border-white/10 isolate ${
                tone === "neutral"
                  ? "!bg-white !text-slate-900 !border !border-gray-200"
                  : ""
              }`}
            >
              <ul className="py-2 overflow-y-auto max-h-60 custom-scrollbar">
                {typedCustomEntry && (
                  <li key="__custom__">
                    <button
                      type="button"
                      role="option"
                      aria-selected={true}
                      onClick={() => {
                        onChange(typedCustomEntry.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-all truncate font-semibold ${
                        tone === "neutral"
                          ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                          : "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                      }`}
                    >
                      {typedCustomEntry.label}
                    </button>
                  </li>
                )}
                {filteredOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={opt.value === value}
                      disabled={opt.disabled}
                      title={opt.title}
                      onClick={() => {
                        if (opt.disabled) return;
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-all truncate ${
                        opt.disabled
                          ? "opacity-50 cursor-not-allowed text-gray-400"
                          : opt.isOccupied
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/20"
                          : tone === "neutral"
                          ? opt.value === value
                            ? " text-slate-900 bg-gray-50"
                            : "text-slate-700 hover:bg-gray-50"
                          : opt.value === value
                          ? " text-theme"
                          : "text-theme hover:bg-black/8"
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
