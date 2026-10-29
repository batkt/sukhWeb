"use client";

import React from "react";
import dayjs from "dayjs";
import { CalendarClock } from "lucide-react";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";

/** Өнөөдрийн огноо "YYYY-MM-DD" — бүртгүүлсэн өдөр гэж тооцно. */
export const unuudur = () => dayjs().format("YYYY-MM-DD");

/** Баазаас ирсэн ISO огноог "YYYY-MM-DD" болгоно. */
export const ognooKhevshuulekh = (v: any): string =>
  v ? String(v).slice(0, 10) : "";

/**
 * Сар бүрийн авлага үүсэх өдрөөр (1–31) өнөөдрөөс хойшхи анхны авлагын
 * огноог олно. Тухайн өдөр сардаа байхгүй бол (жнь 31) сарын сүүлийн өдөр.
 * Өнөөдөр яг тэр өдөр бол null — хоногоор бодох шаардлагагүй.
 */
export function avlagiinOgnooOlokh(udur: number, ekhlel = dayjs()): dayjs.Dayjs | null {
  if (!udur || udur < 1 || udur > 31) return null;
  const unuu = ekhlel.startOf("day");
  const saraar = (m: dayjs.Dayjs) => m.date(Math.min(udur, m.daysInMonth()));
  let ognoo = saraar(unuu.startOf("month"));
  if (ognoo.isSame(unuu, "day")) return null;
  if (ognoo.isBefore(unuu, "day")) ognoo = saraar(unuu.add(1, "month").startOf("month"));
  return ognoo;
}

/** Өнөөдрөөс авлага үүсэх өдөр хүртэлх хоног. Жнь: 27-нд бүртгүүлж, 30 сонговол 3. */
export function avlagiinKhonogTootsoolokh(udur: number): number {
  const ognoo = avlagiinOgnooOlokh(udur);
  return ognoo ? ognoo.diff(dayjs().startOf("day"), "day") : 0;
}

const udruud = [
  { value: "", label: "Сонгоогүй" },
  ...Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}`,
  })),
];

type Props = {
  /** Сар бүрийн өдөр "1"–"31", хоосон бол сонгоогүй. */
  value: string;
  onChange: (val: string) => void;
};

/**
 * Харилцагчийн «Авлага үүсгэх огноо сар бүрийн / өдөр». Өнөөдрөөс (бүртгүүлсэн
 * өдөр) тэр өдөр хүртэлх хоногоор эхний сарын авлага бодогдоно.
 */
export default function AvlagaUusekhOgnoo({ value, onChange }: Props) {
  const udur = Number(value) || 0;
  const khonog = avlagiinKhonogTootsoolokh(udur);
  const ognoo = avlagiinOgnooOlokh(udur);

  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-theme/10 text-brand">
          <CalendarClock className="h-5 w-5" />
        </span>
        <span className="flex-1 text-sm font-medium text-[color:var(--panel-text)]">
          Авлага үүсгэх огноо
          <span className="block text-xs font-normal text-[color:var(--muted-text)]">
            Сар бүрийн / өдөр
          </span>
        </span>
        <div className="tusgai-wrapper h-9 w-[120px]">
          <TusgaiZagvar
            value={value || ""}
            onChange={onChange}
            options={udruud}
            className="h-full w-full"
            placeholder="Өдөр"
          />
        </div>
      </div>
      {khonog > 0 && ognoo && (
        <p className="mt-2 text-xs text-[color:var(--muted-text)]">
          Эхний авлага {ognoo.format("YYYY-MM-DD")}-нд үүснэ —{" "}
          <span className="font-semibold text-[color:var(--panel-text)]">{khonog} хоногоор</span> бодогдоно.
        </p>
      )}
    </div>
  );
}
