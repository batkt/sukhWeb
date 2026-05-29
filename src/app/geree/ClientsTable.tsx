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

export interface ClientItem {
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

interface ClientsTableProps {
  data: ClientItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  currentBaiguullagiinId?: string;
  onEdit?: (Client: ClientItem) => void;
  onDelete?: (Client: ClientItem) => void;
  onRemoveToot?: (ClientId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  onSort?: (key: SortKey, order?: "ascend" | "descend" | null) => void;
  /** Viewport-based scroll height (same idea as /tulbur) */
  maxHeight?: string | number;
}

export const ClientsTable: React.FC<ClientsTableProps> = React.memo(({
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
  const columns: ColumnsType<ClientItem> = useMemo(
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
            Зогсоол / Агуулах
          </span>
        ),
        key: "garage_storage",
        width: 140,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ClientItem) => {
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

          // Only show Zogsool or Aguulakh
          toots = toots.filter((t: any) => t.turul === "Гараж" || t.turul === "Агуулах");

          if (toots.length === 0) return "-";



          const tooltipContent = (
            <div className="space-y-1.5 p-1 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : "Агуулах";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs py-0.5">
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
          const payLabel = uldegdel <= 0 ? "Төлсөн" : "Төлөөгүй";
          const payClass = payLabel === "Төлсөн" ? "badge-paid" : "badge-unpaid";
          return (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2 py-0.5 font-normal rounded-full text-xs ${payClass}`}>
                {payLabel}
              </span>
            </div>
          );
        },
      },
      {
        title: <span className="text-gray-900 dark:text-white">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 100,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: ClientItem, index: number) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-2 rounded-2xl action-edit hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              id={index === 0 ? "Client-edit-btn" : undefined}
              title="Засах"
            >
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-2 rounded-2xl action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              id={index === 0 ? "Client-delete-btn" : undefined}
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


export default ClientsTable;
