"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, Calendar, RefreshCw, KeyRound } from "lucide-react";
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
  createdAt: string;
  updatedAt: string;
}

export default function UrisanTuukh() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  const {
    data: logsData,
    mutate,
    isValidating,
  } = useSWR(
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-full flex flex-col gap-6">
        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Урьсан түүх
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Гараар хаалга нээсэн түүхэн бүртгэл
              </p>
            </div>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all ${
              isValidating ? "animate-spin text-blue-500" : ""
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-var(--color-bg-primary) border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Date picker */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-full md:w-[280px] h-11">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(v: any) => {
                    setDateRange(v ?? null);
                    setPage(1);
                  }}
                  format="YYYY-MM-DD"
                  className="w-full"
                  classNames={{
                    input:
                      "h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px] text-slate-700 dark:text-slate-200 shadow-inner px-6",
                  }}
                  allowClear
                />
              </div>
            </div>

            {/* Right: Search */}
            <div className="relative group w-full md:w-80 max-w-md">
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
                className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4285F4]/20 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-var(--color-bg-primary) backdrop-blur-xl shadow-2xl flex-1 mt-2">
          <div className="overflow-x-auto rounded-[32px]">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="bg-slate-900 dark:bg-black/40 border-b border-white/5 text-slate-300">
                <tr className="overflow-x-auto whitespace-nowrap">
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider w-16">
                    №
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Огноо
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Камер IP
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Оршин суугч
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Тоот
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Утас
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Улсын дугаар
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold uppercase tracking-wider">
                    Барилга
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm"
                    >
                      Бүртгэл олдсонгүй.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-4 px-6 text-xs font-medium text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium">
                        {moment(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                        {log.ip}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {log.orshinSuugchiinNer || "-"}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {log.toot || "-"}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {log.utas || "-"}
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {log.mashiniiDugaar ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-500/20 tracking-wider">
                            {log.mashiniiDugaar}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Дугааргүй
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {getBuildingName(log.barilgiinId)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        {totalCount > pageSize && (
          <StandardPagination
            current={page}
            total={totalCount}
            pageSize={pageSize}
            onChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
