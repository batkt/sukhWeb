"use client";

import React, { useState, useEffect } from "react";
import {
  Modal as MModal,
  Tooltip as MTooltip,
  Switch as MSwitch,
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
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";

interface ZardalItem {
  _id: string;
  ner: string;
  turul: string;
  tariff: number;
  tariffUsgeer?: string;
  suuriKhuraamj?: number;
  ognoonuud?: string[];
  nuatBodokhEsekh?: boolean;
  baiguullagiinId?: string;
  barilgiinId?: string;
  lift?: string;
  tseverUsDun?: number;
  bokhirUsDun?: number;
  usKhalaasniiDun?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ZardalFormData {
  _id?: string;
  ner: string;
  turul: string;
  tariff: number;
  lift: string | null;
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
}

export default function AshiglaltiinZardluud() {
  const { token, ajiltan, barilgiinId } = useAuth();

  const {
    zardluud: ashiglaltiinZardluud,
    isLoading: isLoadingAshiglaltiin,
    addZardal,
    updateZardal,
    deleteZardal,
    mutate: refreshZardluud,
  } = useAshiglaltiinZardluud();

  const [isSaving, setIsSaving] = useState(false);
  const [editedTariffs, setEditedTariffs] = useState<Record<string, number>>(
    {}
  );
  const [liftEnabled, setLiftEnabled] = useState<boolean>(false);
  const [liftModalOpen, setLiftModalOpen] = useState<boolean>(false);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const [liftRecordId, setLiftRecordId] = useState<string | null>(null);
  const [isSavingLift, setIsSavingLift] = useState<boolean>(false);
  const [singleFloor, setSingleFloor] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ZardalItem | null>(null);
  const [isUilchilgeeModal, setIsUilchilgeeModal] = useState(false);

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
    lift: null,
  });

  const [expenseTypes] = useState<string[]>([
    "1м3/талбай",
    "нэгж/талбай",
    "тогтмол",
    "үйлчилгээ",
  ]);

  const [pageSize] = useState(100);

  const fetchInvoiceSchedule = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      // Fetch from the correct GET endpoint
      const response = await fetch(
        `http://103.143.40.46:8084/nekhemjlekhCron/${ajiltan.baiguullagiinId}`,
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
          // Get the most recent schedule (last item in array or sort by createdAt)
          const latestSchedule = result.data[result.data.length - 1];

          if (latestSchedule.nekhemjlekhUusgekhOgnoo) {
            setInvoiceDay(latestSchedule.nekhemjlekhUusgekhOgnoo);
            setInvoiceActive(latestSchedule.idevkhitei ?? true);
            setInvoiceScheduleId(latestSchedule._id);

            // Also save to localStorage as backup
            localStorage.setItem(
              `invoiceScheduleId_${ajiltan.baiguullagiinId}`,
              latestSchedule._id
            );
            localStorage.setItem(
              `invoiceDay_${ajiltan.baiguullagiinId}`,
              latestSchedule.nekhemjlekhUusgekhOgnoo.toString()
            );
            localStorage.setItem(
              `invoiceActive_${ajiltan.baiguullagiinId}`,
              latestSchedule.idevkhitei.toString()
            );
            return;
          }
        }
      }

      // Fallback: load from localStorage if API fails
      const savedDay = localStorage.getItem(
        `invoiceDay_${ajiltan.baiguullagiinId}`
      );
      const savedActive = localStorage.getItem(
        `invoiceActive_${ajiltan.baiguullagiinId}`
      );

      if (savedDay) {
        setInvoiceDay(parseInt(savedDay));
        setInvoiceActive(savedActive === "true");
      }
    } catch (error) {
      console.error("Failed to fetch invoice schedule:", error);

      // Fallback: load from localStorage
      const savedDay = localStorage.getItem(
        `invoiceDay_${ajiltan.baiguullagiinId}`
      );
      const savedActive = localStorage.getItem(
        `invoiceActive_${ajiltan.baiguullagiinId}`
      );

      if (savedDay) {
        setInvoiceDay(parseInt(savedDay));
        setInvoiceActive(savedActive === "true");
      }
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

    try {
      const res = await fetch("http://103.143.40.46:8084/nekhemjlekhCron", {
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

      // Save to localStorage for persistence
      if (data._id) {
        localStorage.setItem(
          `invoiceScheduleId_${ajiltan.baiguullagiinId}`,
          data._id
        );
        setInvoiceScheduleId(data._id);
      }
      localStorage.setItem(
        `invoiceDay_${ajiltan.baiguullagiinId}`,
        invoiceDay.toString()
      );
      localStorage.setItem(
        `invoiceActive_${ajiltan.baiguullagiinId}`,
        invoiceActive.toString()
      );

      openSuccessOverlay("Нэхэмжлэх илгээх тохиргоог хадгаллаа");
    } catch (e) {
      openErrorOverlay("Нэхэмжлэх тохиргоо илгээхэд алдаа гарлаа");
    }
  };

  const fetchLiftFloors = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      const response = await fetch(
        `http://103.143.40.46:8084/liftShalgaya?baiguullagiinId=${
          ajiltan.baiguullagiinId
        }&${
          barilgiinId ? `barilgiinId=${barilgiinId}&` : ""
        }khuudasniiDugaar=1&khuudasniiKhemjee=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (
        data.jagsaalt &&
        Array.isArray(data.jagsaalt) &&
        data.jagsaalt.length > 0
      ) {
        const sortedRecords = [...data.jagsaalt].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const mostRecent = sortedRecords[0];

        if (
          mostRecent.choloolugdokhDavkhar &&
          Array.isArray(mostRecent.choloolugdokhDavkhar)
        ) {
          const floors = mostRecent.choloolugdokhDavkhar.map(String);
          setLiftRecordId(mostRecent._id ?? null);
          setLiftFloors(floors);
          setLiftEnabled(floors.length > 0);
          return;
        }
      }

      setLiftFloors([]);
      setLiftEnabled(false);
      setLiftRecordId(null);
    } catch (error) {
      console.error("Failed to fetch lift floors:", error);
    }
  };

  const saveLiftSettings = async (floors: string[]) => {
    if (!token) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    setIsSavingLift(true);

    try {
      const payload = {
        choloolugdokhDavkhar: floors,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        ...(barilgiinId ? { barilgiinId } : {}),
      } as any;

      let ok = false;
      let lastError: any = null;

      if (liftRecordId) {
        try {
          const putRes = await fetch(
            `http://103.143.40.46:8084/liftShalgaya/${liftRecordId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );
          if (putRes.ok) {
            ok = true;
          } else {
            lastError = new Error(`HTTP error! status: ${putRes.status}`);
          }
        } catch (e) {
          lastError = e;
        }
      }

      if (!ok) {
        const postRes = await fetch("http://103.143.40.46:8084/liftShalgaya", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!postRes.ok) {
          throw lastError || new Error(`HTTP error! status: ${postRes.status}`);
        }
      }

      if (floors.length > 0) {
        openSuccessOverlay("Лифт давхруудыг амжилттай хадгаллаа");
      } else {
        openSuccessOverlay("Лифт хөнгөлөлтийг идэвхгүй болголоо");
      }

      await fetchLiftFloors();
      setLiftModalOpen(false);
    } catch (error) {
      openErrorOverlay("Лифт тохиргоо хадгалах үед алдаа гарлаа");
    } finally {
      setIsSavingLift(false);
    }
  };

  useEffect(() => {
    if (token && ajiltan?.baiguullagiinId) {
      fetchLiftFloors();
      fetchInvoiceSchedule();
    }
  }, [token, ajiltan?.baiguullagiinId]);

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

  const openAddModal = (isUilchilgee = false) => {
    setEditingItem(null);
    setIsUilchilgeeModal(isUilchilgee);
    setFormData({
      ner: "",
      turul: isUilchilgee ? "үйлчилгээ" : "тогтмол",
      tariff: 0,
      suuriKhuraamj: 0,
      nuatBodokhEsekh: false,
      lift: null,
    });
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
      lift: item.lift ?? null,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.ner || !formData.turul) {
      openErrorOverlay("Нэр болон төрлийг бөглөнө үү");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lift: formData.lift ?? null,
        ...(barilgiinId ? { barilgiinId } : {}),
      };

      if (editingItem) {
        await updateZardal(editingItem._id, payload);
        openSuccessOverlay("Амжилттай шинэчиллээ");
      } else {
        await addZardal(payload);
        openSuccessOverlay("Амжилттай нэмлээ");
      }
      setIsModalOpen(false);
    } catch (error) {
      openErrorOverlay("Хадгалахад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTariffChange = async (
    item: ZardalItem,
    newTariff: number,
    isUilchilgee = false
  ) => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтрэх шаардлагатай");
      return;
    }

    try {
      const endpoint = isUilchilgee
        ? "uilchilgeeniiZardal"
        : "ashiglaltiinZardluud";
      const response = await fetch(
        `http://103.143.40.46:8084/${endpoint}/${item._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...item,
            tariff: newTariff,
            ...(barilgiinId ? { barilgiinId } : {}),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      openSuccessOverlay("Амжилттай шинэчиллээ");
      refreshZardluud();
    } catch (error) {
      openErrorOverlay("Шинэчлэхэд алдаа гарлаа");
    }
  };

  const saveTariff = async (item: ZardalItem, isUilchilgee = false) => {
    const newTariff = editedTariffs[item._id];
    if (newTariff === undefined) return;
    await handleTariffChange(item, newTariff, isUilchilgee);

    setEditedTariffs((prev) => {
      const { [item._id]: _, ...rest } = prev;
      return rest;
    });
  };

  if (!ajiltan || !ajiltan.baiguullagiinId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="xxl:col-span-6 col-span-12">
          <div className="flex items-center border-b border-amber-200 px-5 pb-2 pt-5">
            <h2 className="mr-auto text-theme font-medium">Тогтмол зардал</h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl">
                <span className="text-sm font-medium text-theme">
                  {liftEnabled ? "Лифт идэвхтэй:" : "Лифт идэвхгүй:"}
                </span>
                <MSwitch
                  checked={liftEnabled}
                  onChange={async (e) => {
                    const checked = e.currentTarget.checked;
                    if (checked) {
                      setLiftModalOpen(true);
                    } else {
                      setLiftEnabled(false);
                      await saveLiftSettings([]);
                    }
                  }}
                />
              </div>

              {liftEnabled && liftFloors.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-3xl">
                  <button
                    onClick={() => setLiftModalOpen(true)}
                    className="btn-minimal btn-save"
                  >
                    Засах
                  </button>
                </div>
              )}

              {liftEnabled && liftFloors.length === 0 && (
                <button
                  onClick={() => setLiftModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Давхар нэмэх
                </button>
              )}
            </div>

            <div className="text-sm text-theme mr-3">
              Нийт: {ashiglaltiinZardluud.length}
            </div>
            <div
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-blue-500 p-2 text-theme hover:bg-blue-600 transition-colors"
              onClick={() => openAddModal(false)}
            >
              <MTooltip label="Нэмэх">
                <PlusOutlined />
              </MTooltip>
            </div>
          </div>

          <div className="box">
            <div className="flex items-center gap-4 p-5">
              <div className="font-medium text-theme flex-1">
                Нэхэмжлэх илгээх тохиргоо
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-theme">Идэвхтэй</span>
                <MSwitch
                  checked={invoiceActive}
                  onChange={(e) => setInvoiceActive(e.currentTarget.checked)}
                />
              </div>
            </div>
            {invoiceActive && (
              <div className="flex items-center gap-4 px-5 pb-5">
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">
                    Өдөр (сар бүр)
                  </label>
                  <MNumberInput
                    min={1}
                    max={31}
                    placeholder="Нэхэмжлэх өдөр"
                    value={invoiceDay ?? undefined}
                    onChange={(v) => setInvoiceDay((v as number) ?? null)}
                  />
                </div>
                <MButton
                  className="btn-minimal btn-save mt-6"
                  onClick={saveInvoiceSchedule}
                >
                  Хадгалах
                </MButton>
              </div>
            )}
          </div>

          <MModal
            title={
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold">
                  Лифт хөнгөлөх давхрууд
                </span>
              </div>
            }
            opened={liftModalOpen}
            onClose={() => {
              setLiftModalOpen(false);
              if (liftFloors.length === 0) {
                setLiftEnabled(false);
              }
            }}
            className="modal-blur"
            size="lg"
          >
            <div className="space-y-4">
              <div className="bg-transparent backdrop-blur-sm p-4 rounded-3xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Давхар нэмэх
                    </label>
                    <div className="flex gap-2">
                      <MNumberInput
                        min={1}
                        placeholder="Жишээ: 7"
                        className="flex-1 bg-white"
                        value={singleFloor ?? undefined}
                        onChange={(v) => setSingleFloor((v as number) ?? null)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          if (singleFloor && singleFloor > 0) {
                            setLiftFloors(
                              toUniqueSorted([...liftFloors, singleFloor])
                            );
                            setSingleFloor(null);
                          }
                        }}
                      />
                      <MButton
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => {
                          if (singleFloor && singleFloor > 0) {
                            setLiftFloors(
                              toUniqueSorted([...liftFloors, singleFloor])
                            );
                            setSingleFloor(null);
                          }
                        }}
                      >
                        Нэмэх
                      </MButton>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Бөөнөөр оруулах
                    </label>
                    <MTextarea
                      autosize
                      minRows={2}
                      maxRows={4}
                      placeholder="Жишээ: 1-5, 7, 9-11"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.currentTarget.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <MButton
                        onClick={() => {
                          if (!bulkText.trim()) return;
                          const parsed = parseBulk(bulkText);
                          setLiftFloors(
                            toUniqueSorted([...liftFloors, ...parsed])
                          );
                          setBulkText("");
                        }}
                      >
                        Нэмэх
                      </MButton>
                      <MButton
                        variant="default"
                        onClick={() => setBulkText("")}
                      >
                        Цэвэрлэх
                      </MButton>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Формат: "1-5, 7, 9-11" эсвэл зай/мөрөөр тусгаарлаж болно.
                  Давхрууд автоматаар цэгцлэгдэж, давхардал арилна.
                </div>
              </div>

              {liftFloors.length > 0 && (
                <div className="bg-transparent backdrop-blur-sm p-4 rounded-3xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-800">
                      Сонгосон давхрууд ({liftFloors.length})
                    </h3>
                    <MButton
                      variant="subtle"
                      color="red"
                      onClick={() => setLiftFloors([])}
                      size="xs"
                    >
                      Бүгдийг арилгах
                    </MButton>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {toUniqueSorted(liftFloors).map((floor) => (
                      <Badge
                        key={floor}
                        color="blue"
                        variant="filled"
                        className="px-3 py-1 rounded-2xl"
                        rightSection={
                          <button
                            aria-label="remove"
                            className="ml-2 text-white/80 hover:text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              setLiftFloors(
                                liftFloors.filter((f) => f !== floor)
                              );
                            }}
                          >
                            ×
                          </button>
                        }
                      >
                        {floor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <MButton
                variant="default"
                onClick={() => {
                  setLiftModalOpen(false);
                  if (liftFloors.length === 0) {
                    setLiftEnabled(false);
                  }
                }}
                className="btn-minimal btn-cancel"
              >
                Болих
              </MButton>
              <MButton
                className="btn-minimal btn-save"
                loading={isSavingLift}
                onClick={() => {
                  // Allow saving an empty list to disable without toggling the switch
                  saveLiftSettings(liftFloors);
                  setLiftEnabled(liftFloors.length > 0);
                }}
              >
                {liftFloors.length === 0 ? "Идэвхгүй болгох" : "Хадгалах"}
              </MButton>
            </div>
          </MModal>
          {isLoadingAshiglaltiin ? (
            <div className="flex justify-center items-center p-10">
              <Loader />
            </div>
          ) : ashiglaltiinZardluud.length === 0 ? (
            <div className="p-8 text-center text-theme">
              Тогтмол зардал байхгүй байна
            </div>
          ) : (
            ashiglaltiinZardluud.map((mur) => (
              <div key={mur._id} className="box">
                <div className="flex items-center p-5">
                  <div className="border-l-2 border-blue-500 pl-4 flex-1">
                    <div className="font-medium text-theme">{mur.ner}</div>
                    <div className="text-theme text-sm">{mur.turul}</div>
                    {mur.suuriKhuraamj !== undefined && (
                      <div className="text-xs text-theme mt-1">
                        Суурь хураамж: {formatNumber(mur.suuriKhuraamj, 0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <MNumberInput
                      className="w-32 text-right text-theme"
                      value={
                        editedTariffs[mur._id] !== undefined
                          ? editedTariffs[mur._id]
                          : mur.tariff
                      }
                      onChange={(v) =>
                        setEditedTariffs((prev) => ({
                          ...prev,
                          [mur._id]: Number(v as number),
                        }))
                      }
                      rightSection={
                        <span className="text-slate-500 pr-1">₮</span>
                      }
                    />
                    <MButton
                      className="btn-minimal btn-save"
                      disabled={
                        editedTariffs[mur._id] === undefined ||
                        editedTariffs[mur._id] === mur.tariff
                      }
                      onClick={() => saveTariff(mur, false)}
                    >
                      Хадгалах
                    </MButton>
                  </div>
                  <div className="ml-3 flex space-x-2">
                    <div
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 p-2 text-white hover:bg-red-600 transition-colors"
                      onClick={() => {
                        if (confirm(`Зардал устгах уу? (${mur.ner})`)) {
                          deleteZardal(mur._id);
                        }
                      }}
                    >
                      <MTooltip label="Устгах">
                        <DeleteOutlined />
                      </MTooltip>
                    </div>
                    <div
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-yellow-500 p-2 text-white hover:bg-yellow-600 transition-colors"
                      onClick={() => openEditModal(mur, false)}
                    >
                      <MTooltip label="Засах">
                        <EditOutlined />
                      </MTooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <MModal
        title={editingItem ? "Зардал засах" : "Зардал нэмэх"}
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Зардлын нэр
            </label>
            <MTextInput
              value={formData.ner}
              onChange={(e) =>
                setFormData({ ...formData, ner: e.currentTarget.value })
              }
              placeholder="Зардлын нэр оруулах"
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Төрөл</label>
            <MSelect
              value={formData.turul}
              onChange={(value) =>
                setFormData({ ...formData, turul: value ?? "" })
              }
              className="w-full"
              data={expenseTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              placeholder="Сонгох"
              searchable
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Зардлын төрөл
            </label>
            <MSelect
              clearable
              value={formData.lift ?? undefined}
              onChange={(value) =>
                setFormData({ ...formData, lift: (value as string) ?? null })
              }
              className="w-full"
              data={[
                { label: "Лифт", value: "Лифт" },
                { label: "Энгийн", value: "Энгийн" },
              ]}
              placeholder="Сонгох (Лифт)"
              searchable
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тариф (₮)</label>
            <MNumberInput
              value={formData.tariff}
              onChange={(v) =>
                setFormData({ ...formData, tariff: Number(v as number) })
              }
              placeholder="0"
              className="text-theme"
              rightSection={<span className="text-slate-500 pr-1">₮</span>}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Суурь хураамж
            </label>
            <MNumberInput
              value={formData.suuriKhuraamj}
              onChange={(v) =>
                setFormData({
                  ...formData,
                  suuriKhuraamj: Number(v as number),
                })
              }
              placeholder="0"
              className="text-theme"
              rightSection={<span className="text-slate-500 pr-1">₮</span>}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.nuatBodokhEsekh}
              onChange={(e) =>
                setFormData({ ...formData, nuatBodokhEsekh: e.target.checked })
              }
              className="mr-2"
            />
            <label className="text-sm font-medium">НӨАТ бодох</label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <MButton
              variant="default"
              onClick={() => setIsModalOpen(false)}
              className="btn-cancel btn-minimal"
            >
              Болих
            </MButton>
            <MButton
              className="btn-minimal btn-save"
              loading={isSaving}
              onClick={handleSave}
            >
              Хадгалах
            </MButton>
          </div>
        </div>
      </MModal>
    </>
  );
}
