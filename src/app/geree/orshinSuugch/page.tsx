"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import ResidentsSection from "../ResidentsSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";

export default function OrshinSuugchPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();

  useEffect(() => {
    if (ajiltan) {
      const allowed = hasPermission(ajiltan, "/geree/orshinSuugch") || hasPermission(ajiltan, "geree.orshinSuugch");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
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
  );
}
