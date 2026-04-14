"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmployeesSection from "../EmployeesSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";

export default function AjiltanPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();
  const hasGereeBase =
    hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
  const canViewEmployees =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan") ||
    hasPermission(ajiltan, "geree.ajiltan") ||
    hasPermission(ajiltan, "/geree/ajiltan/harah") ||
    hasPermission(ajiltan, "geree.ajiltan.harah");
  const canEditEmployees =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan/zasah") ||
    hasPermission(ajiltan, "geree.ajiltan.zasah");
  const canDeleteEmployees =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan/ustgah") ||
    hasPermission(ajiltan, "geree.ajiltan.ustgah");
  const canManageEmployeePermissions =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan/erkhTokhirgoo") ||
    hasPermission(ajiltan, "geree.ajiltan.erkhTokhirgoo");

  useEffect(() => {
    if (ajiltan) {
      if (!canViewEmployees) {
        router.push("/geree");
      }
    }
  }, [ajiltan, canViewEmployees, router]);

  return (
    <EmployeesSection
      isValidatingAjiltan={data.isValidatingAjiltan}
      currentEmployees={data.currentEmployees}
      filteredEmployees={data.filteredEmployees}
      empPage={state.empPage}
      empPageSize={state.empPageSize}
      empTotalPages={data.empTotalPages}
      setEmpPage={state.setEmpPage}
      setEmpPageSize={state.setEmpPageSize}
      canEdit={canEditEmployees}
      canDelete={canDeleteEmployees}
      canManagePermissions={canManageEmployeePermissions}
      onEdit={actions.handleEditEmployee}
      onDelete={(e) => {
        state.setEmployeeToDelete(e);
        state.setShowDeleteEmployeeModal(true);
      }}
      onManagePermissions={(employee) => {
        router.push(`/ajiltan/tokhirgoo/${employee._id}`);
      }}
      onCredentialsUpdate={(employee) => {
        console.log("🔐 Lock button clicked for employee:", employee);
        if (typeof window !== 'undefined' && (window as any).__openCredentialsModal) {
          (window as any).__openCredentialsModal(employee);
        }
      }}
    />
  );
}
