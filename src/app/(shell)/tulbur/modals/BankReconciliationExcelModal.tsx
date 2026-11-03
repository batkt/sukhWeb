"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  CreditCard,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

export interface BankReconciliationRecord {
  building: string;
  korpus: string;
  toot: string;
  urkh: string;
  on: number;
  sar: number;
  dun: number;
  residentName: string;
  paymentType: "qpay" | "manual";
  date: string;
  tailbar: string;
}

interface BankReconciliationExcelModalProps {
  show: boolean;
  onClose: () => void;
  baiguullaga?: any;
  barilguud?: any[];
  currentBuildingId?: string;
  historyItems: any[];
  contracts?: any[];
  contractsById?: Record<string, any>;
  contractsByNumber?: Record<string, any>;
}

export default function BankReconciliationExcelModal({
  show,
  onClose,
  baiguullaga,
  barilguud = [],
  currentBuildingId,
  historyItems = [],
  contracts = [],
  contractsById = {},
  contractsByNumber = {},
}: BankReconciliationExcelModalProps) {
  // Modal keyboard handling
  useModalHotkeys({
    isOpen: show,
    onClose,
  });

  // Source Choice: 'all' | 'qpay' | 'manual'
  const [sourceChoice, setSourceChoice] = useState<"all" | "qpay" | "manual">("all");

  // Building Filter: 'ALL' or specific building ID / code
  const [selectedBuilding, setSelectedBuilding] = useState<string>("ALL");

  // Date Range Filter: Default to current month or all
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Normalize building code helper (e.g. "Time tower 216" -> "216")
  const extractBuildingCode = (bldRaw?: string): string => {
    if (!bldRaw || bldRaw === "—" || bldRaw === "Байр") return "";
    const m = String(bldRaw).match(/(\d{1,4})/);
    if (m) return m[1];
    return String(bldRaw).trim();
  };

  // Available buildings for dropdown
  const availableBuildings = useMemo(() => {
    const list: { id: string; name: string; code: string }[] = [];
    const set = new Set<string>();

    if (Array.isArray(barilguud)) {
      barilguud.forEach((b: any) => {
        const id = String(b?._id || b?.id || "").trim();
        const n = String(b?.ner || b?.dugaar || "").trim();
        const code = extractBuildingCode(n);
        if (n && !set.has(n)) {
          set.add(n);
          list.push({ id, name: n, code: code || n });
        }
      });
    }

    if (Array.isArray(contracts)) {
      contracts.forEach((c: any) => {
        const n = String(c?.bairNer || c?.barilgiinId?.ner || "").trim();
        const code = extractBuildingCode(n);
        if (n && !set.has(n)) {
          set.add(n);
          list.push({ id: String(c?.barilgiinId || n), name: n, code: code || n });
        }
      });
    }

    return list;
  }, [barilguud, contracts]);

  // Extract and process paid records
  const processedRecords = useMemo(() => {
    const recordsMap = new Map<string, BankReconciliationRecord>();

    const startMs = startDate ? new Date(startDate + "T00:00:00").getTime() : 0;
    const endMs = endDate ? new Date(endDate + "T23:59:59").getTime() : Infinity;

    // Filter payments from historyItems
    (historyItems || []).forEach((it: any) => {
      // 1. Must be payment (turul === "tulult" or raw negative amount or positive tulsun)
      const turul = String(it?.turul || "").toLowerCase();
      const rawDun = Number(it?.dun ?? 0);
      const rawTulsun = Number(it?.tulsunDun ?? it?.tulsun ?? 0);

      const isPayment =
        turul === "tulult" ||
        turul === "төлөлт" ||
        rawDun < 0 ||
        rawTulsun > 0;

      if (!isPayment) return;

      // Skip discounts and initial balance setups
      if (it?.ekhniiUldegdelEsekh === true) return;
      if (turul === "khungulult" || turul === "хөнгөлөлт") return;

      // 2. Identify payment source: QPay vs Manual
      const tailbarLower = String(it?.tailbar || "").toLowerCase();
      const isQpay =
        tailbarLower.includes("qpay") ||
        it?.source === "qpay" ||
        it?.source === "nekhemjlekh" ||
        Boolean(it?.qpayId);

      const paymentType: "qpay" | "manual" = isQpay ? "qpay" : "manual";

      if (sourceChoice === "qpay" && !isQpay) return;
      if (sourceChoice === "manual" && isQpay) return;

      // 3. Date check
      const dateVal = it?.ognoo || it?.createdAt || it?.date;
      const d = dateVal ? new Date(dateVal) : new Date();
      const itemMs = !isNaN(d.getTime()) ? d.getTime() : 0;
      if (startDate && itemMs < startMs) return;
      if (endDate && itemMs > endMs) return;

      // 4. Resolve Contract & Apartment details
      const cId = String(it?._gereeniiId || it?.gereeniiId || it?.gereeId || "").trim();
      const contract =
        (cId && (contractsById as any)[cId]) ||
        (it?.gereeniiDugaar && (contractsByNumber as any)[String(it.gereeniiDugaar)]) ||
        null;

      const rawBuilding =
        contract?.bairNer ||
        contract?.barilgiinId?.ner ||
        contract?.barilga ||
        it?.bairNer ||
        it?.barilgiinNer ||
        baiguullaga?.ner ||
        "";

      const buildingCode = extractBuildingCode(rawBuilding) || "216";

      // Filter by building if selected
      if (selectedBuilding !== "ALL") {
        const selCode = extractBuildingCode(selectedBuilding);
        if (selCode && buildingCode !== selCode) return;
      }

      const rawToot = String(contract?.toot || it?.toot || "").trim();
      const toot = rawToot.replace(/\s*тоот$/i, "").replace(/^0+/, "") || rawToot;
      if (!toot || toot === "-" || toot === "—") return;

      const urkh = String(contract?.urkh || it?.urkh || "").trim();
      const korpus = String(contract?.korpus || it?.korpus || "").trim();
      const paidAmt = Math.abs(rawDun || rawTulsun);
      const residentName = contract?.ner
        ? `${contract.ovog ? contract.ovog.charAt(0) + "." : ""}${contract.ner}`
        : it?.orshinSuugchNer || "Оршин суугч";

      // 5. Extract target month and year
      // Check if description has explicit month periods (e.g. 2026/8 or 2025/10)
      const explicitMonths: { year: number; month: number }[] = [];

      // Match 202X/X or 202X.X or 202X-X
      const ymMatches = tailbarLower.matchAll(/\b(202\d)[\/.-](1[0-2]|0?[1-9])\b/g);
      for (const m of ymMatches) {
        explicitMonths.push({
          year: parseInt(m[1], 10),
          month: parseInt(m[2], 10),
        });
      }

      // If no explicit month in description, use the payment date
      if (explicitMonths.length === 0) {
        const yr = !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
        const mo = !isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1;
        explicitMonths.push({ year: yr, month: mo });
      }

      // 6. Generate records for each paid month
      explicitMonths.forEach(({ year, month }) => {
        const key = `${buildingCode}_${toot}_${urkh}_${year}_${month}`;

        if (recordsMap.has(key)) {
          // Add amount if duplicate payment in same period
          const existing = recordsMap.get(key)!;
          existing.dun += paidAmt;
        } else {
          recordsMap.set(key, {
            building: buildingCode,
            korpus,
            toot,
            urkh,
            on: year,
            sar: month,
            dun: paidAmt,
            residentName,
            paymentType,
            date: dateVal ? String(dateVal).slice(0, 10) : "",
            tailbar: it?.tailbar || "",
          });
        }
      });
    });

    // Sort rows naturally: Building -> Toot (numeric) -> Year -> Month
    return Array.from(recordsMap.values()).sort((a, b) => {
      // 1. Building code numeric sort
      const numBldA = parseInt(a.building, 10);
      const numBldB = parseInt(b.building, 10);
      if (!isNaN(numBldA) && !isNaN(numBldB) && numBldA !== numBldB) {
        return numBldA - numBldB;
      }
      if (a.building !== b.building) return a.building.localeCompare(b.building);

      // 2. Toot numeric sort (1, 2, 10, 92 instead of string sort)
      const numTootA = parseInt(a.toot, 10);
      const numTootB = parseInt(b.toot, 10);
      if (!isNaN(numTootA) && !isNaN(numTootB) && numTootA !== numTootB) {
        return numTootA - numTootB;
      }
      if (a.toot !== b.toot) return a.toot.localeCompare(b.toot);

      // 3. Year sort
      if (a.on !== b.on) return a.on - b.on;

      // 4. Month sort
      return a.sar - b.sar;
    });
  }, [historyItems, contractsById, contractsByNumber, sourceChoice, selectedBuilding, startDate, endDate, baiguullaga]);

  // Statistics
  const totalCount = processedRecords.length;
  const totalAmount = useMemo(() => {
    return processedRecords.reduce((sum, r) => sum + r.dun, 0);
  }, [processedRecords]);

  const uniqueHomesCount = useMemo(() => {
    const set = new Set(processedRecords.map((r) => `${r.building}-${r.toot}`));
    return set.size;
  }, [processedRecords]);

  // Export to Excel handler
  const handleExportExcel = async (format: "xlsx" | "csv" = "xlsx") => {
    if (processedRecords.length === 0) {
      toast.error("Экспорт хийх төлбөрийн бичлэг олдсонгүй");
      return;
    }

    try {
      setIsExporting(true);
      const XLSX = await import("xlsx");

      // EXACT HEADER FORMAT AS REQUIRED BY COMMERCIAL BANKS:
      const headerRow = [
        "Байрны код",
        "Корпус/Код/",
        "Хаалга",
        "Өрх",
        "Он",
        "Сар",
        " 1. Байр гэсэн дээр банкруу явуулдаг стандарт файл  дээрх байрныхаа дугаарыг шивнэ.",
      ];

      const dataRows = processedRecords.map((r) => [
        r.building,
        r.korpus,
        r.toot,
        r.urkh,
        r.on,
        r.sar,
        "",
      ]);

      const aoa = [headerRow, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Set column widths for readability
      ws["!cols"] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 70 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Банкны тулгалт");

      const sourceLabel =
        sourceChoice === "qpay" ? "QPAY" : sourceChoice === "manual" ? "TULULT" : "BUGD";
      const bldLabel = selectedBuilding !== "ALL" ? `_${extractBuildingCode(selectedBuilding)}` : "";
      const dateLabel = new Date().toISOString().slice(0, 10);
      const filename = `Банкны_тулгалт${bldLabel}_${sourceLabel}_${dateLabel}.${format}`;

      if (format === "csv") {
        XLSX.writeFile(wb, filename, { bookType: "csv" });
      } else {
        XLSX.writeFile(wb, filename);
      }

      toast.success(
        `Банкны тулгалтын файл амжилттай татагдлаа! (${processedRecords.length} мөр)`
      );
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Файл бэлтгэхэд алдаа гарлаа: " + (err?.message || ""));
    } finally {
      setIsExporting(false);
    }
  };

  if (!show) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/70 dark:bg-zinc-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                  Банкны тулгалт (Төлбөр хаалтын Excel бэлтгэх)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Манай систем дээр төлөгдсөн төлбөрүүдийг банкны системд илгээж нэхэмжлэлийг нь хаалгах
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Банкны системд нэхэмжлэх хаалгах тухай:</strong> Иргэд СӨХ-ийн төлбөрөө манай системээр (QPay эсвэл гараар бэлнээр/шилжүүлгээр) төлөх үед банкны апп (Хаан банк г.м.) дээр нэхэмжлэх нь нээлттэй үлдэж, давхар төлөлт үүсэх эрсдэлтэй байдаг. Энэхүү файлыг татаж аваад <strong>харилцагч банкандаа өгснөөр</strong> банк уг саруудын төлбөрийг өөрийн систем дээрээ <strong>"ТӨЛСӨН / ХААГДСАН"</strong> төлөвт оруулдаг.
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter 1: Payment Source (Choice: All / QPay / Manual) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  Төлбөрийн төрөл
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setSourceChoice("all")}
                    className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                      sourceChoice === "all"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    Бүгд
                  </button>
                  <button
                    onClick={() => setSourceChoice("qpay")}
                    className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                      sourceChoice === "qpay"
                        ? "bg-sky-600 text-white font-bold shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    Зөвхөн QPay
                  </button>
                  <button
                    onClick={() => setSourceChoice("manual")}
                    className={`py-1.5 px-2 rounded-lg text-center transition cursor-pointer ${
                      sourceChoice === "manual"
                        ? "bg-emerald-700 text-white font-bold shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                    }`}
                  >
                    Зөвхөн Төлөлт
                  </button>
                </div>
              </div>

              {/* Filter 2: Building Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  Байр сонгох
                </label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">Бүх байр (Бүх барилга)</option>
                  {availableBuildings.map((b) => (
                    <option key={b.id || b.name} value={b.code || b.name}>
                      {b.name} (Код: {b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Date Range */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Төлсөн огнооны хүрээ
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-1/2 h-9 px-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    placeholder="Эхлэх"
                  />
                  <span className="text-zinc-400 text-xs">—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-1/2 h-9 px-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
                    placeholder="Дуусах"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                  Олдсон бичлэг: <strong className="text-zinc-900 dark:text-white">{totalCount}</strong> мөр
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                  Хамрагдсан айл: <strong className="text-zinc-900 dark:text-white">{uniqueHomesCount}</strong> өрх
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                  Нийт дүн: {totalAmount.toLocaleString()} ₮
                </span>
              </div>

              {(startDate || endDate || selectedBuilding !== "ALL") && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedBuilding("ALL");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                >
                  Шүүлтүүр цэвэрлэх
                </button>
              )}
            </div>
          </div>

          {/* Table Preview Area */}
          <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[380px]">
            {processedRecords.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                <Filter className="w-8 h-8 mb-2 text-zinc-300 dark:text-zinc-600" />
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Сонгосон нөхцөлд тохирох төлбөрийн бичлэг олдсонгүй
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 max-w-[280px]">
                  Төлбөрийн төрөл, байр эсвэл огнооны шүүлтүүрээ өөрчилж шалгана уу
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700 font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">№</th>
                    <th className="py-2.5 px-3">Байрны код</th>
                    <th className="py-2.5 px-3">Хаалга (Тоот)</th>
                    <th className="py-2.5 px-3">Өрх</th>
                    <th className="py-2.5 px-3 text-center">Он</th>
                    <th className="py-2.5 px-3 text-center">Сар</th>
                    <th className="py-2.5 px-3 text-right">Төлсөн дүн</th>
                    <th className="py-2.5 px-3">Оршин суугч</th>
                    <th className="py-2.5 px-3">Хэлбэр</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                  {processedRecords.map((r, idx) => (
                    <tr
                      key={`${r.building}-${r.toot}-${r.on}-${r.sar}-${idx}`}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition"
                    >
                      <td className="py-2 px-3 text-center text-zinc-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-bold text-zinc-900 dark:text-white">
                        {r.building}
                      </td>
                      <td className="py-2 px-3 font-semibold text-emerald-800 dark:text-emerald-400">
                        {r.toot} тоот
                      </td>
                      <td className="py-2 px-3 text-zinc-400">{r.urkh || "—"}</td>
                      <td className="py-2 px-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                        {r.on}
                      </td>
                      <td className="py-2 px-3 text-center tabular-nums font-bold text-zinc-900 dark:text-white">
                        {r.sar}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-white">
                        {r.dun.toLocaleString()} ₮
                      </td>
                      <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                        {r.residentName}
                      </td>
                      <td className="py-2 px-3">
                        {r.paymentType === "qpay" ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            QPay
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Төлөлт
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between shrink-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Хаан банк болон бусад банкны нэхэмжлэх хаалтын стандартад 100% нийцсэн файл</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Хаах
              </button>

              <button
                onClick={() => handleExportExcel("csv")}
                disabled={processedRecords.length === 0 || isExporting}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                title="CSV форматаар татах"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>CSV татах</span>
              </button>

              <button
                onClick={() => handleExportExcel("xlsx")}
                disabled={processedRecords.length === 0 || isExporting}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? "Бэлтгэж байна..." : "Банкны тулгалт (Excel) татах"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
}

