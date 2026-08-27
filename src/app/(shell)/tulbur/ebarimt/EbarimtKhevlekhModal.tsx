"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X } from "lucide-react";
import moment from "moment";
import formatNumber from "../../../../../tools/function/formatNumber";
import type { EbarimtItem } from "./EbarimtTable";

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted ? createPortal(children as any, document.body) : null;
};

/**
 * Зөвхөн баримтыг цаасан дээр гаргана. Дэлгэц дээрх бусад бүх зүйлийг нуух
 * замаар (visibility) хийж байгаа нь InvoiceModal-тай ижил арга.
 */
const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: 80mm auto;
        margin: 3mm;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      body * {
        visibility: hidden;
      }
      .ebarimt-print,
      .ebarimt-print * {
        visibility: visible !important;
      }
      .ebarimt-print {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
      }
      .ebarimt-print * {
        color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `}</style>
);

interface Props {
  barimt: EbarimtItem;
  /** Байгууллагын нэр — толгойд гарна */
  baiguullagiinNer?: string;
  onClose: () => void;
}

/** Багц баримтын эхний дэд баримтын бараанууд */
function barimtiinBaraanuud(barimt: any): any[] {
  const receipts = Array.isArray(barimt?.receipts) ? barimt.receipts : [];
  const items = receipts.flatMap((r: any) =>
    Array.isArray(r?.items) ? r.items : [],
  );
  if (items.length > 0) return items;
  // Дэд баримтгүй бол багц дүнг нэг мөр болгож харуулна
  const dun = Number(barimt?.totalAmount ?? barimt?.total ?? 0);
  if (dun > 0) {
    return [
      {
        name: barimt?.service || "Үйлчилгээ",
        qty: "1",
        unitPrice: String(dun),
        totalAmount: dun,
      },
    ];
  }
  return [];
}

function tooBolgo(utga: any): number {
  const n = Number(utga ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function EbarimtKhevlekhModal({
  barimt,
  baiguullagiinNer,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const b: any = barimt || {};
  const baraanuud = barimtiinBaraanuud(b);

  const ddtd = String(b.receiptId || b.id || b.ddtd || "").trim();
  const lottery = String(b.lottery || "").trim();
  const qrData = String(b.qrData || "").trim();
  const butsaasan = !!b.ustgasanOgnoo;

  const ognoo = b.dateOgnoo || b.date || b.ognoo || b.createdAt;
  const ognooText = ognoo
    ? moment(ognoo).format("YYYY-MM-DD HH:mm:ss")
    : "-";

  const niitDun = tooBolgo(b.totalAmount ?? b.total);
  const nuat = tooBolgo(b.totalVAT);
  const nkhat = tooBolgo(b.totalCityTax);

  return (
    <ModalPortal>
      <PrintStyles />
      <div
        className="fixed inset-0 z-[13000] flex items-center justify-center p-4 no-print"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[13001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-[360px] max-w-full max-h-[90vh] flex flex-col rounded-[20px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Толгой */}
          <div className="no-print px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-white">
                  И-баримт дахин хэвлэх
                </h3>
                <p className="text-[11px] text-slate-400">
                  Хэвлэсэн хуулбар дээр «ДАХИН ХЭВЛЭСЭН» тэмдэглэгээ гарна
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Баримт */}
          <div className="overflow-y-auto flex-1 min-h-0 bg-slate-50 dark:bg-slate-900/40 p-4">
            <div className="ebarimt-print bg-white text-black mx-auto w-full max-w-[300px] px-4 py-4 font-[family-name:var(--font-mono)] text-[11px] leading-[1.5]">
              <div className="text-center">
                <p className="text-[12px] font-bold uppercase">
                  {baiguullagiinNer || "-"}
                </p>
                {b.merchantTin ? <p>ТТД: {b.merchantTin}</p> : null}
                {b.branchNo || b.posNo ? (
                  <p>
                    {b.branchNo ? `Салбар: ${b.branchNo}` : ""}
                    {b.branchNo && b.posNo ? " · " : ""}
                    {b.posNo ? `ПОС: ${b.posNo}` : ""}
                  </p>
                ) : null}
              </div>

              <div className="my-2 border-t border-dashed border-black" />

              <p className="text-center text-[12px] font-bold">
                ТӨЛБӨРИЙН БАРИМТ
              </p>
              <p className="text-center font-bold tracking-wider">
                *** ДАХИН ХЭВЛЭСЭН ***
              </p>
              {butsaasan ? (
                <p className="text-center font-bold tracking-wider">
                  *** БУЦААГДСАН БАРИМТ ***
                </p>
              ) : null}

              <div className="my-2 border-t border-dashed border-black" />

              <div className="flex justify-between">
                <span>Огноо:</span>
                <span>{ognooText}</span>
              </div>
              {b.toot && b.toot !== "-" ? (
                <div className="flex justify-between">
                  <span>Тоот:</span>
                  <span>{b.toot}</span>
                </div>
              ) : null}
              {b.gereeniiDugaar && b.gereeniiDugaar !== "-" ? (
                <div className="flex justify-between">
                  <span>Гэрээ:</span>
                  <span>{b.gereeniiDugaar}</span>
                </div>
              ) : null}
              {b.mashiniiDugaar ? (
                <div className="flex justify-between">
                  <span>Улсын дугаар:</span>
                  <span>{b.mashiniiDugaar}</span>
                </div>
              ) : null}

              <div className="my-2 border-t border-dashed border-black" />

              {/* Бараа, үйлчилгээ — нэр нь дээрээ, тоо × үнэ / дүн нь доороо */}
              {baraanuud.length > 0 ? (
                baraanuud.map((it: any, i: number) => {
                  const too = tooBolgo(it?.qty) || 1;
                  const negjUne = tooBolgo(it?.unitPrice);
                  const murDun = tooBolgo(it?.totalAmount) || too * negjUne;
                  return (
                    <div key={i} className="mb-1">
                      <p className="break-words">{it?.name || "-"}</p>
                      <div className="flex justify-between">
                        <span>
                          {too} x {formatNumber(negjUne, 2)}
                        </span>
                        <span>{formatNumber(murDun, 2)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>Бараа, үйлчилгээний задаргаа алга</p>
              )}

              <div className="my-2 border-t border-dashed border-black" />

              <div className="flex justify-between font-bold">
                <span>НИЙТ ДҮН:</span>
                <span>{formatNumber(niitDun, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>НӨАТ:</span>
                <span>{formatNumber(nuat, 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>НХАТ:</span>
                <span>{formatNumber(nkhat, 2)}</span>
              </div>

              <div className="my-2 border-t border-dashed border-black" />

              {ddtd ? (
                <div className="break-all">
                  <p>ДДТД:</p>
                  <p className="font-bold">{ddtd}</p>
                </div>
              ) : null}
              {lottery ? (
                <div className="mt-1">
                  <p>Сугалааны дугаар:</p>
                  <p className="text-[14px] font-bold tracking-widest">
                    {lottery}
                  </p>
                </div>
              ) : null}

              {qrData ? (
                <div className="mt-3 flex justify-center">
                  <QRCodeSVG value={qrData} size={128} level="M" />
                </div>
              ) : (
                <p className="mt-3 text-center">QR мэдээлэл хадгалагдаагүй</p>
              )}

              <p className="mt-3 text-center">
                Та ebarimt.mn хаягаар шалгана уу
              </p>
            </div>
          </div>

          {/* Хөл */}
          <div className="no-print px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-[30px] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Хаах
            </button>
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all inline-flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              Хэвлэх
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
