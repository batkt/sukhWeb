"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, X, User } from "lucide-react";
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
        ]
      : null,
    async ([url, tkn, bId, barId, pg, search, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          start: start || undefined,
          end: end || undefined,
          searchUtga: search || undefined,
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

  const { baiguullaga } = useAuth();
  const getBuildingName = (bId: string) => {
    if (!bId) return "-";
    const building = baiguullaga?.barilguud?.find((b: any) => b._id === bId);
    return building?.ner || bId;
  };

  const HEADERS = ["№", "Огноо", "Төлөв", "Камер IP", "Оршин суугч", "Тоот", "Утас", "Улсын дугаар", "Барилга"];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1700px] mx-auto w-full h-full overflow-hidden">
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
        </div>

        {/* Table */}
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-950 border-b border-white/5 text-slate-300">
                <tr>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      className="py-3.5 px-4 text-center text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
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
