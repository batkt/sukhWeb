"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  Search,
  User,
  Phone,
  MapPin,
  Car,
  Clock,
  Filter,
  MoreHorizontal,
  Plus
} from "lucide-react";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import moment from "moment";
import { toast } from "react-hot-toast";
import ResidentRegistrationModal from "./ResidentRegistrationModal";

const RealTimeClock = () => {
  const [time, setTime] = useState(moment());
  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center text-center hidden md:flex shrink-0">
      <Clock className="w-4 h-4 text-[#4285F4] mb-1.5 opacity-80" />
      <p className="text-[11px] font-black text-slate-800 dark:text-gray-200 leading-none">
        {time.format("YYYY-MM-DD")}
      </p>
      <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mt-1.5 font-bold">
        {time.format("HH:mm:ss")}
      </p>
    </div>
  );
};

  /* Updated interface to match /orshinSuugch response */
interface ResidentParking {
  _id?: string;
  ner?: string;
  orshinSuugchNer?: string;
  ovog?: string;
  utas?: string;
  toot?: string;
  burtgeliinDugaar?: string;
  turul?: string; // Resident/Tenant
  tailbar?: string;
  burtgesenAjiltaniiNer?: string;
  createdAt?: string;
  mashinuud?: Array<{
    ulsiinDugaar: string;
    mark?: string;
  }>;
  
  zochinUrikhEsekh?: boolean;
  zochinTurul?: string;
  davtamjiinTurul?: string;
  mashiniiDugaar?: string;
  dugaarUurchilsunOgnoo?: string;
  ezenToot?: string;
  zochinTailbar?: string;
  zochinErkhiinToo?: number;
  zochinTusBurUneguiMinut?: number;
  zochinNiitUneguiMinut?: number;
}

export default function OrshinSuugch() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const pageSize = 50;

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: residentsData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zochinJagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          searchTerm
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          search: search || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const residents: ResidentParking[] = useMemo(
    () => residentsData?.jagsaalt || [],
    [residentsData]
  );

  const totalPages = Math.ceil(
    (residentsData?.niitMur || 0) / pageSize
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-[#0f172a]/50">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
             {/* Left: Title and Stats */}
             <div className="flex items-center gap-4 shrink-0">
                <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none">
                    Оршин суугч
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {residentsData?.niitMur || 0} Бүртгэлтэй
                  </p>
                </div>
             </div>

             {/* Right: Controls */}
             <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 flex-1 lg:justify-end">
                <div className="relative group w-full sm:w-72 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4285F4] transition-colors" />
                    <input
                      type="text"
                      placeholder="Нэр, утас, дугаар хайх..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px] font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4285F4]/20 transition-all shadow-inner"
                    />
                </div>

                <div className="shrink-0 scale-90 origin-right border-l border-slate-100 dark:border-slate-800 pl-4">
                   <RealTimeClock />
                </div>

                <div className="pl-2 border-l border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => setShowRegistrationModal(true)}
                        className="flex items-center justify-center gap-2 h-11 px-6 rounded-[30px] bg-[#4285F4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Бүртгэх</span>
                    </button>
                </div>
             </div>
          </div>
        </div>

        {showRegistrationModal && (
          <ResidentRegistrationModal 
            onClose={() => setShowRegistrationModal(false)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            baiguullagiinId={ajiltan?.baiguullagiinId}
            onSuccess={() => {
                mutate(); // Refresh the list
            }}
          />
        )}

        {/* Content Table */}
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl flex-1 mt-2">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1200px]">
              <thead className="bg-slate-900 dark:bg-black/40 border-b border-white/5">
                <tr className="whitespace-nowrap">
                   {[
                        { label: "№", width: 'w-12 text-center' },
                        { label: "Бүртгэсэн" },
                        { label: "Нэр" },
                        { label: "Утас" },
                        { label: "Дугаар" },
                        { label: "Төрөл" },
                        { label: "Тайлбар" },
                        { label: "Тоот", align: 'text-right' },
                      ].map((h, idx) => (
                        <th key={idx} className={`py-4 px-4 text-slate-400 uppercase tracking-tighter text-[10px] ${h.width || 'text-left'} ${h.align || ''}`}>
                            {h.label}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {!residentsData && !residents.length ? (
                   <tr>
                    <td colSpan={8} className="px-4 py-20 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Уншиж байна...</p>
                       </div>
                    </td>
                  </tr>
                ) : residents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-12 h-12 opacity-50" />
                        <p>Оршин суугчийн мэдээлэл олдсонгүй</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  residents.map((resident, idx) => (
                    <tr
                      key={resident._id || idx}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group relative"
                    >
                      <td className="py-4 px-3 text-center text-[10px] text-slate-400 font-bold">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {resident.burtgesenAjiltaniiNer || "-"}
                            </span>
                             <span className="text-[9px] text-slate-400">
                                {resident.createdAt ? moment(resident.createdAt).format("YYYY-MM-DD") : ""}
                            </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-700 dark:text-slate-200">
                                {resident.ner || resident.orshinSuugchNer || "Нэр тодорхойгүй"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                                {resident.ovog || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {resident.utas || "-"}
                        </div>
                      </td>
                       <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-2">
                          {resident.mashiniiDugaar ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                                <Car className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-blue-200">
                                  {resident.mashiniiDugaar}
                                </span>
                              </div>
                          ) : (
                                <span className="text-[10px] text-slate-400 italic">Машин бүртгэлгүй</span>
                          )}
                        </div>
                      </td>
                       <td className="py-4 px-4">
                         <div className="flex flex-col gap-1.5">
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
                              {resident.zochinTurul || resident.turul || "-"}
                            </span>
                            {resident.zochinErkhiinToo !== undefined && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 w-fit">
                                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                        Хэрэглэсэн {(resident.mashinuud?.length || 0) + (residentsData?.ezenList?.filter((e: any) => e.ezemshigchiinId === resident._id)?.length || 0)}/{resident.zochinErkhiinToo}
                                    </span>
                                </div>
                            )}
                         </div>
                      </td>
                       <td className="py-4 px-4">
                         <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate">
                           {resident.zochinTailbar || resident.tailbar || "-"}
                         </p>
                      </td>
                      <td className="py-4 px-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              {resident.toot ? `${resident.toot} тоот` : "-"}
                            </span>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - Reuse style */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-8 mt-auto">
             <button
               onClick={() => setPage((p) => Math.max(1, p - 1))}
               disabled={page === 1}
               className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
             >
               Өмнөх
             </button>
             <div className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-tighter">
                  {page} <span className="text-slate-300 dark:text-slate-600 mx-1">/</span> {totalPages}
                </span>
             </div>
             <button
               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
               disabled={page >= totalPages}
               className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
             >
               Дараах
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
