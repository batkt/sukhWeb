"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import { StandardPagination } from "@/components/ui/StandardTable";
import { ExcelButton } from "@/components/ui/ExcelButton";
import dayjs, { Dayjs } from "dayjs";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { useSearch } from "@/context/SearchContext";
import { NegtgelTailanTable, NegtgelTailanItem } from "./NegtgelTailanTable";
import FilterDatePicker from "@/components/ui/FilterDatePicker";

/** Сарын хүрээг [эхний сарын 1, сүүлийн сарын сүүлийн өдөр] болгоно */
const sarKhureeruu = (a: Dayjs, b: Dayjs): [string, string] => [
  a.startOf("month").format("YYYY-MM-DD"),
  b.endOf("month").format("YYYY-MM-DD"),
];
const odooginSar = (): [string, string] => sarKhureeruu(dayjs(), dayjs());

export default function NegtgelTailanPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();

  const baiguullagiinId = ajiltan?.baiguullagiinId ?? null;

  // Анхдагч: зөвхөн тухайн сар
  const [dateRange, setDateRange] = useState<[string, string]>(odooginSar);
  const [orts, setOrts] = useState("");
  // Хайлт — толгойн (Topbar) нэгдсэн хайлтаас, серверт илгээнэ
  const { searchTerm } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [exporting, setExporting] = useState(false);


  // Шүүлт өөрчлөгдөхөд эхний хуудас руу
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orts, dateRange, selectedBuildingId]);

  // Барилга солигдоход орцын сонголт хүчингүй болно
  useEffect(() => {
    setOrts("");
  }, [selectedBuildingId]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const swrKey = useMemo(() => {
    if (!token || !baiguullagiinId) return null;
    return [
      "/tailan/negtgel",
      token,
      baiguullagiinId,
      selectedBuildingId,
      dateRange[0],
      dateRange[1],
      searchTerm,
      orts,
      currentPage,
      pageSize,
    ];
  }, [
    token,
    baiguullagiinId,
    selectedBuildingId,
    dateRange,
    searchTerm,
    orts,
    currentPage,
    pageSize,
  ]);

  const { data: rawData, isLoading } = useSWR<{
    data: NegtgelTailanItem[];
    niitToo: number;
    niitDun: { niitTulukhDun: number; niitTulsunDun: number; niitUldegdel: number };
  }>(
    swrKey,
    async ([
      url,
      tkn,
      bId,
      barId,
      start,
      end,
      globalSearch,
      ortsVal,
      page,
      limit,
    ]: any) => {
      const resp = await uilchilgee(tkn).post(url, {
        baiguullagiinId: bId,
        ...(barId ? { barilgiinId: barId } : {}),
        ekhlekhOgnoo: start ? `${start} 00:00:00` : undefined,
        duusakhOgnoo: end ? `${end} 23:59:59` : undefined,
        search: globalSearch || undefined,
        orts: ortsVal || undefined,
        khuudasniiDugaar: page,
        khuudasniiKhemjee: limit,
      });
      return {
        data: Array.isArray(resp.data?.data) ? resp.data.data : [],
        niitToo: Number(resp.data?.niitToo ?? 0),
        // Хайлт/огнооны шүүлтийн дараах БҮХ бичлэгийн дүн (зөвхөн энэ
        // хуудсынх биш) — хөлд харуулна
        niitDun: {
          niitTulukhDun: Number(resp.data?.niitDun?.niitTulukhDun ?? 0),
          niitTulsunDun: Number(resp.data?.niitDun?.niitTulsunDun ?? 0),
          niitUldegdel: Number(resp.data?.niitDun?.niitUldegdel ?? 0),
        },
      };
    },
    { revalidateOnFocus: false },
  );

  const tailanGaralt: NegtgelTailanItem[] = rawData?.data ?? [];
  const totalCount = rawData?.niitToo ?? 0;

  // Search and pagination are server-side — tailanGaralt is already the paged result
  const pagedData = tailanGaralt;

  // Хөлийн дүн серверээс ирнэ. Өмнө нь useTulburFooterTotals-ийн БҮХ гэрээг
  // хамарсан дүнг харуулдаг байсан тул хайлт/хуудаслалттай үед хүснэгтийн
  // мөрүүдтэй огт таарахгүй байв.
  const niitUldegdel = rawData?.niitDun?.niitUldegdel ?? 0;

  // ── Excel export ────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    try {
      if (!token) return;
      setExporting(true);

      const response = await uilchilgee(token).post(
        "/tailan/export",
        {
          report: "negtgel",
          baiguullagiinId: baiguullagiinId ?? undefined,
          barilgiinId: selectedBuildingId ?? undefined,
          ekhlekhOgnoo: `${dateRange[0]} 00:00:00`,
          duusakhOgnoo: `${dateRange[1]} 23:59:59`,
          search: searchTerm || undefined,
          orts: orts || undefined,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Нэгтгэл_Тайлан_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Excel export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
   
    <div className="flex w-full flex-col gap-3 pb-14">
      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        <FilterDatePicker
          id="negtgel-date"
          picker="month"
          value={dateRange}
          onChange={(v: [Dayjs, Dayjs] | null) =>
            setDateRange(v ? sarKhureeruu(v[0], v[1]) : odooginSar())
          }
          placeholder="Сар сонгох"
          className="w-[220px]"
        />
        <ExcelButton
          className="ml-auto"
          onClick={exportToExcel}
          loading={exporting}
        />
      </div>

     
      <div className="w-full no-print">
        <NegtgelTailanTable
          data={pagedData}
          loading={isLoading}
          niitUldegdel={niitUldegdel}
          sarKhuree={[dateRange[0].slice(0, 7), dateRange[1].slice(0, 7)]}
        />
      </div>

      
      <div className="flex items-center justify-between no-print">
        <StandardPagination
          current={currentPage}
          total={totalCount}
          pageSize={pageSize}
          onChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setCurrentPage(1);
          }}
          pageSizeOptions={[50, 100, 200, 500, 1000]}
        />
      </div>
    </div>
  );
}
