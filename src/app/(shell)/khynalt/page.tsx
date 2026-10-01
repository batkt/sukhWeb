"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { StandardPagination } from "@/components/ui/StandardTable";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import ResidentDetailModal from "../geree/modals/ResidentDetailModal";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import useGereeJagsaalt from "@/lib/useGeree";
import { useAjiltniiJagsaalt } from "@/lib/useAjiltan";
import uilchilgee from "@/lib/uilchilgee";
import { isPaidLike, getDefaultDateRange } from "@/lib/utils";
import {
  medegdelDun,
  ognooTsagButen,
  medegdelToot,
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
  Eye,
  Copy,
} from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
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
  datasets: Array<Record<string, any>>;
  [key: string]: any;
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
  //
  // "compare" нь ЗӨВХӨН шүүлтүүрийн цонхон доторх харьцуулсан графикийг
  // тэжээдэг сонголт — тэр нь `compareBuildingIds`-аар өөрийн гэсэн
  // хүсэлттэй. Өмнө нь энд "compare"-ийг `undefined` болгодог байсан тул
  // Харьцуулах товч дармагц үндсэн самбар (KPI, графикууд) барилгын
  // шүүлтээ алдаж, байгууллага даяарх өгөгдөл рүү шилждэг байв.
  // Одоо зөвхөн "all" горим л бүх барилгыг нэгтгэнэ.
  const effectiveBarilgiinId =
    buildingFilterMode === "all"
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

  // Төлөлтийн түүхийн хайлт — дээд талын (Topbar) нэгдсэн хайлтаас.
  const { searchTerm: paymentQuery } = useSearch();
  // Төлөлтийн түүхийн хуудаслалт ба үйлдлүүд.
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(500);
  const [kharakhOrshinSuugchId, setKharakhOrshinSuugchId] = useState<
    string | null
  >(null);
  const [khuulsanDugaar, setKhuulsanDugaar] = useState<string | null>(null);

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

  // Хайлт/огноо солигдоход эхний хуудас руу буцаана — эс тэгвээс хоосон
  // хуудсан дээр үлдэж "мэдээлэл алга" мэт харагдана.
  useEffect(() => {
    setPaymentPage(1);
  }, [paymentQuery, rangeStart, rangeEnd]);

  const pagedPaymentHistory = useMemo(() => {
    const ekhlel = (paymentPage - 1) * paymentPageSize;
    return filteredPaymentHistory.slice(ekhlel, ekhlel + paymentPageSize);
  }, [filteredPaymentHistory, paymentPage, paymentPageSize]);

  const dugaariigKhuulya = useCallback(async (dugaar: string) => {
    try {
      await navigator.clipboard.writeText(dugaar);
      setKhuulsanDugaar(dugaar);
      setTimeout(() => setKhuulsanDugaar(null), 1500);
    } catch {
      // Clipboard эрх хаалттай байж болно — чимээгүй өнгөрөөнө.
    }
  }, []);


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
          label: "Гүйцэтгэл (Төлсөн)",
          data: incomeSeries.paid,
          borderColor: "#10b981",
          borderWidth: 3,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            if (!ctx) return "rgba(16,185,129,0.15)";
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
            gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.45,
          pointRadius: tsegiinRadius,
          pointHoverRadius: 7,
          pointHitRadius: 14,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: "#ffffff",
        },
        {
          label: "Төлөөгүй авлага",
          data: incomeSeries.unpaid,
          borderColor: "#f43f5e",
          borderWidth: 3,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            if (!ctx) return "rgba(244,63,94,0.15)";
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, "rgba(244, 63, 94, 0.3)");
            gradient.addColorStop(1, "rgba(244, 63, 94, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.45,
          pointRadius: tsegiinRadius,
          pointHoverRadius: 7,
          pointHitRadius: 14,
          pointBackgroundColor: "#f43f5e",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: "#ffffff",
        },
      ],
    };
  }, [incomeSeries]);

  const huurimtlagdsanAvlagaLineChart = useMemo(() => {
    const topItems = huurimtlagdsanAvlaga.items.slice(0, 10);
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
      return toot;
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
          label: "Авлагын дүн",
          data: topItems.map(
            (it: any) =>
              Number(it?.amount ?? it?.uldegdel ?? it?.niitTulbur ?? 0) || 0,
          ),
          borderColor: "#8b5cf6",
          borderWidth: 3,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            if (!ctx) return "rgba(139,92,246,0.15)";
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, "rgba(139, 92, 246, 0.35)");
            gradient.addColorStop(1, "rgba(139, 92, 246, 0.0)");
            return gradient;
          },
          fill: true,
          tension: 0.42,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: "#ffffff",
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
            "rgba(99, 102, 241, 0.75)",  // Indigo
            "rgba(14, 165, 233, 0.75)",  // Sky
            "rgba(16, 185, 129, 0.8)",   // Emerald
            "rgba(244, 63, 94, 0.8)",    // Rose
          ],
          hoverBackgroundColor: [
            "rgba(99, 102, 241, 0.95)",
            "rgba(14, 165, 233, 0.95)",
            "rgba(16, 185, 129, 0.95)",
            "rgba(244, 63, 94, 0.95)",
          ],
          borderColor: [
            "rgb(99, 102, 241)",
            "rgb(14, 165, 233)",
            "rgb(16, 185, 129)",
            "rgb(244, 63, 94)",
          ],
          borderWidth: 1.5,
          barPercentage: 0.55,
          categoryPercentage: 0.7,
          borderRadius: {
            topLeft: 12,
            topRight: 12,
            bottomLeft: 4,
            bottomRight: 4,
          },
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

  /**
   * KPI-ийн семантик төрөл → дүрсний өнгөний токен.
   *
   * Өмнө нь Tailwind класс МӨР нь map-ийн түлхүүр байсан тул өнгийг
   * токен руу нэгтгэхэд хоёр түлхүүр давхардаж, TS алдаа гарав. Одоо
   * түлхүүр нь семантик нэр, утга нь CSS токен — hex давхардахгүй.
   */
  const kpiIconOngo: Record<string, string> = {
    warning: "var(--warning)",
    success: "var(--success)",
    theme: "var(--theme)",
    danger: "var(--danger)",
  };

  const kpiCardsRaw = [
    {
      title: "2+ сар төлөөгүй",
      value: formatNumber(overdueData?.total ?? 0, 0),
      subtitle: "Төлбөр төлөгдөөгүй",
      color: "from-warning/20 to-warning/20",
      ongoTurul: "warning",
      href: "/tulbur?tuluv=unpaid",
      icon: Users,
      delay: 100,
      show: showTulbur,
    },
    {
      title: "Сарын төлбөр",
      value: formatCurrency(currentMonthTotalComputed.total),
      subtitle: "Сарын нийт төлбөр",
      color: "from-theme/20 to-theme/20",
      ongoTurul: "theme",
      icon: Building2,
      delay: 0,
      show: true,
    },
    {
      title: "Орлого/Гүйцэтгэл",
      value: formatCurrency(incomeTotals.paid),
      subtitle: "Төлсөн дүн",
      color: "from-theme/20 to-theme/20",
      ongoTurul: "theme",
      href: "/tulbur",
      icon: Wallet,
      delay: 400,
      show: showTulbur,
    },
    {
      title: "Үлдэгдэл/Авлага",
      value: formatCurrency(incomeTotals.unpaid),
      subtitle: "Үлдэгдэл дүн",
      color: "from-danger/20 to-danger/20",
      ongoTurul: "danger",
      href: "/tulbur",
      icon: CircleDollarSign,
      delay: 500,
      show: showTulbur,
    },
    {
      title: "Сарын гүйцэтгэл",
      value: formatCurrency(currentMonthTotalComputed.paid),
      subtitle: "Сарын төлсөн дүн",
      color: "from-theme/20 to-theme/20",
      ongoTurul: "theme",
      href: "/tulbur",
      icon: UserCheck,
      delay: 600,
      show: showTulbur,
    },
  ];

  const kpiCards = kpiCardsRaw.filter((c) => c.show !== false);

  // Төлөлтийн түүхийн хүснэгтийн багана — стандарт хүснэгтэд өгнө.
  const tulultiinColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Оршин суугч",
        key: "orshinSuugchNer",
        render: (_: any, item: any) => (
          <span title={item.orshinSuugchUtas || undefined}>
            {item.orshinSuugchNer || "—"}
          </span>
        ),
      },
      {
        title: "Гэрээний дугаар",
        key: "gereeniiDugaar",
        render: (_: any, item: any) => {
          const gereeniiDugaar =
            item.gereeniiDugaar || item.orshinSuugchGereeniiDugaar || "";
          if (!gereeniiDugaar) return "—";
          return (
            <span className="inline-flex items-center gap-1.5">
              <span>{gereeniiDugaar}</span>
              <button
                type="button"
                title="Хуулах"
                onClick={() => dugaariigKhuulya(gereeniiDugaar)}
                className="transition-colors hover:text-brand"
              >
                {khuulsanDugaar === gereeniiDugaar ? (
                  <Check className="h-4 w-4 text-brand" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </span>
          );
        },
      },
      {
        title: "Тоот",
        key: "toot",
        render: (_: any, item: any) =>
          item.toot || medegdelToot(item.message) || "—",
      },
      {
        title: "Дүн",
        key: "dun",
        align: "right",
        render: (_: any, item: any) => {
          // Шинэ бичлэг дээр талбар нь шууд ирнэ; хуучин дээр мэдэгдлийн
          // текстээс уншина.
          const dun =
            typeof item.dun === "number" ? item.dun : medegdelDun(item.message);
          return (
            <span className="font-medium whitespace-nowrap text-brand">
              {dun !== null && dun !== undefined
                ? `${dun.toLocaleString()}₮`
                : "—"}
            </span>
          );
        },
      },
      {
        title: "Огноо, цаг",
        key: "ognoo",
        render: (_: any, item: any) => (
          <span className="whitespace-nowrap">
            {ognooTsagButen(item.createdAt || item.ognoo)}
          </span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, item: any) => (
          <button
            type="button"
            title={
              item.orshinSuugchId
                ? "Оршин суугчийн бүх мэдээлэл"
                : "Оршин суугч холбогдоогүй"
            }
            disabled={!item.orshinSuugchId}
            onClick={() => setKharakhOrshinSuugchId(item.orshinSuugchId || null)}
            className="rounded-md p-1.5 transition-colors hover:bg-theme/10 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Eye className="h-4 w-4" />
          </button>
        ),
      },
    ],
     
    [khuulsanDugaar],
  );

  return (
    <>
      <div className="h-full flex flex-col overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
        <div className="flex flex-col flex-1 min-h-full px-4 sm:px-6 pt-5 pb-10 max-w-[1700px] w-full mx-auto space-y-5">
          
          {/* iOS Top Control Bar: Date & Building Selector */}
          <div className="relative z-40 flex flex-wrap items-center justify-between gap-4 p-3 rounded-[24px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-theme/10 flex items-center justify-center text-brand shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Санхүүгийн Хяналт & Аналитик
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Орлого, авлага, төлбөрийн биелэлтийн нэгдсэн хяналтын самбар
                </p>
              </div>
            </div>

            <div className="relative z-30 flex flex-wrap items-center gap-3 shrink-0 ml-auto">
              {/* Filter Date Picker */}
              <FilterDatePicker
                id="khynalt-date"
                value={dateRange}
                onChange={(_dates: any, dateStrings: any) => {
                  const [s, e] = (dateStrings ?? []) as [string?, string?];
                  setDateRange(s || e ? [s || null, e || null] : undefined);
                }}
                format="YYYY-MM-DD"
                placeholder="Огноо сонгох"
                className="w-full sm:w-[260px] !rounded-2xl"
              />

              {/* Building Selector / Compare Input */}
              {allBuildings.length > 0 && (
                <div className="relative z-50 shrink-0" ref={buildingDropdownRef}>
                  <button
                    type="button"
                    id="khynalt-building-compare"
                    onClick={() => setBuildingDropdownOpen((v) => !v)}
                    className={`h-9 px-4 flex items-center gap-2.5 text-xs font-semibold rounded-2xl transition-all border shrink-0 shadow-sm ${
                      buildingFilterMode === "compare"
                        ? "border-theme/40 bg-theme/10 text-brand shadow-theme/10"
                        : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                    title="Барилгаар шүүх болон харьцуулах"
                  >
                    <Building2 className="w-4 h-4 text-brand shrink-0" />
                    <span className="max-w-[160px] sm:max-w-[200px] truncate">
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

                  {/* Building Dropdown Popover */}
                  {buildingDropdownOpen && (
                    <div
                      className={`absolute right-0 sm:left-auto top-full mt-2 p-4 rounded-[24px] shadow-2xl z-[9999] border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl bg-white/95 dark:bg-[#1c1c1e]/95 animate-in fade-in zoom-in-95 duration-150 ${
                        buildingFilterMode === "compare"
                          ? "w-[340px] sm:w-[440px]"
                          : "w-[320px] sm:w-[360px]"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                          <SlidersHorizontal className="w-4 h-4 text-brand" />
                          <span>Барилгын шүүлт & Харьцуулалт</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBuildingDropdownOpen(false)}
                          className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mode Selector Tabs */}
                      <div className="grid grid-cols-3 gap-1 p-1 mb-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setBuildingFilterMode("single")}
                          className={`py-1.5 px-2 rounded-xl transition-all text-center truncate ${
                            buildingFilterMode === "single"
                              ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white font-bold shadow-sm"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
                          className={`py-1.5 px-2 rounded-xl transition-all text-center truncate flex items-center justify-center gap-1 ${
                            buildingFilterMode === "compare"
                              ? "bg-theme text-white font-bold shadow-sm"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          <BarChart3 className="w-3 h-3" />
                          Харьцуулах
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuildingFilterMode("all")}
                          className={`py-1.5 px-2 rounded-xl transition-all text-center truncate ${
                            buildingFilterMode === "all"
                              ? "bg-white dark:bg-[#2c2c2e] text-slate-900 dark:text-white font-bold shadow-sm"
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          Бүгд
                        </button>
                      </div>

                      {/* Building Search */}
                      <div className="relative mb-2.5">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={buildingSearch}
                          onChange={(e) => setBuildingSearch(e.target.value)}
                          placeholder="Барилга хайх..."
                          className="w-full h-8.5 pl-8 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-theme"
                        />
                      </div>

                      {/* Select All Controls */}
                      {buildingFilterMode === "compare" && (
                        <div className="flex items-center justify-between px-1 py-1 mb-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>{compareBuildingIds.length} / {allBuildings.length} сонгосон</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCompareBuildingIds(allBuildings.map((b) => String(b._id)))}
                              className="text-brand hover:underline font-bold"
                            >
                              Бүгдийг
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => setCompareBuildingIds([])}
                              className="text-rose-500 hover:underline font-bold"
                            >
                              Цэвэрлэх
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Building List */}
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
                                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                                    isCompareSelected
                                      ? "bg-theme/10 border border-theme/30 text-slate-900 dark:text-white font-semibold"
                                      : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isCompareSelected ? (
                                      <CheckSquare className="w-4 h-4 text-brand shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                    <span className="truncate">{b.ner}</span>
                                  </div>
                                  {b.tootToo != null && (
                                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">
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
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                                  isSingleSelected
                                    ? "bg-theme/10 border border-theme/30 text-brand font-semibold"
                                    : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                  <span className="truncate">{b.ner}</span>
                                </div>
                                {isSingleSelected && (
                                  <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                                )}
                              </button>
                            );
                          })}
                      </div>

                      {/* Comparison Bar Chart Preview */}
                      {buildingFilterMode === "compare" &&
                        buildingComparisonChartData &&
                        compareBuildingIds.length > 0 && (
                          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-slate-500">
                                Харьцуулалт
                              </span>
                              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                  Нэхэмж.
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                  Цуглуул.
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                                  Үлдэгдэл
                                </span>
                              </div>
                            </div>
                            <div className="h-[150px] w-full">
                              <Bar
                                data={buildingComparisonChartData as any}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  interaction: { mode: "index", intersect: false },
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                                      titleColor: "#fff",
                                      bodyColor: "#e2e8f0",
                                      cornerRadius: 10,
                                      padding: 8,
                                      titleFont: { size: 10 },
                                      bodyFont: { size: 10 },
                                      callbacks: {
                                        label: (ctx: any) =>
                                          `${ctx.dataset.label}: ${formatCurrency(
                                            ctx.parsed.y || 0,
                                          )}`,
                                      },
                                    },
                                  },
                                  scales: {
                                    x: {
                                      grid: { display: false },
                                      border: { display: false },
                                      ticks: {
                                        font: { size: 9 },
                                        maxRotation: 0,
                                        autoSkip: false,
                                        callback(this: any, value: any) {
                                          const ner = String(
                                            this.getLabelForValue(value) ?? "",
                                          );
                                          return ner.length > 8
                                            ? ner.slice(0, 7) + "…"
                                            : ner;
                                        },
                                      },
                                    },
                                    y: {
                                      beginAtZero: true,
                                      grid: { color: "rgba(100,116,139,0.12)" },
                                      border: { display: false },
                                      ticks: {
                                        font: { size: 9 },
                                        maxTicksLimit: 4,
                                        callback: (v: any) => {
                                          const n = Number(v) || 0;
                                          if (Math.abs(n) >= 1e6)
                                            return (n / 1e6).toFixed(1) + "М";
                                          if (Math.abs(n) >= 1e3)
                                            return Math.round(n / 1e3) + "мян";
                                          return n;
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        )}

                      {buildingFilterMode === "compare" && (
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => setBuildingDropdownOpen(false)}
                            className="w-full py-2.5 rounded-2xl bg-theme hover:brightness-110 text-white font-bold text-xs shadow-md transition-all text-center"
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
          </div>

          {/* Luxurious iOS Metric Cards Row */}
          <div
            id="khynalt-stats"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full"
          >
            {kpiCards.map((card, index) => {
              const Icon = (card as any).icon;
              const dursniiOngo =
                kpiIconOngo[(card as { ongoTurul?: string }).ongoTurul ?? ""] ?? "var(--muted-text)";

              const CardContent = (
                <div className="h-full flex flex-col justify-between p-4.5 rounded-[26px] relative overflow-hidden group border border-black/[0.05] dark:border-white/[0.08] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate pr-2">
                      {card.title}
                    </span>
                    {Icon && (
                      <div
                        className="w-8.5 h-8.5 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${dursniiOngo}, transparent 88%)`,
                          color: dursniiOngo,
                        }}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 space-y-1">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                      {card.value}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1">
                      <span>{(card as { subtitle?: string }).subtitle ?? "\u00a0"}</span>
                    </p>
                  </div>
                </div>
              );

              const style = {
                transitionDelay: `${card.delay}ms`,
              };

              if (card.href) {
                return (
                  <Link
                    key={index}
                    href={card.href}
                    className={`block h-full transition-all duration-300 ${
                      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={style}
                  >
                    {CardContent}
                  </Link>
                );
              }

              return (
                <div
                  key={index}
                  className={`block h-full transition-all duration-300 ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={style}
                >
                  {CardContent}
                </div>
              );
            })}
          </div>

          {/* Charts Section: 3 Elegant iOS Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full items-stretch">
            
            {/* Income Trend Chart */}
            <div
              id="khynalt-income-chart"
              className={`rounded-[28px] p-5 sm:p-6 border border-black/[0.05] dark:border-white/[0.08] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-500 flex flex-col h-[350px] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="mb-4 flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Орлогын динамик
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Цуглуулсан vs Төлөөгүй
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Гүйцэтгэл
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Төлөөгүй
                    </span>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1 w-full pt-1">
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
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          titleColor: "#fff",
                          bodyColor: "#e2e8f0",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderWidth: 1,
                          padding: 12,
                          cornerRadius: 14,
                          usePointStyle: true,
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: chartColors.text,
                            autoSkip: true,
                            maxTicksLimit: 10,
                            maxRotation: 0,
                            font: { size: 10 },
                          },
                          grid: { display: false },
                        },
                        y: {
                          ticks: { color: chartColors.text, font: { size: 10 } },
                          grid: {
                            color: chartColors.grid,
                            tickBorderDash: [4, 4],
                          },
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Receivables Aging Line Chart */}
            <div
              id="khynalt-receivable-chart"
              className={`rounded-[28px] p-5 sm:p-6 border border-black/[0.05] dark:border-white/[0.08] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-500 flex flex-col h-[350px] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "700ms" }}
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="mb-4 flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Авлагын хуваарилалт
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400">
                        {huurimtlagdsanAvlaga.count} Оршин суугчийн үлдэгдэл
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold tabular-nums">
                    {formatCurrency(huurimtlagdsanAvlaga.total)}
                  </span>
                </div>

                <div className="relative min-h-0 flex-1 w-full pt-1">
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
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          titleColor: "#fff",
                          bodyColor: "#e2e8f0",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderWidth: 1,
                          padding: 12,
                          cornerRadius: 14,
                          usePointStyle: true,
                          callbacks: {
                            title: (items) => {
                              const idx = items[0]?.dataIndex;
                              if (idx == null) return "";
                              return huurimtlagdsanAvlagaLineChart.tooltipTitleAt(idx);
                            },
                          },
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: chartColors.text, maxRotation: 45, font: { size: 10 } },
                          grid: { display: false },
                        },
                        y: {
                          ticks: { color: chartColors.text, font: { size: 10 } },
                          grid: {
                            color: chartColors.grid,
                            tickBorderDash: [4, 4],
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
              className={`rounded-[28px] p-5 sm:p-6 border border-black/[0.05] dark:border-white/[0.08] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-500 flex flex-col h-[350px] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "800ms" }}
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="mb-4 flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Төлбөрийн хураангуй
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400">
                        Нийт гүйцэтгэл
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold tabular-nums">
                    {formatCurrency(incomeTotals.paid)}
                  </span>
                </div>

                <div className="relative min-h-0 flex-1 w-full pt-1">
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
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          titleColor: "#fff",
                          bodyColor: "#e2e8f0",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderWidth: 1,
                          padding: 12,
                          cornerRadius: 14,
                          usePointStyle: true,
                        },
                      },
                      scales: {
                        x: {
                          ticks: { color: chartColors.text, font: { size: 10 } },
                          grid: { display: false },
                        },
                        y: {
                          ticks: { color: chartColors.text, font: { size: 10 } },
                          grid: {
                            color: chartColors.grid,
                            tickBorderDash: [4, 4],
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

          {/* Payment History Section */}
          <div
            id="khynalt-payment-history"
            className={`rounded-[28px] p-5 sm:p-6 border border-black/[0.05] dark:border-white/[0.08] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 flex flex-col ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "900ms" }}
          >
            <div className="flex flex-col flex-1 min-h-0">
              
              {/* Header */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-theme/10 flex items-center justify-center shrink-0 text-brand shadow-sm">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Төлөлтийн гүйлгээний түүх
                    </h2>
                    <p className="text-[11px] font-medium text-slate-400">
                      Мэдэгдлээр баталгаажсан · {rangeStart} — {rangeEnd}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {paymentTotal !== null && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold tabular-nums">
                      <span>Нийт:</span>
                      <span>{paymentTotal.toLocaleString()}₮</span>
                    </div>
                  )}
                  <span className="text-xs font-bold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {paymentHistory.length} гүйлгээ
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <Table<any>
                  columns={tulultiinColumns}
                  dataSource={pagedPaymentHistory}
                  rowKey={(item) => item._id}
                  loading={medegdelLoading}
                  pagination={false}
                  scroll={{ x: 720 }}
                  locale={{
                    emptyText: (
                      <div className="py-4 text-center">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {paymentQuery
                            ? "Хайлтад тохирох төлөлт олдсонгүй"
                            : "Сонгосон хугацаанд төлөлт бүртгэгдээгүй байна"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {paymentQuery
                            ? "Өөр түлхүүр үгээр хайж үзнэ үү"
                            : "Шүүлтүүрийн огнооны мужийг өөрчилж үзнэ үү"}
                        </p>
                      </div>
                    ),
                  }}
                />
              </div>

              {/* Pagination */}
              {!medegdelLoading && filteredPaymentHistory.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
                  <StandardPagination
                    current={paymentPage}
                    total={filteredPaymentHistory.length}
                    pageSize={paymentPageSize}
                    pageSizeOptions={[10, 20, 50, 100, 500]}
                    onChange={(page) => setPaymentPage(page)}
                    onPageSizeChange={(size) => {
                      setPaymentPageSize(size);
                      setPaymentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Resident Detail Modal */}
      <ResidentDetailModal
        show={!!kharakhOrshinSuugchId}
        onClose={() => setKharakhOrshinSuugchId(null)}
        residentId={kharakhOrshinSuugchId}
        token={token}
        baiguullagiinId={ajiltan?.baiguullagiinId}
      />
    </>
  );
}
