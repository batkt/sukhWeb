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
import Button from "@/components/ui/Button";

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
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[color:var(--surface-border)]">
      <div className={`p-2 rounded-lg ${colorClass || 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-base  text-[color:var(--panel-text)]">{title}</h3>
        {description && <p className="text-xs text-[color:var(--muted-text)] mt-0.5">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[color:var(--surface-border)] pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          style={{ borderRadius: '10px' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all whitespace-nowrap font-medium ${
            activeTab === "general"
              ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
          }`}
        >
          <span>Ерөнхий & Санхүү</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gates")}
          style={{ borderRadius: '10px' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all whitespace-nowrap font-medium ${
            activeTab === "gates"
              ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
          }`}
        >
          <span>Хаалга & Камер</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors ${
            activeTab === "gates"
              ? "bg-blue-200/80 dark:bg-blue-800/80 text-blue-950 dark:text-blue-100 border border-blue-300/60 dark:border-blue-600/60"
              : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-300/50 dark:border-slate-600/50"
          }`}>
            {formData.khaalga?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tariffs")}
          style={{ borderRadius: '10px' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all whitespace-nowrap font-medium ${
            activeTab === "tariffs"
              ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
          }`}
        >
          <span>Шатлалт тариф</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors ${
            activeTab === "tariffs"
              ? "bg-blue-200/80 dark:bg-blue-800/80 text-blue-950 dark:text-blue-100 border border-blue-300/60 dark:border-blue-600/60"
              : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-300/50 dark:border-slate-600/50"
          }`}>
            {formData.tulburuud?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("switches")}
          style={{ borderRadius: '10px' }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-all whitespace-nowrap font-medium ${
            activeTab === "switches"
              ? "bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
          }`}
        >
          <span>Системийн тохиргоо</span>
        </button>
      </div>

      {/* Tab 1: General & Financial & Operational Settings */}
      {activeTab === "general" && (
        <div className="space-y-4">
          <section className="bg-[color:var(--surface-bg)] rounded-xl border border-[color:var(--surface-border)] p-4">
            <SectionHeader icon={Info} title="Ерөнхий мэдээлэл" description="Зогсоолын нэр болон багтаамж" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">
                  Зогсоолын нэр <span className="text-red-500">*</span>
                </label>
                <MTextInput
                  value={formData.ner}
                  onChange={(e) => updateField("ner", e.currentTarget.value)}
                  placeholder="Жишээ: Төв зогсоол"
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">
                  Багтаамж <span className="text-red-500">*</span>
                </label>
                <MNumberInput
                  value={formData.too as number}
                  onChange={(val) => updateField("too", val)}
                  placeholder="Машины тоо"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">
                  Үндсэн тариф <span className="text-red-500">*</span>
                </label>
                <MNumberInput
                  value={formData.undsenUne as number}
                  onChange={(val) => updateField("undsenUne", val)}
                  placeholder="0.00"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                  thousandSeparator=","
                />
              </div>
            </div>
          </section>

          {/* Financial Settings */}
          <section className="bg-[color:var(--surface-bg)] rounded-xl border border-[color:var(--surface-border)] p-4">
            <SectionHeader icon={CreditCard} title="Санхүүгийн тохиргоо" description="Дансны мэдээлэл" colorClass="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">Үндсэн данс</label>
                <MTextInput
                  value={formData.zogsooliinDans}
                  onChange={(e) => updateField("zogsooliinDans", e.currentTarget.value)}
                  placeholder="Дансны дугаар"
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">Sticker данс (QR)</label>
                <MTextInput
                  value={formData.zogsooliinDansSticker}
                  onChange={(e) => updateField("zogsooliinDansSticker", e.currentTarget.value)}
                  placeholder="Дансны дугаар"
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
            
            {formData.togtmolTulburEsekh && (
              <div style={{ borderRadius: '10px' }} className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <label className="block text-sm text-[color:var(--panel-text)] mb-2">Тогтмол төлбөрийн дүн</label>
                <MNumberInput
                  value={formData.togtmolTulburiinDun as number}
                  onChange={(val) => updateField("togtmolTulburiinDun", val)}
                  placeholder="0.00"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-green-300 dark:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                  thousandSeparator=","
                />
              </div>
            )}
          </section>

          {/* Operational Settings */}
          <section className="bg-[color:var(--surface-bg)] rounded-xl border border-[color:var(--surface-border)] p-4">
            <SectionHeader icon={Clock} title="Үйл ажиллагааны хугацаа" description="Автомат процесс болон устгах хугацаа" colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">Гарах хугацаа (мин)</label>
                <MNumberInput
                  value={formData.garakhTsag as number}
                  onChange={(val) => updateField("garakhTsag", val)}
                  placeholder="мин"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">Авто гаргалт (цаг)</label>
                <MNumberInput
                  value={formData.mashinGargakhKhugatsaa as number}
                  onChange={(val) => updateField("mashinGargakhKhugatsaa", val)}
                  placeholder="цаг"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">Устгах (хоног)</label>
                <MNumberInput
                  value={formData.mashinUstgakhKhugatsaa as number}
                  onChange={(val) => updateField("mashinUstgakhKhugatsaa", val)}
                  placeholder="хоног"
                  min={0}
                  classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm text-[color:var(--panel-text)]">Гадна зогсоолын сонголт</label>
              <MTextInput
                value={formData.gadnaZogsooliinId || ""}
                onChange={(e) => updateField("gadnaZogsooliinId", e.currentTarget.value || undefined)}
                placeholder="Холбоотой зогсоолын ID оруулах..."
                classNames={{ input: "!rounded-xl h-10 bg-[color:var(--surface-bg)] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                style={{ borderRadius: '10px' }}
              />
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: System Switches */}
      {activeTab === "switches" && (
        <section className="bg-[color:var(--surface-bg)] rounded-lg border border-[color:var(--surface-border)] p-4">
          <SectionHeader icon={ShieldCheck} title="Системийн хязгаарлалт" description="Нэмэлт тохиргоонууд" colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
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
              <div key={item.field} className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors">
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
      <section className="bg-[color:var(--surface-bg)] rounded-lg border border-[color:var(--surface-border)] p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
          <SectionHeader icon={Layers} title="Тарифын бүтэц" description="Цагийн шатлалтай үнийн тохиргоо" colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
          <Button
            onClick={addTariff}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            className="!rounded-lg"
            style={{ borderRadius: '0.5rem' }}
          >
            Тариф нэмэх
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formData.tulburuud?.map((tariff, index) => (
            <div key={index} className="relative p-4 rounded-lg bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]">
              <button
                onClick={() => removeTariff(index)}
                className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[color:var(--surface-border)]">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm  text-[color:var(--panel-text)]">Групп #{index + 1}</span>
              </div>

              <div className="mb-4 space-y-2">
                <label className="block text-sm  text-[color:var(--panel-text)]">Цаг</label>
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
                    classNames={{ input: "!rounded-lg h-10 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[color:var(--panel-text)]" }}
                    style={{ borderRadius: '0.5rem' }}
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
                    classNames={{ input: "!rounded-lg h-10 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[color:var(--panel-text)]" }}
                    style={{ borderRadius: '0.5rem' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {tariff.tariff?.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="flex items-end gap-3 p-3 rounded-lg bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)]">
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs  text-[color:var(--panel-text)]">Минут</label>
                      <MNumberInput
                        value={item.minut}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].minut = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder="минут"
                        min={0}
                        classNames={{ input: "!rounded-lg h-10 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                        style={{ borderRadius: '0.5rem' }}
                      />
                    </div>
                    <div className="pb-2">
                      <ChevronRight className="w-4 h-4 text-[color:var(--muted-text)]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-xs  text-[color:var(--panel-text)]">Тариф ()</label>
                      <MNumberInput
                        value={item.tulbur}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].tulbur = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder=""
                        min={0}
                        classNames={{ input: "!rounded-lg h-10 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]" }}
                        style={{ borderRadius: '0.5rem' }}
                        thousandSeparator=","
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newTulburuud = [...(formData.tulburuud || [])];
                        newTulburuud[index].tariff = newTulburuud[index].tariff.filter((_: any, i: number) => i !== itemIndex);
                        setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                      }}
                      className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mb-2"
                      type="button"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <Button
                  onClick={() => {
                    const newTulburuud = [...(formData.tulburuud || [])];
                    if (!newTulburuud[index].tariff) newTulburuud[index].tariff = [];
                    newTulburuud[index].tariff.push({ minut: "", tulbur: "" });
                    setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                  }}
                  variant="ghost"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="w-full !rounded-lg"
                  style={{ borderRadius: '0.5rem' }}
                >
                  Шатлал нэмэх
                </Button>
              </div>
            </div>
          ))}
        </div>
        {(!formData.tulburuud || formData.tulburuud.length === 0) && (
          <div className="text-center py-12 border-2 border-dashed border-[color:var(--surface-border)] rounded-lg bg-[color:var(--surface-bg)]">
            <p className="text-sm text-[color:var(--panel-text)]">Нэмэлт тарифын мэдээлэл хоосон байна</p>
            <p className="text-xs text-[color:var(--muted-text)] mt-1">Тариф нэмэх товчийг дарж шинэ шатлал үүсгэнэ үү</p>
          </div>
        )}
      </section>
      )}

      {/* Tab 4: Gates Section */}
      {activeTab === "gates" && (
      <section className="bg-[color:var(--surface-bg)] rounded-xl border border-[color:var(--surface-border)] p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <SectionHeader icon={DoorOpen} title="Хаалганы удирдлага" description="Gate удирдлага болон Камерын холболт" colorClass="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" />
          <Button
            onClick={addKhaalga}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            style={{ borderRadius: '10px' }}
            className="px-3.5"
          >
            Хаалга нэмэх
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {formData.khaalga?.map((gate, index) => (
            <div key={index} style={{ borderRadius: '12px' }} className="relative p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <button
                onClick={() => removeKhaalga(index)}
                className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pr-10">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[color:var(--panel-text)]">Хаалганы таних нэр</label>
                  <MTextInput
                    value={gate.ner}
                    onChange={(e) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].ner = e.currentTarget.value;
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Жишээ: Хойд Gate 1"
                    classNames={{ input: "!rounded-xl h-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] text-xs placeholder:text-[color:var(--muted-text)]" }}
                    style={{ borderRadius: '10px' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[color:var(--panel-text)]">Хөдөлгөөний төрөл</label>
                  <MSelect
                    value={gate.turul}
                    onChange={(val) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].turul = val || "";
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Орох / Гарах"
                    classNames={{ input: "!rounded-xl h-9 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] text-xs placeholder:text-[color:var(--muted-text)]" }}
                    style={{ borderRadius: '10px' }}
                    data={[{ label: "Орох", value: "Орох" }, { label: "Гарах", value: "Гарах" }]}
                  />
                </div>
              </div>

              {/* Cameras inside Gate */}
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--panel-text)]">
                    <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Холболттой IP Камерууд</span>
                  </div>
                  <Button
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
                    variant="ghost"
                    size="xs"
                    leftIcon={<Plus className="w-3 h-3" />}
                    style={{ borderRadius: '8px' }}
                  >
                    Камер нэмэх
                  </Button>
                </div>

                <div className="space-y-3">
                  {gate.camera?.map((cam: any, camIndex: number) => (
                    <div key={camIndex} style={{ borderRadius: '10px' }} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] text-blue-600 dark:text-blue-400 font-semibold">#{camIndex + 1}</span>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Камер #{camIndex + 1}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newKhaalga = [...(formData.khaalga || [])];
                            newKhaalga[index].camera = newKhaalga[index].camera.filter((_: any, i: number) => i !== camIndex);
                            setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                          }}
                          className="p-1 text-red-400 hover:text-red-500 rounded transition-all"
                          type="button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400">Камерын нэр</label>
                          <MTextInput
                            value={cam.cameraName || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraName = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="Нэр"
                            classNames={{ input: "!rounded-xl h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[color:var(--panel-text)]" }}
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400">IP төрөл</label>
                          <MSelect
                            value={cam.cameraType || (gate.turul === "Орох" ? "entry" : "exit")}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraType = val || "entry";
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            classNames={{ input: "!rounded-xl h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[color:var(--panel-text)]" }}
                            style={{ borderRadius: '8px' }}
                            data={[{ label: "Орох (Entry)", value: "entry" }, { label: "Гарах (Exit)", value: "exit" }]}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400">IP хаяг (V4)</label>
                          <MTextInput
                            value={cam.cameraIP || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraIP = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="192.168.1.x"
                            classNames={{ input: "!rounded-xl h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[color:var(--panel-text)]" }}
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] text-slate-600 dark:text-slate-400">TCP порт</label>
                          <MNumberInput
                            value={cam.cameraPort || 80}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraPort = val || 80;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            classNames={{ input: "!rounded-xl h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[color:var(--panel-text)]" }}
                            style={{ borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      {/* Advanced Auth Settings */}
                      <div style={{ borderRadius: '8px' }} className="mt-2 p-2.5 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">Нэвтрэх эрх & Configuration</span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500">USERNAME</label>
                            <MTextInput
                              value={cam.tokhirgoo?.USER || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.USER = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!rounded-xl h-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs" }}
                              style={{ borderRadius: '6px' }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500">PASSWORD</label>
                            <MTextInput
                              type="password"
                              value={cam.tokhirgoo?.PASSWD || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.PASSWD = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!rounded-xl h-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs" }}
                              style={{ borderRadius: '6px' }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500">ROOT STREAM</label>
                            <MTextInput
                              value={cam.tokhirgoo?.ROOT || ""}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.ROOT = e.currentTarget.value;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              classNames={{ input: "!rounded-xl h-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs" }}
                              style={{ borderRadius: '6px' }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500">HTTP PORT</label>
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
                              classNames={{ input: "!rounded-xl h-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs" }}
                              style={{ borderRadius: '6px' }}
                            />
                          </div>
                        </div>
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-xs text-slate-700 dark:text-slate-300">Дотор камерын горим (Indoor Mode)</span>
                          <MSwitch
                            checked={cam.tokhirgoo?.dotorKamerEsekh || false}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                              newKhaalga[index].camera[camIndex].tokhirgoo.dotorKamerEsekh = e.currentTarget.checked;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            size="xs"
                            color="blue"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!gate.camera || gate.camera.length === 0) && (
                    <div style={{ borderRadius: '10px' }} className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <p className="text-xs text-slate-500">Холболттой камер байхгүй</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!formData.khaalga || formData.khaalga.length === 0) && (
            <div style={{ borderRadius: '10px' }} className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <p className="text-sm text-[color:var(--panel-text)]">Gate тохиргоо одоогоор хоосон байна</p>
              <p className="text-xs text-[color:var(--muted-text)] mt-1">Хаалга нэмэх товчийг дарж системд бүртгэнэ үү</p>
            </div>
          )}
        </div>
      </section>
      )}
    </div>
  );
}

export default React.forwardRef(ZogsoolBurtgekh);
