"use client";

import React from "react";
import { EmployeesTable, EmployeeItem } from "./EmployeesTable";
import { StandardPagination } from "@/components/ui/StandardTable";

interface EmployeesSectionProps {
  isValidatingAjiltan: boolean;
  currentEmployees: any[];
  filteredEmployees: any[];
  empPage: number;
  empPageSize: number;
  empTotalPages: number;
  setEmpPage: (page: number) => void;
  setEmpPageSize: (size: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
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
  canEdit,
  canDelete,
  canManagePermissions,
  onEdit,
  onDelete,
  onManagePermissions,
  onCredentialsUpdate,
}: EmployeesSectionProps) {
  if (isValidatingAjiltan) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Уншиж байна...
      </div>
    );
  }

  return (
    <div className="table-surface rounded-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="p-1 allow-overflow no-scrollbar" id="employees-table">
        <EmployeesTable
          data={currentEmployees as EmployeeItem[]}
          loading={isValidatingAjiltan}
          page={empPage}
          pageSize={empPageSize}
          canEdit={canEdit}
          canDelete={canDelete}
          canManagePermissions={canManagePermissions}
          onEdit={onEdit}
          onDelete={onDelete}
          onManagePermissions={onManagePermissions}
          onCredentialsUpdate={onCredentialsUpdate}
        />
      </div>
      <div id="employees-pagination">
        <StandardPagination
          current={empPage}
          total={filteredEmployees.length}
          pageSize={empPageSize}
          onChange={setEmpPage}
          onPageSizeChange={(v) => {
            setEmpPageSize(v);
            setEmpPage(1);
          }}
        />
      </div>
    </div>
  );
}
