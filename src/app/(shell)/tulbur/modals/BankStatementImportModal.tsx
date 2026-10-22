"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Ban,
  Search,
  Check,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import formatNumber from "../../../../../tools/function/formatNumber";

export type MatchedGeree = {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  toot: string;
  ovog?: string;
  ner: string;
  utas?: string[];
  orshinSuugchId?: string;
  barilgiinId?: string;
};

export type PreviewRow = {
  rowNumber: number;
  date: string;
  time: string;
  journal: string;
  branch: string;
  description: string;
  orlogo: number;
  zarlaga: number;
  amount: number;
  balance: number;
  relatedAccount: string;
  accName: string;
  bank: string;
  detectedBair: string;
  detectedToot: string;
  detectedName: string;
  isAldangi: boolean;
  status: "EXACT" | "MULTI" | "UNMATCHED" | "ALREADY_IMPORTED" | "SKIP";
  action: "IMPORT_AND_PAY" | "IMPORT_ONLY" | "SKIP";
  matchReason: string;
  matchedGeree: MatchedGeree | null;
  candidateGerees?: MatchedGeree[];
};

export type PreviewSummary = {
  totalRows: number;
  exactCount: number;
  multiCount: number;
  unmatchedCount: number;
  alreadyImportedCount: number;
  skipCount: number;
  totalIncome: number;
  totalExpense: number;
  payableAmount: number;
};

interface BankStatementImportModalProps {
  show: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  onSuccess: () => void;
}

export default function BankStatementImportModal({
  show,
  onClose,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
}: BankStatementImportModalProps) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  // Search & Filters
  const [activeTab, setActiveTab] = useState<
    "ALL" | "EXACT" | "MULTI" | "UNMATCHED" | "SKIP" | "ALREADY_IMPORTED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Date filters: selected month and specific day
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedDay, setSelectedDay] = useState<string>("");

  useModalHotkeys({
    isOpen: show,
    onClose,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    await loadPreview(selectedFile);
  };

  const loadPreview = async (targetFile: File) => {
    try {
      setLoadingPreview(true);
      const formData = new FormData();
      formData.append("excel", targetFile);
      formData.append("baiguullagiinId", baiguullagiinId);
      if (barilgiinId) formData.append("barilgiinId", barilgiinId);

      const resp = await uilchilgee(token || "").post(
        "/bankniiGuilgee/excelPreview",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (resp.data?.success) {
        setSummary(resp.data.summary);
        const parsedRows: PreviewRow[] = resp.data.rows || [];
        setRows(parsedRows);

        // Calculate available months from rows
        const monthsFound = new Set<string>();
        parsedRows.forEach((r) => {
          const m = (r.date || "").replace(/-/g, ".").substring(0, 7);
          if (/^\d{4}\.\d{2}$/.test(m)) monthsFound.add(m);
        });
        const sortedMonths = Array.from(monthsFound).sort().reverse();

        // Default to October (2026.10) if present in the data, or current month, or latest month
        const now = new Date();
        const curM = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
        const defaultM = sortedMonths.includes("2026.10")
          ? "2026.10"
          : sortedMonths.includes(curM)
          ? curM
          : sortedMonths[0] || "ALL";

        setSelectedMonth(defaultM);
        setSelectedDay("");

        // Pre-select rows that are EXACT or MULTI for import in that default month
        const autoSelected = new Set<number>();
        parsedRows.forEach((r) => {
          const rMonth = (r.date || "").replace(/-/g, ".").substring(0, 7);
          const inDefault = defaultM === "ALL" || rMonth === defaultM;
          if (
            inDefault &&
            (r.status === "EXACT" || r.status === "MULTI") &&
            r.action === "IMPORT_AND_PAY"
          ) {
            autoSelected.add(r.rowNumber);
          }
        });
        setSelectedRowIds(autoSelected);

        toast.success(
          `Хуулга уншигдлаа: ${parsedRows.length} мөрөөс ${resp.data.summary?.exactCount} гүйлгээ автоматаар таарлаа.`
        );
      } else {
        toast.error(resp.data?.aldaa || resp.data?.message || "Файл задлахад алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Preview error:", err);
      toast.error(
        err.response?.data?.aldaa ||
          err.response?.data?.message ||
          err.message ||
          "Серверт алдаа гарлаа"
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  // Available unique months sorted descending (e.g. 2026.10, 2026.09, ...)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const m = (r.date || "").replace(/-/g, ".").substring(0, 7);
      if (/^\d{4}\.\d{2}$/.test(m)) set.add(m);
    });
    return Array.from(set).sort().reverse();
  }, [rows]);

  // Format month to readable label: e.g. "2026 он - 10-р сар"
  const formatMonthLabel = (m: string) => {
    if (m === "ALL") return "Бүх сарууд";
    const [year, month] = m.split(".");
    const mNum = parseInt(month, 10);
    return `${year} он - ${mNum}-р сар`;
  };

  // Determine min and max date from rows for date picker range
  const { minDate, maxDate } = useMemo(() => {
    if (rows.length === 0) return { minDate: undefined, maxDate: undefined };
    let min = "9999-99-99";
    let max = "0000-00-00";
    rows.forEach((r) => {
      const d = (r.date || "").replace(/\./g, "-").substring(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        if (d < min) min = d;
        if (d > max) max = d;
      }
    });
    return {
      minDate: min !== "9999-99-99" ? min : undefined,
      maxDate: max !== "0000-00-00" ? max : undefined,
    };
  }, [rows]);

  // Handle month selection change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setSelectedDay("");

    // Automatically update selections for the newly active month
    const newSelected = new Set<number>();
    rows.forEach((r) => {
      const rMonth = (r.date || "").replace(/-/g, ".").substring(0, 7);
      const inMonth = newMonth === "ALL" || rMonth === newMonth;
      if (
        inMonth &&
        (r.status === "EXACT" || r.status === "MULTI") &&
        r.action === "IMPORT_AND_PAY"
      ) {
        newSelected.add(r.rowNumber);
      }
    });
    setSelectedRowIds(newSelected);
  };

  // Handle specific day selection change
  const handleDayChange = (newDay: string) => {
    setSelectedDay(newDay);
    if (newDay) {
      const m = newDay.substring(0, 7).replace(/-/g, ".");
      if (availableMonths.includes(m)) {
        setSelectedMonth(m);
      }
      const selDayNorm = newDay.replace(/\./g, "-");
      const newSelected = new Set<number>();
      rows.forEach((r) => {
        const rDateNorm = (r.date || "").replace(/\./g, "-");
        if (
          rDateNorm.startsWith(selDayNorm) &&
          (r.status === "EXACT" || r.status === "MULTI") &&
          r.action === "IMPORT_AND_PAY"
        ) {
          newSelected.add(r.rowNumber);
        }
      });
      setSelectedRowIds(newSelected);
    } else {
      // If cleared, revert selections to the currently selected month
      const newSelected = new Set<number>();
      rows.forEach((r) => {
        const rMonth = (r.date || "").replace(/-/g, ".").substring(0, 7);
        const inMonth = selectedMonth === "ALL" || rMonth === selectedMonth;
        if (
          inMonth &&
          (r.status === "EXACT" || r.status === "MULTI") &&
          r.action === "IMPORT_AND_PAY"
        ) {
          newSelected.add(r.rowNumber);
        }
      });
      setSelectedRowIds(newSelected);
    }
  };

  const toggleSelectRow = (rowNumber: number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleRowNumbers = filteredRows.map((r) => r.rowNumber);
    const allSelected = visibleRowNumbers.every((num) => selectedRowIds.has(num));

    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleRowNumbers.forEach((num) => next.delete(num));
      } else {
        visibleRowNumbers.forEach((num) => {
          const row = rows.find((r) => r.rowNumber === num);
          if (row && row.status !== "ALREADY_IMPORTED" && row.status !== "SKIP") {
            next.add(num);
          }
        });
      }
      return next;
    });
  };

  const handleContractChange = (rowNumber: number, contractId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const chosen = r.candidateGerees?.find((c) => String(c._id) === contractId);
        return {
          ...r,
          matchedGeree: chosen || r.matchedGeree,
          status: chosen ? "EXACT" : r.status,
          action: chosen ? "IMPORT_AND_PAY" : r.action,
        };
      })
    );
  };

  // Rows filtered by Date (Month & Day)
  const dateFilteredRows = useMemo(() => {
    return rows.filter((r) => {
      // If a specific day is selected (e.g. 2026-10-21)
      if (selectedDay) {
        const rowDateNorm = (r.date || "").replace(/\./g, "-");
        const selDayNorm = selectedDay.replace(/\./g, "-");
        if (!rowDateNorm.startsWith(selDayNorm)) return false;
      } else if (selectedMonth && selectedMonth !== "ALL") {
        // If a month is selected (e.g. 2026.10)
        const rowMonthNorm = (r.date || "").replace(/-/g, ".").substring(0, 7);
        const selMonthNorm = selectedMonth.replace(/-/g, ".").substring(0, 7);
        if (rowMonthNorm !== selMonthNorm) return false;
      }
      return true;
    });
  }, [rows, selectedMonth, selectedDay]);

  // Statistics for the currently selected Date / Month
  const currentViewStats = useMemo(() => {
    let exactCount = 0;
    let multiCount = 0;
    let unmatchedCount = 0;
    let alreadyImportedCount = 0;
    let skipCount = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    dateFilteredRows.forEach((r) => {
      if (r.status === "EXACT") exactCount++;
      else if (r.status === "MULTI") multiCount++;
      else if (r.status === "UNMATCHED") unmatchedCount++;
      else if (r.status === "ALREADY_IMPORTED") alreadyImportedCount++;
      else if (r.status === "SKIP") skipCount++;

      if (r.orlogo > 0) totalIncome += r.orlogo;
      if (r.zarlaga > 0) totalExpense += r.zarlaga;
    });

    return {
      totalRows: dateFilteredRows.length,
      exactCount,
      multiCount,
      unmatchedCount,
      alreadyImportedCount,
      skipCount,
      totalIncome,
      totalExpense,
    };
  }, [dateFilteredRows]);

  // Rows after Tab + Search filters
  const filteredRows = useMemo(() => {
    return dateFilteredRows.filter((r) => {
      // Tab filter
      if (activeTab === "EXACT" && r.status !== "EXACT") return false;
      if (activeTab === "MULTI" && r.status !== "MULTI") return false;
      if (activeTab === "UNMATCHED" && r.status !== "UNMATCHED") return false;
      if (activeTab === "SKIP" && r.status !== "SKIP") return false;
      if (activeTab === "ALREADY_IMPORTED" && r.status !== "ALREADY_IMPORTED")
        return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tootMatch = (r.detectedToot || "").includes(q);
        const bairMatch = (r.detectedBair || "").includes(q);
        const descMatch = (r.description || "").toLowerCase().includes(q);
        const nameMatch = (r.accName || "").toLowerCase().includes(q);
        const matchedName = (r.matchedGeree?.ner || "").toLowerCase().includes(q);
        const journalMatch = (r.journal || "").includes(q);
        const amountMatch = String(r.amount).includes(q);

        if (
          !tootMatch &&
          !bairMatch &&
          !descMatch &&
          !nameMatch &&
          !matchedName &&
          !journalMatch &&
          !amountMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilteredRows, activeTab, searchQuery]);

  // Selected Amount Total
  const selectedTotalAmount = useMemo(() => {
    return rows
      .filter((r) => selectedRowIds.has(r.rowNumber))
      .reduce((sum, r) => sum + (r.orlogo || r.amount || 0), 0);
  }, [rows, selectedRowIds]);

  const handleConfirmImport = async () => {
    const selectedRows = rows.filter((r) => selectedRowIds.has(r.rowNumber));
    if (selectedRows.length === 0) {
      toast.error("Импортлох гүйлгээ сонгогдоогүй байна");
      return;
    }

    try {
      setSubmitting(true);
      const payloadRows = selectedRows.map((r) => ({
        journal: r.journal,
        date: r.date,
        time: r.time,
        description: r.description,
        orlogo: r.orlogo,
        zarlaga: r.zarlaga,
        amount: r.amount,
        relatedAccount: r.relatedAccount,
        accName: r.accName,
        bank: r.bank,
        matchedGereeId: r.matchedGeree?._id,
        detectedToot: r.detectedToot || r.matchedGeree?.toot,
        isAldangi: r.isAldangi,
        action: r.matchedGeree ? "IMPORT_AND_PAY" : "IMPORT_ONLY",
      }));

      const resp = await uilchilgee(token || "").post(
        "/bankniiGuilgee/excelConfirmImport",
        {
          baiguullagiinId,
          barilgiinId,
          rows: payloadRows,
        }
      );

      if (resp.data?.success) {
        toast.success(resp.data.message || "Гүйлгээ амжилттай бүртгэгдлээ!");
        onSuccess();
        onClose();
      } else {
        toast.error(resp.data?.aldaa || resp.data?.message || "Бүртгэхэд алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Confirm import error:", err);
      toast.error(
        err.response?.data?.aldaa ||
          err.response?.data?.message ||
          err.message ||
          "Алдаа гарлаа"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        {show && (
          <div
            ref={constraintsRef}
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="relative z-[12001] flex flex-col w-[min(1240px,96vw)] max-h-[92vh] rounded-[28px] bg-[color:var(--surface-bg,#ffffff)] text-[color:var(--panel-text,#1f2937)] shadow-2xl border border-[color:var(--surface-border,#e5e7eb)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--surface-border,#e5e7eb)] bg-theme/5 cursor-move select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-theme/15 text-theme">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-[color:var(--panel-text)]">
                      Дансны хуулга оруулах & Оршин суугчтай тулгах
                    </h2>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      И-Баримт болон банкны хуулгыг автоматаар уншиж, оршин суугчийн төлөлтөөр дэвтэрт бүртгэнэ
                    </p>
                  </div>
                </div>
                <Button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  variant="ghost"
                  className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                >
                  <X className="w-5 h-5 text-[color:var(--muted-text)]" />
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
                {!summary ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[350px] border-2 border-dashed border-[color:var(--surface-border,#d1d5db)] rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-theme hover:bg-theme/5 transition group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="h-16 w-16 rounded-2xl bg-theme/15 text-theme flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                      {loadingPreview ? (
                        <RefreshCw className="h-8 w-8 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8" />
                      )}
                    </div>
                    <h3 className="text-sm font-medium mb-1">
                      {loadingPreview
                        ? "Хуулгыг уншиж байна..."
                        : "Банкны Excel хуулга файлаа сонгоно уу"}
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)] max-w-md text-center">
                      .xlsx эсвэл .xls хуулга (United e-bill болон бүх банкны хуулга шууд дэмжигдэнэ)
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary Stats Cards (Updates based on selected Date / Month) */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
                      <div
                        onClick={() => setActiveTab("ALL")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "ALL"
                            ? "border-theme bg-theme/10"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-theme/40"
                        }`}
                      >
                        <div className="text-[11px] text-[color:var(--muted-text)] font-medium">Нийт гүйлгээ</div>
                        <div className="text-lg font-bold mt-0.5">{currentViewStats.totalRows}</div>
                        <div className="text-[10px] text-[color:var(--muted-text)] mt-0.5">
                          {formatNumber(currentViewStats.totalIncome)}₮
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("EXACT")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "EXACT"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Таарсан
                        </div>
                        <div className="text-lg font-bold mt-0.5 text-emerald-600">
                          {currentViewStats.exactCount}
                        </div>
                        <div className="text-[10px] text-emerald-600/70 mt-0.5">
                          Шууд бүртгэхэд бэлэн
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("MULTI")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "MULTI"
                            ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Олон гэрээтэй
                        </div>
                        <div className="text-lg font-bold mt-0.5 text-amber-600">
                          {currentViewStats.multiCount}
                        </div>
                        <div className="text-[10px] text-amber-600/70 mt-0.5">
                          Сонголт хийх
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("UNMATCHED")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "UNMATCHED"
                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                          <HelpCircle className="h-3.5 w-3.5" />
                          Таараагүй
                        </div>
                        <div className="text-lg font-bold mt-0.5 text-rose-600">
                          {currentViewStats.unmatchedCount}
                        </div>
                        <div className="text-[10px] text-rose-600/70 mt-0.5">
                          Тоот тодорхойгүй
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("ALREADY_IMPORTED")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "ALREADY_IMPORTED"
                            ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-cyan-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] text-cyan-600 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          Өмнө нь орсон
                        </div>
                        <div className="text-lg font-bold mt-0.5 text-cyan-600">
                          {currentViewStats.alreadyImportedCount}
                        </div>
                        <div className="text-[10px] text-cyan-600/70 mt-0.5">
                          Давхардахгүй
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("SKIP")}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          activeTab === "SKIP"
                            ? "border-gray-500 bg-gray-100 dark:bg-gray-800"
                            : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] text-[color:var(--muted-text)] font-medium">
                          <Ban className="h-3.5 w-3.5" />
                          Шимтгэл / Зарлага
                        </div>
                        <div className="text-lg font-bold mt-0.5">{currentViewStats.skipCount}</div>
                        <div className="text-[10px] text-[color:var(--muted-text)] mt-0.5">
                          Алгасах
                        </div>
                      </div>
                    </div>

                    {/* Filter & Date Picker Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      {/* Left: Search input + Select visible button */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Тоот, нэр, утга, дүн, журнал..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs focus:outline-none focus:ring-2 focus:ring-theme/30"
                          />
                        </div>

                        <button
                          onClick={toggleSelectAllVisible}
                          className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-[color:var(--surface-border)] hover:bg-theme/5 text-xs font-medium transition shrink-0"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Харагдаж буйг сонгох ({filteredRows.length})
                        </button>
                      </div>

                      {/* Right: Date Filters (Month + Specific Day) + Change File */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Month Selector */}
                        <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs font-medium shadow-sm hover:border-theme/40 transition">
                          <Calendar className="h-3.5 w-3.5 text-theme shrink-0" />
                          <select
                            value={selectedMonth}
                            onChange={(e) => handleMonthChange(e.target.value)}
                            className="bg-transparent border-none text-xs font-semibold text-[color:var(--panel-text)] focus:outline-none cursor-pointer pr-1"
                          >
                            <option value="ALL">Бүх сарууд</option>
                            {availableMonths.map((m) => (
                              <option key={m} value={m}>
                                {formatMonthLabel(m)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Specific Day Picker */}
                        <div className="relative flex items-center">
                          <input
                            type="date"
                            value={selectedDay}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => handleDayChange(e.target.value)}
                            title="Тодорхой нэг өдрөөр нарийвчлан шүүх"
                            className="h-9 px-3 pr-8 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs font-medium text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-theme/30 cursor-pointer shadow-sm"
                          />
                          {selectedDay ? (
                            <button
                              onClick={() => handleDayChange("")}
                              title="Өдрийн шүүлтийг арилгах"
                              className="absolute right-2.5 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>

                        {/* File Replace */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-[color:var(--surface-border)] hover:bg-theme/5 text-xs text-[color:var(--panel-text)] font-medium transition shrink-0"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Өөр файл
                        </button>
                      </div>
                    </div>

                    {/* Active Filter Indicator Badge */}
                    <div className="flex items-center justify-between px-1 text-xs text-[color:var(--muted-text)] font-medium">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-theme/10 text-theme font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          {selectedDay
                            ? `${selectedDay} өдрийн гүйлгээ`
                            : selectedMonth !== "ALL"
                            ? `${formatMonthLabel(selectedMonth)}ын гүйлгээ`
                            : "Бүх хугацааны гүйлгээ"}
                        </span>
                        <span>Харагдаж буй: <strong className="text-[color:var(--panel-text)]">{filteredRows.length}</strong> гүйлгээ</span>
                      </div>
                      {selectedRowIds.size > 0 && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Импортлохоор сонгосон: {selectedRowIds.size} гүйлгээ ({formatNumber(selectedTotalAmount)}₮)
                        </div>
                      )}
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-auto border border-[color:var(--surface-border)] rounded-2xl relative">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-[color:var(--surface-bg)] border-b border-[color:var(--surface-border)] text-[color:var(--muted-text)] font-medium">
                          <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 w-28">Огноо</th>
                            <th className="p-3 min-w-[200px]">Гүйлгээний утга</th>
                            <th className="p-3 w-28">Илэрсэн</th>
                            <th className="p-3 min-w-[200px]">Таарсан гэрээ / Оршин суугч</th>
                            <th className="p-3 w-28 text-right">Дүн</th>
                            <th className="p-3 w-28 text-center">Төлөв</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--surface-border)]">
                          {filteredRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-[color:var(--muted-text)]">
                                Сонгосон огноо / шүүлтүүрт тохирох гүйлгээ олдсонгүй
                              </td>
                            </tr>
                          ) : (
                            filteredRows.map((row) => {
                              const isSelected = selectedRowIds.has(row.rowNumber);
                              const isSkipOrImported =
                                row.status === "ALREADY_IMPORTED" || row.status === "SKIP";

                              return (
                                <tr
                                  key={row.rowNumber}
                                  className={`hover:bg-theme/5 transition ${
                                    isSelected
                                      ? "bg-theme/10"
                                      : isSkipOrImported
                                      ? "opacity-50"
                                      : ""
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isSkipOrImported}
                                      onChange={() => toggleSelectRow(row.rowNumber)}
                                      className="rounded text-theme focus:ring-theme cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>
                                  <td className="p-3 whitespace-nowrap text-[color:var(--muted-text)]">
                                    <div>{row.date}</div>
                                    <div className="text-[10px] opacity-75">{row.time}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-medium text-[color:var(--panel-text)] line-clamp-1">
                                      {row.description}
                                    </div>
                                    <div className="text-[10px] text-[color:var(--muted-text)] mt-0.5 flex gap-2">
                                      <span>Журнал: {row.journal || "—"}</span>
                                      {row.accName && <span>Нэр: {row.accName}</span>}
                                    </div>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {row.detectedToot ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-theme/10 text-theme">
                                        {row.detectedBair ? `${row.detectedBair} байр, ` : ""}
                                        {row.detectedToot} тоот
                                      </span>
                                    ) : (
                                      <span className="text-[color:var(--muted-text)] text-[11px]">—</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {row.candidateGerees && row.candidateGerees.length > 1 ? (
                                      <div className="space-y-1">
                                        <select
                                          value={row.matchedGeree?._id || ""}
                                          onChange={(e) =>
                                            handleContractChange(row.rowNumber, e.target.value)
                                          }
                                          className="w-full h-7 text-[11px] rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-1.5 focus:outline-none"
                                        >
                                          {row.candidateGerees.map((c) => (
                                            <option key={c._id} value={c._id}>
                                              {c.bairNer} - {c.toot} тоот ({c.ner || "Нэргүй"})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : row.matchedGeree ? (
                                      <div>
                                        <div className="font-medium text-[color:var(--panel-text)]">
                                          {row.matchedGeree.bairNer
                                            ? `${row.matchedGeree.bairNer} - `
                                            : ""}
                                          {row.matchedGeree.toot} тоот
                                          <span className="ml-1 text-[color:var(--muted-text)] font-normal">
                                            ({row.matchedGeree.ner})
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-[color:var(--muted-text)]">
                                          Гэрээ: {row.matchedGeree.gereeniiDugaar}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[color:var(--muted-text)] text-[11px]">
                                        {row.matchReason || "Гэрээ олдсонгүй"}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right whitespace-nowrap font-semibold">
                                    <span
                                      className={
                                        row.orlogo > 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-rose-600 dark:text-rose-400"
                                      }
                                    >
                                      {row.orlogo > 0 ? "+" : "-"}
                                      {formatNumber(row.amount)}₮
                                    </span>
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    {row.status === "EXACT" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3 w-3" /> Таарсан
                                      </span>
                                    )}
                                    {row.status === "MULTI" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                        <AlertCircle className="h-3 w-3" /> Сонгох
                                      </span>
                                    )}
                                    {row.status === "UNMATCHED" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                        <HelpCircle className="h-3 w-3" /> Олдоогүй
                                      </span>
                                    )}
                                    {row.status === "ALREADY_IMPORTED" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                                        <Clock className="h-3 w-3" /> Орсон
                                      </span>
                                    )}
                                    {row.status === "SKIP" && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        <Ban className="h-3 w-3" /> Алгасах
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              {summary && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[color:var(--surface-border)] bg-theme/5">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[color:var(--muted-text)]">
                      Сонгосон: <strong className="text-[color:var(--panel-text)]">{selectedRowIds.size}</strong> гүйлгээ
                    </span>
                    <span className="text-[color:var(--muted-text)]">
                      Сонгосон дүн:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatNumber(selectedTotalAmount)}₮
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                      Болих
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmImport}
                      loading={submitting}
                      disabled={selectedRowIds.size === 0 || submitting}
                      className="px-5 h-9 rounded-xl font-medium"
                    >
                      {submitting
                        ? "Бүртгэж байна..."
                        : `Батлах ба Төлөлт бүртгэх (${selectedRowIds.size})`}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
