"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmployeesSection from "../EmployeesSection";
import EmployeePermissionsModal from "../EmployeePermissionsModal";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function AjiltanPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();
  
  // Tour steps
  const tourSteps = useTourSteps("employees");
  useRegisterTourSteps("/geree/ajiltan", tourSteps);

  // Эрхийн тохиргоо тусдаа хуудас байхаа болиод энэ жагсаалт руу модал
  // болж буцаж ирэв.
  const [erkhAjiltan, setErkhAjiltan] = useState<any | null>(null);

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
  const canManagePermissions =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan/erkhTokhirgoo") ||
    hasPermission(ajiltan, "geree.ajiltan.erkhTokhirgoo") ||
    hasPermission(ajiltan, "tokhirgoo.ajiltan");
  const canDeleteEmployees =
    hasGereeBase ||
    hasPermission(ajiltan, "/geree/ajiltan/ustgah") ||
    hasPermission(ajiltan, "geree.ajiltan.ustgah");

  useEffect(() => {
    if (ajiltan) {
      if (!canViewEmployees) {
        router.push("/geree");
      }
    }
  }, [ajiltan, canViewEmployees, router]);

  return (
    <>
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
      canManagePermissions={canManagePermissions}
      onEdit={actions.handleEditEmployee}
      onDelete={(e) => {
        state.setEmployeeToDelete(e);
        state.setShowDeleteEmployeeModal(true);
      }}
      onManagePermissions={(employee) => setErkhAjiltan(employee)}
      onCredentialsUpdate={(employee) => {
        console.log("🔐 Lock button clicked for employee:", employee);
        if (typeof window !== 'undefined' && (window as any).__openCredentialsModal) {
          (window as any).__openCredentialsModal(employee);
        }
      }}
      />

      <EmployeePermissionsModal
        employee={erkhAjiltan}
        open={!!erkhAjiltan}
        onClose={() => setErkhAjiltan(null)}
        onSaved={() => data.ajiltniiJagsaaltMutate?.()}
      />
    </>
  );
}
