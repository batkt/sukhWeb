"use client";

/**
 * Нэг самбартай өдрийн хүрээ сонгогч.
 *
 * AntD-ийн RangePicker нь ХОЁР сарын самбар гаргадаг, нэг самбар болгох
 * тохиргоогүй. Энд нэг сарын хуанлиас эхний дарахад эхлэл, хоёр дахь
 * дарахад төгсгөл сонгоно — сар хооронд ‹ ›, жил хооронд « » сумаар шилжинэ.
 * MonthRangePicker-тэй ижил загвартай.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";

interface DayRangePickerProps {
  value?: [string | null, string | null];
  /** Сонгосон өдрүүд (эрэмбэлсэн), цэвэрлэвэл `null` */
  onChange?: (value: [Dayjs, Dayjs] | null) => void;
  /** [эхлэл, төгсгөл] — ганц мөр өгвөл анхдагч «Эхлэх огноо → Дуусах огноо» */
  placeholder?: string | [string, string];
  /** Харуулах формат. Анхдагч: YYYY-MM-DD */
  format?: string;
  disabledDate?: (d: Dayjs) => boolean;
  allowClear?: boolean;
  className?: string;
}

const GARAGUUD = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

/** Өдрийн түлхүүр — харьцуулахад хялбар */
const tulkhuur = (d: Dayjs) => d.year() * 10000 + d.month() * 100 + d.date();

export default function DayRangePicker({
  value,
  onChange,
  placeholder,
  format = "YYYY-MM-DD",
  disabledDate,
  allowClear = true,
  className = "",
}: DayRangePickerProps) {
  const ekhlel = value?.[0] ? dayjs(value[0]) : null;
  const tugsgul = value?.[1] ? dayjs(value[1]) : null;

  const [neelttei, setNeelttei] = useState(false);
  const [sar, setSar] = useState(() => (ekhlel || dayjs()).startOf("month"));
  // Эхний дарсан өдөр — хоёр дахь дарах хүртэл хүлээнэ
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
    const urgun = 300;
    setBairlal({
      top: r.bottom + 6,
      left: Math.max(8, Math.min(r.left - 12, window.innerWidth - urgun - 8)),
    });
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
    // Байрлал `fixed` — гүйлгэх/хэмжээ өөрчлөгдөхөд хаахгүй, товчоо дагаж
    // шилжинэ. Хуудас доторх ямар нэг гүйлгэлт (хүснэгт, sticky толгой)
    // scroll үйл явдал цацахад нээгдмэгц хаагдаж, «нээгдэхгүй» мэт болдог байв.
    const onMove = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return khaakh();
      const top = r.bottom + 6;
      const left = Math.max(8, Math.min(r.left - 12, window.innerWidth - 300 - 8));
      setBairlal((p) => (p && p.top === top && p.left === left ? p : { top, left }));
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
  }, [neelttei]);

  const neekh = () => {
    setSar((ekhlel || dayjs()).startOf("month"));
    setNeelttei(true);
  };

  const udurDarakh = (d: Dayjs) => {
    if (!khuleelt) {
      setKhuleelt(d);
      return;
    }
    const [a, b] = tulkhuur(khuleelt) <= tulkhuur(d) ? [khuleelt, d] : [d, khuleelt];
    onChange?.([a.startOf("day"), b.startOf("day")]);
    khaakh();
  };

  // Тодруулах хүрээ: сонгож байх үед хүлээлт↔хулгана, үгүй бол одоогийн утга
  const [muj0, muj1] = (() => {
    if (khuleelt) {
      const x = tulkhuur(khuleelt);
      const y = tulkhuur(khuulga || khuleelt);
      return [Math.min(x, y), Math.max(x, y)];
    }
    if (ekhlel && tugsgul) return [tulkhuur(ekhlel), tulkhuur(tugsgul)];
    return [null, null];
  })();

  const tekst = ekhlel || tugsgul;
  const [ekhlelPlaceholder, tugsgulPlaceholder] = Array.isArray(placeholder)
    ? placeholder
    : ["Эхлэх огноо", "Дуусах огноо"];

  // 6×7 сүлжээ — сарын эхний өдрийн гарагаас эхэлнэ
  const ekhniiNud = sar.subtract(sar.day(), "day");
  const nuduud = Array.from({ length: 42 }, (_, i) => ekhniiNud.add(i, "day"));
  const unuudur = tulkhuur(dayjs());

  const sumKlass =
    "rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]";

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
        <span className="flex min-w-0 flex-1 items-center gap-2 tabular-nums">
          <span className={`min-w-0 flex-1 truncate text-left ${ekhlel ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"}`}>
            {ekhlel ? ekhlel.format(format) : ekhlelPlaceholder}
          </span>
          <span className="shrink-0 text-[color:var(--muted-text)]">→</span>
          <span className={`min-w-0 flex-1 truncate text-left ${tugsgul ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"}`}>
            {tugsgul ? tugsgul.format(format) : tugsgulPlaceholder}
          </span>
        </span>
        {allowClear && tekst && (
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
            style={{ position: "fixed", top: bairlal.top, left: bairlal.left, zIndex: 10000100 }}
            className="w-[300px] rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex">
                <button type="button" aria-label="Өмнөх жил" onClick={() => setSar((s) => s.subtract(1, "year"))} className={sumKlass}>
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Өмнөх сар" onClick={() => setSar((s) => s.subtract(1, "month"))} className={sumKlass}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-medium text-[color:var(--panel-text)]">
                {sar.year()} оны {sar.month() + 1}-р сар
              </span>
              <div className="flex">
                <button type="button" aria-label="Дараах сар" onClick={() => setSar((s) => s.add(1, "month"))} className={sumKlass}>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Дараах жил" onClick={() => setSar((s) => s.add(1, "year"))} className={sumKlass}>
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7">
              {GARAGUUD.map((g) => (
                <div key={g} className="flex h-8 items-center justify-center text-[11px] text-[color:var(--muted-text)]">
                  {g}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setKhuulga(null)}>
              {nuduud.map((d) => {
                const k = tulkhuur(d);
                const ennSar = d.month() === sar.month();
                const idevkhgui = disabledDate?.(d) ?? false;
                const tugsgulEsekh = muj0 !== null && (k === muj0 || k === muj1);
                const dundEsekh = muj0 !== null && muj1 !== null && k > muj0 && k < muj1;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={idevkhgui}
                    onClick={() => udurDarakh(d)}
                    onMouseEnter={() => khuleelt && setKhuulga(d)}
                    className={`h-9 text-xs tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                      tugsgulEsekh
                        ? "rounded-lg bg-theme font-medium !text-white"
                        : dundEsekh
                          ? "bg-theme/10 text-[color:var(--panel-text)]"
                          : `rounded-lg hover:bg-[color:var(--surface-hover)] ${
                              ennSar ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)] opacity-60"
                            } ${k === unuudur ? "ring-1 ring-inset ring-theme" : ""}`
                    }`}
                  >
                    {d.date()}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-center text-[11px] text-[color:var(--muted-text)]">
              {khuleelt ? "Дуусах өдрөө сонгоно уу" : "Эхлэх өдрөө сонгоно уу"}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
