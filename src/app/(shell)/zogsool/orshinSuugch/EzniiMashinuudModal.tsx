"use client";

import React, { useEffect } from "react";
import moment from "moment";
import { Car, Edit, Trash2, X } from "lucide-react";
import ModalPortal from "../../../../../components/shell/ModalPortal";
import { MashinBurtgekhNud } from "./ZogsoolOrshinSuugchTable";

/**
 * Нэг эзний бүх машин. Хүснэгтэд эзэн нэг л мөр эзэлдэг тул машин тус бүрийг
 * засах, устгах, шинээр нэмэх нь энэ цонхоор хийгдэнэ.
 * Засах/устгах цонхнууд (z-[12000]) энэ цонхны (z-[11000]) дээр нээгдэнэ.
 */
export default function EzniiMashinuudModal({
  ezen,
  onClose,
  onEdit,
  onDelete,
  onMashinNemekh,
}: {
  ezen: any;
  onClose: () => void;
  onEdit: (mur: any) => void;
  onDelete: (mur: any) => void;
  onMashinNemekh?: (ezen: any, dugaar: string) => Promise<boolean>;
}) {
  const muruud: any[] = ezen?.mashinMuruud || [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Дээр нь засах/устгах цонх нээлттэй бол тэр нь өөрөө хаагдана
      if (e.key === "Escape" && !document.querySelector(".z-\\[12000\\]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ezen) return null;
  const ner = ezen.ner || ezen.orshinSuugchNer || "Нэр тодорхойгүй";
  const toot = ezen.ezenToot || ezen.toot;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[11000] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--ctl-border)] px-6 py-4">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[color:var(--panel-text)]">
                {ner}-ийн машинууд
              </div>
              <div className="mt-0.5 text-[12px] text-[color:var(--muted-text)]">
                {[toot ? `${toot} тоот` : null, ezen.utas, `${muruud.length} машин`]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
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

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            <div className="overflow-hidden rounded-xl border border-[color:var(--ctl-border)]">
              <div className="grid grid-cols-[32px_minmax(0,1fr)_110px_minmax(0,1fr)_76px] gap-3 bg-[color:var(--surface-hover)] px-4 py-2.5 text-[12px] text-[color:var(--muted-text)]">
                <span>#</span>
                <span>Дугаар</span>
                <span>Төрөл</span>
                <span>Бүртгэсэн</span>
                <span className="text-center">Үйлдэл</span>
              </div>
              {muruud.length === 0 && (
                <div className="border-t border-[color:var(--ctl-border)] px-4 py-6 text-center text-[13px] text-[color:var(--muted-text)]">
                  Машин бүртгэлгүй
                </div>
              )}
              {muruud.map((m, i) => (
                <div
                  key={m._id || i}
                  className="grid grid-cols-[32px_minmax(0,1fr)_110px_minmax(0,1fr)_76px] items-center gap-3 border-t border-[color:var(--ctl-border)] px-4 py-2 text-[13px]"
                >
                  <span className="tabular-nums text-[color:var(--muted-text)]">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => onEdit(m)}
                    title="Засах"
                    className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-lg border border-success/30 bg-success/10 px-2 py-0.5 font-medium tracking-wide text-success transition-colors hover:border-success/60 hover:bg-success/20"
                  >
                    <Car className="h-3.5 w-3.5 shrink-0" />
                    {m.mashiniiDugaar || "-"}
                  </button>
                  <span className="truncate text-[color:var(--panel-text)]">
                    {m.zochinTurul || m.turul || "Оршин суугч"}
                  </span>
                  <span className="min-w-0 truncate text-[12px] text-[color:var(--muted-text)]">
                    {m.createdAt ? moment(m.createdAt).format("YYYY-MM-DD") : "-"}
                    {m.burtgesenAjiltaniiNer && m.burtgesenAjiltaniiNer !== "-"
                      ? ` · ${m.burtgesenAjiltaniiNer}`
                      : ""}
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      title="Засах"
                      className="rounded-lg p-1.5 text-[color:var(--panel-text)] transition-colors hover:bg-[color:var(--surface-hover)]"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m)}
                      title="Устгах"
                      className="rounded-lg p-1.5 text-[color:var(--panel-text)] transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[color:var(--ctl-border)] px-6 py-3 text-[13px]">
            {onMashinNemekh ? (
              <MashinBurtgekhNud onSave={(d) => onMashinNemekh(ezen, d)} />
            ) : (
              <span />
            )}
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
