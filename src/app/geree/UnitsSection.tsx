"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import Button from "@/components/ui/Button";

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
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

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

          // 1. Filter contract by type to prevent cross-tab duplicate activation
          const cTurul = String(c?.turul || "").trim();
          if (propertyTab === "Зогсоол") {
            if (cTurul !== "Зогсоол") return;
          } else if (propertyTab === "Агуулах") {
            if (cTurul !== "Агуулах") return;
          } else {
            // "Тоот" tab
            if (cTurul === "Зогсоол" || cTurul === "Агуулах") return;
          }

          // Find all toots associated with this contract
          const tootsList: { o: string; f: string; t: string }[] = [];

          const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
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
              // 2. Filter resident toots by type
              const rtTurul = String(rt.turul || "Орон сууц").trim();
              if (propertyTab === "Зогсоол") {
                if (rtTurul !== "Гараж") return;
              } else if (propertyTab === "Агуулах") {
                if (rtTurul !== "Агуулах") return;
              } else {
                // "Тоот" tab
                if (rtTurul !== "Орон сууц") return;
              }

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

  // Auto-select the first floor when data loads or activeTab/orts changes
  useEffect(() => {
    if (floorData && floorData.length > 0) {
      const exists = floorData.some((f) => f.floor === selectedFloor);
      if (!exists) {
        setSelectedFloor(floorData[0].floor);
      }
    } else {
      setSelectedFloor(null);
    }
  }, [floorData, selectedFloor]);

  const selectedFloorData = useMemo(() => {
    if (!selectedFloor) return null;
    return floorData.find((f) => f.floor === selectedFloor) || null;
  }, [floorData, selectedFloor]);

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
          <>
            <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <div className="p-1 allow-overflow no-scrollbar" id="units-table">
                <UnitsTable
                  data={floorData.slice((unitPage - 1) * unitPageSize, unitPage * unitPageSize)}
                  actions={actions}
                  loading={isSavingUnits}
                  page={unitPage}
                  pageSize={unitPageSize}
                  maxHeight={propertyTab !== "Тоот" ? "200px" : "calc(100vh - 520px)"}
                  onAddUnit={onAddUnit}
                  onDeleteUnit={onDeleteUnit}
                  onDeleteFloor={onDeleteFloor}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                  propertyTab={propertyTab}
                  selectedFloor={selectedFloor}
                  onSelectFloor={setSelectedFloor}
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

            {/* Bottom Grid Box for Parking/Storage */}
            {(propertyTab === "Зогсоол" || propertyTab === "Агуулах") && selectedFloorData && (
              <div className="mt-6 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>{propertyTab} давхрын тоотууд</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                        {selectedFloor}-р давхар
                      </span>
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Нийт тохируулсан: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedFloorData.units.length}</span> тоот / зогсоол / агуулах.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => onAddUnit(selectedFloor || "")}
                      variant="primary"
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Шинэ тоот нэмэх
                    </Button>
                    
                    <Button
                      disabled={selectedFloorData.units.length === 0}
                      onClick={() => onDeleteFloor(selectedFloor || "")}
                      variant="ghost"
                      className="border border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20 !text-red-600 dark:!text-red-400"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Давхрыг бүхэлд нь устгах
                    </Button>
                  </div>
                </div>

                {selectedFloorData.filteredUnits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                    <span className="italic text-slate-400 dark:text-slate-500 text-sm mb-3">
                      Энэ давхарт одоогоор бүртгэлтэй тоот/зогсоол байхгүй байна.
                    </span>
                    <Button
                      onClick={() => onAddUnit(selectedFloor || "")}
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Анхны тоот үүсгэх
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                    {selectedFloorData.filteredUnits.map((unit) => {
                      const unitStr = String(unit).trim();
                      const hasActive = selectedFloorData.activeToots.has(unitStr);
                      return (
                        <div
                          key={unitStr}
                          className={`group relative flex flex-col items-center justify-center min-h-[55px] p-2 rounded-xl border transition-all duration-150 shadow-sm ${
                            hasActive
                              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-600 ring-1 ring-emerald-500/10"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-400 hover:shadow-md cursor-default"
                          }`}
                        >
                          <span
                            className={`text-sm font-bold tracking-wide ${
                              hasActive
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {unitStr}
                          </span>
                          <span className={`text-[10px] mt-0.5 font-medium ${
                            hasActive ? "text-emerald-500 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500"
                          }`}>
                            {hasActive ? "Бүртгэлтэй" : "Сул"}
                          </span>
                          
                          {hasActive && (
                            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          
                          <button
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-slate-800 dark:bg-slate-700 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 dark:hover:bg-red-600 scale-75 group-hover:scale-100 z-10"
                            title={`${unitStr} тоотыг устгах`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteUnit(selectedFloor || "", unitStr);
                            }}
                          >
                            <span className="text-[11px] font-bold leading-none">×</span>
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Add Spot Dashed Box inside Grid for premium feel */}
                    <div
                      onClick={() => onAddUnit(selectedFloor || "")}
                      className="group flex flex-col items-center justify-center min-h-[55px] p-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer transition-all duration-150"
                      title="Шинэ тоот нэмэх"
                    >
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-transform duration-150" />
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-semibold mt-0.5">Нэмэх</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
