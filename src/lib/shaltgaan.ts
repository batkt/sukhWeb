/**
 * УСТГАЛ / ЗАСВАРЫН ШАЛТГААН.
 *
 * Сервер (sukhBackv2 `middleware/shaltgaan.js`) ажилтны устгал, засвар бүрд
 * шалтгаан шаардана. Шалтгаан нь «Устгасан түүх», «Зассан түүх»-д ажилтны
 * нэр, огноотой хамт хадгалагдана.
 *
 * Шалтгааныг `X-Shaltgaan` толгойгоор явуулна (кирилл үсэг тул кодолно).
 * Гурван зам бий:
 *   1. Устгах баталгаажуулалтын цонх (DeleteConfirmModal) шалтгаан асууж
 *      `shaltgaanTaviya`-гаар хадгална — дараагийн өөрчлөх хүсэлтүүдэд
 *      `uilchilgee` автоматаар хавсаргана.
 *   2. `shaltgaanAsuuya()` — window.confirm-ийн оронд: асуугаад шалтгааныг
 *      буцаана (цуцалбал null).
 *   3. Аль нэг дэлгэц шалтгаангүй илгээвэл сервер 400
 *      (SHALTGAAN_SHAARDLAGATAI) буцаана — `uilchilgee` шалтгааныг асуугаад
 *      ижил хүсэлтийг дахин илгээнэ. Тиймээс шинэчлээгүй дэлгэц ч эвдрэхгүй.
 */

export const SHALTGAAN_TOLGOI = "X-Shaltgaan";
export const SHALTGAAN_KOD = "SHALTGAAN_SHAARDLAGATAI";
export const SHALTGAAN_DOOD_URT = 3;

/** Шалтгааныг HTTP толгойд тавихад бэлэн болгоно. */
export function shaltgaanTolgoi(shaltgaan: string): Record<string, string> {
  return { [SHALTGAAN_TOLGOI]: encodeURIComponent(shaltgaan.trim()) };
}

export function shaltgaanZuvEsekh(utga: string | null | undefined): boolean {
  return !!utga && utga.trim().length >= SHALTGAAN_DOOD_URT;
}

/* ── Түр хадгалах шалтгаан ──────────────────────────────────────────────
 * Нэг баталгаажуулалт хэд хэдэн хүсэлт үүсгэж болно (ж: гэрээ + оршин
 * суугч устгах). Тиймээс богино хугацаанд бүх өөрчлөх хүсэлтэд хавсаргана.
 */
const KHUGATSAA_MS = 20000;
let tur: { utga: string; duusakh: number } | null = null;

export function shaltgaanTaviya(utga: string) {
  tur = { utga: utga.trim(), duusakh: Date.now() + KHUGATSAA_MS };
}

export function shaltgaanTseverle() {
  tur = null;
}

export function turShaltgaan(): string | null {
  if (!tur) return null;
  if (Date.now() > tur.duusakh) {
    tur = null;
    return null;
  }
  return tur.utga;
}

/* ── Шалтгаан асуух цонх (ShaltgaanDialogHost) ──────────────────────── */
export type ShaltgaanAsuultOpts = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  /** Улаан (устгах) товч эсэх. Анхдагч: true */
  danger?: boolean;
};

type Sonsogch = (opts: ShaltgaanAsuultOpts, khariu: (utga: string | null) => void) => void;
let sonsogch: Sonsogch | null = null;

/** ShaltgaanDialogHost л дуудна. */
export function shaltgaanSonsogchBurtgeye(fn: Sonsogch | null) {
  sonsogch = fn;
}

/**
 * Шалтгаан асууна. Бичээд батлавал шалтгааныг, цуцалбал null буцаана.
 * Баталсан шалтгааныг дараагийн хүсэлтүүдэд автоматаар хавсаргана.
 */
export function shaltgaanAsuuya(opts: ShaltgaanAsuultOpts = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const duusgaya = (utga: string | null) => {
      if (utga && shaltgaanZuvEsekh(utga)) {
        shaltgaanTaviya(utga);
        resolve(utga.trim());
      } else {
        resolve(null);
      }
    };
    if (sonsogch) {
      sonsogch(opts, duusgaya);
      return;
    }
    // Host суугаагүй (ж: нэвтрэх хуудас) — хөтчийн энгийн асуулт
    if (typeof window !== "undefined") {
      duusgaya(window.prompt(`${opts.title || "Шалтгаан"}\n${opts.message || ""}\nШалтгаан:`) ?? null);
      return;
    }
    resolve(null);
  });
}
