"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DayPicker,
  DateRange,
  SelectRangeEventHandler,
} from "react-day-picker";

import dayjs from "dayjs";

// Types mimicking the subset of Mantine's DatePickerInput we use in the app
export type DateValue = Date | null;
export type RangeValue = [Date | null, Date | null] | undefined;
export type StringOrDate = string | Date | null;
export type StringOrDateRange =
  | [string | Date | null, string | Date | null]
  | undefined;

type CommonProps = {
  placeholder?: string;
  clearable?: boolean;
  locale?: string; // currently not used
  className?: string;
  classNames?: { root?: string; input?: string };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  radius?: string | number;
  dropdownType?: "popover" | "modal"; // we always use a small popover
  popoverProps?: {
    width?: number | string;
    position?: string;
    withinPortal?: boolean;
    zIndex?: number;
  };
  valueFormat?: string; // defaults to YYYY-MM-DD
  // Allow passthrough of extra props from previous Mantine API without TS errors
  [key: string]: any;
};

// Utility: convert incoming value (string or Date) to Date
function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  // Expecting format YYYY-MM-DD most of the app uses
  const d1 = dayjs(v as string, "YYYY-MM-DD", true);
  if (d1.isValid()) return d1.toDate();
  const d2 = dayjs(v as string);
  return d2.isValid() ? d2.toDate() : null;
}

function formatValue(d: Date | null, format: string): string | null {
  if (!d) return null;
  // Only a small set is needed; dayjs handles common tokens used in the app
  return dayjs(d).format(format || "YYYY-MM-DD");
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

export function DatePickerInput(
  // Loosen value/onChange typing to fit existing usages across the app
  props: CommonProps & {
    type?: "default" | "range";
    value?: any;
    onChange?: (v: any) => void;
  }
) {
  const {
    placeholder = "Огноо оруулна уу",
    clearable,
    className,
    classNames,
    valueFormat = "YYYY-MM-DD",
    type,
    value,
    onChange,
    onClick: rootOnClick,
  } = props as any;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useOutsideClick(rootRef, () => setOpen(false));

  // Normalize current value to Date/DateRange for the calendar
  const selected = useMemo(() => {
    if (type === "range") {
      const arr = (value || [null, null]) as [
        string | Date | null,
        string | Date | null
      ];
      return { from: toDate(arr[0]), to: toDate(arr[1]) } as DateRange;
    }
    return toDate(value as any);
  }, [type, value]);

  const isStringControlled = useMemo(() => isStringValue(value), [value]);

  const commitSingle = (d: Date | undefined) => {
    if (!onChange) return;
    if (!d) {
      onChange(null as any);
      return;
    }
    if (isStringControlled) onChange(formatValue(d, valueFormat));
    else onChange(d);
  };

  const commitRange: SelectRangeEventHandler = (range) => {
    if (!onChange) return;
    if (!range?.from && !range?.to) {
      onChange(undefined as any);
      return;
    }
    if (isStringControlled) {
      onChange([
        formatValue(range?.from ?? null, valueFormat),
        formatValue(range?.to ?? null, valueFormat),
      ] as any);
    } else {
      onChange([range?.from ?? null, range?.to ?? null] as any);
    }
  };

  const displayText = useMemo(() => {
    if (type === "range") {
      const r = selected as DateRange | undefined;
      const left = r?.from ? dayjs(r.from).format(valueFormat) : "";
      const right = r?.to ? dayjs(r.to).format(valueFormat) : "";
      return left && right ? `${left} – ${right}` : left || right || "";
    }
    const d = selected as Date | null;
    return d ? dayjs(d).format(valueFormat) : "";
  }, [selected, type, valueFormat]);

  return (
    <div ref={rootRef} className={classNames?.root || "relative inline-block"}>
      <button
        type="button"
        onClick={(e) => {
          setOpen((o) => !o);
          rootOnClick?.(e);
        }}
        className={
          classNames?.input ||
          `neu-panel rounded-2xl px-3 py-2 h-10 text-sm flex items-center justify-between gap-2 min-w-[220px]` +
            (className ? ` ${className}` : "")
        }
      >
        <span className={displayText ? "text-foreground" : "text-gray-400"}>
          {displayText || placeholder}
        </span>
        {clearable && displayText && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (type === "range") (onChange as any)?.(undefined);
              else (onChange as any)?.(null);
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Clear date"
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 p-3 rounded-2xl menu-surface"
          style={{ width: 320 }}
        >
          <style>{`
            .rdp-root { width: 100%; }
            .rdp-month { width: 100%; }
            .rdp-month_caption { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .rdp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
            .rdp-weeks { display: grid; gap: 2px; }
            .rdp-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
            .rdp-day { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
            
            /* Base button styling */
            .rdp-day_button {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.5rem;
              background-color: white;
              color: black;
              font-weight: 500;
              transition: background-color .15s ease, color .15s ease;
              border: none;
              cursor: pointer;
            }
            
            /* Dark mode base */
            .dark .rdp-day_button {
              background-color: black;
              color: white;
            }
            
            /* Previous/next month dates - must come before weekend styles */
            .rdp-day_outside .rdp-day_button {
              background-color: #e5e7eb !important;
              color: #9ca3af !important;
            }
            
            .dark .rdp-day_outside .rdp-day_button {
              background-color: #374151 !important;
              color: #9ca3af !important;
            }
            
            /* Weekend styling - Sunday (1st col) and Saturday (7th col) */
            .rdp-week > :first-child .rdp-day_button,
            .rdp-week > :last-child .rdp-day_button {
              color: #ef4444 !important;
            }
            
            .dark .rdp-week > :first-child .rdp-day_button,
            .dark .rdp-week > :last-child .rdp-day_button {
              color: #ef4444 !important;
            }
            
            /* Hover state */
            .rdp-day_button:hover {
              background-color: #f3f4f6 !important;
            }
            
            .dark .rdp-day_button:hover {
              background-color: #1f2937 !important;
            }
            
            /* Weekend hover - maintain red text */
            .rdp-week > :first-child .rdp-day_button:hover,
            .rdp-week > :last-child .rdp-day_button:hover {
              color: #ef4444 !important;
            }
            
            /* Selected state - blue background with white text (overrides weekend red) */
            .rdp-day_selected .rdp-day_button {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            
            .dark .rdp-day_selected .rdp-day_button {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            
            /* Selected hover */
            .rdp-day_selected .rdp-day_button:hover {
              background-color: #2563eb !important;
              color: white !important;
            }
            
            .dark .rdp-day_selected .rdp-day_button:hover {
              background-color: #2563eb !important;
              color: white !important;
            }
            
            /* Today indicator - ring border */
            .rdp-day_today .rdp-day_button {
              box-shadow: 0 0 0 2px #3b82f6 !important;
            }
            
            /* Disabled state */
            .rdp-day_disabled .rdp-day_button {
              opacity: 0.3;
              cursor: not-allowed;
            }
          `}</style>
          {React.createElement(
            DayPicker as any,
            {
              mode: type === "range" ? "range" : "single",
              selected: selected as any,
              onSelect: type === "range" ? (commitRange as any) : commitSingle,
              weekStartsOn: 0,
              showOutsideDays: true,
              fixedWeeks: true,
              classNames: {
                caption: "flex justify-between items-center px-2 mb-1",
                caption_label:
                  "text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-wide",
                nav: "flex items-center gap-3",
                button_previous:
                  "text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                button_next:
                  "text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                table: "w-full border-collapse",
                head_row: "text-[11px] text-gray-500",
                head_cell: "text-center font-medium p-1",
                row: "",
                cell: "p-1",
                day: "w-9 h-9 rounded-lg text-sm flex items-center justify-center",
                day_button: "",
                day_selected: "",
                day_today: "",
                day_outside: "",
                day_disabled: "",
              },
            } as any
          )}
        </div>
      )}
    </div>
  );
}

export default DatePickerInput;
