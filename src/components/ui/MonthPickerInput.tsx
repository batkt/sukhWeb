"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import dayjs from "dayjs";

type CommonProps = {
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  classNames?: { root?: string; input?: string };
  valueFormat?: string; // defaults to YYYY-MM
  [key: string]: any;
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d1 = dayjs(v as string, "YYYY-MM", true);
  if (d1.isValid()) return d1.toDate();
  const d2 = dayjs(v as string);
  return d2.isValid() ? d2.toDate() : null;
}

function formatValue(d: Date | null, format: string): string | null {
  if (!d) return null;
  return dayjs(d).format(format || "YYYY-MM");
}

function isStringValue(value: any): boolean {
  if (value == null) return false;
  if (typeof value === "string") return true;
  if (Array.isArray(value))
    return typeof value[0] === "string" || typeof value[1] === "string";
  return false;
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void
) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside, ref]);
}

export function MonthPickerInput(
  props: CommonProps & {
    type?: "default" | "range";
    value?: any;
    onChange?: (v: any) => void;
  }
) {
  const {
    placeholder = "Сар сонгох",
    clearable,
    className,
    classNames,
    valueFormat = "YYYY-MM",
    type = "default",
    value,
    onChange,
    onClick: rootOnClick,
  } = props as any;

  const isRange = type === "range";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(rootRef, () => setOpen(false));

  const selected = useMemo(() => {
    if (isRange) {
      const arr = (value || [null, null]) as [
        string | Date | null,
        string | Date | null
      ];
      return [toDate(arr[0]), toDate(arr[1])] as [Date | null, Date | null];
    }
    return toDate(value as any);
  }, [isRange, value]);

  const isStringControlled = useMemo(() => isStringValue(value), [value]);

  const [displayYear, setDisplayYear] = useState<number>(() => {
    const d =
      (isRange
        ? (selected as [Date | null, Date | null])[0]
        : (selected as Date | null)) ?? new Date();
    return dayjs(d).year();
  });

  useEffect(() => {
    const d =
      (isRange
        ? (selected as [Date | null, Date | null])[0]
        : (selected as Date | null)) ?? null;
    if (d) setDisplayYear(dayjs(d).year());
  }, [isRange, selected]);

  const commitSingle = (d: Date) => {
    if (!onChange) return;
    if (isStringControlled) onChange(formatValue(d, valueFormat));
    else onChange(d);
  };

  const commitRange = (start: Date | null, end: Date | null) => {
    if (!onChange) return;
    if (!start && !end) {
      onChange([null, null]);
      return;
    }
    if (isStringControlled) {
      onChange([
        formatValue(start, valueFormat),
        formatValue(end, valueFormat),
      ]);
    } else {
      onChange([start, end]);
    }
  };

  const displayText = useMemo(() => {
    if (isRange) {
      const [s, e] = (selected as [Date | null, Date | null]) || [];
      const left = s ? dayjs(s).format(valueFormat) : "";
      const right = e ? dayjs(e).format(valueFormat) : "";
      return left && right ? `${left} – ${right}` : left || right || "";
    }
    const d = selected as Date | null;
    return d ? dayjs(d).format(valueFormat) : "";
  }, [selected, isRange, valueFormat]);

  const months = Array.from({ length: 12 }, (_, m) => m);
  const [rangeDraft, setRangeDraft] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const onMonthClick = (monthIndex: number) => {
    const firstDay = new Date(displayYear, monthIndex, 1);
    if (!isRange) {
      commitSingle(firstDay);
      setOpen(false);
      return;
    }
    if (!rangeDraft.start || rangeDraft.end) {
      setRangeDraft({ start: firstDay, end: null });
      commitRange(firstDay, null);
      return;
    }
    // have start; set end ensuring order
    const start = rangeDraft.start;
    const ordered = dayjs(firstDay).isBefore(start)
      ? { start: firstDay, end: start }
      : { start, end: firstDay };
    setRangeDraft(ordered);
    commitRange(ordered.start, ordered.end);
  };

  const isSelected = (monthIndex: number): boolean => {
    const d = new Date(displayYear, monthIndex, 1);
    if (!isRange) {
      const sel = selected as Date | null;
      return !!sel && dayjs(sel).isSame(d, "month");
    }
    const [s, e] = (selected as [Date | null, Date | null]) || [];
    if (s && e) {
      return (
        dayjs(d).isSameOrAfter(dayjs(s), "month") &&
        dayjs(d).isSameOrBefore(dayjs(e), "month")
      );
    }
    if (s && !e) return dayjs(d).isSame(s, "month");
    return false;
  };

  return (
    <div
      ref={rootRef}
      className={classNames?.root || "relative inline-block w-full max-w-full"}
    >
      <button
        type="button"
        onClick={(e) => {
          setOpen((o) => !o);
          rootOnClick?.(e);
        }}
        className={
          classNames?.input ||
          `neu-panel rounded-2xl px-3 py-2 h-11 text-sm flex items-center justify-between gap-2 w-full` +
            (className ? ` ${className}` : "")
        }
      >
        <span className={displayText ? "text-theme" : "text-subtle"}>
          {displayText || placeholder}
        </span>
        {clearable && displayText && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (isRange) onChange?.([null, null]);
              else onChange?.(null);
            }}
            className="text-subtle hover:text-theme cursor-pointer"
            aria-label="Clear month"
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 rounded-2xl menu-surface shadow-xl w-[min(92vw,380px)] sm:w-[340px] max-w-[92vw]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-black"
              onClick={() => setDisplayYear((y) => y - 1)}
              aria-label="Prev year"
            >
              ‹
            </button>
            <div className="text-sm font-semibold text-theme">
              {displayYear}
            </div>
            <button
              className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-black"
              onClick={() => setDisplayYear((y) => y + 1)}
              aria-label="Next year"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1">
            {months.map((m) => {
              const active = isSelected(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMonthClick(m)}
                  className={
                    `h-10 rounded-xl text-sm font-medium transition-colors ` +
                    `hover:bg-white dark:hover:bg-black ` +
                    (active
                      ? ` bg-primary text-white hover:bg-primary/90`
                      : ` text-theme`)
                  }
                >
                  {dayjs(new Date(displayYear, m, 1)).format("MMM")}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-3 gap-2">
            <button
              className="btn-minimal"
              onClick={() => {
                setOpen(false);
              }}
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthPickerInput;
