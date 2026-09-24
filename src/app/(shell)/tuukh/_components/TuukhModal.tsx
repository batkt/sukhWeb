"use client";

import React from "react";
import { ArrowRight, X } from "lucide-react";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { auditAngilalNer } from "@/lib/auditTurluud";
import {
  type AuditMur,
  USTGASAN_NUUKH_TALBAR,
  ognooKharuulakh,
  talbariinNer,
  utgaFormat,
} from "./auditUtils";

interface Props {
  mur: AuditMur | null;
  /** "zassan" бол өөрчлөлтүүд, "ustgasan" бол устгасан баримтын агшин зураг */
  turul: "zassan" | "ustgasan";
  onClose: () => void;
}

const Utga = ({ utga, className = "" }: { utga: string | null; className?: string }) =>
  utga === null ? (
    <span className="italic text-[color:var(--muted-text)]">(хоосон)</span>
  ) : (
    <span className={`whitespace-pre-wrap break-words ${className}`}>{utga}</span>
  );

export default function TuukhModal({ mur, turul, onClose }: Props) {
  useModalHotkeys({ isOpen: !!mur, onClose });
  if (!mur) return null;

  const garchig = mur.ner || mur.dugaar || "-";
  const zassan = turul === "zassan";

  const ustgasanTalbaruud = !zassan && mur.deletedData
    ? Object.entries(mur.deletedData)
        .filter(([k]) => !k.startsWith("_") && !USTGASAN_NUUKH_TALBAR.has(k))
        .map(([k, v]) => ({ talbar: k, label: talbariinNer(k), utga: utgaFormat(v) }))
        .filter((t) => t.utga !== null)
    : [];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Толгой */}
          <div className="flex items-start gap-3 border-b border-[color:var(--ctl-border)] px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-[color:var(--muted-text)]">
                {auditAngilalNer(mur.turul)}
              </div>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[15px] font-medium text-[color:var(--panel-text)]">
                  {garchig}
                </span>
                {mur.ner && mur.dugaar && (
                  <span className="shrink-0 text-[12px] text-[color:var(--muted-text)]">
                    {mur.dugaar}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[12px] text-[color:var(--muted-text)]">
                {zassan ? "Зассан" : "Устгасан"}: {mur.ajiltniiNer} ·{" "}
                {ognooKharuulakh(mur.uildelOgnoo, true)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Хаах"
              className="rounded-lg p-1.5 text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4 custom-scrollbar">
            {!zassan && mur.shaltgaan && (
              <div className="rounded-xl border border-[color:var(--ctl-border)] px-3.5 py-2.5 text-[13px]">
                <div className="text-[12px] text-[color:var(--muted-text)]">Шалтгаан</div>
                <div className="mt-0.5 text-[color:var(--panel-text)]">{mur.shaltgaan}</div>
              </div>
            )}

            {zassan &&
              (mur.uurchlultuud.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[color:var(--muted-text)]">
                  Мэдэгдэхүйц өөрчлөлт алга
                </div>
              ) : (
                mur.uurchlultuud.map((c, i) => (
                  <div
                    key={`${c.talbar}-${i}`}
                    className="rounded-xl border border-[color:var(--ctl-border)] px-3.5 py-3"
                  >
                    <div className="mb-2 text-[13px] font-medium text-[color:var(--panel-text)]">
                      {c.label}
                    </div>
                    <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
                      <div className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
                        <Utga utga={utgaFormat(c.umnukh)} className="line-through decoration-danger/60" />
                      </div>
                      <ArrowRight className="hidden h-4 w-4 self-center text-[color:var(--muted-text)] sm:block" />
                      <div className="rounded-lg bg-success/10 px-3 py-2 text-[13px] text-success">
                        <Utga utga={utgaFormat(c.shine)} />
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {!zassan &&
              (ustgasanTalbaruud.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[color:var(--muted-text)]">
                  Устгасан баримтын мэдээлэл алга
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ustgasanTalbaruud.map((t) => (
                    <div
                      key={t.talbar}
                      className="rounded-xl border border-[color:var(--ctl-border)] px-3.5 py-2.5"
                    >
                      <div className="text-[12px] text-[color:var(--muted-text)]">{t.label}</div>
                      <div className="mt-0.5 max-h-40 overflow-y-auto text-[13px] text-[color:var(--panel-text)] custom-scrollbar">
                        <Utga utga={t.utga} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
