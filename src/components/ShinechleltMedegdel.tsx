"use client";

import { useEffect, useState } from "react";
import { url } from "@/lib/uilchilgee";

/**
 * «ШИНЭЧИЛЖ БАЙНА» мэдэгдэл.
 *
 * Систем шинэчлэгдэж байх үед сервер түр хариулахаа болино. Мэдэгдэлгүй
 * бол хэрэглэгчид эвдэрсэн мэт алдаа хардаг тул энэ давхарга дэлгэцийг
 * бүхэлд нь хаана.
 *
 * Хэрхэн мэдэх вэ: amarhome-ийн бэкенд `/api/shinechleltAjillajBaina` гэж
 * НИЙТЭД нээлттэй, зөвхөн `{ ajillaj: true|false }` буцаадаг товч төгсгөлөг
 * гаргадаг (тушаал, гаралт задруулахгүй).
 *
 * ХЯЗГААР: ФРОНТ өөрөө дахин асах хэсэгхэн хугацаанд энэ давхарга ажиллах
 * боломжгүй — тухайн үед вэб сервер өөрөө унтарсан байдаг. Тэр агшинд
 * nginx-ийн `error_page 502` статик хуудас л туслана.
 */
const DAVTAKH_MS = 20000;

// Хэдэн удаа дараалан амжилтгүй болбол давхаргыг БУУЛГАХ вэ.
// Бэкийг шинэчлэх үед API хэдэн арван секунд алга болдог тул тэр
// хугацаанд давхарга хэвээр байх ёстой — гэхдээ ҮҮРД биш.
const KHAMGIIN_IKH_ALDAA = 6;

export default function ShinechleltMedegdel() {
  const [ajillaj, setAjillaj] = useState(false);

  useEffect(() => {
    let amid = true;
    let tsag: ReturnType<typeof setTimeout> | null = null;
    let aldaaToo = 0;

    const shalgaya = async () => {
      try {
        const khariu = await fetch(`${url}/shinechleltAjillajBaina`, {
          cache: "no-store",
        });
        if (!amid) return;
        if (khariu.ok) {
          const ur = await khariu.json();
          aldaaToo = 0;
          // `ajillaj` нь «сайтыг хаах шаардлагатай юу» гэсэн утгатай.
          // Бэкенд энэ шийдвэрийг өөрөө гаргана (routes/
          // shinechleltRoute.js) — ФРОНТЫН build явж байхад сайт
          // хэвийн тул `false` ирнэ.
          setAjillaj(!!ur?.ajillaj);
        }
      } catch (_aldaa) {
        // Сүлжээний алдааг МЭДЭГДЭЛ болгож харуулахгүй: энгийн тасалдлыг
        // шинэчлэлт гэж андуурвал хэрэглэгчийг дэмий хаана.
        //
        // ГЭХДЭЭ төлвийг хөндөхгүй орхивол давхарга СҮҮЛИЙН утгандаа
        // ГАЦНА: нэг удаа `true` уншчихаад дараа нь сүлжээ тасарвал
        // хэзээ ч буухгүй. Иймд дараалсан алдааг тоолж, тэвчихээ
        // болиход нь буулгана.
        if (!amid) return;
        aldaaToo += 1;
        if (aldaaToo >= KHAMGIIN_IKH_ALDAA) setAjillaj(false);
      } finally {
        if (amid) tsag = setTimeout(shalgaya, DAVTAKH_MS);
      }
    };

    shalgaya();
    return () => {
      amid = false;
      if (tsag) clearTimeout(tsag);
    };
  }, []);

  if (!ajillaj) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#09090b]/95 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
        <h1 className="m-0 text-lg font-medium text-white">
          Шинэчилж байна
        </h1>
        <p className="m-0 mt-2 text-sm leading-relaxed text-white/60">
          Систем шинэчлэгдэж байна. Хэдхэн минутын дараа өөрөө үргэлжилнэ.
        </p>
      </div>
    </div>
  );
}
