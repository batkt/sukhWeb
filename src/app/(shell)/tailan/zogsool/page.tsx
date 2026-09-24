"use client";

import React, { useState, useEffect, useMemo } from "react";
import Table from "@/components/ui/table";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import formatNumber from "../../../../../tools/function/formatNumber";
import { Printer, Search } from "lucide-react";
import ExcelButton from "@/components/ui/ExcelButton";
import { getDefaultDateRange } from "@/lib/utils";
import { useSearch } from "@/context/SearchContext";

/** Серверээс ирсэн ISO огноог хүснэгтэд харуулах хэлбэрт оруулна. */
function ognooKharuul(utga: any, tsagtaiEsekh = true): string {
  if (!utga) return "-";
  const d = new Date(utga);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  const ognoo = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return tsagtaiEsekh ? `${ognoo} ${p(d.getHours())}:${p(d.getMinutes())}` : ognoo;
}

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
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th,
      td {
        border: 1px solid #ddd !important;
        padding: 4px !important;
        font-size: 8pt !important;
      }
      .max-h-[30vh] {
        max-height: none !important;
        overflow: visible !important;
      }
      .custom-scrollbar {
        overflow: visible !important;
      }
    }
  `}</style>
);

interface ResidentSummaryRow {
  orshinSuugchiinId: string;
  ner: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  utas?: string;
  urisanMachinToo: number;
  niitTulbur: number;
  khungulultMinut: number;
  tulsunDun: number;
  uldegdelTulbur: number;
}

interface GuestDetailRow {
  mashiniiDugaar: string;
  ognoo?: string | null;
  garsanOgnoo?: string | null;
  zogssonMinut: number;
  khungulsunMinut: number;
  tulbur: number;
  tuluv: string;
  ner?: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  utas?: string;
}

interface GuestCarRow {
  mashiniiDugaar: string;
  orshinSuugchiinNer: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  utas?: string;
  suuliinIrsenOgnoo?: string | null;
  irsenToo?: number;
}

export default function ZogsoolTailanPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );
  const { searchTerm } = useSearch();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const [filters, setFilters] = useState({
    orshinSuugch: "",
  });
  // Хайлтын талбар — 400мс хүлээж байж серверт илгээнэ
  const [khaikh, setKhaikh] = useState("");
  useEffect(() => {
    const t = setTimeout(
      () => setFilters((f) => (f.orshinSuugch === khaikh.trim() ? f : { ...f, orshinSuugch: khaikh.trim() })),
      400,
    );
    return () => clearTimeout(t);
  }, [khaikh]);
  const [apiResponse, setApiResponse] = useState<{
    residentSummary: ResidentSummaryRow[];
    niit: {
      urisanMachinToo: number;
      niitTulbur: number;
      khungulultMinut: number;
      tulsunDun: number;
      uldegdelTulbur: number;
    };
    guestCarList: GuestCarRow[];
    selectedDetail: GuestDetailRow[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "residentSummary" | "guestDetail" | "guestCarList"
  >("residentSummary");
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBuildingId || !baiguullaga) return;

      try {
        setLoading(true);
        const response = await uilchilgee(token ?? undefined).post(
          "/tailan/zogsool",
          {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: selectedBuildingId,
            ekhlekhOgnoo: dateRange?.[0] || undefined,
            duusakhOgnoo: dateRange?.[1] || undefined,
            orshinSuugch: filters.orshinSuugch || searchTerm || undefined,
          },
        );
        setApiResponse(response.data);
        setSelectedResidentId(null);
        setActiveTab("residentSummary");
      } catch (err: any) {
        setError(
          err?.response?.data?.aldaa ||
            err?.response?.data?.message ||
            err.message ||
            "Алдаа гарлаа",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBuildingId, baiguullaga, token, dateRange, filters, searchTerm]);

  const residentSummary = apiResponse?.residentSummary || [];
  const niit = apiResponse?.niit || {
    urisanMachinToo: 0,
    niitTulbur: 0,
    khungulultMinut: 0,
    tulsunDun: 0,
    uldegdelTulbur: 0,
  };
  const guestCarList = apiResponse?.guestCarList || [];
  const selectedDetail = apiResponse?.selectedDetail || null;

  const handleResidentClick = async (orshinSuugchiinId: string) => {
    if (selectedResidentId === orshinSuugchiinId) {
      setSelectedResidentId(null);
      setApiResponse((prev) =>
        prev ? { ...prev, selectedDetail: null } : null,
      );
      return;
    }
    setSelectedResidentId(orshinSuugchiinId);
    const resident = residentSummary.find(
      (r) => r.orshinSuugchiinId === orshinSuugchiinId,
    );
    if (!resident) return;
    setDetailLoading(true);
    try {
      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/zogsool",
        {
          baiguullagiinId: baiguullaga?._id,
          barilgiinId: selectedBuildingId,
          ekhlekhOgnoo: dateRange?.[0] || undefined,
          duusakhOgnoo: dateRange?.[1] || undefined,
          orshinSuugch: resident.ner,
        },
      );
      setApiResponse((prev) =>
        prev
          ? { ...prev, selectedDetail: response.data?.selectedDetail || null }
          : null,
      );
    } catch {
      setSelectedResidentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const displayDetail = useMemo(() => {
    if (!selectedResidentId) return null;
    if (detailLoading) return null;
    return selectedDetail;
  }, [selectedResidentId, selectedDetail, detailLoading]);

  const selectedResident = residentSummary.find(
    (r) => r.orshinSuugchiinId === selectedResidentId,
  );

  const exportToExcel = () => {
    let headers: string[] = [];
    let dataToExport: any[] = [];
    let fileName = "";

    if (activeTab === "residentSummary") {
      headers = [
        "№",
        "Оршин суугч",
        "Утасны дугаар",
        "Орц",
        "Давхар",
        "Тоот",
        "Урьсан машин тоо",
        "Нийт төлөх",
        "Хөнгөлөлт Минут",
        "Төлсөн дүн",
        "Үлдэгдэл төлбөр",
      ];
      dataToExport = residentSummary.map((row, idx) => [
        idx + 1,
        `"${row.ner || ""}"`,
        `"${row.utas || ""}"`,
        `"${row.orts || ""}"`,
        `"${row.davkhar || ""}"`,
        `"${row.toot || ""}"`,
        row.urisanMachinToo,
        row.niitTulbur,
        row.khungulultMinut,
        row.tulsunDun,
        row.uldegdelTulbur,
      ]);
      // Append summary total row
      dataToExport.push([
        "НИЙТ",
        '""',
        '""',
        '""',
        '""',
        '""',
        niit.urisanMachinToo,
        niit.niitTulbur,
        niit.khungulultMinut,
        niit.tulsunDun,
        niit.uldegdelTulbur,
      ]);
      fileName = "Зогсоолын_оршин_суугчдын_нэгтгэл";
    } else if (activeTab === "guestDetail") {
      headers = [
        "№",
        "Огноо",
        "Машины дугаар",
        "Зогссон минут",
        "Хөнгөлсөн минут",
        "Төлбөр",
        "Төлөв",
      ];
      const detailList = displayDetail || [];
      const totalZogsson = detailList.reduce((s, r) => s + (r.zogssonMinut || 0), 0);
      const totalKhungulsun = detailList.reduce((s, r) => s + (r.khungulsunMinut || 0), 0);
      const totalTulbur = detailList.reduce((s, r) => s + (r.tulbur || 0), 0);

      dataToExport = detailList.map((row, idx) => [
        idx + 1,
        `"${ognooKharuul(row.ognoo)}"`,
        `"${row.mashiniiDugaar || ""}"`,
        row.zogssonMinut,
        row.khungulsunMinut,
        row.tulbur,
        `"${row.tuluv || ""}"`,
      ]);
      // Append summary total row
      dataToExport.push([
        "НИЙТ",
        '""',
        '""',
        totalZogsson,
        totalKhungulsun,
        totalTulbur,
        '""',
      ]);
      fileName = "Зогсоолын_зочдын_дэлгэрэнгүй";
    } else {
      headers = [
        "№",
        "Машины дугаар",
        "Оршин суугчийн нэр",
        "Утасны дугаар",
        "Орц",
        "Давхар",
        "Тоот",
        "Ирсэн тоо",
        "Сүүлд ирсэн",
      ];
      dataToExport = guestCarList.map((row, idx) => [
        idx + 1,
        `"${row.mashiniiDugaar || ""}"`,
        `"${row.orshinSuugchiinNer || ""}"`,
        `"${row.utas || ""}"`,
        `"${row.orts || ""}"`,
        `"${row.davkhar || ""}"`,
        `"${row.toot || ""}"`,
        row.irsenToo ?? "",
        `"${ognooKharuul(row.suuliinIrsenOgnoo)}"`,
      ]);
      fileName = "Зогсоолын_зочдын_жагсаалт";
    }

    const csvContent = [
      headers.join(","),
      ...dataToExport.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${fileName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Define columns for Ant Design Tables
  const residentSummaryColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 40,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Оршин суугч",
        dataIndex: "ner",
        key: "ner",
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px] font-medium">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Утас",
        dataIndex: "utas",
        key: "utas",
        align: "center" as const,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Орц",
        dataIndex: "orts",
        key: "orts",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px] font-medium">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Урьсан машин тоо",
        dataIndex: "urisanMachinToo",
        key: "urisanMachinToo",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val}
          </span>
        ),
      },
      {
        title: "Нийт төлөх",
        dataIndex: "niitTulbur",
        key: "niitTulbur",
        align: "right" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {Number(val) > 0 ? formatNumber(val) : <span className="text-[color:var(--muted-text)]">0</span>}
          </span>
        ),
      },
      {
        title: "Хөнгөлсөн минут",
        dataIndex: "khungulultMinut",
        key: "khungulultMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Төлсөн дүн",
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        align: "right" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {Number(val) > 0 ? formatNumber(val) : <span className="text-[color:var(--muted-text)]">0</span>}
          </span>
        ),
      },
      {
        title: "Үлдэгдэл төлбөр",
        dataIndex: "uldegdelTulbur",
        key: "uldegdelTulbur",
        align: "right" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {Number(val) > 0 ? formatNumber(val) : <span className="text-[color:var(--muted-text)]">0</span>}
          </span>
        ),
      },
    ],
    [],
  );

  const guestDetailColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 40,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Огноо",
        dataIndex: "ognoo",
        key: "ognoo",
        align: "center" as const,
        render: (val: any) => (
          <span className="whitespace-nowrap text-[13px]">
            {ognooKharuul(val)}
          </span>
        ),
      },
      {
        title: "Машины дугаар",
        dataIndex: "mashiniiDugaar",
        key: "mashiniiDugaar",
        align: "center" as const,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Зогссон минут",
        dataIndex: "zogssonMinut",
        key: "zogssonMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val}
          </span>
        ),
      },
      {
        title: "Хөнгөлсөн минут",
        dataIndex: "khungulsunMinut",
        key: "khungulsunMinut",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val}
          </span>
        ),
      },
      {
        title: "Төлбөр",
        dataIndex: "tulbur",
        key: "tulbur",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val > 0 ? formatNumber(val) : "-"}
          </span>
        ),
      },
      {
        title: "Төлөв",
        dataIndex: "tuluv",
        key: "tuluv",
        align: "center" as const,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const guestCarListColumns = useMemo(
    () => [
      {
        title: "№",
        dataIndex: "index",
        key: "index",
        width: 40,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Машины дугаар",
        dataIndex: "mashiniiDugaar",
        key: "mashiniiDugaar",
        align: "center" as const,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Оршин суугчийн нэр",
        dataIndex: "orshinSuugchiinNer",
        key: "orshinSuugchiinNer",
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px] font-medium">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Утасны дугаар",
        dataIndex: "utas",
        key: "utas",
        align: "center" as const,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Орц",
        dataIndex: "orts",
        key: "orts",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px]">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center" as const,
        width: 70,
        render: (text: string) => (
          <span className="whitespace-nowrap text-[13px] font-medium">
            {text || "-"}
          </span>
        ),
      },
      {
        title: "Ирсэн тоо",
        dataIndex: "irsenToo",
        key: "irsenToo",
        align: "center" as const,
        render: (val: number) => (
          <span className="whitespace-nowrap text-[13px]">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Сүүлд ирсэн",
        dataIndex: "suuliinIrsenOgnoo",
        key: "suuliinIrsenOgnoo",
        align: "center" as const,
        render: (val: any) => (
          <span className="whitespace-nowrap text-[13px]">
            {ognooKharuul(val)}
          </span>
        ),
      },
    ],
    [],
  );

  // Ачаалж байхад бүх хуудсыг солихгүй — хайлтын талбар бичих явцад
  // алга болж байв. Хүснэгтүүд `loading`-оор өөрсдөө харуулна.

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-danger">Алдаа: {error}</div>
      </div>
    );
  }

  return (
    // Бусад хуудастай ижил бүрхүүл — нэмэлт `p-6`-гүй; гарчиг нь толгой хэсэгт («Тайлан — …») байгаа тул давхарлахгүй
    <div className="print-container flex w-full flex-col gap-3 pb-14">
      <PrintStyles />

      <div className="flex flex-wrap items-center gap-2 no-print">
        <div
          id="zogsool-date"
          className="btn-minimal flex h-9 w-full items-center px-3 sm:w-[280px]"
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
                "text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] dark:placeholder:text-[color:var(--muted-text)] h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
            }}
          />
        </div>

        <label className={`filter-field w-full sm:w-[240px] ${khaikh ? "is-active" : ""}`}>
          <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
          <input
            type="text"
            value={khaikh}
            onChange={(e) => setKhaikh(e.target.value)}
            placeholder="Оршин суугч, тоот хайх..."
          />
        </label>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("residentSummary")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${
              activeTab === "residentSummary"
                ? "bg-theme/15 font-medium text-brand"
                : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            }`}
          >
            Оршин суугчаар
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guestDetail")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${
              activeTab === "guestDetail"
                ? "bg-theme/15 font-medium text-brand"
                : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            }`}
          >
            Дэлгэрэнгүй
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guestCarList")}
            className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${
              activeTab === "guestCarList"
                ? "bg-theme/15 font-medium text-brand"
                : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            }`}
          >
            Машины жагсаалт
          </button>
        </div>

        <ExcelButton onClick={exportToExcel} className="ml-auto" />
      </div>

      {/* ── Хураангуй ── */}
      <div className="grid grid-cols-2 gap-3 no-print md:grid-cols-3 xl:grid-cols-5">
        {[
          { nershil: "Урьсан машин", utga: formatNumber(niit.urisanMachinToo, 0), ungu: "text-[color:var(--panel-text)]" },
          { nershil: "Нийт төлөх", utga: formatNumber(niit.niitTulbur), ungu: "text-[color:var(--panel-text)]" },
          { nershil: "Хөнгөлсөн минут", utga: formatNumber(niit.khungulultMinut, 0), ungu: "text-[color:var(--panel-text)]" },
          { nershil: "Төлсөн дүн", utga: formatNumber(niit.tulsunDun), ungu: "text-success" },
          { nershil: "Үлдэгдэл төлбөр", utga: formatNumber(niit.uldegdelTulbur), ungu: niit.uldegdelTulbur > 0 ? "text-danger" : "text-[color:var(--panel-text)]" },
        ].map((k) => (
          <div
            key={k.nershil}
            className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-5 py-4 shadow-[var(--ctl-shadow)]"
          >
            <div className={`text-2xl font-semibold leading-tight tabular-nums ${k.ungu}`}>{k.utga}</div>
            <div className="mt-1 text-xs text-[color:var(--muted-text)]">{k.nershil}</div>
          </div>
        ))}
      </div>

      {activeTab === "residentSummary" && (
        <div className="allow-overflow">
          <div>
            <Table
              dataSource={residentSummary}
              columns={residentSummaryColumns}
              rowKey="orshinSuugchiinId"
              pagination={false}
              loading={loading}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Мэдээлэл алга байна" }}
              onRow={(record) => ({
                onClick: () => {
                  handleResidentClick(record.orshinSuugchiinId);
                  setActiveTab("guestDetail");
                },
                className: `cursor-pointer${
                  selectedResidentId === record.orshinSuugchiinId
                    ? " zt-row-selected"
                    : ""
                }`,
              })}
              summary={() =>
                residentSummary.length > 0 ? (
                  <Table.Summary.Row className="bg-theme/5">
                    <Table.Summary.Cell
                      index={0}
                      colSpan={6}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      <strong>Нийт</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={1}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      {niit.urisanMachinToo}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={2}
                      align="right"
                      className="text-[13px] font-semibold"
                    >
                      {formatNumber(niit.niitTulbur)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={3}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      {niit.khungulultMinut || "-"}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={4}
                      align="right"
                      className="text-[13px] font-semibold"
                    >
                      {formatNumber(niit.tulsunDun)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={5}
                      align="right"
                      className="text-[13px] font-semibold"
                    >
                      {formatNumber(niit.uldegdelTulbur)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          </div>
        </div>
      )}

      {activeTab === "guestDetail" && (
        <div className="allow-overflow flex flex-col gap-2">
          {/* Гарчиг нь таб дээр байгаа тул зөвхөн сонгосон оршин суугчийн мэдээллийг үлдээв */}
          {selectedResident && (
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-brand/80">
              <span className="font-medium text-[color:var(--panel-text)]">
                {selectedResident.ner}
              </span>
              {selectedResident.utas && (
                <span>
                  Утас: <strong>{selectedResident.utas}</strong>
                </span>
              )}
              {selectedResident.orts && (
                <span>
                  Орц: <strong>{selectedResident.orts}</strong>
                </span>
              )}
              {selectedResident.davkhar && (
                <span>
                  Давхар: <strong>{selectedResident.davkhar}</strong>
                </span>
              )}
              {selectedResident.toot && (
                <span>
                  Тоот: <strong>{selectedResident.toot}</strong>
                </span>
              )}
            </div>
          )}
          <div>
            <Table
              dataSource={displayDetail || []}
              columns={guestDetailColumns}
              // rowKey={(record) =>
              //   `${record.mashiniiDugaar}-${record._id || Math.random().toString()}`
              // }
              pagination={false}
              scroll={{ x: "max-content" }}
              loading={loading || detailLoading}
              locale={{
                emptyText: selectedResidentId
                  ? "Дэлгэрэнгүй мэдээлэл алга"
                  : "Эхний таб дээр оршин суугч сонгоно уу",
              }}
              summary={() =>
                displayDetail && displayDetail.length > 0 ? (
                  <Table.Summary.Row className="bg-theme/5">
                    <Table.Summary.Cell
                      index={0}
                      colSpan={3}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      <strong>Нийт</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={1}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      {displayDetail.reduce((s, r) => s + r.zogssonMinut, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={2}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      {displayDetail.reduce((s, r) => s + r.khungulsunMinut, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={3}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      {formatNumber(
                        displayDetail.reduce((s, r) => s + r.tulbur, 0),
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      index={4}
                      align="center"
                      className="text-[13px] font-semibold"
                    >
                      -
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : null
              }
            />
          </div>
        </div>
      )}

      {activeTab === "guestCarList" && (
        <div className="allow-overflow">
          <div>
            <Table
              dataSource={guestCarList}
              columns={guestCarListColumns}
              pagination={false}
              loading={loading}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: "Мэдээлэл алга байна" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
