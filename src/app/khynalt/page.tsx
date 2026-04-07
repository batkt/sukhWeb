"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import uilchilgee from "@/lib/uilchilgee";
import { isPaidLike, getDefaultDateRange } from "@/lib/utils";
import { hasPermission } from "@/lib/permissionUtils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Line, Bar } from "react-chartjs-2";
import {
  Building2,
  Wallet,
  CircleDollarSign,
  Ban,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  RefreshCw,
  Users,
  UserCheck,
} from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
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
  Filler,
} from "chart.js";
import useSWR from "swr";
import formatNumber, {
  formatCurrency,
} from "../../../tools/function/formatNumber";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
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
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);

  const footerTotals = useTulburFooterTotals(
    token,
    ajiltan?.baiguullagiinId ?? null,
    effectiveBarilgiinId,
    dateRange?.[0],
    dateRange?.[1],
  );

  useEffect(() => setMounted(true), []);
  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: buildingConfig } = useSWR(
    shouldFetch && effectiveBarilgiinId
      ? ["/baiguullaga/", token, ajiltan.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: { baiguullagiinId: bId, barilgiinId: barId },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { orshinSuugchGaralt, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      ajiltan?.baiguullagiinId || "",
      {},
      effectiveBarilgiinId,
    );
  const { gereeGaralt, setGereeKhuudaslalt } = useGereeJagsaalt(
    {},
    shouldFetch ? token || undefined : undefined,
    shouldFetch ? ajiltan?.baiguullagiinId : undefined,
    effectiveBarilgiinId,
  );
  const { ajilchdiinGaralt, setAjiltniiKhuudaslalt } = useAjiltniiJagsaalt(
    shouldFetch ? token || "" : "",
    shouldFetch ? ajiltan?.baiguullagiinId || "" : "",
    effectiveBarilgiinId,
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

  const residents = useMemo(
    () => orshinSuugchGaralt?.jagsaalt || [],
    [orshinSuugchGaralt],
  );
  const contracts = useMemo(() => gereeGaralt?.jagsaalt || [], [gereeGaralt]);
  const employees = useMemo(
    () => ajilchdiinGaralt?.jagsaalt || [],
    [ajilchdiinGaralt],
  );

  const totalResidents =
    Number(orshinSuugchGaralt?.niitMur) || residents.length;

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const range = dateRange || getDefaultDateRange();
    return {
      start: range[0] || "",
      end: range[1] || "",
    };
  }, [dateRange]);

  const { labels: orderedLabels, buildLabel } = useMemo(() => {
    const start = rangeStart;
    const end = rangeEnd;
    const s = new Date(start);
    const e = new Date(end);
    const dayDiff = Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / 86400000),
    );
    const groupBy: "day" | "month" = dayDiff > 45 ? "month" : "day";

    const bl = (d: Date) => {
      if (groupBy === "day") return d.toISOString().slice(0, 10);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const labels: string[] = [];
    if (groupBy === "day") {
      const it = new Date(s);
      while (it <= e) {
        labels.push(bl(it));
        it.setDate(it.getDate() + 1);
      }
    } else {
      const it = new Date(s.getFullYear(), s.getMonth(), 1);
      const endMonth = new Date(e.getFullYear(), e.getMonth(), 1);
      while (it <= endMonth) {
        labels.push(bl(it));
        it.setMonth(it.getMonth() + 1);
      }
    }
    return { labels, buildLabel: bl };
  }, [rangeStart, rangeEnd]);

  const { data: incomeData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/nekhemjlekhiinTuukh",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const startIso = `${start}T00:00:00.000Z`;
      const endIso = `${end}T23:59:59.999Z`;
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          query: JSON.stringify({
            baiguullagiinId: bId,
            ...(barId ? { barilgiinId: barId } : {}),
            createdAt: { $gte: startIso, $lte: endIso },
          }),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: paymentData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/gereeniiTulsunAvlaga",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          ekhlekhOgnoo: start,
          duusakhOgnoo: end,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: overdueData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          `/tailan/udsan-avlaga`,
          token,
          effectiveBarilgiinId,
          ajiltan.baiguullagiinId,
        ]
      : null,
    async ([url, tkn, barId, bId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          ...(barId ? { barilgiinId: barId } : {}),
          baiguullagiinId: bId,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: cancelledData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          `/tailan/tsutslasan-gereenii-avlaga`,
          token,
          effectiveBarilgiinId,
          ajiltan.baiguullagiinId,
        ]
      : null,
    async ([url, tkn, barId, bId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          ...(barId ? { barilgiinId: barId } : {}),
          baiguullagiinId: bId,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  // Fetch building-wide payment summary for the selected period
  const { data: buildingPaymentSummary } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/tulsunSummary",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).post(url, {
        baiguullagiinId: bId,
        barilgiinId: barId,
        ekhlekhOgnoo: start,
        duusakhOgnoo: end,
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: orlogoAvlagaData } = useSWR(
    token &&
      ajiltan?.baiguullagiinId &&
      effectiveBarilgiinId &&
      rangeStart &&
      rangeEnd
      ? [
          "/tailan/orlogo-avlaga",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).post("/tailan/orlogo-avlaga", {
        baiguullagiinId: bId,
        barilgiinId: barId,
        ekhlekhOgnoo: start,
        duusakhOgnoo: end,
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: monthlyMatrixData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/tailan/resident-monthly-matrix",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).post(url, {
        baiguullagiinId: bId,
        barilgiinId: barId,
        ekhlekhOgnoo: start,
        duusakhOgnoo: end,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000,
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const matrixTotalBilled = useMemo(() => {
    if (!monthlyMatrixData?.list || !monthlyMatrixData?.periods) return 0;
    const periods = monthlyMatrixData.periods;
    const currentPeriod = periods[periods.length - 1];
    if (!currentPeriod) return 0;

    return (monthlyMatrixData.list as any[]).reduce((sum, item) => {
      const billed = Number(item?.months?.[currentPeriod]?.billed ?? 0);
      return sum + billed;
    }, 0);
  }, [monthlyMatrixData]);

  const {
    totalOrlogoFromTailan,
    residentsPaidCountFromTailan,
    residentsUnpaidCountFromTailan,
  } = useMemo(() => {
    const rawPaid = Array.isArray(orlogoAvlagaData?.paid?.list)
      ? orlogoAvlagaData.paid.list
      : [];
    const paid = rawPaid.filter(
      (item: any) => (Number(item?.tulsunDun ?? item?.tulsun ?? 0) || 0) > 0,
    );
    const total = paid.reduce(
      (sum: number, item: any) =>
        sum + (Number(item?.tulsunDun ?? item?.tulsun ?? 0) || 0),
      0,
    );
    const rawUnpaid = Array.isArray(orlogoAvlagaData?.unpaid?.list)
      ? orlogoAvlagaData.unpaid.list
      : [];
    return {
      totalOrlogoFromTailan: total,
      residentsPaidCountFromTailan: paid.length,
      residentsUnpaidCountFromTailan: rawUnpaid.length,
    };
  }, [orlogoAvlagaData]);

  const { data: avlagiinNasjiltData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/tailan/avlagiin-nasjilt",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).post("/tailan/avlagiin-nasjilt", {
        baiguullagiinId: bId,
        barilgiinId: barId,
        ekhlekhOgnoo: start,
        duusakhOgnoo: end,
        view: "detailed",
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 5000,
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: tulukhAvlagaData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/gereeniiTulukhAvlaga",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId,
        ]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const ekhniiUldegdelTotal = useMemo(() => {
    const list = Array.isArray(tulukhAvlagaData?.jagsaalt)
      ? tulukhAvlagaData.jagsaalt
      : [];

    return list
      .filter((item: any) => item.ekhniiUldegdelEsekh === true)
      .reduce((sum: number, item: any) => sum + Number(item.uldegdel || 0), 0);
  }, [tulukhAvlagaData]);

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
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme-mode" || e.key === "app-theme") compute();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      obs.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const incomeComputed = useMemo(() => {
    const list: any[] = Array.isArray(incomeData?.jagsaalt)
      ? incomeData.jagsaalt
      : Array.isArray(incomeData)
        ? incomeData
        : [];

    const paymentList: any[] = Array.isArray(paymentData?.jagsaalt)
      ? paymentData.jagsaalt
      : Array.isArray(paymentData)
        ? paymentData
        : [];

    const residentById = new Map<string, any>();
    residents.forEach((r: any) => residentById.set(String(r._id || ""), r));

    const norm = (v: any) =>
      String(v ?? "")
        .trim()
        .toLowerCase();
    const resIndex = new Map<string, string>();
    const makeResKeysLocal = (r: any): string[] => {
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
      makeResKeysLocal(r).forEach((k) => resIndex.set(k, id));
    });

    let paid = 0;
    let unpaid = 0;
    const byBld: Record<string, number> = {};
    const seriesMap = new Map<string, { paid: number; unpaid: number }>();

    const residentInvoiceStats = new Map<
      string,
      { totalTulbur: number; totalTulsun: number }
    >();
    residents.forEach((r: any) => {
      residentInvoiceStats.set(String(r._id || ""), {
        totalTulbur: 0,
        totalTulsun: 0,
      });
    });

    list.forEach((it) => {
      const amount =
        Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
      const backendUldegdel = it.uldegdel != null ? Number(it.uldegdel) : null;
      const uldegdelInvoice =
        backendUldegdel !== null
          ? backendUldegdel > 0
            ? backendUldegdel
            : isPaidLike(it)
              ? 0
              : amount
          : isPaidLike(it)
            ? 0
            : amount;
      const tulsunInvoice = amount - uldegdelInvoice;

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
      if (ovog || ner || toot) invoiceKeys.push(`name|${ovog}|${ner}|${toot}`);

      let osId = "";
      for (const k of invoiceKeys) {
        const found = resIndex.get(k);
        if (found) {
          osId = found;
          break;
        }
      }

      if (osId && residentInvoiceStats.has(osId)) {
        const stats = residentInvoiceStats.get(osId)!;
        stats.totalTulbur += amount;
        stats.totalTulsun += tulsunInvoice;
      }

      paid += tulsunInvoice;
      unpaid += Math.max(0, uldegdelInvoice);

      const barilga =
        osId && residentById.has(osId)
          ? residentById.get(osId)?.barilgiinId ||
            residentById.get(osId)?.barilga
          : it?.barilgiinId || "Тодорхойгүй";
      byBld[barilga] = (byBld[barilga] || 0) + amount;

      // For the time series, map INVOICE creation date ONLY for unpaid/billed amounts
      const created = String(it?.createdAt || it?.ognoo || it?.date || "");
      if (created) {
        const d = new Date(created);
        const key = buildLabel(d);
        const curr = seriesMap.get(key) || { paid: 0, unpaid: 0 };
        // We only add unpaid here; paid will be filled accurately from actual payment records below.
        curr.unpaid += uldegdelInvoice;
        seriesMap.set(key, curr);
      }
    });

    // NOW iterate over actual payment records (receipts) to map the PAID time series
    paymentList.forEach((p) => {
      const paidAmt =
        Number(
          p?.tulsunDun ??
            p?.tulsun ??
            p?.niitTulbur ??
            p?.niitDun ??
            p?.total ??
            p?.tulur ??
            p?.tulukhDun ??
            p?.undsenDun ??
            p?.dun ??
            p?.sariinTurees ??
            0,
        ) || 0;
      const tulsunOgnooStr = String(
        p?.tulsunOgnoo || p?.createdAt || p?.ognoo || p?.date || "",
      );
      if (tulsunOgnooStr && paidAmt > 0) {
        const d = new Date(tulsunOgnooStr);
        const key = buildLabel(d);
        const curr = seriesMap.get(key) || { paid: 0, unpaid: 0 };
        curr.paid += paidAmt;
        seriesMap.set(key, curr);
      }
    });

    const finalPaidResidents = new Set<string>();
    const finalUnpaidResidents = new Set<string>();

    residentInvoiceStats.forEach((stats, osId) => {
      const uldegdel = stats.totalTulbur - stats.totalTulsun;
      if (uldegdel > 1) {
        finalUnpaidResidents.add(osId);
      } else {
        finalPaidResidents.add(osId);
      }
    });

    // Synchronize with GuilgeeTuukh's footer totals for consistency
    const finalPaid = footerTotals.totalPaid;
    const finalUnpaid = footerTotals.totalUldegdel;

    const totalInvoiceAmount = list.reduce(
      (s, it) =>
        s + (Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0),
      0,
    );

    const paidArr: number[] = [];
    const unpaidArr: number[] = [];
    orderedLabels.forEach((lb) => {
      const v = seriesMap.get(lb) || { paid: 0, unpaid: 0 };
      paidArr.push(v.paid);
      unpaidArr.push(v.unpaid);
    });

    // Find the latest period with actual data for current month display
    const sortedPeriods = Array.from(seriesMap.keys()).sort();
    const latestPeriod = sortedPeriods[sortedPeriods.length - 1];
    const latestPeriodData = latestPeriod ? seriesMap.get(latestPeriod) : null;

    return {
      incomeTotals: { paid: finalPaid, unpaid: finalUnpaid },
      incomeByBuilding: byBld,
      residentsPaidCount: finalPaidResidents.size,
      residentsUnpaidCount: finalUnpaidResidents.size,
      incomeSeries: { labels: orderedLabels, paid: paidArr, unpaid: unpaidArr },
      expenseSeries: { labels: orderedLabels, expenses: unpaidArr },
      profitSeries: {
        labels: orderedLabels,
        profits: paidArr.map((p, i) => p - unpaidArr[i]),
      },
      currentMonthTotal: latestPeriodData || { paid: 0, unpaid: 0 },
      currentMonthLabel: latestPeriod || "",
    };
  }, [
    incomeData,
    paymentData,
    residents,
    orderedLabels,
    buildLabel,
    buildingPaymentSummary,
    ekhniiUldegdelTotal,
    orlogoAvlagaData,
  ]);

  const {
    incomeTotals,
    incomeSeries,
    expenseSeries,
    profitSeries,
    currentMonthTotal,
  } = incomeComputed;

  // Calculate current month total from the actual data periods
  const currentMonthTotalComputed = useMemo(() => {
    // If we have matrix data, use that for the billing total as it's more accurate
    if (matrixTotalBilled > 0) {
      if (monthlyMatrixData?.list && monthlyMatrixData?.periods) {
        const periods = monthlyMatrixData.periods;
        const currentPeriod = periods[periods.length - 1];
        if (currentPeriod) {
          let mPaid = 0;
          let mBilled = 0;
          (monthlyMatrixData.list as any[]).forEach((item) => {
            mPaid += Number(item?.months?.[currentPeriod]?.paid ?? 0);
            mBilled += Number(item?.months?.[currentPeriod]?.billed ?? 0);
          });
          return {
            paid: mPaid,
            unpaid: Math.max(0, mBilled - mPaid),
            total: mBilled,
          };
        }
      }
      return {
        paid: incomeTotals.paid,
        unpaid: incomeTotals.unpaid,
        total: matrixTotalBilled,
      };
    }

    const { paid, unpaid } = currentMonthTotal || { paid: 0, unpaid: 0 };
    // If we have actual current month data, use it
    if (paid > 0 || unpaid > 0) {
      return { paid, unpaid, total: paid + unpaid };
    }
    // Fallback to incomeTotals if no specific current month data
    return {
      paid: incomeTotals.paid,
      unpaid: incomeTotals.unpaid,
      total: incomeTotals.paid + incomeTotals.unpaid,
    };
  }, [currentMonthTotal, incomeTotals, matrixTotalBilled]);

  const overdue2m = useMemo(() => {
    if (overdueData?.success) {
      return {
        count: overdueData.total || 0,
        total: overdueData.sum || 0,
        items: overdueData.list || [],
      };
    }
    return { count: 0, total: 0, items: [] };
  }, [overdueData]);

  /**
   * Төлөлтийн "өргөн" — нэг гэрээнд олон удаа төлсөн тохиолдлыг нэгтгэж,
   * хугацаанд хэдэн өөр гэрээ/айл мөнгө төлсөн, мөнгө хэдэн өдөр тараагдан орсоныг харуулна.
   */
  const paymentEngagementStats = useMemo(() => {
    const list = Array.isArray(paymentData?.jagsaalt)
      ? paymentData.jagsaalt
      : [];
    let transactionCount = 0;
    let totalSum = 0;
    const payerKeys = new Set<string>();
    const dayTotals = new Map<string, number>();

    list.forEach((p: any, idx: number) => {
      const amt =
        Number(
          p?.tulsunDun ??
            p?.tulsun ??
            p?.niitTulbur ??
            p?.niitDun ??
            p?.total ??
            p?.tulur ??
            p?.tulukhDun ??
            p?.undsenDun ??
            p?.dun ??
            p?.sariinTurees ??
            0,
        ) || 0;
      if (amt <= 0) return;

      transactionCount += 1;
      totalSum += amt;

      const gid = String(p?.gereeniiId ?? p?.gereeId ?? "").trim();
      const dugar = String(p?.gereeniiDugaar ?? "").trim();
      const resId = String(p?.orshinSuugchId ?? p?.residentId ?? "").trim();
      payerKeys.add(gid || dugar || resId || `tx:${String(p?._id ?? idx)}`);

      const rawDate = String(
        p?.tulsunOgnoo ?? p?.createdAt ?? p?.ognoo ?? p?.date ?? "",
      );
      const dayKey = rawDate.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
        dayTotals.set(dayKey, (dayTotals.get(dayKey) || 0) + amt);
      }
    });

    let peakDay = "";
    let peakDaySum = 0;
    dayTotals.forEach((s, d) => {
      if (s > peakDaySum) {
        peakDaySum = s;
        peakDay = d;
      }
    });

    const uniquePayers = payerKeys.size;
    return {
      transactionCount,
      totalSum,
      uniquePayers,
      avgPerPayer: uniquePayers > 0 ? totalSum / uniquePayers : 0,
      activePaymentDays: dayTotals.size,
      peakDay,
      peakDaySum,
    };
  }, [paymentData]);

  const avlagaAgingMap = useMemo(() => {
    const list =
      avlagiinNasjiltData?.detailed?.list ??
      avlagiinNasjiltData?.jagsaalt ??
      [];
    const map = new Map<
      string,
      { daysOverdue?: number; monthsOverdue?: number; ageBucket?: string }
    >();
    (Array.isArray(list) ? list : []).forEach((it: any) => {
      const gd = it?.gereeniiDugaar ?? it?.gereeniiId;
      if (gd) {
        const aging = {
          daysOverdue: it?.daysOverdue,
          monthsOverdue: it?.monthsOverdue,
          ageBucket: it?.ageBucket,
        };
        map.set(String(gd), aging);
        if (it?.gereeniiId && String(it.gereeniiId) !== String(gd)) {
          map.set(String(it.gereeniiId), aging);
        }
      }
    });
    return map;
  }, [avlagiinNasjiltData]);

  const formatAvlagaAge = (it: any): string => {
    const key = it?.gereeniiDugaar ?? it?.gereeniiId ?? "";
    const aging = avlagaAgingMap.get(String(key));
    const months = it?.monthsOverdue ?? aging?.monthsOverdue;
    const days = it?.daysOverdue ?? aging?.daysOverdue;
    const ageBucket = it?.ageBucket ?? aging?.ageBucket;
    if (months != null && Number(months) > 0) return `${months} сар хэтэрсэн`;
    if (days != null && Number(days) > 0) return `${days} хоног хэтэрсэн`;
    if (ageBucket === "0-30") return "30 хоног хүртэл";
    if (ageBucket === "31-60") return "31-60 хоног";
    if (ageBucket === "61-90" || ageBucket === "91-180") return "61+ хоног";
    if (ageBucket === "180+") return "180+ хоног";
    const oldestOgnoo = it?.oldestOgnoo ?? it?.ognoo;
    if (oldestOgnoo) {
      const d = new Date(oldestOgnoo);
      if (!isNaN(d.getTime())) {
        const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (diffDays > 0) return `${diffDays} хоног хэтэрсэн`;
      }
    }
    return it?.gereeniiDugaar ? "Төлбөр дутуу" : "Төлбөр дутуу";
  };

  const huurimtlagdsanAvlaga = useMemo(() => {
    const unpaidList = Array.isArray(orlogoAvlagaData?.unpaid?.list)
      ? orlogoAvlagaData.unpaid.list
      : [];
    const unpaidSum = Number(orlogoAvlagaData?.unpaid?.sum ?? 0) || 0;

    if (unpaidList.length > 0) {
      const items = unpaidList.map((it: any) => {
        const amount =
          Number(it?.uldegdel ?? it?.niitTulbur ?? it?.tulbur ?? 0) || 0;
        const name = [it?.ovog, it?.ner, it?.toot].filter(Boolean).join(" ");
        return {
          ...it,
          amount,
          name: name || it?.gereeniiDugaar || "-",
          dugaalaltDugaar: it?.gereeniiDugaar || it?._id || it?.dugaalaltDugaar,
        };
      });
      return {
        count: new Set(
          items.map((it: any) => it?.gereeniiDugaar || it?.orshinSuugchId),
        ).size,
        total: incomeTotals.unpaid,
        items,
      };
    }
    return overdue2m;
  }, [orlogoAvlagaData, overdue2m]);

  const cancelledReceivables = useMemo(() => {
    if (cancelledData?.success && (cancelledData.list?.length ?? 0) > 0) {
      return {
        count: cancelledData.total || 0,
        total: cancelledData.sum || 0,
        items: cancelledData.list || [],
      };
    }
    const isCancelled = (c: any) => {
      const s = String(c?.tuluv ?? c?.status ?? "").toLowerCase();
      return (
        s.includes("цуцлагдсан") ||
        s.includes("цуцалсан") ||
        s.includes("идэвхгүй") ||
        s === "tsutlsasan"
      );
    };
    const cancelledContractIds = new Set(
      (contracts || [])
        .filter((c: any) => isCancelled(c))
        .map((c: any) => String(c._id || ""))
        .filter(Boolean),
    );
    const tulukhList = Array.isArray(tulukhAvlagaData?.jagsaalt)
      ? tulukhAvlagaData.jagsaalt
      : [];
    const byContract = new Map<string, { amount: number; item: any }>();
    tulukhList.forEach((rec: any) => {
      const gid = String(rec?.gereeniiId ?? "").trim();
      if (!gid || !cancelledContractIds.has(gid)) return;
      const amt =
        Number(rec?.uldegdel ?? rec?.undsenDun ?? rec?.tulukhDun ?? 0) || 0;
      if (amt <= 0) return;
      const existing = byContract.get(gid);
      if (existing) {
        existing.amount += amt;
      } else {
        byContract.set(gid, {
          amount: amt,
          item: {
            niitTulbur: amt,
            ovog: rec?.ovog,
            ner: rec?.ner,
            toot: rec?.toot,
            gereeniiDugaar: rec?.gereeniiDugaar,
            gereeniiTuluv: "Цуцлагдсан",
            dugaalaltDugaar: rec?.gereeniiDugaar || rec?._id,
          },
        });
      }
    });
    const items = Array.from(byContract.values()).map(({ amount, item }) => ({
      ...item,
      niitTulbur: amount,
    }));
    const total = items.reduce(
      (s, it) => s + (Number(it?.niitTulbur ?? 0) || 0),
      0,
    );
    return { count: items.length, total, items };
  }, [cancelledData, contracts, tulukhAvlagaData]);

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
          label: "Гүйцэтгэл",
          data: incomeSeries.paid,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#22c55e",
        },
        {
          label: "Төлөөгүй",
          data: incomeSeries.unpaid,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ef4444",
        },
      ],
    };
  }, [incomeSeries]);

  const huurimtlagdsanAvlagaChartData: Dataset = useMemo(() => {
    const topItems = huurimtlagdsanAvlaga.items.slice(0, 10);
    const labelFromToot = (it: any) => {
      const toot = String(
        it?.toot ?? it?.medeelel?.toot ?? it?.tootDugaar ?? "",
      ).trim();
      const raw =
        toot ||
        String(it?.gereeniiDugaar ?? it?.dugaalaltDugaar ?? "").trim() ||
        "-";
      const full = `Тоот: ${raw}`;
      return full.length > 16 ? full.slice(0, 15) + "…" : full;
    };
    return {
      labels: topItems.map(labelFromToot),
      datasets: [
        {
          label: "Төлбөр",
          data: topItems.map(
            (it: any) =>
              Number(it?.amount ?? it?.uldegdel ?? it?.niitTulbur ?? 0) || 0,
          ),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ef4444",
        },
      ],
    };
  }, [huurimtlagdsanAvlaga.items]);

  const tulburSummaryChartData: Dataset = useMemo(() => {
    return {
      labels: ["Эхний үлдэгдэл", "Сарын төлбөр", "Төлсөн", "Үлдэгдэл"],
      datasets: [
        {
          label: "Дүн",
          data: [
            ekhniiUldegdelTotal,
            currentMonthTotalComputed.total,
            incomeTotals.paid,
            incomeTotals.unpaid,
          ],
          backgroundColor: [
            "rgba(148, 163, 184, 0.55)",
            "rgba(148, 163, 184, 0.55)",
            "rgba(34, 197, 94, 0.45)",
            "rgba(239, 68, 68, 0.45)",
          ],
          borderColor: [
            "rgb(148, 163, 184)",
            "rgb(148, 163, 184)",
            "rgb(34, 197, 94)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 1,
          barPercentage: 0.5,
          borderRadius: 6,
        },
      ],
      total: incomeTotals.unpaid,
    } as any;
  }, [ekhniiUldegdelTotal, currentMonthTotalComputed.total, incomeTotals]);

  // formatCurrency is imported from tools/function/formatNumber (always 2 decimal places)

  const _startDate = new Date(rangeStart + "T00:00:00Z");
  const _endDate = new Date(rangeEnd + "T23:59:59Z");
  const _inRange = (dStr?: string | null) => {
    if (!dStr) return true;
    const d = new Date(String(dStr));
    if (isNaN(d.getTime())) return true;
    return d >= _startDate && d <= _endDate;
  };

  const filteredContracts = contracts.filter((c: any) => {
    const timeMatch = _inRange(
      c?.createdAt || c?.ognoo || c?.date || c?.duusakhOgnoo,
    );
    const buildingField = c?.barilgiinId ?? c?.barilga;
    const buildingMatch =
      !effectiveBarilgiinId ||
      String(buildingField) === String(effectiveBarilgiinId);
    return timeMatch && buildingMatch;
  });

  const filteredTotalResidents = totalResidents;
  const buildingCount = useMemo(() => {
    const raw = (baiguullaga as any)?.barilguud;
    if (Array.isArray(raw) && raw.length > 0) {
      const filtered = raw.filter((b: any) => {
        if (!b) return false;
        if (!b.ner) return true;
        return b.ner !== (baiguullaga as any)?.ner;
      });
      return filtered.length;
    }

    const set = new Set<string>();
    (residents || []).forEach((r: any) => {
      const bid = r?.barilgiinId ?? r?.barilga;
      if (bid) set.add(String(bid));
    });
    return set.size;
  }, [baiguullaga, residents]);

  const cancelledGerees = useMemo(() => {
    // Total Cancelled should also ignore the date range filter but respect building filter
    return contracts.filter((c: any) => {
      const buildingField = c?.barilgiinId ?? c?.barilga;
      const buildingMatch =
        !effectiveBarilgiinId ||
        String(buildingField) === String(effectiveBarilgiinId);
      if (!buildingMatch) return false;

      const status = String(c?.tuluv || c?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan" ||
        status === "Идэвхгүй" ||
        status.toLowerCase() === "идэвхгүй"
      );
    });
  }, [contracts, effectiveBarilgiinId]);

  const showTulbur =
    ajiltan &&
    (hasPermission(ajiltan, "/tulbur") || hasPermission(ajiltan, "tulbur"));

  /** KPI `color` (Tailwind gradient classes) → SVG stroke gradient stops */
  const kpiIconGradientStops: Record<string, [string, string]> = {
    "from-amber-500 to-orange-600": ["#f59e0b", "#ea580c"],
    "from-emerald-500 to-teal-600": ["#10b981", "#0d9488"],
    "from-indigo-500 to-indigo-600": ["#6366f1", "#4f46e5"],
    "from-purple-500 to-purple-600": ["#a855f7", "#9333ea"],
    "from-red-500 to-red-600": ["#ef4444", "#dc2626"],
  };

  const kpiCardsRaw = [
    {
      title: "2+ сар төлөөгүй",
      value: formatNumber(footerTotals.tuluvUnpaidCount ?? 0, 0),
      subtitle: "Төлбөр төлөгдөөгүй",
      color: "from-amber-500 to-orange-600",
      href: "/tulbur?tuluv=unpaid",
      icon: Users,
      delay: 100,
      show: showTulbur,
    },
    {
      title: "Төлөлт орсон гэрээ",
      value: formatNumber(paymentEngagementStats.uniquePayers, 0),
      subtitle: "Гүйлгээ хийгдсэн",
      color: "from-emerald-500 to-teal-600",
      href: "/tulbur",
      icon: UserCheck,
      delay: 200,
      show: showTulbur,
    },
    {
      title: "Сарын төлбөр",
      value: formatCurrency(currentMonthTotalComputed.total),
      subtitle: "Сарын нийт төлбөр",
      color: "from-indigo-500 to-indigo-600",
      icon: Building2,
      delay: 0,
      show: true,
    },
    {
      title: "Орлого/Гүйцэтгэл",
      value: formatCurrency(incomeTotals.paid),
      subtitle: "Төлсөн дүн",
      color: "from-purple-500 to-purple-600",
      href: "/tulbur",
      icon: Wallet,
      delay: 400,
      show: showTulbur,
    },
    {
      title: "Үлдэгдэл/Авлага",
      value: formatCurrency(incomeTotals.unpaid),
      subtitle: "Үлдэгдэл дүн",
      color: "from-red-500 to-red-600",
      href: "/tulbur",
      icon: CircleDollarSign,
      delay: 500,
      show: showTulbur,
    },
  ];

  const kpiCards = kpiCardsRaw.filter((c) => c.show !== false);

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex flex-col flex-1 min-h-full pl-4 pt-4 pb-8 pr-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 transition-all duration-700 pr-4 flex-shrink-0">
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div
              id="khynalt-date"
              className="btn-minimal h-[40px] w-[320px] flex items-center px-3"
            >
              <StandardDatePicker
                isRange={true}
                value={dateRange}
                onChange={(v: any) => setDateRange(v)}
                format="YYYY-MM-DD"
                allowClear
                placeholder="Огноо сонгох"
                classNames={{
                  root: "!h-full !w-full",
                  input:
                    "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                }}
              />
            </div>
          </div>

          <h1 className="text-2xl  text-[color:var(--panel-text)] leading-tight">
            Сайн байна уу{ajiltan?.ner ? `, ${ajiltan.ner}` : ""}
          </h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 pr-4 w-full flex-shrink-0">
          {kpiCards.map((card, index) => {
            const Icon = (card as any).icon;
            const CardContent = (
              <div className="h-full min-h-[110px] flex flex-col transition-shadow duration-200">
                <div className="flex items-start justify-between mb-2 flex-shrink-0">
                  <h3 className="text-sm font-medium text-[color:var(--panel-text)] opacity-80 truncate pr-2">
                    {card.title}
                  </h3>
                  {Icon &&
                    (() => {
                      const stops = kpiIconGradientStops[
                        (card as { color: string }).color
                      ] ?? ["#64748b", "#64748b"];
                      const gradId = `kpi-icon-grad-${index}`;
                      return (
                        <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          <svg
                            width="0"
                            height="0"
                            className="absolute"
                            aria-hidden
                          >
                            <defs>
                              <linearGradient
                                id={gradId}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                              >
                                <stop offset="0%" stopColor={stops[0]} />
                                <stop offset="100%" stopColor={stops[1]} />
                              </linearGradient>
                            </defs>
                          </svg>
                          <Icon
                            className="w-5 h-5"
                            stroke={`url(#${gradId})`}
                          />
                        </div>
                      );
                    })()}
                </div>
                <div className="flex-1 flex flex-col justify-end min-h-0">
                  <p className="text-[1.35rem] font-bold text-[color:var(--panel-text)] leading-none tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                    {card.value}
                  </p>
                  <p className="text-xs text-[color:var(--muted-text)] mt-1 min-h-[1.25rem] leading-tight">
                    {(card as { subtitle?: string }).subtitle ?? "\u00a0"}
                  </p>
                </div>
              </div>
            );

            const className = `neu-panel allow-overflow rounded-2xl p-4 transition-all duration-300 cursor-pointer flex-shrink-0 hover:scale-[1.02] hover:shadow-lg h-full min-h-[110px] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`;
            const style = {
              transitionDelay: `${card.delay}ms`,
              willChange: "opacity, transform",
            };

            if (card.href) {
              return (
                <Link
                  key={index}
                  href={card.href}
                  className={className}
                  style={style}
                >
                  {CardContent}
                </Link>
              );
            }

            return (
              <div key={index} className={className} style={style}>
                {CardContent}
              </div>
            );
          })}
        </div>

        <div className="w-full min-w-0 pr-4 py-2 space-y-5">
          <div className="flex flex-row flex-nowrap items-center justify-center gap-8 sm:gap-12 py-1 text-sm text-[color:var(--panel-text)]">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                aria-hidden
              />
              Гүйцэтгэл
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
                aria-hidden
              />
              Төлөөгүй
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400"
                aria-hidden
              />
              Дүн
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full min-w-0 items-stretch">
          <div
            className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "600ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
              <div className="mb-3 flex min-h-[2.75rem] shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-medium leading-snug text-[color:var(--panel-text)] shrink-0">
                  Орлого
                </h3>
              </div>
              <div className="relative min-h-0 flex-1 w-full">
                <Line
                  data={incomeLineData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        titleColor: "#fff",
                        bodyColor: "#e2e8f0",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: chartColors.text },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: chartColors.text },
                        grid: {
                          color: chartColors.grid,
                          tickBorderDash: [5, 5],
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "700ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
              <div className="mb-3 flex min-h-[2.75rem] shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-medium leading-snug text-[color:var(--panel-text)] shrink-0">
                  Авлага
                </h3>
                <p className="min-w-0 max-w-full text-right text-sm leading-snug text-[color:var(--muted-text)] tabular-nums sm:max-w-[70%] sm:whitespace-nowrap">
                  {huurimtlagdsanAvlaga.count} Оршин суугч /{" "}
                  {formatCurrency(huurimtlagdsanAvlaga.total)}
                </p>
              </div>
              <div className="relative min-h-0 flex-1 w-full">
                <Line
                  data={huurimtlagdsanAvlagaChartData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        titleColor: "#fff",
                        bodyColor: "#e2e8f0",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: chartColors.text, maxRotation: 45 },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: chartColors.text },
                        grid: {
                          color: chartColors.grid,
                          tickBorderDash: [5, 5],
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Summary Bar Chart */}
          <div
            className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "800ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
              <div className="mb-3 flex min-h-[2.75rem] shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-medium leading-snug text-[color:var(--panel-text)] shrink-0">
                  Төлбөрийн хураангуй
                </h3>
                <p className="min-w-0 max-w-full text-right text-sm leading-snug text-[color:var(--muted-text)] tabular-nums sm:max-w-[70%] sm:whitespace-nowrap">
                  Нийт гүйцэтгэл: {formatCurrency(incomeTotals.paid)}
                </p>
              </div>
              <div className="relative min-h-0 flex-1 w-full">
                <Bar
                  data={tulburSummaryChartData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    plugins: {
                      legend: { display: false },
                      title: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        titleColor: "#fff",
                        bodyColor: "#e2e8f0",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: chartColors.text },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: chartColors.text },
                        grid: {
                          color: chartColors.grid,
                          tickBorderDash: [5, 5],
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
