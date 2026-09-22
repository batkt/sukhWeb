"use client";

/**
 * BI Тайлан — бүх домэйны үзүүлэлтийг нэг дэлгэц дээр графикаар.
 *
 * Өгөгдөл нь БҮГД `GET /tailan/bi` гэсэн НЭГ endpoint-оос ирнэ. Клиент тал
 * тооцоолол хийхгүй — тайлан бүр өөрөө бодох нь ижил үзүүлэлтийг өөр өөр
 * тоогоор гаргах шалтгаан болдог (үлдэгдэл гурван өөр аргаар бодогддог
 * байсан). Энд зөвхөн зурна.
 *
 * Загвар: минимал — хүрээ нимгэн, өнгө хязгаарлагдмал, сүүдэргүй, тор бүдэг.
 */

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Users,
  FileText,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Car,
  ClipboardList,
  DoorOpen,
  Loader2,
  Printer,
  Download,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

/* ─── Өнгөний хязгаарлагдмал багц (минимал) ──────────────────────────── */
const UNGU = {
  nogoon: "#10b981",
  ulaan: "#ef4444",
  shar: "#f59e0b",
  tsenher: "#3b82f6",
  ochir: "#8b5cf6",
  bar: "#64748b",
};
const UNGU_BAGTS = [
  UNGU.nogoon,
  UNGU.tsenher,
  UNGU.shar,
  UNGU.ochir,
  UNGU.ulaan,
  UNGU.bar,
];

const tooFormat = (n: number) =>
  new Intl.NumberFormat("mn-MN").format(Math.round(Number(n) || 0));
const dunFormat = (n: number) => tooFormat(n) + "₮";

/** Хэт урт тоог хураангуйлна: 1,234,567 → 1.2М */
const dunKhuraangui = (n: number) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + "Б";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "М";
  if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + "мянга";
  return tooFormat(v);
};

/** YYYY-MM → MM.YY */
const sarFormat = (s: string) => {
  const [y, m] = s.split("-");
  return `${m}.${y?.slice(2) ?? ""}`;
};

/* ─── Графикийн ерөнхий тохиргоо ─────────────────────────────────────── */
const suuriTokhirgoo = (baganatai = false) =>
  ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        display: baganatai,
        position: "bottom" as const,
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          font: { size: 10 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(100,116,139,0.12)" },
        border: { display: false },
        ticks: {
          font: { size: 10 },
          maxTicksLimit: 5,
          callback: (v: any) => dunKhuraangui(Number(v)),
        },
      },
    },
  }) as any;

const buguiTokhirgoo = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      position: "right" as const,
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        font: { size: 10 },
        padding: 10,
      },
    },
    tooltip: {
      backgroundColor: "rgba(15,23,42,0.92)",
      padding: 10,
      cornerRadius: 8,
      bodyFont: { size: 11 },
    },
  },
} as any;

/* ─── Дэд компонентууд ───────────────────────────────────────────────── */

/**
 * KPI карт — turees-ийн Хяналтын самбар дээрх `SummaryCard`-ын хэлбэрээр:
 * өнгөт дүрсний хайрцаг, тухайн өнгөөр сүүдэрлэсэн дэвсгэр, хулгана
 * ойртоход бага зэрэг өргөгдөх хөдөлгөөн.
 */
const Kpi: React.FC<{
  nert: string;
  utga: string;
  icon: React.ReactNode;
  ungu?: string;
}> = ({ nert, utga, icon, ungu }) => {
  const undsen = ungu || UNGU.bar;
  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: `${undsen}33`,
        backgroundColor: `${undsen}0f`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-300 group-hover:rotate-6"
          style={{ backgroundColor: undsen }}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-[color:var(--muted-text)]">
            {nert}
          </span>
          <span
            className="truncate text-sm font-semibold text-[color:var(--panel-text)] dark:text-white"
            title={utga}
          >
            {utga}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Графикийн карт — turees-ийн `GlassCard`-ын хэлбэрээр: дүрсний хайрцагтай
 * тусдаа толгой мөр, доогуураа зураастай, том дугуйлсан булан.
 */
const Karti: React.FC<{
  garchig: string;
  tailbar?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  undur?: number;
  delgets?: string;
}> = ({ garchig, tailbar, icon, children, undur = 220, delgets }) => (
  <div
    className={`group flex flex-col overflow-hidden rounded-[1.5rem] border border-[color:var(--surface-border)] bg-[color:var(--panel)]/90 shadow-sm transition-all duration-300 hover:shadow-md dark:border-white/10 ${
      delgets || ""
    }`}
  >
    <div className="flex items-center justify-between gap-2 border-b border-[color:var(--surface-border)] px-4 py-3 dark:border-white/5">
      <div className="flex min-w-0 items-center gap-2">
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]">
            {icon}
          </div>
        )}
        <span className="truncate text-[10px] font-medium uppercase tracking-wider text-[color:var(--muted-text)]">
          {garchig}
        </span>
      </div>
      {tailbar && (
        <span className="shrink-0 text-[10px] text-[color:var(--muted-text)]">{tailbar}</span>
      )}
    </div>
    <div className="p-3 md:p-4" style={{ height: undur }}>
      {children}
    </div>
  </div>
);

const Khooson = () => (
  <div className="flex h-full items-center justify-center text-[11px] text-[color:var(--muted-text)]">
    Өгөгдөл байхгүй
  </div>
);

/* ─── Хуудас ─────────────────────────────────────────────────────────── */

export default function BiTailanPage() {
  const { token, ajiltan, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  /**
   * Хэвлэхийн өмнө графикуудын тогтмол өндрийг суллаж, бүх карт нэг хуудсанд
   * багтахаар бэлтгэнэ. turees-ийн Хяналтын самбар дээрх зарчим.
   */
  const [khevlej, setKhevlej] = useState(false);

  const ekhlekh = dateRange?.[0]
    ? dateRange[0].toISOString().slice(0, 10)
    : undefined;
  const duusakh = dateRange?.[1]
    ? dateRange[1].toISOString().slice(0, 10)
    : undefined;

  const { data, error, isLoading } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/tailan/bi",
          token,
          ajiltan.baiguullagiinId,
          selectedBuildingId,
          ekhlekh,
          duusakh,
        ]
      : null,
    async ([url, tkn, bId, barId, e, d]) => {
      const resp = await uilchilgee(tkn as string).get(url as string, {
        params: {
          baiguullagiinId: bId,
          barilgiinId: barId || undefined,
          ekhlekhOgnoo: e,
          duusakhOgnoo: d,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  /** barilgiinId → барилгын нэр */
  const barilgaNer = useMemo(() => {
    const map: Record<string, string> = {};
    (baiguullaga?.barilguud || []).forEach((b: any) => {
      if (b?._id) map[String(b._id)] = b.ner || String(b._id);
    });
    return map;
  }, [baiguullaga]);

  const saruud: string[] = data?.khugatsaa?.saruud || [];
  const sarShoshgo = useMemo(() => saruud.map(sarFormat), [saruud]);

  /* ── График өгөгдөл ── */
  const orlogoChart = useMemo(() => {
    const rows = data?.orlogo?.saraar || [];
    return {
      labels: sarShoshgo,
      datasets: [
        {
          type: "bar" as const,
          label: "Нэхэмжилсэн",
          data: rows.map((r: any) => r.nekhemjilsen),
          backgroundColor: "rgba(59,130,246,0.25)",
          borderRadius: 4,
          barThickness: 12,
          order: 2,
        },
        {
          type: "line" as const,
          label: "Төлсөн",
          data: rows.map((r: any) => r.tulsun),
          borderColor: UNGU.nogoon,
          backgroundColor: "transparent",
          fill: false,
          tension: 0.4,
          pointRadius: rows.length > 20 ? 0 : 3,
          pointBackgroundColor: UNGU.nogoon,
          pointHitRadius: 12,
          borderWidth: 2,
          order: 1,
        },
      ],
    };
  }, [data, sarShoshgo]);

  const nasjiltChart = useMemo(() => {
    const n = data?.avlaga?.nasjilt;
    if (!n) return null;
    const utguud = [n.p0_30, n.p31_60, n.p61_90, n.p91_120, n.p120plus];
    if (utguud.every((v) => !v)) return null;
    return {
      labels: ["0-30", "31-60", "61-90", "91-120", "120+"],
      datasets: [
        {
          label: "Авлага",
          data: utguud,
          backgroundColor: [
            UNGU.nogoon,
            "#84cc16",
            UNGU.shar,
            "#f97316",
            UNGU.ulaan,
          ],
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const gereeTuluvChart = useMemo(() => {
    const t = data?.geree?.tuluvuur || {};
    const keys = Object.keys(t);
    if (keys.length === 0) return null;
    return {
      labels: keys,
      datasets: [
        {
          data: keys.map((k) => t[k]),
          backgroundColor: UNGU_BAGTS,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const gereeBarilgaChart = useMemo(() => {
    const b = data?.geree?.barilgaar || {};
    const keys = Object.keys(b);
    if (keys.length === 0) return null;
    return {
      labels: keys.map((k) => barilgaNer[k] || k),
      datasets: [
        {
          label: "Гэрээ",
          data: keys.map((k) => b[k]),
          backgroundColor: UNGU.tsenher,
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [data, barilgaNer]);

  const shineGereeChart = useMemo(() => {
    const rows = data?.geree?.saraar || [];
    if (rows.every((r: any) => !r.too)) return null;
    return {
      labels: sarShoshgo,
      datasets: [
        {
          label: "Шинэ гэрээ",
          data: rows.map((r: any) => r.too),
          backgroundColor: UNGU.ochir,
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [data, sarShoshgo]);

  const tulburKhelberChart = useMemo(() => {
    const rows = data?.tulburiinKhelber || [];
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r: any) => r.turul),
      datasets: [
        {
          data: rows.map((r: any) => r.dun),
          backgroundColor: UNGU_BAGTS,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const zogsoolChart = useMemo(() => {
    const rows = data?.zogsool?.saraar || [];
    if (rows.every((r: any) => !r.too)) return null;
    return {
      labels: sarShoshgo,
      datasets: [
        {
          label: "Зогсоолын хөдөлгөөн",
          data: rows.map((r: any) => r.too),
          borderColor: UNGU.shar,
          backgroundColor: "rgba(245,158,11,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: rows.length > 20 ? 0 : 3,
          pointHitRadius: 12,
          borderWidth: 2,
        },
      ],
    };
  }, [data, sarShoshgo]);

  const zogsoolTurulChart = useMemo(() => {
    const t = data?.zogsool?.turluur || {};
    const keys = Object.keys(t);
    if (keys.length === 0) return null;
    return {
      labels: keys,
      datasets: [
        { data: keys.map((k) => t[k]), backgroundColor: UNGU_BAGTS, borderWidth: 0 },
      ],
    };
  }, [data]);

  const khaalgaChart = useMemo(() => {
    const rows = data?.khaalga?.saraar || [];
    if (rows.every((r: any) => !r.too)) return null;
    return {
      labels: sarShoshgo,
      datasets: [
        {
          label: "Хаалга нээлт",
          data: rows.map((r: any) => r.too),
          backgroundColor: UNGU.bar,
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [data, sarShoshgo]);

  const asuulgaChart = useMemo(() => {
    const rows = (data?.sanalAsuulga || []).slice(0, 8);
    if (rows.length === 0) return null;
    return {
      labels: rows.map((r: any) =>
        r.garchig?.length > 18 ? r.garchig.slice(0, 18) + "…" : r.garchig,
      ),
      datasets: [
        {
          label: "Хариулт",
          data: rows.map((r: any) => r.khariultiinToo),
          backgroundColor: UNGU.nogoon,
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const kpi = data?.kpi;

  /**
   * Хэвлэх. Chart.js нь `resize`-д хариу үйлдэл үзүүлэхэд хэсэг хугацаа
   * шаардагддаг тул төлвөө асаагаад нэг фрейм хүлээж байж `print()` дуудна,
   * эс бөгөөс графикууд хуучин хэмжээгээрээ хэвлэгдэнэ.
   */
  const khevleye = () => {
    setKhevlej(true);
    setTimeout(() => {
      window.print();
      setKhevlej(false);
    }, 300);
  };

  /** CSV-д аюулгүй болгох — таслал, хашилт, мөр таслалт агуулж болно. */
  const nudTseverlye = (utga: unknown) => {
    const text = utga === null || utga === undefined ? "" : String(utga);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  /**
   * Бүх үзүүлэлтийг нэг CSV болгон татна.
   *
   * turees-ийн самбар нь DOM дээрх <table>-уудыг гүйж цуглуулдаг. Энэ хуудас
   * бараг бүхэлдээ график тул DOM-оос биш, графикуудыг тэжээж буй өгөгдлөөс
   * шууд бичнэ — ингэснээр дэлгэцэнд харагдахгүй байгаа утга ч бүрэн орно.
   */
  const csvTatya = () => {
    const murnuud: string[] = [];
    const khesegNemye = (garchig: string, mur: (string | number)[][]) => {
      if (!mur.length) return;
      murnuud.push(garchig);
      mur.forEach((r) => murnuud.push(r.map(nudTseverlye).join(",")));
      murnuud.push("");
    };

    khesegNemye("KPI", [
      ["Үзүүлэлт", "Утга"],
      ["Оршин суугч", kpi?.niitOrshinSuugch ?? 0],
      ["Гэрээ", kpi?.niitGeree ?? 0],
      ["Нэхэмжилсэн", kpi?.niitNekhemjilsen ?? 0],
      ["Төлсөн", kpi?.niitTulsun ?? 0],
      ["Цуглуулгын хувь", `${kpi?.tsugluulgiinKhuvi ?? 0}%`],
      ["Авлага", kpi?.niitUldegdel ?? 0],
      ["Зогсоолын орлого", kpi?.zogsoolOrlogo ?? 0],
    ]);

    /** Chart.js-ийн өгөгдлийг мөр болгон буулгана. */
    const graphikNemye = (garchig: string, chart: any) => {
      if (!chart?.labels?.length) return;
      const toluv = ["Ангилал", ...chart.datasets.map((d: any) => d.label || "")];
      const mur: (string | number)[][] = [toluv];
      chart.labels.forEach((shoshgo: string, i: number) => {
        mur.push([shoshgo, ...chart.datasets.map((d: any) => d.data?.[i] ?? 0)]);
      });
      khesegNemye(garchig, mur);
    };

    graphikNemye("Нэхэмжилсэн ба төлсөн", orlogoChart);
    graphikNemye("Авлагын насжилт", nasjiltChart);
    graphikNemye("Гэрээний төлөв", gereeTuluvChart);
    graphikNemye("Гэрээ барилгаар", gereeBarilgaChart);
    graphikNemye("Төлбөрийн хэлбэр", tulburKhelberChart);
    graphikNemye("Шинэ гэрээ", shineGereeChart);
    graphikNemye("Зогсоол", zogsoolChart);
    graphikNemye("Зогсоолын төрөл", zogsoolTurulChart);
    graphikNemye("Хаалга", khaalgaChart);
    graphikNemye("Санал асуулга", asuulgaChart);

    const ikhUldegdel = data?.avlaga?.khamgiinIkhUldegdel || [];
    if (ikhUldegdel.length > 0) {
      khesegNemye("Хамгийн их авлагатай", [
        ["Тоот / Гэрээ", "Үлдэгдэл"],
        ...ikhUldegdel.map((r: any) => [
          r.toot || r.gereeniiDugaar || "-",
          r.uldegdel ?? 0,
        ]),
      ]);
    }

    // Excel нь UTF-8 BOM-гүй бол кирилл үсгийг эвдэж уншина.
    const blob = new Blob(["\uFEFF" + murnuud.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bi_tailan_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Зурах ── */
  if (error)
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p className="text-sm text-[color:var(--muted-text)]">Тайлан татахад алдаа гарлаа</p>
      </div>
    );

  return (
    <div
      className={`mx-auto w-full max-w-[1600px] space-y-4 p-4 ${
        khevlej ? "khevlekh-gorim" : ""
      }`}
    >
      {/* Хэвлэхэд: хөндлөн байрлал, шелл далдлах, нэг хуудсанд багтаах */}
      <style type="text/css" media="print">
        {`
          @page { size: landscape; margin: 6mm; }
          body, html { background: #fff !important; }
          .shell-sidebar, .shell-topbar, nav, aside { display: none !important; }
          .khevlekh-nuuh { display: none !important; }
          .khevlekh-gorim { max-width: none !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `}
      </style>

      {/* Толгой */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--panel-text)] dark:text-white">
            BI Тайлан
          </h1>
          <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
            {saruud.length > 0
              ? `${sarFormat(saruud[0])} — ${sarFormat(saruud[saruud.length - 1])}`
              : "Бүх үзүүлэлт нэг дэлгэцэнд"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-theme" />
          )}
          <div className="h-10 w-full min-w-[260px] md:w-[300px]">
            <StandardDatePicker
              isRange
              value={dateRange}
              onChange={setDateRange}
              allowClear
              placeholder="Хугацаа (сүүлийн 12 сар)"
            />
          </div>
          <button
            onClick={csvTatya}
            title="Бүх үзүүлэлтийг CSV-ээр татах"
            className="khevlekh-nuuh flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs ring-1 ring-[color:var(--surface-border)] transition-colors hover:bg-[color:var(--surface-hover)] dark:ring-white/10 dark:hover:bg-white/5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={khevleye}
            title="Тайланг хэвлэх"
            className="khevlekh-nuuh flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs ring-1 ring-[color:var(--surface-border)] transition-colors hover:bg-[color:var(--surface-hover)] dark:ring-white/10 dark:hover:bg-white/5"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Хэвлэх</span>
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Kpi
          nert="Оршин суугч"
          utga={tooFormat(kpi?.niitOrshinSuugch || 0)}
          icon={<Users className="h-4 w-4" />}
          ungu={UNGU.tsenher}
        />
        <Kpi
          nert="Гэрээ"
          utga={tooFormat(kpi?.niitGeree || 0)}
          icon={<FileText className="h-4 w-4" />}
          ungu={UNGU.ochir}
        />
        <Kpi
          nert="Нэхэмжилсэн"
          utga={dunFormat(kpi?.niitNekhemjilsen || 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <Kpi
          nert="Төлсөн"
          utga={dunFormat(kpi?.niitTulsun || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          ungu={UNGU.nogoon}
        />
        <Kpi
          nert="Цуглуулга"
          utga={`${kpi?.tsugluulgiinKhuvi ?? 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          ungu={
            (kpi?.tsugluulgiinKhuvi ?? 0) >= 80 ? UNGU.nogoon : UNGU.shar
          }
        />
        <Kpi
          nert="Авлага"
          utga={dunFormat(kpi?.niitUldegdel || 0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          ungu={UNGU.ulaan}
        />
        <Kpi
          nert="Зогсоолын орлого"
          utga={dunFormat(kpi?.zogsoolOrlogo || 0)}
          icon={<Car className="h-4 w-4" />}
          ungu={UNGU.shar}
        />
      </div>

      {/* Орлого — хамгийн чухал тул бүтэн өргөн */}
      <Karti
        garchig="Нэхэмжилсэн ба төлсөн"
        icon={<Wallet className="h-4 w-4" />}
        tailbar="сараар"
        undur={260}
        delgets="xl:col-span-2"
      >
        <Bar
          data={orlogoChart as any}
          options={{
            ...suuriTokhirgoo(true),
            plugins: {
              ...suuriTokhirgoo(true).plugins,
              // turees-ийн самбартай адил дээд баруун буланд
              legend: {
                display: true,
                position: "top" as const,
                align: "end" as const,
                labels: {
                  boxWidth: 6,
                  usePointStyle: true,
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </Karti>

      {/* Авлага, гэрээ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Karti garchig="Авлагын насжилт" tailbar="хоногоор" icon={<AlertTriangle className="h-4 w-4" />}>
          {nasjiltChart ? (
            <Bar data={nasjiltChart as any} options={suuriTokhirgoo()} />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Гэрээний төлөв" icon={<FileText className="h-4 w-4" />}>
          {gereeTuluvChart ? (
            <Doughnut data={gereeTuluvChart as any} options={buguiTokhirgoo} />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Гэрээ барилгаар" icon={<FileText className="h-4 w-4" />}>
          {gereeBarilgaChart ? (
            <Bar
              data={gereeBarilgaChart as any}
              options={{
                ...suuriTokhirgoo(),
                scales: {
                  ...suuriTokhirgoo().scales,
                  y: {
                    ...suuriTokhirgoo().scales.y,
                    ticks: { font: { size: 10 }, maxTicksLimit: 5 },
                  },
                },
              }}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
      </div>

      {/* Төлбөр, шинэ гэрээ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Karti garchig="Төлбөрийн хэлбэр" tailbar="дүнгээр" icon={<Wallet className="h-4 w-4" />}>
          {tulburKhelberChart ? (
            <Doughnut
              data={tulburKhelberChart as any}
              options={buguiTokhirgoo}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Шинэ гэрээ" tailbar="сараар" icon={<TrendingUp className="h-4 w-4" />}>
          {shineGereeChart ? (
            <Bar
              data={shineGereeChart as any}
              options={{
                ...suuriTokhirgoo(),
                scales: {
                  ...suuriTokhirgoo().scales,
                  y: {
                    ...suuriTokhirgoo().scales.y,
                    ticks: { font: { size: 10 }, maxTicksLimit: 5 },
                  },
                },
              }}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Хамгийн их авлагатай" tailbar="тоот" icon={<AlertTriangle className="h-4 w-4" />}>
          {(data?.avlaga?.khamgiinIkhUldegdel || []).length > 0 ? (
            <div className="h-full space-y-1.5 overflow-y-auto pr-1">
              {data.avlaga.khamgiinIkhUldegdel.map((r: any, i: number) => (
                <div
                  key={r.gereeniiId || i}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="truncate text-[color:var(--muted-text)]">
                    {i + 1}. {r.toot || r.gereeniiDugaar || "-"}
                  </span>
                  <span className="shrink-0 font-medium text-danger">
                    {dunFormat(r.uldegdel)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Khooson />
          )}
        </Karti>
      </div>

      {/* Зогсоол, хаалга, асуулга */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Karti
          garchig="Зогсоолын хөдөлгөөн"
          icon={<Car className="h-4 w-4" />}
          tailbar={`${tooFormat(kpi?.zogsoolSession || 0)} session`}
        >
          {zogsoolChart ? (
            <Line
              data={zogsoolChart as any}
              options={{
                ...suuriTokhirgoo(),
                scales: {
                  ...suuriTokhirgoo().scales,
                  y: {
                    ...suuriTokhirgoo().scales.y,
                    ticks: { font: { size: 10 }, maxTicksLimit: 5 },
                  },
                },
              }}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Зогсоолын төлбөр" tailbar="төрлөөр" icon={<Car className="h-4 w-4" />}>
          {zogsoolTurulChart ? (
            <Doughnut
              data={zogsoolTurulChart as any}
              options={buguiTokhirgoo}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti
          garchig="Хаалга нээлт"
          icon={<DoorOpen className="h-4 w-4" />}
          tailbar={`${tooFormat(kpi?.khaalgaNeelt || 0)} удаа`}
        >
          {khaalgaChart ? (
            <Bar
              data={khaalgaChart as any}
              options={{
                ...suuriTokhirgoo(),
                scales: {
                  ...suuriTokhirgoo().scales,
                  y: {
                    ...suuriTokhirgoo().scales.y,
                    ticks: { font: { size: 10 }, maxTicksLimit: 5 },
                  },
                },
              }}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
      </div>

      {/* Санал асуулга, мэдэгдэл */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Karti
          garchig="Санал асуулгын хариулт"
          icon={<ClipboardList className="h-4 w-4" />}
          tailbar={`${tooFormat(kpi?.asuulgiinToo || 0)} асуулга`}
        >
          {asuulgaChart ? (
            <Bar
              data={asuulgaChart as any}
              options={{
                ...suuriTokhirgoo(),
                indexAxis: "y" as const,
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: "rgba(100,116,139,0.12)" },
                    border: { display: false },
                    ticks: { font: { size: 10 }, maxTicksLimit: 5 },
                  },
                  y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { font: { size: 10 } },
                  },
                },
              }}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Мэдэгдэл ба санал хүсэлт" tailbar="төрлөөр" icon={<ClipboardList className="h-4 w-4" />}>
          {(data?.medegdel || []).length > 0 ? (
            <div className="h-full space-y-2 overflow-y-auto pr-1">
              {data.medegdel.map((r: any) => (
                <div key={r.turul}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="truncate text-[color:var(--muted-text)]">
                      {r.turul}
                    </span>
                    <span className="shrink-0 text-[color:var(--muted-text)]">
                      {tooFormat(r.too)}
                      {r.unshaagui > 0 && (
                        <span className="ml-1 text-warning">
                          ({tooFormat(r.unshaagui)} уншаагүй)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-hover)] dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (r.too / Math.max(1, Math.max(...data.medegdel.map((x: any) => x.too)))) * 100)}%`,
                        backgroundColor: UNGU.tsenher,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Khooson />
          )}
        </Karti>
      </div>

      {/* Зөрчилтэй машин — жижиг тэмдэглэл */}
      {(data?.zogsool?.zurchilteiToo ?? 0) > 0 && (
        <p className="pb-4 text-center text-[11px] text-[color:var(--muted-text)]">
          Зогсоол дээр зөрчилтэй тэмдэглэгдсэн{" "}
          <span className="font-medium text-warning">
            {tooFormat(data.zogsool.zurchilteiToo)}
          </span>{" "}
          хөдөлгөөн байна
        </p>
      )}
    </div>
  );
}
