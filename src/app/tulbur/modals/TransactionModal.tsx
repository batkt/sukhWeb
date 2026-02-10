"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";

interface TransactionModalProps {
  show: boolean;
  onClose: () => void;
  resident?: any;
  onSubmit: (data: TransactionData) => Promise<void>;
  isProcessing?: boolean;
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
}: TransactionModalProps) {
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
  const [tsahilgaanKv, setTsahilgaanKv] = useState("");
  const [umnukhZaalt, setUmnukhZaalt] = useState("");
  const [suuliinZaalt, setSuuliinZaalt] = useState("");
  const [guidliinKoeff, setGuidliinKoeff] = useState("");
  const [showUsageOnInvoice, setShowUsageOnInvoice] = useState(true);

  const resetForm = () => {
    setTransactionType("avlaga");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setAmount("0.00");
    setTailbar("");
    setEkhniiUldegdel(false);
     setAshiglaltZardal("");
     setTsahilgaanKv("");
     setUmnukhZaalt("");
     setSuuliinZaalt("");
     setGuidliinKoeff("");
     setShowUsageOnInvoice(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  React.useEffect(() => {
    if (show && !lastShow) {
      resetForm();
      // Prefill electricity usage when opening for a resident
      if (resident?.tsahilgaaniiZaalt) {
        setAshiglaltZardal("tsakhilgaan_kv");
        setTsahilgaanKv(
          String(resident.tsahilgaaniiZaalt).replace(/,/g, "")
        );
      }
    }
    setLastShow(show);
  }, [show, lastShow]);

  useModalHotkeys({
    isOpen: show,
    onClose: handleClose,
    container: modalRef.current,
  });

  const handleSubmit = async () => {
    // Build tailbar including optional ashiglalt (electricity) details
    let finalTailbar = tailbar;
    if (
      transactionType === "ashiglalt" &&
      ashiglaltZardal === "tsakhilgaan_kv" &&
      showUsageOnInvoice
    ) {
      const parts: string[] = [];
      if (tsahilgaanKv.trim()) {
        parts.push(`Цахилгаан кВт: ${tsahilgaanKv.trim()}`);
      }
      if (umnukhZaalt.trim()) {
        parts.push(`Өмнөх заалт: ${umnukhZaalt.trim()}`);
      }
      if (suuliinZaalt.trim()) {
        parts.push(`Сүүлийн заалт: ${suuliinZaalt.trim()}`);
      }
      if (guidliinKoeff.trim()) {
        parts.push(`Гүйдлийн коэффициент: ${guidliinKoeff.trim()}`);
      }
      const usageText = parts.join(", ");
      if (usageText) {
        finalTailbar = finalTailbar
          ? `${finalTailbar} | ${usageText}`
          : usageText;
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
          className="relative modal-surface rounded-2xl shadow-2xl w-[500px] !max-h-[80vh] overflow-y-auto border border-[color:var(--surface-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-4 flex items-center justify-between border-b border-[color:var(--surface-border)]/50 bg-[color:var(--surface-bg)]">
            <h2 className="text-lg font-semibold text-[color:var(--panel-text)] tracking-tight">
              Гүйлгээ хийх
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 bg-[color:var(--surface-bg)]">

            {/* Resident Info Card */}
            {resident && (
              <div className="bg-[color:var(--surface-hover)]/50 rounded-2xl p-3 border border-[color:var(--surface-border)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[color:var(--theme)]/10 flex items-center justify-center text-[color:var(--theme)] font-semibold text-sm">
                  {resident?.toot || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--panel-text)]">
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
              <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
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
                      relative py-1.5 px-3 text-sm font-semibold rounded-2xl transition-all duration-200
                      ${transactionType === option.value
                        ? "bg-[color:var(--theme)] text-white shadow-md shadow-[color:var(--theme)]/20 scale-[1.02]"
                        : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-bg)]/40"
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
                  className="flex items-center gap-2 p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 overflow-hidden"
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
                    className="text-xs font-medium text-rose-700 cursor-pointer select-none"
                  >
                    Эхний үлдэгдэл эсэх
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                  Огноо
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm font-medium"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
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
                  className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm font-bold text-right tracking-wide"
                />
              </div>
            </div>

            {/* Ашиглалтын зардал – Цахилгаан кВ (only when type is ashiglalt) */}
            {transactionType === "ashiglalt" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
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

                {ashiglaltZardal === "tsakhilgaan_kv" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                          Цахилгаан кВт
                        </label>
                        <input
                          type="text"
                          value={tsahilgaanKv}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.,]*$/.test(val)) {
                              setTsahilgaanKv(val);
                            }
                          }}
                          disabled={isProcessing}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                          Гүйдлийн коэффициент
                        </label>
                        <input
                          type="text"
                          value={guidliinKoeff}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.,]*$/.test(val)) {
                              setGuidliinKoeff(val);
                            }
                          }}
                          disabled={isProcessing}
                          placeholder="1.00"
                          className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                          Өмнөх заалт
                        </label>
                        <input
                          type="text"
                          value={umnukhZaalt}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9.,]*$/.test(val)) {
                              setUmnukhZaalt(val);
                            }
                          }}
                          disabled={isProcessing}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
                          Сүүлийн заалт
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
                          className="w-full px-3 py-2.5 border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]/20 focus:border-[color:var(--theme)] transition-all text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-[color:var(--panel-text)]">
                          Нэхэмжлэх дээр харах эсэх
                        </p>
                        <p className="text-[10px] text-[color:var(--muted-text)]">
                          Идэвхтэй бол энэ мэдээлэл нэхэмжлэхийн тайлбарт харагдана
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUsageOnInvoice((v) => !v)}
                        disabled={isProcessing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showUsageOnInvoice
                            ? "bg-[color:var(--theme)]"
                            : "bg-[color:var(--surface-border)]"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showUsageOnInvoice ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tailbar Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[color:var(--panel-text)] mb-1.5">
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[color:var(--surface-bg)] border-t border-[color:var(--surface-border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-5 py-2.5 text-sm font-medium text-[color:var(--panel-text)] bg-transparent hover:bg-[color:var(--surface-hover)] rounded-2xl transition-colors disabled:opacity-50"
            >
              Хаах
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[color:var(--theme)] hover:opacity-90 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[color:var(--theme)]/20 active:scale-95"
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
      </div>
    </AnimatePresence>
  );
}
