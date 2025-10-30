"use client";

import React, { createContext, useContext, useState } from "react";

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterType: string;
  setFilterType: (f: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("Бүгд");

  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, filterType, setFilterType }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
