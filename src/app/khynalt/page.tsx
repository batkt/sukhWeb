"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import LineChart from "../../../components/tailan/chart/LineChart";
import HorizontalBarChart from "../../../components/tailan/chart/HorizontalBarChart";
import PieChart from "../../../components/tailan/chart/PieChart";
import uilchilgee from "../../../lib/uilchilgee";
import { useRouter } from "next/navigation";
import type { ChartData } from "chart.js";

type Dataset = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }>;
};

export default function Khynalt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    barilgiinId ? { barilgiinId } : {}
  );
  const { gereeGaralt } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    barilgiinId || undefined
  );
  const { ajilchdiinGaralt } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    barilgiinId || undefined
  );

  const residents = useMemo(
    () => orshinSuugchGaralt?.jagsaalt || [],
    [orshinSuugchGaralt]
  );
  const contracts = useMemo(() => gereeGaralt?.jagsaalt || [], [gereeGaralt]);
  const employees = useMemo(
    () => ajilchdiinGaralt?.jagsaalt || [],
    [ajilchdiinGaralt]
  );

  const totalResidents = residents.length;
  const totalContracts = contracts.length;
  const totalEmployees = employees.length;
  const totalBuildings = useMemo(() => {
    const set = new Set<string>();
    residents.forEach((r: any) => {
      if (r?.barilga) set.add(String(r.barilga));
    });
    return set.size;
  }, [residents]);

  const { activeContracts, expiringSoonPercent } = useMemo(() => {
    if (!contracts?.length)
      return { activeContracts: 0, expiringSoonPercent: 0 };
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    let active = 0;
    let expiringSoon = 0;
    contracts.forEach((g: any) => {
      const end = g?.duusakhOgnoo ? new Date(g.duusakhOgnoo) : null;
      if (!end || end >= now) active += 1;
      if (end && end >= now && end <= in30Days) expiringSoon += 1;
    });
    return {
      activeContracts: active,
      expiringSoonPercent: Math.round(
        (expiringSoon / Math.max(1, contracts.length)) * 100
      ),
    };
  }, [contracts]);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [incomeTotals, setIncomeTotals] = useState({ paid: 0, unpaid: 0 });
  const [incomeByBuilding, setIncomeByBuilding] = useState<
    Record<string, number>
  >({});
  const [prevTotals, setPrevTotals] = useState({ paid: 0, unpaid: 0 });
  const [topUnpaid, setTopUnpaid] = useState<
    Array<{ name: string; amount: number }>
  >([]);
  const [incomeSeries, setIncomeSeries] = useState<{
    labels: string[];
    paid: number[];
    unpaid: number[];
  }>({ labels: [], paid: [], unpaid: [] });

  useEffect(() => {
    // decide grouping by day or month based on range length
    const s = new Date(startDate);
    const e = new Date(endDate);
    const dayDiff = Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / 86400000)
    );
    const groupBy: "day" | "month" = dayDiff > 45 ? "month" : "day";

    const buildLabel = (d: Date) => {
      if (groupBy === "day") return d.toISOString().slice(0, 10); // YYYY-MM-DD
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    };
    const orderedLabels: string[] = [];
    if (groupBy === "day") {
      const it = new Date(s);
      while (it <= e) {
        orderedLabels.push(buildLabel(it));
        it.setDate(it.getDate() + 1);
      }
    } else {
      const it = new Date(s.getFullYear(), s.getMonth(), 1);
      const endMonth = new Date(e.getFullYear(), e.getMonth(), 1);
      while (it <= endMonth) {
        orderedLabels.push(buildLabel(it));
        it.setMonth(it.getMonth() + 1);
      }
    }

    const fetchIncome = async (rangeStart: string, rangeEnd: string) => {
      if (!token || !ajiltan?.baiguullagiinId)
        return {
          paid: 0,
          unpaid: 0,
          byBld: {} as Record<string, number>,
          unpaidByResident: {} as Record<string, number>,
          series: new Map<string, { paid: number; unpaid: number }>(),
        };
      try {
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 5000,
            query: {
              baiguullagiinId: ajiltan.baiguullagiinId,
              ...(barilgiinId ? { barilgiinId } : {}),
              createdAt: { $gte: rangeStart, $lte: rangeEnd },
            },
          },
        });
        const list: any[] = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];

        const residentById = new Map<string, any>();
        residents.forEach((r: any) => residentById.set(String(r._id || ""), r));

        let paid = 0;
        let unpaid = 0;
        const byBld: Record<string, number> = {};
        const unpaidByResident: Record<string, number> = {};
        const series = new Map<string, { paid: number; unpaid: number }>();
        list.forEach((it) => {
          const amount =
            Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
          const status = String(it?.tuluv || it?.status || "");
          if (status === "Төлсөн") paid += amount;
          else if (status === "Төлөөгүй") unpaid += amount;

          const osId = String(it?.orshinSuugchId || "");
          const barilga = residentById.get(osId)?.barilga || "Тодорхойгүй";
          byBld[barilga] = (byBld[barilga] || 0) + amount;
          if (status === "Төлөөгүй") {
            unpaidByResident[osId] = (unpaidByResident[osId] || 0) + amount;
          }

          const created = String(
            it?.createdAt || it?.ognoo || it?.date || rangeStart
          );
          const d = new Date(created);
          const key = buildLabel(d);
          const curr = series.get(key) || { paid: 0, unpaid: 0 };
          if (status === "Төлсөн") curr.paid += amount;
          else if (status === "Төлөөгүй") curr.unpaid += amount;
          series.set(key, curr);
        });

        return { paid, unpaid, byBld, unpaidByResident, series };
      } catch {
        return {
          paid: 0,
          unpaid: 0,
          byBld: {},
          unpaidByResident: {},
          series: new Map(),
        };
      }
    };

    (async () => {
      const curr = await fetchIncome(startDate, endDate);
      setIncomeTotals({ paid: curr.paid, unpaid: curr.unpaid });
      setIncomeByBuilding(curr.byBld);
      // top unpaid
      const unpaidEntries = Object.entries(curr.unpaidByResident || {})
        .map(([id, amt]) => {
          const r = residents.find((x: any) => String(x._id || "") === id);
          const name = r
            ? `${r?.ovog ? r.ovog + " " : ""}${r?.ner || ""}`.trim() ||
              "Тодорхойгүй"
            : "Тодорхойгүй";
          return { name, amount: amt as number };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setTopUnpaid(unpaidEntries);

      // build ordered series arrays aligned with labels
      const paidArr: number[] = [];
      const unpaidArr: number[] = [];
      orderedLabels.forEach((lb) => {
        const v = curr.series.get(lb) || { paid: 0, unpaid: 0 };
        paidArr.push(v.paid);
        unpaidArr.push(v.unpaid);
      });
      setIncomeSeries({
        labels: orderedLabels,
        paid: paidArr,
        unpaid: unpaidArr,
      });

      // previous period (same length immediately before start)
      const diff = Math.max(
        1,
        Math.ceil((e.getTime() - s.getTime()) / 86400000)
      );
      const prevEnd = new Date(s);
      prevEnd.setDate(s.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - diff + 1);
      const prev = await fetchIncome(
        prevStart.toISOString().slice(0, 10),
        prevEnd.toISOString().slice(0, 10)
      );
      setPrevTotals({ paid: prev.paid, unpaid: prev.unpaid });
    })();
  }, [
    token,
    ajiltan?.baiguullagiinId,
    barilgiinId,
    startDate,
    endDate,
    residents,
  ]);

  const incomeDelta = useMemo(
    () => pctDelta(prevTotals.paid, incomeTotals.paid),
    [prevTotals, incomeTotals]
  );
  const unpaidDelta = useMemo(
    () => pctDelta(prevTotals.unpaid, incomeTotals.unpaid),
    [prevTotals, incomeTotals]
  );

  // Build income line dataset
  const incomeLineData: Dataset = useMemo(() => {
    const pretty = incomeSeries.labels.map((lb) => {
      if (lb.length === 7) {
        const [y, m] = lb.split("-");
        return `${m}.${y.slice(2)}`; // MM.YY
      }
      const d = new Date(lb);
      return d.toLocaleDateString("mn-MN", {
        month: "2-digit",
        day: "2-digit",
      });
    });
    return {
      labels: pretty,
      datasets: [
        {
          label: "Төлсөн",
          data: incomeSeries.paid,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.25)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Төлөөгүй",
          data: incomeSeries.unpaid,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [incomeSeries]);

  const paymentBreakdownPie: ChartData<"pie", number[], string> = useMemo(
    () => ({
      labels: ["Төлсөн", "Төлөөгүй"],
      datasets: [
        {
          label: "Төлөв",
          data: [incomeTotals.paid, incomeTotals.unpaid],
          backgroundColor: ["#22c55e", "#ef4444"],
        },
      ],
    }),
    [incomeTotals]
  );

  function pctDelta(prev: number, curr: number) {
    if (prev <= 0 && curr <= 0) return 0;
    if (prev <= 0) return 100;
    return Math.round(((curr - prev) / prev) * 100);
  }

  function formatNumber(n: number) {
    return (n || 0).toLocaleString("mn-MN");
  }
  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar pr-2 text-[color:var(--panel-text)]">
      <div className="min-h-full grid grid-rows-[auto_auto_auto] gap-6">
        <div
          className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              Сайн байна уу{ajiltan?.ner ? `, ${ajiltan.ner}` : ""}
            </h1>
            <p className="text-sm opacity-80 mt-1">
              Танай байгууллагын товч мэдээлэл
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-5">
          <div
            role="button"
            title="Гэрээний жагсаалт"
            onClick={() => router.push("/geree")}
            className={`rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-sm opacity-70">Гэрээ</div>
            <div className="text-3xl font-extrabold mt-2">{totalContracts}</div>
            <div className="text-xs opacity-70 mt-1">
              Идэвхтэй: {activeContracts}
            </div>
          </div>
          <div
            role="button"
            title="Оршин суугчийн бүртгэл"
            onClick={() => router.push("/burtgel")}
            className={`rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-sm opacity-70">Оршин суугч</div>
            <div className="text-3xl font-extrabold mt-2">{totalResidents}</div>
            <div className="text-xs opacity-70 mt-1">
              Нийт барилга: {totalBuildings}
            </div>
          </div>
          <div
            role="button"
            title="Орлого (төлсөн) — нэхэмжлэхийн түүхээс"
            onClick={() => router.push("/tulbur/nekhemjlekh")}
            className={`rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-sm opacity-70">Орлого</div>
            <div className="text-3xl font-extrabold mt-2">
              {formatCurrency(incomeTotals.paid)}
            </div>
            <div
              className={`text-xs mt-1 ${
                incomeDelta >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {incomeDelta >= 0 ? "▲" : "▼"} {Math.abs(incomeDelta)}% өмнөх үеэс
            </div>
          </div>
          <div
            role="button"
            title="Төлөөгүй — нэхэмжлэхийн түүхээс"
            onClick={() => router.push("/tulbur/nekhemjlekh")}
            className={`rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-sm opacity-70">Төлбөр дутуу</div>
            <div className="text-3xl font-extrabold mt-2">
              {formatCurrency(incomeTotals.unpaid)}
            </div>
            <div
              className={`text-xs mt-1 ${
                unpaidDelta >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {unpaidDelta >= 0 ? "▲" : "▼"} {Math.abs(unpaidDelta)}% өмнөх үеэс
            </div>
          </div>
        </div>

        <div className="min-h-0 grid grid-cols-1 2xl:grid-cols-3 grid-rows-2 gap-5">
          <div
            className={`rounded-2xl p-5 2xl:col-span-2 row-span-1 h-full flex flex-col min-h-0 transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Орлогын тайлан</div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-transparent border border-white/10 shadow-none focus-visible:outline-none focus-visible:[box-shadow:0_0_0_2px_var(--focus-ring)]"
                />
                <span className="opacity-60">—</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-transparent border border-white/10 shadow-none focus-visible:outline-none focus-visible:[box-shadow:0_0_0_2px_var(--focus-ring)]"
                />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <LineChart data={incomeLineData as any} />
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 row-span-1 h-full flex flex-col min-h-0 transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="font-semibold mb-4">Төлбөрийн бүтэц</div>
            <div className="flex-1 min-h-0">
              <PieChart data={paymentBreakdownPie} />
            </div>
          </div>

          <div
            className={`rounded-2xl p-5 row-start-2 h-full flex flex-col min-h-0 transition-all duration-500 bg-transparent shadow-none border border-white/10 backdrop-blur-sm ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="font-semibold mb-4">Хамгийн их төлбөртэй</div>
            <ul className="space-y-3 overflow-auto">
              {topUnpaid.length === 0 && (
                <li className="text-sm opacity-70">Мэдээлэл алга</li>
              )}
              {topUnpaid.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs opacity-70">
                      Төлбөр: {formatCurrency(item.amount)}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/tulbur/nekhemjlekh")}
                    className="text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Харах
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
