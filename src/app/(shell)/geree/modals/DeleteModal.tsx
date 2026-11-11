"use client";

import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { Trash2 } from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { ShaltgaanTalbar } from "@/components/ui/ShaltgaanDialog";
import {
  UILDEL_DUUSTAL_MS,
  shaltgaanTaviya,
  shaltgaanTseverle,
  shaltgaanZuvEsekh,
} from "@/lib/shaltgaan";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  /** Батлах товчны бичиг (анхдагч «Устгах»), ж: «Салгах» */
  confirmLabel?: string;
  /** Толгойн дүрс (анхдагч хогийн сав) */
  icon?: React.ReactNode;
}

export default function DeleteConfirmModal({
  show,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = "Устгах",
  icon,
}: DeleteConfirmModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  // Устгал/засвар бүрд шалтгаан заавал (sukhBackv2 middleware/shaltgaan.js)
  const [shaltgaan, setShaltgaan] = React.useState("");
  const [oroldson, setOroldson] = React.useState(false);
  const [ajillajBaina, setAjillajBaina] = React.useState(false);
  React.useEffect(() => {
    if (show) {
      setShaltgaan("");
      setOroldson(false);
    }
  }, [show]);
  useModalHotkeys({ isOpen: show, onClose });
  if (!show) return null;

  const batlaya = async () => {
    setOroldson(true);
    if (!shaltgaanZuvEsekh(shaltgaan) || ajillajBaina) return;
    setAjillajBaina(true);
    // onConfirm доторх бүх өөрчлөх хүсэлтэд uilchilgee автоматаар хавсаргана
    shaltgaanTaviya(shaltgaan, UILDEL_DUUSTAL_MS);
    try {
      await onConfirm();
      onClose();
    } finally {
      setAjillajBaina(false);
      setTimeout(shaltgaanTseverle, 1500);
    }
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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger/10 mb-4">
                {icon ?? <Trash2 className="h-6 w-6 text-danger" />}
              </div>
              <h3 className="text-[11px] font-medium mb-2">{title}</h3>
              <p className="text-[11px] mb-4 font-normal opacity-85 whitespace-pre-line">
                {message}
              </p>
              <div className="mb-5 cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
                <ShaltgaanTalbar
                  value={shaltgaan}
                  onChange={setShaltgaan}
                  aldaaKharuulakh={oroldson}
                  autoFocus
                  onEnter={batlaya}
                />
              </div>
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
                  onClick={batlaya}
                  disabled={ajillajBaina}
                  className="btn-minimal btn-cancel btn-minimal-sm px-4 py-2 !text-[11px]"
                  data-modal-primary
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
