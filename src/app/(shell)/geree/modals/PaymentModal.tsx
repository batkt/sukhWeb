"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { X } from "lucide-react";

interface PaymentModalProps {
  show: boolean;
  onClose: () => void;
  paymentResident: any;
  paymentIncludeEkhniiUldegdel: boolean;
  setPaymentIncludeEkhniiUldegdel: (val: boolean) => void;
  paymentTailbar: string;
  setPaymentTailbar: (val: string) => void;
  isProcessingPayment: boolean;
  onSubmit: () => Promise<void>;
}

export default function PaymentModal({
  show,
  onClose,
  paymentResident,
  paymentIncludeEkhniiUldegdel,
  setPaymentIncludeEkhniiUldegdel,
  paymentTailbar,
  setPaymentTailbar,
  isProcessingPayment,
  onSubmit,
}: PaymentModalProps) {
  const paymentRef = React.useRef<HTMLDivElement | null>(null);
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: paymentRef.current,
  });

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000]"
        >
          <div
            className="absolute inset-0 bg-transparent"
            onClick={onClose}
          />
          <motion.div
            ref={paymentRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 modal-surface w-[280px] min-h-[320px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="relative px-5 pt-5 pb-4 cursor-move select-none"
            >
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors"
                >
                  <X className="w-4 h-4 text-[color:var(--muted-text)]" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-base  text-[color:var(--panel-text)]">
                    Гүйлгээ хийх
                  </h3>
                </div>
              </div>
            </div>

            <div className="px-5 pb-4">
              <div className="bg-gradient-to-r from-theme/10 to-theme/5 rounded-2xl p-3 border border-[color:var(--surface-border)]">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm  text-[color:var(--panel-text)] truncate">
                      {paymentResident?.ovog || ""} {paymentResident?.ner || ""}
                    </p>
                    <p className="text-xs text-[color:var(--muted-text)]">
                      Тоот: {paymentResident?.toot || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-5 space-y-4">
              <div className="flex items-center justify-between py-3 px-3 rounded-full border border-[color:var(--surface-border)]">
                <span className="text-sm text-[color:var(--panel-text)] ">
                  Эхний үлдэгдэл оруулах
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentIncludeEkhniiUldegdel}
                    onChange={(e) => setPaymentIncludeEkhniiUldegdel(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[color:var(--panel)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-theme rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:border-[color:var(--surface-border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-theme"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs  text-[color:var(--muted-text)]">Тайлбар</label>
                <textarea
                  value={paymentTailbar}
                  onChange={(e) => setPaymentTailbar(e.target.value)}
                  placeholder="Нэмэлт тайлбар оруулах..."
                  rows={3}
                  className="rounded-2xl w-full px-3 py-2.5 border border-[color:var(--surface-border)] text-sm focus:outline-none focus:ring-2 focus:ring-theme/50 focus:border-theme transition-all resize-none bg-white/50"
                />
              </div>
            </div>

            <div className="px-5 py-4 mt-auto border-t border-[color:var(--surface-border)]">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm  bg-danger hover:bg-danger text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] rounded-full transition-colors disabled:opacity-50"
                  disabled={isProcessingPayment}
                >
                  Хаах
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isProcessingPayment}
                  className="px-5 py-2 text-sm  text-white bg-[color:var(--panel)] hover:bg-[color:var(--panel)] rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  data-modal-primary
                >
                  {isProcessingPayment ? (
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
                      Боловсруулж байна...
                    </span>
                  ) : (
                    "Хадгалах"
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
