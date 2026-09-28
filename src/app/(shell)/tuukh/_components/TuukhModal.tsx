"use client";

import React, { useMemo } from "react";
import { ArrowRight, FilePen, Trash2, X } from "lucide-react";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";
import { auditAngilalNer } from "@/lib/auditTurluud";
import {
  type AuditMur,
  USTGASAN_NUUKH_TALBAR,
  dedUurchlultuud,
  objectIdEsekh,
  ognooKharuulakh,
  talbariinNer,
  utgaFormat,
} from "./auditUtils";

interface Props {
  mur: AuditMur | null;
  /** "zassan" бол өөрчлөлтүүд, "ustgasan" бол устгасан баримтын агшин зураг */
  turul: "zassan" | "ustgasan";
  /** ID → хүний нэр (ажилтан г.м.) */
  idNer?: Record<string, string>;
  onClose: () => void;
}

const Utga = ({ utga, className = "" }: { utga: string | null; className?: string }) =>
  utga === null ? (
    <span className="italic text-[color:var(--muted-text)]">(хоосон)</span>
  ) : (
    <span className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`}>{utga}</span>
  );

const Ustsan = () => <span className="italic text-[color:var(--muted-text)]">(устгагдсан)</span>;

/** Устгасан баримтын гол талбарууд — эхэнд, энэ дарааллаар */
const GOL_TALBAR = [
  "ner", "ovog", "utas", "mail", "register", "toot", "davkhar", "orts",
  "mashiniiDugaar", "gereeniiDugaar", "nekhemjlekhiinDugaar", "dugaar",
  "turul", "tuluv", "dun", "tulukhDun", "tulsunDun", "uldegdel", "ognoo", "tailbar",
];

export default function TuukhModal({ mur, turul, idNer = {}, onClose }: Props) {
  // Утга: огноо/төлөв хөрвүүлсэн мөр; ID бол ажилтны нэр эсвэл товч ID
  const kharuul = (v: unknown): string | null => {
    const u = typeof v === "string" && v.length === 24 ? v : utgaFormat(v);
    if (u === null) return null;
    if (objectIdEsekh(u)) return idNer[u] || `ID …${u.slice(-6)}`;
    return u;
  };
  useModalHotkeys({ isOpen: !!mur, onClose });

  const zassan = turul === "zassan";

  // Устгасан баримтыг засварын цонхтой ИЖИЛ хэлбэрээр: талбар бүр «өмнө → (устсан)»
  const uurchlultuud = useMemo(() => {
    if (!mur) return [];
    if (zassan) return mur.uurchlultuud;
    if (!mur.deletedData) return [];
    const erembe = (t: string) => {
      const i = GOL_TALBAR.indexOf(t);
      return i < 0 ? 999 : i;
    };
    return Object.entries(mur.deletedData)
      .filter(([k]) => !k.startsWith("_") && !USTGASAN_NUUKH_TALBAR.has(k) && !/Id$/.test(k))
      .filter(([, v]) => utgaFormat(v) !== null)
      .map(([k, v]) => ({ talbar: k, label: talbariinNer(k), umnukh: v, shine: null as unknown }))
      // Зөвхөн энгийн (гол) талбарууд — нийлмэл объект/массивыг харуулахгүй
      .filter((c) => dedUurchlultuud(c.umnukh, null) === null)
      .sort((x, y) => erembe(x.talbar) - erembe(y.talbar));
  }, [mur, zassan]);

  if (!mur) return null;
  const garchig = mur.ner || mur.dugaar || "-";

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
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                zassan ? "bg-theme/10 text-brand" : "bg-danger/10 text-danger"
              }`}
            >
              {zassan ? <FilePen className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
            </div>
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[color:var(--muted-text)]">
                <span
                  className={`rounded-md px-2 py-0.5 ${
                    zassan ? "bg-theme/10 text-brand" : "bg-danger/10 text-danger"
                  }`}
                >
                  {zassan ? "Зассан" : "Устгасан"}: {mur.ajiltniiNer}
                </span>
                <span className="rounded-md bg-[color:var(--surface-hover)] px-2 py-0.5 tabular-nums">
                  {ognooKharuulakh(mur.uildelOgnoo, true)}
                </span>
                {mur.bichlegiinOgnoo && (
                  <span className="rounded-md bg-[color:var(--surface-hover)] px-2 py-0.5 tabular-nums">
                    Бүртгэсэн: {ognooKharuulakh(mur.bichlegiinOgnoo)}
                  </span>
                )}
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
              <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-[13px]">
                <div className="text-[12px] text-warning">Устгасан шалтгаан</div>
                <div className="mt-0.5 text-[color:var(--panel-text)] [overflow-wrap:anywhere]">
                  {mur.shaltgaan}
                </div>
              </div>
            )}

            {uurchlultuud.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[color:var(--muted-text)]">
                  {zassan ? "Мэдэгдэхүйц өөрчлөлт алга" : "Устгасан баримтын мэдээлэл алга"}
                </div>
              ) : (
                uurchlultuud.map((c, i) => {
                  const ded = dedUurchlultuud(c.umnukh, c.shine);
                  return (
                    <div
                      key={`${c.talbar}-${i}`}
                      className="min-w-0 rounded-xl border border-[color:var(--ctl-border)] px-3.5 py-3"
                    >
                      <div className="mb-2 text-[13px] font-medium text-[color:var(--panel-text)]">
                        {c.label}
                      </div>
                      {ded ? (
                        // Объект/массив: зөвхөн өөрчлөгдсөн дэд талбарууд
                        ded.length === 0 ? (
                          <div className="text-[12px] text-[color:var(--muted-text)]">
                            Дотоод бүтэц өөрчлөгдсөн (утга ижил)
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-[color:var(--ctl-border)]">
                            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-[color:var(--surface-hover)] px-3 py-1.5 text-[11px] text-[color:var(--muted-text)]">
                              <span>Талбар</span>
                              <span>Өмнө</span>
                              <span>Одоо</span>
                            </div>
                            {ded.map((d) => (
                              <div
                                key={d.zam}
                                className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-[color:var(--ctl-border)] px-3 py-1.5 text-[12px]"
                              >
                                <span className="text-[color:var(--muted-text)] [overflow-wrap:anywhere]">{d.label}</span>
                                <span className="text-danger">
                                  <Utga utga={kharuul(d.umnukh)} className="line-through decoration-danger/60" />
                                </span>
                                <span className="text-success">
                                  {zassan ? <Utga utga={kharuul(d.shine)} /> : <Ustsan />}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                          <div className="min-w-0 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
                            <Utga utga={kharuul(c.umnukh)} className="line-through decoration-danger/60" />
                          </div>
                          <ArrowRight className="hidden h-4 w-4 self-center text-[color:var(--muted-text)] sm:block" />
                          <div
                            className={`min-w-0 rounded-lg px-3 py-2 text-[13px] ${
                              zassan ? "bg-success/10 text-success" : "bg-[color:var(--surface-hover)]"
                            }`}
                          >
                            {zassan ? <Utga utga={kharuul(c.shine)} /> : <Ustsan />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

          </div>

          <div className="flex justify-end border-t border-[color:var(--ctl-border)] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-minimal inline-flex h-9 items-center !px-4 text-[13px]"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
