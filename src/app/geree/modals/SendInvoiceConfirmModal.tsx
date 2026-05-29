"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { Send } from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface SendInvoiceConfirmModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

export default function SendInvoiceConfirmModal({
  show,
  onClose,
  title,
  message,
  onConfirm,
}: SendInvoiceConfirmModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useModalHotkeys({ isOpen: show, onClose });

  if (!show) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[12001] w-[90vw] max-w-[440px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 text-center select-none"
          >
            <div
              className="cursor-move pb-2"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 mb-4 shadow-sm shadow-orange-500/10">
                <Send className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
                {title}
              </h3>
              <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mb-6 px-2 leading-relaxed">
                {message}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  Үгүй, цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  data-modal-primary
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Илгээж байна...
                    </>
                  ) : (
                    "Тийм, илгээх"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
