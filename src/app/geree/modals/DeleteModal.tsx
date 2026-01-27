"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  show,
  onClose,
  title,
  message,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 mb-6">{message}</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-minimal-ghost px-4 py-2"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onConfirm();
                    onClose();
                  }}
                  className="btn-minimal btn-cancel px-4 py-2"
                  data-modal-primary
                >
                  Устгах
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}