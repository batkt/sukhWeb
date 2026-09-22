/**
 * Улсын дугаарын НЭГДСЭН шалгуур ба цэвэрлэгч.
 *
 * ── Яагаад нэг дор ─────────────────────────────────────────────────────
 * Ижил зохицуулга кодод ТАВАН газар давхардаж байсан:
 *
 *   src/app/zogsool-qr/[baiguullagiinId]/[barilgiinId]/page.tsx
 *   src/app/(shell)/zogsool/orshinSuugch/ExcelImportModal.tsx
 *   src/app/(shell)/zogsool/jagsaalt/page.tsx
 *   src/app/(shell)/geree/modals/ResidentDetailModal.tsx
 *   src/app/(shell)/geree/modals/KhariltsagchModal.tsx
 *
 * Тэдгээрийн зарим нь зөвхөн regex-тэй, зарим нь латин→кирилл хөрвүүлэгтэй
 * байсан тул модал хооронд өөр өөр зан төлөвтэй болсон: нэг цонхонд
 * `ЫБЛОРӨЙ` өнгөрч, нөгөөд өнгөрдөггүй.
 */

/** Улсын дугаар: эхний 4 нь тоо, сүүлийн 3 нь монгол кирилл үсэг (ж: 1234УБА) */
export const MASHINII_DUGAARIIN_ZAGVAR = /^\d{4}[А-ЯӨҮЁ]{3}$/;

/** Латин гараас бичсэн ч монгол кирилл рүү хөрвүүлнэ */
export const LATIN_KIRILL: Record<string, string> = {
  A: "А", B: "Б", C: "С", D: "Д", E: "Е", F: "Ф", G: "Г", H: "Х",
  I: "И", J: "Ж", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "П",
  Q: "Ө", R: "Р", S: "С", T: "Т", U: "У", V: "В", W: "В", X: "Х",
  Y: "Ү", Z: "З",
};

/**
 * Бичиж байх үед л хэлбэрт хүчээр оруулна.
 *
 * Эхний 4 орон ЗӨВХӨН тоо — үсэг бичвэл огт хүлээж авахгүй. Дараагийн 3
 * нь зөвхөн монгол кирилл; латинаар бичсэнийг хөрвүүлнэ. Иймд `ЫБЛОРӨЙ`
 * гэх мэт зүйл оролтод БҮР орж чадахгүй, зөвхөн хадгалах үед барих
 * шаардлагагүй.
 *
 * @example mashiniiDugaarTseverle("1234uba") // "1234УБА"
 * @example mashiniiDugaarTseverle("ЫБЛОРӨЙ") // ""
 */
export function mashiniiDugaarTseverle(orolt: string): string {
  const raw = String(orolt || "")
    .toUpperCase()
    .replace(/\s/g, "");
  let toonuud = "";
  let useguud = "";

  for (const ch of raw) {
    if (toonuud.length < 4) {
      // Эхний 4 орон заавал зөвхөн тоо байх ёстой — үсэг огт зөвшөөрөхгүй
      if (/\d/.test(ch)) {
        toonuud += ch;
      }
    } else if (useguud.length < 3) {
      // 4 тооны дараа л зөвхөн 3 монгол кирилл үсэг зөвшөөрнө
      const cyrillic = LATIN_KIRILL[ch] || ch;
      if (/^[А-ЯӨҮЁ]$/.test(cyrillic)) {
        useguud += cyrillic;
      }
    }
  }

  return toonuud + useguud;
}

/** Дугаар нь бүрэн, зөв хэлбэртэй эсэх. */
export function dugaarZuvEsekh(dugaar: string): boolean {
  return MASHINII_DUGAARIIN_ZAGVAR.test(String(dugaar || "").trim());
}

/**
 * Нэг эзэн дээр бүртгэж болох машины ДЭЭД тоо.
 *
 * Backend-ийн `utils/mashinBurtgel.js` → `mashiniiKhyazgaarOlya` -тай ЯГ
 * ижил дарааллаар шийднэ. Хоёр тал салбал дэлгэц зөвшөөрөөд сервер
 * хаях — хэрэглэгчид «алдаагүй мэт» харагдаад машин орохгүй байдалд
 * хүргэнэ.
 *
 * Эрэмбэ: барилгын тохиргоо → байгууллагын тохиргоо, ТАЛБАР ТУС БҮРД.
 * Харилцагчийнх тохируулаагүй бол оршин суугчийнх рүү нөхнө.
 *
 * @returns 0 бол тохируулаагүй — хязгаарлахгүй.
 */
export function mashiniiKhyazgaarOlya(
  baiguullaga: any,
  barilga: any,
  ezemshigchiinTurul: "OrshinSuugch" | "Khariltsagch" = "OrshinSuugch",
): number {
  // Хуучин бичлэгүүд дээр `zochinTokhirgoo` нь барилгын үндсэн дээр ч
  // хадгалагдсан байдаг тул дөрвүүлэнг шалгана — backend-тэй адил.
  const bairshluud = [
    barilga?.tokhirgoo?.zochinTokhirgoo,
    barilga?.zochinTokhirgoo,
    baiguullaga?.tokhirgoo?.zochinTokhirgoo,
    baiguullaga?.zochinTokhirgoo,
  ];

  const unshiya = (talbar: string) => {
    for (const b of bairshluud) {
      const utga = b?.[talbar];
      if (utga !== undefined && utga !== null && utga !== "") return Number(utga);
    }
    return NaN;
  };

  let utga = unshiya(
    ezemshigchiinTurul === "Khariltsagch"
      ? "khariltsagchMashiniiLimit"
      : "orshinSuugchMashiniiLimit",
  );

  if (!(Number.isFinite(utga) && utga > 0) && ezemshigchiinTurul === "Khariltsagch") {
    utga = unshiya("orshinSuugchMashiniiLimit");
  }

  return Number.isFinite(utga) && utga > 0 ? Math.floor(utga) : 0;
}
