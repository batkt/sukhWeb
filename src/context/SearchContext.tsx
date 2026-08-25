"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

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

  // Memoised: an inline object literal handed every consumer a new value on
  // each keystroke, re-rendering the whole shell as you typed.
  const value = useMemo(
    () => ({ searchTerm, setSearchTerm, filterType, setFilterType }),
    [searchTerm, filterType],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
