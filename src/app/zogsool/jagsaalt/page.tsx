"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Car,
  Copy,
  Clock,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Info,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import { toast } from "react-hot-toast";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";

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
      <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] mt-1.5 ">
        {time.format("HH:mm:ss")}
      </p>
    </div>
  );
};

const RealTimeDuration = ({ orsonTsag, garsanTsag }: { orsonTsag?: string; garsanTsag?: string }) => {
  const [now, setNow] = useState(moment());
  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);
  if (!orsonTsag) return <span>00 : 00 : 00</span>;
  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));
  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();
  if (!garsanTsag) {
     return (
        <span className="text-[11px]  font-mono text-slate-800">
           {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} : {String(seconds).padStart(2, "0")}
        </span>
     );
  }
  return (
    <span className="text-[10px]  uppercase tracking-wide text-slate-800">
      {hours > 0 ? `${hours} цаг ${minutes} мин` : `${minutes} мин`}
    </span>
  );
};

interface Vehicle {
  _id?: string;
  mashiniiDugaar: string;
  niitDun?: number;
  zurchil?: string;
  turul?: string; // Type
  tuukh?: Array<{
    tsagiinTuukh?: Array<{
      orsonTsag?: string;
      garsanTsag?: string;
    }>;
    turul?: string;
    khungulult?: string;
    tulsunDun?: number;
    ebarimtId?: string;
    tuluv?: number;
    garsanKhaalga?: string;
    burtgesenAjiltaniiNer?: string;
    tulbur?: Array<{
      turul?: string;
      dun?: number;
    }>;
  }>;
}

export default function Jagsaalt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 1000;
  
  const [durationFilter, setDurationFilter] = useState("latest_out");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа");
  };

  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => toISODate(today), [today]);
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  }, [today]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([defaultStart, defaultEnd]);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const end = (dateRange?.[1] as string) || defaultEnd;
    const start = (dateRange?.[0] as string) || defaultStart;
    return { start, end };
  }, [dateRange, defaultEnd, defaultStart]);

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: vehiclesData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zogsoolUilchluulegchJagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          searchTerm,
          rangeStart,
          rangeEnd,
          durationFilter,
          typeFilter,
          statusFilter
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search, start, end, dur, type, status]): Promise<any> => {
      // Build query similar to fetchList in camera page
      const query: any = {
        baiguullagiinId: bId,
        barilgiinId: barId || undefined,
        createdAt: {
          $gte: `${start} 00:00:00`,
          $lte: `${end} 23:59:59`
        }
      };

      if (search) {
        query.mashiniiDugaar = { $regex: search, $options: "i" };
      }

      if (type !== 'all') {
        query.turul = 'Үйлчлүүлэгч';
      }

      if (status === 'active') {
        query["tuukh.tuluv"] = { $in: [0, -2] };
        query["tuukh.garsanKhaalga"] = { $exists: false };
      } else if (status === 'paid') {
        query["tuukh.tuluv"] = { $in: [1, 2] };
      } else if (status === 'unpaid') {
        query["tuukh.tuluv"] = { $in: [0, -4] };
        query.niitDun = { $gt: 0 };
      } else if (status === 'free') {
        query.niitDun = 0;
        query["tuukh.tuluv"] = { $nin: [0, -2] };
      }

      const sortObj = dur === 'longest' 
        ? { "tuukh.0.niitKhugatsaa": -1 }
        : (dur === 'latest_in' 
            ? { 
                "tuukh.tsagiinTuukh.garsanTsag": 1,
                niitDun: 1,
                "tuukh.tuluv": 1,
                "tuukh.tsagiinTuukh.orsonTsag": -1,
                zurchil: 1,
              } 
            : { "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 });

      const resp = await uilchilgee(tkn).get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          query: JSON.stringify(query),
          order: JSON.stringify(sortObj),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const vehicles: Vehicle[] = useMemo(
    () => vehiclesData?.jagsaalt || [],
    [vehiclesData]
  );

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.mashiniiDugaar?.toLowerCase().includes(term) ||
        v.zurchil?.toLowerCase().includes(term) ||
        v.tuukh?.[0]?.burtgesenAjiltaniiNer?.toLowerCase().includes(term)
    );
  }, [vehicles, searchTerm]);

  const totalPages = Math.ceil(
    (vehiclesData?.niitMur || 0) / pageSize
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-full flex flex-col gap-6">
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-var(--color-bg-primary) border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
             {/* Left: Title and Stats */}
             <div className="flex items-center gap-4 shrink-0">
                <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none">
                    Зогсоолын жагсаалт
                  </h1>
                  <p className="text-[9px]  text-slate-400 uppercase tracking-widest mt-1">
                    {vehiclesData?.niitMur || 0} Машин бүртгэгдсэн
                  </p>
                </div>
             </div>

             {/* Right: Integrated Controls Row */}
             <div className="flex   gap-4 flex-1 lg:justify-between">
                <div className="relative group w-full sm:w-72 max-w-sm">
                    <input
                      type="text"
                      placeholder="Улсын дугаар хайх..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px]  text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4285F4]/20 transition-all shadow-inner"
                    />
                </div>

                <div className="w-[100px] sm:w-90 lg:w-[600px]">
                    <DatePickerInput
                      type="range"
                      value={dateRange}
                      onChange={(v: any) => {
                        setDateRange(v);
                        setPage(1);
                      }}
                      valueFormat="YYYY-MM-DD"
                      
                      className="w-full"
                      classNames={{ input: "h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0  text-[11px] text-slate-700 dark:text-slate-200 shadow-inner px-6" }}
                    />
                </div>

                {/* Clock */}
                <div className="shrink-0 scale-90 origin-right border-l border-slate-100 dark:border-slate-800 pl-4">
                   <RealTimeClock />
                </div>
             </div>
          </div>
        </div>
        <div className="relative overflow-y-auto custom-scrollbar max-h-[65vh] rounded-[32px] border border-slate-200 dark:border-slate-800 bg-var(--color-bg-primary) backdrop-blur-xl shadow-2xl flex-1 mt-2">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1300px]">
              <thead className="bg-slate-900 dark:bg-black/40 border-b border-white/5">
                <tr className="overflow-x-auto whitespace-nowrap">
                   {[
                        { id: 'no', label: "№", width: 'w-12' },
                        { id: 'orson', label: "Орсон" },
                        { id: 'garsan', label: "Гарсан" },
                        { id: 'type', label: "Төрөл", filter: true, current: typeFilter, set: setTypeFilter, options: [{ label: "Бүгд", value: "all" }, { label: "Төлбөртэй", value: "client" }] },
                        { id: 'dugaar', label: "Дугааp" },
                        { id: 'duration', label: "Хугацаа/мин", filter: true, current: durationFilter, set: setDurationFilter, options: [{ label: "Удаан зогссон эхэнд", value: "longest" }, { label: "Сүүлд орсон эхэнд", value: "latest_in" }, { label: "Сүүлд гарсан эхэнд", value: "latest_out" }] },
                        { id: 'calc', label: "Бодогдсон" },
                        { id: 'payment', label: "Төлбөр" },
                        { id: 'status', label: "Төлөв", filter: true, current: statusFilter, set: setStatusFilter, options: [{ label: "Бүгд", value: "all" }, { label: "Идэвхтэй", value: "active" }, { label: "Төлсөн", value: "paid" }, { label: "Төлөөгүй", value: "unpaid" }, { label: "Үнэгүй", value: "free" }] },
                        { id: 'reason', label: "Шалтгаан" },
                        { id: 'staff', label: "Бүртгэсэн" },
                        { id: 'discount', label: "Хөнгөлөлт" },
                        { id: 'ebarimt', label: "И-Баримт" },
                      ].map((h) => (
                        <th key={h.id} className={`group relative py-4 px-4 text-slate-400 uppercase tracking-tighter text-[10px] text-center ${h.width || ''}`}>
                            <div 
                              className={`flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors ${h.width ? '' : 'w-full'}`}
                              onClick={() => { if (!h.filter) return; }}
                            >
                               {h.filter && <Filter className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />}
                               {h.label}
                            </div>
                            
                            {h.options && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/98 backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] border border-white/5 translate-y-3 group-hover:translate-y-0 overflow-hidden ring-1 ring-white/10">
                                 <div className="relative flex flex-col gap-1 z-10">
                                   <div className="px-3 py-1.5 mb-1 text-[9px]  text-slate-500 uppercase tracking-widest border-b border-white/5">
                                      Сонгох
                                   </div>
                                   {h.options.map((opt, idx) => (
                                     <div 
                                       key={idx} 
                                       onClick={() => { h.set?.(opt.value); setPage(1); }}
                                       className={`px-4 py-2.5 rounded-xl text-[10px] font-black text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${
                                          h.current === opt.value 
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' 
                                            : 'hover:bg-white/10 text-slate-300 hover:text-white'
                                       }`}
                                     >
                                       <span>{opt.label}</span>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                            )}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Car className="w-12 h-12 opacity-50" />
                        <p>Машины мэдээлэл олдсонгүй</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((transaction, idx) => {
                    const mur = transaction.tuukh?.[0];
                    const tsag = mur?.tsagiinTuukh?.[0];
                    const orsonTsag = tsag?.orsonTsag;
                    const garsanTsag = tsag?.garsanTsag;
                    const tuluv = mur?.tuluv;
                    const niitDun = transaction.niitDun || 0;
                    const isCurrentlyIn = !mur?.garsanKhaalga;

                      return (
                        <tr
                          key={transaction._id || idx}
                          className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group relative"
                        >
                          <td className="py-4 px-3 text-center text-[10px] text-slate-400 ">
                            {isCurrentlyIn && (
                              <div className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap text-center">
                            <div className="flex flex-col">
                              <span className="text-[11px]  text-slate-700 dark:text-slate-300">
                                {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap text-center">
                            <span className="text-[11px]  text-slate-500 dark:text-slate-400">
                              {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : "-"}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-center">
                             <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px]  text-slate-500 uppercase tracking-tighter">
                                {transaction.turul || mur?.turul || "Үйлчлүүлэгч"}
                             </span>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-2 group/copy">
                               <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">{transaction.mashiniiDugaar || "-"}</span>
                               <Copy 
                                 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-all opacity-0 group-hover/copy:opacity-100 scale-90 group-hover/copy:scale-100" 
                                 onClick={() => copyToClipboard(transaction.mashiniiDugaar)}
                               />
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className={`px-2.5 py-1.5 rounded-2xl text-center w-[130px] inline-block whitespace-nowrap border-2 transition-all ${
                              !garsanTsag 
                                ? "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-200 shadow-sm" 
                                : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/30 dark:border-slate-800/50 dark:text-slate-400"
                            }`}>
                              <RealTimeDuration orsonTsag={orsonTsag} garsanTsag={garsanTsag} />
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                             <span className="text-xs font-black text-slate-900 dark:text-white">
                               {formatNumber(niitDun)}₮
                             </span>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                               {(() => {
                                  const tulsunDun = mur?.tulsunDun || 0;
                                  const payHistory = mur?.tulbur?.[0];
                                  const method = payHistory?.turul;
                                  const labels: any = { cash: "Бэлэн", khaan: "Хаан", qpay: "QPay", transfer: "Дансаар", discount: "Хөнгөлөлт" };
                                  if (tulsunDun > 0) return (
                                    <>
                                       <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{formatNumber(tulsunDun)}₮</span>
                                       <span className="text-[9px]  text-slate-400 uppercase tracking-widest">{(method && labels[method]) || "Төлсөн"}</span>
                                    </>
                                  );
                                  return <span className="text-[11px]  text-slate-300">0.00₮</span>;
                               })()}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                             {(() => {
                                if (tuluv === 1) return (
                                  <div className="flex items-center justify-center">
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase border border-emerald-200 dark:border-emerald-800/50">Төлсөн</span>
                                  </div>
                                );
                                if (isCurrentlyIn) return (
                                  <div className="flex items-center justify-center">
                                    <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase border border-blue-200 dark:border-blue-800/50">Зогсож буй</span>
                                  </div>
                                );
                                if (tuluv === -4 || (niitDun > 0 && !isCurrentlyIn)) return (
                                  <div className="flex items-center justify-center">
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase border border-amber-200 dark:border-amber-800/50">Төлбөртэй</span>
                                  </div>
                                );
                                return (
                                  <div className="flex items-center justify-center">
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase border border-slate-200 dark:border-slate-800/50">Гарсан</span>
                                  </div>
                                );
                             })()}
                          </td>
                          <td className="py-4 px-3 max-w-[150px]">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate group-hover:whitespace-normal  text-center">
                              {transaction.zurchil || (!isCurrentlyIn && !garsanTsag ? "Гарсан цаг тодорхойгүй!" : "-")}
                            </p>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col">
                              <span className="text-[11px]  text-slate-600 dark:text-slate-400">{mur?.burtgesenAjiltaniiNer || "-"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-[11px]  text-slate-500 text-center">
                            {mur?.khungulult || "-"}
                          </td>
                          <td className="py-4 px-3 text-[11px]  text-slate-500 text-center">
                            {mur?.ebarimtId || "-"}
                          </td>
                        </tr>
                      );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-8 mt-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all  text-xs uppercase tracking-widest shadow-sm"
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
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all  text-xs uppercase tracking-widest shadow-sm"
            >
              Дараах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
