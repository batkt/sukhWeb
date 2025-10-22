"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Popconfirm,
  Tooltip,
  Modal,
  Input,
  Select,
  Spin,
  Switch,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import formatNumber from "../../../tools/function/formatNumber";
import { useAuth } from "@/lib/useAuth";
import toast from "react-hot-toast";
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
  lift: string | null; // only 'Лифт' or null
  suuriKhuraamj?: number;
  nuatBodokhEsekh?: boolean;
}

export default function AshiglaltiinZardluud() {
  const { token, ajiltan } = useAuth();

  const {
    zardluud: ashiglaltiinZardluud,
    isLoading: isLoadingAshiglaltiin,
    addZardal,
    updateZardal,
    deleteZardal,
    mutate: refreshZardluud,
  } = useAshiglaltiinZardluud();

  const [isSaving, setIsSaving] = useState(false);
  const [liftEnabled, setLiftEnabled] = useState<boolean>(false);
  const [liftModalOpen, setLiftModalOpen] = useState<boolean>(false);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const [isSavingLift, setIsSavingLift] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ZardalItem | null>(null);
  const [isUilchilgeeModal, setIsUilchilgeeModal] = useState(false);
  const saveLiftSettings = async (floors: string[]) => {
    if (!token) {
      toast.error("Нэвтрэх шаардлагатай");
      return;
    }

    setIsSavingLift(true);

    try {
      const response = await fetch("http://103.143.40.46:8084/liftShalgaya", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ choloolugdokhDavkhar: floors }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();

      toast.success("Lift давхруудыг амжилттай хадгаллаа");

      setLiftFloors(floors);
      setLiftEnabled(floors.length > 0);
      setLiftModalOpen(false);
    } catch (error) {
      toast.error("Lift давхруудыг хадгалах үед алдаа гарлаа");
    } finally {
      setIsSavingLift(false);
    }
  };

  const [formData, setFormData] = useState<ZardalFormData>({
    ner: "",
    turul: "",
    tariff: 0,
    suuriKhuraamj: 0,
    nuatBodokhEsekh: false,
    lift: null, // not selected by default
  });

  const [expenseTypes] = useState<string[]>([
    "1м3/талбай",
    "нэгж/талбай",
    "тогтмол",
    "үйлчилгээ",
  ]);

  const [pageSize] = useState(100);

  const fetchLiftFloors = async () => {
    if (!token || !ajiltan?.baiguullagiinId) return;

    try {
      const response = await fetch(
        `http://103.143.40.46:8084/liftShalgaya?baiguullagiinId=${ajiltan.baiguullagiinId}&khuudasniiDugaar=1&khuudasniiKhemjee=100`,
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

          setLiftFloors(floors);
          setLiftEnabled(floors.length > 0);
          return;
        }
      }

      setLiftFloors([]);
      setLiftEnabled(false);
    } catch (error) {}
  };

  useEffect(() => {
    if (token && ajiltan?.baiguullagiinId) {
      fetchLiftFloors();
    }
  }, [token, ajiltan?.baiguullagiinId]);

  const openAddModal = (isUilchilgee = false) => {
    setEditingItem(null);
    setIsUilchilgeeModal(isUilchilgee);
    setFormData({
      ner: "",
      turul: isUilchilgee ? "үйлчилгээ" : "тогтмол",
      tariff: 0,
      suuriKhuraamj: 0,
      nuatBodokhEsekh: false,
      lift: null, // can select 'Лифт' or leave null
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
      toast.error("Нэр болон төрлийг бөглөнө үү");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lift: formData.lift ?? null, // send null if not selected
      };

      if (editingItem) {
        await updateZardal(editingItem._id, payload);
        toast.success("Амжилттай шинэчиллээ");
      } else {
        await addZardal(payload);
        toast.success("Амжилттай нэмлээ");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Хадгалахад алдаа гарлаа");
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
      toast.error("Нэвтрэх шаардлагатай");
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
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Амжилттай шинэчиллээ");

      refreshZardluud();
    } catch (error) {
      toast.error("Шинэчлэхэд алдаа гарлаа");
    }
  };

  if (!ajiltan || !ajiltan.baiguullagiinId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <div className="xxl:col-span-6 col-span-12">
          <div className="box max-h-[100vh] overflow-y-scroll custom-scrollbar bg-transparent backdrop-blur-sm">
            <div className="flex items-center border-b border-amber-200 px-5 pb-2 pt-5">
              <h2 className="mr-auto text-base font-medium">Тогтмол зардал</h2>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg  backdrop-blur-sm ">
                  <span className="text-sm font-medium text-slate-700">
                    Лифт идэвхтэй:
                  </span>
                  <Switch
                    checked={liftEnabled}
                    onChange={async (checked) => {
                      if (checked) {
                        setLiftModalOpen(true);
                      } else {
                        await saveLiftSettings([]);
                      }
                    }}
                    className="bg-gray-200"
                  />
                </div>

                {liftEnabled && liftFloors.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg  backdrop-blur-sm ">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">
                        {liftFloors.length} давхар
                      </span>
                    </div>

                    <div className="h-4 w-px bg-blue-200"></div>

                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {liftFloors.map((floor, index) => (
                        <span
                          key={floor}
                          className="inline-flex items-center bg-white/80 border border-blue-300 px-2 py-0.5 rounded-md text-sm font-medium text-blue-700"
                        >
                          {floor}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setLiftModalOpen(true)}
                      className="ml-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Засах
                    </button>
                  </div>
                )}

                {liftEnabled && liftFloors.length === 0 && (
                  <button
                    onClick={() => setLiftModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

              <div className="text-sm text-slate-600 mr-3">
                Нийт: {ashiglaltiinZardluud.length}
              </div>
              <div
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-green-500 p-2 text-white hover:bg-green-600 transition-colors"
                onClick={() => openAddModal(false)}
              >
                <Tooltip title="Нэмэх">
                  <PlusOutlined />
                </Tooltip>
              </div>
            </div>

            <Modal
              title={
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    Лифт давхруудыг оруулах
                  </span>
                </div>
              }
              open={liftModalOpen}
              onOk={() => {
                const input = document.querySelector(
                  'input[placeholder="Жишээ: 1, 2, 3..."]'
                ) as HTMLInputElement;
                const value = input?.value.trim();

                let finalFloors = [...liftFloors];
                if (value && !finalFloors.includes(value)) {
                  finalFloors = [...finalFloors, value];
                }

                saveLiftSettings(finalFloors);
                setLiftEnabled(true);
              }}
              onCancel={() => {
                setLiftModalOpen(false);
                if (liftFloors.length === 0) {
                  setLiftEnabled(false);
                }
              }}
              confirmLoading={isSavingLift}
              okText="Хадгалах"
              cancelText="Болих"
              width={520}
              okButtonProps={{
                disabled: liftFloors.length === 0,
                className: liftFloors.length === 0 ? "opacity-50" : "",
              }}
              className="modal-blur"
            >
              <div className="space-y-4">
                <div className="bg-transparent backdrop-blur-sm p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Давхар нэмэх
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Давхрын дугаар оруулах..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const value = input.value.trim();

                            if (value && !liftFloors.includes(value)) {
                              setLiftFloors([...liftFloors, value]);
                              input.value = "";
                            }
                            input.focus();
                          }
                        }}
                      />
                      <Button
                        type="primary"
                        onClick={(e) => {
                          const input = e.currentTarget
                            .previousElementSibling as HTMLInputElement;
                          const value = input.value.trim();
                          if (value && !liftFloors.includes(value)) {
                            setLiftFloors([...liftFloors, value]);
                            input.value = "";
                          }
                          input.focus();
                        }}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Нэмэх
                      </Button>
                    </div>
                  </div>
                </div>

                {liftFloors.length > 0 && (
                  <div className="bg-transparent backdrop-blur-sm p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-800">
                        Сонгосон давхрууд ({liftFloors.length})
                      </h3>
                      <Button
                        danger
                        type="link"
                        onClick={() => setLiftFloors([])}
                        size="small"
                      >
                        Бүгдийг арилгах
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {liftFloors.map((floor) => (
                        <div
                          key={floor}
                          className="flex items-center justify-between bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200"
                        >
                          <span className="font-medium">{floor}</span>
                          <button
                            onClick={() =>
                              setLiftFloors(
                                liftFloors.filter((f) => f !== floor)
                              )
                            }
                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Modal>
            {isLoadingAshiglaltiin ? (
              <div className="flex justify-center items-center p-10">
                <Spin />
              </div>
            ) : ashiglaltiinZardluud.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Тогтмол зардал байхгүй байна
              </div>
            ) : (
              ashiglaltiinZardluud.map((mur) => (
                <div key={mur._id} className="box">
                  <div className="flex items-center p-5">
                    <div className="border-l-2 border-green-500 pl-4 flex-1">
                      <div className="font-medium">{mur.ner}</div>
                      <div className="text-slate-600 text-sm">{mur.turul}</div>
                      {mur.suuriKhuraamj !== undefined && (
                        <div className="text-xs text-slate-500 mt-1">
                          Суурь хураамж: {formatNumber(mur.suuriKhuraamj, 0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-auto">
                      <Input
                        type="number"
                        value={mur.tariff}
                        onChange={(e) =>
                          handleTariffChange(mur, Number(e.target.value), false)
                        }
                        className="w-32 text-right"
                        suffix="₮"
                      />
                    </div>
                    <div className="ml-5 flex space-x-2">
                      <Popconfirm
                        title={`Зардал устгах уу? (${mur.ner})`}
                        okText="Тийм"
                        cancelText="Үгүй"
                        onConfirm={() => deleteZardal(mur._id)}
                      >
                        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 p-2 text-white hover:bg-red-600 transition-colors">
                          <Tooltip title="Устгах">
                            <DeleteOutlined />
                          </Tooltip>
                        </div>
                      </Popconfirm>
                      <div
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-yellow-500 p-2 text-white hover:bg-yellow-600 transition-colors"
                        onClick={() => openEditModal(mur, false)}
                      >
                        <Tooltip title="Засах">
                          <EditOutlined />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        title={editingItem ? "Зардал засах" : "Зардал нэмэх"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={isSaving}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Зардлын нэр
            </label>
            <Input
              value={formData.ner}
              onChange={(e) =>
                setFormData({ ...formData, ner: e.target.value })
              }
              placeholder="Зардлын нэр оруулах"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Төрөл</label>
            <Select
              value={formData.turul}
              onChange={(value) => setFormData({ ...formData, turul: value })}
              className="w-full"
              options={expenseTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              placeholder="Сонгох"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Зардлын төрөл
            </label>
            <Select
              allowClear
              value={formData.lift ?? undefined}
              onChange={(value) =>
                setFormData({ ...formData, lift: (value as string) ?? null })
              }
              onClear={() => setFormData({ ...formData, lift: null })}
              className="w-full"
              options={[{ label: "Лифт", value: "Лифт" }]} // hard-coded
              placeholder="Сонгох (Лифт)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тариф (₮)</label>
            <Input
              type="number"
              value={formData.tariff}
              onChange={(e) =>
                setFormData({ ...formData, tariff: Number(e.target.value) })
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Суурь хураамж
            </label>
            <Input
              type="number"
              value={formData.suuriKhuraamj}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  suuriKhuraamj: Number(e.target.value),
                })
              }
              placeholder="0"
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
        </div>
      </Modal>
    </>
  );
}
