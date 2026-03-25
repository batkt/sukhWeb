"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import dayjs from "dayjs";
import "dayjs/locale/mn";
import { useSearch } from "@/context/SearchContext";
import { ConfigProvider, theme as antdTheme } from "antd";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import toast from "react-hot-toast";
import PageSongokh from "components/selectZagvar/pageSongokh";
import {
  AvlagiinNasjiltTable,
  AvlagiinNasjiltItem,
} from "./AvlagiinNasjiltTable";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: auto !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
        margin-bottom: 30px;
        width: 100% !important;
      }
      .print-container {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      main,
      div[class*="neu-panel"],
      div[class*="overflow-y-auto"],
      div[class*="md:h-"],
      div[class*="max-h-"] {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        position: static !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        font-size: 8pt !important;
        color: black !important;
      }
      th,
      td {
        border: 1px solid #000 !important;
        padding: 4px 2px !important;
        background: transparent !important;
        color: black !important;
        text-align: center !important;
        word-wrap: break-word !important;
      }
      th {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
        -webkit-print-color-adjust: exact;
      }
      tr {
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
      .text-left {
        text-align: left !important;
      }
      .text-right {
        text-align: right !important;
      }
    }
    .print-only {
      display: none;
    }
  `}</style>
);

export default function AvlagiinNasjiltPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );
  const baiguullagiinId = baiguullaga?._id;
  const { searchTerm } = useSearch();

  const [data, setData] = useState<AvlagiinNasjiltItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [ognoo, setOgnoo] = useState<dayjs.Dayjs | null>(
    dayjs().endOf("month"),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const fetchData = async () => {
    if (!selectedBuildingId || !baiguullaga || !token) return;

    try {
      setLoading(true);
      const payload = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        duusakhOgnoo: ognoo
          ? ognoo.endOf("month").format("YYYY-MM-DD 23:59:59")
          : undefined,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
        view: "detailed",
        search: searchTerm || undefined,
      };

      const response = await uilchilgee(token).post(
        "/tailan/avlagiin-nasjilt",
        payload,
      );
      const fetchedData =
        response.data?.detailed?.list || response.data?.jagsaalt || [];
      const summaryData = response.data?.summary || null;

      setData(Array.isArray(fetchedData) ? fetchedData : []);
      setSummary(summaryData);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    selectedBuildingId,
    baiguullaga,
    ognoo,
    searchTerm,
    currentPage,
    pageSize,
  ]);

  const exportToExcel = async () => {
    if (!token || !baiguullagiinId)
      return toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
    const toastId = toast.loading("Excel файл бэлтгэж байна...");
    try {
      const payload = {
        report: "avlagiin-nasjilt",
        baiguullagiinId: baiguullaga?._id,
        barilgiinId: selectedBuildingId,
        duusakhOgnoo: ognoo?.endOf("month").format("YYYY-MM-DD"),
        search: searchTerm || undefined,
      };
      const resp = await uilchilgee(token).post("/tailan/export", payload, {
        responseType: "blob" as any,
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `avlagiin_nasjilt_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel файл татагдлаа", { id: toastId });
    } catch (err) {
      toast.error("Excel татахад алдаа гарлаа", { id: toastId });
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((it: any) => {
      const uldegdel = Number(it.uldegdel ?? it.tulukhDun ?? 0);
      return Math.abs(uldegdel) > 0.01;
    });
  }, [data]);

  const totals = useMemo(() => {
    const fields = [
      "undsenDun",
      "khungulult",
      "tulsunDun",
      "uldegdel",
      "p0_30",
      "p31_60",
      "p61_90",
      "p91_120",
      "p120plus",
    ];
    const results: any = {};
    fields.forEach((f) => {
      results[f] = filteredData.reduce(
        (acc, curr: any) =>
          acc +
          (Number(curr[f] ?? curr[f === "uldegdel" ? "tulukhDun" : f]) || 0),
        0,
      );
    });
    return results;
  }, [filteredData]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: { borderRadius: 12, colorPrimary: "#10b981" },
      }}
    >
      <div className="p-4 md:p-6 bg-[color:var(--surface-bg)] min-h-screen flex flex-col gap-4 print-container">
        <PrintStyles />

        {/* Print Only Header */}
        <div className="print-only mb-8 text-center text-black">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Насжилтын тайлан
          </h1>
          <p className="mt-4 text-xl font-bold">{baiguullaga?.ner}</p>
          <p className="text-sm mt-1">
            Огноо: {ognoo?.format("YYYY-MM-DD") || "Өнөөдөр"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print flex-shrink-0">
          <h1 className="text-2xl font-bold text-theme tracking-tight">
            Насжилтын тайлан
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="btn-minimal h-[40px] w-full md:w-[320px] flex items-center px-3">
              <StandardDatePicker
                value={ognoo}
                onChange={setOgnoo}
                picker="month"
                placeholder="Сар сонгох"
                format="YYYY-MM"
                className="!h-full !w-full text-theme !px-0 flex items-center justify-center text-center border-0 shadow-none"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
            >
              <Printer className="w-4 h-4" /> Хэвлэх
            </button>
            <button
              onClick={exportToExcel}
              className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
              татах
            </button>
          </div>
        </div>

        <div
          className="rounded-3xl overflow-hidden neu-panel p-3 bg-white dark:bg-slate-900/50 dark:border-slate-800 border 
          mb-1 neu-table allow-overflow flex flex-col min-h-0
        "
        >
          <AvlagiinNasjiltTable
            data={filteredData as AvlagiinNasjiltItem[]}
            loading={loading}
            page={currentPage}
            pageSize={pageSize}
            totals={totals}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print flex-shrink-0 mt-2">
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
              Нийт: {summary?.count || filteredData.length}
            </div>
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-full text-red-500">
              Авлага: {formatNumber(totals.uldegdel)}{" "}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PageSongokh
              value={pageSize}
              onChange={(v) => {
                setPageSize(v);
                setCurrentPage(1);
              }}
              className="!h-10 !rounded-2xl"
            />
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-1.5 rounded-2xl text-sm font-bold disabled:opacity-20 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              >
                Өмнөх
              </button>
              <div className="px-4 text-sm font-black text-emerald-600">
                {currentPage} /{" "}
                {Math.max(
                  1,
                  Math.ceil((summary?.count || filteredData.length) / pageSize),
                )}
              </div>
              <button
                disabled={
                  currentPage * pageSize >=
                  (summary?.count || filteredData.length)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-1.5 rounded-2xl text-sm font-bold disabled:opacity-20 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
              >
                Дараах
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
