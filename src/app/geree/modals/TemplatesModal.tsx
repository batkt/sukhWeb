"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { Eye, Edit, Trash2 } from "lucide-react";

interface TemplatesModalProps {
  show: boolean;
  onClose: () => void;
  templates: any[];
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export default function TemplatesModal({
  show,
  onClose,
  templates,
  onPreview,
  onEdit,
  onDelete,
  onCreateNew,
}: TemplatesModalProps) {
  const list2Ref = React.useRef<HTMLDivElement | null>(null);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: list2Ref.current,
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
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            ref={list2Ref}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface modal-responsive sm:w-full sm:max-w-4xl rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl  text-slate-900">Гэрээний Загвар</h3>
              <div className="flex items-center gap-2">
                <button onClick={onCreateNew} className="btn-minimal btn-save">
                  Шинэ загвар
                </button>
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
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {(templates || []).map((z: any) => (
                <div
                  key={z._id}
                  className="flex items-center justify-between p-3 rounded-2xl border"
                >
                  <div>
                    <div className=" text-theme">{z.ner}</div>
                    <div className="text-sm text-theme">{z.turul}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPreview(z._id)}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-2xl"
                      title="Харах"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(z._id)}
                      className="p-2 hover:bg-blue-100 rounded-2xl"
                      title="Засах"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(z._id)}
                      className="p-2 hover:bg-red-50 rounded-2xl action-delete"
                      title="Устгах"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}