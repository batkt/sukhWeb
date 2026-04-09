"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { Trash2 } from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  show,
  onClose,
  title,
  message,
  onConfirm,
}: DeleteConfirmModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  useModalHotkeys({ isOpen: show, onClose });
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[30vw] max-w-[440px] modal-surface rounded-2xl shadow-2xl p-5 text-[11px] leading-normal"
          >
            <div
              className="text-center cursor-move select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-[11px] font-semibold mb-2">{title}</h3>
              <p className="text-[11px] mb-6 font-normal opacity-85">
                {message}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-minimal-ghost btn-minimal-sm px-4 py-2 !text-[11px]"
                >
                  Хаах
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onConfirm();
                    onClose();
                  }}
                  className="btn-minimal btn-cancel btn-minimal-sm px-4 py-2 !text-[11px]"
                  data-modal-primary
                >
                  Устгах
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
