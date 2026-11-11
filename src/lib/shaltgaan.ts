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

/**
 * Шалтгааныг дараагийн өөрчлөх хүсэлтүүдэд хавсаргахаар хадгална.
 * Бөөнөөр устгал (олон тоот/давхар) удаан үргэлжилж болох тул баталгаажуулах
 * цонх нь урт хугацаа өгөөд дуусмагц `shaltgaanTseverle` дуудна — ингэснээр
 * нэг удаа бичсэн шалтгаан бүх устгагдсан бичлэгт хадгалагдана.
 */
export function shaltgaanTaviya(utga: string, khugatsaaMs: number = KHUGATSAA_MS) {
  tur = { utga: utga.trim(), duusakh: Date.now() + khugatsaaMs };
}

/** Баталгаажуулалтын үйлдэл дуустал (дээд тал нь 10 минут) */
export const UILDEL_DUUSTAL_MS = 10 * 60 * 1000;

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
  /**
   * Баталсан шалтгааныг дараагийн хүсэлтүүдэд хэр удаан хавсаргах (мс).
   * Анхдагч 20 сек. Тохиргооны сонголт бүрд дахин асуухын тулд богино.
   */
  turKhugatsaaMs?: number;
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
        shaltgaanTaviya(utga, opts.turKhugatsaaMs);
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

/* ── Аль хүсэлтэд шалтгаан шаардах вэ ───────────────────────────────────
 * sukhBackv2 `middleware/shaltgaan.js`-ийн дүрэмтэй ИЖИЛ байх ёстой.
 * Вэб хүсэлт илгээхээс ӨМНӨ асуудаг тул сервер 400 буцаахыг хүлээхгүй;
 * ялгаа гарвал сервер 400 буцааж, uilchilgee дахин асуугаад илгээнэ.
 */
const KHAMAARAKHGUI: { method?: string; zam: RegExp }[] = [
  { zam: /^\/medegdel\/[^/]+\/kharsanEsekh\/?$/ },
  { method: "put", zam: /^\/medegdel\/[^/]+\/?$/ },
  { zam: /^\/(zogsoolUilchluulegch|uilchluulegch|kassCameraKhaalt)(\/|$)/ },
  { zam: /^\/wallet(\/|$)/ },
  { zam: /^\/(session|nevtreltiinTuukh|backTuukh)(\/|$)/ },
  { zam: /^\/audit(\/|$)/ },
];

const POST_ZAMUUD: RegExp[] = [
  /^\/(geree|khariltsagch)\/[^/]+\/adminUstgakh\/?$/,
  /^\/deleteInvoice\/?$/,
  /^\/nekhemjlekhiinTuukh\/deleteZardal\/?$/,
  /^\/(khariltsagch|orshinSuugch)\/remove-toot\/?$/,
  /^\/zogsoolUstgay\/?$/,
  /^\/ashiglaltiinZardalUstgaya\/?$/,
  /^\/gerBuliinGishuun(Ustgakh|Zasakh)\/?$/,
  /^\/mashiniiDugaarZasakh\/?$/,
  /^\/davkharBarimtZasakh\/?$/,
  /^\/ebarimtButsaaya\/?$/,
  /^\/easyRegister\/user\/(delete|hardDelete)\/?$/,
  /^\/baiguullaga\/[^/]+\/?$/,
  /^\/bpay\/medeelel\/?$/,
  /^\/gereeTsutslakh\/?$/,
  /^\/gereeNemeltTootKhasya\/?$/,
  /^\/guilgeeSalgaya\/?$/,
  /^\/khungulultZasvarlaya\/?$/,
  /^\/zardalTseverlekhiya\/?$/,
  /^\/orshinSuugch\/massUpdateKwt\/?$/,
];

/** axios-ийн url-ыг «/zam» хэлбэрт оруулна (baseURL, query, /api/ хасна) */
function zamAvya(url: string, baseURL?: string): string {
  let z = url || "";
  if (baseURL && z.startsWith(baseURL)) z = z.slice(baseURL.length);
  try {
    if (/^https?:\/\//.test(z)) z = new URL(z).pathname;
  } catch {
    /* хэвээр */
  }
  z = z.split("?")[0].split("#")[0];
  if (!z.startsWith("/")) z = `/${z}`;
  return z.replace(/^\/api(?=\/)/, "");
}

export function shaltgaanShaardakhEsekh(
  method: string | undefined,
  url: string,
  baseURL?: string,
  data?: unknown,
): boolean {
  const m = (method || "get").toLowerCase();
  const zam = zamAvya(url, baseURL);
  if (m === "delete" || m === "put" || m === "patch") {
    return !KHAMAARAKHGUI.some((d) => (!d.method || d.method === m) && d.zam.test(zam));
  }
  if (m === "post") {
    // Админ устгалын «зөвхөн тоолох» шалгалт (zovkhonShalgakh) нь өөрчлөлт хийхгүй
    if (/\/adminUstgakh\/?$/.test(zam) && (data as { zovkhonShalgakh?: boolean } | null)?.zovkhonShalgakh === true) {
      return false;
    }
    return POST_ZAMUUD.some((r) => r.test(zam));
  }
  return false;
}

/** Зэрэг ирсэн хэд хэдэн хүсэлтэд нэг л цонх гаргана */
let khuleegdejBuiAsuult: Promise<string | null> | null = null;

/** Тохиргооны сонголт бүрд дахин асуухын тулд богино хугацаа */
const NEG_UILDLIIN_MS = 3000;

export function khuseltiinShaltgaanAsuuya(): Promise<string | null> {
  if (!khuleegdejBuiAsuult) {
    khuleegdejBuiAsuult = shaltgaanAsuuya({
      title: "Шалтгаан бичнэ үү",
      message:
        "Энэ өөрчлөлт «Зассан / Устгасан түүх»-д таны нэр, шалтгаантай хамт бүртгэгдэнэ.",
      confirmLabel: "Хадгалах",
      danger: false,
      turKhugatsaaMs: NEG_UILDLIIN_MS,
    }).finally(() => {
      khuleegdejBuiAsuult = null;
    });
  }
  return khuleegdejBuiAsuult;
}
