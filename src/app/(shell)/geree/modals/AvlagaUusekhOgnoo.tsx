"use client";

import React from "react";
import dayjs from "dayjs";
import { CalendarClock } from "lucide-react";
import StandardDatePicker from "@/components/ui/StandardDatePicker";

/** Өнөөдрийн огноо "YYYY-MM-DD" — бүртгүүлсэн өдөр гэж тооцно. */
export const unuudur = () => dayjs().format("YYYY-MM-DD");

/**
 * Бүртгүүлсэн өдрөөс авлага үүсэх огноо хүртэлх хоног.
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
  value: string;
  onChange: (val: string) => void;
  popupContainer?: () => HTMLElement;
};

/**
 * Харилцагчийн «Авлага үүсэх огноо». Өнөөдрөөс (бүртгүүлсэн өдөр) энэ
 * огноо хүртэлх хоногоор эхний сарын авлага бодогдоно.
 */
export default function AvlagaUusekhOgnoo({ value, onChange, popupContainer }: Props) {
  const khonog = avlagiinKhonogTootsoolokh(unuudur(), value);

  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
          <CalendarClock className="h-5 w-5" />
        </span>
        <span className="flex-1 text-sm font-medium text-[color:var(--panel-text)]">
          Авлага үүсэх огноо
        </span>
        <div className="h-9 w-[150px]">
          <StandardDatePicker
            value={value || null}
            onChange={(_d, s) => onChange(s || "")}
            placeholder="Огноо"
            allowClear
            disabledDate={(d) => !!d && d.isBefore(dayjs(), "day")}
            getPopupContainer={popupContainer}
            popupStyle={{ zIndex: 13010 }}
          />
        </div>
      </div>
      {khonog > 0 && (
        <p className="mt-2 text-xs text-[color:var(--muted-text)]">
          Эхний сарын авлага <span className="font-semibold text-[color:var(--panel-text)]">{khonog} хоногоор</span> бодогдоно.
        </p>
      )}
    </div>
  );
}
