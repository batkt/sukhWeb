"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { Info } from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";

interface InfoModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function InfoModal({
  show,
  onClose,
  title,
  message,
}: InfoModalProps) {
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
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-[color:var(--panel)] backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={onClose} />
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
            className="relative z-[12001] w-[90vw] max-w-[440px] bg-[color:var(--surface-bg)] rounded-3xl border border-[color:var(--surface-border)] shadow-2xl p-6 text-center select-none"
          >
            <div
              className="cursor-move pb-2"
              onPointerDown={(e) => dragControls.start(e)}
            >
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-theme/10 text-brand mb-4 shadow-sm shadow-theme/10">
                <Info className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="text-base font-medium text-[color:var(--panel-text)] mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-sm font-normal text-[color:var(--muted-text)] mb-6 px-2 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-[color:var(--theme)] hover:opacity-90 shadow-md shadow-theme/20 hover:shadow-theme/30 transition-all duration-200 cursor-pointer flex items-center gap-2"
                  data-modal-primary
                >
                  Ойлголоо
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
