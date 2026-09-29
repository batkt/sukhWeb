"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Filter } from "lucide-react";

/**
 * Баганын шүүлтүүрийн попап.
 *
 * Өмнөх хувилбарын гэмтэл:
 *   • Гадаргуу `bg-white/95` тогтмол — ХАРАНХУЙ горимд цагаан панел дээр
 *     `dark:text-white` текст үл харагдана.
 *   • Сонгогдсон мөрийн `text-brand/20` — 20% тунгалаг брэнд өнгө, өөрөөр
 *     хэлбэл текст бараг үзэгдэхгүй. (`dark:` хураахад орфан болсон alpha.)
 *   • Тусгаарлагч `bg-[color:var(--panel)]` — цайвар горимд бараг цагаан
 *     тул шугам харагдахгүй.
 *   • Заагч цэгийн гэрэлтэлт хатуу ЦЭНХЭР, сэдвийн ногоонтой зөрдөг.
 *   • Нэг л удаа байрлаж, ДАХИН тооцоологддоггүй — хүснэгтийн бие дотроо
 *     гүйхэд попап тригерээсээ салж хоцордог.
 *   • Escape ч, гадна дарах ч хаадаггүй; тригерийн хоорондох зай дээр
 *     хулгана гарангуут анивчдаг.
 *
 * Байрлуулах логикийг `turees/components/ui/primitives/Popup.js`-аас
 * хуулав: доор тохирохгүй бол ДЭЭШ эргэнэ, хөндлөнгөөр цонхонд багтана,
 * scroll / resize / агуулгын өөрчлөлтөд дахин байрлана.
 */
export const FilterPopover = ({
  label,
  options,
  current,
  onSelect,
  children,
}: {
  label: string;
  options: { label: string; value: string }[];
  current: string;
  onSelect: (v: string) => void;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, kharagdakh: false });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const tsagKhemjigch = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Тригерийн хажууд байрлуулна; доор багтахгүй бол дээш эргэнэ. */
  const baiirshuulya = useCallback(() => {
    const tr = triggerRef.current;
    const pp = popupRef.current;
    if (!tr || !pp) return;
    const r = tr.getBoundingClientRect();
    const pw = pp.offsetWidth;
    const ph = pp.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const doorBagtakh = r.bottom + 6 + ph <= vh;
    const deerBagtakh = r.top - 6 - ph >= 0;
    const deeshee = !doorBagtakh && deerBagtakh;
    const top = deeshee ? r.top - ph - 6 : r.bottom + 6;

    // Тригерийн хөндлөн ТӨВД, гэхдээ цонхны ирмэгээс 8px дотогш
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.min(Math.max(left, 8), Math.max(8, vw - pw - 8));

    setPos((khuuchin) =>
      khuuchin.top === top && khuuchin.left === left && khuuchin.kharagdakh
        ? khuuchin
        : { top, left, kharagdakh: true },
    );
  }, []);

  useEffect(() => {
    if (!open) {
      setPos((p) => (p.kharagdakh ? { ...p, kharagdakh: false } : p));
      return;
    }
    baiirshuulya();

    // Хүснэгтийн бие ДОТРОО гүйдэг тул `capture` шаардлагатай — эс
    // тэгвээс зөвхөн цонхны гүйлт баригдана.
    const dakhinBaiirshuulya = () => baiirshuulya();
    window.addEventListener("scroll", dakhinBaiirshuulya, true);
    window.addEventListener("resize", dakhinBaiirshuulya);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && popupRef.current) {
      ro = new ResizeObserver(dakhinBaiirshuulya);
      ro.observe(popupRef.current);
    }

    const tovchlolt = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const gadnaDarsan = (e: MouseEvent) => {
      const n = e.target as Node;
      if (popupRef.current?.contains(n)) return;
      if (triggerRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", tovchlolt);
    document.addEventListener("mousedown", gadnaDarsan);

    return () => {
      window.removeEventListener("scroll", dakhinBaiirshuulya, true);
      window.removeEventListener("resize", dakhinBaiirshuulya);
      ro?.disconnect();
      document.removeEventListener("keydown", tovchlolt);
      document.removeEventListener("mousedown", gadnaDarsan);
    };
  }, [open, baiirshuulya]);

  useEffect(
    () => () => {
      if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
    },
    [],
  );

  return (
    <div
      ref={triggerRef}
      // Зөвхөн дарахад нээгдэнэ (hover-оор нээгддэггүй); гадна дарах / Esc хаана.
      onClick={(e) => {
        // Эрэмбэтэй баганад толгойн дарлт эрэмбэ солихгүй — зөвхөн шүүлтүүр нээнэ.
        e.stopPropagation();
        if (tsagKhemjigch.current) clearTimeout(tsagKhemjigch.current);
        setOpen((v) => !v);
      }}
      aria-haspopup="menu"
      aria-expanded={open}
      className="h-full"
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={popupRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 99999,
              visibility: pos.kharagdakh ? "visible" : "hidden",
            }}
            className="w-52 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--panel)] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
          >
            <div className="mb-1 px-3 py-2 text-[11px] text-[color:var(--muted-text)]">
              {label} сонгох
            </div>
            {/* Урт жагсаалт (ж: 20 давхар) цонхноос хэтрэхгүй — дотроо гүйнэ. */}
            <div className="max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain custom-scrollbar pr-0.5">
            {options.map((opt, idx, arr) => {
              const songogdson = current === opt.value;
              return (
                <div key={opt.value ?? idx}>
                  <div
                    role="menuitemradio"
                    aria-checked={songogdson}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(opt.value);
                        setOpen(false);
                      }
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-theme/40 ${
                      songogdson
                        ? "bg-theme/10 font-medium text-brand"
                        : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {songogdson && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme ring-[3px] ring-theme/20" />
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="mx-2 my-0.5 h-px bg-[color:var(--surface-border)]" />
                  )}
                </div>
              );
            })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

/**
 * Хүснэгтийн баганын толгой дээрх шүүлтүүр — «⏷ Орц» гэх мэт. Дээд талын
 * тусдаа сонгуурын оронд шүүлтийг тухайн баганын толгойноос хийнэ.
 * `current` нь "all" (эсвэл хоосон) бол идэвхгүй, бусад үед дүрс тодорно.
 */
export function ShuultuurTolgoi({
  label,
  current,
  options,
  onSelect,
}: {
  label: string;
  current: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
}) {
  const idevkhtei = !!current && current !== "all";
  const songogdsonNer = idevkhtei ? options.find((o) => o.value === current)?.label : null;
  return (
    <FilterPopover label={label} options={options} current={current || "all"} onSelect={onSelect}>
      <div className="group/f flex h-full cursor-pointer items-center justify-center gap-1.5">
        <Filter
          className={`h-3.5 w-3.5 transition-colors ${
            idevkhtei ? "text-brand" : "text-[color:var(--muted-text)] group-hover/f:text-brand"
          }`}
        />
        <span>{label}</span>
        {songogdsonNer && (
          <span className="rounded-md bg-theme/10 px-1.5 text-[11px] font-medium text-brand">{songogdsonNer}</span>
        )}
      </div>
    </FilterPopover>
  );
}
