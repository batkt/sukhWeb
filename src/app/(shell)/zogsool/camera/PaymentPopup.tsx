"use client";

import React, { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Banknote, CreditCard, Landmark, Tag, Wallet } from "lucide-react";
import formatNumber from "../../../../../tools/function/formatNumber";

export const PAY_LABELS: Record<string, string> = {
  belen: "Бэлэн", cash: "Бэлэн", khaan: "Карт", qpay: "QPay",
  khariltsakh: "Дансаар", transfer: "Дансаар", khungulult: "Хөнгөлөлт",
  discount: "Хөнгөлөлт", "Хөнгөлөлт": "Хөнгөлөлт", free: "Үнэгүй", monpay: "MonPay",
  socialpay: "SocialPay", toki: "Toki",
};
export const PAY_COLOR: Record<string, string> = {
  belen: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  cash: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  khaan: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  qpay: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  khariltsakh: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  transfer: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  khungulult: "bg-warning/10 !text-warning dark:!text-warning border-warning/30",
  discount: "bg-warning/10 !text-warning dark:!text-warning border-warning/30",
  "Хөнгөлөлт": "bg-warning/10 !text-warning dark:!text-warning border-warning/30",
  monpay: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  socialpay: "bg-theme/10 !text-brand dark:!text-brand border-theme/30",
  toki: "bg-warning/10 !text-warning dark:!text-warning border-warning/30",
};
export const PAY_TEXT_COLOR: Record<string, string> = {
  belen: "text-success",
  cash: "text-brand",
  khaan: "text-brand",
  qpay: "text-brand",
  khariltsakh: "text-brand",
  transfer: "text-brand",
  khungulult: "text-warning",
  discount: "text-warning",
  "Хөнгөлөлт": "text-warning",
  monpay: "text-brand",
  socialpay: "text-brand",
  toki: "text-warning",
};
export const PAY_BG: Record<string, string> = {
  belen: "bg-success", cash: "bg-success",
  khaan: "bg-success", qpay: "bg-theme",
  khariltsakh: "bg-theme", transfer: "bg-theme",
  khungulult: "bg-warning", discount: "bg-warning", "Хөнгөлөлт": "bg-warning",
  monpay: "bg-theme", socialpay: "bg-theme", toki: "bg-warning",
};
export const PAY_ICON_BG: Record<string, string> = {
  belen: "bg-success/10 text-success",
  cash: "bg-theme/10 text-brand",
  khaan: "bg-theme/10 text-brand",
  qpay: "bg-theme/10 text-brand",
  khariltsakh: "bg-theme/10 text-brand",
  transfer: "bg-theme/10 text-brand",
  khungulult: "bg-warning/10 text-warning",
  discount: "bg-warning/10 text-warning",
  "Хөнгөлөлт": "bg-warning/10 text-warning",
  monpay: "bg-theme/10 text-brand",
  socialpay: "bg-theme/10 text-brand",
  toki: "bg-warning/10 text-warning",
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
        className="inline-flex w-full items-center justify-end gap-1.5 cursor-pointer whitespace-nowrap"
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
                  className={`inline-block w-2 h-2 rounded-full ${PAY_BG[type] || "bg-[color:var(--panel)]"}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[color:var(--panel-text)] font-[family-name:var(--font-mono)]">
              {formatNumber(totalPaid)}
            </span>
          </>
        ) : (
          <>
            {uniqueTypes.map((type) => (
              <span key={type} className={`text-[11px] px-1.5 py-0.5 rounded border ${PAY_COLOR[type] || "bg-[color:var(--surface-hover)] !text-[color:var(--panel-text)] border-[color:var(--surface-border)]"}`}>
                {PAY_LABELS[type] || type}
              </span>
            ))}
            <span className="text-[11px] text-[color:var(--panel-text)] font-[family-name:var(--font-mono)]">
              {formatNumber(totalPaid)}
            </span>
          </>
        )}
      </div>
      {open && createPortal(
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translate(-50%, -100%)", zIndex: 99999 }}
          className="min-w-[260px] max-w-[320px] bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] dark:border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-4 py-3 border-b border-[color:var(--surface-border)] dark:border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[color:var(--muted-text)] ">
              Төлбөрийн дэлгэрэнгүй
            </span>
          </div>
          <div className="p-2 space-y-1.5">
            {grouped.map(({ type, amount, count }) => {
              const pct = totalPaid > 0 ? Math.round((amount / totalPaid) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[color:var(--surface-hover)] dark:bg-white/[0.03]">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${PAY_ICON_BG[type] || "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"}`}>
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
                      <span className={`text-[11px] font-medium ${PAY_TEXT_COLOR[type] || "text-[color:var(--muted-text)]"}`}>
                        {PAY_LABELS[type] || type}
                        {count > 1 && (
                          <span className="ml-1 text-[11px] font-normal opacity-60">×{count}</span>
                        )}
                      </span>
                      <span className="text-[11px] font-medium text-[color:var(--panel-text)] font-[family-name:var(--font-mono)]">
                        {formatNumber(amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[color:var(--panel)] dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${PAY_BG[type] || "bg-[color:var(--panel)]"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[color:var(--muted-text)] w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-[color:var(--surface-border)] dark:border-white/5 flex justify-between items-center bg-[color:var(--surface-hover)] dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-[color:var(--muted-text)] ">Нийт</span>
            <span className="text-[13px] font-medium text-brand font-[family-name:var(--font-mono)]">{formatNumber(totalPaid)}</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
