"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Landmark,
  ArrowRight,
  Check,
  Delete,
  Loader2,
  Wallet,
  Clock,
  Car,
  Tag,
} from "lucide-react";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import formatNumber from "../../../../tools/function/formatNumber";
import { socket } from "@/lib/uilchilgee";
import { toast } from "react-hot-toast";
import moment from "moment";

/* ─── Types ─── */

interface TulburEntry {
  turul: string;
  dun: number;
  ognoo: string;
  khariu?: any;
}

interface PaymentModalProps {
  transaction: Uilchluulegch;
  onClose: () => void;
  onConfirm?: (amount: number, method: string, extraData?: any) => void;
}

/* ─── Constants ─── */

const PAYMENT_METHODS = [
  {
    id: "belen",
    label: "Бэлэн",
    icon: <Banknote className="w-5 h-5" />,
    accent: "emerald",
  },
  {
    id: "khaan",
    label: "Карт",
    icon: <CreditCard className="w-5 h-5" />,
    accent: "sky",
  },
  {
    id: "khariltsakh",
    label: "Дансаар",
    icon: <ArrowRight className="w-5 h-5" />,
    accent: "violet",
  },
  {
    id: "qpay",
    label: "QPay",
    icon: <Landmark className="w-5 h-5" />,
    accent: "amber",
  },
  {
    id: "khungulult",
    label: "Хөнгөлөлт",
    icon: <Tag className="w-5 h-5" />,
    accent: "rose",
  },
] as const;

const QUICK_CASH = [500, 1000, 5000, 10000, 20000] as const;

/* ─── Accent color utility ─── */

function accentClasses(accent: string, isActive: boolean) {
  const map: Record<
    string,
    {
      active: string;
      inactive: string;
      icon: string;
      activeIcon: string;
      badge: string;
    }
  > = {
    emerald: {
      active:  "bg-emerald-500 border-emerald-600 ring-2 ring-emerald-500/30 text-white",
      inactive: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
      icon: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      activeIcon: "bg-white/20 text-white",
      badge: "bg-emerald-500",
    },
    sky: {
      active:  "bg-sky-500 border-sky-600 ring-2 ring-sky-500/30 text-white",
      inactive: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20",
      icon: "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400",
      activeIcon: "bg-white/20 text-white",
      badge: "bg-sky-500",
    },
    violet: {
      active:  "bg-violet-500 border-violet-600 ring-2 ring-violet-500/30 text-white",
      inactive: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20",
      icon: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400",
      activeIcon: "bg-white/20 text-white",
      badge: "bg-violet-500",
    },
    amber: {
      active:  "bg-amber-500 border-amber-600 ring-2 ring-amber-500/30 text-white",
      inactive: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20",
      icon: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
      activeIcon: "bg-white/20 text-white",
      badge: "bg-amber-500",
    },
    rose: {
      active:  "bg-rose-500 border-rose-600 ring-2 ring-rose-500/30 text-white",
      inactive: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20",
      icon: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
      activeIcon: "bg-white/20 text-white",
      badge: "bg-rose-500",
    },
  };
  const c = map[accent] || map.emerald;
  return {
    container: isActive ? c.active : c.inactive,
    icon: isActive ? c.activeIcon : c.icon,
    badge: c.badge,
  };
}

/* ─── Component ─── */

export default function PaymentModal({
  transaction,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const niitDun = transaction.niitDun || 0;

  // Account for discounts/payments already recorded in DB
  const existingTulbur: any[] = useMemo(() => {
    const raw = (transaction as any).tuukh?.[0]?.tulbur;
    return Array.isArray(raw) ? raw : raw ? [raw] : [];
  }, [transaction]);
  const discountInDB = useMemo(
    () => existingTulbur.reduce((s: number, t: any) => s + (t?.dun < 0 ? Math.abs(t.dun) : 0), 0),
    [existingTulbur],
  );
  const alreadyPaidInDB = useMemo(
    () => existingTulbur.reduce((s: number, t: any) => s + (t?.dun > 0 ? t.dun : 0), 0),
    [existingTulbur],
  );
  // Remaining amount the user actually needs to pay right now
  const effectiveNiitDun = Math.max(0, niitDun - discountInDB - alreadyPaidInDB);

  const [tulbur, setTulbur] = useState<TulburEntry[]>([]);
  const [turulruuKhiikhDun, setTurulruuKhiikhDun] = useState<string>(
    effectiveNiitDun.toString(),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTurul, setProcessingTurul] = useState<string | null>(null);
  const [ebarimtType, setEbarimtType] = useState<"1" | "3">("1");
  const [register, setRegister] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [activeMethod, setActiveMethod] = useState<string>("belen");
  const [qpayData, setQpayData] = useState<any>(null);

  /* ─── Derived ─── */

  const value = useMemo(() => {
    const m: Record<string, number> = {};
    tulbur.forEach((t) => {
      m[t.turul] = (m[t.turul] || 0) + t.dun;
    });
    return m;
  }, [tulbur]);

  const paidSoFar = useMemo(
    () => tulbur.reduce((s, t) => s + t.dun, 0),
    [tulbur],
  );
  const tulukhDun = Math.max(0, effectiveNiitDun - paidSoFar);
  const tuljBuiDun = parseInt(turulruuKhiikhDun) || 0;

  // Duration display
  const orsonTsag = transaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
  const duration = orsonTsag
    ? moment.duration(moment().diff(moment(orsonTsag)))
    : null;
  const durationStr = duration
    ? `${Math.floor(duration.asHours())}ц ${duration.minutes()}м`
    : "-";

  /* ─── Core: turulruuTooKhiikhFunction ─── */

  const turulruuTooKhiikhFunction = useCallback(
    async (turul: string) => {
      setActiveMethod(turul);
      const existingIdx = tulbur.findIndex((t) => t.turul === turul);
      if (existingIdx !== -1) {
        const newTulbur = tulbur.filter((_, i) => i !== existingIdx);
        setTulbur(newTulbur);
        const newPaid = newTulbur.reduce((s, t) => s + t.dun, 0);
        setTurulruuKhiikhDun(Math.max(0, effectiveNiitDun - newPaid).toString());
        return;
      }

      const dun = tuljBuiDun;
      const remaining = effectiveNiitDun - paidSoFar;

      if (dun <= 0) {
        toast.error("Дүн 0-ээс их байх ёстой");
        return;
      }
      if (dun > remaining) {
        toast.error("Нийт дүнгээс хэтэрсэн байна");
        return;
      }

      if (turul === "khungulult" && !discountReason) {
        toast.error("Хөнгөлөлтийн тайлбар оруулна уу");
        return;
      }

      const newEntry: TulburEntry = {
        turul,
        dun,
        ognoo: new Date().toISOString(),
        khariu: turul === "khungulult" ? { reason: discountReason } : undefined,
      };
      const newTulbur = [...tulbur, newEntry];
      setTulbur(newTulbur);

      const newPaid = newTulbur.reduce((s, t) => s + t.dun, 0);
      setTurulruuKhiikhDun(Math.max(0, effectiveNiitDun - newPaid).toString());
      setDiscountReason("");

      if (turul === "khaan" && dun > 0) {
        await batalgaajuulaltKhiiya(turul, newEntry, newTulbur);
      }
    },
    [tulbur, tuljBuiDun, effectiveNiitDun, paidSoFar, discountReason],
  );

  /* ─── Terminal ─── */

  const batalgaajuulaltKhiiya = useCallback(
    async (turul: string, entry: TulburEntry, currentTulbur: TulburEntry[]) => {
      if (turul === "khaan") {
        setIsProcessing(true);
        setProcessingTurul("khaan");
        try {
          const resp = await fetch("http://127.0.0.1:27028", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service_name: "doSaleTransaction",
              amount: entry.dun.toString(),
            }),
          });
          const data = await resp.json();
          if (data.response_code === "000") {
            setTulbur((prev) =>
              prev.map((t) =>
                t === entry ||
                (t.turul === "khaan" && t.dun === entry.dun && !t.khariu)
                  ? { ...t, khariu: data }
                  : t,
              ),
            );
            toast.success("Карт төлбөр амжилттай");
          } else {
            toast.error(
              "Терминалын алдаа: " + (data.response_msg || "Амжилтгүй"),
            );
            setTulbur((prev) => prev.filter((t) => t !== entry));
            const np = currentTulbur
              .filter((t) => t !== entry)
              .reduce((s, t) => s + t.dun, 0);
            setTurulruuKhiikhDun(Math.max(0, effectiveNiitDun - np).toString());
          }
        } catch {
          toast.error("Терминалын сервис холбогдоогүй (127.0.0.1:27028)");
          setTulbur((prev) => prev.filter((t) => t !== entry));
          const np = currentTulbur
            .filter((t) => t !== entry)
            .reduce((s, t) => s + t.dun, 0);
          setTurulruuKhiikhDun(Math.max(0, effectiveNiitDun - np).toString());
        } finally {
          setIsProcessing(false);
          setProcessingTurul(null);
        }
      }
    },
    [effectiveNiitDun],
  );

  /* ─── Save ─── */

  const guilgeeniiTuukhKhadgalya = useCallback(() => {
    const validTulbur = tulbur.filter((t) => t.dun > 0);
    if (validTulbur.length === 0) {
      toast.error("Төлбөрийн мэдээлэл оруулна уу");
      return;
    }

    const nonDiscount = validTulbur
      .filter((t) => t.turul !== "khungulult")
      .reduce((s, t) => s + t.dun, 0);
    const sessionDiscount = validTulbur
      .filter((t) => t.turul === "khungulult")
      .reduce((s, t) => s + t.dun, 0);
    const expected = effectiveNiitDun - sessionDiscount;

    if (Math.abs(nonDiscount - expected) > 1) {
      toast.error(
        `Төлбөрын дүн зөрүүтэй. Төлөх: ${formatNumber(effectiveNiitDun)}, Оруулсан: ${formatNumber(nonDiscount)}`,
      );
      return;
    }

    if (onConfirm) {
      const totalPaid = validTulbur.reduce((s, t) => s + t.dun, 0);
      onConfirm(totalPaid, validTulbur[0]?.turul || "belen", {
        tulbur: validTulbur,
        ebarimt: {
          type: ebarimtType,
          register: ebarimtType === "3" ? register : undefined,
        },
      });
    }
  }, [tulbur, effectiveNiitDun, onConfirm, ebarimtType, register]);

  /* ─── F4 quick-pay ─── */

  const f4Darsan = useCallback(() => {
    if (tulbur.length === 0) {
      if (activeMethod === "khungulult") {
        if (!discountReason) {
          toast.error("Хөнгөлөлтийн тайлбар оруулна уу");
          return;
        }
        const entry: TulburEntry = {
          turul: "khungulult",
          dun: effectiveNiitDun,
          ognoo: new Date().toISOString(),
          khariu: { reason: discountReason },
        };
        setTulbur([entry]);
        setTurulruuKhiikhDun("0");
        if (onConfirm) {
          onConfirm(effectiveNiitDun, "khungulult", {
            tulbur: [entry],
            ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined },
          });
        }
        return;
      }
      const entry: TulburEntry = {
        turul: activeMethod,
        dun: effectiveNiitDun,
        ognoo: new Date().toISOString(),
      };
      setTulbur([entry]);
      setTurulruuKhiikhDun("0");
      if (onConfirm) {
        onConfirm(effectiveNiitDun, activeMethod, {
          tulbur: [entry],
          ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined },
        });
      }
    } else {
      guilgeeniiTuukhKhadgalya();
    }
  }, [
    tulbur,
    effectiveNiitDun,
    activeMethod,
    discountReason,
    onConfirm,
    ebarimtType,
    register,
    guilgeeniiTuukhKhadgalya,
  ]);

  /* ─── Numpad ─── */

  const mungunDunNemekh = (digit: string) => {
    setTurulruuKhiikhDun((prev) => {
      if (prev === "0") return digit;
      if (prev.length > 8) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () =>
    setTurulruuKhiikhDun((p) => (p.length <= 1 ? "0" : p.slice(0, -1)));
  const handleClear = () => setTurulruuKhiikhDun("0");

  const hylbarNemekh = (val: number) => {
    setTurulruuKhiikhDun((prev) => {
      const next = (parseInt(prev) || 0) + val;
      return Math.min(next, effectiveNiitDun - paidSoFar).toString();
    });
  };

  /* ─── Keys ─── */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        f4Darsan();
        return;
      }
      if (e.key === "F7") {
        e.preventDefault();
        if (onConfirm)
          onConfirm(0, "belen", {
            tulbur: [
              { turul: "belen", dun: 0, ognoo: new Date().toISOString() },
            ],
            ebarimt: {
              type: ebarimtType,
              register: ebarimtType === "3" ? register : undefined,
            },
          });
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        mungunDunNemekh(e.key);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, f4Darsan, ebarimtType, register, onConfirm, onClose]);

  /* ─── QPay Socket ─── */

  useEffect(() => {
    const hasQpay = tulbur.some((t) => t.turul === "qpay");
    if (hasQpay && transaction?._id) {
      const s = socket();
      const ev = `qpay/${transaction.baiguullagiinId}/${transaction._id}`;
      const handler = (data: any) => {
        setTulbur((prev) =>
          prev.map((t) =>
            t.turul === "qpay" && !t.khariu ? { ...t, khariu: data } : t,
          ),
        );
        toast.success("QPay төлбөр амжилттай");
      };
      s.on(ev, handler);
      return () => {
        s.off(ev, handler);
      };
    }
  }, [tulbur, transaction]);

  /* ─── QPay QR ─── */

  useEffect(() => {
    const qe = tulbur.find((t) => t.turul === "qpay");
    if (qe && transaction?._id) {
      (async () => {
        try {
          const r = await fetch(
            `https://amarhome.mn/api/payment/qpay?id=${transaction._id}&amount=${qe.dun}`,
          );
          const d = await r.json();
          if (d.qr_image || d.qrData) setQpayData(d);
        } catch {}
      })();
    } else {
      setQpayData(null);
    }
  }, [tulbur, transaction]);

  /* ─── Progress ─── */

  const progressPct =
    effectiveNiitDun > 0 ? Math.min(100, (paidSoFar / effectiveNiitDun) * 100) : 0;

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[920px] rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/10 animate-in zoom-in-95 duration-300"
      >
        {/* ─── Header ─── */}
        <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
          {/* Accent glow */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500 opacity-80" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Wallet className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 dark:text-white tracking-tight">
                  Тооцоо хийх
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-[11px] font-bold !text-white tracking-widest font-[family-name:var(--font-mono)]">
                    {transaction.mashiniiDugaar}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {durationStr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </button>
          </div>

          {/* Progress bar + stats */}
          <div className="mt-4 flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Оруулсан: <span className="font-black text-slate-700 dark:text-slate-200 font-[family-name:var(--font-mono)]">{formatNumber(paidSoFar)}₮</span>
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #3b82f6, #6366f1)",
                }}
              />
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap font-[family-name:var(--font-mono)] ${tulukhDun > 0 ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
              {tulukhDun > 0 ? `Дутуу: ${formatNumber(tulukhDun)}₮` : "Бүрэн ✓"}
            </span>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* ─── LEFT: Methods + extras (3 cols) ─── */}
            <div className="lg:col-span-3 p-6 space-y-5 border-r-0 lg:border-r border-slate-100 dark:border-white/[0.06]">
              {/* Payment methods */}
              <div>
                <p className="text-[10px]  text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">
                  Төлбөрийн хэлбэр
                </p>
                <div className="flex gap-3">
                  {/* 2×2 grid of regular methods */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.filter((m) => m.id !== "khungulult").map((method) => {
                      const isActive = (value[method.id] || 0) > 0;
                      const ac = accentClasses(method.accent, isActive);
                      const isLoading = processingTurul === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setActiveMethod(method.id);
                            if (!isProcessing) turulruuTooKhiikhFunction(method.id);
                          }}
                          disabled={isProcessing && processingTurul !== method.id}
                          className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${ac.container} ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"}`}
                        >
                          {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0" /> : <span className="shrink-0">{method.icon}</span>}
                          <div className="flex-1 text-left min-w-0">
                            <span className="text-[13px] font-semibold block leading-tight">{method.label}</span>
                            {isActive && (
                              <span className="text-[11px] opacity-80 block mt-0.5">{formatNumber(value[method.id])}</span>
                            )}
                          </div>
                          {isActive && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${ac.badge} flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900`}>
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Хөнгөлөлт — tall bento card */}
                  {(() => {
                    const method = PAYMENT_METHODS.find((m) => m.id === "khungulult")!;
                    const isActive = (value[method.id] || 0) > 0;
                    const ac = accentClasses(method.accent, isActive);
                    const isLoading = processingTurul === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => {
                          setActiveMethod(method.id);
                          if (!isProcessing) {
                            if (!discountReason) return;
                            turulruuTooKhiikhFunction(method.id);
                          }
                        }}
                        disabled={isProcessing && processingTurul !== method.id}
                        className={`relative flex flex-col items-center justify-center gap-2 w-[110px] shrink-0 rounded-2xl border transition-all duration-200 ${ac.container} ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.97]"}`}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : method.icon}
                        <span className="text-[13px] font-semibold leading-tight">{method.label}</span>
                        {isActive && (
                          <>
                            <span className="text-[11px] opacity-80">{formatNumber(value[method.id])}</span>
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${ac.badge} flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900`}>
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Discount Reason Input */}
              {activeMethod === "khungulult" && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/[0.05] p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-[10px]  text-rose-500 dark:text-rose-400 uppercase tracking-[0.15em]">
                    Хөнгөлөлтийн тайлбар
                  </span>
                  <input
                    type="text"
                    placeholder="Жишээ: Лояалти, Удирдлагын зөвшөөрөл..."
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-white/[0.04] text-[13px]  text-slate-800 dark:text-white placeholder:text-rose-300 dark:placeholder:text-rose-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all"
                  />
                </div>
              )}

              {/* Split summary */}
              {tulbur.length > 0 && (
                <div className="rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.06]">
                    <span className="text-[10px]  text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                      Хуваарилалт
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    {tulbur.map((t, i) => {
                      const label =
                        PAYMENT_METHODS.find((m) => m.id === t.turul)?.label ||
                        t.turul;
                      const accent =
                        PAYMENT_METHODS.find((m) => m.id === t.turul)?.accent ||
                        "emerald";
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full bg-${accent}-500`}
                            />
                            <span className="text-[12px]  text-slate-600 dark:text-slate-300">
                              {label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px]  text-slate-800 dark:text-slate-100">
                              {formatNumber(t.dun)}
                            </span>
                            {t.khariu && (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <button
                              onClick={() => {
                                const nw = tulbur.filter((_, idx) => idx !== i);
                                setTulbur(nw);
                                setTurulruuKhiikhDun(
                                  Math.max(
                                    0,
                                    niitDun -
                                      nw.reduce((s, t2) => s + t2.dun, 0),
                                  ).toString(),
                                );
                              }}
                              className="p-0.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/15 text-red-400 dark:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick cash */}
              <div>
                <p className="text-[10px]  text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2.5">
                  Бэлэн мөнгө нэмэх
                </p>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_CASH.map((val) => (
                    <button
                      key={val}
                      onClick={() => hylbarNemekh(val)}
                      disabled={isProcessing}
                      className="px-3 py-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12px]  text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] active:scale-95 transition-all disabled:opacity-40"
                    >
                      +{formatNumber(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* E-Barimt */}
              <div className="rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]  text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                    И-Баримт
                  </span>
                  <div className="flex p-[3px] rounded-2xl bg-slate-200/50 dark:bg-white/[0.06]">
                    {(["1", "3"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setEbarimtType(v)}
                        className={`px-3.5 py-1.5 rounded-2xl text-[11px]  transition-all duration-200 ${
                          ebarimtType === v
                            ? "bg-white dark:bg-white/[0.12] shadow-sm text-slate-800 dark:text-white"
                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        {v === "1" ? "Хувь хүн" : "Байгууллага"}
                      </button>
                    ))}
                  </div>
                </div>
                {ebarimtType === "3" && (
                  <input
                    type="text"
                    placeholder="Байгууллагын регистер"
                    value={register}
                    onChange={(e) => setRegister(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[13px]  text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                  />
                )}
              </div>

              {/* QPay QR */}
              {qpayData && (
                <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-blue-50 to-white dark:from-blue-500/[0.08] dark:to-transparent border border-blue-200/50 dark:border-blue-500/20">
                  <img
                    src={
                      qpayData.qr_image ||
                      `data:image/png;base64,${qpayData.qrData}`
                    }
                    alt="QPay QR"
                    className="w-36 h-36 mb-3 rounded-xl shadow-lg bg-white border border-slate-100"
                  />
                  <p className="text-[10px]  text-blue-500 dark:text-blue-400 uppercase tracking-widest animate-pulse text-center leading-relaxed">
                    Утсаараа уншуулж төлнө үү
                  </p>
                </div>
              )}
            </div>

            {/* ─── RIGHT: Keypad (2 cols) ─── */}
            <div className="lg:col-span-2 p-6 flex flex-col gap-5 bg-slate-50/30 dark:bg-white/[0.01]">
              {/* Amount display */}
              <div className="text-center py-3 px-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Оруулах дүн
                  </p>
                </div>
                <div className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
                  {formatNumber(tuljBuiDun)}
                </div>
                {tulukhDun !== tuljBuiDun && tulukhDun > 0 && (
                  <p className="text-[10px] mt-1 text-slate-400 dark:text-slate-500">
                    Үлдэгдэл: {formatNumber(tulukhDun)}
                  </p>
                )}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => mungunDunNemekh(num.toString())}
                    disabled={isProcessing}
                    className="h-[52px] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-white/[0.04]  text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] active:scale-95 transition-all disabled:opacity-40"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="h-[52px] rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.08]  text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/[0.15] active:scale-95 transition-all disabled:opacity-40"
                >
                  AC
                </button>
                <button
                  onClick={() => mungunDunNemekh("0")}
                  disabled={isProcessing}
                  className="h-[52px] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-white/[0.04]  text-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] active:scale-95 transition-all disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={isProcessing}
                  className="h-[52px] rounded-2xl border border-rose-200/60 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/[0.08] text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/[0.15] active:scale-95 transition-all disabled:opacity-40"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden">
                <button
                  onClick={() => setTurulruuKhiikhDun(effectiveNiitDun.toString())}
                  disabled={isProcessing}
                  className="w-full px-4 py-2.5 flex justify-between text-[11px] border-b border-slate-50 dark:border-white/[0.04] hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors disabled:opacity-40 text-left"
                >
                  <span className="font-black text-slate-400 dark:text-slate-500 uppercase">
                    Бодогдсон дүн
                  </span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {formatNumber(effectiveNiitDun)}
                    {discountInDB > 0 && (
                      <span className="ml-1 text-[9px] text-rose-400 font-normal">(-{formatNumber(discountInDB)})</span>
                    )}
                  </span>
                </button>
                <div className="px-4 py-2.5 flex justify-between text-[11px] border-b border-slate-50 dark:border-white/[0.04]">
                  <span className=" text-slate-400 dark:text-slate-500 uppercase">
                    Оруулсан
                  </span>
                  <span className=" text-emerald-600 dark:text-emerald-400">
                    {formatNumber(paidSoFar)}
                  </span>
                </div>
                <div
                  className={`px-4 py-2.5 flex justify-between text-[12px] ${tulukhDun > 0 ? "bg-rose-50/50 dark:bg-rose-500/[0.05]" : "bg-emerald-50/50 dark:bg-emerald-500/[0.05]"}`}
                >
                  <span
                    className={` uppercase ${tulukhDun > 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    Дутуу
                  </span>
                  <span
                    className={` ${tulukhDun > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {formatNumber(tulukhDun)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    if (onConfirm)
                      onConfirm(0, "belen", {
                        tulbur: [
                          {
                            turul: "belen",
                            dun: 0,
                            ognoo: new Date().toISOString(),
                          },
                        ],
                        ebarimt: {
                          type: ebarimtType,
                          register: ebarimtType === "3" ? register : undefined,
                        },
                      });
                  }}
                  disabled={isProcessing}
                  className="py-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400  uppercase text-[10px] tracking-wider hover:bg-amber-50 dark:hover:bg-amber-500/[0.08] active:scale-[0.97] transition-all disabled:opacity-40"
                >
                  Үнэгүй [F7]
                </button>
                <button
                  onClick={f4Darsan}
                  disabled={isProcessing}
                  className="py-3 rounded-2xl  uppercase text-[10px] tracking-wider active:scale-[0.97] transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-white shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin rounded-2xl" />
                      Уншиж байна...
                    </>
                  ) : (
                    "Төлөх [F4]"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
