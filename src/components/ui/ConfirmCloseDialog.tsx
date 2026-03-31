"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

interface ConfirmCloseDialogProps {
  open: boolean;
  onCancel: () => void;   // Stay in modal
  onConfirm: () => void;  // Leave / discard
  title?: string;
  description?: string;
}

export function ConfirmCloseDialog({
  open,
  onCancel,
  onConfirm,
  title = "Өөрчлөлт хадгалагдахгүй",
  description = "Та гарахдаа итгэлтэй байна уу? Оруулсан мэдээлэл хадгалагдахгүй.",
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
            <Button
              onClick={onCancel}
              variant="secondary"
              className="px-6"
            >
              Хаах
            </Button>
            <Button
              onClick={onConfirm}
              variant="primary"
              className="px-6 ant-btn ant-btn-primary"
            >
              Тийм
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
