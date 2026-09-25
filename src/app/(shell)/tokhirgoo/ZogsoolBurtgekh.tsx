"use client";

import React, { useImperativeHandle, useState } from "react";
import {
  TextInput as MTextInput,
  NumberInput as MNumberInput,
  Select as MSelect,
  Switch as MSwitch,
} from "@mantine/core";
import moment from "moment";
import { 
  Plus, 
  MinusCircle, 
  Settings, 
  Info, 
  CreditCard, 
  Clock, 
  Trash2, 
  Camera, 
  DoorOpen, 
  Layers,
  Activity,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import createMethod from "../../../../tools/function/createMethod";
import updateMethod from "../../../../tools/function/updateMethod";

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
  const [activeTab, setActiveTab] = useState<"general" | "gates" | "tariffs" | "switches">("general");

  useImperativeHandle(ref, () => ({
    async khadgalya() {
      try {
        if (!formData.ner || !formData.too || !formData.undsenUne) {
          openErrorOverlay("Нэр, тоо, тариф талбаруудыг заавал бөглөнө үү");
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

  const SectionHeader = ({ icon: Icon, title, description, colorClass }: any) => (
    <div className="flex items-center gap-3 mb-4">
      <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass || 'bg-theme/10 text-brand'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-[15px] text-[color:var(--panel-text)]">{title}</h3>
        {description && <p className="text-[13px] text-[color:var(--muted-text)] mt-0.5">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Navigation Tabs */}
      {/* Дараалал: эхлээд үндсэн мэдээлэл, дараа нь үнэ, сүүлд тоног төхөөрөмж.
          «Системийн тохиргоо» нь үндсэнтэй ижил зорилготой тул нэгтгэв. */}
      <div className="stg-segment flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`stg-segment-item inline-flex min-h-10 items-center gap-2 whitespace-nowrap ${
            activeTab === "general" ? "is-active" : ""
          }`}
        >
          <span>Үндсэн тохиргоо</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tariffs")}
          className={`stg-segment-item inline-flex min-h-10 items-center gap-2 whitespace-nowrap ${
            activeTab === "tariffs" ? "is-active" : ""
          }`}
        >
          <span>Шатлалт тариф</span>
          <span className={`inline-flex items-center justify-center min-w-[22px] px-1.5 text-xs rounded-full ${
            activeTab === "tariffs"
              ? "bg-theme/15 text-brand"
              : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
          }`}>
            {formData.tulburuud?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gates")}
          className={`stg-segment-item inline-flex min-h-10 items-center gap-2 whitespace-nowrap ${
            activeTab === "gates" ? "is-active" : ""
          }`}
        >
          <span>Хаалга & Камер</span>
          <span className={`inline-flex items-center justify-center min-w-[22px] px-1.5 text-xs rounded-full ${
            activeTab === "gates"
              ? "bg-theme/15 text-brand"
              : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
          }`}>
            {formData.khaalga?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1: General & Financial & Operational Settings */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
            <SectionHeader icon={Info} title="Ерөнхий мэдээлэл" description="Зогсоолын нэр болон багтаамж" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">
                  Зогсоолын нэр <span className="text-danger">*</span>
                </label>
                <MTextInput
                  value={formData.ner}
                  onChange={(e) => updateField("ner", e.currentTarget.value)}
                  placeholder="Жишээ: Төв зогсоол"
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">
                  Багтаамж <span className="text-danger">*</span>
                </label>
                <MNumberInput
                  value={formData.too as number}
                  onChange={(val) => updateField("too", val)}
                  placeholder="Машины тоо"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">
                  Үндсэн тариф <span className="text-danger">*</span>
                </label>
                <MNumberInput
                  value={formData.undsenUne as number}
                  onChange={(val) => updateField("undsenUne", val)}
                  placeholder="0.00"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  thousandSeparator=","
                />
              </div>
            </div>
          </section>

          {/* Financial Settings */}
          <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
            <SectionHeader icon={CreditCard} title="Санхүүгийн тохиргоо" description="Дансны мэдээлэл" colorClass="bg-theme/10 text-brand" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Үндсэн данс</label>
                <MTextInput
                  value={formData.zogsooliinDans}
                  onChange={(e) => updateField("zogsooliinDans", e.currentTarget.value)}
                  placeholder="Дансны дугаар"
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Sticker данс (QR)</label>
                <MTextInput
                  value={formData.zogsooliinDansSticker}
                  onChange={(e) => updateField("zogsooliinDansSticker", e.currentTarget.value)}
                  placeholder="Дансны дугаар"
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>
            </div>
            
            {formData.togtmolTulburEsekh && (
              <div className="mt-4 p-4 rounded-xl bg-theme/5 border border-theme/30">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80 mb-2">Тогтмол төлбөрийн дүн</label>
                <MNumberInput
                  value={formData.togtmolTulburiinDun as number}
                  onChange={(val) => updateField("togtmolTulburiinDun", val)}
                  placeholder="0.00"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  thousandSeparator=","
                />
              </div>
            )}
          </section>

          {/* Operational Settings */}
          <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
            <SectionHeader icon={Clock} title="Үйл ажиллагааны хугацаа" description="Автомат процесс болон устгах хугацаа" colorClass="bg-theme/10 text-brand" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Гарах хугацаа (мин)</label>
                <MNumberInput
                  value={formData.garakhTsag as number}
                  onChange={(val) => updateField("garakhTsag", val)}
                  placeholder="мин"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Авто гаргалт (цаг)</label>
                <MNumberInput
                  value={formData.mashinGargakhKhugatsaa as number}
                  onChange={(val) => updateField("mashinGargakhKhugatsaa", val)}
                  placeholder="цаг"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Устгах (хоног)</label>
                <MNumberInput
                  value={formData.mashinUstgakhKhugatsaa as number}
                  onChange={(val) => updateField("mashinUstgakhKhugatsaa", val)}
                  placeholder="хоног"
                  min={0}
                  classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Гадна зогсоолын сонголт</label>
              <MTextInput
                value={formData.gadnaZogsooliinId || ""}
                onChange={(e) => updateField("gadnaZogsooliinId", e.currentTarget.value || undefined)}
                placeholder="Холбоотой зогсоолын ID оруулах..."
                classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Системийн хязгаарлалт — «Үндсэн тохиргоо» дотор, доод хэсэгт */}
      {(activeTab === "general" || activeTab === "switches") && (
        <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
          <SectionHeader icon={ShieldCheck} title="Системийн хязгаарлалт" description="Нэмэлт тохиргоонууд" colorClass="bg-theme/10 text-brand" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Тариф 30 минутаар бодох", field: "undsenMin" },
              { label: "Орох хаалга гар тохиргоо", field: "orokhKhaalgaGarTokhirgoo" },
              { label: "Гарах хаалга гар тохиргоо", field: "garakhKhaalgaGarTokhirgoo" },
              { label: "Шалтгаан заавал бүртгэх", field: "zurchilZaavalBurtgekhEsekh" },
              { label: "Тоо хязгаарлах", field: "zogsoolTooKhyazgaarlakhEsekh" },
              { label: "Хүлээлгийн горим ашиглах", field: "zogsoolKhuleekhMashinEsekh" },
              { label: "Гадаа Sticker QR ашиглах", field: "gadaaStickerAshiglakhEsekh" },
              { label: "Toki болон Sticker ашиглах", field: "tokiBolonStickerAshiglakhEsekh" },
              { label: "Барилгаар хязгаарлах", field: "barilgaTusBur" },
              { 
                label: "Тогтмол төлбөр бодогдох", 
                field: "togtmolTulburEsekh",
                onChange: (checked: boolean) => {
                  updateField("togtmolTulburEsekh", checked);
                  if (!checked) updateField("togtmolTulburiinDun", "");
                }
              },
            ].map((item: any) => (
              <div key={item.field} className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[color:var(--surface-hover)]">
                <span className="text-sm text-[color:var(--panel-text)]">{item.label}</span>
                <MSwitch
                  checked={formData[item.field as keyof FormData] as boolean}
                  onChange={(e) => item.onChange ? item.onChange(e.currentTarget.checked) : updateField(item.field, e.currentTarget.checked)}
                  size="sm"
                  color="blue"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Tiered Tariffs */}
      {activeTab === "tariffs" && (
      <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-3">
          <SectionHeader icon={Layers} title="Тарифын бүтэц" description="Цагийн шатлалтай үнийн тохиргоо" colorClass="bg-theme/10 text-brand" />
          <button
            type="button"
            onClick={addTariff}
            className="stg-btn stg-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            Тариф нэмэх
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formData.tulburuud?.map((tariff, index) => (
            <div key={index} className="relative p-4 rounded-xl bg-[color:var(--surface-hover)]">
              <button
                onClick={() => removeTariff(index)}
                className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors"
                type="button"
                title="Устгах"
                aria-label="Устгах"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[color:var(--surface-border)]">
                <Activity className="w-4 h-4 text-brand" />
                <span className="text-sm text-[color:var(--panel-text)]">Групп #{index + 1}</span>
              </div>

              <div className="mb-4 space-y-2">
                <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Цаг</label>
                <div className="flex items-center gap-3">
                  <MTextInput
                    type="time"
                    value={tariff.tsag?.[0] ? moment(tariff.tsag[0]).format("HH:mm") : ""}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      const newTulburuud = [...(formData.tulburuud || [])];
                      if (!newTulburuud[index].tsag) newTulburuud[index].tsag = [];
                      newTulburuud[index].tsag[0] = moment(val, "HH:mm").toDate();
                      setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                    }}
                    classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  />
                  <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)]" />
                  <MTextInput
                    type="time"
                    value={tariff.tsag?.[1] ? moment(tariff.tsag[1]).format("HH:mm") : ""}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      const newTulburuud = [...(formData.tulburuud || [])];
                      if (!newTulburuud[index].tsag) newTulburuud[index].tsag = [];
                      newTulburuud[index].tsag[1] = moment(val, "HH:mm").toDate();
                      setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                    }}
                    classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {tariff.tariff?.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="flex items-end gap-3 p-3 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]">
                    <div className="flex-1 space-y-2">
                      <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Минут</label>
                      <MNumberInput
                        value={item.minut}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].minut = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder="минут"
                        min={0}
                        classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                      />
                    </div>
                    <div className="pb-3">
                      <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Тариф (₮)</label>
                      <MNumberInput
                        value={item.tulbur}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].tulbur = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder=""
                        min={0}
                        classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                        thousandSeparator=","
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newTulburuud = [...(formData.tulburuud || [])];
                        newTulburuud[index].tariff = newTulburuud[index].tariff.filter((_: any, i: number) => i !== itemIndex);
                        setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      type="button"
                      title="Шатлал устгах"
                      aria-label="Шатлал устгах"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const newTulburuud = [...(formData.tulburuud || [])];
                    if (!newTulburuud[index].tariff) newTulburuud[index].tariff = [];
                    newTulburuud[index].tariff.push({ minut: "", tulbur: "" });
                    setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                  }}
                  className="stg-btn stg-btn-ghost shrink-0 w-full"
                >
                  <Plus className="w-4 h-4" />
                  Шатлал нэмэх
                </button>
              </div>
            </div>
          ))}
        </div>
        {(!formData.tulburuud || formData.tulburuud.length === 0) && (
          <div className="text-center py-10 border border-dashed border-[color:var(--surface-border)] rounded-xl">
            <p className="text-sm text-[color:var(--panel-text)]">Нэмэлт тарифын мэдээлэл хоосон байна</p>
            <p className="text-[13px] text-[color:var(--muted-text)] mt-1">«Тариф нэмэх» товчийг дарж шинэ шатлал үүсгэнэ үү</p>
          </div>
        )}
      </section>
      )}

      {/* Tab 4: Gates Section */}
      {activeTab === "gates" && (
      <section className="rounded-xl border border-[color:var(--surface-border)] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
          <SectionHeader icon={DoorOpen} title="Хаалганы удирдлага" description="Gate удирдлага болон Камерын холболт" colorClass="bg-[color:var(--surface-hover)] text-[color:var(--panel-text)]" />
          <button
            type="button"
            onClick={addKhaalga}
            className="stg-btn stg-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            Хаалга нэмэх
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formData.khaalga?.map((gate, index) => (
            <div key={index} className="relative p-4 rounded-xl bg-[color:var(--surface-hover)]">
              <button
                onClick={() => removeKhaalga(index)}
                className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors"
                type="button"
                title="Устгах"
                aria-label="Устгах"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pr-11">
                <div className="space-y-1.5">
                  <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Хаалганы таних нэр</label>
                  <MTextInput
                    value={gate.ner}
                    onChange={(e) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].ner = e.currentTarget.value;
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Жишээ: Хойд Gate 1"
                    classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] text-[color:var(--panel-text)] opacity-80">Хөдөлгөөний төрөл</label>
                  <MSelect
                    value={gate.turul}
                    onChange={(val) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].turul = val || "";
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Орох / Гарах"
                    classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                    data={[{ label: "Орох", value: "Орох" }, { label: "Гарах", value: "Гарах" }]}
                  />
                </div>
              </div>

              {/* Cameras inside Gate */}
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[color:var(--surface-border)]">
                  <div className="flex items-center gap-2 text-sm text-[color:var(--panel-text)]">
                    <Camera className="w-4 h-4 text-brand" />
                    <span>Холболттой IP Камерууд</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      if (!newKhaalga[index].camera) newKhaalga[index].camera = [];
                      newKhaalga[index].camera.push({
                        cameraIP: "",
                        cameraPort: 80,
                        cameraType: gate.turul === "Орох" ? "entry" : "exit",
                        cameraName: "",
                        tokhirgoo: { USER: "", PASSWD: "", ROOT: "", PORT: "", dotorKamerEsekh: false },
                      });
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    className="stg-btn stg-btn-ghost shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Камер нэмэх
                  </button>
                </div>

                <div className="space-y-3">
                  {gate.camera?.map((cam: any, camIndex: number) => (
                    <div key={camIndex} className="p-3 sm:p-4 rounded-xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-[color:var(--surface-border)]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 min-w-6 px-1 rounded-full bg-theme/10 items-center justify-center text-xs text-brand">{camIndex + 1}</span>
                          <span className="text-sm text-[color:var(--panel-text)]">Камер #{camIndex + 1}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newKhaalga = [...(formData.khaalga || [])];
                            newKhaalga[index].camera = newKhaalga[index].camera.filter((_: any, i: number) => i !== camIndex);
                            setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          type="button"
                          title="Камер устгах"
                          aria-label="Камер устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[13px] text-[color:var(--muted-text)]">Камерын нэр</label>
                          <MTextInput
                            value={cam.cameraName || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraName = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="Нэр"
                            classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[13px] text-[color:var(--muted-text)]">IP төрөл</label>
                          <MSelect
                            value={cam.cameraType || (gate.turul === "Орох" ? "entry" : "exit")}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraType = val || "entry";
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                            data={[{ label: "Орох (Entry)", value: "entry" }, { label: "Гарах (Exit)", value: "exit" }]}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[13px] text-[color:var(--muted-text)]">IP хаяг (V4)</label>
                          <MTextInput
                            value={cam.cameraIP || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraIP = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="192.168.1.x"
                            classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[13px] text-[color:var(--muted-text)]">TCP порт</label>
                          <MNumberInput
                            value={cam.cameraPort || 80}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraPort = val || 80;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                          />
                        </div>
                      </div>

                      {/* Advanced Auth Settings */}
                      <div className="mt-2 p-3 rounded-lg bg-[color:var(--surface-hover)] space-y-3">
                        <div className="flex items-center gap-2 text-[13px] text-[color:var(--panel-text)]">
                          <Settings className="w-4 h-4 text-[color:var(--muted-text)]" />
                          <span>Нэвтрэх эрх & Configuration</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[13px] text-[color:var(--muted-text)]">Username</label>
                            <MTextInput
                              value={cam.tokhirgoo?.USER || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.USER = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[13px] text-[color:var(--muted-text)]">Password</label>
                            <MTextInput
                              type="password"
                              value={cam.tokhirgoo?.PASSWD || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.PASSWD = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[13px] text-[color:var(--muted-text)]">Root stream</label>
                            <MTextInput
                              value={cam.tokhirgoo?.ROOT || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.ROOT = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[13px] text-[color:var(--muted-text)]">HTTP port</label>
                            <MNumberInput
                              value={cam.tokhirgoo?.PORT ? Number(cam.tokhirgoo.PORT) : undefined}
                              onChange={(val) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.PORT = val ? String(val) : "";
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              min={1}
                              max={65535}
                              classNames={{ input: "!h-10 !min-h-10 !rounded-[10px] !text-sm bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:border-theme transition-colors text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                            />
                          </div>
                        </div>
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[13px] text-[color:var(--panel-text)]">Дотор камерын горим (Indoor Mode)</span>
                          <MSwitch
                            checked={cam.tokhirgoo?.dotorKamerEsekh || false}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                              newKhaalga[index].camera[camIndex].tokhirgoo.dotorKamerEsekh = e.currentTarget.checked;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            size="sm"
                            color="blue"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!gate.camera || gate.camera.length === 0) && (
                    <div className="text-center py-6 rounded-xl border border-dashed border-[color:var(--surface-border)]">
                      <p className="text-[13px] text-[color:var(--muted-text)]">Холбогдсон камер алга. «Камер нэмэх» товчийг дарж нэмнэ үү</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!formData.khaalga || formData.khaalga.length === 0) && (
            <div className="text-center py-10 rounded-xl border border-dashed border-[color:var(--surface-border)] lg:col-span-2">
              <p className="text-sm text-[color:var(--panel-text)]">Хаалга бүртгэгдээгүй байна</p>
              <p className="text-[13px] text-[color:var(--muted-text)] mt-1">«Хаалга нэмэх» товчийг дарж хаалгаа бүртгэнэ үү</p>
            </div>
          )}
        </div>
      </section>
      )}
    </div>
  );
}

export default React.forwardRef(ZogsoolBurtgekh);
