"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { Calendar } from "./calendar";

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
  dropdownType?: "popover" | "modal"; // popover on desktop, modal-like panel on mobile
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
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Position the dropdown in a portal so it renders above any panels
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const estWidth = type === "range" ? 680 : 360; // two-month vs single
      const maxW = Math.min(window.innerWidth - 16, 720);
      const width = Math.min(Math.max(estWidth, 340), maxW);
      const left = Math.min(
        Math.max(8, rect.left),
        Math.max(8, window.innerWidth - width - 8)
      );
      const top = Math.min(rect.bottom + 8, window.innerHeight - 8);
      setDropdownPos({ top, left, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, type]);

  // Detect small screens and optionally render modal-style calendar
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Outside click that respects the portal content
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current && rootRef.current.contains(t)) return;
      if (dropdownRef.current && dropdownRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handle, true);
    return () => document.removeEventListener("mousedown", handle, true);
  }, [open]);

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
              if (type === "range") (onChange as any)?.(undefined);
              else (onChange as any)?.(null);
            }}
            className="text-subtle hover:text-theme cursor-pointer ml-2"
            aria-label="Clear date"
          >
            ×
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        (props.dropdownType === "modal" || isMobile
          ? createPortal(
              <div
                ref={dropdownRef}
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-[11000] flex items-center justify-center p-4"
                onClick={() => setOpen(false)}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl p-4 w-full max-w-md"
                  style={{ maxHeight: "90vh", overflow: "auto" }}
                >
                  <Calendar
                    mode={type === "range" ? "range" : "single"}
                    selected={selected as any}
                    onSelect={
                      (type === "range"
                        ? (commitRange as any)
                        : commitSingle) as any
                    }
                    required={false}
                    numberOfMonths={1}
                    captionLayout="dropdown"
                    hideNavigation={false}
                    weekStartsOn={1}
                    showOutsideDays
                    fixedWeeks
                  />
                </div>
              </div>,
              document.body
            )
          : createPortal(
              <div
                ref={dropdownRef}
                className="menu-surface rounded-2xl shadow-xl bg-[color:var(--surface-bg)]"
                role="dialog"
                aria-modal="true"
                style={{
                  position: "fixed",
                  zIndex: 9999,
                  top: dropdownPos?.top ?? 0,
                  left: dropdownPos?.left ?? 0,
                  width: dropdownPos?.width ?? undefined,
                  maxWidth: "96vw",
                  padding: "0.75rem",
                }}
              >
                <Calendar
                  mode={type === "range" ? "range" : "single"}
                  selected={selected as any}
                  onSelect={
                    (type === "range"
                      ? (commitRange as any)
                      : commitSingle) as any
                  }
                  required={false}
                  numberOfMonths={type === "range" ? 2 : 1}
                  captionLayout="dropdown"
                  hideNavigation
                  weekStartsOn={1}
                  showOutsideDays
                  fixedWeeks
                />
              </div>,
              document.body
            ))}
    </div>
  );
}

export default DatePickerInput;
