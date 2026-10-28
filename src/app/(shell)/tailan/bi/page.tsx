"use client";

/**
 * BI Тайлан — гол санхүүгийн үзүүлэлтүүдийг нэг дэлгэцэнд.
 *
 * Өгөгдөл нь БҮГД `GET /tailan/bi` гэсэн НЭГ endpoint-оос ирнэ. Клиент тал
 * тооцоолол хийхгүй (өмнөх сартай харьцуулах өөрчлөлтөөс бусад) — тайлан бүр
 * өөрөө бодох нь ижил үзүүлэлтийг өөр өөр тоогоор гаргах шалтгаан болдог.
 *
 * Бүтэц: KPI → Төлбөрийн орлого (сараар) → Авлагын бүтэц / Топ 5 /
 * Төлөлтийн хувь (барилгаар).
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import useSWR from "swr";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Users,
  Wallet,
  CircleCheck,
  Clock,
  Building2,
  AlertTriangle,
  Loader2,
  Printer,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Receipt,
} from "lucide-react";
import ExcelButton from "@/components/ui/ExcelButton";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

/* ─── Өнгө ───────────────────────────────────────────────────────────── */
const UNGU = {
  nogoon: "#059669",
  nogoonTod: "#10b981",
  nogoonBuudgen: "#a7f3d0",
  ulaan: "#ef4444",
  shar: "#f59e0b",
  tsenher: "#3b82f6",
  ochir: "#8b5cf6",
};

/** Төлөлтийн хувиас хамаарах өнгө */
const khuviinUngu = (k: number) =>
  k >= 65 ? UNGU.nogoonTod : k >= 50 ? UNGU.shar : UNGU.ulaan;

const tooFormat = (n: number) =>
  new Intl.NumberFormat("mn-MN").format(Math.round(Number(n) || 0));
const dunFormat = (n: number) => tooFormat(n) + "₮";

/** Хэт урт тоог хураангуйлна: 1,234,567 → 1.2М */
const dunKhuraangui = (n: number) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + "Б";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "М";
  if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + "мян";
  return tooFormat(v);
};

/** YYYY-MM → "10 сар" */
const sarShoshgoAvya = (s: string) => `${Number(s.split("-")[1])} сар`;
/** YYYY-MM → "2026.10" */
const sarBuren = (s: string) => s.replace("-", ".");

/* ─── Дэд компонентууд ───────────────────────────────────────────────── */

/** Өмнөх сартай харьцуулсан өөрчлөлтийн шошго */
const Uurchlult: React.FC<{ khuvi: number | null; urvuu?: boolean }> = ({
  khuvi,
  urvuu,
}) => {
  if (khuvi === null || !isFinite(khuvi)) return null;
  const usuv = khuvi >= 0;
  // urvuu: өсөх нь муу (жишээ нь үлдэгдэл)
  const sain = urvuu ? !usuv : usuv;
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px]">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${
          sain
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400"
        }`}
      >
        {usuv ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(khuvi).toFixed(0)}%
      </span>
      <span className="text-[color:var(--muted-text)]">Өмнөх сараас</span>
    </div>
  );
};

const Kpi: React.FC<{
  nert: string;
  utga: string;
  icon: React.ReactNode;
  ungu: string;
  uurchlult?: React.ReactNode;
}> = ({ nert, utga, icon, ungu, uurchlult }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--panel)] p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/10">
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${ungu}1a`, color: ungu }}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs text-[color:var(--muted-text)]">{nert}</p>
      <p
        className="mt-0.5 truncate text-xl font-semibold tracking-tight text-[color:var(--panel-text)] dark:text-white"
        title={utga}
      >
        {utga}
      </p>
      {uurchlult}
    </div>
  </div>
);

const Karti: React.FC<{
  garchig: string;
  khol?: string;
  baruun?: React.ReactNode;
  children: React.ReactNode;
  delgets?: string;
}> = ({ garchig, khol, baruun, children, delgets }) => (
  <div
    className={`flex flex-col rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--panel)] p-4 shadow-sm dark:border-white/10 ${
      delgets || ""
    }`}
  >
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="truncate text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
        {garchig}
      </h2>
      <div className="flex shrink-0 items-center gap-2">
        {baruun}
        {khol && (
          <Link
            href={khol}
            title="Дэлгэрэнгүй"
            className="khevlekh-nuuh flex h-6 w-6 items-center justify-center rounded-md text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);

const Khooson = () => (
  <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-[color:var(--muted-text)]">
    Өгөгдөл байхгүй
  </div>
);

/** Нэр + хэвтээ мөр + утга */
const MurBar: React.FC<{
  ner: string;
  khuvi: number;
  utga: string;
  ungu: string;
  icon?: React.ReactNode;
}> = ({ ner, khuvi, utga, ungu, icon }) => (
  <div className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-xs">
    <span className="flex min-w-0 items-center gap-2 text-[color:var(--panel-text)] dark:text-white/90">
      {icon}
      <span className="truncate" title={ner}>
        {ner}
      </span>
    </span>
    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--surface-hover)] dark:bg-white/10">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(2, Math.min(100, khuvi))}%`, backgroundColor: ungu }}
      />
    </div>
    <span className="min-w-[3rem] text-right font-medium tabular-nums text-[color:var(--panel-text)] dark:text-white">
      {utga}
    </span>
  </div>
);

type AvlagaTab = "angilal" | "barilga" | "nasjilt";
const AVLAGA_TABUUD: { key: AvlagaTab; ner: string }[] = [
  { key: "angilal", ner: "Ангиллаар" },
  { key: "barilga", ner: "Барилгаар" },
  { key: "nasjilt", ner: "Насжилтаар" },
];

/* ─── Хуудас ─────────────────────────────────────────────────────────── */

export default function BiTailanPage() {
  const { token, ajiltan, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [avlagaTab, setAvlagaTab] = useState<AvlagaTab>("angilal");
  /** Хэвлэхийн өмнө байрлалыг нэг хуудсанд багтахаар бэлтгэнэ. */
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

  const kpi = data?.kpi;
  const saruud: string[] = data?.khugatsaa?.saruud || [];
  const orlogoMur: any[] = data?.orlogo?.saraar || [];

  /** Сүүлийн сарыг өмнөхтэй нь харьцуулсан өөрчлөлт (%) */
  const uurchlult = (talbar: "nekhemjilsen" | "tulsun") => {
    if (orlogoMur.length < 2) return null;
    const suuld = Number(orlogoMur[orlogoMur.length - 1]?.[talbar]) || 0;
    const umnu = Number(orlogoMur[orlogoMur.length - 2]?.[talbar]) || 0;
    if (umnu === 0) return null;
    return ((suuld - umnu) / umnu) * 100;
  };

  /* ── Төлбөрийн орлогын график ── */
  const orlogoChart = useMemo(
    () => ({
      labels: saruud.map(sarShoshgoAvya),
      datasets: [
        {
          type: "line" as const,
          label: "Төлөлтийн хувь",
          data: orlogoMur.map((r) =>
            r.nekhemjilsen > 0 ? Math.round((r.tulsun / r.nekhemjilsen) * 100) : 0,
          ),
          borderColor: "#065f46",
          backgroundColor: "#065f46",
          yAxisID: "khuvi",
          tension: 0.4,
          pointRadius: orlogoMur.length > 18 ? 0 : 3,
          pointHitRadius: 12,
          borderWidth: 2,
          order: 0,
        },
        {
          type: "bar" as const,
          label: "Нэхэмжилсэн",
          data: orlogoMur.map((r) => r.nekhemjilsen),
          backgroundColor: UNGU.nogoonBuudgen,
          borderRadius: 4,
          maxBarThickness: 18,
          order: 1,
        },
        {
          type: "bar" as const,
          label: "Төлсөн",
          data: orlogoMur.map((r) => r.tulsun),
          backgroundColor: UNGU.nogoon,
          borderRadius: 4,
          maxBarThickness: 18,
          order: 1,
        },
      ],
    }),
    [saruud, orlogoMur],
  );

  const orlogoTokhirgoo = useMemo(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
          legend: {
            position: "top" as const,
            align: "end" as const,
            labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: "rgba(15,23,42,0.92)",
            padding: 10,
            cornerRadius: 8,
            usePointStyle: true,
            callbacks: {
              title: (items: any[]) =>
                saruud[items[0]?.dataIndex] ? sarBuren(saruud[items[0].dataIndex]) : "",
              label: (c: any) =>
                c.dataset.yAxisID === "khuvi"
                  ? ` ${c.dataset.label}: ${c.raw}%`
                  : ` ${c.dataset.label}: ${dunFormat(c.raw)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true },
          },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(100,116,139,0.12)" },
            border: { display: false },
            ticks: {
              font: { size: 11 },
              maxTicksLimit: 5,
              callback: (v: any) => dunKhuraangui(Number(v)),
            },
          },
          khuvi: {
            position: "right" as const,
            min: 0,
            suggestedMax: 100,
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11 }, maxTicksLimit: 5, callback: (v: any) => `${v}%` },
          },
        },
      }) as any,
    [saruud],
  );

  /* ── Авлагын бүтэц ── */
  const avlagaMurnuud = useMemo(() => {
    let mur: { ner: string; dun: number }[] = [];
    if (avlagaTab === "angilal") {
      mur = (data?.avlaga?.angillaar || []).map((r: any) => ({
        ner: r.ner,
        dun: r.dun,
      }));
    } else if (avlagaTab === "barilga") {
      mur = (data?.avlaga?.barilgaar || []).map((r: any) => ({
        ner: barilgaNer[r.barilgiinId] || (r.barilgiinId === "-" ? "Тодорхойгүй" : r.barilgiinId),
        dun: r.dun,
      }));
    } else {
      const n = data?.avlaga?.nasjilt || {};
      mur = [
        { ner: "0-30 хоног", dun: n.p0_30 || 0 },
        { ner: "31-60 хоног", dun: n.p31_60 || 0 },
        { ner: "61-90 хоног", dun: n.p61_90 || 0 },
        { ner: "91-120 хоног", dun: n.p91_120 || 0 },
        { ner: "120+ хоног", dun: n.p120plus || 0 },
      ];
      if (mur.every((r) => !r.dun)) mur = [];
    }
    // Ангилал олон байвал эхний 5-ыг харуулж, үлдсэнийг «Бусад» болгоно
    if (avlagaTab !== "nasjilt" && mur.length > 5) {
      const busad = mur.slice(4).reduce((s, r) => s + r.dun, 0);
      mur = [...mur.slice(0, 4), { ner: "Бусад", dun: busad }];
    }
    return mur;
  }, [data, avlagaTab, barilgaNer]);
  const avlagaIkh = Math.max(1, ...avlagaMurnuud.map((r) => r.dun));

  const top5: any[] = (data?.avlaga?.khamgiinIkhUldegdel || []).slice(0, 5);
  const tulultBarilgaar: any[] = data?.tulultBarilgaar || [];

  /**
   * Хэвлэх. Chart.js нь `resize`-д хариу үйлдэл үзүүлэхэд хэсэг хугацаа
   * шаардагддаг тул төлвөө асаагаад хүлээж байж `print()` дуудна.
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

  /** Дэлгэц дээрх бүх үзүүлэлтийг нэг CSV болгон татна. */
  const csvTatya = () => {
    const murnuud: string[] = [];
    const khesegNemye = (garchig: string, mur: (string | number)[][]) => {
      if (mur.length <= 1) return;
      murnuud.push(garchig);
      mur.forEach((r) => murnuud.push(r.map(nudTseverlye).join(",")));
      murnuud.push("");
    };

    khesegNemye("KPI", [
      ["Үзүүлэлт", "Утга"],
      ["Нийт нэхэмжилсэн", kpi?.niitNekhemjilsen ?? 0],
      ["Төлсөн дүн", kpi?.niitTulsun ?? 0],
      ["Үлдэгдэл дүн", kpi?.niitUldegdel ?? 0],
      ["Төлөлтийн хувь", `${kpi?.tsugluulgiinKhuvi ?? 0}%`],
      ["Нийт оршин суугч", kpi?.niitOrshinSuugch ?? 0],
      ["Нийт харилцагч", kpi?.niitGeree ?? 0],
    ]);
    khesegNemye("Төлбөрийн орлого (сараар)", [
      ["Сар", "Нэхэмжилсэн", "Төлсөн", "Төлөлтийн хувь"],
      ...orlogoMur.map((r) => [
        r.sar,
        r.nekhemjilsen,
        r.tulsun,
        r.nekhemjilsen > 0 ? `${Math.round((r.tulsun / r.nekhemjilsen) * 100)}%` : "0%",
      ]),
    ]);
    khesegNemye("Авлага ангиллаар", [
      ["Ангилал", "Дүн"],
      ...(data?.avlaga?.angillaar || []).map((r: any) => [r.ner, r.dun]),
    ]);
    khesegNemye("Авлага барилгаар", [
      ["Барилга", "Үлдэгдэл"],
      ...(data?.avlaga?.barilgaar || []).map((r: any) => [
        barilgaNer[r.barilgiinId] || r.barilgiinId,
        r.dun,
      ]),
    ]);
    khesegNemye("Хамгийн их үлдэгдэлтэй", [
      ["Нэр", "Тоот", "Гэрээ", "Үлдэгдэл"],
      ...(data?.avlaga?.khamgiinIkhUldegdel || []).map((r: any) => [
        r.ner || "-",
        r.toot || "-",
        r.gereeniiDugaar || "-",
        r.uldegdel ?? 0,
      ]),
    ]);
    khesegNemye("Төлөлтийн хувь (барилгаар)", [
      ["Барилга", "Нэхэмжилсэн", "Төлсөн", "Хувь"],
      ...tulultBarilgaar.map((r) => [
        barilgaNer[r.barilgiinId] || r.barilgiinId,
        r.nekhemjilsen,
        r.tulsun,
        `${r.khuvi}%`,
      ]),
    ]);

    // Excel нь UTF-8 BOM-гүй бол кирилл үсгийг эвдэж уншина.
    const blob = new Blob(["﻿" + murnuud.join("\n")], {
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
      {/* Хэвлэхэд: хөндлөн байрлал, шелл далдлах */}
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

      {/* Толгой: огнооны шүүлт баруун талд */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-theme" />}
          <FilterDatePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-[284px]"
          />
          <ExcelButton
            onClick={csvTatya}
            title="Бүх үзүүлэлтийг CSV-ээр татах"
            iconOnlyOnMobile
            className="khevlekh-nuuh"
          />
          <button
            onClick={khevleye}
            title="Тайланг хэвлэх"
            className="khevlekh-nuuh flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-[color:var(--surface-border)] transition-colors hover:bg-[color:var(--surface-hover)] dark:ring-white/10 dark:hover:bg-white/5"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi
          nert="Нийт нэхэмжилсэн"
          utga={dunFormat(kpi?.niitNekhemjilsen || 0)}
          icon={<Wallet className="h-5 w-5" />}
          ungu={UNGU.nogoon}
          uurchlult={<Uurchlult khuvi={uurchlult("nekhemjilsen")} />}
        />
        <Kpi
          nert="Төлсөн дүн"
          utga={dunFormat(kpi?.niitTulsun || 0)}
          icon={<CircleCheck className="h-5 w-5" />}
          ungu={UNGU.nogoon}
          uurchlult={<Uurchlult khuvi={uurchlult("tulsun")} />}
        />
        <Kpi
          nert="Үлдэгдэл дүн"
          utga={dunFormat(kpi?.niitUldegdel || 0)}
          icon={<Clock className="h-5 w-5" />}
          ungu={UNGU.shar}
          uurchlult={
            <p className="mt-2 text-[11px] text-[color:var(--muted-text)]">
              {tooFormat(kpi?.uldegdelteiGeree || 0)} гэрээнд · төлөлт{" "}
              <span className="font-medium text-[color:var(--panel-text)] dark:text-white">
                {kpi?.tsugluulgiinKhuvi ?? 0}%
              </span>
            </p>
          }
        />
        <Kpi
          nert="Нийт оршин суугч"
          utga={tooFormat(kpi?.niitOrshinSuugch || 0)}
          icon={<Users className="h-5 w-5" />}
          ungu={UNGU.tsenher}
        />
        <Kpi
          nert="Нийт харилцагч"
          utga={tooFormat(kpi?.niitGeree || 0)}
          icon={<Building2 className="h-5 w-5" />}
          ungu={UNGU.ochir}
        />
      </div>

      {/* Төлбөрийн орлого — бүтэн өргөн */}
      <Karti garchig="Төлбөрийн орлого (сараар)">
        <div className="h-[280px]">
          {orlogoMur.length > 0 ? (
            <Bar data={orlogoChart as any} options={orlogoTokhirgoo} />
          ) : (
            <Khooson />
          )}
        </div>
      </Karti>

      {/* Авлагын бүтэц, Топ 5, Төлөлтийн хувь */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Karti garchig="Авлагын бүтэц" khol="/tailan/avlagiin-nasjilt">
          <div className="mb-4 flex gap-4 border-b border-[color:var(--surface-border)] text-xs dark:border-white/10">
            {AVLAGA_TABUUD.map((t) => (
              <button
                key={t.key}
                onClick={() => setAvlagaTab(t.key)}
                className={`-mb-px border-b-2 pb-2 transition-colors ${
                  avlagaTab === t.key
                    ? "border-[color:var(--theme)] font-medium text-[color:var(--theme)]"
                    : "border-transparent text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                }`}
              >
                {t.ner}
              </button>
            ))}
          </div>
          {avlagaMurnuud.length > 0 ? (
            <div className="space-y-3.5">
              {avlagaMurnuud.map((r, i) => (
                <MurBar
                  key={r.ner + i}
                  ner={r.ner}
                  khuvi={(r.dun / avlagaIkh) * 100}
                  utga={dunKhuraangui(r.dun)}
                  ungu={
                    avlagaTab === "nasjilt"
                      ? [UNGU.nogoonTod, "#84cc16", UNGU.shar, "#f97316", UNGU.ulaan][i]
                      : UNGU.nogoon
                  }
                  icon={
                    <Receipt className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted-text)]" />
                  }
                />
              ))}
            </div>
          ) : (
            <Khooson />
          )}
        </Karti>

        <Karti garchig="Топ 5 үлдэгдэлтэй харилцагч" khol="/tailan/avlagiin-nasjilt">
          {top5.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[color:var(--muted-text)]">
                  <th className="w-6 pb-2 font-normal">№</th>
                  <th className="pb-2 font-normal">Нэр</th>
                  <th className="pb-2 font-normal">Тоот</th>
                  <th className="pb-2 text-right font-normal">Үлдэгдэл</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((r, i) => (
                  <tr
                    key={r.gereeniiId || i}
                    className="border-t border-[color:var(--surface-border)] dark:border-white/5"
                  >
                    <td className="py-2.5 text-[color:var(--muted-text)]">{i + 1}</td>
                    <td className="max-w-[9rem] truncate py-2.5 text-[color:var(--panel-text)] dark:text-white/90">
                      {r.ner || r.gereeniiDugaar || "-"}
                    </td>
                    <td className="py-2.5 text-[color:var(--muted-text)]">{r.toot || "-"}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-red-500">
                      {tooFormat(r.uldegdel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Khooson />
          )}
        </Karti>

        <Karti
          garchig="Төлөлтийн хувь (барилгаар)"
          delgets="lg:col-span-2 xl:col-span-1"
        >
          {tulultBarilgaar.length > 0 ? (
            <div className="max-h-[260px] space-y-3.5 overflow-y-auto pr-1">
              {tulultBarilgaar.map((r) => (
                <MurBar
                  key={r.barilgiinId}
                  ner={
                    barilgaNer[r.barilgiinId] ||
                    (r.barilgiinId === "-" ? "Тодорхойгүй" : r.barilgiinId)
                  }
                  khuvi={r.khuvi}
                  utga={`${Math.round(r.khuvi)}%`}
                  ungu={khuviinUngu(r.khuvi)}
                />
              ))}
            </div>
          ) : (
            <Khooson />
          )}
        </Karti>
      </div>

    </div>
  );
}
