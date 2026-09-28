"use client";

import React from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

/**
 * Апп даяар НЭГ загвартай «Excel» товч.
 *
 * Өмнө нь хуудас бүр өөрийн товчтой байсан (neu-panel, IconTextButton,
 * Download/FileDown/FileSpreadsheet дүрс, «Excel», «Excel татах»,
 * «Жагсаалт татах» гэх мэт) — нэг хэмжээ, нэг дүрс, нэг бичвэрт нэгтгэв.
 * Загвар нь globals.css-ийн нэгдсэн `.btn-minimal`.
 */
export interface ExcelButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Товчны бичвэр. Анхдагч: «Excel» */
  label?: string;
  /** Татаж байх үед эргэлдэх дүрс харуулж, товчийг идэвхгүй болгоно */
  loading?: boolean;
  /** Жижиг дэлгэцэд зөвхөн дүрс үлдээх */
  iconOnlyOnMobile?: boolean;
  /** Үргэлж зөвхөн дүрс (бусад дүрстэй товчны мөрөнд) — бичвэр нь tooltip/aria-д */
  iconOnly?: boolean;
  /** Баруун талд нэмэлт элемент (жишээ нь dropdown-ын сум) */
  suffix?: React.ReactNode;
}

export const ExcelButton = React.forwardRef<HTMLButtonElement, ExcelButtonProps>(
  (
    {
      label = "Excel",
      loading = false,
      iconOnlyOnMobile = false,
      iconOnly = false,
      suffix,
      className = "",
      disabled,
      type = "button",
      title,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      title={title ?? label}
      aria-label={label}
      className={`btn-minimal inline-flex h-9 shrink-0 items-center gap-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${
        iconOnly ? "min-w-9 justify-center !px-2" : "!px-3"
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {!iconOnly && (
        <span className={iconOnlyOnMobile ? "hidden sm:inline" : undefined}>
          {label}
        </span>
      )}
      {suffix}
    </button>
  ),
);
ExcelButton.displayName = "ExcelButton";

export default ExcelButton;
