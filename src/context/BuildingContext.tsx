"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import updateMethod from "../../tools/function/updateMethod";

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
  const { token, ajiltan, ajiltanMutate } = useAuth();
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
    }
  }, [ajiltan]);

  const setSelectedBuildingId = (id: string | null) => {
    setSelectedBuildingIdState(id);
    if (id) {
      localStorage.setItem("selectedBuildingId", id);
      // Also save to user's profile
      if (token && ajiltan) {
        updateMethod("ajiltan", token, { ...ajiltan, defaultBarilga: id })
          .then((resp: any) => {
            const updated = resp?.data ?? resp;
            ajiltanMutate(updated);
          })
          .catch(() => {
            // Ignore API errors
          });
      }
    } else {
      localStorage.removeItem("selectedBuildingId");
      // Also remove from user's profile
      if (token && ajiltan && ajiltan.defaultBarilga) {
        const updatedAjiltan = { ...ajiltan };
        delete updatedAjiltan.defaultBarilga;
        updateMethod("ajiltan", token, updatedAjiltan)
          .then((resp: any) => {
            const updated = resp?.data ?? resp;
            ajiltanMutate(updated);
          })
          .catch(() => {
            // Ignore API errors
          });
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
