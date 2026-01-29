"use client";

import React from "react";
import { useRouter } from "next/navigation";
import GereeHeader from "./GereeHeader";
import { useGereeContext } from "./GereeContext";

interface GereeLayoutProps {
  children: React.ReactNode;
  activeTab: "contracts" | "residents" | "employees" | "units";
}

export default function GereeLayout({ children, activeTab }: GereeLayoutProps) {
  const router = useRouter();
  const { state, data, actions, ajiltan, DEFAULT_HIDDEN } = useGereeContext();

  const handleTabChange = (tab: "contracts" | "residents" | "employees" | "units") => {
    const routes = {
      contracts: "/geree",
      residents: "/geree/orshinSuugch",
      employees: "/geree/ajiltan",
      units: "/geree/tootBurtgel",
    };
    router.push(routes[tab]);
  };

  return (
    <div className="w-full pb-6" style={{ minHeight: "calc(100vh - 140px)" }}>
      <GereeHeader
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        ortsOptions={data.ortsOptions}
        selectedOrts={state.selectedOrts}
        setSelectedOrts={state.setSelectedOrts}
        davkharOptions={data.davkharOptions}
        selectedDawkhar={state.selectedDawkhar}
        setSelectedDawkhar={state.setSelectedDawkhar}
        selectedOrtsForContracts={state.selectedOrtsForContracts}
        setSelectedOrtsForContracts={state.setSelectedOrtsForContracts}
        statusFilter={state.statusFilter}
        setStatusFilter={state.setStatusFilter}
        unitStatusFilter={state.unitStatusFilter}
        setUnitStatusFilter={state.setUnitStatusFilter}
        ajiltan={ajiltan}
        selectedContracts={state.selectedContracts}
        showColumnSelector={state.showColumnSelector}
        setShowColumnSelector={state.setShowColumnSelector}
        visibleColumns={state.visibleColumns}
        setVisibleColumns={state.setVisibleColumns}
        columnMenuRef={state.columnMenuRef}
        DEFAULT_HIDDEN={DEFAULT_HIDDEN}
        onShowAvlagaModal={() => state.setShowAvlagaModal(true)}
        onShowList2Modal={() => state.setShowList2Modal(true)}
        onSendInvoices={() => actions.handleSendInvoices(state.selectedContracts)}
        onShowResidentModal={actions.handleShowResidentModal}
        onExportResidentsExcel={actions.handleExportResidentsExcel}
        onDownloadResidentsTemplate={actions.handleDownloadResidentsTemplate}
        onResidentsExcelImportClick={actions.handleResidentsExcelImportClick}
        isUploadingResidents={state.isUploadingResidents}
        residentExcelInputRef={state.residentExcelInputRef}
        onResidentsExcelFileChange={actions.onResidentsExcelFileChange}
        onShowEmployeeModal={actions.handleShowEmployeeModal}
        onDownloadUnitsTemplate={actions.handleDownloadUnitsTemplate}
        onUnitsExcelImportClick={actions.handleUnitsExcelImportClick}
        isUploadingUnits={state.isUploadingUnits}
        unitExcelInputRef={state.unitExcelInputRef}
        onUnitsExcelFileChange={actions.onUnitsExcelFileChange}
      />

      {children}
    </div>
  );
}
