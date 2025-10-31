"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
  const [selectedBuildingId, setSelectedBuildingIdState] = useState<
    string | null
  >(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedBuildingId");
    if (stored) setSelectedBuildingIdState(stored);
  }, []);

  const setSelectedBuildingId = (id: string | null) => {
    setSelectedBuildingIdState(id);
    if (id) {
      localStorage.setItem("selectedBuildingId", id);
    } else {
      localStorage.removeItem("selectedBuildingId");
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
