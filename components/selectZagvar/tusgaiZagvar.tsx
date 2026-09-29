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
  /** blockOccupied үед дарахад харуулах тайлбар (ж: «40 — Б. Бат идэвхтэй эзэмшдэг») */
  occupiedNote?: string;
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
  buttonClassName?: string;
  optionClassName?: string;
  dropdownClassName?: string;

  disabled?: boolean;
  // When used on white surfaces, don't inherit themed text colors
  // and use neutral colors for better contrast.
  tone?: "theme" | "neutral";
  allowCustomInput?: boolean;
  /** Эзэмшигчтэй (isOccupied) сонголтыг сонгуулахгүй — дарахад шалтгааныг харуулна. */
  blockOccupied?: boolean;
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
  buttonClassName = "",
  optionClassName = "",
  dropdownClassName = "",
  disabled = false,
  tone = "theme",
  allowCustomInput = false,
  blockOccupied = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  /** Хаагдсан (эзэмшигчтэй) сонголт дээр дарахад гарах тайлбар */
  const [khaaltTailbar, setKhaaltTailbar] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) setKhaaltTailbar(null);
  }, [isOpen]);
  const ref = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const instanceId = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const [portalStyle, setPortalStyle] = useState<{
    top?: string;
    bottom?: string;
    left: string;
    width: string;
    maxHeight: number;
    deeshee: boolean;
  } | null>(null);
  // Combobox: нээгдсэний дараа хэрэглэгч бичсэн үед л шүүнэ. Үгүй бол
  // сонгосон утгаар шүүгдэж ("5" → 5, 15, 25) бусад сул дугаар харагдахгүй.
  const [bichsen, setBichsen] = useState(false);

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
    // Доор зай хүрэлцэхгүй бол (модалын доод хэсэг) дээш нь нээнэ.
    const bairshuulakh = () => {
      const r = el.getBoundingClientRect();
      const doorZai = window.innerHeight - r.bottom - 12;
      const deerZai = r.top - 12;
      const deeshee = doorZai < 220 && deerZai > doorZai;
      const maxHeight = Math.max(120, Math.min(240, (deeshee ? deerZai : doorZai) - 8));
      setPortalStyle({
        ...(deeshee
          ? { bottom: `${window.innerHeight - r.top}px` }
          : { top: `${r.bottom}px` }),
        left: `${r.left}px`,
        width: `${r.width}px`,
        maxHeight,
        deeshee,
      });
    };
    bairshuulakh();

    // Reposition the portal on scroll/resize instead of closing it so the user
    // can scroll the page while the dropdown stays open.
    let raf = 0 as number | null;
    const recalc = () => {
      if (!el) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(bairshuulakh) as unknown as number;
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
    allowCustomInput && trimmedValue && bichsen
      ? mergedOptions.filter(
          (opt) =>
            opt.label.toLowerCase().includes(trimmedValue.toLowerCase()) ||
            opt.value.toLowerCase().includes(trimmedValue.toLowerCase())
        )
      : mergedOptions;

  // Show typed value as the first selectable entry when it is not already an exact match
  const typedCustomEntry =
    allowCustomInput && bichsen && trimmedValue && !mergedOptions.some((opt) => opt.value === trimmedValue)
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
              setBichsen(true);
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
            onFocus={(e) => {
              if (!disabled) {
                setBichsen(false);
                // Сонгосон утгыг бүхэлд нь тэмдэглэнэ — шууд бичээд солино.
                e.currentTarget.select();
                window.dispatchEvent(
                  new CustomEvent("tusgai-select-open", {
                    detail: { id: instanceId.current },
                  })
                );
                setIsOpen(true);
              }
            }}
            className={`w-full h-full px-2.5 bg-transparent border-none outline-none focus:ring-0 text-sm ${
              tone === "neutral" ? "!text-[color:var(--panel-text)]" : "text-theme"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              const next = !isOpen;
              if (next) {
                setBichsen(false);
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
              } ${tone === "neutral" ? "text-[color:var(--muted-text)]" : ""}`}
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
            tone === "neutral" ? "!text-[color:var(--panel-text)]" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${buttonClassName}`}
        >
          <span
            className={`block truncate text-left flex-1 min-w-0 ${
              buttonClassName.includes("font-normal") ? "!font-normal" : ""
            } ${
              tone === "neutral" ? "!text-[color:var(--panel-text)]" : ""
            }`}
          >
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            } ${tone === "neutral" ? "text-[color:var(--muted-text)]" : ""}`}
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
              top: portalStyle?.top,
              bottom: portalStyle?.bottom,
              left: portalStyle?.left ?? "0px",
              visibility: portalStyle ? "visible" : "hidden",
              width: portalStyle?.width ?? "auto",
              // Must be above modal shells (some use z-[12001]+).
              zIndex: 13000,
            } as React.CSSProperties}
          >
            <div
              style={{ maxHeight: portalStyle?.maxHeight ?? 240 }}
              className={`${portalStyle?.deeshee ? "mb-2" : "mt-2"} w-full rounded-2xl overflow-hidden shadow-xl bg-[color:var(--surface-bg)] backdrop-blur-xl border border-white/10 isolate ${
                tone === "neutral"
                  ? "!bg-[color:var(--surface-bg)] !text-[color:var(--panel-text)] !border !border-[color:var(--surface-border)]"
                  : ""
              } ${dropdownClassName}`}
            >
              {khaaltTailbar && (
                <div
                  role="alert"
                  className="border-b border-[color:var(--surface-border)] bg-danger/10 px-4 py-2 text-[12px] leading-snug text-danger whitespace-normal"
                >
                  {khaaltTailbar}
                </div>
              )}
              <ul
                className="py-2 overflow-y-auto custom-scrollbar"
                style={{ maxHeight: (portalStyle?.maxHeight ?? 240) - (khaaltTailbar ? 56 : 0) }}
              >
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
                          ? "text-brand bg-theme/10 hover:bg-theme/10"
                          : "text-brand bg-theme/10 hover:bg-theme/20"
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
                      aria-disabled={blockOccupied && opt.isOccupied ? true : undefined}
                      title={opt.title}
                      onClick={() => {
                        if (opt.disabled) return;
                        if (blockOccupied && opt.isOccupied) {
                          setKhaaltTailbar(
                            opt.occupiedNote ||
                              `${opt.value} идэвхтэй эзэмшигчтэй тул сонгох боломжгүй. Сул дугаар сонгоно уу.`,
                          );
                          return;
                        }
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-all truncate ${
                        opt.disabled
                          ? "opacity-50 cursor-not-allowed text-[color:var(--muted-text)]"
                          : blockOccupied && opt.isOccupied
                          ? "cursor-not-allowed text-[color:var(--muted-text)] opacity-60 before:mr-2 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-danger before:align-middle before:content-['']"
                          : opt.isOccupied
                          ? "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] before:mr-2 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-warning before:align-middle before:content-['']"
                          : tone === "neutral"
                          ? opt.value === value
                            ? " text-[color:var(--panel-text)] bg-[color:var(--surface-hover)]"
                            : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                          : opt.value === value
                          ? " text-theme"
                          : "text-theme hover:bg-black/8"
                      } ${optionClassName}`}
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
