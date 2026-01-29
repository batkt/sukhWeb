"use client";

import React, { createContext, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import { useSpinner } from "@/context/SpinnerContext";
import { useSocket } from "@/context/SocketContext";

import { useGereeState } from "@/lib/useGereeState";
import { useGereeData } from "@/lib/useGereeData";
import { useGereeActions } from "@/lib/useGereeActions";
import uilchilgee from "@/lib/uilchilgee";

interface GereeContextType {
  state: ReturnType<typeof useGereeState>;
  data: ReturnType<typeof useGereeData>;
  actions: ReturnType<typeof useGereeActions>;
  ajiltan: any;
  DEFAULT_HIDDEN: string[];
  permissionsData: any;
  reloadPermissions: () => void;
}

const GereeContext = createContext<GereeContextType | null>(null);

export function useGereeContext() {
  const context = useContext(GereeContext);
  if (!context) {
    throw new Error("useGereeContext must be used within GereeProvider");
  }
  return context;
}

export function GereeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const didInitRef = useRef(false);
  const DEFAULT_HIDDEN = ["aimag"];
  
  const { searchTerm } = useSearch();
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } = useAuth();
  const { showSpinner, hideSpinner } = useSpinner();
  const socketCtx = useSocket();
  const [permissionsData, setPermissionsData] = React.useState<any>(null);

  // ...

  const reloadPermissions = React.useCallback(() => {
    if (token) {
      console.log("🔄 Reloading permissions (/erkhiinMedeelelAvya)...");
      uilchilgee(token)
        .post("/erkhiinMedeelelAvya")
        .then((res) => {
          console.log("✅ Permissions loaded:", res.data);
          setPermissionsData(res.data);
        })
        .catch((e) => {
          console.error("❌ Failed to load permissions:", e);
        });
    }
  }, [token]);

  // Load permissions on mount
  React.useEffect(() => {
    reloadPermissions();
  }, [reloadPermissions]);

  // Custom hooks for state management
  const state = useGereeState({ get: () => null } as any, didInitRef);
  const data = useGereeData(
    token,
    ajiltan,
    selectedBuildingId ?? undefined,
    barilgiinId ?? undefined,
    baiguullaga,
    state.resPage,
    state.resPageSize,
    state.empPage,
    state.empPageSize,
    state.currentPage,
    state.rowsPerPage,
    state.sortKey,
    state.sortOrder,
    searchTerm,
    state.unitPage,
    state.unitPageSize,
    state.selectedDawkhar,
    state.selectedOrtsForContracts,
    state.statusFilter
  );
  const actions = useGereeActions(
    token,
    ajiltan,
    barilgiinId ?? undefined,
    selectedBuildingId ?? undefined,
    baiguullaga,
    baiguullagaMutate,
    state.setIsSavingUnits,
    state.selectedOrts,
    data.composeKey,
    state.setShowResidentModal,
    state.setShowEmployeeModal,
    state.setNewResident,
    state.setNewEmployee,
    state.setEditingResident,
    state.setEditingEmployee,
    state.setIsUploadingResidents,
    state.setIsUploadingUnits,
    state.residentExcelInputRef,
    state.unitExcelInputRef,
    selectedBuildingId ?? undefined,
    state.setShowPreviewModal,
    state.setPreviewTemplate,
    state.setShowInvoicePreviewModal,
    state.setInvoicePreviewData,
    (loading) => loading ? showSpinner() : hideSpinner(),
    data.contracts
  );

  // Socket listeners
  React.useEffect(() => {
    if (!socketCtx) return;
    
    const handlers = {
      "orshinSuugch.created": data.orshinSuugchJagsaaltMutate,
      "orshinSuugch.updated": data.orshinSuugchJagsaaltMutate,
      "orshinSuugch.deleted": data.orshinSuugchJagsaaltMutate,
      "geree.created": data.gereeJagsaaltMutate,
      "geree.updated": data.gereeJagsaaltMutate,
      "geree.deleted": data.gereeJagsaaltMutate,
      "ajiltan.created": data.ajiltniiJagsaaltMutate,
      "ajiltan.updated": data.ajiltniiJagsaaltMutate,
      "ajiltan.deleted": data.ajiltniiJagsaaltMutate,
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socketCtx?.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        try {
          socketCtx?.off(event, handler);
        } catch (e) {}
      });
    };
  }, [socketCtx, data.orshinSuugchJagsaaltMutate, data.gereeJagsaaltMutate, data.ajiltniiJagsaaltMutate]);

  const value = {
    state,
    data,
    actions,
    ajiltan,
    DEFAULT_HIDDEN,
    permissionsData,
    reloadPermissions,
  };

  return (
    <GereeContext.Provider value={value}>
      {children}
    </GereeContext.Provider>
  );
}
