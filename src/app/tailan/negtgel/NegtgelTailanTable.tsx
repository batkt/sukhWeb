"use client";

import React, { useMemo } from "react";
import { Tooltip } from "antd";
import formatNumber from "tools/function/formatNumber";

export interface ZardalItem {
  ner?: string;
  turul?: string;
  dun: number;
}

export interface AvlagaItem {
  ognoo: string;
  tailbar: string;
  tulukhDun: number;
  zardluud?: ZardalItem[];
}

export interface NegtgelTailanItem {
  _id?: any;
  gereeniiId?: string;
  gereeniiDugaar?: string;
  register?: string;
  ovog?: string;
  ner?: string;
  utas?: string | string[];
  toot?: string;
  davkhar?: string;
  bairNer?: string;
  orts?: string;
  niitTulukhDun?: number;
  niitTulsunDun?: number;
  niitUldegdel?: number;
  globalUldegdel?: number;
  invoiceToo?: number;
  avlaga: AvlagaItem[];
}

interface NegtgelTailanTableProps {
  data: NegtgelTailanItem[];
  loading: boolean;
  authoritativeTotalUldegdel?: number;
}

const headerTitleClassName = "text-gray-900 dark:text-white text-center block text-[13px]   tracking-tight";
const cellClassName = "text-[13px] text-gray-900 dark:text-white font-medium";

export function NegtgelTailanTable({ data, loading, authoritativeTotalUldegdel }: NegtgelTailanTableProps) {
  // Build the unique month list and avlaga type list from the data
  const { months, avlagaTypes } = useMemo(() => {
    const monthSet = new Set<string>();
    const avlagaMap = new Map<
      string,
      { tailbar: string; ognoo: string; index: number }
    >();

    (Array.isArray(data) ? data : []).forEach((row) => {
      (row.avlaga || []).forEach((b) => {
        const ym = b.ognoo ? b.ognoo.slice(0, 7) : "";
        if (!ym) return;
        monthSet.add(ym);

        const zardluud =
          Array.isArray(b.zardluud) && b.zardluud.length > 0
            ? b.zardluud
            : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад" }];

        zardluud.forEach((z) => {
          if (z.dun <= 0) return;
          const zName = z.ner || "Бусад";

          const key = `${ym}|${zName}`;
          if (!avlagaMap.has(key)) {
            avlagaMap.set(key, {
              tailbar: zName,
              ognoo: ym,
              index: Number(ym.split("-")[1]),
            });
          }
        });
      });
    });

    const months = Array.from(monthSet).sort();
    const avlagaTypes = Array.from(avlagaMap.values()).sort((a, b) => {
      if (a.ognoo !== b.ognoo) return a.ognoo.localeCompare(b.ognoo);
      
      const isEkhA = a.tailbar.includes("Эхний үлдэгдэл") ? 0 : 1;
      const isEkhB = b.tailbar.includes("Эхний үлдэгдэл") ? 0 : 1;
      if (isEkhA !== isEkhB) return isEkhA - isEkhB;
      
      return a.index - b.index;
    });

    return { months, avlagaTypes };
  }, [data]);

  // Build dynamic column definitions
  const dynamicColumns = useMemo(() => {
    const cols: { key: string; label: string; monthGroup?: string; width: string; getValue: (record: NegtgelTailanItem) => number }[] = [];

    months.forEach((ym) => {
      const typesInMonth = avlagaTypes.filter((v) => v.ognoo === ym);
      typesInMonth.forEach((assessment) => {
        const getAssessValue = (record: NegtgelTailanItem) => {
          const values = record.avlaga;
          if (!Array.isArray(values)) return 0;
          let total = 0;
          values.forEach((b) => {
            if (b.ognoo?.slice(0, 7) === ym) {
              const zardluud =
                Array.isArray(b.zardluud) && b.zardluud.length > 0
                  ? b.zardluud
                  : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад" }];

              zardluud.forEach((z) => {
                if (z.dun <= 0) return;
                const zName = z.ner || "Бусад";
                if (zName === assessment.tailbar) {
                  total += z.dun;
                }
              });
            }
          });
          return total;
        };

        cols.push({
          key: `${ym}|${assessment.tailbar}`,
          label: assessment.tailbar,
          monthGroup: ym,
          width: "140px",
          getValue: getAssessValue,
        });
      });
    });

    return cols;
  }, [months, avlagaTypes]);

  // Use authoritative total from parent if available; fallback to local calculation
  const localTotalUldegdel = useMemo(() => {
    return (Array.isArray(data) ? data : []).reduce(
      (s, record) => s + Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0), 0
    );
  }, [data]);

  const totalUldegdel = authoritativeTotalUldegdel ?? localTotalUldegdel;

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
        <span className="text-sm text-gray-500 dark:text-gray-400">Мэдээлэл алга байна</span>
      </div>
    );
  }

  // Calculate min table width
  const baseWidth = 50 + 160 + 80 + 110 + 140; // №, name, toot, utas, uldegdel
  const dynamicWidth = dynamicColumns.length * 140;
  const minTableWidth = baseWidth + dynamicWidth;

  // Group months for header
  const monthGroups = months.map((ym) => ({
    ym,
    colCount: avlagaTypes.filter((v) => v.ognoo === ym).length,
  }));

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <div
        className="overflow-auto custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        <table className="w-full border-collapse" style={{ minWidth: `${minTableWidth}px` }}>
          {/* Two-row header: month groups + individual columns */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100 dark:bg-gray-800/95 backdrop-blur-sm">
              <th colSpan={4} className="px-3 py-2 text-[12px]   text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 sticky left-0 z-40">
                Харилцагч
              </th>
              {/* Month groups */}
              {monthGroups.map((mg) => (
                <th
                  key={mg.ym}
                  colSpan={mg.colCount}
                  className="px-3 py-2 text-[12px]   text-center text-gray-600 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-600"
                >
                  {mg.ym}
                </th>
              ))}
              {/* Empty placeholder to match 'Харилцагч' and '2026-04' top groupings */}
              <th className="px-3 py-2 text-[13px]   text-center text-gray-900 dark:text-white border-b border-l-2 border-gray-200 dark:border-gray-600 sticky right-0 z-40 bg-gray-100 dark:bg-gray-800">
                
              </th>
            </tr>

            {/* Detail columns row */}
            <tr className="bg-gray-50 dark:bg-gray-800/90 backdrop-blur-sm">
              <th className="px-3 py-2.5 text-[13px]   text-center border-b-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 sticky left-0 z-40 bg-gray-50 dark:bg-gray-800" style={{ width: "50px", minWidth: "50px" }}>
                №
              </th>
              <th className="px-3 py-2.5 text-[13px]   text-center border-b-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 sticky z-40 bg-gray-50 dark:bg-gray-800" style={{ width: "160px", minWidth: "160px", left: "50px" }}>
                Нэр
              </th>
              <th className="px-3 py-2.5 text-[13px]   text-center border-b-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 sticky z-40 bg-gray-50 dark:bg-gray-800" style={{ width: "80px", minWidth: "80px", left: "210px" }}>
                Тоот
              </th>
              <th className="px-3 py-2.5 text-[13px]   text-center border-b-2 border-r border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 sticky z-40 bg-gray-50 dark:bg-gray-800" style={{ width: "110px", minWidth: "110px", left: "290px" }}>
                Утас
              </th>
              {dynamicColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2.5 text-[11px] text-center border-b-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 whitespace-normal leading-tight"
                  style={{ width: col.width, minWidth: "120px" }}
                >
                  {col.label}
                </th>
              ))}
              {/* Үлдэгдэл (Second row alignment) */}
              <th className="px-3 py-2.5 text-[13px]   text-center border-b-2 border-l-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white sticky right-0 z-40 bg-gray-50 dark:bg-gray-800" style={{ width: "140px", minWidth: "140px" }}>
                Үлдэгдэл
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((record, index) => {
              const ovog = String(record._id?.ovog || record.ovog || "").trim();
              const ner = String(record._id?.ner || record.ner || "").trim();
              const abbreviated = ovog ? `${ovog.charAt(0)}.` : "";
              const fullName = [abbreviated, ner].filter(Boolean).join(" ") || "-";
              const toot = record._id?.toot || record.toot || "-";
              const u = record._id?.utas || record.utas;
              const utas = Array.isArray(u) ? u[0] || "-" : u || "-";
              // Prioritize true balance fields over just the billed amount so old balances show up even without current month invoices.
              const globalBal = Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0);

              return (
                <tr
                  key={`${record._id?.gereeniiId || ""}-${toot}-${ner}`}
                  className={`
                    transition-colors duration-100
                    ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                    hover:bg-blue-50 dark:hover:bg-blue-900/40 group
                  `}
                >
                  <td className={`px-3 py-2.5 text-[13px]  text-center border-b border-gray-100 dark:border-gray-800 sticky left-0 z-10 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} group-hover:bg-blue-50 dark:group-hover:bg-blue-950`} style={{ width: "50px" }}>
                    {index + 1}
                  </td>
                  <td className={`px-3 py-2.5 text-[13px]  text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white sticky z-10 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} group-hover:bg-blue-50 dark:group-hover:bg-blue-950`} style={{ width: "160px", left: "50px" }}>
                    {fullName}
                  </td>
                  <td className={`px-3 py-2.5 text-[13px]  text-center whitespace-nowrap border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white sticky z-10 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} group-hover:bg-blue-50 dark:group-hover:bg-blue-950`} style={{ width: "80px", left: "210px" }}>
                    {toot}
                  </td>
                  <td className={`px-3 py-2.5 text-[13px]  text-center whitespace-nowrap border-b border-r border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white sticky z-10 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} group-hover:bg-blue-50 dark:group-hover:bg-blue-950`} style={{ width: "110px", left: "290px" }}>
                    {utas}
                  </td>
                  {/* Dynamic value columns */}
                  {dynamicColumns.map((col) => {
                    const val = col.getValue(record);
                    return (
                      <td
                        key={col.key}
                        className="px-2 py-2.5 text-[13px]  text-right whitespace-nowrap border-b border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
                        style={{ width: col.width, minWidth: "120px" }}
                      >
                        {val > 0 ? formatNumber(val, 2) : ""}
                      </td>
                    );
                  })}
                  {/* Нийт үлдэгдэл */}
                  <td className={`px-3 py-2.5 text-[13px]   text-right whitespace-nowrap border-b border-l-2 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white sticky right-0 z-10 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} group-hover:bg-blue-50 dark:group-hover:bg-blue-950`} style={{ width: "140px" }}>
                    {formatNumber(globalBal, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer */}
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-gray-100/95 dark:bg-gray-800/95 backdrop-blur-sm border-t-2 border-gray-300 dark:border-gray-600 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <td colSpan={4} className="px-3 py-3 text-[13px]   text-center text-gray-900 dark:text-white sticky left-0 z-30 bg-gray-100 dark:bg-gray-800">
                  
                </td>
              {dynamicColumns.length > 0 ? (
                <td colSpan={dynamicColumns.length} className="px-3 py-3 text-[13px] font-semibold  text-right text-gray-900 dark:text-white border-gray-200 dark:border-gray-600">
                  Нийт
                </td>
              ) : (
                <td className="px-3 py-3 text-[13px] font-semibold   text-right text-gray-900 dark:text-white border-gray-200 dark:border-gray-600">
                  Нийт
                </td>
              )}
              <td className="px-3 py-3 text-[13px] font-semibold   text-right text-gray-900 dark:text-white border-l-2 border-gray-200 dark:border-gray-600 sticky right-0 z-30 bg-gray-100 dark:bg-gray-800">
                {formatNumber(totalUldegdel, 2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
