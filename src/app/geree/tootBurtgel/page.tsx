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
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen w-full">
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {["Тоот", "Зогсоол", "Агуулах"].map((tab) => (
          <button
            key={tab}
            onClick={() => state.setPropertyTab(tab as any)}
            className={`pb-2 px-4 text-sm font-medium transition-colors ${
              state.propertyTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

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
        propertyTab={state.propertyTab}
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
