"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import { useGereeJagsaalt, useGereeCRUD } from "@/lib/useGeree";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { useSocket } from "@/context/SocketContext";
import { useRegisterTourSteps } from "@/context/TourContext";

import GereeHeader from "./GereeHeader";
import ContractsTable from "./ContractsTable";
import ResidentsSection from "./ResidentsSection";
import EmployeesSection from "./EmployeesSection";
import UnitsSection from "./UnitsSection";
import ContractModal from "./modals/ContractModal";
import ResidentModal from "./modals/ResidentModal";
import EmployeeModal from "./modals/EmployeeModal";
import DeleteConfirmModal from "./modals/DeleteModal";
import PaymentModal from "./modals/PaymentModal";
import TemplatesModal from "./modals/TemplatesModal";
import PreviewModal from "./modals/PreviewModal";
import InvoicePreviewModal from "./modals/InvoicePreviewModal";
import AddUnitModal from "./modals/AddUnitModal";

import { useGereeState } from "@/lib/useGereeState";
import { useGereeData } from "@/lib/useGereeData";
import { useGereeActions } from "@/lib/useGereeActions";
import { useTourSteps } from "@/lib/useTourSteps";
import { ALL_COLUMNS } from "./columns";

export default function Geree() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didInitRef = useRef(false);
  const DEFAULT_HIDDEN = ["aimag"];

  const { searchTerm, setSearchTerm } = useSearch();
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } = useAuth();
  
  // Custom hooks for state management
  const state = useGereeState(searchParams, didInitRef);
  const data = useGereeData(
    token,
    ajiltan,
    selectedBuildingId ?? undefined,
    barilgiinId ?? undefined,
    baiguullaga,
    state.resPage,
    state.resPageSize,
    state.empPage,
    state.empPageSize,
    state.currentPage,
    state.rowsPerPage,
    state.sortKey,
    state.sortOrder,
    searchTerm,
    state.unitPage,
    state.unitPageSize,
    state.selectedDawkhar,
    state.selectedOrtsForContracts,
    state.statusFilter
  );
  const actions = useGereeActions(
    token,
    ajiltan,
    barilgiinId ?? undefined,
    selectedBuildingId ?? undefined,
    baiguullaga,
    baiguullagaMutate,
    state.setIsSavingUnits,
    state.selectedOrts,
    data.composeKey,
    state.setShowResidentModal,
    state.setShowEmployeeModal,
    state.setNewResident,
    state.setNewEmployee,
    state.setEditingResident,
    state.setEditingEmployee,
    state.setIsUploadingResidents,
    state.setIsUploadingUnits,
    state.residentExcelInputRef,
    state.unitExcelInputRef,
    selectedBuildingId ?? undefined,
    state.setShowPreviewModal,
    state.setPreviewTemplate,
    state.setShowInvoicePreviewModal,
    state.setInvoicePreviewData
  );
  
  // Tour steps
  const gereeTourSteps = useTourSteps(state.activeTab);
  useRegisterTourSteps("/geree", gereeTourSteps);

  // Socket listeners
  useEffect(() => {
    if (!data.socketCtx) return;
    
    const handlers = {
      "orshinSuugch.created": data.orshinSuugchJagsaaltMutate,
      "orshinSuugch.updated": data.orshinSuugchJagsaaltMutate,
      "orshinSuugch.deleted": data.orshinSuugchJagsaaltMutate,
      "geree.created": data.gereeJagsaaltMutate,
      "geree.updated": data.gereeJagsaaltMutate,
      "geree.deleted": data.gereeJagsaaltMutate,
      "ajiltan.created": data.ajiltniiJagsaaltMutate,
      "ajiltan.updated": data.ajiltniiJagsaaltMutate,
      "ajiltan.deleted": data.ajiltniiJagsaaltMutate,
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      data.socketCtx?.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        try {
          data.socketCtx?.off(event, handler);
        } catch (e) {}
      });
    };
  }, [data.socketCtx, data.orshinSuugchJagsaaltMutate, data.gereeJagsaaltMutate, data.ajiltniiJagsaaltMutate]);

  return (
    <div className="w-full pb-6" style={{ minHeight: "calc(100vh - 140px)" }}>
      <GereeHeader
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
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

      {state.activeTab === "contracts" && (
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
      )}

      {state.activeTab === "residents" && (
        <ResidentsSection
          isValidatingSuugch={data.isValidatingSuugch}
          currentResidents={data.currentResidents}
          resPage={state.resPage}
          resPageSize={state.resPageSize}
          resTotalPages={data.resTotalPages}
          filteredResidents={data.filteredResidents}
          sortKey={state.sortKey}
          sortOrder={state.sortOrder}
          toggleSortFor={actions.toggleSortFor}
          tuluvByResidentId={data.tuluvByResidentId}
          onEditResident={(resident) => {
            actions.handleEditResident(
              resident,
              state.setEditingResident,
              state.setNewResident,
              state.setShowResidentModal
            );
          }}
          onRequestDeleteResident={(r) => {
            state.setResidentToDelete(r);
            state.setShowDeleteResidentModal(true);
          }}
          setResPageSize={state.setResPageSize}
          setResPage={state.setResPage}
        />
      )}

      {state.activeTab === "employees" && (
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
        />
      )}

      {state.activeTab === "units" && (
        <UnitsSection
          davkharOptions={data.davkharOptions}
          ortsOptions={data.ortsOptions}
          selectedOrts={state.selectedOrts}
          setSelectedOrts={state.setSelectedOrts}
          selectedBarilga={data.selectedBarilga}
          contracts={data.contracts}
          residentsById={data.residentsById}
          currentFloors={data.currentFloors}
          floorsList={data.floorsList}
          unitPage={state.unitPage}
          unitPageSize={state.unitPageSize}
          unitTotalPages={data.unitTotalPages}
          setUnitPage={state.setUnitPage}
          setUnitPageSize={state.setUnitPageSize}
          unitStatusFilter={state.unitStatusFilter}
          isSavingUnits={state.isSavingUnits}
          composeKey={data.composeKey}
          onAddUnit={(floor) => {
            state.setAddTootFloor(floor);
            state.setAddTootValue("");
            state.setShowAddTootModal(true);
          }}
          onDeleteUnit={(floor, unit) => {
            state.setUnitToDelete({ floor, unit });
            state.setShowDeleteUnitModal(true);
          }}
          onDeleteFloor={(floor) => {
            state.setFloorToDelete(floor);
            state.setShowDeleteFloorModal(true);
          }}
        />
      )}

      {/* Modals */}
      <ContractModal
        show={state.showContractModal}
        onClose={() => state.setShowContractModal(false)}
        editingContract={state.editingContract}
        newContract={state.newContract}
        setNewContract={state.setNewContract}
        currentStep={state.currentStep}
        setCurrentStep={state.setCurrentStep}
        stepLabels={["Хувийн мэдээлэл", "СӨХ мэдээлэл"]}
        ortsOptions={data.ortsOptions}
        davkharOptions={data.davkharOptions}
        getTootOptions={data.getTootOptions}
        onSubmit={state.editingContract ? actions.handleUpdateContract : actions.handleCreateContract}
        baiguullaga={baiguullaga}
      />

      <ResidentModal
        show={state.showResidentModal}
        onClose={() => state.setShowResidentModal(false)}
        editingResident={state.editingResident}
        newResident={state.newResident}
        setNewResident={state.setNewResident}
        ortsOptions={data.ortsOptions}
        davkharOptions={data.davkharOptions}
        getTootOptions={data.getTootOptions}
        selectedBarilga={data.selectedBarilga}
        baiguullaga={baiguullaga}
        contracts={data.contracts}
        onSubmit={(e) => {
          actions.handleCreateResident(e, state.newResident, state.editingResident).then((success) => {
            if (success) {
              state.setShowResidentModal(false);
              state.setEditingResident(null);
            }
          });
        }}
      />

      <EmployeeModal
        show={state.showEmployeeModal}
        onClose={() => state.setShowEmployeeModal(false)}
        editingEmployee={state.editingEmployee}
        newEmployee={state.newEmployee}
        setNewEmployee={state.setNewEmployee}
        onSubmit={actions.handleCreateOrUpdateEmployee}
      />

      <PaymentModal
        show={state.showPaymentModal}
        onClose={() => state.setShowPaymentModal(false)}
        paymentResident={state.paymentResident}
        paymentIncludeEkhniiUldegdel={state.paymentIncludeEkhniiUldegdel}
        setPaymentIncludeEkhniiUldegdel={state.setPaymentIncludeEkhniiUldegdel}
        paymentTailbar={state.paymentTailbar}
        setPaymentTailbar={state.setPaymentTailbar}
        isProcessingPayment={state.isProcessingPayment}
        onSubmit={async () => {
          await actions.handleMarkAsPaid();
        }}
      />

      <AddUnitModal
        show={state.showAddTootModal}
        onClose={() => state.setShowAddTootModal(false)}
        floor={state.addTootFloor}
        value={state.addTootValue}
        setValue={state.setAddTootValue}
        onSubmit={async (floor: string, values: string[]) => {
          await actions.addUnit(floor, values);
        }}
      />

      <TemplatesModal
        show={state.showList2Modal}
        onClose={() => state.setShowList2Modal(false)}
        templates={data.zagvaruud}
        onPreview={actions.handlePreviewTemplate}
        onEdit={actions.handleEditTemplate}
        onDelete={actions.handleDeleteTemplate}
        onCreateNew={() => {
          state.setShowList2Modal(false);
          router.push("/geree/zagvar/gereeniiZagvar");
        }}
      />

      <PreviewModal
        show={state.showPreviewModal}
        onClose={() => state.setShowPreviewModal(false)}
        template={state.previewTemplate}
      />

      <InvoicePreviewModal
        show={state.showInvoicePreviewModal}
        onClose={() => state.setShowInvoicePreviewModal(false)}
        invoiceData={state.invoicePreviewData}
      />

      <DeleteConfirmModal
        show={state.showDeleteResidentModal}
        onClose={() => state.setShowDeleteResidentModal(false)}
        title="Оршин суугчийг устгах уу?"
        message={`Та ${state.residentToDelete?.ovog || ""} ${state.residentToDelete?.ner || ""}-г устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.`}
        onConfirm={async () => {
          if (state.residentToDelete) {
            await actions.handleDeleteResident(state.residentToDelete);
            state.setShowDeleteResidentModal(false);
            state.setResidentToDelete(null);
          }
        }}
      />

      <DeleteConfirmModal
        show={state.showDeleteEmployeeModal}
        onClose={() => state.setShowDeleteEmployeeModal(false)}
        title="Ажилтныг устгах уу?"
        message={`Та ${state.employeeToDelete?.ovog || ""} ${state.employeeToDelete?.ner || ""}-г устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.`}
        onConfirm={async () => {
          if (state.employeeToDelete) {
            if (actions.handleDeleteEmployee) {
              await actions.handleDeleteEmployee(state.employeeToDelete);
            }
            state.setShowDeleteEmployeeModal(false);
            state.setEmployeeToDelete(null);
          }
        }}
      />

      <DeleteConfirmModal
        show={state.showDeleteUnitModal}
        onClose={() => state.setShowDeleteUnitModal(false)}
        title="Тоотыг устгах уу?"
        message={`Та ${state.unitToDelete?.floor}-р давхрын ${state.unitToDelete?.unit} тоотыг устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.`}
        onConfirm={async () => {
          if (state.unitToDelete) {
            if (actions.deleteUnit) {
              await actions.deleteUnit(state.unitToDelete.floor, state.unitToDelete.unit);
            }
            state.setShowDeleteUnitModal(false);
            state.setUnitToDelete(null);
          }
        }}
      />

      <DeleteConfirmModal
        show={state.showDeleteFloorModal}
        onClose={() => state.setShowDeleteFloorModal(false)}
        title="Давхрын тоотуудыг устгах уу?"
        message={`Та ${state.floorToDelete}-р давхрын бүх тоотыг устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.`}
        onConfirm={async () => {
          if (state.floorToDelete) {
            if (actions.deleteFloor) {
              await actions.deleteFloor(state.floorToDelete);
            }
            state.setShowDeleteFloorModal(false);
            state.setFloorToDelete(null);
          }
        }}
      />
    </div>
  );
}