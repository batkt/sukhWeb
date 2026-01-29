"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GereeLayout from "../GereeLayout";
import EmployeesSection from "../EmployeesSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";

export default function AjiltanPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();

  useEffect(() => {
    if (ajiltan) {
      const allowed = hasPermission(ajiltan, "/geree/ajiltan") || hasPermission(ajiltan, "geree.ajiltan");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
    <GereeLayout activeTab="employees">
      <EmployeesSection
        isValidatingAjiltan={data.isValidatingAjiltan}
        currentEmployees={data.currentEmployees}
        filteredEmployees={data.filteredEmployees}
        empPage={state.empPage}
        empPageSize={state.empPageSize}
        empTotalPages={data.empTotalPages}
        setEmpPage={state.setEmpPage}
        setEmpPageSize={state.setEmpPageSize}
        onEdit={actions.handleEditEmployee}
        onDelete={(e) => {
          state.setEmployeeToDelete(e);
          state.setShowDeleteEmployeeModal(true);
        }}
        onManagePermissions={(employee) => {
          console.log("🛡️ Shield button clicked for employee:", employee);
          if (typeof window !== 'undefined' && (window as any).__openPermissionsModal) {
            (window as any).__openPermissionsModal(employee);
          }
        }}
        onCredentialsUpdate={(employee) => {
          console.log("🔐 Lock button clicked for employee:", employee);
          if (typeof window !== 'undefined' && (window as any).__openCredentialsModal) {
            (window as any).__openCredentialsModal(employee);
          }
        }}
      />
    </GereeLayout>
  );
}
