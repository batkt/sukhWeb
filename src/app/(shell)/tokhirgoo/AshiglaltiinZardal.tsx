"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal as MModal,
  Tooltip as MTooltip,
  NumberInput as MNumberInput,
  Badge,
  Button as MButton,
  TextInput as MTextInput,
  Textarea as MTextarea,
  Select as MSelect,
  Loader,
} from "@mantine/core";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import formatNumber from "../../../../tools/function/formatNumber";
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
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../../tools/function/deleteMethod";
import Button from "@/components/ui/Button";
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

export default function AshiglaltiinZardluud() {
  const { token, ajiltan, barilgiinId } = useAuth();
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
    zardliinTurul: undefined,
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

  const niitDungBodyo = (jagsaalt: ZardalItem[], tsakhilgaanShalgakh = false) =>
    jagsaalt.reduce((niit, item) => {
      const nameLower = (item.ner || "").toLowerCase();
      const isVariableElectricity =
        tsakhilgaanShalgakh &&
        nameLower.includes("цахилгаан") &&
        !nameLower.includes("дундын") &&
        !nameLower.includes("өмчлөл");
      const displayValue = isVariableElectricity
        ? item.suuriKhuraamj || 0
        : item.tariff;
      const currentValue =
        editedTariffs[item._id!] !== undefined
          ? editedTariffs[item._id!]
          : displayValue;
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
              `Мөр ${f.row || "?"}${f.ner ? ` (${f.ner})` : ""}: ${
                f.error || "Алдаа"
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
      zardliinTurul: undefined,
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
      zardliinTurul: item.zardliinTurul,
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl text-[color:var(--panel-text)]">
              Ашиглалтын зардал
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              id="zardal-excel-template-btn"
              onClick={zardalExcelZagvarTatya}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              title="Одоогийн зардлуудаар дүүргэсэн Excel татах"
            >
              <Download className="w-3.5 h-3.5" />
              Excel загвар татах
            </button>
            <button
              id="zardal-excel-import-btn"
              onClick={() => zardalExcelInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              title="Excel-ээр зардал нэмэх, тарифыг бөөнөөр засах"
            >
              <Upload className="w-3.5 h-3.5" />
              Excel оруулах
            </button>
            <input
              ref={zardalExcelInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={zardalExcelOruulya}
              className="hidden"
            />
            <button
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
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Гэрээнээс хуучин зардал цэвэрлэх
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg text-theme">Тогтмол зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {togtmolZardluud.length} зардал
                    </p>
                  </div>
                </div>

                <Button
                  id="zardal-add-btn"
                  onClick={() => openAddModal(false)}
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusOutlined />}
                >
                  Нэмэх
                </Button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : togtmolZardluud.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme ">Тогтмол зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">
                    Зардал нэмэх товчийг дарж эхлүүлнэ үү
                  </p>
                </div>
              ) : (
                <div id="zardal-list" className="flex flex-col">
                  <div>
                    <table className="w-full text-sm">
                      <thead className="bg-[color:var(--surface-bg)]">
                        <tr className="text-left text-[color:var(--muted-text)] text-[10px] sm:text-xs uppercase tracking-wider border-b-2 border-slate-300 dark:border-slate-600">
                          <th className="py-2 px-2 whitespace-nowrap">Нэр</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">
                            Тариф
                          </th>
                          <th className="py-2 px-2 hidden md:table-cell whitespace-nowrap">
                            Тайлбар
                          </th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">
                            Үйлдэл
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bugdTogtmol
                          ? togtmolZardluud
                          : togtmolZardluud.slice(0, ZARDAL_URIDCHILAN_KHARUULAKH)
                        ).map((mur) => {
                            const displayValue = mur.tariff;
                            const currentValue =
                              editedTariffs[mur._id!] !== undefined
                                ? editedTariffs[mur._id!]
                                : displayValue;
                            const changed = currentValue !== displayValue;
                            return (
                              <tr
                                key={mur._id}
                                className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors duration-150"
                              >
                                <td className="py-2 px-2 text-theme w-1/3">
                                  <div className=" text-[13px] sm:text-sm max-w-[150px] sm:max-w-[400px] leading-tight break-words">
                                    {mur.ner}
                                  </div>
                                </td>

                                <td className="py-2 px-2">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="text-theme text-sm sm:text-sm whitespace-nowrap">
                                      {formatNumber(currentValue, 2)} ₮
                                    </div>
                                    {changed && (
                                      <span className="text-[9px] text-amber-600  uppercase tracking-tighter whitespace-nowrap">
                                        Өөрчлөгдсөн
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-theme text-[12px] sm:text-sm max-w-[100px] lg:max-w-[150px] truncate hidden md:table-cell">
                                  {mur.tailbar || (
                                    <span className="text-[color:var(--muted-text)] opacity-40">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                      onClick={() => openEditModal(mur, false)}
                                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shrink-0"
                                      style={{
                                        borderRadius: "0.5rem",
                                        color: "#2563eb",
                                      }}
                                      title="Засах"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
                                      style={{
                                        borderRadius: "0.5rem",
                                        color: "#dc2626",
                                      }}
                                      title="Устгах"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {togtmolZardluud.length >
                          ZARDAL_URIDCHILAN_KHARUULAKH && (
                          <tr>
                            <td colSpan={4} className="p-0">
                              <div className="flex justify-end px-4">
                                <button
                                  onClick={() => setBugdTogtmol((n) => !n)}
                                  className="py-2 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  {bugdTogtmol
                                    ? "Хураах"
                                    : `Бүгдийг харах (${togtmolZardluud.length})`}
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${
                                      bugdTogtmol ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="border-t border-[color:var(--surface-border)]">
                        <tr className="bg-white dark:bg-gray-900">
                          <td colSpan={4} className="py-2.5 px-4">
                            <div className="flex items-center justify-end gap-3 text-right">
                              <span
                                className="text-[11px] sm:text-xs font-sans font-bold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap"
                                style={{ fontFamily: "Segoe UI, sans-serif" }}
                              >
                                Нийт дүн:
                              </span>
                              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variable expenses section */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg text-theme">Хувьсах зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {khuvisakhZardluud.length} зардал
                    </p>
                  </div>
                </div>

                <Button
                  id="zardal-add-variable-btn"
                  onClick={() => openAddModal(true)}
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusOutlined />}
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                >
                  Нэмэх
                </Button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : khuvisakhZardluud.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme ">Хувьсах зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">
                    Зардал нэмэх товчийг дарж эхлүүлнэ үү
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div>
                    <table className="w-full text-sm">
                      <thead className="bg-[color:var(--surface-bg)]">
                        <tr className="text-left text-[color:var(--muted-text)] text-[10px] sm:text-xs uppercase tracking-wider border-b-2 border-slate-300 dark:border-slate-600">
                          <th className="py-2 px-2 whitespace-nowrap">Нэр</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">
                            Тариф
                          </th>
                          <th className="py-2 px-2 hidden md:table-cell whitespace-nowrap">
                            Тайлбар
                          </th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">
                            Үйлдэл
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bugdKhuvisakh
                          ? khuvisakhZardluud
                          : khuvisakhZardluud.slice(0, ZARDAL_URIDCHILAN_KHARUULAKH)
                        ).map((mur) => {
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
                              <tr
                                key={mur._id}
                                className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors duration-150"
                              >
                                <td className="py-2 px-2 sm:px-4 text-theme w-1/3">
                                  <div className=" text-[13px] sm:text-sm max-w-[150px] sm:max-w-[200px] md:max-w-[300px] leading-tight break-words">
                                    {mur.ner}
                                  </div>
                                </td>

                                <td className="py-2 px-2 sm:px-4">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="text-theme text-sm sm:text-sm whitespace-nowrap">
                                      {formatNumber(currentValue, 2)}{" "}
                                      {mur.tariffUsgeer || "₮"}
                                    </div>
                                    {changed && (
                                      <span className="text-[9px] text-amber-600  uppercase tracking-tighter whitespace-nowrap">
                                        Өөрчлөгдсөн
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-theme text-[12px] sm:text-sm max-w-[100px] lg:max-w-[150px] truncate hidden md:table-cell">
                                  {mur.tailbar || (
                                    <span className="text-[color:var(--muted-text)] opacity-40">
                                      -
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                      onClick={() => openEditModal(mur, false)}
                                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shrink-0"
                                      style={{
                                        borderRadius: "0.5rem",
                                        color: "#2563eb",
                                      }}
                                      title="Засах"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shrink-0"
                                      style={{
                                        borderRadius: "0.5rem",
                                        color: "#dc2626",
                                      }}
                                      title="Устгах"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {khuvisakhZardluud.length >
                          ZARDAL_URIDCHILAN_KHARUULAKH && (
                          <tr>
                            <td colSpan={4} className="p-0">
                              <div className="flex justify-end px-4">
                                <button
                                  onClick={() => setBugdKhuvisakh((n) => !n)}
                                  className="py-2 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  {bugdKhuvisakh
                                    ? "Хураах"
                                    : `Бүгдийг харах (${khuvisakhZardluud.length})`}
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${
                                      bugdKhuvisakh ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="border-t border-[color:var(--surface-border)]">
                        <tr className="bg-white dark:bg-gray-900">
                          <td colSpan={4} className="py-2.5 px-4">
                            <div className="flex items-center justify-end gap-3 text-right">
                              <span
                                className="text-[11px] sm:text-xs font-sans font-bold tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap"
                                style={{ fontFamily: "Segoe UI, sans-serif" }}
                              >
                                Нийт дүн:
                              </span>
                              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {formatNumber(
                                  niitDungBodyo(khuvisakhZardluud, true),
                                  2,
                                )}{" "}
                                ₮
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
                onClick={() => setView("list")}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  drag
                  dragListener={false}
                  dragControls={dragControls}
                  dragConstraints={formConstraintsRef}
                  dragMomentum={false}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full modal-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
                  style={{ width: "100%", maxWidth: "480px" }}
                >
                  {/* Толгой */}
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[color:var(--surface-border)] cursor-move select-none shrink-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base text-[color:var(--panel-text)] font-semibold leading-tight">
                          {editingItem
                            ? "Ашиглалтын зардал засах"
                            : "Ашиглалтын зардал бүртгэх"}
                        </h2>
                        <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                          {editingItem
                            ? "Зардлын мэдээллийг шинэчилнэ үү"
                            : "Шинэ зардлын мэдээллийг оруулна уу"}
                          {" · "}
                          {formData.turul === "Тогтмол" ? "Тогтмол" : "Хувьсах"} зардал
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="p-1.5 rounded-xl hover:bg-[color:var(--surface-hover)] transition-colors shrink-0 cursor-pointer"
                      aria-label="Хаах"
                    >
                      <X className="w-4 h-4 text-[color:var(--muted-text)]" />
                    </button>
                  </div>

                  {/* Талбарууд */}
                  <div className="px-5 py-4 space-y-3 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[color:var(--panel-text)]">
                        Зардлын нэр <span className="text-red-500">*</span>
                      </label>
                      <MTextInput
                        value={formData.ner}
                        onChange={(e) => {
                          const newName = e.currentTarget.value;
                          const isCakhilgaan = newName
                            .toLowerCase()
                            .includes("цахилгаан");
                          setFormData({
                            ...formData,
                            ner: newName,
                            zaalt: isCakhilgaan ? true : formData.zaalt,
                            tariffUsgeer: isCakhilgaan ? "кВт" : formData.tariffUsgeer,
                          });
                        }}
                        placeholder="Жишээ: Цахилгааны төлбөр"
                        classNames={{
                          input:
                            "rounded-xl h-10 text-sm shadow-sm transition-all",
                        }}
                        leftSection={<Tag className="w-3.5 h-3.5 text-theme opacity-50" />}
                      />
                    </div>

                    {/* Цахилгааны төрөл нь заалтаар тодорхойлогддог тул энд нуугдана */}
                    {!formData.ner.toLowerCase().includes("цахилгаан") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[color:var(--panel-text)]">
                          Зардлын төрөл <span className="text-red-500">*</span>
                        </label>
                        <MSelect
                          value={formData.zardliinTurul ?? undefined}
                          onChange={(value) =>
                            setFormData({
                              ...formData,
                              zardliinTurul: value as string,
                            })
                          }
                          data={[
                            { label: "Энгийн / Default", value: "Энгийн" },
                            { label: "Лифт / Elevator", value: "Лифт" },
                          ]}
                          placeholder="Төрөл сонгох"
                          searchable={false}
                          classNames={{
                            input: "rounded-xl h-10 text-sm",
                          }}
                          leftSection={
                            <Layers className="w-3.5 h-3.5 text-theme opacity-50" />
                          }
                        />
                      </div>
                    )}

                    {formData.ner.toLowerCase().includes("цахилгаан") &&
                    !formData.ner.toLowerCase().includes("дундын") &&
                    !formData.ner.toLowerCase().includes("өмчлөл") ? (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[color:var(--panel-text)]">
                          Суурь хураамж (₮) <span className="text-red-500">*</span>
                        </label>
                        <div>
                          <MTextInput
                            value={suuriKhuraamjInput}
                            onChange={handleSuuriKhuraamjChange}
                            onBlur={() => {
                              if (formData.suuriKhuraamj)
                                setSuuriKhuraamjInput(
                                  formatNumber(formData.suuriKhuraamj, 2),
                                );
                              else setSuuriKhuraamjInput("");
                            }}
                            onFocus={(e) => {
                              e.currentTarget.select();
                            }}
                            placeholder="0.00"
                            classNames={{
                              input: "rounded-xl h-10 text-theme text-sm shadow-sm",
                            }}
                            leftSection={
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                ₮
                              </span>
                            }
                          />
                          <p className="text-[10px] text-[color:var(--muted-text)] mt-0.5">
                            Excel файлаас ирэх суурь дүн (заалтаас авна)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[color:var(--panel-text)]">
                          Тарифын дүн (₮) <span className="text-red-500">*</span>
                        </label>
                        <MTextInput
                          value={tariffInputValue}
                          onChange={handleTariffChange}
                          onBlur={() => {
                            if (formData.tariff)
                              setTariffInputValue(
                                formatNumber(formData.tariff, 2),
                              );
                            else setTariffInputValue("");
                          }}
                          onFocus={(e) => {
                            e.currentTarget.select();
                          }}
                          placeholder="0.00"
                          classNames={{
                            input: "rounded-xl h-10 text-theme text-sm shadow-sm",
                          }}
                          leftSection={
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              ₮
                            </span>
                          }
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[color:var(--panel-text)]">
                        Тайлбар
                      </label>
                      <div>
                        <MTextarea
                          value={formData.tailbar}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tailbar: e.currentTarget.value,
                            })
                          }
                          placeholder="Тайлбар бичнэ үү..."
                          minRows={2.5}
                          maxLength={TAILBARIIN_DEED_URT}
                          classNames={{ input: "rounded-xl shadow-sm p-2.5 text-xs sm:text-sm" }}
                        />
                        <div className="text-right text-[10px] text-[color:var(--muted-text)] mt-0.5">
                          {(formData.tailbar || "").length}/{TAILBARIIN_DEED_URT}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Хөл */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[color:var(--surface-border)] shrink-0">
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="px-4 py-2 text-xs border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-colors cursor-pointer"
                      style={{ borderRadius: "0.75rem" }}
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      style={{ borderRadius: "0.75rem" }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Хадгалах
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </ModalPortal>
          )}
        </AnimatePresence>

        <MModal
          title="Устгах уу?"
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme ",
            close:
              "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.5, blur: 6 }}
          centered
          size="sm"
        >
          <div className="space-y-4 mt-4">
            <p className="text-theme">
              Та "{itemToDelete?.ner}" зардал устгахдаа итгэлтэй байна уу?
            </p>
            <div className="flex justify-end gap-2">
              <MButton
                onClick={() => setDeleteModalOpen(false)}
                className="btn-minimal"
                radius="xl"
              >
                Хаах
              </MButton>
              <MButton
                color="red"
                onClick={handleDeleteConfirm}
                className="btn-minimal btn-cancel"
                radius="xl"
              >
                Устгах
              </MButton>
            </div>
          </div>
        </MModal>
      </div>
    </div>
  );
}
