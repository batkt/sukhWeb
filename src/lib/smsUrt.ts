/**
 * SMS-ийн УРТЫГ бодох.
 *
 * SMS нь текстийг хоёр өөр кодчилолын аль нэгээр явуулдаг:
 *
 *   GSM-7  — зөвхөн латин үсэг, тоо, үндсэн тэмдэгт. 1 мессэжид 160 тэмдэгт.
 *   UCS-2  — кирилл зэрэг бусад БҮХ тэмдэгт. Тэмдэгт тус бүр 2 дахин зай
 *            эзэлнэ.
 *
 * ЧУХАЛ: кодчилол нь тэмдэгт тус бүрээр БИШ, мессэж БҮХЭЛДЭЭ сонгогддог.
 * Монгол ганц үсэг орвол БҮХ мессэж UCS-2 болно — тиймээс «30 латин + 5
 * кирилл = 40» гэж бодох нь буруу. Тэр мессэж 35 тэмдэгтийн урттай ч
 * UCS-2-ын хязгаартай болно.
 */

/**
 * GSM-7 кодчилолд багтах тэмдэгтүүд (GSM 03.38 үндсэн хүснэгт).
 *
 * Энд БАЙХГҮЙ ганц тэмдэгт орвол мессэж бүхэлдээ UCS-2 болно.
 */
const GSM7_TEMDEGTUUD =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà" +
  // Өргөтгөлийн хүснэгт — GSM-7 дотор багтах ч ХОЁР байт эзэлнэ.
  "^{}\\[~]|€";

const GSM7_OLONLOG = new Set(GSM7_TEMDEGTUUD.split(""));

/** Нэг мессэжид багтах тэмдэгтийн тоо. */
export const GSM7_KHYAZGAAR = 160;

/**
 * UCS-2 (кирилл) мессэжийн хязгаар.
 *
 * ОЛОН УЛСЫН СТАНДАРТ нь 70 боловч манай үйлчилгээ үзүүлэгч 160 нэгжийн
 * багцад кирилл үсгийг 2 нэгжээр тооцдог тул 80 болж байна. Үйлчилгээ
 * үзүүлэгч солигдвол ЗӨВХӨН энэ тоог өөрчилнө.
 */
export const UCS2_KHYAZGAAR = 80;

/** Текст GSM-7-д багтах уу (өөрөөр хэлбэл кирилл агуулаагүй юу). */
export function gsm7Esekh(text: string): boolean {
  for (const temdegt of text || "") {
    if (!GSM7_OLONLOG.has(temdegt)) return false;
  }
  return true;
}

export type SmsKhemjee = {
  /** Бичсэн тэмдэгтийн тоо. */
  urt: number;
  /** Энэ кодчилолд зөвшөөрөгдөх дээд тоо. */
  khyazgaar: number;
  /** Кирилл (UCS-2) эсэх. */
  unicode: boolean;
  /** Хязгаараас хэтэрсэн эсэх. */
  khetersen: boolean;
  /** Дүүргэлтийн хувь (0–100). */
  khuvi: number;
};

/**
 * Мессэжийн хэмжээг бодно.
 *
 * ГАРЧИГ, АГУУЛГА ХОЁУЛАА орно: илгээхдээ `${title}\n${msj}` гэж нийлүүлж
 * явуулдаг тул гарчгийг тооцохгүй бол хязгаар нь худал болно.
 */
export function smsKhemjeeBodoyo(title: string, body: string): SmsKhemjee {
  const buten = `${title || ""}\n${body || ""}`.trim();
  const unicode = !gsm7Esekh(buten);
  const khyazgaar = unicode ? UCS2_KHYAZGAAR : GSM7_KHYAZGAAR;
  const urt = buten.length;

  return {
    urt,
    khyazgaar,
    unicode,
    khetersen: urt > khyazgaar,
    khuvi: khyazgaar > 0 ? Math.min(100, Math.round((urt / khyazgaar) * 100)) : 0,
  };
}
