"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import { postSummary, postOrlogoZarlaga } from "@/lib/tailanApi";
import uilchilgee from "../../../lib/uilchilgee";
import { useRouter } from "next/navigation";
import type { ChartData } from "chart.js";
import { Line } from "react-chartjs-2";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [timeFilter, setTimeFilter] = useState<
    "day" | "week" | "month" | "year"
  >("month");

  useEffect(() => setMounted(true), []);

  const { orshinSuugchGaralt, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      ajiltan?.baiguullagiinId || "",
      {},
      barilgiinId || undefined
    );
  const { gereeGaralt, setGereeKhuudaslalt } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    barilgiinId || undefined
  );
  const { ajilchdiinGaralt, setAjiltniiKhuudaslalt } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    barilgiinId || undefined
  );

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 100,
      search: "",
    });
    setGereeKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 100,
      search: "",
    });
    setAjiltniiKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 100,
      search: "",
    });
  }, [setOrshinSuugchKhuudaslalt, setGereeKhuudaslalt, setAjiltniiKhuudaslalt]);

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

  const getDateRange = (filter: "day" | "week" | "month" | "year") => {
    const now = new Date();
    const start = new Date();
    switch (filter) {
      case "day":
        start.setDate(now.getDate() - 1);
        break;
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    return {
      start: start.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    };
  };

  const [incomeTotals, setIncomeTotals] = useState({ paid: 0, unpaid: 0 });
  const [incomeByBuilding, setIncomeByBuilding] = useState<
    Record<string, number>
  >({});
  const [residentsPaidCount, setResidentsPaidCount] = useState(0);
  const [residentsUnpaidCount, setResidentsUnpaidCount] = useState(0);
  const [incomeSeries, setIncomeSeries] = useState<{
    labels: string[];
    paid: number[];
    unpaid: number[];
  }>({ labels: [], paid: [], unpaid: [] });

  const [expenseSeries, setExpenseSeries] = useState<{
    labels: string[];
    expenses: number[];
  }>({ labels: [], expenses: [] });

  const [profitSeries, setProfitSeries] = useState<{
    labels: string[];
    profits: number[];
  }>({ labels: [], profits: [] });

  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const { start, end } = getDateRange(timeFilter);
    const s = new Date(start);
    const e = new Date(end);
    const dayDiff = Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / 86400000)
    );
    const groupBy: "day" | "month" = dayDiff > 45 ? "month" : "day";

    const buildLabel = (d: Date) => {
      if (groupBy === "day") return d.toISOString().slice(0, 10);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
          series: new Map<string, { paid: number; unpaid: number }>(),
          residentsPaid: 0,
          residentsUnpaid: 0,
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
        const series = new Map<string, { paid: number; unpaid: number }>();
        const paidResidents = new Set<string>();
        const unpaidResidents = new Set<string>();
        list.forEach((it) => {
          const amount =
            Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
          const status = String(it?.tuluv || it?.status || "");
          const osId = String(it?.orshinSuugchId || "");

          if (status === "Төлсөн") {
            paid += amount;
            if (osId) paidResidents.add(osId);
          } else if (status === "Төлөөгүй") {
            unpaid += amount;
            if (osId) unpaidResidents.add(osId);
          }

          const barilga = residentById.get(osId)?.barilga || "Тодорхойгүй";
          byBld[barilga] = (byBld[barilga] || 0) + amount;

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

        return {
          paid,
          unpaid,
          byBld,
          series,
          residentsPaid: paidResidents.size,
          residentsUnpaid: unpaidResidents.size,
        };
      } catch {
        return {
          paid: 0,
          unpaid: 0,
          byBld: {},
          series: new Map(),
          residentsPaid: 0,
          residentsUnpaid: 0,
        };
      }
    };

    (async () => {
      const curr = await fetchIncome(start, end);
      setIncomeTotals({ paid: curr.paid, unpaid: curr.unpaid });
      setIncomeByBuilding(curr.byBld);
      setResidentsPaidCount(curr.residentsPaid);
      setResidentsUnpaidCount(curr.residentsUnpaid);

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

      setExpenseSeries({
        labels: orderedLabels,
        expenses: unpaidArr,
      });

      setProfitSeries({
        labels: orderedLabels,
        profits: paidArr.map((p, i) => p - unpaidArr[i]),
      });
    })();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId, timeFilter, residents]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await postSummary(token, {
          baiguullagiinId: ajiltan.baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
        });
        setSummaryData(resp.data);
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      }
    };
    fetchSummary();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId]);

  const incomeLineData: Dataset = useMemo(() => {
    const pretty = incomeSeries.labels.map((lb) => {
      if (lb.length === 7) {
        const [y, m] = lb.split("-");
        return `${m}.${y.slice(2)}`;
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

  const expenseLineData: Dataset = useMemo(() => {
    const pretty = expenseSeries.labels.map((lb) => {
      if (lb.length === 7) {
        const [y, m] = lb.split("-");
        return `${m}.${y.slice(2)}`;
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
          label: "Зарлага",
          data: expenseSeries.expenses,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.25)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [expenseSeries]);

  const profitLineData: Dataset = useMemo(() => {
    const pretty = profitSeries.labels.map((lb) => {
      if (lb.length === 7) {
        const [y, m] = lb.split("-");
        return `${m}.${y.slice(2)}`;
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
          label: "Ашиг",
          data: profitSeries.profits,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.25)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [profitSeries]);

  function formatNumber(n: number) {
    return (n || 0).toLocaleString("mn-MN");
  }
  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  // apply the selected time filter to other KPI counts where possible
  const { start: _start, end: _end } = getDateRange(timeFilter);
  const _startDate = new Date(_start + "T00:00:00Z");
  const _endDate = new Date(_end + "T23:59:59Z");
  const _inRange = (dStr?: string | null) => {
    if (!dStr) return true;
    const d = new Date(String(dStr));
    if (isNaN(d.getTime())) return true;
    return d >= _startDate && d <= _endDate;
  };

  const filteredResidents = residents.filter((r: any) => {
    const timeMatch = _inRange(r?.createdAt || r?.ognoo || r?.date);
    const buildingMatch =
      !barilgiinId || String(r?.barilga) === String(barilgiinId);
    return timeMatch && buildingMatch;
  });
  const filteredContracts = contracts.filter((c: any) => {
    const timeMatch = _inRange(
      c?.createdAt || c?.ognoo || c?.date || c?.duusakhOgnoo
    );
    const buildingMatch =
      !barilgiinId || String(c?.barilgiinId) === String(barilgiinId);
    return timeMatch && buildingMatch;
  });
  const filteredEmployees = employees.filter((e: any) => {
    const timeMatch = _inRange(e?.createdAt || e?.ognoo || e?.date);
    const buildingMatch =
      !barilgiinId || String(e?.barilgiinId) === String(barilgiinId);
    return timeMatch && buildingMatch;
  });

  const filteredTotalResidents = filteredResidents.length;
  const filteredTotalContracts = filteredContracts.length;
  const filteredTotalEmployees = filteredEmployees.length;
  const filteredBuildings = barilgiinId
    ? 1
    : (() => {
        const set = new Set<string>();
        filteredResidents.forEach((r: any) => {
          if (r?.barilga) set.add(String(r.barilga));
        });
        return set.size;
      })();
  // compute active contracts and expiring percent from filtered contracts
  const filteredActiveContracts = (() => {
    if (!filteredContracts?.length) return 0;
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    let active = 0;
    filteredContracts.forEach((g: any) => {
      const end = g?.duusakhOgnoo ? new Date(g.duusakhOgnoo) : null;
      if (!end || end >= now) active += 1;
    });
    return active;
  })();
  const filteredExpiringSoonPercent = (() => {
    if (!filteredContracts?.length) return 0;
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    let expiringSoon = 0;
    filteredContracts.forEach((g: any) => {
      const end = g?.duusakhOgnoo ? new Date(g.duusakhOgnoo) : null;
      if (end && end >= now && end <= in30Days) expiringSoon += 1;
    });
    return Math.round(
      (expiringSoon / Math.max(1, filteredContracts.length)) * 100
    );
  })();

  // Calculate totals from chart data
  const totalIncome = incomeSeries.paid.reduce((sum, val) => sum + val, 0);
  const totalExpenses = expenseSeries.expenses.reduce(
    (sum, val) => sum + val,
    0
  );
  const totalProfit = profitSeries.profits.reduce((sum, val) => sum + val, 0);
  const totalTransactions =
    incomeSeries.paid.length > 0
      ? incomeSeries.paid.reduce(
          (sum, val, i) => sum + val + (incomeSeries.unpaid[i] || 0),
          0
        )
      : 0;

  const kpiCards = [
    {
      title: "Гэрээ",
      value: filteredTotalContracts,
      subtitle: `Идэвхтэй: ${filteredActiveContracts}`,
      color: "from-blue-500 to-blue-600",
      onClick: () => router.push("/geree"),
      delay: 0,
    },
    {
      title: "Оршин суугч",
      value: filteredTotalResidents,
      subtitle: `Нийт барилга: ${filteredBuildings}`,
      color: "from-green-500 to-green-600",
      onClick: () => router.push("/geree"),
      delay: 100,
    },
    {
      title: "Орлого",
      value: formatCurrency(incomeTotals.paid),
      subtitle: "Төлсөн дүн",
      color: "from-purple-500 to-purple-600",
      onClick: () => router.push("/tulbur"),
      delay: 200,
    },
    {
      title: "Төлбөр дутуу",
      value: formatCurrency(incomeTotals.unpaid),
      subtitle: "Төлөөгүй дүн",
      color: "from-red-500 to-red-600",
      onClick: () => router.push("/tulbur"),
      delay: 300,
    },
    {
      title: "Ажилчид",
      value: filteredTotalEmployees,
      subtitle: "Нийт ажилчид",
      color: "from-yellow-500 to-yellow-600",
      onClick: () => router.push("/geree"),
      delay: 400,
    },
    {
      title: "Барилга",
      value: filteredBuildings,
      subtitle: "Нийт барилга",
      color: "from-indigo-500 to-indigo-600",
      onClick: () => router.push("/geree"),
      delay: 500,
    },
  ];

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex items-center justify-between mb-6 transition-all duration-700">
          <h1 className="text-2xl font-bold text-[color:var(--panel-text)]">
            Сайн байна уу{ajiltan?.ner ? `, ${ajiltan.ner}` : ""}
          </h1>

          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex space-x-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-lg">
              {[
                { value: "day", label: "Өдөр" },
                { value: "week", label: "Долоо хоног" },
                { value: "month", label: "Сар" },
                { value: "year", label: "Жил" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value as any)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    timeFilter === option.value
                      ? "neu-panel bg-white/20 backdrop-blur-sm border border-white/20 text-[color:var(--panel-text)] shadow-inner"
                      : "bg-transparent hover:bg-white/5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {kpiCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              className={`neu-panel rounded-2xl p-4 transition-opacity duration-500 cursor-pointer ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: `${card.delay}ms`,
                willChange: "opacity, box-shadow",
              }}
            >
              <div className="h-full flex flex-col justify-between transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
                <div>
                  <h3 className="text-sm font-semibold text-[color:var(--panel-text)] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-2xl font-bold text-[color:var(--panel-text)] mb-1">
                    {card.value}
                  </p>
                </div>
                <p className="text-xs text-[color:var(--muted-text)]">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            onClick={() => router.push("/tailan/financial")}
            className={`neu-panel rounded-3xl p-4 transition-opacity duration-500 cursor-pointer ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "600ms",
              willChange: "opacity, box-shadow",
            }}
          >
            {/* inner wrapper: hover scale has no delay */}
            <div className="transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[color:var(--panel-text)]">
                  Орлогын тайлан
                </h3>
              </div>
              <div className="h-64">
                <Line
                  data={incomeLineData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" as const },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                      y: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Expenses Chart */}
          <div
            onClick={() => router.push("/tailan/financial")}
            className={`neu-panel rounded-3xl p-4 transition-opacity duration-500 cursor-pointer ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "700ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[color:var(--panel-text)]">
                  Зарлагын тайлан
                </h3>
              </div>
              <div className="h-64">
                <Line
                  data={expenseLineData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" as const },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                      y: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Profit Chart */}
          <div
            onClick={() => router.push("/tailan/financial")}
            className={`neu-panel rounded-3xl p-4 transition-opacity duration-500 cursor-pointer ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "800ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
              <h3 className="text-lg font-semibold text-[color:var(--panel-text)] mb-4">
                Ашгийн тайлан
              </h3>
              <div className="h-64">
                <Line
                  data={profitLineData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "top" as const },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                      y: {
                        ticks: { color: "var(--panel-text)" },
                        grid: { color: "var(--surface-border)" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary from Tailan */}
        <div
          className={`mt-6 neu-panel rounded-3xl p-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "900ms" }}
        >
          <h3 className="text-lg font-semibold text-[color:var(--panel-text)] mb-4">
            Тайлангийн дүгнэлт
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Нийт орлого
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Нийт зарлага
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {formatCurrency(totalProfit)}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">Ашиг</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {totalTransactions}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Нийт гүйлгээ
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div
          className={`mt-6 neu-panel rounded-3xl p-4 transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <h3 className="text-lg font-semibold text-[color:var(--panel-text)] mb-4">
            Нэмэлт мэдээлэл
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {residentsUnpaidCount}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Төлөөгүй оршин суугч
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {residentsPaidCount}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Төлсөн оршин суугч
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {filteredTotalResidents}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Оршин суугч
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
