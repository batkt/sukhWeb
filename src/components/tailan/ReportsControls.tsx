"use client";

import React from "react";
import { DatePickerInput } from "@mantine/dates";
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
        <DatePickerInput
          type="range"
          locale="mn"
          value={dateRange}
          onChange={setDateRange}
          valueFormat="YYYY-MM-DD"
          placeholder="Огноо сонгох"
          clearable
          dropdownType="popover"
          popoverProps={{
            position: "bottom-start",
            withinPortal: true,
            width: 320,
          }}
          size="sm"
          radius="xl"
          classNames={{
            root: "neu-panel rounded-2xl",
            input: "px-3 py-2 h-10 text-sm",
          }}
        />

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
