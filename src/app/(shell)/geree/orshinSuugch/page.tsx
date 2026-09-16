"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResidentsSection from "../ResidentsSection";
import ResidentDetailModal from "../modals/ResidentDetailModal";
import { useGereeContext } from "../GereeContext";
import { useAuth } from "@/lib/useAuth";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function OrshinSuugchPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();
  const { token } = useAuth();

  // "Үйлдэл" багана дахь нүдний товч — оршин суугчийн бүх мэдээллийг нэг
  // модалаас харуулна (гэрээ, тоот, гэр бүл, зогсоол, гүйлгээ, эрсдэл).
  const [kharakhId, setKharakhId] = useState<string | null>(null);

  const tourSteps = useTourSteps("residents");
  useRegisterTourSteps("/geree/orshinSuugch", tourSteps);

  useEffect(() => {
    if (ajiltan) {
      const hasGereeBase =
        hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
      const allowed =
        hasGereeBase ||
        hasPermission(ajiltan, "/geree/orshinSuugch") ||
        hasPermission(ajiltan, "geree.orshinSuugch");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
    <>
    <ResidentsSection
      isValidatingSuugch={data.isValidatingSuugch}
      currentResidents={data.currentResidents}
      resPage={state.resPage}
      resPageSize={state.resPageSize}
      resTotalPages={data.resTotalPages}
      totalResidents={data.totalResidents}
      sortKey={state.sortKey}
      sortOrder={state.sortOrder}
      toggleSortFor={actions.toggleSortFor}
      onEditResident={(resident) => {
        actions.handleEditResident(
          resident,
          state.setEditingResident,
          state.setNewResident,
          state.setShowResidentModal,
        );
      }}
      onRequestDeleteResident={(r) => {
        state.setResidentToDelete(r);
        state.setShowDeleteResidentModal(true);
      }}
      onRemoveToot={actions.handleRemoveResidentToot}
      currentBaiguullagiinId={ajiltan?.baiguullagiinId}
      setResPageSize={state.setResPageSize}
      setResPage={state.setResPage}
      onViewResident={(resident) => setKharakhId(resident?._id || null)}
    />
    <ResidentDetailModal
      show={!!kharakhId}
      onClose={() => setKharakhId(null)}
      residentId={kharakhId}
      token={token}
      baiguullagiinId={ajiltan?.baiguullagiinId}
      onEdit={(resident) => {
        setKharakhId(null);
        actions.handleEditResident(
          resident,
          state.setEditingResident,
          state.setNewResident,
          state.setShowResidentModal,
        );
      }}
    />
    </>
  );
}
