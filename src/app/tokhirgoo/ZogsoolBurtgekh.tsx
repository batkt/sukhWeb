"use client";

import React, { useImperativeHandle, useState } from "react";
import {
  TextInput as MTextInput,
  NumberInput as MNumberInput,
  Select as MSelect,
  Button as MButton,
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
    <div className="flex items-center gap-3 mb-6 mt-2 border-b border-[color:var(--surface-border)] pb-4">
      <div className={`p-2.5 rounded-2xl ${colorClass || 'bg-theme/10 text-theme shadow-sm shadow-theme/5'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-bold text-[color:var(--panel-text)] tracking-tight leading-none">{title}</h3>
        {description && <p className="text-xs text-[color:var(--muted-text)] mt-1.5 font-medium">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 bg-[color:var(--surface-bg)] overflow-y-auto max-h-[70vh] custom-scrollbar pr-2 pb-10">
      {/* General Settings */}
      <section className="bg-white/40 dark:bg-black/10 p-4 rounded-2xl border border-[color:var(--surface-border)] shadow-inner">
        <SectionHeader icon={Info} title="Ерөнхий мэдээлэл" description="Зогсоолын нэр болон багтаамж" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[color:var(--muted-text)] flex items-center gap-1.5 ml-1">
              Зогсоолын нэр <span className="text-red-500">*</span>
            </label>
            <MTextInput
              value={formData.ner}
              onChange={(e) => updateField("ner", e.currentTarget.value)}
              placeholder="Жишээ: Төв зогсоол"
              classNames={{ input: "rounded-xl h-10 font-bold focus:border-theme shadow-sm bg-white/50 dark:bg-black/20" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[color:var(--muted-text)] flex items-center gap-1.2 ml-1">
              Багтаамж <span className="text-red-500 font-bold">*</span>
            </label>
            <MNumberInput
              value={formData.too as number}
              onChange={(val) => updateField("too", val)}
              placeholder="Машины тоо"
              min={0}
              classNames={{ input: "rounded-xl h-10 font-bold focus:border-theme shadow-sm bg-white/50 dark:bg-black/20" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[color:var(--muted-text)] flex items-center gap-1.2 ml-1">
              Үндсэн тариф (₮) <span className="text-red-500 font-bold">*</span>
            </label>
            <MNumberInput
              value={formData.undsenUne as number}
              onChange={(val) => updateField("undsenUne", val)}
              placeholder="0.00"
              min={0}
              classNames={{ input: "rounded-xl h-10 font-black text-theme focus:border-theme shadow-sm bg-white/50 dark:bg-black/20" }}
            />
          </div>
        </div>
      </section>

      {/* Financial Settings */}
      <section className="bg-white/40 dark:bg-black/10 p-4 rounded-2xl border border-[color:var(--surface-border)] shadow-inner">
        <SectionHeader icon={CreditCard} title="Санхүүгийн тохиргоо" description="Дансны мэдээлэл" colorClass="bg-emerald-500 text-white shadow-emerald-500/20" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[color:var(--muted-text)] ml-1">Үндсэн данс</label>
            <MTextInput
              value={formData.zogsooliinDans}
              onChange={(e) => updateField("zogsooliinDans", e.currentTarget.value)}
              placeholder="Дансны дугаар"
              classNames={{ input: "rounded-xl h-10 bg-white dark:bg-gray-900 border-emerald-500/20 focus:border-emerald-500" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[color:var(--muted-text)] ml-1">Sticker данс (QR)</label>
            <MTextInput
              value={formData.zogsooliinDansSticker}
              onChange={(e) => updateField("zogsooliinDansSticker", e.currentTarget.value)}
              placeholder="Дансны дугаар"
              classNames={{ input: "rounded-xl h-10 bg-white dark:bg-gray-900 border-emerald-500/20 focus:border-emerald-500" }}
            />
          </div>
        </div>
        
        {formData.togtmolTulburEsekh && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Тогтмол төлбөрийн дүн</label>
            <MNumberInput
              value={formData.togtmolTulburiinDun as number}
              onChange={(val) => updateField("togtmolTulburiinDun", val)}
              placeholder="₮ 0.00"
              min={0}
              classNames={{ input: "rounded-xl h-10 font-black bg-white dark:bg-gray-900 border-emerald-500/30 text-emerald-600" }}
            />
          </div>
        )}
      </section>

      {/* Operational Settings */}
      <section className="bg-white/40 dark:bg-black/10 p-4 rounded-2xl border border-[color:var(--surface-border)] shadow-inner">
        <SectionHeader icon={Clock} title="Үйл ажиллагааны хугацаа" description="Автомат процесс болон устгах хугацаа" colorClass="bg-indigo-500 text-white shadow-indigo-500/20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 shadow-sm">
            <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ml-1">Гарах хугацаа (мин)</label>
            <MNumberInput
              value={formData.garakhTsag as number}
              onChange={(val) => updateField("garakhTsag", val)}
              placeholder="мин"
              min={0}
              classNames={{ input: "rounded-xl border-indigo-200/50 h-9" }}
            />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 shadow-sm">
            <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ml-1">Авто гаргалт (цаг)</label>
            <MNumberInput
              value={formData.mashinGargakhKhugatsaa as number}
              onChange={(val) => updateField("mashinGargakhKhugatsaa", val)}
              placeholder="цаг"
              min={0}
              classNames={{ input: "rounded-xl border-indigo-200/50 h-9" }}
            />
          </div>

          <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 shadow-sm">
            <label className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ml-1">Устгах (хоног)</label>
            <MNumberInput
              value={formData.mashinUstgakhKhugatsaa as number}
              onChange={(val) => updateField("mashinUstgakhKhugatsaa", val)}
              placeholder="хоног"
              min={0}
              classNames={{ input: "rounded-xl border-indigo-200/50 h-9" }}
            />
          </div>
        </div>
        
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[color:var(--muted-text)] uppercase ml-1">Гадна зогсоолын сонголт</label>
          <MSelect
            value={formData.gadnaZogsooliinId || null}
            onChange={(val) => updateField("gadnaZogsooliinId", val || undefined)}
            placeholder="Холбоотой зогсоол сонгох..."
            classNames={{ input: "rounded-xl h-10 shadow-sm border-indigo-200/20" }}
            clearable
            data={jagsaalt
              .filter((mur: any) => data ? (mur._id || mur.key) !== (data._id || data.key) : true)
              .map((mur: any) => ({
                label: mur.ner || "Unknown",
                value: String(mur._id || mur.key),
              }))
              .filter((item) => item.value && item.label)}
          />
        </div>
      </section>

      {/* Advanced Toggles */}
      <section className="bg-slate-100/50 dark:bg-black/20 p-5 rounded-3xl border border-[color:var(--surface-border)]">
        <div className="flex items-center gap-2 mb-4">
           <div className="p-1.5 rounded-lg bg-slate-800 text-white">
              <ShieldCheck className="w-4 h-4" />
           </div>
           <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Системийн хязгаарлалт</h3>
        </div>
        
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
            <div key={item.field} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-gray-800/40 border border-slate-200/50 dark:border-gray-700 shadow-sm transition-all hover:scale-[1.01]">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
              <MSwitch
                checked={formData[item.field as keyof FormData] as boolean}
                onChange={(e) => item.onChange ? item.onChange(e.currentTarget.checked) : updateField(item.field, e.currentTarget.checked)}
                size="sm"
                color="indigo"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Tariffs Section */}
      <section className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 shadow-lg shadow-indigo-500/5">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-base font-black text-indigo-700 dark:text-indigo-400 tracking-tight leading-none">Тарифын бүтэц</h3>
                <p className="text-[10px] font-bold text-indigo-400 opacity-70 mt-1">Цагийн шатлалтай үнийн тохиргоо</p>
             </div>
          </div>
          <MButton
            leftSection={<Plus className="w-3.5 h-3.5" />}
            onClick={addTariff}
            variant="filled"
            color="indigo"
            radius="lg"
            size="xs"
            className="shadow-md shadow-indigo-500/20 h-9"
          >
            Тариф нэмэх
          </MButton>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {formData.tulburuud?.map((tariff, index) => (
            <div key={index} className="group relative p-6 rounded-[2rem] bg-white border border-indigo-100 shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-all hover:border-indigo-300">
              <button
                onClick={() => removeTariff(index)}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4" /> ГРУПП #{index + 1}
              </div>

              <div className="mb-6">
                <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block">Цаг</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-gray-900/30 dark:border-gray-700">
                   <div className="flex-1 flex items-center justify-between gap-4">
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
                         size="sm"
                         classNames={{ input: "rounded-xl h-10 border-indigo-500/10 focus:border-indigo-500 text-center font-bold" }}
                      />
                      <ChevronRight className="w-4 h-4 text-slate-300" />
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
                         size="sm"
                         classNames={{ input: "rounded-xl h-10 border-indigo-500/10 focus:border-indigo-500 text-center font-bold" }}
                      />
                   </div>
                   <Clock className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-4">
                {tariff.tariff?.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-gray-900/30 dark:border-gray-700">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 mb-1.5 block">минут &mdash;</label>
                      <MNumberInput
                        value={item.minut}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].minut = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder="минут"
                        size="sm"
                        min={0}
                        classNames={{ input: "rounded-xl h-10 border-indigo-500/10 focus:border-indigo-500" }}
                      />
                    </div>
                    <div className="w-8 flex items-center justify-center pt-5">
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-black text-indigo-400 mb-1.5 block">Тариф /₮/</label>
                      <MNumberInput
                        value={item.tulbur}
                        onChange={(val) => {
                          const newTulburuud = [...(formData.tulburuud || [])];
                          newTulburuud[index].tariff[itemIndex].tulbur = val;
                          setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                        }}
                        placeholder="₮"
                        size="sm"
                        min={0}
                        classNames={{ input: "rounded-xl h-10 font-bold text-indigo-600 border-indigo-500/10 focus:border-indigo-500" }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newTulburuud = [...(formData.tulburuud || [])];
                        newTulburuud[index].tariff = newTulburuud[index].tariff.filter((_: any, i: number) => i !== itemIndex);
                        setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                      }}
                      className="p-2 text-red-500/30 hover:text-red-500 transition-colors self-end"
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const newTulburuud = [...(formData.tulburuud || [])];
                    if (!newTulburuud[index].tariff) newTulburuud[index].tariff = [];
                    newTulburuud[index].tariff.push({ minut: "", tulbur: "" });
                    setFormData((prev) => ({ ...prev, tulburuud: newTulburuud }));
                  }}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-indigo-100 text-indigo-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Шатлал нэмэх
                </button>
              </div>
            </div>
          ))}
        </div>
        {(!formData.tulburuud || formData.tulburuud.length === 0) && (
            <div className="text-center py-10 border-2 border-dashed border-indigo-200 rounded-[2.5rem] bg-white opacity-60">
                <Layers className="w-10 h-10 mx-auto mb-3 text-indigo-300" />
                <p className="text-sm font-bold text-indigo-400 tracking-tight">Нэмэлт тарифын мэдээлэл хоосон байна</p>
                <p className="text-xs font-medium text-slate-400 mt-1">Тариф нэмэх товчийг дарж шинэ шатлал үүсгэнэ үү</p>
            </div>
        )}
      </section>

      {/* Gates Section */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/30">
                 <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-[color:var(--panel-text)] tracking-tight uppercase">Хаалганы удирдлага</h3>
                 <p className="text-xs font-bold text-[color:var(--muted-text)] opacity-70">Gate удирдлага болон Камерын холболт</p>
              </div>
           </div>
           <MButton
             leftSection={<Plus className="w-4 h-4" />}
             onClick={addKhaalga}
             variant="light"
             color="dark"
             radius="xl"
             size="md"
             className="border"
           >
             Хаалга нэмэх
           </MButton>
        </div>

        <div className="space-y-4">
          {formData.khaalga?.map((gate, index) => (
            <div key={index} className="p-5 rounded-2xl bg-white border border-[color:var(--surface-border)] shadow-md relative overflow-hidden group/gate dark:bg-gray-800/10">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-20 group-hover/gate:opacity-100 transition-opacity" />
              
              <button
                onClick={() => removeKhaalga(index)}
                className="absolute top-4 right-4 p-2 text-red-500/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-4 mb-6 pr-12 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ХААЛГАНЫ ТАНИХ НЭР</label>
                  <MTextInput
                    value={gate.ner}
                    onChange={(e) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].ner = e.currentTarget.value;
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Жишээ: Хойд Gate 1"
                    classNames={{ input: "rounded-xl h-10 font-bold shadow-sm" }}
                  />
                </div>
                <div className="w-full sm:w-48 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ХӨДӨЛГӨӨНИЙ ТӨРӨЛ</label>
                  <MSelect
                    value={gate.turul}
                    onChange={(val) => {
                      const newKhaalga = [...(formData.khaalga || [])];
                      newKhaalga[index].turul = val || "";
                      setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                    }}
                    placeholder="Орох / Гарах"
                    classNames={{ input: "rounded-xl h-10 font-black" }}
                    data={[{ label: "Орот", value: "Орох" }, { label: "Гарах", value: "Гарах" }]}
                  />
                </div>
              </div>

              {/* Cameras inside Gate */}
              <div className="bg-slate-50/80 dark:bg-black/20 p-5 rounded-2xl border border-slate-200/50 dark:border-gray-800 shadow-inner">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-theme/20 text-theme border border-theme/10">
                       <Camera className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Холболттой IP Камерууд</h4>
                  </div>
                  <button
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
                    className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-white border border-slate-200 text-[8px] font-black text-theme uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="w-3 h-3" /> ШИНЭ КАМЕР
                  </button>
                </div>

                <div className="space-y-4">
                  {gate.camera?.map((cam: any, camIndex: number) => (
                    <div key={camIndex} className="p-4 rounded-xl bg-white border border shadow-sm dark:bg-gray-800/60 dark:border-gray-700 group/cam">
                      <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black text-slate-400 font-mono italic">#{camIndex + 1}</span>
                         </div>
                         <button
                            onClick={() => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera = newKhaalga[index].camera.filter((_: any, i: number) => i !== camIndex);
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">КАМЕРЫН НЭР</label>
                          <MTextInput
                            value={cam.cameraName || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraName = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="Камерын нэр"
                            size="sm"
                            classNames={{ input: "rounded-xl font-bold border-slate-200" }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IP ТӨРӨЛ</label>
                          <MSelect
                            value={cam.cameraType || (gate.turul === "Орох" ? "entry" : "exit")}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraType = val || "entry";
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            size="sm"
                            classNames={{ input: "rounded-xl border-slate-200 font-bold" }}
                            data={[{ label: "Орох (Entry)", value: "entry" }, { label: "Гарах (Exit)", value: "exit" }]}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IP ХАЯГ (V4)</label>
                          <MTextInput
                            value={cam.cameraIP || ""}
                            onChange={(e) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraIP = e.currentTarget.value;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            placeholder="192.168.x.x"
                            size="sm"
                            classNames={{ input: "rounded-xl font-mono border-slate-200 font-bold" }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TCP ПОРТ (Stream)</label>
                          <MNumberInput
                            value={cam.cameraPort || 80}
                            onChange={(val) => {
                              const newKhaalga = [...(formData.khaalga || [])];
                              newKhaalga[index].camera[camIndex].cameraPort = val || 80;
                              setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                            }}
                            size="sm"
                            classNames={{ input: "rounded-xl font-mono border-slate-200 h-9" }}
                          />
                        </div>
                      </div>

                      {/* Advanced Auth Settings */}
                      <div className="mt-8 p-6 rounded-3xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                           <Settings className="w-3.5 h-3.5 text-slate-400" />
                           <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Нэвтрэх эрх & Configuration</h5>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 ml-1">USERNAME</label>
                              <MTextInput
                                value={cam.tokhirgoo?.USER || ""}
                                onChange={(e) => {
                                  const newKhaalga = [...(formData.khaalga || [])];
                                  if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                  newKhaalga[index].camera[camIndex].tokhirgoo.USER = e.currentTarget.value;
                                  setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                                }}
                                size="xs"
                                classNames={{ input: "rounded-xl border-slate-200 font-medium" }}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 ml-1">PASSWORD</label>
                              <MTextInput
                                type="password"
                                value={cam.tokhirgoo?.PASSWD || ""}
                                onChange={(e) => {
                                  const newKhaalga = [...(formData.khaalga || [])];
                                  if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                  newKhaalga[index].camera[camIndex].tokhirgoo.PASSWD = e.currentTarget.value;
                                  setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                                }}
                                size="xs"
                                classNames={{ input: "rounded-xl border-slate-200 font-medium" }}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 ml-1">ROOT STREAM</label>
                              <MTextInput
                                value={cam.tokhirgoo?.ROOT || ""}
                                onChange={(e) => {
                                  const newKhaalga = [...(formData.khaalga || [])];
                                  if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                  newKhaalga[index].camera[camIndex].tokhirgoo.ROOT = e.currentTarget.value;
                                  setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                                }}
                                size="xs"
                                classNames={{ input: "rounded-xl border-slate-200 font-medium" }}
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 ml-1">HTTP PORT</label>
                              <MNumberInput
                                value={cam.tokhirgoo?.PORT ? Number(cam.tokhirgoo.PORT) : undefined}
                                onChange={(val) => {
                                  const newKhaalga = [...(formData.khaalga || [])];
                                  if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                  newKhaalga[index].camera[camIndex].tokhirgoo.PORT = val ? String(val) : "";
                                  setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                                }}
                                size="xs"
                                min={1}
                                max={65535}
                                classNames={{ input: "rounded-xl border-slate-200 font-medium h-8" }}
                              />
                           </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between p-3 px-5 bg-white dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-gray-700">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Дотор камерын горим (Indoor Mode)</span>
                           <MSwitch
                              checked={cam.tokhirgoo?.dotorKamerEsekh || false}
                              onChange={(e) => {
                                const newKhaalga = [...(formData.khaalga || [])];
                                if (!newKhaalga[index].camera[camIndex].tokhirgoo) newKhaalga[index].camera[camIndex].tokhirgoo = {};
                                newKhaalga[index].camera[camIndex].tokhirgoo.dotorKamerEsekh = e.currentTarget.checked;
                                setFormData((prev) => ({ ...prev, khaalga: newKhaalga }));
                              }}
                              size="sm"
                              color="indigo"
                           />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!gate.camera || gate.camera.length === 0) && (
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-10 border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-white dark:bg-transparent dark:border-gray-800">
                      Холболттой камер байхгүй
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!formData.khaalga || formData.khaalga.length === 0) && (
              <div className="text-center py-16 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50 dark:bg-transparent dark:border-gray-800 opacity-60">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <DoorOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Gate тохиргоо одоогоор хоосон байна</p>
                  <p className="text-xs font-medium text-slate-300 mt-2 italic">Хаалга нэмэх товчийг дарж системд бүртгэнэ үү</p>
              </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default React.forwardRef(ZogsoolBurtgekh);
