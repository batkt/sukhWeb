"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  RefreshCw,
  Calendar,
  CreditCard,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Download,
  FileText,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import moment from "moment";
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
  exactAmount: number;
  multiCount: number;
  multiAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  alreadyImportedCount: number;
  alreadyImportedAmount: number;
  skipCount: number;
  skipAmount: number;
  incomeCount: number;
  expenseCount: number;
  otherCount: number;
  totalIncome: number;
  totalExpense: number;
  totalAmount: number;
  payableAmount: number;
  detectedAccount?: string;
  detectedBank?: string;
  dateRange?: { start: string; end: string };
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  // Search & Filters
  const [activeTab, setActiveTab] = useState<
    "ALL" | "EXACT" | "UNMATCHED" | "ALREADY_IMPORTED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");

  // Keyword Rule Modal State & Tester
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [testText, setTestText] = useState("217-56 Цолмонбаяр байрны төлбөр");
  const [isMatchingAnimating, setIsMatchingAnimating] = useState(false);

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

        // Pre-select rows that are EXACT or MULTI for import
        const autoSelected = new Set<number>();
        parsedRows.forEach((r) => {
          if (
            (r.status === "EXACT" || r.status === "MULTI") &&
            r.action === "IMPORT_AND_PAY"
          ) {
            autoSelected.add(r.rowNumber);
          }
        });
        setSelectedRowIds(autoSelected);

        toast.success(
          `Хуулга уншигдлаа: ${parsedRows.length} мөрөөс ${resp.data.summary?.exactCount || 0} гүйлгээ автоматаар таарлаа.`
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

  // Center button action: re-verify and select matched items
  const handleTriggerMatching = () => {
    setIsMatchingAnimating(true);
    setTimeout(() => {
      const autoSelected = new Set<number>();
      rows.forEach((r) => {
        if (
          (r.status === "EXACT" || r.status === "MULTI") &&
          r.action === "IMPORT_AND_PAY"
        ) {
          autoSelected.add(r.rowNumber);
        }
      });
      setSelectedRowIds(autoSelected);
      setIsMatchingAnimating(false);
      toast.success(
        `Тулгалт шинэчлэгдлээ: ${summary?.exactCount || 0} таарсан гүйлгээ сонгогдлоо.`
      );
    }, 400);
  };

  const toggleSelectRow = (rowNumber: number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
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

  // Filtered rows for left & right views
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Type Filter (Income / Expense)
      if (typeFilter === "INCOME" && r.orlogo <= 0) return false;
      if (typeFilter === "EXPENSE" && r.zarlaga <= 0) return false;

      // Tab filter (Right card)
      if (activeTab === "EXACT" && r.status !== "EXACT") return false;
      if (
        activeTab === "UNMATCHED" &&
        r.status !== "UNMATCHED" &&
        r.status !== "MULTI" &&
        r.status !== "SKIP"
      )
        return false;
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
  }, [rows, activeTab, typeFilter, searchQuery]);

  // Select all checkbox
  const selectableVisibleIds = filteredRows
    .filter((r) => r.status !== "ALREADY_IMPORTED" && r.status !== "SKIP")
    .map((r) => r.rowNumber);
  const allVisibleSelected =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((id) => selectedRowIds.has(id));
  const someVisibleSelected = selectableVisibleIds.some((id) =>
    selectedRowIds.has(id)
  );

  const toggleSelectAllVisible = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        selectableVisibleIds.forEach((num) => next.delete(num));
      } else {
        selectableVisibleIds.forEach((num) => next.add(num));
      }
      return next;
    });
  };

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
        bank: r.bank || summary?.detectedBank || "tdb",
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
          dansniiDugaar: summary?.detectedAccount,
          bank: summary?.detectedBank || "tdb",
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

  // Export current preview to Excel
  const handleExportPreview = () => {
    if (!rows || rows.length === 0) {
      toast.error("Татах өгөгдөл байхгүй байна");
      return;
    }
    const exportData = rows.map((r, i) => ({
      "№": i + 1,
      "Огноо": r.date,
      "Цаг": r.time || "",
      "Гүйлгээний утга": r.description,
      "Харьцсан данс": r.relatedAccount || "",
      "Дансны нэр": r.accName || "",
      "Илэрсэн байр": r.detectedBair || "",
      "Илэрсэн тоот": r.detectedToot || "",
      "Оршин суугч": r.matchedGeree?.ner || "",
      "Гэрээ": r.matchedGeree?.gereeniiDugaar || "",
      "Орлого (₮)": r.orlogo || 0,
      "Зарлага (₮)": r.zarlaga || 0,
      "Төлөв":
        r.status === "EXACT"
          ? "Таарсан"
          : r.status === "MULTI"
          ? "Олон таарсан"
          : r.status === "ALREADY_IMPORTED"
          ? "Бүртгэгдсэн"
          : r.status === "SKIP"
          ? "Шимтгэл / Зарлага"
          : "Таараагүй",
      "Шалтгаан": r.matchReason || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Тулгалт");
    XLSX.writeFile(wb, `Dansnii_khuulga_tulgalt_${moment().format("YYYYMMDD_HHmm")}.xlsx`);
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Тайлант огноо": "2026.07.01",
        "Цаг": "09:24",
        "Журнал": "949791060272",
        "Байршил": "БАНКНЫ ТӨВ",
        "Утга": "218 байр 129 тоот Б.Баярсайхан байрны төлбөр",
        "Орлого": 48600,
        "Зарлага": 0,
        "Үлдэгдэл": 48600,
        "Харьцсан данс": "5001234567",
        "Дансны нэр": "Б.БАЯРСАЙХАН",
      },
      {
        "Тайлант огноо": "2026.07.01",
        "Цаг": "09:58",
        "Журнал": "949791248661",
        "Байршил": "БАНКНЫ ТӨВ",
        "Утга": "219-55 Ц.Байгаль 7 сар",
        "Орлого": 48600,
        "Зарлага": 0,
        "Үлдэгдэл": 97200,
        "Харьцсан данс": "5001234568",
        "Дансны нэр": "Ц.БАЙГАЛЬ",
      },
      {
        "Тайлант огноо": "2026.07.01",
        "Цаг": "11:13",
        "Журнал": "949791437623",
        "Байршил": "БАНКНЫ ТӨВ",
        "Утга": "218 байр 11 тоот Г.Уламбаяр",
        "Орлого": 80600,
        "Зарлага": 0,
        "Үлдэгдэл": 177800,
        "Харьцсан данс": "5001234569",
        "Дансны нэр": "Г.УЛАМБАЯР",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Дансны хуулга");
    XLSX.writeFile(wb, "Dansnii_khuulga_zagvar.xlsx");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const detectedBankName = useMemo(() => {
    const b = (summary?.detectedBank || "").toLowerCase();
    if (b.includes("khan")) return "Хаан";
    if (b.includes("golomt")) return "Голомт";
    if (b.includes("state")) return "Төрийн";
    if (b.includes("xac")) return "Хас";
    return "TDB";
  }, [summary?.detectedBank]);

  // Keyword tester live preview parser
  const parsedTestResult = useMemo(() => {
    let cleaned = testText
      .replace(/\b20\d{2}[-/.](0?[1-9]|1[0-2])\b/g, " ")
      .replace(/\b(0?[1-9]|1[0-2])[-/.](20\d{2})\b/g, " ")
      .replace(/\b(0?[1-9]|1[0-2])\s*(?:-?[рrR])?\s*(?:сар|sar)\b/gi, " ");

    const isFee = /fee|шимтгэл|хураамж/i.test(testText);
    const isAldangi = /алданги|aldangi/i.test(testText);

    let detectedBair = "";
    let detectedToot = "";

    const explicitMatch = cleaned.match(
      /(?:байр\s*)?(\d{1,4})\s*(?:-|–|_|\/|н|\*|\s*(?:р\s*)?байр\s*)\s*(?:тоот\s*)?(\d{1,4})\s*(?:тоот|toot)?/i
    );
    if (explicitMatch) {
      detectedBair = explicitMatch[1];
      detectedToot = explicitMatch[2];
    } else {
      const dashMatch = cleaned.match(/(?:^|\s)[-–]\s*(\d{1,4})\b|\b(\d{1,4})\s*[-–]/);
      if (dashMatch) {
        detectedToot = dashMatch[1] || dashMatch[2];
      } else {
        const tootMatch = cleaned.match(/\b(\d{1,4})\s*(?:тоот|toot)\b/i);
        if (tootMatch) {
          detectedToot = tootMatch[1];
        }
      }
    }

    return {
      isFee,
      isAldangi,
      detectedBair: detectedBair || "—",
      detectedToot: detectedToot || "—",
    };
  }, [testText]);

  return (
    <ModalPortal>
      <AnimatePresence>
        {show && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-3 sm:p-5">
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
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative z-[12001] flex flex-col w-[min(1420px,98vw)] h-[90vh] max-h-[920px] rounded-[28px] bg-[color:var(--surface-bg,#ffffff)] text-[color:var(--panel-text,#111827)] shadow-2xl border border-[color:var(--surface-border,#e5e7eb)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--surface-border,#e5e7eb)] bg-[color:var(--surface-bg,#ffffff)] select-none">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-[color:var(--panel-text,#111827)]">
                      Дансны хуулга Excel-ээс оруулах
                    </h2>
                    <p className="text-xs text-[color:var(--muted-text,#6b7280)] mt-0.5">
                      {detectedBankName} банкны дансны хуулгыг AmarHome системтэй тулгаж, оршин суугчдын төлөлтөд бүртгэнэ.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                  title="Хаах"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper Progress Indicator */}
              <div className="px-6 py-3 border-b border-[color:var(--surface-border,#e5e7eb)] bg-gray-50/70 dark:bg-zinc-900/50 flex items-center justify-center">
                <div className="flex items-center gap-3 sm:gap-6 max-w-2xl w-full justify-between">
                  {/* Step 1 */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition ${
                        summary ? "bg-emerald-700" : "bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950"
                      }`}
                    >
                      {summary ? <Check className="w-4 h-4" /> : "1"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[color:var(--panel-text,#111827)]">Файл сонгох</div>
                      <div className="text-[10px] text-[color:var(--muted-text,#6b7280)] hidden sm:block">
                        {detectedBankName} Excel файлыг оруулах
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-zinc-800 mx-2" />

                  {/* Step 2 */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        summary
                          ? "bg-emerald-700 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                          : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[color:var(--panel-text,#111827)]">Гүйлгээг тулгах</div>
                      <div className="text-[10px] text-[color:var(--muted-text,#6b7280)] hidden sm:block">
                        {detectedBankName} өгөгдлийг Amarhome-той харьцуулах
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-zinc-800 mx-2" />

                  {/* Step 3 */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-200 dark:bg-zinc-800 text-gray-500">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Бүртгэх</div>
                      <div className="text-[10px] text-[color:var(--muted-text,#6b7280)] hidden sm:block">
                        Таарсан гүйлгээг төлөлтөд бүртгэх
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-5">
                {!summary ? (
                  /* Initial Upload Dropzone View */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[380px] border-2 border-dashed border-[color:var(--surface-border,#d1d5db)] rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="h-20 w-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition duration-300 shadow-sm border border-emerald-100 dark:border-emerald-900/40">
                      {loadingPreview ? (
                        <RefreshCw className="h-10 w-10 animate-spin" />
                      ) : (
                        <Upload className="h-10 w-10" />
                      )}
                    </div>
                    <h3 className="text-base font-bold mb-1 text-[color:var(--panel-text)]">
                      {loadingPreview
                        ? "Хуулгыг уншиж, тулгалт хийж байна..."
                        : "Банкны Excel хуулга файлаа сонгоно уу"}
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)] max-w-md text-center mb-6">
                      .xlsx эсвэл .xls хуулга (TDB, Хаан банк, Голомт, Төрийн банк, Хас банк зэрэг бүх банкны хуулга шууд дэмжигдэнэ)
                    </p>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="primary"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 h-10 text-xs font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Файл сонгох
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-xl px-4 h-10 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTemplate();
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1.5 text-gray-500" />
                        Excel загвар татах
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 2-Card Side-by-Side Matching View */
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr,64px,1fr] gap-3 flex-1 min-h-0 overflow-hidden">
                    {/* LEFT CARD: Bank Statement Data */}
                    <div className="border border-[color:var(--surface-border,#e5e7eb)] rounded-2xl p-4 flex flex-col bg-[color:var(--surface-bg,#ffffff)] shadow-sm overflow-hidden">
                      {/* Top Row: Bank Badge + Info + File Pill */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[color:var(--surface-border,#f3f4f6)]">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-[#004f9f] text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow-sm tracking-wide">
                            {detectedBankName.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[color:var(--panel-text,#111827)]">
                              {detectedBankName} банкны дансны хуулга
                            </h3>
                            <p className="text-[10px] text-[color:var(--muted-text,#6b7280)]">
                              Excel файлыг оруулна.
                            </p>
                          </div>
                        </div>

                        {/* File Pill with size & remove */}
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800/80 max-w-[220px]">
                          <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            X
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-[color:var(--panel-text)] truncate" title={file?.name}>
                              {file?.name || "хуулга.xlsx"}
                            </div>
                            <div className="text-[10px] text-[color:var(--muted-text)]">
                              {formatFileSize(file?.size)}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setFile(null);
                              setSummary(null);
                              setRows([]);
                            }}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5"
                            title="Файл арилгах"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata Row: Date Range + Account */}
                      <div className="grid grid-cols-2 gap-2 my-2.5">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40">
                          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] text-[color:var(--muted-text)]">Огнооны хүрээ</div>
                            <div className="text-xs font-semibold text-[color:var(--panel-text)] truncate">
                              {summary.dateRange?.start && summary.dateRange?.end
                                ? `${summary.dateRange.start} — ${summary.dateRange.end}`
                                : "2026.07.01 — 2026.07.31"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40">
                          <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] text-[color:var(--muted-text)]">Данс</div>
                            <div className="text-xs font-semibold text-[color:var(--panel-text)] truncate">
                              ₮ - {summary.detectedAccount || "5001234567"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4 Stat Boxes */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-900/30">
                          <div className="text-[10px] text-[color:var(--muted-text)] font-medium">Нийт гүйлгээ</div>
                          <div className="text-base font-bold text-[color:var(--panel-text)] mt-0.5">
                            {summary.totalRows}
                          </div>
                          <div className="text-[10px] text-[color:var(--muted-text)] truncate mt-0.5">
                            {formatNumber(summary.totalAmount || summary.totalIncome + summary.totalExpense)} ₮
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Орлого</div>
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {summary.incomeCount || (summary.totalRows - summary.expenseCount)}
                          </div>
                          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                            {formatNumber(summary.totalIncome)} ₮
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/30 dark:bg-amber-950/20">
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Зарлага</div>
                          <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            {summary.expenseCount || summary.skipCount}
                          </div>
                          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate mt-0.5">
                            {formatNumber(summary.totalExpense || summary.skipAmount)} ₮
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-900/30">
                          <div className="text-[10px] text-[color:var(--muted-text)] font-medium">Бусад</div>
                          <div className="text-base font-bold text-[color:var(--panel-text)] mt-0.5">
                            {summary.otherCount || 0}
                          </div>
                          <div className="text-[10px] text-[color:var(--muted-text)] truncate mt-0.5">0 ₮</div>
                        </div>
                      </div>

                      {/* Search & Filter Bar */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Гүйлгээний утга, дүн, дугаар..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as any)}
                          className="h-8 px-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent text-xs font-medium text-[color:var(--panel-text)] focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">Бүгд</option>
                          <option value="INCOME">Орлого</option>
                          <option value="EXPENSE">Зарлага</option>
                        </select>
                      </div>

                      {/* Left Table (Bank Transactions) */}
                      <div className="flex-1 overflow-auto rounded-xl border border-gray-100 dark:border-zinc-800 relative bg-[color:var(--surface-bg)]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-800/90 border-b border-gray-100 dark:border-zinc-800 text-[color:var(--muted-text)] font-semibold text-[11px]">
                            <tr>
                              <th className="p-2.5 w-8 text-center">
                                <input
                                  type="checkbox"
                                  ref={(el) => {
                                    if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                                  }}
                                  checked={allVisibleSelected}
                                  disabled={selectableVisibleIds.length === 0}
                                  onChange={toggleSelectAllVisible}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </th>
                              <th className="p-2.5 w-7 text-center">#</th>
                              <th className="p-2.5 w-28 whitespace-nowrap">Огноо</th>
                              <th className="p-2.5 min-w-[140px]">Гүйлгээний утга</th>
                              <th className="p-2.5 w-24 text-right whitespace-nowrap">Дүн (₮)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredRows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-[color:var(--muted-text)] text-xs">
                                  Шүүлтүүрт тохирох гүйлгээ олдсонгүй
                                </td>
                              </tr>
                            ) : (
                              filteredRows.map((row, idx) => {
                                const isSelected = selectedRowIds.has(row.rowNumber);
                                const isSkipOrImported =
                                  row.status === "ALREADY_IMPORTED" || row.status === "SKIP";

                                return (
                                  <tr
                                    key={row.rowNumber}
                                    onClick={() => !isSkipOrImported && toggleSelectRow(row.rowNumber)}
                                    className={`cursor-pointer transition ${
                                      isSelected
                                        ? "bg-emerald-50/60 dark:bg-emerald-950/30"
                                        : isSkipOrImported
                                        ? "opacity-50 hover:bg-gray-50/50"
                                        : "hover:bg-gray-50/80 dark:hover:bg-zinc-800/40"
                                    }`}
                                  >
                                    <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isSkipOrImported}
                                        onChange={() => toggleSelectRow(row.rowNumber)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-2.5 text-center text-gray-400 text-[11px]">
                                      {idx + 1}
                                    </td>
                                    <td className="p-2.5 whitespace-nowrap text-[color:var(--muted-text)] text-[11px]">
                                      {row.date} {row.time || ""}
                                    </td>
                                    <td className="p-2.5">
                                      <div className="font-medium text-[color:var(--panel-text)] text-xs line-clamp-1" title={row.description}>
                                        {row.description}
                                      </div>
                                      {row.accName && (
                                        <div className="text-[10px] text-[color:var(--muted-text)] mt-0.5 truncate">
                                          {row.accName}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-right whitespace-nowrap font-bold text-xs">
                                      <span
                                        className={
                                          row.orlogo > 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-amber-600 dark:text-amber-400"
                                        }
                                      >
                                        {row.orlogo > 0 ? "+" : "-"}
                                        {formatNumber(row.amount || 0)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* CENTER PILLAR: Action Button */}
                    <div className="flex flex-col items-center justify-center py-4">
                      <button
                        type="button"
                        onClick={handleTriggerMatching}
                        title="Гүйлгээг тулгах"
                        className={`w-11 h-11 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                          isMatchingAnimating ? "animate-spin" : ""
                        }`}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <div className="text-xs font-bold text-[color:var(--panel-text,#111827)] text-center mt-2.5 whitespace-nowrap">
                        Гүйлгээг
                        <br />
                        тулгах
                      </div>
                      <div className="text-[9px] text-[color:var(--muted-text,#6b7280)] text-center leading-tight mt-1 max-w-[60px] hidden lg:block">
                        {detectedBankName} өгөгдлийг Amarhome-той харьцуулна.
                      </div>
                    </div>

                    {/* RIGHT CARD: Amarhome Matched Data */}
                    <div className="border border-[color:var(--surface-border,#e5e7eb)] rounded-2xl p-4 flex flex-col bg-[color:var(--surface-bg,#ffffff)] shadow-sm overflow-hidden">
                      {/* Top Row: Amarhome Badge + Title + Keyword Config Button */}
                      <div className="flex items-center justify-between pb-3 border-b border-[color:var(--surface-border,#f3f4f6)]">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-emerald-700 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[color:var(--panel-text,#111827)]">
                              Amarhome
                            </h3>
                            <p className="text-[10px] text-[color:var(--muted-text,#6b7280)]">
                              Оршин суугчдын төлөлттэй тулгах.
                            </p>
                          </div>
                        </div>

                        {/* Keyword Matching Button */}
                        <button
                          type="button"
                          onClick={() => setShowKeywordModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-medium text-[color:var(--panel-text)] transition shadow-sm"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                          <span>Түлхүүр үг тааруулах</span>
                        </button>
                      </div>

                      {/* 3 Status Summary Cards */}
                      <div className="grid grid-cols-3 gap-2 my-2.5">
                        {/* 1. Таарсан гүйлгээ */}
                        <div
                          onClick={() => setActiveTab("EXACT")}
                          className={`p-2.5 rounded-xl border cursor-pointer transition ${
                            activeTab === "EXACT"
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500"
                              : "border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">
                              Таарсан гүйлгээ
                            </div>
                            <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </div>
                          </div>
                          <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                            {summary.exactCount}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {formatNumber(summary.exactAmount || summary.payableAmount)} ₮
                          </div>
                        </div>

                        {/* 2. Таараагүй гүйлгээ */}
                        <div
                          onClick={() => setActiveTab("UNMATCHED")}
                          className={`p-2.5 rounded-xl border cursor-pointer transition ${
                            activeTab === "UNMATCHED"
                              ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-500"
                              : "border-amber-200/80 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                              Таараагүй гүйлгээ
                            </div>
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
                              !
                            </div>
                          </div>
                          <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                            {summary.unmatchedCount + summary.multiCount}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {formatNumber(summary.unmatchedAmount + summary.multiAmount)} ₮
                          </div>
                        </div>

                        {/* 3. Аль хэдийн бүртгэгдсэн */}
                        <div
                          onClick={() => setActiveTab("ALREADY_IMPORTED")}
                          className={`p-2.5 rounded-xl border cursor-pointer transition ${
                            activeTab === "ALREADY_IMPORTED"
                              ? "border-gray-500 bg-gray-100 dark:bg-zinc-800 ring-1 ring-gray-400"
                              : "border-gray-200/80 bg-gray-50/50 dark:bg-zinc-900/30 hover:bg-gray-100/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold">
                              Аль хэдийн бүртгэгдсэн
                            </div>
                            <div className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </div>
                          </div>
                          <div className="text-lg font-black text-gray-700 dark:text-gray-300 mt-0.5">
                            {summary.alreadyImportedCount}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {formatNumber(summary.alreadyImportedAmount)} ₮
                          </div>
                        </div>
                      </div>

                      {/* Tab Bar Filter */}
                      <div className="flex items-center gap-4 border-b border-gray-100 dark:border-zinc-800 text-xs font-semibold pb-1.5 mb-2 mt-1 select-none">
                        <button
                          type="button"
                          onClick={() => setActiveTab("ALL")}
                          className={`pb-1 transition-all ${
                            activeTab === "ALL"
                              ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          Бүгд ({summary.totalRows})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("EXACT")}
                          className={`pb-1 transition-all ${
                            activeTab === "EXACT"
                              ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          Таарсан ({summary.exactCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("UNMATCHED")}
                          className={`pb-1 transition-all ${
                            activeTab === "UNMATCHED"
                              ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          Таараагүй ({summary.unmatchedCount + summary.multiCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("ALREADY_IMPORTED")}
                          className={`pb-1 transition-all ${
                            activeTab === "ALREADY_IMPORTED"
                              ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-700"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          Бүртгэгдсэн ({summary.alreadyImportedCount})
                        </button>
                      </div>

                      {/* Right Table (Amarhome Matched Residents) */}
                      <div className="flex-1 overflow-auto rounded-xl border border-gray-100 dark:border-zinc-800 relative bg-[color:var(--surface-bg)]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-800/90 border-b border-gray-100 dark:border-zinc-800 text-[color:var(--muted-text)] font-semibold text-[11px]">
                            <tr>
                              <th className="p-2.5 w-8 text-center">
                                <input
                                  type="checkbox"
                                  ref={(el) => {
                                    if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                                  }}
                                  checked={allVisibleSelected}
                                  disabled={selectableVisibleIds.length === 0}
                                  onChange={toggleSelectAllVisible}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </th>
                              <th className="p-2.5 w-7 text-center">#</th>
                              <th className="p-2.5 w-24 whitespace-nowrap">Огноо</th>
                              <th className="p-2.5 min-w-[170px]">Оршин суугч / Тоот</th>
                              <th className="p-2.5 w-24 text-right whitespace-nowrap">Дүн (₮)</th>
                              <th className="p-2.5 w-24 text-center whitespace-nowrap">Төлөв</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredRows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-[color:var(--muted-text)] text-xs">
                                  Шүүлтүүрт тохирох оршин суугч олдсонгүй
                                </td>
                              </tr>
                            ) : (
                              filteredRows.map((row, idx) => {
                                const isSelected = selectedRowIds.has(row.rowNumber);
                                const isSkipOrImported =
                                  row.status === "ALREADY_IMPORTED" || row.status === "SKIP";

                                return (
                                  <tr
                                    key={row.rowNumber}
                                    onClick={() => !isSkipOrImported && toggleSelectRow(row.rowNumber)}
                                    className={`cursor-pointer transition ${
                                      isSelected
                                        ? "bg-emerald-50/60 dark:bg-emerald-950/30"
                                        : isSkipOrImported
                                        ? "opacity-50 hover:bg-gray-50/50"
                                        : "hover:bg-gray-50/80 dark:hover:bg-zinc-800/40"
                                    }`}
                                  >
                                    <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isSkipOrImported}
                                        onChange={() => toggleSelectRow(row.rowNumber)}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="p-2.5 text-center text-gray-400 text-[11px]">
                                      {idx + 1}
                                    </td>
                                    <td className="p-2.5 whitespace-nowrap text-[color:var(--muted-text)] text-[11px]">
                                      {row.date}
                                    </td>
                                    <td className="p-2.5">
                                      {row.candidateGerees && row.candidateGerees.length > 1 ? (
                                        <div onClick={(e) => e.stopPropagation()}>
                                          <select
                                            value={row.matchedGeree?._id || ""}
                                            onChange={(e) =>
                                              handleContractChange(row.rowNumber, e.target.value)
                                            }
                                            className="w-full h-6 text-[10px] rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-1 focus:outline-none"
                                          >
                                            {row.candidateGerees.map((c) => (
                                              <option key={c._id} value={c._id}>
                                                {c.bairNer} - {c.toot} ({c.ner || "Нэргүй"})
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : row.matchedGeree ? (
                                        <div>
                                          <div className="font-bold text-[color:var(--panel-text)] text-xs">
                                            {[row.matchedGeree.ovog?.charAt(0), row.matchedGeree.ner]
                                              .filter(Boolean)
                                              .join(". ") || "Нэргүй"}
                                          </div>
                                          <div className="text-[10px] text-[color:var(--muted-text)] mt-0.5">
                                            {row.matchedGeree.bairNer} байр, {row.matchedGeree.toot} тоот
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                            {row.detectedToot
                                              ? `${row.detectedBair ? `${row.detectedBair} байр, ` : ""}${row.detectedToot} тоот (Гэрээ олдсонгүй)`
                                              : "Тоот тодорхойгүй"}
                                          </div>
                                          <div className="text-[10px] text-gray-400 truncate">
                                            {row.accName || row.description}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-right whitespace-nowrap font-bold text-xs">
                                      <span
                                        className={
                                          row.orlogo > 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-amber-600 dark:text-amber-400"
                                        }
                                      >
                                        {row.orlogo > 0 ? "+" : "-"}
                                        {formatNumber(row.amount || 0)}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center whitespace-nowrap">
                                      {row.status === "EXACT" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Таарсан
                                        </span>
                                      )}
                                      {row.status === "MULTI" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40">
                                          <AlertCircle className="w-3 h-3 text-amber-600" /> Сонгох
                                        </span>
                                      )}
                                      {row.status === "UNMATCHED" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40">
                                          <AlertCircle className="w-3 h-3 text-amber-600" /> Таараагүй
                                        </span>
                                      )}
                                      {row.status === "ALREADY_IMPORTED" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                                          <Clock className="w-3 h-3" /> Бүртгэгдсэн
                                        </span>
                                      )}
                                      {row.status === "SKIP" && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                                          <Ban className="w-3 h-3" /> Шимтгэл
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
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[color:var(--surface-border,#e5e7eb)] bg-gray-50/60 dark:bg-zinc-900/50">
                {/* Left Side: Export & Template Download */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportPreview}
                    disabled={!summary || rows.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold text-[color:var(--panel-text)] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500" />
                    <span>Татаж харах</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold text-[color:var(--panel-text)] transition shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Excel загвар</span>
                  </button>
                </div>

                {/* Right Side: Cancel & Submit */}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-5 h-9 rounded-xl text-xs font-semibold hover:bg-gray-200/50"
                  >
                    Болих
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleConfirmImport}
                    loading={submitting}
                    disabled={!summary || selectedRowIds.size === 0 || submitting}
                    className="px-6 h-9 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition disabled:opacity-40"
                  >
                    {submitting
                      ? "Бүртгэж байна..."
                      : `Сонгосон ${selectedRowIds.size} гүйлгээг бүртгэх`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyword Rules & Realtime Tester Modal */}
      <AnimatePresence>
        {showKeywordModal && (
          <div className="fixed inset-0 z-[12010] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeywordModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-[12011] w-full max-w-xl bg-[color:var(--surface-bg,#ffffff)] text-[color:var(--panel-text,#111827)] rounded-3xl p-6 shadow-2xl border border-[color:var(--surface-border,#e5e7eb)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[color:var(--panel-text)]">
                      Түлхүүр үг тааруулах дүрэм & Шалгах
                    </h3>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Банкны гүйлгээний утгаас мэдээлэл задлах авто дүрмүүд
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeywordModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rules List */}
              <div className="space-y-3 my-4 text-xs">
                <div className="p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                  <div className="font-bold text-[color:var(--panel-text)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    1. Байр, тоот салгаж таних дүрэм
                  </div>
                  <p className="text-[color:var(--muted-text)] mt-1">
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">217-56</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">219-р байр 66 тоот</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">218 6toot</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">- 903</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">303 -</code> хэлбэрүүдийг автоматаар ялгана.
                  </p>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                  <div className="font-bold text-[color:var(--panel-text)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    2. Оршин суугчийн нэрээр хайх дүрэм
                  </div>
                  <p className="text-[color:var(--muted-text)] mt-1">
                    Гүйлгээний утгад тоот байхгүй боловч банкны дансны нэр (жишээ нь: <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">Э.ХОНГОРЗУЛ</code>) бүртгэлтэй оршин суугчтай таарвал автоматаар холбоно.
                  </p>
                </div>

                <div className="p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                  <div className="font-bold text-[color:var(--panel-text)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    3. Огноо, сарын тоог салгах дүрэм
                  </div>
                  <p className="text-[color:var(--muted-text)] mt-1">
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">2025-10</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">9 сар</code>,{" "}
                    <code className="bg-gray-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">10-р сар</code> зэрэг огнооны цифрүүдийг байр, тооттой холилдохгүй байхаар цэвэрлэж ялгана.
                  </p>
                </div>
              </div>

              {/* Live Tester Box */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  Шууд шалгах (Live test):
                </div>
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Гүйлгээний утга бичнэ үү..."
                  className="w-full h-9 px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-[color:var(--surface-bg)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />

                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500">Байр</div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {parsedTestResult.detectedBair}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Тоот</div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {parsedTestResult.detectedToot}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Алданги</div>
                    <div className="text-xs font-bold text-[color:var(--panel-text)]">
                      {parsedTestResult.isAldangi ? "Тийм" : "Үгүй"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Шимтгэл</div>
                    <div className="text-xs font-bold text-[color:var(--panel-text)]">
                      {parsedTestResult.isFee ? "Тийм" : "Үгүй"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  variant="primary"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 h-9 text-xs font-semibold"
                  onClick={() => setShowKeywordModal(false)}
                >
                  Ойлголоо
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
