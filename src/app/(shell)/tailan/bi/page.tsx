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

const Kpi: React.FC<{
  nert: string;
  utga: string;
  icon: React.ReactNode;
  ungu?: string;
}> = ({ nert, utga, icon, ungu }) => (
  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
    <div className="flex items-center gap-2">
      <span style={{ color: ungu || UNGU.bar }}>{icon}</span>
      <span className="truncate text-[10px] uppercase tracking-wider text-slate-400">
        {nert}
      </span>
    </div>
    <p
      className="mt-1.5 truncate text-lg font-semibold"
      style={{ color: ungu || undefined }}
      title={utga}
    >
      {utga}
    </p>
  </div>
);

const Karti: React.FC<{
  garchig: string;
  tailbar?: string;
  children: React.ReactNode;
  undur?: number;
  delgets?: string;
}> = ({ garchig, tailbar, children, undur = 220, delgets }) => (
  <div
    className={`flex flex-col rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10 ${delgets || ""}`}
  >
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
        {garchig}
      </h3>
      {tailbar && (
        <span className="shrink-0 text-[10px] text-slate-400">{tailbar}</span>
      )}
    </div>
    <div style={{ height: undur }}>{children}</div>
  </div>
);

const Khooson = () => (
  <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
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
          label: "Нэхэмжилсэн",
          data: rows.map((r: any) => r.nekhemjilsen),
          borderColor: UNGU.tsenher,
          backgroundColor: "rgba(59,130,246,0.10)",
          fill: true,
          tension: 0.35,
          pointRadius: rows.length > 20 ? 0 : 3,
          pointHitRadius: 12,
          borderWidth: 2,
        },
        {
          label: "Төлсөн",
          data: rows.map((r: any) => r.tulsun),
          borderColor: UNGU.nogoon,
          backgroundColor: "rgba(16,185,129,0.10)",
          fill: true,
          tension: 0.35,
          pointRadius: rows.length > 20 ? 0 : 3,
          pointHitRadius: 12,
          borderWidth: 2,
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

  /* ── Зурах ── */
  if (error)
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-slate-500">Тайлан татахад алдаа гарлаа</p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 p-4">
      {/* Толгой */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            BI Тайлан
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {saruud.length > 0
              ? `${sarFormat(saruud[0])} — ${sarFormat(saruud[saruud.length - 1])}`
              : "Бүх үзүүлэлт нэг дэлгэцэнд"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
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
        tailbar="сараар"
        undur={260}
        delgets="xl:col-span-2"
      >
        <Line data={orlogoChart as any} options={suuriTokhirgoo(true)} />
      </Karti>

      {/* Авлага, гэрээ */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Karti garchig="Авлагын насжилт" tailbar="хоногоор">
          {nasjiltChart ? (
            <Bar data={nasjiltChart as any} options={suuriTokhirgoo()} />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Гэрээний төлөв">
          {gereeTuluvChart ? (
            <Doughnut data={gereeTuluvChart as any} options={buguiTokhirgoo} />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Гэрээ барилгаар">
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
        <Karti garchig="Төлбөрийн хэлбэр" tailbar="дүнгээр">
          {tulburKhelberChart ? (
            <Doughnut
              data={tulburKhelberChart as any}
              options={buguiTokhirgoo}
            />
          ) : (
            <Khooson />
          )}
        </Karti>
        <Karti garchig="Шинэ гэрээ" tailbar="сараар">
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
        <Karti garchig="Хамгийн их авлагатай" tailbar="тоот">
          {(data?.avlaga?.khamgiinIkhUldegdel || []).length > 0 ? (
            <div className="h-full space-y-1.5 overflow-y-auto pr-1">
              {data.avlaga.khamgiinIkhUldegdel.map((r: any, i: number) => (
                <div
                  key={r.gereeniiId || i}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {i + 1}. {r.toot || r.gereeniiDugaar || "-"}
                  </span>
                  <span className="shrink-0 font-medium text-red-500">
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
        <Karti garchig="Зогсоолын төлбөр" tailbar="төрлөөр">
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
        <Karti garchig="Мэдэгдэл ба санал хүсэлт" tailbar="төрлөөр">
          {(data?.medegdel || []).length > 0 ? (
            <div className="h-full space-y-2 overflow-y-auto pr-1">
              {data.medegdel.map((r: any) => (
                <div key={r.turul}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {r.turul}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {tooFormat(r.too)}
                      {r.unshaagui > 0 && (
                        <span className="ml-1 text-amber-500">
                          ({tooFormat(r.unshaagui)} уншаагүй)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
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
        <p className="pb-4 text-center text-[11px] text-slate-400">
          Зогсоол дээр зөрчилтэй тэмдэглэгдсэн{" "}
          <span className="font-medium text-amber-500">
            {tooFormat(data.zogsool.zurchilteiToo)}
          </span>{" "}
          хөдөлгөөн байна
        </p>
      )}
    </div>
  );
}
