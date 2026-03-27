"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import formatNumber from "../../../../tools/function/formatNumber";

export interface OrlogoAvlagaItem {
  _id?: string;
  _gereeId?: string;
  _gereeDugaar?: string;
  _residentId?: string;
  _ner?: string;
  _ovog?: string;
  _utas?: string;
  _toot?: string;
  _davkhar?: string;
  [key: string]: any;
}

interface OrlogoAvlagaTableProps {
  data: OrlogoAvlagaItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  activeTab: "tulult" | "avlaga";
  expandedRow: string | null;
  expandedLedger: any[];
  expandedLoading: boolean;
  expandedError: string | null;
  getPaid: (item: any) => number;
  getUldegdel: (item: any) => number;
  onRowClick: (item: any) => void;
  getGereeId: (item: any) => string;
}

export const OrlogoAvlagaTable: React.FC<OrlogoAvlagaTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  activeTab,
  expandedRow,
  expandedLedger,
  expandedLoading,
  expandedError,
  getPaid,
  getUldegdel,
  onRowClick,
  getGereeId,
}) => {
  const headerClassName =
    "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold";

  const columns: ColumnsType<OrlogoAvlagaItem> = useMemo(() => {
    const baseColumns: ColumnsType<OrlogoAvlagaItem> = [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: headerClassName,
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: <span className="text-gray-900 dark:text-white">ГД</span>,
        key: "gereeniiDugaar",
        width: 100,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {record._gereeDugaar || record.gereeniiDugaar || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Нэр</span>,
        key: "ner",
        width: 100,
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {[record._ovog, record._ner].filter(Boolean).join(" ") || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Давхар</span>,
        key: "davkhar",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {record._davkhar || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Тоот</span>,
        key: "toot",
        width: 80,
        align: "center",
        className: headerClassName,
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {record._toot || "-"}
          </span>
        ),
      },
    ];

    if (activeTab === "tulult") {
      return [
        ...baseColumns,
        {
          title: <span className="text-gray-900 dark:text-white">Гүйцэтгэл</span>,
          key: "paid",
          width: 120,
          align: "center",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            const gid = getGereeId(record);
            const gd = record._gereeDugaar || record.gereeniiDugaar || gid;
            const isExpanded = expandedRow === gd;

            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="text-gray-900 dark:text-white hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {formatNumber(paid)}
                </span>
              </button>
            );
          },
        },
      ];
    } else {
      return [
        ...baseColumns,
        {
          title: <span className="text-gray-900 dark:text-white">Үлдэгдэл</span>,
          key: "uldegdel",
          width: 120,
          align: "right",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const uldegdel = getUldegdel(record);
            const gid = getGereeId(record);
            const gd = record._gereeDugaar || record.gereeniiDugaar || gid;
            const isExpanded = expandedRow === gd;

            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="text-gray-900 dark:text-white hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span
                  className={
                    uldegdel > 0
                      ? "text-red-500 dark:text-red-400 font-medium"
                      : uldegdel < 0
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-gray-900 dark:text-white"
                  }
                >
                  {formatNumber(uldegdel)}
                </span>
              </button>
            );
          },
        },
        {
          title: <span className="text-gray-900 dark:text-white">Төлөлт</span>,
          key: "paid",
          width: 120,
          align: "right",
          className: headerClassName,
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            return (
              <span className="text-green-600 dark:text-green-400">
                {formatNumber(paid)}
              </span>
            );
          },
        },
      ];
    }
  }, [
    activeTab,
    page,
    pageSize,
    expandedRow,
    getPaid,
    getUldegdel,
    onRowClick,
    getGereeId,
  ]);

  const expandedRowRender = (record: OrlogoAvlagaItem) => {
    const gid = getGereeId(record);
    const gd = record._gereeDugaar || record.gereeniiDugaar || gid;
    const isExpanded = expandedRow === gd;

    if (!isExpanded) return null;

    const ledgerColumns: ColumnsType<any> = [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: headerClassName,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: <span className="text-gray-900 dark:text-white">Огноо</span>,
        dataIndex: "ognoo",
        key: "ognoo",
        width: 100,
        className: headerClassName,
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val ? new Date(val).toLocaleDateString("mn-MN") : "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Тайлбар</span>,
        dataIndex: "tailbar",
        key: "tailbar",
        width: 120,
        className: headerClassName,
        render: (val: string, row: any) => (
          <span
            className="text-gray-900 dark:text-white max-w-[180px] truncate"
            title={val || row?.ner || row?.turul || "-"}
          >
            {val || row?.ner || row?.turul || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Авлага</span>,
        dataIndex: "avlagaDun",
        key: "avlaga",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const avlaga =
            Number(row?.avlagaDun ?? row?.tulukhDun ?? row?.debit ?? 0) || 0;
          return avlaga > 0 ? (
            <span className="text-red-500 dark:text-red-400">
              {formatNumber(avlaga)}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        title: <span className="text-gray-900 dark:text-white">Төлөлт</span>,
        dataIndex: "tulsunDun",
        key: "tulult",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const tulult =
            Number(row?.tulsunDun ?? row?.tulult ?? row?.credit ?? 0) || 0;
          return tulult > 0 ? (
            <span className="text-green-600 dark:text-green-400">
              {formatNumber(tulult)}
            </span>
          ) : (
            "-"
          );
        },
      },
      {
        title: <span className="text-gray-900 dark:text-white">Үлдэгдэл</span>,
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 120,
        align: "right",
        className: headerClassName,
        render: (_: any, row: any) => {
          const uldeg = Number(row?.uldegdel ?? 0);
          return (
            <span
              className={
                uldeg > 0
                  ? "text-red-500 dark:text-red-400 font-medium"
                  : uldeg < 0
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-gray-900 dark:text-white"
              }
            >
              {formatNumber(uldeg)}
            </span>
          );
        },
      },
    ];

    return (
      <div className="p-4 bg-gray-100/50 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
          Дэлгэрэнгүй ({gd})
        </h4>
        {expandedLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Уншиж байна...
          </div>
        ) : expandedError ? (
          <div className="text-red-500 dark:text-red-400 py-2">
            Алдаа: {expandedError}
          </div>
        ) : expandedLedger.length === 0 ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400">
            Тэмдэглэл алга байна
          </div>
        ) : (
          <Table
            dataSource={expandedLedger}
            columns={ledgerColumns}
            rowKey={(record) => record._id || Math.random().toString()}
            pagination={false}
            size="small"
            bordered
            className="neu-table"
            scroll={{ y: 240 }}
            rowClassName={(record, index) => `
              ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
              text-gray-900 dark:text-white
              hover:bg-gray-100 dark:hover:bg-gray-600
              transition-colors duration-200
            `}
          />
        )}
      </div>
    );
  };

  return (
    <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) =>
          record._gereeDugaar ||
          record.gereeniiDugaar ||
          record._id ||
          Math.random().toString()
        }
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="neu-table"
        scroll={{ x: "max-content", y: 480 }}
        rowClassName={(record, index) => `
          ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
          text-gray-900 dark:text-white
          hover:bg-gray-100 dark:hover:bg-gray-600
          transition-colors duration-200
        `}
        locale={{
          emptyText: (
            <span className="text-gray-500 dark:text-gray-400">
              Мэдээлэл алга байна
            </span>
          ),
        }}
        expandable={{
          expandedRowRender,
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          rowExpandable: () => true,
          onExpand: () => {},
          expandIcon: () => null,
          expandIconColumnIndex: -1,
        }}
        summary={(pageData) => {
          if (pageData.length === 0) return null;

          let totalPaid = 0;
          let totalUldegdel = 0;

          pageData.forEach((record) => {
            totalPaid += getPaid(record);
            totalUldegdel += getUldegdel(record);
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-gray-50 dark:bg-gray-900">
                <Table.Summary.Cell index={0} colSpan={5} align="center" className="bg-gray-50 dark:bg-gray-900">
                  <span className="font-bold text-gray-900 dark:text-white force-bold">
                    Нийт
                  </span>
                </Table.Summary.Cell>
                {activeTab === "avlaga" ? (
                  <>
                    <Table.Summary.Cell index={1} align="right" className="bg-gray-50 dark:bg-gray-900">
                      <span
                        className={`font-bold force-bold ${totalUldegdel > 0 ? "text-red-500 dark:text-red-400" : totalUldegdel < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
                      >
                        {formatNumber(totalUldegdel)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right" className="bg-gray-50 dark:bg-gray-900">
                      <span className="font-bold text-green-600 dark:text-green-400 force-bold">
                        {formatNumber(totalPaid)}
                      </span>
                    </Table.Summary.Cell>
                  </>
                ) : (
                  <Table.Summary.Cell index={1} align="right" className="bg-gray-50 dark:bg-gray-900">
                    <span className="font-bold text-green-600 dark:text-green-400 force-bold">
                      {formatNumber(totalPaid)}
                    </span>
                  </Table.Summary.Cell>
                )}
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </div>
  );
};

export default OrlogoAvlagaTable;
