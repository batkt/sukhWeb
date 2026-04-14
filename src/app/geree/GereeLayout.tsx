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

  const handleOpenResidentModal = React.useCallback(() => {
    state.setEditingResident(null);
    state.setNewResident({
      ovog: "",
      ner: "",
      register: "",
      utas: [""],
      khayag: "",
      aimag: "Улаанбаатар",
      duureg: "",
      horoo: "",
      orts: "",
      toot: "",
      davkhar: "",
      tsahilgaaniiZaalt: "",
      turul: "Үндсэн",
      tailbar: "",
      ekhniiUldegdel: 0,
    });
    state.setShowResidentModal(true);
  }, [state]);

  React.useEffect(() => {
    const isTypingTarget = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = (node.tagName || "").toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        node.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "residents") return;
      if (state.showResidentModal) return;
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const isPlus = e.key === "+" || e.code === "NumpadAdd";
      if (!isPlus) return;

      e.preventDefault();
      handleOpenResidentModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, state.showResidentModal, handleOpenResidentModal]);

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
        onShowResidentModal={handleOpenResidentModal}
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
