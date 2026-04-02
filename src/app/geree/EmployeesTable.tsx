"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, Trash2, Shield, Lock } from "lucide-react";

export interface EmployeeItem {
  _id?: string;
  ner?: string | { ner?: string; kod?: string };
  utas?: string;
  albanTushaal?: string;
  [key: string]: any;
}

interface EmployeesTableProps {
  data: EmployeeItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onEdit?: (employee: EmployeeItem) => void;
  onDelete?: (employee: EmployeeItem) => void;
  onManagePermissions?: (employee: EmployeeItem) => void;
  onCredentialsUpdate?: (employee: EmployeeItem) => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  onEdit,
  onDelete,
  onManagePermissions,
  onCredentialsUpdate,
}) => {
  const columns: ColumnsType<EmployeeItem> = useMemo(
    () => [
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
          <span className="text-gray-900 dark:text-white">Холбоо барих</span>
        ),
        dataIndex: "utas",
        key: "utas",
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
          <span className="text-gray-900 dark:text-white">Албан тушаал</span>
        ),
        dataIndex: "albanTushaal",
        key: "albanTushaal",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 180,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: EmployeeItem) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onManagePermissions?.(record)}
              className="p-2 rounded-2xl action-primary hover-surface transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30"
              title="Эрх удирдлага"
            >
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              type="button"
              onClick={() => onCredentialsUpdate?.(record)}
              className="p-2 rounded-2xl action-secondary hover-surface transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
              title="Нэвтрэх эрх"
            >
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </button>
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
      onEdit,
      onDelete,
      onManagePermissions,
      onCredentialsUpdate,
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
        scroll={{ x: "max-content", y: 400 }}
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

export default EmployeesTable;
