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
          className="fixed inset-0 z-[1000]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[1100] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] modal-surface modal-responsive rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
          >
            <div className="invoice-modal h-full flex flex-col">
            {/* Header – match Үйлчилгээний нэхэмжлэх style */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print-break no-print rounded-t-3xl">
              <div>
                <h3 className="text-xl  text-slate-800">
                Нэхэмжлэхийн урьдчилсан харалт
                </h3>
                <p className="text-sm text-slate-500">
                  {getMonthName(preview.ognoo)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-slate-700"
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

            {/* Content – reuse structure but in invoice-modal look */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto overflow-x-auto overscroll-contain custom-scrollbar">
              <div className="space-y-6">
                {/* Contract Info - match Үйлчилгээний нэхэмжлэх layout */}
                <div className="grid grid-cols-2 gap-4 print-break">
                  {/* Left: Нэхэмжлэгч (Organization) */}
                  <div className="rounded-2xl border border-emerald-200 bg-transparent p-4">
                    <h3 className="text-sm  text-emerald-500 mb-3 flex items-center gap-2 border-b">
                      <span className="text-theme" />
                      Нэхэмжлэгч
                    </h3>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>
                        <span className=" text-slate-500">Нэхэмжлэгч:</span>{" "}
                        {preview.baiguullagiinNer || preview.sohNer || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Утас:</span>{" "}
                        {preview.baiguullagiinUtas || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Хаяг:</span>{" "}
                        {preview.baiguullagiinKhayag || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Данс:</span>{" "}
                        {preview.dansniiMedeelel || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Төлөгч (Payer / Resident) */}
                  <div className="rounded-2xl border border-gray-200 bg-transparent p-4">
                    <h3 className="text-sm  text-slate-700 mb-3 flex items-center gap-2 border-b">
                      <span className="text-theme" />
                      Төлөгч
                    </h3>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p>
                        <span className=" text-slate-500">Төлөгч:</span>{" "}
                        {preview.ovog ? `${preview.ovog} ${preview.ner}` : preview.ner || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Гэрээний дугаар:</span>{" "}
                        {preview.gereeniiDugaar || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Байр:</span>{" "}
                        {preview.davkhar || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Орц:</span>{" "}
                        {preview.orts || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Тоот:</span>{" "}
                        {preview.toot || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Оршин суугчийн нэр:</span>{" "}
                        {preview.ovog ? `${preview.ovog} ${preview.ner}` : preview.ner || "-"}
                      </p>
                      <p>
                        <span className=" text-slate-500">Утас:</span>{" "}
                        {Array.isArray(preview.utas) ? preview.utas.join(", ") : preview.utas || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expenses Table */}
                <div>
                  <h4 className="text-sm  text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Зардлын жагсаалт
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left border-r  text-slate-700 dark:text-slate-300">№</th>
                          <th className="px-4 py-3 text-center border-r  text-slate-700 dark:text-slate-300">Зардлын нэр</th>
                          <th className="px-4 py-3 text-center border-r  text-slate-700 dark:text-slate-300">Төрөл</th>
                          <th className="px-4 py-3 text-center border-r  text-slate-700 dark:text-slate-300">Тариф</th>
                          <th className="px-4 py-3 text-center  text-slate-700 dark:text-slate-300">Дүн</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.zardluud?.map((zardal: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 border-r text-slate-900 dark:text-[var(--panel-text)]">{idx + 1}</td>
                            <td className="px-4 py-3 border-r text-slate-900 dark:text-[var(--panel-text)] ">{zardal.ner || "-"}</td>
                            <td className="px-4 py-3 border-r text-center text-slate-600 dark:text-slate-400">{zardal.turul || "-"}</td>
                            <td className="px-4 py-3 border-r text-right text-slate-900 dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.tariff || 0)} {zardal.tariffUsgeer || "₮"}
                            </td>
                            <td className="px-4 py-3 text-right  text-slate-900 dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.dun || 0)} ₮
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl p-5 bg-transparent">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300">Зардлын нийт дүн:</span>
                      <span className=" text-slate-900 dark:text-[var(--panel-text)]">
                        {formatNumber(preview.niitTulbur || preview.zardluud?.reduce((sum: number, z: any) => sum + (z.dun || 0), 0) || 0)} ₮
                      </span>
                    </div>
                   
                    <div className="h-px bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base  text-slate-800 dark:text-slate-200">Нийт төлбөр:</span>
                      <span className="text-2xl  text-blue-600 dark:text-blue-400">
                        {formatNumber(preview.niitTulbur || preview.zardluud?.reduce((sum: number, z: any) => sum + (z.dun || 0), 0) || 0)} ₮
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg p-4 border border-gray-200 bg-transparent">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Үүсгэсэн огноо</span>
                    <p className="text-sm  text-slate-900 dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.ognoo)}
                    </p>
                  </div>
                  <div className="rounded-lg p-4 border border-gray-200 bg-transparent">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Төлөх огноо</span>
                    <p className="text-sm  text-slate-900 dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.tulukhOgnoo)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 p-4 no-print rounded-b-3xl">
              <div className="flex justify-end gap-3">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-minimal btn-cancel px-6 py-2 rounded-lg text-sm "
                >
                  Хаах
                </motion.button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
