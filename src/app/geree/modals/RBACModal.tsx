"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Check } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { ModalPortal } from "../../../../components/golContent";

interface RBACModalProps {
  show: boolean;
  onClose: () => void;
  employee: any;
  onSave: (employeeId: string, permissions: string[]) => Promise<void>;
}

// Define all available menu items
const MENU_ITEMS = [
  { id: "dashboard", label: "Хянах самбар", icon: "📊" },
  { id: "geree", label: "Гэрээ", icon: "📝" },
  { id: "tolov", label: "Төлөв", icon: "💰" },
  { id: "medegdel", label: "Мэдэгдэл", icon: "🔔" },
  { id: "ashiglaltiinZardal", label: "Ашиглалтын зардал", icon: "💵" },
  { id: "barilga", label: "Барилга", icon: "🏢" },
  { id: "tusuv", label: "Төсөв", icon: "📈" },
  { id: "settings", label: "Тохиргоо", icon: "⚙️" },
];

export default function RBACModal({ show, onClose, employee, onSave }: RBACModalProps) {
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  useModalHotkeys({ isOpen: show, onClose });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (show && employee) {
      // Initialize with employee's current permissions
      setSelectedPermissions(employee.permissions || []);
    }
  }, [show, employee]);

  const handleTogglePermission = (menuId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === MENU_ITEMS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(MENU_ITEMS.map((item) => item.id));
    }
  };

  const handleSave = async () => {
    if (!employee) return;
    
    setIsSaving(true);
    try {
      await onSave(employee._id, selectedPermissions);
      onClose();
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!show || !employee) return null;

  const allSelected = selectedPermissions.length === MENU_ITEMS.length;

  return (
    <AnimatePresence>
      {show && (
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl bg-[color:var(--surface-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[color:var(--surface-border)]"
          >
            {/* Header */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between p-6 border-b border-[color:var(--surface-border)] bg-gradient-to-r from-blue-500/10 to-purple-500/10 cursor-move select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl  text-theme">Эрхийн тохиргоо</h2>
                  <p className="text-sm text-theme/60">
                    {employee.ner || "Ажилтан"} - {employee.albanTushaal || ""}
                  </p>
                </div>
              </div>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[color:var(--surface-hover)] transition-colors"
              >
                <X className="w-5 h-5 text-theme" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Select All */}
              <div className="mb-4 p-4 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)]">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      allSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-[color:var(--surface-border)] group-hover:border-blue-400"
                    }`}
                  >
                    {allSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="sr-only"
                  />
                  <span className=" text-theme">Бүгдийг сонгох</span>
                </label>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MENU_ITEMS.map((item) => {
                  const isSelected = selectedPermissions.includes(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                          : "bg-[color:var(--surface-bg)] border-[color:var(--surface-border)] hover:border-blue-300"
                      }`}
                      onClick={() => handleTogglePermission(item.id)}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-[color:var(--surface-border)]"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePermission(item.id)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-2xl">{item.icon}</span>
                          <span className=" text-theme">{item.label}</span>
                        </div>
                      </label>
                    </motion.div>
                  );
                })}
              </div>

              {/* Permission Count */}
              <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                  <span className="">{selectedPermissions.length}</span> / {MENU_ITEMS.length} цэс сонгогдсон
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/30">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl  text-theme hover:bg-[color:var(--surface-hover)] transition-colors"
              >
                Хаах
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl  bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Хадгалах
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}
    </AnimatePresence>
  );
}
