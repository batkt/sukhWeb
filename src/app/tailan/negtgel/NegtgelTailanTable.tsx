"use client";

import React, { useMemo } from "react";
import { Table, Tooltip } from "antd";
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
  invoiceToo?: number;
  avlaga: AvlagaItem[];
}

interface NegtgelTailanTableProps {
  data: NegtgelTailanItem[];
  loading: boolean;
}

const headerClassName =
  "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-[13px]";

export function NegtgelTailanTable({ data, loading }: NegtgelTailanTableProps) {
  // Build the unique month list and avlaga type list from the data
  const { months, avlagaTypes } = useMemo(() => {
    const monthSet = new Set<string>();
    const avlagaMap = new Map<
      string,
      { tailbar: string; ognoo: string; index: number }
    >();

    (Array.isArray(data) ? data : []).forEach((row) => {
      (row.avlaga || []).forEach((b) => {
        const ym = b.ognoo ? b.ognoo.slice(0, 7) : ""; // "YYYY-MM"
        if (!ym) return;
        monthSet.add(ym);

        const zardluud =
          Array.isArray(b.zardluud) && b.zardluud.length > 0
            ? b.zardluud
            : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад" }];

        zardluud.forEach((z) => {
          if (z.dun <= 0) return;
          const zName = z.ner || z.turul || "Бусад";

          // "Менежмент нэгж" special case
          if (zName.includes("Менежментийн төлбөр")) {
            const key = `${ym}|Менежмент нэгж`;
            if (!avlagaMap.has(key)) {
              avlagaMap.set(key, {
                tailbar: "Менежмент нэгж",
                ognoo: ym,
                index: Number(ym.split("-")[1]),
              });
            }
          }
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
    const avlagaTypes = Array.from(avlagaMap.values()).sort(
      (a, b) => a.ognoo.localeCompare(b.ognoo) || a.index - b.index,
    );

    return { months, avlagaTypes };
  }, [data]);

  const columns = useMemo(() => {
    const base: any[] = [
      {
        title: "№",
        key: "index",
        align: "center" as const,
        width: 50,
        className: headerClassName,
        fixed: "left" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },

      {
        title: "Харилцагч нэр",
        key: "ner",
        className: headerClassName,
        width: 160,
        align: "center" as const,
        ellipsis: true,
        fixed: "left" as const,
        render: (_: any, record: NegtgelTailanItem) => (
          <span className="text-gray-900 dark:text-white text-[13px]">
            {record._id?.ovog || ""} {record._id?.ner || record.ner || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
        className: headerClassName,
        key: "toot",
        width: 80,
        ellipsis: true,
        align: "center" as const,
        fixed: "left" as const,
        render: (_: any, record: NegtgelTailanItem) => (
          <span className="text-gray-900 dark:text-white text-[13px]">
            {record._id?.toot || record.toot || "-"}
          </span>
        ),
      },
      {
        title: "Утас",
        className: headerClassName,
        key: "utas",
        width: 110,
        ellipsis: true,
        align: "center" as const,
        fixed: "left" as const,
        render: (_: any, record: NegtgelTailanItem) => {
          const u = record._id?.utas || record.utas;
          return (
            <span className="text-gray-900 dark:text-white text-[13px]">
              {Array.isArray(u) ? u[0] || "-" : u || "-"}
            </span>
          );
        },
      },
    ];

    // Dynamic month group columns
    months.forEach((ym) => {
      const children = avlagaTypes
        .filter((v) => v.ognoo === ym)
        .map((assessment) => ({
          title: (
            <Tooltip title={assessment.tailbar}>
              <div className="w-full break-words whitespace-normal px-1 py-1 text-center">
                {assessment.tailbar}
              </div>
            </Tooltip>
          ),
          className: headerClassName,
          dataIndex: "avlaga",
          key: `${ym}|${assessment.tailbar}`,
          align: "center" as const,
          width: 160,
          onHeaderCell: () => ({
            style: { minWidth: 160, maxWidth: 160, padding: "4px 0" },
          }),
          ellipsis: true,
          render: (values: AvlagaItem[], record: NegtgelTailanItem) => {
            if (!Array.isArray(values)) return null;

            let total = 0;
            values.forEach((b) => {
              if (b.ognoo?.slice(0, 7) === ym) {
                const zardluud =
                  Array.isArray(b.zardluud) && b.zardluud.length > 0
                    ? b.zardluud
                    : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад" }];

                zardluud.forEach((z) => {
                  if (z.dun <= 0) return;
                  const zName = z.ner || z.turul || "Бусад";

                  // Check if it is special management fee condition
                  if (
                    assessment.tailbar === "Менежмент нэгж" &&
                    zName.includes("Менежментийн төлбөр")
                  ) {
                    total += z.dun; // Can't divide by talbainKhemjee as it doesn't exist anymore in the API, we will just sum.
                  } else if (zName === assessment.tailbar) {
                    total += z.dun;
                  }
                });
              }
            });

            const isSpecialCategory =
              assessment.tailbar ===
              "Орон сууцны ашиглалт хариуцсан ажилтан, орлогын байцаагч";
            const displayTotal = isSpecialCategory ? total * 0.4 : total;

            return displayTotal > 0 || isSpecialCategory ? (
              <div className="text-right">
                <span className="text-gray-900 dark:text-white text-[13px]">
                  {formatNumber(displayTotal, 2)}
                </span>
              </div>
            ) : null;
          },
        }));

      base.push({
        title: ym,
        key: ym,
        className: headerClassName,
        align: "center" as const,
        children,
      });
    });

    // Add Absolute Balance column (Authoritative balance)
    base.push({
      title: "Нийт үлдэгдэл",
      className: headerClassName,
      dataIndex: "niitUldegdel",
      key: "niitUldegdel",
      width: 140,
      ellipsis: true,
      align: "center" as const,
      fixed: "right" as const,
      render: (e: number) => (
        <div className="text-right">
          <span className="font-semibold text-red-600 dark:text-red-400 text-[13px]">
            {formatNumber(e, 2)}
          </span>
        </div>
      ),
    });

    return base;
  }, [months, avlagaTypes]);

  return (
    <Table
      dataSource={data}
      columns={columns}
      loading={loading}
      rowKey={(record) =>
        `${record._id?.gereeniiId || ""}-${record._id?.toot || "" || record.toot || ""}-${record.ner || ""}`
      }
      size="small"
      bordered
      scroll={{ x: "max-content", y: "calc(100vh - 350px)" }}
      tableLayout="fixed"
      className="guilgee-table"
      rowClassName={(_, index) =>
        `${
          index % 2 === 0
            ? "bg-white dark:bg-gray-800"
            : "bg-gray-50 dark:bg-gray-700/50"
        } text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200`
      }
      locale={{
        emptyText: (
          <span className="text-gray-500 dark:text-gray-400">
            Мэдээлэл алга байна
          </span>
        ),
      }}
      pagination={false}
    />
  );
}
