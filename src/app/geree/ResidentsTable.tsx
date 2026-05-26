"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
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

          return (
            <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
              {toots.map((t: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  {t.toot}
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
                    className="p-0.5 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Хасах"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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

          if (toots.length === 1) {
            return (
              <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
                {toots[0].toot || "-"}
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
              {toots.map((t: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  {t.toot}
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
                    className="p-0.5 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Хасах"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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
