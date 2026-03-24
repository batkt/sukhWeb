"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, FileSpreadsheet, Printer } from "lucide-react";
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

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: auto !important; }
      .no-print { display: none !important; }
      .print-only { display: block !important; margin-bottom: 30px; width: 100% !important; }
      .print-container { display: block !important; position: relative !important; width: 100% !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
      main, div[class*="neu-panel"], div[class*="overflow-y-auto"], div[class*="md:h-"], div[class*="max-h-"] {
        height: auto !important; max-height: none !important; overflow: visible !important; position: static !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important;
      }
      table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; font-family: 'Inter', sans-serif !important; font-size: 8pt !important; color: black !important; }
      th, td { border: 1px solid #000 !important; padding: 4px 2px !important; background: transparent !important; color: black !important; text-align: center !important; word-wrap: break-word !important; }
      th { background-color: #f0f0f0 !important; font-weight: bold !important; -webkit-print-color-adjust: exact; }
      tr { page-break-inside: avoid !important; }
      thead { display: table-header-group !important; }
      .text-left { text-align: left !important; }
      .text-right { text-align: right !important; }
    }
    .print-only { display: none; }
  `}</style>
);

interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  ner: string;
  toot: string;
  davkhar: string;
  register: string;
  undsenDun: number;
  aldangi: number;
  khungulult: number;
  tulsunDun: number;
  uldegdel: number;
  p0_30: number;
  p31_60: number;
  p61_90: number;
  p91_120: number;
  p120plus: number;
  [key: string]: any;
}

export default function AvlagiinNasjiltPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(token || null, ajiltan?.baiguullagiinId || null);
  const baiguullagiinId = baiguullaga?._id;
  const { searchTerm } = useSearch();

  const [data, setData] = useState<AvlagiinNasjiltItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [ognoo, setOgnoo] = useState<dayjs.Dayjs | null>(dayjs().endOf("month"));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const fetchData = async () => {
    if (!selectedBuildingId || !baiguullaga || !token) return;

    try {
      setLoading(true);
      const payload = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        duusakhOgnoo: ognoo ? ognoo.endOf("month").format("YYYY-MM-DD 23:59:59") : undefined,
        khuudasniiDugaar: currentPage,
        khuudasniiKhemjee: pageSize,
        view: "detailed",
        search: searchTerm || undefined,
      };

      const response = await uilchilgee(token).post("/tailan/avlagiin-nasjilt", payload);
      const fetchedData = response.data?.detailed?.list || response.data?.jagsaalt || [];
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
  }, [selectedBuildingId, baiguullaga, ognoo, searchTerm, currentPage, pageSize]);

  const exportToExcel = async () => {
    if (!token || !baiguullagiinId) return toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
    const toastId = toast.loading("Excel файл бэлтгэж байна...");
    try {
      const payload = {
        report: "avlagiin-nasjilt",
        baiguullagiinId: baiguullaga?._id,
        barilgiinId: selectedBuildingId,
        duusakhOgnoo: ognoo?.endOf("month").format("YYYY-MM-DD"),
        search: searchTerm || undefined,
      };
      const resp = await uilchilgee(token).post("/tailan/export", payload, { responseType: "blob" as any });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `avlagiin_nasjilt_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
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
  const fields = ["undsenDun", "khungulult", "tulsunDun", "uldegdel", "p0_30", "p31_60", "p61_90", "p91_120", "p120plus"];
  const results: any = {};
  fields.forEach(f => {
    results[f] = filteredData.reduce((acc, curr: any) => acc + (Number(curr[f] ?? curr[f === 'uldegdel' ? 'tulukhDun' : f]) || 0), 0);
  });
  return results;
}, [filteredData]);

  return (
    <ConfigProvider theme={{ algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm, token: { borderRadius: 12, colorPrimary: "#10b981" } }}>
      <div className="p-4 md:p-6 bg-[color:var(--surface-bg)] min-h-screen flex flex-col gap-4 print-container">
        <PrintStyles />

        {/* Print Only Header */}
        <div className="print-only mb-8 text-center text-black">
          <h1 className="text-3xl font-black uppercase tracking-tight">Насжилтын тайлан</h1>
          <p className="mt-4 text-xl font-bold">{baiguullaga?.ner}</p>
          <p className="text-sm mt-1">Огноо: {ognoo?.format("YYYY-MM-DD") || "Өнөөдөр"}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print flex-shrink-0">
          <h1 className="text-2xl font-bold text-theme tracking-tight">Насжилтын тайлан</h1>
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
            <button onClick={() => window.print()} 
              className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm">
              <Printer className="w-4 h-4" /> Хэвлэх
            </button>
            <button onClick={exportToExcel}
              className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel татах
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden neu-panel p-4 bg-white dark:bg-slate-900/50 dark:border-slate-800 border 
          mb-1 neu-table allow-overflow flex flex-col min-h-0
        ">
          <div className="max-h-[60vh] overflow-auto custom-scrollbar relative">
            <table className="table-ui text-sm min-w-[1600px] w-full border-collapse">
              <thead className="sticky top-0 z-20 shadow-sm bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="w-12 sticky left-0 z-30 p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">№</th>
                  <th className="w-32 sticky left-12 z-30 p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Гэрээ</th>
                  <th className="text-center sticky left-44 z-30 p-3 text-xs text-theme whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Оршин суугч</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Давхар</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Тоот</th>
                  
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Нийт</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Хөнгөлөлт</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Төлсөн</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Авлага</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">0-30</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">31-60</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">61-90</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">91-120</th>
                  <th className="p-3 text-xs text-theme text-center whitespace-nowrap font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">120+</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} className="p-12 text-center"><div className="animate-spin inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={14} className="p-12 text-center text-theme/60 italic">Мэдээлэл олдсонгүй</td></tr>
                ) : filteredData.map((it, idx) => (
                  <tr key={it._id || idx} className="hover:bg-[color:var(--surface-hover)]/20 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                    <td className="p-3 text-center text-theme whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50">{((currentPage - 1) * pageSize) + idx + 1}</td>
                    <td className="p-3 text-center text-theme whitespace-nowrap font-bold sticky left-12 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50">{it.gereeniiDugaar || "-"}</td>
                    <td className="p-3 text-left text-theme whitespace-nowrap font-medium sticky left-44 z-10 bg-white dark:bg-slate-900 truncate max-w-[200px] border-r border-slate-100 dark:border-slate-800/50" title={it.ner}>{it.ner || "-"}</td>
                    <td className="p-3 text-center text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{it.davkhar || "-"}</td>
                    <td className="p-3 text-center text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{it.toot || it.talbainDugaar || "-"}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.undsenDun ?? it.niitDun)}</td>
                    <td className="p-3 text-right text-theme/60 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.khungulult)}</td>
                    <td className="p-3 text-right text-emerald-600 whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.tulsunDun)}</td>
                    <td className="p-3 text-right text-red-500 font-bold whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.uldegdel ?? it.tulukhDun)}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.p0_30 ?? it.avalaga0)}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.p31_60 ?? it.avlaga31)}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.p61_90 ?? it.avlaga61)}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-100 dark:border-slate-800/50">{formatNumber(it.p91_120 ?? it.avlaga91)}</td>
                    <td className="p-3 text-right text-theme whitespace-nowrap">{formatNumber(it.p120plus ?? it.avlaga120)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-slate-200 dark:border-slate-800">
                <tr className="bg-slate-50 dark:bg-slate-900 font-bold">
                  <td colSpan={5} className="p-3 text-center text-theme/70 uppercase tracking-widest text-xs sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">НИЙТ</td>
                  <td className="p-3 text-right text-theme whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.undsenDun)}</td>
                  <td className="p-3 text-right text-theme/60 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.khungulult)}</td>
                  <td className="p-3 text-right text-emerald-600 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.tulsunDun)}</td>
                  <td className="p-3 text-right text-red-600 bg-red-50/30 dark:bg-red-900/10 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">{formatNumber(totals.uldegdel)}</td>
                  <td className="p-3 text-right text-theme/70 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.p0_30)}</td>
                  <td className="p-3 text-right text-theme/70 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.p31_60)}</td>
                  <td className="p-3 text-right text-theme/70 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.p61_90)}</td>
                  <td className="p-3 text-right text-theme/70 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">{formatNumber(totals.p91_120)}</td>
                  <td className="p-3 text-right text-theme/70 whitespace-nowrap bg-slate-50 dark:bg-slate-900">{formatNumber(totals.p120plus)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print flex-shrink-0 mt-2">
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">Нийт: {summary?.count || filteredData.length}</div>
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-full text-red-500">Авлага: {formatNumber(totals.uldegdel)} ₮</div>
          </div>
          <div className="flex items-center gap-4">
            <PageSongokh value={pageSize} onChange={(v) => { setPageSize(v); setCurrentPage(1); }} className="!h-10 !rounded-2xl" />
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)} 
                className="px-4 py-1.5 rounded-2xl text-sm font-bold disabled:opacity-20 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300">Өмнөх</button>
              <div className="px-4 text-sm font-black text-emerald-600">{currentPage} / {Math.max(1, Math.ceil((summary?.count || filteredData.length) / pageSize))}</div>
              <button disabled={currentPage * pageSize >= (summary?.count || filteredData.length)} onClick={() => setCurrentPage(currentPage + 1)} 
                className="px-4 py-1.5 rounded-2xl text-sm font-bold disabled:opacity-20 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300">Дараах</button>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
