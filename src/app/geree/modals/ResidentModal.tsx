"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
} from "@/lib/residentDataHelper";

interface ResidentModalProps {
  show: boolean;
  onClose: () => void;
  editingResident: any;
  newResident: any;
  setNewResident: (val: any) => void;
  ortsOptions: string[];
  davkharOptions: string[];
  getTootOptions: (orts: string, floor: string) => string[];
  selectedBarilga: any;
  baiguullaga: any;
  currentResidents: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function ResidentModal({
  show,
  onClose,
  editingResident,
  newResident,
  setNewResident,
  ortsOptions,
  davkharOptions,
  getTootOptions,
  selectedBarilga,
  baiguullaga,
  currentResidents,
  onSubmit,
}: ResidentModalProps) {
  const residentRef = React.useRef<HTMLDivElement | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);

  // Snapshot of newResident when modal opens — used to detect unsaved changes
  const initialSnapshot = React.useRef<any>(null);
  React.useEffect(() => {
    if (show) {
      initialSnapshot.current = JSON.parse(JSON.stringify(newResident));
      setErrors([]);
    } else {
      setShowConfirmClose(false);
    }
  }, [show]);

  const hasChanges = React.useMemo(() => {
    if (!initialSnapshot.current) return false;
    return JSON.stringify(newResident) !== JSON.stringify(initialSnapshot.current);
  }, [newResident]);

  const requestClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const validate = () => {
    const newErrors: string[] = [];
    if (!newResident.ner?.trim()) newErrors.push("ner");
    if (
      !newResident.utas ||
      (Array.isArray(newResident.utas) && !newResident.utas[0]?.trim())
    )
      newErrors.push("utas");
    if (!newResident.orts?.trim()) newErrors.push("orts");
    if (!newResident.davkhar?.trim()) newErrors.push("davkhar");
    if (!newResident.toot?.trim()) newErrors.push("toot");

    setErrors(newErrors);

    if (newErrors.length > 0) {
      const fieldNames: Record<string, string> = {
        ner: "Нэр",
        utas: "Утас",
        orts: "Орц",
        davkhar: "Давхар",
        toot: "Тоот",
      };
      const missingFields = newErrors.map((e) => fieldNames[e]).join(", ");
      openErrorOverlay(
        `Дараах талбарууд бөглөх шаардлагатай: ${missingFields}`,
      );
      return false;
    }
    return true;
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Duplicate check: same ovog + ner + phone already registered
      const ovog = (newResident.ovog || "").toString().trim().toLowerCase();
      const ner = (newResident.ner || "").toString().trim().toLowerCase();
      const phone = (
        Array.isArray(newResident.utas)
          ? newResident.utas[0]
          : newResident.utas || ""
      )
        .toString()
        .trim();

      if (ovog && ner && phone && Array.isArray(currentResidents)) {
        const duplicates = currentResidents.filter((r: any) => {
          const rOvog = (r.ovog || "").toString().trim().toLowerCase();
          const rNer = (r.ner || "").toString().trim().toLowerCase();
          const rPhone = (Array.isArray(r.utas) ? r.utas[0] : r.utas || "")
            .toString()
            .trim();
          // Ignore the same resident when editing
          const isSameResident =
            editingResident &&
            String(editingResident._id || "") === String(r._id || "");
          if (isSameResident) return false;
          return rOvog === ovog && rNer === ner && rPhone === phone;
        });

        if (duplicates.length > 0) {
          const tootList = duplicates
            .map((r: any) => {
              const orts = r.orts || "-";
              const davkhar = r.davkhar || "-";
              const toot = r.toot || "-";
              return `${orts} орц, ${davkhar} давхар, ${toot} тоот`;
            })
            .join("; ");

          openErrorOverlay(
            `Энэ овог, нэр, утасны оршин суугч дараах тоот дээр бүртгэлтэй байна: ${tootList}. Давхардсан бүртгэл үүсгэх боломжгүй.`,
          );
          return;
        }
      }

      onSubmit(e);
    }
  };

  // Get sohNer from selectedBarilga or baiguullaga (must be before early return)
  const sohNer = React.useMemo(() => {
    if (selectedBarilga?.tokhirgoo?.sohNer) {
      return String(selectedBarilga.tokhirgoo.sohNer);
    }
    if (baiguullaga?.tokhirgoo?.sohNer) {
      return String(baiguullaga.tokhirgoo.sohNer);
    }
    if (baiguullaga?.ner) {
      return String(baiguullaga.ner);
    }
    return "";
  }, [selectedBarilga, baiguullaga]);

  useModalHotkeys({
    isOpen: show,
    onClose: requestClose,
    container: residentRef.current,
  });

  // Local state for formatted inputs
  const [uldegdelInput, setUldegdelInput] = React.useState("");
  const [zaaltInput, setZaaltInput] = React.useState("");

  const parseToNumber = (str: string) => {
    if (typeof str !== "string") return str || 0;
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

  const formatWithCommas = (val: any) => {
    if (val === undefined || val === null || val === "" || val === 0) return "";
    const num = typeof val === "string" ? parseToNumber(val) : val;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatWhileTyping = (val: string) => {
    const raw = val.replace(/[^0-9.]/g, "");
    if (!raw) return "";

    const parts = raw.split(".");
    let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (!integerPart && parts.length > 1) integerPart = "0";
    if (!integerPart) return "";

    if (parts.length > 1) {
      // User is typing decimals
      return integerPart + "." + (parts[1] + "00").slice(0, 2);
    }

    // No decimal point yet, but we want to show .00 live
    return integerPart + ".00";
  };

  const isEkhniiUldegdelDisabled = React.useMemo(() => {
    if (!editingResident) return false;
    const existing =
      editingResident.ekhniiUldegdel ?? editingResident.medeelel?.ekhniiUldegdel;
    const initial = initialSnapshot.current?.ekhniiUldegdel;
    // Disable if original record has non-zero OR if it was non-zero when modal opened (e.g. fetched from history)
    return (
      (existing != null && Number(existing) !== 0) ||
      (initial != null && Number(initial) !== 0)
    );
  }, [editingResident, show, initialSnapshot.current]);

  // Sync local state when modal opens or editingResident changes
  React.useEffect(() => {
    if (show) {
      setUldegdelInput(formatWithCommas(newResident.ekhniiUldegdel));
      setZaaltInput(formatWithCommas(newResident.tsahilgaaniiZaalt));
    }
  }, [show, editingResident]);

  if (!show) return null;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* INPUTS AND TEXTAREAS - IDENTICAL STYLING */
        .modern-input,
        .modern-textarea {
          height: 32px !important;
          padding: 0 10px !important;
          font-size: 0.75rem !important;
          border-radius: 6px !important;
          border: 1px solid #d1d5db !important;
          transition: all 0.2s ease !important;
          background: #ffffff !important;
          color: #111827 !important;
        }
        .modern-input.pr-extra {
          padding-right: 32px !important;
        }
        .modern-textarea {
          line-height: 32px !important;
          overflow: hidden !important;
        }
        
        /* INPUTS AND TEXTAREAS - DARK MODE IDENTICAL */
        html[data-mode="dark"] .modern-input,
        html[data-mode="dark"] .modern-textarea,
        [data-mode="dark"] .modern-input,
        [data-mode="dark"] .modern-textarea {
          border-color: var(--surface-border) !important;
          background: var(--surface-bg) !important;
          color: var(--panel-text) !important;
        }
        
        /* INPUTS AND TEXTAREAS - HOVER */
        .modern-input:hover,
        .modern-textarea:hover {
          border-color: #9ca3af !important;
        }
        html[data-mode="dark"] .modern-input:hover,
        html[data-mode="dark"] .modern-textarea:hover,
        [data-mode="dark"] .modern-input:hover,
        [data-mode="dark"] .modern-textarea:hover {
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
        
        /* INPUTS AND TEXTAREAS - FOCUS */
        .modern-input:focus,
        .modern-textarea:focus {
          outline: none !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        html[data-mode="dark"] .modern-input:focus,
        html[data-mode="dark"] .modern-textarea:focus,
        [data-mode="dark"] .modern-input:focus,
        [data-mode="dark"] .modern-textarea:focus {
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2) !important;
        }

        /* ERROR STATE */
        .input-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }
        html[data-mode="dark"] .input-error,
        [data-mode="dark"] .input-error {
          border-color: #f87171 !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        /* INPUTS AND TEXTAREAS - DISABLED */
        .modern-input:disabled,
        .modern-textarea:disabled {
          background: #f9fafb !important;
          cursor: not-allowed !important;
          opacity: 0.6 !important;
        }
        html[data-mode="dark"] .modern-input:disabled,
        html[data-mode="dark"] .modern-textarea:disabled,
        [data-mode="dark"] .modern-input:disabled,
        [data-mode="dark"] .modern-textarea:disabled {
          background: rgba(255, 255, 255, 0.05) !important;
          opacity: 0.6 !important;
        }
        
        /* INPUTS AND TEXTAREAS - PLACEHOLDER */
        .modern-input::placeholder,
        .modern-textarea::placeholder {
          color: #9ca3af !important;
        }
        html[data-mode="dark"] .modern-input::placeholder,
        html[data-mode="dark"] .modern-textarea::placeholder,
        [data-mode="dark"] .modern-input::placeholder,
        [data-mode="dark"] .modern-textarea::placeholder {
          color: rgba(229, 231, 235, 0.7) !important;
        }
        
        /* DROPDOWNS - SEPARATE THEME-BASED STYLING */
        .tusgai-wrapper {
          height: 32px !important;
          padding: 0 !important;
          font-size: 0.75rem !important;
          border-radius: 6px !important;
          border: none !important;
          transition: all 0.2s ease !important;
          background: transparent !important;
        }
        
        .tusgai-wrapper button {
          height: 100% !important;
          padding: 0 10px !important;
          font-size: 0.75rem !important;
          border: none !important;
          background: transparent !important;
          min-height: unset !important;
          border-radius: 6px !important;
          width: 100% !important;
        }
        .tusgai-wrapper button:focus {
          outline: none !important;
        }
        .tusgai-wrapper button span {
          font-size: 0.75rem !important;
          line-height: 1.5 !important;
        }
        .tusgai-wrapper svg {
          width: 14px !important;
          height: 14px !important;
        }
        
        /* DROPDOWN MENU - REMOVE GLOW/SHADOW EFFECTS */
        div[role="listbox"] > div {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* DROPDOWN MENU DARK MODE */
        html[data-mode="dark"] div[role="listbox"] > div,
        [data-mode="dark"] div[role="listbox"] > div {
          background: var(--surface-bg) !important;
          color: var(--panel-text) !important;
          border-color: var(--surface-border) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div.rounded-2xl,
        [data-mode="dark"] div[role="listbox"] > div.rounded-2xl {
          background: var(--surface-bg) !important;
          border-color: var(--surface-border) !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div button,
        [data-mode="dark"] div[role="listbox"] > div button {
          color: var(--panel-text) !important;
        }
      
        html[data-mode="dark"] div[role="listbox"] > div button[aria-selected="true"],
        [data-mode="dark"] div[role="listbox"] > div button[aria-selected="true"] {
          background: rgba(255, 255, 255, 0.15) !important;
          color: var(--panel-text) !important;
          font-weight: 600 !important;
        }
        html[data-mode="dark"] div[role="listbox"] > div button:disabled,
        [data-mode="dark"] div[role="listbox"] > div button:disabled {
          color: rgba(229, 231, 235, 0.5) !important;
          opacity: 0.5 !important;
        }
      `,
        }}
      />
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
              ref={residentRef}
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative modal-surface modal-responsive sm:w-full sm:max-w-2xl rounded-xl shadow-2xl p-0 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-slate-600 dark:text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <h2 className="text-lg text-slate-900 dark:text-white">
                    {editingResident
                      ? "Оршин суугчийн мэдээлэл засах"
                      : "Оршин суугч нэмэх"}
                  </h2>
                </div>
                <button
                  onClick={requestClose}
                  className="p-1.5 rounded-lg transition-all duration-200  active:scale-95"
                  aria-label="Хаах"
                  title="Хаах"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-slate-500 dark:text-slate-400"
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

              <form
                onSubmit={handleLocalSubmit}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Төрөл */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Төрөл
                      </label>
                      <div className="tusgai-wrapper w-full flex items-center">
                        <TusgaiZagvar
                          value={newResident.turul || "Үндсэн"}
                          onChange={(val: string) => {
                            setNewResident((p: any) => ({ ...p, turul: val }));
                          }}
                          options={[
                            { value: "Үндсэн", label: "Үндсэн" },
                            { value: "Түр", label: "Түр" },
                          ]}
                          className="w-full h-full"
                          placeholder="Төрөл сонгох..."
                        />
                      </div>
                    </div>

                    {/* Овог */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Овог
                      </label>
                      <input
                        type="text"
                        value={newResident.ovog || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewResident((p: any) => ({ ...p, ovog: value }));
                        }}
                        className="modern-input w-full"
                      />
                    </div>

                    {/* Нэр */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Нэр
                      </label>
                      <input
                        type="text"
                        value={newResident.ner || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүёӨҮЁ-]/g,
                            "",
                          );
                          setNewResident((p: any) => ({ ...p, ner: value }));
                        }}
                        className={`modern-input w-full ${errors.includes("ner") ? "input-error" : ""}`}
                      />
                    </div>

                    {/* Утас */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Утас
                      </label>
                      <input
                        type="tel"
                        value={
                          Array.isArray(newResident.utas)
                            ? newResident.utas[0] || ""
                            : newResident.utas || ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 8);
                          setNewResident((p: any) => ({ ...p, utas: [value] }));
                        }}
                        className={`modern-input w-full ${errors.includes("utas") ? "input-error" : ""}`}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>

                    {/* СӨХ нэр, Орц, Давхар, Тоот - One row */}
                    <div className="md:col-span-2 grid grid-cols-4 gap-2">
                      {/* СӨХ нэр (Регистр) */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          СӨХ нэр
                        </label>
                        <input
                          type="text"
                          value={sohNer || ""}
                          className="modern-input w-full"
                          readOnly
                          disabled
                        />
                      </div>

                      {/* Орц */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          Орц
                        </label>
                        <div
                          className={`tusgai-wrapper w-full flex items-center ${errors.includes("orts") ? "input-error" : ""}`}
                        >
                          <TusgaiZagvar
                            value={newResident.orts || ""}
                            onChange={(val: string) => {
                              setNewResident((p: any) => ({
                                ...p,
                                orts: val,
                                toot: "",
                              }));
                            }}
                            options={
                              ortsOptions.length > 0
                                ? ortsOptions.map((o) => ({
                                    value: o,
                                    label: o,
                                  }))
                                : [{ value: "", label: "Орц тохируулаагүй" }]
                            }
                            className="w-full h-full"
                            placeholder="Сонгох..."
                          />
                        </div>
                      </div>

                      {/* Давхар */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          Давхар
                        </label>
                        <div
                          className={`tusgai-wrapper w-full flex items-center ${errors.includes("davkhar") ? "input-error" : ""}`}
                        >
                          <TusgaiZagvar
                            value={newResident.davkhar || ""}
                            onChange={(val: string) => {
                              setNewResident((p: any) => ({
                                ...p,
                                davkhar: val,
                                toot: "",
                              }));
                            }}
                            options={
                              davkharOptions.length > 0
                                ? davkharOptions.map((d) => ({
                                    value: d,
                                    label: d,
                                  }))
                                : [{ value: "", label: "Давхар тохируулаагүй" }]
                            }
                            className="w-full h-full"
                            placeholder="Сонгох..."
                          />
                        </div>
                      </div>

                      {/* Тоот */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          Тоот
                        </label>
                        <div
                          className={`tusgai-wrapper w-full flex items-center ${errors.includes("toot") ? "input-error" : ""} ${!newResident.orts || !newResident.davkhar ? "disabled" : ""}`}
                        >
                          <TusgaiZagvar
                            value={newResident.toot || ""}
                            onChange={(val: string) => {
                              setNewResident((p: any) => ({ ...p, toot: val }));
                            }}
                            options={
                              getTootOptions(
                                newResident.orts || "",
                                newResident.davkhar || "",
                              ).length > 0
                                ? getTootOptions(
                                    newResident.orts || "",
                                    newResident.davkhar || "",
                                  ).map((t) => {
                                    const isOccupied = currentResidents?.some(
                                      (r: any) => {
                                        const rOrts = String(
                                          getResidentOrts(r) || "",
                                        ).trim();
                                        const rDavkhar = String(
                                          getResidentDavkhar(r) || "",
                                        ).trim();
                                        const rToot = String(
                                          getResidentToot(r) || "",
                                        ).trim();
                                        const isSameUnit =
                                          rOrts ===
                                            String(
                                              newResident.orts || "",
                                            ).trim() &&
                                          rDavkhar ===
                                            String(
                                              newResident.davkhar || "",
                                            ).trim() &&
                                          rToot === String(t || "").trim();
                                        const isDifferentResident =
                                          String(r._id || "") !==
                                          String(editingResident?._id || "");
                                        return (
                                          isSameUnit && isDifferentResident
                                        );
                                      },
                                    );
                                    return { value: t, label: t, isOccupied };
                                  })
                                : [{ value: "", label: "Тоотын сонгох" }]
                            }
                            className="w-full h-full"
                            placeholder="Сонгох..."
                            disabled={!newResident.orts || !newResident.davkhar}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Барилгын нэр */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Барилгын нэр
                      </label>
                      <input
                        type="text"
                        value={selectedBarilga?.ner || ""}
                        className="modern-input w-full"
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Эхний үлдэгдэл */}
                    <div>
                      <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                        Эхний үлдэгдэл
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={uldegdelInput}
                          onChange={(e) => {
                            const inputVal = e.target.value;
                            const selectionStart = e.target.selectionStart;
                            
                            // If user is deleting or typing normally, we need to handle the .00
                            const formatted = formatWhileTyping(inputVal);
                            
                            setUldegdelInput(formatted);
                            const num = parseFloat(formatted.replace(/,/g, ""));
                            setNewResident((p: any) => ({
                              ...p,
                              ekhniiUldegdel: isNaN(num) ? 0 : num,
                            }));

                            // Optional: Restore cursor position logic can be complex here
                            // but for simple .00 suffix, the cursor usually stays at the end of the integer part
                          }}
                          onBlur={() => {
                            setUldegdelInput(formatWithCommas(uldegdelInput));
                          }}
                          className="modern-input w-full pr-extra text-right "
                          placeholder="0.00"
                          disabled={isEkhniiUldegdelDisabled}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-[var(--panel-text)] text-xs pointer-events-none"></span>
                      </div>
                    </div>

                    {/* Тайлбар and Цахилгааны заалт - One row */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-2">
                      {/* Тайлбар */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          Тайлбар
                        </label>
                        <textarea
                          value={newResident.tailbar || ""}
                          onChange={(e) => {
                            setNewResident((p: any) => ({
                              ...p,
                              tailbar: e.target.value,
                            }));
                          }}
                          className="modern-textarea w-full resize-none"
                          placeholder="Тайлбар..."
                        />
                      </div>

                      {/* Цахилгаан кВт */}
                      <div>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 transition-colors">
                          Цахилгаан кВт
                        </label>
                        <input
                          type="text"
                          value={zaaltInput}
                          onChange={(e) => {
                            const inputVal = e.target.value;
                            const formatted = formatWhileTyping(inputVal);
                            
                            setZaaltInput(formatted);
                            setNewResident((p: any) => ({
                              ...p,
                              tsahilgaaniiZaalt: formatted.replace(/,/g, ""),
                            }));
                          }}
                          onBlur={() => {
                            setZaaltInput(formatWithCommas(zaaltInput));
                          }}
                          className="modern-input w-full text-right "
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 gap-3 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                  <button
                    type="button"
                    onClick={requestClose}
                    className="ant-btn ant-btn-default min-w-[80px] text-sm py-2 px-4 rounded-lg"
                  >
                    Хаах
                  </button>
                  <button
                    type="submit"
                    className="ant-btn ant-btn-primary min-w-[80px] text-sm py-2 px-4 rounded-lg"
                    data-modal-primary
                  >
                    {editingResident ? "Хадгалах" : "Хадгалах"}
                  </button>
                </div>
              </form>
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
