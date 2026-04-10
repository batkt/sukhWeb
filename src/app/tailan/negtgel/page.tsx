"use client";

import React, { useState, useMemo } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { StandardPagination } from "@/components/ui/StandardTable";
import formatNumber from "tools/function/formatNumber";
import { FileSpreadsheet } from "lucide-react";
import { getDefaultDateRange } from "@/lib/utils";
import dayjs from "dayjs";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import { useSearch } from "@/context/SearchContext";
import {
  NegtgelTailanTable,
  NegtgelTailanItem,
  AvlagaItem,
} from "./NegtgelTailanTable";

export default function NegtgelTailanPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );

  const baiguullagiinId = ajiltan?.baiguullagiinId ?? null;

  const [dateRange, setDateRange] = useState<[any, any] | undefined>(getDefaultDateRange);
  const [searchText, setSearchText] = useState("");
  const { searchTerm } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Authoritative totals from the same source as the tulbur page
  const footerTotals = useTulburFooterTotals(
    token,
    baiguullagiinId,
    selectedBuildingId || undefined,
    dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null,
    dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null
  );

  // ── Data fetching ────────────────────────────────────────────────────────
  const swrKey = useMemo(() => {
    if (!token || !baiguullagiinId) return null;
    return [
      "/tailan/negtgel",
      token,
      baiguullagiinId,
      selectedBuildingId,
      dateRange?.[0] || "",
      dateRange?.[1] || "",
      searchText,
      searchTerm,
      currentPage,
      pageSize,
    ];
  }, [
    token,
    baiguullagiinId,
    selectedBuildingId,
    dateRange,
    searchText,
    searchTerm,
    currentPage,
    pageSize,
  ]);

  const { data: rawData, isLoading } = useSWR<{
    data: NegtgelTailanItem[];
    niitToo: number;
  }>(
    swrKey,
    async ([
      url,
      tkn,
      bId,
      barId,
      start,
      end,
      search,
      globalSearch,
      page,
      limit,
    ]: any) => {
      const s = start ? dayjs(start).format("YYYY-MM-DD") : "";
      const e = end ? dayjs(end).format("YYYY-MM-DD") : "";

      const resp = await uilchilgee(tkn).post(url, {
        baiguullagiinId: bId,
        ...(barId ? { barilgiinId: barId } : {}),
        ekhlekhOgnoo: s ? `${s} 00:00:00` : undefined,
        duusakhOgnoo: e ? `${e} 23:59:59` : undefined,
        search: search || globalSearch || undefined,
        khuudasniiDugaar: page,
        khuudasniiKhemjee: limit,
      });
      return {
        data: Array.isArray(resp.data?.data) ? resp.data.data : [],
        niitToo: Number(resp.data?.niitToo ?? 0),
      };
    },
    { revalidateOnFocus: false },
  );

  const tailanGaralt: NegtgelTailanItem[] = rawData?.data ?? [];
  const totalCount = rawData?.niitToo ?? 0;

  // Search and pagination are server-side — tailanGaralt is already the paged result
  const filteredData = tailanGaralt;
  const pagedData = tailanGaralt;

  // ── Summary totals (current page) ────────────────────────────────────
  const grandTotal = tailanGaralt.reduce(
    (s, row) => s + (Number(row.niitTulukhDun) || 0),
    0,
  );

  // ── Excel export ────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    try {
      if (!token) return;

      const response = await uilchilgee(token).post(
        "/tailan/export",
        {
          report: "negtgel",
          baiguullagiinId: baiguullagiinId ?? undefined,
          barilgiinId: selectedBuildingId ?? undefined,
          ekhlekhOgnoo: `${dateRange?.[0] || ""} 00:00:00`,
          duusakhOgnoo: `${dateRange?.[1] || ""} 23:59:59`,
          search: searchText || searchTerm || undefined,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `negtgel_tailan_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Excel export error:", error);
    }
  };

  return (
    <div className="p-6 bg-[color:var(--surface-bg)] min-h-full h-auto w-full custom-scrollbar">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Нэгтгэл тайлан</h1>
      </div>


      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center no-print mb-4">
        <div
          id="negtgel-date"
          className="btn-minimal h-[40px] w-full sm:w-[320px] flex items-center px-3"
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
        <button
          onClick={exportToExcel}
          className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel татах
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="w-full no-print">
        <NegtgelTailanTable data={pagedData} loading={isLoading} authoritativeTotalUldegdel={footerTotals.totalUldegdel || 0} />
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between no-print mt-3">
        <StandardPagination
          current={currentPage}
          total={totalCount}
          pageSize={pageSize}
          onChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setCurrentPage(1);
          }}
          pageSizeOptions={[50, 100, 200, 500]}
        />
      </div>
    </div>
  );
}
