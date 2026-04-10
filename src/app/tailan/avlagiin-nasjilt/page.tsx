"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import dayjs from "dayjs";
import "dayjs/locale/mn";
import { useSearch } from "@/context/SearchContext";
import { ConfigProvider, theme as antdTheme } from "antd";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import toast from "react-hot-toast";
import PageSongokh from "components/selectZagvar/pageSongokh";
import formatNumber from "tools/function/formatNumber";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import {
  AvlagiinNasjiltTable,
  AvlagiinNasjiltItem,
} from "./AvlagiinNasjiltTable";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 6mm 8mm;
      }

      body, html {
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }

      .no-print {
        display: none !important;
      }

      .print-only {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8px !important;
      }

      .print-container {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .print-container *,
      .guilgee-table,
      
      .ant-table-wrapper,
      .ant-spin-nested-loading,
      .ant-spin-container,
      .ant-table,
      .ant-table-container,
      .ant-table-content,
      .ant-table-body,
      .ant-table-header {
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        position: static !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        background: transparent !important;
        transform: none !important;
      }

      /* Hide sticky floating header, keep only real thead */
      .ant-table-header {
        display: none !important;
      }

      .ant-table-body thead,
      .ant-table-body thead tr,
      .ant-table-body thead th {
        display: table-header-group !important;
      }

     

      /* Unfix sticky columns */
      .ant-table-cell-fix-left,
      .ant-table-cell-fix-right {
        position: static !important;
        background: transparent !important;
        box-shadow: none !important;
        z-index: auto !important;
      }

      .ant-table-tbody {
        display: table-row-group !important;
      }

      .ant-table-tbody > tr {
        display: table-row !important;
      }

      .ant-table-tbody > tr > td {
        display: table-cell !important;
      }

      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
        font-size: 6.5pt !important;
        color: black !important;
      }

      thead {
        display: table-header-group !important;
        
      }

      tr {
        page-break-inside: avoid !important;
      }

      .ant-table-cell,
      th,
      td {
        border: 0.5px solid #aaa !important;
        padding: 2px 3px !important;
        background: transparent !important;
        color: black !important;
        word-break: break-word !important;
        white-space: normal !important;
      }

      th,
      .ant-table-thead > tr > th {
        background-color: #c4c3c3ff !important;
        font-weight: bold !important;
        text-align: center !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      td { text-align: right !important; }

      td:nth-child(1),
      td:nth-child(2),
      td:nth-child(3) {
        text-align: left !important;
      }

      col:nth-child(1)  { width: 6mm !important; }
      col:nth-child(2)  { width: 28mm !important; }
      col:nth-child(3)  { width: 20mm !important; }
      col:nth-child(4)  { width: 10mm !important; }
      col:nth-child(5)  { width: 10mm !important; }
      col:nth-child(6)  { width: 22mm !important; }
      col:nth-child(7)  { width: 18mm !important; }
      col:nth-child(8)  { width: 18mm !important; }
      col:nth-child(9)  { width: 22mm !important; }
      col:nth-child(10) { width: 20mm !important; }
      col:nth-child(11) { width: 20mm !important; }
      col:nth-child(12) { width: 20mm !important; }
      col:nth-child(13) { width: 20mm !important; }
      col:nth-child(14) { width: 23mm !important; }
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
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [isDark, setIsDark] = useState(false);

  const footerTotals = useTulburFooterTotals(
    token,
    ajiltan?.baiguullagiinId ?? null,
    selectedBuildingId || undefined,
    dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null,
    dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null
  );


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
      const hasDateRange = dateRange?.[0] && dateRange?.[1];
      const payload: any = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
        view: "detailed",
        search: searchTerm || undefined,
      };
      // When date range is selected, send ekhlekhOgnoo/duusakhOgnoo for filtering
      // The backend uses duusakhOgnoo as refDate for aging calculation
      if (hasDateRange) {
        payload.ekhlekhOgnoo = dayjs(dateRange[0]).format("YYYY-MM-DD 00:00:00");
        payload.duusakhOgnoo = dayjs(dateRange[1]).format("YYYY-MM-DD 23:59:59");
      }
      // When no date range is selected, don't send dates - backend shows all unpaid
      // and uses today as refDate by default
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
  }, [selectedBuildingId, baiguullaga, dateRange, searchTerm, currentPage, pageSize]);

  const exportToExcel = async () => {
    if (!token || !baiguullagiinId)
      return toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
    const toastId = toast.loading("Excel файл бэлтгэж байна...");
    try {
      const hasDateRange = dateRange?.[0] && dateRange?.[1];
      const payload: any = {
        report: "avlagiin-nasjilt",
        baiguullagiinId: baiguullaga?._id,
        barilgiinId: selectedBuildingId,
        duusakhOgnoo: dayjs().format("YYYY-MM-DD"),
        search: searchTerm || undefined,
      };
      if (hasDateRange) {
        payload.ekhlekhOgnoo = dayjs(dateRange[0]).format("YYYY-MM-DD");
        payload.duusakhOgnoo = dayjs(dateRange[1]).format("YYYY-MM-DD");
      }
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
      "undsenDun", "khungulult", "tulsunDun", "uldegdel",
      "p0_30", "p31_60", "p61_90", "p120plus",
    ];
    const results: any = {};
    fields.forEach((f) => {
      results[f] = filteredData.reduce(
        (acc, curr: any) =>
          acc + (Number(curr[f] ?? curr[f === "uldegdel" ? "tulukhDun" : f]) || 0),
        0,
      );
    });
    return results;
  }, [filteredData]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { borderRadius: 12, colorPrimary: "#10b981" },
      }}
    >
      <div className="p-4 md:p-6 bg-[color:var(--surface-bg)] min-h-full h-auto flex flex-col gap-4 print-container overflow-hidden print:block print:h-auto print:overflow-visible print:p-0">
        <PrintStyles />

        {/* Print Only Header */}
        <div className="print-only text-center text-black">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Насжилтын тайлан
          </h1>
          <p className="mt-2 text-xl font-bold">{baiguullaga?.ner}</p>
          <p className="text-sm mt-1">
            Огноо:{" "}
            {dateRange?.[0] && dateRange?.[1]
              ? `${dayjs(dateRange[0]).format("YYYY-MM-DD")} - ${dayjs(dateRange[1]).format("YYYY-MM-DD")}`
              : "Бүх хугацаа"}
          </p>
        </div>

        {/* Screen title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print flex-shrink-0">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-theme tracking-tight">
              Насжилтын тайлан
            </h1>
            <p className="text-sm text-theme/60">
              {summary?.count || 0} хэрэглэгчийн нийт {formatNumber(totals?.uldegdel || 0, 0)} ₮ авлага
            </p>
          </div>
        </div>


        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 no-print flex-shrink-0">
          <div
            id="nasjilt-date"
            className="btn-minimal h-[40px] w-full md:w-[320px] flex items-center px-3"
          >
            <StandardDatePicker
              isRange={true}
              value={dateRange}
              onChange={setDateRange}
              allowClear
              placeholder="Огноо сонгох"
              classNames={{
                root: "!h-full !w-full",
                input:
                  "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
              }}
            />
          </div>
          {/* <button
            onClick={() => window.print()}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4" /> Хэвлэх
          </button> */}
          <button
            onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel татах
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="w-full no-print">
          <AvlagiinNasjiltTable
            data={filteredData as AvlagiinNasjiltItem[]}
            loading={loading}
            page={currentPage}
            pageSize={pageSize}
            totals={totals}
            authoritativeTotals={footerTotals}
          />
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print flex-shrink-0">
          <div />
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
                disabled={currentPage * pageSize >= (summary?.count || filteredData.length)}
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