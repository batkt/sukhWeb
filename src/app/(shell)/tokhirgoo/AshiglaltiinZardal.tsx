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

  // Тогтмол/хувьсах зардлын хүснэгтийн нэгдсэн багана.
  const zardliinColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: "33%",
        render: (v: any) => (
          <div className="max-w-[150px] leading-tight break-words sm:max-w-[300px] sm:">
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
                {formatNumber(currentValue, 2)} {mur.tariffUsgeer || "₮"}
              </div>
              {changed && (
                <span className="whitespace-nowrap tracking-tighter text-warning uppercase">
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
        width: 96,
        align: "center",
        render: (_: any, mur: any) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => openEditModal(mur, false)}
              className="shrink-0 rounded-lg p-1.5 text-brand transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              title="Засах"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setItemToDelete(mur);
                setDeleteModalOpen(true);
              }}
              className="shrink-0 rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10"
              title="Устгах"
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
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-brand" />
            <h2 className="text-xl text-[color:var(--panel-text)]">
              Ашиглалтын зардал
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              id="zardal-excel-template-btn"
              onClick={zardalExcelZagvarTatya}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--panel)] transition-all flex items-center gap-2"
              title="Одоогийн зардлуудаар дүүргэсэн Excel татах"
            >
              <Download className="w-3.5 h-3.5" />
              Excel загвар татах
            </button>
            <button
              id="zardal-excel-import-btn"
              onClick={() => zardalExcelInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--panel)] transition-all flex items-center gap-2"
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
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--panel)] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Гэрээнээс хуучин зардал цэвэрлэх
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-theme/10 to-theme/5">
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
                        <Table.Summary.Cell colSpan={4} align="right">
                          <span className="whitespace-nowrap text-[11px] font-bold tracking-wide opacity-70 sm:text-xs">
                            Нийт дүн:
                          </span>{" "}
                          <span className="whitespace-nowrap text-sm font-bold sm:text-base">
                            {formatNumber(niitDungBodyo(togtmolZardluud), 2)} ₮
                          </span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  />
                  {togtmolZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                    <div className="flex justify-end px-4">
                      <button
                        onClick={() => setBugdTogtmol((n) => !n)}
                        className="flex cursor-pointer items-center gap-1.5 py-2 text-[11px] font-semibold transition-colors sm:text-xs"
                      >
                        {bugdTogtmol
                          ? "Хураах"
                          : `Бүгдийг харах (${togtmolZardluud.length})`}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            bugdTogtmol ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Variable expenses section */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-theme/10 to-theme/5">
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
                        <Table.Summary.Cell colSpan={4} align="right">
                          <span className="whitespace-nowrap text-[11px] font-bold tracking-wide opacity-70 sm:text-xs">
                            Нийт дүн:
                          </span>{" "}
                          <span className="whitespace-nowrap text-sm font-bold sm:text-base">
                            {formatNumber(niitDungBodyo(khuvisakhZardluud), 2)} ₮
                          </span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  />
                  {khuvisakhZardluud.length > ZARDAL_URIDCHILAN_KHARUULAKH && (
                    <div className="flex justify-end px-4">
                      <button
                        onClick={() => setBugdKhuvisakh((n) => !n)}
                        className="flex cursor-pointer items-center gap-1.5 py-2 text-[11px] font-semibold transition-colors sm:text-xs"
                      >
                        {bugdKhuvisakh
                          ? "Хураах"
                          : `Бүгдийг харах (${khuvisakhZardluud.length})`}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            bugdKhuvisakh ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  )}
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
                      <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-brand" />
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
                        Зардлын нэр <span className="text-danger">*</span>
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
                          Зардлын төрөл <span className="text-danger">*</span>
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
                          Суурь хураамж (₮) <span className="text-danger">*</span>
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
                              <span className="text-brand font-bold text-xs">
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
                          Тарифын дүн (₮) <span className="text-danger">*</span>
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
                            <span className="text-brand font-bold text-xs">
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
                      className="px-5 py-2 text-xs bg-theme hover:bg-theme text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
