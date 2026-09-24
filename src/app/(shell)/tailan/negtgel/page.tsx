"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { StandardPagination } from "@/components/ui/StandardTable";
import { ExcelButton } from "@/components/ui/ExcelButton";
import dayjs, { Dayjs } from "dayjs";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { useSearch } from "@/context/SearchContext";
import { NegtgelTailanTable, NegtgelTailanItem } from "./NegtgelTailanTable";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import FilterSelect from "@/components/ui/FilterSelect";

/** Сарын хүрээг [эхний сарын 1, сүүлийн сарын сүүлийн өдөр] болгоно */
const sarKhureeruu = (a: Dayjs, b: Dayjs): [string, string] => [
  a.startOf("month").format("YYYY-MM-DD"),
  b.endOf("month").format("YYYY-MM-DD"),
];
const odooginSar = (): [string, string] => sarKhureeruu(dayjs(), dayjs());

/** Барилгын тохиргооны `orts`-ийг (тоо / массив / мөр) жагсаалт болгоно */
function ortsJagsaalt(tok: any): string[] {
  if (Array.isArray(tok)) return tok.map(String).filter(Boolean);
  if (typeof tok === "number" && tok > 0)
    return Array.from({ length: tok }, (_, i) => String(i + 1));
  if (typeof tok === "string") {
    const s = tok.trim();
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      return Array.from({ length: n }, (_, i) => String(i + 1));
    }
    return s.split(/[\s,;|]+/).filter(Boolean);
  }
  return [];
}

export default function NegtgelTailanPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );

  const baiguullagiinId = ajiltan?.baiguullagiinId ?? null;

  // Анхдагч: зөвхөн тухайн сар
  const [dateRange, setDateRange] = useState<[string, string]>(odooginSar);
  // Оршин суугч (нэр, утас, тоот...) — бичих үед 400ms хүлээж хайна
  // Оршин суугчийн dropdown-оос сонгосон утга (утас эсвэл нэр) — сервер хайлтад явна
  const [searchText, setSearchText] = useState("");
  const [orshinSuugchSongolt, setOrshinSuugchSongolt] = useState<
    { value: string; label: string; tailbar?: string }[]
  >([]);
  const [orts, setOrts] = useState("");
  const { searchTerm } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [exporting, setExporting] = useState(false);


  // Шүүлт өөрчлөгдөхөд эхний хуудас руу
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, searchTerm, orts, dateRange, selectedBuildingId]);

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
      searchText,
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
    searchText,
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
      search,
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
        search: search || globalSearch || undefined,
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

  // ── Оршин суугчийн сонголтууд ────────────────────────────────────────
  // Шүүлтгүй ирсэн мөрүүдээс цуглуулна (оршин суугч сонгосны дараа жагсаалт
  // багасахгүйн тулд хадгалж үлдээнэ). Барилга/орц/сар солигдоход шинэчлэгдэнэ.
  useEffect(() => {
    if (searchText || !rawData) return;
    const map = new Map<string, { value: string; label: string; tailbar?: string }>();
    (rawData.data || []).forEach((r: any) => {
      const ner = String(r._id?.ner || r.ner || "").trim();
      if (!ner) return;
      const ovog = String(r._id?.ovog || r.ovog || "").trim();
      const utas = String(r._id?.utas || r.utas || "").trim();
      const toot = String(r._id?.toot || r.toot || "").trim();
      const value = utas || ner;
      if (map.has(value)) return;
      map.set(value, {
        value,
        label: [ovog ? `${ovog.charAt(0)}.` : "", ner].filter(Boolean).join(" "),
        tailbar: toot ? `${toot} тоот` : utas || undefined,
      });
    });
    setOrshinSuugchSongolt(
      Array.from(map.values()).sort((x, y) => x.label.localeCompare(y.label)),
    );
  }, [rawData, searchText]);

  // ── Орцын сонголтууд ───────────────────────────────────────────────────
  // Барилгын тохиргооноос; тохиргоогүй бол ирсэн мөрүүдээс цуглуулна
  const ortsOptions = useMemo(() => {
    const barilguud: any[] = (baiguullaga as any)?.barilguud || [];
    const songogdson = selectedBuildingId
      ? barilguud.filter((b) => String(b?._id) === String(selectedBuildingId))
      : barilguud;
    const set = new Set<string>();
    songogdson.forEach((b) => ortsJagsaalt(b?.tokhirgoo?.orts).forEach((o) => set.add(o)));
    if (set.size === 0) {
      tailanGaralt.forEach((r) => {
        const o = String(r._id?.orts || r.orts || "").trim();
        if (o) set.add(o);
      });
    }
    if (orts) set.add(orts);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [baiguullaga, selectedBuildingId, tailanGaralt, orts]);

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
          search: searchText || searchTerm || undefined,
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
    // Бусад хуудастай ижил бүрхүүл — нэмэлт `p-6`/цагаан дэвсгэргүй.
    // Гарчиг нь толгой хэсэгт («Тайлан — Нэгтгэл») байгаа тул давхарлахгүй
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
        <FilterSelect
          id="negtgel-orshinSuugch"
          label="Оршин суугч"
          value={searchText}
          onChange={setSearchText}
          options={orshinSuugchSongolt}
          searchable
          searchPlaceholder="Нэр, утас, тоот..."
          className="max-w-[280px]"
        />
        <FilterSelect
          id="negtgel-orts"
          label="Орц"
          value={orts}
          onChange={setOrts}
          options={ortsOptions.map((o) => ({ value: o, label: o }))}
          className="max-w-[200px]"
        />
        <ExcelButton
          className="ml-auto"
          onClick={exportToExcel}
          loading={exporting}
        />
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="w-full no-print">
        <NegtgelTailanTable
          data={pagedData}
          loading={isLoading}
          niitUldegdel={niitUldegdel}
          sarKhuree={[dateRange[0].slice(0, 7), dateRange[1].slice(0, 7)]}
        />
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
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
