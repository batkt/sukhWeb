"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import Button from "@/components/ui/Button";

interface TransactionModalProps {
  show: boolean;
  onClose: () => void;
  resident?: any;
  onSubmit: (data: TransactionData) => Promise<void>;
  isProcessing?: boolean;
  /** For electricity (цахилгаан) auto-calc: org and building */
  token?: string;
  baiguullagiinId?: string;
  barilgiinId?: string | null;
}

export interface TransactionData {
  type: "voucher" | "avlaga" | "turul" | "ashiglalt" | "tulult";
  date: string;
  amount: number;
  residentId?: string;
  gereeniiId?: string;
  tailbar?: string;
  ekhniiUldegdel: boolean;
}

export default function TransactionModal({
  show,
  onClose,
  resident,
  onSubmit,
  isProcessing = false,
  token,
  baiguullagiinId,
  barilgiinId,
}: TransactionModalProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [transactionType, setTransactionType] = useState<TransactionData["type"]>("avlaga");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("0.00");
  const [tailbar, setTailbar] = useState("");
  const [ekhniiUldegdel, setEkhniiUldegdel] = useState(false);
  const [lastShow, setLastShow] = useState(false);

  // Ашиглалтын зардал (цахилгаан кВт) – additional fields when type === "ashiglalt"
  const [ashiglaltZardal, setAshiglaltZardal] = useState<"" | "tsakhilgaan_kv">("");
  const [umnukhZaalt, setUmnukhZaalt] = useState("");
  const [suuliinZaalt, setSuuliinZaalt] = useState("");
  const [showUsageOnInvoice, setShowUsageOnInvoice] = useState(true);
  const [includeSuuriKhuraamj, setIncludeSuuriKhuraamj] = useState(true);
  const [isCalculatingTsakhilgaan, setIsCalculatingTsakhilgaan] = useState(false);
  const [calcBreakdown, setCalcBreakdown] = useState<{
    usageAmount: number;
    suuriKhuraamj: number;
    zoruu: number;
    selectedCharge?: string;
  } | null>(null);
  const [residentBalance, setResidentBalance] = useState<number | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [isFetchingLatest, setIsFetchingLatest] = useState(false);

  // Determine if umnukhZaalt is editable (if initial value is 0 or undefined)
  const initialUmnukhVal = resident?.umnukhZaalt ?? resident?.suuliinZaalt;
  const isUmnukhEditable = !initialUmnukhVal || Number(initialUmnukhVal) === 0;

  const formatAmount = (val: number | string): string => {
    const num = typeof val === "string" ? parseFloat(String(val).replace(/,/g, "")) : val;
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const resetForm = () => {
    setTransactionType("avlaga");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setAmount("0.00");
    setTailbar("");
    setEkhniiUldegdel(false);
    setAshiglaltZardal("");
    setUmnukhZaalt("");
    setSuuliinZaalt("");
    setShowUsageOnInvoice(true);
    setIncludeSuuriKhuraamj(true);
    setCalcBreakdown(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchLatestZaalt = async () => {
    if (!resident || !show || transactionType !== "ashiglalt" || ashiglaltZardal !== "tsakhilgaan_kv") return;
    
    setIsFetchingLatest(true);
    try {
      console.log("[LATEST] Fetching latest reading for:", resident._id);
      const res = await uilchilgee(token!).get("/latestZaaltAvya", {
        params: {
          baiguullagiinId,
          residentId: resident._id,
          gereeniiId: resident.gereeniiId,
          gereeniiDugaar: resident.gereeniiDugaar
        }
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        console.log("[LATEST] Found:", d);
        // Pre-fill both to show the current state/calculation immediately
        if (d.umnukhZaalt != null) setUmnukhZaalt(String(d.umnukhZaalt));
        if (d.suuliinZaalt != null) setSuuliinZaalt(String(d.suuliinZaalt));
      }
    } catch (error) {
      console.error("[LATEST] Error fetching readings:", error);
    } finally {
      setIsFetchingLatest(false);
    }
  };

  React.useEffect(() => {
    if (show && !lastShow) {
      resetForm();
    }
    setLastShow(show);
  }, [show, lastShow]);

  React.useEffect(() => {
    if (show && transactionType === "ashiglalt" && ashiglaltZardal === "tsakhilgaan_kv") {
      fetchLatestZaalt();
    }
  }, [show, transactionType, ashiglaltZardal, resident?._id]);

  useModalHotkeys({
    isOpen: show,
    onClose: handleClose,
    container: modalRef.current,
  });

  const handleTsakhilgaanTootsool = async () => {
    if (!token || !baiguullagiinId) {
      messageApi.warning("Тооцоолох бол байгууллага сонгогдсон байх шаардлагатай.");
      return;
    }
    const u = parseFloat(String(umnukhZaalt).replace(/,/g, ""));
    const s = parseFloat(String(suuliinZaalt).replace(/,/g, ""));
    if (Number.isNaN(u) || Number.isNaN(s)) {
      messageApi.warning("Өмнөх заалт болон Сүүлийн заалт оруулна уу.");
      return;
    }
    const payload = {
      baiguullagiinId,
      barilgiinId: barilgiinId || undefined,
      residentId: resident?._id,
      gereeniiId: resident?.gereeniiId,
      umnukhZaalt: String(umnukhZaalt).replace(/,/g, ""),
      suuliinZaalt: String(suuliinZaalt).replace(/,/g, ""),
      includeSuuriKhuraamj,
    };

    setIsCalculatingTsakhilgaan(true);
    try {
      console.log("[CALC] Sending request:", payload);
      const res = await uilchilgee(token).post<{
        success: boolean;
        niitDun?: number;
        usageAmount?: number;
        suuriKhuraamj?: number;
        tailbar?: string;
        odorZaaltNum?: number;
        shonoZaaltNum?: number;
        suuliinZaaltNum?: number;
        zoruu?: number;
        selectedCharge?: string;
      }>("/tsakhilgaanTootsool", payload);

      if (res.data?.success && typeof res.data.niitDun === "number") {
        console.log("[CALC] Received response:", res.data);
        setAmount(formatAmount(res.data.niitDun));
        
        // Save breakdown for UI display
        setCalcBreakdown({
          usageAmount: res.data.usageAmount ?? (res.data.niitDun - (res.data.suuriKhuraamj || 0)),
          suuriKhuraamj: res.data.suuriKhuraamj || 0,
          zoruu: res.data.zoruu || 0,
          selectedCharge: res.data.selectedCharge,
        });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Тооцоолол амжилтгүй.";
      messageApi.error(msg);
    } finally {
      setIsCalculatingTsakhilgaan(false);
    }
  };

  const fetchBalance = async () => {
    if (!token || !resident?._id) return;
    setIsFetchingBalance(true);
    try {
      const resp = await uilchilgee(token).get(`/orshinSuugch/${resident._id}`, {
        params: { baiguullagiinId }
      });
      const data = resp.data;
      if (data) {
        setResidentBalance(Number(data.uldegdel ?? 0));
        messageApi.success("Үлдэгдэл шинэчлэгдлээ.");
      }
    } catch (e: any) {
      console.error("Balance fetch failed", e);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const fillAmountWithBalance = () => {
    if (residentBalance !== null && (transactionType === "tulult" || transactionType === "avlaga")) {
      const amountToFill = Math.max(0, residentBalance);
      setAmount(formatAmount(amountToFill));
    }
  };

  React.useEffect(() => {
    if (show && resident) {
      const bal = Number(resident.uldegdel ?? 0);
      setResidentBalance(bal);
    }
  }, [show, resident]);

  // Auto-calculate when user finishes typing or changes toggles
  React.useEffect(() => {
    if (
      show &&
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      umnukhZaalt &&
      suuliinZaalt
    ) {
      const timer = setTimeout(() => {
        handleTsakhilgaanTootsool();
      }, 600); // Debounce to prevent glitching while typing
      return () => clearTimeout(timer);
    }
  }, [includeSuuriKhuraamj, transactionType, ashiglaltZardal, umnukhZaalt, suuliinZaalt, show]);

  const handleSubmit = async () => {
    // Build tailbar including optional ashiglalt (electricity) details
    let finalTailbar = tailbar;
    if (
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      showUsageOnInvoice
    ) {
      const parts: string[] = [];
      if (umnukhZaalt.trim()) {
        parts.push(`Өмнөх заалт: ${umnukhZaalt.trim()}`);
      }
      if (suuliinZaalt.trim()) {
        parts.push(`Нийт (одоо): ${suuliinZaalt.trim()}`);
      }
      const usageText = parts.join(", ");
      if (usageText) {
        finalTailbar = finalTailbar
          ? `${finalTailbar} | ${usageText}`
          : usageText;
      }
    }

    // If it's an initial balance, format the tailbar as requested
    if (ekhniiUldegdel) {
      const dateStr = transactionDate.replace(/-/g, ".");
      const prefix = "Эхний үлдэгдэл";
      if (finalTailbar) {
        // Only prepend if not already there to avoid duplicates
        if (!finalTailbar.startsWith(prefix)) {
          finalTailbar = `${prefix} - ${finalTailbar} - ${dateStr}`;
        } else if (!finalTailbar.includes(dateStr)) {
          // If prefix exists but date doesn't (maybe manually typed prefix), still append date
          finalTailbar = `${finalTailbar} - ${dateStr}`;
        }
      } else {
        finalTailbar = `${prefix} - ${dateStr}`;
      }
    }

    const data: TransactionData = {
      type: transactionType,
      date: transactionDate,
      amount: parseFloat(amount.replace(/,/g, "")) || 0,
      residentId: resident?._id,
      gereeniiId: resident?.gereeniiId,
      tailbar: finalTailbar,
      ekhniiUldegdel,
    };

    await onSubmit(data);
    resetForm();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        {contextHolder}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative modal-surface rounded-2xl shadow-2xl w-[700px] h-[70vh] flex flex-col border border-[color:var(--surface-border)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Body */}
          <div className="flex-1 px-6 py-5 space-y-5 bg-[color:var(--surface-bg)] overflow-y-auto">

            {/* Resident Info Card */}
            {resident && (
              <div className="bg-[color:var(--surface-hover)]/50 rounded-2xl p-3 border border-[color:var(--surface-border)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[color:var(--theme)]/10 flex items-center justify-center text-[color:var(--theme)]  text-sm">
                  {resident?.toot || "?"}
                </div>
                <div>
                  <p className="text-sm  text-[color:var(--panel-text)]">
                    {resident?.ovog || ""} {resident?.ner}
                  </p>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Оршин суугч
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Type Segmented Control */}
            <div>
              <label className="block text-xs  text-[color:var(--panel-text)] mb-1.5">
                Гүйлгээний төрөл
              </label>
              <div className="grid grid-cols-3 neu-panel gap-1 p-1 bg-[color:var(--surface-hover)] rounded-2xl">
                {[
                  { value: "avlaga", label: "Авлага" },
                  { value: "ashiglalt", label: "Ашиглалт" },
                  { value: "tulult", label: "Төлөлт" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const newType = option.value as TransactionData["type"];
                      if (newType !== transactionType) {
                        setAmount("0.00");
                        setTailbar("");
                        setEkhniiUldegdel(false);
                        setAshiglaltZardal("");
                        setUmnukhZaalt("");
                        setSuuliinZaalt("");
                      }
                      setTransactionType(newType);
                    }}
                    disabled={isProcessing}
                    className={`
                      relative py-1.5 px-3 text-sm rounded-2xl transition-all duration-200
                      ${transactionType === option.value
                        ? "neu-panel-2 !text-white scale-[1.02]"
                        : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-bg)]/40"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Balance Checkbox - only for avlaga type */}
            <AnimatePresence>
              {transactionType === "avlaga" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3  rounded-2xl overflow-hidden"
                >
                  <input
                    type="checkbox"
                    id="ekhniiUldegdel"
                    checked={ekhniiUldegdel}
                    onChange={(e) => setEkhniiUldegdel(e.target.checked)}
                    className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label
                    htmlFor="ekhniiUldegdel"
                    className="text-xs  text-rose-700 cursor-pointer select-none"
                  >
                    Эхний үлдэгдэл эсэх
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                  Огноо
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm"
                />
              </div>

              {transactionType === "ashiglalt" ? (
                <div className="space-y-1.5">
                  <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                    Ашиглалтын зардал
                  </label>
                  <select
                    value={ashiglaltZardal}
                    onChange={(e) =>
                      setAshiglaltZardal(e.target.value as "" | "tsakhilgaan_kv")
                    }
                    disabled={isProcessing}
                    className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm"
                  >
                    <option value="">Сонгоно уу</option>
                    <option value="tsakhilgaan_kv">Цахилгаан кВ</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 relative group">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs text-[color:var(--panel-text)]">
                      Дүн 
                    </label>
                    {residentBalance !== null && transactionType === "tulult" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        onDoubleClick={fillAmountWithBalance}
                        title="Хоёр товшиж дүнг оруулах"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-2xl border cursor-pointer transition-all select-none
                          ${isFetchingBalance 
                            ? "bg-gray-100 text-gray-400 border-gray-200 animate-pulse" 
                            : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 active:scale-95"
                          }`}
                      >
                        Үлдэгдэл: {residentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      </motion.div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9.,]*$/.test(val)) {
                        setAmount(val);
                      }
                    }}
                    onDoubleClick={fillAmountWithBalance}
                    onFocus={() => {
                      setAmount(amount.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      setAmount(formatAmount(amount));
                    }}
                    disabled={isProcessing}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right tracking-wide text-lg font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Ashiglalt Details (Redesigned) */}
            {transactionType === "ashiglalt" && ashiglaltZardal === "tsakhilgaan_kv" && (
              <div className="bg-[color:var(--surface-hover)]/40 p-3.5 rounded-2xl border border-[color:var(--surface-border)] space-y-3">
                <div className="flex items-center gap-2">
                  
                  <span className="text-xs font-bold text-[color:var(--panel-text)] tracking-tight">Заалт оруулах</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[color:var(--muted-text)] ml-1">Өмнөх</label>
                    <input
                      type="text"
                      value={umnukhZaalt}
                      readOnly={!isUmnukhEditable}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9.,]*$/.test(val)) setUmnukhZaalt(val);
                      }}
                      className={`w-full px-3 py-1.5 border border-[color:var(--surface-border)] rounded-2xl focus:outline-none transition-all text-sm text-right font-bold ${
                        isUmnukhEditable ? "bg-[color:var(--surface-bg)] text-[color:var(--panel-text)]" : "bg-[color:var(--surface-hover)]/60 text-[color:var(--muted-text)]"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[color:var(--muted-text)] ml-1">Одоо</label>
                    <input
                      type="text"
                      value={suuliinZaalt}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9.,]*$/.test(val)) setSuuliinZaalt(val);
                      }}
                      disabled={isProcessing}
                      className="w-full px-3 py-1.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 transition-all text-sm text-right font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[color:var(--surface-border)]/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[color:var(--muted-text)]">Суурь хураамж:</span>
                    <span className="text-xs font-bold text-[color:var(--panel-text)]"> 
                      {calcBreakdown?.suuriKhuraamj ? calcBreakdown.suuriKhuraamj.toLocaleString() : "0"}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer group ml-auto select-none">
                    <span className="text-[10px] font-bold text-[color:var(--muted-text)] group-hover:text-[color:var(--theme)] transition-colors">Нэхэмжлэх дээр харах эсэх</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showUsageOnInvoice}
                        onChange={() => setShowUsageOnInvoice(!showUsageOnInvoice)}
                      />
                      <div 
                        className={`block w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                          showUsageOnInvoice ? "neu-panel-2" : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                      <div 
                        className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${
                          showUsageOnInvoice ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Tailbar & Amount (Conditionally Rendered) */}
            {transactionType === "ashiglalt" ? (
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                    Тайлбар
                  </label>
                  <textarea
                    value={tailbar}
                    onChange={(e) => setTailbar(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Гүйлгээний утга..."
                    rows={2}
                    className="w-full px-3 py-2 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm resize-none h-[40px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                    Дүн 
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9.,]*$/.test(val)) {
                        setAmount(val);
                      }
                    }}
                    onDoubleClick={fillAmountWithBalance}
                    onFocus={() => {
                      setAmount(amount.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      setAmount(formatAmount(amount));
                    }}
                    disabled={isProcessing}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right tracking-wide text-lg font-semibold !h-[40px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                  Тайлбар
                </label>
                <textarea
                  value={tailbar}
                  onChange={(e) => setTailbar(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Гүйлгээний утга..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <Button
              onClick={handleClose}
              disabled={isProcessing}
              variant="secondary"
              className="ant-btn w-20 color-black"
            >
              Хаах
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isProcessing}
              variant="primary"
              className="ant-btn w-20 ant-btn-primary !text-white"
            >
              Хадгалах
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
