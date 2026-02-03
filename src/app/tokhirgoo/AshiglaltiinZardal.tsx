"use client";

import React, { useState, useEffect } from "react";
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
import formatNumber from "../../../tools/function/formatNumber";
import { useAuth } from "@/lib/useAuth";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { fetchWithDomainFallback } from "@/lib/uilchilgee";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useBuilding } from "@/context/BuildingContext";
import { useSpinner } from "@/context/SpinnerContext";
import { Edit, Trash2, Activity, Layers, CreditCard, ChevronRight, Settings } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import deleteMethod from "../../../tools/function/deleteMethod";

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
    mutate: refreshZardluud,
  } = useAshiglaltiinZardluud({
    barilgiinId: selectedBuildingId || barilgiinId,
  });

  const [view, setView] = useState<"list" | "form">("list");
  const [editingItem, setEditingItem] = useState<ZardalItem | null>(null);
  const [isUilchilgeeModal, setIsUilchilgeeModal] = useState(false);
  const [editedTariffs, setEditedTariffs] = useState<Record<string, number>>(
    {}
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

  const [pageSize] = useState(100);
  const [filterText, setFilterText] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ZardalItem | null>(null);
  const [turul, setTurul] = useState("");
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
    setTariffInputValue(formatNumber(item.tariff, 2));
    setSuuriKhuraamjInput(
      item.suuriKhuraamj ? formatNumber(item.suuriKhuraamj, 2) : ""
    );
    setZaaltTariffInput(
      item.zaaltTariff ? formatNumber(item.zaaltTariff, 2) : ""
    );
    setZaaltDefaultDunInput(
      item.zaaltDefaultDun ? formatNumber(item.zaaltDefaultDun, 2) : ""
    );
    setTariff150kvInput(
      item.tariff150kv ? formatNumber(item.tariff150kv, 2) : ""
    );
    setTariff150to300kvInput(
      item.tariff150to300kv ? formatNumber(item.tariff150to300kv, 2) : ""
    );
    setTariff300pluskvInput(
      item.tariff300pluskv ? formatNumber(item.tariff300pluskv, 2) : ""
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
      const isVariableElectricity = nameLower.includes("цахилгаан") && 
                                     !nameLower.includes("дундын") && 
                                     !nameLower.includes("өмчлөл");
      
      // Check if this is a FIXED electricity charge (like "Дундын өмчлөл Цахилгаан")
      const isFixedElectricity = nameLower.includes("цахилгаан") && 
                                  (nameLower.includes("дундын") || nameLower.includes("өмчлөл"));
      
      let payload = { ...formData, barilgiinId: selectedBuildingId || barilgiinId || undefined };
      
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
        // Fixed electricity: zaalt=false, tariffUsgeer="₮", tariff is the fixed amount
        payload = {
          ...payload,
          zaalt: false,
          tariffUsgeer: "₮",
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
      ([id, val]) => itemsById.get(id)?.tariff !== val
    );
    if (changed.length === 0) return;
    showSpinner();
    try {
      await Promise.all(
        changed.map(async ([id, val]) => {
          const item = itemsById.get(id);
          if (!item) return;
          await updateZardal(id, { ...item, tariff: Number(val) });
        })
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
          description:
            "Зардлын жагсаалт энд байна.",
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

  if (view === "form") {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto overflow-auto max-h-[calc(100vh-220px)] custom-scrollbar pr-2 pb-10">
        <div className="flex items-center justify-between bg-white/40 dark:bg-black/20 p-4 rounded-3xl border border-[color:var(--surface-border)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("list")}
              className="p-2.5 bg-white dark:bg-gray-900 border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] rounded-xl transition-all shadow-sm hover:scale-105"
            >
              <ChevronRight className="w-4 h-4 rotate-180 text-theme" />
            </button>
            <div>
              <h2 className="text-lg font-black text-[color:var(--panel-text)] uppercase tracking-tight leading-none">
                {editingItem ? "Зардал засах" : "Шинэ зардал нэмэх"}
              </h2>
              <p className="text-[10px] font-bold text-[color:var(--muted-text)] mt-1 opacity-70 uppercase tracking-widest">
                {formData.turul === "Тогтмол" ? "Тогтмол" : "Хувьсах"} зардал
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MButton
              onClick={() => setView("list")}
              variant="subtle"
              size="sm"
              className="px-6 h-10 text-slate-500 font-bold hover:bg-slate-100/50 rounded-xl"
            >
              Буцах
            </MButton>
            <MButton
              size="sm"
              className="btn-save shadow-lg shadow-blue-500/20 rounded-xl px-10 h-10 font-black uppercase tracking-widest text-[10px]"
              onClick={handleSave}
            >
              Хадгалах
            </MButton>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-black/20 p-6 rounded-3xl border border-[color:var(--surface-border)] shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-[color:var(--muted-text)] uppercase tracking-widest ml-1">
                Зардлын нэр
              </label>
              <MTextInput
                value={formData.ner}
                onChange={(e) => {
                  const newName = e.currentTarget.value;
                  const isCakhilgaan = newName.toLowerCase().includes("цахилгаан");
                  setFormData({
                    ...formData,
                    ner: newName,
                    zaalt: isCakhilgaan ? true : formData.zaalt,
                    tariffUsgeer: isCakhilgaan ? "кВт" : formData.tariffUsgeer,
                  });
                }}
                placeholder="Жишээ: Цэвэр ус..."
                classNames={{ input: "rounded-xl h-11 font-bold text-base shadow-sm focus:ring-4 focus:ring-theme/5 transition-all" }}
                leftSection={<Activity className="w-4 h-4 text-theme opacity-50" />}
              />
            </div>

            {!formData.ner.toLowerCase().includes("цахилгаан") && (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-[color:var(--muted-text)] uppercase tracking-widest ml-1">
                  Зардлын төрөл
                </label>
                <MSelect
                  value={formData.zardliinTurul ?? undefined}
                  onChange={(value) => setFormData({ ...formData, zardliinTurul: value as string })}
                  data={[
                    { label: "Энгийн / Default", value: "Энгийн" },
                    { label: "Лифт / Elevator", value: "Лифт" },
                  ]}
                  placeholder="Сонгох..."
                  searchable={false}
                  classNames={{ input: "rounded-xl h-11 font-bold text-base" }}
                  leftSection={<Layers className="w-4 h-4 text-theme opacity-50" />}
                />
              </div>
            )}

            {/* Variable electricity (Цахилгаан only, NOT Дундын өмчлөл) - show Суурь хураамж */}
            {formData.ner.toLowerCase().includes("цахилгаан") && 
             !formData.ner.toLowerCase().includes("дундын") && 
             !formData.ner.toLowerCase().includes("өмчлөл") ? (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-[color:var(--muted-text)] uppercase tracking-widest ml-1">
                  Суурь хураамж (₮)
                </label>
                <MTextInput
                  value={suuriKhuraamjInput}
                  onChange={(e) => {
                    const raw = e.currentTarget.value;
                    const cleanValue = raw.replace(/[^0-9.]/g, "");
                    const n = Number(cleanValue);
                    setSuuriKhuraamjInput(cleanValue);
                    setFormData({ ...formData, suuriKhuraamj: Number.isFinite(n) ? n : 0 });
                  }}
                  onBlur={() => {
                    if (formData.suuriKhuraamj) setSuuriKhuraamjInput(formatNumber(formData.suuriKhuraamj, 2));
                    else setSuuriKhuraamjInput("");
                  }}
                  onFocus={() => {
                    if (formData.suuriKhuraamj) setSuuriKhuraamjInput(formData.suuriKhuraamj.toString());
                  }}
                  placeholder="0.00"
                  classNames={{ input: "rounded-xl h-11 font-black text-theme text-lg shadow-sm" }}
                  rightSection={<span className="text-slate-400 font-bold pr-3 text-xs italic">₮</span>}
                  leftSection={<CreditCard className="w-4 h-4 text-theme opacity-50" />}
                />
                <p className="text-[9px] text-[color:var(--muted-text)] ml-1">Excel файлаас ирэх суурь дүн (заалтаас авна)</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-[color:var(--muted-text)] uppercase tracking-widest ml-1">
                  Тарифын дүн (₮)
                </label>
                <MTextInput
                  value={tariffInputValue}
                  onChange={(e) => {
                    const raw = e.currentTarget.value;
                    const cleanValue = raw.replace(/[^0-9.]/g, "");
                    const n = Number(cleanValue);
                    setTariffInputValue(cleanValue);
                    setFormData({ ...formData, tariff: Number.isFinite(n) ? n : 0 });
                  }}
                  onBlur={() => {
                    if (formData.tariff) setTariffInputValue(formatNumber(formData.tariff, 2));
                    else setTariffInputValue("");
                  }}
                  onFocus={() => {
                    if (formData.tariff) setTariffInputValue(formData.tariff.toString());
                  }}
                  placeholder="0.00"
                  classNames={{ input: "rounded-xl h-11 font-black text-theme text-lg shadow-sm" }}
                  rightSection={<span className="text-slate-400 font-bold pr-3 text-xs italic">₮</span>}
                  leftSection={<CreditCard className="w-4 h-4 text-theme opacity-50" />}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-[color:var(--muted-text)] uppercase tracking-widest ml-1">
              Тайлбар / Тэмдэглэл
            </label>
            <MTextarea
              value={formData.tailbar}
              onChange={(e) => setFormData({ ...formData, tailbar: e.currentTarget.value })}
              placeholder="Нэмэлт тайлбар оруулах..."
              minRows={3}
              classNames={{ input: "rounded-2xl shadow-sm p-4 text-sm" }}
            />
          </div>

          <div className="pt-4 border-t border-[color:var(--surface-border)] flex items-center justify-between opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <Settings className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Автоматаар хадгалагдана</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="barilgiin-panel"
      className="xxl:col-span-9 col-span-12 lg:col-span-12"
    >
      <div
        id="zardal-panel"
        className="animate-in fade-in duration-700 space-y-6 overflow-auto max-h-[calc(100vh-220px)] custom-scrollbar pr-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 w-fit shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[color:var(--panel-text)] uppercase tracking-tighter leading-none">Ашиглалтын зардал</h1>
            <p className="text-[10px] sm:text-xs font-bold text-[color:var(--muted-text)] mt-1 opacity-70 uppercase tracking-widest">БАЙРНЫ ТОГТМОЛ БОЛОН ХУВЬСАХ ЗАРДЛЫН ТОХИРГОО</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg text-theme">Тогтмол зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {ashiglaltiinZardluud.filter((x) => x.turul === "Тогтмол").length} зардал
                    </p>
                  </div>
                </div>

                <button
                  id="zardal-add-btn"
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  style={{ borderRadius: "0.75rem" }}
                  onClick={() => openAddModal(false)}
                >
                  <span>Нэмэх</span>
                </button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : ashiglaltiinZardluud.filter((x) => x.turul === "Тогтмол").length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme font-medium">Тогтмол зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">Зардал нэмэх товчийг дарж эхлүүлнэ үү</p>
                </div>
              ) : (
                <div id="zardal-list" className="flex flex-col">
                  <div className="overflow-y-auto custom-scrollbar max-h-[50vh]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
                        <tr className="text-left text-[color:var(--muted-text)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 border-[color:var(--surface-border)]">
                          <th className="py-2 px-2 whitespace-nowrap">Нэр</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Тариф</th>
                          <th className="py-2 px-2 hidden md:table-cell whitespace-nowrap">Тайлбар</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ashiglaltiinZardluud
                          .filter((x) => x._id)
                          .filter((x) => x.turul === "Тогтмол")
                          .filter((x) =>
                            filterText.trim() === ""
                              ? true
                              : String(x.ner || "")
                                .toLowerCase()
                                .includes(filterText.toLowerCase())
                          )
                          .map((mur) => {
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
                                <td className="py-2 px-2 text-theme">
                                  <div className="font-semibold text-[13px] sm:text-sm max-w-[100px] sm:max-w-[120px] leading-tight break-words">{mur.ner}</div>
                                </td>

                                <td className="py-2 px-2">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="font-black text-theme text-sm sm:text-base whitespace-nowrap">
                                      {formatNumber(currentValue, 2)} ₮
                                    </div>
                                    {changed && (
                                      <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter whitespace-nowrap">
                                        Өөрчлөгдсөн
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-theme text-[12px] sm:text-sm max-w-[100px] lg:max-w-[150px] truncate hidden md:table-cell">
                                  {mur.tailbar || <span className="text-[color:var(--muted-text)] opacity-40">-</span>}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                      onClick={() => openEditModal(mur, false)}
                                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors shrink-0"
                                      style={{ borderRadius: "0.5rem" }}
                                      title="Засах"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors shrink-0"
                                      style={{ borderRadius: "0.5rem" }}
                                      title="Устгах"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t-2 border-blue-200 dark:border-blue-800">
                        <tr className="bg-white/50 dark:bg-black/20">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-theme">
                            <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest opacity-60 whitespace-nowrap">Нийт дүн:</div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                            <div className="text-sm sm:text-lg font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {formatNumber(
                                ashiglaltiinZardluud
                                  .filter((x) => x._id)
                                  .filter((x) => x.turul === "Тогтмол")
                                  .filter((x) =>
                                    filterText.trim() === ""
                                      ? true
                                      : String(x.ner || "")
                                        .toLowerCase()
                                        .includes(filterText.toLowerCase())
                                  )
                                  .reduce((sum, item) => {
                                    const displayValue = item.tariff;
                                    const currentValue =
                                      editedTariffs[item._id!] !== undefined
                                        ? editedTariffs[item._id!]
                                        : displayValue;
                                    return sum + currentValue;
                                  }, 0)
                              )} ₮
                            </div>
                          </td>
                          <td className="hidden md:table-cell"></td>
                          <td></td>
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
              <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg text-theme">Хувьсах зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {ashiglaltiinZardluud.filter((x) => x.turul === "Дурын").length} зардал
                    </p>
                  </div>
                </div>

                <button
                  id="zardal-add-variable-btn"
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  style={{ borderRadius: "0.75rem" }}
                  onClick={() => openAddModal(true)}
                >
                  <span>Нэмэх</span>
                </button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : ashiglaltiinZardluud.filter((x) => x.turul === "Дурын").length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme font-medium">Хувьсах зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">Зардал нэмэх товчийг дарж эхлүүлнэ үү</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-y-auto custom-scrollbar max-h-[50vh]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
                        <tr className="text-left text-[color:var(--muted-text)] text-[10px] sm:text-xs font-semibold uppercase tracking-wider border-b-2 border-[color:var(--surface-border)]">
                          <th className="py-2 px-2 whitespace-nowrap">Нэр</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Тариф</th>
                          <th className="py-2 px-2 hidden md:table-cell whitespace-nowrap">Тайлбар</th>
                          <th className="py-2 px-2 text-center whitespace-nowrap">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ashiglaltiinZardluud
                          .filter((x) => x._id)
                          .filter((x) => x.turul === "Дурын")
                          .filter((x) =>
                            filterText.trim() === ""
                              ? true
                              : String(x.ner || "")
                                .toLowerCase()
                                .includes(filterText.toLowerCase())
                          )
                          .map((mur) => {
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
                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-theme">
                                  <div className="font-semibold text-[13px] sm:text-sm max-w-[120px] sm:max-w-[150px] md:max-w-[200px] leading-tight break-words">{mur.ner}</div>
                                </td>

                                <td className="py-2 sm:py-3 px-2 sm:px-4">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="font-black text-theme text-sm sm:text-base whitespace-nowrap">
                                      {formatNumber(currentValue, 0)} ₮
                                    </div>
                                    {changed && (
                                      <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter whitespace-nowrap">
                                        Өөрчлөгдсөн
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-theme text-[12px] sm:text-sm max-w-[100px] lg:max-w-[150px] truncate hidden md:table-cell">
                                  {mur.tailbar || <span className="text-[color:var(--muted-text)] opacity-40">-</span>}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <button
                                      onClick={() => openEditModal(mur, false)}
                                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors shrink-0"
                                      style={{ borderRadius: "0.5rem" }}
                                      title="Засах"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors shrink-0"
                                      style={{ borderRadius: "0.5rem" }}
                                      title="Устгах"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-10 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-t-2 border-emerald-200 dark:border-emerald-800">
                        <tr className="bg-white/50 dark:bg-black/20">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-theme">
                            <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest opacity-60 whitespace-nowrap">Нийт дүн:</div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                            <div className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {formatNumber(
                                ashiglaltiinZardluud
                                  .filter((x) => x._id)
                                  .filter((x) => x.turul === "Дурын")
                                  .filter((x) =>
                                    filterText.trim() === ""
                                      ? true
                                      : String(x.ner || "")
                                        .toLowerCase()
                                        .includes(filterText.toLowerCase())
                                  )
                                  .reduce((sum, item) => {
                                    const displayValue = item.tariff;
                                    const currentValue =
                                      editedTariffs[item._id!] !== undefined
                                        ? editedTariffs[item._id!]
                                        : displayValue;
                                    return sum + currentValue;
                                  }, 0)
                              )} ₮
                            </div>
                          </td>
                          <td className="hidden md:table-cell"></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <MModal
          title="Устгах уу?"
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme font-semibold",
            close: "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
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
                Болих
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
