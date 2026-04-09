"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
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
}

export const AvlagiinNasjiltTable: React.FC<AvlagiinNasjiltTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  totals,
}) => {
  const columns: ColumnsType<AvlagiinNasjiltItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        fixed: "left",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Гэрээ",
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        width: 100,
        align: "center",
        fixed: "left",
        render: (val: string) => (
          <span className="text-theme font-medium break-words">
            {val || "-"}
          </span>
        ),
        sorter: (a, b) => (a.gereeniiDugaar || "").localeCompare(b.gereeniiDugaar || ""),
      },
      {
        title: "Оршин суугч",
        dataIndex: "ner",
        key: "ner",
        width: 150,
        align: "center",
        fixed: "left",
        render: (val: string) => {
          if (!val) return "-";
          const parts = val.trim().split(/\s+/);
          if (parts.length >= 2) {
            const abbreviated = parts[0] ? `${parts[0].charAt(0)}.` : "";
            const fullName = [abbreviated, parts.slice(1).join(" ")].filter(Boolean).join(" ");
            return (
              <span className="text-theme font-medium break-words max-w-full" title={val}>
                {fullName}
              </span>
            );
          }
          return (
            <span className="text-theme font-medium break-words max-w-full" title={val}>
              {val}
            </span>
          );
        },
        sorter: (a, b) => (a.ner || "").localeCompare(b.ner || ""),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        width: 70,
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
        sorter: (a, b) => (Number(a.davkhar) || 0) - (Number(b.davkhar) || 0) || String(a.davkhar).localeCompare(String(b.davkhar)),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        width: 70,
        align: "center",
        render: (val: string, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {val || record.talbainDugaar || "-"}
          </span>
        ),
        sorter: (a, b) => {
          const tA = a.toot || a.talbainDugaar || "";
          const tB = b.toot || b.talbainDugaar || "";
          return Number(tA) - Number(tB) || String(tA).localeCompare(String(tB));
        },
      },
      {
        title: "Нийт",
        dataIndex: "undsenDun",
        key: "undsenDun",
        width: 100,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-theme whitespace-nowrap">
              {formatNumber(val ?? record.niitDun, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.undsenDun ?? a.niitDun ?? 0) - (b.undsenDun ?? b.niitDun ?? 0),
      },
      // {
      //   title: "Хөнгөлөлт",
      //   dataIndex: "khungulult",
      //   key: "khungulult",
      //   width: 100,
      //   align: "center",
      //   render: (val: number) => (
      //     <div className="text-right">
      //       <span className="text-theme/60 whitespace-nowrap">
      //         {formatNumber(val, 2)}
      //       </span>
      //     </div>
      //   ),
      // },
      {
        title: "Төлсөн",
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        width: 100,
        align: "center",
        render: (val: number) => (
          <div className="text-right">
            <span className="text-emerald-600 whitespace-nowrap">
              {formatNumber(val, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.tulsunDun ?? 0) - (b.tulsunDun ?? 0),
      },
      {
        title: "Авлага",
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 100,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-red-500 font-bold whitespace-nowrap">
              {formatNumber(val ?? record.tulukhDun, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.uldegdel ?? a.tulukhDun ?? 0) - (b.uldegdel ?? b.tulukhDun ?? 0),
      },
      {
        title: "0-30",
        dataIndex: "p0_30",
        key: "p0_30",
        width: 80,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-theme whitespace-nowrap">
              {formatNumber(val ?? record.avalaga0, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.p0_30 ?? a.avalaga0 ?? 0) - (b.p0_30 ?? b.avalaga0 ?? 0),
      },
      {
        title: "31-60",
        dataIndex: "p31_60",
        key: "p31_60",
        width: 80,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-theme whitespace-nowrap">
              {formatNumber(val ?? record.avlaga31, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.p31_60 ?? a.avlaga31 ?? 0) - (b.p31_60 ?? b.avlaga31 ?? 0),
      },
      {
        title: "61-90",
        dataIndex: "p61_90",
        key: "p61_90",
        width: 80,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-theme whitespace-nowrap">
              {formatNumber(val ?? record.avlaga61, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.p61_90 ?? a.avlaga61 ?? 0) - (b.p61_90 ?? b.avlaga61 ?? 0),
      },
      {
        title: "120+",
        dataIndex: "p120plus",
        key: "p120plus",
        width: 80,
        align: "center",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <div className="text-right">
            <span className="text-theme whitespace-nowrap">
              {formatNumber(val ?? record.avlaga120, 2)}
            </span>
          </div>
        ),
        sorter: (a, b) => (a.p120plus ?? a.avlaga120 ?? 0) - (b.p120plus ?? b.avlaga120 ?? 0),
      },
    ],
    [page, pageSize],
  );

  return (
    <div className="guilgee-table-wrap">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Мэдээлэл олдсонгүй" }}
        summary={() =>
          totals && data.length > 0 ? (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="center">
                  <span className="force-bold text-theme tracking-wider">
                    Нийт
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span className="force-bold text-theme">
                    {formatNumber(totals.undsenDun, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                {/* Skip commented out Khungulult column cell if we want to align, or keep it if Table logic handles it */}
                {/* Commenting this cell out too to match the header */}
                {/* <Table.Summary.Cell index={2} align="right">
                  <span className="force-bold text-theme/60">
                    {formatNumber(totals.khungulult, 2)} ₮
                  </span>
                </Table.Summary.Cell> */}
                <Table.Summary.Cell index={3} align="right">
                  <span className="force-bold text-emerald-600">
                    {formatNumber(totals.tulsunDun, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span className="force-bold text-red-500">
                    {formatNumber(totals.uldegdel, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span className="force-bold text-theme/70">
                    {formatNumber(totals.p0_30, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <span className="force-bold text-theme/70">
                    {formatNumber(totals.p31_60, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <span className="force-bold text-theme/70">
                    {formatNumber(totals.p61_90, 2)} ₮
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <span className="force-bold text-theme/70">
                    {formatNumber(totals.p120plus, 2)} ₮
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
      />
    </div>
  );
};

export default AvlagiinNasjiltTable;
