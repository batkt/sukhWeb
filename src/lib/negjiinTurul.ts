/**
 * Нэгжийн (тоот / гараж / агуулах) ТӨРЛИЙГ нэг мөр болгоно.
 *
 * Асуудал: ижил гаражийг газар газар өөр нэрээр хадгалсан байдаг —
 * «Гараж», «Зогсоол», төрөлгүй ч B1 давхарт. Жагсаалт, модал, давхардлын
 * шалгалт бүр өөрийн гэсэн таних дүрэмтэй байсан тул:
 *   • модал нь `turul === "Гараж"`-ийг л уншиж, «Зогсоол» гэж хадгалсан
 *     гаражийг ХАРУУЛАХГҮЙ орхидог (идэвхтэй тоот гүйцэт харагдахгүй),
 *   • хүснэгтийн давхардал арилгах түлхүүр нь түүхий `turul`-ыг хэрэглэдэг
 *     тул «Гараж» ба «Зогсоол» хоёр ТУСДАА мөр болж харагддаг,
 *   • хадгалахад модал `units`-ийг бүрэн дарж бичдэг тул харагдаагүй нэгж
 *     чимээгүй устдаг.
 *
 * Иймд БҮХ хэрэглэгч энэ нэг функцээр дамжина.
 */

import { isGarageFloor } from "@/lib/useGereeData";

export type NegjiinTurul = "Орон сууц" | "Гараж" | "Агуулах";

/** Нэгжийн жинхэнэ төрөл — ямар нэрээр хадгалсныг үл хамааран. */
export function negjiinTurul(negj: any): NegjiinTurul {
  const turul = String(negj?.turul || "").trim().toLowerCase();
  if (turul === "агуулах" || turul === "storage") return "Агуулах";
  if (["гараж", "зогсоол", "garage", "parking"].includes(turul)) return "Гараж";
  // Төрөлгүй / «Орон сууц» гэж хадгалсан ч B1, B2 зэрэг зоорийн давхарт
  // байгаа нэгж нь гараж.
  if (
    (!turul || turul === "орон сууц" || turul === "тоот") &&
    isGarageFloor(String(negj?.davkhar || ""))
  ) {
    return "Гараж";
  }
  return "Орон сууц";
}

/** Модалын таб төрөл («Зогсоол») → нэгжийн төрөл («Гараж»). */
export function tabiinTurul(tab: "Зогсоол" | "Агуулах"): NegjiinTurul {
  return tab === "Агуулах" ? "Агуулах" : "Гараж";
}

/** `B-1`, `в1`, `-1`, `B1 давхар` → `B1`. Хоосон бол хоосон. */
export function davkhariinTulkhuur(davkhar: any): string {
  return String(davkhar || "")
    .replace(/\s*давхар\s*/gi, "")
    .replace(/^[вВ]/, "B")
    .replace(/^-/, "B")
    .replace(/^B-/, "B")
    .trim()
    .toUpperCase();
}

/** `0040`, ` 40 ` → `40`. Үсэгтэй дугаарыг жижиг үсэг болгоно. */
export function tootiinTulkhuur(toot: any): string {
  return String(toot || "")
    .trim()
    .toLowerCase()
    .replace(/^0+(?=\d)/, "");
}

/**
 * Хоёр нэгж НЭГ ижил нэгж мөн үү гэдгийг шийдэх түлхүүр.
 *
 * Гараж B1-10 ба B2-10 нь ӨӨР нэгж тул давхрыг оруулна. Харин орон сууцны
 * давхар нь тоотноосоо мэдэгддэг тул орцыг нь оруулна.
 */
export function negjiinTulkhuur(negj: any, barilgiinId?: string): string {
  const turul = negjiinTurul(negj);
  const bId = String(negj?.barilgiinId || barilgiinId || "");
  const toot = tootiinTulkhuur(negj?.toot);
  if (turul === "Орон сууц") {
    return `${turul}|${bId}|${String(negj?.orts || "").trim()}|${toot}`;
  }
  return `${turul}|${bId}|${davkhariinTulkhuur(negj?.davkhar)}|${toot}`;
}
