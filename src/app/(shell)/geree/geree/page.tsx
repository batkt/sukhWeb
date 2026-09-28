"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ContractsTable from "../ContractsTable";
import { useGereeContext } from "../GereeContext";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import AdminGereeUstgakhModal from "../modals/AdminGereeUstgakhModal";

export default function GereeGereePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { state, data, actions, ajiltan } = useGereeContext();

  // Админаар цуцлагдсан гэрээтэй харилцагчийг устгах цонх.
  const [adminUstgakhGeree, setAdminUstgakhGeree] = useState<any | null>(null);

  // Дашбоард: Бүгд / Идэвхтэй / Идэвхгүй — дарахад жагсаалтыг шүүнэ.
  // (Цуцалсан гэрээ = Идэвхгүй; шүүлтүүрийн логиктой ижил ангилал.)
  const toonuud = useMemo(() => {
    const jagsaalt: any[] = Array.isArray(data.contracts) ? data.contracts : [];
    let idevkhgui = 0;
    jagsaalt.forEach((c: any) => {
      const t = String(c?.tuluv || c?.status || "").trim().toLowerCase();
      if (t === "цуцалсан" || t === "tsutlsasan" || t === "идэвхгүй") idevkhgui++;
    });
    return { bugd: jagsaalt.length, idevkhtei: jagsaalt.length - idevkhgui, idevkhgui };
  }, [data.contracts]);
  const kartuud: { key: "all" | "active" | "cancelled"; ner: string; too: number; unguClass: string }[] = [
    { key: "all", ner: "Бүгд", too: toonuud.bugd, unguClass: "text-[color:var(--panel-text)]" },
    { key: "active", ner: "Идэвхтэй", too: toonuud.idevkhtei, unguClass: "text-success" },
    { key: "cancelled", ner: "Идэвхгүй", too: toonuud.idevkhgui, unguClass: "text-danger" },
  ];

  // Tour steps
  const gereeTourSteps = useTourSteps("contracts");
  useRegisterTourSteps("/geree/geree", gereeTourSteps);

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
    <>
      <div className="stat-cards-grid mb-3 grid grid-cols-1 sm:grid-cols-3" role="tablist" aria-label="Гэрээний төлөв">
        {kartuud.map((k) => {
          const idevkhtei = (state.statusFilter || "all") === k.key;
          return (
            <button
              key={k.key}
              type="button"
              role="tab"
              aria-selected={idevkhtei}
              onClick={() => {
                state.setStatusFilter(k.key);
                state.setCurrentPage?.(1);
              }}
              className={`relative rounded-2xl neu-panel text-left transition-all select-none ${
                idevkhtei ? "ring-2 ring-theme shadow-lg" : "hover:bg-[color:var(--surface-hover)]"
              }`}
            >
              <div className="stat-card">
                <div className={`stat-card-value ${k.unguClass}`}>{k.too.toLocaleString("mn-MN")}</div>
                <div className="stat-card-title">{k.ner} гэрээ</div>
              </div>
            </button>
          );
        })}
      </div>

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
        handleAdminDelete={setAdminUstgakhGeree}
      />

      {adminUstgakhGeree && (
        <AdminGereeUstgakhModal
          contract={adminUstgakhGeree}
          token={token || ""}
          onClose={() => setAdminUstgakhGeree(null)}
          onDeleted={() => data.gereeJagsaaltMutate?.()}
        />
      )}
    </>
  );
}
