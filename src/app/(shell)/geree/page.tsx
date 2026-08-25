"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ContractsTable from "./ContractsTable";
import { useGereeContext } from "./GereeContext";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function GereePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { state, data, actions, ajiltan } = useGereeContext();

  // Tour steps
  const gereeTourSteps = useTourSteps("contracts");
  useRegisterTourSteps("/geree", gereeTourSteps);

  // Global hotkey: "+" to add resident
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[data-prevent-hotkeys]")
      ) {
        return;
      }

      if (e.key === "+" || (e.shiftKey && e.key === "=")) {
        e.preventDefault();
        actions.handleShowResidentModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);

  return (
    <ContractsTable
      ajiltan={ajiltan}
      selectedContracts={state.selectedContracts}
      setSelectedContracts={state.setSelectedContracts}
      selectAllContracts={state.selectAllContracts}
      setSelectAllContracts={state.setSelectAllContracts}
      currentContracts={data.currentContracts}
      totalContracts={data.totalContracts}
      startIndex={data.startIndex}
      visibleColumns={state.visibleColumns}
      renderCellValue={data.renderCellValue}
      toggleSortFor={actions.toggleSortFor}
      sortKey={state.sortKey}
      sortOrder={state.sortOrder}
      handleEdit={actions.handleEdit}
      handlePreviewContractTemplate={actions.handlePreviewContractTemplate}

      currentPage={state.currentPage}
      rowsPerPage={state.rowsPerPage}
      setCurrentPage={state.setCurrentPage}
      setRowsPerPage={state.setRowsPerPage}
    />
  );
}
