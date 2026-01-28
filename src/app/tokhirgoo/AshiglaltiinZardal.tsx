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
import { Edit, Trash2 } from "lucide-react";
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

  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setZaaltTariffInput("");
    setZaaltDefaultDunInput("");
    setTariff150kvInput("");
    setTariff150to300kvInput("");
    setTariff300pluskvInput("");
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.ner || !formData.turul) {
      openErrorOverlay("Нэр болон төрлийг бөглөнө үү");
      return;
    }

    showSpinner();
    try {
      const isCakhilgaan = formData.ner.toLowerCase().includes("цахилгаан");
      const payload = {
        ...formData,
        zaalt: isCakhilgaan ? true : formData.zaalt,
        barilgiinId: selectedBuildingId || barilgiinId || undefined,
      };

      if (editingItem) {
        if (!editingItem._id) return;
        await updateZardal(editingItem._id, payload);
        openSuccessOverlay("Амжилттай шинэчиллээ");
      } else {
        await addZardal(payload);
        openSuccessOverlay("Амжилттай нэмлээ");
      }
      setIsModalOpen(false);
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

  return (
    <div
      id="barilgiin-panel"
      className="xxl:col-span-9 col-span-12 lg:col-span-12 h-[700px]"
    >
      <div
        id="zardal-panel"
        className="neu-panel allow-overflow p-4 md:p-6 space-y-6 h-full overflow-auto custom-scrollbar"
      >

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-[color:var(--surface-bg)] to-[color:var(--panel)] rounded-2xl shadow-lg border border-[color:var(--surface-border)] overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-theme">Тогтмол зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {ashiglaltiinZardluud.filter((x) => x.turul === "Тогтмол").length} зардал
                    </p>
                  </div>
                </div>

                <button
                  id="zardal-add-btn"
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  style={{ borderRadius: '0.75rem' }}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      turul: "Тогтмол",
                    });
                    openAddModal(false);
                  }}
                >
                  <span>Нэмэх</span>
                </button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : ashiglaltiinZardluud.filter((x) => x.turul === "Тогтмол")
                  .length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme font-medium">Тогтмол зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">Зардал нэмэх товчийг дарж эхлүүлнэ үү</p>
                </div>
              ) : (
                <div id="zardal-list" className="flex flex-col">
                  <div className="overflow-auto max-h-[350px] custom-scrollbar">
                    <div className="min-w-full inline-block align-middle">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
                          <tr className="text-left text-[color:var(--muted-text)] text-xs font-semibold uppercase tracking-wider border-b-2 border-[color:var(--surface-border)]">
                            <th className="py-3 px-4">Нэр</th>
                            <th className="py-3 px-4 text-center">Төрөл</th>
                            <th className="py-3 px-4 text-center">Тариф</th>
                            <th className="py-3 px-4">Тайлбар</th>
                            <th className="py-3 px-4 text-center">Үйлдэл</th>
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
                                <td className="py-3 px-4 text-theme">
                                  <div className="font-semibold">{mur.ner}</div>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                    {mur.turul}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="font-semibold text-theme text-base">
                                      {formatNumber(currentValue, 0)} ₮
                                    </div>
                                    {changed && (
                                      <span className="text-xs text-amber-600 font-medium">
                                        Өөрчлөгдсөн
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-theme text-sm max-w-xs truncate">
                                  {mur.tailbar || <span className="text-[color:var(--muted-text)]">-</span>}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => openEditModal(mur, false)}
                                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                      style={{ borderRadius: '0.5rem' }}
                                      title="Засах"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                      style={{ borderRadius: '0.5rem' }}
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
                        <tr className="font-bold">
                          <td colSpan={2} className="py-3 px-4 text-theme">
                            <div className="font-bold text-base">Нийт дүн:</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
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
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
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
                    <h3 className="text-lg font-bold text-theme">Хувьсах зардлууд</h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      {ashiglaltiinZardluud.filter((x) => x.turul === "Дурын").length} зардал
                    </p>
                  </div>
                </div>

                <button
                  id="zardal-add-variable-btn"
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  style={{ borderRadius: '0.75rem' }}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      turul: "Дурын",
                    });
                    openAddModal(false);
                  }}
                >
                  <span>Нэмэх</span>
                </button>
              </div>

              {isLoadingAshiglaltiin ? (
                <div className="flex justify-center items-center p-10">
                  <Loader />
                </div>
              ) : ashiglaltiinZardluud.filter((x) => x.turul === "Дурын")
                  .length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme font-medium">Хувьсах зардал байхгүй байна</p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1">Зардал нэмэх товчийг дарж эхлүүлнэ үү</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-auto max-h-[350px] custom-scrollbar">
                    <div className="min-w-full inline-block align-middle">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
                          <tr className="text-left text-[color:var(--muted-text)] text-xs font-semibold uppercase tracking-wider border-b-2 border-[color:var(--surface-border)]">
                            <th className="py-3 px-4">Нэр</th>
                            <th className="py-3 px-4 text-center">Төрөл</th>
                            <th className="py-3 px-4 text-center">Тариф</th>
                            <th className="py-3 px-4">Тайлбар</th>
                            <th className="py-3 px-4 text-center">Үйлдэл</th>
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
                                  <td className="py-3 px-4 text-theme">
                                    <div className="font-semibold">{mur.ner}</div>
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                      {mur.turul}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="font-semibold text-theme text-base">
                                        {formatNumber(currentValue, 0)} ₮
                                      </div>
                                      {changed && (
                                        <span className="text-xs text-amber-600 font-medium">
                                          Өөрчлөгдсөн
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-theme text-sm max-w-xs truncate">
                                    {mur.tailbar || <span className="text-[color:var(--muted-text)]">-</span>}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => openEditModal(mur, false)}
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                        style={{ borderRadius: '0.5rem' }}
                                        title="Засах"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setItemToDelete(mur);
                                          setDeleteModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                        style={{ borderRadius: '0.5rem' }}
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
                          <tr className="font-bold">
                            <td colSpan={2} className="py-3 px-4 text-theme">
                              <div className="font-bold text-base">Нийт дүн:</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
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
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
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


        <MModal
          title={editingItem ? "Зардал засах" : "Зардал нэмэх"}
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classNames={{
            content: "modal-surface modal-responsive",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme font-semibold",
            close:
              "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.5, blur: 6 }}
          centered
        >
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                Зардлын нэр
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
                placeholder="Зардлын нэр оруулах"
                className="text-sm text-theme"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                Төрөл
              </label>
              <MSelect
                value={formData.turul}
                onChange={(value) =>
                  setFormData({ ...formData, turul: value ?? "" })
                }
                className="w-full text-theme"
                data={expenseTypes.map((type) => ({
                  label: type,
                  value: type,
                }))}
                placeholder="Сонгох"
                searchable
              />
            </div> */}

            {!formData.ner.toLowerCase().includes("цахилгаан") && (
              <div>
                <label className="block text-sm font-medium mb-1 text-theme">
                  Зардлын төрөл
                </label>
                <MSelect
                  value={formData.zardliinTurul ?? undefined}
                  onChange={(value) =>
                    setFormData({ ...formData, zardliinTurul: value as string })
                  }
                  className="w-full text-theme"
                  data={[
                    { label: "Энгийн", value: "Энгийн" },
                    { label: "Лифт", value: "Лифт" },
                  ]}
                  placeholder="Сонгох (Энгийн)"
                  searchable={false}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                {formData.ner.toLowerCase().includes("цахилгаан")
                  ? "Суурь хураамж (₮)"
                  : "Тариф (₮)"}
              </label>
              <MTextInput
                value={tariffInputValue}
                onChange={(e) => {
                  const raw = e.currentTarget.value;
                  const cleanValue = raw.replace(/[^0-9.]/g, "");
                  const n = Number(cleanValue);

                  setTariffInputValue(cleanValue);
                  setFormData({
                    ...formData,
                    tariff: Number.isFinite(n) ? n : 0,
                  });
                }}
                onBlur={() => {
                  if (formData.tariff) {
                    setTariffInputValue(formatNumber(formData.tariff, 2));
                  } else {
                    setTariffInputValue("");
                  }
                }}
                onFocus={() => {
                  if (formData.tariff) {
                    setTariffInputValue(formData.tariff.toString());
                  }
                }}
                placeholder="0"
                className="text-theme"
                rightSection={<span className="text-slate-500 pr-1">₮</span>}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-theme">
                Тайлбар
              </label>
              <MTextarea
                value={formData.tailbar}
                onChange={(e) =>
                  setFormData({ ...formData, tailbar: e.currentTarget.value })
                }
                placeholder="Тайлбар оруулах"
                className="text-theme"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <MButton
                onClick={() => setIsModalOpen(false)}
                className="btn-minimal btn-cancel"
                radius="xl"
              >
                Болих
              </MButton>
              <MButton
                className="btn-minimal btn-save h-11"
                onClick={handleSave}
                data-modal-primary
                radius="xl"
              >
                Хадгалах
              </MButton>
            </div>
          </div>
        </MModal>
      </div>
    </div>
  );
}
