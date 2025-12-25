"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import uilchilgee from "@/lib/uilchilgee";
import {
  getPaymentStatusLabel,
  isPaidLike,
  isUnpaidLike,
  isOverdueLike,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ChartData } from "chart.js";
import { Line } from "react-chartjs-2";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { useBuilding } from "@/context/BuildingContext";
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
import formatNumber from "../../../tools/function/formatNumber";

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
  const { token, ajiltan, barilgiinId, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // Date range (YYYY-MM-DD). Default last 30 days.
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => toISODate(today), [today]);
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  }, [today]);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([defaultStart, defaultEnd]);

  useEffect(() => setMounted(true), []);

  // State for building configuration, all residents and all contracts
  const [buildingConfig, setBuildingConfig] = useState<any>(null);
  const [allResidents, setAllResidents] = useState<any[]>([]);
  const [allContracts, setAllContracts] = useState<any[]>([]);

  const { orshinSuugchGaralt, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      ajiltan?.baiguullagiinId || "",
      {},
      effectiveBarilgiinId
    );
  const { gereeGaralt, setGereeKhuudaslalt } = useGereeJagsaalt(
    {},
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId
  );
  const { ajilchdiinGaralt, setAjiltniiKhuudaslalt } = useAjiltniiJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    effectiveBarilgiinId
  );

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 500,
      search: "",
    });
    setGereeKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 500,
      search: "",
    });
    setAjiltniiKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 500,
      search: "",
    });
  }, [setOrshinSuugchKhuudaslalt, setGereeKhuudaslalt, setAjiltniiKhuudaslalt]);

  useEffect(() => {
    const fetchBuildingConfig = async () => {
      if (!token || !ajiltan?.baiguullagiinId || !effectiveBarilgiinId) return;
      try {
        const response = await uilchilgee(token).get(`/baiguullaga/`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: effectiveBarilgiinId,
          },
        });
        setBuildingConfig(response.data);
      } catch (error) {
        console.error("Failed to fetch building config:", error);
      }
    };
    fetchBuildingConfig();
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  const residents = useMemo(
    () => orshinSuugchGaralt?.jagsaalt || [],
    [orshinSuugchGaralt]
  );
  const contracts = useMemo(() => gereeGaralt?.jagsaalt || [], [gereeGaralt]);
  const employees = useMemo(
    () => ajilchdiinGaralt?.jagsaalt || [],
    [ajilchdiinGaralt]
  );

  const totalResidents =
    Number(orshinSuugchGaralt?.niitMur) || residents.length;
  const totalContracts = Number(gereeGaralt?.niitMur) || contracts.length;
  const totalEmployees = Number(ajilchdiinGaralt?.niitMur) || employees.length;
  const totalBuildings = useMemo(() => {
    const set = new Set<string>();
    residents.forEach((r: any) => {
      const bid = r?.barilgiinId ?? r?.barilga;
      if (bid) set.add(String(bid));
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

  // Effective start/end strings based on current selection (fallback to last 30 days)
  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const end = (dateRange?.[1] as string) || defaultEnd;
    const start =
      (dateRange?.[0] as string) ||
      (() => {
        const e = new Date(end + "T00:00:00Z");
        const s = new Date(e);
        s.setDate(s.getDate() - 30);
        return toISODate(s);
      })();
    return { start, end };
  }, [dateRange, defaultEnd]);

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

  // Overdue 2+ months and cancelled-contract receivables
  const [overdue2m, setOverdue2m] = useState<{
    count: number;
    total: number;
    items: any[];
  }>({ count: 0, total: 0, items: [] });
  const [cancelledReceivables, setCancelledReceivables] = useState<{
    count: number;
    total: number;
    items: any[];
  }>({ count: 0, total: 0, items: [] });

  // Resolve CSS variable colors for Chart.js (canvas can't use var() directly)
  const [chartColors, setChartColors] = useState({
    text: "#0f172a", // light default
    grid: "rgba(15,23,42,0.2)",
  });

  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      const cs = getComputedStyle(document.documentElement);
      const text =
        (cs.getPropertyValue("--panel-text") || "").trim() || chartColors.text;
      const grid =
        (cs.getPropertyValue("--surface-border") || "").trim() ||
        chartColors.grid;
      setChartColors({ text, grid });
    };
    compute();
    // React to theme switches (data-mode / data-theme changes)
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "attributes") {
          compute();
          break;
        }
      }
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode", "data-theme"],
    });
    // Also listen to storage changes (theme toggled in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme-mode" || e.key === "app-theme") compute();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      obs.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const start = rangeStart;
    const end = rangeEnd;
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
        // Use full-day ISO ranges to avoid timezone mismatches
        const startIso = `${rangeStart}T00:00:00.000Z`;
        const endIso = `${rangeEnd}T23:59:59.999Z`;
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            // Include branch both top-level and inside nested query for maximum backend compatibility
            ...(effectiveBarilgiinId
              ? { barilgiinId: effectiveBarilgiinId }
              : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 5000,
            // Stringify query for backends expecting JSON in params
            query: JSON.stringify({
              baiguullagiinId: ajiltan.baiguullagiinId,
              ...(effectiveBarilgiinId
                ? { barilgiinId: effectiveBarilgiinId }
                : {}),
              // Prefer createdAt range; servers may also filter by issued/paid dates internally
              createdAt: { $gte: startIso, $lte: endIso },
            }),
          },
        });

        const list: any[] = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];

        const residentById = new Map<string, any>();
        residents.forEach((r: any) => residentById.set(String(r._id || ""), r));
        // Build multi-key index to match invoices without explicit orshinSuugchId
        const norm = (v: any) =>
          String(v ?? "")
            .trim()
            .toLowerCase();
        const resIndex = new Map<string, string>(); // key -> residentId
        const makeResKeys = (r: any): string[] => {
          const id = String(r?._id || "");
          const reg = norm(r?.register);
          const phone = norm(r?.utas);
          const ovog = norm(r?.ovog);
          const ner = norm(r?.ner);
          const toot = String(r?.toot ?? r?.medeelel?.toot ?? "").trim();
          const keys: string[] = [];
          if (id) keys.push(`id|${id}`);
          if (reg) keys.push(`reg|${reg}`);
          if (phone) keys.push(`phone|${phone}`);
          if (ovog || ner || toot) keys.push(`name|${ovog}|${ner}|${toot}`);
          return keys;
        };
        residents.forEach((r: any) => {
          const id = String(r?._id || "");
          if (!id) return;
          makeResKeys(r).forEach((k) => resIndex.set(k, id));
        });

        let paid = 0;
        let unpaid = 0;
        const byBld: Record<string, number> = {};
        const series = new Map<string, { paid: number; unpaid: number }>();
        const paidResidents = new Set<string>();
        const unpaidResidents = new Set<string>();
        list.forEach((it) => {
          const amount =
            Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
          const status = getPaymentStatusLabel(it);
          // Resolve resident id from invoice
          const invoiceKeys: string[] = [];
          const osIdRaw = String(it?.orshinSuugchId || "");
          if (osIdRaw) invoiceKeys.push(`id|${osIdRaw}`);
          const reg = norm(it?.register);
          if (reg) invoiceKeys.push(`reg|${reg}`);
          const utasVal = Array.isArray(it?.utas) ? it.utas[0] : it?.utas;
          const phone = norm(utasVal);
          if (phone) invoiceKeys.push(`phone|${phone}`);
          const ovog = norm(it?.ovog);
          const ner = norm(it?.ner);
          const toot = String(it?.medeelel?.toot ?? it?.toot ?? "").trim();
          if (ovog || ner || toot)
            invoiceKeys.push(`name|${ovog}|${ner}|${toot}`);
          let osId = "";
          for (const k of invoiceKeys) {
            const found = resIndex.get(k);
            if (found) {
              osId = found;
              break;
            }
          }

          const isPaid = isPaidLike(it);
          const isUnpaid = isUnpaidLike(it);

          if (isPaid) {
            paid += amount;
            if (osId) paidResidents.add(osId);
          } else if (isUnpaid) {
            unpaid += amount;
            if (osId) unpaidResidents.add(osId);
          }

          const barilga =
            residentById.get(osId)?.barilgiinId ||
            residentById.get(osId)?.barilga ||
            it?.barilgiinId ||
            "Тодорхойгүй";
          byBld[barilga] = (byBld[barilga] || 0) + amount;

          const created = String(
            it?.createdAt || it?.ognoo || it?.date || rangeStart
          );
          const d = new Date(created);
          const key = buildLabel(d);
          const curr = series.get(key) || { paid: 0, unpaid: 0 };
          if (isPaid) curr.paid += amount;
          else if (isUnpaid) curr.unpaid += amount;
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
  }, [
    token,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId,
    rangeStart,
    rangeEnd,
    residents,
  ]);

  useEffect(() => {
    const run = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const overdueResp = await uilchilgee(token).get(
          `/tailan/udsan-avlaga/${ajiltan.baiguullagiinId}`,
          {
            params: effectiveBarilgiinId
              ? { barilgiinId: effectiveBarilgiinId }
              : {},
          }
        );
        if (overdueResp.data?.success) {
          const data = overdueResp.data;
          setOverdue2m({
            count: data.total || 0,
            total: data.sum || 0,
            items: data.list || [],
          });
        } else {
          setOverdue2m({ count: 0, total: 0, items: [] });
        }

        const cancelledResp = await uilchilgee(token).get(
          `/tailan/tsutslasan-gereenii-avlaga/${ajiltan.baiguullagiinId}`,
          {
            params: effectiveBarilgiinId
              ? { barilgiinId: effectiveBarilgiinId }
              : {},
          }
        );
        if (cancelledResp.data?.success) {
          const data = cancelledResp.data;
          setCancelledReceivables({
            count: data.total || 0,
            total: data.sum || 0,
            items: data.list || [],
          });
        } else {
          setCancelledReceivables({ count: 0, total: 0, items: [] });
        }
      } catch (e) {
        setOverdue2m({ count: 0, total: 0, items: [] });
        setCancelledReceivables({ count: 0, total: 0, items: [] });
      }
    };
    run();
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

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

  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  const _startDate = new Date(rangeStart + "T00:00:00Z");
  const _endDate = new Date(rangeEnd + "T23:59:59Z");
  const _inRange = (dStr?: string | null) => {
    if (!dStr) return true;
    const d = new Date(String(dStr));
    if (isNaN(d.getTime())) return true;
    return d >= _startDate && d <= _endDate;
  };

  const filteredResidents = residents.filter((r: any) => {
    const timeMatch = _inRange(r?.createdAt || r?.ognoo || r?.date);
    const buildingField = r?.barilgiinId ?? r?.barilga;
    const buildingMatch =
      !effectiveBarilgiinId ||
      String(buildingField) === String(effectiveBarilgiinId);
    return timeMatch && buildingMatch;
  });
  const filteredContracts = contracts.filter((c: any) => {
    const timeMatch = _inRange(
      c?.createdAt || c?.ognoo || c?.date || c?.duusakhOgnoo
    );
    const buildingField = c?.barilgiinId ?? c?.barilga;
    const buildingMatch =
      !effectiveBarilgiinId ||
      String(buildingField) === String(effectiveBarilgiinId);
    return timeMatch && buildingMatch;
  });
  // Employees should not be time-filtered; show all employees for the selected building

  // Employees: show all employees for the selected building (do not time-filter)
  const filteredEmployees = employees.filter((e: any) => {
    const toStr = (v: any) => (v == null ? "" : String(v));
    const want = toStr(effectiveBarilgiinId);
    if (!want) return true; // if no building selected, show all
    // direct fields
    const direct = toStr(
      e?.barilgiinId ?? e?.barilga ?? e?.barilgaId ?? e?.branchId
    );
    if (direct && direct === want) return true;
    // arrays (assignments)
    const arr: any[] = Array.isArray(e?.barilguud) ? e.barilguud : [];
    for (const el of arr) {
      if (
        toStr(el) === want ||
        toStr(el?._id) === want ||
        toStr(el?.id) === want ||
        toStr(el?.barilgiinId) === want ||
        toStr(el?.barilgaId) === want ||
        toStr(el?.branchId) === want
      ) {
        return true;
      }
    }
    return false;
  });

  const filteredTotalResidents = filteredResidents.length - 1;
  const filteredTotalContracts = filteredContracts.length;
  const filteredTotalEmployees = filteredEmployees.length;
  // Building count should always reflect total organization buildings, not the selected filter
  const buildingCount = useMemo(() => {
    const raw = (baiguullaga as any)?.barilguud;
    if (Array.isArray(raw) && raw.length > 0) {
      // Exclude any entry that appears to be the organisation itself (same name)
      const filtered = raw.filter((b: any) => {
        if (!b) return false;
        if (!b.ner) return true; // keep entries without a name field
        return b.ner !== (baiguullaga as any)?.ner;
      });
      // If filtered has entries, use its length. If raw had entries but all were
      // filtered out (e.g. they were org-name duplicates), return 0.
      return filtered.length;
    }

    // Fallback: derive from all resident records if org data not available yet
    const set = new Set<string>();
    (residents || []).forEach((r: any) => {
      const bid = r?.barilgiinId ?? r?.barilga;
      if (bid) set.add(String(bid));
    });
    return set.size;
  }, [baiguullaga, residents]);
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

  const filteredNonAvtiveGereeCount = useMemo(() => {
    const now = new Date();
    return filteredContracts.filter((c: any) => {
      const status = String(c?.tuluv || c?.status || "").trim();
      const end = c?.duusakhOgnoo ? new Date(c.duusakhOgnoo) : null;
      const isCancelled =
        status === "Цуцалсан" || status === "Идэвхгүй" || status === "Идэвхгүй";
      const isExpired = end ? end < now : false;
      return isCancelled || isExpired;
    }).length;
  }, [filteredContracts]);

  // Count unique "toot" values from baiguullaga that are not signed in orshinSuugch
  const tootWithoutActiveGereeCount = useMemo(() => {
    // Get all toots from building configuration (davkhariinToonuud)
    const allTootsFromBaiguullaga = new Set<string>();
    if (buildingConfig?.barilguud && Array.isArray(buildingConfig.barilguud)) {
      buildingConfig.barilguud.forEach((building: any) => {
        if (building?._id === effectiveBarilgiinId) {
          const davkhariinToonuud = building?.tokhirgoo?.davkhariinToonuud;
          if (davkhariinToonuud && typeof davkhariinToonuud === "object") {
            // Extract all toots from davkhariinToonuud (including keys like "1::5")
            Object.values(davkhariinToonuud).forEach((toots: any) => {
              if (Array.isArray(toots)) {
                toots.forEach((toot: any) => {
                  const tootStr = String(toot || "").trim();
                  if (tootStr) allTootsFromBaiguullaga.add(tootStr);
                });
              }
            });
          }
        }
      });
    }

    // Get all unique toot values from orshinSuugch
    // Include both the main `toot` field and all toots from the `toots` array
    const allTootsFromOrshinSuugch = new Set<string>();
    allResidents.forEach((r: any) => {
      // Add main toot field
      const mainToot = String(r?.toot || "").trim();
      if (mainToot) allTootsFromOrshinSuugch.add(mainToot);

      // Add all toots from the toots array
      if (Array.isArray(r?.toots)) {
        r.toots.forEach((tootObj: any) => {
          const toot = String(tootObj?.toot || "").trim();
          if (toot) allTootsFromOrshinSuugch.add(toot);
        });
      }
    });

    // Count toots from baiguullaga that are NOT in orshinSuugch
    let count = 0;
    allTootsFromBaiguullaga.forEach((toot) => {
      if (!allTootsFromOrshinSuugch.has(toot)) {
        count++;
      }
    });

    return count;
  }, [buildingConfig, allResidents, effectiveBarilgiinId]);

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
      title: "Барилга",
      value: buildingCount,
      subtitle: "Нийт барилга",
      color: "from-indigo-500 to-indigo-600",

      delay: 0,
    },
    {
      title: "Оршин суугч",
      value: filteredTotalResidents,
      color: "from-green-500 to-green-600",
      onClick: () => {
        try {
          localStorage.setItem("geree.activeTab", "residents");
        } catch (e) {}
        router.push("/geree?tab=residents");
      },
      delay: 100,
    },
    {
      title: "Гэрээ",
      value: filteredTotalContracts,
      subtitle: `Идэвхтэй: ${filteredActiveContracts}`,
      color: "from-blue-500 to-blue-600",
      onClick: () => {
        try {
          localStorage.setItem("geree.activeTab", "contracts");
        } catch (e) {}
        router.push("/geree?tab=contracts");
      },
      delay: 200,
    },
    // {
    //   title: "Идэвхгүй тоот",
    //   value: tootWithoutActiveGereeCount,
    //   subtitle: "Идэвхтэй гэрээгүй тоотны тоо",
    //   color: "from-yellow-500 to-yellow-600",
    //   delay: 300,
    // },

    {
      title: "Орлого",
      value: formatCurrency(incomeTotals.paid),
      subtitle: "Төлсөн дүн",
      color: "from-purple-500 to-purple-600",
      onClick: () => router.push("/tulbur"),
      delay: 400,
    },
    {
      title: "Төлбөр дутуу",
      value: formatCurrency(incomeTotals.unpaid),
      subtitle: "Төлөөгүй дүн",
      color: "from-red-500 to-red-600",
      onClick: () => router.push("/tulbur"),
      delay: 500,
    },
  ];

  return (
    <div className="h-full overflow-hidden custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 transition-all duration-700">
          <h1 className="text-2xl font-bold text-[color:var(--panel-text)] leading-tight">
            Сайн байна уу{ajiltan?.ner ? `, ${ajiltan.ner}` : ""}
          </h1>

          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div
              className="neu-panel rounded-2xl border border-white/10 shadow-lg"
              style={{ overflow: "visible" }}
            >
              <div className="min-w-[220px]">
                <DatePickerInput
                  type="range"
                  value={dateRange}
                  onChange={(v: any) => setDateRange(v)}
                  valueFormat="YYYY-MM-DD"
                  className="w-full"
                  clearable
                />
              </div>
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
                      legend: {
                        position: "top" as const,
                        labels: { color: chartColors.text },
                      },
                      title: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { color: chartColors.text },
                        grid: { color: chartColors.grid },
                      },
                      y: {
                        ticks: { color: chartColors.text },
                        grid: { color: chartColors.grid },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Overdue receivables 2+ months */}
          <div
            className={`neu-panel rounded-3xl p-4 transition-opacity duration-500 cursor-pointer ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "700ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-[color:var(--panel-text)]">
                  Хуримтлагдсан авлага /+ 2сар /
                </h3>
                <div className="text-right">
                  <div className="text-sm text-[color:var(--muted-text)]">
                    Нийт
                  </div>
                  <div className="text-base font-semibold text-[color:var(--panel-text)]">
                    {overdue2m.count} / {formatCurrency(overdue2m.total)}
                  </div>
                </div>
              </div>
              <div className="h-64 overflow-auto custom-scrollbar pr-1">
                {overdue2m.items.slice(0, 12).map((it: any, idx: number) => {
                  const amount = Number(it?.niitTulbur ?? 0) || 0;
                  const name = [it?.ovog, it?.ner, it?.toot]
                    .filter(Boolean)
                    .join(" ");
                  const months = it?.monthsOverdue || 0;
                  return (
                    <div
                      key={it?.dugaalaltDugaar || idx}
                      className="flex items-center justify-between py-2 border-b border-[color:var(--surface-border)]/60 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[color:var(--panel-text)] truncate">
                          {name || it?.gereeniiDugaar || "-"}
                        </div>
                        <div className="text-xs text-[color:var(--muted-text)] truncate">
                          {months > 0
                            ? `${months} сар хэтэрсэн`
                            : `Хугацаа хэтэрсэн`}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-red-500">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  );
                })}
                {overdue2m.items.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-[color:var(--muted-text)]">
                    Мэдээлэл байхгүй
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cancelled contract receivables */}
          <div
            className={`neu-panel rounded-3xl p-4 transition-opacity duration-500 cursor-pointer ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "800ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="transition-shadow duration-200 hover:shadow-[0_12px_30px_var(--theme)]">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-[color:var(--panel-text)]">
                  Цуцлагдсан гэрээний авлага
                </h3>
                <div className="text-right">
                  <div className="text-sm text-[color:var(--muted-text)]">
                    Нийт
                  </div>
                  <div className="text-base font-semibold text-[color:var(--panel-text)]">
                    {cancelledReceivables.count} /{" "}
                    {formatCurrency(cancelledReceivables.total)}
                  </div>
                </div>
              </div>
              <div className="h-64 overflow-auto custom-scrollbar pr-1">
                {cancelledReceivables.items
                  .slice(0, 12)
                  .map((it: any, idx: number) => {
                    const amount = Number(it?.niitTulbur ?? 0) || 0;
                    const name = [it?.ovog, it?.ner, it?.toot]
                      .filter(Boolean)
                      .join(" ");
                    const label =
                      it?.gereeniiTuluv || it?.tuluv || "Цуцлагдсан";
                    return (
                      <div
                        key={it?.dugaalaltDugaar || idx}
                        className="flex items-center justify-between py-2 border-b border-[color:var(--surface-border)]/60 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[color:var(--panel-text)] truncate">
                            {name || it?.gereeniiDugaar || "-"}
                          </div>
                          <div className="text-xs text-[color:var(--muted-text)] truncate">
                            {label}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-500">
                          {formatCurrency(amount)}
                        </div>
                      </div>
                    );
                  })}
                {cancelledReceivables.items.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-[color:var(--muted-text)]">
                    Мэдээлэл байхгүй
                  </div>
                )}
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
            {/* <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--theme)]">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-sm text-[color:var(--muted-text)]">
                Нийт зарлага
              </p>
            </div> */}
            {/* <div className="text-center">
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
            </div> */}
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

        {/* Additional Info */}
        {/* <div
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
        </div> */}
      </div>
    </div>
  );
}
