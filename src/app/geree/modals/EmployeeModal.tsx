"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { DatePickerInput } from "@/components/ui/DatePickerInput";

interface EmployeeModalProps {
  show: boolean;
  onClose: () => void;
  editingEmployee: any;
  newEmployee: any;
  setNewEmployee: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EmployeeModal({
  show,
  onClose,
  editingEmployee,
  newEmployee,
  setNewEmployee,
  onSubmit,
}: EmployeeModalProps) {
  const employeeRef = React.useRef<HTMLDivElement | null>(null);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: employeeRef.current,
  });

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            ref={employeeRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface modal-responsive sm:w-full sm:max-w-3xl rounded-2xl shadow-2xl p-0 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingEmployee ? "Ажилтан засах" : "Ажилтан нэмэх"}
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
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Овог
                  </label>
                  <input
                    type="text"
                    value={newEmployee.ovog}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g, "");
                      setNewEmployee((p: any) => ({ ...p, ovog: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Нэр
                  </label>
                  <input
                    type="text"
                    value={newEmployee.ner}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g, "");
                      setNewEmployee((p: any) => ({ ...p, ner: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Утас
                  </label>
                  <input
                    type="tel"
                    value={newEmployee.utas}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
                      setNewEmployee((p: any) => ({ ...p, utas: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee((p: any) => ({ ...p, email: e.target.value }))}
                    className="w-full p-3 rounded-2xl border border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Албан тушаал
                  </label>
                  <input
                    type="text"
                    value={newEmployee.albanTushaal}
                    onChange={(e) =>
                      setNewEmployee((p: any) => ({ ...p, albanTushaal: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ажилд орсон огноо
                  </label>
                  <DatePickerInput
                    value={
                      newEmployee.ajildOrsonOgnoo ? new Date(newEmployee.ajildOrsonOgnoo) : null
                    }
                    onChange={(v) =>
                      setNewEmployee((p: any) => ({
                        ...p,
                        ajildOrsonOgnoo: v
                          ? (() => {
                              const date = new Date(v);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, "0");
                              const day = String(date.getDate()).padStart(2, "0");
                              return `${year}-${month}-${day}`;
                            })()
                          : "",
                      }))
                    }
                    placeholder="Огноо сонгох"
                    className="w-full"
                    required
                    clearable
                    classNames={{
                      input:
                        "text-theme neu-panel neu-calendar placeholder:text-theme !h-[50px] !py-2 !w-[420px]",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Нэвтрэх нэр
                  </label>
                  <input
                    type="text"
                    value={newEmployee.nevtrekhNer}
                    onChange={(e) =>
                      setNewEmployee((p: any) => ({ ...p, nevtrekhNer: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Нууц үг
                  </label>
                  <input
                    type="password"
                    value={newEmployee.nuutsUg}
                    onChange={(e) => setNewEmployee((p: any) => ({ ...p, nuutsUg: e.target.value }))}
                    className="w-full p-3 rounded-2xl border border-gray-400"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-minimal-ghost btn-cancel min-w-[100px]"
                >
                  Цуцлах
                </button>
                <button type="submit" className="btn-minimal btn-save" data-modal-primary>
                  {editingEmployee ? "Хадгалах" : "Хадгалах"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}