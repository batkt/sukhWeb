"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
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
  Receipt,
  Banknote,
  CreditCard,
  Landmark,
  Tag,
  Wallet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { ConfigProvider } from "antd";
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
  const { searchTerm, setSearchTerm } = useSearch();
  const [page, setPage] = useState(1);
  const pageSize = 1000;

  const [durationFilter, setDurationFilter] = useState("latest_out");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueDateRange, setRevenueDateRange] = useState<[string | null, string | null] | undefined>(() => {
    const today = moment().format("YYYY-MM-DD");
    return [today, today];
  });
  const [revenueListData, setRevenueListData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

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

  // Force revalidate when searchTerm changes
  useEffect(() => {
    if (shouldFetch) {
      mutate();
    }
  }, [searchTerm, mutate, shouldFetch]);

  // Vehicles are already filtered by search on the API side

  const totalPages = Math.ceil((vehiclesData?.niitMur || 0) / pageSize);

  const fetchRevenueData = useCallback(async (start: string, end: string) => {
    if (!token || !start || !end) return;
    setRevenueLoading(true);
    try {
      const resp = await uilchilgee(token).get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000,
          query: JSON.stringify({
            baiguullagiinId: ajiltan?.baiguullagiinId,
            ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
            createdAt: { $gte: `${start} 00:00:00`, $lte: `${end} 23:59:59` },
          }),
        },
      });
      setRevenueListData(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRevenueLoading(false);
    }
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const [start, end] = revenueDateRange || [null, null];
    if (start && end) fetchRevenueData(start, end);
  }, [revenueModalOpen, revenueDateRange, fetchRevenueData]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setRevenueModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [revenueModalOpen]);

  const revenueModalBreakdown = useMemo(() => {
    const allList = revenueListData?.jagsaalt || [];
    const methodLabels: Record<string, string> = {
      belen: "Бэлэн", cash: "Бэлэн", khaan: "Карт",
      khariltsakh: "Дансаар", transfer: "Дансаар", qpay: "QPay",
      khungulult: "Хөнгөлөлт", discount: "Хөнгөлөлт",
    };
    const methodIcons: Record<string, React.ReactNode> = {
      belen: <Banknote className="w-4 h-4" />, cash: <Banknote className="w-4 h-4" />,
      khaan: <CreditCard className="w-4 h-4" />, khariltsakh: <ArrowRight className="w-4 h-4" />,
      transfer: <ArrowRight className="w-4 h-4" />, qpay: <Landmark className="w-4 h-4" />,
      khungulult: <Tag className="w-4 h-4" />, discount: <Tag className="w-4 h-4" />,
    };
    const methodColors: Record<string, string> = {
      belen: "bg-emerald-500", cash: "bg-emerald-500", khaan: "bg-sky-500",
      khariltsakh: "bg-violet-500", transfer: "bg-violet-500", qpay: "bg-amber-500",
      khungulult: "bg-rose-500", discount: "bg-rose-500",
    };
    const methodMap: Record<string, { amount: number; count: number }> = {};
    allList.forEach((t: any) => {
      (t.tuukh?.[0]?.tulbur || []).forEach((p: any) => {
        const rawTurul = p.turul || "unknown";
        const m = (rawTurul === "discount" || rawTurul === "Хөнгөлөлт") ? "khungulult" : rawTurul;
        if (!methodMap[m]) methodMap[m] = { amount: 0, count: 0 };
        methodMap[m].amount += Math.abs(p.dun || 0);
        methodMap[m].count += 1;
      });
    });
    const totalAmount = Object.values(methodMap).reduce((s, v) => s + v.amount, 0);
    const items = Object.entries(methodMap)
      .map(([key, val]) => ({
        key,
        name: methodLabels[key] || key,
        icon: methodIcons[key] || <Wallet className="w-4 h-4" />,
        color: methodColors[key] || "bg-slate-500",
        amount: val.amount,
        count: val.count,
        pct: totalAmount > 0 ? ((val.amount / totalAmount) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.amount - a.amount);
    return { items, totalAmount };
  }, [revenueListData]);

  const downloadExcel = () => {
    if (!vehicles.length) {
      toast.error("Татаж авах мэдээлэл байхгүй");
      return;
    }

    const STATUS_LABEL: Record<number, string> = {
      1: "Төлсөн", 2: "Төлсөн", 0: "Идэвхтэй", [-2]: "Идэвхтэй", [-4]: "Төлбөртэй",
    };

    const rows = vehicles.map((t, i) => {
      const mur = t.tuukh?.[0];
      const tsag = mur?.tsagiinTuukh?.[0];
      const orsonTsag = tsag?.orsonTsag;
      const garsanTsag = tsag?.garsanTsag;
      const niitDun = t.niitDun || 0;
      const tuluv = mur?.tuluv;
      const isCurrentlyIn = !mur?.garsanKhaalga;

      // Calculate payment and discount separately from tulbur array
      const tulburArray = mur?.tulbur || [];
      const payments = Array.isArray(tulburArray) ? tulburArray.filter((p: any) => {
        const turul = p.turul || "";
        const dun = p.dun || 0;
        return turul !== "discount" && turul !== "khungulult" && turul !== "Хөнгөлөлт" && dun >= 0;
      }) : [];
      const discounts = Array.isArray(tulburArray) ? tulburArray.filter((p: any) => {
        const turul = p.turul || "";
        const dun = p.dun || 0;
        return turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0;
      }) : [];
      const paymentAmount = payments.reduce((s: number, p: any) => s + (p.dun || 0), 0);
      const discountAmount = discounts.reduce((s: number, p: any) => s + Math.abs(p.dun || 0), 0);

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
        "Төлбөр": paymentAmount || "",
        "Хөнгөлөлт": discountAmount || "",
        "Төлөв": status,
        "Шалтгаан": t.zurchil || "",
        "Бүртгэсэн": mur?.burtgesenAjiltaniiNer || "",
        "И-Баримт": mur?.ebarimtId || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 },
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 20 }, { wch: 16 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Жагсаалт");

    const fileName = `zogsool_${rangeStart || "all"}_${rangeEnd || "all"}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`${rows.length} мөр татагдлаа`);
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 max-w-[1700px] mx-auto w-full h-full overflow-hidden">
        <div className="relative z-10 px-6 py-4 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Date picker + Search */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-11 [&_.ant-picker-input]:!bg-transparent [&_input]:!bg-transparent [&_.ant-picker-input-active]:!bg-transparent dark:[&_.ant-picker-suffix]:!text-white dark:[&_.ant-picker-suffix_svg]:!fill-white dark:[&_.ant-picker:hover]:!bg-slate-700 dark:[&_.ant-picker-focused]:!bg-slate-700 [&_.ant-picker-range-separator]:!text-slate-400 dark:[&_.ant-picker-range-separator]:!text-slate-400">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(date: any, dateString: [string, string]) => {
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

            {/* Right: Export + Revenue Report */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRevenueModalOpen(true)}
                  className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Орлого тайлан
                </button>
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel татах
                </button>
              </div>
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
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[1300px] relative">
              <thead className="bg-slate-900 dark:bg-slate-950 border-b border-white/5 sticky top-0 z-20">
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
                          <Filter className={`w-3 h-3 transition-colors ${h.current !== "all" && h.current !== undefined
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
                                className={`px-4 py-2.5 rounded-xl text-[10px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${h.current === opt.value
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
                {vehicles.length === 0 ? (
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
                  vehicles.map((transaction, idx) => {
                    const mur = transaction.tuukh?.[0];
                    const tsag = mur?.tsagiinTuukh?.[0];
                    const orsonTsag = tsag?.orsonTsag;
                    const garsanTsag = tsag?.garsanTsag;
                    const tuluv = mur?.tuluv;
                    const niitDun = transaction.niitDun || 0;
                    const isCurrentlyIn = !mur?.garsanKhaalga;
                    const isFreeExit = !!mur?.uneguiGarsan && tuluv !== -2 && tuluv !== -1;
                    const rawTulbur = mur?.tulbur;
                    const tulburArr: any[] = Array.isArray(rawTulbur) ? rawTulbur : (rawTulbur ? [rawTulbur] : []);
                    const discountTotal = tulburArr
                      .filter((p: any) => p?.turul === "khungulult" || p?.turul === "discount" || p?.turul === "Хөнгөлөлт")
                      .reduce((s: number, p: any) => s + Math.abs(p?.dun ?? 0), 0);
                    const effectiveOwed = Math.max(0, niitDun - discountTotal);
                    const positivePaid = tulburArr.reduce((s: number, p: any) => s + (p?.dun > 0 ? p.dun : 0), 0);
                    const isDebt = !isFreeExit && (tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn));
                    const hasRemainingBalance = tuluv === 1 && effectiveOwed > 0 && !isCurrentlyIn && positivePaid < effectiveOwed;
                    const getStatusColor = () => {
                      if (tuluv === -2 || tuluv === -1) return "bg-red-500 border-red-600";
                      if (hasRemainingBalance) return "bg-amber-500 border-amber-600";
                      if (isFreeExit) return "bg-gray-500 border-gray-600";
                      if (tuluv === 1) return isCurrentlyIn && niitDun === 0 ? "bg-blue-500 border-blue-600" : "bg-emerald-500 border-emerald-600";
                      if (!isCurrentlyIn && (niitDun > 0 || isDebt)) return "bg-amber-500 border-amber-600";
                      if (!isCurrentlyIn && niitDun === 0) return "bg-gray-500 border-gray-600";
                      return "bg-blue-500 border-blue-600";
                    };

                    return (
                      <tr
                        key={transaction._id || idx}
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group relative ${idx % 2 === 0
                          ? "bg-slate-100 dark:bg-slate-800/40"
                          : "bg-white dark:bg-transparent"
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
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold !text-white tracking-widest font-[family-name:var(--font-mono)]">
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
                            className={`flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1 rounded-[6px] overflow-hidden border text-[10px] text-white ${getStatusColor()}`}
                            style={{ borderRadius: "6px", color: "white" }}
                          >
                            <RealTimeDuration
                              orsonTsag={orsonTsag}
                              garsanTsag={garsanTsag}
                              niitKhugatsaa={mur?.niitKhugatsaa}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-[family-name:var(--font-mono)]">
                            {formatNumber(niitDun, 2)}
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
                            // Filter only actual payments (not discounts)
                            const paymentHistory = payHistory.filter((p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              return turul !== "discount" && turul !== "khungulult" && turul !== "Хөнгөлөлт" && dun >= 0;
                            });
                            if (!paymentHistory.length) return <span />;
                            const totalPaid = paymentHistory.reduce((s: number, p: any) => s + (p.dun || 0), 0);
                            const uniqueTypes = [...new Set(paymentHistory.map((p: any) => p.turul).filter(Boolean))] as string[];
                            return (
                              <PaymentPopup
                                payHistory={paymentHistory}
                                totalPaid={totalPaid}
                                uniqueTypes={uniqueTypes}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const payHistory: any[] = (transaction.tuukh || []).flatMap((th: any) => {
                              const raw = th?.tulbur;
                              if (Array.isArray(raw)) return raw;
                              if (raw && typeof raw === "object") return [raw];
                              return [];
                            });
                            // Filter only discounts
                            const discountHistory = payHistory.filter((p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              return turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0;
                            });
                            if (!discountHistory.length) return <span />;
                            const totalDiscount = discountHistory.reduce((s: number, p: any) => s + Math.abs(p.dun || 0), 0);
                            const uniqueTypes = [...new Set(discountHistory.map((p: any) => p.turul).filter(Boolean))] as string[];
                            return (
                              <PaymentPopup
                                payHistory={discountHistory}
                                totalPaid={totalDiscount}
                                uniqueTypes={uniqueTypes}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 text-[11px] text-slate-500 text-center">
                          {mur?.ebarimtId || ""}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const badgeClass = `flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border ${getStatusColor()}`;
                            const label =
                              tuluv === -2 || tuluv === -1 ? "Зөрчилтэй"
                                : hasRemainingBalance ? "Төлбөр"
                                  : isFreeExit ? "Төлсөн"
                                    : tuluv === 1 ? (isCurrentlyIn && niitDun === 0 ? "Идэвхтэй" : "Төлсөн")
                                      : isCurrentlyIn ? "Идэвхтэй"
                                        : niitDun > 0 || isDebt ? "Төлбөртэй"
                                          : "Үнэгүй";
                            return (
                              <div className={badgeClass} style={{ borderRadius: "6px" }}>
                                <span className="text-[10px] !text-white uppercase whitespace-nowrap">{label}</span>
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
                      vehicles.reduce(
                        (sum, t) => sum + (Number(t.niitDun) || 0),
                        0,
                      ), 2)}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {formatNumber(
                      vehicles.reduce(
                        (sum, t) => {
                          const tulburArray = t.tuukh?.[0]?.tulbur || [];
                          const totalPaid = Array.isArray(tulburArray)
                            ? tulburArray.reduce((s: number, p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) return s;
                              return s + dun;
                            }, 0)
                            : 0;
                          return sum + totalPaid;
                        },
                        0,
                      ), 2)}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {formatNumber(
                      vehicles.reduce(
                        (sum, t) => {
                          const tulburArray = t.tuukh?.[0]?.tulbur || [];
                          const totalDiscount = Array.isArray(tulburArray)
                            ? tulburArray.reduce((s: number, p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) {
                                return s + Math.abs(dun);
                              }
                              return s;
                            }, 0)
                            : 0;
                          return sum + totalDiscount;
                        },
                        0,
                      ), 2)}
                  </td>
                  <td
                    colSpan={4}
                    className="border-r border-slate-200 dark:border-white/5"
                  />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <StandardPagination
          current={page}
          total={vehiclesData?.niitMur || 0}
          pageSize={pageSize}
          onChange={setPage}
        />
        {revenueModalOpen && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() => setRevenueModalOpen(false)}
          >
            <div
              className="relative w-[420px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 opacity-80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.06]">
                      <Receipt className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-[15px] text-slate-800 dark:text-white tracking-tight">
                        Орлого тайлан
                      </h2>
                      <div className="mt-1.5 min-w-[220px]">
                        <ConfigProvider theme={{ token: { zIndexPopupBase: 10000 } }}>
                          <StandardDatePicker
                            isRange={true}
                            value={revenueDateRange}
                            onChange={(_: any, dateStrings: [string, string]) => setRevenueDateRange(dateStrings)}
                            format="YYYY-MM-DD"
                            classNames={{
                              input: "flex items-center gap-2 rounded-full border border-slate-200/40 dark:border-white/[0.06] h-8 px-3 text-[11px] text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/10 transition-all",
                            }}
                            allowClear
                            getPopupContainer={() => document.body}
                          />
                        </ConfigProvider>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRevenueModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">
                  Төлбөрийн хэлбэр
                </p>
                {revenueLoading && (
                  <div className="text-center py-8 text-[11px] text-slate-400">Уншиж байна...</div>
                )}
                {!revenueLoading && revenueModalBreakdown.items.map((item) => (
                  <div
                    key={item.key}
                    className="relative flex items-center gap-3 py-2.5 px-3 rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden"
                  >
                    {/* Percentage fill background */}
                    <div
                      className={`absolute inset-y-0 left-0 ${item.color} opacity-[0.08] dark:opacity-[0.06] transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                    <div
                      className={`w-1 h-8 rounded-full ${item.color} shrink-0 relative z-10`}
                    />
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 relative z-10">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <span className="text-[12px] text-slate-700 dark:text-slate-200 block">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[13px] font-black text-slate-800 dark:text-white font-[family-name:var(--font-mono)] shrink-0 relative z-10">
                      {formatNumber(item.amount)}₮
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)] w-6 text-center shrink-0 relative z-10">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)] w-12 text-right shrink-0 relative z-10">
                      {item.pct}%
                    </span>
                  </div>
                ))}
                {!revenueLoading && revenueModalBreakdown.items.length === 0 && (
                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-8">
                    Төлбөрийн мэдээлэл олдсонгүй
                  </p>
                )}
              </div>

              {/* Footer total */}
              <div className="px-7 pb-6 pt-2">
                <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Нийт орлого
                  </span>
                  <span className="text-[14px] font-black text-emerald-700 dark:text-emerald-400 font-[family-name:var(--font-mono)]">
                    {formatNumber(revenueModalBreakdown.totalAmount)}₮
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
