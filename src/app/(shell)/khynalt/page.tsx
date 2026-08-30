"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import uilchilgee from "@/lib/uilchilgee";
import { isPaidLike, getDefaultDateRange } from "@/lib/utils";
import {
  medegdelDun,
  ognooKharitsangui,
  ognooTsagButen,
} from "@/lib/ognoo";
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
  Search,
  BarChart3,
  Check,
  ChevronDown,
  Filter,
  Layers,
  CheckSquare,
  Square,
  X,
  ArrowUpDown,
  SlidersHorizontal,
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
} from "../../../../tools/function/formatNumber";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import { useRegisterTourSteps } from "@/context/TourContext";
import { useTourSteps } from "@/lib/useTourSteps";

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
  const { selectedBuildingId, setSelectedBuildingId, isInitialized } = useBuilding();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Organization buildings
  const allBuildings = useMemo(() => {
    const list = baiguullaga?.barilguud || [];
    return (list as any[]).filter((b) => b && b._id && b.ner);
  }, [baiguullaga]);

  // Comparison & Filter Mode: "single" | "all" | "compare"
  const [buildingFilterMode, setBuildingFilterMode] = useState<"single" | "all" | "compare">("single");
  const [compareBuildingIds, setCompareBuildingIds] = useState<string[]>([]);
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [buildingSearch, setBuildingSearch] = useState("");
  const buildingDropdownRef = useRef<HTMLDivElement>(null);

  // Effective building ID for single-building queries
  const effectiveBarilgiinId =
    buildingFilterMode === "all" || buildingFilterMode === "compare"
      ? undefined
      : selectedBuildingId || barilgiinId || undefined;

  // Initialize comparison building list with all buildings
  useEffect(() => {
    if (allBuildings.length > 0 && compareBuildingIds.length === 0) {
      setCompareBuildingIds(allBuildings.map((b) => String(b._id)));
    }
  }, [allBuildings, compareBuildingIds.length]);

  // Close building dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buildingDropdownRef.current &&
        !buildingDropdownRef.current.contains(e.target as Node)
      ) {
        setBuildingDropdownOpen(false);
      }
    };
    if (buildingDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [buildingDropdownOpen]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m + 1, 0);

    const f = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return [f(start), f(end)];
  });

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
    shouldFetch && ajiltan?.baiguullagiinId
      ? ["/baiguullaga", token, ajiltan.baiguullagiinId]
      : null,
    async ([url, tkn, bId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(`${url}/${bId}`);
      return resp.data?.result || resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { orshinSuugchGaralt, setOrshinSuugchKhuudaslalt } =
    useOrshinSuugchJagsaalt(
      token || "",
      ajiltan?.baiguullagiinId || "",
      undefined,
      effectiveBarilgiinId,
    );
  const { gereeGaralt, setGereeKhuudaslalt } = useGereeJagsaalt(
    undefined,
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
    let range = dateRange;
    if (!range) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m + 1, 0);

      const f = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      range = [f(start), f(end)];
    }
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
    // Хугацааны уртаас хамааруулж бүлэглэлээ сонгоно. Өмнө нь 45 хоногоос
    // урт бүхэн САР болдог байсан тул 2 сарын сонголт ердөө 2 цэг үүсгэж,
    // график шулуун зураас болж хувирдаг байв. Долоо хоногийн түвшин нэмснээр
    // дунд урттай хугацаанд ч утга учиртай олон цэг гарна.
    const groupBy: "day" | "week" | "month" =
      dayDiff <= 62 ? "day" : dayDiff <= 400 ? "week" : "month";

    /** Тухайн өдрийг агуулах долоо хоногийн ДАВАА гарагийг буцаана */
    const dolooKhonogiinEkhlel = (d: Date) => {
      const kh = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      // getDay(): 0 = Ням. Даваа гарагийг эхлэл болгоно.
      kh.setDate(kh.getDate() - ((kh.getDay() + 6) % 7));
      return kh;
    };

    /** Цагийн бүсээс хамаарахгүй YYYY-MM-DD */
    const udriinTulkhuur = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`;

    const bl = (d: Date) => {
      if (groupBy === "day") return udriinTulkhuur(d);
      if (groupBy === "week") return udriinTulkhuur(dolooKhonogiinEkhlel(d));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const labels: string[] = [];
    if (groupBy === "day") {
      const it = new Date(s);
      while (it <= e) {
        labels.push(bl(it));
        it.setDate(it.getDate() + 1);
      }
    } else if (groupBy === "week") {
      const it = dolooKhonogiinEkhlel(s);
      while (it <= e) {
        labels.push(udriinTulkhuur(it));
        it.setDate(it.getDate() + 7);
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
          khuudasniiKhemjee: 1000,
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

  // Date-filtered payments (dun < 0) for Сарын гүйцэтгэл
  const { data: paymentData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/guilgeeAvlaguud",
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

  // All-time payments (dun < 0) for Орлого/Гүйцэтгэл card — no date filter
  const { data: allTimePaymentData } = useSWR(
    token && ajiltan?.baiguullagiinId && effectiveBarilgiinId
      ? ["/guilgeeAvlaguud/all-time", token, ajiltan.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get("/guilgeeAvlaguud", {
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

  // Single clean endpoint: MongoDB aggregate on GuilgeeAvlaguud (tulsunDun > 0)
  // Returns allTime.sum (Орлого card) and monthly.sum (Сарын гүйцэтгэл card)
  const { data: tulburDugnelt } = useSWR(
    token && ajiltan?.baiguullagiinId && effectiveBarilgiinId && rangeStart && rangeEnd
      ? ["/tailan/tulbur-dugnelt", token, ajiltan.baiguullagiinId, effectiveBarilgiinId, rangeStart, rangeEnd]
      : null,
    async ([, tkn, bId, barId, start, end]): Promise<any> => {
      const resp = await uilchilgee(tkn).post("/tailan/tulbur-dugnelt", {
        baiguullagiinId: bId,
        barilgiinId: barId,
        ekhlekhOgnoo: start,
        duusakhOgnoo: end,
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const allTimePaidFromLedger = Number(tulburDugnelt?.allTime?.paidSum ?? 0);
  const monthlyPaidFromLedger = Number(tulburDugnelt?.monthly?.paidSum ?? 0);
  const monthlyBilledFromLedger = Number(tulburDugnelt?.monthly?.billedSum ?? 0);

  // Building-by-building comparison dataset for comparison mode / multi-building view
  const { data: buildingComparisonData, isValidating: isComparingLoading } = useSWR(
    token &&
      ajiltan?.baiguullagiinId &&
      allBuildings.length > 0 &&
      rangeStart &&
      rangeEnd
      ? [
          "/tailan/building-comparison-data",
          token,
          ajiltan.baiguullagiinId,
          rangeStart,
          rangeEnd,
          buildingFilterMode === "compare"
            ? compareBuildingIds.join(",")
            : allBuildings.map((b) => String(b._id)).join(","),
        ]
      : null,
    async () => {
      const targetBIds =
        buildingFilterMode === "compare" && compareBuildingIds.length > 0
          ? compareBuildingIds
          : allBuildings.map((b) => String(b._id));

      const results = await Promise.all(
        targetBIds.map(async (bId) => {
          const bObj = allBuildings.find((b) => String(b._id) === String(bId));
          try {
            const [dugneltResp, overdueResp] = await Promise.all([
              uilchilgee(token || undefined).post("/tailan/tulbur-dugnelt", {
                baiguullagiinId: ajiltan?.baiguullagiinId,
                barilgiinId: bId,
                ekhlekhOgnoo: rangeStart,
                duusakhOgnoo: rangeEnd,
              }),
              uilchilgee(token || undefined).get("/tailan/udsan-avlaga", {
                params: {
                  baiguullagiinId: ajiltan?.baiguullagiinId,
                  barilgiinId: bId,
                },
              }),
            ]);

            const dData = dugneltResp.data;
            const oData = overdueResp.data;
            const monthlyBilled = Number(dData?.monthly?.billedSum ?? 0);
            const monthlyPaid = Number(dData?.monthly?.paidSum ?? 0);
            const allTimePaid = Number(dData?.allTime?.paidSum ?? 0);
            const overdueTotal = Number(oData?.total ?? 0);
            const monthlyUnpaid = Math.max(0, monthlyBilled - monthlyPaid);
            const rate =
              monthlyBilled > 0
                ? Math.min(100, Math.round((monthlyPaid / monthlyBilled) * 100))
                : monthlyPaid > 0
                ? 100
                : 0;

            return {
              id: bId,
              name: bObj?.ner || `Барилга ${String(bId).slice(-4)}`,
              tootToo: bObj?.tootToo || 0,
              monthlyBilled,
              monthlyPaid,
              monthlyUnpaid,
              allTimePaid,
              overdueTotal,
              rate,
            };
          } catch (e) {
            return {
              id: bId,
              name: bObj?.ner || `Барилга ${String(bId).slice(-4)}`,
              tootToo: bObj?.tootToo || 0,
              monthlyBilled: 0,
              monthlyPaid: 0,
              monthlyUnpaid: 0,
              allTimePaid: 0,
              overdueTotal: 0,
              rate: 0,
            };
          }
        }),
      );

      return results;
    },
    { revalidateOnFocus: false },
  );

  const buildingComparisonChartData = useMemo(() => {
    if (!buildingComparisonData || buildingComparisonData.length === 0) return null;

    return {
      labels: buildingComparisonData.map((b) => b.name),
      datasets: [
        {
          label: "Нийт нэхэмжилсэн",
          data: buildingComparisonData.map((b) => b.monthlyBilled),
          backgroundColor: "rgba(59, 130, 246, 0.65)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Цуглуулсан орлого",
          data: buildingComparisonData.map((b) => b.monthlyPaid),
          backgroundColor: "rgba(34, 197, 94, 0.65)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Үлдэгдэл авлага",
          data: buildingComparisonData.map((b) => b.monthlyUnpaid),
          backgroundColor: "rgba(239, 68, 68, 0.65)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [buildingComparisonData]);

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

  const buildingPaymentSummary = null; // Removed non-existent /tulsunSummary

  // Date-filtered: used for Сарын гүйцэтгэл (monthly performance)
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

  // All-time (no date filter): used for Орлого/Гүйцэтгэл card
  const { data: orlogoAvlagaAllTime } = useSWR(
    token && ajiltan?.baiguullagiinId && effectiveBarilgiinId
      ? ["/tailan/orlogo-avlaga/all", token, ajiltan.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).post("/tailan/orlogo-avlaga", {
        baiguullagiinId: bId,
        barilgiinId: barId,
        // No ekhlekhOgnoo / duusakhOgnoo → returns all time
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
        khuudasniiKhemjee: 100, // Reduced from 10000 for dashboard
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
    // Use the backend-aggregated sum directly — it already filtered by date and building
    const total = Number(orlogoAvlagaData?.paid?.sum ?? 0);
    const paidCount = Number(orlogoAvlagaData?.paid?.count ?? 0);
    const unpaidCount = Number(orlogoAvlagaData?.unpaid?.count ?? 0);
    return {
      totalOrlogoFromTailan: total,
      residentsPaidCountFromTailan: paidCount,
      residentsUnpaidCountFromTailan: unpaidCount,
    };
  }, [orlogoAvlagaData]);

  const avlagiinNasjiltData: any = null; // Removed broken 501 /tailan/avlagiin-nasjilt

  const { data: medegdelData, isLoading: medegdelLoading } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? ["/medegdel/history", token, ajiltan.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([, tkn, bId, barId]) => {
      const res = await uilchilgee(tkn).get("/medegdel", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
        },
      });
      return res.data?.data || [];
    },
    { revalidateOnFocus: false }
  );

  const paymentHistory = useMemo(() => {
    if (!Array.isArray(medegdelData)) return [];
    const payments = medegdelData.filter((item: any) => {
      const type = (item.turul || "").toLowerCase().trim();
      return type === "medegdel" || type === "мэдэгдэл";
    });
    return payments.filter((item: any) => {
      const dateStr = item.createdAt || item.ognoo;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const itemLocalDateStr = `${year}-${month}-${day}`;
      
      let inRange = true;
      if (rangeStart) {
        inRange = inRange && itemLocalDateStr >= rangeStart;
      }
      if (rangeEnd) {
        inRange = inRange && itemLocalDateStr <= rangeEnd;
      }
      return inRange;
    }).sort((a: any, b: any) => {
      return new Date(b.createdAt || b.ognoo).getTime() - new Date(a.createdAt || a.ognoo).getTime();
    });
  }, [medegdelData, rangeStart, rangeEnd]);

  const [paymentQuery, setPaymentQuery] = useState("");

  const filteredPaymentHistory = useMemo(() => {
    const q = paymentQuery.trim().toLowerCase();
    if (!q) return paymentHistory;
    return paymentHistory.filter((item: any) =>
      [item.title, item.message, item.orshinSuugchNer, item.orshinSuugchUtas]
        .filter(Boolean)
        .some((v: any) => String(v).toLowerCase().includes(q)),
    );
  }, [paymentHistory, paymentQuery]);

  /**
   * Нийт дүнг зөвхөн БҮХ мөрийн дүн танигдсан үед л харуулна.
   *
   * Мэдэгдэлд дүнгийн тусдаа талбар байхгүй тул текстээс уншдаг. Хэсэг мөр нь
   * танигдаагүй байхад нийлбэр гаргавал бодит дүнгээс бага тоо гарч, буруу
   * ойлголт төрүүлнэ — тэр тохиолдолд огт харуулахгүй нь дээр.
   */
  const paymentTotal = useMemo(() => {
    if (filteredPaymentHistory.length === 0) return null;
    let sum = 0;
    for (const item of filteredPaymentHistory) {
      const dun = medegdelDun(item.message);
      if (dun === null) return null;
      sum += dun;
    }
    return sum;
  }, [filteredPaymentHistory]);

  /** Өдрөөр бүлэглэнэ — жагсаалт урт болоход уншихад хялбар болгоно. */
  const groupedPaymentHistory = useMemo(() => {
    const groups: { key: string; label: string; items: any[] }[] = [];
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const todayKey = dayKey(today);
    const yesterdayKey = dayKey(yesterday);

    for (const item of filteredPaymentHistory) {
      const d = new Date(item.createdAt || item.ognoo);
      if (isNaN(d.getTime())) continue;
      const key = dayKey(d);
      const label =
        key === todayKey
          ? "Өнөөдөр"
          : key === yesterdayKey
            ? "Өчигдөр"
            : `${d.getFullYear() === today.getFullYear() ? "" : d.getFullYear() + " оны "}${d.getMonth() + 1}-р сарын ${d.getDate()}`;

      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(item);
      else groups.push({ key, label, items: [item] });
    }
    return groups;
  }, [filteredPaymentHistory]);

  const { data: tulukhAvlagaData } = useSWR(
    token && ajiltan?.baiguullagiinId && rangeStart && rangeEnd
      ? [
          "/guilgeeAvlaguud",
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
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 1000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const ekhniiUldegdelTotal = Number(footerTotals.totalEkhniiUldegdel ?? 0);

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

    const byBld: Record<string, number> = {};
    const seriesMap = new Map<string, { paid: number; unpaid: number }>();

    // 1. We no longer rely on legacy invoices (list) for the graphs.
    // We strictly build the time-series graphs from the authoritative ledger (paymentList)
    // using dun > 0 (billed) and dun < 0 (paid)
    paymentList.forEach((p) => {
      const rawDun = Number(p?.dun ?? 0);
      const isInitialBalance = p?.ekhniiUldegdelEsekh === true;
      
      // Skip explicit initial balances so they don't spike the daily graphs
      if (isInitialBalance) return;

      const dateStr = String(p?.ognoo || p?.createdAt || p?.date || "");
      if (!dateStr) return;

      const d = new Date(dateStr);
      const key = buildLabel(d);
      const curr = seriesMap.get(key) || { paid: 0, unpaid: 0 };

      if (rawDun > 0) {
        // dun > 0 is a charge/receivable (Авлага)
        curr.unpaid += rawDun;
      } else if (rawDun < 0) {
        // dun < 0 is a payment/income (Орлого)
        curr.paid += Math.abs(rawDun);
      }

      seriesMap.set(key, curr);
    });

    // Орлого/Гүйцэтгэл: all-time income directly from ledger (dun < 0), no date filter
    const finalPaid = allTimePaidFromLedger;
    
    // Үлдэгдэл/Авлага: all-time outstanding balance across all contracts
    // We strictly use the authoritative ledger: (All time Billed - All time Paid)
    // This perfectly bypasses any date-filter issues or empty period fallbacks.
    const allTimeBilledFromLedger = Number(tulburDugnelt?.allTime?.billedSum ?? 0);
    const calculatedAllTimeUnpaid = Math.max(0, allTimeBilledFromLedger - allTimePaidFromLedger);
    const finalUnpaid = calculatedAllTimeUnpaid > 0 ? calculatedAllTimeUnpaid : (footerTotals.totalUldegdel || 0);

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
      residentsPaidCount: 0,
      residentsUnpaidCount: footerTotals.tuluvUnpaidCount || 0,
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
    orlogoAvlagaData,
    orlogoAvlagaAllTime,
    allTimePaidFromLedger,
    tulburDugnelt,
    footerTotals,
  ]);

  const {
    incomeTotals,
    incomeSeries,
    expenseSeries,
    profitSeries,
    currentMonthTotal,
  } = incomeComputed;

  // Calculate current month total using the reliable backend aggregation
  const currentMonthTotalComputed = useMemo(() => {
    // 1. Single source of truth for period payments:
    const paid = monthlyPaidFromLedger;

    // 2. Determine period total billed and unpaid
    let total = 0;
    let unpaid = 0;

    if (matrixTotalBilled > 0) {
      total = matrixTotalBilled;
      unpaid = Math.max(0, total - paid);
    } else {
      // Use strictly the ledger's actual dun > 0 billed amount for this period!
      total = monthlyBilledFromLedger;
      unpaid = Math.max(0, total - paid);
    }

    return { paid, unpaid, total };
  }, [matrixTotalBilled, monthlyPaidFromLedger, monthlyBilledFromLedger]);

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
    return "Төлбөр дутуу";
  };

  // Register guided tour for /khynalt
  const tourSteps = useTourSteps("dashboard");
  useRegisterTourSteps("/khynalt", tourSteps);

  const huurimtlagdsanAvlaga = useMemo(() => {
    const unpaidList = Array.isArray(orlogoAvlagaData?.unpaid?.list)
      ? orlogoAvlagaData.unpaid.list
      : [];
    const unpaidSum = Number(orlogoAvlagaData?.unpaid?.sum ?? 0) || 0;

    if (unpaidList.length > 0) {
      const items = unpaidList.map((it: any) => {
        const amount =
          Number(it?.uldegdel ?? it?.niitTulbur ?? it?.tulbur ?? 0) || 0;
        const tVal = Array.isArray(it?.toots)
          ? it.toots
              .map((t: any) => String(t.toot ?? "").trim())
              .filter(Boolean)
              .join(",")
          : String(it?.toot ?? "").trim();
        const name = [it?.ovog, it?.ner, tVal].filter(Boolean).join(" ");
        return {
          ...it,
          amount,
          name: name || it?.toot || "-",
          dugaalaltDugaar: it?.gereeniiDugaar || it?._id || it?.dugaalaltDugaar,
        };
      });
      return {
        count: new Set(
          items.map((it: any) => it?.orshinSuugchId || it?.toot || it?._id),
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
            toot: Array.isArray(rec?.toots)
              ? rec.toots[0]?.toot
              : rec?.toot,
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
    // Цэгийн тоо ихсэхэд том дугуйнууд бие биенээ дарах тул багасгана
    const tsegiinToo = incomeSeries.labels.length;
    const tsegiinRadius = tsegiinToo <= 20 ? 4 : tsegiinToo <= 60 ? 2 : 0;

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
          pointRadius: tsegiinRadius,
          pointHoverRadius: 6,
          pointHitRadius: 12,
          pointBackgroundColor: "#22c55e",
        },
        {
          label: "Төлөөгүй",
          data: incomeSeries.unpaid,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: tsegiinRadius,
          pointHoverRadius: 6,
          pointHitRadius: 12,
          pointBackgroundColor: "#ef4444",
        },
      ],
    };
  }, [incomeSeries]);

  const huurimtlagdsanAvlagaLineChart = useMemo(() => {
    const topItems = huurimtlagdsanAvlaga.items.slice(0, 10);
    /** API заримдаа toot-д «Тоот: 122» гэж бүтнээр нь ирүүлдэг */
    const stripTootLabelPrefix = (s: string) =>
      s
        .replace(/^Тоот\s*[:：]\s*/i, "")
        .replace(/^toot\s*[:：]\s*/i, "")
        .trim();
    const rawKeyForItem = (it: any) => {
      const tVal = Array.isArray(it?.toots)
        ? it.toots
            .map((t: any) => String(t.toot ?? "").trim())
            .filter(Boolean)
            .join(",")
        : String(it?.toot ?? "").trim();
      const toot = stripTootLabelPrefix(tVal);

      const fromToot = toot;
      return fromToot;
    };

    const axisLabel = (it: any) => {
      const raw = rawKeyForItem(it) || String(it?.toot || "");
      return raw.length > 12 ? raw.slice(0, 11) + "…" : raw;
    };
    const tooltipTitleAt = (idx: number) => {
      const it = topItems[idx];
      if (!it) return "";
      return `Тоот: ${rawKeyForItem(it)}`;
    };
    const chartData = {
      labels: topItems.map(axisLabel),
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
    } as unknown as Dataset;
    return { chartData, tooltipTitleAt };
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
            // Эхний үлдэгдэл (slate)
            "rgba(148, 163, 184, 0.55)",
            // Сарын төлбөр (blue)
            "rgba(59, 130, 246, 0.40)",
            "rgba(34, 197, 94, 0.45)",
            "rgba(239, 68, 68, 0.45)",
          ],
          borderColor: [
            "rgb(148, 163, 184)",
            "rgb(59, 130, 246)",
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
      value: formatNumber(overdueData?.total ?? 0, 0),
      subtitle: "Төлбөр төлөгдөөгүй",
      color: "from-amber-500 to-orange-600",
      href: "/tulbur?tuluv=unpaid",
      icon: Users,
      delay: 100,
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
    {
      title: "Сарын гүйцэтгэл",
      value: formatCurrency(currentMonthTotalComputed.paid),
      subtitle: "Сарын төлсөн дүн",
      color: "from-emerald-500 to-teal-600",
      href: "/tulbur",
      icon: UserCheck,
      delay: 600,
      show: showTulbur,
    },
  ];

  const kpiCards = kpiCardsRaw.filter((c) => c.show !== false);

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex flex-col flex-1 min-h-full pl-4 pt-4 pb-8 pr-0">
        <div className="flex flex-row items-center justify-between gap-4 mb-6 pr-4 flex-shrink-0 relative z-30">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {/* Огноо сонгох */}
            <div
              id="khynalt-date"
              className="btn-minimal h-[40px] w-[280px] sm:w-[300px] shrink-0 flex items-center px-3"
            >
              <StandardDatePicker
                isRange={true}
                value={dateRange}
                onChange={(_dates: any, dateStrings: any) => {
                  const [s, e] = (dateStrings ?? []) as [string?, string?];
                  setDateRange(s || e ? [s || null, e || null] : undefined);
                }}
                format="YYYY-MM-DD"
                allowClear
                placeholder="Огноо сонгох"
                classNames={{
                  root: "!h-full !w-full",
                  input:
                    "text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                }}
              />
            </div>

            {/* Барилгаар харьцуулах / сонгох Input */}
            {allBuildings.length > 0 && (
              <div className="relative shrink-0" ref={buildingDropdownRef}>
                <button
                  type="button"
                  id="khynalt-building-compare"
                  onClick={() => setBuildingDropdownOpen((v) => !v)}
                  className={`btn-minimal h-[40px] px-3.5 flex items-center gap-2 text-xs font-medium rounded-2xl transition-all border shrink-0 ${
                    buildingFilterMode === "compare"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "border-[color:var(--panel-text)]/15 text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]/60"
                  }`}
                  title="Барилгаар шүүх болон харьцуулах"
                >
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="max-w-[180px] sm:max-w-[220px] truncate">
                    {buildingFilterMode === "compare"
                      ? `Харьцуулалт (${compareBuildingIds.length} барилга)`
                      : buildingFilterMode === "all"
                      ? "Бүх барилга (Нэгтгэл)"
                      : allBuildings.find((b) => String(b._id) === String(selectedBuildingId))?.ner || "Барилга сонгох"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                      buildingDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Барилгын харьцуулах Dropdown Popover */}
                {buildingDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[320px] sm:w-[360px] p-3.5 rounded-2xl shadow-2xl z-[9999] border border-[color:var(--panel-text)]/20 backdrop-blur-2xl bg-[color:var(--surface-bg)]/98 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[color:var(--panel-text)]/10">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--panel-text)]">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Барилгын шүүлт & Харьцуулалт</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBuildingDropdownOpen(false)}
                        className="p-1 rounded-lg hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Горим сонгогч Tabs */}
                    <div className="grid grid-cols-3 gap-1 p-1 mb-3 rounded-xl bg-[color:var(--surface-hover)]/40 border border-[color:var(--panel-text)]/10 text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => setBuildingFilterMode("single")}
                        className={`py-1 px-1.5 rounded-lg transition-all text-center truncate ${
                          buildingFilterMode === "single"
                            ? "bg-white dark:bg-slate-800 text-[color:var(--panel-text)] font-semibold shadow-sm"
                            : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                        }`}
                      >
                        Нэг барилга
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBuildingFilterMode("compare");
                          if (compareBuildingIds.length === 0) {
                            setCompareBuildingIds(allBuildings.map((b) => String(b._id)));
                          }
                        }}
                        className={`py-1 px-1.5 rounded-lg transition-all text-center truncate flex items-center justify-center gap-1 ${
                          buildingFilterMode === "compare"
                            ? "bg-emerald-500 text-white font-semibold shadow-sm"
                            : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                        }`}
                      >
                        <BarChart3 className="w-3 h-3" />
                        Харьцуулах
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuildingFilterMode("all")}
                        className={`py-1 px-1.5 rounded-lg transition-all text-center truncate ${
                          buildingFilterMode === "all"
                            ? "bg-white dark:bg-slate-800 text-[color:var(--panel-text)] font-semibold shadow-sm"
                            : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                        }`}
                      >
                        Бүгд
                      </button>
                    </div>

                    {/* Барилгын хайлт */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]" />
                      <input
                        type="text"
                        value={buildingSearch}
                        onChange={(e) => setBuildingSearch(e.target.value)}
                        placeholder="Барилга хайх..."
                        className="w-full h-8 pl-8 pr-2 text-xs rounded-xl bg-[color:var(--surface-hover)]/30 border border-[color:var(--panel-text)]/10 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Харьцуулах горимд бүгдийг сонгох товчнууд */}
                    {buildingFilterMode === "compare" && (
                      <div className="flex items-center justify-between px-1 py-1 mb-1.5 text-[11px] text-[color:var(--muted-text)]">
                        <span>{compareBuildingIds.length} / {allBuildings.length} сонгосон</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCompareBuildingIds(allBuildings.map((b) => String(b._id)))}
                            className="text-emerald-500 hover:underline font-medium"
                          >
                            Бүгдийг
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => setCompareBuildingIds([])}
                            className="text-red-400 hover:underline"
                          >
                            Цэвэрлэх
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Барилгуудын жагсаалт */}
                    <div className="overflow-y-auto max-h-[220px] space-y-1 pr-1 custom-scrollbar">
                      {allBuildings
                        .filter((b) =>
                          !buildingSearch ||
                          b.ner?.toLowerCase().includes(buildingSearch.toLowerCase())
                        )
                        .map((b) => {
                          const bId = String(b._id);
                          const isSingleSelected =
                            buildingFilterMode === "single" && String(selectedBuildingId) === bId;
                          const isCompareSelected =
                            compareBuildingIds.includes(bId);

                          if (buildingFilterMode === "compare") {
                            return (
                              <button
                                key={bId}
                                type="button"
                                onClick={() => {
                                  setCompareBuildingIds((prev) =>
                                    prev.includes(bId)
                                      ? prev.filter((id) => id !== bId)
                                      : [...prev, bId]
                                  );
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
                                  isCompareSelected
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-[color:var(--panel-text)] font-medium"
                                    : "hover:bg-[color:var(--surface-hover)]/60 text-[color:var(--panel-text)] opacity-80"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isCompareSelected ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[color:var(--muted-text)] shrink-0" />
                                  )}
                                  <span className="truncate">{b.ner}</span>
                                </div>
                                {b.tootToo != null && (
                                  <span className="text-[10px] text-[color:var(--muted-text)] shrink-0 ml-2">
                                    {b.tootToo} тоот
                                  </span>
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={bId}
                              type="button"
                              onClick={() => {
                                setSelectedBuildingId(bId);
                                setBuildingFilterMode("single");
                                setBuildingDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left ${
                                isSingleSelected
                                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : "hover:bg-[color:var(--surface-hover)]/60 text-[color:var(--panel-text)]"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                <span className="truncate">{b.ner}</span>
                              </div>
                              {isSingleSelected && (
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                    </div>

                    {buildingFilterMode === "compare" && (
                      <div className="pt-2 mt-2 border-t border-[color:var(--panel-text)]/10">
                        <button
                          type="button"
                          onClick={() => setBuildingDropdownOpen(false)}
                          className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm transition-colors text-center"
                        >
                          Харьцуулалт харах ({compareBuildingIds.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[color:var(--panel-text)] leading-tight">
            Сайн байна уу{ajiltan?.ner ? `, ${ajiltan.ner}` : ""}
          </h1>
        </div>
        <div
          id="khynalt-stats"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 pr-4 w-full flex-shrink-0"
        >
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

        {/* 🏢 Барилгуудын харьцуулалт & Гүйцэтгэлийн секц */}
        {buildingFilterMode === "compare" && buildingComparisonData && buildingComparisonData.length > 0 && (
          <div
            id="khynalt-building-comparison-section"
            className="neu-panel allow-overflow rounded-3xl p-5 mb-6 pr-4 mr-4 transition-all duration-500 flex flex-col space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[color:var(--panel-text)]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[color:var(--panel-text)] leading-snug">
                    Барилгуудын гүйцэтгэлийн харьцуулалт
                  </h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    {buildingComparisonData.length} барилгын нэхэмжилсэн, цуглуулсан болон авлагын харьцуулсан үзүүлэлт ({rangeStart} — {rangeEnd})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[color:var(--muted-text)] flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-blue-500/70 inline-block" /> Нэхэмжилсэн</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500/70 inline-block" /> Цуглуулсан</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-500/70 inline-block" /> Үлдэгдэл</span>
              </div>
            </div>

            {/* Харьцуулсан Баганан График */}
            {buildingComparisonChartData && (
              <div className="h-[280px] w-full relative">
                <Bar
                  data={buildingComparisonChartData as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: "index", intersect: false },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        titleColor: "#fff",
                        bodyColor: "#e2e8f0",
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString()} ₮`,
                        },
                      },
                    },
                    scales: {
                      x: { ticks: { color: chartColors.text }, grid: { display: false } },
                      y: {
                        ticks: { color: chartColors.text },
                        grid: { color: chartColors.grid, tickBorderDash: [5, 5] },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Барилга тус бүрийн картууд & Гүйцэтгэлийн хувь */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
              {buildingComparisonData.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-[color:var(--panel-text)]/10 bg-[color:var(--surface-hover)]/20 hover:bg-[color:var(--surface-hover)]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-[color:var(--panel-text)] truncate">{b.name}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          b.rate >= 80
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : b.rate >= 50
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                      >
                        {b.rate}% гүйцэтгэл
                      </span>
                    </div>

                    {/* Прогресс бар */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          b.rate >= 80 ? "bg-emerald-500" : b.rate >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, b.rate))}%` }}
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[color:var(--muted-text)]">
                        <span>Нэхэмжилсэн:</span>
                        <span className="font-medium text-[color:var(--panel-text)]">{formatCurrency(b.monthlyBilled)}</span>
                      </div>
                      <div className="flex justify-between text-[color:var(--muted-text)]">
                        <span>Цуглуулсан:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(b.monthlyPaid)}</span>
                      </div>
                      <div className="flex justify-between text-[color:var(--muted-text)]">
                        <span>Үлдэгдэл:</span>
                        <span className="font-medium text-red-500">{formatCurrency(b.monthlyUnpaid)}</span>
                      </div>
                      {b.overdueTotal > 0 && (
                        <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t border-[color:var(--panel-text)]/5">
                          <span>2+ сар төлөөгүй:</span>
                          <span className="font-semibold">{formatNumber(b.overdueTotal, 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuildingId(b.id);
                      setBuildingFilterMode("single");
                    }}
                    className="mt-3 w-full py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/20 transition-colors text-center"
                  >
                    Энэ барилгыг дэлгэрүүлж харах →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              id="khynalt-income-chart"
              className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: "600ms",
                willChange: "opacity, box-shadow",
              }}
            >
              <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
                <div className="mb-2 flex shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
                          ticks: {
                            color: chartColors.text,
                            // Өдрөөр бүлэглэхэд шошго олон болдог тул
                            // автоматаар алгасаж, уншигдахуйц тоогоор
                            // хязгаарлана
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0,
                          },
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
              id="khynalt-receivable-chart"
              className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: "700ms",
                willChange: "opacity, box-shadow",
              }}
            >
              <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
                <div className="mb-2 flex shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
                    data={huurimtlagdsanAvlagaLineChart.chartData as any}
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
                          callbacks: {
                            title: (items) => {
                              const idx = items[0]?.dataIndex;
                              if (idx == null) return "";
                              return huurimtlagdsanAvlagaLineChart.tooltipTitleAt(
                                idx,
                              );
                            },
                          },
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
              id="khynalt-summary-chart"
              className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col h-[300px] ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: "800ms",
                willChange: "opacity, box-shadow",
              }}
            >
              <div className="flex flex-col flex-1 min-h-0 transition-shadow duration-200">
                <div className="mb-2 flex shrink-0 flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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

          {/* Төлөлтийн түүх */}
          <div
            id="khynalt-payment-history"
            className={`neu-panel allow-overflow rounded-3xl p-5 transition-opacity duration-500 cursor-pointer min-w-0 flex flex-col ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{
              transitionDelay: "900ms",
              willChange: "opacity, box-shadow",
            }}
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Толгой */}
              <div className="mb-3 flex flex-row items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-[18px] h-[18px] text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium leading-snug text-[color:var(--panel-text)]">
                      Төлөлтийн түүх
                    </h3>
                    <p className="text-[11px] text-[color:var(--muted-text)] leading-tight">
                      Мэдэгдлээр · {rangeStart} — {rangeEnd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {paymentTotal !== null && (
                    <span className="text-xs px-2.5 py-1 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold whitespace-nowrap">
                      {paymentTotal.toLocaleString()}₮
                    </span>
                  )}
                  <span className="text-xs bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-2xl text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {paymentHistory.length} төлөлт
                  </span>
                </div>
              </div>

              {/* Хайлт — жагсаалт урт болоход тоот/нэрээр шүүнэ */}
              {paymentHistory.length > 0 && (
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-text)]" />
                  <input
                    value={paymentQuery}
                    onChange={(e) => setPaymentQuery(e.target.value)}
                    placeholder="Тоот, нэр, утсаар хайх..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-[color:var(--surface-hover)]/40 border border-[color:var(--panel-text)]/10 text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              )}

              {/* Жагсаалт */}
              <div className="overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                {medegdelLoading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[62px] rounded-2xl bg-[color:var(--surface-hover)]/40 animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredPaymentHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-11 h-11 rounded-2xl bg-[color:var(--surface-hover)]/50 flex items-center justify-center mb-2.5">
                      <Wallet className="w-5 h-5 text-[color:var(--muted-text)]" />
                    </div>
                    <p className="text-sm text-[color:var(--panel-text)]">
                      {paymentQuery
                        ? "Хайлтад тохирох төлөлт алга"
                        : "Сонгосон хугацаанд төлөлт бүртгэгдээгүй"}
                    </p>
                    <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                      {paymentQuery
                        ? "Өөр түлхүүр үгээр хайж үзнэ үү"
                        : "Огнооны мужаа өөрчилж үзнэ үү"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedPaymentHistory.map((group) => (
                      <div key={group.key}>
                        {/* Өдрийн тусгаарлагч */}
                        <div className="sticky top-0 z-10 flex items-center gap-2 py-1 bg-[color:var(--surface-bg)]/85 backdrop-blur-sm">
                          <span className="text-[11px] font-semibold text-[color:var(--panel-text)]">
                            {group.label}
                          </span>
                          <span className="h-px flex-1 bg-[color:var(--panel-text)]/10" />
                          <span className="text-[10px] text-[color:var(--muted-text)]">
                            {group.items.length}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1.5">
                          {group.items.map((item: any) => {
                            const dun = medegdelDun(item.message);
                            const ner =
                              item.orshinSuugchNer || item.title || "QPay төлөлт";
                            return (
                              <div
                                key={item._id}
                                className="group relative p-3 rounded-2xl border border-[color:var(--panel-text)]/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-semibold">
                                    {String(ner).charAt(0).toUpperCase()}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-[color:var(--panel-text)] truncate">
                                        {item.title || "QPay төлөлт"}
                                      </p>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    </div>
                                    <p className="text-xs text-[color:var(--muted-text)] leading-relaxed line-clamp-2">
                                      {item.message}
                                    </p>
                                    {item.orshinSuugchUtas && (
                                      <p className="text-[11px] text-[color:var(--muted-text)] mt-0.5">
                                        {item.orshinSuugchNer
                                          ? `${item.orshinSuugchNer} · `
                                          : ""}
                                        {item.orshinSuugchUtas}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    {dun !== null && (
                                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                        +{dun.toLocaleString()}₮
                                      </span>
                                    )}
                                    <span
                                      className="text-[11px] text-[color:var(--muted-text)] whitespace-nowrap"
                                      title={ognooTsagButen(
                                        item.createdAt || item.ognoo,
                                      )}
                                    >
                                      {ognooKharitsangui(
                                        item.createdAt || item.ognoo,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
