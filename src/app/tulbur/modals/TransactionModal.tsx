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
  type: "voucher" | "avlaga" | "turgul" | "ashiglalt" | "busad";
  date: string;
  amount: number;
  residentId?: string;
  gereeniiId?: string;
}

export default function TransactionModal({
  show,
  onClose,
  resident,
  onSubmit,
  isProcessing = false,
}: TransactionModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [transactionType, setTransactionType] = useState<TransactionData["type"]>("voucher");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("0");

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const handleSubmit = async () => {
    const data: TransactionData = {
      type: transactionType,
      date: transactionDate,
      amount: parseFloat(amount) || 0,
      residentId: resident?._id,
      gereeniiId: resident?.gereeniiId,
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative modal-surface rounded-xl shadow-2xl w-[640px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-4 py-3 border-b border-[color:var(--surface-border)]">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 text-[color:var(--muted-text)]" />
            </button>
            <h2 className="text-base font-semibold text-[color:var(--panel-text)]">
              Гүйлгээ хийх
            </h2>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3 bg-[color:var(--surface-bg)]">
            {/* Transaction Type Radio Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[color:var(--panel-text)]">
                Гүйлгээний төрөл
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "avlaga", label: "Авлага" },
                  { value: "ashiglalt", label: "Ашиглалт" },
                  { value: "busad", label: "Төлөлт" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="transactionType"
                      value={option.value}
                      checked={transactionType === option.value}
                      onChange={(e) =>
                        setTransactionType(e.target.value as TransactionData["type"])
                      }
                      disabled={isProcessing}
                      className="w-3 h-3 text-[color:var(--theme)] border-[color:var(--surface-border)] focus:ring-1 focus:ring-[color:var(--theme)]"
                    />
                    <span className="text-xs text-[color:var(--panel-text)]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Label based on transaction type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[color:var(--panel-text)]">
                {transactionType === "avlaga"
                  ? "Авлага тооцоо хийх" 
                  : transactionType === "ashiglalt"
                  ? "Ашиглалт тооцоо хийх"
                  : "Тооцоо хийх огноо"}
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                disabled={isProcessing}
                className="w-full px-2.5 py-1.5 border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-transparent transition-all text-xs"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[color:var(--panel-text)]">
                Дүн
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
                placeholder="0"
                className="w-full px-2.5 py-1.5 border border-[color:var(--surface-border)] bg-white dark:bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-transparent transition-all text-xs"
              />
            </div>

            {/* Resident Info if available */}
            {resident && (
              <div className="bg-[color:var(--surface-hover)] rounded-md p-2 border border-[color:var(--surface-border)]">
                <p className="text-xs text-[color:var(--panel-text)]">
                  <span className="font-medium">Оршин суугч:</span>{" "}
                  {resident?.ovog || ""} {resident?.ner || ""}
                </p>
                {resident?.toot && (
                  <p className="text-xs text-[color:var(--panel-text)] mt-0.5">
                    <span className="font-medium">Тоот:</span> {resident.toot}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-[color:var(--surface-hover)] border-t border-[color:var(--surface-border)] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-medium text-[color:var(--panel-text)] bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-md hover:bg-[color:var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Хаах
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[color:var(--theme)] hover:opacity-90 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              data-modal-primary
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
                  Хадгалж байна...
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
