"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
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
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[color:var(--panel)] backdrop-blur-sm"
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
            className="relative z-[12001] w-[90vw] max-w-[440px] bg-white rounded-3xl border border-[color:var(--surface-border)] shadow-2xl p-6 text-center select-none"
          >
            <div
              className="cursor-move pb-2"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-warning/10 text-warning mb-4 shadow-sm shadow-warning/10">
                <Send className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-[color:var(--panel-text)] mb-2">
                {title}
              </h3>
              <p className="text-sm font-normal text-[color:var(--muted-text)] mb-6 px-2 leading-relaxed">
                {message}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-[color:var(--muted-text)] bg-[color:var(--surface-hover)] hover:bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  Үгүй, цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-warning/20 to-warning/20 hover:from-warning/20 hover:to-warning/20 shadow-md shadow-warning/10 hover:shadow-warning/20 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
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
