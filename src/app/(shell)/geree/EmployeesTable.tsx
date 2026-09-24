"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Edit, Trash2, Shield } from "lucide-react";

export interface EmployeeItem {
  _id?: string;
  ovog?: string;
  ner?: string | { ner?: string; kod?: string };
  utas?: string;
  /**
   * И-мэйл. Кодод ГУРВАН бичиглэл зэрэг оршдог тул гурвууланг уншина:
   *   • `mail`  — backend моделын (`models/ajiltan.js`) жинхэнэ талбар
   *   • `email` — ажилтан бүртгэх формын илгээдэг нэр
   *   • `imeil` — `EmployeePermissionsModal`-ийн уншдаг нэр
   */
  mail?: string;
  email?: string;
  imeil?: string;
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
        title: "Овог",
        dataIndex: "ovog",
        key: "ovog",
        width: 140,
        align: "left",
        render: (val: string) => (
          <span
            title={val || undefined}
            className="block truncate text-[color:var(--panel-text)] dark:text-white"
          >
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: 180,
        align: "left",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return (
            // Өргөн зарласан тул урт нэр багана хэтрүүлэхгүй — таслаад
            // бүтнийг `title`-аар үзүүлнэ.
            <span
              title={name === "-" ? undefined : name}
              className="block truncate text-[color:var(--panel-text)] dark:text-white"
            >
              {name}
            </span>
          );
        },
      },
      {
        title: "Утас",
        dataIndex: "utas",
        key: "utas",
        width: 140,
        align: "center",
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Mail",
        key: "mail",
        width: 220,
        align: "center",
        render: (_: any, record: EmployeeItem) => {
          const mail = record.mail || record.email || record.imeil || "";
          return (
            <span
              title={mail || undefined}
              className="block truncate text-[color:var(--panel-text)] dark:text-white"
            >
              {mail || "-"}
            </span>
          );
        },
      },
      {
        title: "Албан тушаал",
        dataIndex: "albanTushaal",
        key: "albanTushaal",
        width: 180,
        align: "center",
        render: (val: string) => (
          <span
            title={val || undefined}
            className="block truncate text-[color:var(--panel-text)] dark:text-white"
          >
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        // 3 товч (эрх, засах, устгах). Нэвтрэх нэр / нууц үг солих нь
        // "Засах" цонх руу нэгдсэн.
        width: 120,
        render: (_: any, record: EmployeeItem, index: number) => (
          <div className="flex gap-1 justify-center">
            {canManagePermissions && (
              <button
                type="button"
                onClick={() => onManagePermissions?.(record)}
                id={index === 0 ? "employee-permission-btn" : undefined}
                className="p-1.5 rounded-md action-primary hover-surface transition-colors hover:bg-theme/10"
                title="Эрх удирдлага"
              >
                <Shield className="w-4 h-4 text-brand" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit?.(record)}
                id={index === 0 ? "employee-edit-btn" : undefined}
                className="p-1.5 rounded-md action-edit hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
                title="Засах"
              >
                <Edit className="w-4 h-4 text-brand" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(record)}
                id={index === 0 ? "employee-delete-btn" : undefined}
                className="p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-danger/10"
                title="Устгах"
              >
                <Trash2 className="w-4 h-4 text-danger" />
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
              <span className="text-[color:var(--muted-text)]">
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
