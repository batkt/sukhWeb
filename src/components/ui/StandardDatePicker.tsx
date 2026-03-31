"use client";

import React from "react";
import { DatePicker, ConfigProvider } from "antd";
import type { DatePickerProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/mn";
import mn_MN from "antd/lib/locale/mn_MN";

// Set default locale for dayjs
dayjs.locale("mn");

const { RangePicker } = DatePicker;

// Define common props for our standardized DatePicker
export interface StandardDatePickerProps extends Omit<
  DatePickerProps,
  "value" | "onChange"
> {
  value?:
    | string
    | Date
    | Dayjs
    | null
    | [any, any]
    | string[]
    | [string | null, string | null];
  onChange?: (date: any, dateString: any) => void;
  isRange?: boolean;
  classNames?: { root?: string; input?: string };
}

export function StandardDatePicker({
  value,
  onChange,
  placeholder = "Огноо сонгоно уу",
  format = "YYYY-MM-DD",
  allowClear = false,
  className = "",
  style,
  isRange = false,
  ...props
}: StandardDatePickerProps) {
  // Convert incoming value (string or Date) to dayjs object which Antd v5 expects
  const parsedValue = React.useMemo(() => {
    if (!value) return null;
    if (Array.isArray(value)) {
      return [
        value[0] ? dayjs(value[0]) : null,
        value[1] ? dayjs(value[1]) : null,
      ];
    }
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }, [value]);

  const handleChange = (date: any, dateString: any) => {
    if (onChange) {
      onChange(date, dateString);
    }
  };

  // The custom styles from your datepicker.md adapted for Tailwind & your theme
  const customStyles = {
    width: "100%",
    borderRadius: "16px",
    ...style,
  };

  // Extract legacy classNames object if passed
  const legacyClassNames = (props as any).classNames || {};
  const rootClassName = legacyClassNames.root || "";
  const inputClassName = legacyClassNames.input || "";

  // Combine passed className with standardized ones, removing the harsh default white background
  const combinedClassName =
    `w-full rounded-2xl !border-slate-200 dark:!border-slate-800 hover:!border-slate-300 dark:hover:!border-slate-700 focus:!border-sky-500 transition-all font-inter h-full ${className} ${rootClassName} ${inputClassName}`.trim();

  // Monitor dark mode
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider
      locale={mn_MN}
      theme={{
        token: {
          colorBgContainer: "transparent",
          // Dark mode specific tokens
          colorBgElevated: isDark ? "#1e293b" : "#ffffff", // slate-800
          colorText: isDark ? "#f1f5f9" : "#0f172a", // slate-100 / slate-900
          colorTextDescription: isDark ? "#94a3b8" : "#64748b", // slate-400 / slate-500
          colorTextDisabled: isDark ? "#475569" : "#cbd5e1",
          colorTextPlaceholder: isDark ? "#64748b" : "#94a3b8",
          colorIcon: isDark ? "#94a3b8" : "#64748b",
          colorIconHover: isDark ? "#f1f5f9" : "#0f172a",

          // Selection colors
          colorPrimary: "#10b981", // emerald-500
          colorLink: "#10b981",
          colorLinkHover: "#059669",

          // Range selection
          controlItemBgActive: isDark
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(16, 185, 129, 0.1)",
          controlItemBgHover: isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.02)",
        },
        components: {
          DatePicker: {
            cellActiveWithRangeBg: isDark
              ? "rgba(16, 185, 129, 0.2)"
              : "#e6fffb",
            cellHoverWithRangeBg: isDark
              ? "rgba(16, 185, 129, 0.1)"
              : "#f0f5ff",
            colorTextHeading: isDark ? "#f1f5f9" : "#0f172a",
          },
        },
      }}
    >
      {isRange ? (
        <RangePicker
          value={parsedValue as any}
          onChange={handleChange as any}
          format={format}
          allowClear={allowClear}
          style={customStyles}
          className={combinedClassName}
          {...(props as any)}
        />
      ) : (
        <DatePicker
          value={parsedValue}
          onChange={handleChange}
          placeholder={placeholder}
          format={format}
          allowClear={allowClear}
          style={customStyles}
          className={combinedClassName}
          {...(props as any)}
        />
      )}
    </ConfigProvider>
  );
}

export default StandardDatePicker;
