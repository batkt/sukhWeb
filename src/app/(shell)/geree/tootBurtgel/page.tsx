"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import UnitsSection from "../UnitsSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function ӨмчБүртгэлPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();

  // Tour steps
  const tourSteps = useTourSteps("units");
  useRegisterTourSteps("/geree/tootBurtgel", tourSteps);

  useEffect(() => {
    if (ajiltan) {
      const hasGereeBase =
        hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
      const allowed =
        hasGereeBase ||
        hasPermission(ajiltan, "/geree/tootBurtgel") ||
        hasPermission(ajiltan, "geree.tootBurtgel");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
    <div className="px-4 pt-2 pb-4 bg-[color:var(--surface-bg)] min-h-full w-full">
      {/* Жижиг дэлгэцэнд таб энд; том дэлгэцэнд толгойн мөрөнд (GereeHeader). */}
      <div className="flex space-x-4 mb-3 border-b border-[color:var(--surface-border)] md:hidden">
        {["Тоот", "Зогсоол", "Агуулах"].map((tab) => (
          <button
            key={tab}
            onClick={() => state.setPropertyTab(tab as any)}
            className={`pb-2 px-4 text-sm font-medium transition-colors ${
              state.propertyTab === tab
                ? "border-b-2 border-theme text-brand"
                : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
            }`}
          >
            {tab === "Зогсоол" ? "Гараж" : tab}
          </button>
        ))}
      </div>

      <UnitsSection
        davkharOptions={data.davkharOptions}
        ortsOptions={data.ortsOptions}
        selectedOrts={state.selectedOrts}
        setSelectedOrts={state.setSelectedOrts}
        selectedDawkhar={state.selectedDawkhar}
        setSelectedDawkhar={state.setSelectedDawkhar}
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
        setUnitStatusFilter={state.setUnitStatusFilter}
        getTootOptions={data.getTootOptions}
        isSavingUnits={state.isSavingUnits}
        actions={actions}
        sortKey={state.sortKey}
        sortOrder={state.sortOrder}
        composeKey={data.composeKey}
        propertyTab={state.propertyTab}
        onAddUnit={(floor, turul) => {
          state.setAddTootFloor(floor);
          state.setAddTootTurul(turul || null);
          state.setAddTootValue("");
          state.setShowAddTootModal(true);
        }}
        onDeleteUnit={(floor, unit, turul) => {
          state.setUnitToDelete({ floor, unit, turul });
          state.setShowDeleteUnitModal(true);
        }}
        onDeleteFloor={(floor, turul) => {
          state.setFloorToDelete(floor);
          state.setFloorToDeleteTurul(turul || null);
          state.setShowDeleteFloorModal(true);
        }}
        garageFloorsList={data.garageFloorsList}
        residentsList={data.residentsList}
        clientsList={data.clientsList}
        onAssignToUnit={actions.handleAssignToUnit}
      />
    </div>
  );
}
