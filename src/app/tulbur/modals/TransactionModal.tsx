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

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const handleSubmit = async () => {
    const data: TransactionData = {
      type: transactionType,
      date: transactionDate,
      amount: parseFloat(amount.replace(/,/g, "")) || 0,
      residentId: resident?._id,
      gereeniiId: resident?.gereeniiId,
      tailbar,
      ekhniiUldegdel,
    };

    await onSubmit(data);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative modal-surface rounded-2xl shadow-2xl w-[500px] overflow-hidden border border-[color:var(--surface-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-4 flex items-center justify-between border-b border-[color:var(--surface-border)]/50 bg-[color:var(--surface-bg)]">
            <h2 className="text-lg font-semibold text-[color:var(--panel-text)] tracking-tight">
              Гүйлгээ хийх
            </h2>
            <button
              type="button"
              onClick={onClose}
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
              <div className="bg-[color:var(--surface-hover)]/50 rounded-xl p-3 border border-[color:var(--surface-border)] flex items-center gap-3">
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
                      relative py-1.5 px-3 text-sm font-semibold rounded-md transition-all duration-200
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
            {transactionType === "avlaga" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10"
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
              onClick={onClose}
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
