"use client";

import React from "react";
import dayjs from "dayjs";
import StandardDatePicker from "@/components/ui/StandardDatePicker";

/**
 * Бүртгүүлсэн огноо → авлага үүсэх огноо хоорондох хоног.
 * Жнь: 27-нд бүртгүүлж, 30-нд авлага үүсэх бол 3 хоног.
 */
export function avlagiinKhonogTootsoolokh(
  burtguulsenOgnoo?: string | null,
  avlagaUusekhOgnoo?: string | null,
): number {
  if (!burtguulsenOgnoo || !avlagaUusekhOgnoo) return 0;
  const ekh = dayjs(String(burtguulsenOgnoo).slice(0, 10));
  const tugsgul = dayjs(String(avlagaUusekhOgnoo).slice(0, 10));
  if (!ekh.isValid() || !tugsgul.isValid()) return 0;
  return Math.max(0, tugsgul.diff(ekh, "day"));
}

/** Баазаас ирсэн ISO огноог "YYYY-MM-DD" болгоно. */
export const ognooKhevshuulekh = (v: any): string =>
  v ? String(v).slice(0, 10) : "";

type Props = {
  unit: any;
  /** Тоотын мөрийн талбаруудыг нэг дор шинэчилнэ. */
  onChange: (patch: Record<string, any>) => void;
  /** Барилгын тохиргоонд хоногоор бодох нээлттэй эсэх. */
  enabled: boolean;
  popupContainer?: () => HTMLElement;
};

/**
 * Тоот бүр дээрх «Авлага үүсэх огноо». Хоёр огноог оруулахад эхний сарын
 * бодох хоногийг (`bodokhKhonog`) автоматаар тооцно — эхний нэхэмжлэх
 * тэр хоногоор бодогдоно.
 */
export default function AvlagaUusekhOgnoo({
  unit,
  onChange,
  enabled,
  popupContainer,
}: Props) {
  const idevkhtei = !!unit?.khonogoorBodokhEsekh;
  const burtguulsen = ognooKhevshuulekh(unit?.burtguulsenOgnoo);
  const avlaga = ognooKhevshuulekh(unit?.avlagaUusekhOgnoo);
  const khonog = avlagiinKhonogTootsoolokh(burtguulsen, avlaga);
  const buruu = !!burtguulsen && !!avlaga && khonog <= 0;

  const ognooSolikh = (field: "burtguulsenOgnoo" | "avlagaUusekhOgnoo", val: string) => {
    const daraa = {
      burtguulsenOgnoo: burtguulsen,
      avlagaUusekhOgnoo: avlaga,
      [field]: val || "",
    };
    onChange({
      [field]: val || "",
      bodokhKhonog: avlagiinKhonogTootsoolokh(
        daraa.burtguulsenOgnoo,
        daraa.avlagaUusekhOgnoo,
      ),
    });
  };

  const toggle = (checked: boolean) => {
    if (checked) {
      onChange({
        khonogoorBodokhEsekh: true,
        burtguulsenOgnoo: burtguulsen || dayjs().format("YYYY-MM-DD"),
      });
    } else {
      onChange({
        khonogoorBodokhEsekh: false,
        bodokhKhonog: 0,
        burtguulsenOgnoo: "",
        avlagaUusekhOgnoo: "",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <label
        className={`relative inline-flex items-center ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} scale-75`}
        title={enabled ? undefined : "Барилгын тохиргоонд хоногоор бодохыг идэвхжүүлнэ үү"}
      >
        <input
          type="checkbox"
          checked={idevkhtei}
          disabled={!enabled}
          onChange={(e) => toggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[color:var(--panel)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-theme rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[color:var(--surface-bg)] after:border-[color:var(--surface-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme"></div>
      </label>
      <span className="text-[11px] font-medium text-[color:var(--muted-text)]">
        Авлага үүсэх огноо
      </span>
      {idevkhtei && (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[color:var(--muted-text)]">Бүртгүүлсэн</span>
            <div className="h-7 w-[130px]">
              <StandardDatePicker
                value={burtguulsen || null}
                onChange={(_d, s) => ognooSolikh("burtguulsenOgnoo", s)}
                placeholder="Огноо"
                getPopupContainer={popupContainer}
                popupStyle={{ zIndex: 13010 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[color:var(--muted-text)]">Авлага үүсэх</span>
            <div className="h-7 w-[130px]">
              <StandardDatePicker
                value={avlaga || null}
                onChange={(_d, s) => ognooSolikh("avlagaUusekhOgnoo", s)}
                placeholder="Огноо"
                className={buruu ? "border-danger" : ""}
                getPopupContainer={popupContainer}
                popupStyle={{ zIndex: 13010 }}
              />
            </div>
          </div>
          <span
            className={`text-[11px] font-medium ${buruu ? "text-danger" : "text-[color:var(--panel-text)]"}`}
          >
            {buruu
              ? "Авлага үүсэх огноо бүртгүүлсэн огнооноос хойш байх ёстой"
              : khonog > 0
                ? `Эхний сар: ${khonog} хоногоор бодно`
                : ""}
          </span>
        </div>
      )}
    </div>
  );
}
