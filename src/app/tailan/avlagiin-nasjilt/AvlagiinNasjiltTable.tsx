"use client";

import React, { useMemo } from "react";
import formatNumber from "tools/function/formatNumber";

export interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  ner: string;
  toot: string;
  davkhar: string;
  register: string;
  undsenDun: number;
  aldangi: number;
  khungulult: number;
  tulsunDun: number;
  uldegdel: number;
  p0_30: number;
  p31_60: number;
  p61_90: number;
  p120plus: number;
  [key: string]: any;
}

interface AvlagiinNasjiltTableProps {
  data: AvlagiinNasjiltItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totals?: {
    undsenDun: number;
    khungulult: number;
    tulsunDun: number;
    uldegdel: number;
    p0_30: number;
    p31_60: number;
    p61_90: number;
    p120plus: number;
  };
  authoritativeTotals?: {
    totalPaid: number;
    totalUldegdel: number;
    totalBilled: number;
  };
}

export const AvlagiinNasjiltTable: React.FC<AvlagiinNasjiltTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  totals,
  authoritativeTotals,
}) => {

  const columns = useMemo(() => [
    { key: "index", label: "№", width: "50px", align: "center" as const, fixed: true },
    { key: "gereeniiDugaar", label: "Гэрээ", width: "100px", align: "center" as const, fixed: true },
    { key: "ner", label: "Оршин суугч", width: "160px", align: "left" as const, fixed: true },
    { key: "davkhar", label: "Давхар", width: "70px", align: "center" as const },
    { key: "toot", label: "Тоот", width: "70px", align: "center" as const },
    { key: "undsenDun", label: "Төлөх", width: "120px", align: "right" as const },
    { key: "tulsunDun", label: "Төлсөн", width: "120px", align: "right" as const },
    { key: "uldegdel", label: "Нийт үлдэгдэл", width: "140px", align: "right" as const },
    { key: "p0_30", label: "0-30", width: "100px", align: "right" as const },
    { key: "p31_60", label: "31-60", width: "100px", align: "right" as const },
    { key: "p61_90", label: "61-90", width: "100px", align: "right" as const },
    { key: "p120plus", label: "120+", width: "100px", align: "right" as const },
  ], []);

  const formatNer = (val: string) => {
    if (!val) return "-";
    const parts = val.trim().split(/\s+/);
    if (parts.length >= 2) {
      const abbreviated = parts[0] ? `${parts[0].charAt(0)}.` : "";
      return [abbreviated, parts.slice(1).join(" ")].filter(Boolean).join(" ");
    }
    return val;
  };

  const getCellValue = (record: AvlagiinNasjiltItem, key: string, index: number) => {
    switch (key) {
      case "index":
        return (page - 1) * pageSize + index + 1;
      case "ner":
        return formatNer(record.ner);
      case "gereeniiDugaar":
        return record.gereeniiDugaar || "-";
      case "davkhar":
        return record.davkhar || "-";
      case "toot":
        return record.toot || record.talbainDugaar || "-";
      case "undsenDun":
        return formatNumber(record.undsenDun ?? record.niitDun ?? 0, 2);
      case "tulsunDun":
        return formatNumber(record.tulsunDun ?? 0, 2);
      case "uldegdel":
        return formatNumber(record.uldegdel ?? record.tulukhDun ?? 0, 2);
      case "p0_30":
        return formatNumber(record.p0_30 ?? record.avalaga0 ?? 0, 2);
      case "p31_60":
        return formatNumber(record.p31_60 ?? record.avlaga31 ?? 0, 2);
      case "p61_90":
        return formatNumber(record.p61_90 ?? record.avlaga61 ?? 0, 2);
      case "p120plus":
        return formatNumber(record.p120plus ?? record.avlaga120 ?? 0, 2);
      default:
        return "-";
    }
  };

  const getCellClassName = (key: string, record?: AvlagiinNasjiltItem, value?: number) => {
    if (key === "tulsunDun") return "text-emerald-600 dark:text-emerald-400";
    if (key === "uldegdel") {
      const val = record ? Number(record.uldegdel ?? record.tulukhDun ?? 0) : (value ?? 0);
      return val < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
    }
    const val = record ? Number(record[key] || 0) : (value ?? 0);
    if (["p0_30", "p31_60", "p61_90", "p120plus"].includes(key) && val < 0) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    return "text-gray-900 dark:text-white";
  };

  const getTotalValue = (key: string) => {
    switch (key) {
      case "undsenDun": return formatNumber(totals?.undsenDun ?? 0, 2);
      case "tulsunDun": return formatNumber(totals?.tulsunDun ?? 0, 2);
      case "uldegdel": return formatNumber(totals?.uldegdel ?? 0, 2);
      case "p0_30": return formatNumber(totals?.p0_30 || 0, 2);
      case "p31_60": return formatNumber(totals?.p31_60 || 0, 2);
      case "p61_90": return formatNumber(totals?.p61_90 || 0, 2);
      case "p120plus": return formatNumber(totals?.p120plus || 0, 2);
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Уншиж байна...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">Мэдээлэл олдсонгүй</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <div
        className="overflow-auto custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        <table className="w-full border-collapse" style={{ minWidth: "1200px" }}>
          {/* Header */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-3 py-3 text-[13px] tracking-tight whitespace-nowrap
                    border-b-2 border-gray-200 dark:border-gray-600
                    text-gray-700 dark:text-gray-200
                    ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                    ${col.fixed ? "sticky left-0 z-30 bg-gray-50 dark:bg-gray-800" : ""}
                  `}
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    ...(col.fixed && col.key === "gereeniiDugaar" ? { left: "50px" } : {}),
                    ...(col.fixed && col.key === "ner" ? { left: "150px" } : {}),
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((record, index) => (
              <tr
                key={record._id || `row-${index}`}
                className={`
                  transition-colors duration-100
                  ${index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50/50 dark:bg-gray-800/30"
                  }
                  hover:bg-blue-50/60 dark:hover:bg-blue-900/15
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-3 py-2.5 text-[13px] whitespace-nowrap
                      border-b border-gray-100 dark:border-gray-800
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                      ${getCellClassName(col.key, record)}
                      ${col.fixed ? "sticky left-0 z-10 bg-inherit" : ""}
                    `}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      ...(col.fixed && col.key === "gereeniiDugaar" ? { left: "50px" } : {}),
                      ...(col.fixed && col.key === "ner" ? { left: "150px" } : {}),
                    }}
                  >
                    {getCellValue(record, col.key, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Footer */}
          {data.length > 0 && (
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm border-t-2 border-gray-300 dark:border-gray-600">
                {columns.map((col) => {
                  const totalVal = getTotalValue(col.key);
                  const isFirstGroup = ["index", "gereeniiDugaar", "ner", "davkhar", "toot"].includes(col.key);

                  return (
                    <td
                      key={col.key}
                      className={`
                        px-3 py-3 text-[13px] font-medium whitespace-nowrap
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                        ${getCellClassName(col.key, undefined, totals?.[col.key as keyof typeof totals] || 0)}
                        ${col.fixed ? "sticky left-0 z-30 bg-gray-100 dark:bg-gray-800" : ""}
                      `}
                      style={{
                        width: col.width,
                        minWidth: col.width,
                        ...(col.fixed && col.key === "gereeniiDugaar" ? { left: "50px" } : {}),
                        ...(col.fixed && col.key === "ner" ? { left: "150px" } : {}),
                      }}
                    >
                      {col.key === "index" ? "" :
                       col.key === "ner" ? "Нийт" :
                       isFirstGroup ? "" :
                       totalVal || ""}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default AvlagiinNasjiltTable;
