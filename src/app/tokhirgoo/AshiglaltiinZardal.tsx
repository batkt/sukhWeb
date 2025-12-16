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
  zardliinTurul?: string;
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
  tailbar?: string;
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

  const [liftEnabled, setLiftEnabled] = useState<boolean>(false);
  const [liftMaxFloor, setLiftMaxFloor] = useState<number | null>(null);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const [liftBulkInput, setLiftBulkInput] = useState<string>("");
  const [liftShalgayaId, setLiftShalgayaId] = useState<string | null>(null);
  const [liftDeleteAllOpen, setLiftDeleteAllOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ZardalItem | null>(null);
  const [isUilchilgeeModal, setIsUilchilgeeModal] = useState(false);
  const [editedTariffs, setEditedTariffs] = useState<Record<string, number>>(
    {}
  );

  const [invoiceDay, setInvoiceDay] = useState<number | null>(null);
  const [invoiceActive, setInvoiceActive] = useState<boolean>(true);
  const [invoiceScheduleId, setInvoiceScheduleId] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState<ZardalFormData>({
    ner: "",
    turul: "",
    tariff: 0,
    suuriKhuraamj: 0,
    nuatBodokhEsekh: false,
    zardliinTurul: undefined,
    tailbar: "",
    tariff150kv: 0,
    tariff150to300kv: 0,
    tariff300pluskv: 0,
  });

  const [tariffInputValue, setTariffInputValue] = useState<string>("");
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
  const [confirmDeleteFloorOpen, setConfirmDeleteFloorOpen] = useState(false);
  const [floorToDeleteConfirm, setFloorToDeleteConfirm] = useState<
    string | null
  >(null);
  const [turul, setTurul] = useState("");
  const fetchInvoiceSchedule = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      const response = await fetchWithDomainFallback(
        `/nekhemjlekhCron/${ajiltan.baiguullagiinId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data) &&
          result.data.length > 0
        ) {
          const latestSchedule = result.data[result.data.length - 1];

          if (latestSchedule.nekhemjlekhUusgekhOgnoo !== undefined) {
            setInvoiceDay(latestSchedule.nekhemjlekhUusgekhOgnoo);
            setInvoiceActive(latestSchedule.idevkhitei ?? true);
            setInvoiceScheduleId(latestSchedule._id);
            return;
          }
        }
      }

      // If no data found, reset to defaults
      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
    } catch (error) {
      // Reset to defaults on error
      setInvoiceDay(null);
      setInvoiceActive(true);
      setInvoiceScheduleId(null);
    }
  };

  const saveInvoiceSchedule = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }
    if (!invoiceDay || invoiceDay < 1 || invoiceDay > 31) {
      openErrorOverlay("Огноог 1-31 хооронд сонгоно уу");
      return;
    }

    showSpinner();
    try {
      const res = await fetchWithDomainFallback(`/nekhemjlekhCron`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baiguullagiinId: ajiltan?.baiguullagiinId,
          nekhemjlekhUusgekhOgnoo: invoiceDay,
          idevkhitei: invoiceActive,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      const data = result.data || result;

      // Update state with the saved data
      if (data._id) {
        setInvoiceScheduleId(data._id);
      }

      openSuccessOverlay("Нэхэмжлэх илгээх тохиргоог хадгаллаа");

      // Refresh the data from backend
      await fetchInvoiceSchedule();
    } catch (e) {
      openErrorOverlay("Нэхэмжлэх тохиргоо илгээхэд алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const fetchLiftFloors = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    try {
      // Use canonical liftShalgaya endpoint so all pages read the same source
      const resp = await uilchilgee(token).get(`/liftShalgaya`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 100,
        },
      });
      const data = resp.data;
      const list = Array.isArray(data?.jagsaalt) ? data.jagsaalt : [];

      // Prefer branch-specific entries, fallback to org defaults (no barilgiinId)
      const toStr = (v: any) => (v == null ? "" : String(v));
      const branchMatches = list.filter(
        (x: any) =>
          toStr(x?.barilgiinId) === toStr(selectedBuildingId || barilgiinId)
      );
      const pickLatest = (arr: any[]) =>
        [...arr].sort(
          (a, b) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
            new Date(a?.updatedAt || a?.createdAt || 0).getTime()
        )[0];

      let chosen = branchMatches.length > 0 ? pickLatest(branchMatches) : null;
      if (!chosen) {
        const orgDefaults = list.filter(
          (x: any) => x?.barilgiinId == null || toStr(x.barilgiinId) === ""
        );
        chosen =
          orgDefaults.length > 0 ? pickLatest(orgDefaults) : pickLatest(list);
      }

      const floors = Array.isArray(chosen?.choloolugdokhDavkhar)
        ? chosen.choloolugdokhDavkhar
            .map((f: any) => String(f).trim())
            .filter(Boolean)
        : [];

      if (!floors || floors.length === 0) {
        setLiftMaxFloor(null);
        setLiftBulkInput("");
        setLiftEnabled(false);
        setLiftFloors([]);
        return;
      }

      const maxFloor = Math.max(...floors.map((f: any) => Number(f) || 0));
      setLiftMaxFloor(maxFloor);
      setLiftBulkInput(toUniqueSorted(floors).join(","));
      setLiftFloors(toUniqueSorted(floors));
      setLiftShalgayaId(chosen?._id ?? null);
      setLiftEnabled(true);
    } catch (error) {
      setLiftMaxFloor(null);
      setLiftBulkInput("");
      setLiftEnabled(false);
      setLiftFloors([]);
      setLiftShalgayaId(null);
    }
  };

  const saveLiftSettings = async (floorsOrMax: string[] | number | null) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    showSpinner();

    try {
      let floors: string[] = [];
      if (Array.isArray(floorsOrMax)) {
        floors = toUniqueSorted(floorsOrMax);
      } else if (typeof floorsOrMax === "number" && floorsOrMax > 0) {
        floors = Array.from({ length: floorsOrMax }, (_, i) => String(i + 1));
      } else {
        floors = [];
      }

      // Persist to canonical liftShalgaya collection so other pages (invoicing)
      // that read /liftShalgaya see the same source of truth.
      const payload: any = {
        choloolugdokhDavkhar: floors,
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || undefined,
      };

      const postResp = await uilchilgee(token).post(`/liftShalgaya`, payload);

      if (floors.length > 0) {
        openSuccessOverlay(`Лифт ${floors.join(",")} давхарт тохируулагдлаа`);
      } else {
        openSuccessOverlay("Лифт хөнгөлөлтийг идэвхгүй болголоо");
      }

      // Refresh canonical source
      await fetchLiftFloors();
    } catch (error) {
      openErrorOverlay("Лифт тохиргоо хадгалах үед алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (token && ajiltan?.baiguullagiinId) {
      fetchLiftFloors();
      fetchInvoiceSchedule();
    }
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);

  const toUniqueSorted = (values: (string | number)[]) => {
    const nums = values
      .map((v) => Number(String(v).trim()))
      .filter((n) => Number.isFinite(n) && n > 0) as number[];
    const uniq = Array.from(new Set(nums));
    uniq.sort((a, b) => a - b);
    return uniq.map((n) => String(n));
  };

  const expandRangeToken = (token: string): number[] => {
    const t = token.trim().replace(/\s+/g, "");
    if (!t) return [];
    const m = t.match(/^(\d+)-(\d+)$/);
    if (m) {
      const start = Number(m[1]);
      const end = Number(m[2]);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        const a = Math.min(start, end);
        const b = Math.max(start, end);
        const out: number[] = [];
        for (let i = a; i <= b; i++) out.push(i);
        return out;
      }
    }
    const n = Number(t);
    return Number.isFinite(n) ? [n] : [];
  };

  const parseBulk = (text: string): string[] => {
    const tokens = text
      .split(/[,;\n\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const expanded = tokens.flatMap(expandRangeToken);
    return toUniqueSorted(expanded);
  };

  const handleDeleteFloor = (floor: string) => {
    const remaining = liftFloors.filter((f) => f !== floor);
    setLiftFloors(remaining);
    // persist immediately for selected building
    (async () => {
      try {
        await saveLiftSettings(remaining);
      } catch (e) {
        // on error, refetch to restore
        await fetchLiftFloors();
      }
    })();
  };

  const handleDeleteAllFloors = () => {
    // open confirm modal
    setLiftDeleteAllOpen(true);
  };

  const handleSaveFloors = async () => {
    // Merge numeric input and bulk text input into existing floors, then persist
    let merged = liftFloors || [];
    // parse bulk input like "1-3,5,7"
    if (liftBulkInput && liftBulkInput.trim() !== "") {
      const parsed = parseBulk(liftBulkInput);
      merged = toUniqueSorted([...merged, ...parsed]);
    }

    // update UI first
    setLiftFloors(merged);
    setLiftBulkInput(merged.length > 0 ? merged.join(",") : "");

    if (merged.length > 0) {
      await saveLiftSettings(merged);
    } else {
      try {
        if (liftShalgayaId && token) {
          await deleteMethod("liftShalgaya", token, liftShalgayaId);
          setLiftShalgayaId(null);
        } else {
          await saveLiftSettings(null);
        }
      } catch (e) {
        await saveLiftSettings(null);
      }
    }
  };

  const openAddModal = (isUilchilgee = false) => {
    setEditingItem(null);
    setIsUilchilgeeModal(isUilchilgee);
    setFormData({
      ner: "",
      turul: isUilchilgee ? "Дурын" : "Тогтмол",
      tariff: 0,
      suuriKhuraamj: 0,
      nuatBodokhEsekh: false,
      zardliinTurul: undefined,
      tailbar: "",
      tariff150kv: 0,
      tariff150to300kv: 0,
      tariff300pluskv: 0,
    });
    setTariffInputValue("");
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
      suuriKhuraamj: item.suuriKhuraamj || 0,
      nuatBodokhEsekh: item.nuatBodokhEsekh || false,
      zardliinTurul: item.zardliinTurul,
      tailbar: item.tailbar || "",
      tariff150kv: item.tariff150kv || 0,
      tariff150to300kv: item.tariff150to300kv || 0,
      tariff300pluskv: item.tariff300pluskv || 0,
    });
    setTariffInputValue(formatNumber(item.tariff, 2));
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
      const payload = {
        ...formData,
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
            "Зардлын жагсаалт болон лифт/нэхэмжлэхийн тохиргоонууд энд байна.",
          side: "bottom",
        },
      },
      {
        element: "#zardal-invoice-settings",
        popover: {
          title: "Нэхэмжлэх илгээх",
          description: "Нэхэмжлэх илгээх өдрийг тохируулж, идэвхжүүлэх/хаах.",
          side: "right",
        },
      },
      {
        element: "#zardal-lift-settings",
        popover: {
          title: "Лифт тохиргоо",
          description:
            "Лифт хөнгөлөлтийн давхаруудыг оруулах болон хадгалах хэсэг.",
          side: "right",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-3">
          {/* Invoice box */}
          <div id="zardal-invoice-box" className="box flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-5">
              <div className="font-medium text-theme flex-1">
                Нэхэмжлэх илгээх
              </div>
              <div className="flex items-center gap-2">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={invoiceActive}
                    onChange={(e) => setInvoiceActive(e.currentTarget.checked)}
                    aria-label="Нэхэмжлэх идэвхжүүлэх"
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
            {invoiceActive && (
              <div
                id="zardal-invoice-settings"
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 pb-4 sm:pb-5"
              >
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-theme mb-1">
                    Өдөр (сар бүр)
                  </label>
                  <MNumberInput
                    min={1}
                    max={31}
                    placeholder="Нэхэмжлэх өдөр"
                    value={invoiceDay ?? undefined}
                    onChange={(v) => setInvoiceDay((v as number) ?? null)}
                    className="w-full sm:w-40"
                  />
                </div>
                <MButton
                  id="zardal-invoice-save"
                  className="btn-minimal btn-save w-full sm:w-auto sm:mt-6"
                  onClick={saveInvoiceSchedule}
                >
                  Хадгалах
                </MButton>
              </div>
            )}
          </div>

          {/* Lift box */}
          <div id="zardal-lift-settings" className="box flex-1">
            <div className="flex flex-col gap-3 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="text-theme font-medium mb-1">
                  Лифт хөнгөлөлт
                </div>
                <div className="flex items-center gap-2">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={liftEnabled}
                      onChange={(event) => {
                        const enabled = event.currentTarget.checked;
                        setLiftEnabled(enabled);
                        if (!enabled) {
                          saveLiftSettings(null);
                        }
                      }}
                      aria-label="Лифт идэвхжүүлэх"
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>

              {liftEnabled && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="block text-xs text-theme">
                      Давхар (жишээ: 1 эсвэл 1-3 эсвэл 1,2,3)
                    </label>

                    <div className="flex items-center gap-2">
                      <MTextInput
                        placeholder="1-3,5,7 эсвэл 1,2,3"
                        value={liftBulkInput}
                        onChange={(e) =>
                          setLiftBulkInput(e.currentTarget.value)
                        }
                        className="w-40"
                      />

                      <MButton
                        id="zardal-lift-save"
                        className="btn-minimal btn-save"
                        onClick={handleSaveFloors}
                      >
                        Хадгалах
                      </MButton>

                      <MButton
                        className="btn-minimal"
                        color="red"
                        onClick={handleDeleteAllFloors}
                        title="Бүгдийг устгах"
                      >
                        <Trash2 color="red" />
                      </MButton>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {liftFloors && liftFloors.length > 0 ? (
                      liftFloors.map((f) => (
                        <div
                          key={f}
                          className="inline-flex items-center gap-2 bg-[color:var(--panel)] px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm"
                        >
                          <span className="text-theme text-sm">{f}</span>
                          <button
                            className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full"
                            onClick={() => {
                              setFloorToDeleteConfirm(f);
                              setConfirmDeleteFloorOpen(true);
                            }}
                            aria-label={`Давхарыг устгах ${f}`}
                            title="Устгах"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        Хадгалагдсан давхаргүй
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-theme font-medium flex-1">
                Тогтмол зардлууд
              </div>

              <button
                id="zardal-add-btn"
                type="button"
                className="cssbuttons-io-button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    turul: "Тогтмол",
                  });
                  openAddModal(false);
                }}
              >
                +
              </button>
            </div>

            {isLoadingAshiglaltiin ? (
              <div className="flex justify-center items-center p-10">
                <Loader />
              </div>
            ) : ashiglaltiinZardluud.filter((x) => x.turul === "Тогтмол")
                .length === 0 ? (
              <div className="p-8 text-center text-theme">
                Тогтмол зардал байхгүй байна
              </div>
            ) : (
              <div id="zardal-list" className="px-4 sm:px-5 pb-4 flex flex-col">
                <div className="overflow-auto max-h-[350px]">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-sm">
                      <thead className="top-0 z-10">
                        <tr className="text-center text-slate-500 border-b">
                          <th className="py-2 pr-3">Нэр</th>
                          <th className="py-2 pr-3">Төрөл</th>
                          <th className="py-2 pr-3">Тариф (₮)</th>
                          <th className="py-2 pr-3">Тайлбар</th>
                          <th className="py-2">Үйлдэл</th>
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
                            const currentValue =
                              editedTariffs[mur._id!] !== undefined
                                ? editedTariffs[mur._id!]
                                : mur.tariff;
                            const changed = currentValue !== mur.tariff;
                            return (
                              <tr
                                key={mur._id}
                                className="border-b last:border-b-0 text-left"
                              >
                                <td className="py-2 pr-3 text-theme">
                                  <div className="font-medium">{mur.ner}</div>
                                </td>

                                <td className="py-2 pr-3 text-theme">
                                  {mur.turul}
                                </td>

                                <td className="py-2 pr-3">
                                  <MTextInput
                                    className="w-36 text-center text-theme mx-auto"
                                    value={formatNumber(currentValue, 2)}
                                    readOnly
                                    onChange={(e) =>
                                      setEditedTariffs((prev) => ({
                                        ...prev,
                                        [mur._id!]: Number(
                                          String(e.currentTarget.value).replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ),
                                      }))
                                    }
                                    rightSection={
                                      <span className="text-slate-500 pr-1">
                                        ₮
                                      </span>
                                    }
                                  />
                                  {changed && (
                                    <span className="text-xs text-amber-600 ml-2">
                                      Өөрчлөгдсөн
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 pr-3 text-theme">
                                  {mur.tailbar}
                                </td>
                                <td className="py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <Edit
                                      className="text-sm text-blue-500 cursor-pointer"
                                      onClick={() => openEditModal(mur, false)}
                                    />
                                    <Trash2
                                      className="text-sm text-red-500 cursor-pointer"
                                      color="red"
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="bottom-0 border-t">
                        <tr className="font-semibold">
                          <td colSpan={2}></td>
                          <td className="text-theme">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-500">
                                Нийт:
                              </span>
                              <span>
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
                                    .reduce((sum, item) => sum + item.tariff, 0)
                                )}{" "}
                                ₮
                              </span>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Хувьсах зардлууд (Variable Expenses) */}
          <div className="flex-1">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-theme font-medium flex-1">
                Хувьсах зардлууд
              </div>

              <button
                id="zardal-add-variable-btn"
                type="button"
                className="cssbuttons-io-button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    turul: "Дурын",
                  });
                  openAddModal(true);
                }}
              >
                +
              </button>
            </div>

            {isLoadingAshiglaltiin ? (
              <div className="flex justify-center items-center p-10">
                <Loader />
              </div>
            ) : ashiglaltiinZardluud.filter((x) => x.turul !== "Тогтмол")
                .length === 0 ? (
              <div className="p-8 text-center text-theme">
                Хувьсах зардал байхгүй байна
              </div>
            ) : (
              <div
                id="zardal-list-variable"
                className="px-4 sm:px-5 pb-4 flex flex-col"
              >
                <div className="overflow-auto max-h-[350px]">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full text-sm">
                      <thead className="top-0 z-10">
                        <tr className="text-center text-slate-500 border-b">
                          <th className="py-2 pr-3">Нэр</th>
                          <th className="py-2 pr-3">Төрөл</th>
                          <th className="py-2 pr-3">Тариф (₮)</th>
                          <th className="py-2 pr-3">Тайлбар</th>
                          <th className="py-2">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ashiglaltiinZardluud
                          .filter((x) => x._id)
                          .filter((x) => x.turul !== "Тогтмол")
                          .filter((x) =>
                            filterText.trim() === ""
                              ? true
                              : String(x.ner || "")
                                  .toLowerCase()
                                  .includes(filterText.toLowerCase())
                          )
                          .map((mur) => {
                            const currentValue =
                              editedTariffs[mur._id!] !== undefined
                                ? editedTariffs[mur._id!]
                                : mur.tariff;
                            const changed = currentValue !== mur.tariff;
                            return (
                              <tr
                                key={mur._id}
                                className="border-b last:border-b-0 text-left"
                              >
                                <td className="py-2 pr-3 text-theme">
                                  <div className="font-medium">{mur.ner}</div>
                                </td>

                                <td className="py-2 pr-3 text-theme">
                                  {mur.turul}
                                </td>

                                <td className="py-2 pr-3">
                                  <MTextInput
                                    className="w-36 text-center text-theme mx-auto"
                                    value={formatNumber(currentValue, 2)}
                                    readOnly
                                    onChange={(e) =>
                                      setEditedTariffs((prev) => ({
                                        ...prev,
                                        [mur._id!]: Number(
                                          String(e.currentTarget.value).replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ),
                                      }))
                                    }
                                    rightSection={
                                      <span className="text-slate-500 pr-1">
                                        ₮
                                      </span>
                                    }
                                  />
                                  {changed && (
                                    <span className="text-xs text-amber-600 ml-2">
                                      Өөрчлөгдсөн
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 pr-3 text-theme">
                                  {mur.tailbar}
                                </td>
                                <td className="py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <Edit
                                      className="text-sm text-blue-500 cursor-pointer"
                                      onClick={() => openEditModal(mur, false)}
                                    />
                                    <Trash2
                                      className="text-sm text-red-500 cursor-pointer"
                                      color="red"
                                      onClick={() => {
                                        setItemToDelete(mur);
                                        setDeleteModalOpen(true);
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot className="bottom-0 border-t">
                        <tr className="font-semibold">
                          <td colSpan={2}></td>
                          <td className="text-theme">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-500">
                                Нийт:
                              </span>
                              <span>
                                {formatNumber(
                                  ashiglaltiinZardluud
                                    .filter((x) => x._id)
                                    .filter((x) => x.turul !== "Тогтмол")
                                    .filter((x) =>
                                      filterText.trim() === ""
                                        ? true
                                        : String(x.ner || "")
                                            .toLowerCase()
                                            .includes(filterText.toLowerCase())
                                    )
                                    .reduce((sum, item) => sum + item.tariff, 0)
                                )}{" "}
                                ₮
                              </span>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
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
              >
                Болих
              </MButton>
              <MButton
                color="red"
                onClick={handleDeleteConfirm}
                className="btn-minimal btn-cancel"
              >
                Устгах
              </MButton>
            </div>
          </div>
        </MModal>

        <MModal
          title="Бүгдийг устгах уу?"
          opened={liftDeleteAllOpen}
          onClose={() => setLiftDeleteAllOpen(false)}
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
              Та бүх давхарыг устгах гэдэгт итгэлтэй байна уу?
            </p>
            <div className="flex justify-end gap-2">
              <MButton
                onClick={() => setLiftDeleteAllOpen(false)}
                className="btn-minimal"
              >
                Болих
              </MButton>
              <MButton
                color="red"
                onClick={async () => {
                  setLiftDeleteAllOpen(false);
                  try {
                    if (liftShalgayaId && token) {
                      await deleteMethod("liftShalgaya", token, liftShalgayaId);
                    } else {
                      await saveLiftSettings(null);
                    }
                  } catch (e) {
                    // fallback
                    await saveLiftSettings(null);
                  }
                  await fetchLiftFloors();
                }}
                className="btn-minimal btn-cancel"
              >
                Устгах
              </MButton>
            </div>
          </div>
        </MModal>

        {/* Small confirmation modal for deleting a single floor */}
        <MModal
          title="Давхарыг устгах уу?"
          opened={confirmDeleteFloorOpen}
          onClose={() => {
            setConfirmDeleteFloorOpen(false);
            setFloorToDeleteConfirm(null);
          }}
          classNames={{
            content: "modal-surface modal-responsive max-w-sm",
            header:
              "bg-[color:var(--surface)] border-b border-[color:var(--panel-border)] px-6 py-4 rounded-t-2xl",
            title: "text-theme font-semibold",
            close:
              "text-theme hover:bg-[color:var(--surface-hover)] rounded-xl",
          }}
          overlayProps={{ opacity: 0.6, blur: 6 }}
          centered
          size="xs"
        >
          <div className="space-y-4 mt-2">
            <p className="text-theme">
              Та "{floorToDeleteConfirm}" давхарыг устгахдаа итгэлтэй байна уу?
              Энэ үйлдэл буцаагдахгүй.
            </p>
            <div className="flex justify-end gap-2">
              <MButton
                onClick={() => {
                  setConfirmDeleteFloorOpen(false);
                  setFloorToDeleteConfirm(null);
                }}
                className="btn-minimal"
              >
                Үгүй
              </MButton>
              <MButton
                color="red"
                onClick={async () => {
                  const f = floorToDeleteConfirm;
                  setConfirmDeleteFloorOpen(false);
                  setFloorToDeleteConfirm(null);
                  if (f) await handleDeleteFloor(f);
                }}
                className="btn-minimal btn-cancel"
              >
                Тийм
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
                onChange={(e) =>
                  setFormData({ ...formData, ner: e.currentTarget.value })
                }
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
                  { label: "Лифт", value: "Лифт" },
                  { label: "Энгийн", value: "Энгийн" },
                ]}
                placeholder="Сонгох (Лифт)"
                searchable={false}
              />
            </div>

            {/* Conditional: Show tiered electricity pricing if name contains "Цахилгаан" */}
            {formData.ner.toLowerCase().includes("цахилгаан") ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme">
                    150кв (₮)
                  </label>
                  <MTextInput
                    value={tariff150kvInput}
                    onChange={(e) => {
                      const raw = e.currentTarget.value;
                      const cleanValue = raw.replace(/[^0-9.]/g, "");
                      const n = Number(cleanValue);

                      setTariff150kvInput(cleanValue);
                      setFormData({
                        ...formData,
                        tariff150kv: Number.isFinite(n) ? n : 0,
                      });
                    }}
                    onBlur={() => {
                      if (formData.tariff150kv) {
                        setTariff150kvInput(
                          formatNumber(formData.tariff150kv, 2)
                        );
                      } else {
                        setTariff150kvInput("");
                      }
                    }}
                    onFocus={() => {
                      if (formData.tariff150kv) {
                        setTariff150kvInput(formData.tariff150kv.toString());
                      }
                    }}
                    placeholder="0"
                    className="text-theme"
                    rightSection={
                      <span className="text-slate-500 pr-1">₮</span>
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-theme">
                    150-300кв (₮)
                  </label>
                  <MTextInput
                    value={tariff150to300kvInput}
                    onChange={(e) => {
                      const raw = e.currentTarget.value;
                      const cleanValue = raw.replace(/[^0-9.]/g, "");
                      const n = Number(cleanValue);

                      setTariff150to300kvInput(cleanValue);
                      setFormData({
                        ...formData,
                        tariff150to300kv: Number.isFinite(n) ? n : 0,
                      });
                    }}
                    onBlur={() => {
                      if (formData.tariff150to300kv) {
                        setTariff150to300kvInput(
                          formatNumber(formData.tariff150to300kv, 2)
                        );
                      } else {
                        setTariff150to300kvInput("");
                      }
                    }}
                    onFocus={() => {
                      if (formData.tariff150to300kv) {
                        setTariff150to300kvInput(
                          formData.tariff150to300kv.toString()
                        );
                      }
                    }}
                    placeholder="0"
                    className="text-theme"
                    rightSection={
                      <span className="text-slate-500 pr-1">₮</span>
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-theme">
                    300+ кв (₮)
                  </label>
                  <MTextInput
                    value={tariff300pluskvInput}
                    onChange={(e) => {
                      const raw = e.currentTarget.value;
                      const cleanValue = raw.replace(/[^0-9.]/g, "");
                      const n = Number(cleanValue);

                      setTariff300pluskvInput(cleanValue);
                      setFormData({
                        ...formData,
                        tariff300pluskv: Number.isFinite(n) ? n : 0,
                      });
                    }}
                    onBlur={() => {
                      if (formData.tariff300pluskv) {
                        setTariff300pluskvInput(
                          formatNumber(formData.tariff300pluskv, 2)
                        );
                      } else {
                        setTariff300pluskvInput("");
                      }
                    }}
                    onFocus={() => {
                      if (formData.tariff300pluskv) {
                        setTariff300pluskvInput(
                          formData.tariff300pluskv.toString()
                        );
                      }
                    }}
                    placeholder="0"
                    className="text-theme"
                    rightSection={
                      <span className="text-slate-500 pr-1">₮</span>
                    }
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1 text-theme">
                  Тариф (₮)
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
            )}
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
              >
                Болих
              </MButton>
              <MButton
                className="btn-minimal btn-save h-11"
                onClick={handleSave}
                data-modal-primary
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
