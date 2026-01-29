"use client";

import React from "react";
import GereeLayout from "../GereeLayout";
import UnitsSection from "../UnitsSection";
import GereeModals from "../GereeModals";
import { useGereeContext } from "../GereeContext";

export default function TootBurtgelPage() {
  const { state, data, actions } = useGereeContext();

  return (
    <>
      <GereeLayout activeTab="units">
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
      </GereeLayout>

      <GereeModals />
    </>
  );
}
