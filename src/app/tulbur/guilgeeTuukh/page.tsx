"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@/context/SearchContext";
import useSWR, { useSWRConfig } from "swr";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
// import KhungulultPage from "../khungulult/page";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { Tooltip, Table } from "antd";
import type { TableColumnsType } from "antd";
import GuilgeeTable from "./GuilgeeTable";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { set } from "lodash";
import IconTextButton from "@/components/ui/IconTextButton";
import Button from "@/components/ui/Button";
import {
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Eye,
  History,
  Columns,
  Banknote,
  Send,
} from "lucide-react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber, {
  formatCurrency,
} from "../../../../tools/function/formatNumber";
import matchesSearch from "@/tools/function/matchesSearch";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import {
  getPaymentStatusLabel,
  isPaidLike,
  isUnpaidLike,
  isOverdueLike,
} from "@/lib/utils";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";
import { useSocket } from "@/context/SocketContext";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TransactionModal, {
  type TransactionData,
} from "../modals/TransactionModal";
import HistoryModal from "../../geree/modals/HistoryModal";
import InvoiceModal from "../../geree/modals/InvoiceModal";
import InitialBalanceExcelModal from "../modals/InitialBalanceExcelModal";
import { useGereeActions } from "@/lib/useGereeActions";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

type DateRangeValue = [string | null, string | null] | undefined;

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted ? createPortal(children as any, document.body) : null;
};

import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";

export default function DansniiKhuulga() {
  const { mutate } = useSWRConfig();
  const socket = useSocket();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const { searchTerm } = useSearch();
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const { baiguullaga, baiguullagaMutate } = useBaiguullaga(token, (ajiltan?.baiguullagiinId || null) as string | null);
  const { handleSendInvoices: sendInvoicesApi } = useGereeActions(
    token,
    ajiltan,
    (barilgiinId || undefined) as string | undefined,
    (selectedBuildingId || undefined) as string | undefined,
    baiguullaga,
    baiguullagaMutate,
  );

  // Memoize empty objects to prevent infinite SWR re-validation loops
  const emptyQuery = useMemo(() => ({}), []);

  const todayStr = new Date().toISOString().split("T")[0];
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [tuluvFilter, setTuluvFilter] = useState<
    "all" | "paid" | "unpaid" | "overdue"
  >("all");
  const [selectedOrtsFilter, setSelectedOrtsFilter] = useState<string>("");
  const [selectedTootFilter, setSelectedTootFilter] = useState<string>("");
  const [selectedDavkharFilter, setSelectedDavkharFilter] =
    useState<string>("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isKhungulultOpen, setIsKhungulultOpen] = useState(false);
  const khungulultRef = useRef<HTMLDivElement | null>(null);
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionResident, setSelectedTransactionResident] =
    useState<any>(null);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [isInitialBalanceModalOpen, setIsInitialBalanceModalOpen] =
    useState(false);
  const [invoiceRefreshTrigger, setInvoiceRefreshTrigger] = useState(0);
  // Map gereeId -> total paid amount (Төлсөн дүн)
  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<
    Record<string, number>
  >({});
  const [paidSummaryRequested, setPaidSummaryRequested] = useState<
    Record<string, boolean>
  >({});
  // Use a ref to track what's currently being requested across renders without causing loops
  const requestedGereeIdsRef = useRef<Set<string>>(new Set());

  // Map gereeId -> latest row uldegdel from history ledger
  const [latestRowUldegdelByGereeId, setLatestRowUldegdelByGereeId] = useState<
    Record<string, number | null>
  >({});
  const latestRowUldegdelRequestedRef = useRef<Set<string>>(new Set());

  // Socket: revalidate data when payment, avlaga, or delete happens (from any tab/source)
  useEffect(() => {
    const baiguullagiinId = ajiltan?.baiguullagiinId;
    if (!socket || !baiguullagiinId) return;
    const event = `tulburUpdated:${baiguullagiinId}`;
    const handler = () => {
      mutate(
        (key: any) => {
          if (!Array.isArray(key)) return false;
          const prefix = String(key[0] || "");
          return (
            prefix === "/nekhemjlekhiinTuukh" ||
            prefix.startsWith("/nekhemjlekhiinTuukh-") ||
            prefix === "/gereeniiTulukhAvlaga" ||
            prefix.startsWith("/gereeniiTulukhAvlaga-") ||
            prefix === "/gereeniiTulsunAvlaga" ||
            prefix.startsWith("/gereeniiTulsunAvlaga-") ||
            prefix === "/geree" ||
            prefix === "/orshinSuugch"
          );
        },
        undefined,
        { revalidate: true },
      );
      setPaidSummaryByGereeId({});
      requestedGereeIdsRef.current.clear();
      setLatestRowUldegdelByGereeId({});
      latestRowUldegdelRequestedRef.current.clear();
      setInvoiceRefreshTrigger((t) => t + 1);
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, ajiltan?.baiguullagiinId, mutate]);

  // Selection state for "Send Invoice"
  const [selectedGereeIds, setSelectedGereeIds] = useState<string[]>([]);
  const [isSendingInvoices, setIsSendingInvoices] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        key: "checkbox",
        label: "",
        align: "center",
        sticky: true,
        width: 40,
        minWidth: 40,
      },
      {
        key: "index",
        label: "№",
        align: "center",
        sticky: true,
        width: 48,
        minWidth: 48,
      },
      {
        key: "ner",
        label: "Нэр",
        align: "center",
        sticky: true,
        width: 150,
        minWidth: 150,
      },
      {
        key: "toot",
        label: "Тоот",
        align: "center",
        sticky: true,
        width: 80,
        minWidth: 80,
      },
      {
        key: "utas",
        label: "Утас",
        align: "center",
        sticky: true,
        width: 100,
        minWidth: 100,
      },
      { key: "orts", label: "Орц", align: "center", minWidth: 80 },
      { key: "davkhar", label: "Давхар", align: "center", minWidth: 80 },
      {
        key: "gereeniiDugaar",
        label: "Гэрээний дугаар",
        align: "center",
        minWidth: 140,
      },
      { key: "tulbur", label: "Төлбөр", align: "center", minWidth: 110 },
      {
        key: "ekhniiUldegdel",
        label: "Эхний үлдэгдэл",
        align: "center",
        minWidth: 110,
      },
      { key: "uldegdel", label: "Үлдэгдэл", align: "center", minWidth: 110 },
      { key: "paid", label: "Гүйцэтгэл", align: "center", minWidth: 110 },
      { key: "tuluv", label: "Төлөв", align: "center", minWidth: 110 },
      {
        key: "lastLog",
        label: "Огноо",
        align: "center",
        minWidth: 140,
      },
      { key: "action", label: "Үйлдэл", align: "center", minWidth: 130 },
    ],
    [],
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const hiddenByDefault = [
      "orts",
      "davkhar",
      "tulbur",
      "ekhniiUldegdel",
      "tuluv",
      "lastLog",
    ];
    return columnDefs.reduce(
      (acc, col) => {
        acc[col.key] = !hiddenByDefault.includes(col.key);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });
  const visibleColumns = useMemo(
    () => columnDefs.filter((col) => columnVisibility[col.key] !== false),
    [columnDefs, columnVisibility],
  );

  // Columns that appear in "Багана сонгох" modal (exclude structural checkbox, index, action)
  const selectableColumnKeys = [
    "ner",
    "toot",
    "utas",
    "orts",
    "davkhar",
    "gereeniiDugaar",
    "tulbur",
    "ekhniiUldegdel",
    "uldegdel",
    "paid",
    "tuluv",
    "lastLog",
  ] as const;
  const selectableColumnDefs = useMemo(
    () =>
      columnDefs.filter((col) =>
        selectableColumnKeys.includes(
          col.key as (typeof selectableColumnKeys)[number],
        ),
      ),
    [columnDefs],
  );
  const stickyOffsets = useMemo(() => {
    let left = 0;
    const offsets: Record<string, number> = {};
    visibleColumns.forEach((col) => {
      if (!col.sticky) return;
      offsets[col.key] = left;
      left += col.width || 0;
    });
    return offsets;
  }, [visibleColumns]);
  const visibleColumnCount = visibleColumns.length;

  // Invoice and History modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [historyResident, setHistoryResident] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement | null>(null);

  // Paid history modal state
  // History modal removed; showing org-scoped list directly

  // Fetch org-scoped payment history
  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/nekhemjlekhiinTuukh",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
          ekhlekhOgnoo?.[0] || null,
          ekhlekhOgnoo?.[1] || null,
        ]
      : null,
    async ([url, tkn, orgId, branch, start, end]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          barilgiinId: branch || undefined,
          ekhlekhOgnoo: start || undefined,
          duusakhOgnoo: end || undefined,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: receivableData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/gereeniiTulukhAvlaga",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
          ekhlekhOgnoo?.[0] || null,
          ekhlekhOgnoo?.[1] || null,
        ]
      : null,
    async ([url, tkn, orgId, branch, start, end]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          barilgiinId: branch || undefined,
          ekhlekhOgnoo: start || undefined,
          duusakhOgnoo: end || undefined,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

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

    // Combine and deduplicate by ID.
    // If an ID exists in both (meaning it was merged into an invoice), the invoice version wins.
    const combined = [...invoices];

    // Collect all IDs that should be considered "already tracked by an invoice"
    // This includes the invoice ID itself AND any merged transaction IDs inside the medeelel.guilgeenuud array
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
      if (!trackingIds.has(String(r._id))) {
        combined.push(r);
      }
    });

    if (!ekhlekhOgnoo || (!ekhlekhOgnoo[0] && !ekhlekhOgnoo[1]))
      return combined;
    const [start, end] = ekhlekhOgnoo;
    const startObj = start ? new Date(start) : null;
    if (startObj) startObj.setHours(0, 0, 0, 0);
    const endObj = end ? new Date(end) : null;
    if (endObj) endObj.setHours(23, 59, 59, 999);

    const s = startObj ? startObj.getTime() : Number.NEGATIVE_INFINITY;
    const e = endObj ? new Date(endObj).getTime() : Number.POSITIVE_INFINITY;

    return combined.filter((it: any) => {
      const d = new Date(
        it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0,
      ).getTime();
      return d >= s && d <= e;
    });
  }, [historyData, receivableData, ekhlekhOgnoo]);

  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId,
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    emptyQuery,
    effectiveBarilgiinId,
  );

  const contractsById = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?._id) map[String(g._id)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsByNumber = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const residentsById = useMemo(() => {
    const list = (orshinSuugchGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((r) => {
      if (r?._id) map[String(r._id)] = r;
    });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  const buildingHistoryItems = useMemo(() => {
    const bid = String(effectiveBarilgiinId || "");
    if (!bid) return allHistoryItems;
    const toStr = (v: any) => (v == null ? "" : String(v));
    return allHistoryItems.filter((it: any) => {
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId,
      );
      if (itemBid) return itemBid === bid;
      const cId = toStr(
        it?.gereeId ??
          it?.gereeniiId ??
          it?.contractId ??
          it?.kholbosonGereeniiId,
      );
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? (contractsById as any)[cId] : undefined;
      const r = rId ? (residentsById as any)[rId] : undefined;
      const cbid = toStr(
        c?.barilgiinId ?? c?.barilga ?? c?.barilgaId ?? c?.branchId,
      );
      const rbid = toStr(
        r?.barilgiinId ?? r?.barilga ?? r?.barilgaId ?? r?.branchId,
      );
      if (cbid) return cbid === bid;
      if (rbid) return rbid === bid;
      return false;
    });
  }, [allHistoryItems, effectiveBarilgiinId, contractsById, residentsById]);

  // Unified Definitive Balance Map
  // This ensures that for any status check (Filtered List or Dashboard Stats),
  // we use the same "Current Balance" for a resident, regardless of which transaction row we are looking at.
  const bestKnownBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    // 1. Initialize with contract/resident data
    Object.values(contractsById).forEach((c: any) => {
      const gid = String(c._id);
      if (c.uldegdel != null) balances[gid] = Number(c.uldegdel);
    });

    // 2. Override with the latest transaction's uldegdel (often more current than contract list)
    // Sort allHistoryItems by date (latest first) to pick the freshest balance
    const sorted = [...allHistoryItems].sort((a: any, b: any) => {
      const da = new Date(
        a.ognoo || a.tulsunOgnoo || a.createdAt || 0,
      ).getTime();
      const db = new Date(
        b.ognoo || b.tulsunOgnoo || b.createdAt || 0,
      ).getTime();
      return db - da;
    });

    const seenGid = new Set<string>();
    sorted.forEach((it: any) => {
      const gid =
        String(it?.gereeniiId || it?.gereeId || "").trim() ||
        (it?.gereeniiDugaar &&
          String(contractsByNumber[String(it.gereeniiDugaar)]?._id || "")) ||
        "";
      if (gid && !seenGid.has(gid)) {
        seenGid.add(gid);
        if (it?.uldegdel != null && Number.isFinite(Number(it.uldegdel))) {
          balances[gid] = Number(it.uldegdel);
        }
      }
    });

    // 3. Absolute priority: Ledger balances (lazily loaded via deep fetch)
    Object.entries(latestRowUldegdelByGereeId).forEach(([gid, val]) => {
      if (val != null) balances[gid] = val;
    });

    // 4. Removed rounding to preserve precision for the 0.Map (allows small residuals to be visible)
    // Precise epsilon checks will handle status categorization.

    return balances;
  }, [
    allHistoryItems,
    contractsById,
    contractsByNumber,
    latestRowUldegdelByGereeId,
    paidSummaryByGereeId,
  ]);

  // Filter by paid/unpaid + Орц + Давхар
  const filteredItems = useMemo(() => {
    // Get cancelled geree IDs for filtering
    const cancelledGereeIds = new Set<string>();
    const cancelledGereeDugaars = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    cancelledGerees.forEach((g: any) => {
      if (g?._id) cancelledGereeIds.add(String(g._id));
      if (g?.gereeniiDugaar)
        cancelledGereeDugaars.add(String(g.gereeniiDugaar));
    });

    return buildingHistoryItems.filter((it: any) => {
      const gid =
        String(it?.gereeniiId ?? it?.gereeId ?? "").trim() ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        "";

      // Use the Definitive Balance Map
      const currentBalance =
        bestKnownBalances[gid] ?? Number(it?.uldegdel ?? 0);

      // Use a consistent epsilon (0.01 MNT) for balance checks
      // Any balance >= 0.01 MNT is considered unpaid.
      const isResidentPaid = currentBalance < 0.01;

      if (tuluvFilter === "paid") {
        return isResidentPaid;
      }
      if (tuluvFilter === "unpaid") {
        // Must have balance > 0 AND NOT linked to a cancelled contract
        const itGereeId = String(it?.gereeniiId || it?.gereeId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const isLinkedToCancelledGeree =
          (itGereeId && cancelledGereeIds.has(itGereeId)) ||
          (itGereeDugaar && cancelledGereeDugaars.has(itGereeDugaar));

        return !isResidentPaid && !isLinkedToCancelledGeree;
      }
      if (tuluvFilter === "overdue") {
        // Filter for cancelled receivables: must have balance > 0 AND be linked to cancelled contract
        const itGereeId = String(it?.gereeniiId || it?.gereeId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const isLinkedToCancelledGeree =
          (itGereeId && cancelledGereeIds.has(itGereeId)) ||
          (itGereeDugaar && cancelledGereeDugaars.has(itGereeDugaar));

        return !isResidentPaid && isLinkedToCancelledGeree;
      }

      // Additional filters: Орц and Давхар
      if (selectedOrtsFilter || selectedDavkharFilter || selectedTootFilter) {
        const toStr = (v: any) => (v == null ? "" : String(v).trim());

        const cId = toStr(
          it?.gereeniiId ?? it?.gereeId ?? it?.kholbosonGereeniiId,
        );
        const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
        const c = cId ? (contractsById as any)[cId] : undefined;
        const r = rId ? (residentsById as any)[rId] : undefined;

        const orts = toStr(
          c?.orts ??
            c?.ortsDugaar ??
            c?.ortsNer ??
            r?.orts ??
            r?.ortsDugaar ??
            r?.ortsNer ??
            r?.block ??
            it?.orts ??
            it?.ortsDugaar ??
            it?.ortsNer,
        );
        const davkhar = toStr(r?.davkhar ?? c?.davkhar ?? it?.davkhar);
        const currentToot = toStr(
          r?.toot ?? c?.toot ?? it?.toot ?? it?.medeelel?.toot,
        );

        if (selectedOrtsFilter) {
          if (!orts || orts !== toStr(selectedOrtsFilter)) return false;
        }
        if (selectedDavkharFilter) {
          if (!davkhar || davkhar !== toStr(selectedDavkharFilter))
            return false;
        }
        if (selectedTootFilter) {
          // Robust case-insensitive partial matching for toot
          const filterVal = toStr(selectedTootFilter).toLowerCase();
          const targetToot = currentToot.toLowerCase();
          if (targetToot !== filterVal && !targetToot.includes(filterVal))
            return false;
        }
      }

      if (searchTerm) {
        // Augment item with resident/contract data so invoices match search even when
        // they only have orshinSuugchId/gereeniiId (ner/utas come from lookup)
        const cId = String(it?.gereeniiId ?? it?.gereeId ?? "").trim();
        const contract = cId ? (contractsById as any)[cId] : undefined;
        const rId = String(
          it?.orshinSuugchId ??
            it?.residentId ??
            contract?.orshinSuugchId ??
            "",
        ).trim();
        const resident = rId ? (residentsById as any)[rId] : undefined;
        const augmented = {
          ...it,
          _searchNer: resident?.ner ?? it?.ner ?? contract?.ner,
          _searchOvog: resident?.ovog ?? it?.ovog ?? contract?.ovog,
          _searchUtas: resident?.utas ?? it?.utas ?? contract?.utas,
          _searchGereeDugaar: contract?.gereeniiDugaar ?? it?.gereeniiDugaar,
        };
        if (!matchesSearch(augmented, searchTerm)) return false;
      }

      return true;
    });
  }, [
    buildingHistoryItems,
    tuluvFilter,
    searchTerm,
    gereeGaralt?.jagsaalt,
    contractsById,
    contractsByNumber,
    residentsById,
    selectedOrtsFilter,
    selectedDavkharFilter,
    selectedTootFilter,
    latestRowUldegdelByGereeId,
    bestKnownBalances,
  ]);

  // Same as filteredItems but WITHOUT tuluvFilter - for stats (dashboard numbers stay fixed)
  const filteredItemsAll = useMemo(() => {
    const cancelledGereeIds = new Set<string>();
    const cancelledGereeDugaars = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    cancelledGerees.forEach((g: any) => {
      if (g?._id) cancelledGereeIds.add(String(g._id));
      if (g?.gereeniiDugaar)
        cancelledGereeDugaars.add(String(g.gereeniiDugaar));
    });

    return buildingHistoryItems.filter((it: any) => {
      // Skip tuluvFilter - include all items for stats
      if (selectedOrtsFilter || selectedDavkharFilter || selectedTootFilter) {
        const toStr = (v: any) => (v == null ? "" : String(v).trim());
        const cId = toStr(
          it?.gereeniiId ?? it?.gereeId ?? it?.kholbosonGereeniiId,
        );
        const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
        const c = cId ? (contractsById as any)[cId] : undefined;
        const r = rId ? (residentsById as any)[rId] : undefined;
        const orts = toStr(
          c?.orts ??
            c?.ortsDugaar ??
            c?.ortsNer ??
            r?.orts ??
            r?.ortsDugaar ??
            r?.ortsNer ??
            r?.block ??
            it?.orts ??
            it?.ortsDugaar ??
            it?.ortsNer,
        );
        const davkhar = toStr(r?.davkhar ?? c?.davkhar ?? it?.davkhar);
        const currentToot = toStr(
          r?.toot ?? c?.toot ?? it?.toot ?? it?.medeelel?.toot,
        );
        if (selectedOrtsFilter && (!orts || orts !== toStr(selectedOrtsFilter)))
          return false;
        if (
          selectedDavkharFilter &&
          (!davkhar || davkhar !== toStr(selectedDavkharFilter))
        )
          return false;
        if (selectedTootFilter) {
          const filterVal = toStr(selectedTootFilter).toLowerCase();
          const targetToot = currentToot.toLowerCase();
          if (targetToot !== filterVal && !targetToot.includes(filterVal))
            return false;
        }
      }
      if (searchTerm) {
        const cId = String(it?.gereeniiId ?? it?.gereeId ?? "").trim();
        const contract = cId ? (contractsById as any)[cId] : undefined;
        const rId = String(
          it?.orshinSuugchId ??
            it?.residentId ??
            contract?.orshinSuugchId ??
            "",
        ).trim();
        const resident = rId ? (residentsById as any)[rId] : undefined;
        const augmented = {
          ...it,
          _searchNer: resident?.ner ?? it?.ner ?? contract?.ner,
          _searchOvog: resident?.ovog ?? it?.ovog ?? contract?.ovog,
          _searchUtas: resident?.utas ?? it?.utas ?? contract?.utas,
          _searchGereeDugaar: contract?.gereeniiDugaar ?? it?.gereeniiDugaar,
        };
        if (!matchesSearch(augmented, searchTerm)) return false;
      }
      return true;
    });
  }, [
    buildingHistoryItems,
    searchTerm,
    gereeGaralt?.jagsaalt,
    contractsById,
    residentsById,
    selectedOrtsFilter,
    selectedDavkharFilter,
    selectedTootFilter,
    bestKnownBalances,
  ]);

  const totalSum = useMemo(() => {
    return filteredItems.reduce((s: number, it: any) => {
      const v =
        Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        ) || 0;
      return s + v;
    }, 0);
  }, [filteredItems]);

  // Deduplicate by resident (orshinSuugchId or ner+utas combination)
  // CRITICAL: Use buildingHistoryItems for amount calculation so negative ekhniiUldegdel (e.g. -87.79)
  // is always included even when filtered out. Filter which residents to show via filteredItems.
  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();

    // Build set of resident keys that pass the current filter (tuluv, orts, davkhar, search)
    const residentKeysFromFiltered = new Set<string>();
    filteredItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;
      if (key && key !== "||") residentKeysFromFiltered.add(key);
    });

    // FIRST PASS: Identify contracts/residents that have INVOICES containing ekhniiUldegdel in their zardluud
    const contractsWithEkhniiUldegdelInInvoice = new Set<string>();

    buildingHistoryItems.forEach((it: any) => {
      // Check if this is an invoice (has zardluud or medeelel.zardluud)
      const zardluud = Array.isArray(it?.medeelel?.zardluud)
        ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud)
          ? it.zardluud
          : [];
      const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];

      // Check if invoice contains ekhniiUldegdel in its zardluud (include negative)
      const hasEkhniiUldegdelInZardluud = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        const isEkhUld =
          z?.isEkhniiUldegdel === true ||
          ner.includes("эхний үлдэгдэл") ||
          ner.includes("ekhniuldegdel") ||
          ner.includes("ekhnii uldegdel");
        const amt = Number(z?.dun ?? z?.tariff ?? 0);
        return isEkhUld && amt !== 0;
      });
      // Also check guilgeenuud for ekhniiUldegdel (e.g. Excel-ээр оруулсан эхний үлдэгдэл)
      const hasEkhniiUldegdelInGuilgee = guilgeenuud.some((g: any) => {
        if (g?.ekhniiUldegdelEsekh !== true) return false;
        const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
        return amt !== 0;
      });

      if (hasEkhniiUldegdelInZardluud || hasEkhniiUldegdelInGuilgee) {
        const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
        if (gereeId) contractsWithEkhniiUldegdelInInvoice.add(gereeId);
        if (gereeDugaar) contractsWithEkhniiUldegdelInInvoice.add(gereeDugaar);
      }
    });

    // SECOND PASS: Build deduplicated residents from buildingHistoryItems (all data for correct totals)
    // Only include residents that have at least one item in filteredItems
    buildingHistoryItems.forEach((it: any) => {
      // Create a unique key for each resident
      const residentId = String(it?.orshinSuugchId || "").trim();
      let gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      // For receivables, gereeId might be missing - resolve from gereeDugaar via contractsByNumber
      if (
        !gereeId &&
        gereeDugaar &&
        (contractsByNumber as any)[gereeDugaar]?._id
      ) {
        gereeId = String((contractsByNumber as any)[gereeDugaar]._id);
      }
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();

      // Priority grouping: GereeId > ResidentId > GereeDugaar > Name+Utas
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return; // Skip if no valid identifier
      if (!residentKeysFromFiltered.has(key)) return; // Only include residents that pass the filter

      // Check if this is a standalone ekhniiUldegdel record from gereeniiTulukhAvlaga
      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      const standaloneAmount =
        Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0;

      // SKIP this record if it's a standalone ekhniiUldegdel AND the contract already has ekhniiUldegdel in an invoice
      // This prevents double-counting. BUT: never skip NEGATIVE standalone (e.g. Excel-ээр оруулсан эхний үлдэгдэл -87.79)
      // because invoice's ekhniiUldegdel is typically positive - they are different entries.
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar &&
            contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));

        if (contractHasEkhniiUldegdelInInvoice && standaloneAmount >= 0) {
          // Skip only when positive - invoice's ekhniiUldegdel covers it
          return;
        }
      }

      // For standalone ekhniiUldegdel records (that don't have an invoice), use undsenDun (original amount)
      // For invoices/other items, base on niitTulbur/niitDun/total (sum of zardluud),
      // matching HistoryModal's charge calculation and avoiding double-counting niitTulburOriginal.
      let itemAmount = isStandaloneEkhniiUldegdel
        ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
        : Number(
            it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0,
          ) || 0;

      let ekhniiUldegdelDelta = isStandaloneEkhniiUldegdel ? itemAmount : 0;
      if (!isStandaloneEkhniiUldegdel) {
        // For invoices: base on niitTulbur/niitDun/total (sum of zardluud/expenses),
        // which matches what HistoryModal derives from zardluud.
        const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
          ? it.medeelel.guilgeenuud
          : Array.isArray(it?.guilgeenuud)
            ? it.guilgeenuud
            : [];

        itemAmount =
          Number(
            it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0,
          ) || 0;

        // Extract ekhniiUldegdel from invoice zardluud and guilgeenuud for column display
        const zardluud = Array.isArray(it?.medeelel?.zardluud)
          ? it.medeelel.zardluud
          : Array.isArray(it?.zardluud)
            ? it.zardluud
            : [];
        const fromZardluud = zardluud.reduce((s: number, z: any) => {
          const ner = String(z?.ner || "").toLowerCase();
          const isEkh =
            z?.isEkhniiUldegdel === true ||
            ner.includes("эхний үлдэгдэл") ||
            ner.includes("ekhniuldegdel") ||
            ner.includes("ekhnii uldegdel");
          if (!isEkh) return s;
          const amt = Number(z?.dun ?? z?.tariff ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        const fromGuilgee = guilgeenuud.reduce((s: number, g: any) => {
          if (g?.ekhniiUldegdelEsekh !== true) return s;
          const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        ekhniiUldegdelDelta = fromZardluud + fromGuilgee;
      }

      if (!map.has(key)) {
        // First occurrence - store as base record
        map.set(key, {
          ...it,
          _historyCount: 1,
          _totalTulbur: itemAmount,
          _totalTulsun: Number(it?.tulsunDun ?? 0) || 0,
          _hasEkhniiUldegdel:
            isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0,
          _ekhniiUldegdelAmount: ekhniiUldegdelDelta,
        });
      } else {
        // Aggregate values
        const existing = map.get(key);
        existing._historyCount += 1;
        existing._totalTulbur += itemAmount;
        existing._totalTulsun += Number(it?.tulsunDun ?? 0) || 0;
        if (isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0) {
          existing._hasEkhniiUldegdel = true;
          existing._ekhniiUldegdelAmount =
            (existing._ekhniiUldegdelAmount || 0) + ekhniiUldegdelDelta;
        }
      }
    });

    return Array.from(map.values());
  }, [
    filteredItems,
    buildingHistoryItems,
    contractsByNumber,
    bestKnownBalances,
  ]);

  // Full resident set (no tuluvFilter) - for stats so dashboard numbers stay fixed when clicking filters
  const deduplicatedResidentsAll = useMemo(() => {
    const map = new Map<string, any>();
    const residentKeysFromFiltered = new Set<string>();
    filteredItemsAll.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;
      if (key && key !== "||") residentKeysFromFiltered.add(key);
    });

    const contractsWithEkhniiUldegdelInInvoice = new Set<string>();
    buildingHistoryItems.forEach((it: any) => {
      const zardluud = Array.isArray(it?.medeelel?.zardluud)
        ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud)
          ? it.zardluud
          : [];
      const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];
      const hasEkhniiUldegdelInZardluud = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        const isEkhUld =
          z?.isEkhniiUldegdel === true ||
          ner.includes("эхний үлдэгдэл") ||
          ner.includes("ekhniuldegdel") ||
          ner.includes("ekhnii uldegdel");
        const amt = Number(z?.dun ?? z?.tariff ?? 0);
        return isEkhUld && amt !== 0;
      });
      const hasEkhniiUldegdelInGuilgee = guilgeenuud.some((g: any) => {
        if (g?.ekhniiUldegdelEsekh !== true) return false;
        const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
        return amt !== 0;
      });
      if (hasEkhniiUldegdelInZardluud || hasEkhniiUldegdelInGuilgee) {
        const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
        if (gereeId) contractsWithEkhniiUldegdelInInvoice.add(gereeId);
        if (gereeDugaar) contractsWithEkhniiUldegdelInInvoice.add(gereeDugaar);
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      let gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      if (
        !gereeId &&
        gereeDugaar &&
        (contractsByNumber as any)[gereeDugaar]?._id
      ) {
        gereeId = String((contractsByNumber as any)[gereeDugaar]._id);
      }
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return;
      if (!residentKeysFromFiltered.has(key)) return;

      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      const standaloneAmount =
        Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0;
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar &&
            contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));
        if (contractHasEkhniiUldegdelInInvoice && standaloneAmount >= 0) return;
      }

      let itemAmount = isStandaloneEkhniiUldegdel
        ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
        : Number(
            it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0,
          ) || 0;

      // Determine if this item is a CHARGE (increases total) or a PAYMENT (increases paid)
      // Usually "tulult" (payment) or "tsutlsasan" (cancelled) records are payments/deductions
      const type = String(it?.turul || it?.type || "").toLowerCase();
      const isPayment =
        type === "tulult" ||
        type === "төлбөр" ||
        type === "төлөлт" ||
        (itemAmount < 0 && !isStandaloneEkhniiUldegdel);

      let ekhniiUldegdelDelta = isStandaloneEkhniiUldegdel ? itemAmount : 0;
      if (!isStandaloneEkhniiUldegdel) {
        const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
          ? it.medeelel.guilgeenuud
          : Array.isArray(it?.guilgeenuud)
            ? it.guilgeenuud
            : [];
        const zardluud = Array.isArray(it?.medeelel?.zardluud)
          ? it.medeelel.zardluud
          : Array.isArray(it?.zardluud)
            ? it.zardluud
            : [];
        const fromZardluud = zardluud.reduce((s: number, z: any) => {
          const ner = String(z?.ner || "").toLowerCase();
          const isEkh =
            z?.isEkhniiUldegdel === true ||
            ner.includes("эхний үлдэгдэл") ||
            ner.includes("ekhniuldegdel") ||
            ner.includes("ekhnii uldegdel");
          if (!isEkh) return s;
          const amt = Number(z?.dun ?? z?.tariff ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        const fromGuilgee = guilgeenuud.reduce((s: number, g: any) => {
          if (g?.ekhniiUldegdelEsekh !== true) return s;
          const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        ekhniiUldegdelDelta = fromZardluud + fromGuilgee;
      }

      const chargeAmt = isPayment ? 0 : Math.abs(itemAmount);
      // For payments, use Math.abs(itemAmount) because payments are often stored as negative in the history
      const paidAmt = isPayment
        ? Math.abs(itemAmount)
        : Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0;

      if (!map.has(key)) {
        map.set(key, {
          ...it,
          _historyCount: 1,
          _totalTulbur: chargeAmt,
          _totalTulsun: paidAmt,
          _hasEkhniiUldegdel:
            isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0,
          _ekhniiUldegdelAmount: ekhniiUldegdelDelta,
        });
      } else {
        const existing = map.get(key);
        existing._historyCount += 1;
        existing._totalTulbur += chargeAmt;
        existing._totalTulsun += paidAmt;
        if (isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0) {
          existing._hasEkhniiUldegdel = true;
          existing._ekhniiUldegdelAmount =
            (existing._ekhniiUldegdelAmount || 0) + ekhniiUldegdelDelta;
        }
      }
    });
    return Array.from(map.values());
  }, [
    filteredItemsAll,
    buildingHistoryItems,
    contractsByNumber,
    bestKnownBalances,
  ]);

  const sortedResidents = useMemo(() => {
    const result = Array.from(deduplicatedResidents);
    if (!sortField) return result;

    result.sort((a, b) => {
      let aVal: any, bVal: any;

      const getGid = (it: any) =>
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?.gereeId && String(it.gereeId)) ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        "";

      if (sortField === "uldegdel" || sortField === "paid") {
        if (sortField === "paid") {
          const gidA = getGid(a);
          const gidB = getGid(b);
          aVal = gidA ? (paidSummaryByGereeId[gidA] ?? 0) : 0;
          bVal = gidB ? (paidSummaryByGereeId[gidB] ?? 0) : 0;
        } else {
          // Use authoritative balance for sorting
          const gidA = getGid(a);
          const gidB = getGid(b);
          aVal = bestKnownBalances[gidA] ?? Number(a?.uldegdel ?? 0);
          bVal = bestKnownBalances[gidB] ?? Number(b?.uldegdel ?? 0);
        }
      } else if (sortField === "toot") {
        const getTootVal = (it: any) => {
          const rid = it.orshinSuugchId ? String(it.orshinSuugchId) : null;
          const res = rid ? residentsById[rid] : null;
          const resToot =
            Array.isArray(res?.toots) && res.toots.length > 0
              ? res.toots[0]?.toot
              : res?.toot;
          const cid = it.gereeniiId ? String(it.gereeniiId) : null;
          const con = cid
            ? contractsById[cid]
            : it.gereeniiDugaar
              ? contractsByNumber[it.gereeniiDugaar]
              : null;
          return String(
            con?.toot || resToot || it.toot || it.medeelel?.toot || "",
          );
        };
        aVal = getTootVal(a);
        bVal = getTootVal(b);
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : bVal.localeCompare(aVal, undefined, {
              numeric: true,
              sensitivity: "base",
            });
      }

      return sortOrder === "asc"
        ? aVal < bVal
          ? -1
          : 1
        : aVal > bVal
          ? -1
          : 1;
    });

    return result;
  }, [
    deduplicatedResidents,
    sortField,
    sortOrder,
    paidSummaryByGereeId,
    residentsById,
    contractsById,
    contractsByNumber,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedResidents.length / rowsPerPage),
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    return sortedResidents.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortedResidents, page, rowsPerPage]);

  // Helper to resolve gereeId from resident (used for paidSummary lookup)
  const getGereeId = (it: any) =>
    (it?.gereeniiId && String(it.gereeniiId)) ||
    (it?.gereeId && String(it.gereeId)) ||
    (it?.gereeniiDugaar &&
      String(
        (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
      )) ||
    "";

  // Fetch total paid amount (Төлсөн дүн) per geree using /geree/tulsunSummary
  // Fetch for ALL deduplicatedResidentsAll so stats and footer have correct paid data.
  // Limit to 500 to prevent firing too many requests for very large datasets.
  useEffect(() => {
    if (
      !token ||
      !ajiltan?.baiguullagiinId ||
      deduplicatedResidentsAll.length === 0
    )
      return;

    const baiguullagiinId = ajiltan.baiguullagiinId;
    const toFetch = deduplicatedResidentsAll.slice(0, 500);

    toFetch.forEach((it: any) => {
      const gid = getGereeId(it);
      if (!gid) return;

      if (
        paidSummaryByGereeId[gid] !== undefined ||
        requestedGereeIdsRef.current.has(gid)
      ) {
        return;
      }

      requestedGereeIdsRef.current.add(gid);

      uilchilgee(token)
        .post("/tulsunSummary", {
          baiguullagiinId,
          gereeniiId: gid,
        })
        .then((resp) => {
          const total =
            Number(
              resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0,
            ) || 0;
          setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => {
          requestedGereeIdsRef.current.delete(gid);
        });
    });
  }, [
    token,
    ajiltan?.baiguullagiinId,
    deduplicatedResidentsAll,
    contractsByNumber,
  ]);

  // Fetch latest row uldegdel from history ledger API for each contract
  useEffect(() => {
    if (
      !token ||
      !ajiltan?.baiguullagiinId ||
      deduplicatedResidentsAll.length === 0
    ) {
      return;
    }

    const baiguullagiinId = ajiltan.baiguullagiinId;
    const toFetch = deduplicatedResidentsAll.slice(0, 500);

    toFetch.forEach((it: any) => {
      const gid = getGereeId(it);
      if (!gid) return;

      // Only skip if we already have a valid number value or if request is in progress
      const existingValue = latestRowUldegdelByGereeId[gid];
      if (
        (existingValue !== undefined &&
          existingValue !== null &&
          Number.isFinite(existingValue)) ||
        latestRowUldegdelRequestedRef.current.has(gid)
      ) {
        return;
      }

      latestRowUldegdelRequestedRef.current.add(gid);

      uilchilgee(token)
        .get(`/geree/${gid}/history-ledger`, {
          params: {
            baiguullagiinId,
            barilgiinId: effectiveBarilgiinId || null,
            _t: Date.now(),
          },
        })
        .then((resp) => {
          const backendLedger = Array.isArray(resp.data?.jagsaalt)
            ? resp.data.jagsaalt
            : Array.isArray(resp.data?.ledger)
              ? resp.data.ledger
              : Array.isArray(resp.data)
                ? resp.data
                : [];

          // Get latest row's uldegdel (backend returns oldest-first, so last row is latest)
          const latestRow =
            backendLedger.length > 0
              ? backendLedger[backendLedger.length - 1]
              : null;
          const latestUldegdel =
            latestRow?.uldegdel != null &&
            Number.isFinite(Number(latestRow.uldegdel))
              ? Number(latestRow.uldegdel)
              : null;

          setLatestRowUldegdelByGereeId((prev) => ({
            ...prev,
            [gid]: latestUldegdel,
          }));
        })
        .catch(() => {
          latestRowUldegdelRequestedRef.current.delete(gid);
          // Set to null to indicate fetch failed, but allow retry later
          setLatestRowUldegdelByGereeId((prev) => ({ ...prev, [gid]: null }));
        });
    });
  }, [
    token,
    ajiltan?.baiguullagiinId,
    deduplicatedResidentsAll,
    effectiveBarilgiinId,
  ]);

  // Count cancelled gerees with unpaid invoices/zardal
  const cancelledGereesWithUnpaid = useMemo(() => {
    const cancelledGereeIds = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    // Find cancelled gerees
    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    // For each cancelled geree, check if it has unpaid invoices/zardal
    cancelledGerees.forEach((geree: any) => {
      const gereeId = String(geree?._id || "");
      const gereeDugaar = String(geree?.gereeniiDugaar || "");

      // Check if there are unpaid invoices linked to this geree
      const hasUnpaidInvoice = buildingHistoryItems.some((it: any) => {
        const itGereeId = String(it?.gereeniiId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const matchesGeree =
          (gereeId && itGereeId === gereeId) ||
          (gereeDugaar && itGereeDugaar === gereeDugaar);

        if (!matchesGeree) return false;

        // Check if invoice has unpaid amount
        const amount = Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        );
        const isUnpaid = !isPaidLike(it) && amount >= 0.01;

        // Check if invoice has zardal (expenses) that need to be paid
        const hasZardal =
          Array.isArray(it?.medeelel?.zardluud) &&
          it.medeelel.zardluud.length > 0;
        const hasGuilgee =
          Array.isArray(it?.medeelel?.guilgeenuud) &&
          it.medeelel.guilgeenuud.length > 0;

        return isUnpaid && (hasZardal || hasGuilgee || amount >= 0.01);
      });

      if (hasUnpaidInvoice && gereeId) {
        cancelledGereeIds.add(gereeId);
      }
    });

    return cancelledGereeIds.size;
  }, [gereeGaralt?.jagsaalt, buildingHistoryItems]);

  // Stats use deduplicatedResidentsAll so dashboard numbers stay fixed when clicking filters
  const stats = useMemo(() => {
    const residentCount = deduplicatedResidentsAll.length;
    const paidCount = deduplicatedResidentsAll.filter((r: any) => {
      const gid =
        String(r?.gereeniiId ?? r?.gereeId ?? "").trim() ||
        (r?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(r.gereeniiDugaar)]?._id || "",
          )) ||
        "";

      const currentBalance = bestKnownBalances[gid] ?? Number(r?.uldegdel ?? 0);

      // Consistently use the same 0.01 MNT epsilon
      return currentBalance < 0.01;
    }).length;
    const unpaidCount = residentCount - paidCount;

    return [
      { title: "Оршин суугч", value: residentCount },
      { title: "Цуцласан гэрээний авлага", value: cancelledGereesWithUnpaid },
      { title: "Төлсөн", value: paidCount },
      { title: "Төлөөгүй", value: unpaidCount },
    ];
  }, [
    deduplicatedResidentsAll,
    cancelledGereesWithUnpaid,
    paidSummaryByGereeId,
    contractsByNumber,
    latestRowUldegdelByGereeId,
    residentsById,
    bestKnownBalances,
  ]);

  const zaaltTemplateTatak = async () => {
    const loadingToastId = toast.loading("Заалтын загвар файл бэлдэж байна…");
    const hide = () => toast.dismiss(loadingToastId);

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        hide();
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const response = await uilchilgee(token).post(
        "/zaaltExcelTemplateAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        {
          responseType: "blob" as any,
        },
      );

      hide();

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const cd = (response.headers?.["content-disposition"] ||
        response.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_template.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Заалтын загвар амжилттай татагдлаа");
    } catch (err: any) {
      hide();
      openErrorOverlay(getErrorMessage(err));
    }
  };

  const zaaltOruulakh = async () => {
    const loadingToastId = toast.loading("Заалтын Excel файл бэлдэж байна…");
    const hide = () => toast.dismiss(loadingToastId);

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        hide();
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const response = await uilchilgee(token).post(
        "/zaaltExcelDataAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        {
          responseType: "blob" as any,
        },
      );

      hide();

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Try to infer filename from headers or fallback
      const cd = (response.headers?.["content-disposition"] ||
        response.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_data.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Заалтын мэдээлэл амжилттай татагдлаа");
    } catch (err: any) {
      hide();

      // Handle blob error response - when responseType is 'blob', error response may be Blob or ArrayBuffer
      let errorMsg = "Алдаа гарлаа";

      try {
        const responseData = err?.response?.data;

        if (responseData instanceof Blob) {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (responseData instanceof ArrayBuffer) {
          const decoder = new TextDecoder("utf-8");
          const errorText = decoder.decode(responseData);
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (typeof responseData === "string") {
          try {
            const errorJson = JSON.parse(responseData);
            errorMsg =
              errorJson.aldaa ||
              errorJson.message ||
              errorJson.error ||
              errorMsg;
          } catch {
            errorMsg = responseData || errorMsg;
          }
        } else if (responseData && typeof responseData === "object") {
          errorMsg =
            responseData.aldaa ||
            responseData.message ||
            responseData.error ||
            errorMsg;
        } else {
          errorMsg = getErrorMessage(err);
        }
      } catch {
        // If all parsing fails, try getErrorMessage as fallback
        const fallback = getErrorMessage(err);
        if (fallback && fallback !== "Алдаа гарлаа") {
          errorMsg = fallback;
        }
      }

      openErrorOverlay(errorMsg);
    }
  };

  const exceleerTatya = async () => {
    const loadingToastId = toast.loading("Excel файл бэлдэж байна…");
    const hide = () => toast.dismiss(loadingToastId);

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        hide();
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      // Build filters object based on current filters
      const filters: any = {};

      // Date range filter
      if (ekhlekhOgnoo && ekhlekhOgnoo[0] && ekhlekhOgnoo[1]) {
        const startDate = new Date(ekhlekhOgnoo[0]);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(ekhlekhOgnoo[1]);
        endDate.setHours(23, 59, 59, 999);
        filters.createdAt = {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString(),
        };
      }

      // Payment status filter (tuluv)
      if (tuluvFilter !== "all") {
        if (tuluvFilter === "paid") {
          filters.tuluv = "Төлсөн";
        } else if (tuluvFilter === "unpaid") {
          filters.tuluv = "Төлөөгүй";
        } else if (tuluvFilter === "overdue") {
          filters.tuluv = "Хугацаа хэтэрсэн";
        }
      }

      // Building filters (orts, toot, davkhar)
      if (selectedOrtsFilter) {
        filters.orts = selectedOrtsFilter;
      }
      if (selectedTootFilter) {
        filters.toot = selectedTootFilter;
      }
      if (selectedDavkharFilter) {
        filters.davkhar = selectedDavkharFilter;
      }

      // Search term filter
      if (searchTerm && searchTerm.trim()) {
        filters.$or = [
          { ner: { $regex: searchTerm.trim(), $options: "i" } },
          { utas: { $regex: searchTerm.trim(), $options: "i" } },
          { gereeniiDugaar: { $regex: searchTerm.trim(), $options: "i" } },
          { register: { $regex: searchTerm.trim(), $options: "i" } },
        ];
      }

      const body: any = {
        tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt || null,
        baiguullagiinId: ajiltan.baiguullagiinId,
        ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
      };

      const path = "/nekhemjlekhiinTuukhExcelDownload";
      let resp: any;
      try {
        resp = await uilchilgee(token).post(path, body, {
          responseType: "blob" as any,
        });
      } catch (err: any) {
        if (err?.response?.status === 404 && typeof window !== "undefined") {
          resp = await uilchilgee(token).post(
            `${window.location.origin}${path}`,
            body,
            { responseType: "blob" as any, baseURL: undefined as any },
          );
        } else {
          throw err;
        }
      }
      hide();

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      // Try to infer filename from headers or fallback
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = `nekhemjlekhiinTuukh_${new Date().toISOString().split("T")[0]}.xlsx`;
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel файл татагдлаа");
    } catch (err: any) {
      hide();
      console.error(err);

      // Handle blob error response - when responseType is 'blob', error response may be Blob or ArrayBuffer
      let errorMsg = "Excel файл татахад алдаа гарлаа";

      try {
        const responseData = err?.response?.data;

        if (responseData instanceof Blob) {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (responseData instanceof ArrayBuffer) {
          const decoder = new TextDecoder("utf-8");
          const errorText = decoder.decode(responseData);
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (typeof responseData === "string") {
          try {
            const errorJson = JSON.parse(responseData);
            errorMsg =
              errorJson.aldaa ||
              errorJson.message ||
              errorJson.error ||
              errorMsg;
          } catch {
            errorMsg = responseData || errorMsg;
          }
        } else if (responseData && typeof responseData === "object") {
          errorMsg =
            responseData.aldaa ||
            responseData.message ||
            responseData.error ||
            errorMsg;
        } else {
          const parsed = getErrorMessage(err);
          if (parsed && parsed !== "Алдаа гарлаа") {
            errorMsg = parsed;
          }
        }
      } catch {
        // If all parsing fails, try getErrorMessage as fallback
        const fallback = getErrorMessage(err);
        if (fallback && fallback !== "Алдаа гарлаа") {
          errorMsg = fallback;
        }
      }

      openErrorOverlay(errorMsg);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zaaltButtonRef.current &&
        !zaaltButtonRef.current.contains(event.target as Node)
      ) {
        setIsZaaltDropdownOpen(false);
      }
    };

    if (isZaaltDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isZaaltDropdownOpen]);

  // Handle column dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setIsColumnModalOpen(false);
      }
    };

    if (isColumnModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside as any);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside as any);
      };
    }
  }, [isColumnModalOpen]);

  // Excel Import handler
  const handleTransactionSubmit = async (data: TransactionData) => {
    try {
      setIsProcessingTransaction(true);

      if (!token || !ajiltan?.baiguullagiinId) {
        openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      // Only mark as paid when transaction type is "tulult" (Төлөлт)
      // For other types (avlaga, ashiglalt), create a transaction record without marking as paid
      if (data.type === "tulult") {
        // Payment: mark invoices as paid
        const response = await uilchilgee(token).post("/markInvoicesAsPaid", {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          dun: data.amount,
          orshinSuugchId: data.residentId,
          gereeniiId: data.gereeniiId,
          tailbar:
            data.tailbar ||
            (data.ekhniiUldegdel
              ? `Эхний үлдэгдэл - ${data.date}`
              : `Төлөлт - ${data.date}`),
          ognoo: data.date,
          ...(data.ekhniiUldegdel && { markEkhniiUldegdel: true }),
          createdBy: ajiltan._id,
          createdAt: new Date().toISOString(),
        });

        if (response.data.success || response.status === 200) {
          toast.success("Төлөлт амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);

          // Instant UI Update: Clear local caches for this contract so they refetch immediately
          if (data.gereeniiId) {
            const gid = data.gereeniiId;
            requestedGereeIdsRef.current.delete(gid);
            setPaidSummaryByGereeId((prev) => {
              const updated = { ...prev };
              delete (updated as any)[gid];
              return updated;
            });
          }

          // Global Revalidation: Refresh history, contracts, residents, and all receivable datasets
          mutate(
            (key: any) => {
              if (!Array.isArray(key)) return false;
              const prefix = String(key[0] || "");
              return (
                prefix === "/nekhemjlekhiinTuukh" ||
                prefix.startsWith("/nekhemjlekhiinTuukh-") ||
                prefix === "/geree" ||
                prefix === "/orshinSuugch" ||
                prefix === "/gereeniiTulukhAvlaga" ||
                prefix.startsWith("/gereeniiTulukhAvlaga-")
              );
            },
            undefined,
            { revalidate: true },
          );
          setInvoiceRefreshTrigger((t) => t + 1);

          // Refresh the resident object so invoice "Үлдэгдэл" updates instantly
          if (data.residentId) {
            try {
              const res = await uilchilgee(token).get(
                `/orshinSuugch/${data.residentId}`,
                {
                  params: { baiguullagiinId: ajiltan.baiguullagiinId },
                },
              );
              const freshResident = res.data;
              if (freshResident && freshResident._id) {
                setSelectedResident((prev: any) =>
                  prev && String(prev._id) === String(freshResident._id)
                    ? { ...prev, ...freshResident }
                    : prev,
                );
                setSelectedTransactionResident((prev: any) =>
                  prev && String(prev._id) === String(freshResident._id)
                    ? { ...prev, ...freshResident }
                    : prev,
                );
              }
            } catch {
              // best-effort refresh; ignore errors
            }
          }
        }
      } else {
        // Other transaction types (avlaga, ashiglalt): create a transaction record without marking as paid
        const response = await uilchilgee(token).post(
          "/gereeniiGuilgeeKhadgalya",
          {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: effectiveBarilgiinId,
            tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
            turul: data.type,
            tulukhDun: data.amount,
            dun: data.amount,
            orshinSuugchId: data.residentId,
            gereeniiId: data.gereeniiId,
            tailbar:
              data.tailbar ||
              (data.ekhniiUldegdel
                ? `Эхний үлдэгдэл - ${data.date}`
                : `${data.type === "avlaga" ? "Авлага" : data.type === "ashiglalt" ? "Ашиглалт" : data.type} - ${data.date}`),
            ognoo: data.date,
            ...(data.ekhniiUldegdel && { ekhniiUldegdelEsekh: true }), // Only include when checked
            createdBy: ajiltan._id,
            createdAt: new Date().toISOString(),
          },
        );

        if (
          response.data.success ||
          response.status === 200 ||
          response.status === 201
        ) {
          toast.success("Гүйлгээ амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);

          // Instant UI Update: Clear local caches for this contract so they refetch immediately
          if (data.gereeniiId) {
            const gid = data.gereeniiId;
            requestedGereeIdsRef.current.delete(gid);
            setPaidSummaryByGereeId((prev) => {
              const updated = { ...prev };
              delete (updated as any)[gid];
              return updated;
            });
          }

          // Global Revalidation: Refresh history, contracts, residents, and all receivable datasets
          mutate(
            (key: any) => {
              if (!Array.isArray(key)) return false;
              const prefix = String(key[0] || "");
              return (
                prefix === "/nekhemjlekhiinTuukh" ||
                prefix.startsWith("/nekhemjlekhiinTuukh-") ||
                prefix === "/geree" ||
                prefix === "/orshinSuugch" ||
                prefix === "/gereeniiTulukhAvlaga" ||
                prefix.startsWith("/gereeniiTulukhAvlaga-")
              );
            },
            undefined,
            { revalidate: true },
          );
          setInvoiceRefreshTrigger((t) => t + 1);

          // Refresh the resident object so invoice "Үлдэгдэл" updates instantly
          if (data.residentId) {
            try {
              const res = await uilchilgee(token).get(
                `/orshinSuugch/${data.residentId}`,
                {
                  params: { baiguullagiinId: ajiltan.baiguullagiinId },
                },
              );
              const freshResident = res.data;
              if (freshResident && freshResident._id) {
                setSelectedResident((prev: any) =>
                  prev && String(prev._id) === String(freshResident._id)
                    ? { ...prev, ...freshResident }
                    : prev,
                );
                setSelectedTransactionResident((prev: any) =>
                  prev && String(prev._id) === String(freshResident._id)
                    ? { ...prev, ...freshResident }
                    : prev,
                );
              }
            } catch {
              // best-effort refresh; ignore errors
            }
          }
        }
      }
    } catch (error: any) {
      openErrorOverlay(getErrorMessage(error));
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible items that have a valid gereeniiId
      const allIds = paginated
        .map((it: any) => {
          const gid =
            (it?.gereeniiId && String(it.gereeniiId)) ||
            (it?.gereeId && String(it.gereeId)) ||
            (it?.gereeniiDugaar &&
              String(
                (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id ||
                  "",
              ));
          return gid;
        })
        .filter((id) => id && id.length > 5); // Filter out invalid IDs

      // Use Set to ensure uniqueness when adding to existing selection if needed,
      // but "Select All" usually implies "replace selection with all current page" or "add all current page"
      // Let's implement "Add current page to selection" to match Gmail-style behavior if we want multi-page,
      // but Geree logic was "Select all currentContracts".
      // Let's assume user wants to select everything on current page.

      setSelectedGereeIds((prev) => Array.from(new Set([...prev, ...allIds])));
    } else {
      // Deselect all items on current page
      const pageIds = new Set(
        paginated
          .map((it: any) => {
            const gid =
              (it?.gereeniiId && String(it.gereeniiId)) ||
              (it?.gereeId && String(it.gereeId)) ||
              (it?.gereeniiDugaar &&
                String(
                  (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id ||
                    "",
                ));
            return gid;
          })
          .filter((id) => id),
      );

      setSelectedGereeIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleRow = (gereeId: string, checked: boolean) => {
    if (!gereeId) return;
    setSelectedGereeIds((prev) => {
      if (checked) {
        return [...prev, gereeId];
      }
      return prev.filter((id) => id !== gereeId);
    });
  };

  // Manual send invoice handler
  const handleSendInvoices = async () => {
    // Map transaction IDs to actual contract IDs (gereeniiId)
    // selectedGereeIds actually contains transaction/_id values from the table rows
    const mappedGereeIds = allHistoryItems
      .filter((it: any) => selectedGereeIds.includes(it._id))
      .map((it: any) => String(it.gereeniiId || it.gereeId || "").trim())
      .filter(Boolean);

    // Deduplicate to send unique contract IDs
    const uniqueGereeIds = Array.from(new Set(mappedGereeIds));

    if (uniqueGereeIds.length === 0) {
      toast.error("Сонгосон гүйлгээнүүдэд холбогдох гэрээ олдсонгүй!");
      return;
    }

    setIsSendingInvoices(true);
    try {
      await sendInvoicesApi(uniqueGereeIds);
      setSelectedGereeIds([]); // Clear selection on success
      
      // Refresh data
      mutate(
        (key: any) =>
          Array.isArray(key) &&
          (key[0] === "/nekhemjlekhiinTuukh" ||
            key[0] === "/geree" ||
            key[0] === "/orshinSuugch" ||
            key[0] === "/gereeniiTulukhAvlaga"),
        undefined,
        { revalidate: true },
      );
      setInvoiceRefreshTrigger((t) => t + 1);
    } catch (error: any) {
      // Error is handled inside the hook (openErrorOverlay)
    } finally {
      setIsSendingInvoices(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      ".xlsx",
      ".xls",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValidType) {
      toast.error("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let importToastId: string | undefined;
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const form = new FormData();
      form.append("file", file); // Field name must be "file" as expected by backend
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      if (effectiveBarilgiinId) {
        form.append("barilgiinId", effectiveBarilgiinId);
      }
      // Add ognoo (date) field - using current date in YYYY-MM-DD format
      const today = new Date();
      const ognoo = today.toISOString().split("T")[0]; // YYYY-MM-DD format
      form.append("ognoo", ognoo);

      const endpoint = "/zaaltExcelTatya";

      importToastId = toast.loading("Excel импорт хийж байна…");

      const resp: any = await uilchilgee(token).post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (importToastId) toast.dismiss(importToastId);

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map(
          (f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`,
        );
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        toast.success("Excel импорт амжилттай");
        // Refresh the page data without reloading
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            [
              "/nekhemjlekhiinTuukh",
              "/geree",
              "/gereeniiTulukhAvlaga",
              "/gereeniiTulsunAvlaga",
              "/orshinSuugch",
            ].includes(key[0]),
          undefined,
          { revalidate: true },
        );
        // Clear summary states to force re-fetch
        setPaidSummaryByGereeId({});
        requestedGereeIdsRef.current.clear();
        setLatestRowUldegdelByGereeId({});
        latestRowUldegdelRequestedRef.current.clear();
      }
    } catch (err: any) {
      toast.dismiss(importToastId);
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const t = (text: string) => text;

  useEffect(() => {
    const open = isKhungulultOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isKhungulultOpen]);

  // Keyboard: Esc to close, Enter to trigger primary action within modal
  useModalHotkeys({
    isOpen: isKhungulultOpen,
    onClose: () => setIsKhungulultOpen(false),
    container: khungulultRef.current,
  });

  // Handle opening history modal
  const handleOpenHistory = async (resident: any) => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    setHistoryResident(resident);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryIndex(0);
    setHistoryItems([]);
    try {
      const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 2000,
        },
      });
      const data = resp.data;
      let list = Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data)
          ? data
          : [];

      // Extract identifiers from the resident object
      const residentId = String(
        resident?._id || resident?.orshinSuugchId || "",
      ).trim();
      const residentGereeId = String(resident?.gereeniiId || "").trim();
      const residentGereeDugaar = String(resident?.gereeniiDugaar || "").trim();
      // Get toot from toots array first, then fallback to top-level
      const residentToot = String(
        (Array.isArray(resident?.toots) && resident.toots.length > 0
          ? resident.toots[0]?.toot
          : null) ??
          resident?.toot ??
          "",
      ).trim();
      const residentNer = String(resident?.ner || "")
        .trim()
        .toLowerCase();
      const residentOvog = String(resident?.ovog || "")
        .trim()
        .toLowerCase();
      const residentUtas = Array.isArray(resident?.utas)
        ? String(resident.utas[0] || "").trim()
        : String(resident?.utas || "").trim();

      // Filter using multiple matching strategies
      const residentInvoices = list.filter((item: any) => {
        // Strategy 1: Match by orshinSuugchId
        if (
          residentId &&
          String(item?.orshinSuugchId || "").trim() === residentId
        ) {
          return true;
        }

        // Strategy 2: Match by gereeniiId
        if (
          residentGereeId &&
          String(item?.gereeniiId || "").trim() === residentGereeId
        ) {
          return true;
        }

        // Strategy 3: Match by gereeniiDugaar
        if (
          residentGereeDugaar &&
          String(item?.gereeniiDugaar || "").trim() === residentGereeDugaar
        ) {
          return true;
        }

        // Strategy 4: Match by toot + ner (if both exist)
        if (residentToot && residentNer) {
          const itemToot = String(
            item?.toot || item?.medeelel?.toot || "",
          ).trim();
          const itemNer = String(item?.ner || "")
            .trim()
            .toLowerCase();
          if (itemToot === residentToot && itemNer === residentNer) {
            return true;
          }
        }

        // Strategy 5: Match by phone number
        if (residentUtas && residentUtas.length >= 8) {
          const itemUtas = Array.isArray(item?.utas)
            ? String(item.utas[0] || "").trim()
            : String(item?.utas || "").trim();
          if (itemUtas === residentUtas) {
            return true;
          }
        }

        // Strategy 6: Match by ovog + ner combination
        if (residentOvog && residentNer) {
          const itemOvog = String(item?.ovog || "")
            .trim()
            .toLowerCase();
          const itemNer = String(item?.ner || "")
            .trim()
            .toLowerCase();
          if (itemOvog === residentOvog && itemNer === residentNer) {
            return true;
          }
        }

        return false;
      });

      console.log("📜 History filter result:", {
        resident: {
          id: residentId,
          gereeId: residentGereeId,
          gereeDugaar: residentGereeDugaar,
          toot: residentToot,
          ner: residentNer,
        },
        totalItems: list.length,
        matchedItems: residentInvoices.length,
      });

      setHistoryItems(residentInvoices);
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch lift floors
  useEffect(() => {
    const fetchLiftFloors = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await uilchilgee(token).get("/liftShalgaya", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
          },
        });
        const data = resp.data;
        const list = Array.isArray(data?.jagsaalt) ? data.jagsaalt : [];
        const toStr = (v: any) => (v == null ? "" : String(v));
        const branchMatches = barilgiinId
          ? list.filter(
              (x: any) => toStr(x?.barilgiinId) === toStr(barilgiinId),
            )
          : [];
        const pickLatest = (arr: any[]) =>
          [...arr].sort(
            (a, b) =>
              new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
              new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
          )[0];
        let chosen =
          branchMatches.length > 0 ? pickLatest(branchMatches) : null;
        if (!chosen) {
          const orgDefaults = list.filter(
            (x: any) => x?.barilgiinId == null || toStr(x.barilgiinId) === "",
          );
          chosen =
            orgDefaults.length > 0 ? pickLatest(orgDefaults) : pickLatest(list);
        }
        const floors: string[] = Array.isArray(chosen?.choloolugdokhDavkhar)
          ? chosen.choloolugdokhDavkhar.map((f: any) => String(f))
          : [];
        setLiftFloors(floors);
      } catch {}
    };
    fetchLiftFloors();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId, selectedBuildingId]);

  // Handle modal body overflow
  useEffect(() => {
    document.body.style.overflow = isModalOpen || isHistoryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isHistoryOpen]);

  // Modal keyboard shortcuts for history modal
  useModalHotkeys({
    isOpen: isHistoryOpen,
    onClose: () => setIsHistoryOpen(false),
    container: historyRef.current,
  });

  // Register guided tour for /tulbur/guilgeeTuukh
  const tourSteps = useMemo<DriverStep[]>(
    () => [
      {
        element: "#guilgee-status-filter",
        popover: {
          title: "Төлөвийн шүүлтүүр",
          description:
            "Төлсөн, Төлөөгүй эсвэл Хугацаа хэтэрсэн гэх мэт төлөвөөр ялгана.",
        },
      },
      {
        element: "#guilgee-nekhemjlekh-btn",
        popover: {
          title: "Нэхэмжлэх",
          description: "Энд дарж нэхэмжлэхийн цонх нээнэ.",
        },
      },
      {
        element: "#guilgee-excel-btn",
        popover: {
          title: "Excel татах",
          description: "Жагсаалтыг Excel файл хэлбэрээр татна.",
        },
      },
      {
        element: "#guilgee-table",
        popover: {
          title: "Жагсаалт",
          description: "Гүйлгээний түүх энд харагдана.",
        },
      },
      {
        element: "#guilgee-pagination",
        popover: {
          title: "Хуудаслалт",
          description: "Эндээс хуудсуудын хооронд шилжинэ.",
        },
      },
    ],
    [],
  );
  useRegisterTourSteps("/tulbur/guilgeeTuukh", tourSteps);

  return (
    <div className="flex flex-col pb-14">
      {/* <div className="flex items-center gap-3 mb-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl  text-theme bg-clip-text text-transparent drop-shadow-sm"
        >
          Гүйлгээний түүх
        </motion.h1>
        <div style={{ width: 44, height: 44 }} className="flex items-center">
          <DotLottieReact
            src="https://lottie.host/740ab27b-f4f0-49c5-a202-a23a70cd8e50/eNy8Ct6t4y.lottie"
            loop
            autoplay
            style={{ width: 44, height: 44 }}
          />
        </div>
      </div> */}

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            // Map stat titles to filter values
            const getFilterValue = (
              title: string,
            ): "all" | "paid" | "unpaid" | "overdue" | null => {
              if (title === "Оршин суугч" || title === "Нийт гүйлгээ")
                return "all";
              if (title === "Төлсөн") return "paid";
              if (title === "Төлөөгүй") return "unpaid";
              if (title === "Цуцласан гэрээний авлага") return "overdue";
              return null;
            };

            const filterValue = getFilterValue(stat.title);
            const isActive = filterValue && tuluvFilter === filterValue;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (filterValue) {
                    setTuluvFilter(filterValue);
                  }
                }}
                className={`relative group rounded-2xl neu-panel transition-all cursor-pointer ${
                  isActive
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:bg-[color:var(--surface-hover)] hover:scale-105"
                }`}
              >
                <div className="relative rounded-2xl p-5 overflow-hidden">
                  <div className="text-3xl  mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
                    {stat.value}
                  </div>
                  <div className="text-xs text-theme leading-tight">
                    {stat.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div
                id="dans-date"
                className="btn-minimal h-[40px] w-[320px] flex items-center px-3"
              >
                <StandardDatePicker
                  isRange={true}
                  value={ekhlekhOgnoo}
                  onChange={setEkhlekhOgnoo}
                  size="small"
                  allowClear
                  placeholder="Огноо сонгох"
                  classNames={{
                    root: "!h-full !w-full",
                    input:
                      "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {/* Орц filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Орц:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="text"
                      value={selectedOrtsFilter}
                      onChange={(e) => setSelectedOrtsFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Тоот:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="text"
                      value={selectedTootFilter}
                      onChange={(e) => setSelectedTootFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>

                {/* Давхар filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Давхар:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="number"
                      min={1}
                      value={selectedDavkharFilter}
                      onChange={(e) => setSelectedDavkharFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div ref={zaaltButtonRef} className="relative">
                <Tooltip title="Заалт">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsZaaltDropdownOpen(!isZaaltDropdownOpen)}
                    className="btn-minimal inline-flex items-center gap-1 h-[40px] px-2"
                    id="zaalt-btn"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden">Заалт</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isZaaltDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                </Tooltip>

                {isZaaltDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Excel импорт</span>
                    </button>
                    <button
                      onClick={() => {
                        zaaltTemplateTatak();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Заалт татах</span>
                    </button>
                    <button
                      onClick={() => {
                        zaaltOruulakh();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Заалт жагсаалт авах</span>
                    </button>
                  </div>
                )}
              </div>
              <Tooltip title="Эхний үлдэгдэл">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={() => setIsInitialBalanceModalOpen(true)}
                    icon={<Upload className="w-5 h-5" />}
                    label="Эхний үлдэгдэл"
                    className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                  />
                </motion.div>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleExcelImport}
                className="hidden"
              />
              <Tooltip title={t("Excel татах")}>
                <motion.div
                  id="guilgee-excel-btn"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={exceleerTatya}
                    icon={<Download className="w-5 h-5" />}
                    label={t("Excel татах")}
                    className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                  />
                </motion.div>
              </Tooltip>
              <div
                className="relative flex items-center gap-2"
                ref={columnDropdownRef}
              >
                <Tooltip title="Багана">
                  <motion.div
                    id="guilgee-columns-btn"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconTextButton
                      onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
                      icon={<Columns className="w-5 h-5" />}
                      label="Багана"
                      className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                    />
                  </motion.div>
                </Tooltip>

                {isColumnModalOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] menu-surface rounded-xl shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                    <div className="px-3 py-2 border-b border-white/10 text-sm font-medium text-theme/80">
                      Багана сонгох
                    </div>
                    {selectableColumnDefs.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col.key] !== false}
                          onChange={(e) => {
                            setColumnVisibility((prev) => ({
                              ...prev,
                              [col.key]: e.target.checked,
                            }));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-theme">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Tooltip title="Нэхэмжлэх илгээх">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={handleSendInvoices}
                    icon={isSendingInvoices ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Send className="w-5 h-5" />}
                    label="Нэхэмжлэх илгээх"
                    disabled={isSendingInvoices || selectedGereeIds.length === 0}
                    className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                  />
                </motion.div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Ant Design Table */}
        <div className="w-full">
          <div className="w-full" id="guilgee-table">
            <GuilgeeTable
              data={paginated}
              loading={isLoadingHistory}
              visibleColumns={visibleColumns}
              selectedGereeIds={selectedGereeIds}
              onSelectionChange={setSelectedGereeIds}
              contractsById={contractsById}
              contractsByNumber={contractsByNumber}
              residentsById={residentsById}
              paidSummaryByGereeId={paidSummaryByGereeId}
              bestKnownBalances={bestKnownBalances}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={(field: string | null, order: "asc" | "desc") => {
                setSortField(field);
                setSortOrder(order);
              }}
              page={page}
              rowsPerPage={rowsPerPage}
              deduplicatedResidents={deduplicatedResidents}
              getGereeId={getGereeId}
              maxHeight="calc(100vh - 550px)"
              onViewInvoice={(residentData: any) => {
                setSelectedResident(residentData);
                setIsModalOpen(true);
              }}
              onViewHistory={(residentData: any) => {
                setHistoryResident(residentData);
                setIsHistoryOpen(true);
              }}
              onTransaction={(residentData: any, remainingValue: number) => {
                setSelectedTransactionResident({
                  ...residentData,
                  uldegdel: remainingValue,
                });
                setIsTransactionModalOpen(true);
              }}
            />
          </div>
          <div className="w-full flex flex-row items-center justify-between px-6 py-3 gap-3 text-sm mt-4 ">
            <div className="text-theme/70 text-xs whitespace-nowrap">
              Нийт: {deduplicatedResidents.length}
            </div>

            <div className="flex items-center gap-3">
              <span id="guilgee-page-size">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setPage(1);
                  }}
                  className="text-sm px-2 py-1"
                />
              </span>

              <div id="guilgee-pagination" className="flex items-center gap-1">
                <button
                  className="!w-6 !h-6 !min-w-0 !p-0 !flex !items-center !justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  title="Өмнөх"
                >
                  <span className="text-[10px]">&lt;</span>
                </button>
                <div className="text-theme/70 px-1 text-[11px] font-medium">{page}</div>
                <button
                  className="!w-6 !h-6 !min-w-0 !p-0 !flex !items-center !justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  disabled={page * rowsPerPage >= deduplicatedResidents.length}
                  onClick={() => setPage(page + 1)}
                  title="Дараах"
                >
                  <span className="text-[10px]">&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isKhungulultOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
              onClick={() => setIsKhungulultOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] rounded-3xl overflow-hidden shadow-2xl modal-surface modal-responsive"
              onClick={(e) => e.stopPropagation()}
              ref={khungulultRef}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className=""></div>
                <Button
                  onClick={() => setIsKhungulultOpen(false)}
                  variant="secondary"
                  className="px-6 py-2"
                >
                  Хаах
                </Button>
              </div>
              {/* <div className="p-2 overflow-auto max-h-[calc(90vh-48px)] ">
                <KhungulultPage />
              </div> */}
            </motion.div>
          </>
        </ModalPortal>
      )}

      {/* Invoice Modal */}
      {isModalOpen && selectedResident && (
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedResident(null);
          }}
          resident={selectedResident}
          baiguullagiinId={ajiltan?.baiguullagiinId || ""}
          token={token || ""}
          liftFloors={liftFloors}
          barilgiinId={selectedBuildingId || barilgiinId || null}
          refreshTrigger={invoiceRefreshTrigger}
        />
      )}

      {/* History Modal - Using Premium HistoryModal Component */}
      <HistoryModal
        show={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        contract={historyResident}
        token={token}
        baiguullagiinId={ajiltan?.baiguullagiinId ?? null}
        barilgiinId={selectedBuildingId || barilgiinId || null}
        onRefresh={() => {
          // Clear cache and revalidate all relevant data
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulsunAvlaga",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulukhAvlaga",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/geree",
            undefined,
            { revalidate: true },
          );

          // Clear payment summary state to force re-fetch
          setPaidSummaryByGereeId({});
          requestedGereeIdsRef.current.clear();
          setLatestRowUldegdelByGereeId({});
          latestRowUldegdelRequestedRef.current.clear();
          setInvoiceRefreshTrigger((t) => t + 1);
        }}
      />

      {/* Per-resident history modal removed */}

      {/* Transaction Modal */}
      <TransactionModal
        show={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);
        }}
        resident={selectedTransactionResident}
        onSubmit={handleTransactionSubmit}
        isProcessing={isProcessingTransaction}
        token={token ?? undefined}
        baiguullagiinId={ajiltan?.baiguullagiinId}
        barilgiinId={effectiveBarilgiinId ?? undefined}
      />

      {/* Initial Balance Excel Import Modal */}
      <InitialBalanceExcelModal
        show={isInitialBalanceModalOpen}
        onClose={() => setIsInitialBalanceModalOpen(false)}
        baiguullagiinId={ajiltan?.baiguullagiinId || ""}
        barilgiinId={selectedBuildingId || barilgiinId || undefined}
        onSuccess={() => {
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/geree",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulukhAvlaga",
            undefined,
            { revalidate: true },
          );
          // Clear payment summary state to force re-fetch
          setPaidSummaryByGereeId({});
          requestedGereeIdsRef.current.clear();
          setLatestRowUldegdelByGereeId({});
          latestRowUldegdelRequestedRef.current.clear();
        }}
      />
    </div>
  );
}
