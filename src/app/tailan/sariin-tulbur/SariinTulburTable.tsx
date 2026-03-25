"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import formatNumber from "../../../../tools/function/formatNumber";

export interface SariinTulburItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  ner: string;
  toot: string;
  davkhar: string;
  sar: string;
  on: number;
  tulbur: number;
  tuluv: string;
  period?: string;
  [key: string]: any;
}

interface SariinTulburTableProps {
  data: SariinTulburItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  expandedRow: string | null;
  expandedData: any;
  expandedLoading: boolean;
  expandedError: string | null;
  onExpandClick: (item: SariinTulburItem) => void;
  totalTulbur: number;
}

export const SariinTulburTable: React.FC<SariinTulburTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  expandedRow,
  expandedData,
  expandedLoading,
  expandedError,
  onExpandClick,
  totalTulbur,
}) => {
  const columns: ColumnsType<SariinTulburItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Гэрээний дугаар",
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Төлбөр",
        key: "tulbur",
        align: "right",
        render: (_: any, record: SariinTulburItem) => {
          const rowKey = `${record.gereeniiDugaar}-${record.period || record.sar}-${record.on}-${record._id}`;
          const isExpanded = expandedRow === rowKey;

          return (
            <button
              type="button"
              onClick={() => onExpandClick(record)}
              className="hover:underline cursor-pointer flex items-center justify-end gap-1 ml-auto"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {formatNumber(record.tulbur)}
            </button>
          );
        },
      },
    ],
    [page, pageSize, expandedRow, onExpandClick],
  );

  const expandedRowRender = (record: SariinTulburItem) => {
    const rowKey = `${record.gereeniiDugaar}-${record.period || record.sar}-${record.on}-${record._id}`;
    const isExpanded = expandedRow === rowKey;

    if (!isExpanded) return null;

    const ledgerColumns: ColumnsType<any> = [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Огноо",
        key: "ognoo",
        width: 100,
        render: (val: string) => (
          <span className="text-theme/70 whitespace-nowrap">
            {val ? new Date(val).toLocaleDateString("mn-MN") : "-"}
          </span>
        ),
      },
      {
        title: "Тайлбар",
        key: "tailbar",
        render: (val: string, row: any) => (
          <span
            className="text-theme/80 max-w-[180px] truncate"
            title={val || row?.ner || row?.turul || "-"}
          >
            {val || row?.ner || row?.turul || "-"}
          </span>
        ),
      },
      {
        title: "Авлага",
        key: "avlaga",
        width: 120,
        align: "right",
        render: (_: any, row: any) => {
          const avlaga =
            Number(row?.avlagaDun ?? row?.tulukhDun ?? row?.debit ?? 0) || 0;
          return avlaga > 0 ? (
            <span className="text-red-500">{formatNumber(avlaga)}</span>
          ) : (
            "-"
          );
        },
      },
      {
        title: "Төлөлт",
        key: "tulult",
        width: 120,
        align: "right",
        render: (_: any, row: any) => {
          const tulult =
            Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0) || 0;
          return tulult > 0 ? (
            <span className="text-green-600">{formatNumber(tulult)}</span>
          ) : (
            "-"
          );
        },
      },
      {
        title: "Үлдэгдэл",
        key: "uldegdel",
        width: 120,
        align: "right",
        render: (_: any, row: any) => {
          const uldeg = Number(row?.uldegdel ?? 0);
          return (
            <span
              className={
                uldeg > 0
                  ? "text-red-500 font-medium"
                  : uldeg < 0
                    ? "text-emerald-600 font-medium"
                    : "text-theme"
              }
            >
              {formatNumber(uldeg)}
            </span>
          );
        },
      },
    ];

    return (
      <div className="p-4 bg-[color:var(--surface-hover)]/30">
        {expandedLoading ? (
          <div className="py-4 text-center">Уншиж байна...</div>
        ) : expandedError ? (
          <div className="text-red-500 py-2">Алдаа: {expandedError}</div>
        ) : expandedData ? (
          <div className="space-y-3">
            <Table
              dataSource={expandedData.rows || []}
              columns={ledgerColumns}
              rowKey={(record) => record._id || Math.random().toString()}
              pagination={false}
              size="small"
              bordered
              className="guilgee-table"
              scroll={{ y: 240 }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3} align="center">
                    <span className="font-bold text-theme text-xs">Нийт:</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span className="text-red-500">
                      {formatNumber(expandedData.totalAvlaga)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="text-green-600">
                      {formatNumber(expandedData.totalTulult)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <span
                      className={
                        expandedData.lastUldegdel > 0
                          ? "text-red-500"
                          : expandedData.lastUldegdel < 0
                            ? "text-emerald-600"
                            : "text-theme"
                      }
                    >
                      {formatNumber(expandedData.lastUldegdel)}
                    </span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="guilgee-table-wrap">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) =>
          `${record.gereeniiDugaar}-${record.period || record.sar}-${record.on}-${record._id}`
        }
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content", y: 480 }}
        locale={{ emptyText: "Мэдээлэл алга байна" }}
        expandable={{
          expandedRowRender,
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          rowExpandable: () => true,
          expandIcon: () => null,
        }}
        summary={() =>
          data.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="center">
                <span className="font-bold text-theme">Нийт</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <span className="font-bold text-theme">
                  {formatNumber(totalTulbur)}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null
        }
      />
    </div>
  );
};

export default SariinTulburTable;
