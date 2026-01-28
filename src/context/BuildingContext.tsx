"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import updateMethod from "../../tools/function/updateMethod";

interface BuildingContextType {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  isInitialized: boolean;
}

const BuildingContext = createContext<BuildingContextType | undefined>(
  undefined,
);

export const BuildingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { token, ajiltan, baiguullaga, ajiltanMutate, barilgiinId } = useAuth();
  const hasInitializedRef = useRef(false);

  // Initialize from localStorage on mount
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<
    string | null
  >(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync with localStorage on mount and when ajiltan/baiguullaga loads
  // IMPORTANT: This effect should only run once on mount, not when selectedBuildingId changes
  useEffect(() => {
    // Only initialize once
    if (hasInitializedRef.current) return;

    // Priority 1: barilgiinId from cookies (already set during login)
    if (barilgiinId) {
      setSelectedBuildingIdState(barilgiinId);
      hasInitializedRef.current = true;
      setIsInitialized(true);
      return;
    }

    // Priority 2: ajiltan's defaultBarilga (from real-time API)
    if (ajiltan?.defaultBarilga) {
      setSelectedBuildingIdState(ajiltan.defaultBarilga);
      hasInitializedRef.current = true;
      setIsInitialized(true);
      return;
    }

    // Priority 3: first building in organization list
    if (baiguullaga?.barilguud && baiguullaga.barilguud.length > 0) {
      const firstBuilding = baiguullaga.barilguud[0];
      const bid = String(firstBuilding?._id || "");
      if (bid) {
        setSelectedBuildingIdState(bid);
        hasInitializedRef.current = true;
        setIsInitialized(true);
        return;
      }
    }

    // Fallback: If we have ajiltan loaded (auth complete) but no buildings,
    // still mark as initialized so pages don't wait forever
    if (ajiltan && baiguullaga) {
      hasInitializedRef.current = true;
      setIsInitialized(true);
    }
  }, [
    ajiltan,
    ajiltan?.defaultBarilga,
    baiguullaga,
    baiguullaga?.barilguud,
    barilgiinId,
  ]);

  const setSelectedBuildingId = (id: string | null) => {
    if (id === selectedBuildingId) return;

    setSelectedBuildingIdState(id);
    hasInitializedRef.current = true;

    if (id) {
      // Update in-memory ajiltan so UI stays in sync immediately
      if (ajiltan && ajiltan.defaultBarilga !== id) {
        const updatedAjiltan = { ...ajiltan, defaultBarilga: id };
        ajiltanMutate(updatedAjiltan);
        
        // Persist to backend so it survives page navigation (fire and forget)
        updateMethod("ajiltan", token, {
          _id: ajiltan._id,
          defaultBarilga: id,
        }).catch((error) => {
          console.error("Failed to persist building selection:", error);
        });
      }
    } else {
      if (ajiltan && ajiltan.defaultBarilga) {
        const updatedAjiltan = { ...ajiltan } as any;
        delete updatedAjiltan.defaultBarilga;
        ajiltanMutate(updatedAjiltan);
        
        // Persist to backend (fire and forget)
        updateMethod("ajiltan", token, {
          _id: ajiltan._id,
          defaultBarilga: null,
        }).catch((error) => {
          console.error("Failed to clear building selection:", error);
        });
      }
    }
  };

  return (
    <BuildingContext.Provider
      value={{ selectedBuildingId, setSelectedBuildingId, isInitialized }}
    >
      {children}
    </BuildingContext.Provider>
  );
};

export const useBuilding = () => {
  const context = useContext(BuildingContext);
  if (!context)
    throw new Error("useBuilding must be used within BuildingProvider");
  return context;
};
