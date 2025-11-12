"use client";

import { createContext, useContext, useState, useEffect } from "react";
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
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<
    string | null
  >(null);

  useEffect(() => {
    // First try from localStorage
    const stored = localStorage.getItem("selectedBuildingId");
    if (stored) {
      setSelectedBuildingIdState(stored);
      return;
    }
    // Then try from ajiltan's defaultBarilga
    if (ajiltan?.defaultBarilga) {
      setSelectedBuildingIdState(ajiltan.defaultBarilga);
      return;
    }
    // Finally, if organization has buildings and no building is selected yet, auto-select the first building
    if (baiguullaga?.barilguud && baiguullaga.barilguud.length > 0) {
      const firstBuilding = baiguullaga.barilguud[0];
      if (firstBuilding?._id) {
        setSelectedBuildingIdState(firstBuilding._id);
        // Also set it in localStorage for persistence
        localStorage.setItem("selectedBuildingId", firstBuilding._id);
      }
    }
  }, [ajiltan, baiguullaga]);

  const setSelectedBuildingId = (id: string | null) => {
    setSelectedBuildingIdState(id);
    if (id) {
      localStorage.setItem("selectedBuildingId", id);
      // Update local user data only (do not call server PUT). Persisting the
      // selected building to the server caused unexpected PUTs to /ajiltan
      // whenever the user changed the selection. We keep the selection in
      // localStorage and update the in-memory `ajiltan` so the UI reflects it.
      if (ajiltan) {
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
