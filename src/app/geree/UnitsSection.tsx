"use client";

import React, { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";

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
  actions: any;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
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
  actions,
  sortKey = "orts",
  sortOrder = "asc",
  composeKey,
  unitStatusFilter,
  getTootOptions,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
}: UnitsSectionProps) {
  // Compute floor data for UnitsTable
  const floorData = useMemo(() => {
    const targetOrtsList = selectedOrts ? [selectedOrts] : ortsOptions;
    if (targetOrtsList.length === 0) return [];

    const allFloorData: FloorItem[] = [];

    targetOrtsList.forEach((orts) => {
      floorsList.forEach((floor) => {
        const key = composeKey(orts, floor);
        const units = getTootOptions(orts, floor);

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
            contractOrts === orts &&
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

        allFloorData.push({
          orts,
          floor,
          units,
          filteredUnits,
          activeToots,
        });
      });
    });

    // Apply Sorting
    allFloorData.sort((a, b) => {
      let aVal: any = a[sortKey as keyof FloorItem] || a.floor;
      let bVal: any = b[sortKey as keyof FloorItem] || b.floor;

      if (sortKey === "unitsCount" || sortKey === "units") {
        aVal = a.units.length;
        bVal = b.units.length;
      } else {
        const aNum = parseInt(String(aVal));
        const bNum = parseInt(String(bVal));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aVal = aNum;
          bVal = bNum;
        } else {
          aVal = String(aVal);
          bVal = String(bVal);
        }
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return allFloorData;
  }, [
    floorsList,
    selectedOrts,
    contracts,
    residentsById,
    composeKey,
    getTootOptions,
    unitStatusFilter,
    sortKey,
    sortOrder,
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

        {(selectedOrts !== undefined) && (
          <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <div className="p-1 allow-overflow no-scrollbar" id="units-table">
              <UnitsTable
                data={floorData.slice((unitPage - 1) * unitPageSize, unitPage * unitPageSize)}
                actions={actions}
                loading={isSavingUnits}
                page={unitPage}
                pageSize={unitPageSize}
                maxHeight="calc(100vh - 520px)"
                onAddUnit={onAddUnit}
                onDeleteUnit={onDeleteUnit}
                onDeleteFloor={onDeleteFloor}
                sortKey={sortKey}
                sortOrder={sortOrder}
              />
            </div>
            <div id="units-pagination">
              <StandardPagination
                current={unitPage}
                total={floorData.length}
                pageSize={unitPageSize}
                onChange={setUnitPage}
                onPageSizeChange={(v) => {
                  setUnitPageSize(v);
                  setUnitPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
