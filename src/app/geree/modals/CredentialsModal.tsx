"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";

interface CredentialsModalProps {
  show: boolean;
  onClose: () => void;
  employee: any;
  onSave: (id: string, nevtrekhNer: string, nuutsUg: string) => Promise<void>;
  isSaving?: boolean;
}

export default function CredentialsModal({
  show,
  onClose,
  employee,
  onSave,
  isSaving = false,
}: CredentialsModalProps) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const [nevtrekhNer, setNevtrekhNer] = useState("");
  const [nuutsUg, setNuutsUg] = useState("");

  // Reset state when modal opens
  React.useEffect(() => {
    if (show && employee) {
      setNevtrekhNer(employee.nevtrekhNer || "");
      setNuutsUg(""); // Always start password empty for security
    }
  }, [show, employee]);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employee?._id) {
      await onSave(employee._id, nevtrekhNer, nuutsUg);
      onClose();
    }
  };

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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-0 flex flex-col w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Нэвтрэх эрх солих
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <p className="text-sm text-gray-500 mb-2 px-1">
                <b>{employee?.ovog} {employee?.ner}</b> - ажилтны нэвтрэх нэр, нууц үгийг шинэчлэх.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  Нэвтрэх нэр
                </label>
                <input
                  type="text"
                  value={nevtrekhNer}
                  onChange={(e) => setNevtrekhNer(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-100 dark:bg-slate-800 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-gray-400"
                  placeholder="Нэвтрэх нэр"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  Шинэ нууц үг
                </label>
                <input
                  type="password"
                  value={nuutsUg}
                  onChange={(e) => setNuutsUg(e.target.value)}
                  className="w-full px-5 py-3.5 bg-gray-100 dark:bg-slate-800 border-none rounded-3xl focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-900 dark:text-slate-100 placeholder:text-gray-400"
                  placeholder="Байхгүй бол хоосон үлдээх"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-transparent hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isSaving}
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
