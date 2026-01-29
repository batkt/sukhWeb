"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import GolContent from "../../../components/golContent";
import { GereeProvider, useGereeContext } from "./GereeContext";
import GereeModals from "./GereeModals";
import GereeHeader from "./GereeHeader";

function GereeLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, data, actions, ajiltan, DEFAULT_HIDDEN } = useGereeContext();

  const activeTab = useMemo(() => {
    if (pathname.includes("/orshinSuugch")) return "residents";
    if (pathname.includes("/ajiltan")) return "employees";
    if (pathname.includes("/tootBurtgel")) return "units";
    return "contracts";
  }, [pathname]);

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GolContent>
      <GereeProvider>
        <GereeLayoutWrapper>{children}</GereeLayoutWrapper>
        <GereeModals />
      </GereeProvider>
    </GolContent>
  );
}
