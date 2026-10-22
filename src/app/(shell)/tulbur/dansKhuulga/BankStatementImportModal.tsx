"use client";

import React, { useState, useRef, useMemo } from "react";
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
  SlidersHorizontal,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
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

interface Props {
  opened: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  selectedDansId?: string;
  onSuccess: () => void;
}

export default function BankStatementImportModal({
  opened,
  onClose,
  baiguullagiinId,
  barilgiinId,
  selectedDansId,
  onSuccess,
}: Props) {
  const { token } = useAuth();
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

  if (!opened) return null;

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
      if (selectedDansId) formData.append("dansniiDugaar", selectedDansId);

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
          `Хуулга уншигдлаа: ${parsedRows.length} мөрөөс ${resp.data.summary?.exactCount} гүйлгээ автоматаар таарлаа.`
        );
      } else {
        toast.error(resp.data?.message || "Файл задлахад алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Preview error:", err);
      toast.error(err.response?.data?.message || err.message || "Серверт алдаа гарлаа");
    } finally {
      setLoadingPreview(false);
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

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
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
  }, [rows, activeTab, searchQuery]);

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
          dansniiDugaar: selectedDansId,
          rows: payloadRows,
        }
      );

      if (resp.data?.success) {
        toast.success(resp.data.message || "Гүйлгээ амжилттай бүртгэгдлээ!");
        onSuccess();
        onClose();
      } else {
        toast.error(resp.data?.message || "Бүртгэхэд алдаа гарлаа");
      }
    } catch (err: any) {
      console.error("Confirm import error:", err);
      toast.error(err.response?.data?.message || err.message || "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative flex flex-col w-full max-w-7xl max-h-[92vh] rounded-2xl bg-[color:var(--surface-bg,#ffffff)] dark:bg-[#1a1d24] text-[color:var(--panel-text,#1f2937)] dark:text-gray-100 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Дансны хуулга Excel-ээр оруулах & Оршин суугчтай тулгах
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                И-Баримт болон банкны хуулгыг автоматаар уншиж, төлөлтийг гэрээтэй нь холбон бүртгэнэ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
          {/* File Upload Box if no file loaded */}
          {!summary ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[350px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                {loadingPreview ? (
                  <RefreshCw className="h-8 w-8 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
              </div>
              <h3 className="text-base font-medium mb-1">
                {loadingPreview ? "Хуулгыг уншиж байна..." : "Банкны Excel хуулга файлаа сонгоно уу"}
              </h3>
              <p className="text-xs text-gray-400 max-w-md text-center">
                .xlsx эсвэл .xls өргөтгөлтэй хуулга файлууд (United e-bill болон бүх банкны хуулга шууд дэмжигдэнэ)
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div
                  onClick={() => setActiveTab("ALL")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "ALL"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="text-[11px] text-gray-500 font-medium">Нийт гүйлгээ</div>
                  <div className="text-xl font-bold mt-0.5">{summary.totalRows}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Орлого: {formatNumber(summary.totalIncome)}₮
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("EXACT")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "EXACT"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Таарсан
                  </div>
                  <div className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {summary.exactCount}
                  </div>
                  <div className="text-[10px] text-emerald-600/70 mt-1">
                    Шууд бүртгэхэд бэлэн
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("MULTI")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "MULTI"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Олон гэрээтэй
                  </div>
                  <div className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">
                    {summary.multiCount}
                  </div>
                  <div className="text-[10px] text-amber-600/70 mt-1">
                    Сонголт шаардлагатай
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("UNMATCHED")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "UNMATCHED"
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Таараагүй
                  </div>
                  <div className="text-xl font-bold mt-0.5 text-rose-600 dark:text-rose-400">
                    {summary.unmatchedCount}
                  </div>
                  <div className="text-[10px] text-rose-600/70 mt-1">
                    Тоот тодорхойгүй
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("ALREADY_IMPORTED")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "ALREADY_IMPORTED"
                      ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    Өмнө нь орсон
                  </div>
                  <div className="text-xl font-bold mt-0.5 text-cyan-600 dark:text-cyan-400">
                    {summary.alreadyImportedCount}
                  </div>
                  <div className="text-[10px] text-cyan-600/70 mt-1">
                    Давхардалгүй алгасна
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("SKIP")}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    activeTab === "SKIP"
                      ? "border-gray-500 bg-gray-100 dark:bg-gray-800/60"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                    <Ban className="h-3.5 w-3.5" />
                    Шимтгэл / Зарлага
                  </div>
                  <div className="text-xl font-bold mt-0.5">{summary.skipCount}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Төлөлтөд орохгүй
                  </div>
                </div>
              </div>

              {/* Action & Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Тоот, нэр, утга, дүн, журналаар хайх..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <button
                    onClick={toggleSelectAllVisible}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Харагдаж буйг сонгох ({filteredRows.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 font-medium transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Өөр файл солих
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl relative">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 text-gray-500 font-medium">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 w-28">Огноо</th>
                      <th className="p-3 min-w-[220px]">Гүйлгээний утга</th>
                      <th className="p-3 w-28">Илэрсэн</th>
                      <th className="p-3 min-w-[200px]">Таарсан гэрээ / Оршин суугч</th>
                      <th className="p-3 w-28 text-right">Дүн</th>
                      <th className="p-3 w-28 text-center">Төлөв</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Илэрц олдсонгүй
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
                            className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition ${
                              isSelected
                                ? "bg-blue-50/30 dark:bg-blue-950/20"
                                : isSkipOrImported
                                ? "opacity-60"
                                : ""
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isSkipOrImported}
                                onChange={() => toggleSelectRow(row.rowNumber)}
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              <div>{row.date}</div>
                              <div className="text-[10px] text-gray-400">{row.time}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                                {row.description}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 flex gap-2">
                                <span>Журнал: {row.journal || "—"}</span>
                                {row.accName && <span>Нэр: {row.accName}</span>}
                              </div>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              {row.detectedToot ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                  {row.detectedBair ? `${row.detectedBair} байр, ` : ""}
                                  {row.detectedToot} тоот
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">—</span>
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
                                    className="w-full h-7 text-[11px] rounded border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-1.5 focus:outline-none"
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
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {row.matchedGeree.bairNer
                                      ? `${row.matchedGeree.bairNer} - `
                                      : ""}
                                    {row.matchedGeree.toot} тоот
                                    <span className="ml-1 text-gray-500 font-normal">
                                      ({row.matchedGeree.ner})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    Гэрээ: {row.matchedGeree.gereeniiDugaar}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[11px]">
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
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" /> Таарсан
                                </span>
                              )}
                              {row.status === "MULTI" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                  <AlertCircle className="h-3 w-3" /> Сонгох
                                </span>
                              )}
                              {row.status === "UNMATCHED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                  <HelpCircle className="h-3 w-3" /> Олдоогүй
                                </span>
                              )}
                              {row.status === "ALREADY_IMPORTED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                                  <Clock className="h-3 w-3" /> Орсон
                                </span>
                              )}
                              {row.status === "SKIP" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-500">
                Сонгосон: <strong className="text-gray-900 dark:text-gray-100">{selectedRowIds.size}</strong> гүйлгээ
              </span>
              <span className="text-gray-500">
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 h-9 rounded-xl shadow-sm"
              >
                {submitting
                  ? "Бүртгэж байна..."
                  : `Батлах ба Төлөлт бүртгэх (${selectedRowIds.size})`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
