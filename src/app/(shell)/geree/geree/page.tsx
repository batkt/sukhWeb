"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import ContractsTable from "../ContractsTable";
import { useGereeContext } from "../GereeContext";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import AdminGereeUstgakhModal from "../modals/AdminGereeUstgakhModal";
import FilterSelect from "@/components/ui/FilterSelect";
import { LayoutTemplate, Settings2 } from "lucide-react";
import { ALL_COLUMNS } from "../columns";

export default function GereeGereePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { state, data, actions, ajiltan } = useGereeContext();

  // Админаар цуцлагдсан гэрээтэй харилцагчийг устгах цонх.
  const [adminUstgakhGeree, setAdminUstgakhGeree] = useState<any | null>(null);

  // Дашбоард: Бүгд / Идэвхтэй / Идэвхгүй — дарахад жагсаалтыг шүүнэ.
  // (Цуцалсан гэрээ = Идэвхгүй; «Бүгд» дээр цуцалсан нь улаан дэвсгэртэй.)
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
          const songogdson = (state.statusFilter || "all") === k.key;
          return (
            <button
              key={k.key}
              type="button"
              role="tab"
              aria-selected={songogdson}
              onClick={() => {
                state.setStatusFilter(k.key);
                state.setCurrentPage?.(1);
              }}
              className={`relative rounded-2xl neu-panel text-left transition-all select-none cursor-pointer ${
                songogdson ? "ring-2 ring-theme shadow-lg" : "hover:bg-[color:var(--surface-hover)]"
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {data.ortsOptions.length > 0 && (
          <FilterSelect
            label="Орц"
            value={state.selectedOrtsForContracts || ""}
            onChange={state.setSelectedOrtsForContracts}
            options={data.ortsOptions.map((orts) => ({ value: orts, label: orts }))}
          />
        )}
        {data.davkharOptions.length > 0 && (
          <FilterSelect
            label="Давхар"
            value={state.selectedDawkhar || ""}
            onChange={state.setSelectedDawkhar}
            options={data.davkharOptions.map((davkhar) => ({ value: davkhar, label: davkhar }))}
          />
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            id="geree-templates-btn"
            onClick={() => state.setShowList2Modal(true)}
            className="btn-minimal h-10"
            aria-label="Гэрээний загварууд"
            title="Гэрээний загварууд"
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="text-xs">Загвар үүсгэх</span>
          </button>
          <div className="relative flex-shrink-0" ref={state.columnMenuRef}>
            <button
              id="geree-columns-btn"
              onClick={() => state.setShowColumnSelector((visible) => !visible)}
              className="btn-minimal flex h-10 items-center gap-2"
              aria-label="Багана сонгох"
              title="Багана сонгох"
            >
              <Settings2 className="h-5 w-5" />
              <span className="text-xs">Багана</span>
            </button>
            {state.showColumnSelector && (
              <div className="menu-surface absolute right-0 top-full z-[100] mt-2 min-w-[200px] overflow-hidden rounded-xl p-2 shadow-lg">
                <div className="mb-1 border-b border-white/10 px-2 py-1 text-xs font-medium text-theme">
                  Баганууд
                </div>
                {state.visibleColumns &&
                  ALL_COLUMNS.map((col) => {
                    const isVisible = state.visibleColumns.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            if (isVisible) {
                              state.setVisibleColumns((prev) =>
                                prev.filter((key) => key !== col.key),
                              );
                            } else {
                              state.setVisibleColumns((prev) => [...prev, col.key]);
                            }
                          }}
                          className="h-4 w-4 rounded border border-theme/30 accent-theme"
                        />
                        <span className="text-sm">{col.label}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
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
