"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Button from "@/components/ui/Button";

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
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

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
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000]"
        >
          <div className="absolute inset-0 bg-transparent" />
          <motion.div
            ref={employeeRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-3xl modal-surface modal-responsive rounded-2xl shadow-2xl p-0 flex flex-col"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-move select-none"
            >
              <h2 className="text-2xl text-slate-900 dark:text-white">
                {editingEmployee ? "Ажилтан засах" : "Ажилтан нэмэх"}
              </h2>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors"
                aria-label="Хаах"
                title="Хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-slate-700 dark:text-slate-400"
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
              {editingEmployee && (
                <input type="hidden" name="_id" value={newEmployee._id || editingEmployee._id} />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    Овог
                  </label>
                  <input
                    type="text"
                    name="ovog"
                    value={newEmployee.ovog}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g, "");
                      setNewEmployee((p: any) => ({ ...p, ovog: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    Нэр
                  </label>
                  <input
                    type="text"
                    name="ner"
                    value={newEmployee.ner}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g, "");
                      setNewEmployee((p: any) => ({ ...p, ner: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    Утас
                  </label>
                  <input
                    type="tel"
                    name="utas"
                    value={newEmployee.utas}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
                      setNewEmployee((p: any) => ({ ...p, utas: value }));
                    }}
                    className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee((p: any) => ({ ...p, email: e.target.value }))}
                    className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    Албан тушаал
                  </label>
                  <input
                    type="text"
                    name="albanTushaal"
                    value={newEmployee.albanTushaal}
                    onChange={(e) =>
                      setNewEmployee((p: any) => ({ ...p, albanTushaal: e.target.value }))
                    }
                    className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                    Ажилд орсон огноо
                  </label>
                  <StandardDatePicker
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
                    allowClear
                    classNames={{
                      input:
                        "text-slate-900 dark:text-white bg-white dark:bg-gray-800 neu-panel neu-calendar placeholder:text-slate-400 !h-[50px] !py-2 !w-[420px]",
                    }}
                  />
                  <input type="hidden" name="ajildOrsonOgnoo" value={newEmployee.ajildOrsonOgnoo || ""} />
                </div>
                {!editingEmployee && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                        Нэвтрэх нэр
                      </label>
                      <input
                        type="text"
                        name="nevtrekhNer"
                        value={newEmployee.nevtrekhNer}
                        onChange={(e) =>
                          setNewEmployee((p: any) => ({ ...p, nevtrekhNer: e.target.value }))
                        }
                        className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 dark:text-slate-400 mb-1">
                        Нууц үг
                      </label>
                      <input
                        type="password"
                        name="nuutsUg"
                        value={newEmployee.nuutsUg}
                        onChange={(e) => setNewEmployee((p: any) => ({ ...p, nuutsUg: e.target.value }))}
                        className="w-full p-3 rounded-2xl border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="min-w-[100px]"
                >
                  Хаах
                </Button>
                <Button htmlType="submit" variant="primary" className="min-w-[100px]">
                  {editingEmployee ? "Хадгалах" : "Хадгалах"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
