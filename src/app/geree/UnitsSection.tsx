"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";

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
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
}: UnitsSectionProps) {
  if (davkharOptions.length === 0) {
    return (
      <div className="p-3 rounded-md border border-amber-300 text-amber-700 text-sm">
        Давхарын тохиргоо хийгдээгүй байна. Эхлээд "Барилгын тохиргоо"
        дээрээс давхар оруулна уу.
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
            Орцын тохиргоо хийгдээгүй байна. "Барилгын тохиргоо" хэсгээс
            Орцын тоог оруулбал энд сонгох боломжтой болно.
          </div>
        )}

        {selectedOrts && (
          <div>
            <div className="table-surface overflow-hidden rounded-2xl w-full">
              <div className="rounded-3xl p-6 neu-table allow-overflow">
                <div
                  className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full"
                  id="units-table"
                >
                  <table className="table-ui text-sm min-w-full border border-[color:var(--surface-border)]">
                    <thead className="z-10 bg-white dark:bg-gray-800">
                      <tr>
                        <th className="p-1 text-sm font-normal text-theme text-center w-12 bg-inherit border-r border-[color:var(--surface-border)]">
                          №
                        </th>
                        <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap bg-inherit border-r border-[color:var(--surface-border)]">
                          Давхар
                        </th>
                        <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap bg-inherit border-r border-[color:var(--surface-border)]">
                          Тоотууд
                        </th>
                        <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap bg-inherit">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFloors.map((floor: string, idx: number) => {
                        const existing =
                          (selectedBarilga?.tokhirgoo &&
                            (selectedBarilga.tokhirgoo as any)
                              .davkhariinToonuud) ||
                          {};
                        const key = composeKey(selectedOrts, floor);
                        const units = existing[key] || [];

                        const activeContractsForFloor = contracts.filter(
                          (c: any) => {
                            const tuluv = c.tuluv || "Идэвхтэй";
                            if (String(tuluv) !== "Идэвхтэй") return false;

                            // Get davkhar and orts from linked resident if available
                            const orshinSuugchId = c.orshinSuugchId;
                            let contractFloor = String(c.davkhar || "").trim();
                            let contractOrts = String(c.orts || "").trim();

                            if (
                              orshinSuugchId &&
                              residentsById[String(orshinSuugchId)]
                            ) {
                              const resident =
                                residentsById[String(orshinSuugchId)];
                              if (resident.davkhar != null) {
                                contractFloor = String(resident.davkhar).trim();
                              }
                              if (resident.orts != null) {
                                contractOrts = String(resident.orts).trim();
                              }
                            }

                            const floorStr = String(floor || "").trim();
                            const matchesFloor = contractFloor === floorStr;

                            if (!matchesFloor) return false;

                            const selectedOrtsStr = String(
                              selectedOrts || "",
                            ).trim();

                            // When Орц = "Бүгд" (empty value), ignore orts entirely.
                            // Otherwise, only match contracts with the selected orts
                            const matchesOrts =
                              !selectedOrtsStr ||
                              contractOrts === "" ||
                              contractOrts === selectedOrtsStr;

                            return matchesOrts;
                          },
                        );
                        const activeToots = new Set(
                          activeContractsForFloor
                            .map((c: any) => {
                              const toot = c.toot;
                              if (toot === null || toot === undefined)
                                return null;
                              return String(toot).trim();
                            })
                            .filter((t): t is string => Boolean(t)),
                          );

                        const filteredUnits = (units as any[]).filter((t: any) => {
                          const unitStr = String(t).trim();
                          const hasActive = activeToots.has(unitStr);

                          if (unitStatusFilter === "occupied") return hasActive;
                          if (unitStatusFilter === "free") return !hasActive;
                          return true;
                        });

                        // If no units match the current filters, skip rendering this floor
                        // But always show the row if no filters are applied (so user can add units)
                        if (unitStatusFilter !== "all" && filteredUnits.length === 0) {
                          return null;
                        }

                        return (
                          <tr
                            key={floor}
                            className="transition-colors border-b last:border-b-0"
                          >
                            <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                              {(unitPage - 1) * unitPageSize + idx + 1}
                            </td>
                            <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                              {floor}-р давхар
                            </td>
                            <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                              <div className="flex flex-wrap gap-2 justify-center">
                                {filteredUnits.length > 0 ? (
                                  filteredUnits.map((t: any) => {
                                    const unitStr = String(t).trim();
                                    const hasActive = activeToots.has(unitStr);

                                    return (
                                      <span
                                        key={String(t)}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${
                                          hasActive
                                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        <span
                                          className={
                                            hasActive
                                              ? "text-green-600 font-normal"
                                              : "text-theme"
                                          }
                                        >
                                          {String(t)}
                                        </span>
                                        {hasActive && (
                                          <span
                                            className="text-green-600 text-[10px] font-normal"
                                            title="Идэвхтэй"
                                          >
                                            ●
                                          </span>
                                        )}
                                        <button
                                          className="ml-1 text-red-500 hover:text-red-600"
                                          aria-label="Устгах"
                                          onClick={() =>
                                            onDeleteUnit(floor, String(t))
                                          }
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-[color:var(--muted-text)] italic">
                                    Тоот бүртгэгдээгүй
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-1 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="p-2 rounded-2xl hover-surface transition-colors"
                                  title="Шинэ тоот нэмэх"
                                  onClick={() => onAddUnit(floor)}
                                >
                                  <Plus className="w-5 h-5 text-blue-500" />
                                </button>
                                <button
                                  className={`p-2 rounded-2xl action-delete hover-surface transition-colors ${
                                    units.length === 0
                                      ? "opacity-20 cursor-not-allowed grayscale"
                                      : ""
                                  }`}
                                  title={
                                    units.length === 0
                                      ? "Устгах тоот байхгүй"
                                      : "Давхрын тоотуудыг устгах"
                                  }
                                  onClick={() =>
                                    units.length > 0 && onDeleteFloor(floor)
                                  }
                                  disabled={units.length === 0}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
