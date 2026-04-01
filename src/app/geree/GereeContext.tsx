"use client";

import React, { createContext, useContext, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
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
      uilchilgee(token)
        .post("/erkhiinMedeelelAvya")
        .then((res) => {
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
  const state = useGereeState(searchParams, didInitRef);
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
    data.contracts,
    state.sortKey,
    state.setSortKey,
    state.sortOrder,
    state.setSortOrder
  );

  // Socket listeners
  React.useEffect(() => {
    if (!socketCtx || !ajiltan?.baiguullagiinId) return;

    // Listen on baiguullagiin channel for realtime typed events
    const baiguullagiinEvent = "baiguullagiin" + ajiltan.baiguullagiinId;
    const baiguullagiinHandler = (payload: { type?: string }) => {
      const type = payload?.type || "";
      if (
        type === "orshinSuugch.created" ||
        type === "orshinSuugch.updated" ||
        type === "orshinSuugch.deleted"
      ) {
        data.orshinSuugchJagsaaltMutate?.();
        data.gereeJagsaaltMutate?.();
      } else if (
        type === "geree.created" ||
        type === "geree.updated" ||
        type === "geree.deleted"
      ) {
        data.gereeJagsaaltMutate?.();
      } else if (
        type === "ajiltan.created" ||
        type === "ajiltan.updated" ||
        type === "ajiltan.deleted"
      ) {
        data.ajiltniiJagsaaltMutate?.();
      }
    };

    // Also keep legacy direct event name handlers for backward compat
    const legacyHandlers: Record<string, () => void> = {
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

    socketCtx.on(baiguullagiinEvent, baiguullagiinHandler);
    Object.entries(legacyHandlers).forEach(([event, handler]) => {
      socketCtx?.on(event, handler);
    });

    return () => {
      try { socketCtx.off(baiguullagiinEvent, baiguullagiinHandler); } catch (e) {}
      Object.entries(legacyHandlers).forEach(([event, handler]) => {
        try { socketCtx?.off(event, handler); } catch (e) {}
      });
    };
  }, [socketCtx, ajiltan?.baiguullagiinId, data.orshinSuugchJagsaaltMutate, data.gereeJagsaaltMutate, data.ajiltniiJagsaaltMutate]);

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
