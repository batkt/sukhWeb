"use client";

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import moment from "moment";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface ChangeItem {
  field?: string;
  talbar?: string;
  talbarNer?: string;
  oldValue?: any;
  newValue?: any;
  umnukhUtga?: any;
  shineUtga?: any;
  utganiiTurul?: string;
  _id?: string;
}

interface EditRecord {
  _id: string;
  modelName: string;
  documentId: string;
  ajiltniiNer: string;
  changes?: ChangeItem[];
  uurchlult?: ChangeItem[];
  createdAt?: string;
  ognoo?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  record: EditRecord | null;
}

const formatNumber = (val: any) => {
  if (val === null || val === undefined || isNaN(Number(val))) return "0";
  return new Intl.NumberFormat("en-US").format(Number(val));
};

const ValueRenderer: React.FC<{
  field: string;
  value: any;
  type?: string;
}> = ({ field, value, type }) => {
  const parsed = useMemo(() => {
    if (typeof value === "string") {
      try {
        // Only attempt to parse if it looks like JSON array or object
        if (value.startsWith("[") || value.startsWith("{")) {
          return JSON.parse(value);
        }
      } catch (e) {
        return value;
      }
    }
    return value;
  }, [value]);

  if (parsed === null || parsed === undefined || parsed === "") {
    return <span className="text-gray-500 italic opacity-50">(хоосон)</span>;
  }

  // --- Specialized Rendering for Expenses (zardluud) ---
  if (field === "zardluud" && Array.isArray(parsed)) {
    return (
      <div className="overflow-x-auto my-1">
        <table className="w-full text-[10px] border border-gray-700/30 rounded">
          <thead className="bg-gray-800/30 text-gray-400">
            <tr>
              <th className="p-1 border-b border-gray-700/30 text-left">Нэр</th>
              <th className="p-1 border-b border-gray-700/30 text-center">Төрөл</th>
              <th className="p-1 border-b border-gray-700/30 text-right">Үнэ</th>
              <th className="p-1 border-b border-gray-700/30 text-right">Төлөх дүн</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((item: any, idx) => (
              <tr key={item._id || idx} className="hover:bg-blue-500/5">
                <td className="p-1 border-b border-gray-700/10 text-left truncate max-w-[80px]">
                  {item.ner || "-"}
                </td>
                <td className="p-1 border-b border-gray-700/10 text-center text-gray-500">
                  {item.turul || "-"}
                </td>
                <td className="p-1 border-b border-gray-700/10 text-right font-mono">
                  {formatNumber(item.turul === "Дурын" ? item.dun : item.tariff)}
                </td>
                <td className="p-1 border-b border-gray-700/10 text-right font-mono text-blue-400">
                  {formatNumber(item.tulukhDun)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- Specialized Rendering for Segments (segmentuud) ---
  if (field === "segmentuud" && Array.isArray(parsed)) {
    return (
      <div className="overflow-x-auto my-1">
        <table className="w-full text-[10px] border border-gray-700/30 rounded">
          <thead className="bg-gray-800/30 text-gray-400">
            <tr>
              <th className="p-1 border-b border-gray-700/30 text-left">Нэр</th>
              <th className="p-1 border-b border-gray-700/30 text-center">Утга</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((item: any, idx) => (
              <tr key={item._id || idx} className="hover:bg-blue-500/5">
                <td className="p-1 border-b border-gray-700/10 text-left text-gray-400">
                  {item.ner || "-"}
                </td>
                <td className="p-1 border-b border-gray-700/10 text-center font-medium">
                  {typeof item.utga === "number" ? formatNumber(item.utga) : String(item.utga || "-")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- Specialized Rendering for Discounts (khungulultuud) ---
  if (field === "khungulultuud" && Array.isArray(parsed)) {
    return (
      <div className="overflow-x-auto my-1">
        <table className="w-full text-[10px] border border-gray-700/30 rounded">
          <thead className="bg-gray-800/30 text-gray-400">
            <tr>
              <th className="p-1 border-b border-gray-700/30 text-center">Огноо</th>
              <th className="p-1 border-b border-gray-700/30 text-center">%</th>
              <th className="p-1 border-b border-gray-700/30 text-right">Дүн</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((item: any, idx) => (
              <tr key={item._id || idx} className="hover:bg-blue-500/5">
                <td className="p-1 border-b border-gray-700/10 text-center text-gray-400">
                  {item.ognoonuud ? `${moment(item.ognoonuud[0]).format("MM-DD")} ~ ${moment(item.ognoonuud[1]).format("MM-DD")}` : "-"}
                </td>
                <td className="p-1 border-b border-gray-700/10 text-center">
                  {item.khungulukhKhuvi}%
                </td>
                <td className="p-1 border-b border-gray-700/10 text-right font-mono text-green-400">
                  {formatNumber(item.khungulultiinDun)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Generic object/array stringification fallback
  if (typeof parsed === "object") {
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return <span className="opacity-50">(хоосон жагсаалт)</span>;
      return (
        <span className="text-[10px] bg-gray-800 px-1 rounded text-blue-400">
          [{parsed.length} мөр]
        </span>
      );
    }
    return <span className="text-[10px] text-gray-500 italic break-all line-clamp-2">{JSON.stringify(parsed)}</span>;
  }

  // Boolean
  if (typeof parsed === "boolean") {
    return parsed ? (
      <span className="text-green-500 font-bold">Тийм</span>
    ) : (
      <span className="text-red-500 font-bold">Үгүй</span>
    );
  }

  // Dates
  if (type === "date" || (typeof parsed === "string" && parsed.match(/^\d{4}-\d{2}-\d{2}/))) {
    return <span>{moment(parsed).format("YYYY-MM-DD")}</span>;
  }

  // Numbers
  if (typeof parsed === "number" || !isNaN(Number(parsed)) && String(parsed).length > 0 && field.toLowerCase().includes("dun") || field.toLowerCase().includes("amount") || field.toLowerCase().includes("zaalt")) {
    return <span className="font-mono">{formatNumber(parsed)}</span>;
  }

  return <span className="break-all">{String(parsed)}</span>;
};

const ZassanMedegdelModal: React.FC<Props> = ({ open, onClose, record }) => {
  useModalHotkeys({ isOpen: open, onClose });

  const normalizedChanges = useMemo(() => {
    if (!record) return [];
    const raw = record.changes || record.uurchlult || [];
    return raw.map((c) => ({
      field: c.field || c.talbar || "unknown",
      label: c.talbarNer || c.field || "unknown",
      oldValue: c.oldValue ?? c.umnukhUtga,
      newValue: c.newValue ?? c.shineUtga,
      type: c.utganiiTurul,
      id: c._id,
    }));
  }, [record]);

  if (!open || !record) return null;

  const modelNames: Record<string, string> = {
    ajiltan: "Ажилтан",
    geree: "Гэрээ",
    barilga: "Барилга",
    talbai: "Талбай",
    orshinSuugch: "Оршин суугч",
    nekhemjlekh: "Нэхэмжлэх",
    nekhemjlekhiinTuukh: "Нэхэмжлэлийн түүх",
    guilgee: "Гүйлгээ",
    Geree: "Гэрээ",
    Talbai: "Талбай",
    Aldangi: "Алданги",
  };

  const fieldLabels: Record<string, string> = {
    ner: "Нэр",
    ovog: "Овог",
    utas: "Утас",
    mail: "Имэйл",
    email: "Имэйл",
    register: "Регистр",
    toot: "Тоот",
    davkhar: "Давхар",
    orts: "Орц",
    bairniiNer: "Барилгын нэр",
    baiguullagiinNer: "Байгууллагын нэр",
    ekhniiUldegdel: "Эхний үлдэгдэл",
    ekhniiUldegdelUsgeer: "Эхний үлдэгдэл (үсгээр)",
    tsahilgaaniiZaalt: "Цахилгаан кВт (анхны)",
    odorZaalt: "Өдрийн заалт",
    shonoZaalt: "Шөнийн заалт",
    suuliinZaalt: "Сүүлийн заалт",
    umnukhZaalt: "Өмнөх заалт",
    tailbar: "Тайлбар",
    createdAt: "Үүсгэсэн огноо",
    updatedAt: "Шинэчилсэн огноо",
    status: "Төлөв",
    tuluv: "Төлөв",
    repliedAt: "Хариулсан огноо",
    repliedBy: "Хариулсан ажилтан",
    taniltsuulgaKharakhEsekh: "Танилцуулга харах эсэх",
    walletUserId: "Wallet ID",
    niitTulburOriginal: "Нийт нэхэмжилсэн",
    soh: "СӨХ",
    globalUldegdel: "Нийт үлдэгдэл",
    sohNer: "СӨХ нэр",
    nevtrekhNer: "Нэвтрэх нэр",
    erkh: "Эрх",
    duureg: "Дүүрэг",
    horoo: "Хороо",
    nuutsUg: "Нууц үг",
    baiguullagiinRegister: "Байгууллагын регистр",
    niitTulbur: "Нийт нэхэмжилсэн",
    tulsunDun: "Нийт төлсөн",
    uldegdel: "Үлдэгдэл",
    uld: "Үлдэгдэл",
    paymentHistory: "Төлөлтийн түүх",
    medeelel: "Нэмэлт мэдээлэл",
    zardluud: "Зардлууд",
    guilgeenuud: "Гүйлгээнүүд",
    segmentuud: "Сегментүүд",
    khungulultuud: "Хөнгөлөлтүүд",
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-6xl bg-[#111111] text-gray-300 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 font-sans animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <span className="text-blue-500 font-bold">i</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Дэлгэрэнгүй Мэдээлэл
              </h3>
              <p className="text-xs text-gray-500">Системийн өөрчлөлтийн түүх үзэх</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-2xl transition-all duration-200 text-gray-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-8 py-5 bg-gradient-to-r from-blue-500/5 to-transparent flex flex-wrap gap-x-12 gap-y-3 text-sm border-b border-gray-800/30">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Төрөл</p>
            <p className="text-white font-medium">
              {modelNames[record.modelName] || record.modelName}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Дугаар</p>
            <p className="text-white font-medium truncate max-w-[120px]">{record.documentId}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Зассан ажилтан</p>
            <p className="text-blue-400 font-medium">{record.ajiltniiNer || "Систем"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Огноо</p>
            <p className="text-white font-medium">
              {moment(record.createdAt || record.ognoo).format("YYYY-MM-DD HH:mm")}
            </p>
          </div>
        </div>

        {/* Changes Table Wrapper */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6">
          <div className="rounded-2xl border border-gray-800 bg-black/20 overflow-hidden shadow-inner">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-[#1A1A1A] text-gray-400 uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="py-4 px-6 text-left w-[20%]">Талбарын нэр</th>
                  <th className="py-4 px-6 text-center w-[40%] bg-red-500/5">Өмнөх утга</th>
                  <th className="py-4 px-6 text-center w-[40%] bg-green-500/5">Шинэ утга</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {normalizedChanges.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-gray-600 italic">
                      Өөрчлөлт олдсонгүй
                    </td>
                  </tr>
                ) : (
                  normalizedChanges.map((change, index) => {
                    const label = fieldLabels[change.field] || change.label;
                    const excludedFields = ["nuutsUg", "password", "token", "__v", "updatedAt"];
                    if (excludedFields.includes(change.field)) return null;

                    return (
                      <tr key={change.id || index} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-400 border-r border-gray-800/50">
                          {label}
                        </td>
                        <td className="py-4 px-6 text-center align-top border-r border-gray-800/50 bg-red-500/[0.01]">
                          <ValueRenderer 
                            field={change.field} 
                            value={change.oldValue} 
                            type={change.type}
                          />
                        </td>
                        <td className="py-4 px-6 text-center align-top bg-green-500/[0.01]">
                          <ValueRenderer 
                            field={change.field} 
                            value={change.newValue} 
                            type={change.type}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-800/50 bg-black/20 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Нийт <span className="text-gray-300 font-bold">{normalizedChanges.length}</span> талбар өөрчлөгдсөн
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white hover:bg-gray-200 text-black font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ZassanMedegdelModal;
