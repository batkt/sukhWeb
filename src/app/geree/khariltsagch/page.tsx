"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientsSection from "../ClientsSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";

export default function khariltsagchPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();

  const tourSteps = useTourSteps("residents"); // TODO: client tour
  useRegisterTourSteps("/geree/khariltsagch", tourSteps);

  useEffect(() => {
    if (ajiltan) {
      const hasGereeBase =
        hasPermission(ajiltan, "/geree") || hasPermission(ajiltan, "geree");
      const allowed =
        hasGereeBase ||
        hasPermission(ajiltan, "/geree/khariltsagch") ||
        hasPermission(ajiltan, "geree.khariltsagch");
      if (!allowed) {
        router.push("/geree");
      }
    }
  }, [ajiltan, router]);

  return (
    <ClientsSection
      isValidatingSuugch={data.isValidatingClient}
      currentClients={data.currentClients}
      resPage={state.resPage}
      resPageSize={state.resPageSize}
      resTotalPages={data.clientTotalPages}
      totalClients={data.totalClients}
      sortKey={state.sortKey}
      sortOrder={state.sortOrder}
      toggleSortFor={actions.toggleSortFor}
      onEditClient={(client) => {
        actions.handleEditClient(
          client,
          state.setEditingClient,
          state.setNewClient,
          state.setShowClientModal,
        );
      }}
      onRequestDeleteClient={(c) => {
        // We probably need a delete modal state for clients. For now reuse resident's or just log
        // Actually, we should add setClientToDelete and setShowDeleteClientModal if not exists
        // Or handle it in delete modal logic. Let's reuse resident's delete modal for now but it'll call delete resident!
        // Wait, clone_actions.js created handleDeleteClient. I need to handle this.
        // I will use window.confirm or just call handleDeleteClient if no modal.
        // Let's use standard window.confirm for now if no delete modal.
        if (window.confirm(`${c.ner || c.ovog} устгах уу?`)) {
          actions.handleDeleteClient(c);
        }
      }}
      onRemoveToot={actions.handleRemoveClientToot}
      currentBaiguullagiinId={ajiltan?.baiguullagiinId}
      setResPageSize={state.setResPageSize}
      setResPage={state.setResPage}
    />
  );
}
