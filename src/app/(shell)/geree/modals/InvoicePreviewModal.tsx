"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import formatNumber from "../../../../../tools/function/formatNumber";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface InvoicePreviewModalProps {
  show: boolean;
  onClose: () => void;
  invoiceData: any;
}

export default function InvoicePreviewModal({ show, onClose, invoiceData }: InvoicePreviewModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  useModalHotkeys({ isOpen: show, onClose });
  if (!show || !invoiceData) return null;

  const preview = invoiceData.preview || invoiceData;
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
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-transparent" />
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
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] modal-surface modal-responsive rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
          >
            <div className="invoice-modal h-full flex flex-col">
            {/* Header – match Үйлчилгээний нэхэмжлэх style */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="p-6 border-b border-[color:var(--surface-border)] flex justify-between items-center bg-[color:var(--surface-hover)] print-break no-print rounded-t-3xl cursor-move select-none"
            >
              <div>
                <h3 className="text-xl  text-[color:var(--panel-text)]">
                Нэхэмжлэхийн урьдчилсан харалт
                </h3>
                <p className="text-sm text-[color:var(--muted-text)]">
                  {getMonthName(preview.ognoo)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  className="p-2 hover:bg-[color:var(--surface-hover)] rounded-2xl transition-colors"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[color:var(--panel-text)]"
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
                  <div className="rounded-2xl border border-theme/30 bg-transparent p-4">
                    <h3 className="text-sm  text-theme mb-3 flex items-center gap-2 border-b">
                      <span className="text-theme" />
                      Нэхэмжлэгч
                    </h3>
                    <div className="space-y-1.5 text-sm text-[color:var(--muted-text)]">
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Нэхэмжлэгч:</span>{" "}
                        {preview.baiguullagiinNer || preview.sohNer || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Утас:</span>{" "}
                        {preview.baiguullagiinUtas || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Хаяг:</span>{" "}
                        {preview.baiguullagiinKhayag || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Данс:</span>{" "}
                        {preview.dansniiMedeelel || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Төлөгч (Payer / Resident) */}
                  <div className="rounded-2xl border border-[color:var(--surface-border)] bg-transparent p-4">
                    <h3 className="text-sm  text-[color:var(--panel-text)] mb-3 flex items-center gap-2 border-b">
                      <span className="text-theme" />
                      Төлөгч
                    </h3>
                    <div className="space-y-1.5 text-sm text-[color:var(--muted-text)]">
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Төлөгч:</span>{" "}
                        {preview.ovog ? `${preview.ovog} ${preview.ner}` : preview.ner || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Гэрээний дугаар:</span>{" "}
                        {preview.gereeniiDugaar || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Байр:</span>{" "}
                        {preview.davkhar || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Орц:</span>{" "}
                        {preview.orts || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Тоот:</span>{" "}
                        {preview.toot || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Оршин суугчийн нэр:</span>{" "}
                        {preview.ovog ? `${preview.ovog} ${preview.ner}` : preview.ner || "-"}
                      </p>
                      <p>
                        <span className=" text-[color:var(--muted-text)]">Утас:</span>{" "}
                        {Array.isArray(preview.utas) ? preview.utas.join(", ") : preview.utas || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expenses Table */}
                <div>
                  <h4 className="text-sm  text-[color:var(--panel-text)] mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Зардлын жагсаалт
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-[color:var(--surface-border)] bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-[color:var(--surface-hover)] border-b">
                        <tr>
                          <th className="px-4 py-3 text-left border-r  text-[color:var(--panel-text)]">№</th>
                          <th className="px-4 py-3 text-center border-r  text-[color:var(--panel-text)]">Зардлын нэр</th>
                          <th className="px-4 py-3 text-center border-r  text-[color:var(--panel-text)]">Төрөл</th>
                          <th className="px-4 py-3 text-center border-r  text-[color:var(--panel-text)]">Тариф</th>
                          <th className="px-4 py-3 text-center border-r  text-[color:var(--panel-text)] w-24">Дүн</th>
                          <th className="px-4 py-3 text-center w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.zardluud?.map((zardal: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[color:var(--surface-hover)] transition-colors">
                            <td className="px-4 py-3 border-r text-[color:var(--panel-text)] dark:text-[var(--panel-text)]">{idx + 1}</td>
                            <td className="px-4 py-3 border-r text-[color:var(--panel-text)] dark:text-[var(--panel-text)] ">{zardal.ner || "-"}</td>
                            <td className="px-4 py-3 border-r text-center text-[color:var(--muted-text)]">{zardal.turul || "-"}</td>
                            <td className="px-4 py-3 border-r text-right text-[color:var(--panel-text)] dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.tariff || 0)} {zardal.tariffUsgeer || ""}
                            </td>
                            <td className="px-4 py-3 text-right border-r text-[color:var(--panel-text)] dark:text-[var(--panel-text)]">
                              {formatNumber(zardal.dun || 0)} 
                            </td>
                            <td className="px-4 py-3"></td>
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
                      <span className="text-[color:var(--panel-text)]">Зардлын нийт дүн:</span>
                      <span className=" text-[color:var(--panel-text)] dark:text-[var(--panel-text)]">
                        {formatNumber(preview.niitTulbur || preview.zardluud?.reduce((sum: number, z: any) => sum + (z.dun || 0), 0) || 0)} 
                      </span>
                    </div>
                   
                    <div className="h-px bg-[color:var(--panel)]"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-base  text-[color:var(--panel-text)]">Нийт төлбөр:</span>
                      <span className="text-2xl  text-theme dark:text-theme">
                        {formatNumber(preview.niitTulbur || preview.zardluud?.reduce((sum: number, z: any) => sum + (z.dun || 0), 0) || 0)} 
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl p-4 border border-[color:var(--surface-border)] bg-transparent">
                    <span className="text-xs text-[color:var(--muted-text)]">Үүсгэсэн огноо</span>
                    <p className="text-sm  text-[color:var(--panel-text)] dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.ognoo)}
                    </p>
                  </div>
                  <div className="rounded-2xl p-4 border border-[color:var(--surface-border)] bg-transparent">
                    <span className="text-xs text-[color:var(--muted-text)]">Төлөх огноо</span>
                    <p className="text-sm  text-[color:var(--panel-text)] dark:text-[var(--panel-text)] mt-1">
                      {formatDate(preview.tulukhOgnoo)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-4 no-print rounded-b-3xl">
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
