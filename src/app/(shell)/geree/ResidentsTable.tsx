"use client";

import React, { useMemo } from "react";
import { Tooltip } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Edit, Eye, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
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
  /** Оршин суугчийн БҮХ мэдээллийг нэг модалаас харах. */
  onView?: (resident: ResidentItem) => void;
  onDelete?: (resident: ResidentItem) => void;
  onRemoveToot?: (residentId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  onSort?: (key: SortKey, order?: "ascend" | "descend" | null) => void;
}

export const ResidentsTable: React.FC<ResidentsTableProps> = React.memo(({
  data,
  loading = false,
  page = 1,
  pageSize = 500,
  sortKey = "createdAt",
  sortOrder = "desc",
  currentBaiguullagiinId,
  onEdit,
  onView,
  onDelete,
  onRemoveToot,
  onSort,
}) => {
  const columns: ColumnsType<ResidentItem> = useMemo(
    () => [
      // ... (index and ner columns omitted for brevity, keeping them as they are)
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Нэр",
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
        title: "Орц",
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
        render: (_: any, record: ResidentItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {getResidentOrtsuud(record) || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
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
        render: (_: any, record: ResidentItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {getResidentDavkhauraud(record) || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
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

          // Deduplicate toots array
          const seenToots = new Set<string>();
          toots = toots.filter((t: any) => {
            const key = `${t.toot}_${t.barilgiinId || ""}_${t.turul || "Орон сууц"}`;
            if (seenToots.has(key)) return false;
            seenToots.add(key);
            return true;
          });

          if (toots.length === 0) return "-";

          const tooltipContent = (
            <div className="space-y-1.5 p-1.5 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : t.turul === "Агуулах" ? "Агуулах" : "Орон сууц";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-white font-medium">Тоот {t.toot} {label}</span>
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
              <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {toots[0].toot}
                {toots.length > 1 && (
                  <span className="text-slate-500 font-bold">
                    +{toots.length - 1}
                  </span>
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "Гараж / Агуулах",
        key: "garage_storage",
        width: 140,
        align: "center",
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
            <div className="space-y-1.5 p-1.5 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : "Агуулах";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-white font-medium">Тоот {t.toot} {label}</span>
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
              <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {toots[0].toot}
                {toots.length > 1 && (
                  <span className="text-slate-500 font-bold">
                    +{toots.length - 1}
                  </span>
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "Холбоо барих",
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
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Төлөв",
        key: "tuluv",
        width: 110,
        align: "center",
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
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 96,
        render: (_: any, record: ResidentItem, index: number) => (
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              onClick={() => onView?.(record)}
              className="p-1.5 rounded-md hover-surface transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              id={index === 0 ? "resident-view-btn" : undefined}
              title="Бүх мэдээлэл харах"
            >
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-1.5 rounded-md action-edit hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              id={index === 0 ? "resident-edit-btn" : undefined}
              title="Засах"
            >
              <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              id={index === 0 ? "resident-delete-btn" : undefined}
              title="Устгах"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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
      onView,
      onDelete,
      onRemoveToot,
      onSort,
    ],
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record._id ||
            `res_${String(typeof record.ner === "object" ? record.ner?.ner : record.ner)}_${record.toot}_${record.utas}`
          }
          pagination={false}
          loading={loading}
          className="min-w-[1000px]"
          scroll={{ x: "max-content" }}
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
