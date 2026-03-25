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
  const columns: ColumnsType<OrlogoAvlagaItem> = useMemo(() => {
    const baseColumns: ColumnsType<OrlogoAvlagaItem> = [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "ГД",
        key: "gereeniiDugaar",
        width: 100,
        align: "center",
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-theme whitespace-nowrap">
            {record._gereeDugaar || record.gereeniiDugaar || "-"}
          </span>
        ),
      },
      {
        title: "Нэр",
        key: "ner",
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-theme whitespace-nowrap">
            {[record._ovog, record._ner].filter(Boolean).join(" ") || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
        key: "davkhar",
        width: 80,
        align: "center",
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-theme whitespace-nowrap">
            {record._davkhar || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
        key: "toot",
        width: 80,
        align: "center",
        render: (_: any, record: OrlogoAvlagaItem) => (
          <span className="text-theme whitespace-nowrap">
            {record._toot || "-"}
          </span>
        ),
      },
    ];

    if (activeTab === "tulult") {
      return [
        ...baseColumns,
        {
          title: "Гүйцэтгэл",
          key: "paid",
          width: 150,
          align: "right",
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            const gid = getGereeId(record);
            const gd = record._gereeDugaar || record.gereeniiDugaar || gid;
            const isExpanded = expandedRow === gd;

            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="text-theme hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="text-green-600 font-medium">
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
          title: "Үлдэгдэл",
          key: "uldegdel",
          width: 150,
          align: "right",
          render: (_: any, record: OrlogoAvlagaItem) => {
            const uldegdel = getUldegdel(record);
            const gid = getGereeId(record);
            const gd = record._gereeDugaar || record.gereeniiDugaar || gid;
            const isExpanded = expandedRow === gd;

            return (
              <button
                type="button"
                onClick={() => onRowClick(record)}
                className="hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span
                  className={
                    uldegdel > 0
                      ? "text-red-500 font-medium"
                      : uldegdel < 0
                        ? "text-emerald-600 font-medium"
                        : "text-theme"
                  }
                >
                  {formatNumber(uldegdel)}
                </span>
              </button>
            );
          },
        },
        {
          title: "Гүйцэтгэл",
          key: "paid",
          width: 150,
          align: "right",
          render: (_: any, record: OrlogoAvlagaItem) => {
            const paid = getPaid(record);
            return <span className="text-green-600">{formatNumber(paid)}</span>;
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
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Огноо",
        dataIndex: "ognoo",
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
        dataIndex: "tailbar",
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
        dataIndex: "avlagaDun",
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
        dataIndex: "tulsunDun",
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
        dataIndex: "uldegdel",
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
      <div className="p-4 bg-[color:var(--surface-hover)]/20">
        <h4 className="text-sm font-semibold mb-3">Дэлгэрэнгүй ({gd})</h4>
        {expandedLoading ? (
          <div className="py-4 text-center text-theme/60">Уншиж байна...</div>
        ) : expandedError ? (
          <div className="text-red-500 py-2">Алдаа: {expandedError}</div>
        ) : expandedLedger.length === 0 ? (
          <div className="py-4 text-center text-theme/60">
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
            className="guilgee-table"
            scroll={{ y: 240 }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="guilgee-table-wrap">
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
        className="guilgee-table"
        scroll={{ x: "max-content", y: 480 }}
        locale={{ emptyText: "Мэдээлэл алга байна" }}
        expandable={{
          expandedRowRender,
          expandedRowKeys: expandedRow ? [expandedRow] : [],
          rowExpandable: () => true,
          onExpand: () => {},
          expandIcon: () => null,
        }}
      />
    </div>
  );
};

export default OrlogoAvlagaTable;
