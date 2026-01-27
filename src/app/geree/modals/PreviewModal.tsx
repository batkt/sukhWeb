"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModalPortal } from "../../../../components/golContent";

interface PreviewModalProps {
  show: boolean;
  onClose: () => void;
  template: any;
}

export default function PreviewModal({ show, onClose, template }: PreviewModalProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative modal-surface modal-responsive sm:w-full sm:max-w-4xl rounded-2xl shadow-2xl p-6 overflow-auto max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Загварын урьдчилсан харалт
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-300 rounded-2xl transition-colors"
                aria-label="Хаах"
                title="Хаах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-theme"
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

            <div className="paper-viewport theme-print-preview">
              <div className="paper-legal">
                {template?.zuunTolgoi && (
                  <div
                    className="preview-section header-left"
                    dangerouslySetInnerHTML={{ __html: template.zuunTolgoi }}
                  />
                )}
                {template?.baruunTolgoi && (
                  <div
                    className="preview-section header-right"
                    dangerouslySetInnerHTML={{ __html: template.baruunTolgoi }}
                  />
                )}
                <div
                  className="preview-content prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: template?.aguulga || "" }}
                />
                {template?.zuunKhul && (
                  <div
                    className="preview-section footer-left"
                    dangerouslySetInnerHTML={{ __html: template.zuunKhul }}
                  />
                )}
                {template?.baruunKhul && (
                  <div
                    className="preview-section footer-right"
                    dangerouslySetInnerHTML={{ __html: template.baruunKhul }}
                  />
                )}
              </div>
              <style jsx global>{`
                .theme-print-preview .preview-content,
                .theme-print-preview .preview-content *,
                .theme-print-preview .preview-section,
                .theme-print-preview .preview-section * {
                  color: var(--panel-text) !important;
                }
                .theme-print-preview .paper-legal {
                  background: var(--surface-bg) !important;
                }
                .theme-print-preview .preview-content a,
                .theme-print-preview .preview-section a {
                  color: var(--panel-text) !important;
                  text-decoration: underline;
                }
                .theme-print-preview .preview-content table,
                .theme-print-preview .preview-section table {
                  color: var(--panel-text) !important;
                }
                .theme-print-preview .preview-content span[data-tag-type],
                .theme-print-preview .preview-section span[data-tag-type] {
                  background: var(--surface-hover) !important;
                  border: 1px solid var(--surface-border) !important;
                  border-radius: 4px !important;
                  padding: 2px 6px !important;
                  margin: 0 2px !important;
                  font-weight: 500 !important;
                  display: inline-block !important;
                }
                .theme-print-preview .preview-content span[data-tag-type]:before,
                .theme-print-preview .preview-section span[data-tag-type]:before {
                  content: attr(data-tag-type) ": " !important;
                  font-weight: bold !important;
                  color: var(--theme-color) !important;
                }
                .theme-print-preview .header-left {
                  position: absolute;
                  top: 20px;
                  left: 20px;
                  max-width: 40%;
                }
                .theme-print-preview .header-right {
                  position: absolute;
                  top: 20px;
                  right: 20px;
                  max-width: 40%;
                  text-align: right;
                }
                .theme-print-preview .footer-left {
                  position: absolute;
                  bottom: 20px;
                  left: 20px;
                  max-width: 40%;
                }
                .theme-print-preview .footer-right {
                  position: absolute;
                  bottom: 20px;
                  right: 20px;
                  max-width: 40%;
                  text-align: right;
                }
                .theme-print-preview .paper-legal {
                  position: relative;
                  min-height: 100%;
                  padding: 60px 20px 60px 20px;
                }
              `}</style>
            </div>
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}