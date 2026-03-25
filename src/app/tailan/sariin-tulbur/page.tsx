"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import { useGereeJagsaalt } from "@/lib/useGeree";
import { SariinTulburTable, SariinTulburItem } from "./SariinTulburTable";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 0.5cm;
      }
      body * {
        visibility: hidden !important;
      }
      .print-container,
      .print-container * {
        visibility: visible !important;
      }
      .print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }

      .max-h-[45vh],
      .custom-scrollbar {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
      }
      .neu-panel,
      .neu-table {
        box-shadow: none !important;
        border: 1px solid #eee !important;
        background: white !important;
      }

      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        font-size: 8pt !important;
      }
      th,
      td {
        border: 1px solid #ddd !important;
        padding: 4px 2px !important;
        white-space: normal !important;
      }
      th {
        background-color: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
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

interface SariinTulburItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  ner: string;
  toot: string;
  davkhar: string;
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
    ajiltan?.baiguullagiinId || null,
  );
  const [data, setData] = useState<SariinTulburItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  const footerTotals = useTulburFooterTotals(
    token,
    ajiltan?.baiguullagiinId ?? null,
    selectedBuildingId || undefined,
  );

  const emptyQuery = useMemo(() => ({}), []);
  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    ajiltan?.baiguullagiinId ?? undefined,
    selectedBuildingId || undefined,
  );

  const contractsByNumber = useMemo(() => {
    const map: Record<string, any> = {};
    (gereeGaralt?.jagsaalt || []).forEach((g: any) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const [formData, setFormData] = useState({
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    turul: "uliral",
    view: "delgerengui",
  });
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    gereeniiDugaar: "",
    ner: "",
    davkhar: "",
    ognoo: "",
    toot: "",
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
    if (!baiguullaga?._id || !item.gereeniiId) return;
    setExpandedLoading(true);
    setExpandedError(null);
    try {
      const resp = await uilchilgee(token ?? undefined).get(
        `/geree/${item.gereeniiId}/history-ledger`,
        {
          params: {
            baiguullagiinId: baiguullaga._id,
            ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}),
            _t: Date.now(),
          },
        },
      );
      const ledger = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt
        : Array.isArray(resp.data?.ledger)
          ? resp.data.ledger
          : Array.isArray(resp.data)
            ? resp.data
            : [];

      setExpandedData({
        rows: ledger,
        totalAvlaga: ledger.reduce(
          (s: number, r: any) =>
            s + (Number(r?.avlagaDun ?? r?.tulukhDun ?? r?.debit ?? 0) || 0),
          0,
        ),
        totalTulult: ledger.reduce(
          (s: number, r: any) =>
            s + (Number(r?.tulsunDun ?? r?.tulult ?? r?.credit ?? 0) || 0),
          0,
        ),
        lastUldegdel:
          ledger.length > 0
            ? Number(ledger[ledger.length - 1]?.uldegdel ?? 0)
            : 0,
      });
    } catch (e: any) {
      setExpandedError(
        e?.response?.data?.aldaa || e.message || "Unknown error",
      );
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
        khuudasniiKhemjee: 1000,
        orshinSuugch: debouncedFilters.orshinSuugch || undefined,
        toot: debouncedFilters.toot || undefined,
        davkhar: debouncedFilters.davkhar || undefined,
        gereeniiDugaar: debouncedFilters.gereeniiDugaar || undefined,
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/sariin-tulbur",
        payload,
      );
      const fetchedData = response.data?.detailed?.list || [];
      const mappedData = Array.isArray(fetchedData)
        ? fetchedData.map((item: any) => {
            // Parse period "2025-11" to sar (month) and on (year)
            const [year, month] = item.period
              ? item.period.split("-")
              : ["", ""];

            // Check contract for fallback tooth
            const ct = contractsByNumber[String(item.gereeniiDugaar)];
            const resolvedToot =
              item.toot ||
              item.medeelel?.toot ||
              item.nememjlekh?.toot ||
              ct?.toot ||
              item.davkhar ||
              item.medeelel?.davkhar ||
              item.nememjlekh?.davkhar ||
              ct?.davkhar;
            const resolvedDavkhar =
              item.davkhar ||
              item.medeelel?.davkhar ||
              item.nememjlekh?.davkhar ||
              ct?.davkhar;
            return {
              ...item,
              tulbur: item.niitTulbur || item.tulbur || 0,
              sar: month || item.sar || "",
              on: parseInt(year) || item.on || "",
              bairNer: item.bairNer || "N/A",
              toot: resolvedToot,
              davkhar: resolvedDavkhar,
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
  }, [
    selectedBuildingId,
    baiguullaga,
    token,
    formData,
    dateRange,
    debouncedFilters,
  ]);

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
      if (
        endDate.getMonth() !== startMonth ||
        endDate.getFullYear() !== startYear
      ) {
        setDateRange([dateRange[0], endOfMonth.toISOString().split("T")[0]]);
      }
    } else if (formData.turul === "uliral") {
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();
      const quarterEndMonth = startMonth + 3;
      const endOfQuarter = new Date(startYear, quarterEndMonth, 0);

      const currentDiffMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) +
        1;

      // Only update if range is not approximately 3 months
      if (currentDiffMonths !== 3) {
        setDateRange([dateRange[0], endOfQuarter.toISOString().split("T")[0]]);
      }
    }
  }, [formData.turul]); // Only run when type changes, or when dateRange changes specifically for correction

  const totalTulbur = footerTotals.totalUldegdel;

  const exportToExcel = () => {
    if (!data.length) return;

    // 1. Metadata Rows
    const buildingName = baiguullaga?.ner || "";
    const dateStr =
      dateRange?.[0] && dateRange?.[1]
        ? `${new Date(dateRange[0]).toLocaleDateString("mn-MN")} - ${new Date(dateRange[1]).toLocaleDateString("mn-MN")}`
        : "Бүх хугацаа";

    const metaRows = [
      ["Сарын төлбөрийн тайлан"],
      [`Байгууллага: ${buildingName}`],
      [`Төрөл: ${formData.turul === "sar" ? "Сар" : "Улирал"}`],
      [`Огноо: ${dateStr}`],
      [`Тайлан татсан: ${new Date().toLocaleString("mn-MN")}`],
      [""],
      ["Нийт үлдэгдэл:", totalTulbur, ""],
      [""],
    ];

    // 2. Headers
    const headers = ["№", "Гэрээний дугаар", "Нэр", "Тоот", "Давхар", "Төлбөр"];

    // 3. Data Rows
    const rows = data.map((item, idx) => [
      idx + 1,
      item.gereeniiDugaar || "",
      item.ner || "",
      item.toot || "",
      item.davkhar || "",
      item.tulbur || 0,
    ]);

    const escapeCsv = (val: any) => {
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      ...metaRows.map((r) => r.map(escapeCsv).join(",")),
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => r.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sariin_tulbur_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 print-container bg-[color:var(--surface-bg)] min-h-screen h-full flex flex-col">
      <PrintStyles />

      {/* Print-only Header */}
      <div className="print-only mb-6">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase">
              Сарын төлбөрийн тайлан
            </h1>
            <p className="text-sm mt-1">
              {baiguullaga?.ner || "Байгууллагын нэр"}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              Огноо:{" "}
              {dateRange?.[0] && dateRange?.[1]
                ? `${new Date(dateRange[0]).toLocaleDateString("mn-MN")} - ${new Date(dateRange[1]).toLocaleDateString("mn-MN")}`
                : "Бүх хугацаа"}
            </p>
            <p>Төрөл: {formData.turul === "sar" ? "Сар" : "Улирал"}</p>
            <p>Хэвлэсэн: {new Date().toLocaleString("mn-MN")}</p>
          </div>
        </div>

        <div className="mt-6 border p-4 rounded bg-gray-50 flex justify-between items-center">
          <p className="font-semibold text-gray-700">НИЙТ ҮЛДЭГДЭЛ:</p>
          <p className="text-2xl font-bold text-red-600">
            {formatNumber(totalTulbur)}{" "}
          </p>
        </div>
      </div>
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
          {/* <button
            onClick={handlePrint}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Хэвлэх
          </button> */}
        </div>
      </div>
      <div className="flex flex-col md:flex-row flex-wrap gap-4 no-print items-end">
        <div className="rounded-xl btn-minimal h-[40px] w-full md:w-[320px] flex items-center px-3">
          <StandardDatePicker
            isRange={true}
            value={dateRange}
            onChange={setDateRange}
            allowClear
            placeholder={
              formData.turul === "sar" ? "Сар сонгох" : "Улирал сонгох"
            }
            className="!h-full !w-full text-theme !px-0 flex items-center justify-center text-center border-0 shadow-none"
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
          <label className="block text-sm  text-theme/80 mb-1.5">
            Оршин суугч
          </label>
          <input
            type="text"
            value={filters.orshinSuugch}
            onChange={(e) =>
              setFilters((p) => ({ ...p, orshinSuugch: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Овог, нэрээр хайх"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Тоот</label>
          <input
            type="text"
            value={filters.toot}
            onChange={(e) =>
              setFilters((p) => ({ ...p, toot: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Тоот"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">Давхар</label>
          <input
            type="text"
            value={filters.davkhar}
            onChange={(e) =>
              setFilters((p) => ({ ...p, davkhar: e.target.value }))
            }
            className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
            placeholder="Давхар"
          />
        </div>
        <div className="p-3 rounded-xl">
          <label className="block text-sm  text-theme/80 mb-1.5">
            Гэрээний дугаар
          </label>
          <input
            type="text"
            value={filters.gereeniiDugaar}
            onChange={(e) =>
              setFilters((p) => ({ ...p, gereeniiDugaar: e.target.value }))
            }
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
          {formatNumber(totalTulbur)} 
        </p>
      </div> */}

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-3 allow-overflow">
          <SariinTulburTable
            data={data.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize,
            )}
            loading={loading}
            page={currentPage}
            pageSize={pageSize}
            expandedRow={expandedRow}
            expandedData={expandedData}
            expandedLoading={expandedLoading}
            expandedError={expandedError}
            onExpandClick={handleExpandClick}
            totalTulbur={totalTulbur}
          />
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
