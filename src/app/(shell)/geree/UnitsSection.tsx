"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Info, User, Phone, X, Send, UserX } from "lucide-react";
import { Tooltip } from "antd";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import Button from "@/components/ui/Button";
import QuickRegisterModal from "./modals/QuickRegisterModal";
import SendInvoiceConfirmModal from "./modals/SendInvoiceConfirmModal";
import { ModalPortal } from "../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";

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
    gereeniiId?: string,
    linkedAptToot?: string,
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
  const [checkedUnits, setCheckedUnits] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [zogsoolSearch, setZogsoolSearch] = useState("");

  useEffect(() => {
    setCheckedUnits([]);
    setSelectionMode(false);
  }, [selectedFloor, selectedOrts, propertyTab]);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: async () => { },
  });

  // Keyboard shortcuts for inline modals
  useModalHotkeys({
    isOpen: !!activeUnitDetails,
    onClose: () => setActiveUnitDetails(null),
  });
  useModalHotkeys({
    isOpen: confirmModal.show,
    onClose: () => setConfirmModal((m) => ({ ...m, show: false })),
    onSubmit: confirmModal.show ? () => confirmModal.onConfirm() : undefined,
  });


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

  const handleSendCheckedInvoices = async () => {
    if (!selectedFloor || !selectedFloorData || checkedUnits.length === 0) return;

    const tootsBilled = new Set<string>();
    const dedicatedIds: string[] = [];
    const nestedIds: string[] = [];
    const nestedTootsMap: Record<string, string[]> = {};

    contracts.forEach((c) => {
      const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
      const isCancelled =
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "Идэвхгүй" ||
        status.toLowerCase() === "идэвхгүй";
      if (isCancelled) return;

      const cFloor = String(c?.davkhar || "").trim();
      const cOrts = String(c?.orts || "").trim();
      const cToot = String(c?.toot || "").trim();
      const cTurul = String(c?.turul || "").trim();

      const matchFloor = cFloor === selectedFloor;
      const matchOrts = selectedOrts ? cOrts === selectedOrts : true;
      const matchToot = checkedUnits.includes(cToot);

      // Check primary matching
      let matchPrimary = false;
      if (matchFloor && matchOrts && matchToot) {
        if (propertyTab === "Зогсоол") {
          matchPrimary = cTurul === "Зогсоол" || cTurul === "Гараж";
        } else if (propertyTab === "Агуулах") {
          matchPrimary = cTurul === "Агуулах";
        } else {
          matchPrimary = cTurul !== "Зогсоол" && cTurul !== "Гараж" && cTurul !== "Агуулах";
        }
      }

      if (matchPrimary) {
        tootsBilled.add(cToot);
        dedicatedIds.push(String(c._id));
        return;
      }

      // Check nested matching
      const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
      const resident = orshinSuugchId ? residentsById[String(orshinSuugchId)] : null;
      if (resident && Array.isArray(resident.toots) && resident.toots.length > 0) {
        const hasNestedMatch = resident.toots.some((rt: any) => {
          const rtTurul = String(rt.turul || "Орон сууц").trim();

          let matchesTab = false;
          if (propertyTab === "Зогсоол") {
            matchesTab = rtTurul === "Гараж" || rtTurul === "Зогсоол";
          } else if (propertyTab === "Агуулах") {
            matchesTab = rtTurul === "Агуулах";
          } else {
            matchesTab = rtTurul === "Орон сууц" || rtTurul === "Тоот";
          }
          if (!matchesTab) return false;

          const rOrts = String(rt.orts || "").trim();
          const rFloor = String(rt.davkhar || "").trim();
          const rToots = String(rt.toot || "").split(",").map((x) => x.trim()).filter(Boolean);
          const matchOrtsNested = selectedOrts ? rOrts === selectedOrts : true;
          const matchFloorNested = rFloor === selectedFloor;
          const matchTootsNested = rToots.some((t) => checkedUnits.includes(t));

          if (matchOrtsNested && matchFloorNested && matchTootsNested) {
            rToots.forEach((t) => { if (checkedUnits.includes(t)) tootsBilled.add(t); });
            return true;
          }
          return false;
        });

        if (hasNestedMatch) {
          if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
            const contractId = String(c._id);
            nestedIds.push(contractId);
            // Collect the exact nested toot numbers so handleAddGarageChargesForContracts
            // can bill them directly (they live in resident.toots, not in c.nemeltTootnuud)
            const nestedTurul = propertyTab === "Зогсоол" ? ["Гараж", "Зогсоол"] : ["Агуулах"];
            const matchedToots: string[] = [];
            resident.toots.forEach((rt: any) => {
              if (!nestedTurul.includes(String(rt.turul || "").trim())) return;
              const rFloor = String(rt.davkhar || "").trim();
              if (rFloor !== selectedFloor) return;
              String(rt.toot || "").split(",").map((x: string) => x.trim()).filter(Boolean)
                .forEach((t: string) => { if (checkedUnits.includes(t)) matchedToots.push(t); });
            });
            if (matchedToots.length) nestedTootsMap[contractId] = matchedToots;
          } else {
            dedicatedIds.push(String(c._id));
          }
        }
      }
    });

    const totalCount = dedicatedIds.length + nestedIds.length;
    if (totalCount === 0) {
      alert(`Сонгосон тоотуудад идэвхтэй ${propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
    setConfirmModal({
      show: true,
      title: `Сонгосон тоотуудад ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"}`,
      message: `Сонгосон ${tootsBilled.size} тоотын ${typeLabel} гэрээнүүдэд ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"} үү?`,
      onConfirm: async () => {
        if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
          await actions.handleAddGarageChargesForContracts(
            [...dedicatedIds, ...nestedIds],
            propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах",
            nestedTootsMap
          );
        } else {
          await actions.handleSendInvoices(dedicatedIds, nestedIds, {
            onlyGarage: false,
            onlyStorage: false,
          });
        }
        setCheckedUnits([]);
      }
    });
  };

  const handleSendFloorInvoices = async () => {
    if (!selectedFloor || !selectedFloorData) return;

    const tootsBilled = new Set<string>();
    const dedicatedIds: string[] = [];
    const nestedIds: string[] = [];
    const nestedTootsMap: Record<string, string[]> = {};

    contracts.forEach((c) => {
      const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
      const isCancelled =
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "Идэвхгүй" ||
        status.toLowerCase() === "идэвхгүй";
      if (isCancelled) return;

      const cFloor = String(c?.davkhar || "").trim();
      const cOrts = String(c?.orts || "").trim();
      const cToot = String(c?.toot || "").trim();
      const cTurul = String(c?.turul || "").trim();

      const matchFloor = cFloor === selectedFloor;
      const matchOrts = selectedOrts ? cOrts === selectedOrts : true;
      const matchToot = selectedFloorData.activeToots.has(cToot);

      // Check primary matching
      let matchPrimary = false;
      if (matchFloor && matchOrts && matchToot) {
        if (propertyTab === "Зогсоол") {
          matchPrimary = cTurul === "Зогсоол" || cTurul === "Гараж";
        } else if (propertyTab === "Агуулах") {
          matchPrimary = cTurul === "Агуулах";
        } else {
          matchPrimary = cTurul !== "Зогсоол" && cTurul !== "Гараж" && cTurul !== "Агуулах";
        }
      }

      if (matchPrimary) {
        tootsBilled.add(cToot);
        dedicatedIds.push(String(c._id));
        return;
      }

      // Check nested matching
      const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
      const resident = orshinSuugchId ? residentsById[String(orshinSuugchId)] : null;
      if (resident && Array.isArray(resident.toots) && resident.toots.length > 0) {
        const hasNestedMatch = resident.toots.some((rt: any) => {
          const rtTurul = String(rt.turul || "Орон сууц").trim();

          let matchesTab = false;
          if (propertyTab === "Зогсоол") {
            matchesTab = rtTurul === "Гараж" || rtTurul === "Зогсоол";
          } else if (propertyTab === "Агуулах") {
            matchesTab = rtTurul === "Агуулах";
          } else {
            matchesTab = rtTurul === "Орон сууц" || rtTurul === "Тоот";
          }
          if (!matchesTab) return false;

          const rOrts = String(rt.orts || "").trim();
          const rFloor = String(rt.davkhar || "").trim();
          const rToots = String(rt.toot || "").split(",").map((x) => x.trim()).filter(Boolean);
          const matchOrtsNested = selectedOrts ? rOrts === selectedOrts : true;
          const matchFloorNested = rFloor === selectedFloor;
          const matchTootsNested = rToots.some((t) => selectedFloorData.activeToots.has(t));

          if (matchOrtsNested && matchFloorNested && matchTootsNested) {
            rToots.forEach((t) => { if (selectedFloorData.activeToots.has(t)) tootsBilled.add(t); });
            return true;
          }
          return false;
        });

        if (hasNestedMatch) {
          if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
            const contractId = String(c._id);
            nestedIds.push(contractId);
            const nestedTurul = propertyTab === "Зогсоол" ? ["Гараж", "Зогсоол"] : ["Агуулах"];
            const matchedToots: string[] = [];
            resident.toots.forEach((rt: any) => {
              if (!nestedTurul.includes(String(rt.turul || "").trim())) return;
              if (String(rt.davkhar || "").trim() !== selectedFloor) return;
              String(rt.toot || "").split(",").map((x: string) => x.trim()).filter(Boolean)
                .forEach((t: string) => { if (selectedFloorData.activeToots.has(t)) matchedToots.push(t); });
            });
            if (matchedToots.length) nestedTootsMap[contractId] = matchedToots;
          } else {
            dedicatedIds.push(String(c._id));
          }
        }
      }
    });

    const totalCount = dedicatedIds.length + nestedIds.length;
    if (totalCount === 0) {
      alert(`Энэ давхарт идэвхтэй ${propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
    setConfirmModal({
      show: true,
      title: `Давхарт ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"}`,
      message: `${selectedFloor}-р давхрын бүх ${typeLabel} гэрээнүүдэд (${tootsBilled.size} тоот) ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"} үү?`,
      onConfirm: async () => {
        if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
          await actions.handleAddGarageChargesForContracts(
            [...dedicatedIds, ...nestedIds],
            propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах",
            nestedTootsMap
          );
        } else {
          await actions.handleSendInvoices(dedicatedIds, nestedIds, {
            onlyGarage: false,
            onlyStorage: false,
          });
        }
      }
    });
  };

  const handleSendAllFloorsInvoices = async () => {
    const tootsBilled = new Set<string>();
    const dedicatedIds: string[] = [];
    const nestedIds: string[] = [];

    contracts.forEach((c) => {
      const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
      const isCancelled =
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "Идэвхгүй" ||
        status.toLowerCase() === "идэвхгүй";
      if (isCancelled) return;

      const cTurul = String(c?.turul || "").trim();
      const cToot = String(c?.toot || "").trim();

      // Check primary matching
      let matchPrimary = false;
      if (propertyTab === "Зогсоол") {
        matchPrimary = cTurul === "Зогсоол" || cTurul === "Гараж";
      } else if (propertyTab === "Агуулах") {
        matchPrimary = cTurul === "Агуулах";
      } else {
        matchPrimary = cTurul !== "Зогсоол" && cTurul !== "Гараж" && cTurul !== "Агуулах";
      }

      if (matchPrimary) {
        tootsBilled.add(cToot);
        dedicatedIds.push(String(c._id));
        return;
      }

      // Check nested matching
      const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
      const resident = orshinSuugchId ? residentsById[String(orshinSuugchId)] : null;
      if (resident && Array.isArray(resident.toots) && resident.toots.length > 0) {
        const hasNestedMatch = resident.toots.some((rt: any) => {
          const rtTurul = String(rt.turul || "Орон сууц").trim();

          let matchesTab = false;
          if (propertyTab === "Зогсоол") {
            matchesTab = rtTurul === "Гараж" || rtTurul === "Зогсоол";
          } else if (propertyTab === "Агуулах") {
            matchesTab = rtTurul === "Агуулах";
          } else {
            matchesTab = rtTurul === "Орон сууц" || rtTurul === "Тоот";
          }
          if (!matchesTab) return false;

          const rToots = String(rt.toot || "").split(",").map((x) => x.trim()).filter(Boolean);
          rToots.forEach((t) => tootsBilled.add(t));
          return true;
        });

        if (hasNestedMatch) {
          if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
            nestedIds.push(String(c._id));
          } else {
            dedicatedIds.push(String(c._id));
          }
        }
      }
    });

    const totalCount = dedicatedIds.length + nestedIds.length;
    if (totalCount === 0) {
      alert(`Идэвхтэй ${propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
    setConfirmModal({
      show: true,
      title: `Бүх давхарт ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"}`,
      message: `Бүх давхрын бүх ${typeLabel} гэрээнүүдэд (${tootsBilled.size} тоот) ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"} үү?`,
      onConfirm: async () => {
        if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
          await actions.handleAddGarageChargesForContracts(
            [...dedicatedIds, ...nestedIds],
            propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах"
          );
        } else {
          await actions.handleSendInvoices(dedicatedIds, nestedIds, {
            onlyGarage: false,
            onlyStorage: false,
          });
        }
      }
    });
  };

  const handleSendSingleUnitInvoice = async (resident: any, unit: string) => {
    if (!resident) return;

    const residentId = resident._id;
    const activeContract = contracts.find(c => {
      const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
      if (status === "Цуцалсан" || status === "Идэвхгүй") return false;

      const orshinSuugchId = c?.orshinSuugchId || c?.khariltsagchId;
      if (String(orshinSuugchId) !== String(residentId)) return false;

      // Check if it's the primary contract for this unit
      const cToots = String(c?.toot || "").split(",").map(x => x.trim());
      if (cToots.includes(unit)) return true;

      // Or nested
      const res = residentsById[String(orshinSuugchId)];
      if (res && Array.isArray(res.toots)) {
        return res.toots.some((rt: any) => {
          const rToots = String(rt.toot || "").split(",").map(x => x.trim());
          return rToots.includes(unit);
        });
      }

      return false;
    });

    if (activeContract && actions.handleSendInvoices) {
      const isDedicatedGarageTab =
        (propertyTab === "Зогсоол" || propertyTab === "Агуулах") &&
        (() => {
          const t = String(activeContract?.turul || "").trim().toLowerCase();
          return t === "зогсоол" || t === "гараж" || t === "агуулах";
        })();
      const isNestedGarage = (propertyTab === "Зогсоол" || propertyTab === "Агуулах") && !isDedicatedGarageTab;
      const typeLabel = propertyTab === "Зогсоол" ? "Зогсоол/Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";

      setConfirmModal({
        show: true,
        title: propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "Авлага нэмэх" : "Нэхэмжлэх илгээх",
        message: propertyTab === "Зогсоол" || propertyTab === "Агуулах"
          ? `Тоот ${unit}-ийн ${typeLabel} авлага нэмэх үү?`
          : `Тоот ${unit}-ийн ${typeLabel} гэрээнд нэхэмжлэх илгээх үү?`,
        onConfirm: async () => {
          if (propertyTab === "Зогсоол" || propertyTab === "Агуулах") {
            // Option B: pass the already-resolved contractId directly to skip
            // the ambiguous "find first contract by residentId" lookup inside the action
            const contractId = activeContract?._id ? String(activeContract._id) : undefined;
            await actions.handleAddGarageCharges(
              [resident],
              propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах",
              contractId,
              unit
            );
          } else {
            const dedicated = isNestedGarage ? [] : [String(activeContract._id)];
            const nested = isNestedGarage ? [String(activeContract._id)] : [];
            await actions.handleSendInvoices(dedicated, nested, {
              onlyGarage: false,
              onlyStorage: false,
            });
          }
          setActiveUnitDetails(null);
        }
      });
    } else {
      alert("Энэ тоотод холбоотой идэвхтэй гэрээ олдсонгүй.");
    }
  };

  const zogsoolTableRows = useMemo(() => {
    if (!selectedFloorData) return [];
    const rows = selectedFloorData.filteredUnits.map((unitStr, idx) => {
      const isOccupied = selectedFloorData.activeToots.has(unitStr);
      const resident = selectedFloorData.unitToResident[unitStr];

      let activeContract: any = null;
      if (contracts) {
        const status = (c: any) => {
          const s = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
          return s !== "Цуцалсан" && s !== "Идэвхгүй";
        };

        // Priority 1: dedicated contract whose toot + turul matches this unit
        activeContract = contracts.find((c) => {
          if (!status(c)) return false;
          const cToot = String(c?.toot || "").trim();
          const cTurul = String(c?.turul || "").trim();
          if (cToot !== unitStr) return false;
          if (propertyTab === "Зогсоол") return cTurul === "Зогсоол" || cTurul === "Гараж";
          if (propertyTab === "Агуулах") return cTurul === "Агуулах";
          return cTurul !== "Зогсоол" && cTurul !== "Гараж" && cTurul !== "Агуулах";
        });

        // Priority 2: fallback — any active contract linked to this resident
        if (!activeContract && resident) {
          activeContract = contracts.find((c) => {
            if (!status(c)) return false;
            const cOrshinId = c?.orshinSuugchId || c?.khariltsagchId;
            return String(cOrshinId) === String(resident._id);
          });
        }
      }

      const fullName = resident
        ? [resident.ovog, resident.ner].filter(Boolean).join(" ") || resident.ner || activeContract?.khariutsagchNer || "Нэргүй"
        : "Сул байна";

      let tootStr = "-";
      // Priority 1: Check if this parking/storage slot entry has a gereeniiId or linkedAptToot stored (from Step 3 assignment)
      if (resident && Array.isArray(resident.toots)) {
        const parkingEntry = resident.toots.find(
          (t: any) => String(t.toot).trim() === unitStr && (t.turul === "Гараж" || t.turul === "Зогсоол" || t.turul === "Агуулах")
        );
        if (parkingEntry?.linkedAptToot) {
          tootStr = String(parkingEntry.linkedAptToot).trim();
        } else if (parkingEntry?.gereeniiId && contracts) {
          const targetGId = String(parkingEntry.gereeniiId);
          const linkedContract = contracts.find(
            (c: any) =>
              String(c._id || c.id) === targetGId ||
              String(c.gereeniiDugaar) === targetGId
          );
          if (linkedContract?.toot) {
            tootStr = String(linkedContract.toot).trim();
          }
        }
      }

      // Priority 2: Check activeContract toot if it is an apartment contract
      if (tootStr === "-" && activeContract?.toot && activeContract.turul !== "Гараж" && activeContract.turul !== "Зогсоол" && activeContract.turul !== "Агуулах") {
        tootStr = String(activeContract.toot).trim();
      }

      // Priority 3: Fallback to resident's apartment toots
      if (tootStr === "-" && resident) {
        if (Array.isArray(resident.toots) && resident.toots.length > 0) {
          const aptItem = resident.toots.find(
            (t: any) => String(t.turul || "").trim() === "Орон сууц" || String(t.turul || "").trim() === "Тоот"
          );
          if (aptItem && aptItem.toot) tootStr = String(aptItem.toot).trim();
        }
        if (tootStr === "-" && resident.toot) tootStr = String(resident.toot).trim();
      }

      const phone = resident?.utas || activeContract?.utas || activeContract?.phone || "-";

      const amount = isOccupied
        ? (Number(
            activeContract?.sariinTurees ||
              activeContract?.sariinTulbur ||
              activeContract?.tulburiinDun ||
              activeContract?.dun ||
              resident?.zogsoolTulbur ||
              50000
          ) || 0)
        : 0;

      const isPaid = Boolean(
        activeContract?.tulbarTulogdson ||
          activeContract?.tulburTulogdson ||
          activeContract?.tuluv === "Төлөгдсөн"
      );

      let dateStr = "-";
      const rawDate =
        activeContract?.ekhlekhOgnoo || activeContract?.createdAt || resident?.createdAt;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            dateStr = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(
              d.getDate()
            ).padStart(2, "0")}/${d.getFullYear()}`;
          }
        } catch (e) {}
      }

      return {
        key: unitStr,
        id: unitStr,
        index: idx + 1,
        ognoo: dateStr,
        ner: fullName,
        toot: tootStr,
        dugaar: phone,
        zogsoolDugaar: unitStr,
        tulbur: amount,
        tolsenEsekh: isPaid,
        isOccupied,
        resident,
        activeContract,
      };
    });

    if (!zogsoolSearch.trim()) return rows;
    const q = zogsoolSearch.toLowerCase();
    return rows.filter(
      (r) =>
        r.zogsoolDugaar.toLowerCase().includes(q) ||
        r.ner.toLowerCase().includes(q) ||
        r.toot.toLowerCase().includes(q) ||
        r.dugaar.toLowerCase().includes(q)
    );
  }, [selectedFloorData, contracts, zogsoolSearch]);

  const totalZogsoolAmount = useMemo(() => {
    return zogsoolTableRows.reduce((sum, r) => sum + (r.tulbur || 0), 0);
  }, [zogsoolTableRows]);

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

            {/* Table layout for garage and storage */}
            {selectedFloorData && propertyTab !== "Тоот" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setUnitStatusFilter?.("all")}
                    className={`text-center select-none cursor-pointer rounded-2xl p-4 shadow-xs border transition-all ${
                      unitStatusFilter === "all"
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/50 shadow-md"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Нийт тоот</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
                  </button>

                  <button
                    onClick={() => setUnitStatusFilter?.("free")}
                    className={`text-center select-none cursor-pointer rounded-2xl p-4 shadow-xs border transition-all ${
                      unitStatusFilter === "free"
                        ? "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 ring-2 ring-orange-500/50 shadow-md"
                        : "bg-orange-50/40 dark:bg-orange-950/10 border-orange-100/60 dark:border-orange-900/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <p className="text-xs mb-1 font-semibold text-orange-600 dark:text-orange-400">Чөлөөтэй</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.free}</p>
                  </button>

                  <button
                    onClick={() => setUnitStatusFilter?.("occupied")}
                    className={`text-center select-none cursor-pointer rounded-2xl p-4 shadow-xs border transition-all ${
                      unitStatusFilter === "occupied"
                        ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/50 shadow-md"
                        : "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <p className="text-xs mb-1 font-semibold text-emerald-600 dark:text-emerald-400">Бүртгэлтэй</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.occupied}</p>
                  </button>

                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-4 shadow-xs text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Тухайн давхрын тоотууд</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedFloorData.filteredUnits.length}</p>
                  </div>
                </div>

                {/* Table Component Box */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs p-5 space-y-4">
                  {/* Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {propertyTab === "Зогсоол" ? "Зогсоол давхрын тоотууд" : "Агуулах давхрын тоотууд"}
                      </h3>
                      {selectedFloor && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                          {selectedFloor}-р давхар
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      {/* Search Input: Хайх /зогсоолын дугаар/ */}
                      <div className="relative flex-1 sm:w-64">
                        <input
                          type="text"
                          value={zogsoolSearch}
                          onChange={(e) => setZogsoolSearch(e.target.value)}
                          placeholder={propertyTab === "Зогсоол" ? "Хайх /зогсоолын дугаар/" : "Хайх /агуулахын дугаар/"}
                          className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition shadow-2xs"
                        />
                      </div>

                      <Button
                        onClick={() => onAddUnit(selectedFloor || "")}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="rounded-xl font-semibold cursor-pointer shrink-0"
                      >
                        Бүртгэх
                      </Button>

                      <Button
                        onClick={handleSendCheckedInvoices}
                        variant="primary"
                        size="sm"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        className="rounded-xl font-semibold !bg-emerald-600 hover:!bg-emerald-700 cursor-pointer shrink-0"
                      >
                        Илгээх ({checkedUnits.length})
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                          <th className="p-3 text-center w-10">
                            <input
                              type="checkbox"
                              checked={zogsoolTableRows.length > 0 && checkedUnits.length === zogsoolTableRows.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCheckedUnits(zogsoolTableRows.map((r) => r.id));
                                } else {
                                  setCheckedUnits([]);
                                }
                              }}
                              className="rounded text-emerald-600 cursor-pointer"
                            />
                          </th>
                          <th className="p-3 text-center w-12">№</th>
                          <th className="p-3">Огноо</th>
                          <th className="p-3">Нэр</th>
                          <th className="p-3 text-center">Тоот</th>
                          <th className="p-3">Дугаар</th>
                          <th className="p-3 text-center">{propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах"}</th>
                          <th className="p-3 text-right">Төлбөр</th>
                          <th className="p-3 text-center">Төлсөн эсэх</th>
                          <th className="p-3 text-center">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {zogsoolTableRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                              Бүртгэгдсэн зогсоол байхгүй байна
                            </td>
                          </tr>
                        ) : (
                          zogsoolTableRows.map((row) => {
                            const isChecked = checkedUnits.includes(row.id);
                            return (
                              <tr
                                key={row.id}
                                className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                                  isChecked ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCheckedUnits((prev) => [...prev, row.id]);
                                      } else {
                                        setCheckedUnits((prev) => prev.filter((x) => x !== row.id));
                                      }
                                    }}
                                    className="rounded text-emerald-600 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center font-medium text-slate-500">{row.index}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{row.ognoo}</td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{row.ner}</td>
                                <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">{row.toot}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{row.dugaar}</td>
                                <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.zogsoolDugaar}</td>
                                <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                                  {row.tulbur.toLocaleString("mn-MN", { minimumFractionDigits: 2 })}₮
                                </td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                       !row.isOccupied
                                         ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                         : row.tolsenEsekh
                                           ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                           : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                    }`}
                                  >
                                    {row.isOccupied ? (row.tolsenEsekh ? "Төлсөн" : "Төлөөгүй") : "-"}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {row.isOccupied ? (
                                      <>
                                        <button
                                          onClick={() => handleSendSingleUnitInvoice(row.resident, row.id)}
                                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition cursor-pointer"
                                          title="Нэхэмжлэх/авлага илгээх"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!row.resident) return;
                                            if (!confirm(`Тоот ${row.zogsoolDugaar}-аас ${row.ner}-г хасах уу?`)) return;
                                            await actions.handleUnlinkFromUnit(row.resident, row.id, propertyTab);
                                          }}
                                          className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition cursor-pointer"
                                          title="Холбоос хасах"
                                        >
                                          <UserX className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => setQuickRegister({ unit: row.id, floor: selectedFloor || "" })}
                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer"
                                        title="Бүртгэх"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onDeleteUnit(selectedFloor || "", row.id)}
                                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                                      title="Устгах"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                    <span>Нийт дүн:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base font-extrabold">
                      {totalZogsoolAmount.toLocaleString("mn-MN", { minimumFractionDigits: 2 })}₮
                    </span>
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
        contracts={contracts}
        onAssign={async (personId, type, gereeniiId, linkedAptToot) => {
          if (!quickRegister) return false;
          const { unit, floor } = quickRegister;
          return await onAssignToUnit(personId, type, selectedOrts, floor, unit, propertyTab, gereeniiId, linkedAptToot);
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
                        await handleSendSingleUnitInvoice(activeUnitDetails.resident, activeUnitDetails.unit);
                      }}
                      variant="secondary"
                      fullWidth
                      className="!bg-orange-500 hover:!bg-orange-600 !text-white rounded-2xl shadow-md shadow-orange-500/10 font-semibold"
                    >
                      {propertyTab === "Зогсоол"
                        ? "Зогсоолын нэхэмжлэх илгээх"
                        : "Агуулахын нэхэмжлэх илгээх"}
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
                            await actions.handleRemoveClientToot(resident._id, bId, barId, activeUnitDetails.unit, propertyTab);
                          }
                        } else {
                          if (actions.handleRemoveResidentToot) {
                            await actions.handleRemoveResidentToot(resident._id, bId, barId, activeUnitDetails.unit, propertyTab);
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
      <SendInvoiceConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
