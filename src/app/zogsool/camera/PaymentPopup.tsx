"use client";

import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Banknote, CreditCard, Landmark, Tag, Wallet } from "lucide-react";
import formatNumber from "../../../../tools/function/formatNumber";

export const PAY_LABELS: Record<string, string> = {
  belen: "Бэлэн", cash: "Бэлэн", khaan: "Карт", qpay: "QPay",
  khariltsakh: "Дансаар", transfer: "Дансаар", khungulult: "Хөнгөлөлт",
  discount: "Хөнгөлөлт", "Хөнгөлөлт": "Хөнгөлөлт", free: "Үнэгүй", monpay: "MonPay",
  socialpay: "SocialPay", toki: "Toki",
};
export const PAY_COLOR: Record<string, string> = {
  belen: "bg-emerald-100 !text-emerald-700 dark:!text-emerald-800 border-emerald-200",
  cash: "bg-emerald-100 !text-emerald-700 dark:!text-emerald-800 border-emerald-200",
  khaan: "bg-teal-100 !text-teal-700 dark:!text-teal-800 border-teal-200",
  qpay: "bg-purple-100 !text-purple-700 dark:!text-purple-800 border-purple-200",
  khariltsakh: "bg-blue-100 !text-blue-700 dark:!text-blue-800 border-blue-200",
  transfer: "bg-blue-100 !text-blue-700 dark:!text-blue-800 border-blue-200",
  khungulult: "bg-amber-100 !text-amber-700 dark:!text-amber-800 border-amber-200",
  discount: "bg-amber-100 !text-amber-700 dark:!text-amber-800 border-amber-200",
  "Хөнгөлөлт": "bg-amber-100 !text-amber-700 dark:!text-amber-800 border-amber-200",
  monpay: "bg-sky-100 !text-sky-700 dark:!text-sky-800 border-sky-200",
  socialpay: "bg-indigo-100 !text-indigo-700 dark:!text-indigo-800 border-indigo-200",
  toki: "bg-orange-100 !text-orange-700 dark:!text-orange-800 border-orange-200",
};
export const PAY_TEXT_COLOR: Record<string, string> = {
  belen: "text-emerald-600 dark:text-emerald-400",
  cash: "text-emerald-600 dark:text-emerald-400",
  khaan: "text-teal-600 dark:text-teal-400",
  qpay: "text-purple-600 dark:text-purple-400",
  khariltsakh: "text-blue-600 dark:text-blue-400",
  transfer: "text-blue-600 dark:text-blue-400",
  khungulult: "text-amber-600 dark:text-amber-400",
  discount: "text-amber-600 dark:text-amber-400",
  "Хөнгөлөлт": "text-amber-600 dark:text-amber-400",
  monpay: "text-sky-600 dark:text-sky-400",
  socialpay: "text-indigo-600 dark:text-indigo-400",
  toki: "text-orange-600 dark:text-orange-400",
};
export const PAY_BG: Record<string, string> = {
  belen: "bg-emerald-500", cash: "bg-emerald-500",
  khaan: "bg-teal-500", qpay: "bg-purple-500",
  khariltsakh: "bg-blue-500", transfer: "bg-blue-500",
  khungulult: "bg-amber-500", discount: "bg-amber-500", "Хөнгөлөлт": "bg-amber-500",
  monpay: "bg-sky-500", socialpay: "bg-indigo-500", toki: "bg-orange-500",
};
export const PAY_ICON_BG: Record<string, string> = {
  belen: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  cash: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  khaan: "bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400",
  qpay: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
  khariltsakh: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  transfer: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  khungulult: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  discount: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  "Хөнгөлөлт": "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
  monpay: "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400",
  socialpay: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  toki: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
};

export const PaymentPopup = ({
  payHistory,
  totalPaid,
  uniqueTypes,
}: {
  payHistory: any[];
  totalPaid: number;
  uniqueTypes: string[];
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.top - 8, left: r.left + r.width / 2 });
    }
    setOpen(true);
  };

  const grouped = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    payHistory.forEach((p: any) => {
      const k = p.turul || "other";
      if (!map[k]) map[k] = { amount: 0, count: 0 };
      map[k].amount += p.dun || 0;
      map[k].count++;
    });
    return Object.entries(map).map(([type, d]) => ({ type, ...d }));
  }, [payHistory]);

  const isMulti = uniqueTypes.length > 1;

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
      >
        {isMulti ? (
          <>
            <div className="flex items-center gap-0.5">
              {uniqueTypes.map((type) => (
                <span
                  key={type}
                  title={PAY_LABELS[type] || type}
                  className={`inline-block w-2 h-2 rounded-full ${PAY_BG[type] || "bg-slate-400"}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-[family-name:var(--font-mono)]">
              {formatNumber(totalPaid)}
            </span>
          </>
        ) : (
          <>
            {uniqueTypes.map((type) => (
              <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded border ${PAY_COLOR[type] || "bg-slate-100 !text-slate-700 border-slate-200"}`}>
                {PAY_LABELS[type] || type}
              </span>
            ))}
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-[family-name:var(--font-mono)]">
              {formatNumber(totalPaid)}
            </span>
          </>
        )}
      </div>
      {open && createPortal(
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translate(-50%, -100%)", zIndex: 99999 }}
          className="min-w-[260px] max-w-[320px] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Төлбөрийн дэлгэрэнгүй
            </span>
          </div>
          <div className="p-2 space-y-1.5">
            {grouped.map(({ type, amount, count }) => {
              const pct = totalPaid > 0 ? Math.round((amount / totalPaid) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${PAY_ICON_BG[type] || "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                    {type === "belen" || type === "cash" ? (
                      <Banknote className="w-3.5 h-3.5" />
                    ) : type === "khaan" ? (
                      <CreditCard className="w-3.5 h-3.5" />
                    ) : type === "khariltsakh" || type === "transfer" ? (
                      <Landmark className="w-3.5 h-3.5" />
                    ) : type === "khungulult" || type === "discount" ? (
                      <Tag className="w-3.5 h-3.5" />
                    ) : (
                      <Wallet className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-semibold ${PAY_TEXT_COLOR[type] || "text-slate-600 dark:text-slate-400"}`}>
                        {PAY_LABELS[type] || type}
                        {count > 1 && (
                          <span className="ml-1 text-[9px] font-normal opacity-60">×{count}</span>
                        )}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 font-[family-name:var(--font-mono)]">
                        {formatNumber(amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PAY_BG[type] || "bg-slate-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">НИЙТ</span>
            <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-mono)]">{formatNumber(totalPaid)}</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
