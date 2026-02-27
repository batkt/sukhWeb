"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { FileSpreadsheet, Printer } from "lucide-react";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 1cm;
      }
      body * {
        visibility: hidden !important;
      }
      .print-container, .print-container * {
        visibility: visible !important;
      }
      .print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th, td {
        border: 1px solid #ddd !important;
        padding: 4px !important;
        font-size: 8pt !important;
      }
      .max-h-[45vh] {
        max-height: none !important;
        overflow: visible !important;
      }
      .custom-scrollbar {
        overflow: visible !important;
      }
    }
  `}</style>
);

interface SariinTulburItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  ner: string;
  toot: string;
  sar: string;
  on: number;
  tulbur: number;
  tuluv: string;
  period?: string;
}

export default function SariinTulburPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [data, setData] = useState<SariinTulburItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  const [formData, setFormData] = useState({
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    turul: "uliral",
    view: "delgerengui",
  });
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    toot: "",
    davkhar: "",
    gereeniiDugaar: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const fetchExpandedData = async (item: any) => {
    if (!baiguullaga || !selectedBuildingId) return;
    setExpandedLoading(true);
    setExpandedError(null);
    try {
      const isUliral = formData.turul === "uliral";
      let year: number;
      let month: number | null = null;

      if (item.period) {
        const [yPart, mPart] = item.period.split("-");
        year = parseInt(yPart, 10) || new Date().getFullYear();
        if (mPart?.startsWith("Q")) {
          month = parseInt(mPart.replace("Q", ""), 10) * 3; // Q4 -> 12
        } else {
          month = parseInt(mPart, 10) || null;
        }
      } else {
        year = item.on || new Date().getFullYear();
        month = item.sar ? parseInt(String(item.sar), 10) : null;
      }

      let ekhlekhOgnoo: string;
      let duusakhOgnoo: string;
      let expandLabel: string;

      if (isUliral) {
        // Fetch full year for Q1, Q2, Q3, Q4
        ekhlekhOgnoo = `${year}-01-01`;
        duusakhOgnoo = `${year}-12-31`;
        expandLabel = `${year} оны Q1, Q2, Q3, Q4`;
      } else {
        // Fetch all months from user's selected start up to and including clicked month
        const targetMonth = month || 1;
        const targetYear = year;
        const userStart = dateRange?.[0] || formData.ekhlekhOgnoo;
        ekhlekhOgnoo = userStart || `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        duusakhOgnoo = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        expandLabel = "Бүх сарууд";
      }

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/sariin-tulbur",
        {
          baiguullagiinId: baiguullaga._id,
          barilgiinId: selectedBuildingId,
          ekhlekhOgnoo,
          duusakhOgnoo,
          turul: isUliral ? "uliral" : "sar",
          view: "delgerengui",
          khuudasniiKhemjee: 1000,
          gereeniiDugaar: item.gereeniiDugaar || undefined,
          orshinSuugch: debouncedFilters.orshinSuugch || undefined,
          toot: debouncedFilters.toot || undefined,
          davkhar: debouncedFilters.davkhar || undefined,
        }
      );

      const rawList = response.data?.detailed?.list || [];
      const mapped = rawList.map((d: any) => {
        const invDate = d.ognoo ? new Date(d.ognoo) : null;
        const y = invDate?.getFullYear() || year;
        const m = invDate ? invDate.getMonth() + 1 : 0;
        const q = m ? Math.ceil(m / 3) : 0;
        const p = isUliral ? `${y}-Q${q}` : `${y}-${String(m).padStart(2, "0")}`;
        return {
          period: p,
          gereeniiDugaar: d.gereeniiDugaar || "",
          ner: [d.ovog, d.ner].filter(Boolean).join(" "),
          toot: d.toot || d.medeelel?.toot || d.nememjlekh?.toot || "-",
          tulbur: d.niitTulbur || 0,
          tuluv: d.tuluv || "Төлөөгүй",
        };
      });

      // Group by period for display
      const byPeriod = mapped.reduce((acc: Record<string, any[]>, r: any) => {
        const key = r.period;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});

      const rows = (Object.entries(byPeriod) as [string, any[]][])
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([periodKey, items]) =>
          items.map((r: any, i: number) => ({
            ...r,
            period: periodKey,
            isFirstInPeriod: i === 0,
            periodRowCount: items.length,
          }))
        );

      setExpandedData({
        label: expandLabel,
        rows,
        byPeriod,
        total: rows.reduce((s: number, r: any) => s + (r.tulbur || 0), 0),
      });
    } catch (e: any) {
      setExpandedError(e?.response?.data?.aldaa || e.message || "Unknown error");
      setExpandedData(null);
    } finally {
      setExpandedLoading(false);
    }
  };

  const handleExpandClick = (item: any) => {
    const key = `${item.gereeniiDugaar}-${item.period || item.sar}-${item.on}-${item._id}`;
    if (expandedRow === key) {
      setExpandedRow(null);
      setExpandedData(null);
      return;
    }
    setExpandedRow(key);
    fetchExpandedData(item);
  };

  const fetchData = async () => {
    if (!selectedBuildingId || !baiguullaga) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        ekhlekhOgnoo: dateRange?.[0] || formData.ekhlekhOgnoo,
        duusakhOgnoo: dateRange?.[1] || formData.duusakhOgnoo,
        turul: formData.turul,
        view: formData.view,
        khuudasniiKhemjee: 1000, // Get all data for client-side pagination
        orshinSuugch: debouncedFilters.orshinSuugch || undefined,
        toot: debouncedFilters.toot || undefined,
        davkhar: debouncedFilters.davkhar || undefined,
        gereeniiDugaar: debouncedFilters.gereeniiDugaar || undefined,
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/sariin-tulbur",
        payload
      );
      const fetchedData = response.data?.detailed?.list || [];
      // Map fields if they have different names in API
      const mappedData = Array.isArray(fetchedData)
        ? fetchedData.map((item: any) => {
            // Parse period "2025-11" to sar (month) and on (year)
            const [year, month] = item.period
              ? item.period.split("-")
              : ["", ""];

            return {
              ...item,
              tulbur: item.niitTulbur || item.tulbur || 0,
              sar: month || item.sar || "",
              on: parseInt(year) || item.on || "",
              bairNer: item.bairNer || "N/A", 
              toot: item.toot || item.medeelel?.toot || item.nememjlekh?.toot || "-",
            };
          })
        : [];
      // Sort newest-first (prefer createdAt then ognoo)
      const sortByNewest = (list: any[]) =>
        list.slice().sort((a: any, b: any) => {
          const getTime = (x: any) => {
            const d = x?.createdAt || x?.ognoo || x?.period;
            const t = d ? new Date(d).getTime() : NaN;
            return isNaN(t) ? 0 : t;
          };
          const ta = getTime(a);
          const tb = getTime(b);
          if (tb !== ta) return tb - ta;
          return String(b._id || "").localeCompare(String(a._id || ""));
        });

      setData(sortByNewest(mappedData));
    } catch (err: any) {
      setError(err?.response?.data?.aldaa || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setExpandedRow(null);
    setExpandedData(null);
  }, [selectedBuildingId, baiguullaga, token, formData, dateRange, debouncedFilters]);

  // Adjust date range based on selected type
  useEffect(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    if (formData.turul === "sar") {
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const endOfMonth = new Date(startYear, startMonth + 1, 0);

      // Only update if current end is outside the selected month
      if (endDate.getMonth() !== startMonth || endDate.getFullYear() !== startYear) {
        setDateRange([dateRange[0], endOfMonth.toISOString().split("T")[0]]);
      }
    } else if (formData.turul === "uliral") {
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const quarterEndMonth = startMonth + 3;
      const endOfQuarter = new Date(startYear, quarterEndMonth, 0);

      const currentDiffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
      
      // Only update if range is not approximately 3 months
      if (currentDiffMonths !== 3) {
        setDateRange([
          dateRange[0],
          endOfQuarter.toISOString().split("T")[0],
        ]);
      }
    }
  }, [formData.turul]); // Only run when type changes, or when dateRange changes specifically for correction

  const totalTulbur = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.tulbur || 0), 0);
  }, [data]);

  const exportToExcel = () => {
    if (!data.length) return;
    const headers = ["№", "Гэрээний дугаар", "Нэр", "Тоот", "Сар", "Он", "Төлбөр", "Төлөв"];
    const csvContent = [
      headers.join(","),
      ...data.map((item, idx) =>
        [
          idx + 1,
          `"${item.gereeniiDugaar || ""}"`,
          `"${item.ner || ""}"`,
          `"${item.toot || ""}"`,
          `"${item.sar || ""}"`,
          item.on || "",
          item.tulbur || 0,
          `"${item.tuluv || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sariin_tulbur_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 print-container h-full flex flex-col">
      <PrintStyles />
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Сарын төлбөр</h1>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel татах
          </button>
          <button
            onClick={handlePrint}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Хэвлэх
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 no-print">
          <div className="p-3 mt-6 rounded-xl">
            <DatePickerInput
              type="range"
              locale="mn"
              value={dateRange}
              onChange={setDateRange}
              size="sm"
              radius="md"
              variant="filled"
              dropdownType="popover"
              popoverProps={{
                position: "bottom-start",
                withinPortal: true,
                width: 320,
              }}
              clearable
              placeholder={
                formData.turul === "sar" ? "Сар сонгох" : "Улирал сонгох"
              }
              classNames={{
                input:
                  "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-full flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden",
              }}
            />
          </div>
          <div className="p-3 rounded-xl">
            <label className="block text-sm  text-theme/80 mb-1.5">Төрөл</label>
            <TusgaiZagvar
              value={formData.turul}
              onChange={(v: string) => setFormData({ ...formData, turul: v })}
              options={[
                { value: "sar", label: "Сар" },
                { value: "uliral", label: "Улирал" },
              ]}
              placeholder="Төрөл сонгох"
              className="h-[40px] w-full"
            />
          </div>
          <div className="p-3 rounded-xl">
            <label className="block text-sm  text-theme/80 mb-1.5">Оршин суугч</label>
            <input
              type="text"
              value={filters.orshinSuugch}
              onChange={(e) => setFilters((p) => ({ ...p, orshinSuugch: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Овог, нэрээр хайх"
            />
          </div>
          <div className="p-3 rounded-xl">
            <label className="block text-sm  text-theme/80 mb-1.5">Тоот</label>
            <input
              type="text"
              value={filters.toot}
              onChange={(e) => setFilters((p) => ({ ...p, toot: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Тоот"
            />
          </div>
          <div className="p-3 rounded-xl">
            <label className="block text-sm  text-theme/80 mb-1.5">Давхар</label>
            <input
              type="text"
              value={filters.davkhar}
              onChange={(e) => setFilters((p) => ({ ...p, davkhar: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Давхар"
            />
          </div>
          <div className="p-3 rounded-xl">
            <label className="block text-sm  text-theme/80 mb-1.5">Гэрээний дугаар</label>
            <input
              type="text"
              value={filters.gereeniiDugaar}
              onChange={(e) => setFilters((p) => ({ ...p, gereeniiDugaar: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="ГД"
            />
          </div>
        {/* <button
          type="submit"
          disabled={loading}
          className="neu-panel px-6 py-2 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? "Уншиж байна..." : "Хайх"}
        </button> */}
      </div>

      {error && <div className="text-red-500 mb-4">Алдаа: {error}</div>}

      {/* Summary Card */}
      {/* <div className="neu-panel p-4 rounded-xl mb-6">
        <h3 className=" mb-2">Нийт төлбөр</h3>
        <p className="text-2xl  text-blue-600">
          {formatNumber(totalTulbur)} ₮
        </p>
      </div> */}

      {/* Data Table */}
      <div className=" overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[45vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Гэрээний дугаар
                  </th>
                  {/* <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Байрны нэр
                  </th> */}
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Сар
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Он
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлбөр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-theme/70">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-theme/60">
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : (
                  data
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((item, idx) => {
                      const rowKey = `${item.gereeniiDugaar}-${item.period || item.sar}-${item.on}-${item._id}`;
                      const isExpanded = expandedRow === rowKey;
                      return (
                        <React.Fragment key={item._id || rowKey}>
                          <tr
                            className="transition-colors border-b last:border-b-0"
                          >
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {item.gereeniiDugaar}
                            </td>
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {item.ner}
                            </td>
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {item.toot}
                            </td>
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {item.sar}
                            </td>
                            <td className="p-3 border-r text-center text-theme whitespace-nowrap">
                              {item.on}
                            </td>
                            <td className="p-3 border-r text-right text-theme whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleExpandClick(item)}
                                className=" hover:underline cursor-pointer flex items-center justify-center gap-1 ml-auto"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                {formatNumber(item.tulbur)} ₮
                              </button>
                            </td>
                            <td className="p-3 text-center text-theme whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs  ${
                                  item.tuluv === "Төлсөн"
                                    ? "badge-paid"
                                    : item.tuluv === "Төлөөгүй"
                                    ? "badge-unpaid"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {item.tuluv}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-4 bg-[color:var(--surface-hover)]/30 border-b"
                              >
                                {expandedLoading ? (
                                  <div className="py-4 text-center">
                                    Уншиж байна...
                                  </div>
                                ) : expandedError ? (
                                  <div className="text-red-500 py-2">
                                    Алдаа: {expandedError}
                                  </div>
                                ) : expandedData ? (
                                  <div className="space-y-3">
                                    <h4 className=" text-sm">
                                      {formData.turul === "uliral"
                                        ? `${item.gereeniiDugaar} — ${expandedData.label}`
                                        : `${item.gereeniiDugaar} — ${expandedData.label}`}
                                    </h4>
                                    <table className="min-w-full text-sm">
                                      <thead>
                                        <tr>
                                          <th className="text-left p-2 border-r">№</th>
                                          <th className="text-center p-2 border-r">
                                            {formData.turul === "uliral"
                                              ? "Улирал"
                                              : "Сар"}
                                          </th>
                                          <th className="text-center border-r p-2">Тоот</th>
                                          <th className="text-center border-r p-2">Нэр</th>
                                          <th className="text-center border-r p-2">
                                            Төлбөр
                                          </th>
                                          <th className="text-center p-2">
                                            Төлөв
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {expandedData.rows.map(
                                          (r: any, ri: number) => (
                                            <tr key={ri} className="border-t">
                                                <td className="p-2 border-r">{ri + 1}</td>
                                                <td className="p-2 border-r">
                                                  {r.period}
                                                </td>
                                                <td className="p-2 border-r text-center">{r.toot}</td>
                                                <td className="p-2">{r.ner}</td>
                                              <td className="p-2 text-right border-r border-l">
                                                {formatNumber(r.tulbur || 0)}{" "}
                                                ₮
                                              </td>
                                              <td className="p-2 text-center">
                                                {r.tuluv}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                        <tr className="border-t-2 ">
                                          <td colSpan={3} className="p-2">
                                            Нийт
                                          </td>
                                          <td className="p-2 text-right">
                                            {formatNumber(
                                              expandedData.total || 0
                                            )}{" "}
                                            ₮
                                          </td>
                                          <td className="p-2"></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t dark:border-gray-800 border-gray-100">
            <table className="text-sm min-w-full">
              <tbody>
                <tr>
                  <td className="p-3 text-center text-theme whitespace-nowrap w-12"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-right text-theme whitespace-nowrap ">
                    Нийт: {formatNumber(totalTulbur)} ₮
                  </td>
                  <td className="p-3 text-right text-theme whitespace-nowrap "></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="text-sm text-theme/70">Нийт: {data.length}</div>
        <div className="flex items-center gap-3">
          <PageSongokh
            value={pageSize}
            onChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            className="text-xs"
          />
          <div className="flex items-center gap-1">
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Өмнөх
            </button>
            <div className="text-theme/70 px-1">{currentPage}</div>
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage * pageSize >= data.length}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
