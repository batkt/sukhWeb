"use client";

import React from "react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
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
        <div
          id="reports-date"
          className="btn-minimal h-[40px] w-[320px] flex items-center px-3"
        >
          <StandardDatePicker
            isRange={true}
            value={dateRange}
            onChange={setDateRange}
            allowClear
            placeholder="Огноо сонгох"
            classNames={{
              root: "!h-full !w-full",
              input:
                "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
            }}
          />
        </div>

        <input
          placeholder="Байр"
          value={filters.bair ?? ""}
          onChange={(e) => setFilters({ ...filters, bair: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2"
        />

        <input
          placeholder="Орц"
          value={filters.orts ?? ""}
          onChange={(e) => setFilters({ ...filters, orts: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2"
        />

        <input
          placeholder="Давхар"
          value={filters.davkhar ?? ""}
          onChange={(e) => setFilters({ ...filters, davkhar: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2"
        />

        <input
          placeholder="Тоот"
          value={filters.toot ?? ""}
          onChange={(e) => setFilters({ ...filters, toot: e.target.value })}
          className="rounded-2xl neu-panel px-3 py-2"
        />
      </div>
    </div>
  );
}
