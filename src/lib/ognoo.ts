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
