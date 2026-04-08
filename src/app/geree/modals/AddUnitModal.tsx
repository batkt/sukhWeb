"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import Button from "@/components/ui/Button";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";

interface AddUnitModalProps {
  show: boolean;
  onClose: () => void;
  floor: string;
  value: string;
  setValue: (val: string) => void;
  onSubmit: (floor: string, values: string[]) => Promise<void>;
}

export default function AddUnitModal({
  show,
  onClose,
  floor,
  value,
  setValue,
  onSubmit,
}: AddUnitModalProps) {
  const dragControls = useDragControls();
  const constraintsRef = React.useRef<HTMLDivElement>(null);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);

  const hasChanges = value.trim() !== "";

  const requestClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  useModalHotkeys({
    isOpen: show,
    onClose: requestClose,
  });

  const parseToots = (input: string): string[] => {
    const trimmed = input.trim();
    if (!trimmed) return [];
    const parts = trimmed
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result: string[] = [];
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((s) => parseInt(s.trim()));
        if (isNaN(start) || isNaN(end) || start > end) continue;
        for (let i = start; i <= end; i++) {
          result.push(String(i));
        }
      } else {
        if (part) result.push(part);
      }
    }
    return result;
  };

  const handleSubmit = async () => {
    const tootsToAdd = parseToots(value);
    if (tootsToAdd.length === 0) {
      openErrorOverlay("Буруу тоот оруулсан байна");
      return;
    }
    try {
      await onSubmit(floor, tootsToAdd);
      onClose();
    } catch (err) {
      // Error is handled by the action function, but don't close modal on error
      console.error("Failed to add unit:", err);
    }
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={constraintsRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
            className="relative modal-surface modal-responsive w-full max-w-md rounded-2xl shadow-2xl p-6"
          >
            <div className="text-center">
              <h3
                onPointerDown={(e) => dragControls.start(e)}
                className="text-lg text-slate-900 mb-2 cursor-move select-none"
              >
                Тоот нэмэх
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {floor ? `${floor}-р давхарт шинэ тоот нэмнэ үү.` : "Давхар сонгоогүй байна."}
              </p>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Тоот (1-9 гэх мэтээр оруулна уу)"
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9A-Za-z,\-\s]/g, "");
                    setValue(val);
                  }}
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 focus:outline-none focus:ring"
                  autoFocus
                />
              </div>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={requestClose}
                  variant="secondary"
                  className="px-6"
                >
                  Хаах
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  className="px-6 ant-btn ant-btn-primary"
                >
                  Нэмэх
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </ModalPortal>
      </AnimatePresence>

      <ConfirmCloseDialog
        open={showConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        onConfirm={() => { setShowConfirmClose(false); onClose(); }}
      />
    </>
  );
}
