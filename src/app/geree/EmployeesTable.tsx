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
        title: "Холбоо барих",
        dataIndex: "utas",
        key: "utas",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Албан тушаал",
        dataIndex: "albanTushaal",
        key: "albanTushaal",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 180,
        render: (_: any, record: EmployeeItem) => (
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => onManagePermissions?.(record)}
              className="p-2 rounded-2xl action-primary hover-surface transition-colors"
              title="Эрх удирдлага"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onCredentialsUpdate?.(record)}
              className="p-2 rounded-2xl action-secondary hover-surface transition-colors"
              title="Нэвтрэх эрх"
            >
              <Lock className="w-5 h-5" />
            </button>
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
      onEdit,
      onDelete,
      onManagePermissions,
      onCredentialsUpdate,
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
        scroll={{ x: "max-content", y: 480 }}
        locale={{ emptyText: "Хайсан мэдээлэл алга байна" }}
      />
    </div>
  );
};

export default EmployeesTable;
