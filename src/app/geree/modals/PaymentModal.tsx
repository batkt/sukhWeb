"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            ref={paymentRef}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface w-[280px] min-h-[320px] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="relative px-5 pt-5 pb-4">
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Гүйлгээ хийх
                  </h3>
                </div>
              </div>
            </div>

            <div className="px-5 pb-4">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-3 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {paymentResident?.ovog || ""} {paymentResident?.ner || ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Тоот: {paymentResident?.toot || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-5 space-y-4">
              <div className="flex items-center justify-between py-3 px-3 rounded-full border border-slate-200/50">
                <span className="text-sm text-slate-700 font-medium">
                  Эхний үлдэгдэл оруулах
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentIncludeEkhniiUldegdel}
                    onChange={(e) => setPaymentIncludeEkhniiUldegdel(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow-sm after:border-slate-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Тайлбар</label>
                <textarea
                  value={paymentTailbar}
                  onChange={(e) => setPaymentTailbar(e.target.value)}
                  placeholder="Нэмэлт тайлбар оруулах..."
                  rows={3}
                  className="rounded-2xl w-full px-3 py-2.5 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all resize-none bg-white/50"
                />
              </div>
            </div>

            <div className="px-5 py-4 mt-auto border-t border-slate-200/60">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-slate-200 hover:text-slate-800 rounded-full transition-colors disabled:opacity-50"
                  disabled={isProcessingPayment}
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isProcessingPayment}
                  className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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