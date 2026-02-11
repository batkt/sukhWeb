"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, CreditCard, Banknote, Landmark, Tag, ArrowRight, Check, Delete, Loader2 } from "lucide-react";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import formatNumber from "../../../../tools/function/formatNumber";
import { socket } from "@/lib/uilchilgee";
import { toast } from "react-hot-toast";

/* ─── Types ─── */

interface TulburEntry {
  turul: string;
  dun: number;
  ognoo: string;
  khariu?: any; // terminal / qpay response
}

interface PaymentModalProps {
  transaction: Uilchluulegch;
  onClose: () => void;
  onConfirm?: (amount: number, method: string, extraData?: any) => void;
}

/* ─── Constants ─── */

const PAYMENT_METHODS = [
  { id: "belen",       label: "Бэлэн",      icon: <Banknote className="w-5 h-5" />,    color: "emerald" },
  { id: "khaan",       label: "Карт",        icon: <CreditCard className="w-5 h-5" />,  color: "teal" },
  { id: "khariltsakh", label: "Дансаар",     icon: <ArrowRight className="w-5 h-5" />,  color: "blue" },
  { id: "qpay",        label: "QPay",        icon: <Landmark className="w-5 h-5" />,    color: "purple" },
] as const;

const QUICK_CASH = [500, 1000, 5000, 10000, 20000] as const;

/* ─── Component ─── */

export default function PaymentModal({ transaction, onClose, onConfirm }: PaymentModalProps) {
  const niitDun = transaction.niitDun || 0;

  // Split entries accumulated so far
  const [tulbur, setTulbur] = useState<TulburEntry[]>([]);

  // Currently displayed amount in the numpad area (auto-fills with remaining)
  const [turulruuKhiikhDun, setTurulruuKhiikhDun] = useState<string>(niitDun.toString());

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTurul, setProcessingTurul] = useState<string | null>(null);

  // E-Barimt
  const [ebarimtType, setEbarimtType] = useState<"1" | "3">("1");
  const [register, setRegister] = useState("");

  // QPay
  const [qpayData, setQpayData] = useState<any>(null);

  /* ─── Derived values ─── */

  // Map turul → dun for quick UI lookups
  const value = useMemo(() => {
    const m: Record<string, number> = {};
    tulbur.forEach((t) => {
      m[t.turul] = (m[t.turul] || 0) + t.dun;
    });
    return m;
  }, [tulbur]);

  // Already-paid total
  const paidSoFar = useMemo(() => tulbur.reduce((s, t) => s + t.dun, 0), [tulbur]);

  // Remaining to be split
  const tulukhDun = Math.max(0, niitDun - paidSoFar);

  // Current numpad amount
  const tuljBuiDun = parseInt(turulruuKhiikhDun) || 0;

  /* ─── Core logic (pay.md: turulruuTooKhiikhFunction) ─── */

  const turulruuTooKhiikhFunction = useCallback(async (turul: string) => {
    // If already has entry for this type → toggle it OFF (remove)
    const existingIdx = tulbur.findIndex((t) => t.turul === turul);
    if (existingIdx !== -1) {
      const removed = tulbur[existingIdx];
      const newTulbur = tulbur.filter((_, i) => i !== existingIdx);
      setTulbur(newTulbur);
      // Recalculate remaining
      const newPaid = newTulbur.reduce((s, t) => s + t.dun, 0);
      setTurulruuKhiikhDun(Math.max(0, niitDun - newPaid).toString());
      return;
    }

    // Amount to assign
    const dun = tuljBuiDun;
    const remaining = niitDun - paidSoFar;

    if (dun <= 0) {
      toast.error("Дүн 0-ээс их байх ёстой");
      return;
    }
    if (dun > remaining) {
      toast.error("Нийт дүнгээс хэтэрсэн байна");
      return;
    }

    const newEntry: TulburEntry = {
      turul,
      dun,
      ognoo: new Date().toISOString(),
    };

    const newTulbur = [...tulbur, newEntry];
    setTulbur(newTulbur);

    // Auto-set remaining
    const newPaid = newTulbur.reduce((s, t) => s + t.dun, 0);
    setTurulruuKhiikhDun(Math.max(0, niitDun - newPaid).toString());

    // Auto-trigger for "khaan" (POS terminal)
    if (turul === "khaan" && dun > 0) {
      await batalgaajuulaltKhiiya(turul, newEntry, newTulbur);
    }
  }, [tulbur, tuljBuiDun, niitDun, paidSoFar]);

  /* ─── Terminal / QPay integration (pay.md: batalgaajuulaltKhiiya) ─── */

  const batalgaajuulaltKhiiya = useCallback(async (turul: string, entry: TulburEntry, currentTulbur: TulburEntry[]) => {
    if (turul === "khaan") {
      setIsProcessing(true);
      setProcessingTurul("khaan");
      try {
        const terminalResp = await fetch("http://127.0.0.1:27028", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_name: "doSaleTransaction",
            amount: entry.dun.toString(),
          }),
        });
        const data = await terminalResp.json();
        if (data.response_code === "000") {
          // Attach response to the entry
          setTulbur((prev) =>
            prev.map((t) =>
              t === entry || (t.turul === "khaan" && t.dun === entry.dun && !t.khariu)
                ? { ...t, khariu: data }
                : t
            )
          );
          toast.success("Карт төлбөр амжилттай");
        } else {
          toast.error("Терминалын алдаа: " + (data.response_msg || "Амжилтгүй"));
          // Remove the entry
          setTulbur((prev) => prev.filter((t) => t !== entry));
          const newPaid = currentTulbur.filter((t) => t !== entry).reduce((s, t) => s + t.dun, 0);
          setTurulruuKhiikhDun(Math.max(0, niitDun - newPaid).toString());
        }
      } catch (err) {
        toast.error("Терминалын сервис холбогдоогүй байна (127.0.0.1:27028)");
        // Remove the entry
        setTulbur((prev) => prev.filter((t) => t !== entry));
        const newPaid = currentTulbur.filter((t) => t !== entry).reduce((s, t) => s + t.dun, 0);
        setTurulruuKhiikhDun(Math.max(0, niitDun - newPaid).toString());
      } finally {
        setIsProcessing(false);
        setProcessingTurul(null);
      }
    }
  }, [niitDun]);

  /* ─── Save to server (pay.md: guilgeeniiTuukhKhadgalya) ─── */

  const guilgeeniiTuukhKhadgalya = useCallback(() => {
    // Filter out zero entries
    const validTulbur = tulbur.filter((t) => t.dun > 0);
    if (validTulbur.length === 0) {
      toast.error("Төлбөрийн мэдээлэл оруулна уу");
      return;
    }

    // Validation: sum must match (±1₮ tolerance)
    const nonDiscountPayments = validTulbur
      .filter((t) => t.turul !== "khungulult")
      .reduce((s, t) => s + t.dun, 0);
    const discountPayments = validTulbur
      .filter((t) => t.turul === "khungulult")
      .reduce((s, t) => s + t.dun, 0);
    const expectedPayAmount = niitDun - discountPayments;

    if (Math.abs(nonDiscountPayments - expectedPayAmount) > 1) {
      toast.error(`Төлбөрын дүн зөрүүтэй. Нийт: ${formatNumber(niitDun)}₮, Оруулсан: ${formatNumber(nonDiscountPayments)}₮`);
      return;
    }

    // Call parent's onConfirm with the full tulbur array
    if (onConfirm) {
      const totalPaid = validTulbur.reduce((s, t) => s + t.dun, 0);
      const primaryMethod = validTulbur[0]?.turul || "belen";
      onConfirm(totalPaid, primaryMethod, {
        tulbur: validTulbur,
        ebarimt: {
          type: ebarimtType,
          register: ebarimtType === "3" ? register : undefined,
        },
      });
    }
  }, [tulbur, niitDun, onConfirm, ebarimtType, register]);

  /* ─── F4 quick-pay (pay.md: f4Darsan) ─── */

  const f4Darsan = useCallback(() => {
    if (tulbur.length === 0) {
      // Auto-fill all remaining as cash and submit
      const entry: TulburEntry = {
        turul: "belen",
        dun: niitDun,
        ognoo: new Date().toISOString(),
      };
      setTulbur([entry]);
      setTurulruuKhiikhDun("0");

      // Submit immediately
      if (onConfirm) {
        onConfirm(niitDun, "belen", {
          tulbur: [entry],
          ebarimt: {
            type: ebarimtType,
            register: ebarimtType === "3" ? register : undefined,
          },
        });
      }
    } else {
      guilgeeniiTuukhKhadgalya();
    }
  }, [tulbur, niitDun, onConfirm, ebarimtType, register, guilgeeniiTuukhKhadgalya]);

  /* ─── Numpad functions (pay.md: mungunDunNemekh) ─── */

  const mungunDunNemekh = (digit: string) => {
    setTurulruuKhiikhDun((prev) => {
      if (prev === "0") return digit;
      if (prev.length > 8) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    setTurulruuKhiikhDun((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setTurulruuKhiikhDun("0");
  };

  /* ─── Quick cash (pay.md: hylbarNemekh) — ADDS to current display ─── */

  const hylbarNemekh = (val: number) => {
    setTurulruuKhiikhDun((prev) => {
      const current = parseInt(prev) || 0;
      const next = current + val;
      // Don't exceed remaining
      const max = niitDun - paidSoFar;
      return Math.min(next, max).toString();
    });
  };

  /* ─── Keyboard shortcuts ─── */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "F4") { e.preventDefault(); f4Darsan(); return; }
      if (e.key === "F7") {
        e.preventDefault();
        if (onConfirm) onConfirm(0, "belen", {
          tulbur: [{ turul: "belen", dun: 0, ognoo: new Date().toISOString() }],
          ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined }
        });
        return;
      }

      // Numpad digits
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

  /* ─── QPay Socket Listener ─── */

  useEffect(() => {
    const hasQpay = tulbur.some((t) => t.turul === "qpay");
    if (hasQpay && transaction?._id) {
      const s = socket();
      const eventName = `qpay/${transaction.baiguullagiinId}/${transaction._id}`;

      const handleQPaySuccess = (data: any) => {
        console.log("QPay success via socket:", data);
        // Attach response
        setTulbur((prev) =>
          prev.map((t) =>
            t.turul === "qpay" && !t.khariu ? { ...t, khariu: data } : t
          )
        );
        toast.success("QPay төлбөр амжилттай");
      };

      s.on(eventName, handleQPaySuccess);
      return () => { s.off(eventName, handleQPaySuccess); };
    }
  }, [tulbur, transaction]);

  /* ─── QPay QR Fetch ─── */

  useEffect(() => {
    const qpayEntry = tulbur.find((t) => t.turul === "qpay");
    if (qpayEntry && transaction?._id) {
      const fetchQR = async () => {
        try {
          const resp = await fetch(`https://amarhome.mn/api/payment/qpay?id=${transaction._id}&amount=${qpayEntry.dun}`);
          const data = await resp.json();
          if (data.qr_image || data.qrData) {
            setQpayData(data);
          }
        } catch (err) {
          console.error("QPay QR fetch error:", err);
        }
      };
      fetchQR();
    } else {
      setQpayData(null);
    }
  }, [tulbur, transaction]);

  /* ─── Color helpers ─── */

  const getMethodColor = (id: string, isActive: boolean) => {
    if (!isActive) return {
      bg: "bg-white dark:bg-zinc-800",
      border: "border-gray-100 dark:border-white/10",
      iconBg: "bg-gray-100 dark:bg-white/10",
      iconText: "text-gray-500 dark:text-gray-400",
    };
    const colors: Record<string, any> = {
      belen:       { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-500 ring-2 ring-emerald-500/20", iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconText: "text-emerald-600" },
      khaan:       { bg: "bg-teal-50 dark:bg-teal-500/10", border: "border-teal-500 ring-2 ring-teal-500/20", iconBg: "bg-teal-100 dark:bg-teal-500/20", iconText: "text-teal-600" },
      khariltsakh: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-500 ring-2 ring-blue-500/20", iconBg: "bg-blue-100 dark:bg-blue-500/20", iconText: "text-blue-600" },
      qpay:        { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-500 ring-2 ring-purple-500/20", iconBg: "bg-purple-100 dark:bg-purple-500/20", iconText: "text-purple-600" },
    };
    return colors[id] || colors.belen;
  };

  /* ─── Render ─── */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Тооцоо хийх</h2>
          <div className="flex items-center gap-4">
            <span className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase">{transaction.mashiniiDugaar}</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

            {/* ─── Left Side: Payment Methods ─── */}
            <div className="space-y-6">
              {/* Method Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const isActive = value[method.id] !== undefined && value[method.id] > 0;
                  const colors = getMethodColor(method.id, isActive);
                  const isLoading = processingTurul === method.id;

                  return (
                    <button
                      key={method.id}
                      onClick={() => !isProcessing && turulruuTooKhiikhFunction(method.id)}
                      disabled={isProcessing && processingTurul !== method.id}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl shadow-sm border transition-all duration-200 ${colors.bg} ${colors.border} ${isProcessing ? "opacity-60 cursor-not-allowed" : "hover:shadow-md hover:scale-[1.02]"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.iconText}`}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : method.icon}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm whitespace-nowrap block">{method.label}</span>
                        {isActive && (
                          <span className="text-xs font-black text-emerald-600 block mt-0.5">
                            {formatNumber(value[method.id])}₮
                          </span>
                        )}
                      </div>

                      {/* Active badge */}
                      {isActive && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Splits Summary */}
              {tulbur.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Хуваарилалт</span>
                  {tulbur.map((t, i) => {
                    const label = PAYMENT_METHODS.find((m) => m.id === t.turul)?.label || t.turul;
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-gray-300">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-gray-100">{formatNumber(t.dun)}₮</span>
                          {t.khariu && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          <button
                            onClick={() => {
                              const newTulbur = tulbur.filter((_, idx) => idx !== i);
                              setTulbur(newTulbur);
                              const newPaid = newTulbur.reduce((s, t2) => s + t2.dun, 0);
                              setTurulruuKhiikhDun(Math.max(0, niitDun - newPaid).toString());
                            }}
                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2 flex justify-between text-sm font-black">
                    <span className="text-slate-500">Нийт оруулсан</span>
                    <span className="text-emerald-600">{formatNumber(paidSoFar)}₮</span>
                  </div>
                </div>
              )}

              {/* E-Barimt Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">И-Баримт төрөл</span>
                  <div className="flex p-0.5 bg-gray-200 dark:bg-white/10 rounded-lg">
                    <button
                      onClick={() => setEbarimtType("1")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${ebarimtType === "1" ? "bg-white dark:bg-white/20 shadow text-slate-800 dark:text-white" : "text-slate-500"}`}
                    >
                      Хувь хүн
                    </button>
                    <button
                      onClick={() => setEbarimtType("3")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${ebarimtType === "3" ? "bg-white dark:bg-white/20 shadow text-slate-800 dark:text-white" : "text-slate-500"}`}
                    >
                      Байгууллага
                    </button>
                  </div>
                </div>
                {ebarimtType === "3" && (
                  <input
                    type="text"
                    placeholder="Байгууллагын регистер"
                    value={register}
                    onChange={(e) => setRegister(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                )}
              </div>

              {/* Quick Cash Buttons (pay.md: hylbarNemekh — adds to display) */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Бэлэн мөнгө нэмэх</p>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_CASH.map((val) => (
                    <button
                      key={val}
                      onClick={() => hylbarNemekh(val)}
                      disabled={isProcessing}
                      className="py-2.5 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-xs disabled:opacity-50"
                    >
                      +{formatNumber(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* QPay QR Display */}
              {qpayData && (
                <div className="flex flex-col items-center justify-center p-6 bg-blue-50/30 dark:bg-blue-500/10 rounded-3xl border-2 border-dashed border-blue-200 dark:border-blue-500/30 mt-2">
                  <img
                    src={qpayData.qr_image || `data:image/png;base64,${qpayData.qrData}`}
                    alt="QPay QR"
                    className="w-40 h-40 mb-3 border rounded-xl overflow-hidden shadow-sm bg-white"
                  />
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse text-center leading-relaxed">
                    Утсаараа эсвэл банкаараа<br />уншуулж төлнө үү
                  </p>
                </div>
              )}
            </div>

            {/* ─── Right Side: Keypad & Input ─── */}
            <div className="flex flex-col gap-6">
              {/* Amount Display */}
              <div className="text-center space-y-1">
                <div className="text-4xl font-black text-emerald-500 tracking-tight">
                  {formatNumber(tuljBuiDun)}₮
                </div>
                {tulukhDun !== tuljBuiDun && tulukhDun > 0 && (
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Үлдэгдэл: {formatNumber(tulukhDun)}₮
                  </p>
                )}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => mungunDunNemekh(num.toString())}
                    disabled={isProcessing}
                    className="h-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 font-black text-2xl text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="h-14 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 font-black text-xl text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  C
                </button>
                <button
                  onClick={() => mungunDunNemekh("0")}
                  disabled={isProcessing}
                  className="h-14 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 font-black text-2xl text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={isProcessing}
                  className="h-14 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">
                  <span>Нийт дүн:</span>
                  <span className="text-slate-700 dark:text-gray-200 font-bold">{formatNumber(niitDun)}₮</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase">
                  <span>Оруулсан:</span>
                  <span>{formatNumber(paidSoFar)}₮</span>
                </div>
                <div className={`flex justify-between items-center text-sm font-black uppercase ${tulukhDun > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  <span>Дутуу:</span>
                  <span>{formatNumber(tulukhDun)}₮</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm(0, "belen", {
                      tulbur: [{ turul: "belen", dun: 0, ognoo: new Date().toISOString() }],
                      ebarimt: { type: ebarimtType, register: ebarimtType === "3" ? register : undefined }
                    });
                  }}
                  disabled={isProcessing}
                  className="py-3 rounded-xl border border-amber-200 dark:border-amber-500/30 text-amber-600 font-bold uppercase text-[10px] hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                >
                  Үнэгүй [F7]
                </button>
                <button
                  onClick={f4Darsan}
                  disabled={isProcessing}
                  className="py-3 rounded-xl bg-emerald-500 text-white font-bold uppercase text-[10px] hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
