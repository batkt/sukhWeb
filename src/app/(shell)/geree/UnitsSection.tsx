"use client";

import React, { useMemo, useState, useEffect } from "react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { ShuultuurTolgoi } from "@/components/ui/table/ShuultuurTolgoi";
import { Plus, Trash2, Info, User, Phone, X, Send, UserX } from "lucide-react";
import { Tooltip } from "antd";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { UnitsTable, FloorItem } from "./UnitsTable";
import { StandardPagination } from "@/components/ui/StandardTable";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import QuickRegisterModal from "./modals/QuickRegisterModal";
import SendInvoiceConfirmModal from "./modals/SendInvoiceConfirmModal";
import InfoModal from "./modals/InfoModal";
import DeleteConfirmModal from "./modals/DeleteModal";
import { ModalPortal } from "../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { isGarageFloor } from "@/lib/useGereeData";
import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import uilchilgee from "@/lib/uilchilgee";
import { useSWRConfig } from "swr";
import ZogsoolAguulakhExcel from "./ZogsoolAguulakhExcel";

interface UnitsSectionProps {
  davkharOptions: string[];
  ortsOptions: string[];
  selectedOrts: string;
  setSelectedOrts: (orts: string) => void;
  /** Давхрын шүүлт — хүснэгтийн толгойноос */
  selectedDawkhar?: string;
  setSelectedDawkhar?: (d: string) => void;
  selectedBarilga: any;
  contracts: any[];
  residentsById: Record<string, any>;
  currentFloors: string[];
  floorsList: string[];
  /** Гаражийн давхрууд (B1, B2…) — «Тоот» таб дээр нэмэлт мөр болж харагдана. */
  garageFloorsList?: string[];
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
  onAddUnit: (floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
  onDeleteUnit: (floor: string, unit: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
  onDeleteFloor: (floor: string, turul?: "Тоот" | "Зогсоол" | "Агуулах") => void;
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

/** Эрэмбэ: тоо агуулсан мөрийг (10 < 101, B1 < B2) натурал дарааллаар. */
const tooEremb = (a: any, b: any) =>
  String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });

const cleanFloor = (f: any) =>
  String(f || "")
    .replace(/\s*давхар\s*/gi, "")
    .replace(/^[вВ]/, "B")
    .trim()
    .toUpperCase();

export default function UnitsSection({
  davkharOptions,
  ortsOptions,
  selectedOrts,
  setSelectedOrts,
  selectedDawkhar = "",
  setSelectedDawkhar,
  selectedBarilga,
  contracts,
  residentsById,
  currentFloors,
  floorsList,
  garageFloorsList = [],
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
  // `turul` — «Тоот» таб дээрх гаражийн жагсаалтаас бүртгэхэд табаас биш мөрөөс.
  const [quickRegister, setQuickRegister] = useState<{ unit: string; floor: string; turul?: "Тоот" | "Зогсоол" | "Агуулах" } | null>(null);
  const [activeUnitDetails, setActiveUnitDetails] = useState<{ unit: string; floor: string; resident: any } | null>(null);
  const [checkedUnits, setCheckedUnits] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [residentTypeFilter, setResidentTypeFilter] = useState<"all" | "client" | "resident">("all");
  const { searchTerm: zogsoolSearch } = useSearch();

  const { token, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBid = selectedBuildingId || (selectedBarilga?._id ? String(selectedBarilga._id) : undefined);

  // Fetch avlaga records to check if garage charges / invoices were added for this month
  const { data: avlaguudData } = useSWR(
    token && baiguullaga?._id && (propertyTab === "Зогсоол" || propertyTab === "Агуулах")
      ? ["/guilgeeAvlaguud", token, effectiveBid || baiguullaga._id]
      : null,
    async () => {
      try {
        if (!baiguullaga?._id) return [];
        const resp = await uilchilgee(token || undefined).get("/guilgeeAvlaguud", {
          params: {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: effectiveBid || undefined,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 2000,
          },
        });
        return resp.data?.data || resp.data?.jagsaalt || resp.data || [];
      } catch {
        return [];
      }
    },
    { revalidateOnFocus: true, dedupingInterval: 3000 }
  );

  // Гараж/агуулах бүрийн нэхэмжилсэн дүн, төлсөн, үлдэгдэл, төлөв (backend тооцоо)
  const { data: zogsoolTuluvData } = useSWR(
    token && baiguullaga?._id && (propertyTab === "Зогсоол" || propertyTab === "Агуулах")
      ? ["/zogsoolAguulakhTuluv", token, effectiveBid || baiguullaga._id, propertyTab]
      : null,
    async () => {
      try {
        if (!baiguullaga?._id) return [];
        const resp = await uilchilgee(token || undefined).post("/zogsoolAguulakhTuluv", {
          baiguullagiinId: baiguullaga._id,
          barilgiinId: effectiveBid || undefined,
          turul: propertyTab === "Агуулах" ? "Агуулах" : "Зогсоол",
        });
        return Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt : [];
      } catch {
        return [];
      }
    },
    { revalidateOnFocus: true, dedupingInterval: 3000 }
  );

  // Fetch invoice history records to check if invoices were sent this month
  const { data: nekhemjlekhData } = useSWR(
    token && baiguullaga?._id && (propertyTab === "Зогсоол" || propertyTab === "Агуулах")
      ? ["/nekhemjlekhiinTuukh", token, effectiveBid || baiguullaga._id]
      : null,
    async () => {
      try {
        if (!baiguullaga?._id) return [];
        const resp = await uilchilgee(token || undefined).get("/nekhemjlekhiinTuukh", {
          params: {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: effectiveBid || undefined,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 2000,
          },
        });
        return resp.data?.jagsaalt || resp.data || [];
      } catch {
        return [];
      }
    },
    { revalidateOnFocus: true, dedupingInterval: 3000 }
  );




  useEffect(() => {
    setCheckedUnits([]);
    setSelectionMode(false);
  }, [selectedFloor, selectedOrts, propertyTab]);
  // Холбогдсон тоотыг устгах — холбоосыг салгаад устгахыг нэг алхамд санал болгоно
  const [holbootoiUstgakh, setHolbootoiUstgakh] = useState<{
    floor: string;
    unit: string;
    ner: string;
    resident: any;
  } | null>(null);
  const holbootoiUstgakhBatlakh = async () => {
    if (!holbootoiUstgakh) return;
    const { floor, unit, ner, resident } = holbootoiUstgakh;
    // Нэг үйлдэл, нэг мэдэгдэл: эхлээд эзэмшигчээс салгаж (чимээгүй), дараа нь
    // дугаарыг устгана. Өмнө нь салгахад "амжилттай", устгахад хуучин гэрээний
    // жагсаалтаар "идэвхтэй гэрээ байна" гэж зөрүүтэй хоёр мэдэгдэл гардаг байв.
    const salgasan = await actions.handleUnlinkFromUnit(resident, unit, propertyTab, { chimeegui: true, davkhar: floor });
    if (salgasan && actions.deleteUnit) {
      // Амжилтгүй бол deleteUnit өөрөө шалтгааныг харуулна.
      await actions.deleteUnit(floor, unit, propertyTab, {
        gereeShalgakhgui: true,
        amjiltiinMsg: `${unit} дугаарыг ${ner || "эзэмшигч"}-ээс салгаж устгалаа`,
      });
    }
    setHolbootoiUstgakh(null);
  };

  // Холбоос салгах — шууд салгахгүй, юу болохыг тайлбарлаж батлуулна.
  const [salgakhAsuult, setSalgakhAsuult] = useState<{
    floor: string;
    unit: string;
    ner: string;
    resident: any;
    tolsen: boolean;
    nekhemjlekhIlgeesen: boolean;
    turul?: "Тоот" | "Зогсоол" | "Агуулах";
  } | null>(null);
  const salgakhBatlakh = async () => {
    if (!salgakhAsuult) return;
    const { resident, unit, floor } = salgakhAsuult;
    await actions.handleUnlinkFromUnit(resident, unit, salgakhAsuult.turul || propertyTab, { davkhar: floor });
    setSalgakhAsuult(null);
  };

  const [deleteUnitsConfirm, setDeleteUnitsConfirm] = useState<{
    show: boolean;
    units: string[];
    title: string;
    message: string;
  }>({
    show: false,
    units: [],
    title: "",
    message: "",
  });

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

  const [infoModal, setInfoModal] = useState<{ show: boolean; title: string; message: string }>({
    show: false, title: "", message: "",
  });
  const showInfo = (title: string, message: string) => setInfoModal({ show: true, title, message });

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

    /** Нэг (орц, давхар, төрөл)-ийн мөрийг бодно. */
    const murBodokh = (orts: string, floor: string, turul: "Тоот" | "Зогсоол" | "Агуулах") => {

        const key = composeKey(orts, floor);
        const units = getTootOptions(orts, floor, turul);
        /** Тухайн давхарт БОДИТООР байгаа тоотууд — O(1) шалгалтад. */
        const unitsSet = new Set(units.map((u) => String(u).trim()));

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
            if (turul === "Зогсоол") {
              if (cTurul !== "Зогсоол" && cTurul !== "Гараж") return;
            } else if (turul === "Агуулах") {
              if (cTurul !== "Агуулах") return;
            } else {
              // "Тоот" tab
              if (cTurul === "Зогсоол" || cTurul === "Гараж" || cTurul === "Агуулах") return;
            }
          }

          if (
            resident &&
            Array.isArray(resident.toots) &&
            resident.toots.length > 0
          ) {
            resident.toots.forEach((rt: any) => {
              const rtTurul = String(rt.turul || "Орон сууц").trim();
              if (turul === "Зогсоол") {
                if (rtTurul !== "Гараж" && rtTurul !== "Зогсоол") return;
              } else if (turul === "Агуулах") {
                if (rtTurul !== "Агуулах") return;
              } else {
                // "Тоот" tab
                if (rtTurul !== "Орон сууц" && rtTurul !== "Тоот") return;
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

          const cleanFloor = (f: any) =>
            String(f || "")
              .replace(/\s*давхар\s*/gi, "")
              .replace(/^[вВ]/, "B")
              .trim()
              .toUpperCase();

          // Add to activeToots if they match the current orts and floor
          tootsList.forEach((tItem) => {
            if (!tItem.t) return;

            const isBasementProperty = turul === "Зогсоол" || turul === "Агуулах";
            const cItemFloor = cleanFloor(tItem.f);
            const cCurFloor = cleanFloor(floor);

            const matchOrts = isBasementProperty || tItem.o === orts || !tItem.o;
            const matchFloor =
              cItemFloor === cCurFloor ||
              !tItem.f ||
              (isBasementProperty && !cItemFloor.startsWith("B"));
            if (!matchOrts || !matchFloor) return;

            const toot = String(tItem.t).trim();
            if (!unitsSet.has(toot)) return;

            activeToots.add(toot);
            if (!unitToResident[toot] && resident) {
              unitToResident[toot] = resident;
            }
          });
        });

        const cleanFloor = (f: any) =>
          String(f || "")
            .replace(/\s*давхар\s*/gi, "")
            .replace(/^[вВ]/, "B")
            .trim()
            .toUpperCase();

        // Also ensure all units directly in residentsList and clientsList are included in activeToots and unitToResident
        const allPersons = [...(residentsList || []), ...(clientsList || [])];
        allPersons.forEach((p: any) => {
          if (Array.isArray(p.toots) && p.toots.length > 0) {
            p.toots.forEach((rt: any) => {
              const rtTurul = String(rt.turul || "Орон сууц").trim();
              if (turul === "Зогсоол") {
                if (rtTurul !== "Гараж" && rtTurul !== "Зогсоол") return;
              } else if (turul === "Агуулах") {
                if (rtTurul !== "Агуулах") return;
              } else {
                if (rtTurul !== "Орон сууц" && rtTurul !== "Тоот") return;
              }

              const isBasementProperty = turul === "Зогсоол" || turul === "Агуулах";
              const rOrts = String(rt.orts || "1").trim();
              const cRFloor = cleanFloor(rt.davkhar);
              const cCurFloor = cleanFloor(floor);

              const matchOrts = isBasementProperty || !rOrts || rOrts === orts;
              const matchFloor =
                cRFloor === cCurFloor ||
                !rt.davkhar ||
                (isBasementProperty && !cRFloor.startsWith("B"));
              if (!matchOrts || !matchFloor) return;

              const rToots = String(rt.toot || "")
                .split(",")
                .map((x: string) => x.trim())
                .filter(Boolean);
              rToots.forEach((toot) => {
                if (unitsSet.has(toot)) {
                  activeToots.add(toot);
                  if (!unitToResident[toot]) {
                    unitToResident[toot] = p;
                  }
                }
              });
            });
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
          turul,
          orts,
          floor,
          units,
          filteredUnits,
          activeToots,
          unitToResident,
        });
    };

    const effectiveFloors =
      propertyTab === "Зогсоол"
        ? floorsList.filter((f) => isGarageFloor(f))
        : floorsList;

    targetOrtsList.forEach((orts) => {
      effectiveFloors.forEach((floor) => murBodokh(orts, floor, propertyTab));
    });

    // «Тоот» таб: барилгын тохиргооны гаражийн давхрууд (B1, B2…) давхар бүр НЭГ
    // мөр болж «+»-ээр гаражийн дугаар нэмэгдэнэ (дугаар хоосон ч харагдана).
    const garajiinMuruud: FloorItem[] = [];
    if (propertyTab === "Тоот" && garageFloorsList.length > 0) {
      const garajiinOrts = selectedOrts ? [selectedOrts] : ortsOptions;
      garageFloorsList.forEach((floor) => {
        const ekhlel = allFloorData.length;
        garajiinOrts.forEach((orts) => murBodokh(orts, floor, "Зогсоол"));
        const shine = allFloorData.splice(ekhlel);
        // Орц бүрээр давтагдахгүй — дугаартай эхнийхийг, эсвэл эхний хоосныг авна.
        const songolt = shine.find((m) => m.units.length > 0) || shine[0];
        if (songolt) garajiinMuruud.push(songolt);
      });
    }

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

    garajiinMuruud.sort((x, y) =>
      String(x.floor).localeCompare(String(y.floor), undefined, { numeric: true }),
    );
    return [...allFloorData, ...garajiinMuruud];
  }, [
    floorsList,
    garageFloorsList,
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
    const relevantFloorData =
      propertyTab === "Зогсоол"
        ? floorData.filter((f) => isGarageFloor(f.floor))
        : floorData;
    const uniqueFloors = Array.from(new Set(relevantFloorData.map((f) => f.floor)));

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
  }, [floorData, propertyTab]);

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

    const relevantFloorData =
      propertyTab === "Зогсоол"
        ? floorData.filter((f) => isGarageFloor(f.floor))
        : floorData;

    relevantFloorData.forEach((f) => {
      total += f.units.length;
      occupied += f.activeToots.size;
    });

    return {
      total,
      occupied,
      free: total - occupied,
    };
  }, [floorData, propertyTab]);

  const handleSendCheckedInvoices = async () => {
    if (!selectedFloor || !selectedFloorData || checkedUnits.length === 0) return;

    // Filter out units that already have an invoice/charge sent this month
    const alreadySentUnits = checkedUnits.filter((u) => {
      const row = zogsoolTableRows.find((r: any) => String(r.id) === String(u));
      return row?.enesSardIlgeesen === true;
    });
    const eligibleUnits = checkedUnits.filter((u) => {
      const row = zogsoolTableRows.find((r: any) => String(r.id) === String(u));
      return !row?.enesSardIlgeesen;
    });

    if (eligibleUnits.length === 0) {
      showInfo("Боломжгүй", `Сонгосон бүх тоотод (${alreadySentUnits.join(", ")}) энэ сарын нэхэмжлэх/авлага хэдийн илгээгдсэн байна.`);
      return;
    }

    const tootsBilled = new Set<string>();
    const dedicatedIds: string[] = [];
    const nestedIds: string[] = [];
    const nestedTootsMap: Record<string, string[]> = {};
    // Only process eligible (not-yet-sent) units
    const effectiveCheckedUnits = eligibleUnits;

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
      const matchToot = effectiveCheckedUnits.includes(cToot);

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

          const isBasementTab = propertyTab === "Зогсоол" || propertyTab === "Агуулах";
          const rOrts = String(rt.orts || "").trim();
          const rFloor = String(rt.davkhar || "").trim();
          const rToots = String(rt.toot || "").split(",").map((x) => x.trim()).filter(Boolean);
          const matchOrtsNested = isBasementTab || (selectedOrts ? rOrts === selectedOrts : true);
          const matchFloorNested =
            cleanFloor(rFloor) === cleanFloor(selectedFloor) ||
            (isBasementTab && !cleanFloor(rFloor).startsWith("B"));
          const matchTootsNested = rToots.some((t) => effectiveCheckedUnits.includes(t));

          if (matchOrtsNested && matchFloorNested && matchTootsNested) {
            rToots.forEach((t) => { if (effectiveCheckedUnits.includes(t)) tootsBilled.add(t); });
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
              const rFloorClean = cleanFloor(rt.davkhar);
              const selFloorClean = cleanFloor(selectedFloor);
              if (rFloorClean !== selFloorClean && rFloorClean.startsWith("B")) return;
              String(rt.toot || "").split(",").map((x: string) => x.trim()).filter(Boolean)
                .forEach((t: string) => { if (effectiveCheckedUnits.includes(t)) matchedToots.push(t); });
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
      showInfo("Гэрээ олдсонгүй", `Сонгосон тоотуудад идэвхтэй ${propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
    setConfirmModal({
      show: true,
      title: `Сонгосон тоотуудад ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"}`,
      message: `${tootsBilled.size} тоотын ${typeLabel} гэрээнүүдэд ${propertyTab === "Зогсоол" || propertyTab === "Агуулах" ? "авлага нэмэх" : "нэхэмжлэх илгээх"} үү?${
        alreadySentUnits.length > 0 ? ` (${alreadySentUnits.length} тоот хэдийн илгээгдсэн тул алгасна)` : ""
      }`,
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
        swrMutate(
          (k: any) => Array.isArray(k) && (k[0] === "/guilgeeAvlaguud" || k[0] === "/nekhemjlekhiinTuukh"),
          undefined,
          { revalidate: true }
        );
      }
    });
  };

  const handleOpenMassDeleteModal = () => {
    if (!selectedFloor || checkedUnits.length === 0) return;

    const occupiedList = checkedUnits.filter((u) =>
      selectedFloorData?.activeToots.has(u),
    );
    const freeList = checkedUnits.filter(
      (u) => !selectedFloorData?.activeToots.has(u),
    );

    if (freeList.length === 0) {
      openErrorOverlay(
        `Сонгосон бүх (${occupiedList.length}) тоот дээр оршин суугч холбогдсон байна. Холбогдсон тоотыг жагсаалтын устгах товчоор нэг бүрчлэн салгаад устгана уу.`,
      );
      return;
    }

    const typeLabel =
      propertyTab === "Зогсоол"
        ? "гаражийн дугаарыг"
        : propertyTab === "Агуулах"
          ? "агуулахын дугаарыг"
          : "тоотыг";

    let title = "";
    let message = "";

    if (occupiedList.length > 0) {
      title = `Сонгосон ${freeList.length} ${typeLabel} устгах уу?`;
      message = `Сонгосон ${checkedUnits.length}-аас ${selectedFloor ? `${selectedFloor} давхрын ` : ""}${occupiedList.join(", ")} нь идэвхтэй холбогдсон тул алгасна. Зөвхөн чөлөөтэй ${freeList.length}-г устгана. Холбогдсоныг жагсаалтын устгах товчоор нэг бүрчлэн салгаад устгана уу. Энэ үйлдэл буцаах боломжгүй.`;
    } else {
      title = `Сонгосон ${freeList.length} ${typeLabel} устгах уу?`;
      message = `Та сонгосон ${freeList.length} ${typeLabel} устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.`;
    }

    setDeleteUnitsConfirm({
      show: true,
      units: freeList,
      title,
      message,
    });
  };

  // Эзэмшигчээс салгагдсан ч идэвхтэй үлдсэн гэрээтэй дугаар — «цуцлаад устгах уу?»
  const [tsutslakhAsuult, setTsutslakhAsuult] = useState<{
    floor: string;
    units: string[];
    gereenuud: { toot: string; gereeniiId: string; ezen: string; dugaar?: string }[];
  } | null>(null);

  const handleConfirmMassDelete = async () => {
    if (!selectedFloor || deleteUnitsConfirm.units.length === 0) return;
    try {
      if (actions?.deleteUnits) {
        // Гэрээний үндсэн тоот бол «цуцлаад устгах уу?» гэж асууна; зөвхөн нэмэлт
        // тоотод үлдсэн (салгасан) бичлэгийг устгаад гэрээнээс нь хасна.
        const ok = await actions.deleteUnits(
          selectedFloor,
          deleteUnitsConfirm.units,
          propertyTab,
          { tsutslakhAsuukh: true },
        );
        if (ok && typeof ok === "object" && "tsutslakh" in ok) {
          setTsutslakhAsuult({ floor: selectedFloor, units: deleteUnitsConfirm.units, gereenuud: ok.tsutslakh });
        } else if (ok) {
          setCheckedUnits([]);
        }
      }
    } finally {
      setDeleteUnitsConfirm({ show: false, units: [], title: "", message: "" });
    }
  };

  const { mutate: swrMutate } = useSWRConfig();
  const tsutslaadUstgakh = async () => {
    if (!tsutslakhAsuult || !actions?.deleteUnits) return;
    const { floor, units, gereenuud } = tsutslakhAsuult;
    try {
      const r = await uilchilgee(token || undefined).post("/gereeTsutslakh", {
        baiguullagiinId: baiguullaga?._id,
        gereeniiIdnuud: Array.from(new Set(gereenuud.map((g) => g.gereeniiId))),
        shaltgaan: `${propertyTab === "Зогсоол" ? "Гараж" : "Агуулах"} ${floor} давхрын ${Array.from(new Set(gereenuud.map((g) => g.toot))).join(", ")} дугаар устгасан`,
      });
      const tsutslagdsan: string[] = r?.data?.tsutslagdsan || [];
      // Гэрээний жагсаалт (Гүйлгээний түүх, Гэрээ хуудас) шинэчлэгдэнэ.
      swrMutate((k: any) => Array.isArray(k) && typeof k[0] === "string" && k[0].startsWith("/geree"), undefined, { revalidate: true });
      const uldegdeltei: { gereeniiId: string; uldegdel: number }[] = r?.data?.uldegdeltei || [];
      const ok = await actions.deleteUnits(floor, units, propertyTab, {
        tootsokhguiGereenuud: gereenuud.map((g) => g.gereeniiId),
      });
      if (ok) {
        setCheckedUnits([]);
        if (uldegdeltei.length > 0) {
          const niit = uldegdeltei.reduce((s, u) => s + (Number(u.uldegdel) || 0), 0);
          openSuccessOverlay(
            `${tsutslagdsan.length} гэрээ цуцлагдлаа. ${uldegdeltei.length} гэрээний ${Math.round(niit).toLocaleString("mn-MN")}₮ үлдэгдэл Гүйлгээний түүхийн «Цуцалсан гэрээний авлага»-д шилжлээ.`,
          );
        }
      }
    } catch (err: any) {
      openErrorOverlay(err?.response?.data?.message || err?.message || "Гэрээ цуцлахад алдаа гарлаа");
    } finally {
      setTsutslakhAsuult(null);
    }
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

          const isBasementTab = propertyTab === "Зогсоол" || propertyTab === "Агуулах";
          const rOrts = String(rt.orts || "").trim();
          const rFloor = String(rt.davkhar || "").trim();
          const rToots = String(rt.toot || "").split(",").map((x) => x.trim()).filter(Boolean);
          const matchOrtsNested = isBasementTab || (selectedOrts ? rOrts === selectedOrts : true);
          const matchFloorNested =
            cleanFloor(rFloor) === cleanFloor(selectedFloor) ||
            (isBasementTab && !cleanFloor(rFloor).startsWith("B"));
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
              const rFloorClean = cleanFloor(rt.davkhar);
              const selFloorClean = cleanFloor(selectedFloor);
              if (rFloorClean !== selFloorClean && rFloorClean.startsWith("B")) return;
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
      showInfo("Гэрээ олдсонгүй", `Энэ давхарт идэвхтэй ${propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
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
      showInfo("Гэрээ олдсонгүй", `Идэвхтэй ${propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот"} гэрээ олдсонгүй.`);
      return;
    }

    const typeLabel = propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";
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

  const handleSendSingleUnitInvoice = async (resident: any, unit: string, isAlreadySent?: boolean) => {
    if (!resident) return;
    if (isAlreadySent) {
      showInfo("Боломжгүй", "Энэ сарын нэхэмжлэх/авлага хэдийн илгээгдсэн байна.");
      return;
    }

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
      const typeLabel = propertyTab === "Зогсоол" ? "Гараж" : propertyTab === "Агуулах" ? "Агуулах" : "Орон сууц/Тоот";

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
            // Backend: энэ сарын гараж/агуулахын нэхэмжлэхийг ЖИНХЭНЭЭР үүсгэнэ (сард нэг удаа)
            const isKhariltsagch = !!activeContract?.khariltsagchId && !activeContract?.orshinSuugchId;
            const ur = await actions.zogsoolNekhemjlekhIlgeeye({
              turul: propertyTab === "Зогсоол" ? "Зогсоол" : "Агуулах",
              toot: unit,
              gereeniiId: contractId,
              ...(isKhariltsagch
                ? { khariltsagchId: String(resident._id) }
                : { orshinSuugchId: String(resident._id) }),
            });
            if (ur.success && !ur.alreadyExists) {
              showInfo(
                "Нэхэмжлэх илгээгдлээ",
                `Тоот ${unit}: ${Number(ur.dun || 0).toLocaleString("mn-MN")}₮-ийн ${typeLabel.toLowerCase()} нэхэмжлэх илгээгдлээ.`,
              );
            } else if (ur.success) {
              showInfo("Илгээгдсэн", ur.message || "Энэ сарын нэхэмжлэх хэдийн илгээгдсэн байна.");
            } else {
              showInfo("Илгээгдсэнгүй", ur.message || "Нэхэмжлэх илгээхэд алдаа гарлаа.");
            }
          } else {
            const dedicated = isNestedGarage ? [] : [String(activeContract._id)];
            const nested = isNestedGarage ? [String(activeContract._id)] : [];
            await actions.handleSendInvoices(dedicated, nested, {
              onlyGarage: false,
              onlyStorage: false,
            });
          }
          setActiveUnitDetails(null);
          swrMutate(
            (k: any) =>
              Array.isArray(k) &&
              (k[0] === "/guilgeeAvlaguud" || k[0] === "/nekhemjlekhiinTuukh" || k[0] === "/zogsoolAguulakhTuluv"),
            undefined,
            { revalidate: true }
          );
        }
      });
    } else {
      showInfo("Гэрээ олдсонгүй", "Энэ тоотод холбоотой идэвхтэй гэрээ олдсонгүй.");
    }
  };

  const zogsoolTableRows = useMemo(() => {
    if (!selectedFloorData) return [];
    let rows = selectedFloorData.filteredUnits.map((unitStr, idx) => {
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
      let ortsStr = "-";
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
          if (linkedContract?.orts) {
            ortsStr = String(linkedContract.orts).trim();
          }
        }
      }

      // Priority 2: Check activeContract toot if it is an apartment contract
      if (tootStr === "-" && activeContract?.toot && activeContract.turul !== "Гараж" && activeContract.turul !== "Зогсоол" && activeContract.turul !== "Агуулах") {
        tootStr = String(activeContract.toot).trim();
      }
      if (ortsStr === "-" && activeContract?.orts && activeContract.turul !== "Гараж" && activeContract.turul !== "Зогсоол" && activeContract.turul !== "Агуулах") {
        ortsStr = String(activeContract.orts).trim();
      }

      // Priority 3: Fallback to resident's apartment toots
      if (tootStr === "-" && resident) {
        if (Array.isArray(resident.toots) && resident.toots.length > 0) {
          const aptItem = resident.toots.find(
            (t: any) => String(t.turul || "").trim() === "Орон сууц" || String(t.turul || "").trim() === "Тоот"
          );
          if (aptItem && aptItem.toot) {
            tootStr = String(aptItem.toot).trim();
            if (aptItem.orts) ortsStr = String(aptItem.orts).trim();
          }
        }
        if (tootStr === "-" && resident.toot) tootStr = String(resident.toot).trim();
      }

      // If tootStr is known, find matching apartment in resident.toots for its entrance
      if (ortsStr === "-" && tootStr !== "-" && resident && Array.isArray(resident.toots)) {
        const matchedApt = resident.toots.find(
          (t: any) => String(t.toot).trim() === tootStr && (t.turul === "Орон сууц" || t.turul === "Тоот" || !t.turul)
        );
        if (matchedApt?.orts) {
          ortsStr = String(matchedApt.orts).trim();
        }
      }

      // Priority 4: Fallback to any apartment toot with orts in resident.toots
      if (ortsStr === "-" && resident) {
        if (Array.isArray(resident.toots) && resident.toots.length > 0) {
          const aptItem = resident.toots.find(
            (t: any) => (String(t.turul || "").trim() === "Орон сууц" || String(t.turul || "").trim() === "Тоот") && t.orts
          );
          if (aptItem && aptItem.orts) ortsStr = String(aptItem.orts).trim();
        }
        if (ortsStr === "-" && resident.orts) ortsStr = String(resident.orts).trim();
      }

      // Priority 5: Look up contracts matching tootStr
      if (ortsStr === "-" && tootStr !== "-" && contracts) {
        const cMatch = contracts.find((c: any) => {
          const status = String(c?.tuluv || c?.status || "Идэвхтэй").trim();
          if (status === "Цуцалсан" || status === "Идэвхгүй") return false;
          return String(c.toot || "").trim() === tootStr && c.orts;
        });
        if (cMatch?.orts) {
          ortsStr = String(cMatch.orts).trim();
        }
      }

      // Priority 6: Fallback to parking entry's own orts
      if (ortsStr === "-" && resident && Array.isArray(resident.toots)) {
        const parkingEntry = resident.toots.find(
          (t: any) => String(t.toot).trim() === unitStr && (t.turul === "Гараж" || t.turul === "Зогсоол" || t.turul === "Агуулах")
        );
        if (parkingEntry?.orts) {
          ortsStr = String(parkingEntry.orts).trim();
        }
      }

      // Priority 7: Fallback to activeContract?.orts
      if (ortsStr === "-" && activeContract?.orts) {
        ortsStr = String(activeContract.orts).trim();
      }

      const phone = resident?.utas || activeContract?.utas || activeContract?.phone || "-";

      const amount = isOccupied
        ? (Number(
          activeContract?.sariinTurees ||
          activeContract?.sariinTulbur ||
          activeContract?.tulburiinDun ||
          activeContract?.dun ||
          resident?.zogsoolTulbur ||
          0
        ) || 0)
        : 0;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const isSameMonth = (dRaw: any) => {
        if (!dRaw) return false;
        const d = new Date(dRaw);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      };

      const contractIsPaid = Boolean(
        activeContract?.tulbarTulogdson ||
        activeContract?.tulburTulogdson ||
        activeContract?.tuluv === "Төлөгдсөн"
      );

      // Backend-ийн тооцоолсон төлөв (POST /zogsoolAguulakhTuluv): гэрээ + гаражийн
      // дугаараар, олдохгүй бол зөвхөн дугаараар (гараж орон сууцны гэрээнд багтсан үед).
      const contractIdStr = activeContract?._id ? String(activeContract._id) : "";
      const tuluvJagsaalt: any[] = Array.isArray(zogsoolTuluvData) ? zogsoolTuluvData : [];
      const tuluvMur = isOccupied
        ? tuluvJagsaalt.find((t: any) => String(t.toot) === unitStr && contractIdStr && String(t.gereeniiId) === contractIdStr) ||
          tuluvJagsaalt.find((t: any) => String(t.toot) === unitStr)
        : null;

      // Нэхэмжлэх БОДИТООР үүссэн үед л «Илгээсэн» (өмнө нь орон сууцны нэхэмжлэх,
      // хэзээ ч бичигддэггүй гэрээний флагаас таамагладаг байв).
      const isInvoiceSent = !!tuluvMur?.nekhemjlekhIlgeesenEsekh;
      const nekhemjilsenDun = Number(tuluvMur?.nekhemjilsenDun || 0);
      const tulsunDun = Number(tuluvMur?.tulsunDun || 0);
      const uldegdel = Number(tuluvMur?.uldegdel || 0);
      const tuluvText: string = !isOccupied
        ? ""
        : tuluvMur?.tuluv || "Нэхэмжлээгүй";
      // Хэсэгчлэн төлсөн ч авлага бүрэн хаагдвал «Төлөгдсөн»
      const isPaid = isOccupied && isInvoiceSent && tuluvText === "Төлөгдсөн";
      const suuliinOgnoo = tuluvMur?.suuliinNekhemjlekh?.ognoo || null;
      const enesSardIlgeesen = isSameMonth(suuliinOgnoo);
      void amount;
      void contractIsPaid;

      let dateStr = "-";
      const rawDate =
        activeContract?.ekhlekhOgnoo || activeContract?.createdAt || resident?.createdAt;
      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
              d.getDate()
            ).padStart(2, "0")}`;
          }
        } catch (e) { }
      }

      return {
        key: unitStr,
        id: unitStr,
        index: idx + 1,
        ognoo: dateStr,
        ner: fullName,
        orts: ortsStr,
        toot: tootStr,
        dugaar: phone,
        zogsoolDugaar: unitStr,
        tulbur: uldegdel,
        nekhemjilsenDun,
        tulsunDun,
        tuluvText,
        suuliinOgnoo,
        enesSardIlgeesen,
        isInvoiceSent,
        tolsenEsekh: isPaid,
        isOccupied,
        resident,
        activeContract,
      };
    });

    // Бүртгэлтэй (идэвхтэй) дугаарууд эхэнд, дотроо дугаарын дарааллаар; № дахин дугаарлана.
    rows.sort(
      (x: any, y: any) =>
        Number(y.isOccupied) - Number(x.isOccupied) ||
        String(x.zogsoolDugaar).localeCompare(String(y.zogsoolDugaar), undefined, { numeric: true }),
    );
    rows.forEach((r: any, i: number) => (r.index = i + 1));
    
    // Resident type filter
    if (residentTypeFilter === "client") {
      rows = rows.filter((r) => r.isOccupied && r.resident && clientsList.some((c: any) => String(c._id) === String(r.resident._id)));
    } else if (residentTypeFilter === "resident") {
      rows = rows.filter((r) => r.isOccupied && r.resident && !clientsList.some((c: any) => String(c._id) === String(r.resident._id)));
    }

    if (!zogsoolSearch.trim()) return rows;
    const q = zogsoolSearch.toLowerCase();
    return rows.filter(
      (r) =>
        r.zogsoolDugaar.toLowerCase().includes(q) ||
        r.ner.toLowerCase().includes(q) ||
        r.toot.toLowerCase().includes(q) ||
        (r.orts && r.orts.toLowerCase().includes(q)) ||
        r.dugaar.toLowerCase().includes(q) ||
        (r.isInvoiceSent ? "илгээгдсэн" : "илгээгдээгүй").includes(q)
    );
  }, [selectedFloorData, contracts, zogsoolSearch, avlaguudData, nekhemjlekhData, propertyTab, residentTypeFilter, clientsList]);

  const totalZogsoolAmount = useMemo(() => {
    return zogsoolTableRows.reduce((sum, r) => sum + (r.tulbur || 0), 0);
  }, [zogsoolTableRows]);

  // Зогсоол/агуулахын хүснэгтийн багана.
  const zogsoolColumns: ColumnsType<any> = useMemo(
    () => [
      { title: "№", dataIndex: "index", key: "index", width: 48, align: "center" },
      
      {
        title: "Эзэмшигч",
        dataIndex: "ner",
        key: "ner",
        width: 100,
        render: (v: any, row: any) => (
          <span className={row.isOccupied ? "" : "text-[color:var(--muted-text)]"}>{v}</span>
        ),
      },
      {
        title: propertyTab === "Агуулах" ? "Агуулах" : "Гараж",
        dataIndex: "zogsoolDugaar",
        key: "zogsoolDugaar",
        sorter: (x: any, y: any) => tooEremb(x.zogsoolDugaar, y.zogsoolDugaar),
        width: 90,
        align: "center",
        render: (v: any) => (
          <span className="inline-flex h-6 min-w-[36px] items-center justify-center rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2 font-semibold text-[color:var(--panel-text)]">
            {v}
          </span>
        ),
      },
      {
        // Эзэмшигчийн байрны тоот
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        sorter: (x: any, y: any) => tooEremb(x.toot === "-" ? "" : x.toot, y.toot === "-" ? "" : y.toot),
        width: 120,
        align: "center",
        render: (v: any, row: any) =>
          v && v !== "-" ? (
            <span className="whitespace-nowrap text-[color:var(--panel-text)]">
              {row.orts && row.orts !== "-" ? (
                <span className="text-[color:var(--muted-text)]">{row.orts} орц · </span>
              ) : null}
              <span className="font-medium">{v}</span>
            </span>
          ) : (
            <span className="text-[color:var(--muted-text)]">—</span>
          ),
      },
      {
        title: "Утас",
        dataIndex: "dugaar",
        key: "dugaar",
        width: 110,
        align: "center",
        render: (v: any) => <span className="text-center">{v || "-"}</span>,
      },
      {
        title: "Нэхэмжилсэн",
        dataIndex: "nekhemjilsenDun",
        key: "nekhemjilsenDun",
        sorter: (x: any, y: any) => (Number(x.nekhemjilsenDun) || 0) - (Number(y.nekhemjilsenDun) || 0),
        width: 120,
        align: "right",
        render: (v: number, row: any) =>
          !row.isOccupied || !row.isInvoiceSent ? (
            <span className="text-[color:var(--muted-text)]">—</span>
          ) : (
            <span
              title={
                row.suuliinOgnoo
                  ? `Сүүлийн нэхэмжлэх: ${new Date(row.suuliinOgnoo).toLocaleDateString("mn-MN")}`
                  : undefined
              }
            >
              {Number(v || 0).toLocaleString("mn-MN", { minimumFractionDigits: 2 })}₮
            </span>
          ),
      },
      {
        title: "Үлдэгдэл",
        dataIndex: "tulbur",
        key: "tulbur",
        sorter: (x: any, y: any) => (Number(x.tulbur) || 0) - (Number(y.tulbur) || 0),
        width: 110,
        align: "right",
        render: (v: number) => (
          <span>
            {Number(v || 0).toLocaleString("mn-MN", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        title: "Нэхэмжлэх",
        key: "isInvoiceSent",
        // Чөлөөтэй < илгээгээгүй < илгээсэн
        sorter: (x: any, y: any) =>
          (x.isOccupied ? (x.isInvoiceSent ? 2 : 1) : 0) - (y.isOccupied ? (y.isInvoiceSent ? 2 : 1) : 0),
        width: 116,
        align: "center",
        render: (_: any, row: any) =>
          !row.isOccupied ? (
            <span className="text-[color:var(--muted-text)]">—</span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] ${
                row.isInvoiceSent ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${row.isInvoiceSent ? "bg-success" : "bg-warning"}`} />
              {row.isInvoiceSent ? "Илгээсэн" : "Илгээгээгүй"}
            </span>
          ),
      },
      {
        title: setUnitStatusFilter ? (
          <ShuultuurTolgoi
            label="Төлөв"
            current={unitStatusFilter || "all"}
            options={[
              { label: "Бүгд", value: "all" },
              { label: "Бүртгэлтэй", value: "occupied" },
              { label: "Чөлөөтэй", value: "free" },
            ]}
            onSelect={(v) => setUnitStatusFilter(v as "all" | "occupied" | "free")}
          />
        ) : (
          "Төлөв"
        ),
        key: "tolsenEsekh",
        // Чөлөөтэй < төлөөгүй < төлсөн
        sorter: (x: any, y: any) =>
          (x.isOccupied ? (x.tolsenEsekh ? 2 : 1) : 0) - (y.isOccupied ? (y.tolsenEsekh ? 2 : 1) : 0),
        width: 150,
        align: "center",
        render: (_: any, row: any) =>
          !row.isOccupied ? (
            <span className="text-[color:var(--muted-text)]">Чөлөөтэй</span>
          ) : (
            (() => {
              // Төлөгдсөн / Хэсэгчлэн төлсөн / Төлөөгүй / Нэхэмжлээгүй
              const t = String(row.tuluvText || (row.tolsenEsekh ? "Төлөгдсөн" : "Төлөөгүй"));
              const cls =
                t === "Төлөгдсөн"
                  ? ["bg-success/10 text-success", "bg-success"]
                  : t === "Хэсэгчлэн төлсөн"
                    ? ["bg-warning/10 text-warning", "bg-warning"]
                    : t === "Нэхэмжлээгүй"
                      ? ["bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]", "bg-[color:var(--muted-text)]"]
                      : ["bg-danger/10 text-danger", "bg-danger"];
              return (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] ${cls[0]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cls[1]}`} />
                  {t}
                </span>
              );
            })()
          ),
      },
      {
        title: "Огноо",
        dataIndex: "ognoo",
        key: "ognoo",
        width: 92,
        align: "center",
        render: (v: any) => (
          <span className="whitespace-nowrap text-[12px] tabular-nums text-[color:var(--muted-text)]">{v || "-"}</span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, row: any) => {
          // Товч бүр ижил хэмжээтэй (28px); мөр бүрт устгах товч нэг баганад
          // байхаар 2 + 1 байрлалтай тор ашиглана.
          const iconBtn =
            "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme/60";
          // Мөр бүр ЯГ 2 ижил хэмжээтэй дүрс товчтой — багана хэзээ ч шүд
          // шиг зигзаг болохгүй. Зүүн: гол үйлдэл (илгээх / бүртгэх), баруун:
          // хасах үйлдэл (салгах / устгах). Холбогдсон дугаарт хогийн сав
          // харагдахгүй — эхлээд салгасны дараа устгана.
          return (
            <div className="flex items-center justify-center gap-1.5">
              {row.isOccupied ? (
                <button
                  type="button"
                  // Зөвхөн ЭНЭ САРЫН нэхэмжлэх илгээгдсэн бол хаана — дараа сард дахин илгээж болно
                  disabled={!!row.enesSardIlgeesen}
                  onClick={(e) => {
                    if (row.enesSardIlgeesen) { e.preventDefault(); e.stopPropagation(); return; }
                    handleSendSingleUnitInvoice(row.resident, row.id, false);
                  }}
                  className={`${iconBtn} ${
                    row.enesSardIlgeesen
                      ? "opacity-30 pointer-events-none text-[color:var(--muted-text)]"
                      : "text-brand hover:border-theme/30 hover:bg-theme/10"
                  }`}
                  title={
                    row.enesSardIlgeesen
                      ? "Энэ сарын нэхэмжлэх хэдийн илгээгдсэн байна"
                      : "Нэхэмжлэх илгээх"
                  }
                  aria-label="Нэхэмжлэх илгээх"
                  aria-disabled={!!row.enesSardIlgeesen}
                >
                  <Send className="h-[15px] w-[15px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickRegister({ unit: row.id, floor: selectedFloor || "" })}
                  className={`${iconBtn} text-brand hover:border-theme/30 hover:bg-theme/10`}
                  title="Эзэмшигч бүртгэх"
                  aria-label="Эзэмшигч бүртгэх"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {row.isOccupied ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!row.resident) return;
                    setSalgakhAsuult({
                      floor: selectedFloor || "",
                      unit: row.id,
                      ner: row.ner || "Эзэмшигч",
                      resident: row.resident,
                      tolsen: !!row.tolsenEsekh,
                      nekhemjlekhIlgeesen: !!row.isInvoiceSent,
                    });
                  }}
                  className={`${iconBtn} text-warning hover:border-warning/30 hover:bg-warning/10`}
                  title={`${row.ner || "Эзэмшигч"}-г салгах — салгасны дараа дугаарыг устгах боломжтой`}
                  aria-label="Холбоос салгах"
                >
                  <UserX className="h-[15px] w-[15px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDeleteUnit(selectedFloor || "", row.id)}
                  className={`${iconBtn} text-[color:var(--muted-text)] hover:border-danger/30 hover:bg-danger/10 hover:text-danger`}
                  title="Дугаарыг устгах"
                  aria-label="Устгах"
                >
                  <Trash2 className="h-[15px] w-[15px]" />
                </button>
              )}
            </div>
          );
        },
      },
    ],

    [propertyTab, selectedFloor, unitStatusFilter, setUnitStatusFilter],
  );

  if (davkharOptions.length === 0) {
    return (
      <div className="p-3 rounded-md border border-warning/30 text-warning text-sm">
        Давхарын тохиргоо хийгдээгүй байна. Эхлээд "Барилгын тохиргоо" дээрээс
        давхар оруулна уу.
      </div>
    );
  }

  // «Тоот» таб: орон сууцны давхрууд хүснэгтэд, гаражууд доор жагсаалтаар.
  const bairniiMuruud = floorData.filter((f) => f.turul !== "Зогсоол");

  // Хүснэгтийн толгойн шүүлтүүрүүд (дээд талын Орц/Давхар/Төлөв сонгуурын оронд).
  const tuluvSongolt = [
    { label: "Бүгд", value: "all" },
    { label: "Бүртгэлтэй", value: "occupied" },
    { label: "Чөлөөтэй", value: "free" },
  ];
  const ortsShuultuur =
    ortsOptions.length > 1
      ? {
          current: selectedOrts || "all",
          options: [{ label: "Бүгд", value: "all" }, ...ortsOptions.map((o) => ({ label: `${o}-р орц`, value: String(o) }))],
          onSelect: (v: string) => {
            setSelectedOrts(v === "all" ? "" : v);
            setUnitPage(1);
          },
        }
      : undefined;
  const davkharShuultuur =
    setSelectedDawkhar && davkharOptions.length > 0
      ? {
          current: selectedDawkhar || "all",
          options: [
            { label: "Бүгд", value: "all" },
            ...davkharOptions.map((d) => ({
              label: /^b/i.test(String(d)) ? `${d} давхар` : `${d}-р давхар`,
              value: String(d),
            })),
          ],
          onSelect: (v: string) => {
            setSelectedDawkhar(v === "all" ? "" : v);
            setUnitPage(1);
          },
        }
      : undefined;
  const tuluvShuultuur = setUnitStatusFilter
    ? {
        current: unitStatusFilter || "all",
        options: tuluvSongolt,
        onSelect: (v: string) => setUnitStatusFilter(v as "all" | "occupied" | "free"),
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        {isSavingUnits && (
          <div className="text-xs text-[color:var(--muted-text)]">Хадгалж байна…</div>
        )}
      </div>

      <div className="space-y-4">
        {ortsOptions.length === 0 && (
          <div className="p-3 rounded-2xl border border-theme/30 text-brand text-sm">
            Орцын тохиргоо хийгдээгүй байна. "Барилгын тохиргоо" хэсгээс Орцын
            тоог оруулбал энд сонгох боломжтой болно.
          </div>
        )}

        {selectedOrts !== undefined && (
          <>
            {propertyTab === "Тоот" && (
              <div className="w-full">
                <div className="min-w-0 space-y-4">

                {(() => {
                  // Group floorData by orts
                  const ortsGroups: Record<string, typeof floorData> = {};
                  for (const item of bairniiMuruud) {
                    const key = item.orts || "";
                    if (!ortsGroups[key]) ortsGroups[key] = [];
                    ortsGroups[key].push(item);
                  }
                  // Гаражийн давхрууд (B1, B2…): орц нэг бол ижил хүснэгтийн доод
                  // талд, олон орцтой бол тусдаа «Гараж» бүлэгт.
                  const garajDavkhruud = floorData.filter((f) => f.turul === "Зогсоол");
                  if (garajDavkhruud.length > 0) {
                    const bairniiTulkhuur = Object.keys(ortsGroups);
                    if (bairniiTulkhuur.length <= 1) {
                      const k = bairniiTulkhuur[0] ?? "";
                      ortsGroups[k] = [...(ortsGroups[k] || []), ...garajDavkhruud];
                    } else {
                      ortsGroups["__garaj"] = garajDavkhruud;
                    }
                  }

                  const groupKeys = Object.keys(ortsGroups).sort((a, b) => {
                    if (a === "__garaj") return 1;
                    if (b === "__garaj") return -1;
                    const aNum = parseInt(a);
                    const bNum = parseInt(b);
                    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                    return a.localeCompare(b);
                  });

                  const hasMultipleOrts = groupKeys.length > 1;

                  // Хуудаслалт нь БҮХ орцын мөрийг нийлүүлж тоолдог
                  // («Нийт 30 мөр») тул зүсэлтийг ч нийлмэл жагсаалт дээр
                  // хийнэ. Орц тус бүрийг ИЖИЛ цонхоор зүсэх нь нэг хуудсанд
                  // pageSize × орц мөр гаргаад, сүүлийн хуудсуудыг хоосон
                  // үлдээж, нийт тоотойгоо зөрдөг байв.
                  const khuudasniiMuruud = new Set(
                    bairniiMuruud.slice(
                      (unitPage - 1) * unitPageSize,
                      unitPage * unitPageSize,
                    ),
                  );

                  return groupKeys.map((ortsKey) => {
                    const groupItems = ortsGroups[ortsKey];
                    // Гаражийн давхрын мөр хуудаслалтад орохгүй — хуудас бүрийн доор.
                    const paginatedItems = groupItems.filter(
                      (f) => f.turul === "Зогсоол" || khuudasniiMuruud.has(f),
                    );

                    // Энэ хуудсанд тухайн орцоос мөр огт байхгүй бол хоосон
                    // хүснэгт харуулах нь зөвхөн чимээ шуугиан.
                    if (hasMultipleOrts && paginatedItems.length === 0)
                      return null;

                    return (
                      <div key={ortsKey} className="w-full">
                        {hasMultipleOrts && (
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme/10 border border-theme/30">
                              <span className="text-sm font-medium text-brand">
                                {ortsKey === "__garaj" ? "Гараж" : ortsKey ? `${ortsKey}-р орц` : "Орцгүй"}
                              </span>
                              <span className="text-xs text-brand font-medium">
                                ({groupItems.reduce((s, f) => s + f.units.length, 0)} {ortsKey === "__garaj" ? "дугаар" : "тоот"},{" "}
                                {groupItems.reduce((s, f) => s + f.activeToots.size, 0)} бүртгэлтэй)
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-theme/10" />
                          </div>
                        )}
                        <div className="allow-overflow no-scrollbar" id={`units-table-orts-${ortsKey}`}>
                          <UnitsTable
                            data={paginatedItems}
                            actions={actions}
                            loading={isSavingUnits}
                            page={unitPage}
                            pageSize={unitPageSize}
                            onAddUnit={onAddUnit}
                            onDeleteUnit={onDeleteUnit}
                            onDeleteFloor={onDeleteFloor}
                            sortKey={sortKey}
                            sortOrder={sortOrder}
                            propertyTab={propertyTab}
                            selectedFloor={selectedFloor}
                            onSelectFloor={setSelectedFloor}
                            bugdiigKharuulakh={hasMultipleOrts}
                            ortsShuultuur={ortsShuultuur}
                            davkharShuultuur={davkharShuultuur}
                            tuluvShuultuur={tuluvShuultuur}
                            chipiinKhyazgaar={12}

                          />
                        </div>
                      </div>
                    );
                  });
                })()}
                <div id="units-pagination">
                  <StandardPagination
                    current={unitPage}
                    total={bairniiMuruud.length}
                    pageSize={unitPageSize}
                    onChange={setUnitPage}
                    onPageSizeChange={(v) => {
                      setUnitPageSize(v);
                      setUnitPage(1);
                    }}
                  />
                </div>
                </div>

              </div>
            )}

            {/* Гараж / Агуулах: ижил хүснэгт (№ | Гараж | Эзэмшигч | Тоот | Утас | Төлбөр | Нэхэмжлэх | Төлөв | Огноо | Үйлдэл) */}
            {selectedFloorData && propertyTab !== "Тоот" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                {/* ── Дашбоард: дарахад жагсаалтыг шүүнэ (Гэрээ хуудастай ижил загвар) ── */}
                {(() => {
                  const ezlegdsenKhuvi = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
                  const ilgeegeegui = zogsoolTableRows.filter((r: any) => r.isOccupied && !r.isInvoiceSent).length;
                  const nekhemjlegdsenDun = zogsoolTableRows
                    .filter((r: any) => r.isOccupied && r.isInvoiceSent)
                    // Нэхэмжилсэн дүн (өмнө нь үлдэгдлийг нэмдэг байв)
                    .reduce((sum: number, r: any) => sum + (Number(r.nekhemjilsenDun) || 0), 0);
                  const negjNer = propertyTab === "Зогсоол" ? "гараж" : "агуулах";
                  const kartuud: {
                    key: "all" | "occupied" | "free" | null;
                    ner: string;
                    utga: string;
                    tailbar: React.ReactNode;
                    unguClass: string;
                  }[] = [
                    {
                      key: "all",
                      ner: `Нийт ${negjNer}`,
                      utga: stats.total.toLocaleString("mn-MN"),
                      tailbar: `${selectedFloor ? `${selectedFloor} давхарт ${selectedFloorData.filteredUnits.length}` : "Бүх давхар"}`,
                      unguClass: "text-[color:var(--panel-text)]",
                    },
                    {
                      key: "occupied",
                      ner: "Бүртгэлтэй",
                      utga: stats.occupied.toLocaleString("mn-MN"),
                      tailbar: (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
                            <span className="block h-full rounded-full bg-success" style={{ width: `${ezlegdsenKhuvi}%` }} />
                          </span>
                          {ezlegdsenKhuvi}% эзлэгдсэн
                        </span>
                      ),
                      unguClass: "text-success",
                    },
                    {
                      key: "free",
                      ner: "Чөлөөтэй",
                      utga: stats.free.toLocaleString("mn-MN"),
                      tailbar: "Эзэмшигч бүртгэх боломжтой",
                      unguClass: "text-warning",
                    },
                    ];
                  const clientCount = zogsoolTableRows.filter((r: any) => r.isOccupied && r.resident && clientsList.some((c: any) => String(c._id) === String(r.resident._id))).length;
                  const residentCount = zogsoolTableRows.filter((r: any) => r.isOccupied && r.resident && !clientsList.some((c: any) => String(c._id) === String(r.resident._id))).length;

                  const allKartuud: {
                    key: string;
                    ner: string;
                    utga: string;
                    unguClass: string;
                    onClick?: () => void;
                    active?: boolean;
                    clickable: boolean;
                  }[] = [
                    {
                      key: "all",
                      ner: `Нийт ${negjNer}`,
                      utga: stats.total.toLocaleString("mn-MN"),
                      unguClass: "text-[color:var(--panel-text)]",
                      active: (unitStatusFilter || "all") === "all",
                      onClick: () => { setUnitStatusFilter?.("all"); setResidentTypeFilter("all"); },
                      clickable: true,
                    },
                    {
                      key: "occupied",
                      ner: "Бүртгэлтэй",
                      utga: stats.occupied.toLocaleString("mn-MN"),
                      unguClass: "text-success",
                      active: (unitStatusFilter || "all") === "occupied",
                      onClick: () => setUnitStatusFilter?.("occupied"),
                      clickable: true,
                    },
                    {
                      key: "free",
                      ner: "Чөлөөтэй",
                      utga: stats.free.toLocaleString("mn-MN"),
                      unguClass: "text-warning",
                      active: (unitStatusFilter || "all") === "free",
                      onClick: () => setUnitStatusFilter?.("free"),
                      clickable: true,
                    },
                    {
                      key: "client",
                      ner: "Харилцагч",
                      utga: clientCount.toLocaleString("mn-MN"),
                      unguClass: "text-info",
                      active: residentTypeFilter === "client",
                      onClick: () => { setResidentTypeFilter(residentTypeFilter === "client" ? "all" : "client"); setUnitStatusFilter?.("all"); },
                      clickable: true,
                    },
                    {
                      key: "resident",
                      ner: "Оршин суугч",
                      utga: residentCount.toLocaleString("mn-MN"),
                      unguClass: "text-success",
                      active: residentTypeFilter === "resident",
                      onClick: () => { setResidentTypeFilter(residentTypeFilter === "resident" ? "all" : "resident"); setUnitStatusFilter?.("all"); },
                      clickable: true,
                    },
                  ];

                  return (
                    <div className="stat-cards-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="tablist" aria-label="Төлөв">
                      {allKartuud.map((k) => (
                        <button
                          key={k.key}
                          type="button"
                          role="tab"
                          aria-selected={k.active}
                          onClick={k.onClick}
                          className={`relative rounded-2xl neu-panel text-left transition-all select-none cursor-pointer ${
                            k.active ? "ring-2 ring-theme shadow-lg" : "hover:bg-[color:var(--surface-hover)]"
                          }`}
                        >
                          <div className="stat-card">
                            <div className={`stat-card-value tabular-nums ${k.unguClass}`}>{k.utga}</div>
                            <div className="stat-card-title">{k.ner}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* ── Хүснэгтийн хэрэгслийн мөр: давхар сонгох + үйлдлүүд ── */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      {/* «Гараж — B1 давхар ▾»: давхрыг dropdown-оор солино (тусдаа Давхар багана байхгүй). */}
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-medium text-[color:var(--panel-text)]">
                          {propertyTab === "Зогсоол" ? "Гараж" : "Агуулах"} —
                        </h3>
                        {uniqueSortedFloorOptions.length > 0 ? (
                          <div className="tusgai-wrapper w-[130px]">
                            <TusgaiZagvar
                              value={selectedFloor || ""}
                              onChange={(v: string) => setSelectedFloor(v)}
                              options={uniqueSortedFloorOptions.map((opt) => ({
                                value: opt.value,
                                label: /^b/i.test(String(opt.label)) ? `${opt.label} давхар` : `${opt.label}-р давхар`,
                              }))}
                              placeholder="Давхар"
                              className="w-full h-full"
                            />
                          </div>
                        ) : (
                          <span className="text-[13px] text-[color:var(--muted-text)]">давхар тохируулаагүй</span>
                        )}
                        {selectedFloor && (
                          <button
                            type="button"
                            onClick={() => onDeleteFloor?.(selectedFloor)}
                            title={`${selectedFloor} давхрын бүх ${propertyTab === "Зогсоол" ? "гараж" : "агуулах"}ийг устгах`}
                            aria-label="Давхрыг устгах"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[color:var(--muted-text)] transition hover:bg-danger/10 hover:text-danger cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {checkedUnits.length > 0 && (
                        <Button
                          onClick={handleOpenMassDeleteModal}
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          className="rounded-xl cursor-pointer shrink-0 !bg-danger hover:!bg-danger/90 !text-white !border-danger"
                        >
                          Устгах ({checkedUnits.length})
                        </Button>
                      )}
                      <ZogsoolAguulakhExcel turul={propertyTab} />
                      <Button
                        onClick={handleSendCheckedInvoices}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        className="rounded-xl cursor-pointer shrink-0"
                        disabled={checkedUnits.length === 0}
                        title={checkedUnits.length === 0 ? "Мөр сонгож нэхэмжлэх илгээнэ" : undefined}
                      >
                        Нэхэмжлэх илгээх{checkedUnits.length > 0 ? ` (${checkedUnits.length})` : ""}
                      </Button>
                      <Button
                        onClick={() => onAddUnit(selectedFloor || "")}
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="rounded-xl !bg-theme hover:!bg-theme cursor-pointer shrink-0"
                      >
                        Тоот
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <Table<any>
                    columns={zogsoolColumns}
                    dataSource={zogsoolTableRows}
                    // Багана бүр тогтсон өргөнтэй — нэг багана (ж: Төлбөр) илүү зай эзлэхгүй.
                    fitContent
                    rowKey={(row) => row.id}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    rowSelection={{
                      selectedRowKeys: checkedUnits,
                      onChange: (keys) => setCheckedUnits(keys as string[]),
                    }}
                    locale={{
                      emptyText:
                        propertyTab === "Зогсоол"
                          ? "Бүртгэгдсэн зогсоол байхгүй байна"
                          : "Бүртгэгдсэн агуулах байхгүй байна",
                    }}
                  />

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
        propertyTab={quickRegister?.turul || propertyTab}
        residentsList={residentsList}
        clientsList={clientsList}
        contracts={contracts}
        onAssign={async (personId, type, gereeniiId, linkedAptToot) => {
          if (!quickRegister) return false;
          const { unit, floor } = quickRegister;
          return await onAssignToUnit(personId, type, selectedOrts, floor, unit, quickRegister.turul || propertyTab, gereeniiId, linkedAptToot);
        }}
        onRegisterNewOrshinSuugch={() => {
          if (!quickRegister) return;
          const { unit, floor } = quickRegister;
          const tab = quickRegister.turul || propertyTab;
          const unitTurul =
            tab === "Зогсоол"
              ? "Гараж"
              : tab === "Агуулах"
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
          const tab = quickRegister.turul || propertyTab;
          const unitTurul =
            tab === "Зогсоол"
              ? "Гараж"
              : tab === "Агуулах"
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
            <div className="relative z-10 w-full max-w-md mx-4 bg-[color:var(--surface-bg)] rounded-3xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[color:var(--surface-border)]">
                <div>
                  <p className="text-[11px] text-[color:var(--muted-text)] mb-0.5">
                    {propertyTab} холбоос
                  </p>
                  <h2 className="text-base text-[color:var(--panel-text)] flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-warning/10 text-warning text-sm">
                      {activeUnitDetails.floor}-р давхар
                    </span>
                    <span className="text-[color:var(--muted-text)] font-light">/</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] text-sm">
                      {activeUnitDetails.unit}-р тоот
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setActiveUnitDetails(null)}
                  className="p-2 rounded-xl hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-4">
                {activeUnitDetails.resident ? (
                  <div className="space-y-4">
                    {/* Resident Info Card */}
                    <div className="p-4 bg-[color:var(--surface-hover)] rounded-2xl border border-[color:var(--surface-border)] space-y-3">
                      <p className="text-xs text-[color:var(--muted-text)] ">
                        Бүртгэлтэй оршин суугч
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[color:var(--panel-text)] truncate">
                            {[activeUnitDetails.resident.ovog, activeUnitDetails.resident.ner]
                              .filter(Boolean)
                              .join(" ") ||
                              activeUnitDetails.resident.ner ||
                              "Нэргүй"}
                          </p>
                          {activeUnitDetails.resident.utas && (
                            <p className="text-xs text-[color:var(--muted-text)] mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {activeUnitDetails.resident.utas}
                            </p>
                          )}
                          {activeUnitDetails.resident.toot && (
                            <div className="text-[11px] text-[color:var(--muted-text)] mt-2 flex items-center gap-1 bg-[color:var(--surface-hover)] px-2.5 py-1 rounded-xl w-fit border border-[color:var(--surface-border)] font-medium">
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
                    {(() => {
                      const detailRow = zogsoolTableRows.find((r: any) => String(r.id) === String(activeUnitDetails.unit));
                      const alreadySent = detailRow?.enesSardIlgeesen ?? false;
                      return (
                        <div className="space-y-1">
                          <Button
                            disabled={alreadySent}
                            onClick={async () => {
                              await handleSendSingleUnitInvoice(activeUnitDetails.resident, activeUnitDetails.unit, alreadySent);
                            }}
                            variant="secondary"
                            fullWidth
                            className={`rounded-2xl shadow-md ${
                              alreadySent
                                ? "!bg-[color:var(--surface-hover)] !text-[color:var(--muted-text)] opacity-50 cursor-not-allowed shadow-none"
                                : "!bg-warning hover:!bg-warning !text-white shadow-warning/10"
                            }`}
                          >
                            {propertyTab === "Зогсоол"
                              ? "Гаражийн нэхэмжлэх илгээх"
                              : "Агуулахын нэхэмжлэх илгээх"}
                          </Button>
                          {alreadySent && (
                            <p className="text-center text-[11px] text-[color:var(--muted-text)]">
                              ✓ Энэ сарын нэхэмжлэх хэдийн илгээгдсэн байна
                            </p>
                          )}
                        </div>
                      );
                    })()}
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
                      className="border border-danger/30 bg-danger/50 hover:bg-danger/80 !text-danger dark:!text-danger rounded-2xl mt-2"
                    >
                      Холбоос салгах
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-[color:var(--muted-text)] italic text-sm">
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
      <InfoModal
        show={infoModal.show}
        onClose={() => setInfoModal((prev) => ({ ...prev, show: false }))}
        title={infoModal.title}
        message={infoModal.message}
      />
      <DeleteConfirmModal
        show={!!tsutslakhAsuult}
        onClose={() => setTsutslakhAsuult(null)}
        title="Идэвхтэй гэрээг цуцлаад устгах уу?"
        confirmLabel="Цуцлаад устгах"
        message={
          tsutslakhAsuult
            ? `${tsutslakhAsuult.gereenuud
                .map((g) => `${g.toot}${g.ezen ? ` — «${g.ezen}»` : ""}${g.dugaar ? ` (гэрээ №${g.dugaar})` : ""}`)
                .join("\n")}\n\nЭдгээр дугаар эзэмшигчээсээ салгагдсан ч гэрээ нь идэвхтэй үлдсэн байна. Батлавал гэрээг цуцалж (идэвхгүй болгож), дараа нь дугаарыг устгана. Үлдэгдэлтэй гэрээний авлага устахгүй — Гүйлгээний түүхийн «Цуцалсан гэрээний авлага»-д шилжинэ.`
            : ""
        }
        onConfirm={tsutslaadUstgakh}
      />
      <DeleteConfirmModal
        show={!!salgakhAsuult}
        onClose={() => setSalgakhAsuult(null)}
        title="Холбоосыг салгах уу?"
        confirmLabel="Салгах"
        icon={<UserX className="h-6 w-6 text-warning" />}
        message={
          salgakhAsuult
            ? (() => {
                const h = salgakhAsuult;
                const tab = h.turul || propertyTab;
                const negj =
                  tab === "Тоот"
                    ? `${selectedOrts ? `${selectedOrts}-р орц, ` : ""}${h.floor ? `${h.floor} давхрын ` : ""}${h.unit} тоот`
                    : `${tab === "Зогсоол" ? "Гараж" : "Агуулах"} ${h.floor ? `${h.floor} давхрын ` : ""}${h.unit} дугаар`;
                const toots: any[] = Array.isArray(h.resident?.toots) ? h.resident.toots : [];
                const bairToo = toots.filter((t: any) => {
                  const tt = String(t?.turul || "Орон сууц").trim();
                  return tt === "Орон сууц" || tt === "Тоот";
                }).length;
                const anhaaruulga: string[] = [];
                if (h.nekhemjlekhIlgeesen && !h.tolsen)
                  anhaaruulga.push("• Энэ сарын нэхэмжлэх илгээгдсэн, төлөгдөөгүй байна. Салгахаас өмнө төлбөрийг шалгана уу.");
                if (tab === "Тоот" && bairToo <= 1)
                  anhaaruulga.push(`• Энэ нь «${h.ner}»-ийн цорын ганц орон сууцны тоот — салгасны дараа тоотгүй үлдэнэ.`);
                return `${negj}-аас «${h.ner}»-г салгана. Дугаар өөрөө жагсаалтад үлдэж, чөлөөтэй болно.${
                  anhaaruulga.length ? `\n\n${anhaaruulga.join("\n")}` : ""
                }`;
              })()
            : ""
        }
        onConfirm={salgakhBatlakh}
      />
      <DeleteConfirmModal
        show={!!holbootoiUstgakh}
        onClose={() => setHolbootoiUstgakh(null)}
        title="Холбоосыг салгаад устгах уу?"
        message={
          holbootoiUstgakh
            ? (() => {
                // «1-р орц, 4 давхрын 401 тоот» / «Гараж B1 давхрын 40 дугаар»
                const h = holbootoiUstgakh;
                const negj =
                  propertyTab === "Тоот"
                    ? `${selectedOrts ? `${selectedOrts}-р орц, ` : ""}${h.floor ? `${h.floor} давхрын ` : ""}${h.unit} тоот`
                    : `${propertyTab === "Зогсоол" ? "Гараж" : "Агуулах"} ${h.floor ? `${h.floor} давхрын ` : ""}${h.unit} дугаар`;
                return `${negj} дээр «${h.ner}» идэвхтэй холбогдсон байна. Батлавал эхлээд «${h.ner}»-г энэ ${propertyTab === "Тоот" ? "тоотоос" : "дугаараас"} салгаж, дараа нь устгана. Энэ үйлдлийг буцаах боломжгүй.`;
              })()
            : ""
        }
        onConfirm={holbootoiUstgakhBatlakh}
      />
      <DeleteConfirmModal
        show={deleteUnitsConfirm.show}
        onClose={() =>
          setDeleteUnitsConfirm({
            show: false,
            units: [],
            title: "",
            message: "",
          })
        }
        title={deleteUnitsConfirm.title}
        message={deleteUnitsConfirm.message}
        onConfirm={handleConfirmMassDelete}
      />
    </div>
  );
}
