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
  MoreHorizontal,
  X,
  Download,
} from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import formatNumber from "../../../../tools/function/formatNumber";
import { toast } from "react-hot-toast";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { StandardPagination } from "@/components/ui/StandardTable";
import * as XLSX from "xlsx";
import { PaymentPopup } from "../camera/PaymentPopup";

const RealTimeDuration = ({
  orsonTsag,
  garsanTsag,
  niitKhugatsaa,
}: {
  orsonTsag?: string;
  garsanTsag?: string;
  niitKhugatsaa?: number;
}) => {
  const [now, setNow] = useState(moment());
  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);
  if (!orsonTsag) return <span />;
  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));
  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();
  if (!garsanTsag) {
    return (
      <span className="text-[11px] font-mono">
        {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} :{" "}
        {String(seconds).padStart(2, "0")}
      </span>
    );
  }
  const khugatsaaMin =
    niitKhugatsaa ?? Math.max(0, Math.ceil(diff.asMinutes()));
  const h = Math.floor(khugatsaaMin / 60);
  const m = khugatsaaMin % 60;
  return (
    <span className="text-[10px] uppercase tracking-wide">
      {h > 0 ? `${h} цаг ${m} мин` : `${m} мин`}
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
    niitKhugatsaa?: number;
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
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа");
  };

  // null = explicitly cleared (no date filter), undefined = not yet init
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
          statusFilter,
        ]
      : null,
    async ([
      url,
      tkn,
      bId,
      barId,
      pg,
      search,
      start,
      end,
      dur,
      type,
      status,
    ]): Promise<any> => {
      // Build query similar to fetchList in camera page
      const query: any = {
        baiguullagiinId: bId,
        barilgiinId: barId || undefined,
      };
      if (start && end) {
        query.createdAt = {
          $gte: `${start} 00:00:00`,
          $lte: `${end} 23:59:59`,
        };
      }

      if (search) {
        query.mashiniiDugaar = { $regex: search, $options: "i" };
      }

      if (type !== "all") {
        if (type === "Үйлчлүүлэгч") {
          query.$or = [
            { turul: "Үйлчлүүлэгч" },
            { turul: { $exists: false } },
            { turul: null },
            { turul: "" },
          ];
        } else {
          query.turul = type;
        }
      }

      if (status === "active") {
        query["tuukh.tuluv"] = { $in: [0, -2] };
        query["tuukh.garsanKhaalga"] = { $exists: false };
      } else if (status === "paid") {
        query["tuukh.tuluv"] = { $in: [1, 2] };
      } else if (status === "unpaid") {
        query["tuukh.tuluv"] = { $in: [0, -4] };
        query.niitDun = { $gt: 0 };
      } else if (status === "free") {
        query.niitDun = 0;
        query["tuukh.tuluv"] = { $nin: [0, -2] };
      }

      const sortObj =
        dur === "longest"
          ? { "tuukh.0.niitKhugatsaa": -1 }
          : dur === "latest_in"
            ? {
                "tuukh.tsagiinTuukh.garsanTsag": 1,
                niitDun: 1,
                "tuukh.tuluv": 1,
                "tuukh.tsagiinTuukh.orsonTsag": -1,
                zurchil: 1,
              }
            : { "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 };

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
    { revalidateOnFocus: false },
  );

  const vehicles: Vehicle[] = useMemo(
    () => vehiclesData?.jagsaalt || [],
    [vehiclesData],
  );

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.mashiniiDugaar?.toLowerCase().includes(term) ||
        v.zurchil?.toLowerCase().includes(term) ||
        v.tuukh?.[0]?.burtgesenAjiltaniiNer?.toLowerCase().includes(term),
    );
  }, [vehicles, searchTerm]);

  const totalPages = Math.ceil((vehiclesData?.niitMur || 0) / pageSize);

  const downloadExcel = () => {
    if (!filteredVehicles.length) {
      toast.error("Татаж авах мэдээлэл байхгүй");
      return;
    }

    const STATUS_LABEL: Record<number, string> = {
      1: "Төлсөн", 2: "Төлсөн", 0: "Идэвхтэй", [-2]: "Идэвхтэй", [-4]: "Төлбөртэй",
    };

    const rows = filteredVehicles.map((t, i) => {
      const mur = t.tuukh?.[0];
      const tsag = mur?.tsagiinTuukh?.[0];
      const orsonTsag = tsag?.orsonTsag;
      const garsanTsag = tsag?.garsanTsag;
      const niitDun = t.niitDun || 0;
      const tulsunDun = mur?.tulsunDun || 0;
      const tuluv = mur?.tuluv;
      const isCurrentlyIn = !mur?.garsanKhaalga;

      const khugatsaa = (() => {
        if (!orsonTsag) return "";
        const s = moment(orsonTsag);
        const e = garsanTsag ? moment(garsanTsag) : moment();
        const mins = Math.max(0, Math.ceil(e.diff(s, "minutes", true)));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}ц ${m}м` : `${m}м`;
      })();

      const status = isCurrentlyIn
        ? "Идэвхтэй"
        : tuluv !== undefined
          ? STATUS_LABEL[tuluv] ?? "Гарсан"
          : niitDun > 0 ? "Төлбөртэй" : "Гарсан";

      return {
        "№": i + 1,
        "Улсын дугаар": t.mashiniiDugaar || "",
        "Төрөл": t.turul || mur?.turul || "Үйлчлүүлэгч",
        "Орсон": orsonTsag ? moment(orsonTsag).format("YYYY-MM-DD HH:mm:ss") : "",
        "Гарсан": garsanTsag ? moment(garsanTsag).format("YYYY-MM-DD HH:mm:ss") : "",
        "Хугацаа": khugatsaa,
        "Бодогдсон дүн": niitDun || "",
        "Төлсөн дүн": tulsunDun || "",
        "Төлөв": status,
        "Хөнгөлөлт": mur?.khungulult || "",
        "Шалтгаан": t.zurchil || "",
        "Бүртгэсэн": mur?.burtgesenAjiltaniiNer || "",
        "И-Баримт": mur?.ebarimtId || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Жагсаалт");

    const fileName = `zogsool_${rangeStart || "all"}_${rangeEnd || "all"}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`${rows.length} мөр татагдлаа`);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-full flex flex-col gap-6">
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-var(--color-bg-primary) border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Date picker */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-11">
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

            {/* Right: Search + Export */}
            <div className="flex items-center gap-3 flex-1 lg:justify-between">
              <div className="relative group w-full sm:w-72 max-w-sm">
                <input
                  type="text"
                  placeholder="Улсын дугаар хайх..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-11 pr-4 h-11 rounded-[30px] bg-slate-50 dark:bg-slate-800/50 border-0 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-[#4285F4]/20 transition-all shadow-inner"
                />
              </div>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Excel татах
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {(typeFilter !== "all" || statusFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Шүүлт:</span>
              {typeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] rounded-full border border-blue-200 dark:border-blue-500/20">
                  Төрөл: {typeFilter}
                  <button
                    onClick={() => { setTypeFilter("all"); setPage(1); }}
                    className="ml-0.5 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] rounded-full border border-violet-200 dark:border-violet-500/20">
                  Төлөв: {
                    { active: "Идэвхтэй", paid: "Төлсөн", unpaid: "Төлөөгүй", free: "Үнэгүй" }[statusFilter] || statusFilter
                  }
                  <button
                    onClick={() => { setStatusFilter("all"); setPage(1); }}
                    className="ml-0.5 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setPage(1); }}
                className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-1 underline underline-offset-2"
              >
                Бүгдийг арилгах
              </button>
            </div>
          )}
        </div>
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-var(--color-bg-primary) backdrop-blur-xl shadow-2xl flex-1 mt-2">
          <div>
            <table className="w-full border-collapse min-w-[1300px]">
              <thead className="bg-slate-900 dark:bg-black/40 border-b border-white/5">
                <tr className="overflow-x-auto whitespace-nowrap">
                  {[
                    { id: "no", label: "№", width: "w-12" },
                    { id: "orson", label: "Орсон" },
                    { id: "garsan", label: "Гарсан" },
                    {
                      id: "type",
                      label: "Төрөл",
                      filter: true,
                      current: typeFilter,
                      set: setTypeFilter,
                      options: [
                        { label: "Бүгд", value: "all" },
                        { label: "Үйлчлүүлэгч", value: "Үйлчлүүлэгч" },
                        { label: "Оршин суугч", value: "Оршин суугч" },
                        { label: "Зочин", value: "Зочин" },
                      ],
                    },
                    { id: "dugaar", label: "Дугааp" },
                    {
                      id: "duration",
                      label: "Хугацаа/мин",
                      filter: true,
                      current: durationFilter,
                      set: setDurationFilter,
                      options: [
                        { label: "Удаан зогссон эхэнд", value: "longest" },
                        { label: "Сүүлд орсон эхэнд", value: "latest_in" },
                        { label: "Сүүлд гарсан эхэнд", value: "latest_out" },
                      ],
                    },
                    { id: "calc", label: "Бодогдсон" },
                    { id: "payment", label: "Төлбөр" },
                    { id: "discount", label: "Хөнгөлөлт" },
                    { id: "ebarimt", label: "И-Баримт" },
                    {
                      id: "status",
                      label: "Төлөв",
                      filter: true,
                      current: statusFilter,
                      set: setStatusFilter,
                      options: [
                        { label: "Бүгд", value: "all" },
                        { label: "Идэвхтэй", value: "active" },
                        { label: "Төлсөн", value: "paid" },
                        { label: "Төлөөгүй", value: "unpaid" },
                        { label: "Үнэгүй", value: "free" },
                      ],
                    },
                    { id: "reason", label: "Шалтгаан" },
                    { id: "staff", label: "Бүртгэсэн" },
                  ].map((h) => (
                    <th
                      key={h.id}
                      className={`group relative py-4 px-4 text-slate-400 uppercase tracking-tighter text-[10px] font-black text-center ${h.width || ""}`}
                    >
                      <div
                        className={`flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors ${h.width ? "" : "w-full"}`}
                        onClick={() => {
                          if (!h.filter) return;
                          setOpenFilter(openFilter === h.id ? null : h.id);
                        }}
                      >
                        {h.filter && (
                          <Filter className={`w-3 h-3 transition-colors ${
                            h.current !== "all" && h.current !== undefined
                              ? "text-blue-400"
                              : "text-slate-500 group-hover:text-blue-400"
                          }`} />
                        )}
                        {h.label}
                      </div>

                      {h.options && (
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/98 backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 transition-all duration-300 z-[100] border border-white/5 overflow-hidden ring-1 ring-white/10 ${openFilter === h.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"}`}
                        >
                          <div className="relative flex flex-col gap-1 z-10">
                            <div className="px-3 py-1.5 mb-1 text-[9px]  text-slate-500 uppercase tracking-widest border-b border-white/5">
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
                                className={`px-4 py-2.5 rounded-xl text-[10px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${
                                  h.current === opt.value
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
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group relative ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-transparent"
                            : "bg-slate-50/70 dark:bg-slate-800/20"
                        }`}
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
                              {orsonTsag
                                ? moment(orsonTsag).format("MM-DD HH:mm:ss")
                                : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 whitespace-nowrap text-center">
                          <span className="text-[11px]  text-slate-500 dark:text-slate-400">
                            {garsanTsag
                              ? moment(garsanTsag).format("MM-DD HH:mm:ss")
                              : ""}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px]  text-slate-500 uppercase tracking-tighter">
                            {transaction.turul || mur?.turul || "Үйлчлүүлэгч"}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-2 group/copy">
                            <span className="text-xs text-slate-800 dark:text-slate-200 tracking-tight">
                              {transaction.mashiniiDugaar || ""}
                            </span>
                            <Copy
                              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-all opacity-0 group-hover/copy:opacity-100 scale-90 group-hover/copy:scale-100"
                              onClick={() =>
                                copyToClipboard(transaction.mashiniiDugaar)
                              }
                            />
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div
                            className={`px-2.5 py-1.5 rounded-2xl text-center w-[130px] inline-block whitespace-nowrap border transition-all ${
                              !garsanTsag
                                ? "bg-blue-500 border-blue-600 text-white shadow-sm"
                                : tuluv === -4 ||
                                    (niitDun > 0 && !isCurrentlyIn)
                                  ? "bg-amber-600 border-amber-700 text-white shadow-sm"
                                  : "bg-gray-500 border-gray-600 text-white"
                            }`}
                          >
                            <RealTimeDuration
                              orsonTsag={orsonTsag}
                              garsanTsag={garsanTsag}
                              niitKhugatsaa={mur?.niitKhugatsaa}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {niitDun ? formatNumber(niitDun) : ""}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const payHistory: any[] = (transaction.tuukh || []).flatMap((th: any) => {
                              const raw = th?.tulbur;
                              if (Array.isArray(raw)) return raw;
                              if (raw && typeof raw === "object") return [raw];
                              return [];
                            });
                            if (!payHistory.length) return <span />;
                            const totalPaid = payHistory.reduce((s: number, p: any) => s + (p.dun || 0), 0);
                            const uniqueTypes = [...new Set(payHistory.map((p: any) => p.turul).filter(Boolean))] as string[];
                            return (
                              <PaymentPopup
                                payHistory={payHistory}
                                totalPaid={totalPaid}
                                uniqueTypes={uniqueTypes}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 text-[11px] text-slate-500 text-center">
                          {mur?.khungulult || ""}
                        </td>
                        <td className="py-4 px-3 text-[11px] text-slate-500 text-center">
                          {mur?.ebarimtId || ""}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const badgeClass =
                              "flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border";
                            if (tuluv === 1)
                              return (
                                <div
                                  className={`${badgeClass} bg-emerald-500 border-emerald-600`}
                                  style={{ borderRadius: "6px" }}
                                >
                                  <span className="text-[10px] !text-white uppercase whitespace-nowrap">
                                    Төлсөн
                                  </span>
                                </div>
                              );
                            if (isCurrentlyIn)
                              return (
                                <div
                                  className={`${badgeClass} bg-blue-500 border-blue-600`}
                                  style={{ borderRadius: "6px" }}
                                >
                                  <span className="text-[10px] !text-white uppercase whitespace-nowrap">
                                    Идэвхтэй
                                  </span>
                                </div>
                              );
                            if (tuluv === -4 || (niitDun > 0 && !isCurrentlyIn))
                              return (
                                <div
                                  className={`${badgeClass} bg-amber-600 border-amber-700`}
                                  style={{ borderRadius: "6px" }}
                                >
                                  <span className="text-[10px] !text-white uppercase whitespace-nowrap">
                                    Төлбөртэй
                                  </span>
                                </div>
                              );
                            return (
                              <div
                                className={`${badgeClass} bg-gray-500 border-gray-600`}
                                style={{ borderRadius: "6px" }}
                              >
                                <span className="text-[10px] !text-white uppercase whitespace-nowrap">
                                  Гарсан
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 max-w-[150px]">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate group-hover:whitespace-normal text-center">
                            {transaction.zurchil || ""}
                          </p>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400">
                              {mur?.burtgesenAjiltaniiNer || ""}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredVehicles.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white sticky bottom-0 z-10">
                  <tr>
                    <td
                      colSpan={6}
                      className="py-3 px-3 text-right text-[11px] font-black uppercase tracking-wider border-r border-slate-200 dark:border-white/5"
                    >
                      Нийт Дүн:
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                      {formatNumber(
                        filteredVehicles.reduce(
                          (sum, t) => sum + (Number(t.niitDun) || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                      {formatNumber(
                        filteredVehicles.reduce(
                          (sum, t) =>
                            sum + (Number(t.tuukh?.[0]?.tulsunDun) || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td
                      colSpan={5}
                      className="border-r border-slate-200 dark:border-white/5"
                    />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <StandardPagination
          current={page}
          total={vehiclesData?.niitMur || 0}
          pageSize={pageSize}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
