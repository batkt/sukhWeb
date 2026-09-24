"use client";

/**
 * Хуудасны шүүлтүүрийн огноо сонгогч — «Гүйлгээний түүх» хуудасны загвартай ИЖИЛ.
 *
 * Бүрхүүл: `.btn-minimal flex h-9 px-3` (globals.css → НЭГДСЭН КОНТРОЛ),
 * утгатай үед `!border-theme/45`, зүүн талд Calendar дүрс, 13px текст,
 * утгатай үед баруун талд цэвэрлэх X товч (MonthRangePicker-тэй адил).
 *
 * - `picker="month"` + range → MonthRangePicker (нэг самбартай)
 * - бусад тохиолдолд AntD DatePicker/RangePicker (borderless, suffix-гүй, mn locale)
 *
 * onChange нь AntD-ийн `(утга, мөр)` дарааллыг хадгална — одоогийн дуудагчдын
 * handler-уудыг өөрчлөхгүйгээр солих боломжтой. Цэвэрлэхэд `(null, ["", ""])`
 * (range) эсвэл `(null, "")` (single) дамжуулна.
 */

import React from "react";
import { ConfigProvider } from "antd";
import { Calendar, X } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import StandardDatePicker from "./StandardDatePicker";
import MonthRangePicker from "./MonthRangePicker";

export type FilterDateLike = string | Date | Dayjs | null | undefined;

interface BaseProps {
  /** "date" (өдөр, анхдагч) | "month" | "year" */
  picker?: "date" | "month" | "year";
  /** Харуулах/буцаах формат. Анхдагч: YYYY-MM-DD / YYYY-MM / YYYY */
  format?: string;
  placeholder?: string | [string, string];
  /** Бүрхүүлийн нэмэлт класс — өргөнийг дарж өгөх бол энд (жишээ нь `w-full sm:w-[280px]`) */
  className?: string;
  /** Бүрхүүлийн id (tour алхамд ашиглагддаг) */
  id?: string;
  allowClear?: boolean;
  disabled?: boolean;
  disabledDate?: (d: Dayjs) => boolean;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
}

export interface FilterDateRangeProps extends BaseProps {
  single?: false;
  value?: [FilterDateLike, FilterDateLike] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AntD Dayjs утгыг дуудагчид өөр төрлөөр хадгалдаг
  onChange?: (dates: any, dateStrings: [string, string]) => void;
}

export interface FilterDateSingleProps extends BaseProps {
  single: true;
  value?: FilterDateLike;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AntD Dayjs утгыг дуудагчид өөр төрлөөр хадгалдаг
  onChange?: (date: any, dateString: string) => void;
}

export type FilterDatePickerProps = FilterDateRangeProps | FilterDateSingleProps;

const ANKHDAGCH_FORMAT = { date: "YYYY-MM-DD", month: "YYYY-MM", year: "YYYY" } as const;

const khooson = (v: FilterDateLike) => v === null || v === undefined || v === "";

const muruu = (v: FilterDateLike): string | null => {
  if (khooson(v)) return null;
  if (typeof v === "string") return v;
  const d = dayjs(v as string | Date | Dayjs);
  return d.isValid() ? d.toISOString() : null;
};

export default function FilterDatePicker(props: FilterDatePickerProps) {
  const {
    picker = "date",
    placeholder,
    className,
    id,
    allowClear = true,
    disabled,
    disabledDate,
    getPopupContainer,
  } = props;
  const format = props.format ?? ANKHDAGCH_FORMAT[picker];

  const utgatai = props.single
    ? !khooson(props.value)
    : !!props.value && (!khooson(props.value[0]) || !khooson(props.value[1]));

  const urgun = className && /(^|\s)w-/.test(className)
    ? ""
    : props.single
      ? "w-[150px]"
      : "w-[210px]";

  const burkhuul = `btn-minimal flex h-9 items-center px-3 ${urgun} ${className ?? ""} ${
    utgatai ? "!border-theme/45" : ""
  }`;

  // Сарын хүрээ — MonthRangePicker өөрөө дүрс/цэвэрлэх товчтой
  if (!props.single && picker === "month") {
    const onChange = props.onChange;
    return (
      <div id={id} className={burkhuul}>
        <MonthRangePicker
          value={props.value ? [muruu(props.value[0]), muruu(props.value[1])] : undefined}
          onChange={(v) =>
            onChange?.(v, v ? [v[0].format(format), v[1].format(format)] : ["", ""])
          }
          placeholder={typeof placeholder === "string" ? placeholder : "Сар сонгох"}
        />
      </div>
    );
  }

  const tseverlekh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.single) props.onChange?.(null, "");
    else props.onChange?.(null, ["", ""]);
  };

  const ankhdagchPlaceholder =
    picker === "month" ? "Сар сонгох" : picker === "year" ? "Он сонгох" : "Огноо сонгох";

  return (
    <div id={id} className={burkhuul}>
      <Calendar className="mr-2 h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
      <ConfigProvider theme={{ token: { fontSize: 13 } }}>
        <StandardDatePicker
          isRange={!props.single}
          picker={picker}
          value={props.value ?? null}
          onChange={props.onChange}
          format={format}
          placeholder={placeholder ?? ankhdagchPlaceholder}
          allowClear={false}
          disabled={disabled}
          disabledDate={disabledDate}
          getPopupContainer={getPopupContainer}
          variant="borderless"
          suffixIcon={null}
          style={{ padding: 0, height: "100%", minWidth: 0, flex: 1, fontSize: 13 }}
          className="!h-full min-w-0 flex-1 !rounded-none !border-0 !px-0 !shadow-none text-[13px]"
        />
      </ConfigProvider>
      {allowClear && utgatai && !disabled && (
        <button
          type="button"
          aria-label="Цэвэрлэх"
          title="Цэвэрлэх"
          onClick={tseverlekh}
          className="ml-1 shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
