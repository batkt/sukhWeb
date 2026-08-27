/**
 * Монгол огноо, цагийн форматлагч.
 *
 * `toLocaleDateString("mn-MN", …)` гэж дуудахад монголоор гарах ёстой мэт
 * боловч Chromium-ийн ихэнх build-д монгол ICU өгөгдөл байхгүй:
 *   Intl.DateTimeFormat.supportedLocalesOf(["mn-MN"])  →  []
 *   Intl.DateTimeFormat("mn-MN").resolvedOptions().locale  →  "en-US"
 * Учир нь Intl алдаа шидэлгүй чимээгүйхэн en-US руу унадаг тул "Jun 4, 10:28 AM"
 * гэж англиар харагдана. Тиймээс энд Intl-д найдалгүй гараар угсарна.
 */

/** Огноог аюулгүйгээр Date болгоно; буруу утга бол null. */
function parse(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "10:28" — 24 цагийн горим (монголд AM/PM хэрэглэдэггүй). */
export function tsag(value: string | number | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * "6-р сарын 4, 10:28" — жагсаалтад зориулсан богино хэлбэр.
 * Өөр оных бол "2025 оны 6-р сарын 4, 10:28" гэж он нэмнэ, эс тэгвээс
 * хуучин мэдэгдлүүд аль оных нь нь ялгагдахгүй.
 */
export function ognooTsagBogino(
  value: string | number | Date | null | undefined,
): string {
  const d = parse(value);
  if (!d) return "";
  const on = d.getFullYear() === new Date().getFullYear() ? "" : `${d.getFullYear()} оны `;
  return `${on}${d.getMonth() + 1}-р сарын ${d.getDate()}, ${tsag(d)}`;
}

/** "2026 оны 6-р сарын 4, 10:28" — дэлгэрэнгүй харагдацад. */
export function ognooTsagButen(
  value: string | number | Date | null | undefined,
): string {
  const d = parse(value);
  if (!d) return "";
  return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}, ${tsag(d)}`;
}

/**
 * "Дөнгөж сая" / "12 мин өмнө" / "3 цагийн өмнө" — сүүлийн 24 цагийн дотор.
 * Түүнээс хуучин бол богино огноо руу шилжинэ.
 */
export function ognooKharitsangui(
  value: string | number | Date | null | undefined,
): string {
  const d = parse(value);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 0) return ognooTsagBogino(d);

  const minut = Math.floor(diff / 60000);
  if (minut < 1) return "Дөнгөж сая";
  if (minut < 60) return `${minut} мин өмнө`;

  const tsagiin = Math.floor(minut / 60);
  if (tsagiin < 24) return `${tsagiin} цагийн өмнө`;

  return ognooTsagBogino(d);
}

/**
 * Мэдэгдлийн текстээс төлсөн дүнг таана — жишээ нь "... 100₮ төллөө."
 *
 * Мэдэгдэлд дүнгийн тусдаа талбар байдаггүй тул текстээс уншихаас өөр аргагүй.
 * Таниагүй тохиолдолд `null` буцаана; дуудаж буй тал үүнийг заавал шалгаж,
 * таамаглаж бөглөх ёсгүй.
 */
export function medegdelDun(message: unknown): number | null {
  if (typeof message !== "string") return null;
  // 1,200₮ / 100 ₮ / 100төг гэсэн бичлэгүүдийг бүгдийг барина.
  const m = message.match(/([\d][\d\s,]*)\s*(?:₮|төг)/i);
  if (!m) return null;
  const num = Number(m[1].replace(/[\s,]/g, ""));
  return Number.isFinite(num) ? num : null;
}
