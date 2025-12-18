"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";

interface BuildingContextType {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
}

const BuildingContext = createContext<BuildingContextType | undefined>(
  undefined
);

export const BuildingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { token, ajiltan, baiguullaga, ajiltanMutate } = useAuth();
  const hasInitializedRef = useRef(false);
  
  // Initialize from localStorage on mount
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<
    string | null
  >(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedBuildingId");
      if (stored) {
        hasInitializedRef.current = true;
        return stored;
      }
    }
    return null;
  });

  // Sync with localStorage on mount and when ajiltan/baiguullaga loads
  // IMPORTANT: This effect should only run once on mount, not when selectedBuildingId changes
  useEffect(() => {
    // Only initialize once - don't reset on every ajiltan/baiguullaga change
    if (hasInitializedRef.current) return;
    
    // If we already have a selection, mark as initialized
    if (selectedBuildingId) {
      hasInitializedRef.current = true;
      return;
    }
    
    // First try from localStorage (user's explicit choice) - this is the source of truth
    const stored = localStorage.getItem("selectedBuildingId");
    if (stored) {
      setSelectedBuildingIdState(stored);
      hasInitializedRef.current = true;
      return;
    }
    
    // Then try from ajiltan's defaultBarilga (only if no localStorage value exists)
    if (ajiltan?.defaultBarilga && !localStorage.getItem("selectedBuildingId")) {
      setSelectedBuildingIdState(ajiltan.defaultBarilga);
      localStorage.setItem("selectedBuildingId", ajiltan.defaultBarilga);
      hasInitializedRef.current = true;
      return;
    }
    
    // Finally, if organization has buildings and no building is selected yet, auto-select the first building
    if (baiguullaga?.barilguud && baiguullaga.barilguud.length > 0 && !localStorage.getItem("selectedBuildingId")) {
      const firstBuilding = baiguullaga.barilguud[0];
      if (firstBuilding?._id) {
        setSelectedBuildingIdState(firstBuilding._id);
        // Also set it in localStorage for persistence
        localStorage.setItem("selectedBuildingId", firstBuilding._id);
        hasInitializedRef.current = true;
      }
    }
  }, [ajiltan?.defaultBarilga, baiguullaga?.barilguud]);

  // Listen for localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedBuildingId") {
        if (e.newValue) {
          setSelectedBuildingIdState(e.newValue);
        } else {
          setSelectedBuildingIdState(null);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setSelectedBuildingId = (id: string | null) => {
    // Only update if the value actually changed to prevent unnecessary side effects
    if (id === selectedBuildingId) return;
    
    setSelectedBuildingIdState(id);
    hasInitializedRef.current = true; // Mark as initialized when user explicitly sets it
    
    if (id) {
      localStorage.setItem("selectedBuildingId", id);
      // Update local user data only (do not call server PUT). Persisting the
      // selected building to the server caused unexpected PUTs to /ajiltan
      // whenever the user changed the selection. We keep the selection in
      // localStorage and update the in-memory `ajiltan` so the UI reflects it.
      // Only update if defaultBarilga is different to prevent unnecessary mutations
      if (ajiltan && ajiltan.defaultBarilga !== id) {
        ajiltanMutate({ ...ajiltan, defaultBarilga: id });
      }
    } else {
      localStorage.removeItem("selectedBuildingId");
      // Remove local defaultBarilga without calling server
      if (ajiltan && ajiltan.defaultBarilga) {
        const updatedAjiltan = { ...ajiltan } as any;
        delete updatedAjiltan.defaultBarilga;
        ajiltanMutate(updatedAjiltan);
      }
    }
  };

  return (
    <BuildingContext.Provider
      value={{ selectedBuildingId, setSelectedBuildingId }}
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
