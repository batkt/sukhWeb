"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, X, User, BarChart2, Users, Key, Monitor, Filter } from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { StandardPagination } from "@/components/ui/StandardTable";

interface GateOpenLog {
  _id: string;
  ip: string;
  barilgiinId: string;
  baiguullagiinId: string;
  orshinSuugchiinId: string;
  orshinSuugchiinNer: string;
  toot: string;
  utas: string;
  mashiniiDugaar: string;
  turul?: "нээсэн" | "урьсан";
  ezenNer?: string;
  ezenToot?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserHistoryModalProps {
  log: GateOpenLog;
  onClose: () => void;
  token: string;
  baiguullagiinId: string;
  getBuildingName: (bId: string) => string;
}

function UserHistoryModal({
  log,
  onClose,
  token,
  baiguullagiinId,
  getBuildingName,
}: UserHistoryModalProps) {
  const searchValue = log.utas || log.orshinSuugchiinNer || log.mashiniiDugaar || "";

  const { data: historyData, isValidating } = useSWR(
    token && baiguullagiinId && searchValue
      ? ["/khaalgaNeeyeTuukh/history", token, baiguullagiinId, searchValue]
      : null,
    async ([url, tkn, bId, search]): Promise<any> => {
      const resp = await uilchilgee(tkn).get("/khaalgaNeeyeTuukh", {
        params: {
          baiguullagiinId: bId,
          khuudasniiKhemjee: 50,
          searchUtga: search,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const historyLogs: GateOpenLog[] = useMemo(
    () => historyData?.jagsaalt || [],
    [historyData]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[650px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06] flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 opacity-80" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.06]">
                <User className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">
                  {log.orshinSuugchiinNer || "Хэрэглэгч"}-ийн түүх
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Тоот: {log.toot || "-"} | Утас: {log.utas || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Logs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isValidating && historyLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mb-2" />
              Түүхийг уншиж байна...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              Хэрэглэгчийн түүх олдсонгүй.
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-white/[0.05] rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 dark:bg-white/[0.04] text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4 text-center">№</th>
                    <th className="py-2.5 px-4 text-left">Огноо</th>
                    <th className="py-2.5 px-4 text-center">Төлөв</th>
                    <th className="py-2.5 px-4 text-center">Улсын дугаар</th>
                    <th className="py-2.5 px-4 text-center">Камер IP</th>
                    <th className="py-2.5 px-4 text-left">Барилга</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {historyLogs.map((hLog, idx) => {
                    const isUrisan = hLog.turul === "урьсан";
                    return (
                      <tr key={hLog._id} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {moment(hLog.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isUrisan ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                              Урьсан
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[9px] font-semibold text-blue-700 dark:text-blue-300">
                              Нээсэн
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {hLog.mashiniiDugaar ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold !text-white tracking-widest font-[family-name:var(--font-mono)]">
                              {hLog.mashiniiDugaar}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">
                          {hLog.ip || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-left text-slate-500 dark:text-slate-400 text-[11px]">
                          {getBuildingName(hLog.barilgiinId)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-6 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-[12px] font-medium text-slate-600 dark:text-slate-300 transition-colors"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UrisanTuukh() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [selectedLog, setSelectedLog] = useState<GateOpenLog | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | null | undefined
  >(getDefaultDateRange);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (dateRange === null) return { start: "", end: "" };
    const range = dateRange || getDefaultDateRange();
    return {
      start: range[0] || "",
      end: range[1] || "",
    };
  }, [dateRange]);

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: logsData } = useSWR(
    shouldFetch
      ? [
          "/khaalgaNeeyeTuukh",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          page,
          searchTerm,
          rangeStart,
          rangeEnd,
          statusFilter,
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search, start, end, status]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          start: start || undefined,
          end: end || undefined,
          searchUtga: search || undefined,
          turul: status || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const logs: GateOpenLog[] = useMemo(
    () => logsData?.jagsaalt || [],
    [logsData],
  );
  const totalCount = logsData?.niitMur || 0;

  const { data: statsData } = useSWR(
    shouldFetch
      ? [
          "/khaalgaNeeyeTuukh/stats",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          start: start || undefined,
          end: end || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const counts = useMemo(
    () => statsData?.counts || { total: 0, urisan: 0, neesen: 0 },
    [statsData]
  );
  const topResidents = useMemo(
    () => statsData?.topResidents || [],
    [statsData]
  );
  const topGates = useMemo(
    () => statsData?.topGates || [],
    [statsData]
  );
  const dailyActivity = useMemo(
    () => statsData?.dailyActivity || [],
    [statsData]
  );

  const { baiguullaga } = useAuth();
  const getBuildingName = (bId: string) => {
    if (!bId) return "-";
    const building = baiguullaga?.barilguud?.find((b: any) => b._id === bId);
    return building?.ner || bId;
  };

  const HEADERS = [
    { id: "no", label: "№", width: "w-12" },
    { id: "ognoo", label: "Огноо" },
    {
      id: "status",
      label: "Төлөв",
      filter: true,
      current: statusFilter,
      set: setStatusFilter,
      options: [
        { label: "Бүгд", value: "all" },
        { label: "Урьсан", value: "urisan" },
        { label: "Нээсэн", value: "neesen" },
      ],
    },
    { id: "ip", label: "Камер IP" },
    { id: "suugch", label: "Оршин суугч" },
    { id: "toot", label: "Тоот" },
    { id: "utas", label: "Утас" },
    { id: "dugaar", label: "Улсын дугаар" },
    { id: "barilga", label: "Барилга" },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1700px] mx-auto w-full pb-8">
        {/* Filter bar */}
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-11 [&_.ant-picker-input]:!bg-transparent [&_input]:!bg-transparent [&_.ant-picker-input-active]:!bg-transparent dark:[&_.ant-picker-suffix]:!text-white dark:[&_.ant-picker-suffix_svg]:!fill-white dark:[&_.ant-picker:hover]:!bg-slate-700 dark:[&_.ant-picker-focused]:!bg-slate-700 [&_.ant-picker-range-separator]:!text-slate-400 dark:[&_.ant-picker-range-separator]:!text-slate-400">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(_: any, dateString: [string, string]) => {
                    setDateRange(dateString);
                    setPage(1);
                  }}
                  format="YYYY-MM-DD"
                  className="w-full !bg-white dark:!bg-slate-700 hover:!bg-white dark:hover:!bg-slate-700 !border-slate-200 dark:!border-slate-500 hover:!border-slate-300 dark:hover:!border-slate-500 shadow-sm"
                  classNames={{
                    input: "!bg-transparent !border-0 !shadow-none text-[11px] !text-slate-700 dark:!text-slate-100 px-2",
                  }}
                  allowClear
                />
              </div>
            </div>

            <div className="relative group w-full xl:w-80 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Хайх (Оршин суугч, Тоот, Утас, Улсын дугаар, IP)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {statusFilter !== "all" && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Шүүлт:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] rounded-full border border-violet-200 dark:border-violet-500/20">
                Төлөв: {
                  { urisan: "Урьсан", neesen: "Нээсэн" }[statusFilter] || statusFilter
                }
                <button
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className="ml-0.5 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Dashboard Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Нийт хандалт</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{counts.total}</p>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Урьсан</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{counts.urisan}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500 dark:text-sky-400">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Нээсэн</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{counts.neesen}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider">Идэвхтэй камер</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{topGates.length}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Table */}
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-950 border-b border-white/5 text-slate-300">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h.id}
                      className={`group relative py-3.5 px-4 text-center text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${h.width || ""}`}
                    >
                      <div
                        className="flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (!h.filter) return;
                          setOpenFilter(openFilter === h.id ? null : h.id);
                        }}
                      >
                        {h.filter && (
                          <Filter className={`w-3 h-3 transition-colors ${h.current !== "all" && h.current !== undefined
                            ? "text-blue-400"
                            : "text-slate-500 group-hover:text-blue-400"
                            }`} />
                        )}
                        <span>{h.label}</span>
                      </div>

                      {h.options && (
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/98 backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 transition-all duration-300 z-[100] border border-white/5 overflow-hidden ring-1 ring-white/10 ${openFilter === h.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"}`}
                        >
                          <div className="relative flex flex-col gap-1 z-10">
                            <div className="px-3 py-1.5 mb-1 text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/5 normal-case font-semibold">
                              Сонгох
                            </div>
                            {h.options.map((opt, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  h.set?.(opt.value);
                                  setPage(1);
                                  setOpenFilter(null);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 normal-case font-normal ${h.current === opt.value
                                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                                  : "hover:bg-white/10 text-slate-300 hover:text-white"
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
              <tbody className="text-slate-600 dark:text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm"
                    >
                      Бүртгэл олдсонгүй.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer ${
                        idx % 2 === 0
                          ? "bg-slate-100 dark:bg-slate-800/40"
                          : "bg-white dark:bg-transparent"
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-xs text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-medium font-[family-name:var(--font-mono)]">
                        {moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.turul === "урьсан" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            Урьсан
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            Нээсэн
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                        {log.ip || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {log.orshinSuugchiinNer
                          ? log.orshinSuugchiinNer.trim().split(/\s+/).pop()
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs">
                        {log.toot || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                        {log.utas || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs">
                        {log.mashiniiDugaar ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold !text-white tracking-widest font-[family-name:var(--font-mono)]">
                            {log.mashiniiDugaar}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                        {getBuildingName(log.barilgiinId)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <StandardPagination
            current={page}
            total={totalCount}
            pageSize={pageSize}
            onChange={setPage}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && token && ajiltan?.baiguullagiinId && (
        <UserHistoryModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          token={token}
          baiguullagiinId={ajiltan.baiguullagiinId}
          getBuildingName={getBuildingName}
        />
      )}
    </div>
  );
}
