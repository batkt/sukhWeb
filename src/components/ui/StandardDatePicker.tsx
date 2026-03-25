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
    borderRadius: "6px",
    ...style,
  };

  // Extract legacy classNames object if passed
  const legacyClassNames = (props as any).classNames || {};
  const rootClassName = legacyClassNames.root || "";
  const inputClassName = legacyClassNames.input || "";

  // Combine passed className with standardized ones, removing the harsh default white background
  const combinedClassName =
    `w-full !border-slate-200 dark:!border-slate-800 !bg-transparent hover:!border-sky-500 focus:!border-sky-500 transition-all font-inter h-full shadow-sm ${className} ${rootClassName} ${inputClassName}`.trim();

  return (
    <ConfigProvider
      locale={mn_MN}
      theme={{
        token: {
          colorBgContainer: "transparent",
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
