"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

export default function BpayGorimBanner() {
  const { baiguullaga } = useAuth() as { baiguullaga?: any };
  if (baiguullaga?.tokhirgoo?.bpayAshiglakhEsekh !== true) return null;

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <span className="font-bold">Төрийн банк (BPay) горим идэвхтэй.</span>
        <span>СӨХ-ийн төлбөрийг BPay нэхэмжилнэ.</span>
      </div>
      <Link href="/tulbur/bpay" className="font-semibold underline hover:text-amber-950">
        BPay төлбөр харах →
      </Link>
    </div>
  );
}
