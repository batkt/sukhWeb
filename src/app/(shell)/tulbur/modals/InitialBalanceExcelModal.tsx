"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { message } from "antd";
import { useAuth } from "@/lib/useAuth";
import Button from "@/components/ui/Button";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

interface InitialBalanceExcelModalProps {
  show: boolean;
  onClose: () => void;
  baiguullagiinId: string;
  barilgiinId?: string;
  onSuccess: () => void;
}

export default function InitialBalanceExcelModal({
  show,
  onClose,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
}: InitialBalanceExcelModalProps) {
  const { token } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  const handleDownloadTemplate = async () => {
    try {
      const resp = await uilchilgee(token || "").post(
        "/generateInitialBalanceTemplate",
        { baiguullagiinId, barilgiinId },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Эхний үлдэгдэл загвар_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      message.error("Загвар татахад алдаа гарлаа");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning("Excel файл сонгоно уу");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("baiguullagiinId", baiguullagiinId);
      if (barilgiinId) formData.append("barilgiinId", barilgiinId);
      formData.append("ognoo", selectedDate);

      const response = await uilchilgee(token || "").post(
        "/importInitialBalanceFromExcel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        message.success(response.data.message || "Амжилттай импортлогдлоо");
        onSuccess();
        onClose();
        setFile(null);
      } else {
        message.error(response.data.message || "Импортлоход алдаа гарлаа");
      }
    } catch (error: any) {
      console.error("Error uploading excel:", error);
      message.error(
        error.response?.data?.message || "Импортлоход алдаа гарлаа",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[12000]"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-transparent"
          onClick={onClose}
        />

        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          drag
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 bg-[color:var(--surface-bg)] rounded-[32px] shadow-2xl w-[min(560px,95vw)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Draggable Title Bar */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="-mt-2 mb-6 px-1 py-1 flex items-center justify-between cursor-move select-none"
            >
              <div className="text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                Эхний үлдэгдэл импорт (Excel)
              </div>
              <Button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                variant="ghost"
                className="p-2 rounded-full"
              >
                <X className="w-5 h-5 text-[color:var(--muted-text)]" />
              </Button>
            </div>
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-[color:var(--surface-border)] bg-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-theme/20"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[color:var(--muted-text)] italic">
                * Сонгосон огноогоор эхний үлдэгдэл бүртгэгдэнэ.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                group relative border-2 border-dashed rounded-[24px] p-12
                flex flex-col items-center justify-center gap-4 cursor-pointer
                transition-all duration-300
                ${
                  file
                    ? "border-theme/30 bg-theme/50"
                    : "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] hover:border-theme hover:bg-theme/30 dark:hover:border-theme/50"
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
              />

              <div
                className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-2
                transition-transform duration-300 group-hover:scale-110
                ${file ? "bg-success/10 text-success" : "bg-info/10 text-info"}
              `}
              >
                {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
              </div>

              <div className="text-center">
                <p className="text-lg  text-[color:var(--panel-text)] mb-1">
                  {file
                    ? file.name
                    : "Excel файл аа чирч оруулах эсвэл сонгоно уу"}
                </p>
                <p className="text-sm text-[color:var(--muted-text)]">
                  Эхний үлдэгдэл excel файл
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                onClick={handleDownloadTemplate}
                variant="ghost"
                className="text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Эхний үлдэгдэл загвар татах
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="px-6 py-2.5"
                >
                  Хаах
                </Button>
                <Button
                  onClick={handleUpload}
                  isLoading={isUploading}
                  disabled={!file || isUploading}
                  variant="primary"
                  className="px-8 py-2.5"
                >
                  {isUploading ? "Уншиж байна..." : "Хадгалах"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </ModalPortal>
    </AnimatePresence>
  );
}
