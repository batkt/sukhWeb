"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";

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
  type: "voucher" | "avlaga" | "turgul" | "ashiglalt" | "tulult";
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

  // Determine if umnukhZaalt is editable (if initial value is 0 or undefined)
  const initialUmnukhVal = resident?.umnukhZaalt ?? resident?.suuliinZaalt ?? resident?.tsahilgaaniiZaalt;
  const isUmnukhEditable = !initialUmnukhVal || Number(initialUmnukhVal) === 0;

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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  React.useEffect(() => {
    if (show && !lastShow) {
      resetForm();
      // Prefill Цахилгаан кВт and readings from resident (orshinSuugch) or geree
      const umnukhVal = resident?.umnukhZaalt ?? resident?.suuliinZaalt ?? resident?.tsahilgaaniiZaalt;
      const suuliinVal = resident?.suuliinZaalt ?? resident?.umnukhZaalt ?? resident?.tsahilgaaniiZaalt;
      const hasAny = [umnukhVal, suuliinVal].some(
        (v) => v != null && v !== "" && String(v).trim() !== ""
      );
      if (hasAny) {
        setAshiglaltZardal("tsakhilgaan_kv");
        if (umnukhVal != null && umnukhVal !== "") {
          setUmnukhZaalt(String(umnukhVal).replace(/,/g, ""));
        }
        if (suuliinVal != null && suuliinVal !== "") {
          setSuuliinZaalt(String(suuliinVal).replace(/,/g, ""));
        }
      }
    }
    setLastShow(show);
  }, [show, lastShow]);

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
        tailbar?: string;
        odorZaaltNum?: number;
        shonoZaaltNum?: number;
        suuliinZaaltNum?: number;
        zoruu?: number;
        selectedCharge?: string;
      }>("/tsakhilgaanTootsool", payload);

      if (res.data?.success && typeof res.data.niitDun === "number") {
        console.log("[CALC] Received response:", res.data);
        setAmount(String(res.data.niitDun));
        if (res.data.suuliinZaaltNum != null) {
          setSuuliinZaalt(String(res.data.suuliinZaaltNum));
        }


      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Тооцоолол амжилтгүй.";
      messageApi.error(msg);
    } finally {
      setIsCalculatingTsakhilgaan(false);
    }
  };

  // Auto-calculate when user selects Цахилгаан кВ or when toggle changes
  React.useEffect(() => {
    if (
      show &&
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      umnukhZaalt &&
      suuliinZaalt
    ) {
      handleTsakhilgaanTootsool();
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
          className="relative modal-surface rounded-2xl shadow-2xl w-[700px] !max-h-[80vh] overflow-y-auto border border-[color:var(--surface-border)]"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Body */}
          <div className="px-6 py-5 space-y-5 bg-[color:var(--surface-bg)]">

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
              <div className="grid grid-cols-3 gap-1 p-1 bg-[color:var(--surface-hover)] rounded-2xl">
                {[
                  { value: "avlaga", label: "Авлага" },
                  { value: "ashiglalt", label: "Ашиглалт" },
                  { value: "tulult", label: "Төлөлт" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTransactionType(option.value as TransactionData["type"])}
                    disabled={isProcessing}
                    className={`
                      relative py-1.5 px-3 text-sm  rounded-2xl transition-all duration-200
                      ${transactionType === option.value
                        ? "bg-[color:var(--theme)] text-white shadow-md shadow-[color:var(--theme)]/20 scale-[1.02]"
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
            {/* Grid for Date & (Ashiglalt Type OR Amount) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date Input */}
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

              {/* Expenses Type (Only for ashiglalt) OR Amount (Standard for others) */}
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
                <div className="space-y-1.5">
                  <label className="block text-xs text-[color:var(--panel-text)] mb-1.5">
                    Дүн ₮
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
                    onFocus={() => {
                      setAmount(amount.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      const val = parseFloat(amount.replace(/,/g, ""));
                      if (!isNaN(val)) {
                        setAmount(val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }
                    }}
                    disabled={isProcessing}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right tracking-wide text-lg font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Ashiglalt Details (Readings, Toggles) */}
            {transactionType === "ashiglalt" && ashiglaltZardal === "tsakhilgaan_kv" && (
              <div className="space-y-3">


                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs  text-[color:var(--panel-text)] mb-1.5">
                      Өмнөх заалт
                    </label>
                    <input
                      type="text"
                      value={umnukhZaalt}
                      readOnly={!isUmnukhEditable}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9.,]*$/.test(val)) {
                          setUmnukhZaalt(val);
                        }
                      }}
                      className={`w-full px-3 py-2.5 border border-[color:var(--surface-border)] rounded-2xl focus:outline-none transition-all text-sm text-right font-medium ${isUmnukhEditable
                        ? "bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)]"
                        : "bg-[color:var(--surface-hover)]/30 text-[color:var(--panel-text)]"
                        }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs  text-[color:var(--panel-text)] mb-1.5">
                      Одоо заалт
                    </label>
                    <input
                      type="text"
                      value={suuliinZaalt}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9.,]*$/.test(val)) {
                          setSuuliinZaalt(val);
                        }
                      }}
                      disabled={isProcessing}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right font-medium"
                    />
                  </div>
                </div>




                {/* Tailbar & Amount Grid */}
                {/* Tailbar & Amount (Conditionally Rendered) */}
                {/* Moved out of this block */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/50">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs  text-[color:var(--panel-text)]">
                      Суурь хүраамж нэмэх
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeSuuriKhuraamj}
                    onClick={() => setIncludeSuuriKhuraamj((v) => !v)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--theme)]/50 focus-visible:ring-offset-2 disabled:opacity-50 ${includeSuuriKhuraamj ? "bg-[color:var(--theme)]" : "bg-gray-400 dark:bg-gray-500"
                      }`}
                    style={includeSuuriKhuraamj ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--theme) 40%, transparent), 0 2px 10px rgba(0,0,0,0.2)" } as React.CSSProperties : undefined}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white border-2 border-gray-200 shadow-lg transition-transform duration-200 ease-out ${includeSuuriKhuraamj ? "translate-x-5 border-white/80" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs  text-[color:var(--panel-text)]">
                      Нэхэмжлэх дээр харах эсэх
                    </p>

                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showUsageOnInvoice}
                    onClick={() => setShowUsageOnInvoice((v) => !v)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--theme)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-bg)] disabled:opacity-50 ${showUsageOnInvoice
                      ? "bg-[color:var(--theme)]"
                      : "bg-gray-400 dark:bg-gray-500"
                      }`}
                    style={showUsageOnInvoice ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--theme) 40%, transparent), 0 2px 10px rgba(0,0,0,0.2)" } as React.CSSProperties : undefined}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white border-2 border-gray-200 shadow-lg transition-transform duration-200 ease-out ${showUsageOnInvoice ? "translate-x-5 border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.2)]" : "translate-x-0"
                        }`}
                    />
                  </button>
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
                    Дүн ₮
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
                    onFocus={() => {
                      setAmount(amount.replace(/,/g, ""));
                    }}
                    onBlur={() => {
                      const val = parseFloat(amount.replace(/,/g, ""));
                      if (!isNaN(val)) {
                        setAmount(val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }
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
          <div className="px-6 py-4 bg-[color:var(--surface-bg)] border-t border-[color:var(--surface-border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-5 py-2.5 text-sm  text-[color:var(--panel-text)] bg-transparent hover:bg-[color:var(--surface-hover)] rounded-2xl transition-colors disabled:opacity-50"
            >
              Хаах
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm  !text-white bg-[color:var(--theme)] hover:opacity-90 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[color:var(--theme)]/20 active:scale-95"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Уншиж байна...</span>
                </span>
              ) : (
                "Хадгалах"
              )}
            </button>
          </div>
        </motion.div>
      </div >
    </AnimatePresence >
  );
}
