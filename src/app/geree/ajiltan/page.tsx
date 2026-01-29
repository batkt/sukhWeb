"use client";

import React, { useState } from "react";
import GereeLayout from "../GereeLayout";
import EmployeesSection from "../EmployeesSection";
import { useGereeContext } from "../GereeContext";

export default function AjiltanPage() {
  const { state, data, actions } = useGereeContext();

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
          // Call the exposed function from GereeModals
          if (typeof window !== 'undefined' && (window as any).__openPermissionsModal) {
            console.log("✅ Calling __openPermissionsModal");
            (window as any).__openPermissionsModal(employee);
          } else {
            console.error("❌ __openPermissionsModal not found on window");
          }
        }}
      />
    </GereeLayout>
  );
}
