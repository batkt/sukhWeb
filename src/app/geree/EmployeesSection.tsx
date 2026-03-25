"use client";

import React from "react";
import { EmployeesTable, EmployeeItem } from "./EmployeesTable";
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
      <div className="p-3 allow-overflow">
        <EmployeesTable
          data={currentEmployees as EmployeeItem[]}
          loading={isValidatingAjiltan}
          page={empPage}
          pageSize={empPageSize}
          onEdit={onEdit}
          onDelete={onDelete}
          onManagePermissions={onManagePermissions}
          onCredentialsUpdate={onCredentialsUpdate}
        />
        {/* Pagination */}
        <div className="flex items-center justify-between px-2 py-3 text-md mt-2">
          <div className="text-theme/70">Нийт: {filteredEmployees.length}</div>
          <div className="flex items-center gap-3">
            <PageSongokh
              value={empPageSize}
              onChange={(v) => {
                setEmpPageSize(v);
                setEmpPage(1);
              }}
              className="text-sm px-2"
            />
            <div id="employees-pagination" className="flex items-center gap-1">
              <button
                className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
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
                className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
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
    </div>
  );
}
