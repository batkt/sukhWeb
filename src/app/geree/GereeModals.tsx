"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useGereeContext } from "./GereeContext";
import ContractModal from "./modals/ContractModal";
import ResidentModal from "./modals/ResidentModal";
import EmployeeModal from "./modals/EmployeeModal";
import DeleteConfirmModal from "./modals/DeleteModal";
import PaymentModal from "./modals/PaymentModal";
import TemplatesModal from "./modals/TemplatesModal";
import ZagvarEditorModal from "./modals/ZagvarEditorModal";
import PreviewModal from "./modals/PreviewModal";
import InvoicePreviewModal from "./modals/InvoicePreviewModal";
import AddUnitModal from "./modals/AddUnitModal";
import PermissionsModal from "./modals/PermissionsModal";
import CredentialsModal from "./modals/CredentialsModal"; // Import missing modal
import HistoryModal from "./modals/HistoryModal";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

export default function GereeModals() {
  const router = useRouter();
  const { token, baiguullaga } = useAuth();
  const { state, data, actions, ajiltan, permissionsData, reloadPermissions } = useGereeContext();

  // Permissions Modal State
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsEmployee, setPermissionsEmployee] = useState<any>(null);

  // Credentials Modal State
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsEmployee, setCredentialsEmployee] = useState<any>(null);

  // Zagvar Editor Modal (full-screen for create/edit template)
  const [showZagvarEditorModal, setShowZagvarEditorModal] = useState(false);
  const [zagvarEditorTemplateId, setZagvarEditorTemplateId] = useState<string | null>(null);

  // Expose the permissions and credentials modal handler via a ref or context
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__openPermissionsModal = (employee: any) => {
        console.log("🚀 Opening permissions modal for employee:", employee);
        setPermissionsEmployee(employee);
        setShowPermissionsModal(true);
      };
      
      (window as any).__openCredentialsModal = (employee: any) => {
        console.log("🔐 Opening credentials modal for employee:", employee);
        setCredentialsEmployee(employee);
        setShowCredentialsModal(true);
      };
      
      (window as any).__openHistoryModal = (contract: any) => {
        console.log("📜 Opening history modal for contract:", contract);
        state.setHistoryContract(contract);
        state.setShowHistoryModal(true);
      };
      
      console.log("✅ Global modal functions registered");
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__openPermissionsModal;
        delete (window as any).__openCredentialsModal;
      }
    };
  }, []);

  const handleSavePermissions = async (
    permissions: string[], 
    erkhuud: { zam: string; too: number }[] = []
  ) => {
    if (!token || !permissionsEmployee?._id) {
      openErrorOverlay("Мэдээлэл дутуу байна");
      return;
    }

    try {
      // First, update the employee's permissions
      await uilchilgee(token).post(`/ajiltandErkhUgyu/${permissionsEmployee._id}`, {
        tsonkhniiErkhuud: permissions,
        erkhuud: erkhuud,
        barilguud: permissionsEmployee.barilguud, // Preserve existing buildings
      });
      console.log("✅ Employee permissions updated via Tsonkhnii Medeelel");
      
      // Reload limits
      reloadPermissions();

      // Then call the /erkhiinMedeelelAvya endpoint to refresh permissions
      // Note: This is now handled on page load in GereeContext, but we might want to refresh here too?
      // User requested "dont call it in modal", so commenting out/removing.
      // await uilchilgee(token).post("/erkhiinMedeelelAvya");

      console.log("3️⃣ Refreshing employee list...");
      await data.ajiltniiJagsaaltMutate();
      console.log("✅ Employee list refreshed");
      
      openSuccessOverlay("Эрх амжилттай хадгалагдлаа");
    } catch (error: any) {
      console.error("❌ Error saving permissions:", error);
      console.error("Error response:", error?.response?.data);
      const errorMessage = error?.response?.data?.aldaa || error?.message || "Эрх хадгалахад алдаа гарлаа";
      openErrorOverlay(errorMessage);
      throw error;
    }
  };

  return (
    <>
      {/* Contract Modal */}
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

      {/* Resident Modal */}
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
        currentResidents={data.residentsList}
        onSubmit={(e) => {
          actions.handleCreateResident(e, state.newResident, state.editingResident).then((success) => {
            if (success) {
              state.setShowResidentModal(false);
              state.setEditingResident(null);
            }
          });
        }}
      />

      {/* Employee Modal */}
      <EmployeeModal
        show={state.showEmployeeModal}
        onClose={() => state.setShowEmployeeModal(false)}
        editingEmployee={state.editingEmployee}
        newEmployee={state.newEmployee}
        setNewEmployee={state.setNewEmployee}
        onSubmit={actions.handleCreateOrUpdateEmployee}
      />

      {/* Payment / Avlaga Modal */}
      <PaymentModal
        show={state.showPaymentModal || state.showAvlagaModal}
        onClose={() => {
          state.setShowPaymentModal(false);
          state.setShowAvlagaModal(false);
        }}
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

      {/* Add Unit Modal */}
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

      {/* Templates Modal */}
      <TemplatesModal
        show={state.showList2Modal}
        onClose={() => state.setShowList2Modal(false)}
        templates={data.zagvaruud}
        onPreview={actions.handlePreviewTemplate}
        onEdit={(id) => {
          state.setShowList2Modal(false);
          setZagvarEditorTemplateId(id);
          setShowZagvarEditorModal(true);
        }}
        onDelete={actions.handleDeleteTemplate}
        onCreateNew={() => {
          state.setShowList2Modal(false);
          setZagvarEditorTemplateId(null);
          setShowZagvarEditorModal(true);
        }}
      />

      {/* Zagvar Editor Modal - full-screen for create/edit template */}
      <ZagvarEditorModal
        show={showZagvarEditorModal}
        onClose={() => {
          setShowZagvarEditorModal(false);
          setZagvarEditorTemplateId(null);
        }}
        templateId={zagvarEditorTemplateId}
        onSuccess={() => data.zagvarJagsaaltMutate?.()}
      />

      {/* Preview Modal */}
      <PreviewModal
        show={state.showPreviewModal}
        onClose={() => state.setShowPreviewModal(false)}
        template={state.previewTemplate}
      />

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        show={state.showInvoicePreviewModal}
        onClose={() => state.setShowInvoicePreviewModal(false)}
        invoiceData={state.invoicePreviewData}
      />

      {/* Delete Resident Modal */}
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

      {/* Delete Employee Modal */}
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

      {/* Delete Unit Modal */}
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

      {/* Delete Floor Modal */}
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

      {/* Permissions Modal */}
      <PermissionsModal
        show={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        employee={permissionsEmployee}
        onSave={handleSavePermissions}
        permissionsData={permissionsData}
      />

      {/* Credentials Modal */}
      <CredentialsModal
        show={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        employee={credentialsEmployee}
        onSave={async (emp, nevtrekhNer, nuutsUg) => {
           if (!token || !emp?._id) return;
           try {
              // Send full employee with updated credentials so backend doesn't
              // overwrite baiguullagiinId/barilguud (which would remove from list)
              const payload: any = { ...emp, nevtrekhNer };
              if (nuutsUg && nuutsUg.trim()) {
                payload.nuutsUg = nuutsUg;
              } else {
                delete payload.nuutsUg; // Don't send hashed password; backend keeps existing
              }
              await uilchilgee(token).put(`/ajiltan/${emp._id}`, payload);

              openSuccessOverlay("Нэвтрэх эрх шинэчлэгдлээ");
              setShowCredentialsModal(false);

              await data.ajiltniiJagsaaltMutate();

           } catch (err: any) {
              const msg = err?.response?.data?.aldaa || "Алдаа гарлаа";
              openErrorOverlay(msg);
           }
        }}
      />
      
      {/* History Modal */}
      <HistoryModal
        show={state.showHistoryModal}
        onClose={() => state.setShowHistoryModal(false)}
        contract={state.historyContract}
        token={token || null}
        baiguullagiinId={baiguullaga?._id || null}
        barilgiinId={data.selectedBarilga?._id || null}
        onRefresh={() => data.gereeJagsaaltMutate?.()}
      />
    </>
  );
}
