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
          <span className="text-xs text-[color:var(--muted-text)]">
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
          <div className="max-w-[260px] leading-tight break-words sm:max-w-[420px]">
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
              <div className="whitespace-nowrap">
                {formatNumber(currentValue, 2)}
                {mur.tariffUsgeer ? ` ${mur.tariffUsgeer}` : ""}
              </div>
              {changed && (
                <span className="whitespace-nowrap tracking-tighter text-warning ">
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
        render: (v: any) => v || <span className="opacity-40">-</span>,
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
              className="shrink-0 rounded-lg p-1 text-brand transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              title="Засах"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setItemToDelete(mur);
                setDeleteModalOpen(true);
              }}
              className="shrink-0 rounded-lg p-1 text-danger transition-colors hover:bg-danger/10"
              title="Устгах"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],

    [editedTariffs],
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-4 sm:p-5 space-y-4">
        {/* Page Top Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[color:var(--surface-border)] gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-theme/10 text-theme flex items-center justify-center shrink-0 border border-theme/20 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl text-[color:var(--panel-text)] tracking-tight">
                Ашиглалтын зардал
              </h2>
              <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                Тогтмол болон тоолуур, заалтаар бодогдох хэрэглээний тарифууд
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end w-full lg:w-auto">
            {/* Live Search Input */}
            <div className="relative flex-1 sm:w-60 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Зардлын нэрээр хайх..."
                className="w-full h-9 pl-9 pr-7 text-xs bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] rounded-xl text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Товчнууд — үргэлж БАРУУН ирмэгт */}
            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            {/* Excel — татах/оруулах хоёрыг НЭГ товчинд нэгтгэв */}
            <div className="relative" ref={excelMenuRef}>
              <ExcelButton
                id="zardal-excel-btn"
                label="Excel"
                title="Excel загвар татах, эсвэл Excel-ээр бөөнөөр оруулах"
                onClick={() => setExcelMenuOpen((v) => !v)}
                suffix={
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${excelMenuOpen ? "rotate-180" : ""}`}
                  />
                }
              />

              {excelMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--panel)] p-1 shadow-lg">
                  <button
                    id="zardal-excel-template-btn"
                    onClick={() => {
                      setExcelMenuOpen(false);
                      zardalExcelZagvarTatya();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[color:var(--panel-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0 text-theme" />
                    Загвар татах
                  </button>
                  <button
                    id="zardal-excel-import-btn"
                    onClick={() => {
                      setExcelMenuOpen(false);
                      zardalExcelInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[color:var(--panel-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
                  >
                    <Upload className="h-3.5 w-3.5 shrink-0 text-success" />
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
              className="px-3 py-2 text-xs rounded-xl bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--panel)] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Хуучин зардлуудыг цэвэрлэх"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[color:var(--muted-text)]" />
              <span>Цэвэрлэх</span>
            </button>
            {allBarilguud.length > 1 && (
              <button
                id="zardal-copy-buildings-btn"
                onClick={() => {
                  setSelectedCopyTargets([]);
                  setIsCopyModalOpen(true);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-theme/10 text-theme border border-theme/20 hover:bg-theme/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Одоогийн барилгын зардлуудыг бусад барилгуудад хуулах"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                <span>Барилгуудад хуулах</span>
              </button>
            )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-theme/10 to-theme/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-theme/10 text-theme flex items-center justify-center shrink-0 border border-theme/20">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base text-[color:var(--panel-text)]">Тогтмол зардлууд</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-theme/10 text-theme border border-theme/20">
                        {togtmolZardluud.length}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Нийт дүн: <span className=" text-[color:var(--panel-text)]">{formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮</span>
                    </p>
                  </div>
                </div>

                <Button
                  id="zardal-add-btn"
                  onClick={() => openAddModal(false)}
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Зардал нэмэх
                </Button>
              </div>

              <div id="zardal-list" className="flex flex-col">
                <Table<any>
                  columns={zardliinColumns}
                  loading={isLoadingAshiglaltiin}
                  locale={{
                    emptyText: (
                      <div>
                        <p>Тогтмол зардал байхгүй байна</p>
                        <p className="mt-1 text-xs opacity-70">
                          Зардал нэмэх товчийг дарж эхлүүлнэ үү
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
                            <span className="whitespace-nowrap text-[11px] tracking-wide opacity-70 sm:text-xs">
                              Нийт дүн:
                            </span>
                            <span className="whitespace-nowrap text-sm sm:text-base">
                              {formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮
                            </span>
                          </div>
                          {togtmolZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                            <button
                              onClick={() => setBugdTogtmol((n) => !n)}
                              className="col-start-3 flex cursor-pointer items-center gap-1 justify-self-end whitespace-nowrap text-[11px] text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] sm:text-xs"
                            >
                              {bugdTogtmol
                                ? "Хураах"
                                : `Бүгдийг харах (${togtmolZardluud.length})`}
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${bugdTogtmol ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Variable expenses section */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-emerald-500/10 to-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base text-[color:var(--panel-text)]">Хувьсах зардлууд</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {khuvisakhZardluud.length}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Суурь дүн: <span className=" text-[color:var(--panel-text)]">{formatNumber(niitDungBodyo(khuvisakhZardluud, true), 2)} ₮</span>
                    </p>
                  </div>
                </div>

                <Button
                  id="zardal-add-variable-btn"
                  onClick={() => openAddModal(true)}
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                >
                  Зардал нэмэх
                </Button>
              </div>

              <div className="flex flex-col">
                <Table<any>
                  columns={zardliinColumns}
                  loading={isLoadingAshiglaltiin}
                  locale={{
                    emptyText: (
                      <div>
                        <p>Хувьсах зардал байхгүй байна</p>
                        <p className="mt-1 text-xs opacity-70">
                          Зардал нэмэх товчийг дарж эхлүүлнэ үү
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
                            <span className="whitespace-nowrap text-[11px] tracking-wide opacity-70 sm:text-xs">
                              Нийт дүн:
                            </span>
                            <span className="whitespace-nowrap text-sm sm:text-base">
                              {formatNumber(niitDungBodyo(khuvisakhZardluud), 2)} ₮
                            </span>
                          </div>
                          {khuvisakhZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                            <button
                              onClick={() => setBugdKhuvisakh((n) => !n)}
                              className="col-start-3 flex cursor-pointer items-center gap-1 justify-self-end whitespace-nowrap text-[11px] text-[color:var(--muted-text)] transition-colors hover:text-[color:var(--panel-text)] sm:text-xs"
                            >
                              {bugdKhuvisakh
                                ? "Хураах"
                                : `Бүгдийг харах (${khuvisakhZardluud.length})`}
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${bugdKhuvisakh ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </div>
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
                className="fixed inset-0 z-[12000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
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
                  className="relative w-full max-w-[540px] lg:max-w-[900px] bg-[color:var(--surface-bg)] rounded-[28px] border border-[color:var(--surface-border)] shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 flex flex-col max-h-[92vh] my-auto"
                >
                  {/* Дээд чирэх хэсэг ба Гарчиг */}
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="px-6 py-4.5 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/40 flex items-center justify-between cursor-move select-none shrink-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-theme/20 via-emerald-500/15 to-teal-500/10 border border-theme/30 flex items-center justify-center text-theme shadow-inner shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg text-[color:var(--panel-text)] tracking-tight leading-none">
                            {editingItem
                              ? "Ашиглалтын зардал засах"
                              : "Ашиглалтын зардал бүртгэх"}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all ${formData.turul === "Тогтмол"
                              ? "bg-theme/10 text-theme border-theme/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              }`}
                          >
                            {formData.turul === "Тогтмол" ? "Тогтмол зардал" : "Хувьсах зардал"}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--muted-text)] mt-1">
                          {editingItem
                            ? "Зардлын тохиргоо, тарифын дүнг шинэчлэх"
                            : "Шинэ ашиглалтын зардал, тарифыг бүртгэх"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="p-2 rounded-full hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors shrink-0 cursor-pointer"
                      aria-label="Хаах"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Маягтын талбарууд */}
                  <div className="overflow-y-auto custom-scrollbar p-6">
                    {/* Зүүн багана — зардлыг ТОДОРХОЙЛОХ; баруун — ДҮН,
                        тайлбар, урьдчилсан харагдац. Нарийн дэлгэцэд
                        нэг багана болж хэвийн урсана. */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                      <div className="space-y-5">
                        {/* 1. Зардлын ангилал: Тогтмол / Хувьсах */}
                        <div>
                          <label className="block text-xs text-[color:var(--panel-text)] mb-2 ">
                            Зардлын ангилал <span className="text-danger">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, turul: "Тогтмол" })}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${formData.turul === "Тогтмол"
                                ? "bg-theme/10 border-theme text-theme ring-2 ring-theme/20 shadow-xs"
                                : "bg-[color:var(--surface-hover)]/40 border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                                }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formData.turul === "Тогтмол"
                                  ? "bg-theme text-white"
                                  : "bg-[color:var(--surface-border)] text-[color:var(--muted-text)]"
                                  }`}
                              >
                                <CalendarCheck className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 pr-4">
                                <div className="text-xs leading-tight">Тогтмол зардал</div>
                                <div className="text-[11px] text-[color:var(--muted-text)] mt-0.5 leading-snug">
                                  Сар бүр ижил үнийн дүнгээр бодогдоно
                                </div>
                              </div>
                              {formData.turul === "Тогтмол" && (
                                <div className="absolute right-2.5 top-2.5 w-4 h-4 rounded-full bg-theme text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, turul: "Дурын" })}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${formData.turul !== "Тогтмол"
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                                : "bg-[color:var(--surface-hover)]/40 border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                                }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formData.turul !== "Тогтмол"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-[color:var(--surface-border)] text-[color:var(--muted-text)]"
                                  }`}
                              >
                                <Activity className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 pr-4">
                                <div className="text-xs leading-tight">Хувьсах зардал</div>
                                <div className="text-[11px] text-[color:var(--muted-text)] mt-0.5 leading-snug">
                                  Заалт, хэрэглээгээр сар бүр өөрчлөгдөнө
                                </div>
                              </div>
                              {formData.turul !== "Тогтмол" && (
                                <div className="absolute right-2.5 top-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 2. Зардлын нэр + Шуурхай сонголтууд */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-[color:var(--panel-text)] ">
                              Зардлын нэр <span className="text-danger">*</span>
                            </label>
                            <span className="text-[11px] text-[color:var(--muted-text)]">
                              Жишээ: Лифт, Хог, Харуул...
                            </span>
                          </div>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme pointer-events-none opacity-60">
                              <Tag className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={formData.ner}
                              onChange={(e) => {
                                const newName = e.target.value;
                                const isCakhilgaan = newName
                                  .toLowerCase()
                                  .includes("цахилгаан");
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
                              placeholder="Зардлын нэрээ оруулна уу..."
                              className="w-full h-11 pl-10 pr-9 bg-[color:var(--surface-hover)]/40 border border-[color:var(--surface-border)] rounded-xl text-sm font-medium text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all shadow-xs"
                            />
                            {formData.ner && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, ner: "" })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Шуурхай сонгох товчнууд */}
                          <div className="mt-2.5">
                            <div className="text-[11px] font-medium text-[color:var(--muted-text)] mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-theme" />
                              Шуурхай сонголтууд:
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {QUICK_PRESETS.map((preset) => {
                                const isActive =
                                  formData.ner.trim().toLowerCase() ===
                                  preset.name.toLowerCase();
                                const IconComp = preset.icon;
                                return (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyQuickPreset(preset)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                                      ? "bg-theme text-white border-theme shadow-xs"
                                      : "bg-[color:var(--surface-hover)]/50 border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                                      }`}
                                  >
                                    <IconComp className="w-3 h-3 opacity-70" />
                                    <span>{preset.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 3. Зардлын төрөл: Энгийн / Лифт */}
                        {!(
                          formData.ner.toLowerCase().includes("цахилгаан") &&
                          !formData.ner.toLowerCase().includes("дундын") &&
                          !formData.ner.toLowerCase().includes("өмчлөл")
                        ) && (
                            <div>
                              <label className="block text-xs text-[color:var(--panel-text)] mb-2 ">
                                Зардлын төрөл <span className="text-danger">*</span>
                              </label>
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({ ...formData, zardliinTurul: "Энгийн" })
                                  }
                                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${(formData.zardliinTurul || "Энгийн") === "Энгийн"
                                    ? "bg-theme/10 border-theme text-theme ring-2 ring-theme/20 shadow-xs"
                                    : "bg-[color:var(--surface-hover)]/40 border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                                    }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${(formData.zardliinTurul || "Энгийн") === "Энгийн"
                                      ? "bg-theme text-white"
                                      : "bg-[color:var(--surface-border)] text-[color:var(--muted-text)]"
                                      }`}
                                  >
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 pr-4">
                                    <div className="text-xs leading-tight">Энгийн зардал</div>
                                    <div className="text-[11px] text-[color:var(--muted-text)] mt-0.5 leading-snug">
                                      Бүх оршин суугчдад нийтлэг бодогдоно
                                    </div>
                                  </div>
                                  {(formData.zardliinTurul || "Энгийн") === "Энгийн" && (
                                    <div className="absolute right-2.5 top-2.5 w-4 h-4 rounded-full bg-theme text-white flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData({ ...formData, zardliinTurul: "Лифт" })
                                  }
                                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${formData.zardliinTurul === "Лифт"
                                    ? "bg-theme/10 border-theme text-theme ring-2 ring-theme/20 shadow-xs"
                                    : "bg-[color:var(--surface-hover)]/40 border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]"
                                    }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${formData.zardliinTurul === "Лифт"
                                      ? "bg-theme text-white"
                                      : "bg-[color:var(--surface-border)] text-[color:var(--muted-text)]"
                                      }`}
                                  >
                                    <ArrowUpDown className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 pr-4">
                                    <div className="text-xs leading-tight">Лифтний зардал</div>
                                    <div className="text-[11px] text-[color:var(--muted-text)] mt-0.5 leading-snug">
                                      Давхар, орцны тарифтай уялдана
                                    </div>
                                  </div>
                                  {formData.zardliinTurul === "Лифт" && (
                                    <div className="absolute right-2.5 top-2.5 w-4 h-4 rounded-full bg-theme text-white flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="space-y-5">
                        {/* 4. Санхүүгийн дүн: Тариф эсвэл Суурь хураамж */}
                        <div className="p-4 rounded-2xl bg-[color:var(--surface-hover)]/30 border border-[color:var(--surface-border)] space-y-3">
                          {formData.ner.toLowerCase().includes("цахилгаан") &&
                            !formData.ner.toLowerCase().includes("дундын") &&
                            !formData.ner.toLowerCase().includes("өмчлөл") ? (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-[color:var(--panel-text)] ">
                                  Суурь хураамж (₮) <span className="text-danger">*</span>
                                </label>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-[color:var(--muted-text)]">
                                  Тоолуураас гадна сар бүр
                                </span>
                              </div>

                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme text-base pointer-events-none">
                                  ₮
                                </div>
                                <input
                                  type="text"
                                  value={suuriKhuraamjInput}
                                  onChange={handleSuuriKhuraamjChange}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onBlur={() => {
                                    if (formData.suuriKhuraamj)
                                      setSuuriKhuraamjInput(
                                        formatNumber(formData.suuriKhuraamj, 2),
                                      );
                                    else setSuuriKhuraamjInput("");
                                  }}
                                  placeholder="0.00"
                                  className="w-full h-12 pl-10 pr-4 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl text-lg sm:text-xl text-theme placeholder:text-theme/20 focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all shadow-inner"
                                />
                              </div>

                              <p className="text-[11px] text-[color:var(--muted-text)] leading-relaxed">
                                ⚡ Цахилгааны тоолуурын заалтын файлаас хэрэглээ тооцогдох бөгөөд энэхүү дүн нь сар бүр сууриар нэмэгдэж бодогдоно.
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <label className="text-xs text-[color:var(--panel-text)] ">
                                  Тарифын дүн (₮) <span className="text-danger">*</span>
                                </label>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] text-[color:var(--muted-text)]">
                                  {formData.tariffUsgeer
                                    ? `1 ${formData.tariffUsgeer}`
                                    : "Нэгжийн үнэ / Сар бүр"}
                                </span>
                              </div>

                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme text-base pointer-events-none">
                                  ₮
                                </div>
                                <input
                                  type="text"
                                  value={tariffInputValue}
                                  onChange={handleTariffChange}
                                  onFocus={(e) => e.currentTarget.select()}
                                  onBlur={() => {
                                    if (formData.tariff)
                                      setTariffInputValue(
                                        formatNumber(formData.tariff, 2),
                                      );
                                    else setTariffInputValue("");
                                  }}
                                  placeholder="0.00"
                                  className="w-full h-12 pl-10 pr-4 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl text-lg sm:text-xl text-theme placeholder:text-theme/20 focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all shadow-inner"
                                />
                              </div>

                              <p className="text-[11px] text-[color:var(--muted-text)] leading-relaxed">
                                Нэхэмжлэх бодох үед тухайн оршин суугчийн гэрээний талбай эсвэл нэгжид тооцогдох сарын үндсэн төлбөр.
                              </p>
                            </>
                          )}
                        </div>

                        {/* 5. Тайлбар */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-[color:var(--panel-text)] flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-[color:var(--muted-text)]" />
                              Тайлбар
                            </label>
                            <span className="text-[11px] text-[color:var(--muted-text)]">
                              {(formData.tailbar || "").length}/{TAILBARIIN_DEED_URT}
                            </span>
                          </div>
                          <textarea
                            value={formData.tailbar}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                tailbar: e.target.value,
                              })
                            }
                            placeholder="Зардалтай холбоотой нэмэлт тайлбар, тодруулга бичнэ үү..."
                            rows={2}
                            maxLength={TAILBARIIN_DEED_URT}
                            className="w-full p-3 bg-[color:var(--surface-hover)]/40 border border-[color:var(--surface-border)] rounded-xl text-xs sm:text-sm text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all resize-none custom-scrollbar"
                          />
                        </div>

                        {/* 6. Нэхэмжлэхийн урьдчилсан харагдац */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-theme/5 via-[color:var(--surface-hover)]/30 to-transparent border border-theme/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-theme">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Нэхэмжлэх дээр харагдах урьдчилсан байдал</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] flex items-center justify-between gap-3 shadow-xs">
                            <div className="min-w-0">
                              <div className="text-xs text-[color:var(--panel-text)] truncate">
                                {formData.ner.trim() || "Зардлын нэр"}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] font-medium">
                                  {formData.turul === "Тогтмол" ? "Тогтмол" : "Хувьсах"}
                                </span>
                                {!(
                                  formData.ner.toLowerCase().includes("цахилгаан") &&
                                  !formData.ner.toLowerCase().includes("дундын") &&
                                  !formData.ner.toLowerCase().includes("өмчлөл")
                                ) && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-theme/10 text-theme font-medium">
                                      {formData.zardliinTurul || "Энгийн"}
                                    </span>
                                  )}
                                {formData.nuatBodokhEsekh && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                                    +10% НӨАТ
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm text-theme">
                                {formData.ner.toLowerCase().includes("цахилгаан") &&
                                  !formData.ner.toLowerCase().includes("дундын") &&
                                  !formData.ner.toLowerCase().includes("өмчлөл")
                                  ? `${suuriKhuraamjInput || "0.00"} ₮`
                                  : `${tariffInputValue || "0.00"} ₮`}
                              </div>
                              <div className="text-[11px] text-[color:var(--muted-text)]">
                                {formData.ner.toLowerCase().includes("цахилгаан") &&
                                  !formData.ner.toLowerCase().includes("дундын") &&
                                  !formData.ner.toLowerCase().includes("өмчлөл")
                                  ? "Суурь + Заалт"
                                  : "Нэгж үнэ"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Хөл товчнууд */}
                  <div className="px-6 py-4 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/30 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className="px-4 py-2 text-xs rounded-xl border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Цуцлах</span>
                      <kbd className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-[color:var(--surface-border)] text-[color:var(--muted-text)]">
                        Esc
                      </kbd>
                    </button>
                    <button
                      type="button"
                      data-modal-primary
                      onClick={handleSave}
                      className="px-6 py-2.5 text-xs rounded-xl bg-theme hover:bg-theme/90 text-white shadow-md shadow-theme/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? "Өөрчлөлт хадгалах" : "Зардал бүртгэх"}</span>
                      <kbd className="hidden sm:inline-block text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
                        Enter
                      </kbd>
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
                className="fixed inset-0 z-[12000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setDeleteModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 12 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-[color:var(--surface-bg)] rounded-[24px] border border-[color:var(--surface-border)] shadow-2xl p-6 text-center space-y-4 ring-1 ring-black/5 dark:ring-white/10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base text-[color:var(--panel-text)]">
                      Зардал устгах уу?
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)] mt-1.5 leading-relaxed">
                      Та <span className=" text-[color:var(--panel-text)]">"{itemToDelete?.ner}"</span> зардлыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(false)}
                      className="flex-1 py-2.5 text-xs rounded-xl border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-all cursor-pointer"
                    >
                      Хаах
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="flex-1 py-2.5 text-xs rounded-xl bg-danger hover:bg-danger/90 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => !isCopying && setIsCopyModalOpen(false)}
                />

                {/* Modal */}
                <motion.div
                  className="relative z-10 w-full max-w-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Header */}
                  <div className="p-4 border-b border-[color:var(--surface-border)] flex items-center justify-between bg-gradient-to-r from-theme/10 to-theme/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-theme/10 text-theme flex items-center justify-center border border-theme/20">
                        <CopyPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm text-[color:var(--panel-text)]">
                          Барилгуудад хуулах
                        </h3>
                        <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                          Эх: {allBarilguud.find((b) => String(b._id) === String(effectiveBarilgiinId))?.ner || "Сонгогдсон барилга"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isCopying && setIsCopyModalOpen(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-[color:var(--muted-text)] leading-relaxed">
                      Сонгосон барилгуудын хуучин зардлуудыг <span className="text-[color:var(--panel-text)]">бүтэн солино</span>. Хуулах барилгуудаа сонгоно уу:
                    </p>

                    {/* Select All */}
                    <label className="flex items-center gap-2.5 py-2 px-3 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] cursor-pointer hover:bg-theme/5 transition-all">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${
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
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-[color:var(--panel-text)]">Бүгдийг сонгох</span>
                      <span className="ml-auto text-[11px] text-[color:var(--muted-text)]">{otherBarilguud.length} барилга</span>
                    </label>

                    {/* Building list */}
                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                      {otherBarilguud.map((barilga) => {
                        const bid = String(barilga._id);
                        const isChecked = selectedCopyTargets.includes(bid);
                        return (
                          <label
                            key={bid}
                            className="flex items-center gap-2.5 py-2 px-3 rounded-xl border border-[color:var(--surface-border)] cursor-pointer hover:bg-[color:var(--surface-hover)] transition-all"
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all shrink-0 ${
                                isChecked ? "bg-theme border-theme" : "border-[color:var(--surface-border)]"
                              }`}
                              onClick={() => {
                                setSelectedCopyTargets((prev) =>
                                  isChecked ? prev.filter((id) => id !== bid) : [...prev, bid]
                                );
                              }}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <Building className="w-3.5 h-3.5 text-[color:var(--muted-text)] shrink-0" />
                            <span className="text-xs text-[color:var(--panel-text)] truncate">
                              {barilga.ner || bid}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 pt-2 border-t border-[color:var(--surface-border)] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => !isCopying && setIsCopyModalOpen(false)}
                      className="flex-1 py-2.5 text-xs rounded-xl border border-[color:var(--surface-border)] text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition-all cursor-pointer"
                      disabled={isCopying}
                    >
                      Цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyToBuildings}
                      disabled={isCopying || selectedCopyTargets.length === 0}
                      className="flex-1 py-2.5 text-xs rounded-xl bg-theme hover:bg-theme/90 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCopying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CopyPlus className="w-3.5 h-3.5" />
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
