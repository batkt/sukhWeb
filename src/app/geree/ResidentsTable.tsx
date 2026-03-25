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
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return <span className="text-theme whitespace-nowrap">{name}</span>;
        },
      },
      {
        title: <SortHeader title="Орц" sortKeyValue="orts" />,
        key: "orts",
        align: "center",
        render: (_: any, record: ResidentItem) => (
          <span className="text-theme whitespace-nowrap">
            {getResidentOrts(record) || "-"}
          </span>
        ),
      },
      {
        title: <SortHeader title="Давхар" sortKeyValue="davkhar" />,
        key: "davkhar",
        align: "center",
        render: (_: any, record: ResidentItem) => (
          <span className="text-theme whitespace-nowrap">
            {getResidentDavkhar(record) || "-"}
          </span>
        ),
      },
      {
        title: <SortHeader title="Тоот" sortKeyValue="toot" />,
        key: "toot",
        align: "center",
        render: (_: any, record: ResidentItem) => (
          <span className="text-theme whitespace-nowrap">
            {getResidentToot(record) || "-"}
          </span>
        ),
      },
      {
        title: "Холбоо барих",
        dataIndex: "utas",
        key: "utas",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Төлөв",
        key: "tuluv",
        align: "center",
        render: (_: any, record: ResidentItem) => {
          const id = String(record?._id || "");
          const label =
            id && tuluvByResidentId[id]
              ? tuluvByResidentId[id]
              : getPaymentStatusLabel(record);
          const cls =
            label === "Төлсөн"
              ? "badge-paid"
              : label === "Хугацаа хэтэрсэн"
                ? "bg-red-500 text-red-800"
                : label === "Төлөөгүй"
                  ? "badge-unpaid"
                  : "badge-neutral";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5  text-sm font-normal ${cls}`}
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
        width: 100,
        render: (_: any, record: ResidentItem) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-2 rounded-2xl action-edit hover-surface transition-colors"
              title="Засах"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-2 rounded-2xl action-delete hover-surface transition-colors"
              title="Устгах"
            >
              <Trash2 className="w-5 h-5" />
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
        scroll={{ x: "max-content", y: 400 }}
        locale={{ emptyText: "Хайсан мэдээлэл алга байна" }}
      />
    </div>
  );
};

export default ResidentsTable;
