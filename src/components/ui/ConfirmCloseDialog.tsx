"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmCloseDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
}

export function ConfirmCloseDialog({
  open,
  onCancel,
  onConfirm,
  title = "Өөрчлөлт хадгалагдахгүй",
  description = "Та гарахдаа итгэлтэй байна уу? Оруулсан мэдээлэл хадгалагдахгүй.",
  confirmLabel = "Тийм",
  cancelLabel = "Хаах",
  confirmVariant = "primary",
}: ConfirmCloseDialogProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="confirm-close-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          key="confirm-close-dialog"
          initial={{ scale: 0.93, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 12 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
          className="relative w-full max-w-sm bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--panel-text)]">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-[color:var(--muted-text)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 rounded-xl flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center px-5 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 bg-slate-200/50 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`inline-flex items-center justify-center px-5 py-2 rounded-2xl text-xs font-semibold text-white shadow-sm transition-all duration-300 ${confirmVariant === "danger"
                ? "bg-red-500 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500"
                : "bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
