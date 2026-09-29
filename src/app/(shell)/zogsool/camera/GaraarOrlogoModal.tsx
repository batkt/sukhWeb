"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, Loader2, Trash2, X } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";
import uilchilgee from "@/lib/uilchilgee";
import { dugaarZuvEsekh, mashiniiDugaarTseverle } from "@/lib/mashiniiDugaar";

/**
 * Камер кассын ГАРААР орлого — камерт бүртгэгдээгүй машины дугаар, мөнгөн
 * дүнг шууд оруулна (ж: 1234УБА — 5,000₮ бэлэн). Өдрийн хаалтад нэмэгдэнэ.
 * Товчлол: F9.
 */
const KHELBERUUD = [
  { id: "belen", ner: "Бэлэн" },
  { id: "khaan", ner: "Карт" },
  { id: "khariltsakh", ner: "Дансаар" },
  { id: "qpay", ner: "QPay" },
] as const;

const mnt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("mn-MN")}₮`;

export default function GaraarOrlogoModal({
  token,
  barilgiinId,
  onClose,
  onSaved,
}: {
  token: string;
  barilgiinId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const udur = dayjs().format("YYYY-MM-DD");
  const [mashiniiDugaar, setMashiniiDugaar] = useState("");
  const [dun, setDun] = useState("");
  const [khelber, setKhelber] = useState<string>("belen");
  const [tailbar, setTailbar] = useState("");
  const [aldaa, setAldaa] = useState<{ dun?: string; dugaar?: string }>({});
  const dugaarRef = useRef<HTMLInputElement>(null);
  const [khadgalj, setKhadgalj] = useState(false);
  const [jagsaalt, setJagsaalt] = useState<any[]>([]);
  const dunRef = useRef<HTMLInputElement>(null);

  const achaalakh = useCallback(async () => {
    try {
      const r = await uilchilgee(token).get("/zogsoolGaraarOrlogo", {
        params: { barilgiinId: barilgiinId || undefined, udur },
      });
      setJagsaalt(Array.isArray(r.data?.jagsaalt) ? r.data.jagsaalt : []);
    } catch {
      setJagsaalt([]);
    }
  }, [token, barilgiinId, udur]);

  useEffect(() => {
    achaalakh();
  }, [achaalakh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dunToo = Number(String(dun).replace(/[^\d]/g, "")) || 0;

  const khadgalakh = async () => {
    if (khadgalj) return;
    const dugaar = mashiniiDugaarTseverle(mashiniiDugaar);
    if (!dugaar || !dugaarZuvEsekh(dugaar)) {
      setAldaa({ dugaar: dugaar ? "Дугаар 4 тоо + 3 үсэг байна (ж: 1234УБА)." : "Машины дугаарыг оруулна уу." });
      dugaarRef.current?.focus();
      return;
    }
    if (dunToo <= 0) {
      setAldaa({ dun: "Орлогын дүнг оруулна уу." });
      dunRef.current?.focus();
      return;
    }
    setKhadgalj(true);
    try {
      await uilchilgee(token).post("/zogsoolGaraarOrlogoKhiiye", {
        barilgiinId: barilgiinId || "",
        udur,
        mashiniiDugaar: dugaar,
        dun: dunToo,
        khelber,
        tailbar: tailbar.trim(),
      });
      toast.success(`${mnt(dunToo)} орлого бүртгэгдлээ`);
      setMashiniiDugaar("");
      setDun("");
      setTailbar("");
      setAldaa({});
      achaalakh();
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Орлого бүртгэхэд алдаа гарлаа");
    } finally {
      setKhadgalj(false);
    }
  };

  const ustgakh = async (id: string) => {
    try {
      await uilchilgee(token).delete(`/zogsoolGaraarOrlogo/${id}`);
      achaalakh();
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Устгахад алдаа гарлаа");
    }
  };

  const niitDun = jagsaalt.reduce((s, o) => s + (Number(o.dun) || 0), 0);
  const niitMashin = jagsaalt.length;
  const khelberNer = (id: string) => KHELBERUUD.find((k) => k.id === id)?.ner || id;

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="modal-surface w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxWidth: 400, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Гараар орлого оруулах"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[color:var(--surface-border)] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-theme/10 text-brand">
              <Banknote className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-medium text-[color:var(--panel-text)]">Орлого оруулах</h2>
              <p className="text-[11px] text-[color:var(--muted-text)]">{udur} · камерт бүртгэгдээгүй машины төлбөр</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="grid h-8 w-8 place-items-center rounded-lg text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-3 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            khadgalakh();
          }}
        >
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-[color:var(--muted-text)]">
                <span className="mr-0.5 text-danger">*</span>Машины дугаар
              </span>
              <input
                ref={dugaarRef}
                autoFocus
                value={mashiniiDugaar}
                maxLength={7}
                onChange={(e) => {
                  setMashiniiDugaar(e.target.value.toUpperCase());
                  if (aldaa.dugaar) setAldaa({});
                }}
                placeholder="1234УБА"
                aria-invalid={!!aldaa.dugaar || undefined}
                className={`h-10 w-full rounded-xl border bg-[color:var(--surface-bg)] px-3 text-center text-[14px] font-medium tracking-widest font-[family-name:var(--font-mono)] text-[color:var(--panel-text)] outline-none placeholder:font-normal placeholder:tracking-normal ${
                  aldaa.dugaar
                    ? "border-danger ring-2 ring-danger/20"
                    : "border-[color:var(--surface-border)] focus:border-theme focus:ring-2 focus:ring-theme/15"
                }`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-[color:var(--muted-text)]">
                <span className="mr-0.5 text-danger">*</span>Дүн
              </span>
              <div className="relative">
                <input
                  ref={dunRef}
                  inputMode="numeric"
                  value={dunToo ? dunToo.toLocaleString("mn-MN") : dun === "" ? "" : "0"}
                  onChange={(e) => {
                    setDun(e.target.value);
                    if (aldaa.dun) setAldaa({});
                  }}
                  placeholder="0"
                  aria-invalid={!!aldaa.dun || undefined}
                  className={`h-10 w-full rounded-xl border bg-[color:var(--surface-bg)] pl-3 pr-8 text-right text-[14px] font-medium tabular-nums text-[color:var(--panel-text)] outline-none ${
                    aldaa.dun
                      ? "border-danger ring-2 ring-danger/20"
                      : "border-[color:var(--surface-border)] focus:border-theme focus:ring-2 focus:ring-theme/15"
                  }`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[color:var(--muted-text)]">
                  ₮
                </span>
              </div>
            </label>
          </div>
          {(aldaa.dun || aldaa.dugaar) && (
            <p role="alert" className={`-mt-2 text-[11px] text-danger ${aldaa.dun ? "text-right" : ""}`}>
              {aldaa.dun || aldaa.dugaar}
            </p>
          )}

          <div>
            <span className="mb-1 block text-[11px] text-[color:var(--muted-text)]">Төлбөрийн хэлбэр</span>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-[color:var(--surface-border)] p-1" role="radiogroup">
              {KHELBERUUD.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={khelber === k.id}
                  onClick={() => setKhelber(k.id)}
                  className={`h-8 rounded-lg text-[12px] font-medium transition-colors ${
                    khelber === k.id
                      ? "bg-theme !text-white shadow-sm"
                      : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                  }`}
                >
                  {k.ner}
                </button>
              ))}
            </div>
          </div>

          <input
            value={tailbar}
            onChange={(e) => setTailbar(e.target.value)}
            placeholder="Тайлбар (заавал биш)"
            className="h-9 w-full rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 text-[13px] text-[color:var(--panel-text)] outline-none focus:border-theme"
          />

          <button
            type="submit"
            disabled={khadgalj}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-theme text-[14px] font-medium !text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {khadgalj && <Loader2 className="h-4 w-4 animate-spin" />}
            Бүртгэх{dunToo > 0 ? ` · ${mnt(dunToo)}` : ""}
          </button>
        </form>

        {jagsaalt.length > 0 && (
          <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/50 px-4 py-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-[color:var(--muted-text)]">
              <span>Өнөөдөр гараар оруулсан</span>
              <span className="tabular-nums">
                {niitMashin} машин · <span className="font-medium text-[color:var(--panel-text)]">{mnt(niitDun)}</span>
              </span>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {jagsaalt.map((o) => (
                <li key={o._id} className="group flex items-center gap-2 text-[12px]">
                  <span className="w-10 tabular-nums text-[color:var(--muted-text)]">
                    {dayjs(o.createdAt).format("HH:mm")}
                  </span>
                  <span className="flex-1 truncate text-[color:var(--panel-text)]">
                    <span className="font-medium tracking-wide font-[family-name:var(--font-mono)]">{o.mashiniiDugaar || "—"}</span>
                    <span className="text-[color:var(--muted-text)]"> · {khelberNer(o.khelber)}</span>
                    {o.tailbar ? <span className="text-[color:var(--muted-text)]"> · {o.tailbar}</span> : null}
                  </span>
                  <span className="tabular-nums font-medium text-[color:var(--panel-text)]">{mnt(o.dun)}</span>
                  <button
                    type="button"
                    onClick={() => ustgakh(o._id)}
                    title="Устгах"
                    aria-label="Устгах"
                    className="grid h-6 w-6 place-items-center rounded-md text-[color:var(--muted-text)] opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
