"use client";

/**
 * Нэг самбартай сарын хүрээ сонгогч.
 *
 * AntD-ийн RangePicker нь сарын горимд ХОЁР самбар (2026 | 2027) гаргадаг,
 * нэг самбар болгох тохиргоогүй. Энд нэг жилийн 12 сарнаас эхний дарахад
 * эхлэл, хоёр дахь дарахад төгсгөл сонгоно — жил хооронд ‹ › сумаар шилжинэ.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

interface MonthRangePickerProps {
  /** Хүрээний эхлэл/төгсгөлийн огноо (аль ч өдөр байж болно — сар нь тооцогдоно) */
  value?: [string | null, string | null];
  /** Сонгосон сарууд (эрэмбэлсэн), цэвэрлэвэл `null` */
  onChange?: (value: [Dayjs, Dayjs] | null) => void;
  placeholder?: string;
  className?: string;
}

/** Сарын түлхүүр: 2026*12 + 8 гэх мэт — харьцуулахад хялбар */
const tulkhuur = (d: Dayjs) => d.year() * 12 + d.month();

export default function MonthRangePicker({
  value,
  onChange,
  placeholder = "Сар сонгох",
  className = "",
}: MonthRangePickerProps) {
  const ekhlel = value?.[0] ? dayjs(value[0]) : null;
  const tugsgul = value?.[1] ? dayjs(value[1]) : null;

  const [neelttei, setNeelttei] = useState(false);
  const [jil, setJil] = useState(() => (ekhlel || dayjs()).year());
  // Эхний дарсан сар — хоёр дахь дарах хүртэл хүлээнэ
  const [khuleelt, setKhuleelt] = useState<Dayjs | null>(null);
  const [khuulga, setKhuulga] = useState<Dayjs | null>(null);
  const [bairlal, setBairlal] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const khaakh = () => {
    setNeelttei(false);
    setKhuleelt(null);
    setKhuulga(null);
  };

  useLayoutEffect(() => {
    if (!neelttei || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setBairlal({ top: r.bottom + 6, left: r.left });
  }, [neelttei]);

  useEffect(() => {
    if (!neelttei) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      khaakh();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") khaakh();
    };
    // Байрлал `fixed` тул гүйлгэх/хэмжээ өөрчлөгдөхөд хаана
    const onMove = () => khaakh();
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
  }, [neelttei]);

  const neekh = () => {
    setJil((ekhlel || dayjs()).year());
    setNeelttei(true);
  };

  const sarDarakh = (sar: Dayjs) => {
    if (!khuleelt) {
      setKhuleelt(sar);
      return;
    }
    const [a, b] =
      tulkhuur(khuleelt) <= tulkhuur(sar) ? [khuleelt, sar] : [sar, khuleelt];
    onChange?.([a, b]);
    khaakh();
  };

  // Тодруулах хүрээ: сонгож байх үед хүлээлт↔хулгана, үгүй бол одоогийн утга
  const [muj0, muj1] = (() => {
    if (khuleelt) {
      const b = khuulga || khuleelt;
      const x = tulkhuur(khuleelt);
      const y = tulkhuur(b);
      return [Math.min(x, y), Math.max(x, y)];
    }
    if (ekhlel && tugsgul) return [tulkhuur(ekhlel), tulkhuur(tugsgul)];
    return [null, null];
  })();

  const tekst =
    ekhlel && tugsgul
      ? tulkhuur(ekhlel) === tulkhuur(tugsgul)
        ? ekhlel.format("YYYY-MM")
        : `${ekhlel.format("YYYY-MM")} → ${tugsgul.format("YYYY-MM")}`
      : "";

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => (neelttei ? khaakh() : neekh())}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            neekh();
          }
        }}
        className={`group flex h-full w-full cursor-pointer items-center gap-2 text-[13px] ${className}`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
        <span
          className={`min-w-0 flex-1 truncate text-left ${
            tekst ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"
          }`}
        >
          {tekst || placeholder}
        </span>
        {tekst && (
          <button
            type="button"
            aria-label="Цэвэрлэх"
            title="Цэвэрлэх"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.(null);
            }}
            className="shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {neelttei &&
        bairlal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: bairlal.top, left: bairlal.left, zIndex: 13000 }}
            className="w-[272px] rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Өмнөх жил"
                onClick={() => setJil((j) => j - 1)}
                className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[color:var(--panel-text)]">
                {jil} он
              </span>
              <button
                type="button"
                aria-label="Дараах жил"
                onClick={() => setJil((j) => j + 1)}
                className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div
              className="grid grid-cols-3 gap-1"
              onMouseLeave={() => setKhuulga(null)}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const sar = dayjs(new Date(jil, i, 1));
                const k = tulkhuur(sar);
                const tugsgulEsekh = muj0 !== null && (k === muj0 || k === muj1);
                const dundEsekh = muj0 !== null && muj1 !== null && k > muj0 && k < muj1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sarDarakh(sar)}
                    onMouseEnter={() => khuleelt && setKhuulga(sar)}
                    className={`h-9 rounded-lg text-xs transition-colors ${
                      tugsgulEsekh
                        ? "bg-theme font-medium !text-white"
                        : dundEsekh
                          ? "bg-theme/10 text-[color:var(--panel-text)]"
                          : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    {i + 1}-р сар
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-center text-[11px] text-[color:var(--muted-text)]">
              {khuleelt ? "Дуусах сараа сонгоно уу" : "Эхлэх сараа сонгоно уу"}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
