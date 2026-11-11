"use client";

import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import {
  SHALTGAAN_DOOD_URT,
  ShaltgaanAsuultOpts,
  shaltgaanSonsogchBurtgeye,
  shaltgaanZuvEsekh,
} from "@/lib/shaltgaan";

/**
 * «Шалтгаан» заавал бөглөх талбар — устгах/засах баталгаажуулалтын бүх
 * цонхонд ижил харагдана. `aldaaKharuulakh` үед хоосон бол улаанаар тэмдэглэнэ.
 */
export function ShaltgaanTalbar({
  value,
  onChange,
  aldaaKharuulakh,
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  aldaaKharuulakh?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const buruu = !!aldaaKharuulakh && !shaltgaanZuvEsekh(value);
  return (
    <div className="text-left">
      <label className="block text-[11px] font-medium mb-1 text-[color:var(--panel-text)]">
        Шалтгаан <span className="text-danger">*</span>
      </label>
      <textarea
        value={value}
        autoFocus={autoFocus}
        rows={3}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter = батлах, Shift+Enter = шинэ мөр
          if (e.key === "Enter" && !e.shiftKey && onEnter) {
            e.preventDefault();
            e.stopPropagation();
            onEnter();
          }
        }}
        placeholder="Яагаад устгаж / засаж байгаагаа бичнэ үү"
        className={`w-full resize-none rounded-xl border px-3 py-2 text-[11px] outline-none bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] ${
          buruu ? "border-danger" : "border-[color:var(--surface-border)] focus:border-[color:var(--theme)]"
        }`}
      />
      {buruu && (
        <p className="mt-1 text-[10px] text-danger">
          Шалтгааныг дор хаяж {SHALTGAAN_DOOD_URT} тэмдэгтээр бичнэ үү.
        </p>
      )}
    </div>
  );
}

/** Шалтгаан асуух баталгаажуулалтын цонх (удирдлагатай). */
export function ShaltgaanDialog({
  open,
  title = "Шалтгаан бичнэ үү",
  message = "Энэ үйлдэл «Устгасан / Зассан түүх»-д таны нэр, шалтгаантай хамт бүртгэгдэнэ.",
  confirmLabel = "Батлах",
  danger = true,
  onCancel,
  onConfirm,
}: ShaltgaanAsuultOpts & {
  open: boolean;
  onCancel: () => void;
  onConfirm: (shaltgaan: string) => void;
}) {
  const [utga, setUtga] = React.useState("");
  const [oroldson, setOroldson] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUtga("");
      setOroldson(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  const batlaya = () => {
    setOroldson(true);
    if (shaltgaanZuvEsekh(utga)) onConfirm(utga.trim());
  };

  return createPortal(
    <div className="fixed inset-0 z-[99990] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-[color:var(--surface-bg)] rounded-2xl shadow-2xl border border-[color:var(--surface-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-danger/10" : "bg-warning/10"
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${danger ? "text-danger" : "text-warning"}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[color:var(--panel-text)]">{title}</h3>
            <p className="mt-1 text-xs text-[color:var(--muted-text)] leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <ShaltgaanTalbar value={utga} onChange={setUtga} aldaaKharuulakh={oroldson} autoFocus onEnter={batlaya} />
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center px-5 py-2 rounded-2xl text-xs font-medium bg-[color:var(--panel)] text-[color:var(--panel-text)]"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={batlaya}
            className={`inline-flex items-center justify-center px-5 py-2 rounded-2xl text-xs font-medium text-white shadow-sm ${
              danger ? "bg-danger" : "bg-success"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * `shaltgaanAsuuya()`-г хүлээн авч цонхыг харуулна. ClientLayout-д нэг л
 * удаа суулгана. Зэрэг ирсэн асуултуудыг дараалуулна.
 */
export function ShaltgaanDialogHost() {
  type Asuult = { opts: ShaltgaanAsuultOpts; khariu: (utga: string | null) => void };
  const [daraalal, setDaraalal] = React.useState<Asuult[]>([]);

  React.useEffect(() => {
    shaltgaanSonsogchBurtgeye((opts, khariu) => {
      setDaraalal((d) => [...d, { opts, khariu }]);
    });
    return () => shaltgaanSonsogchBurtgeye(null);
  }, []);

  const odoo = daraalal[0];
  const duusgaya = React.useCallback(
    (utga: string | null) => {
      if (!odoo) return;
      odoo.khariu(utga);
      setDaraalal((d) => d.slice(1));
    },
    [odoo],
  );
  const tsutsalya = React.useCallback(() => duusgaya(null), [duusgaya]);

  return (
    <ShaltgaanDialog
      open={!!odoo}
      {...(odoo?.opts || {})}
      onCancel={tsutsalya}
      onConfirm={(utga) => duusgaya(utga)}
    />
  );
}
