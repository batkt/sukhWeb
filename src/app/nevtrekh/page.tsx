"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

// ZevTabs удирдлагын системээс "Нэвтрэх" товч дарахад энэ хуудас руу ирнэ.
// Хаягийн мөрөнд ирэх нь token биш, нэг удаагийн богино настай код бөгөөд
// үүнийг жинхэнэ нэвтрэлт болгож солиод шууд эхний цонх руу шилжинэ.
function Nevtrekh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { zevtabsaaraaNevtrey } = useAuth();
  const [aldaa, setAldaa] = useState<string | null>(null);
  // React-ийн давхар render (StrictMode) дээр кодыг хоёр удаа солихоос
  // сэргийлнэ — код нэг удаагийнх тул хоёр дахь оролдлого нь заавал алдаа өгнө.
  const ekhelsenEsekh = useRef(false);

  useEffect(() => {
    if (ekhelsenEsekh.current) return;
    ekhelsenEsekh.current = true;

    const code = searchParams.get("code");
    if (!code) {
      setAldaa("Нэвтрэх код олдсонгүй.");
      return;
    }

    // Код хаягийн мөрөнд болон түүхэнд үлдэхгүй байх ёстой.
    window.history.replaceState(null, "", "/nevtrekh");

    zevtabsaaraaNevtrey(code).then((khariu) => {
      if (khariu?.success) router.replace("/khynalt");
      else setAldaa(khariu?.error || "Нэвтрэх боломжгүй байна.");
    });
  }, [searchParams, router, zevtabsaaraaNevtrey]);

  if (!aldaa)
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      </div>
    );

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-lg font-medium text-red-500">{aldaa}</div>
      <div className="text-sm text-gray-500">
        ZevTabs удирдлагын системээс дахин оролдоно уу.
      </div>
      <button
        onClick={() => router.replace("/login")}
        className="rounded-lg bg-green-600 px-5 py-2 text-white transition-colors hover:bg-green-700"
      >
        Нэвтрэх хуудас руу
      </button>
    </div>
  );
}

// `useSearchParams` нь Suspense шаарддаг (Next.js App Router).
export default function NevtrekhPage() {
  return (
    <Suspense fallback={null}>
      <Nevtrekh />
    </Suspense>
  );
}
