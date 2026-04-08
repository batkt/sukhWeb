"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useGereeJagsaalt } from "@/lib/useGeree";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import uilchilgee from "@/lib/uilchilgee";
import useSWR from "swr";
import { useTulburFooterTotals } from "@/lib/useTulburFooterTotals";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { StandardPagination } from "@/components/ui/StandardTable";
import { useSearch } from "@/context/SearchContext";
import { getDefaultDateRange } from "@/lib/utils";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { FileSpreadsheet, Printer } from "lucide-react";
import { OrlogoAvlagaTable, OrlogoAvlagaItem } from "./OrlogoAvlagaTable";
import toast from "react-hot-toast";
import { pickMonthSlice } from "../../tulbur/guilgeeTuukh/guilgeeMonthMatrix";
import { computeLedgerRunningBalancesByGereeId } from "../../tulbur/guilgeeTuukh/ledgerRunningBalances";
import { aggregateLedgerTulsunByGereeId } from "../../tulbur/guilgeeTuukh/guilgeePaidDisplay";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      /* Setup the page for A4 Landscape */
      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      /* 1. Hide everything by default but let the table flow */
      body {
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: auto !important;
      }

      /* 2. Standard hide UI elements */
      .no-print,
      nav,
      header,
      .sidebar,
      .neu-nav,
      .fixed,
      .sticky,
      button,
      footer {
        display: none !important;
      }

      /* 3. Force the report container to be visible and unconstrained */
      .print-container {
        display: block !important;
        position: relative !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* 4. CRITICAL: Force all parent layout containers to release their fixed heights/overflows */
      /* This affects the containers in GolContent.tsx */
      main,
      div[class*="neu-panel"],
      div[class*="overflow-y-auto"],
      div[class*="md:h-"],
      div[class*="max-h-"] {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        position: static !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* 5. Header Styling */
      .print-only {
        display: block !important;
        margin-bottom: 30px;
        width: 100% !important;
      }

      /* 6. Table Layout */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        font-size: 10pt !important;
        color: black !important;
      }

      th,
      td {
        border: 1px solid #000 !important;
        padding: 6px 4px !important;
        background: transparent !important;
        color: black !important;
        text-align: center !important;
        word-wrap: break-word !important;
      }

      th {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
        -webkit-print-color-adjust: exact;
      }

      /* Ensure rows don't split awkwardly */
      tr {
        page-break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }

      /* Alignment Utility */
      .text-left {
        text-align: left !important;
      }
      .text-right {
        text-align: right !important;
      }
    }

    /* Web view hidden by default */
    .print-only {
      display: none;
    }
  `}</style>
);

type TabType = "avlaga" | "tulult" | "all";

export default function OrlogoAvlagaPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null,
  );
  const effectiveBarilgiinId = selectedBuildingId || undefined;

  const baiguullagiinId = ajiltan?.baiguullagiinId ?? null;

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const { searchTerm } = useSearch();
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    toot: "",
    davkhar: "",
    gereeniiDugaar: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedLedger, setExpandedLedger] = useState<any[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const footerTotals = useTulburFooterTotals(
    token,
    ajiltan?.baiguullagiinId ?? null,
    effectiveBarilgiinId,
  );

  const toMonthKey = (v?: string | null) => {
    if (!v) return "";
    const [y, m] = v.split("-");
    if (!y || !m) return "";
    return `${y}-${m.padStart(2, "0")}`;
  };

  const monthlyMatrixRange = useMemo(() => {
    const [rawStart, rawEnd] = dateRange || [];
    const startKey = toMonthKey(rawStart);
    const endKey = toMonthKey(rawEnd);
    const selectedMonthKey =
      startKey && endKey && startKey === endKey
        ? startKey
        : startKey || endKey || "";

    const now = new Date();
    const fallbackMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
    const monthKey = selectedMonthKey || fallbackMonthKey;

    const [yy, mm] = monthKey.split("-").map((v) => parseInt(v, 10));
    const monthIdx = Number.isFinite(mm) ? mm - 1 : now.getMonth();
    const yearVal = Number.isFinite(yy) ? yy : now.getFullYear();

    const start = new Date(yearVal, monthIdx, 1, 0, 0, 0, 0);
    const end = new Date(yearVal, monthIdx + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString(), monthKey };
  }, [dateRange]);

  const { data: monthlyMatrixData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/tailan/resident-monthly-matrix",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
          monthlyMatrixRange.start,
          monthlyMatrixRange.end,
        ]
      : null,
    async ([, tkn, orgId, branch, start, end]) => {
      const resp = await uilchilgee(tkn).get("/tailan/resident-monthly-matrix", {
        params: {
          baiguullagiinId: orgId,
          barilgiinId: branch || undefined,
          ekhlekhOgnoo: start,
          duusakhOgnoo: end,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const paidRequestedRef = useRef<Set<string>>(new Set());
  const uldegdelRequestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  const emptyQuery = useMemo(() => ({}), []);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && baiguullagiinId
      ? [
          "/nekhemjlekhiinTuukh-oa",
          token,
          baiguullagiinId,
          selectedBuildingId || null,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const startIso = start ? `${start}T00:00:00.000Z` : undefined;
      const endIso = end ? `${end}T23:59:59.999Z` : undefined;

      const resp = await uilchilgee(tkn).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
          query: JSON.stringify({
            baiguullagiinId: bId,
            ...(barId ? { barilgiinId: barId } : {}),
            ...(startIso && endIso
              ? { createdAt: { $gte: startIso, $lte: endIso } }
              : {}),
          }),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: receivableData, isLoading: isLoadingReceivable } = useSWR(
    token && baiguullagiinId
      ? [
          "/gereeniiTulukhAvlaga-oa",
          token,
          baiguullagiinId,
          selectedBuildingId || null,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulukhAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: paymentRecordsData, isLoading: isLoadingPayment } = useSWR(
    token && baiguullagiinId
      ? [
          "/gereeniiTulsunAvlaga-oa",
          token,
          baiguullagiinId,
          selectedBuildingId || null,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
        ]
      : null,
    async ([, tkn, bId, barId, start, end]) => {
      const resp = await uilchilgee(tkn).get("/gereeniiTulsunAvlaga", {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          ...(start ? { ekhlekhOgnoo: start } : {}),
          ...(end ? { duusakhOgnoo: end } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    baiguullagiinId || undefined,
    selectedBuildingId || undefined,
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    baiguullagiinId || "",
    emptyQuery,
    selectedBuildingId || undefined,
  );

  const contractsById = useMemo(() => {
    const map: Record<string, any> = {};
    (gereeGaralt?.jagsaalt || []).forEach((g: any) => {
      if (g?._id) map[String(g._id)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsByNumber = useMemo(() => {
    const map: Record<string, any> = {};
    (gereeGaralt?.jagsaalt || []).forEach((g: any) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const residentsById = useMemo(() => {
    const map: Record<string, any> = {};
    (orshinSuugchGaralt?.jagsaalt || []).forEach((r: any) => {
      if (r?._id) map[String(r._id)] = r;
    });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  const allHistoryItems = useMemo(() => {
    const invoices = Array.isArray(historyData?.jagsaalt)
      ? historyData.jagsaalt
      : Array.isArray(historyData)
        ? historyData
        : [];
    const receivables = Array.isArray(receivableData?.jagsaalt)
      ? receivableData.jagsaalt
      : Array.isArray(receivableData)
        ? receivableData
        : [];

    const payments = Array.isArray(paymentRecordsData?.jagsaalt)
      ? paymentRecordsData.jagsaalt
      : Array.isArray(paymentRecordsData)
        ? paymentRecordsData
        : [];

    const combined = [...invoices];
    const trackingIds = new Set(invoices.map((it: any) => String(it._id)));
    invoices.forEach((it: any) => {
      const gList = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];
      gList.forEach((g: any) => {
        if (g?._id) trackingIds.add(String(g._id));
      });
    });
    receivables.forEach((r: any) => {
      if (!trackingIds.has(String(r._id))) combined.push(r);
    });
    payments.forEach((p: any) => {
      if (!trackingIds.has(String(p._id))) combined.push(p);
    });
    return combined.sort((a: any, b: any) => {
      const da = new Date(
        a.tulsunOgnoo || a.ognoo || a.createdAt || 0,
      ).getTime();
      const db = new Date(
        b.tulsunOgnoo || b.ognoo || b.createdAt || 0,
      ).getTime();
      return da - db; // Ascending so latest wins in uldegdel maps
    });
  }, [historyData, receivableData, paymentRecordsData]);

  const buildingHistoryItems = allHistoryItems;
  
  const ledgerBalances = useMemo(() => {
    return computeLedgerRunningBalancesByGereeId(buildingHistoryItems, contractsByNumber);
  }, [buildingHistoryItems, contractsByNumber]);

  const ledgerPaidTable = useMemo(() => {
    return aggregateLedgerTulsunByGereeId(buildingHistoryItems, contractsByNumber);
  }, [buildingHistoryItems, contractsByNumber]);

  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();

    // Process each resident to pull sync'd values from the matrix and ledger
    (gereeGaralt?.jagsaalt || []).forEach((ct: any) => {
      const gid = String(ct?._id || "").trim();
      if (!gid) return;

      const residentId = String(ct?.orshinSuugchId || "").trim();
      const r = residentId ? residentsById[residentId] : undefined;

      // 1. Төлөх дүн (Billed) from Matrix Month Slice
      const matrixSlice = pickMonthSlice(
        monthlyMatrixData,
        monthlyMatrixData?.periods,
        monthlyMatrixRange.monthKey,
      );
      const rowSlice = matrixSlice?.[gid] || matrixSlice?.[ct.gereeniiDugaar];
      const periodBilled = Number(rowSlice?.niitTulukhDun ?? 0);

      // 2. Төлсөн (Paid) from Ledger aggregation
      const periodPaid = Number(ledgerPaidTable[gid] ?? 0);

      // 3. Эцсийн үлдэгдэл (Final Balance) from Running Ledger
      const finalBal =
        ledgerBalances[gid] != null
          ? Number(ledgerBalances[gid])
          : Number(ct.globalUldegdel ?? ct.uldegdel ?? 0);

      // 4. Эхний үлдэгдэл (Opening Balance) derived mathematically
      // Formula: Opening = Final - PeriodActivity
      // Activity = Billed - Paid
      // Opening = Final - (Billed - Paid) = Final + Paid - Billed
      const ekhBal = finalBal + periodPaid - periodBilled;

      map.set(gid, {
        ...ct,
        _gereeId: gid,
        _gereeDugaar: ct?.gereeniiDugaar || "",
        _residentId: residentId,
        _ner: r?.ner ?? ct?.ner ?? "",
        _ovog: r?.ovog ?? ct?.ovog ?? "",
        _utas: r?.utas ?? ct?.utas ?? "",
        _toot: r?.toot ?? ct?.toot ?? "",
        _davkhar: r?.davkhar ?? ct?.davkhar ?? "",
        _ekhniiUldegdel: Math.round(ekhBal * 100) / 100,
        _periodPaid: Math.round(periodPaid * 100) / 100,
        _periodTulbur: Math.round(periodBilled * 100) / 100,
        _finalUldegdel: Math.round(finalBal * 100) / 100,
      });
    });

    return Array.from(map.values());
  }, [
    buildingHistoryItems,
    ledgerBalances,
    ledgerPaidTable,
    monthlyMatrixData,
    monthlyMatrixRange.monthKey,
    contractsByNumber,
    contractsById,
    residentsById,
    gereeGaralt,
  ]);


  const getGereeId = (it: any) =>
    String(it?._gereeId || it?.gereeniiId || it?.gereeId || "").trim();

  const getPaid = (it: any): number => {
    return Number(it?._periodPaid ?? 0);
  };

  const getUldegdel = (it: any): number => {
    return Number(it?._finalUldegdel ?? it?.uldegdel ?? 0);
  };

  const matchesFilters = (it: any): boolean => {
    const f = debouncedFilters;
    if (f.toot) {
      const toot = String(
        it?._toot || it?.toot || it?.medeelel?.toot || "",
      ).toLowerCase();
      if (!toot.includes(f.toot.toLowerCase())) return false;
    }
    if (f.davkhar) {
      const dv = String(it?._davkhar || it?.davkhar || "").toLowerCase();
      if (!dv.includes(f.davkhar.toLowerCase())) return false;
    }
    if (f.gereeniiDugaar) {
      const gd = String(
        it?._gereeDugaar || it?.gereeniiDugaar || "",
      ).toLowerCase();
      if (!gd.includes(f.gereeniiDugaar.toLowerCase())) return false;
    }
    if (f.orshinSuugch) {
      const name = `${it?._ovog || ""} ${it?._ner || ""}`.toLowerCase();
      if (!name.includes(f.orshinSuugch.toLowerCase())) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = `${it?._ovog || ""} ${it?._ner || ""}`.toLowerCase();
      const gd = String(
        it?._gereeDugaar || it?.gereeniiDugaar || "",
      ).toLowerCase();
      const utas = Array.isArray(it?._utas || it?.utas)
        ? String((it?._utas || it?.utas)[0] || "").toLowerCase()
        : String(it?._utas || it?.utas || "").toLowerCase();
      if (!name.includes(term) && !gd.includes(term) && !utas.includes(term))
        return false;
    }
    return true;
  };
  const paidList = useMemo(
    () =>
      deduplicatedResidents.filter(
        (it) => matchesFilters(it) && getPaid(it) > 0,
      ),
    [deduplicatedResidents, debouncedFilters, searchTerm],
  );
  const avlagaList = useMemo(
    () =>
      deduplicatedResidents.filter(
        (it) => matchesFilters(it) && getUldegdel(it) > 0,
      ),
    [deduplicatedResidents, debouncedFilters, searchTerm],
  );

  const allList = useMemo(
    () => deduplicatedResidents.filter(matchesFilters),
    [deduplicatedResidents, debouncedFilters, searchTerm],
  );

  const displayList =
    activeTab === "tulult"
      ? paidList
      : activeTab === "avlaga"
        ? avlagaList
        : allList;

  // Calculate grand totals for the new table format
  const totalEkhniiUldegdel = useMemo(
    () =>
      deduplicatedResidents
        .filter(matchesFilters)
        .reduce(
          (s, it) =>
            s + Number(it?._ekhniiUldegdelAmount ?? it?._ekhniiUldegdel ?? 0),
          0,
        ),
    [deduplicatedResidents, searchTerm, debouncedFilters],
  );

  const totalTulbur = useMemo(
    () =>
      deduplicatedResidents
        .filter(matchesFilters)
        .reduce((s, it) => s + Number(it?._periodTulbur ?? 0), 0),
    [deduplicatedResidents, searchTerm, debouncedFilters],
  );

  const totalOrlogo = useMemo(
    () =>
      deduplicatedResidents
        .filter(matchesFilters)
        .reduce((s, it) => s + getPaid(it), 0),
    [deduplicatedResidents, searchTerm, debouncedFilters],
  );

  const totalUldegdel = useMemo(
    () =>
      deduplicatedResidents
        .filter(matchesFilters)
        .reduce((s, it) => s + getUldegdel(it), 0),
    [deduplicatedResidents, searchTerm, debouncedFilters],
  );
  const handleRowClick = async (it: any) => {
    setSelectedRecord(it);
    setModalOpen(true);
    setExpandedLedger([]);
    setExpandedError(null);
    const gid = getGereeId(it);
    if (!gid || !baiguullagiinId) return;
    setExpandedLoading(true);
    try {
      const resp = await uilchilgee(token ?? undefined).get(
        `/geree/${gid}/history-ledger`,
        {
          params: {
            baiguullagiinId,
            ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}),
            _t: Date.now(),
          },
        },
      );
      const ledger = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt
        : Array.isArray(resp.data?.ledger)
          ? resp.data.ledger
          : Array.isArray(resp.data)
            ? resp.data
            : [];
      setExpandedLedger(ledger);
    } catch (e: any) {
      setExpandedError(e?.response?.data?.aldaa || e.message || "Алдаа гарлаа");
    } finally {
      setExpandedLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRecord(null);
    setExpandedLedger([]);
    setExpandedError(null);
  };

  const exportToExcel = async () => {
    if (!token || !baiguullagiinId) {
      toast.error("Хэрэглэгчийн мэдээлэл олдсонгүй");
      return;
    }

    const toastId = toast.loading("Excel файл бэлтгэж байна...");

    try {
      const body = {
        report: "orlogo-tovchoo",
        baiguullagiinId,
        barilgiinId: selectedBuildingId || undefined,
        ekhlekhOgnoo: dateRange?.[0] || undefined,
        duusakhOgnoo: dateRange?.[1] || undefined,
        activeTab: activeTab, // Pass current tab context
        ...filters,
      };

      const resp = await uilchilgee(token).post("/tailan/export", body, {
        responseType: "blob" as any,
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `${activeTab === "tulult" ? "orlogo" : "avlaga"}_report_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel файл амжилттай татагдлаа", { id: toastId });
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Excel татахад алдаа гарлаа", { id: toastId });
    }
  };

  const isLoading = isLoadingHistory || isLoadingReceivable || isLoadingPayment;
  const paginatedList = displayList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("mn-MN") : "-";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="p-6 print-container bg-white dark:bg-gray-900 min-h-screen w-full">
      <PrintStyles />

      {/* Print-only Header */}
      <div className="print-only mb-6">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase">
              {activeTab === "tulult"
                ? "Орлогын товчоо тайлан"
                : "Авлага тулгалтын тайлан"}
            </h1>
            <p className="text-sm mt-1">
              {baiguullaga?.ner || "Байгууллагын нэр"}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>
              Огноо:{" "}
              {dateRange?.[0] && dateRange?.[1]
                ? `${new Date(dateRange[0]).toLocaleDateString("mn-MN")} - ${new Date(dateRange[1]).toLocaleDateString("mn-MN")}`
                : "Бүх хугацаа"}
            </p>
            <p>Хэвлэсэн: {new Date().toLocaleString("mn-MN")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-6">
          <div className="border p-3 rounded">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Нийт орлого
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatNumber(totalOrlogo, 2)} ₮
            </p>
          </div>
          <div className="border p-3 rounded">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Нийт үлдэгдэл
            </p>
            <p className="text-xl font-bold text-red-700">
              {formatNumber(totalUldegdel, 2)} ₮
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center  mb-6 no-print">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Орлого авлагын товчоо</h1>
          <div className="flex gap-2">
            {(
              [
                ["all", "Бүгд"],
                ["avlaga", "Авлага"],
                ["tulult", "Орлого"],
              ] as [TabType, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedRow(null);
                  setExpandedLedger([]);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${activeTab === tab ? "bg-theme/15 text-theme font-medium shadow-sm" : "text-theme/60 hover:bg-theme/10 hover:text-theme"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel татах
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="mb-2">
            Нийт орлого{" "}
            <span className="text-xs text-theme/50">(Гүйцэтгэл)</span>
          </h3>
          <p className="text-2xl text-green-600">
            {formatNumber(totalOrlogo, 2)} ₮
          </p>
          <p className="text-xs text-theme/50 mt-1">
            {paidList.length} оршин суугч
          </p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="mb-2">
            Нийт үлдэгдэл{" "}
            <span className="text-xs text-theme/50">(Үлдэгдэл)</span>
          </h3>
          <p
            className={
              totalUldegdel < 0
                ? "text-2xl text-emerald-600"
                : "text-2xl text-red-600"
            }
          >
            {formatNumber(totalUldegdel, 2)} ₮
          </p>
          <p className="text-xs text-theme/50 mt-1">
            Бүх оршин суугчдын нийт үлдэгдэл
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center no-print mb-4">
        <div
          id="orlogo-avlaga-date"
          className="btn-minimal h-[40px] w-full sm:w-[320px] flex items-center px-3"
        >
          <StandardDatePicker
            isRange={true}
            value={dateRange}
            onChange={(dates, dateStrings) => setDateRange(dateStrings)}
            allowClear
            placeholder="Огноо сонгох"
            classNames={{
              root: "!h-full !w-full",
              input:
                "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
            }}
          />
        </div>
        {[
          {
            key: "orshinSuugch",
            label: "Оршин суугч",
            placeholder: "Овог, нэрээр хайх",
          },
          { key: "toot", label: "Тоот", placeholder: "Тоот" },
          { key: "davkhar", label: "Давхар", placeholder: "Давхар" },
        ].map(({ key, label, placeholder }) => (
          <div
            key={key}
            className="rounded-xl h-[40px] w-full sm:w-[280px] flex items-center"
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <label className="text-sm text-theme/80 shrink-0 whitespace-nowrap w-[90px] text-right pr-2">
                {label}
              </label>
              <input
                type="text"
                value={(filters as any)[key]}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, [key]: e.target.value }))
                }
                className="flex-1 px-3 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
                placeholder={placeholder}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-3 allow-overflow">
          <OrlogoAvlagaTable
            data={paginatedList as OrlogoAvlagaItem[]}
            loading={isLoading}
            page={currentPage}
            pageSize={pageSize}
            activeTab={activeTab}
            expandedLedger={expandedLedger}
            expandedLoading={expandedLoading}
            expandedError={expandedError}
            getPaid={getPaid}
            getUldegdel={getUldegdel}
            onRowClick={handleRowClick}
            getGereeId={getGereeId}
            modalOpen={modalOpen}
            onModalClose={handleModalClose}
            selectedRecord={selectedRecord}
            grandTotalPaid={totalOrlogo}
            grandTotalUldegdel={totalUldegdel}
            grandTotalEkhniiUldegdel={totalEkhniiUldegdel}
            grandTotalTulbur={totalTulbur}
            dateRange={dateRange}
          />
        </div>
      </div>

      <div className="flex items-center justify-between no-print mt-3">
        <StandardPagination
          current={currentPage}
          total={displayList.length}
          pageSize={pageSize}
          onChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setCurrentPage(1);
          }}
          pageSizeOptions={[50, 100, 200, 500]}
        />
      </div>
    </div>
  );
}
