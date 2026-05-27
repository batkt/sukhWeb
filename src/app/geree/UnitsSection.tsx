"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Info, User, Phone } from "lucide-react";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import Button from "@/components/ui/Button";
import QuickRegisterModal from "./modals/QuickRegisterModal";

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

  const stats = useMemo(() => {
    const total = floorData.reduce((sum, f) => sum + f.units.length, 0);
    const occupied = floorData.reduce((sum, f) => sum + f.activeToots.size, 0);
    const free = total - occupied;
    return { total, occupied, free };
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
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Нийт тоот
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {stats.total}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-4 shadow-sm text-center">
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                      Чөлөөтэй
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.free}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4 shadow-sm text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                      Бүртгэлтэй
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.occupied}
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-4 shadow-sm text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                      Сонгосон давхар
                    </p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {selectedFloorData.units.length}
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
                              return (
                                <button
                                  key={unitStr}
                                  onClick={() => {
                                    if (!isOccupied) {
                                      setQuickRegister({ unit: unitStr, floor: selectedFloor || "" });
                                    } else {
                                      setSelectedUnit(isSelected ? null : unitStr);
                                    }
                                  }}
                                  className={`relative flex items-center justify-center w-14 h-10 text-sm font-bold transition-all duration-150 shadow-sm rounded-2xl
                                    ${
                                      isOccupied
                                        ? isSelected
                                          ? "bg-emerald-500 text-white ring-2 ring-emerald-300 scale-105"
                                          : "bg-emerald-400 text-white hover:bg-emerald-500"
                                        : isSelected
                                          ? "bg-orange-500 text-white ring-2 ring-orange-300 scale-105"
                                          : "bg-orange-400 text-white hover:bg-orange-500 hover:scale-105"
                                    }`}
                                  title={isOccupied ? "Бүртгэлтэй" : "Бүртгүүлэх"}
                                >
                                  {unitStr}
                                </button>
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
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                          Давхар
                        </span>
                        <div className="w-32">
                          <TusgaiZagvar
                            value={selectedFloor || ""}
                            onChange={(val) => setSelectedFloor(val)}
                            options={floorData.map((f) => ({ value: f.floor, label: f.floor }))}
                            placeholder="Давхар сонгох"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Нийт тоот
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {selectedFloorData.units.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
                        <span className="text-sm text-orange-600 dark:text-orange-400">
                          Чөлөөтэй
                        </span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {selectedFloorData.units.length -
                            selectedFloorData.activeToots.size}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
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
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                selectedFloorData.activeToots.has(selectedUnit)
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
                            return (
                              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
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
                              </div>
                            );
                          })()}

                          <button
                            onClick={() => {
                              onDeleteUnit(selectedFloor || "", selectedUnit);
                              setSelectedUnit(null);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors border border-red-100 dark:border-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                            Устгах
                          </button>
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
      />
    </div>
  );
}
