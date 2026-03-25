"use client";

import React, { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";

interface UnitsSectionProps {
  davkharOptions: string[];
  ortsOptions: string[];
  selectedOrts: string;
  setSelectedOrts: (orts: string) => void;
  selectedBarilga: any;
  contracts: any[];
  residentsById: Record<string, any>;
  currentFloors: string[];
  floorsList: string[];
  unitPage: number;
  unitPageSize: number;
  unitTotalPages: number;
  setUnitPage: (page: number) => void;
  setUnitPageSize: (size: number) => void;
  isSavingUnits: boolean;
  composeKey: (orts: string, floor: string) => string;
  unitStatusFilter: "all" | "occupied" | "free";
  getTootOptions: (orts: string, floor: string) => string[];
  onAddUnit: (floor: string) => void;
  onDeleteUnit: (floor: string, unit: string) => void;
  onDeleteFloor: (floor: string) => void;
}

export default function UnitsSection({
  davkharOptions,
  ortsOptions,
  selectedOrts,
  setSelectedOrts,
  selectedBarilga,
  contracts,
  residentsById,
  currentFloors,
  floorsList,
  unitPage,
  unitPageSize,
  unitTotalPages,
  setUnitPage,
  setUnitPageSize,
  isSavingUnits,
  composeKey,
  unitStatusFilter,
  getTootOptions,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
}: UnitsSectionProps) {
  // Compute floor data for UnitsTable
  const floorData = useMemo(() => {
    if (!selectedOrts) return [];

    return currentFloors.map((floor) => {
      const key = composeKey(selectedOrts, floor);
      const units = getTootOptions(selectedOrts, floor);

      // Find active toots (units with active contracts) for this floor
      const activeToots = new Set<string>();
      contracts.forEach((c) => {
        const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
        const isCancelled =
          status === "Цуцалсан" ||
          status.toLowerCase() === "цуцалсан" ||
          status === "tsutlsasan" ||
          status.toLowerCase() === "tsutlsasan" ||
          status === "Идэвхгүй" ||
          status.toLowerCase() === "идэвхгүй";
        if (isCancelled) return;

        // Get orts and floor from contract or linked resident
        const orshinSuugchId = c?.orshinSuugchId;
        let contractOrts = String(c?.orts || "").trim();
        let contractFloor = String(c?.davkhar || "").trim();
        let contractToot = String(c?.toot || "").trim();

        if (orshinSuugchId && residentsById[String(orshinSuugchId)]) {
          const resident = residentsById[String(orshinSuugchId)];
          if (resident.orts != null)
            contractOrts = String(resident.orts).trim();
          if (resident.davkhar != null)
            contractFloor = String(resident.davkhar).trim();
          if (resident.toot != null)
            contractToot = String(resident.toot).trim();
        }

        if (
          contractOrts === selectedOrts &&
          contractFloor === floor &&
          contractToot
        ) {
          activeToots.add(contractToot);
        }
      });

      // Filter units based on unitStatusFilter
      let filteredUnits: string[];
      if (unitStatusFilter === "occupied") {
        filteredUnits = units.filter((u) => activeToots.has(u));
      } else if (unitStatusFilter === "free") {
        filteredUnits = units.filter((u) => !activeToots.has(u));
      } else {
        filteredUnits = units;
      }

      return {
        floor,
        units,
        filteredUnits,
        activeToots,
      };
    });
  }, [
    currentFloors,
    selectedOrts,
    contracts,
    residentsById,
    composeKey,
    getTootOptions,
    unitStatusFilter,
  ]);

  if (davkharOptions.length === 0) {
    return (
      <div className="p-3 rounded-md border border-amber-300 text-amber-700 text-sm">
        Давхарын тохиргоо хийгдээгүй байна. Эхлээд "Барилгын тохиргоо" дээрээс
        давхар оруулна уу.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        {isSavingUnits && (
          <div className="text-xs text-slate-500">Хадгалж байна…</div>
        )}
      </div>

      <div className="space-y-4">
        {ortsOptions.length === 0 && (
          <div className="p-3 rounded-2xl border border-blue-300 text-blue-700 text-sm">
            Орцын тохиргоо хийгдээгүй байна. "Барилгын тохиргоо" хэсгээс Орцын
            тоог оруулбал энд сонгох боломжтой болно.
          </div>
        )}

        {selectedOrts && (
          <div>
            <div className="table-surface w-full">
              <div className="p-1 allow-overflow">
                <UnitsTable
                  data={floorData}
                  loading={isSavingUnits}
                  page={unitPage}
                  pageSize={unitPageSize}
                  onAddUnit={onAddUnit}
                  onDeleteUnit={onDeleteUnit}
                  onDeleteFloor={onDeleteFloor}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-2 py-1 text-md">
              <div className="text-theme/70">Нийт: {floorsList.length}</div>
              <div className="flex items-center gap-3">
                <PageSongokh
                  value={unitPageSize}
                  onChange={(v) => {
                    setUnitPageSize(v);
                    setUnitPage(1);
                  }}
                  className="text-sm px-2"
                />
                <div id="units-pagination" className="flex items-center gap-1">
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
                    disabled={unitPage <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, unitPage - 1);
                      setUnitPage(newPage);
                    }}
                  >
                    Өмнөх
                  </button>
                  <div className="text-theme/70 px-1">{unitPage}</div>
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
                    disabled={unitPage >= unitTotalPages}
                    onClick={() => {
                      const newPage = Math.min(unitTotalPages, unitPage + 1);
                      setUnitPage(newPage);
                    }}
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
