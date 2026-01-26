"use client";

import React, { useImperativeHandle, useState } from "react";
import {
  TextInput as MTextInput,
  NumberInput as MNumberInput,
  Select as MSelect,
  Button as MButton,
  Textarea as MTextarea,
} from "@mantine/core";
import {
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import createMethod from "../../../tools/function/createMethod";
import updateMethod from "../../../tools/function/updateMethod";

interface ZogsoolBurtgekhProps {
  data?: any;
  jagsaalt?: any[];
  barilgiinId?: string;
  token: string;
  refresh: () => void;
  onClose: () => void;
}

interface FormData {
  _id?: string;
  ner: string;
  too: number | string;
  undsenUne: number | string;
  zogsooliinDans?: string;
  zogsooliinDansSticker?: string;
  undsenMin?: boolean;
  garakhTsag?: number | string;
  gadnaZogsooliinId?: string;
  orokhKhaalgaGarTokhirgoo?: boolean;
  garakhKhaalgaGarTokhirgoo?: boolean;
  zurchilZaavalBurtgekhEsekh?: boolean;
  zogsoolTooKhyazgaarlakhEsekh?: boolean;
  zogsoolKhuleekhMashinEsekh?: boolean;
  gadaaStickerAshiglakhEsekh?: boolean;
  tokiBolonStickerAshiglakhEsekh?: boolean;
  barilgaTusBur?: boolean;
  togtmolTulburEsekh?: boolean;
  togtmolTulburiinDun?: number | string;
  mashinGargakhKhugatsaa?: number | string;
  mashinUstgakhKhugatsaa?: number | string;
  tulburuud?: any[];
  khaalga?: any[];
}

function ZogsoolBurtgekh(
  {
    data,
    jagsaalt = [],
    barilgiinId,
    token,
    refresh,
    onClose,
  }: ZogsoolBurtgekhProps,
  ref: React.Ref<any>
) {
  const [formData, setFormData] = useState<FormData>({
    _id: data?._id,
    ner: data?.ner || "",
    too: data?.too || "",
    undsenUne: data?.undsenUne || "",
    zogsooliinDans: data?.zogsooliinDans || "",
    zogsooliinDansSticker: data?.zogsooliinDansSticker || "",
    undsenMin: data?.undsenMin || false,
    garakhTsag: data?.garakhTsag || "",
    gadnaZogsooliinId: data?.gadnaZogsooliinId,
    orokhKhaalgaGarTokhirgoo: data?.orokhKhaalgaGarTokhirgoo || false,
    garakhKhaalgaGarTokhirgoo: data?.garakhKhaalgaGarTokhirgoo || false,
    zurchilZaavalBurtgekhEsekh: data?.zurchilZaavalBurtgekhEsekh || false,
    zogsoolTooKhyazgaarlakhEsekh: data?.zogsoolTooKhyazgaarlakhEsekh || false,
    zogsoolKhuleekhMashinEsekh: data?.zogsoolKhuleekhMashinEsekh || false,
    gadaaStickerAshiglakhEsekh: data?.gadaaStickerAshiglakhEsekh || false,
    tokiBolonStickerAshiglakhEsekh:
      data?.tokiBolonStickerAshiglakhEsekh || false,
    barilgaTusBur: data?.barilgaTusBur || false,
    togtmolTulburEsekh: data?.togtmolTulburEsekh || false,
    togtmolTulburiinDun: data?.togtmolTulburiinDun || "",
    mashinGargakhKhugatsaa: data?.mashinGargakhKhugatsaa || "",
    mashinUstgakhKhugatsaa: data?.mashinUstgakhKhugatsaa || "",
    tulburuud: data?.tulburuud || [],
    khaalga: data?.khaalga || [],
  });

  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    async khadgalya() {
      try {
        if (!formData.ner || !formData.too || !formData.undsenUne) {
          openErrorOverlay("Заавал бөглөх талбаруудыг бөглөнө үү");
          return;
        }

        setLoading(true);
        const body = {
          ...formData,
          tokiNer: formData.tokiBolonStickerAshiglakhEsekh
            ? formData.ner
            : undefined,
          barilgiinId,
        };

        if (data?._id) {
          await updateMethod("parking", token, { ...body, _id: data._id });
        } else {
          await createMethod("parking", token, body);
        }

        openSuccessOverlay("Амжилттай хадгаллаа");
        onClose();
        refresh();
      } catch (e: any) {
        openErrorOverlay(e?.message || "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    },
    khaaya() {
      onClose();
    },
  }));

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTariff = () => {
    setFormData((prev) => ({
      ...prev,
      tulburuud: [...(prev.tulburuud || []), { tsag: [], tariff: [] }],
    }));
  };

  const removeTariff = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tulburuud: prev.tulburuud?.filter((_, i) => i !== index),
    }));
  };

  const addKhaalga = () => {
    setFormData((prev) => ({
      ...prev,
      khaalga: [...(prev.khaalga || []), { ner: "", turul: "", camera: [] }],
    }));
  };

  const removeKhaalga = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      khaalga: prev.khaalga?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Зогсоолын нэр <span className="text-red-500">*</span>
          </label>
          <MTextInput
            value={formData.ner}
            onChange={(e) => updateField("ner", e.currentTarget.value)}
            placeholder="Нэр"
            className="text-theme"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Нийт зогсоолын тоо <span className="text-red-500">*</span>
          </label>
          <MNumberInput
            value={formData.too as number}
            onChange={(val) => updateField("too", val)}
            placeholder="Тоо"
            className="text-theme"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Үндсэн тариф <span className="text-red-500">*</span>
          </label>
          <MNumberInput
            value={formData.undsenUne as number}
            onChange={(val) => updateField("undsenUne", val)}
            placeholder="Тариф"
            className="text-theme"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Зогсоолын данс
          </label>
          <MTextInput
            value={formData.zogsooliinDans}
            onChange={(e) =>
              updateField("zogsooliinDans", e.currentTarget.value)
            }
            placeholder="Зогсоолын данс"
            className="text-theme"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Зогсоолын данс (Sticker)
          </label>
          <MTextInput
            value={formData.zogsooliinDansSticker}
            onChange={(e) =>
              updateField("zogsooliinDansSticker", e.currentTarget.value)
            }
            placeholder="Зогсоолын данс"
            className="text-theme"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Гарах цаг (мин)
          </label>
          <MNumberInput
            value={formData.garakhTsag as number}
            onChange={(val) => updateField("garakhTsag", val)}
            placeholder="Хугацаа/мин"
            className="text-theme"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Гадна зогсоол сонгох
          </label>
          <MSelect
            value={formData.gadnaZogsooliinId || null}
            onChange={(val) =>
              updateField("gadnaZogsooliinId", val || undefined)
            }
            placeholder="Зогсоол сонгох"
            className="text-theme"
            clearable
            data={jagsaalt
              .filter((mur: any) =>
                data ? (mur._id || mur.key) !== (data._id || data.key) : true
              )
              .map((mur: any) => ({
                label: mur.ner || "Unknown",
                value: String(mur._id || mur.key),
              }))
              .filter((item) => item.value && item.label)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Машин автоматаар гаргах хугацаа (цаг)
          </label>
          <MNumberInput
            value={formData.mashinGargakhKhugatsaa as number}
            onChange={(val) => updateField("mashinGargakhKhugatsaa", val)}
            placeholder="Хугацаа/цаг"
            className="text-theme"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-theme">
            Баазаас машины түүх устгах хугацаа (хоног)
          </label>
          <MNumberInput
            value={formData.mashinUstgakhKhugatsaa as number}
            onChange={(val) => updateField("mashinUstgakhKhugatsaa", val)}
            placeholder="Хугацаа/Хоног"
            className="text-theme"
            min={0}
          />
        </div>

        {formData.togtmolTulburEsekh && (
          <div>
            <label className="block text-sm font-medium mb-1 text-theme">
              Тогтмол төлбөрийн дүн
            </label>
            <MNumberInput
              value={formData.togtmolTulburiinDun as number}
              onChange={(val) => updateField("togtmolTulburiinDun", val)}
              placeholder="Тогтмол төлбөрийн дүн"
              className="text-theme"
              min={0}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Үндсэн тариф 30мин эсэх</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.undsenMin}
              onChange={(e) =>
                updateField("undsenMin", e.currentTarget.checked)
              }
              aria-label="Үндсэн тариф 30мин эсэх"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Орох хаалга гар тохиргоо</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.orokhKhaalgaGarTokhirgoo}
              onChange={(e) =>
                updateField("orokhKhaalgaGarTokhirgoo", e.currentTarget.checked)
              }
              aria-label="Орох хаалга гар тохиргоо"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Гарах хаалга гар тохиргоо</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.garakhKhaalgaGarTokhirgoo}
              onChange={(e) =>
                updateField(
                  "garakhKhaalgaGarTokhirgoo",
                  e.currentTarget.checked
                )
              }
              aria-label="Гарах хаалга гар тохиргоо"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Шалтгаан заавал бүртгэх</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.zurchilZaavalBurtgekhEsekh}
              onChange={(e) =>
                updateField(
                  "zurchilZaavalBurtgekhEsekh",
                  e.currentTarget.checked
                )
              }
              aria-label="Шалтгаан заавал бүртгэх"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Зогсоолын тоо хязгаарлах</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.zogsoolTooKhyazgaarlakhEsekh}
              onChange={(e) =>
                updateField(
                  "zogsoolTooKhyazgaarlakhEsekh",
                  e.currentTarget.checked
                )
              }
              aria-label="Зогсоолын тоо хязгаарлах"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Хүлээлгийн горим ашиглах</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.zogsoolKhuleekhMashinEsekh}
              onChange={(e) =>
                updateField(
                  "zogsoolKhuleekhMashinEsekh",
                  e.currentTarget.checked
                )
              }
              aria-label="Хүлээлгийн горим ашиглах"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">Гадаа sticker QR ашиглах</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.gadaaStickerAshiglakhEsekh}
              onChange={(e) =>
                updateField(
                  "gadaaStickerAshiglakhEsekh",
                  e.currentTarget.checked
                )
              }
              aria-label="Гадаа sticker QR ашиглах"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">
            Toki болон гадаа sticker QR ашиглах
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.tokiBolonStickerAshiglakhEsekh}
              onChange={(e) =>
                updateField(
                  "tokiBolonStickerAshiglakhEsekh",
                  e.currentTarget.checked
                )
              }
              aria-label="Toki болон гадаа sticker QR ашиглах"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">
            Барилга тус бүрээр хязгаарлах
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.barilgaTusBur}
              onChange={(e) =>
                updateField("barilgaTusBur", e.currentTarget.checked)
              }
              aria-label="Барилга тус бүрээр хязгаарлах"
            />
            <span className="slider" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-theme">
            Тогтмол төлбөр бодогдох эсэх
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.togtmolTulburEsekh}
              onChange={(e) => {
                updateField("togtmolTulburEsekh", e.currentTarget.checked);
                if (!e.currentTarget.checked) {
                  updateField("togtmolTulburiinDun", "");
                }
              }}
              aria-label="Тогтмол төлбөр бодогдох эсэх"
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-theme font-medium">Тарифууд</h3>
          <MButton
            leftSection={<PlusOutlined />}
            onClick={addTariff}
            className="btn-minimal"
            size="sm"
          >
            Тариф нэмэх
          </MButton>
        </div>
        <div className="space-y-3">
          {formData.tulburuud?.map((tariff, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 bg-green-50 dark:bg-gray-700 relative"
            >
              <button
                onClick={() => removeTariff(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <MinusCircleOutlined />
              </button>
              <div className="text-sm text-theme font-medium mb-3">
                Тариф {index + 1}
              </div>

              <div className="space-y-2">
                <MButton
                  onClick={() => {
                    const newTulburuud = [...(formData.tulburuud || [])];
                    if (!newTulburuud[index].tariff) {
                      newTulburuud[index].tariff = [];
                    }
                    newTulburuud[index].tariff.push({ minut: "", tulbur: "" });
                    setFormData((prev) => ({
                      ...prev,
                      tulburuud: newTulburuud,
                    }));
                  }}
                  size="xs"
                  className="btn-minimal"
                >
                  <PlusOutlined /> Тариф нэмэх
                </MButton>

                {tariff.tariff?.map((item: any, itemIndex: number) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-2 gap-2 items-end"
                  >
                    <div>
                      <label className="block text-xs mb-1 text-theme">
                        Минут хүртэл:
                      </label>
                      <MNumberInput
                        value={item.minut}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].minut = val;
                          setFormData((prev) => ({
                            ...prev,
                            tulburuud: newTulburuud,
                          }));
                        }}
                        placeholder="Минут"
                        size="xs"
                        min={0}
                      />
                    </div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <label className="block text-xs mb-1 text-theme">
                          Тариф/₮/:
                        </label>
                        <MNumberInput
                          value={item.tulbur}
                          onChange={(val) => {
                            const newTulburuud = [
                              ...(formData.tulburuud || []),
                            ];
                            newTulburuud[index].tariff[itemIndex].tulbur = val;
                            setFormData((prev) => ({
                              ...prev,
                              tulburuud: newTulburuud,
                            }));
                          }}
                          placeholder="Тариф"
                          size="xs"
                          min={0}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff = newTulburuud[
                            index
                          ].tariff.filter(
                            (_: any, i: number) => i !== itemIndex
                          );
                          setFormData((prev) => ({
                            ...prev,
                            tulburuud: newTulburuud,
                          }));
                        }}
                        className="mb-1 text-red-500 hover:text-red-700"
                      >
                        <MinusCircleOutlined />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-theme font-medium">Хаалганууд</h3>
          <MButton
            leftSection={<PlusOutlined />}
            onClick={addKhaalga}
            className="btn-minimal"
            size="sm"
          >
            Хаалга нэмэх
          </MButton>
        </div>
        <div className="space-y-3">
          {formData.khaalga?.map((gate, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 bg-yellow-50 dark:bg-gray-700 relative"
            >
              <button
                onClick={() => removeKhaalga(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <MinusCircleOutlined />
              </button>
              <div className="text-sm text-theme font-medium mb-3">
                Хаалга {index + 1}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-theme">
                    Нэр: <span className="text-red-500">*</span>
                  </label>
                  <MTextInput
                    value={gate.ner}
                    onChange={(e) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].ner = e.currentTarget.value;
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Ялгах нэр"
                    size="xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-theme">
                    Төрөл: <span className="text-red-500">*</span>
                  </label>
                  <MSelect
                    value={gate.turul}
                    onChange={(val) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].turul = val || "";
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Орох / Гарах"
                    size="xs"
                    data={[
                      { label: "Орох", value: "Орох" },
                      { label: "Гарах", value: "Гарах" },
                    ]}
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-theme">
                    Камерын тохиргоо
                  </h4>
                  <MButton
                    onClick={() => {
                      const newKhaalga = [...(formData.khaalga || [])];
                    if (!newKhaalga[index].camera) {
                      newKhaalga[index].camera = [];
                    }
                    newKhaalga[index].camera.push({
                      cameraIP: "",
                      cameraPort: 80,
                      cameraType: gate.turul === "Орох" ? "entry" : "exit",
                      cameraName: "",
                      tokhirgoo: {
                        USER: "",
                        PASSWD: "",
                        ROOT: "",
                        PORT: "",
                        dotorKamerEsekh: false,
                      },
                    });
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    size="xs"
                    className="btn-minimal"
                  >
                    <PlusOutlined /> Камер нэмэх
                  </MButton>
                </div>

                <div className="space-y-3">
                  {gate.camera?.map((cam: any, camIndex: number) => (
                    <div
                      key={camIndex}
                      className="p-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)]"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-theme">
                            Камерын нэр
                          </label>
                          <MTextInput
                            value={cam.cameraName || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraName =
                                e.currentTarget.value;
                              setFormData((prev) => ({
                                ...prev,
                                khaalga: newKhaalga,
                              }));
                            }}
                            placeholder="Камерын нэр"
                            size="xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-theme">
                            Төрөл
                          </label>
                          <MSelect
                            value={cam.cameraType || (gate.turul === "Орох" ? "entry" : "exit")}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraType =
                                val || (gate.turul === "Орох" ? "entry" : "exit");
                              setFormData((prev) => ({
                                ...prev,
                                khaalga: newKhaalga,
                              }));
                            }}
                            size="xs"
                            data={[
                              { label: "Орох", value: "entry" },
                              { label: "Гарах", value: "exit" },
                            ]}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-theme">
                            IP хаяг <span className="text-red-500">*</span>
                          </label>
                          <MTextInput
                            value={cam.cameraIP || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraIP =
                                e.currentTarget.value;
                              setFormData((prev) => ({
                                ...prev,
                                khaalga: newKhaalga,
                              }));
                            }}
                            placeholder="192.168.1.100"
                            size="xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-theme">
                            Порт
                          </label>
                          <MNumberInput
                            value={cam.cameraPort || 80}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraPort =
                                val || 80;
                              setFormData((prev) => ({
                                ...prev,
                                khaalga: newKhaalga,
                              }));
                            }}
                            placeholder="80"
                            size="xs"
                            min={1}
                            max={65535}
                          />
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <label className="block text-xs font-medium mb-2 text-theme">
                          Камерын тохиргоо
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-theme">
                              Хэрэглэгчийн нэр (USER)
                            </label>
                            <MTextInput
                              value={cam.tokhirgoo?.USER || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) {
                                  newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                }
                                newKhaalga[index].camera[camIndex].tokhirgoo.USER =
                                  e.currentTarget.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  khaalga: newKhaalga,
                                }));
                              }}
                              placeholder="test"
                              size="xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-theme">
                              Нууц үг (PASSWD)
                            </label>
                            <MTextInput
                              type="password"
                              value={cam.tokhirgoo?.PASSWD || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) {
                                  newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                }
                                newKhaalga[index].camera[camIndex].tokhirgoo.PASSWD =
                                  e.currentTarget.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  khaalga: newKhaalga,
                                }));
                              }}
                              placeholder="••••••••"
                              size="xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-theme">
                              ROOT
                            </label>
                            <MTextInput
                              value={cam.tokhirgoo?.ROOT || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) {
                                  newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                }
                                newKhaalga[index].camera[camIndex].tokhirgoo.ROOT =
                                  e.currentTarget.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  khaalga: newKhaalga,
                                }));
                              }}
                              placeholder="test"
                              size="xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-theme">
                              Порт (PORT)
                            </label>
                            <MNumberInput
                              value={cam.tokhirgoo?.PORT ? Number(cam.tokhirgoo.PORT) : undefined}
                              onChange={(val) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) {
                                  newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                }
                                newKhaalga[index].camera[camIndex].tokhirgoo.PORT =
                                  val ? String(val) : "";
                                setFormData((prev) => ({
                                  ...prev,
                                  khaalga: newKhaalga,
                                }));
                              }}
                              placeholder="89"
                              size="xs"
                              min={1}
                              max={65535}
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cam.tokhirgoo?.dotorKamerEsekh || false}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) {
                                  newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                }
                                newKhaalga[index].camera[camIndex].tokhirgoo.dotorKamerEsekh =
                                  e.target.checked;
                                setFormData((prev) => ({
                                  ...prev,
                                  khaalga: newKhaalga,
                                }));
                              }}
                              className="rounded"
                            />
                            <span className="text-xs text-theme">Дотор камер эсэх</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            const newKhaalga = [...(formData.khaalga || [])];
                            newKhaalga[index].camera = newKhaalga[
                              index
                            ].camera.filter(
                              (_: any, i: number) => i !== camIndex
                            );
                            setFormData((prev) => ({
                              ...prev,
                              khaalga: newKhaalga,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                          title="Устгах"
                        >
                          <MinusCircleOutlined /> Устгах
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!gate.camera || gate.camera.length === 0) && (
                    <div className="text-xs text-[color:var(--muted-text)] text-center py-2">
                      Камер нэмэх товчийг дарж камер нэмнэ үү
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.forwardRef(ZogsoolBurtgekh);
