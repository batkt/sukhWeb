"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";

interface ContractModalProps {
  show: boolean;
  onClose: () => void;
  editingContract: any;
  newContract: any;
  setNewContract: (val: any) => void;
  currentStep: number;
  setCurrentStep: (val: number) => void;
  stepLabels: string[];
  ortsOptions: string[];
  davkharOptions: string[];
  getTootOptions: (orts: string, floor: string) => string[];
  onSubmit: (e: React.FormEvent) => void;
  baiguullaga: any;
}

export default function ContractModal({
  show,
  onClose,
  editingContract,
  newContract,
  setNewContract,
  currentStep,
  setCurrentStep,
  stepLabels,
  ortsOptions,
  davkharOptions,
  getTootOptions,
  onSubmit,
  baiguullaga,
}: ContractModalProps) {
  const contractRef = React.useRef<HTMLDivElement | null>(null);
  
  useModalHotkeys({
    isOpen: show,
    onClose,
    container: contractRef.current,
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            ref={contractRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative overflow-y-auto custom-scrollbar modal-surface modal-responsive w-full max-w-4xl md:max-w-5xl lg:max-w-6xl h-[70vh] max-h-[70vh] rounded-2xl shadow-2xl p-0 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingContract ? "Гэрээ засах" : "Шинэ гэрээ байгуулах"}
              </h2>
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

            <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0">
              {/* Stepper */}
              <div className="px-6 my-6">
                <div className="md:hidden overflow-x-auto -mx-6 px-6">
                  <div className="flex justify-center gap-4 min-w-max">
                    {stepLabels.map((label, i) => {
                      const step = i + 1;
                      const active = currentStep === step;
                      const done = currentStep > step;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setCurrentStep(step)}
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                            active
                              ? "bg-sky-700 text-white"
                              : done
                              ? "bg-blue-200 text-slate-800"
                              : "bg-gray-200 text-slate-700"
                          }`}
                          aria-current={active ? "step" : undefined}
                          aria-label={`Алхам ${step}: ${label}`}
                          title={label}
                        >
                          {step}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form content */}
              <div className="flex-1 overflow-y-auto md:overflow-visible px-6 space-y-6 pb-8 md:pb-6 min-h-0">
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Гэрээний төрөл
                      </label>
                      <TusgaiZagvar
                        value={newContract.turul}
                        onChange={(val: string) =>
                          setNewContract((prev: any) => ({
                            ...prev,
                            turul: val,
                          }))
                        }
                        options={[
                          { value: "Үндсэн", label: "Үндсэн" },
                          { value: "Түр", label: "Түр" },
                        ]}
                        className="w-full"
                        placeholder="Сонгох..."
                      />
                    </div>
                    {/* Add more fields... */}
                  </div>
                )}
                
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* СӨХ мэдээлэл */}
                  </div>
                )}
              </div>

              <div className="flex justify-between px-6 py-3 border-t">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  className="btn-minimal btn-minimal-ghost btn-back"
                  disabled={currentStep === 1}
                >
                  Буцах
                </button>
                {currentStep < stepLabels.length ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(Math.min(stepLabels.length, currentStep + 1))}
                    className="btn-minimal btn-next"
                    data-modal-primary
                  >
                    Дараах
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-minimal btn-save h-11"
                    data-modal-primary
                  >
                    {editingContract ? "Хадгалах" : "Гэрээ үүсгэх"}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}