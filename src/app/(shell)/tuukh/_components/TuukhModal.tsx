"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import useModalHotkeys from "@/lib/useModalHotkeys";
import {
  type AuditMur,
  GOL_TALBAR,
  USTGASAN_NUUKH_TALBAR,
  dedUurchlultuud,
  massiviinUurchlult,
  ustgasanTovch,
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

/** Засварын хүснэгтийн нэг мөр: Талбар | Өмнөх утга → Шинэ утга */
interface ZasvarMur {
  key: string;
  talbar: string;
  /** Талбарын доор саарлаар: аль жагсаалт/мөрийнх вэ */
  kontekst?: string;
  umnukh: string | null;
  shine: string | null;
}

const Utga = ({ utga }: { utga: string | null }) =>
  utga === null ? (
    <span className="italic opacity-60">(хоосон)</span>
  ) : (
    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{utga}</span>
  );

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
  const [khailt, setKhailt] = useState("");
  useEffect(() => setKhailt(""), [mur]);

  // Засвар: бүх өөрчлөлтийг (жагсаалт, объект дотор ч) нэг хавтгай хүснэгт болгоно
  const zasvarMuruud = useMemo<ZasvarMur[]>(() => {
    if (!mur) return [];
    const out: ZasvarMur[] = [];
    // Устгасан: баримтын талбар бүр «утга → Устгагдсан», гол талбарууд эхэнд
    if (!zassan) {
      // Товч загвартай бол (нэхэмжлэхийн зардал г.м.) зөвхөн хамааралтай талбарууд, тэр дарааллаар
      const songolt = ustgasanTovch(mur)?.talbaruud;
      const erembe = (t: string) => {
        const i = (songolt || GOL_TALBAR).indexOf(t);
        return i < 0 ? 999 : i;
      };
      Object.entries(mur.deletedData || {})
        .filter(([k]) => !songolt || songolt.includes(k))
        .filter(([k]) => !k.startsWith("_") && !USTGASAN_NUUKH_TALBAR.has(k) && !/(Id|Ids|Idnuud)$/.test(k))
        .sort(([a], [b]) => erembe(a) - erembe(b) || talbariinNer(a).localeCompare(talbariinNer(b), "mn"))
        .forEach(([k, v], i) => {
          const utga = kharuul(v);
          if (utga !== null) out.push({ key: `u${i}`, talbar: talbariinNer(k), umnukh: utga, shine: null });
        });
    } else mur.uurchlultuud.forEach((c, i) => {
      const massiv = massiviinUurchlult(c.umnukh, c.shine);
      if (massiv) {
        massiv.nemsen.forEach((t, j) =>
          out.push({ key: `${i}n${j}`, talbar: c.label, kontekst: "Нэмсэн", umnukh: null, shine: kharuul(t) }),
        );
        massiv.khassan.forEach((t, j) =>
          out.push({ key: `${i}k${j}`, talbar: c.label, kontekst: "Хассан", umnukh: kharuul(t), shine: null }),
        );
        massiv.uurchlugdsun.forEach((d, j) =>
          out.push({
            key: `${i}u${j}`,
            talbar: d.label,
            kontekst: [c.label, d.kontekst].filter(Boolean).join(" · "),
            umnukh: kharuul(d.umnukh),
            shine: kharuul(d.shine),
          }),
        );
        return;
      }
      const ded = dedUurchlultuud(c.umnukh, c.shine);
      if (ded) {
        ded.forEach((d, j) =>
          out.push({
            key: `${i}d${j}`,
            talbar: d.label,
            kontekst: c.label,
            umnukh: kharuul(d.umnukh),
            shine: kharuul(d.shine),
          }),
        );
        return;
      }
      out.push({ key: `${i}`, talbar: c.label, umnukh: kharuul(c.umnukh), shine: kharuul(c.shine) });
    });
    // Нэр нь олдоогүй ID-г (ID …97eebf) хэрэглэгчид харуулахгүй
    const idUtga = (u: string | null) => u !== null && u.startsWith("ID …");
    const tsever = out.filter((m) => !idUtga(m.umnukh) && !idUtga(m.shine));
    const q = khailt.trim().toLowerCase();
    if (!q) return tsever;
    return tsever.filter((m) =>
      [m.talbar, m.kontekst, m.umnukh, m.shine].join(" ").toLowerCase().includes(q),
    );
  }, [mur, zassan, khailt, idNer]);

  if (!mur) return null;

  const dedGarchig = [mur.ner, mur.dugaar].filter((x, i, a) => x && a.indexOf(x) === i).join(" · ");
  const niitMur = khailt.trim() === "" ? zasvarMuruud.length : null;
  const tovch = zassan ? null : ustgasanTovch(mur);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Гарчиг */}
          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--ctl-border)] px-6 py-4">
            <div className="text-[15px] font-semibold text-[color:var(--panel-text)]">
              Дэлгэрэнгүй Мэдээлэл
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Хаах"
              className="-mr-2 rounded-lg p-1.5 text-[color:var(--muted-text)] transition-colors hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Мэдээлэл: зүүн — юуг, баруун — хэн, хэзээ */}
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-[color:var(--ctl-border)] px-6 py-3 text-[13px]">
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 gap-1.5">
                <span className="shrink-0 font-semibold text-[color:var(--muted-text)]">Төрөл:</span>
                <span className="truncate text-[color:var(--panel-text)]">{mur.angilalNer}</span>
              </div>
              <div className="flex min-w-0 gap-1.5">
                <span className="shrink-0 font-semibold text-[color:var(--muted-text)]">Нэр:</span>
                <span className="truncate text-brand" title={dedGarchig}>
                  {dedGarchig || "-"}
                </span>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <div className="flex gap-1.5 sm:justify-end">
                <span className="shrink-0 font-semibold text-[color:var(--muted-text)]">
                  {zassan ? "Зассан" : "Устгасан"} ажилтан:
                </span>
                <span className="text-[color:var(--panel-text)]">{mur.ajiltniiNer}</span>
              </div>
              <div className="flex gap-1.5 sm:justify-end">
                <span className="shrink-0 font-semibold text-[color:var(--muted-text)]">
                  {zassan ? "Зассан" : "Устгасан"} огноо:
                </span>
                <span className="tabular-nums text-[color:var(--panel-text)]">
                  {ognooKharuulakh(mur.uildelOgnoo, true)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 custom-scrollbar">
            {/* Устгасан: юу болсныг нэг өгүүлбэрээр */}
            {tovch && (
              <div className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3">
                <div className="text-[14px] font-medium text-[color:var(--panel-text)]">
                  {tovch.garchig}
                </div>
                {tovch.delgerengui && (
                  <div className="mt-0.5 text-[13px] text-danger">{tovch.delgerengui}</div>
                )}
              </div>
            )}

            {/* Засвар, устгал хоёулаа ижил хүснэгт: Талбар | Өмнөх утга → Шинэ утга */}
            {(zassan ? mur.uurchlultuud.length > 3 : zasvarMuruud.length > 6) || khailt ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[color:var(--muted-text)]">
                  {niitMur !== null
                    ? `${niitMur} ${zassan ? "өөрчлөлт" : "талбар"}`
                    : `${zasvarMuruud.length} илэрц`}
                </span>
                <div className="relative ml-auto w-full max-w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-text)]" />
                  <input
                    value={khailt}
                    onChange={(e) => setKhailt(e.target.value)}
                    placeholder="Талбар, утга хайх..."
                    className="h-8 w-full rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-hover)] pl-8 pr-3 text-[12px] text-[color:var(--panel-text)] outline-none placeholder:text-[color:var(--muted-text)] focus:border-theme"
                  />
                </div>
              </div>
            ) : null}

            {zasvarMuruud.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[color:var(--muted-text)]">
                {khailt.trim()
                  ? "Хайлтад тохирох мэдээлэл алга"
                  : zassan
                    ? "Мэдэгдэхүйц өөрчлөлт алга"
                    : "Устгасан баримтын мэдээлэл алга"}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[color:var(--ctl-border)]">
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_20px_minmax(0,1fr)] gap-3 bg-[color:var(--surface-hover)] px-4 py-2.5 text-[12px] text-[color:var(--muted-text)]">
                  <span>Талбар</span>
                  <span>Өмнөх утга</span>
                  <span />
                  <span>Шинэ утга</span>
                </div>
                {zasvarMuruud.map((m) => (
                  <div
                    key={m.key}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_20px_minmax(0,1fr)] items-center gap-3 border-t border-[color:var(--ctl-border)] px-4 py-2 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[color:var(--panel-text)] [overflow-wrap:anywhere]">
                        {m.talbar}
                      </div>
                      {m.kontekst && (
                        <div className="mt-0.5 text-[11px] text-[color:var(--muted-text)] [overflow-wrap:anywhere]">
                          {m.kontekst}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 rounded-md bg-danger/10 px-2.5 py-1.5 text-danger">
                      <Utga utga={m.umnukh} />
                    </div>
                    <ArrowRight className="h-4 w-4 justify-self-center text-[color:var(--muted-text)]" />
                    {zassan ? (
                      <div className="min-w-0 rounded-md bg-success/10 px-2.5 py-1.5 text-success">
                        <Utga utga={m.shine} />
                      </div>
                    ) : (
                      <div className="min-w-0 rounded-md bg-[color:var(--surface-hover)] px-2.5 py-1.5 italic text-[color:var(--muted-text)]">
                        Устгагдсан
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {mur.shaltgaan && (
              <div>
                <div className="mb-1.5 text-[13px] text-[color:var(--muted-text)]">
                  {zassan ? "Тайлбар" : "Устгасан шалтгаан"}
                </div>
                <div className="rounded-xl bg-[color:var(--surface-hover)] px-4 py-3 text-[13px] text-[color:var(--panel-text)] [overflow-wrap:anywhere]">
                  {mur.shaltgaan}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-[color:var(--ctl-border)] px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-minimal inline-flex h-9 items-center !px-5 text-[13px]"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
