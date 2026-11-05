"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    const initialMonths: { [monthKey: string]: number } = {};
    if (
      bank.allocation &&
      bank.allocation.months &&
      Object.keys(bank.allocation.months).length > 0
    ) {
      Object.assign(initialMonths, bank.allocation.months);
    } else if (Array.isArray(bank.targetMonths) && bank.targetMonths.length > 0) {
      bank.targetMonths.forEach((tm) => {
        initialMonths[tm] = baseAmt;
      });
    } else {
      const numMonths = Math.max(
        1,
        Math.min(12, Math.floor(bank.amount / baseAmt))
      );
      for (let i = 1; i <= numMonths; i++) {
        const key = `${yr}.${String(i).padStart(2, "0")}`;
        initialMonths[key] = baseAmt;
      }
    }
    setMonths(initialMonths);
  }, [isOpen, bank, home]);

  if (!isOpen || !bank) return null;

  const totalAllocated = Object.values(months).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );
  const remaining = bank.amount - totalAllocated;
  const isOverAllocated = totalAllocated > bank.amount;
  const allKeys = Array.from(
    { length: 12 },
    (_, i) => `${year}.${String(i + 1).padStart(2, "0")}`
  );
  const allSelected = allKeys.every((k) => (months[k] || 0) > 0);
  const maxCoverMonths = Math.min(
    12,
    Math.floor(bank.amount / (baseAmount || 1))
  );

  const formatBuildingShort = (bldg?: string) => {
    if (!bldg) return "Байр тодорхойгүй";
    return String(bldg).replace(/^Байр\s*/i, "").replace(/-р\s*байр/i, "") + "-р байр";
  };

  const autoAllocateByCount = (count: number) => {
    const nextMonths: { [k: string]: number } = {};
    const cnt = Math.max(1, Math.min(12, count));
    for (let m = 1; m <= cnt; m++) {
      const key = `${year}.${String(m).padStart(2, "0")}`;
      nextMonths[key] = baseAmount;
    }
    setMonths(nextMonths);
  };

  const handleToggleAllMonths = () => {
    if (allSelected) {
      setMonths({});
    } else {
      const nextMonths: { [k: string]: number } = {};
      allKeys.forEach((k) => {
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
    <div className="fixed inset-0 z-[12020] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/40 shadow-xs">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                Төлбөр хуваарилалт
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Өндөр дүнтэй төлөлтийг ашиглалтын зардлаар саруудаа хуваарилах
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Хаах"
            title="Хаах"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Apartment & Resident Info Card */}
          <div className="p-4 rounded-2xl bg-[#f0f7ff] dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            {/* Left: Building icon + details */}
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="p-3.5 rounded-2xl bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                  {home?.unit ? `${home.unit} тоот` : "Тоотгүй"} — {formatBuildingShort(home?.building)} — {home?.name || "Оршин суугч"}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Гүйцэтгэлийн утга:
                </div>
                <div
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate max-w-sm sm:max-w-md mt-0.5"
                  title={bank.description}
                >
                  {bank.description}
                </div>
              </div>
            </div>

            {/* Right: Transaction amount badge & monthly rate */}
            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Гүйлгээ: {formatNumber(bank.amount)} ₮</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-2xs">
                  <Wallet className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    Сарын тогтмол төлбөр
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    (Ашиглалтын зардал):
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
                      className="w-20 px-1 py-0.5 text-left sm:text-right text-sm font-extrabold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none tabular-nums"
                      title="Дарж сарын суурь дүнг өөрчлөх боломжтой"
                    />
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      ₮ / сар
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-zinc-500 font-medium">Он:</span>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none pr-1"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-zinc-800">
                      {y} он
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => autoAllocateByCount(maxCoverMonths)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                Бүх дүнгээр ({maxCoverMonths} сар)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 3, 6, 9, 12].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => autoAllocateByCount(cnt)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer shadow-2xs transition"
                >
                  {cnt} сар
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMonths({})}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer transition flex items-center gap-1 border border-transparent hover:border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Цэвэрлэх
              </button>
            </div>
          </div>

          {/* Section: ТӨЛБӨР ХУВААРИЛАЛТ Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAllMonths}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Төлбөр хуваарилалт
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Сар тус бүрийн төлөх дүнг засах боломжтой</span>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-72 overflow-y-auto">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const monthKey = `${year}.${String(m).padStart(2, "0")}`;
                const isAllocated = Boolean(months[monthKey] > 0);
                const currentVal = months[monthKey] || 0;
                const uldegdel = Math.max(0, baseAmount - currentVal);

                return (
                  <div
                    key={monthKey}
                    className={`px-5 py-3 transition-colors flex items-center justify-between gap-4 ${isAllocated
                        ? "bg-blue-50/20 dark:bg-blue-950/15"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isAllocated}
                        onChange={(e) => handleToggleMonth(monthKey, e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {year}-{String(m).padStart(2, "0")} (Сарын нийт)
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-2">
                          <span>
                            Хуримтлагдсан өр:{" "}
                            <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                              {formatNumber(baseAmount)} ₮
                            </strong>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">|</span>
                          <span>
                            Төлөх:{" "}
                            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatNumber(currentVal)} ₮
                            </strong>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-600">|</span>
                          <span>
                            Үлдэгдэл:{" "}
                            <strong
                              className={
                                uldegdel > 0
                                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-emerald-600 font-semibold"
                              }
                            >
                              {formatNumber(uldegdel)} ₮
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Төлөх дүн:
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={currentVal || ""}
                          placeholder="0"
                          onChange={(e) =>
                            handleAmountChange(monthKey, parseFloat(e.target.value) || 0)
                          }
                          className="w-28 pl-2 pr-6 py-1.5 text-right text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums shadow-2xs"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 pointer-events-none">
                          ₮
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAmountChange(monthKey, baseAmount)}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Суурь төлбөрөөр автоматаар дүүргэх"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        Дүүргэх
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Over-allocation warning banner */}
          {isOverAllocated && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Анхааруулга:</strong> Хуваарилсан дүн ({formatNumber(totalAllocated)} ₮) гүйлгээний орлогоос ({formatNumber(bank.amount)} ₮) давсан байна ({formatNumber(totalAllocated - bank.amount)} ₮ илүү)!
              </span>
            </div>
          )}

          {/* Bottom Summary Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-50/80 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs">
                <Calculator className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Холбосон дүн:
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                  {formatNumber(totalAllocated)} ₮
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shadow-2xs">
                <Coins className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Холбоогүй дүн:
                </span>
                <span
                  className={`text-2xl font-black tabular-nums tracking-tight ${remaining > 0
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

        {/* Footer Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-7 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Төлбөрийн хуваарилалт нь ашиглалтын зардалд үндэслэн хийгдэнэ.</span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
            >
              Хаах
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-7 py-2.5 rounded-xl bg-[#087f64] hover:bg-[#066a53] text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.8]" />
              Хадгалах
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

