"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, ChevronDown } from "lucide-react";
import dayjs from "dayjs";

interface DateRangeButtonProps {
  value?: [string | null, string | null];
  onChange?: (value: [string | null, string | null]) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangeButton({
  value,
  onChange,
  placeholder = "Огноо сонгох",
  className = "",
}: DateRangeButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse dates
  const startDate = value?.[0] ? dayjs(value[0], "YYYY-MM-DD") : null;
  const endDate = value?.[1] ? dayjs(value[1], "YYYY-MM-DD") : null;

  // State for date selection
  const [startYear, setStartYear] = useState<number | "">(startDate?.year() || "");
  const [startMonth, setStartMonth] = useState<number | "">(startDate ? startDate.month() + 1 : "");
  const [startDay, setStartDay] = useState<number | "">(startDate?.date() || "");
  
  const [endYear, setEndYear] = useState<number | "">(endDate?.year() || "");
  const [endMonth, setEndMonth] = useState<number | "">(endDate ? endDate.month() + 1 : "");
  const [endDay, setEndDay] = useState<number | "">(endDate?.date() || "");

  // Update state when value prop changes
  useEffect(() => {
    if (startDate) {
      setStartYear(startDate.year());
      setStartMonth(startDate.month() + 1);
      setStartDay(startDate.date());
    } else {
      setStartYear("");
      setStartMonth("");
      setStartDay("");
    }
    if (endDate) {
      setEndYear(endDate.year());
      setEndMonth(endDate.month() + 1);
      setEndDay(endDate.date());
    } else {
      setEndYear("");
      setEndMonth("");
      setEndDay("");
    }
  }, [value]);

  // Generate year options (current year ± 10 years)
  const currentYear = dayjs().year();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Month names in Mongolian
  const months = [
    "1-р сар", "2-р сар", "3-р сар", "4-р сар",
    "5-р сар", "6-р сар", "7-р сар", "8-р сар",
    "9-р сар", "10-р сар", "11-р сар", "12-р сар"
  ];

  // Get days in month
  const getDaysInMonth = (year: number | "", month: number | "") => {
    if (!year || !month) return [];
    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const startDays = getDaysInMonth(startYear, startMonth);
  const endDays = getDaysInMonth(endYear, endMonth);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleApply = () => {
    if (startYear && startMonth && startDay && endYear && endMonth && endDay) {
      const start = dayjs(`${startYear}-${startMonth}-${startDay}`).format("YYYY-MM-DD");
      const end = dayjs(`${endYear}-${endMonth}-${endDay}`).format("YYYY-MM-DD");
      onChange?.([start, end]);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartYear("");
    setStartMonth("");
    setStartDay("");
    setEndYear("");
    setEndMonth("");
    setEndDay("");
    onChange?.([null, null]);
  };

  const displayText = useMemo(() => {
    if (startDate && endDate) {
      return `${startDate.format("YYYY-MM-DD")} – ${endDate.format("YYYY-MM-DD")}`;
    }
    return placeholder;
  }, [startDate, endDate, placeholder]);

  return (
    <>
      <div ref={rootRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`
            w-full px-4 py-2.5 h-[42px]
            bg-[color:var(--surface-bg)] 
            border border-[color:var(--surface-border)] 
            rounded-lg
            flex items-center justify-between gap-2
            text-sm text-[color:var(--panel-text)]
            hover:bg-[color:var(--surface-hover)]
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all
          `}
          style={{ borderRadius: '0.5rem' }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="w-4 h-4 text-[color:var(--muted-text)] flex-shrink-0" />
            <span className="truncate">
              {displayText}
            </span>
          </div>
          {startDate && endDate && (
            <button
              type="button"
              onClick={handleClear}
              className="flex-shrink-0 p-1 rounded hover:bg-[color:var(--surface-hover)] transition-colors"
              aria-label="Цэвэрлэх"
            >
              <X className="w-3.5 h-3.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]" />
            </button>
          )}
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[9999] mt-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl shadow-lg p-4 w-[500px]"
            style={{
              borderRadius: '0.75rem',
              top: rootRef.current
                ? rootRef.current.getBoundingClientRect().bottom + window.scrollY + 4
                : 0,
              left: rootRef.current
                ? rootRef.current.getBoundingClientRect().left + window.scrollX
                : 0,
            }}
          >
            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-xs  text-[color:var(--panel-text)] mb-2">
                  Эхлэх огноо
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <select
                      value={startYear}
                      onChange={(e) => {
                        setStartYear(e.target.value ? parseInt(e.target.value) : "");
                        setStartDay(""); // Reset day when year/month changes
                      }}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Он</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={startMonth}
                      onChange={(e) => {
                        setStartMonth(e.target.value ? parseInt(e.target.value) : "");
                        setStartDay(""); // Reset day when month changes
                      }}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Сар</option>
                      {months.map((month, index) => (
                        <option key={index + 1} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={startDay}
                      onChange={(e) => setStartDay(e.target.value ? parseInt(e.target.value) : "")}
                      disabled={!startYear || !startMonth}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Өдөр</option>
                      {startDays.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs  text-[color:var(--panel-text)] mb-2">
                  Дуусах огноо
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <select
                      value={endYear}
                      onChange={(e) => {
                        setEndYear(e.target.value ? parseInt(e.target.value) : "");
                        setEndDay(""); // Reset day when year/month changes
                      }}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Он</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={endMonth}
                      onChange={(e) => {
                        setEndMonth(e.target.value ? parseInt(e.target.value) : "");
                        setEndDay(""); // Reset day when month changes
                      }}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Сар</option>
                      {months.map((month, index) => (
                        <option key={index + 1} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={endDay}
                      onChange={(e) => setEndDay(e.target.value ? parseInt(e.target.value) : "")}
                      disabled={!endYear || !endMonth}
                      className="w-full px-3 py-2 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg text-sm text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      <option value="">Өдөр</option>
                      {endDays.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[color:var(--surface-border)]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] rounded-lg transition-colors"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Сонгох
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
