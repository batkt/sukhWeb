"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientsSection from "../ClientsSection";
import { useGereeContext } from "../GereeContext";
import { hasPermission } from "@/lib/permissionUtils";
import { useTourSteps } from "@/lib/useTourSteps";
import { useRegisterTourSteps } from "@/context/TourContext";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";

export default function khariltsagchPage() {
  const router = useRouter();
  const { state, data, actions, ajiltan } = useGereeContext();
  const [clientToDelete, setClientToDelete] = useState<any>(null);

  const tourSteps = useTourSteps("residents");
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
    <>
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
        onRequestDeleteClient={(c) => setClientToDelete(c)}
        onRemoveToot={actions.handleRemoveClientToot}
        currentBaiguullagiinId={ajiltan?.baiguullagiinId}
        setResPageSize={state.setResPageSize}
        setResPage={state.setResPage}
      />

      <ConfirmCloseDialog
        open={!!clientToDelete}
        title="Харилцагч устгах уу?"
        description={`"${clientToDelete?.ner || clientToDelete?.ovog || "Харилцагч"}" бүртгэлийг устгах гэж байна. Энэ үйлдлийг буцаах боломжгүй.`}
        confirmLabel="Устгах"
        cancelLabel="Болих"
        confirmVariant="danger"
        onCancel={() => setClientToDelete(null)}
        onConfirm={() => {
          actions.handleDeleteClient(clientToDelete);
          setClientToDelete(null);
        }}
      />
    </>
  );
}
