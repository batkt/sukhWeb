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
  propertyTab: "Тоот" | "Зогсоол" | "Агуулах";
  unitStatusFilter: "all" | "occupied" | "free";
  getTootOptions: (orts: string, floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => string[];
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
  propertyTab,
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
        const units = getTootOptions(orts, floor, propertyTab);

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

          // Find all toots associated with this contract
          const tootsList: { o: string; f: string; t: string }[] = [];

          const orshinSuugchId = c?.orshinSuugchId;
          const resident = orshinSuugchId
            ? residentsById[String(orshinSuugchId)]
            : null;

          if (
            resident &&
            Array.isArray(resident.toots) &&
            resident.toots.length > 0
          ) {
            // Priority 1: Resident's modern toots array
            resident.toots.forEach((rt: any) => {
              const rOrts = String(rt.orts || "").trim();
              const rFloor = String(rt.davkhar || "").trim();
              const rToots = String(rt.toot || "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
              rToots.forEach((rtToot) => {
                tootsList.push({ o: rOrts, f: rFloor, t: rtToot });
              });
            });
          } else {
            // Priority 2: Contract fields (fallback to single resident fields)
            let cOrtsStr = String(c?.orts || "").trim();
            let cFloorStr = String(c?.davkhar || "").trim();
            let cTootStr = String(c?.toot || "").trim();

            if (resident) {
              if (!cOrtsStr && resident.orts != null)
                cOrtsStr = String(resident.orts).trim();
              if (!cFloorStr && resident.davkhar != null)
                cFloorStr = String(resident.davkhar).trim();
              if (!cTootStr && resident.toot != null)
                cTootStr = String(resident.toot).trim();
            }

            const cOrtsArr = cOrtsStr
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            const cFloorArr = cFloorStr
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            const cTootArr = cTootStr
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);

            if (cOrtsArr.length > 0 && cFloorArr.length > 0 && cTootArr.length > 0) {
              cOrtsArr.forEach((o) => {
                cFloorArr.forEach((f) => {
                  cTootArr.forEach((t) => {
                    tootsList.push({ o, f, t });
                  });
                });
              });
            } else if (cTootArr.length > 0) {
              cTootArr.forEach((t) => {
                tootsList.push({ o: cOrtsStr, f: cFloorStr, t });
              });
            }
          }

          // Add to activeToots if they match the current orts and floor
          tootsList.forEach((tItem) => {
            if (tItem.t) {
              const matchOrts = tItem.o === orts || !tItem.o;
              const matchFloor = tItem.f === floor || !tItem.f;
              if (matchOrts && matchFloor) {
                activeToots.add(tItem.t);
              }
            }
          });
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
    propertyTab,
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
