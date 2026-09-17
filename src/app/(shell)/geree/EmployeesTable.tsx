"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
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
  canEdit?: boolean;
  canDelete?: boolean;
  canManagePermissions?: boolean;
  onEdit?: (employee: EmployeeItem) => void;
  onDelete?: (employee: EmployeeItem) => void;
  onManagePermissions?: (employee: EmployeeItem) => void;
  onCredentialsUpdate?: (employee: EmployeeItem) => void;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 500,
  canEdit = true,
  canDelete = true,
  canManagePermissions = true,
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
        width: 40,
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
          return (
            <span className="text-gray-900 dark:text-white whitespace-nowrap">
              {name}
            </span>
          );
        },
      },
      {
        title: "Холбоо барих",
        dataIndex: "utas",
        key: "utas",
        align: "center",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Албан тушаал",
        dataIndex: "albanTushaal",
        key: "albanTushaal",
        align: "center",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        // Энэ хүснэгт 4 товчтой (эрх, нууц үг, засах, устгах) тул стандарт
        // 96px-д багтахгүй: 4 × 28px + 3 × 4px зай = 124px.
        width: 128,
        render: (_: any, record: EmployeeItem) => (
          <div className="flex gap-1 justify-center">
            {canManagePermissions && (
              <button
                type="button"
                onClick={() => onManagePermissions?.(record)}
                className="p-1.5 rounded-md action-primary hover-surface transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30"
                title="Эрх удирдлага"
              >
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onCredentialsUpdate?.(record)}
              className="p-1.5 rounded-md action-secondary hover-surface transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30"
              title="Нэвтрэх эрх"
            >
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit?.(record)}
                className="p-1.5 rounded-md action-edit hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Засах"
              >
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(record)}
                className="p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                title="Устгах"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            )}
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
      canEdit,
      canDelete,
      canManagePermissions,
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
            `emp_${String(typeof record.ner === "object" ? record.ner?.ner : record.ner)}_${record.utas || ""}_${record.albanTushaal || ""}`
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
        />
      </div>
    </div>
  );
};

export default EmployeesTable;
