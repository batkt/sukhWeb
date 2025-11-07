"use client";

import React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearch } from "@/context/SearchContext";
import { useBuilding } from "@/context/BuildingContext";
import {
  Download,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Eye,
  Columns3Cog,
  UserPlus,
  FileDown,
  FileUp,
  FilePlus,
  LayoutTemplate,
  Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadOutlined } from "@ant-design/icons";
import {
  useGereeJagsaalt,
  useGereeCRUD,
  Geree as GereeType,
} from "@/lib/useGeree";
import { useAuth } from "@/lib/useAuth";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import TusgaiZagvar from "../../../components/selectZagvar/tusgaiZagvar";
import uilchilgee, { socket, updateBaiguullaga } from "../../../lib/uilchilgee";
import { useGereeniiZagvar } from "@/lib/useGereeniiZagvar";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useSocket } from "@/context/SocketContext";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import dayjs from "dayjs";
import { ModalPortal } from "../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { getPaymentStatusLabel } from "@/lib/utils";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  isValidName,
  isValidRegister,
  areValidPhones,
  explainRegisterRule,
  explainPhoneRule,
  normalizeRegister,
} from "@/lib/validation";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";
import deleteMethod from "../../../tools/function/deleteMethod";
import { set } from "lodash";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
export const ALL_COLUMNS = [
  // { key: "ovog", label: "Овог", default: true },
  { key: "ner", label: "Нэр", default: true },
  { key: "utas", label: "Холбоо барих", default: true },
  { key: "mail", label: "И-мэйл", default: true },
  { key: "gereeniiDugaar", label: "Гэрээний дугаар", default: false },
  { key: "turul", label: "Төрөл", default: false },
  // { key: "aimag", label: "Аймаг", default: false },
  { key: "duureg", label: "Дүүрэг", default: true },
  { key: "horoo", label: "Хороо", default: true },
  // { key: "baingiinKhayag", label: "Байнгын хаяг", default: false },

  // { key: "gereeniiOgnoo", label: "Гэрээний огноо", default: false },

  // { key: "ekhlekhOgnoo", label: "Эхлэх огноо", default: false },
  // { key: "duusakhOgnoo", label: "Дуусах огноо", default: false },
  // { key: "tulukhOgnoo", label: "Төлөх огноо", default: false },
  // { key: "khugatsaa", label: "Хугацаа (сар)", default: false },
  // { key: "suhNer", label: "СӨХ-ийн нэр", default: false },
  // { key: "suhRegister", label: "СӨХ-ийн регистр", default: false },
  // { key: "suhUtas", label: "СӨХ-ийн утас", default: false },
  // { key: "suhMail", label: "СӨХ-ийн и-мэйл", default: false },
  // { key: "suhTulbur", label: "СӨХ төлбөр", default: false },
  // { key: "uilchilgeeniiZardal", label: "Үйлчилгээний зардал", default: false },
  // { key: "niitTulbur", label: "Нийт төлбөр", default: false },
  { key: "bairniiNer", label: "Байрны нэр", default: true },
  { key: "orts", label: "Орц", default: false },
  { key: "toot", label: "Тоот", default: false },
  { key: "davkhar", label: "Давхар", default: false },
  { key: "ognoo", label: "Үүссэн огноо", default: true },
  // { key: "temdeglel", label: "Тэмдэглэл", default: false },
];

export default function Geree() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didInitRef = useRef(false);
  const DEFAULT_HIDDEN = ["aimag"];

  // Which section to show: contracts, residents, or employees
  // Default to residents and persist last-used tab in localStorage so the
  // current tab remains selected across actions and reloads.
  const [activeTab, setActiveTab] = useState<
    "contracts" | "residents" | "employees" | "units"
  >("residents");

  // Initialize from URL tab (if provided) else fall back to localStorage — run once
  useEffect(() => {
    if (didInitRef.current) return;
    const t = searchParams.get("tab");
    if (
      t === "contracts" ||
      t === "residents" ||
      t === "employees" ||
      t === "units"
    ) {
      setActiveTab(t as any);
      try {
        localStorage.setItem("geree.activeTab", t);
      } catch (e) {}
    } else {
      try {
        const stored = localStorage.getItem("geree.activeTab");
        if (
          stored === "contracts" ||
          stored === "residents" ||
          stored === "employees" ||
          stored === "units"
        ) {
          setActiveTab(stored as any);
        }
      } catch (e) {}
    }
    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem("geree.activeTab", activeTab);
    } catch (e) {}
  }, [activeTab]);

  // Separate modals to avoid layout differences breaking sticky footers
  const [showContractModal, setShowContractModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [showList2Modal, setShowList2Modal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Modal for adding a unit (тоот) instead of using window.prompt
  const [showAddTootModal, setShowAddTootModal] = useState(false);
  const [addTootFloor, setAddTootFloor] = useState<string>("");
  const [addTootValue, setAddTootValue] = useState<string>("");
  // Container refs for modal panels to scope Enter key primary lookup
  const contractRef = useRef<HTMLDivElement | null>(null);
  const residentRef = useRef<HTMLDivElement | null>(null);
  const employeeRef = useRef<HTMLDivElement | null>(null);
  const list2Ref = useRef<HTMLDivElement | null>(null);
  const templatesRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter(
      (col) => col.default && !DEFAULT_HIDDEN.includes(col.key)
    ).map((col) => col.key)
  );
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };
  const { searchTerm, setSearchTerm } = useSearch();
  const [filterType, setFilterType] = useState("Бүгд");
  const [editingContract, setEditingContract] = useState<GereeType | null>(
    null
  );
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const residentExcelInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingResidents, setIsUploadingResidents] = useState(false);
  const unitExcelInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingUnits, setIsUploadingUnits] = useState(false);

  // Stable date formatter to avoid SSR/CSR timezone mismatches
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat("mn-MN", { timeZone: "UTC" }),
    []
  );
  const formatDateValue = (v: any): string => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "-" : dateFmt.format(d);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const mongoliaProvinces = [
    "Улаанбаатар",
    // "Архангай",
    // "Баян-Өлгий",
    // "Баянхонгор",
    // "Булган",
    // "Говь-Алтай",
    // "Говьсүмбэр",
    // "Дархан-Уул",
    // "Дорноговь",
    // "Дорнод",
    // "Дундговь",
    // "Завхан",
    // "Өвөрхангай",
    // "Өмнөговь",
    // "Сүхбаатар",
    // "Сэлэнгэ",
    // "Төв",
    // "Увс",
    // "Ховд",
    // "Хэнтий",
    // "Орхон",
  ];

  const districts: Record<string, string[]> = {
    Улаанбаатар: [
      "Сүхбаатар",
      "Баянгол",
      "Чингэлтэй",
      "Хан-Уул",
      "Баянзүрх",
      "Сонгинохайрхан",
      "Налайх",
      "Багануур",
      "Багахангай",
    ],
    // Архангай: [
    //   "Цэцэрлэг",
    //   "Ихтамир",
    //   "Өлзийт",
    //   "Хотонт",
    //   "Тариат",
    //   "Хайрхан",
    //   "Хашаат",
    //   "Өндөр-Улаан",
    //   "Жаргалант",
    // ],
    // "Баян-Өлгий": ["Өлгий", "Буянт", "Толбо", "Цэнгэл", "Сагсай", "Алтай"],
    // Баянхонгор: [
    //   "Баянхонгор",
    //   "Бууцагаан",
    //   "Баян-Овоо",
    //   "Жаргалант",
    //   "Шинэжинст",
    //   "Галуут",
    // ],
    // Булган: ["Булган", "Баяннуур", "Сайхан", "Бүрэгхангай", "Могод", "Орхон"],
    // "Говь-Алтай": [
    //   "Алтай",
    //   "Тайшир",
    //   "Есөнбулаг",
    //   "Цогт",
    //   "Баян-Уул",
    //   "Хөхморьт",
    //   "Тонхил",
    // ],
    // Говьсүмбэр: ["Чойр", "Шивээговь", "Баянтал"],
    // "Дархан-Уул": ["Дархан", "Орхон", "Хонгор", "Шарын гол"],
    // Дорноговь: [
    //   "Сайншанд",
    //   "Замын-Үүд",
    //   "Эрдэнэ",
    //   "Алтанширээ",
    //   "Айраг",
    //   "Хатанбулаг",
    // ],
    // Дорнод: ["Чойбалсан", "Баянтүмэн", "Булган", "Халхгол", "Гурванзагал"],
    // Дундговь: [
    //   "Мандалговь",
    //   "Говь-Угтаал",
    //   "Дэлгэрхангай",
    //   "Адаацаг",
    //   "Өлзийт",
    // ],
    // Завхан: [
    //   "Улиастай",
    //   "Идэр",
    //   "Тэлмэн",
    //   "Яруу",
    //   "Тосонцэнгэл",
    //   "Баянтэс",
    //   "Отгон",
    // ],
    // Өвөрхангай: ["Арвайхээр", "Баян-Өндөр", "Бат-Өлзий", "Тарагт", "Хужирт"],
    // Өмнөговь: ["Даланзадгад", "Манлай", "Цогтцэций", "Ханбогд", "Баяндалай"],
    // Сүхбаатар: ["Баруун-Урт", "Мөнххаан", "Түвшинширээ", "Асгат", "Онгон"],
    // Сэлэнгэ: [
    //   "Сүхбаатар",
    //   "Алтанбулаг",
    //   "Зүүнбүрэн",
    //   "Орхон",
    //   "Шаамар",
    //   "Мандал",
    // ],
    // Төв: [
    //   "Зуунмод",
    //   "Баянчандмань",
    //   "Баянцогт",
    //   "Баян",
    //   "Сэргэлэн",
    //   "Аргалант",
    // ],
    // Увс: ["Улаангом", "Баруунтуруун", "Зүүнговь", "Ховд", "Малчин", "Сагил"],
    // Ховд: ["Ховд", "Булган", "Жаргалант", "Мянгад", "Дөргөн", "Чандмань"],
    // Хэнтий: [
    //   "Өндөрхаан",
    //   "Бэрх",
    //   "Батноров",
    //   "Дэлгэрхаан",
    //   "Баянхутаг",
    //   "Галшар",
    // ],
    // Орхон: ["Баян-Өндөр", "Жаргалант"],
  };

  const subDistricts: Record<string, string[]> = {
    Сүхбаатар: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
    ],
    Баянгол: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
    ],
    Чингэлтэй: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
    ],
    "Хан-Уул": [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
    ],
    Баянзүрх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
    ],
    Сонгинохайрхан: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
      "7-р хороо",
      "8-р хороо",
      "9-р хороо",
      "10-р хороо",
    ],
    Налайх: [
      "1-р хороо",
      "2-р хороо",
      "3-р хороо",
      "4-р хороо",
      "5-р хороо",
      "6-р хороо",
    ],
    Багануур: ["1-р хороо", "2-р хороо", "3-р хороо", "4-р хороо", "5-р хороо"],
    Багахангай: ["1-р хороо", "2-р хороо"],
  };

  const { token, ajiltan, barilgiinId, baiguullaga, baiguullagaMutate } =
    useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId: string | undefined =
    selectedBuildingId ?? barilgiinId ?? undefined;
  const selectedBarilga = baiguullaga?.barilguud?.find(
    (b) => b._id === selectedBuildingId
  );
  // Floors (davkhar) options derived from building settings.
  const davkharOptions = useMemo(() => {
    try {
      const tok = (selectedBarilga as any)?.tokhirgoo?.davkhar;
      if (Array.isArray(tok) && tok.length > 0)
        return tok.map((d: any) => String(d?.davkhar ?? d));
      if (typeof tok === "number" && tok > 0)
        return Array.from({ length: tok }).map((_, i) => String(i + 1));
      const list = (selectedBarilga as any)?.davkharuud;
      if (Array.isArray(list) && list.length > 0)
        return list.map((d: any) => String(d?.davkhar ?? d));
      return [];
    } catch (e) {
      return [];
    }
  }, [selectedBarilga]);
  // Entrances (орц) options derived from building settings
  const ortsOptions = useMemo(() => {
    try {
      const tok = (selectedBarilga as any)?.tokhirgoo?.orts;
      if (Array.isArray(tok) && tok.length > 0) return tok.map(String);
      if (typeof tok === "number" && tok > 0)
        return Array.from({ length: tok }).map((_, i) => String(i + 1));
      if (typeof tok === "string") {
        const s = tok.trim();
        // If it's a number in string form, treat as count
        if (/^\d+$/.test(s)) {
          const n = Number(s);
          if (n > 0)
            return Array.from({ length: n }).map((_, i) => String(i + 1));
        }
        // Otherwise allow comma or whitespace separated list like "1,2,3"
        const parts = s.split(/[\s,;|]+/).filter(Boolean);
        if (parts.length > 0) return parts.map(String);
      }
      return [];
    } catch (e) {
      return [];
    }
  }, [selectedBarilga]);
  const { zardluud } = useAshiglaltiinZardluud();
  // Per-floor unit storage (toots) under building tokhirgoo
  const tootMap: Record<string, string[]> = useMemo(() => {
    const out: Record<string, string[]> = {};
    try {
      const tokhirgoo = (selectedBarilga as any)?.tokhirgoo || {};
      // 1) New canonical shape: a map like { "1": ["101","102"], ... }
      const map = (tokhirgoo as any)?.davkhariinToonuud;
      if (map && typeof map === "object" && !Array.isArray(map)) {
        Object.entries(map).forEach(([floor, arr]) => {
          const list = Array.isArray(arr) ? arr : [];
          out[String(floor)] = list.map((x: any) => String(x));
        });
      }

      // 2) Backward-compat: davkhar can be array with items having { davkhar, toonuud }
      const tok = (tokhirgoo as any)?.davkhar;
      if (Array.isArray(tok)) {
        tok.forEach((it: any) => {
          const floor = String(it?.davkhar ?? it);
          const list = Array.isArray(it?.toonuud) ? it.toonuud : [];
          if (floor && !out[floor])
            out[floor] = list.map((x: any) => String(x));
        });
      }
    } catch {}
    return out;
  }, [selectedBarilga]);
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({});
  const [isSavingUnits, setIsSavingUnits] = useState(false);
  const [addUnitFloor, setAddUnitFloor] = useState<string>("");
  const [addUnitValue, setAddUnitValue] = useState<string>("");
  // Selections for simplified Units UI
  const [selectedOrts, setSelectedOrts] = useState<string>("");
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  // Delete unit modal state
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{
    floor: string;
    unit: string;
  } | null>(null);

  // Delete floor modal state
  const [showDeleteFloorModal, setShowDeleteFloorModal] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);

  // Delete resident modal state
  const [showDeleteResidentModal, setShowDeleteResidentModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<any | null>(null);

  // Delete employee modal state
  const [showDeleteEmployeeModal, setShowDeleteEmployeeModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);

  // Small inline confirm popover used for delete actions to match the
  // compact confirmation used in `Dans.tsx`.
  function ConfirmPopover({
    children,
    onConfirm,
    message,
  }: {
    children: React.ReactElement;
    onConfirm: () => Promise<void> | void;
    message?: string;
  }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // cloneElement typing is awkward here; cast to any to avoid TS errors
    // Preserve any existing onClick on the child so wrapping buttons keep their behavior
    const trigger = React.cloneElement(
      children as any,
      {
        onClick: (e: any) => {
          e?.stopPropagation?.();
          try {
            const orig = (children as any)?.props?.onClick;
            if (typeof orig === "function") orig(e);
          } catch (err) {}
          setOpen((s) => !s);
        },
      } as any
    );

    return (
      <div className="relative inline-block" ref={ref}>
        {trigger}
        {open && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl menu-surface p-3 z-50 shadow-lg text-sm">
            <div className="text-theme mb-3">
              {message || "Та үүнийг устгахдаа итгэлтэй байна уу?"}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-minimal btn-cancel text-xs px-3 py-1"
                onClick={() => setOpen(false)}
              >
                Болих
              </button>
              <button
                type="button"
                className="btn-minimal btn-save text-xs px-3 py-1"
                onClick={async () => {
                  setOpen(false);
                  try {
                    await onConfirm();
                  } catch (e) {}
                }}
              >
                Устгах
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // keep selection in sync with options
  useEffect(() => {
    setSelectedOrts((prev) => prev || ortsOptions[0] || "");
  }, [ortsOptions]);

  const composeKey = useCallback((orts: string, floor: string) => {
    const f = String(floor || "").trim();
    const o = String(orts || "").trim();
    return o ? `${o}::${f}` : f;
  }, []);

  useEffect(() => {
    if (!addUnitFloor && davkharOptions && davkharOptions.length > 0) {
      setAddUnitFloor(davkharOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [davkharOptions]);

  const deleteUnit = async (floor: string, unit: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      setIsSavingUnits(true);
      const key = composeKey(selectedOrts, floor);
      const updatedBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (String(b._id) !== String(selectedBuildingId || barilgiinId))
          return b;
        const existing =
          (b.tokhirgoo && (b.tokhirgoo as any).davkhariinToonuud) || {};
        const nextMap: Record<string, string[]> = { ...existing };
        nextMap[key] = (nextMap[key] || []).filter(
          (u) => String(u) !== String(unit)
        );
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: nextMap,
          },
        };
      });
      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga?._id,
        barilguud: updatedBarilguud,
      };
      const res = await updateBaiguullaga(
        token || undefined,
        (baiguullaga as any)._id as string,
        payload
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();
      openSuccessOverlay("Тоот устгагдлаа");
    } catch (e) {
      openErrorOverlay("Устгах явцад алдаа гарлаа");
    } finally {
      setIsSavingUnits(false);
    }
  };

  const deleteFloor = async (floor: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      setIsSavingUnits(true);
      const key = composeKey(selectedOrts, floor);
      const updatedBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (String(b._id) !== String(selectedBuildingId || barilgiinId))
          return b;
        const existing =
          (b.tokhirgoo && (b.tokhirgoo as any).davkhariinToonuud) || {};
        const nextMap: Record<string, string[]> = { ...existing };
        delete nextMap[key];
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: nextMap,
          },
        };
      });
      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga?._id,
        barilguud: updatedBarilguud,
      };
      const res = await updateBaiguullaga(
        token || undefined,
        (baiguullaga as any)._id as string,
        payload
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();
      openSuccessOverlay(`${floor}-р давхрын тоотууд устгагдлаа`);
    } catch (e) {
      openErrorOverlay("Устгах явцад алдаа гарлаа");
    } finally {
      setIsSavingUnits(false);
    }
  };

  const addUnit = async (floor: string, value: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    const raw = String(value || "").trim();
    if (!raw) return;
    try {
      setIsSavingUnits(true);
      const key = composeKey(selectedOrts, floor);
      const updatedBarilguud = (baiguullaga?.barilguud || []).map((b: any) => {
        if (String(b._id) !== String(selectedBuildingId || barilgiinId))
          return b;
        const existing =
          (b.tokhirgoo && (b.tokhirgoo as any).davkhariinToonuud) || {};
        const nextMap: Record<string, string[]> = {
          ...existing,
          [key]: Array.from(new Set([...(existing[key] || []), raw])),
        };
        return {
          ...b,
          tokhirgoo: {
            ...(b.tokhirgoo || {}),
            davkhariinToonuud: nextMap,
          },
        };
      });
      const payload = {
        ...(baiguullaga as any),
        _id: baiguullaga?._id,
        barilguud: updatedBarilguud,
      };
      const res = await updateBaiguullaga(
        token || undefined,
        (baiguullaga as any)._id as string,
        payload
      );
      if (res) await baiguullagaMutate(res, false);
      await baiguullagaMutate();
      setAddUnitValue("");
      openSuccessOverlay("Тоот нэмэгдлээ");
    } catch (e) {
      openErrorOverlay("Тоот нэмэхэд алдаа гарлаа");
    } finally {
      setIsSavingUnits(false);
    }
  };
  // Residents list
  const {
    orshinSuugchGaralt,
    orshinSuugchJagsaaltMutate,
    setOrshinSuugchKhuudaslalt,
    isValidating: isValidatingSuugch,
  } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    {},
    effectiveBarilgiinId
  );
  // Employees list
  const {
    ajilchdiinGaralt,
    ajiltniiJagsaaltMutate,
    setAjiltniiKhuudaslalt,
    isValidating: isValidatingAjiltan,
  } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    effectiveBarilgiinId,
    {}
  );

  const {
    gereeGaralt,
    gereeJagsaaltMutate,
    setGereeKhuudaslalt,
    isValidating: isValidatingGeree,
  } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId
  );
  const { gereeUusgekh, gereeZasakh, gereeUstgakh } = useGereeCRUD();
  const {
    zagvaruud,
    zagvarJagsaaltMutate,
    isValidating: isValidatingZagvar,
  } = useGereeniiZagvar();
  const contracts = gereeGaralt?.jagsaalt || [];

  const residentsById = useMemo(() => {
    const list = (orshinSuugchGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((r) => {
      if (r?._id) map[String(r._id)] = r;
    });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  // Pagination for residents/employees
  const [resPage, setResPage] = useState(1);
  const [resPageSize, setResPageSize] = useState(20);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [unitPage, setUnitPage] = useState(1);
  const [unitPageSize, setUnitPageSize] = useState(20);

  // When selected building changes, reset paginations to first page
  useEffect(() => {
    setResPage(1);
    setEmpPage(1);
    setUnitPage(1);
    setOrshinSuugchKhuudaslalt((prev: any) => ({
      ...prev,
      khuudasniiDugaar: 1,
    }));
    setAjiltniiKhuudaslalt((prev: any) => ({
      ...prev,
      khuudasniiDugaar: 1,
    }));
    setGereeKhuudaslalt((prev: any) => ({
      ...prev,
      khuudasniiDugaar: 1,
    }));
  }, [selectedBuildingId, barilgiinId]);

  // Canonical status map from nekhemjlekhiinTuukh by resident (_id)
  const [tuluvByResidentId, setTuluvByResidentId] = useState<
    Record<string, "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй">
  >({});

  // Fetch latest payment status per resident from nekhemjlekhiinTuukh (canonical source)
  useEffect(() => {
    const run = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 20000,
            // Pass object (matches other working pages like guilgeeTuukh)
            query: {
              baiguullagiinId: ajiltan.baiguullagiinId,
              barilgiinId: selectedBuildingId || barilgiinId || null,
            },
          },
        });
        const list: any[] = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        // Build a robust resident index to resolve invoices without explicit orshinSuugchId
        const residents = (orshinSuugchGaralt?.jagsaalt || []) as any[];
        const norm = (v: any) =>
          String(v ?? "")
            .trim()
            .toLowerCase();
        const resIndex = new Map<string, string>(); // key -> residentId
        const makeResKeys = (r: any): string[] => {
          const id = String(r?._id || "");
          const reg = norm(r?.register);
          const phone = norm(r?.utas);
          const ovog = norm(r?.ovog);
          const ner = norm(r?.ner);
          const toot = String(r?.toot ?? r?.medeelel?.toot ?? "").trim();
          const keys: string[] = [];
          if (id) keys.push(`id|${id}`);
          if (reg) keys.push(`reg|${reg}`);
          if (phone) keys.push(`phone|${phone}`);
          if (ovog || ner || toot) keys.push(`name|${ovog}|${ner}|${toot}`);
          return keys;
        };
        residents.forEach((r: any) => {
          const id = String(r?._id || "");
          if (!id) return;
          makeResKeys(r).forEach((k) => resIndex.set(k, id));
        });

        const byId: Record<string, { label: string; ts: number }> = {};
        list.forEach((it: any) => {
          // Prefer explicit resident id when available
          const keys: string[] = [];
          const osIdRaw = String(it?.orshinSuugchId || "");
          if (osIdRaw) keys.push(`id|${osIdRaw}`);
          const reg = norm(it?.register);
          if (reg) keys.push(`reg|${reg}`);
          const utasVal = Array.isArray(it?.utas) ? it.utas[0] : it?.utas;
          const phone = norm(utasVal);
          if (phone) keys.push(`phone|${phone}`);
          const ovog = norm(it?.ovog);
          const ner = norm(it?.ner);
          const toot = String(it?.medeelel?.toot ?? it?.toot ?? "").trim();
          if (ovog || ner || toot) keys.push(`name|${ovog}|${ner}|${toot}`);

          let osId = "";
          for (const k of keys) {
            const found = resIndex.get(k);
            if (found) {
              osId = found;
              break;
            }
          }
          if (!osId) return;

          const label = getPaymentStatusLabel(it);
          const ts = new Date(
            it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0
          ).getTime();
          const cur = byId[osId];
          if (!cur || ts >= cur.ts) byId[osId] = { label, ts };
        });
        const out: Record<
          string,
          "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй"
        > = {};
        Object.entries(byId).forEach(([k, v]) => {
          const l = v.label as any;
          out[k] =
            l === "Төлсөн" || l === "Төлөөгүй" || l === "Хугацаа хэтэрсэн"
              ? l
              : "Тодорхойгүй";
        });
        setTuluvByResidentId(out);
      } catch {
        setTuluvByResidentId({});
      }
    };
    run();
  }, [
    token,
    ajiltan?.baiguullagiinId,
    selectedBuildingId,
    barilgiinId,
    orshinSuugchGaralt?.jagsaalt,
  ]);

  // Editing flags
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  // Error states for form validation
  const [contractErrors, setContractErrors] = useState<Record<string, string>>(
    {}
  );
  const [employeeErrors, setEmployeeErrors] = useState<Record<string, string>>(
    {}
  );
  const [residentErrors, setResidentErrors] = useState<Record<string, string>>(
    {}
  );
  const [newEmployee, setNewEmployee] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: "",
    email: "",
    albanTushaal: "",
    ajildOrsonOgnoo: "",
    nevtrekhNer: "",
    nuutsUg: "",
  });

  // Keyboard shortcuts for all modals
  useModalHotkeys({
    isOpen: showContractModal,
    onClose: () => setShowContractModal(false),
    container: contractRef.current,
  });
  useModalHotkeys({
    isOpen: showResidentModal,
    onClose: () => setShowResidentModal(false),
    container: residentRef.current,
  });
  useModalHotkeys({
    isOpen: showEmployeeModal,
    onClose: () => setShowEmployeeModal(false),
    container: employeeRef.current,
  });
  useModalHotkeys({
    isOpen: showDeleteResidentModal,
    onClose: () => setShowDeleteResidentModal(false),
  });
  useModalHotkeys({
    isOpen: showDeleteEmployeeModal,
    onClose: () => setShowDeleteEmployeeModal(false),
  });
  useModalHotkeys({
    isOpen: showDeleteUnitModal,
    onClose: () => setShowDeleteUnitModal(false),
  });
  useModalHotkeys({
    isOpen: showAddTootModal,
    onClose: () => setShowAddTootModal(false),
  });
  useModalHotkeys({
    isOpen: showDeleteFloorModal,
    onClose: () => setShowDeleteFloorModal(false),
  });
  useModalHotkeys({
    isOpen: showList2Modal,
    onClose: () => setShowList2Modal(false),
    container: list2Ref.current,
  });
  useModalHotkeys({
    isOpen: showTemplatesModal,
    onClose: () => setShowTemplatesModal(false),
    container: templatesRef.current,
  });

  useEffect(() => {
    if (activeTab === "contracts") {
      setGereeKhuudaslalt((prev) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    } else if (activeTab === "residents") {
      setOrshinSuugchKhuudaslalt((prev: any) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    } else if (activeTab === "employees") {
      setAjiltniiKhuudaslalt((prev: any) => ({
        ...prev,
        search: searchTerm,
        khuudasniiDugaar: 1,
      }));
    }
  }, [
    activeTab,
    searchTerm,
    setGereeKhuudaslalt,
    setOrshinSuugchKhuudaslalt,
    setAjiltniiKhuudaslalt,
  ]);
  useEffect(() => setMounted(true), []);

  // Register tour steps for /geree page (dynamic based on activeTab)
  const gereeTourSteps: DriverStep[] = useMemo(() => {
    if (activeTab === "contracts") {
      return [
        {
          element: "#tab-contracts",
          popover: {
            title: "Гэрээний хэсэг",
            description:
              "Эндээс гэрээний жагсаалтыг харах, шүүх болон шинэ гэрээ үүсгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#geree-new-btn",
          popover: {
            title: "Шинэ гэрээ",
            description:
              "Шинэ гэрээ үүсгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#geree-templates-btn",
          popover: {
            title: "Гэрээний загвар",
            description: "Гэрээний загваруудыг харах, сонгох боломжтой хэсэг.",
            side: "bottom",
          },
        },
        {
          element: "#geree-download-template-btn",
          popover: {
            title: "Загвар татах",
            description:
              "Excel загвар файлыг татаж авч, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#geree-columns-btn",
          popover: {
            title: "Багана сонгох",
            description: "Жагсаалтын багануудыг эндээс тохируулж болно.",
            side: "left",
          },
        },
        {
          element: "#geree-table",
          popover: {
            title: "Гэрээний жагсаалт",
            description:
              "Тохируулсан багануудтай хамт гэрээний жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#geree-edit-btn",
          popover: {
            title: "Гэрээний засвар",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#geree-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "residents") {
      return [
        {
          element: "#tab-residents",
          popover: {
            title: "Оршин суугчдын хэсэг",
            description: "Эндээс оршин суугчдын жагсаалтыг харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-new-btn",
          popover: {
            title: "Оршин суугч бүртгэх",
            description:
              "Шинэ оршин суугч гараас бүртгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-list-btn",
          popover: {
            title: "Оршин суугчдын жагсаалтыг татах",
            description:
              "Оршин суугчдын жагсаалтыг Excel файлын хэлбэрээр татаж авах товч.",
            side: "bottom",
          },
        },
        {
          element: "#resident-download-template-btn",
          popover: {
            title: "Загвар татах",
            description:
              "Excel загвар файлыг татаж авч, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-upload-template-btn",
          popover: {
            title: "Загвар оруулах",
            description:
              "Excel загвар файлыг оруулж, өгөгдлөө бэлтгэх боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#resident-table",
          popover: {
            title: "Оршин суугчдын жагсаалт",
            description:
              "Оршин суугчдын жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-edit-btn",
          popover: {
            title: "Оршин суугчийн мэдээлэл засах",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-delete-btn",
          popover: {
            title: "Оршин суугч устгах",
            description: "Жагсаалтан дахь мэдээллийг энд устгах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#resident-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    } else if (activeTab === "employees") {
      return [
        {
          element: "#tab-employees",
          popover: {
            title: "Ажилчдын хэсэг",
            description: "Эндээс ажилтнуудын жагсаалтыг харах боломжтой.",
            side: "bottom",
          },
        },
        {
          element: "#employees-new-btn",
          popover: {
            title: "Ажилтан бүртгэх",
            description:
              "Шинэ ажилтан бүртгэх товч. Дараад шаардлагатай мэдээллээ бөглөнө.",
            side: "bottom",
          },
        },
        {
          element: "#employees-table",
          popover: {
            title: "Ажилтнуудын жагсаалт",
            description:
              "Ажилтнуудын жагсаалт энд харагдана. Үйлдлээс засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-edit-btn",
          popover: {
            title: "Ажилтны мэдээлэл засах",
            description: "Жагсаалтан дахь мэдээллийг энд засах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-delete-btn",
          popover: {
            title: "Ажилтны мэдээлэл устгах",
            description: "Жагсаалтан дахь мэдээллийг энд устгах боломжтой.",
            side: "top",
          },
        },
        {
          element: "#employees-pagination",
          popover: {
            title: "Хуудаслалт",
            description: "Эндээс хуудсуудын хооронд шилжинэ.",
            side: "top",
          },
        },
      ];
    }
    return [];
  }, [activeTab]);
  useRegisterTourSteps("/geree", gereeTourSteps);

  useEffect(() => {
    // Fetch large chunks once; paginate on client (same as guilgeeTuukh)
    const LARGE_PAGE = 500;
    setGereeKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: LARGE_PAGE,
      search: "",
    });
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: LARGE_PAGE,
      search: "",
    });
    setAjiltniiKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: LARGE_PAGE,
      search: "",
    });
    gereeJagsaaltMutate();
    orshinSuugchJagsaaltMutate();
    ajiltniiJagsaaltMutate();
  }, []);

  // Socket listeners: refresh lists when server emits relevant events so the
  // UI stays in sync with background changes from other users.
  const socketCtx = useSocket();
  useEffect(() => {
    if (!socketCtx) return;
    const onResidentCreated = () => orshinSuugchJagsaaltMutate();
    const onResidentUpdated = () => orshinSuugchJagsaaltMutate();
    const onResidentDeleted = () => orshinSuugchJagsaaltMutate();

    const onContractCreated = () => gereeJagsaaltMutate();
    const onContractUpdated = () => gereeJagsaaltMutate();
    const onContractDeleted = () => gereeJagsaaltMutate();

    const onEmployeeCreated = () => ajiltniiJagsaaltMutate();
    const onEmployeeUpdated = () => ajiltniiJagsaaltMutate();
    const onEmployeeDeleted = () => ajiltniiJagsaaltMutate();

    socketCtx.on("orshinSuugch.created", onResidentCreated);
    socketCtx.on("orshinSuugch.updated", onResidentUpdated);
    socketCtx.on("orshinSuugch.deleted", onResidentDeleted);

    socketCtx.on("geree.created", onContractCreated);
    socketCtx.on("geree.updated", onContractUpdated);
    socketCtx.on("geree.deleted", onContractDeleted);

    socketCtx.on("ajiltan.created", onEmployeeCreated);
    socketCtx.on("ajiltan.updated", onEmployeeUpdated);
    socketCtx.on("ajiltan.deleted", onEmployeeDeleted);

    return () => {
      try {
        socketCtx.off("orshinSuugch.created", onResidentCreated);
        socketCtx.off("orshinSuugch.updated", onResidentUpdated);
        socketCtx.off("orshinSuugch.deleted", onResidentDeleted);

        socketCtx.off("geree.created", onContractCreated);
        socketCtx.off("geree.updated", onContractUpdated);
        socketCtx.off("geree.deleted", onContractDeleted);

        socketCtx.off("ajiltan.created", onEmployeeCreated);
        socketCtx.off("ajiltan.updated", onEmployeeUpdated);
        socketCtx.off("ajiltan.deleted", onEmployeeDeleted);
      } catch (e) {}
    };
  }, [
    socketCtx,
    orshinSuugchJagsaaltMutate,
    gereeJagsaaltMutate,
    ajiltniiJagsaaltMutate,
  ]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(e.target as Node)
      ) {
        setShowColumnSelector(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filteredContracts = Array.isArray(contracts)
    ? contracts.filter((c: any) => {
        // filter by type first
        if (filterType !== "Бүгд" && c.turul !== filterType) return false;

        if (searchTerm) {
          const qq = String(searchTerm).toLowerCase();
          const hay = [
            c.ner,
            c.gereeniiDugaar,
            c.mail || c.email,
            Array.isArray(c.utas) ? c.utas.join(" ") : c.utas,
            c.orts,

            c.toot !== undefined && c.toot !== null
              ? String(c.toot)
              : undefined,
            c.davkhar,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(qq)) return false;
        }

        return true;
      })
    : [];

  const totalPages = Math.ceil(filteredContracts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  // Client-side pagination for residents and employees (slice loaded lists)
  const residentsList = (orshinSuugchGaralt?.jagsaalt || []) as any[];
  const resTotalPages = Math.max(
    1,
    Math.ceil(residentsList.length / (resPageSize || 1))
  );
  const currentResidents = residentsList.slice(
    (resPage - 1) * resPageSize,
    resPage * resPageSize
  );

  const employeesList = (ajilchdiinGaralt?.jagsaalt || []) as any[];
  const empTotalPages = Math.max(
    1,
    Math.ceil(employeesList.length / (empPageSize || 1))
  );
  const currentEmployees = employeesList.slice(
    (empPage - 1) * empPageSize,
    empPage * empPageSize
  );

  // Client-side pagination for units (slice floors)
  const floorsList = davkharOptions || [];
  const unitTotalPages = Math.max(
    1,
    Math.ceil(floorsList.length / (unitPageSize || 1))
  );
  const currentFloors = floorsList.slice(
    (unitPage - 1) * unitPageSize,
    unitPage * unitPageSize
  );

  const [newContract, setNewContract] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
    mail: "",
    khayag: "",
    aimag: "",
    duureg: "",
    horoo: "",
    baingiinKhayag: "",
    gereeniiDugaar: "",
    gereeniiOgnoo: "",
    turul: "Үндсэн",
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    tulukhOgnoo: "",
    khugatsaa: 0,
    suhNer: "",
    suhRegister: "",
    suhUtas: [""],
    suhMail: "",
    suhGariinUseg: "",
    suhTamga: "",
    suhTulbur: "",
    suhTulburUsgeer: "",
    suhKhugatsaa: 0,
    sukhKhungulult: 0,
    uilchilgeeniiZardal: 0,
    uilchilgeeniiZardalUsgeer: "",
    niitTulbur: 0,
    niitTulburUsgeer: "",
    bairniiNer: "",
    orts: "",
    toot: 0,
    talbainKhemjee: "",
    zoriulalt: "",
    davkhar: "",
    burtgesenAjiltan: "",
    temdeglel: "",
    actOgnoo: "",
    tooluuriinDugaar: "",
    baritsaaAvakhDun: 0,
  });

  const selectedResidentForModal = useMemo(() => {
    const id =
      (newContract &&
        (newContract.orshinSuugchId || newContract.orshinSuugch)) ||
      (editingContract &&
        (editingContract.orshinSuugchId || editingContract.orshinSuugch));
    if (!id) return null;
    return residentsById[String(id)] || null;
  }, [
    newContract?.orshinSuugchId,
    newContract?.orshinSuugch,
    editingContract?.orshinSuugchId,
    editingContract?.orshinSuugch,
    residentsById,
  ]);

  // Separate state for resident add modal
  const [newResident, setNewResident] = useState<any>({
    ovog: "",
    ner: "",
    register: "",
    utas: [""],
    mail: "",
    khayag: "",
    aimag: "Улаанбаатар",
    duureg: "",
    horoo: "",
    orts: "",
    toot: "",
    davkhar: "",
    // Resident account fields
    nevtrekhNer: "",
    nuutsUg: "",
    // Resident type: Үндсэн | Түр
    turul: "Үндсэн",
  });

  // Compute next contract number from existing list
  const computeNextGereeDugaar = () => {
    const nums = (contracts || [])
      .map((c: any) =>
        parseInt(String(c?.gereeniiDugaar || "").replace(/[^0-9]/g, ""), 10)
      )
      .filter((n: number) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1);
  };

  // Sum utilization expenses
  const uilchilgeeNiit = (zardluud || []).reduce(
    (sum: number, z: any) =>
      sum + (Number(z?.tariff) || 0) + (Number(z?.suuriKhuraamj) || 0),
    0
  );

  // Validation helpers
  const hasAnyPhone = (arr: any) =>
    Array.isArray(arr) && arr.some((x) => String(x || "").trim() !== "");
  const isStepValid = (step: number) => {
    if (step === 1) {
      const baseValid =
        String(newContract.ovog || "").trim() !== "" &&
        String(newContract.ner || "").trim() !== "" &&
        hasAnyPhone(newContract.utas) &&
        String(newContract.aimag || "").trim() !== "";
      const ubExtraValid =
        newContract.aimag !== "Улаанбаатар" ||
        (String(newContract.duureg || "").trim() !== "" &&
          String(newContract.horoo || "").trim() !== "");
      const namesOk =
        isValidName(newContract.ovog || "") &&
        isValidName(newContract.ner || "");
      const _regVal = String(newContract.register || "").trim();
      const regOk =
        _regVal === "" || isValidRegister(newContract.register || "");
      const phonesOk = areValidPhones(newContract.utas || []);
      return baseValid && ubExtraValid && namesOk && regOk && phonesOk;
    }
    if (step === 2) {
      // Require contract number and all dates, ensure range is valid; khugatsaa is no longer required in UI
      const hasAll =
        String(newContract.gereeniiDugaar || "").trim() !== "" &&
        String(newContract.gereeniiOgnoo || "").trim() !== "" &&
        String(newContract.ekhlekhOgnoo || "").trim() !== "" &&
        String(newContract.duusakhOgnoo || "").trim() !== "" &&
        String(newContract.tulukhOgnoo || "").trim() !== "";
      if (!hasAll) return false;
      // Start <= End
      const start = dayjs(newContract.ekhlekhOgnoo);
      const end = dayjs(newContract.duusakhOgnoo);
      return start.isValid() && end.isValid() && !end.isBefore(start, "day");
    }
    if (step === 3) {
      return (
        String(newContract.suhNer || "").trim() !== "" &&
        String(newContract.suhRegister || "").trim() !== "" &&
        hasAnyPhone(newContract.suhUtas)
      );
    }
    return true;
  };
  const isFormValid = () => [1, 2, 3].every((s) => isStepValid(s));

  const renderCellValue = (contract: any, columnKey: string) => {
    const findResidentById = (id: any) =>
      (orshinSuugchGaralt?.jagsaalt || []).find(
        (r: any) => String(r?._id || r?.id || "") === String(id || "")
      );

    const getStringValue = (val: any) => {
      if (typeof val === "object" && val !== null) {
        return val.ner || val.kod || JSON.stringify(val);
      }
      return val || "-";
    };

    switch (columnKey) {
      case "ovog":
        return getStringValue(contract.ovog);
      case "ner":
        const nerVal = contract.ner;
        if (typeof nerVal === "object" && nerVal !== null) {
          return `${nerVal.ner || ""} ${nerVal.kod || ""}`.trim() || "-";
        }
        return nerVal || "-";
      case "register":
        return getStringValue(contract.register);
      case "gereeniiDugaar":
        return getStringValue(contract.gereeniiDugaar);
      case "gereeniiOgnoo":
        return formatDateValue(contract.gereeniiOgnoo);
      case "toot":
        return contract.toot !== undefined && contract.toot !== null
          ? String(contract.toot)
          : "-";
      case "davkhar":
        return getStringValue(contract.davkhar);

      case "aimag": {
        const resident = findResidentById(contract.orshinSuugchId);
        return getStringValue(
          contract.aimag || resident?.aimag || contract.khayag
        );
      }
      case "duureg": {
        const resident = findResidentById(contract.orshinSuugchId);
        if (contract.duureg || resident?.duureg)
          return getStringValue(contract.duureg || resident?.duureg);
        const addr = String(contract.sukhBairshil || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        // Fallback: use second token as duureg/sum; else first
        return getStringValue(addr[1] || addr[0]);
      }
      case "horoo": {
        const resident = findResidentById(contract.orshinSuugchId);
        if (contract.horoo || resident?.horoo)
          return getStringValue(contract.horoo || resident?.horoo);
        const addr = String(contract.sukhBairshil || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        // Fallback: use third token as horoo; else empty
        return getStringValue(addr[2]);
      }
      case "baingiinKhayag": {
        const resident = findResidentById(contract.orshinSuugchId);
        return getStringValue(
          contract.baingiinKhayag ||
            contract.bairniiNer ||
            resident?.khayag ||
            resident?.soh
        );
      }
      case "bairniiNer": {
        const resident = findResidentById(contract.orshinSuugchId);
        return getStringValue(
          contract.bairniiNer || contract.bairNer || resident?.bairniiNer
        );
      }
      case "orts": {
        const resident = findResidentById(contract.orshinSuugchId);
        return getStringValue(contract.orts || resident?.orts);
      }
      case "duusakhOgnoo":
        return formatDateValue(contract.duusakhOgnoo);
      case "khugatsaa":
        return getStringValue(contract.khugatsaa);
      case "turul":
        return getStringValue(contract.turul);
      case "zoriulalt":
        return getStringValue(contract.zoriulalt);
      case "talbainDugaar":
        return getStringValue(contract.talbainDugaar);
      case "talbainKhemjee":
        return contract.talbainKhemjee ? `${contract.talbainKhemjee} м²` : "-";
      case "sariinTurees":
        return contract.sariinTurees
          ? `${contract.sariinTurees.toLocaleString()}₮`
          : "-";
      case "baritsaaniiUldegdel":
        return contract.baritsaaniiUldegdel
          ? `${contract.baritsaaniiUldegdel.toLocaleString()}₮`
          : "0₮";
      case "utas":
        return Array.isArray(contract.utas) && contract.utas.length > 0
          ? contract.utas.join(", ")
          : getStringValue(contract.utas);
      case "mail":
        return getStringValue(contract.mail || contract.email);
      case "khayag":
        return getStringValue(contract.khayag);
      case "ognoo": {
        const created = contract.createdAt
          ? new Date(contract.createdAt)
          : null;
        const updated = contract.updatedAt
          ? new Date(contract.updatedAt)
          : null;
        const show =
          updated && created && updated.getTime() !== created.getTime()
            ? updated
            : created || updated;
        return show ? dateFmt.format(show) : "-";
      }
      default:
        return "-";
    }
  };

  const handleDownloadTemplate = async (templateType: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    // If the user hasn't chosen a building in the UI, require selection.
    if (!selectedBuildingId) {
      openErrorOverlay("Барилга сонгоогүй байна. Эхлээд барилга сонгоно уу.");
      return;
    }

    try {
      const response = await uilchilgee(token).get("/gereeniiZagvarAvya", {
        responseType: "blob",
        params: {
          templateType: templateType,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${templateType}_загвар.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      openSuccessOverlay("Загвар амжилттай татагдлаа");
    } catch (error) {
      openErrorOverlay("Загвар татахад алдаа гарлаа");
    }
  };

  const handleDownloadExcel = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    // Require a selected building for scoped export (match guilgee behaviour)
    if (!selectedBuildingId) {
      openErrorOverlay("Барилга сонгоогүй байна. Эхлээд барилга сонгоно уу.");
      return;
    }

    try {
      const targetBarilgiinId = selectedBuildingId || barilgiinId || null;
      const query: any = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: targetBarilgiinId,
      };

      if (searchTerm) {
        query.$or = [
          { ner: { $regex: searchTerm, $options: "i" } },
          { gereeniiDugaar: { $regex: searchTerm, $options: "i" } },
          { register: { $regex: searchTerm, $options: "i" } },
        ];
      }

      if (filterType !== "Бүгд") {
        query.turul = filterType;
      }

      const response = await uilchilgee(token).get("/geree", {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: targetBarilgiinId,
          query: query,
          khuudasniiKhemjee: gereeGaralt?.niitMur || 1000,
          khuudasniiDugaar: 1,
        },
      });

      // Lazy load Excel export lib at runtime using ESM dynamic import
      let ExcelCtor: any = null;
      try {
        const mod = await import("antd-table-saveas-excel");
        ExcelCtor = (mod as any)?.Excel ?? null;
      } catch (e) {
        ExcelCtor = null;
      }
      if (!ExcelCtor) {
        openErrorOverlay(
          "Excel экспорт хийх боломжгүй байна. 'antd-table-saveas-excel' санг суулгана уу."
        );
        return;
      }
      const excel = new ExcelCtor();

      const columns = ALL_COLUMNS.map((col) => ({
        title: col.label,
        dataIndex: col.key,
        key: col.key,
      }));

      // Prepare data source with computed fields (e.g., ognoo)
      const dataSrc = (response.data?.jagsaalt || []).map((row: any) => {
        const created = row.createdAt ? new Date(row.createdAt) : null;
        const updated = row.updatedAt ? new Date(row.updatedAt) : null;
        const showDate =
          updated && created && updated.getTime() !== created.getTime()
            ? updated
            : created || updated;
        return {
          ...row,
          ognoo: showDate ? showDate.toLocaleDateString("mn-MN") : undefined,
        };
      });

      excel
        .addSheet("Гэрээний жагсаалт")
        .addColumns(columns)
        .addDataSource(dataSrc)
        .saveAs("Гэрээний_жагсаалт.xlsx");

      openSuccessOverlay("Excel файл амжилттай татагдлаа");
    } catch (error) {
      openErrorOverlay("Excel файл татахад алдаа гарлаа");
    }
  };

  // Download residents Excel template
  const handleDownloadResidentsTemplate = async () => {
    try {
      const resp = await uilchilgee(token || undefined).get(
        `/orshinSuugchExcelTemplate`,
        { responseType: "blob" }
      );
      const blob = new Blob([resp.data], {
        type:
          resp.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orshin_suugch_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      openSuccessOverlay("Загвар амжилттай татагдлаа");
    } catch (e) {
      openErrorOverlay("Загвар татахад алдаа гарлаа");
    }
  };

  // Export residents list to Excel — prefers backend export; falls back to client-side if 404
  const handleExportResidentsExcel = async () => {
    try {
      if (!token) {
        openErrorOverlay("Нэвтрэх шаардлагатай");
        return;
      }

      // 1) Fetch latest residents list from API
      const exportTargetBarilgiinId = selectedBuildingId || barilgiinId || null;
      const queryObj = {
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: exportTargetBarilgiinId,
      };
      const listResp = await uilchilgee(token).get(`/orshinSuugch`, {
        params: {
          // fetch a very large page so we get all rows regardless of current
          // UI pagination. This avoids picking up only the current page's
          // results when the SWR hook's page size differs.
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
          // ensure backend returns residents only for the currently selected building
          baiguullagiinId: ajiltan?.baiguullagiinId,
          // include barilgiinId top-level too for backends that check it
          barilgiinId: exportTargetBarilgiinId,
          // include nested query as a JSON string (matches useOrshinSuugch fetcher)
          query: JSON.stringify(queryObj),
        },
      });
      const orshinSuugchList =
        (listResp?.data &&
          ((listResp.data as any).result || (listResp.data as any).jagsaalt)) ||
        listResp?.data ||
        [];

      // Prepare normalized list for export: ensure each row explicitly
      // references the selected building and override building-linked
      // display fields (name, nested medeelel) when the resident points to
      // a different building so the Excel shows the selected building's data.
      const normalizedOrshinSuugchList = (
        Array.isArray(orshinSuugchList) ? orshinSuugchList : []
      ).map((r: any) => {
        const topBar = r?.barilgiinId || r?.medeelel?.barilgiinId || null;
        const useBar = exportTargetBarilgiinId ?? topBar ?? null;
        const med =
          r?.medeelel && typeof r.medeelel === "object"
            ? { ...r.medeelel }
            : {};
        if (!med.barilgiinId && useBar) med.barilgiinId = useBar;

        const out: any = {
          ...r,
          barilgiinId: r?.barilgiinId ?? med.barilgiinId ?? useBar,
          medeelel: med,
        };

        // If resident refers to another building, override building-linked
        // labels so exporter cannot accidentally pick values from the main
        // building.
        try {
          const refersTo = String(
            r?.barilgiinId ?? r?.medeelel?.barilgiinId ?? ""
          );
          const sel = String(exportTargetBarilgiinId || "");
          if (sel && refersTo !== sel && selectedBarilga) {
            const sb: any = selectedBarilga;
            out.bairniiNer =
              sb?.ner || out.bairniiNer || out.medeelel?.bairniiNer || "";
            out.medeelel = { ...(out.medeelel || {}) };
            out.medeelel.bairniiNer = out.medeelel.bairniiNer || sb?.ner || "";
            // Avoid accidentally showing main-building-specific orts/toot values
            out.orts = out.orts || "";
            out.davkhar = out.davkhar || "";
            out.toot = out.toot || "";
          }
        } catch (e) {}

        return out;
      });

      // Prepare headers and ensure export rows include presentation fields
      // the server exporter expects (e.g., ognoo, mail, utas).
      const headers = [
        { key: "ovog", label: "Овог" },
        { key: "ner", label: "Нэр" },
        { key: "utas", label: "Утас" },
        { key: "mail", label: "И-мэйл" },
        { key: "orts", label: "Орц" },
        { key: "davkhar", label: "Давхар" },
        { key: "toot", label: "Тоот" },
        { key: "ognoo", label: "Үүссэн огноо" },
      ];

      const exportRows = normalizedOrshinSuugchList.map((r: any) => {
        const created = r?.createdAt ? new Date(r.createdAt) : null;
        const updated = r?.updatedAt ? new Date(r.updatedAt) : null;
        const showDate =
          updated && created && updated.getTime() !== created.getTime()
            ? updated
            : created || updated;
        return {
          ...r,
          utas: Array.isArray(r?.utas) ? r.utas.join(", ") : r?.utas,
          mail: r?.mail || r?.email,
          ognoo: showDate ? showDate.toLocaleDateString("mn-MN") : undefined,
        };
      });

      // 2) Try server-side generation first
      let served = false;
      try {
        const postBody: any = {
          data: exportRows,
          headers,
          fileName: "orshinSuugch_export",
          // include building id so server-side exporter can filter/label correctly
          baiguullagiinId: ajiltan?.baiguullagiinId,
          barilgiinId: exportTargetBarilgiinId,
          // also provide `query` object matching GET shape so exporter can use the same filters
          query: {
            baiguullagiinId: ajiltan?.baiguullagiinId,
            barilgiinId: exportTargetBarilgiinId,
          },
        };

        const excelResp = await uilchilgee(token).post(
          `/downloadExcelList`,
          postBody,
          { responseType: "blob" }
        );
        const blob = new Blob([excelResp.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "orshinSuugch_export.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        openSuccessOverlay("Оршин суугчдын Excel татагдлаа");
        served = true;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) throw err; // non-404 => show error
      }

      if (served) return;

      // 3) Fallback: client-side Excel generation
      let ExcelCtor: any = null;
      try {
        const mod = await import("antd-table-saveas-excel");
        ExcelCtor = (mod as any)?.Excel ?? null;
      } catch (_) {
        ExcelCtor = null;
      }
      if (!ExcelCtor) {
        openErrorOverlay(
          "Excel үүсгэхэд шаардлагатай 'antd-table-saveas-excel' сан байхгүй байна. Суулгаад дахин оролдоно уу."
        );
        return;
      }

      const excel = new ExcelCtor();
      const columns = [
        { title: "Овог", dataIndex: "ovog", key: "ovog" },
        { title: "Нэр", dataIndex: "ner", key: "ner" },

        { title: "Утас", dataIndex: "utas", key: "utas" },
        { title: "И-мэйл", dataIndex: "mail", key: "mail" },
        { title: "Орц", dataIndex: "orts", key: "orts" },

        { title: "Давхар", dataIndex: "davkhar", key: "davkhar" },
        { title: "Тоот", dataIndex: "toot", key: "toot" },
      ];

      const targetBarilgiinId = exportTargetBarilgiinId;
      let filteredList = Array.isArray(normalizedOrshinSuugchList)
        ? normalizedOrshinSuugchList
        : [];
      if (targetBarilgiinId) {
        filteredList = filteredList.filter((r: any) => {
          const cand =
            r?.barilgiinId || r?.medeelel?.barilgiinId || r?.baiguullagiinId;
          return String(cand || "") === String(targetBarilgiinId);
        });
      }

      const dataSrc = filteredList.map((r: any) => {
        const created = r?.createdAt ? new Date(r.createdAt) : null;
        const updated = r?.updatedAt ? new Date(r.updatedAt) : null;
        const showDate =
          updated && created && updated.getTime() !== created.getTime()
            ? updated
            : created || updated;
        return {
          ...r,
          utas: Array.isArray(r?.utas) ? r.utas.join(", ") : r?.utas,
          mail: r?.mail || r?.email,
          ognoo: showDate ? showDate.toLocaleDateString("mn-MN") : undefined,
        };
      });

      excel
        .addSheet("Оршин суугчид")
        .addColumns(columns)
        .addDataSource(dataSrc)
        .saveAs("orshinSuugch_export.xlsx");
      openSuccessOverlay("Оршин суугчдын Excel татагдлаа");
    } catch (e) {
      openErrorOverlay("Excel татахад алдаа гарлаа");
    }
  };

  // Trigger hidden input for residents Excel import
  const handleResidentsExcelImportClick = () => {
    residentExcelInputRef.current?.click();
  };

  // Handle residents Excel file import
  const onResidentsExcelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Capture the real input element immediately — React may recycle the synthetic
    // event after an await, which makes `e.currentTarget` null in finally blocks.
    const input = e.currentTarget as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      if (input) input.value = "";
      return;
    }
    try {
      setIsUploadingResidents(true);
      const form = new FormData();
      form.append("excelFile", file);
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      // Ensure we target the currently selected building (selectedBuildingId)
      // falling back to the auth-provided barilgiinId when none selected.
      const targetBarilgiinId = selectedBuildingId || barilgiinId || null;
      if (targetBarilgiinId) form.append("barilgiinId", targetBarilgiinId);

      const resp: any = await uilchilgee(token).post(
        `/orshinSuugchExcelImport`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // The backend may return 200 OK even when some rows failed. Inspect
      // response.result.failed and surface the backend-provided message or
      // details instead of always showing success.
      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        // Build a concise details string for the user
        const detailLines = failed
          .map(
            (f: any) =>
              `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`
          )
          .slice(0, 10); // limit to first 10 lines to avoid flooding
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        openSuccessOverlay("Оршин суугчдын Excel импорт амжилттай");
        await orshinSuugchJagsaaltMutate();
      }
    } catch (err) {
      // Try to show backend-provided error message when available
      const apiErr: any = err;
      const serverMsg =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        apiErr?.response?.data?.aldaa ||
        (typeof apiErr?.response?.data === "string"
          ? apiErr.response.data
          : null) ||
        apiErr?.message ||
        "Импорт хийхэд алдаа гарлаа";
      openErrorOverlay(String(serverMsg));
    } finally {
      setIsUploadingResidents(false);
      if (input) input.value = "";
    }
  };

  const handleDownloadUnitsTemplate = async () => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      const resp = await uilchilgee(token).get(`/tootBurtgelExcelTemplate`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "units_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      openErrorOverlay("Загвар татахад алдаа гарлаа");
    }
  };

  const handleUnitsExcelImportClick = () => {
    if (unitExcelInputRef.current) {
      unitExcelInputRef.current.click();
    }
  };

  const onUnitsExcelFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Capture the real input element immediately — React may recycle the synthetic
    // event after an await, which makes `e.currentTarget` null in finally blocks.
    const input = e.currentTarget as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      if (input) input.value = "";
      return;
    }
    try {
      setIsUploadingUnits(true);
      const form = new FormData();
      form.append("excelFile", file);
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      // Ensure we target the currently selected building (selectedBuildingId)
      // falling back to the auth-provided barilgiinId when none selected.
      const targetBarilgiinId = selectedBuildingId || barilgiinId || null;
      if (targetBarilgiinId) form.append("barilgiinId", targetBarilgiinId);

      const resp: any = await uilchilgee(token).post(
        `/tootBurtgelExcelImport`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // The backend may return 200 OK even when some rows failed. Inspect
      // response.result.failed and surface the backend-provided message or
      // details instead of always showing success.
      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        // Build a concise details string for the user
        const detailLines = failed
          .map(
            (f: any) =>
              `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`
          )
          .slice(0, 10); // limit to first 10 lines to avoid flooding
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        openSuccessOverlay("Тоот бүртгэлийн Excel импорт амжилттай");
        await baiguullagaMutate();
      }
    } catch (err) {
      // Try to show backend-provided error message when available
      const apiErr: any = err;
      const serverMsg =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        apiErr?.response?.data?.aldaa ||
        (typeof apiErr?.response?.data === "string"
          ? apiErr.response.data
          : null) ||
        apiErr?.message ||
        "Импорт хийхэд алдаа гарлаа";
      openErrorOverlay(String(serverMsg));
    } finally {
      setIsUploadingUnits(false);
      if (input) input.value = "";
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate basic fields
    if (!isValidName(newResident.ovog) || !isValidName(newResident.ner)) {
      openErrorOverlay(
        "Овог, Нэр зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    const _newResReg = String(newResident.register || "").trim();
    if (_newResReg !== "" && !isValidRegister(newResident.register)) {
      openErrorOverlay(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newResident.utas || [])) {
      openErrorOverlay(explainPhoneRule());
      return;
    }
    if (!newResident.nuutsUg || String(newResident.nuutsUg).length < 4) {
      openErrorOverlay("Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой.");
      return;
    }

    try {
      const firstPhone = Array.isArray(newResident.utas)
        ? newResident.utas.find((p: any) => String(p || "").trim() !== "") || ""
        : String(newResident.utas || "");

      const payload: any = {
        ner: newResident.ner,
        ovog: newResident.ovog,
        register: newResident.register,
        utas: firstPhone,
        email: newResident.mail,
        mail: newResident.mail,
        khayag: newResident.khayag,
        nevtrekhNer: newResident.nevtrekhNer || firstPhone,
        nuutsUg: newResident.nuutsUg,
        turul: newResident.turul,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        baiguullagiinNer: baiguullaga?.ner,
        erkh: "OrshinSuugch",
        taniltsuulgaKharakhEsekh: true,
      };

      if (newResident.aimag) payload.aimag = newResident.aimag;
      // Prefer user selections; fallback to organization profile
      const deriveStr = (val: any) =>
        typeof val === "string"
          ? val
          : typeof val?.ner === "string"
          ? val.ner
          : "";
      payload.duureg =
        newResident.duureg || deriveStr(selectedBarilga?.tokhirgoo?.duuregNer);
      payload.horoo =
        newResident.horoo || deriveStr(selectedBarilga?.tokhirgoo?.horoo?.ner);
      if (newResident.orts) payload.orts = newResident.orts;
      if (newResident.toot) payload.toot = newResident.toot;
      // Auto-fill building code/name for resident
      payload.soh =
        selectedBarilga?.tokhirgoo?.sohNer || baiguullaga?.ner || "";
      payload.barilgiinId = selectedBuildingId || barilgiinId || null;
      if (newResident.davkhar) payload.davkhar = newResident.davkhar;

      // Track newly created resident id for auto-contract creation
      let createdResidentId: string | null = null;

      if (editingResident?._id) {
        await updateMethod("orshinSuugch", token || "", {
          ...payload,
          _id: editingResident._id,
        });
      } else {
        const resp: any = await createMethod(
          "orshinSuugchBurtgey",
          token || "",
          payload
        );
        try {
          const respData = resp?.data ?? resp;
          // Try common shapes: { data: {...} } | {...}
          const created =
            respData?.data ||
            respData?.orshinSuugch ||
            (Array.isArray(respData?.jagsaalt)
              ? respData.jagsaalt[0]
              : respData);
          const idCandidate = created?._id || created?.id;
          createdResidentId = idCandidate ? String(idCandidate) : null;
        } catch (_) {
          createdResidentId = null;
        }
      }
      const wasEdit = Boolean(editingResident?._id);
      if (wasEdit) {
        openSuccessOverlay("оршин суугчийн мэдээлэл засагдлаа");
      } else {
        openSuccessOverlay("Оршин суугч нэмэгдлээ");
      }
      setShowResidentModal(false);
      setEditingResident(null);
      setCurrentStep(1);
      await orshinSuugchJagsaaltMutate();

      // Auto-create a basic contract for newly created resident
      if (!wasEdit && createdResidentId) {
        try {
          const today = new Date();
          const start = new Date(today);
          const end = new Date(today);
          // Default duration: 12 months
          end.setMonth(end.getMonth() + 12);

          const firstPhone = Array.isArray(newResident.utas)
            ? newResident.utas.find(
                (p: any) => String(p || "").trim() !== ""
              ) || ""
            : String(newResident.utas || "");

          const autoContract: any = {
            // Link to resident
            orshinSuugchId: createdResidentId,
            // Basic person fields copied for convenience
            ovog: newResident.ovog,
            ner: newResident.ner,
            register: newResident.register,
            utas: firstPhone ? [firstPhone] : [],
            mail: newResident.mail,
            khayag: newResident.khayag,

            // Contract meta
            turul: "Үндсэн",
            gereeniiDugaar: computeNextGereeDugaar(),
            gereeniiOgnoo: start.toISOString(),
            ekhlekhOgnoo: start.toISOString(),
            duusakhOgnoo: end.toISOString(),
            tulukhOgnoo: start.toISOString(),
            khugatsaa: 12,

            // Location details if present on resident form
            aimag: newResident.aimag,
            duureg: newResident.duureg,
            horoo: newResident.horoo,
            davkhar: newResident.davkhar,
            toot: newResident.toot,
          };

          const ok = await gereeUusgekh(autoContract);
          if (ok) {
            await gereeJagsaaltMutate();
            openSuccessOverlay("Гэрээ автоматаар үүсгэгдлээ");
          } else {
            openErrorOverlay(
              "Оршин суугч нэмэгдсэн боловч гэрээ үүсгэхэд алдаа гарлаа."
            );
          }
        } catch (e) {
          openErrorOverlay(
            "Оршин суугч нэмэгдсэн боловч гэрээ үүсгэх явцад алдаа гарлаа."
          );
        }
      }
      setActiveTab("residents");
    } catch (err) {
      openErrorOverlay("Нэмэхэд алдаа гарлаа");
    }
  };

  const handleEditResident = (p: any) => {
    const deriveStr = (val: any) =>
      typeof val === "string"
        ? val
        : typeof val?.ner === "string"
        ? val.ner
        : "";
    setEditingResident(p);
    setNewResident({
      ovog: p.ovog || "",
      ner: p.ner || "",
      register: p.register || "",
      utas: Array.isArray(p.utas)
        ? p.utas.map((u: any) => String(u))
        : p.utas
        ? [String(p.utas)]
        : [""],
      mail: p.mail || p.email || "",
      khayag: p.khayag || "",
      aimag: p.aimag || "Улаанбаатар",
      duureg:
        p.duureg || deriveStr(selectedBarilga?.tokhirgoo?.duuregNer) || "",
      horoo: p.horoo || deriveStr(selectedBarilga?.tokhirgoo?.horoo?.ner) || "",
      soh:
        p.soh || selectedBarilga?.tokhirgoo?.sohNer || baiguullaga?.ner || "",
      orts: p.orts || String(selectedBarilga?.tokhirgoo?.orts || ""),
      toot: p.toot || "",
      davkhar:
        p.davkhar ||
        (davkharOptions && davkharOptions.length > 0 ? davkharOptions[0] : ""),
      baiguullagiinId: p.baiguullagiinId || p.baiguullagiin_id || "",
      baiguullagiinNer: p.baiguullagiinNer || selectedBarilga?.ner || "",
      nevtrekhNer: p.nevtrekhNer || (p.utas ? String(p.utas) : "") || "",
      nuutsUg: p.nuutsUg || "",
      turul: p.turul || "Үндсэн",
    });
    setShowResidentModal(true);
  };

  const handleDeleteResident = async (p: any) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    // Confirmation is handled by the calling UI (ConfirmPopover)
    try {
      // 1) Find related contracts for this resident from the loaded contracts
      const related = Array.isArray(contracts)
        ? contracts.filter(
            (c: any) => String(c?.orshinSuugchId || "") === String(p?._id || "")
          )
        : [];

      for (const c of related) {
        try {
          if (c?._id) await gereeUstgakh(c._id);
        } catch (err) {}
      }

      await deleteMethod("orshinSuugch", token, p._id || p.id);

      try {
        const s = socket();
        s.emit("orshinSuugch.deleted", { id: p._id || p.id });
        for (const c of related) {
          if (c?._id) s.emit("geree.deleted", { id: c._id });
        }
      } catch (err) {}

      openSuccessOverlay("Устгагдлаа");

      await orshinSuugchJagsaaltMutate();
      await gereeJagsaaltMutate();
    } catch (e) {
      openErrorOverlay("Устгахад алдаа гарлаа");
    }
  };

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      const payload: any = {
        ovog: newEmployee.ovog,
        ner: newEmployee.ner,
        register: newEmployee.register,
        utas: newEmployee.utas,
        email: newEmployee.email,
        mail: newEmployee.email,
        albanTushaal: newEmployee.albanTushaal,
        ajildOrsonOgnoo: newEmployee.ajildOrsonOgnoo
          ? new Date(newEmployee.ajildOrsonOgnoo).toISOString()
          : undefined,
        nevtrekhNer: newEmployee.nevtrekhNer || newEmployee.utas,
        nuutsUg: newEmployee.nuutsUg,
        baiguullagiinId: ajiltan?.baiguullagiinId,
      };
      const curBid = selectedBuildingId || barilgiinId || null;
      payload.barilgiinId = curBid;
      // Also include array-based building assignment for backends expecting `barilguud`
      if (curBid) {
        payload.barilguud = [curBid];
      }

      let createdOrUpdatedId: any = null;
      if (editingEmployee?._id) {
        const resp: any = await updateMethod("ajiltan", token, {
          ...payload,
          _id: editingEmployee._id,
        });
        try {
          const d = resp?.data ?? resp;
          createdOrUpdatedId = d?._id || d?.id || editingEmployee._id;
        } catch (_) {}
        try {
          const s = socket();
          s.emit("ajiltan.updated", { id: createdOrUpdatedId });
        } catch (_) {}
      } else {
        const resp: any = await createMethod("ajiltan", token, payload);
        try {
          const d = resp?.data ?? resp;
          const created = d?.data || d;
          createdOrUpdatedId = created?._id || created?.id || null;
        } catch (_) {}
        try {
          const s = socket();
          s.emit("ajiltan.created", { id: createdOrUpdatedId });
        } catch (_) {}
      }

      openSuccessOverlay("Ажилтны мэдээлэл хадгалагдлаа");
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setNewEmployee({
        ovog: "",
        ner: "",
        register: "",
        utas: "",
        email: "",
        albanTushaal: "",
        ajildOrsonOgnoo: "",
        nevtrekhNer: "",
        nuutsUg: "",
      });
      await ajiltniiJagsaaltMutate();
      setActiveTab("employees");
    } catch (err) {
      // Check if backend returned a specific error message
      const errorMessage = (err as any)?.response?.data?.aldaa;
      if (errorMessage) {
        openErrorOverlay(errorMessage);
      } else {
        openErrorOverlay("Хадгалахад алдаа гарлаа");
      }
    }
  };

  const handleEditEmployee = (p: any) => {
    setEditingEmployee(p);
    setNewEmployee({
      ovog: p.ovog || "",
      ner: p.ner || "",
      register: p.register || "",
      utas: p.utas || "",
      email: p.email || p.mail || "",
      albanTushaal: p.albanTushaal || "",
      ajildOrsonOgnoo: p.ajildOrsonOgnoo
        ? new Date(p.ajildOrsonOgnoo).toISOString().split("T")[0]
        : "",
      nevtrekhNer: p.nevtrekhNer || p.utas || "",
      nuutsUg: "",
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (p: any) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    // Confirmation is handled by the calling UI (ConfirmPopover)
    try {
      await deleteMethod("ajiltan", token, p._id || p.id);
      try {
        const s = socket();
        s.emit("ajiltan.deleted", { id: p._id || p.id });
      } catch (_) {}
      openSuccessOverlay("Устгагдлаа");
      await ajiltniiJagsaaltMutate();
    } catch (e) {
      openErrorOverlay("Устгахад алдаа гарлаа");
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      openErrorOverlay("Бүх шаардлагатай талбарыг зөв бөглөнө үү");
      return;
    }

    // Friendly format errors
    if (!isValidName(newContract.ovog) || !isValidName(newContract.ner)) {
      openErrorOverlay(
        "Овог, Нэр талбар зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    const _contractReg = String(newContract.register || "").trim();
    if (_contractReg !== "" && !isValidRegister(newContract.register)) {
      openErrorOverlay(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newContract.utas || [])) {
      openErrorOverlay(explainPhoneRule());
      return;
    }

    const success = await gereeUusgekh(newContract);
    if (success) {
      setShowContractModal(false);
      await gereeJagsaaltMutate();
    }
  };

  const handleUpdateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingContract?._id) return;

    if (!isFormValid()) {
      openErrorOverlay("Бүх шаардлагатай талбарыг зөв бөглөнө үү");
      return;
    }
    if (!isValidName(newContract.ovog) || !isValidName(newContract.ner)) {
      openErrorOverlay(
        "Овог, Нэр талбар зөвхөн үсгээр бичигдсэн байх ёстой (тоо болон тусгай тэмдэгт хориотой)."
      );
      return;
    }
    const _updateContractReg = String(newContract.register || "").trim();
    if (_updateContractReg !== "" && !isValidRegister(newContract.register)) {
      openErrorOverlay(explainRegisterRule());
      return;
    }
    if (!areValidPhones(newContract.utas || [])) {
      openErrorOverlay(explainPhoneRule());
      return;
    }

    const success = await gereeZasakh(editingContract._id, newContract);
    if (success) {
      setEditingContract(null);
      setNewContract({
        ner: "",
        gereeTurul: "Үндсэн гэрээ",
        davkhar: "",
        toot: "",
        startDate: "",
        gereeniiDugaar: "",
        utas: "",
        email: "",
      });
      setShowContractModal(false);
      openSuccessOverlay("Гэрээ амжилттай засагдлаа");
      gereeJagsaaltMutate();
    }
  };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setCurrentStep(1);
    setNewContract((prev: any) => ({
      ...prev,
      // Personal / contract fields
      ovog: contract.ovog || contract.ownerOvog || "",
      ner: contract.ner || "",
      register: contract.register || "",
      // Contract meta
      gereeTurul: contract.gereeTurul || contract.turul || "",
      davkhar: contract.davkhar || "",
      toot: contract.toot || contract.toot || "",
      startDate: contract.startDate || contract.ekhlekhOgnoo || "",
      gereeniiDugaar: contract.gereeniiDugaar || "",
      // Always store as array for inputs that use .join(", ")
      utas: Array.isArray(contract.utas)
        ? contract.utas
        : contract.utas
        ? String(contract.utas)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [""],
      // Prefill SÖH phones too (array-safe)
      suhUtas: Array.isArray(contract.suhUtas)
        ? contract.suhUtas
        : contract.suhUtas
        ? String(contract.suhUtas)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [""],
      // Form binds to "mail", not "email"
      mail: contract.mail || contract.email || "",
      // Address / apartment info
      bairniiNer:
        contract.bairniiNer || contract.bairNer || contract.buildingName || "",
      orts: contract.orts || contract.orts || "",
      khayag: contract.khayag || contract.address || "",
      aimag: contract.aimag || "",
      duureg: contract.duureg || "",
      horoo: contract.horoo || "",
    }));
    setShowContractModal(true);
  };

  const handleDelete = async (id: string) => {
    // Confirmation is handled by the calling UI (ConfirmPopover)
    const success = await gereeUstgakh(id);
    if (success) {
      gereeJagsaaltMutate();
    }
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(`/geree/zagvar/gereeniiZagvar?id=${templateId}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      await uilchilgee(token).delete(`/gereeniiZagvar/${templateId}`);

      openSuccessOverlay("Загвар амжилттай устгагдлаа");

      zagvarJagsaaltMutate();
    } catch (error) {
      openErrorOverlay("Загвар устгахад алдаа гарлаа");
    }
  };
  const handlePreviewTemplate = async (templateId: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    try {
      const response = await uilchilgee(token).get(
        `/gereeniiZagvar/${templateId}`
      );
      setPreviewTemplate(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      openErrorOverlay("Загвар харахад алдаа гарлаа");
    }
  };
  const templates = [
    {
      id: 1,
      name: "Үндсэн гэрээний загвар",
      description: "Үндсэн гэрээний загвар файл",
      type: "Үндсэн гэрээ",
    },
    {
      id: 2,
      name: "Түр гэрээний загвар",
      description: "Түр гэрээний загвар файл",
      type: "Түр гэрээ",
    },
  ];

  // Keep derived fields in sync when modal opens or data loads
  useEffect(() => {
    if (showContractModal) {
      setNewContract((prev: any) => ({
        ...prev,
        gereeniiDugaar: prev.gereeniiDugaar || computeNextGereeDugaar(),
        uilchilgeeniiZardal: uilchilgeeNiit,
        // SӨХ info is auto-fetched from organization and read-only
        suhNer: baiguullaga?.ner || "",
        suhRegister: baiguullaga?.register || "",
        suhUtas: baiguullaga?.utas
          ? Array.isArray(baiguullaga.utas)
            ? baiguullaga.utas.map((u: any) => String(u))
            : [String(baiguullaga.utas)]
          : [],
        suhMail: baiguullaga?.email || "",
      }));
    }
  }, [showContractModal, uilchilgeeNiit, baiguullaga]);

  // Removed Step 4 (Төлбөр) and related invoice fetch.

  // Preview a processed contract template for a single contract (eye icon)
  const handlePreviewContractTemplate = async (gereeId: string) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    try {
      // Choose a template id: prefer the first available template from list
      const templateId =
        zagvaruud && zagvaruud[0]?._id
          ? String(zagvaruud[0]._id)
          : "690b0f42130c4a7c9d641fa9"; // fallback example id

      const resp = await uilchilgee(token).post("/gereeniiZagvarSoliyo", {
        gereeniiZagvariinId: templateId,
        gereeniiId: gereeId,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || undefined,
      });

      const d: any = resp?.data;
      const html =
        d?.aguulga ||
        d?.result?.aguulga ||
        (Array.isArray(d?.result) ? d.result[0]?.aguulga : null) ||
        (Array.isArray(d) ? d[0]?.aguulga : null) ||
        "";
      if (!html) {
        openErrorOverlay("Харах өгөгдөл олдсонгүй");
        return;
      }
      setPreviewTemplate({ aguulga: html });
      setShowPreviewModal(true);
    } catch (e) {
      openErrorOverlay("Загварыг боловсруулахад алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-start justify-between p-4 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-3xl font-bold text-theme"
            >
              Гэрээ
            </motion.h1>
            <div
              style={{ width: 64, height: 64 }}
              className="flex items-center"
            >
              <DotLottieReact
                src="https://lottie.host/97f6cb84-58da-46ef-811a-44e3203445c1/rQ76j6FHd8.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
          <p className="text-sm mt-1 text-subtle">
            Гэрээ, Оршин суугч, Ажилтны жагсаалтуудыг удирдах
          </p>

          <div className="flex mt-3 w-48 pointer-events-none select-none justify-start"></div>
          <div className="mt-3 flex flex-wrap items-center gap-2 tabbar">
            {/* Tabs */}
            <button
              id="tab-residents"
              onClick={() => setActiveTab("residents")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "residents"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Оршин суугч
            </button>
            <button
              id="tab-contracts"
              onClick={() => setActiveTab("contracts")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "contracts"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Гэрээ
            </button>

            <button
              id="tab-employees"
              onClick={() => setActiveTab("employees")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "employees"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Ажилтан
            </button>
            <button
              id="tab-units"
              onClick={() => setActiveTab("units")}
              className={`neu-btn px-5 py-2 text-sm font-semibold rounded-2xl ${
                activeTab === "units"
                  ? "neu-panel ring-1 ring-[color:var(--surface-border)] shadow-sm"
                  : "hover:scale-105"
              }`}
            >
              Тоот бүртгэл
            </button>
            {activeTab === "units" && ortsOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-theme whitespace-nowrap">
                  Орц сонгох
                </label>
                <div className="w-32">
                  <TusgaiZagvar
                    value={selectedOrts}
                    onChange={(val) => setSelectedOrts(val)}
                    options={ortsOptions.map((o) => ({ value: o, label: o }))}
                    className="w-full z-50"
                    placeholder={
                      ortsOptions.length === 0
                        ? "Орц тохируулаагүй"
                        : "Сонгох..."
                    }
                    disabled={ortsOptions.length === 0}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === "contracts" && (
            <>
              <button
                id="geree-new-btn"
                onClick={() => {
                  setEditingContract(null);
                  setCurrentStep(1);
                  setNewContract({
                    ovog: "",
                    ner: "",
                    register: "",
                    utas: [""],
                    mail: "",
                    khayag: "",
                    aimag: "",
                    duureg: "",
                    horoo: "",
                    baingiinKhayag: "",

                    gereeniiDugaar: computeNextGereeDugaar(),
                    gereeniiOgnoo: "",
                    turul: "Үндсэн",
                    ekhlekhOgnoo: "",
                    duusakhOgnoo: "",
                    tulukhOgnoo: "",
                    khugatsaa: 0,

                    suhNer: baiguullaga?.ner || "",
                    suhRegister: baiguullaga?.register || "",
                    suhUtas: baiguullaga?.utas
                      ? [String(baiguullaga.utas)]
                      : [""],
                    suhMail: baiguullaga?.email || "",
                    suhGariinUseg: "",
                    suhTamga: "",
                    suhTulbur: "",
                    suhTulburUsgeer: "",
                    suhKhugatsaa: 0,
                    sukhKhungulult: 0,
                    // Auto from utilization expenses
                    uilchilgeeniiZardal: uilchilgeeNiit,
                    uilchilgeeniiZardalUsgeer: "",
                    niitTulbur: 0,
                    niitTulburUsgeer: "",
                    bairniiNer: "",
                    orts: "",
                    toot: 0,
                    talbainKhemjee: "",
                    zoriulalt: "",
                    davkhar:
                      davkharOptions && davkharOptions.length > 0
                        ? davkharOptions[0]
                        : "",
                    burtgesenAjiltan: "",
                    temdeglel: "",
                    actOgnoo: "",
                    tooluuriinDugaar: "",
                    baritsaaAvakhDun: 0,
                    // login fields (unused for contract mode)
                    nevtrekhNer: "",
                    nuutsUg: "",
                  });
                  setShowContractModal(true);
                }}
                className="btn-minimal"
              >
                <FilePlus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Гэрээ байгуулах
                </span>
              </button>
              <button
                id="geree-templates-btn"
                onClick={() => setShowList2Modal(true)}
                className="btn-minimal"
                aria-label="Гэрээний загварууд"
                title="Гэрээний загварууд"
              >
                <LayoutTemplate className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар үүсгэх
                </span>
              </button>
              {/* <button
                id="geree-download-template-btn"
                onClick={() => setShowTemplatesModal(true)}
                className="btn-minimal"
                aria-label="Загвар татах"
                title="Загвар татах"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">Татах</span>
              </button> */}
            </>
          )}
          {activeTab === "residents" && (
            <>
              <button
                onClick={() => {
                  const deriveStr = (val: any) =>
                    typeof val === "string"
                      ? val
                      : typeof val?.ner === "string"
                      ? val.ner
                      : "";
                  setCurrentStep(1);
                  setEditingContract(null);
                  setEditingResident(null);
                  setNewResident({
                    ovog: "",
                    ner: "",
                    register: "",
                    utas: [""],
                    davkhar:
                      davkharOptions && davkharOptions.length > 0
                        ? davkharOptions[0]
                        : "",
                    mail: "",
                    khayag: "",
                    aimag: "Улаанбаатар",
                    duureg:
                      deriveStr(selectedBarilga?.tokhirgoo?.duuregNer) || "",
                    horoo:
                      deriveStr(selectedBarilga?.tokhirgoo?.horoo?.ner) || "",
                    orts: String(selectedBarilga?.tokhirgoo?.orts || ""),
                    toot: "",
                    soh:
                      selectedBarilga?.tokhirgoo?.sohNer ||
                      baiguullaga?.ner ||
                      "",
                    baiguullagiinNer: selectedBarilga?.ner || "",
                    nevtrekhNer: "",
                    nuutsUg: "",
                    turul: "Үндсэн",
                  });
                  setShowResidentModal(true);
                }}
                className="btn-minimal"
                id="resident-new-btn"
                aria-label="Оршин суугч нэмэх"
                title="Оршин суугч нэмэх"
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Оршин суугч нэмэх
                </span>
              </button>

              <button
                onClick={handleExportResidentsExcel}
                className="btn-minimal"
                aria-label="Оршин суугч Excel татах"
                title="Оршин суугчдын Excel татах"
                id="resident-download-list-btn"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Жагсаалт татах
                </span>
              </button>

              <button
                onClick={handleDownloadResidentsTemplate}
                className="btn-minimal"
                id="resident-download-template-btn"
                aria-label="Загвар татах"
                title="Оршин суугчийн Excel загвар татах"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар татах
                </span>
              </button>

              <button
                onClick={handleResidentsExcelImportClick}
                className="btn-minimal"
                id="resident-upload-template-btn"
                disabled={isUploadingResidents}
                aria-label="Excel-ээс импортлох"
                title="Excel-ээс оршин суугчдыг импортлох"
              >
                <FileUp className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар оруулах
                </span>
              </button>
              <input
                ref={residentExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onResidentsExcelFileChange}
                className="hidden"
              />
            </>
          )}
          {activeTab === "employees" && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setNewEmployee({
                  ovog: "",
                  ner: "",
                  register: "",
                  utas: "",
                  email: "",
                  albanTushaal: "",
                  ajildOrsonOgnoo: "",
                  nevtrekhNer: "",
                  nuutsUg: "",
                });
                setShowEmployeeModal(true);
              }}
              className="btn-minimal"
              aria-label="Ажилтан нэмэх"
              title="Ажилтан нэмэх"
              id="employees-new-btn"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline text-xs ml-1">
                Ажилтан нэмэх
              </span>
            </button>
          )}

          {activeTab === "units" && (
            <>
              <button
                onClick={handleDownloadUnitsTemplate}
                className="btn-minimal"
                id="units-download-template-btn"
                aria-label="Загвар татах"
                title="Тоот бүртгэлийн Excel загвар татах"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар татах
                </span>
              </button>

              <button
                onClick={handleUnitsExcelImportClick}
                className="btn-minimal"
                id="units-upload-template-btn"
                disabled={isUploadingUnits}
                aria-label="Excel-ээс импортлох"
                title="Excel-ээс тоот бүртгэлийг импортлох"
              >
                <FileUp className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">
                  Загвар оруулах
                </span>
              </button>
              <input
                ref={unitExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onUnitsExcelFileChange}
                className="hidden"
              />
            </>
          )}

          {activeTab === "contracts" && (
            <div className="relative flex-shrink-0" ref={columnMenuRef}>
              <button
                id="geree-columns-btn"
                onClick={() => setShowColumnSelector((s) => !s)}
                className="btn-minimal"
                aria-expanded={showColumnSelector}
                aria-haspopup="menu"
                aria-label="Багана сонгох"
                title="Багана сонгох"
              >
                <Columns3Cog className="w-5 h-5" />
                <span className="hidden sm:inline text-xs ml-1">Багана</span>
              </button>

              {showColumnSelector && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl menu-surface p-3 z-[80]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-theme">
                      Багана
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs px-2 py-1"
                        onClick={() =>
                          setVisibleColumns(ALL_COLUMNS.map((c) => c.key))
                        }
                      >
                        Бүгд
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1"
                        onClick={() =>
                          setVisibleColumns(
                            ALL_COLUMNS.filter(
                              (c) =>
                                c.default && !DEFAULT_HIDDEN.includes(c.key)
                            ).map((c) => c.key)
                          )
                        }
                      >
                        Үндсэн
                      </button>
                    </div>
                  </div>
                  <div className="max-h-70 overflow-y-auto space-y-1">
                    {ALL_COLUMNS.map((col) => {
                      const checked = visibleColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 text-sm text-theme hover:bg-[color:var(--surface-hover)] px-2 py-1.5 rounded-2xl cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setVisibleColumns((prev) =>
                                prev.includes(col.key)
                                  ? prev.filter((k) => k !== col.key)
                                  : [...prev, col.key]
                              )
                            }
                            style={{ accentColor: "var(--panel-text)" }}
                          />
                          {col.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === "units" && (
        <div>
          <div className="flex items-center justify-between">
            {isSavingUnits && (
              <div className="text-xs text-slate-500">Хадгалж байна…</div>
            )}
          </div>

          {davkharOptions.length === 0 ? (
            <div className="p-3 rounded-md border border-amber-300 text-amber-700 text-sm">
              Давхарын тохиргоо хийгдээгүй байна. Эхлээд "Барилгын тохиргоо"
              дээрээс давхар оруулна уу.
            </div>
          ) : (
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
                    <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow relative">
                      <div
                        className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full"
                        id="units-table"
                      >
                        <table className="table-ui text-xs min-w-full">
                          <thead className="z-10 bg-white dark:bg-gray-800">
                            <tr>
                              <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                                №
                              </th>
                              <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
                                Давхар
                              </th>
                              <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
                                Тоотууд
                              </th>
                              <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
                                Үйлдэл
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentFloors.map((floor, idx) => {
                              const existing =
                                (selectedBarilga?.tokhirgoo &&
                                  (selectedBarilga.tokhirgoo as any)
                                    .davkhariinToonuud) ||
                                {};
                              const key = composeKey(selectedOrts, floor);
                              const units = existing[key] || [];
                              return (
                                <tr
                                  key={floor}
                                  className="transition-colors border-b last:border-b-0"
                                >
                                  <td className="p-1 text-center text-theme">
                                    {(unitPage - 1) * unitPageSize + idx + 1}
                                  </td>
                                  <td className="p-1 text-center text-theme">
                                    {floor}-р давхар
                                  </td>
                                  <td className="p-1 text-center text-theme">
                                    {units.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 justify-center">
                                        {units.map((t: any) => (
                                          <span
                                            key={String(t)}
                                            className="inline-flex gap-1 px-2 py-1 rounded-full text-xs  text-theme"
                                          >
                                            {String(t)}
                                            <button
                                              className="ml-1 text-red-500 hover:text-red-600"
                                              aria-label="Устгах"
                                              onClick={() => {
                                                setUnitToDelete({
                                                  floor,
                                                  unit: String(t),
                                                });
                                                setShowDeleteUnitModal(true);
                                              }}
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-slate-500">
                                        Бүртгэлгүй
                                      </div>
                                    )}
                                    {/* {editingFloor === floor && (
                                      <div className="mt-2 flex gap-2 items-center justify-center">
                                        <input
                                          type="text"
                                          value={unitInputs[floor] || ""}
                                          onChange={(e) =>
                                            setUnitInputs((prev) => ({
                                              ...prev,
                                              [floor]: e.target.value,
                                            }))
                                          }
                                          placeholder="Тоот оруулах..."
                                          className="px-2 py-1 text-xs border border-gray-300 rounded-md w-20"
                                        />
                                        <button
                                          className="p-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                          onClick={async () => {
                                            const raw = String(
                                              unitInputs[floor] || ""
                                            ).trim();
                                            if (!raw) return;
                                            if (units.includes(raw)) {
                                              openErrorOverlay(
                                                "Давхардсан тоот байна"
                                              );
                                              return;
                                            }
                                            try {
                                              setIsSavingUnits(true);
                                              const updatedBarilguud = (
                                                baiguullaga?.barilguud || []
                                              ).map((b: any) => {
                                                if (
                                                  String(b._id) !==
                                                  String(
                                                    selectedBuildingId ||
                                                      barilgiinId
                                                  )
                                                )
                                                  return b;
                                                const existing =
                                                  (b.tokhirgoo &&
                                                    (b.tokhirgoo as any)
                                                      .davkhariinToonuud) ||
                                                  {};
                                                const nextMap: Record<
                                                  string,
                                                  string[]
                                                > = {
                                                  ...existing,
                                                  [key]: Array.from(
                                                    new Set([
                                                      ...(existing[key] || []),
                                                      raw,
                                                    ])
                                                  ),
                                                };
                                                return {
                                                  ...b,
                                                  tokhirgoo: {
                                                    ...(b.tokhirgoo || {}),
                                                    davkhariinToonuud: nextMap,
                                                  },
                                                };
                                              });
                                              const payload = {
                                                ...(baiguullaga as any),
                                                _id: baiguullaga?._id,
                                                barilguud: updatedBarilguud,
                                              };
                                              const res =
                                                await updateBaiguullaga(
                                                  token || undefined,
                                                  (baiguullaga as any)
                                                    ._id as string,
                                                  payload
                                                );
                                              if (res)
                                                await baiguullagaMutate(
                                                  res,
                                                  false
                                                );
                                              await baiguullagaMutate();
                                              setUnitInputs((prev) => ({
                                                ...prev,
                                                [floor]: "",
                                              }));
                                              openSuccessOverlay(
                                                "Тоот нэмэгдлээ"
                                              );
                                            } catch (e) {
                                              openErrorOverlay(
                                                "Хадгалах явцад алдаа гарлаа"
                                              );
                                            } finally {
                                              setIsSavingUnits(false);
                                            }
                                          }}
                                          title="Тоот нэмэх"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )} */}
                                  </td>
                                  <td className="p-1 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Quick add: prompt the user and call existing addUnit helper so it's fast and requires no extra clicks */}
                                      <button
                                        className="p-1 rounded-2xl hover-surface transition-colors"
                                        title="Шинэ тоот нэмэх"
                                        onClick={() => {
                                          // open modal to add toot instead of window.prompt
                                          setAddTootFloor(floor);
                                          setAddTootValue("");
                                          setShowAddTootModal(true);
                                        }}
                                      >
                                        <Plus className="w-4 h-4 text-blue-500" />
                                      </button>

                                      {/* <button
                                        className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                                        onClick={() =>
                                          setEditingFloor(
                                            editingFloor === floor
                                              ? null
                                              : floor
                                          )
                                        }
                                        title="Тоот засах"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button> */}
                                      <button
                                        className="p-1 rounded-2xl action-delete hover-surface transition-colors"
                                        title="Давхрын тоотуудыг устгах"
                                        onClick={() => {
                                          setFloorToDelete(floor);
                                          setShowDeleteFloorModal(true);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
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
                    <div className="text-theme/70">
                      Нийт: {floorsList.length}
                    </div>
                    <div className="flex items-center gap-3">
                      <PageSongokh
                        value={unitPageSize}
                        onChange={(v) => {
                          setUnitPageSize(v);
                          setUnitPage(1);
                        }}
                        className="text-xs px-2"
                      />

                      <div
                        id="units-pagination"
                        className="flex items-center gap-1"
                      >
                        <button
                          className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
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
                          className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                          disabled={unitPage >= unitTotalPages}
                          onClick={() => {
                            const newPage = Math.min(
                              unitTotalPages,
                              unitPage + 1
                            );
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
          )}
        </div>
      )}

      {activeTab === "contracts" &&
        (isValidatingGeree ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div>
            <div className="table-surface overflow-visible rounded-2xl w-full">
              <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow relative">
                <div
                  className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full"
                  id="geree-table"
                >
                  <table className="table-ui text-xs min-w-full">
                    <thead className="z-10 bg-white dark:bg-gray-800">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                          №
                        </th>
                        {visibleColumns.map((columnKey) => {
                          const column = ALL_COLUMNS.find(
                            (col) => col.key === columnKey
                          );
                          return (
                            <th
                              key={columnKey}
                              className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit"
                            >
                              {column?.label}
                            </th>
                          );
                        })}
                        <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentContracts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="p-8 text-center text-subtle"
                          >
                            Гэрээ олдсонгүй
                          </td>
                        </tr>
                      ) : (
                        currentContracts.map((contract: any, idx: number) => (
                          <tr
                            key={contract._id || idx}
                            className="transition-colors border-b last:border-b-0"
                          >
                            <td className="p-1 text-center text-theme">
                              {startIndex + idx + 1}
                            </td>
                            {visibleColumns.map((columnKey) => {
                              const alignClass =
                                columnKey === "ner" ||
                                columnKey === "bairniiNer"
                                  ? "cell-left"
                                  : columnKey === "sariinTurees" ||
                                    columnKey === "baritsaaniiUldegdel"
                                  ? "cell-right"
                                  : "text-center";
                              return (
                                <td
                                  key={columnKey}
                                  className={`p-1 text-theme whitespace-nowrap ${alignClass}`}
                                >
                                  {renderCellValue(contract, columnKey)}
                                </td>
                              );
                            })}
                            <td className="p-1 whitespace-nowrap">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEdit(contract)}
                                  className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                                  title="Засах"
                                  id="geree-edit-btn"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handlePreviewContractTemplate(
                                      String(contract._id)
                                    )
                                  }
                                  className="p-1 rounded-2xl hover-surface transition-colors"
                                  title="Харах"
                                  id="geree-eye-btn"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 py-1 gap-3 text-md">
                <div className="text-theme/70">
                  Нийт: {filteredContracts.length}
                </div>

                <div className="flex items-center gap-3">
                  <PageSongokh
                    value={rowsPerPage}
                    onChange={(v) => {
                      setRowsPerPage(v);
                      setCurrentPage(1);
                      setGereeKhuudaslalt({
                        khuudasniiDugaar: 1,
                        khuudasniiKhemjee: v,
                        search: searchTerm,
                      });
                    }}
                    className="text-xs px-2"
                  />

                  <div
                    id="geree-pagination"
                    className="flex items-center gap-1"
                  >
                    <button
                      className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                      }}
                    >
                      Өмнөх
                    </button>
                    <div className="text-theme/70 px-1">{currentPage}</div>
                    <button
                      className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                    >
                      Дараах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

      {activeTab === "residents" &&
        (isValidatingSuugch ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div className="table-surface overflow-hidden rounded-2xl w-full">
            <div className="rounded-3xl p-6 neu-table allow-overflow">
              <div
                className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full "
                id="resident-table"
              >
                <table className="table-ui text-xs min-w-full">
                  <thead className="z-10 bg-white dark:bg-gray-800">
                    <tr>
                      <th className="p-1 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                        №
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Нэр
                      </th>

                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Холбоо барих
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Төлөв
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!currentResidents.length ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-subtle">
                          Хайсан мэдээлэл алга байна
                        </td>
                      </tr>
                    ) : (
                      currentResidents.map((p: any, idx: number) => (
                        <tr
                          key={p._id || idx}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-1 text-center text-theme">
                            {(resPage - 1) * resPageSize + idx + 1}
                          </td>
                          <td className="p-1 text-theme whitespace-nowrap cell-left">
                            {typeof p.ner === "object"
                              ? `${p.ner?.ner || ""} ${
                                  p.ner?.kod || ""
                                }`.trim() || "-"
                              : p.ner || "-"}
                          </td>
                          <td className="p-1 text-center">
                            <div className="text-xs text-theme">{p.utas}</div>
                          </td>
                          <td className="p-1 text-center">
                            {(() => {
                              const id = String(p?._id || "");
                              const label =
                                id && tuluvByResidentId[id]
                                  ? (tuluvByResidentId[id] as any)
                                  : getPaymentStatusLabel(p);
                              const cls =
                                label === "Төлсөн"
                                  ? "badge-paid"
                                  : label === "Хугацаа хэтэрсэн"
                                  ? "bg-red-500 text-red-800"
                                  : label === "Төлөөгүй"
                                  ? "badge-unpaid"
                                  : "badge-neutral";
                              return (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
                                >
                                  {label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-1 whitespace-nowrap">
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => handleEditResident(p)}
                                className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                                title="Засах"
                                id="resident-edit-btn"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResidentToDelete(p);
                                  setShowDeleteResidentModal(true);
                                }}
                                className="p-1 rounded-2xl action-delete hover-surface transition-colors"
                                title="Устгах"
                                id="resident-delete-btn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 py-1 text-md">
              <div className="text-theme/70">Нийт: {residentsList.length}</div>
              <div className="flex items-center gap-3">
                <PageSongokh
                  value={resPageSize}
                  onChange={(v) => {
                    setResPageSize(v);
                    setResPage(1);
                  }}
                  className="text-xs px-2"
                />

                <div
                  id="resident-pagination"
                  className="flex items-center gap-1"
                >
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={resPage <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, resPage - 1);
                      setResPage(newPage);
                    }}
                  >
                    Өмнөх
                  </button>
                  <div className="text-theme/70 px-1">{resPage}</div>
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={resPage >= resTotalPages}
                    onClick={() => {
                      const newPage = Math.min(resTotalPages, resPage + 1);
                      setResPage(newPage);
                    }}
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

      {activeTab === "employees" &&
        (isValidatingAjiltan ? (
          <div className="text-center py-8 text-subtle">Уншиж байна...</div>
        ) : (
          <div className="table-surface overflow-hidden rounded-2xl w-full">
            <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
              <div
                className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full"
                id="employees-table"
              >
                <table className="table-ui text-xs min-w-full">
                  <thead className="z-10 bg-white dark:bg-gray-800">
                    <tr>
                      <th className="p-1 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                        №
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Нэр
                      </th>

                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Холбоо барих
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Албан тушаал
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Эрх
                      </th>
                      <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!currentEmployees.length ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-subtle">
                          Хайсан мэдээлэл алга байна
                        </td>
                      </tr>
                    ) : (
                      currentEmployees.map((p: any, idx: number) => (
                        <tr
                          key={p._id || idx}
                          className="transition-colors border-b last:border-b-0"
                        >
                          <td className="p-1 text-center text-theme">
                            {(empPage - 1) * empPageSize + idx + 1}
                          </td>
                          <td className="p-1 text-theme whitespace-nowrap cell-left">
                            {typeof p.ner === "object"
                              ? `${p.ner?.ner || ""} ${
                                  p.ner?.kod || ""
                                }`.trim() || "-"
                              : p.ner || "-"}
                          </td>

                          <td className="p-1 text-center">
                            <div className="text-xs text-theme">{p.utas}</div>
                          </td>
                          <td className="p-1 text-center">
                            {p.albanTushaal || "-"}
                          </td>
                          <td className="p-1 text-center">{p.erkh || "-"}</td>
                          <td className="p-1 whitespace-nowrap">
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => handleEditEmployee(p)}
                                className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                                title="Засах"
                                id="employees-edit-btn"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEmployeeToDelete(p);
                                  setShowDeleteEmployeeModal(true);
                                }}
                                className="p-1 rounded-2xl action-delete hover-surface transition-colors"
                                title="Устгах"
                                id="employees-delete-btn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 py-1 text-md">
              <div className="text-theme/70">Нийт: {employeesList.length}</div>
              <div className="flex items-center gap-3">
                <PageSongokh
                  value={empPageSize}
                  onChange={(v) => {
                    setEmpPageSize(v);
                    setEmpPage(1);
                  }}
                  className="text-xs px-2 py-1"
                />

                <div
                  id="employee-pagination"
                  className="flex items-center gap-1"
                >
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={empPage <= 1}
                    onClick={() => {
                      const newPage = Math.max(1, empPage - 1);
                      setEmpPage(newPage);
                    }}
                  >
                    Өмнөх
                  </button>
                  <div className="text-theme/70 px-1">{empPage}</div>
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={empPage >= empTotalPages}
                    onClick={() => {
                      const newPage = Math.min(empTotalPages, empPage + 1);
                      setEmpPage(newPage);
                    }}
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

      <AnimatePresence>
        {showContractModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={contractRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative overflow-y-auto custom-scrollbar modal-surface modal-responsive w-full max-w-4xl md:max-w-5xl lg:max-w-6xl h-[88svh] max-h-[92svh] rounded-2xl shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingContract ? "Гэрээ засах" : "Шинэ гэрээ байгуулах"}
                  </h2>
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={
                    editingContract
                      ? handleUpdateContract
                      : handleCreateContract
                  }
                  className="flex-1 flex flex-col min-h-0"
                >
                  {
                    <div className="px-6 my-6">
                      {/* Mobile compact stepper (numbers only) */}
                      <div className="md:hidden overflow-x-auto -mx-6 px-6">
                        <div className="flex justify-center gap-4 min-w-max">
                          {[
                            "Хувийн мэдээлэл",
                            "Гэрээний дугаар",
                            "СӨХ мэдээлэл",
                          ].map((label, i) => {
                            const step = i + 1;
                            const active = currentStep === step;
                            const done = currentStep > step;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setCurrentStep(step)}
                                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                  active
                                    ? "bg-sky-700 text-white"
                                    : done
                                    ? "bg-blue-200 text-slate-800"
                                    : "bg-gray-200 text-slate-700"
                                }`}
                                aria-current={active ? "step" : undefined}
                                aria-label={`Алхам ${step}: ${label}`}
                                title={label}
                              >
                                {step}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Desktop stepper with labels */}
                      <div className="hidden md:flex justify-center gap-3">
                        {[
                          "Хувийн мэдээлэл",
                          "Гэрээний дугаар",
                          "СӨХ мэдээлэл",
                        ].map((label, i) => {
                          const step = i + 1;
                          const active = currentStep === step;
                          const done = currentStep > step;
                          return (
                            <div
                              key={label}
                              className="flex items-center gap-2"
                            >
                              <button
                                type="button"
                                onClick={() => setCurrentStep(step)}
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold focus:outline-none transition-colors ${
                                  active
                                    ? "bg-sky-700 text-white"
                                    : done
                                    ? "bg-blue-200 text-slate-800"
                                    : "bg-gray-200 text-slate-700"
                                }`}
                                aria-current={active ? "step" : undefined}
                                aria-label={`Алхам ${step}: ${label}`}
                                title={label}
                              >
                                {step}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(step)}
                                className={`text-sm focus:outline-none ${
                                  active
                                    ? "text-slate-700 font-semibold"
                                    : "text-slate-600"
                                }`}
                                title={label}
                                aria-hidden={false}
                              >
                                {label}
                              </button>
                              {step < 3 && (
                                <div className="w-8 h-[2px] bg-gray-200 mx-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  }
                  <div
                    className={`flex-1 overflow-y-auto md:overflow-visible px-6 space-y-6 ${
                      currentStep !== 1 ? "pb-32" : "pb-8"
                    } md:pb-6 min-h-0`}
                  >
                    <div className="min-h-[60vh]">
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Гэрээний төрөл
                              </label>
                              <TusgaiZagvar
                                value={newContract.turul}
                                onChange={(val) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    turul: val,
                                  }))
                                }
                                options={[
                                  { value: "Үндсэн", label: "Үндсэн" },
                                  { value: "Түр", label: "Түр" },
                                ]}
                                className="w-full"
                                placeholder="Сонгох..."
                              />
                            </div>
                          }
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Овог
                            </label>
                            <input
                              type="text"
                              value={newContract.ovog}
                              onChange={(e) => {
                                const value = e.target.value.replace(
                                  /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                                  ""
                                );
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  ovog: value,
                                }));
                              }}
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              required
                            />
                            {currentStep === 1 &&
                              (!newContract.ovog ||
                                !isValidName(newContract.ovog)) && (
                                <p className="text-xs text-red-600 mt-1">
                                  Зөв овог оруулна уу
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Нэр
                            </label>
                            <input
                              type="text"
                              value={newContract.ner}
                              onChange={(e) => {
                                const value = e.target.value.replace(
                                  /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                                  ""
                                );
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  ner: value,
                                }));
                              }}
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              required
                            />
                            {currentStep === 1 &&
                              (!newContract.ner ||
                                !isValidName(newContract.ner)) && (
                                <p className="text-xs text-red-600 mt-1">
                                  Зөв нэр оруулна уу
                                </p>
                              )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Утас
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={8}
                              value={(newContract.utas?.[0] as any) || ""}
                              onChange={(e) => {
                                const digits = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 8);
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  utas: [digits],
                                }));
                              }}
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              required
                            />
                            {currentStep === 1 &&
                              (!hasAnyPhone(newContract.utas) ||
                                !areValidPhones(newContract.utas)) && (
                                <p className="text-xs text-red-600 mt-1">
                                  {explainPhoneRule()}
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Байрны нэр
                            </label>
                            <input
                              type="text"
                              value={newContract.bairniiNer}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  bairniiNer: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Орц
                            </label>
                            <input
                              type="text"
                              value={newContract.orts}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  orts: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Тоот
                            </label>
                            <input
                              type="number"
                              value={newContract.toot}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  toot: Number(e.target.value),
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Давхар
                            </label>
                            {davkharOptions && davkharOptions.length > 0 ? (
                              <TusgaiZagvar
                                value={newContract.davkhar}
                                onChange={(val) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    davkhar: val,
                                  }))
                                }
                                options={davkharOptions.map((d) => ({
                                  value: d,
                                  label: d,
                                }))}
                                className="w-full"
                                placeholder="Сонгох..."
                              />
                            ) : (
                              <input
                                type="text"
                                value={newContract.davkhar}
                                onChange={(e) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    davkhar: e.target.value,
                                  }))
                                }
                                className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              И-мэйл
                            </label>
                            <input
                              type="email"
                              value={newContract.mail}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  mail: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Аймаг
                            </label>
                            <TusgaiZagvar
                              value={newContract.aimag}
                              onChange={(val) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  aimag: val,
                                  khayag: val,
                                  duureg: "",
                                  horoo: "",
                                }))
                              }
                              options={mongoliaProvinces.map((p) => ({
                                value: p,
                                label: p,
                              }))}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                            {currentStep === 1 &&
                              !String(newContract.aimag || "").trim() && (
                                <p className="text-xs text-red-600 mt-1">
                                  Аймаг сонгоно уу
                                </p>
                              )}
                          </div>
                          {newContract.aimag === "Улаанбаатар" ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Дүүрэг
                                </label>
                                <TusgaiZagvar
                                  value={newContract.duureg}
                                  onChange={(val) =>
                                    setNewContract((prev: any) => ({
                                      ...prev,
                                      duureg: val,
                                      horoo: "",
                                    }))
                                  }
                                  options={(
                                    districts[newContract.aimag] || []
                                  ).map((d) => ({ value: d, label: d }))}
                                  className="w-full"
                                  placeholder="Сонгох..."
                                />
                                {currentStep === 1 &&
                                  String(newContract.aimag) === "Улаанбаатар" &&
                                  !String(newContract.duureg || "").trim() && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Дүүрэг сонгоно уу
                                    </p>
                                  )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  Хороо
                                </label>
                                <TusgaiZagvar
                                  value={newContract.horoo}
                                  onChange={(val) =>
                                    setNewContract((prev: any) => ({
                                      ...prev,
                                      horoo: val,
                                    }))
                                  }
                                  options={(
                                    subDistricts[newContract.duureg] || []
                                  ).map((sd) => ({ value: sd, label: sd }))}
                                  className="w-full"
                                  placeholder="Сонгох..."
                                />
                                {currentStep === 1 &&
                                  String(newContract.aimag) === "Улаанбаатар" &&
                                  !String(newContract.horoo || "").trim() && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Хороо сонгоно уу
                                    </p>
                                  )}
                              </div>
                            </>
                          ) : newContract.aimag ? (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Сум
                              </label>
                              <TusgaiZagvar
                                value={newContract.duureg}
                                onChange={(val) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    duureg: val,
                                  }))
                                }
                                options={(
                                  districts[newContract.aimag] || []
                                ).map((d) => ({ value: d, label: d }))}
                                className="w-full"
                                placeholder="Сонгох..."
                              />
                            </div>
                          ) : null}
                          {newContract.turul !== "Үндсэн" && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Байнгын хаяг
                              </label>
                              <input
                                type="text"
                                value={newContract.baingiinKhayag}
                                onChange={(e) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    baingiinKhayag: e.target.value,
                                  }))
                                }
                                className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {null}

                      {currentStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Гэрээний дугаар
                            </label>
                            <input
                              type="text"
                              value={newContract.gereeniiDugaar}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  gereeniiDugaar: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                            {currentStep === 2 &&
                              !String(
                                newContract.gereeniiDugaar || ""
                              ).trim() && (
                                <p className="text-xs text-red-600 mt-1">
                                  Гэрээний дугаар оруулна уу
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Гэрээний огноо
                            </label>
                            <DatePickerInput
                              className="w-full border"
                              locale="mn"
                              value={
                                newContract.gereeniiOgnoo
                                  ? new Date(newContract.gereeniiOgnoo)
                                  : null
                              }
                              onChange={(value) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  gereeniiOgnoo: value
                                    ? dayjs(value).format("YYYY-MM-DD")
                                    : "",
                                }))
                              }
                              classNames={{
                                input:
                                  "text-theme neu-panel placeholder:text-theme !h-[50px] !py-2 !w-[410px]",
                              }}
                            />
                            {currentStep === 2 &&
                              !String(
                                newContract.gereeniiOgnoo || ""
                              ).trim() && (
                                <p className="text-xs text-red-600 mt-1">
                                  Гэрээний огноо сонгоно уу
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Эхлэх/Дуусах огноо
                            </label>
                            <DatePickerInput
                              className="w-full"
                              type="range"
                              locale="mn"
                              value={
                                newContract.ekhlekhOgnoo &&
                                newContract.duusakhOgnoo
                                  ? [
                                      new Date(newContract.ekhlekhOgnoo),
                                      new Date(newContract.duusakhOgnoo),
                                    ]
                                  : undefined
                              }
                              onChange={(vals) => {
                                const [start, end] = (vals || [null, null]) as [
                                  Date | null,
                                  Date | null
                                ];
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  ekhlekhOgnoo: start
                                    ? dayjs(start).format("YYYY-MM-DD")
                                    : "",
                                  duusakhOgnoo: end
                                    ? dayjs(end).format("YYYY-MM-DD")
                                    : "",
                                }));
                              }}
                              classNames={{
                                input:
                                  "text-theme neu-panel placeholder:text-theme !h-[50px] !py-2 !w-[410px]",
                              }}
                            />
                            {currentStep === 2 &&
                              (!String(newContract.ekhlekhOgnoo || "").trim() ||
                                !String(
                                  newContract.duusakhOgnoo || ""
                                ).trim()) && (
                                <p className="text-xs text-red-600 mt-1">
                                  Эхлэх болон дуусах огноо сонгоно уу
                                </p>
                              )}
                            {currentStep === 2 &&
                              String(newContract.ekhlekhOgnoo || "") &&
                              String(newContract.duusakhOgnoo || "") &&
                              dayjs(newContract.duusakhOgnoo).isBefore(
                                dayjs(newContract.ekhlekhOgnoo),
                                "day"
                              ) && (
                                <p className="text-xs text-red-600 mt-1">
                                  Дуусах огноо эхлэх огнооноос өмнө байж
                                  болохгүй
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Төлөх огноо
                            </label>
                            <DatePickerInput
                              className="w-full"
                              locale="mn"
                              value={
                                newContract.tulukhOgnoo
                                  ? new Date(newContract.tulukhOgnoo)
                                  : null
                              }
                              onChange={(value) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  tulukhOgnoo: value
                                    ? dayjs(value).format("YYYY-MM-DD")
                                    : "",
                                }))
                              }
                              classNames={{
                                input:
                                  "text-theme neu-panel placeholder:text-theme !h-[50px] !py-2 !w-[410px]",
                              }}
                            />
                            {currentStep === 2 &&
                              !String(newContract.tulukhOgnoo || "").trim() && (
                                <p className="text-xs text-red-600 mt-1">
                                  Төлөх огноо сонгоно уу
                                </p>
                              )}
                          </div>
                          {/* <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Хугацаа (сар)
                            </label>
                            <input
                              type="number"
                              value={newContract.khugatsaa}
                              onChange={(e) =>
                                setNewContract((prev: any) => ({
                                  ...prev,
                                  khugatsaa: Number(e.target.value),
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            />
                          </div> */}
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="grid grid-cols-1 gap-6">
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-sm text-slate-600 mb-3">
                              СӨХ мэдээлэл байгууллагын мэдээллээс автоматаар
                              бөглөгдөнө.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  Байгууллагын нэр
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhNer || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн регистр
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhRegister || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн утас
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {(newContract.suhUtas || []).join(", ") ||
                                    "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-slate-500">
                                  СӨХ-ийн и-мэйл
                                </span>
                                <span className="font-medium text-slate-900 truncate ml-2">
                                  {newContract.suhMail || "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Тэмдэглэл
                              </label>
                              <textarea
                                value={newContract.temdeglel}
                                onChange={(e) =>
                                  setNewContract((prev: any) => ({
                                    ...prev,
                                    temdeglel: e.target.value,
                                  }))
                                }
                                className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex justify-between px-6 py-3 border-t md:border-t ${
                        currentStep !== 1
                          ? "sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/90 backdrop-blur supports-[position:sticky]:backdrop-blur-sm z-10"
                          : ""
                      } md:static`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStep((s: number) => Math.max(1, s - 1))
                        }
                        className="btn-minimal btn-minimal-ghost btn-back"
                        disabled={currentStep === 1}
                      >
                        Буцах
                      </button>
                      {currentStep < 3 ? (
                        <div className="flex items-center gap-3">
                          {!isStepValid(currentStep) && (
                            <span className="text-red-600 text-sm">
                              Бүх талбаруудыг бөглөнө үү
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isStepValid(currentStep)) return;
                              setCurrentStep((s: number) => Math.min(3, s + 1));
                            }}
                            className={`btn-minimal btn-next ${
                              !isStepValid(currentStep)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={!isStepValid(currentStep)}
                            data-modal-primary
                          >
                            Дараах
                          </button>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isFormValid()}
                          className="btn-minimal btn-save h-11"
                          data-modal-primary
                        >
                          {editingContract ? "Хадгалах" : "Гэрээ үүсгэх"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showAddTootModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
              >
                <div className="text-center">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Тоот нэмэх
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {addTootFloor
                      ? `${addTootFloor}-р давхарт шинэ тоот нэмнэ үү.`
                      : "Давхар сонгоогүй байна."}
                  </p>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Тоот"
                      value={addTootValue}
                      onChange={(e) => setAddTootValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-gray-200 focus:outline-none focus:ring"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTootModal(false)}
                      className="btn-minimal-ghost px-4 py-2"
                    >
                      Болих
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (!addTootFloor) return;
                          await addUnit(
                            addTootFloor,
                            String(addTootValue || "").trim()
                          );
                          setShowAddTootModal(false);
                          setAddTootValue("");
                        } catch (e) {
                          // swallow - addUnit shows overlay on error
                        }
                      }}
                      className="btn-minimal btn-save px-4 py-2"
                      data-modal-primary
                    >
                      Нэмэх
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showPreviewModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
              onClick={() => setShowPreviewModal(false)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive sm:w-full sm:max-w-4xl rounded-2xl shadow-2xl p-6 overflow-auto max-h-[80vh]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Загварын урьдчилсан харалт
                  </h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 hover:bg-gray-300 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-theme"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="paper-viewport theme-print-preview">
                  <div className="paper-legal">
                    {/* Render main content (aguulga) returned by the API */}
                    <div
                      className="preview-content prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{
                        __html: previewTemplate?.aguulga || "",
                      }}
                    />
                  </div>
                  <style jsx global>{`
                    /* Make paper and text follow app theme */
                    .theme-print-preview .preview-content,
                    .theme-print-preview .preview-content * {
                      color: var(--panel-text) !important;
                    }
                    .theme-print-preview .paper-legal {
                      background: var(--surface-bg) !important;
                    }
                    .theme-print-preview .preview-content a {
                      color: var(--panel-text) !important;
                      text-decoration: underline;
                    }
                    .theme-print-preview .preview-content table {
                      color: var(--panel-text) !important;
                    }
                  `}</style>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showResidentModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={residentRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative overflow-y-auto custom-scrollbar modal-surface modal-responsive w-full max-w-4xl md:max-w-5xl lg:max-w-6xl h-[90svh] max-h-[92svh] rounded-2xl shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingResident
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Оршин суугч нэмэх"}
                  </h2>
                  <button
                    onClick={() => setShowResidentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={handleCreateResident}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-28">
                    <div className="min-h-[55vh] grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Төрөл
                        </label>
                        <TusgaiZagvar
                          value={newResident.turul}
                          onChange={(val) =>
                            setNewResident((prev: any) => ({
                              ...prev,
                              turul: val,
                            }))
                          }
                          options={[
                            { value: "Үндсэн", label: "Үндсэн" },
                            { value: "Түр", label: "Түр" },
                          ]}
                          className="w-full"
                          placeholder="Сонгох..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Овог
                        </label>
                        <input
                          type="text"
                          value={newResident.ovog}
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^a-zA-Za-яА-ЯөүёӨҮЁ-]/g,
                              ""
                            );
                            setNewResident((prev: any) => ({
                              ...prev,
                              ovog: value,
                            }));
                          }}
                          className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Нэр
                        </label>
                        <input
                          type="text"
                          value={newResident.ner}
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^a-zA-Za-яА-ЯөүёӨҮЁ-]/g,
                              ""
                            );
                            setNewResident((prev: any) => ({
                              ...prev,
                              ner: value,
                            }));
                          }}
                          className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Утас
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={8}
                          value={(newResident.utas?.[0] as any) || ""}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 8);
                            setNewResident((prev: any) => ({
                              ...prev,
                              utas: [digits],
                            }));
                          }}
                          className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          И-мэйл
                        </label>
                        <input
                          type="email"
                          value={newResident.mail}
                          onChange={(e) =>
                            setNewResident((prev: any) => ({
                              ...prev,
                              mail: e.target.value,
                            }))
                          }
                          required
                          className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Аймаг
                        </label>
                        <TusgaiZagvar
                          value={newResident.aimag}
                          onChange={(val) =>
                            setNewResident((prev: any) => ({
                              ...prev,
                              aimag: val,
                              khayag: val,
                              duureg: "",
                              horoo: "",
                            }))
                          }
                          options={mongoliaProvinces.map((p) => ({
                            value: p,
                            label: p,
                          }))}
                          className="w-full"
                          placeholder="Сонгох..."
                          required
                        />
                      </div>
                      {newResident.aimag === "Улаанбаатар" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Дүүрэг
                            </label>
                            <TusgaiZagvar
                              value={newResident.duureg}
                              onChange={(val) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  duureg: val,
                                  horoo: "",
                                }))
                              }
                              options={(districts[newResident.aimag] || []).map(
                                (d) => ({ value: d, label: d })
                              )}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Хороо
                            </label>
                            <TusgaiZagvar
                              value={newResident.horoo}
                              onChange={(val) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  horoo: val,
                                }))
                              }
                              options={(
                                subDistricts[newResident.duureg] || []
                              ).map((sd) => ({ value: sd, label: sd }))}
                              className="w-full"
                              placeholder="Сонгох..."
                            />
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            СӨХ нэр
                          </label>
                          <input
                            type="text"
                            value={newResident.soh || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                soh: e.target.value,
                              }))
                            }
                            readOnly
                            className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Орц
                          </label>
                          <input
                            type="text"
                            value={newResident.orts || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                orts: e.target.value,
                              }))
                            }
                            className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Тоот
                          </label>
                          <input
                            type="number"
                            value={newResident.toot || ""}
                            onChange={(e) =>
                              setNewResident((prev: any) => ({
                                ...prev,
                                toot: e.target.value,
                              }))
                            }
                            className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Давхар
                          </label>
                          {davkharOptions && davkharOptions.length > 0 ? (
                            <TusgaiZagvar
                              value={newResident.davkhar}
                              onChange={(val) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  davkhar: val,
                                }))
                              }
                              options={davkharOptions.map((d) => ({
                                value: d,
                                label: d,
                              }))}
                              className="w-full"
                              required
                              placeholder="Сонгох..."
                            />
                          ) : (
                            <input
                              type="text"
                              value={newResident.davkhar || ""}
                              onChange={(e) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  davkhar: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              required
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Барилгын нэр
                          </label>
                          <input
                            type="text"
                            value={
                              newResident.baiguullagiinNer ||
                              selectedBarilga?.ner ||
                              ""
                            }
                            readOnly
                            className="w-full p-3 text-slate-900 rounded-2xl border border-gray-200 bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">
                          Нэвтрэх мэдээлэл
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Нэвтрэх нэр
                            </label>
                            <input
                              type="text"
                              value={newResident.nevtrekhNer}
                              onChange={(e) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  nevtrekhNer: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              placeholder="Нэвтрэх нэр"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Нууц үг
                            </label>
                            <input
                              type="password"
                              value={newResident.nuutsUg}
                              onChange={(e) =>
                                setNewResident((prev: any) => ({
                                  ...prev,
                                  nuutsUg: e.target.value,
                                }))
                              }
                              className="w-full p-3 text-slate-900 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-gray-300"
                              placeholder="Нууц үг"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end px-6 py-4 border-t sticky bottom-2 left-0 right-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowResidentModal(false)}
                        className="btn-minimal-ghost btn-cancel min-w-[100px]"
                      >
                        Цуцлах
                      </button>
                      <button
                        type="submit"
                        className="btn-minimal btn-save h-11"
                        data-modal-primary
                      >
                        {editingResident ? "Хадгалах" : "Хадгалах"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showEmployeeModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={employeeRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive sm:w-full sm:max-w-3xl rounded-2xl shadow-2xl p-0 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingEmployee ? "Ажилтан засах" : "Ажилтан нэмэх"}
                  </h2>
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={handleCreateOrUpdateEmployee}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Овог
                      </label>
                      <input
                        type="text"
                        value={newEmployee.ovog}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            ""
                          );
                          setNewEmployee((p: any) => ({
                            ...p,
                            ovog: value,
                          }));
                        }}
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нэр
                      </label>
                      <input
                        type="text"
                        value={newEmployee.ner}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            ""
                          );
                          setNewEmployee((p: any) => ({
                            ...p,
                            ner: value,
                          }));
                        }}
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Утас
                      </label>
                      <input
                        type="tel"
                        value={newEmployee.utas}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 8);
                          setNewEmployee((p: any) => ({
                            ...p,
                            utas: value,
                          }));
                        }}
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        maxLength={8}
                        pattern="[0-9]{8}"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        И-мэйл
                      </label>
                      <input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Албан тушаал
                      </label>
                      <input
                        type="text"
                        value={newEmployee.albanTushaal}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            albanTushaal: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ажилд орсон огноо
                      </label>
                      <DatePickerInput
                        value={
                          newEmployee.ajildOrsonOgnoo
                            ? new Date(newEmployee.ajildOrsonOgnoo)
                            : null
                        }
                        onChange={(v) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            ajildOrsonOgnoo: v
                              ? (() => {
                                  const date = new Date(v);
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0");
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  return `${year}-${month}-${day}`;
                                })()
                              : "",
                          }))
                        }
                        placeholder="Огноо сонгох"
                        className="w-full"
                        required
                        clearable
                        classNames={{
                          input:
                            "text-theme neu-panel neu-calendar placeholder:text-theme !h-[50px] !py-2 !w-[420px]",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нэвтрэх нэр
                      </label>
                      <input
                        type="text"
                        value={newEmployee.nevtrekhNer}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nevtrekhNer: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Нууц үг
                      </label>
                      <input
                        type="password"
                        value={newEmployee.nuutsUg}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({
                            ...p,
                            nuutsUg: e.target.value,
                          }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmployeeModal(false)}
                      className="btn-minimal-ghost btn-cancel min-w-[100px]"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="submit"
                      className="btn-minimal btn-save"
                      data-modal-primary
                    >
                      {editingEmployee ? "Хадгалах" : "Хадгалах"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showList2Modal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={() => setShowList2Modal(false)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={list2Ref}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive sm:w-full sm:max-w-4xl rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Гэрээний Загвар
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowList2Modal(false);
                        router.push("/geree/zagvar/gereeniiZagvar");
                      }}
                      className="btn-minimal btn-save"
                    >
                      Шинэ загвар
                    </button>
                    <button
                      onClick={() => setShowList2Modal(false)}
                      className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                      aria-label="Хаах"
                      title="Хаах"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-slate-700"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {(zagvaruud || []).map((z: any) => (
                    <div
                      key={z._id}
                      className="flex items-center justify-between p-3 rounded-2xl border"
                    >
                      <div>
                        <div className="font-semibold text-theme">{z.ner}</div>
                        <div className="text-sm text-theme">{z.turul}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewTemplate(z._id)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-2xl"
                          title="Харах"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(z._id)}
                          className="p-2 hover:bg-blue-100 rounded-2xl"
                          title="Засах"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(z._id)}
                          className="p-2 hover:bg-red-50 rounded-2xl action-delete"
                          title="Устгах"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showTemplatesModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              onClick={() => setShowTemplatesModal(false)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                ref={templatesRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive sm:w-full sm:max-w-3xl rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Загвар татах
                  </h3>
                  <button
                    onClick={() => setShowTemplatesModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                    aria-label="Хаах"
                    title="Хаах"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-slate-700"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {templates.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {t.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {t.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadTemplate(t.type)}
                        className="btn-minimal btn-download"
                      >
                        Татах
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showDeleteResidentModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Оршин суугчийг устгах уу?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Та {residentToDelete?.ovog || ""}{" "}
                    {residentToDelete?.ner || ""}-г устгах гэж байна. Энэ үйлдэл
                    буцаах боломжгүй.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteResidentModal(false)}
                      className="btn-minimal-ghost px-4 py-2"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (residentToDelete) {
                          await handleDeleteResident(residentToDelete);
                          setShowDeleteResidentModal(false);
                          setResidentToDelete(null);
                        }
                      }}
                      className="btn-minimal btn-cancel px-4 py-2"
                      data-modal-primary
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showDeleteEmployeeModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Ажилтныг устгах уу?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Та {employeeToDelete?.ovog || ""}{" "}
                    {employeeToDelete?.ner || ""}-г устгах гэж байна. Энэ үйлдэл
                    буцаах боломжгүй.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteEmployeeModal(false)}
                      className="btn-minimal-ghost  px-4 py-2"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (employeeToDelete) {
                          await handleDeleteEmployee(employeeToDelete);
                          setShowDeleteEmployeeModal(false);
                          setEmployeeToDelete(null);
                        }
                      }}
                      className="btn-minimal btn-cancel px-4 py-2"
                      data-modal-primary
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showDeleteUnitModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Тоотыг устгах уу?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Та {unitToDelete?.floor}-р давхрын {unitToDelete?.unit}{" "}
                    тоотыг устгах гэж байна. Энэ үйлдэл буцаах боломжгүй.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteUnitModal(false)}
                      className="btn-minimal-ghost px-4 py-2"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (unitToDelete) {
                          await deleteUnit(
                            unitToDelete.floor,
                            unitToDelete.unit
                          );
                          setShowDeleteUnitModal(false);
                          setUnitToDelete(null);
                        }
                      }}
                      className="btn-minimal btn-cancel px-4 py-2"
                      data-modal-primary
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
        {showDeleteFloorModal && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Давхрын тоотуудыг устгах уу?
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Та {floorToDelete}-р давхрын бүх тоотыг устгах гэж байна.
                    Энэ үйлдэл буцаах боломжгүй.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteFloorModal(false)}
                      className="btn-minimal-ghost px-4 py-2"
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (floorToDelete) {
                          await deleteFloor(floorToDelete);
                          setShowDeleteFloorModal(false);
                          setFloorToDelete(null);
                        }
                      }}
                      className="btn-minimal btn-cancel px-4 py-2"
                      data-modal-primary
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}
