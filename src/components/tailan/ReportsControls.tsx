"use client";

import React from "react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { useBuilding } from "@/context/BuildingContext";

interface Props {
  dateRange: [string | null, string | null] | undefined;
  setDateRange: (v: any) => void;
  filters: {
    bair?: string;
    orts?: string;
    davkhar?: string;
    toot?: string;
    gereeniiDugaar?: string;
  };
  setFilters: (f: any) => void;
  hideReportType?: boolean; // hide internal report type selector to avoid duplication
}

export default function ReportsControls({
  dateRange,
  setDateRange,
  filters,
  setFilters,
  hideReportType = true,
}: Props) {
  const { selectedBuildingId } = useBuilding();
  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        <FilterDatePicker
          id="reports-date"
          value={dateRange}
          onChange={(_, s) => setDateRange([s[0] || null, s[1] || null])}
          className="w-[284px]"
        />

        <input
          placeholder="Байр"
          value={filters.bair ?? ""}
          onChange={(e) => setFilters({ ...filters, bair: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
        />

        <input
          placeholder="Орц"
          value={filters.orts ?? ""}
          onChange={(e) => setFilters({ ...filters, orts: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
        />

        <input
          placeholder="Давхар"
          value={filters.davkhar ?? ""}
          onChange={(e) => setFilters({ ...filters, davkhar: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
        />

        <input
          placeholder="Тоот"
          value={filters.toot ?? ""}
          onChange={(e) => setFilters({ ...filters, toot: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)]"
        />
      </div>
    </div>
  );
}
