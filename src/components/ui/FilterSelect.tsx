"use client";

/**
 * Хуудасны шүүлтүүрийн dropdown — `.filter-field` загвартай (шошго дотроо).
 *
 * Хөтчийн native `<select>` нь OS бүрд өөр харагддаг, хайлтгүй. Энэ нь
 * FilterDatePicker / MonthRangePicker-тэй ижил popover-той, хүсвэл
 * хайлттай. Popover нь `document.body`-д portal-аар гарна — хүснэгтийн
 * sticky толгой (z-index) popover-ыг дарахгүй.
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label: string;
  /** Нэмэлт саарал бичвэр (тоот, утас гэх мэт) */
  tailbar?: string;
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  /** Сонгоогүй үеийн бичвэр. Анхдагч: хоосон — зөвхөн шошго харагдана */
  placeholder?: string;
  /** Жагсаалтын эхэнд сонголтыг цэвэрлэх мөрийн бичвэр */
  bugdLabel?: string;
  /** Жагсаалт дотор хайх талбар */
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  id?: string;
}

export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "",
  bugdLabel = "Бүгд",
  searchable = false,
  searchPlaceholder = "Хайх...",
  className = "",
  id,
}: FilterSelectProps) {
  const [neelttei, setNeelttei] = useState(false);
  const [khaikh, setKhaikh] = useState("");
  const [bairlal, setBairlal] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const songogdson = options.find((o) => o.value === value);

  const khaakh = () => {
    setNeelttei(false);
    setKhaikh("");
  };

  useLayoutEffect(() => {
    if (!neelttei || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setBairlal({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 220) });
  }, [neelttei]);

  useEffect(() => {
    if (!neelttei) return;
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      khaakh();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") khaakh();
    };
    const onMove = (e: Event) => {
      // Жагсаалт доторх гүйлт popover-ыг хаах ёсгүй
      if (popoverRef.current?.contains(e.target as Node)) return;
      khaakh();
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
      (o) => o.label.toLowerCase().includes(q) || (o.tailbar || "").toLowerCase().includes(q),
    );
  }, [options, khaikh]);

  const songokh = (v: string) => {
    onChange(v);
    khaakh();
  };

  const mur = (v: string, lbl: string, tailbar?: string) => {
    const idevkhtei = v === value;
    return (
      <button
        key={v || "__bugd"}
        type="button"
        onClick={() => songokh(v)}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-hover)] ${
          idevkhtei ? "text-brand" : "text-[color:var(--panel-text)]"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{lbl}</span>
        {tailbar && (
          <span className="shrink-0 text-xs text-[color:var(--muted-text)]">{tailbar}</span>
        )}
        <Check className={`h-3.5 w-3.5 shrink-0 ${idevkhtei ? "opacity-100" : "opacity-0"}`} />
      </button>
    );
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={() => (neelttei ? khaakh() : setNeelttei(true))}
        className={`filter-field cursor-pointer text-left ${value ? "is-active" : ""} ${className}`}
      >
        <span className="filter-field-label">{label}</span>
        <span
          className={`min-w-0 truncate text-[13px] ${
            songogdson ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"
          }`}
        >
          {songogdson?.label || placeholder}
        </span>
        {value ? (
          <span
            role="button"
            aria-label="Цэвэрлэх"
            onClick={(e) => {
              e.stopPropagation();
              songokh("");
            }}
            className="shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[color:var(--muted-text)] transition-transform ${
              neelttei ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {neelttei &&
        bairlal &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: bairlal.top, left: bairlal.left, width: bairlal.width, zIndex: 9999 }}
            className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1.5 shadow-xl"
          >
            {searchable && (
              <div className="mb-1 flex h-8 items-center gap-2 rounded-lg border border-[color:var(--ctl-border)] px-2.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted-text)]" />
                <input
                  ref={searchRef}
                  value={khaikh}
                  onChange={(e) => setKhaikh(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[color:var(--panel-text)] outline-none placeholder:text-[color:var(--muted-text)]"
                />
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              {!khaikh && mur("", bugdLabel)}
              {shuugdsen.map((o) => mur(o.value, o.label, o.tailbar))}
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
