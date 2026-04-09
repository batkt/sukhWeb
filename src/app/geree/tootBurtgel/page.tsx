"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import UnitsSection from "../UnitsSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";

export default function TootBurtgelPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();

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
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen w-full">
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
        getTootOptions={data.getTootOptions}
        isSavingUnits={state.isSavingUnits}
        actions={actions}
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
    </div>
  );
}
