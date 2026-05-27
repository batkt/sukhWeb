"use client";

import React, { useMemo } from "react";
import { Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { getPaymentStatusLabel } from "@/lib/utils";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

export interface ResidentItem {
  _id?: string;
  ner?: string | { ner?: string; kod?: string };
  utas?: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  [key: string]: any;
}

type SortKey = string;
type SortOrder = "asc" | "desc";

interface ResidentsTableProps {
  data: ResidentItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  currentBaiguullagiinId?: string;
  onEdit?: (resident: ResidentItem) => void;
  onDelete?: (resident: ResidentItem) => void;
  onRemoveToot?: (residentId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  onSort?: (key: SortKey, order?: "ascend" | "descend" | null) => void;
  /** Viewport-based scroll height (same idea as /tulbur) */
  maxHeight?: string | number;
}

export const ResidentsTable: React.FC<ResidentsTableProps> = React.memo(({
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  sortKey = "createdAt",
  sortOrder = "desc",
  currentBaiguullagiinId,
  onEdit,
  onDelete,
  onRemoveToot,
  onSort,
  maxHeight = "calc(100vh - 460px)",
}) => {
  const columns: ColumnsType<ResidentItem> = useMemo(
    () => [
      // ... (index and ner columns omitted for brevity, keeping them as they are)
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Нэр
          </span>
        ),
        dataIndex: "ner",
        key: "ner",
        width: 250,
        sorter: true,
        sortOrder:
          sortKey === "ner"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "left",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return (
            <span className="text-gray-900 dark:text-white whitespace-nowrap">
              {name}
            </span>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Орц
          </span>
        ),
        key: "orts",
        dataIndex: "orts",
        width: 80,
        sorter: true,
        sortOrder:
          sortKey === "orts"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ResidentItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {getResidentOrtsuud(record) || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Давхар
          </span>
        ),
        key: "davkhar",
        dataIndex: "davkhar",
        width: 90,
        sorter: true,
        sortOrder:
          sortKey === "davkhar"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ResidentItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {getResidentDavkhauraud(record) || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Тоот
          </span>
        ),
        key: "toot",
        dataIndex: "toot",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "toot"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ResidentItem) => {
          let toots =
            Array.isArray(record.toots) && record.toots.length > 0
              ? record.toots
              : [
                  {
                    toot: record.toot,
                    baiguullagiinId: record.baiguullagiinId,
                    barilgiinId: record.barilgiinId,
                    turul: record.turul || "Орон сууц",
                  },
                ];
          
          // Filter by currentBaiguullagiinId if provided
          if (currentBaiguullagiinId) {
            toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
          }

          // Only show main housing units
          toots = toots.filter((t: any) => t.turul !== "Гараж" && t.turul !== "Агуулах");

          if (toots.length === 0) return "-";

          if (toots.length === 1) {
            return (
              <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
                {toots[0].toot || "-"}
              </span>
            );
          }

          const tooltipContent = (
            <div className="space-y-1.5 p-1 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : t.turul === "Агуулах" ? "Агуулах" : "Орон сууц";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs py-0.5">
                    <span className="text-white font-medium">{t.toot} ({label})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`${t.toot} тоотыг хасах уу?`)) {
                          onRemoveToot?.(
                            String(record._id),
                            t.baiguullagiinId,
                            t.barilgiinId,
                            t.toot,
                          );
                        }
                      }}
                      className="p-0.5 text-red-400 hover:text-red-500 rounded hover:bg-red-950/30 transition-colors"
                      title="Хасах"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
              <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {toots[0].toot}
                <span className="text-[10px] text-slate-500 font-bold">
                  +{toots.length - 1}
                </span>
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Гараж / Агуулах
          </span>
        ),
        key: "garage_storage",
        width: 140,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ResidentItem) => {
          let toots =
            Array.isArray(record.toots) && record.toots.length > 0
              ? record.toots
              : [
                  {
                    toot: record.toot,
                    baiguullagiinId: record.baiguullagiinId,
                    barilgiinId: record.barilgiinId,
                    turul: record.turul || "Орон сууц",
                  },
                ];
          
          // Filter by currentBaiguullagiinId if provided
          if (currentBaiguullagiinId) {
            toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
          }

          // Only show Garage or Storage
          toots = toots.filter((t: any) => t.turul === "Гараж" || t.turul === "Агуулах");

          if (toots.length === 0) return "-";

          const tooltipContent = (
            <div className="space-y-1.5 p-1 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : "Агуулах";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs py-0.5">
                    <span className="text-white font-medium">{t.toot} ({label})</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`${t.toot} тоотыг хасах уу?`)) {
                          onRemoveToot?.(
                            String(record._id),
                            t.baiguullagiinId,
                            t.barilgiinId,
                            t.toot,
                          );
                        }
                      }}
                      className="p-0.5 text-red-400 hover:text-red-500 rounded hover:bg-red-950/30 transition-colors"
                      title="Хасах"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
              <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {toots[0].toot}
                {toots.length > 1 && (
                  <span className="text-[10px] text-slate-500 font-bold">
                    +{toots.length - 1}
                  </span>
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Холбоо барих
          </span>
        ),
        dataIndex: "utas",
        key: "utas",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "utas"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block">
            Төлөв
          </span>
        ),
        key: "tuluv",
        width: 110,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: any) => {
          const uldegdel = Number(record?.uldegdel ?? record?.ekhniiUldegdel ?? 0);
          const label = uldegdel <= 0 ? "Төлсөн" : "Төлөөгүй";
          const cls =
            label === "Төлсөн"
              ? "badge-paid"
              : "badge-unpaid";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 font-normal rounded-full ${cls}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        title: <span className="text-gray-900 dark:text-white">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 100,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ResidentItem, index: number) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-2 rounded-2xl action-edit hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              id={index === 0 ? "resident-edit-btn" : undefined}
              title="Засах"
            >
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-2 rounded-2xl action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              id={index === 0 ? "resident-delete-btn" : undefined}
              title="Устгах"
            >
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        ),
      },
    ],
    [
      page,
      pageSize,
      sortKey,
      sortOrder,
      onEdit,
      onDelete,
      onRemoveToot,
      onSort,
    ],
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record._id ||
            `res_${String(typeof record.ner === "object" ? record.ner?.ner : record.ner)}_${record.toot}_${record.utas}`
          }
          pagination={false}
          size="small"
          bordered
          loading={loading}
          className="guilgee-table geree-equal-height min-w-[1000px] dark:bg-gray-900 dark:text-gray-100"
          scroll={{ x: "max-content", y: maxHeight as any }}
          rowClassName={(record, index) => `
        ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
        text-gray-900 dark:text-white
        hover:bg-gray-100 dark:hover:bg-gray-600
        transition-colors duration-200
      `}
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          onChange={(_: any, __: any, sorter: any) => {
            if (onSort) {
              onSort((sorter.field || sorter.columnKey) as SortKey, sorter.order);
            }
          }}
        />
      </div>
    </div>
  );
});


export default ResidentsTable;
