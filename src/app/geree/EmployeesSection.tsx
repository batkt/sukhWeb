"use client";

import React from "react";
import { Edit, Trash2, Shield, Lock } from "lucide-react";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";

interface EmployeesSectionProps {
  isValidatingAjiltan: boolean;
  currentEmployees: any[];
  filteredEmployees: any[];
  empPage: number;
  empPageSize: number;
  empTotalPages: number;
  setEmpPage: (page: number) => void;
  setEmpPageSize: (size: number) => void;
  onEdit: (employee: any) => void;
  onDelete: (employee: any) => void;
  onManagePermissions: (employee: any) => void;
  onCredentialsUpdate: (employee: any) => void;
}

export default function EmployeesSection({
  isValidatingAjiltan,
  currentEmployees,
  filteredEmployees,
  empPage,
  empPageSize,
  empTotalPages,
  setEmpPage,
  setEmpPageSize,
  onEdit,
  onDelete,
  onManagePermissions,
  onCredentialsUpdate,
}: EmployeesSectionProps) {
  if (isValidatingAjiltan) {
    return <div className="text-center py-8 text-subtle">Уншиж байна...</div>;
  }

  return (
    <div className="table-surface overflow-hidden rounded-2xl w-full">
      <div className="rounded-3xl p-6 neu-table allow-overflow">
        <div
          className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full"
          id="employees-table"
        >
          <table className="table-ui text-xs min-w-full border border-[color:var(--surface-border)]">
            <thead className="z-10 bg-white dark:bg-gray-800">
              <tr>
                <th className="p-1 text-xs font-semibold text-theme text-center w-12 bg-inherit border-r border-[color:var(--surface-border)]">
                  №
                </th>
                <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                  Нэр
                </th>
                <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                  Холбоо барих
                </th>
                <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                  Албан тушаал
                </th>
                <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody>
              {!currentEmployees.length ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-subtle">
                    Хайсан мэдээлэл алга байна
                  </td>
                </tr>
              ) : (
                currentEmployees.map((p: any, idx: number) => (
                  <tr
                    key={p._id || idx}
                    className="transition-colors border-b last:border-b-0"
                  >
                    <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                      {(empPage - 1) * empPageSize + idx + 1}
                    </td>
                    <td className="p-1 text-theme whitespace-nowrap cell-left border-r border-[color:var(--surface-border)]">
                      {typeof p.ner === "object"
                        ? `${p.ner?.ner || ""} ${p.ner?.kod || ""}`.trim() || "-"
                        : p.ner || "-"}
                    </td>
                    <td className="p-1 text-center border-r border-[color:var(--surface-border)]">
                      <div className="text-xs text-theme">{p.utas}</div>
                    </td>
                    <td className="p-1 text-center border-r border-[color:var(--surface-border)]">{p.albanTushaal || "-"}</td>
                    <td className="p-1 whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            console.log("🔵 Shield button CLICKED!", p);
                            onManagePermissions(p);
                          }}
                          className="p-1 rounded-2xl action-primary hover-surface transition-colors"
                          title="Эрх тохируулах"
                          id="employees-permissions-btn"
                        >
                          <Shield className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCredentialsUpdate(p)}
                          className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                          title="Нэвтрэх эрх солих"
                        >
                          <Lock className="w-4 h-4 text-orange-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                          title="Засах"
                          id="employees-edit-btn"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          className="p-1 rounded-2xl action-delete hover-surface transition-colors"
                          title="Устгах"
                          id="employees-delete-btn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1 text-md">
        <div className="font-bold text-theme/70">
          Нийт: {filteredEmployees.length}
        </div>
        <div className="flex items-center gap-3">
          <PageSongokh
            value={empPageSize}
            onChange={(v) => {
              setEmpPageSize(v);
              setEmpPage(1);
            }}
            className="text-xs px-2 py-1"
          />
          <div id="employee-pagination" className="flex items-center gap-1">
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={empPage <= 1}
              onClick={() => {
                const newPage = Math.max(1, empPage - 1);
                setEmpPage(newPage);
              }}
            >
              Өмнөх
            </button>
            <div className="text-theme/70 px-1">{empPage}</div>
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={empPage >= empTotalPages}
              onClick={() => {
                const newPage = Math.min(empTotalPages, empPage + 1);
                setEmpPage(newPage);
              }}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
