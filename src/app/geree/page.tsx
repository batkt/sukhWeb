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
      handlePreviewInvoice={actions.handlePreviewInvoice}
    />
  );
}