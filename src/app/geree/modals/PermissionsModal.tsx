"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { ALL_PERMISSIONS, PermissionItem } from "@/lib/permissions";
import { Shield, ChevronDown, ChevronRight, Check } from "lucide-react";

interface PermissionsModalProps {
  show: boolean;
  onClose: () => void;
  employee: any;
  onSave: (permissions: string[]) => Promise<void>;
  permissionsData?: any;
}

export default function PermissionsModal({
  show,
  onClose,
  employee,
  onSave,
  permissionsData,
}: PermissionsModalProps) {
  // ... existing refs and state ...
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // ... existing hotkeys ...
  useModalHotkeys({
    isOpen: show,
    onClose,
    container: modalRef.current,
  });

  // ... existing useEffect ...
  useEffect(() => {
    if (employee?.tsonkhniiErkhuud) {
      setSelectedPermissions(employee.tsonkhniiErkhuud);
      // Auto-expand sections that have selected permissions
      const expanded = new Set<string>();
      employee.tsonkhniiErkhuud.forEach((perm: string) => {
        const parts = perm.split('.');
        if (parts.length > 1) {
          expanded.add(parts[0]);
        }
      });
      setExpandedSections(expanded);
    } else {
      setSelectedPermissions([]);
      setExpandedSections(new Set());
    }
  }, [employee]);

  // Helper to find module info from permissionsData
  const getModuleInfo = (permissionId: string) => {
    if (!permissionsData?.moduluud) return null;
    
    // Try to map permission ID to path
    // e.g. "geree" -> "/geree"
    // "tulbur.ebarimt" -> "/tulbur/ebarimt"
    
    // Simple mapping: /id or /id/subid
    const path = "/" + permissionId.replace(/\./g, "/");
    
    // Check exact match first
    let module = permissionsData.moduluud.find((m: any) => m.zam === path);
    if (module) return module;

    // Special cases mapping if needed
    // For now assuming the paths match the logic
    return null;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isPermissionSelected = (permissionId: string): boolean => {
    return selectedPermissions.includes(permissionId);
  };

  const togglePermission = (permissionId: string, item: PermissionItem) => {
    // Check limit
    const moduleInfo = getModuleInfo(permissionId);
    if (!isPermissionSelected(permissionId) && moduleInfo) {
      if (moduleInfo.odoogiin >= moduleInfo.bolomjit) {
        // Limit reached, prevent selection
        return;
      }
    }

    setSelectedPermissions((prev) => {
      const next = [...prev];
      const index = next.indexOf(permissionId);

      if (index > -1) {
        // Remove this permission
        next.splice(index, 1);
        
        // Also remove all child permissions
        if (item.children) {
          const removeChildren = (children: PermissionItem[]) => {
            children.forEach((child) => {
              const childIndex = next.indexOf(child.id);
              if (childIndex > -1) {
                next.splice(childIndex, 1);
              }
              if (child.children) {
                removeChildren(child.children);
              }
            });
          };
          removeChildren(item.children);
        }
      } else {
        // Add this permission
        next.push(permissionId);
      }

      return next;
    });
  };

  const toggleChildPermission = (childId: string) => {
    // Check limit for child
    const moduleInfo = getModuleInfo(childId);
    if (!isPermissionSelected(childId) && moduleInfo) {
      if (moduleInfo.odoogiin >= moduleInfo.bolomjit) {
        return;
      }
    }

    setSelectedPermissions((prev) => {
      const next = [...prev];
      const index = next.indexOf(childId);

      if (index > -1) {
        next.splice(index, 1);
      } else {
        next.push(childId);
      }

      return next;
    });
  };

  const selectAll = () => {
    // Should respect limits
    // For simplicity, we might just allow select all and let individual toggles handle or just bypass?
    // Better to filter allowed ones.
    const allIds: string[] = [];
    const traverse = (items: PermissionItem[]) => {
      items.forEach((item) => {
        // Check limit
        const moduleInfo = getModuleInfo(item.id);
        const isFull = moduleInfo ? moduleInfo.odoogiin >= moduleInfo.bolomjit : false;
        
        // Allow if already selected OR not full
        if (isPermissionSelected(item.id) || !isFull) {
           allIds.push(item.id);
        }

        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(ALL_PERMISSIONS);
    setSelectedPermissions(allIds);
    
    // Expand all sections
    const allSections = new Set(ALL_PERMISSIONS.map((p) => p.id));
    setExpandedSections(allSections);
  };

  // ... deselectAll and handleSave unchanged ...

  // UI Rendering Helper
  const renderLimitBadge = (permissionId: string) => {
    if (!permissionsData) return null;
    const info = getModuleInfo(permissionId);
    if (!info) return null;

    const isFull = info.odoogiin >= info.bolomjit;
    
    return (
      <div className="ml-auto pointer-events-none">
        <input 
          type="text" 
          value={`${info.odoogiin}/${info.bolomjit}`}
          readOnly
          className={`w-12 text-[10px] text-center px-1 py-0.5 rounded border ${
            isFull 
              ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" 
              : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
          } focus:outline-none`} 
        />
      </div>
    );
  };

  const isDisabled = (permissionId: string) => {
     if (!permissionsData) return false;
     const info = getModuleInfo(permissionId);
     if (!info) return false;
     // Disabled if Full AND Not Selected
     return info.odoogiin >= info.bolomjit && !isPermissionSelected(permissionId);
  };
 
  // ... Rest of render logic but inject isDisabled and renderLimitBadge ...
  
  // (Since I can't replace logic inside render easily without copy-pasting huge block, 
  // I will replace valid blocks. I'll split this task.)

  // I will just replace the interface and component start first.




  const deselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedPermissions);
      onClose();
    } catch (error) {
      console.error("Failed to save permissions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return null;

  const allChildrenSelected = (item: PermissionItem): boolean => {
    if (!item.children) return false;
    return item.children.every((child) => isPermissionSelected(child.id));
  };

  const someChildrenSelected = (item: PermissionItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => isPermissionSelected(child.id));
  };

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface w-[800px] max-w-[95vw] h-[650px] max-h-[90vh] rounded-xl shadow-2xl p-0 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-[color:var(--surface-border)]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold text-theme truncate">
                    Эрх тохируулах
                  </h2>
                  <p className="text-[10px] sm:text-xs text-subtle truncate">
                    {employee?.ner || employee?.nevtrekhNer} - {employee?.albanTushaal}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-[color:var(--hover-bg)] rounded-lg transition-colors shrink-0"
                aria-label="Хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 text-theme"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg-dark)] border-b border-[color:var(--surface-border)] flex items-center justify-between gap-2">
              <div className="text-[10px] sm:text-xs text-subtle">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedPermissions.length}</span> эрх
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2 py-1 text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  Бүгд
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2 py-1 text-[10px] sm:text-xs font-medium text-subtle hover:bg-[color:var(--hover-bg)] rounded transition-colors"
                >
                  Цэвэрлэх
                </button>
              </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 custom-scrollbar">
              {ALL_PERMISSIONS.map((item) => {
                const isExpanded = expandedSections.has(item.id);
                const isSelected = isPermissionSelected(item.id);
                const hasChildren = item.children && item.children.length > 0;
                const allSelected = hasChildren && allChildrenSelected(item);
                const someSelected = hasChildren && someChildrenSelected(item);
                const disabled = isDisabled(item.id);

                return (
                  <div 
                    key={item.id} 
                    className={`border border-[color:var(--surface-border)] rounded-lg overflow-hidden bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg-dark)] ${
                      disabled ? "opacity-60 grayscale" : ""
                    }`}
                  >
                    {/* Parent Permission */}
                    <div
                      className={`flex items-center justify-between p-2 transition-colors ${
                        disabled 
                          ? "cursor-not-allowed" 
                          : isSelected || someSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                            : "hover:bg-[color:var(--hover-bg)] cursor-pointer"
                      }`}
                      onClick={() => !disabled && hasChildren && toggleSection(item.id)}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection(item.id);
                            }}
                            className="p-0.5 hover:bg-[color:var(--hover-bg)] rounded transition-colors shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-theme" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-theme" />
                            )}
                          </button>
                        )}
                        
                        <div
                          className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 ${disabled ? "pointer-events-none" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) togglePermission(item.id, item);
                          }}
                        >
                          <div
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                              isSelected || allSelected
                                ? "bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600"
                                : someSelected
                                ? "bg-blue-200 dark:bg-blue-800 border-blue-400 dark:border-blue-600"
                                : "border-[color:var(--surface-border)]"
                            }`}
                          >
                            {(isSelected || allSelected) && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                            {someSelected && !allSelected && (
                              <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-sm" />
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1 flex items-center justify-between">
                            <div className="font-semibold text-theme text-xs sm:text-sm truncate mr-2">
                              {item.label}
                            </div>
                            {renderLimitBadge(item.id)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Child Permissions */}
                    {hasChildren && isExpanded && (
                      <div className="bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg-dark)] p-1.5 sm:p-2 space-y-1 border-t border-[color:var(--surface-border)]">
                        {item.children!.map((child) => {
                          const isChildSelected = isPermissionSelected(child.id);
                          const childDisabled = isDisabled(child.id);
                          
                          return (
                            <div
                              key={child.id}
                              className={`flex items-center gap-1.5 p-1.5 sm:p-2 rounded transition-colors ${
                                childDisabled
                                  ? "opacity-60 grayscale cursor-not-allowed"
                                  : isChildSelected
                                    ? "bg-blue-100 dark:bg-blue-900/30 cursor-pointer"
                                    : "hover:bg-[color:var(--hover-bg)] cursor-pointer"
                              }`}
                              onClick={() => !childDisabled && toggleChildPermission(child.id)}
                            >
                              <div
                                className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                                  isChildSelected
                                    ? "bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600"
                                    : "border-[color:var(--surface-border)]"
                                }`}
                              >
                                {isChildSelected && (
                                  <Check className="w-2 h-2 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="text-[10px] sm:text-xs font-medium text-theme truncate mr-2">
                                  {child.label}
                                </div>
                                {renderLimitBadge(child.id)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-3 sm:px-4 py-2 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] dark:bg-[color:var(--surface-bg-dark)]">
              <button
                type="button"
                onClick={onClose}
                className="btn-minimal-ghost btn-cancel px-3 py-1.5 text-xs"
                disabled={isSaving}
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-minimal btn-save px-3 py-1.5 text-xs"
                disabled={isSaving}
                data-modal-primary
              >
                {isSaving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}
