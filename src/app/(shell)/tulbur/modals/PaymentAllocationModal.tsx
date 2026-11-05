"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Check,
  Building2,
  Zap,
  Layers,
  Wallet,
  RotateCcw,
  Calculator,
  Coins,
  Info,
  Calendar,
  AlertTriangle,
  Plus,
} from "lucide-react";
import formatNumber from "../../../../../tools/function/formatNumber";
import type { BankRow, HomeRow } from "./BankStatementImportModal";

export interface PaymentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: BankRow | null;
  home: HomeRow | null;
  onSave: (
    bankId: number,
    targetMonths: string[],
    targetPeriod: string,
    allocation: {
      months: { [monthKey: string]: number };
      totalAllocated: number;
      remaining: number;
    }
  ) => void;
}

/**
 * Determine dynamic start and end months
 * E.g. If first invoice started at 10 and current month is 11,
 * only show [10, 11] by default, never showing 1..9 or future 12.
 */
function getDynamicMonthBounds(
  bank: BankRow | null,
  home: HomeRow | null,
  targetYear: number
): { startM: number; endM: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  let startM = 1;
  let detectedStart = false;

  // 1. From home ekhlekhOgnoo
  if (home?.ekhlekhOgnoo) {
    const d = new Date(home.ekhlekhOgnoo);
    if (!isNaN(d.getTime())) {
      startM = d.getMonth() + 1;
      detectedStart = true;
    }
  }

  // 2. From home month (e.g. "2026-10" or "10")
  if (!detectedStart && home?.month) {
    const m = String(home.month).match(/(?:202\d[.\/-])?(\d{1,2})/);
    if (m && m[1]) {
      const parsed = parseInt(m[1], 10);
      if (parsed >= 1 && parsed <= 12) {
        startM = parsed;
        detectedStart = true;
      }
    }
  }

  // 3. From bank targetMonths (e.g. ["2026.10"])
  if (!detectedStart && Array.isArray(bank?.targetMonths) && bank.targetMonths.length > 0) {
    const parsed = bank.targetMonths
      .map((tm) => {
        const parts = tm.split(/[.\/-]/);
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((n) => !isNaN(n) && n >= 1 && n <= 12);
    if (parsed.length > 0) {
      startM = Math.min(...parsed);
      detectedStart = true;
    }
  }

  // 4. From bank description (e.g. "2026/10", "2026-10", "10 sar")
  if (!detectedStart && bank?.description) {
    const descM =
      bank.description.match(/(?:202\d[.\/-])?([1-9]|1[0-2])\s*(?:сар|sar)\b/i) ||
      bank.description.match(/(?:202\d[.\/-])(0?[1-9]|1[0-2])\b/);
    if (descM && descM[1]) {
      const parsed = parseInt(descM[1], 10);
      if (parsed >= 1 && parsed <= 12) {
        startM = parsed;
        detectedStart = true;
      }
    }
  }

  // 5. From bank date (e.g. "2026.10.01" -> 10)
  if (!detectedStart && bank?.date) {
    const parts = bank.date.split(/[.\/-]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        startM = m;
        detectedStart = true;
      }
    }
  }

  // If still not detected, fallback to current month
  if (!detectedStart) {
    startM = currentMonth;
  }

  // End month: do not show future months past current month for current or future years
  let endM = 12;
  if (targetYear >= currentYear) {
    endM = currentMonth;
  }

  startM = Math.max(1, Math.min(12, startM));
  endM = Math.max(startM, Math.min(12, endM));

  return { startM, endM };
}

export function PaymentAllocationModal({
  isOpen,
  onClose,
  bank,
  home,
  onSave,
}: PaymentAllocationModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [baseAmount, setBaseAmount] = useState<number>(48600);
  const [months, setMonths] = useState<{ [monthKey: string]: number }>({});
  const [extraMonths, setExtraMonths] = useState<number[]>([]);

  // Initialize state whenever modal opens or bank/home changes
  useEffect(() => {
    if (!isOpen || !bank) return;

    let yr = new Date().getFullYear();
    const dateMatch = String(bank.rawDate || bank.date || "").match(/^(\d{4})/);
    if (dateMatch) {
      yr = parseInt(dateMatch[1], 10);
    } else if (bank.month) {
      const ym = bank.month.match(/^(\d{4})/);
      if (ym) yr = parseInt(ym[1], 10);
    }
    setYear(yr);

    const baseAmt =
      home && Number(home.amount || 0) > 0 ? Number(home.amount) : 48600;
    setBaseAmount(baseAmt);

    const { startM } = getDynamicMonthBounds(bank, home, yr);
    const initialMonths: { [monthKey: string]: number } = {};
    const extras: number[] = [];

    if (
      bank.allocation &&
      bank.allocation.months &&
      Object.keys(bank.allocation.months).length > 0
    ) {
      Object.assign(initialMonths, bank.allocation.months);
      Object.keys(bank.allocation.months).forEach((k) => {
        const parts = k.split(".");
        if (parts[0] === String(yr)) {
          const m = parseInt(parts[1], 10);
          if (!isNaN(m)) extras.push(m);
        }
      });
    } else if (Array.isArray(bank.targetMonths) && bank.targetMonths.length > 0) {
      bank.targetMonths.forEach((tm) => {
        initialMonths[tm] = baseAmt;
        const parts = tm.split(/[.\/-]/);
        const m = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(m)) extras.push(m);
      });
    } else {
      // Allocate sequentially starting from startM
      const numMonths = Math.max(
        1,
        Math.min(12, Math.floor(bank.amount / baseAmt))
      );
      for (let i = 0; i < numMonths; i++) {
        const m = startM + i;
        if (m > 12) break;
        const key = `${yr}.${String(m).padStart(2, "0")}`;
        initialMonths[key] = baseAmt;
        extras.push(m);
      }
    }

    setMonths(initialMonths);
    setExtraMonths(extras);
  }, [isOpen, bank, home]);

  // Compute dynamic visible month numbers
  const { startM, endM } = useMemo(() => {
    return getDynamicMonthBounds(bank, home, year);
  }, [bank, home, year]);

  const visibleMonthNumbers = useMemo(() => {
    const list = new Set<number>();
    for (let m = startM; m <= endM; m++) {
      list.add(m);
    }
    // Include any months present in state
    Object.keys(months).forEach((k) => {
      const parts = k.split(".");
      if (parts[0] === String(year)) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) list.add(m);
      }
    });
    // Include user-added extra months
    extraMonths.forEach((m) => {
      if (m >= 1 && m <= 12) list.add(m);
    });

    return Array.from(list).sort((a, b) => a - b);
  }, [startM, endM, year, months, extraMonths]);

  if (!isOpen || !bank) return null;

  const totalAllocated = Object.values(months).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );
  const remaining = bank.amount - totalAllocated;
  const isOverAllocated = totalAllocated > bank.amount;

  const allVisibleKeys = visibleMonthNumbers.map(
    (m) => `${year}.${String(m).padStart(2, "0")}`
  );
  const allSelected =
    allVisibleKeys.length > 0 &&
    allVisibleKeys.every((k) => (months[k] || 0) > 0);

  const maxCoverMonths = Math.min(
    12,
    Math.floor(bank.amount / (baseAmount || 1))
  );

  const formatBuildingShort = (bldg?: string) => {
    if (!bldg) return "Байр тодорхойгүй";
    return (
      String(bldg).replace(/^Байр\s*/i, "").replace(/-р\s*байр/i, "") + "-р байр"
    );
  };

  const autoAllocateByCount = (count: number) => {
    const nextMonths: { [k: string]: number } = {};
    const cnt = Math.max(1, count);
    const addedExtras: number[] = [];

    for (let i = 0; i < cnt; i++) {
      const m = startM + i;
      if (m > 12) break;
      const key = `${year}.${String(m).padStart(2, "0")}`;
      nextMonths[key] = baseAmount;
      if (m > endM) {
        addedExtras.push(m);
      }
    }
    if (addedExtras.length > 0) {
      setExtraMonths((prev) => Array.from(new Set([...prev, ...addedExtras])));
    }
    setMonths(nextMonths);
  };

  const handleToggleAllMonths = () => {
    if (allSelected) {
      setMonths({});
    } else {
      const nextMonths: { [k: string]: number } = {};
      allVisibleKeys.forEach((k) => {
        nextMonths[k] = baseAmount;
      });
      setMonths(nextMonths);
    }
  };

  const handleToggleMonth = (monthKey: string, checked: boolean) => {
    setMonths((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[monthKey] = baseAmount;
      } else {
        delete updated[monthKey];
      }
      return updated;
    });
  };

  const handleAmountChange = (monthKey: string, val: number) => {
    setMonths((prev) => {
      const updated = { ...prev };
      if (val > 0) {
        updated[monthKey] = val;
      } else {
        delete updated[monthKey];
      }
      return updated;
    });
  };

  const handleAddNextMonth = () => {
    const currentMax =
      visibleMonthNumbers.length > 0
        ? visibleMonthNumbers[visibleMonthNumbers.length - 1]
        : endM;
    const nextM = currentMax + 1;
    if (nextM <= 12) {
      setExtraMonths((prev) => Array.from(new Set([...prev, nextM])));
      const nextKey = `${year}.${String(nextM).padStart(2, "0")}`;
      setMonths((prev) => ({ ...prev, [nextKey]: baseAmount }));
    }
  };

  const handleSave = () => {
    const activeEntries = Object.entries(months)
      .filter(([_, amt]) => Number(amt) > 0)
      .sort(([a], [b]) => a.localeCompare(b));

    const monthKeys = activeEntries.map(([k]) => k);
    let periodStr = bank.targetPeriod || "";
    if (monthKeys.length > 0) {
      const firstM = parseInt(monthKeys[0].split(".")[1], 10);
      const lastM = parseInt(monthKeys[monthKeys.length - 1].split(".")[1], 10);
      const yr = monthKeys[0].split(".")[0];
      if (monthKeys.length === 1) {
        periodStr = `${yr}/${firstM} (1 сар)`;
      } else if (lastM - firstM + 1 === monthKeys.length) {
        periodStr = `${yr}/${firstM}-${lastM} (${monthKeys.length} сар)`;
      } else {
        periodStr = `${yr} оны ${monthKeys.length} сар`;
      }
    }

    onSave(bank.id, monthKeys, periodStr, {
      months,
      totalAllocated,
      remaining,
    });
  };

  return (
    <div className="fixed inset-0 z-[12020] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header - No bolds */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/40">
              <Layers className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                Төлбөр хуваарилалт
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
                Өндөр дүнтэй төлөлтийг ашиглалтын зардлаар саруудаа хуваарилах
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Хаах"
            title="Хаах"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Apartment & Resident Info Card - No bolds */}
          <div className="p-4 rounded-xl bg-[#f0f7ff] dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            {/* Left: Building icon + details */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {home?.unit ? `${home.unit} тоот` : "Тоотгүй"} — {formatBuildingShort(home?.building)} — {home?.name || "Оршин суугч"}
                </div>
                <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                  Гүйлгээний утга:
                </div>
                <div
                  className="text-xs font-normal text-zinc-600 dark:text-zinc-300 truncate max-w-sm sm:max-w-md mt-0.5"
                  title={bank.description}
                >
                  {bank.description}
                </div>
              </div>
            </div>

            {/* Right: Transaction amount badge & monthly rate - No bolds */}
            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium text-xs">
                <Check className="w-3.5 h-3.5 stroke-[2]" />
                <span>Гүйлгээ: {formatNumber(bank.amount)} ₮</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Wallet className="w-3.5 h-3.5 stroke-[1.8]" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight">
                    Сарын тогтмол төлбөр (Ашиглалт):
                  </div>
                  <div className="flex items-center justify-start sm:justify-end gap-1 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      value={baseAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBaseAmount(val);
                      }}
                      className="w-20 px-1 py-0.5 text-left sm:text-right text-xs font-medium text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none tabular-nums"
                      title="Дарж сарын суурь дүнг өөрчлөх боломжтой"
                    />
                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      ₮ / сар
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Helpers - No bolds */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-zinc-500 font-normal">Он:</span>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none pr-1"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-zinc-800 font-normal">
                      {y} он
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => autoAllocateByCount(maxCoverMonths)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                <Zap className="w-3 h-3 fill-white" />
                Бүх дүнгээр ({maxCoverMonths} сар)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 6].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => autoAllocateByCount(cnt)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-normal cursor-pointer transition"
                >
                  {cnt} сар
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMonths({})}
                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-normal cursor-pointer transition flex items-center gap-1 border border-transparent hover:border-rose-200"
              >
                <RotateCcw className="w-3 h-3" />
                Цэвэрлэх
              </button>
            </div>
          </div>

          {/* Section: Dynamic Months Table - No bolds, only shows active range */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAllMonths}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  Төлбөр хуваарилах сарууд ({visibleMonthNumbers.length} сар)
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Дүнг засах боломжтой</span>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto">
              {visibleMonthNumbers.map((m) => {
                const monthKey = `${year}.${String(m).padStart(2, "0")}`;
                const isAllocated = Boolean((months[monthKey] || 0) > 0);
                const currentVal = months[monthKey] || 0;
                const uldegdel = Math.max(0, baseAmount - currentVal);

                return (
                  <div
                    key={monthKey}
                    className={`px-4 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                      isAllocated
                        ? "bg-blue-50/20 dark:bg-blue-950/15"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isAllocated}
                        onChange={(e) =>
                          handleToggleMonth(monthKey, e.target.checked)
                        }
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {year}-{String(m).padStart(2, "0")} (Сарын нийт)
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-2 font-normal">
                          <span>
                            Суурь өр:{" "}
                            <span className="text-zinc-700 dark:text-zinc-300 font-normal">
                              {formatNumber(baseAmount)} ₮
                            </span>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">
                            |
                          </span>
                          <span>
                            Төлөх:{" "}
                            <span className="text-emerald-600 dark:text-emerald-400 font-normal">
                              {formatNumber(currentVal)} ₮
                            </span>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">
                            |
                          </span>
                          <span>
                            Үлдэгдэл:{" "}
                            <span
                              className={
                                uldegdel > 0
                                  ? "text-rose-600 dark:text-rose-400 font-normal"
                                  : "text-emerald-600 font-normal"
                              }
                            >
                              {formatNumber(uldegdel)} ₮
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        Төлөх дүн:
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={currentVal || ""}
                          placeholder="0"
                          onChange={(e) =>
                            handleAmountChange(
                              monthKey,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 pl-2 pr-5 py-1 text-right text-xs font-normal text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums shadow-2xs"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-normal text-zinc-400 pointer-events-none">
                          ₮
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAmountChange(monthKey, baseAmount)}
                        className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-normal text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Суурь төлбөрөөр автоматаар дүүргэх"
                      >
                        <Calculator className="w-3 h-3" />
                        Дүүргэх
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional: Add Next Month Button */}
            {visibleMonthNumbers.length > 0 &&
              visibleMonthNumbers[visibleMonthNumbers.length - 1] < 12 && (
                <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-center">
                  <button
                    type="button"
                    onClick={handleAddNextMonth}
                    className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-normal text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Дараагийн сар нэмэх (
                    {visibleMonthNumbers[visibleMonthNumbers.length - 1] + 1}-р сар)
                  </button>
                </div>
              )}
          </div>

          {/* Over-allocation warning banner */}
          {isOverAllocated && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 font-normal">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Анхааруулга: Хуваарилсан дүн ({formatNumber(totalAllocated)} ₮)
                гүйлгээний орлогоос ({formatNumber(bank.amount)} ₮) давсан байна (
                {formatNumber(totalAllocated - bank.amount)} ₮ илүү)!
              </span>
            </div>
          )}

          {/* Bottom Summary Bar - No heavy bolds */}
          <div className="flex items-center justify-between px-5 py-3 bg-zinc-50/80 dark:bg-zinc-950/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Calculator className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Холбосон дүн:
                </span>
                <span className="text-base font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatNumber(totalAllocated)} ₮
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <Coins className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Холбоогүй дүн:
                </span>
                <span
                  className={`text-base font-medium tabular-nums ${
                    remaining > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {formatNumber(Math.max(0, remaining))} ₮
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar - No heavy bolds */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-6 py-3.5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Төлбөрийн хуваарилалт нь ашиглалтын зардалд үндэслэнэ.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-normal text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Хаах
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-[#087f64] hover:bg-[#066a53] text-white font-medium text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
              Хадгалах
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
