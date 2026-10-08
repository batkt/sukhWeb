"use client";

import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface MultiFilterSelectOption {
  value: string;
  label: string;
  tailbar?: string;
}

interface MultiFilterSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiFilterSelectOption[];
  placeholder?: string;
  allSelectedLabel?: string;
  allowClear?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

function bairlalBodokh(r: DOMRect) {
  const zai = 8;
  const width = Math.min(Math.max(r.width, 280), window.innerWidth - zai * 2);
  let left = r.left;
  if (left + width > window.innerWidth - zai)
    left = Math.max(zai, r.right - width);
  return { top: r.bottom + 6, left, width };
}

export default function MultiFilterSelect({
  label = "",
  value = [],
  onChange,
  options = [],
  placeholder = "Сонгох...",
  allSelectedLabel,
  allowClear = true,
  searchable = true,
  searchPlaceholder = "Хайх...",
  className = "",
  style,
  id,
}: MultiFilterSelectProps) {
  const [neelttei, setNeelttei] = useState(false);
  const [khaikh, setKhaikh] = useState("");
  const [bairlal, setBairlal] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const jagsaaltId = useId();
  const defaultWidthClass = /(^|\s)(w|min-w|max-w)-/.test(className)
    ? ""
    : "w-fit";

  const khaakh = () => {
    setNeelttei(false);
    setKhaikh("");
  };

  const neekh = () => {
    setNeelttei(true);
  };

  useLayoutEffect(() => {
    if (!neelttei || !triggerRef.current) return;
    setBairlal(bairlalBodokh(triggerRef.current.getBoundingClientRect()));
  }, [neelttei]);

  useEffect(() => {
    if (!neelttei) return;
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0);

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t))
        return;
      khaakh();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") khaakh();
    };

    const onMove = (e: Event) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t))
        return;
      if (triggerRef.current) {
        setBairlal(bairlalBodokh(triggerRef.current.getBoundingClientRect()));
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [neelttei, searchable]);

  const shuugdsen = useMemo(() => {
    const q = khaikh.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.tailbar || "").toLowerCase().includes(q),
    );
  }, [options, khaikh]);

  const toggleItem = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const displayText = useMemo(() => {
    if (value.length === 0) return placeholder;
    if (
      allSelectedLabel &&
      options.length > 1 &&
      value.length === options.length
    ) {
      return allSelectedLabel;
    }
    if (value.length === 1) {
      const found = options.find((o) => o.value === value[0]);
      return found?.label || value[0];
    }
    const firstFound = options.find((o) => o.value === value[0]);
    const firstLabel = firstFound?.label || value[0];
    return `${firstLabel} (+${value.length - 1})`;
  }, [value, options, placeholder, allSelectedLabel]);

  return (
    <>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        aria-expanded={neelttei}
        aria-controls={jagsaaltId}
        tabIndex={0}
        onClick={() => {
          if (!neelttei) neekh();
          else khaakh();
        }}
        onKeyDown={(e) => {
          if (
            !neelttei &&
            (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
          ) {
            e.preventDefault();
            neekh();
          }
        }}
        style={style}
        className={`filter-field cursor-pointer text-left select-none ${
          value.length > 0 && allowClear ? "is-active" : ""
        } ${defaultWidthClass} ${className}`}
      >
        {label && <span className="filter-field-label">{label}</span>}
        <span
          className={`min-w-0 flex-1 truncate text-[13px] ${
            value.length > 0
              ? "text-[color:var(--panel-text)] font-medium"
              : "text-[color:var(--muted-text)]"
          }`}
          title={displayText}
        >
          {displayText}
        </span>

        {value.length > 1 && (
          <span className="shrink-0 bg-theme/10 text-brand text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
            {value.length}
          </span>
        )}

        {value.length > 0 && allowClear ? (
          <span
            role="button"
            aria-label="Цэвэрлэх"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-[color:var(--muted-text)] transition-transform ${
              neelttei ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {neelttei &&
        bairlal &&
        createPortal(
          <div
            ref={popoverRef}
            id={jagsaaltId}
            role="listbox"
            style={{
              position: "fixed",
              top: bairlal.top,
              left: bairlal.left,
              width: bairlal.width,
              zIndex: 100050,
            }}
            className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-2 shadow-2xl space-y-2 select-none"
          >
            {/* Search and Quick Actions */}
            <div className="space-y-1.5">
              {searchable && options.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] pointer-events-none" />
                  <input
                    ref={searchRef}
                    value={khaikh}
                    onChange={(e) => setKhaikh(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-[color:var(--surface-hover)]/60 border border-[color:var(--surface-border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-theme text-[color:var(--panel-text)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between px-1 text-[11px] text-[color:var(--muted-text)]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-brand hover:underline font-medium"
                >
                  {value.length === options.length && options.length > 0
                    ? "Бүгдийг арилгах"
                    : "Бүгдийг сонгох"}
                </button>
                <span>
                  {value.length} / {options.length} сонгосон
                </span>
              </div>
            </div>

            {/* List of Options */}
            <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
              {shuugdsen.map((o) => {
                const isSelected = value.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleItem(o.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                      isSelected
                        ? "bg-theme/10 text-brand font-medium"
                        : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-theme border-theme text-white"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{o.label}</span>
                    </div>
                    {o.tailbar && (
                      <span className="shrink-0 text-xs text-[color:var(--muted-text)]">
                        {o.tailbar}
                      </span>
                    )}
                  </button>
                );
              })}

              {shuugdsen.length === 0 && (
                <div className="px-2.5 py-3 text-center text-xs text-[color:var(--muted-text)]">
                  Олдсонгүй
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
