"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import formatNumber from "../../../../tools/function/formatNumber";

interface InvoicePreviewModalProps {
  show: boolean;
  onClose: () => void;
  invoiceData: any;
}

export default function InvoicePreviewModal({ show, onClose, invoiceData }: InvoicePreviewModalProps) {
  if (!show || !invoiceData?.preview) return null;

  const preview = invoiceData.preview;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    return `${month}-р сарын нэхэмжлэх`;
  };

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface modal-responsive sm:w-full sm:max-w-4xl rounded-2xl shadow-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-900/20 dark:to-blue-900/10">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-[var(--panel-text)]">
                Нэхэмжлэхийн урьдчилсан харалт
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {getMonthName(preview.ognoo)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-colors"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-slate-700 dark:text-[var(--panel-text)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                {/* Contract Info */}
                <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-5 border border-slate-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Гэрээний мэдээлэл
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Нэхэмжлэгч:</span>
                      <p className="font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                        {preview.sohNer || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Төлөгч:</span>
                      <p className="font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                        {preview.ovog ? `${preview.ovog} ${preview.ner}` : preview.ner || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Гэрээний дугаар:</span>
                      <p className="font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">{preview.gereeniiDugaar || "-"}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Утас:</span>
                      <p className="font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                        {preview.utas?.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Байршил:</span>
                      <p className="font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                        Давхар {preview.davkhar || "-"}, Тоот {preview.toot || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expenses Table */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Зардлын жагсаалт
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">№</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Зардлын нэр</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Төрөл</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Тариф</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Дүн</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                        {preview.zardluud?.map((zardal: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-slate-900 dark:text-[var(--panel-text)]">{idx + 1}</td>
                            <td className="px-4 py-3 text-slate-900 dark:text-[var(--panel-text)] font-medium">{zardal.ner || "-"}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{zardal.turul || "-"}</td>
                            <td className="px-4 py-3 text-right text-slate-900 dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.tariff || 0)} {zardal.tariffUsgeer || "₮"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.dun || 0)} ₮
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300">Зардлын нийт дүн:</span>
                      <span className="font-semibold text-slate-900 dark:text-[var(--panel-text)]">
                        {formatNumber(preview.zardluudTotal || 0)} ₮
                      </span>
                    </div>
                    {preview.ekhniiUldegdel > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700 dark:text-slate-300">Эхний үлдэгдэл:</span>
                        <span className="font-semibold text-slate-900 dark:text-[var(--panel-text)]">
                          {formatNumber(preview.ekhniiUldegdel || 0)} ₮
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Нийт төлбөр:</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(preview.niitTulbur || 0)} ₮
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-4 border border-slate-200 dark:border-gray-700">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Үүсгэсэн огноо</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.ognoo)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-800/50 rounded-lg p-4 border border-slate-200 dark:border-gray-700">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Төлөх огноо</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.tulukhOgnoo)}
                    </p>
                  </div>
                </div>

                {/* Existing Invoice Warning */}
                {preview.existingInvoice && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                          Энэ сард нэхэмжлэх аль хэдийн үүссэн байна
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                          Дахин илгээх бол өмнөх нэхэмжлэх дарагдана.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-minimal btn-cancel px-6 py-2 rounded-lg text-sm font-medium"
              >
                Хаах
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
