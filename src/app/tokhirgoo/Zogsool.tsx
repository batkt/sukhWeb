import React, { useState, useRef, useEffect, useMemo } from "react";
import moment from "moment";
import { Plus, Edit, Trash2, Smartphone, DoorOpen, Car, ChevronRight } from "lucide-react";
import { Modal as MModal, Button as MButton } from "@mantine/core";
import ZogsoolBurtgekh from "./ZogsoolBurtgekh";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

interface ZogsoolItem {
  _id?: string;
  key?: number;
  ner: string;
  ajiltniiNer?: string;
  khaalga?: any[];
  too: number;
  undsenUne: number | string;
  ognoo?: Date | string;
  createdAt?: string;
}

interface SmsItem {
  _id?: string;
  key?: number;
  createdAt: Date | string;
  dugaar: string[];
  msg: string;
}

interface ZogsoolProps {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
}

export default function Zogsool({
  ajiltan,
  baiguullaga,
  token: propToken,
  setSongogdsonTsonkhniiIndex,
}: ZogsoolProps) {
  const { token: authToken, barilgiinId, ajiltan: authAjiltan } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const token = propToken || authToken || "";
  
  const effectiveAjiltan = ajiltan || authAjiltan;
  const effectiveBaiguullagiinId = effectiveAjiltan?.baiguullagiinId;
  
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [editingItem, setEditingItem] = useState<ZogsoolItem | null>(null);
  const zogsoolRef = useRef<any>(null);

  const shouldFetch = !!token && !!effectiveBaiguullagiinId;

  const { data: zogsoolDataResponse, mutate: mutateZogsool, isValidating } = useSWR(
    shouldFetch
      ? [
          "/parking",
          token,
          effectiveBaiguullagiinId,
          effectiveBarilgiinId,
          page,
        ]
      : null,
    async ([url, tkn, bId, barId, p]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: p,
          khuudasniiKhemjee: pageSize,
        },
      });
      
      const data = resp.data;
      if (Array.isArray(data)) {
        return {
          jagsaalt: data,
          niitMur: data.length,
          niitKhuudas: Math.ceil(data.length / pageSize),
        };
      }
      return data;
    },
    { revalidateOnFocus: false }
  );

  const zogsoolData: ZogsoolItem[] = useMemo(() => {
    const data = zogsoolDataResponse;
    if (!data) return [];
    if (Array.isArray(data?.jagsaalt)) return data.jagsaalt;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.data?.jagsaalt)) return data.data.jagsaalt;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [zogsoolDataResponse]);

  const { data: smsDataResponse } = useSWR(
    shouldFetch
      ? ["/parking/sms", token, effectiveBaiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const smsData: SmsItem[] = smsDataResponse?.jagsaalt || [];

  const deleteZogsool = async (id: string) => {
    if (!confirm("Устгахдаа итгэлтэй байна уу?")) return;
    try {
      await uilchilgee(token).delete(`/parking/${id}`);
      openSuccessOverlay("Амжилттай устгалаа");
      mutateZogsool();
    } catch (error: any) {
      openErrorOverlay(error?.message || "Алдаа гарлаа");
    }
  };

  const refreshZogsool = () => {
    mutateZogsool();
  };

  const totalPages = Math.ceil(
    (zogsoolDataResponse?.niitMur || 
     zogsoolDataResponse?.niitKhuudas || 
     zogsoolDataResponse?.total || 
     zogsoolData?.length || 0) / pageSize
  );

  const [view, setView] = useState<"list" | "form">("list");

  const openAdd = () => {
    setEditingItem(null);
    setView("form");
  };

  const openEdit = (item: ZogsoolItem) => {
    setEditingItem(item);
    setView("form");
  };

  const handleCloseForm = () => {
    setView("list");
    setEditingItem(null);
  };

  const formatNumber = (num: any, decimals = 0) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) return "0";
    return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  if (view === "form") {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto max-h-[calc(100vh-220px)] custom-scrollbar pr-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-black/20 p-4 rounded-3xl border border-[color:var(--surface-border)] backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCloseForm}
              className="p-3 bg-white dark:bg-gray-900 border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-theme" />
            </button>
            <div>
              <h2 className="text-xl font-black text-[color:var(--panel-text)] uppercase tracking-tight leading-none">
                {editingItem ? "Зогсоол засах" : "Шинэ зогсоол бүртгэх"}
              </h2>
              <p className="text-xs font-bold text-[color:var(--muted-text)] mt-1.5 opacity-70">
                {editingItem ? `ID: ${editingItem._id || editingItem.key}` : "Системд шинэ зогсоолын талбай үүсгэх"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <MButton
              onClick={handleCloseForm}
              variant="subtle"
              className="px-8 h-12 text-slate-500 font-bold hover:bg-slate-100/50 rounded-2xl transition-all"
            >
              Болих
            </MButton>
            <MButton
              loading={isValidating}
              onClick={() => zogsoolRef.current?.khadgalya()}
              className="btn-save shadow-xl shadow-blue-500/20 rounded-2xl px-14 h-12 font-black uppercase tracking-widest text-xs"
            >
              Хадгалах
            </MButton>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-black/10 rounded-3xl p-3 border border-[color:var(--surface-border)] shadow-inner">
           <ZogsoolBurtgekh
            ref={zogsoolRef}
            data={editingItem}
            jagsaalt={zogsoolData}
            barilgiinId={effectiveBarilgiinId || barilgiinId || undefined}
            token={token || ""}
            refresh={refreshZogsool}
            onClose={handleCloseForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-auto max-h-[calc(100vh-220px)] custom-scrollbar pr-2">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-tr from-theme to-indigo-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative p-3 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-theme/10 text-theme">
                <Car className="w-6 h-6" />
             </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[color:var(--panel-text)] tracking-tighter uppercase leading-none">Зогсоолын тохиргоо</h1>
            <p className="text-[10px] font-bold text-[color:var(--muted-text)] mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Нийт {zogsoolDataResponse?.niitMur || 0} талбай тохируулагдсан байна
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="btn-save group flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-xl shadow-blue-500/30 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-98"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" /> Шинэ зогсоол нэмэх
        </button>
      </div>

      {/* Main Table Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--surface-border)] bg-white/40 backdrop-blur-md shadow-xl dark:bg-black/20">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-ui w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[color:var(--surface-hover)]/50 border-b border-[color:var(--surface-border)]">
                {["№", "Зогсоолын нэр", "Багтаамж", "Тариф", "Хаалганууд", "Үйлдэл"].map((col, i) => (
                  <th key={col} className={`py-4 px-4 font-black text-[color:var(--panel-text)] uppercase tracking-widest text-[9px] opacity-60 ${i === 0 ? 'text-center w-16' : 'text-left'}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--surface-border)]/50">
              {isValidating ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-12 h-12">
                         <div className="absolute inset-0 border-4 border-theme/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-theme border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="text-xs font-black text-theme uppercase tracking-[0.3em] animate-pulse">Цөөн хором...</span>
                    </div>
                  </td>
                </tr>
              ) : zogsoolData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 rounded-full bg-slate-100 dark:bg-white/5 text-slate-300">
                         <DoorOpen className="w-16 h-16" />
                      </div>
                      <div className="space-y-1">
                         <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-400">Мэдээлэл олдсонгүй</p>
                         <p className="text-xs font-bold text-slate-300">ТА "ШИНЭ ЗОГСООЛ" ТОВЧИЙГ ДАРЖ БҮРТГЭНЭ ҮҮ</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                zogsoolData.map((record, idx) => (
                  <tr 
                    key={record._id || record.key || idx}
                    className="group hover:bg-theme/5 transition-all duration-300 cursor-default"
                  >
                    <td className="py-6 px-6 text-center font-mono text-[10px] font-black text-slate-400">
                      {((page - 1) * pageSize + idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="py-6 px-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-slate-400 text-xs transition-colors group-hover:bg-theme group-hover:text-white">
                             {record.ner?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-black text-[color:var(--panel-text)] text-base tracking-tight">{record.ner}</span>
                       </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <span className="text-xl font-black">{record.too}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">cars</span>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                       <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-sm">
                          {formatNumber(record.undsenUne)} <span className="text-[10px] opacity-60">₮</span>
                       </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex flex-wrap gap-2">
                        {record.khaalga && record.khaalga.length > 0 ? record.khaalga.map((gate: any, gateIdx: number) => (
                          <span key={gateIdx} className="inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white dark:bg-black/40 text-slate-500 border border-slate-200/50 dark:border-gray-800 shadow-sm transition-all hover:border-theme/50 hover:text-theme">
                            {gate.ner}
                          </span>
                        )) : (
                          <span className="text-[10px] font-bold text-slate-300 italic">Тохируулаагүй</span>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(record)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-theme/10 text-theme hover:bg-theme hover:text-white transition-all shadow-sm hover:shadow-theme/20 hover:scale-110 active:scale-90"
                          title="Засах"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {record._id && (
                          <button
                            onClick={() => deleteZogsool(record._id!)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/20 hover:scale-110 active:scale-90"
                            title="Устгах"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & SMS Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-12">
         {/* SMS Logs */}
         <div className="xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] pb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                     <Smartphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-black text-[color:var(--panel-text)] uppercase tracking-tighter">СМС Түүх / Сүүлийн 5/</h2>
               </div>
            </div>
            
            <div className="table-surface overflow-hidden rounded-[2rem] border border-[color:var(--surface-border)] bg-white/30 backdrop-blur-sm">
               <table className="table-ui w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-white/5">
                  <tr className="border-b border-[color:var(--surface-border)]">
                     {["Огноо", "Хүлээн авагч", "Мессеж"].map((col) => (
                        <th key={col} className="py-4 px-6 font-black text-[color:var(--panel-text)] text-left uppercase tracking-widest text-[9px] opacity-50">
                           {col}
                        </th>
                     ))}
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--surface-border)]/50">
                  {smsData.length === 0 ? (
                     <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest italic tracking-wider">Хоосон байна</td>
                     </tr>
                  ) : (
                     smsData.slice(0, 5).map((record, idx) => (
                        <tr key={record._id || record.key || idx} className="hover:bg-white/40 transition-colors">
                           <td className="py-4 px-6 font-bold text-slate-500">
                              {moment(record.createdAt).format("MM/DD, HH:mm")}
                           </td>
                           <td className="py-4 px-6">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 px-3 py-1 rounded-lg">
                                 {record.dugaar ? record.dugaar[0] : "-"}
                              </span>
                           </td>
                           <td className="py-4 px-6 text-[color:var(--muted-text)] font-medium max-w-[300px] truncate">{record.msg}</td>
                        </tr>
                     ))
                  )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Pagination Controls */}
         <div className="xl:col-span-4 flex flex-col justify-end">
            {totalPages > 1 && (
               <div className="flex items-center justify-center gap-3 bg-[color:var(--surface-hover)]/30 backdrop-blur-md p-6 rounded-[2rem] border border-[color:var(--surface-border)]">
                  <button
                     disabled={page === 1}
                     onClick={() => setPage((p) => Math.max(1, p - 1))}
                     className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 border border-[color:var(--surface-border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-theme hover:text-white transition-all shadow-md group"
                  >
                     <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                  <div className="px-8 py-3 font-black text-sm bg-theme text-white rounded-2xl shadow-xl shadow-theme/30 ring-4 ring-theme/10">
                     {page} <span className="opacity-50 mx-1">/</span> {totalPages}
                  </div>
                  <button
                     disabled={page >= totalPages}
                     onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                     className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 border border-[color:var(--surface-border)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-theme hover:text-white transition-all shadow-md"
                  >
                     <ChevronRight className="w-5 h-5" />
                  </button>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
