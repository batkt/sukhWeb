"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { getPaymentStatusLabel } from "@/lib/utils";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
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

type SortKey = "createdAt" | "toot" | "orts" | "davkhar";
type SortOrder = "asc" | "desc";

interface ResidentsTableProps {
  data: ResidentItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  tuluvByResidentId?: Record<string, string>;
  onEdit?: (resident: ResidentItem) => void;
  onDelete?: (resident: ResidentItem) => void;
  onSort?: (key: SortKey) => void;
}

export const ResidentsTable: React.FC<ResidentsTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  sortKey = "createdAt",
  sortOrder = "desc",
  tuluvByResidentId = {},
  onEdit,
  onDelete,
  onSort,
}) => {
  const SortHeader: React.FC<{ title: string; sortKeyValue: SortKey }> = ({
    title,
    sortKeyValue,
  }) => (
    <button
      type="button"
      onClick={() => onSort?.(sortKeyValue)}
      className="w-full inline-flex items-center justify-center gap-2"
      title={`${title}-аар эрэмбэлэх`}
    >
      <span>{title}</span>
      <span className="flex flex-col items-center">
        <ChevronUp
          className={`w-3 h-3 ${sortKey === sortKeyValue && sortOrder === "asc" ? "text-blue-500" : "text-subtle"}`}
        />
        <ChevronDown
          className={`w-3 h-3 ${sortKey === sortKeyValue && sortOrder === "desc" ? "text-blue-500" : "text-subtle"}`}
        />
      </span>
    </button>
  );

  const columns: ColumnsType<ResidentItem> = useMemo(
    () => [
      {
        title: <span className="text-inherit">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: <span className="text-inherit">Нэр</span>,
        dataIndex: "ner",
        key: "ner",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return (
            <span className="text-inherit whitespace-nowrap">
              {name}
            </span>
          );
        },
      },
      {
        title: (
          <button
            type="button"
            onClick={() => onSort?.("orts")}
            className="w-full inline-flex items-center justify-center gap-2"
            title="Орцоор эрэмбэлэх"
          >
            <span className="text-inherit">Орц</span>
            <span className="flex flex-col items-center">
              <ChevronUp
                className={`w-3 h-3 ${sortKey === "orts" && sortOrder === "asc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
              <ChevronDown
                className={`w-3 h-3 ${sortKey === "orts" && sortOrder === "desc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
            </span>
          </button>
        ),
        key: "orts",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, record: ResidentItem) => (
          <span className="text-inherit whitespace-nowrap">
            {getResidentOrts(record) || "-"}
          </span>
        ),
      },
      {
        title: (
          <button
            type="button"
            onClick={() => onSort?.("davkhar")}
            className="w-full inline-flex items-center justify-center gap-2"
            title="Давхраар эрэмбэлэх"
          >
            <span className="text-inherit">Давхар</span>
            <span className="flex flex-col items-center">
              <ChevronUp
                className={`w-3 h-3 ${sortKey === "davkhar" && sortOrder === "asc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
              <ChevronDown
                className={`w-3 h-3 ${sortKey === "davkhar" && sortOrder === "desc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
            </span>
          </button>
        ),
        key: "davkhar",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, record: ResidentItem) => (
          <span className="text-inherit whitespace-nowrap">
            {getResidentDavkhar(record) || "-"}
          </span>
        ),
      },
      {
        title: (
          <button
            type="button"
            onClick={() => onSort?.("toot")}
            className="w-full inline-flex items-center justify-center gap-2"
            title="Тоотоор эрэмбэлэх"
          >
            <span className="text-inherit">Тоот</span>
            <span className="flex flex-col items-center">
              <ChevronUp
                className={`w-3 h-3 ${sortKey === "toot" && sortOrder === "asc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
              <ChevronDown
                className={`w-3 h-3 ${sortKey === "toot" && sortOrder === "desc" ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
              />
            </span>
          </button>
        ),
        key: "toot",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, record: ResidentItem) => (
          <span className="text-inherit whitespace-nowrap">
            {getResidentToot(record) || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-inherit">Холбоо барих</span>
        ),
        dataIndex: "utas",
        key: "utas",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (val: string) => (
          <span className="text-inherit whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-inherit">Төлөв</span>,
        key: "tuluv",
        align: "center",
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, record: ResidentItem) => {
          const id = String(record?._id || "");
          const label =
            id && tuluvByResidentId[id]
              ? tuluvByResidentId[id]
              : getPaymentStatusLabel(record);
          const cls =
            label === "Төлсөн"
              ? "badge-paid"
              : label === "Хугацаа хэтэрсэн" || label === "Төлөөгүй"
                ? "badge-unpaid"
                : "badge-neutral";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 text-sm font-normal rounded-full ${cls}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        title: <span className="text-inherit">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 100,
        className: "bg-gray-50/50 dark:bg-gray-900/50 text-[color:var(--panel-text)]",
        render: (_: any, record: ResidentItem) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-2 rounded-2xl action-edit hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              title="Засах"
            >
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-2 rounded-2xl action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
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
      tuluvByResidentId,
      onEdit,
      onDelete,
      onSort,
    ],
  );

  return (
    <div className="guilgee-table-wrap bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table dark:bg-gray-900 dark:text-gray-100"
        scroll={{ x: "max-content", y: 320 }}
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
      />
    </div>
  );
};

export default ResidentsTable;
