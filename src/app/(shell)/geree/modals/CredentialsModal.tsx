"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import Button from "@/components/ui/Button";

interface CredentialsModalProps {
  show: boolean;
  onClose: () => void;
  employee: any;
  onSave: (employee: any, nevtrekhNer: string, nuutsUg: string) => Promise<void>;
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
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
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
      await onSave(employee, nevtrekhNer, nuutsUg);
      onClose();
    }
  };

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
          <div className="absolute inset-0 bg-transparent" onClick={onClose} />
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 neu-panel rounded-2xl shadow-2xl p-0 flex flex-col w-[95vw] max-w-md overflow-hidden"
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--surface-border)] cursor-move select-none"
            >
              <h2 className="text-xl  text-[color:var(--panel-text)] dark:text-white">
                Нэвтрэх эрх солих
              </h2>
              <Button
                variant="text"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="!h-10 !w-10 !min-w-[2.5rem] shrink-0 !rounded-full !p-0 hover:!bg-[color:var(--surface-hover)] dark:hover:!bg-[color:var(--panel)]"
                aria-label="Хаах"
                title="Хаах"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[color:var(--muted-text)]"
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
                }
              />
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <p className="text-sm text-[color:var(--muted-text)] mb-2 px-1">
                <b>{employee?.ovog}. {employee?.ner}</b> - ажилтны нэвтрэх нэр, нууц үгийг шинэчлэх.
              </p>

              <div className="space-y-2">
                <label className="text-sm  text-[color:var(--panel-text)] ml-1">
                  Нэвтрэх нэр
                </label>
                <input
                  type="text"
                  value={nevtrekhNer}
                  onChange={(e) => setNevtrekhNer(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[color:var(--surface-hover)] border-none rounded-3xl focus:ring-2 focus:ring-theme/50 transition-all  text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                  placeholder="Нэвтрэх нэр"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm  text-[color:var(--panel-text)] ml-1">
                  Шинэ нууц үг
                </label>
                <input
                  type="password"
                  value={nuutsUg}
                  onChange={(e) => setNuutsUg(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[color:var(--surface-hover)] border-none rounded-3xl focus:ring-2 focus:ring-theme/50 transition-all  text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                  placeholder="Байхгүй бол хоосон үлдээх"
                />
              </div>

              <div className="flex justify-end gap-2 pt-6">
                <Button
                  htmlType="button"
                  onClick={onClose}
                  variant="secondary"
                  className="min-w-[100px]"
                  disabled={isSaving}
                >
                  Хаах
                </Button>
                <Button
                  htmlType="submit"
                  variant="primary"
                  className="min-w-[100px]"
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Хадгалах
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
