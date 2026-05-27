"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Info, User, Phone, X } from "lucide-react";
import { Tooltip } from "antd";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import Button from "@/components/ui/Button";
import QuickRegisterModal from "./modals/QuickRegisterModal";
import { ModalPortal } from "../../../components/golContent";

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
  setUnitStatusFilter?: (val: "all" | "occupied" | "free") => void;
  getTootOptions: (
    orts: string,
    floor: string,
    turul?: "Тоот" | "Зогсоол" | "Агуулах",
  ) => string[];
  onAddUnit: (floor: string) => void;
  onDeleteUnit: (floor: string, unit: string) => void;
  onDeleteFloor: (floor: string) => void;
  residentsList: any[];
  clientsList: any[];
  onAssignToUnit: (
    personId: string,
    personType: "orshinSuugch" | "khariltsagch",
    orts: string,
    floor: string,
    unit: string,
    propertyTab: "Тоот" | "Зогсоол" | "Агуулах",
  ) => Promise<boolean>;
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
  setUnitStatusFilter,
  getTootOptions,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
  residentsList,
  clientsList,
  onAssignToUnit,
}: UnitsSectionProps) {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [quickRegister, setQuickRegister] = useState<{ unit: string; floor: string } | null>(null);
  const [activeUnitDetails, setActiveUnitDetails] = useState<{ unit: string; floor: string; resident: any } | null>(null);

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
        const unitToResident: Record<string, any> = {};
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

          const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
          const resident = orshinSuugchId
            ? residentsById[String(orshinSuugchId)]
            : null;

          const hasTootsArray =
            resident &&
            Array.isArray(resident.toots) &&
            resident.toots.length > 0;

          if (!hasTootsArray) {
            const cTurul = String(c?.turul || "").trim();
            if (propertyTab === "Зогсоол") {
              if (cTurul !== "Зогсоол") return;
            } else if (propertyTab === "Агуулах") {
              if (cTurul !== "Агуулах") return;
            } else {
              // "Тоот" tab
              if (cTurul === "Зогсоол" || cTurul === "Агуулах") return;
            }
          }

          if (
            resident &&
            Array.isArray(resident.toots) &&
            resident.toots.length > 0
          ) {
            resident.toots.forEach((rt: any) => {
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

            if (
              cOrtsArr.length > 0 &&
              cFloorArr.length > 0 &&
              cTootArr.length > 0
            ) {
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
                if (!unitToResident[tItem.t] && resident) {
                  unitToResident[tItem.t] = resident;
                }
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
          unitToResident,
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

  const uniqueSortedFloorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(floorData.map((f) => f.floor)));

    uniqueFloors.sort((a, b) => {
      const aIsB = /^b/i.test(a);
      const bIsB = /^b/i.test(b);

      if (aIsB && !bIsB) return -1;
      if (!aIsB && bIsB) return 1;

      const aNum = parseInt(aIsB ? a.slice(1) : a, 10);
      const bNum = parseInt(bIsB ? b.slice(1) : b, 10);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });

    return uniqueFloors.map((floor) => ({
      value: floor,
      label: floor,
    }));
  }, [floorData]);

  // Auto-select the first floor when data loads or activeTab/orts changes
  useEffect(() => {
    if (uniqueSortedFloorOptions && uniqueSortedFloorOptions.length > 0) {
      const exists = uniqueSortedFloorOptions.some((o) => o.value === selectedFloor);
      if (!exists) {
        setSelectedFloor(uniqueSortedFloorOptions[0].value);
      }
    } else {
      setSelectedFloor(null);
    }
  }, [uniqueSortedFloorOptions, selectedFloor]);

  const selectedFloorData = useMemo(() => {
    if (!selectedFloor) return null;
    return floorData.find((f) => f.floor === selectedFloor) || null;
  }, [floorData, selectedFloor]);

  const stats = useMemo(() => {
    let total = 0;
    let occupied = 0;

    floorData.forEach((f) => {
      total += f.units.length;
      occupied += f.activeToots.size;
    });

    return {
      total,
      occupied,
      free: total - occupied,
    };
  }, [floorData]);

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

        {selectedOrts !== undefined && (
          <>
            {propertyTab === "Тоот" && (
              <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <div className="p-1 allow-overflow no-scrollbar" id="units-table">
                  <UnitsTable
                    data={floorData.slice(
                      (unitPage - 1) * unitPageSize,
                      unitPage * unitPageSize,
                    )}
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
            )}

            {/* Visual Floor Units Map — only for garage and storage */}
            {selectedFloorData && propertyTab !== "Тоот" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <button
                    onClick={() => setUnitStatusFilter?.("all")}
                    className={`text-center select-none outline-none focus:outline-none transition-all duration-200 cursor-pointer rounded-2xl p-4 shadow-sm border ${unitStatusFilter === "all"
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/50 shadow-md scale-[1.02]"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-slate-600 opacity-60 hover:opacity-100 hover:scale-[1.01]"
                      }`}
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Нийт тоот
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {stats.total}
                    </p>
                  </button>

                  <button
                    onClick={() => setUnitStatusFilter?.("free")}
                    className={`text-center select-none outline-none focus:outline-none transition-all duration-200 cursor-pointer rounded-2xl p-4 shadow-sm border ${unitStatusFilter === "free"
                      ? "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/50 shadow-md scale-[1.02]"
                      : "bg-orange-50/40 dark:bg-orange-950/10 border-orange-100/60 dark:border-orange-900/10 hover:border-orange-200 dark:hover:border-orange-900/30 opacity-60 hover:opacity-100 hover:scale-[1.01]"
                      }`}
                  >
                    <p className={`text-xs mb-1 font-semibold ${unitStatusFilter === "free" ? "text-orange-700 dark:text-orange-300" : "text-orange-600 dark:text-orange-400"
                      }`}>
                      Чөлөөтэй
                    </p>
                    <p className={`text-2xl font-bold ${unitStatusFilter === "free" ? "text-orange-700 dark:text-orange-300" : "text-orange-600 dark:text-orange-400"
                      }`}>
                      {stats.free}
                    </p>
                  </button>

                  <button
                    onClick={() => setUnitStatusFilter?.("occupied")}
                    className={`text-center select-none outline-none focus:outline-none transition-all duration-200 cursor-pointer rounded-2xl p-4 shadow-sm border ${unitStatusFilter === "occupied"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]"
                      : "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-900/30 opacity-60 hover:opacity-100 hover:scale-[1.01]"
                      }`}
                  >
                    <p className={`text-xs mb-1 font-semibold ${unitStatusFilter === "occupied" ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                      Бүртгэлтэй
                    </p>
                    <p className={`text-2xl font-bold ${unitStatusFilter === "occupied" ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                      {stats.occupied}
                    </p>
                  </button>

                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-4 shadow-sm text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                      Тухайн давхрын тоотууд
                    </p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {selectedFloorData.filteredUnits.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Left: Floor Map */}
                  <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>{propertyTab} давхрын тоотууд</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                          {selectedFloor}-р давхар
                        </span>
                      </h3>
                    </div>

                    {selectedFloorData.filteredUnits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                        <span className="italic text-slate-400 dark:text-slate-500 text-sm mb-3">
                          Энэ давхарт одоогоор бүртгэлтэй тоот байхгүй байна.
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
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 w-16 shrink-0">
                            {selectedFloor}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedFloorData.filteredUnits.map((unit) => {
                              const unitStr = String(unit).trim();
                              const isOccupied =
                                selectedFloorData.activeToots.has(unitStr);
                              const isSelected = selectedUnit === unitStr;
                              const resident = selectedFloorData.unitToResident[unitStr];
                              const fullName = resident
                                ? ([resident.ovog, resident.ner].filter(Boolean).join(" ") || resident.ner || "Нэргүй")
                                : "";
                              const utas = resident?.utas || "";
                              const tooltipTitle = isOccupied
                                ? (utas ? `${fullName} (${utas})` : fullName)
                                : "Бүртгүүлэх";

                              return (
                                <Tooltip title={tooltipTitle} key={unitStr} color="#1e293b" placement="top">
                                  <button
                                    onClick={() => {
                                      setSelectedUnit(unitStr);
                                      if (isOccupied) {
                                        setActiveUnitDetails({
                                          unit: unitStr,
                                          floor: selectedFloor || "",
                                          resident,
                                        });
                                      } else {
                                        setQuickRegister({
                                          unit: unitStr,
                                          floor: selectedFloor || "",
                                        });
                                      }
                                    }}
                                    className={`w-14 h-10 rounded-2xl flex items-center justify-center font-bold text-xs border transition-all duration-200 cursor-pointer ${isOccupied
                                      ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 dark:border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                      : "bg-orange-500 hover:bg-orange-600 border-orange-600 dark:border-orange-500 text-white shadow-sm shadow-orange-500/20"
                                      } ${isSelected
                                        ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900"
                                        : ""
                                      }`}
                                  >
                                    {unitStr}
                                  </button>
                                </Tooltip>
                              );
                            })}
                            <button
                              onClick={() => onAddUnit(selectedFloor || "")}
                              className="flex items-center justify-center w-14 h-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all"
                              title="Шинэ тоот нэмэх"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-2xl bg-emerald-400 inline-block" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              Бүртгэлтэй
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-2xl bg-orange-400 inline-block" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              Чөлөөтэй
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-2xl border-2 border-dashed border-slate-300 inline-block" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              Нэмэх
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Actions Panel */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-500" />
                      {propertyTab} мэдээлэл
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                          Давхар
                        </span>
                        <div className="w-32">
                          <TusgaiZagvar
                            value={selectedFloor || ""}
                            onChange={(val) => setSelectedFloor(val)}
                            options={uniqueSortedFloorOptions}
                            placeholder="Давхар сонгох"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Нийт тоот
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {selectedFloorData.units.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-2xl">
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                          Чөлөөтэй
                        </span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {selectedFloorData.units.length -
                            selectedFloorData.activeToots.size}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl">
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                          Бүртгэлтэй
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedFloorData.activeToots.size}
                        </span>
                      </div>

                      {selectedUnit && (
                        <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                Сонгосон тоот
                              </p>
                              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {selectedUnit}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${selectedFloorData.activeToots.has(selectedUnit)
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                                }`}
                            >
                              {selectedFloorData.activeToots.has(selectedUnit)
                                ? "Бүртгэлтэй"
                                : "Сул байна"}
                            </span>
                          </div>

                          {(() => {
                            const resident =
                              selectedFloorData.unitToResident[selectedUnit];
                            if (!resident) return null;
                            const fullName =
                              [resident.ovog, resident.ner]
                                .filter(Boolean)
                                .join(" ") ||
                              resident.ner ||
                              "Нэргүй";
                            const btnLabel =
                              propertyTab === "Зогсоол"
                                ? "Зогсоолын төлбөр нэмэх"
                                : "Агуулахын төлбөр нэмэх";
                            return (
                              <div className="space-y-3 mb-3">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                      {fullName}
                                    </span>
                                  </div>
                                  {resident.utas && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {resident.utas}
                                      </span>
                                    </div>
                                  )}
                                  {resident.toot && (
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700/80 font-medium">
                                      <span className="text-xs">🏠</span>
                                      <span>
                                        {[
                                          resident.orts ? `${resident.orts}-р орц` : "",
                                          resident.davkhar ? `${resident.davkhar}-р давхар` : "",
                                          resident.toot ? `${resident.toot} тоот` : ""
                                        ].filter(Boolean).join(", ")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  onClick={async () => {
                                    if (actions.handleAddGarageCharges) {
                                      await actions.handleAddGarageCharges([resident], propertyTab);
                                    }
                                  }}
                                  variant="secondary"
                                  fullWidth
                                  className="!bg-orange-500 hover:!bg-orange-600 !text-white rounded-2xl shadow-sm border-none"
                                >
                                  {btnLabel}
                                </Button>
                                <Button
                                  onClick={async () => {
                                    const isClient = clientsList.some((c) => String(c._id) === String(resident._id));
                                    const bId = resident.baiguullagiinId || selectedBarilga?.baiguullagiinId || "";
                                    const barId = resident.barilgiinId || selectedBarilga?._id || selectedBarilga?.id || "";

                                    if (isClient) {
                                      if (actions.handleRemoveClientToot) {
                                        await actions.handleRemoveClientToot(resident._id, bId, barId, selectedUnit);
                                      }
                                    } else {
                                      if (actions.handleRemoveResidentToot) {
                                        await actions.handleRemoveResidentToot(resident._id, bId, barId, selectedUnit);
                                      }
                                    }
                                    setSelectedUnit(null);
                                    setActiveUnitDetails(null);
                                  }}
                                  variant="ghost"
                                  fullWidth
                                  className="border border-red-200 bg-red-50/50 hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:bg-red-950/30 !text-red-600 dark:!text-red-400 rounded-2xl"
                                >
                                  Холбоос салгах
                                </Button>
                              </div>
                            );
                          })()}

                          <Button
                            onClick={() => {
                              onDeleteUnit(selectedFloor || "", selectedUnit);
                              setSelectedUnit(null);
                            }}
                            variant="ghost"
                            fullWidth
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="border border-red-200 bg-red-50/50 hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:bg-red-950/30 !text-red-600 dark:!text-red-400 rounded-2xl"
                          >
                            Устгах
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 space-y-2">
                      <Button
                        onClick={() => onAddUnit(selectedFloor || "")}
                        variant="primary"
                        className="w-full"
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        Шинэ тоот нэмэх
                      </Button>
                      <Button
                        disabled={selectedFloorData.units.length === 0}
                        onClick={() => {
                          onDeleteFloor(selectedFloor || "");
                          setSelectedUnit(null);
                        }}
                        variant="ghost"
                        className="w-full border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-950/30 !text-red-600 dark:!text-red-400"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Давхрыг устгах
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Register Modal */}
      <QuickRegisterModal
        show={!!quickRegister}
        onClose={() => setQuickRegister(null)}
        unit={quickRegister?.unit || null}
        floor={quickRegister?.floor || null}
        orts={selectedOrts}
        propertyTab={propertyTab}
        residentsList={residentsList}
        clientsList={clientsList}
        onAssign={async (personId, type) => {
          if (!quickRegister) return false;
          const { unit, floor } = quickRegister;
          return await onAssignToUnit(personId, type, selectedOrts, floor, unit, propertyTab);
        }}
        onRegisterNewOrshinSuugch={() => {
          if (!quickRegister) return;
          const { unit, floor } = quickRegister;
          const unitTurul =
            propertyTab === "Зогсоол"
              ? "Гараж"
              : propertyTab === "Агуулах"
                ? "Агуулах"
                : "Орон сууц";
          actions.handleShowResidentModal?.({
            orts: selectedOrts,
            davkhar: floor,
            toot: unit,
            turul: unitTurul,
          });
        }}
        onRegisterNewKhariltsagch={() => {
          if (!quickRegister) return;
          const { unit, floor } = quickRegister;
          const unitTurul =
            propertyTab === "Зогсоол"
              ? "Гараж"
              : propertyTab === "Агуулах"
                ? "Агуулах"
                : "Орон сууц";
          actions.handleShowClientModal?.({
            orts: selectedOrts,
            davkhar: floor,
            toot: unit,
            turul: unitTurul,
          });
        }}
      />

      {/* Occupied Unit Details Modal */}
      {activeUnitDetails && (
        <ModalPortal>
          <div className="fixed inset-0 z-[12000] flex items-center justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-all duration-300"
              onClick={() => setActiveUnitDetails(null)}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    {propertyTab} холбоос
                  </p>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold">
                      {activeUnitDetails.floor}-р давхар
                    </span>
                    <span className="text-slate-400 font-light">/</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold">
                      {activeUnitDetails.unit}-р тоот
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setActiveUnitDetails(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4">
                {activeUnitDetails.resident ? (
                  <div className="space-y-4">
                    {/* Resident Info Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        Бүртгэлтэй оршин суугч
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {[activeUnitDetails.resident.ovog, activeUnitDetails.resident.ner]
                              .filter(Boolean)
                              .join(" ") ||
                              activeUnitDetails.resident.ner ||
                              "Нэргүй"}
                          </p>
                          {activeUnitDetails.resident.utas && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {activeUnitDetails.resident.utas}
                            </p>
                          )}
                          {activeUnitDetails.resident.toot && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl w-fit border border-slate-200 dark:border-slate-700/80 font-medium">
                              <span className="text-xs">🏠</span>
                              <span>
                                {[
                                  activeUnitDetails.resident.orts ? `${activeUnitDetails.resident.orts}-р орц` : "",
                                  activeUnitDetails.resident.davkhar ? `${activeUnitDetails.resident.davkhar}-р давхар` : "",
                                  activeUnitDetails.resident.toot ? `${activeUnitDetails.resident.toot} тоот` : ""
                                ].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Send Manual Invoice */}
                    <Button
                      onClick={async () => {
                        if (actions.handleAddGarageCharges) {
                          await actions.handleAddGarageCharges([activeUnitDetails.resident], propertyTab);
                          setActiveUnitDetails(null);
                        }
                      }}
                      variant="secondary"
                      fullWidth
                      className="!bg-orange-500 hover:!bg-orange-600 !text-white rounded-2xl shadow-md shadow-orange-500/10"
                    >
                      {propertyTab === "Зогсоол"
                        ? "Зогсоолын төлбөр нэмэх"
                        : "Агуулахын төлбөр нэмэх"}
                    </Button>
                    {/* Action Button: Unlink User */}
                    <Button
                      onClick={async () => {
                        const resident = activeUnitDetails.resident;
                        const isClient = clientsList.some((c) => String(c._id) === String(resident._id));
                        const bId = resident.baiguullagiinId || selectedBarilga?.baiguullagiinId || "";
                        const barId = resident.barilgiinId || selectedBarilga?._id || selectedBarilga?.id || "";

                        if (isClient) {
                          if (actions.handleRemoveClientToot) {
                            await actions.handleRemoveClientToot(resident._id, bId, barId, activeUnitDetails.unit);
                          }
                        } else {
                          if (actions.handleRemoveResidentToot) {
                            await actions.handleRemoveResidentToot(resident._id, bId, barId, activeUnitDetails.unit);
                          }
                        }

                        setSelectedUnit(null);
                        setActiveUnitDetails(null);
                      }}
                      variant="ghost"
                      fullWidth
                      className="border border-red-200 bg-red-50/50 hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:bg-red-950/30 !text-red-600 dark:!text-red-400 rounded-2xl mt-2"
                    >
                      Холбоос салгах
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic text-sm">
                    Энэ тоотод бүртгэлтэй оршин суугч олдсонгүй.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
