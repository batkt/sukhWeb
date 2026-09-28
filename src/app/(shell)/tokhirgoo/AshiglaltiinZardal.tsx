"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import formatNumber from "../../../../tools/function/formatNumber";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { useAuth } from "@/lib/useAuth";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { fetchWithDomainFallback } from "@/lib/uilchilgee";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useBuilding } from "@/context/BuildingContext";
import { useSpinner } from "@/context/SpinnerContext";
import {
  Edit,
  Trash2,
  Layers,
  CreditCard,
  ChevronDown,
  RefreshCw,
  Download,
  Upload,
  Wallet,
  Tag,
  X,
  Check,
  Search,
  CalendarCheck,
  Activity,
  Zap,
  Building,
  ArrowUpDown,
  FileText,
  Sparkles,
  AlertTriangle,
  Plus,
  CopyPlus,
} from "lucide-react";
import ExcelButton from "@/components/ui/ExcelButton";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../../tools/function/deleteMethod";
import { SettingsCard } from "./SettingsRow";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface ZardalItem {
  _id?: string;
  ner: string;
  turul: string;
  tariff: number;
  tariffUsgeer?: string;

  suuriKhuraamj?: number;
  ognoonuud?: string[];
  nuatBodokhEsekh?: boolean;
  baiguullagiinId?: string;
  barilgiinId?: string;
  zardliinTurul?: string;
  tseverUsDun?: number;
  bokhirUsDun?: number;
  usKhalaasniiDun?: number;
  tailbar?: string;
  createdAt?: string;
  updatedAt?: string;
  // Electricity meter-based fields
  zaalt?: boolean;
  zaaltTariff?: number;
  zaaltDefaultDun?: number;
  // Electricity tiered pricing
  tariff150kv?: number;
  tariff150to300kv?: number;
  tariff300pluskv?: number;
}

interface ZardalFormData {
  _id?: string;
  ner: string;
  turul: string;
  tariff: number;
  tariffUsgeer?: string;
  zardliinTurul?: string;
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
  tailbar?: string;
  // Electricity meter-based fields
  zaalt?: boolean;
  zaaltTariff?: number;
  zaaltDefaultDun?: number;
  // Electricity tiered pricing
  tariff150kv?: number;
  tariff150to300kv?: number;
  tariff300pluskv?: number;
}

/** Маягтын нэг алхам — дугаар, гарчиг, тайлбар (render-ээс ГАДНА: фокус алдахгүй) */
const Alkham = ({ dugaar, garchig, tailbar, zaaval, children }: {
  dugaar: number; garchig: string; tailbar?: string; zaaval?: boolean; children: React.ReactNode;
}) => (
  <section className="flex gap-3.5">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-theme/10 text-[13px] tabular-nums text-brand">
      {dugaar}
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="text-[15px] text-[color:var(--panel-text)]">
        {garchig}
        {zaaval && <span className="ml-0.5 text-danger">*</span>}
      </h3>
      {tailbar && <p className="mt-0.5 text-[13px] text-[color:var(--muted-text)]">{tailbar}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  </section>
);
/** Радио сонголт — том, бүхэлдээ дарагдана */
const Songolt = ({ songogdson, onClick, Icon, ner, tailbar }: {
  songogdson: boolean; onClick: () => void; Icon: any; ner: string; tailbar: string;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={songogdson}
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
      songogdson
        ? "border-theme bg-theme/[0.06]"
        : "border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)]"
    }`}
  >
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        songogdson ? "border-theme" : "border-[color:var(--surface-border)]"
      }`}
    >
      {songogdson && <span className="h-2.5 w-2.5 rounded-full bg-theme" />}
    </span>
    <Icon className={`h-5 w-5 shrink-0 ${songogdson ? "text-brand" : "text-[color:var(--muted-text)]"}`} />
    <span className="min-w-0">
      <span className="block text-[14px] text-[color:var(--panel-text)]">{ner}</span>
      <span className="block text-[13px] text-[color:var(--muted-text)]">{tailbar}</span>
    </span>
  </button>
);

export default function AshiglaltiinZardluud() {
  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();

  const {
    zardluud: ashiglaltiinZardluud,
    isLoading: isLoadingAshiglaltiin,
    addZardal,
    updateZardal,
    deleteZardal,
    syncZardluud,
    mutate: refreshZardluud,
  } = useAshiglaltiinZardluud({
    barilgiinId: selectedBuildingId || barilgiinId,
  });

  const [view, setView] = useState<"list" | "form">("list");
  const dragControls = useDragControls();
  const formConstraintsRef = useRef<HTMLDivElement>(null);

  /** Excel товчны цэс — татах/оруулах хоёр нэг товчинд нэгтгэгдсэн. */
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  // Гадна дарах / Escape дарахад цэс хаагдана. Listener нь цэс НЭЭЛТТЭЙ
  // үед л залгагдана — үргэлж сонсох нь дэмий.
  useEffect(() => {
    if (!excelMenuOpen) return;
    const gadnaDarsan = (e: MouseEvent) => {
      if (!excelMenuRef.current?.contains(e.target as Node)) {
        setExcelMenuOpen(false);
      }
    };
    const tovchlolt = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExcelMenuOpen(false);
    };
    document.addEventListener("mousedown", gadnaDarsan);
    document.addEventListener("keydown", tovchlolt);
    return () => {
      document.removeEventListener("mousedown", gadnaDarsan);
      document.removeEventListener("keydown", tovchlolt);
    };
  }, [excelMenuOpen]);
  useModalHotkeys({ isOpen: view === "form", onClose: () => setView("list") });

  const [editingItem, setEditingItem] = useState<ZardalItem | null>(null);
  const [isUilchilgeeModal, setIsUilchilgeeModal] = useState(false);
  const [editedTariffs, setEditedTariffs] = useState<Record<string, number>>(
    {},
  );

  const [formData, setFormData] = useState<ZardalFormData>({
    ner: "",
    turul: "",
    tariff: 0,
    tariffUsgeer: undefined,
    suuriKhuraamj: 0,
    nuatBodokhEsekh: false,
    zardliinTurul: "Энгийн",
    tailbar: "",
    zaalt: false,
    zaaltTariff: 0,
    zaaltDefaultDun: 0,
    tariff150kv: 0,
    tariff150to300kv: 0,
    tariff300pluskv: 0,
  });

  const [tariffInputValue, setTariffInputValue] = useState<string>("");
  const [suuriKhuraamjInput, setSuuriKhuraamjInput] = useState<string>("");
  const [zaaltTariffInput, setZaaltTariffInput] = useState<string>("");
  const [zaaltDefaultDunInput, setZaaltDefaultDunInput] = useState<string>("");
  const [tariff150kvInput, setTariff150kvInput] = useState<string>("");
  const [tariff150to300kvInput, setTariff150to300kvInput] =
    useState<string>("");
  const [tariff300pluskvInput, setTariff300pluskvInput] = useState<string>("");

  const [expenseTypes] = useState<string[]>([
    "1м3/талбай",
    "нэгж/талбай",
    "Тогтмол",
    "Дурын",
  ]);

  const [pageSize] = useState(500);
  const [filterText, setFilterText] = useState<string>("");
  // Хүснэгтэд хэдэн зардал шууд харуулах вэ. Үүнээс олон бол «Бүгдийг харах»
  // товч гарч ирнэ — өмнө нь дотогшоо гүйлгэдэг байсан нь хэдэн зардал байгаа
  // нь харагдахгүй, хуудсаа гүйлгэхэд ч саад болдог байв.
  const ZARDAL_URIDCHILAN_KHARUULAKH = 5;
  const [bugdTogtmol, setBugdTogtmol] = useState(false);
  const [bugdKhuvisakh, setBugdKhuvisakh] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ZardalItem | null>(null);
  const [turul, setTurul] = useState("");

  // Multi-building copy modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyTargets, setSelectedCopyTargets] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);

  // Derived: all buildings from the organization (excluding current)
  const allBarilguud = baiguullaga?.barilguud || [];
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
  const otherBarilguud = allBarilguud.filter(
    (b) => String(b._id) !== String(effectiveBarilgiinId)
  );

  // Хоёр хүснэгт ижил шүүлтүүрийг мөр бүрт давтан бичдэг байсныг нэг дор
  // төвлөрүүлэв. Толгой дахь тоо, мөрүүд, нийт дүн гурав нь ижил жагсаалтаас
  // уншина.
  const zardliigShuuye = (zardliinTurul: string) =>
    ashiglaltiinZardluud
      .filter((x) => x._id)
      .filter((x) => x.turul === zardliinTurul)
      .filter((x) =>
        filterText.trim() === ""
          ? true
          : String(x.ner || "")
            .toLowerCase()
            .includes(filterText.toLowerCase()),
      );

  const togtmolZardluud = useMemo(
    () => zardliigShuuye("Тогтмол"),
    [ashiglaltiinZardluud, filterText],
  );
  const khuvisakhZardluud = useMemo(
    () => zardliigShuuye("Дурын"),
    [ashiglaltiinZardluud, filterText],
  );

  const niitDungBodyo = (jagsaalt: ZardalItem[], tsakhilgaanShalgakh = true) =>
    jagsaalt.reduce((niit, item) => {
      const nameLower = (item.ner || "").toLowerCase();
      const isVariableElectricity =
        tsakhilgaanShalgakh &&
        nameLower.includes("цахилгаан") &&
        !nameLower.includes("дундын") &&
        !nameLower.includes("өмчлөл");
      const displayValue = isVariableElectricity
        ? item.suuriKhuraamj || 0
        : item.tariff || 0;
      const currentValue =
        editedTariffs[item._id!] !== undefined
          ? Number(editedTariffs[item._id!]) || 0
          : Number(displayValue) || 0;
      return niit + currentValue;
    }, 0);
  const TAILBARIIN_DEED_URT = 300;

  const formatWhileTyping = (val: string) => {
    const clean = val.replace(/,/g, "").replace(/[^\d.]/g, "");
    const dotIdx = clean.indexOf(".");
    let intRaw: string;
    let fracRaw: string;
    const endsWithDot = clean.endsWith(".") && clean.split(".").length <= 2;

    if (dotIdx === -1) {
      intRaw = clean;
      fracRaw = "";
    } else {
      intRaw = clean.slice(0, dotIdx);
      fracRaw = clean.slice(dotIdx + 1).replace(/\./g, "");
    }

    const intDigits = intRaw.replace(/\D/g, "");
    const intFormatted = intDigits
      ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";

    if (dotIdx !== -1 && fracRaw === "" && endsWithDot) {
      return intFormatted + ".";
    }

    if (!intDigits && fracRaw !== "") {
      return "." + fracRaw.replace(/\D/g, "").slice(0, 10);
    }

    if (fracRaw !== "") {
      const fd = fracRaw.replace(/\D/g, "").slice(0, 10);
      return intFormatted + "." + fd;
    }

    return intFormatted;
  };

  const getCursorPosByNonCommaCount = (val: string, nonCommaCount: number) => {
    if (nonCommaCount <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== ",") seen++;
      if (seen >= nonCommaCount) return i + 1;
    }
    return val.length;
  };

  const handleTariffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const inputEl = e.currentTarget;
    const cursor = inputEl.selectionStart ?? raw.length;
    const nonCommaBeforeCursor = raw.slice(0, cursor).replace(/,/g, "").length;

    const clean = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
    const n = Number(clean);
    const formatted = formatWhileTyping(raw);

    setTariffInputValue(formatted);
    setFormData((prev) => ({
      ...prev,
      tariff: Number.isFinite(n) ? n : 0,
    }));

    requestAnimationFrame(() => {
      if (!inputEl || document.activeElement !== inputEl) return;
      const nextPos = getCursorPosByNonCommaCount(formatted, nonCommaBeforeCursor);
      inputEl.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleSuuriKhuraamjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    const inputEl = e.currentTarget;
    const cursor = inputEl.selectionStart ?? raw.length;
    const nonCommaBeforeCursor = raw.slice(0, cursor).replace(/,/g, "").length;

    const clean = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
    const n = Number(clean);
    const formatted = formatWhileTyping(raw);

    setSuuriKhuraamjInput(formatted);
    setFormData((prev) => ({
      ...prev,
      suuriKhuraamj: Number.isFinite(n) ? n : 0,
    }));

    requestAnimationFrame(() => {
      if (!inputEl || document.activeElement !== inputEl) return;
      const nextPos = getCursorPosByNonCommaCount(formatted, nonCommaBeforeCursor);
      inputEl.setSelectionRange(nextPos, nextPos);
    });
  };

  const zardalExcelInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Загварыг татна. Сервер нь тухайн барилгын одоогийн зардлуудаар дүүргэж
   * буцаадаг тул энэ нь нэгэн зэрэг экспорт болж, тарифыг бөөнөөр засахад
   * ашиглагдана.
   */
  const zardalExcelZagvarTatya = async () => {
    const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!effectiveBarilgiinId) {
      openErrorOverlay("Барилга сонгоно уу");
      return;
    }

    showSpinner();
    try {
      const resp = await uilchilgee(token).post(
        "/ashiglaltiinZardalExcelTemplateAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        { responseType: "blob" as any },
      );

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "Ашиглалтын зардал.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      openSuccessOverlay("Excel загвар татагдлаа");
    } catch (e) {
      openErrorOverlay("Excel загвар татахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const zardalExcelOruulya = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const zuvFail =
      file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (!zuvFail) {
      openErrorOverlay("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (zardalExcelInputRef.current) zardalExcelInputRef.current.value = "";
      return;
    }

    const effectiveBarilgiinId = selectedBuildingId || barilgiinId;
    if (!token || !ajiltan?.baiguullagiinId || !effectiveBarilgiinId) {
      openErrorOverlay("Нэвтэрсэн эсэх, барилга сонгосон эсэхээ шалгана уу");
      if (zardalExcelInputRef.current) zardalExcelInputRef.current.value = "";
      return;
    }

    showSpinner();
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      form.append("barilgiinId", String(effectiveBarilgiinId));

      const resp: any = await uilchilgee(token).post(
        "/ashiglaltiinZardalExcelTatya",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const data = resp?.data;
      const failed = data?.results?.failed;

      await refreshZardluud();

      if (Array.isArray(failed) && failed.length > 0) {
        const details = failed
          .map(
            (f: any) =>
              `Мөр ${f.row || "?"}${f.ner ? ` (${f.ner})` : ""}: ${f.error || "Алдаа"
              }`,
          )
          .join("\n");
        openErrorOverlay(
          `${data?.message || "Импортын явцад зарим мөр алдаатай байна"}\n${details}`,
        );
      } else {
        openSuccessOverlay(data?.message || "Excel амжилттай орууллаа");
      }
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.message || "Excel оруулахад алдаа гарлаа",
      );
    } finally {
      hideSpinner();
      if (zardalExcelInputRef.current) zardalExcelInputRef.current.value = "";
    }
  };

  const QUICK_PRESETS = [
    { label: "Лифт", name: "Лифт", turul: "Тогтмол", zardliinTurul: "Лифт", icon: ArrowUpDown },
    { label: "Хог", name: "Хог", turul: "Тогтмол", zardliinTurul: "Энгийн", icon: Tag },
    { label: "Харуул", name: "Харуул хамгаалалт", turul: "Тогтмол", zardliinTurul: "Энгийн", icon: Building },
    { label: "Дундын цахилгаан", name: "Дундын өмчлөл Цахилгаан", turul: "Тогтмол", zardliinTurul: "Энгийн", icon: Zap },
    { label: "Цахилгаан (заалт)", name: "Цахилгаан", turul: "Дурын", zardliinTurul: "Энгийн", icon: Zap, zaalt: true, tariffUsgeer: "кВт" },
    { label: "СӨХ төлбөр", name: "СӨХ төлбөр", turul: "Тогтмол", zardliinTurul: "Энгийн", icon: Wallet },
    { label: "Цэвэр ус", name: "Цэвэр ус", turul: "Дурын", zardliinTurul: "Энгийн", icon: Tag },
    { label: "Дулаан", name: "Дулаан", turul: "Тогтмол", zardliinTurul: "Энгийн", icon: Tag },
  ];


  const applyQuickPreset = (preset: (typeof QUICK_PRESETS)[number]) => {
    const isCakhilgaan = preset.name.toLowerCase().includes("цахилгаан");
    const isVarElec =
      isCakhilgaan &&
      !preset.name.toLowerCase().includes("дундын") &&
      !preset.name.toLowerCase().includes("өмчлөл");

    setFormData((prev) => ({
      ...prev,
      ner: preset.name,
      turul: preset.turul,
      zardliinTurul: preset.zardliinTurul,
      zaalt: isVarElec,
      tariffUsgeer: isVarElec ? "кВт" : undefined,
    }));
  };

  const openAddModal = (isUilchilgee = false) => {
    setEditingItem(null);
    setIsUilchilgeeModal(isUilchilgee);
    setFormData({
      ner: "",
      turul: isUilchilgee ? "Дурын" : "Тогтмол",
      tariff: 0,
      tariffUsgeer: undefined,
      suuriKhuraamj: 0,
      nuatBodokhEsekh: false,
      zardliinTurul: "Энгийн",
      tailbar: "",
      zaalt: false,
      zaaltTariff: 0,
      zaaltDefaultDun: 0,
      tariff150kv: 0,
      tariff150to300kv: 0,
      tariff300pluskv: 0,
    });
    setTariffInputValue("");
    setSuuriKhuraamjInput("");
    setZaaltTariffInput("");
    setZaaltDefaultDunInput("");
    setTariff150kvInput("");
    setTariff150to300kvInput("");
    setTariff300pluskvInput("");
    setView("form");
  };

  const openEditModal = (item: ZardalItem, isUilchilgee = false) => {
    setEditingItem(item);
    setIsUilchilgeeModal(isUilchilgee);
    setFormData({
      _id: item._id,
      ner: item.ner,
      turul: item.turul,
      tariff: item.tariff,
      tariffUsgeer: item.tariffUsgeer,
      suuriKhuraamj: item.suuriKhuraamj || 0,
      nuatBodokhEsekh: item.nuatBodokhEsekh || false,
      zardliinTurul: item.zardliinTurul || "Энгийн",
      tailbar: item.tailbar || "",
      zaalt: item.zaalt || false,
      zaaltTariff: item.zaaltTariff || 0,
      zaaltDefaultDun: item.zaaltDefaultDun || 0,
      tariff150kv: item.tariff150kv || 0,
      tariff150to300kv: item.tariff150to300kv || 0,
      tariff300pluskv: item.tariff300pluskv || 0,
    });
    setTariffInputValue(
      item.tariff ? formatNumber(item.tariff, 2) : "",
    );
    setSuuriKhuraamjInput(
      item.suuriKhuraamj
        ? formatNumber(item.suuriKhuraamj, 2)
        : "",
    );
    setZaaltTariffInput(
      item.zaaltTariff ? formatNumber(item.zaaltTariff, 2) : "",
    );
    setZaaltDefaultDunInput(
      item.zaaltDefaultDun ? formatNumber(item.zaaltDefaultDun, 2) : "",
    );
    setTariff150kvInput(
      item.tariff150kv ? formatNumber(item.tariff150kv, 2) : "",
    );
    setTariff150to300kvInput(
      item.tariff150to300kv ? formatNumber(item.tariff150to300kv, 2) : "",
    );
    setTariff300pluskvInput(
      item.tariff300pluskv ? formatNumber(item.tariff300pluskv, 2) : "",
    );
    setView("form");
  };

  const handleSave = async () => {
    if (!formData.ner || !formData.turul) {
      openErrorOverlay("Нэр болон төрлийг бөглөнө үү");
      return;
    }

    showSpinner();
    try {
      const nameLower = formData.ner.toLowerCase();

      // Check if this is a VARIABLE electricity charge (meter-based, uses Excel readings)
      // Only plain "Цахилгаан" should be zaalt=true
      // "Дундын өмчлөл Цахилгаан" is a FIXED charge and should NOT be zaalt=true
      const isVariableElectricity =
        nameLower.includes("цахилгаан") &&
        !nameLower.includes("дундын") &&
        !nameLower.includes("өмчлөл");

      // Check if this is a FIXED electricity charge (like "Дундын өмчлөл Цахилгаан")
      const isFixedElectricity =
        nameLower.includes("цахилгаан") &&
        (nameLower.includes("дундын") || nameLower.includes("өмчлөл"));

      let payload = {
        ...formData,
        barilgiinId: selectedBuildingId || barilgiinId || undefined,
      };

      if (isVariableElectricity) {
        // Variable electricity: zaalt=true, tariffUsgeer="кВт", tariff=0 (kWh rate from orshinSuugch)
        payload = {
          ...payload,
          zaalt: true,
          tariffUsgeer: "кВт",
          tariff: 0, // kWh rate comes from orshinSuugch.tsahilgaaniiZaalt
          suuriKhuraamj: formData.suuriKhuraamj, // base fee
        };
      } else if (isFixedElectricity) {
        // Fixed electricity: zaalt=false, tariffUsgeer="", tariff is the fixed amount
        payload = {
          ...payload,
          zaalt: false,
          tariffUsgeer: "",
          // Keep tariff as the fixed amount
        };
      }

      if (editingItem) {
        if (!editingItem._id) return;
        await updateZardal(editingItem._id, payload);
        openSuccessOverlay("Амжилттай шинэчиллээ");
      } else {
        await addZardal(payload);
        openSuccessOverlay("Амжилттай нэмлээ");
      }
      setView("list");
      await refreshZardluud();
    } catch (e) {
      openErrorOverlay("Алдаа гарлаа. Дахин оролдоно уу");
    } finally {
      hideSpinner();
    }
  };

  const handleCopyToBuildings = async () => {
    if (!token || !ajiltan?.baiguullagiinId || !effectiveBarilgiinId) {
      openErrorOverlay("Мэдээлэл дутуу байна");
      return;
    }
    if (selectedCopyTargets.length === 0) {
      openErrorOverlay("Хуулах барилга сонгоно уу");
      return;
    }
    setIsCopying(true);
    try {
      await uilchilgee(token).post("/zardalHuulakh", {
        baiguullagiinId: ajiltan.baiguullagiinId,
        ekhUniinBarilgiinId: effectiveBarilgiinId,
        zoriultBarilguud: selectedCopyTargets,
      });
      openSuccessOverlay(
        `${selectedCopyTargets.length} барилгад амжилттай хуулагдлаа`
      );
      setIsCopyModalOpen(false);
      setSelectedCopyTargets([]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || "Хуулахад алдаа гарлаа. Дахин оролдоно уу";
      openErrorOverlay(msg);
    } finally {
      setIsCopying(false);
    }
  };

  const saveAllTariffs = async () => {

    const itemsById = new Map(ashiglaltiinZardluud.map((it) => [it._id, it]));
    const changed = Object.entries(editedTariffs).filter(
      ([id, val]) => itemsById.get(id)?.tariff !== val,
    );
    if (changed.length === 0) return;
    showSpinner();
    try {
      await Promise.all(
        changed.map(async ([id, val]) => {
          const item = itemsById.get(id);
          if (!item) return;
          await updateZardal(id, { ...item, tariff: Number(val) });
        }),
      );
      openSuccessOverlay("Өөрчлөлтүүд хадгалагдлаа");
      setEditedTariffs({});
      await refreshZardluud();
    } catch (e) {
      openErrorOverlay("Тариф хадгалахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !itemToDelete._id) return;
    try {
      await deleteZardal(itemToDelete._id);
      openSuccessOverlay(`"${itemToDelete.ner}" зардал устгагдлаа`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      // refresh list
      await refreshZardluud();
    } catch (e) {
      openErrorOverlay("Зардал устгахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  // Register tour steps for AshiglaltiinZardal
  const zardalTourSteps: DriverStep[] = React.useMemo(() => {
    return [
      {
        element: "#zardal-panel",
        popover: {
          title: "Ашиглалтын зардал",
          description: "Зардлын жагсаалт энд байна.",
          side: "bottom",
        },
      },
      {
        element: "#zardal-add-btn",
        popover: {
          title: "Зардал нэмэх",
          description: "Тогтмол зардал эсвэл үйлчилгээ нэмэх товч.",
          side: "left",
        },
      },
      {
        element: "#zardal-list",
        popover: {
          title: "Зардлын жагсаалт",
          description: "Хадгалагдсан тогтмол зардлуудын жагсаалт.",
          side: "top",
        },
      },
    ];
  }, []);

  useRegisterTourSteps("/tokhirgoo/zardal", zardalTourSteps);
  // Also register these steps under the parent `/tokhirgoo` pathname
  // so they show up when the page is visited at `/tokhirgoo`.
  useRegisterTourSteps("/tokhirgoo", zardalTourSteps);

  // Тогтмол/хувьсах зардлын хүснэгтийн нэгдсэн багана.
  const zardliinColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 36,
        align: "center",
        className: "!px-1 text-center",
        render: (_: any, __: any, index: number) => (
          <span className="text-[13px] text-[color:var(--muted-text)]">
            {index + 1}
          </span>
        ),
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: "45%",
        render: (v: any) => (
          <div className="max-w-[260px] break-words text-[14px] leading-snug text-[color:var(--panel-text)] sm:max-w-[420px]">
            {v}
          </div>
        ),
      },
      {
        title: "Тариф",
        key: "tariff",
        align: "center",
        render: (_: any, mur: any) => {
          // Хувьсах цахилгаан дээр тариф биш суурь хураамжийг харуулна.
          const nameLower = (mur.ner || "").toLowerCase();
          const isVariableElectricity =
            nameLower.includes("цахилгаан") &&
            !nameLower.includes("дундын") &&
            !nameLower.includes("өмчлөл");
          const displayValue = isVariableElectricity
            ? mur.suuriKhuraamj || 0
            : mur.tariff;
          const currentValue =
            editedTariffs[mur._id!] !== undefined
              ? editedTariffs[mur._id!]
              : displayValue;
          const changed = currentValue !== displayValue;
          return (
            <div className="flex flex-col items-center gap-0.5">
              <div className="whitespace-nowrap text-[14px] tabular-nums text-[color:var(--panel-text)]">
                {formatNumber(currentValue, 2)}
                {mur.tariffUsgeer ? ` ${mur.tariffUsgeer}` : ""}
              </div>
              {changed && (
                <span className="whitespace-nowrap text-[12px] text-warning">
                  Өөрчлөгдсөн
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: "Тайлбар",
        dataIndex: "tailbar",
        key: "tailbar",
        className: "hidden md:table-cell",
        ellipsis: true,
        render: (v: any) =>
          v ? (
            <span className="text-[13px] text-[color:var(--muted-text)]">{v}</span>
          ) : (
            <span className="text-[color:var(--muted-text)] opacity-50">-</span>
          ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 68,
        align: "center",
        render: (_: any, mur: any) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => openEditModal(mur, false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand transition-colors hover:bg-[color:var(--surface-hover)]"
              title="Засах"
              aria-label="Засах"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setItemToDelete(mur);
                setDeleteModalOpen(true);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10"
              title="Устгах"
              aria-label="Устгах"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],

    [editedTariffs],
  );

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Хэрэгслийн мөр: хайлт + товчнууд */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-text)]" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Зардлын нэрээр хайх..."
              aria-label="Зардлын нэрээр хайх"
              className="stg-input !pl-9 !pr-10"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText("")}
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                title="Хайлтыг арилгах"
                aria-label="Хайлтыг арилгах"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Товчнууд — үргэлж БАРУУН ирмэгт */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {/* Excel — татах/оруулах хоёрыг НЭГ товчинд нэгтгэв */}
            <div className="relative" ref={excelMenuRef}>
              <ExcelButton
                id="zardal-excel-btn"
                label="Excel"
                title="Excel загвар татах, эсвэл Excel-ээр бөөнөөр оруулах"
                className="!h-10 !text-[14px]"
                onClick={() => setExcelMenuOpen((v) => !v)}
                suffix={
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${excelMenuOpen ? "rotate-180" : ""}`}
                  />
                }
              />

              {excelMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1 shadow-md">
                  <button
                    id="zardal-excel-template-btn"
                    onClick={() => {
                      setExcelMenuOpen(false);
                      zardalExcelZagvarTatya();
                    }}
                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[14px] text-[color:var(--panel-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    <Download className="h-4 w-4 shrink-0 text-brand" />
                    Загвар татах
                  </button>
                  <button
                    id="zardal-excel-import-btn"
                    onClick={() => {
                      setExcelMenuOpen(false);
                      zardalExcelInputRef.current?.click();
                    }}
                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[14px] text-[color:var(--panel-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    <Upload className="h-4 w-4 shrink-0 text-success" />
                    Excel оруулах
                  </button>
                </div>
              )}
            </div>
            <input
              ref={zardalExcelInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={zardalExcelOruulya}
              className="hidden"
            />
            <button
              type="button"
              onClick={async () => {
                showSpinner();
                try {
                  await syncZardluud();
                  openSuccessOverlay("Гэрээнүүдээс хуучин зардлуудыг амжилттай цэвэрлэлээ");
                } catch (e) {
                  openErrorOverlay("Цэвэрлэхэд алдаа гарлаа");
                } finally {
                  hideSpinner();
                }
              }}
              className="stg-btn stg-btn-ghost cursor-pointer"
              title="Хуучин зардлуудыг цэвэрлэх"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Цэвэрлэх</span>
            </button>
            {allBarilguud.length > 1 && (
              <button
                type="button"
                id="zardal-copy-buildings-btn"
                onClick={() => {
                  setSelectedCopyTargets([]);
                  setIsCopyModalOpen(true);
                }}
                className="stg-btn stg-btn-ghost cursor-pointer"
                title="Одоогийн барилгын зардлуудыг бусад барилгуудад хуулах"
              >
                <CopyPlus className="h-4 w-4" />
                <span>Барилгуудад хуулах</span>
              </button>
            )}
          </div>
        </div>

        <div className="stg-stack">
          <SettingsCard
            icon={<CalendarCheck className="h-4 w-4" />}
            title="Тогтмол зардлууд"
            subtitle={
              <>
                {togtmolZardluud.length} зардал · Нийт дүн:{" "}
                <span className="text-[color:var(--panel-text)]">
                  {formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮
                </span>
              </>
            }
            toggle={
              <button
                type="button"
                id="zardal-add-btn"
                onClick={() => openAddModal(false)}
                className="stg-btn stg-btn-primary cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Зардал нэмэх
              </button>
            }
          >
            <div
              id="zardal-list"
              className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] text-[14px]"
            >
              <Table<any>
                columns={zardliinColumns}
                loading={isLoadingAshiglaltiin}
                locale={{
                  emptyText: (
                    <div className="py-4">
                      <p className="text-[14px] text-[color:var(--panel-text)]">
                        Тогтмол зардал одоогоор алга
                      </p>
                      <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
                        Дээрх «Зардал нэмэх» товчийг дарж эхний зардлаа нэмнэ үү
                      </p>
                    </div>
                  ),
                }}
                dataSource={
                  bugdTogtmol
                    ? togtmolZardluud
                    : togtmolZardluud.slice(0, ZARDAL_URIDCHILAN_KHARUULAKH)
                }
                rowKey={(mur) => mur._id!}
                pagination={false}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="center">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="col-start-2 flex items-center justify-center gap-3">
                          <span className="whitespace-nowrap text-[13px] text-[color:var(--muted-text)]">
                            Нийт дүн:
                          </span>
                          <span className="whitespace-nowrap text-[15px] text-[color:var(--panel-text)]">
                            {formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮
                          </span>
                        </div>
                        {togtmolZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                          <button
                            type="button"
                            onClick={() => setBugdTogtmol((n) => !n)}
                            className="col-start-3 flex h-9 cursor-pointer items-center gap-1 justify-self-end whitespace-nowrap rounded-lg px-2 text-[13px] text-brand transition-colors hover:bg-[color:var(--surface-hover)]"
                          >
                            {bugdTogtmol
                              ? "Хураах"
                              : `Бүгдийг харах (${togtmolZardluud.length})`}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${bugdTogtmol ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </div>
          </SettingsCard>

          {/* Variable expenses section */}
          <SettingsCard
            icon={<Activity className="h-4 w-4" />}
            title="Хувьсах зардлууд"
            subtitle={
              <>
                {khuvisakhZardluud.length} зардал · Суурь дүн:{" "}
                <span className="text-[color:var(--panel-text)]">
                  {formatNumber(niitDungBodyo(khuvisakhZardluud, true), 2)} ₮
                </span>
              </>
            }
            toggle={
              <button
                type="button"
                id="zardal-add-variable-btn"
                onClick={() => openAddModal(true)}
                className="stg-btn stg-btn-primary cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Зардал нэмэх
              </button>
            }
          >
            <div className="flex flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] text-[14px]">
              <Table<any>
                columns={zardliinColumns}
                loading={isLoadingAshiglaltiin}
                locale={{
                  emptyText: (
                    <div className="py-4">
                      <p className="text-[14px] text-[color:var(--panel-text)]">
                        Хувьсах зардал одоогоор алга
                      </p>
                      <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
                        Дээрх «Зардал нэмэх» товчийг дарж эхний зардлаа нэмнэ үү
                      </p>
                    </div>
                  ),
                }}
                dataSource={
                  bugdKhuvisakh
                    ? khuvisakhZardluud
                    : khuvisakhZardluud.slice(0, ZARDAL_URIDCHILAN_KHARUULAKH)
                }
                rowKey={(mur) => mur._id!}
                pagination={false}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="center">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="col-start-2 flex items-center justify-center gap-3">
                          <span className="whitespace-nowrap text-[13px] text-[color:var(--muted-text)]">
                            Нийт дүн:
                          </span>
                          <span className="whitespace-nowrap text-[15px] text-[color:var(--panel-text)]">
                            {formatNumber(niitDungBodyo(khuvisakhZardluud), 2)} ₮
                          </span>
                        </div>
                        {khuvisakhZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                          <button
                            type="button"
                            onClick={() => setBugdKhuvisakh((n) => !n)}
                            className="col-start-3 flex h-9 cursor-pointer items-center gap-1 justify-self-end whitespace-nowrap rounded-lg px-2 text-[13px] text-brand transition-colors hover:bg-[color:var(--surface-hover)]"
                          >
                            {bugdKhuvisakh
                              ? "Хураах"
                              : `Бүгдийг харах (${khuvisakhZardluud.length})`}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${bugdKhuvisakh ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </div>
          </SettingsCard>
        </div>

        {/* Зардал нэмэх / засах — чирч хөдөлгөх боломжтой модал */}
        <AnimatePresence>
          {view === "form" && (
            <ModalPortal>
              <motion.div
                ref={formConstraintsRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                onClick={() => setView("list")}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  drag
                  dragListener={false}
                  dragControls={dragControls}
                  dragConstraints={formConstraintsRef}
                  dragMomentum={false}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-[600px] bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg overflow-hidden flex flex-col max-h-[92vh] my-auto"
                >
                  {/* Дээд чирэх хэсэг ба Гарчиг */}
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="px-5 sm:px-6 py-4 border-b border-[color:var(--surface-border)] flex items-center justify-between cursor-move select-none shrink-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center text-brand shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-[17px] text-[color:var(--panel-text)] leading-tight">
                            {editingItem
                              ? "Ашиглалтын зардал засах"
                              : "Ашиглалтын зардал бүртгэх"}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 text-[12px] rounded-full border transition-all ${formData.turul === "Тогтмол"
                              ? "bg-theme/10 text-brand border-theme/20"
                              : "bg-success/10 text-success border-success/20"
                              }`}
                          >
                            {formData.turul === "Тогтмол" ? "Тогтмол зардал" : "Хувьсах зардал"}
                          </span>
                        </div>
                        <p className="text-[13px] text-[color:var(--muted-text)] mt-1">
                          {editingItem
                            ? "Зардлын тохиргоо, тарифын дүнг шинэчлэх"
                            : "Шинэ ашиглалтын зардал, тарифыг бүртгэх"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors shrink-0 cursor-pointer"
                      title="Хаах"
                      aria-label="Хаах"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Маягт — нэг багана, дээрээс доош 1→5 алхмаар бөглөнө.
                      Том карт, олон шошго бүхий хоёр баганат загвар ахмад
                      хэрэглэгчдэд хаанаас эхлэхээ ойлгоход хэцүү байв. */}
                  {(() => {
                    const zaaltTsakhilgaan =
                      formData.ner.toLowerCase().includes("цахилгаан") &&
                      !formData.ner.toLowerCase().includes("дундын") &&
                      !formData.ner.toLowerCase().includes("өмчлөл");
                    return (
                      <div className="overflow-y-auto custom-scrollbar space-y-6 p-5 sm:p-6">
                        <Alkham dugaar={1} garchig="Зардлын нэр" tailbar="Нэхэмжлэх дээр ийм нэрээр харагдана" zaaval>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.ner}
                              onChange={(e) => {
                                const newName = e.target.value;
                                const isCakhilgaan = newName.toLowerCase().includes("цахилгаан");
                                const isVarElec =
                                  isCakhilgaan &&
                                  !newName.toLowerCase().includes("дундын") &&
                                  !newName.toLowerCase().includes("өмчлөл");
                                setFormData({
                                  ...formData,
                                  ner: newName,
                                  zaalt: isVarElec ? true : formData.zaalt,
                                  tariffUsgeer: isVarElec ? "кВт" : formData.tariffUsgeer,
                                });
                              }}
                              placeholder="Жишээ нь: Лифт, Хог, Харуул"
                              className="stg-input !h-11 !pr-11 !text-[15px]"
                            />
                            {formData.ner && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, ner: "" })}
                                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                                title="Нэрийг арилгах"
                                aria-label="Нэрийг арилгах"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <p className="mb-1.5 mt-3 text-[13px] text-[color:var(--muted-text)]">Эсвэл доороос сонгоно уу:</p>
                          <div className="flex flex-wrap gap-2">
                            {QUICK_PRESETS.map((preset) => {
                              const isActive = formData.ner.trim().toLowerCase() === preset.name.toLowerCase();
                              const IconComp = preset.icon;
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => applyQuickPreset(preset)}
                                  aria-pressed={isActive}
                                  className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors ${
                                    isActive
                                      ? "border-theme bg-theme !text-white"
                                      : "border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                                  }`}
                                >
                                  <IconComp className="h-4 w-4 opacity-70" />
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>
                        </Alkham>

                        <Alkham dugaar={2} garchig="Хэрхэн бодогдох вэ?" zaaval>
                          <div className="space-y-2" role="radiogroup" aria-label="Зардлын ангилал">
                            <Songolt
                              songogdson={formData.turul === "Тогтмол"}
                              onClick={() => setFormData({ ...formData, turul: "Тогтмол" })}
                              Icon={CalendarCheck}
                              ner="Сар бүр ижил дүн"
                              tailbar="Тогтмол зардал — жишээ нь хог, харуул, СӨХ-ийн төлбөр"
                            />
                            <Songolt
                              songogdson={formData.turul !== "Тогтмол"}
                              onClick={() => setFormData({ ...formData, turul: "Дурын" })}
                              Icon={Activity}
                              ner="Сар бүр өөр дүн"
                              tailbar="Хувьсах зардал — тоолуурын заалт, хэрэглээгээр бодогдоно"
                            />
                          </div>
                        </Alkham>

                        {!zaaltTsakhilgaan && (
                          <Alkham dugaar={3} garchig="Хэнд бодогдох вэ?" zaaval>
                            <div className="space-y-2" role="radiogroup" aria-label="Зардлын төрөл">
                              <Songolt
                                songogdson={(formData.zardliinTurul || "Энгийн") === "Энгийн"}
                                onClick={() => setFormData({ ...formData, zardliinTurul: "Энгийн" })}
                                Icon={Layers}
                                ner="Бүх оршин суугчид"
                                tailbar="Энгийн зардал — бүгдэд ижил бодогдоно"
                              />
                              <Songolt
                                songogdson={formData.zardliinTurul === "Лифт"}
                                onClick={() => setFormData({ ...formData, zardliinTurul: "Лифт" })}
                                Icon={ArrowUpDown}
                                ner="Лифт ашигладаг давхрынхан"
                                tailbar="Лифтний зардал — давхар, орцны тохиргооноос хамаарна"
                              />
                            </div>
                          </Alkham>
                        )}

                        <Alkham
                          dugaar={zaaltTsakhilgaan ? 3 : 4}
                          garchig={zaaltTsakhilgaan ? "Суурь хураамж" : "Сарын дүн"}
                          tailbar={
                            zaaltTsakhilgaan
                              ? "Тоолуурын заалтаас гадна сар бүр нэмэгдэх тогтмол дүн"
                              : formData.tariffUsgeer
                                ? `1 ${formData.tariffUsgeer}-ийн үнэ`
                                : "Нэг айл сар бүр төлөх дүн"
                          }
                          zaaval
                        >
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={zaaltTsakhilgaan ? suuriKhuraamjInput : tariffInputValue}
                              onChange={zaaltTsakhilgaan ? handleSuuriKhuraamjChange : handleTariffChange}
                              onFocus={(e) => e.currentTarget.select()}
                              onBlur={() => {
                                if (zaaltTsakhilgaan) {
                                  if (formData.suuriKhuraamj) setSuuriKhuraamjInput(formatNumber(formData.suuriKhuraamj, 2));
                                  else setSuuriKhuraamjInput("");
                                } else if (formData.tariff) setTariffInputValue(formatNumber(formData.tariff, 2));
                                else setTariffInputValue("");
                              }}
                              placeholder="0"
                              className="stg-input !h-12 !pr-10 text-right !text-[18px] tabular-nums"
                            />
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[color:var(--muted-text)]">
                              ₮
                            </span>
                          </div>
                          {zaaltTsakhilgaan && (
                            <p className="mt-2 text-[13px] text-[color:var(--muted-text)]">
                              Хэрэглээ нь тоолуурын заалтын файлаас бодогдоод энэ дүн дээр нэмэгдэнэ.
                            </p>
                          )}
                        </Alkham>

                        <Alkham
                          dugaar={zaaltTsakhilgaan ? 4 : 5}
                          garchig="Тайлбар"
                          tailbar="Заавал биш — дотоод тэмдэглэл"
                        >
                          <textarea
                            value={formData.tailbar}
                            onChange={(e) => setFormData({ ...formData, tailbar: e.target.value })}
                            placeholder="Жишээ нь: 2026 оны 9-р сараас эхлэн"
                            rows={2}
                            maxLength={TAILBARIIN_DEED_URT}
                            className="stg-input !h-auto resize-none py-2.5 leading-relaxed"
                          />
                          <div className="mt-1 text-right text-[12px] text-[color:var(--muted-text)]">
                            {(formData.tailbar || "").length}/{TAILBARIIN_DEED_URT}
                          </div>
                        </Alkham>

                        {/* Хураангуй — нэхэмжлэх дээр яаж харагдах */}
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-[color:var(--surface-hover)] px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-[12px] text-[color:var(--muted-text)]">Нэхэмжлэх дээр</div>
                            <div className="truncate text-[15px] text-[color:var(--panel-text)]">
                              {formData.ner.trim() || "Зардлын нэр"}
                              <span className="ml-2 text-[13px] text-[color:var(--muted-text)]">
                                · {formData.turul === "Тогтмол" ? "сар бүр ижил" : "сар бүр өөр"}
                                {!zaaltTsakhilgaan && formData.zardliinTurul === "Лифт" ? " · лифт" : ""}
                                {formData.nuatBodokhEsekh ? " · +10% НӨАТ" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[17px] tabular-nums text-brand">
                              {(zaaltTsakhilgaan ? suuriKhuraamjInput : tariffInputValue) || "0"} ₮
                            </div>
                            <div className="text-[12px] text-[color:var(--muted-text)]">
                              {zaaltTsakhilgaan ? "суурь + заалт" : "сард"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Хөл товчнууд */}
                  <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[color:var(--surface-border)] px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="stg-btn stg-btn-ghost cursor-pointer"
                    >
                      Болих
                    </button>
                    <button
                      type="button"
                      data-modal-primary
                      onClick={handleSave}
                      className="stg-btn stg-btn-primary cursor-pointer !px-5"
                    >
                      <Check className="h-4 w-4" />
                      {editingItem ? "Өөрчлөлт хадгалах" : "Зардал бүртгэх"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </ModalPortal>
          )}
        </AnimatePresence>

        {/* Устгах баталгаажуулах модал */}
        <AnimatePresence>
          {deleteModalOpen && itemToDelete && (
            <ModalPortal>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4"
                onClick={() => setDeleteModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 12 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] text-[color:var(--panel-text)]">
                      Зардал устгах уу?
                    </h3>
                    <p className="text-[13px] text-[color:var(--muted-text)] mt-1.5 leading-relaxed">
                      Та <span className=" text-[color:var(--panel-text)]">"{itemToDelete?.ner}"</span> зардлыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(false)}
                      className="stg-btn stg-btn-ghost flex-1 cursor-pointer"
                    >
                      Хаах
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="flex-1 h-10 text-[14px] rounded-[0.625rem] bg-danger hover:bg-danger/90 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Устгах</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </ModalPortal>
          )}
        </AnimatePresence>

        {/* Multi-Building Copy Modal */}
        <AnimatePresence>
          {isCopyModalOpen && (
            <ModalPortal>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => !isCopying && setIsCopyModalOpen(false)}
                />

                {/* Modal */}
                <motion.div
                  className="relative z-10 w-full max-w-md bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-lg overflow-hidden"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-[color:var(--surface-border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-theme/10 text-brand flex items-center justify-center shrink-0">
                        <CopyPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-[16px] text-[color:var(--panel-text)]">
                          Барилгуудад хуулах
                        </h3>
                        <p className="text-[12px] text-[color:var(--muted-text)] mt-0.5">
                          Эх: {allBarilguud.find((b) => String(b._id) === String(effectiveBarilgiinId))?.ner || "Сонгогдсон барилга"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isCopying && setIsCopyModalOpen(false)}
                      className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-all cursor-pointer"
                      title="Хаах"
                      aria-label="Хаах"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <p className="text-[13px] text-[color:var(--muted-text)] leading-relaxed">
                      Сонгосон барилгуудын хуучин зардлуудыг <span className="text-[color:var(--panel-text)]">бүтэн солино</span>. Хуулах барилгуудаа сонгоно уу:
                    </p>

                    {/* Select All */}
                    <label className="flex min-h-11 items-center gap-3 py-2 px-3.5 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] cursor-pointer transition-all">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                          selectedCopyTargets.length === otherBarilguud.length && otherBarilguud.length > 0
                            ? "bg-theme border-theme"
                            : "border-[color:var(--surface-border)]"
                        }`}
                        onClick={() => {
                          if (selectedCopyTargets.length === otherBarilguud.length) {
                            setSelectedCopyTargets([]);
                          } else {
                            setSelectedCopyTargets(otherBarilguud.map((b) => String(b._id)));
                          }
                        }}
                      >
                        {selectedCopyTargets.length === otherBarilguud.length && otherBarilguud.length > 0 && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className="text-[13px] text-[color:var(--panel-text)]">Бүгдийг сонгох</span>
                      <span className="ml-auto text-[12px] text-[color:var(--muted-text)]">{otherBarilguud.length} барилга</span>
                    </label>

                    {/* Building list */}
                    <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {otherBarilguud.map((barilga) => {
                        const bid = String(barilga._id);
                        const isChecked = selectedCopyTargets.includes(bid);
                        return (
                          <label
                            key={bid}
                            className="flex min-h-11 items-center gap-3 py-2 px-3.5 rounded-xl border border-[color:var(--surface-border)] cursor-pointer hover:bg-[color:var(--surface-hover)] transition-all"
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ${
                                isChecked ? "bg-theme border-theme" : "border-[color:var(--surface-border)]"
                              }`}
                              onClick={() => {
                                setSelectedCopyTargets((prev) =>
                                  isChecked ? prev.filter((id) => id !== bid) : [...prev, bid]
                                );
                              }}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <Building className="w-4 h-4 text-[color:var(--muted-text)] shrink-0" />
                            <span className="text-[13px] text-[color:var(--panel-text)] truncate">
                              {barilga.ner || bid}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 border-t border-[color:var(--surface-border)] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => !isCopying && setIsCopyModalOpen(false)}
                      className="stg-btn stg-btn-ghost flex-1 cursor-pointer"
                      disabled={isCopying}
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyToBuildings}
                      disabled={isCopying || selectedCopyTargets.length === 0}
                      className="stg-btn stg-btn-primary flex-1 cursor-pointer"
                    >
                      {isCopying ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CopyPlus className="w-4 h-4" />
                      )}
                      <span>{isCopying ? "Хуулж байна..." : `${selectedCopyTargets.length} барилгад хуулах`}</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </ModalPortal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
