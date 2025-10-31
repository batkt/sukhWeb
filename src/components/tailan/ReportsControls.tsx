"use client";

import React, { useState, useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";
import { useBuilding } from "@/context/BuildingContext";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
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
}

export default function ReportsControls({
  dateRange,
  setDateRange,
  filters,
  setFilters,
}: Props) {
  const { selectedBuildingId } = useBuilding();
  const [reportType, setReportType] = useState<string>("summary");
  return (
    <div className="mb-4">
      <div className="flex gap-3 items-center">
        <DatePickerInput
          type="range"
          locale="mn"
          value={dateRange}
          onChange={setDateRange}
          valueFormat="YYYY-MM-DD"
          placeholder="Огноо сонгох"
          clearable
        />
        <TusgaiZagvar
          className="rounded-2xl px-3 py-2 "
          value={reportType}
          onChange={(v) => setReportType(v)}
        >
          <option value="summary">Суммар тайлан</option>
          <option value="avlaga">Өр / Авлага</option>
          <option value="orlogo-zarlaga">Орлого / Зарлага</option>
          <option value="ashig-aldagdal">Ашиг / Алдагдал</option>
          <option value="guilegee">Гүйлгээний түүх</option>
        </TusgaiZagvar>

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
