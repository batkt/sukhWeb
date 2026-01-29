"use client";

import React from "react";
import GereeLayout from "../GereeLayout";
import ResidentsSection from "../ResidentsSection";
import GereeModals from "../GereeModals";
import { useGereeContext } from "../GereeContext";

export default function OrshinSuugchPage() {
  const { state, data, actions } = useGereeContext();

  return (
    <>
      <GereeLayout activeTab="residents">
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
      </GereeLayout>

      <GereeModals />
    </>
  );
}
