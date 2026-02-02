// Shared UI utilities and payment status helpers

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type PaymentLike = Record<string, any>;

// Classname merge helper commonly used by UI components
export function cn(...inputs: any[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Returns a unified Mongolian status label for payment-like records.
 * - "Төлсөн" when clearly paid
 * - "Төлөөгүй" when clearly unpaid
 * - "Тодорхойгүй" otherwise
 */
export function getPaymentStatusLabel(
  item: PaymentLike | undefined | null
): "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй" {
  if (!item) return "Тодорхойгүй";

  const rawTuluv = String(item.tuluv ?? "").trim();
  const rawLc = rawTuluv.toLowerCase();
  const now = new Date();
  const due = item.tulukhOgnoo ? new Date(item.tulukhOgnoo) : null;

  const hasPaymentHistory = Array.isArray(item.paymentHistory)
    ? item.paymentHistory.length > 0
    : false;

  // Paid signals (backend or derived)
  const paidSignals = [
    rawLc === "төлсөн",
    rawLc === "paid",
    rawLc === "paid_success",
    !!item.tulsunOgnoo,
    hasPaymentHistory,
    item.payStatus === "PAID",
    item.paid === true,
  ];
  if (paidSignals.some(Boolean)) return "Төлсөн";

  // Respect explicit backend tuluv if present
  if (rawTuluv === "Төлөөгүй") return "Төлөөгүй";
  if (rawTuluv === "Хугацаа хэтэрсэн") return "Хугацаа хэтэрсэн";

  // Derive overdue when due date passed and not paid
  if (due && !Number.isNaN(due.getTime()) && now > due) {
    return "Хугацаа хэтэрсэн";
  }

  // Derive unpaid if looks like an issued invoice or has amount
  const looksIssued =
    item.ognoo || item.createdAt || item.nekhemjlekhiinOgnoo || item.qpayUrl;
  const amount = Number(
    item.niitTulbur ??
    item.niitDun ??
    item.total ??
    item.tulukhDun ??
    item.undsenDun ??
    item.dun ??
    0
  );
  if (looksIssued || amount > 0) return "Төлөөгүй";

  return "Тодорхойгүй";
}

export function isPaidLike(item: PaymentLike | undefined | null): boolean {
  return getPaymentStatusLabel(item) === "Төлсөн";
}

export function isUnpaidLike(item: PaymentLike | undefined | null): boolean {
  const s = getPaymentStatusLabel(item);
  return s === "Төлөөгүй" || s === "Хугацаа хэтэрсэн";
}

export function isOverdueLike(item: PaymentLike | undefined | null): boolean {
  return getPaymentStatusLabel(item) === "Хугацаа хэтэрсэн";
}

export function canPayLike(item: PaymentLike | undefined | null): boolean {
  // Mirrors backend virtual: can pay unless already paid
  return getPaymentStatusLabel(item) !== "Төлсөн";
}
