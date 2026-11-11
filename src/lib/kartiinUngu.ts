import type React from "react";

/**
 * Дашбоард картын өнгө — картын нэрээр (бүх хуудсанд нэг дүрэм).
 *
 * Буцаах утга нь "R, G, B" — globals.css-ийн `--kart-ungu` хувьсагчид өгнө:
 * hover-ийн бүдэг дэвсгэр, сонгогдсон картын хүрээ энэ өнгөөр будагдана.
 * Оршин суугч / харилцагч нь гэрээний хүснэгтийн нэрийн өнгөтэй ижил.
 */
const UNGUNUUD: { tulkhuur: string[]; ungu: string }[] = [
  { tulkhuur: ["оршин суугч"], ungu: "59, 130, 246" }, // цэнхэр
  { tulkhuur: ["харилцагч"], ungu: "168, 85, 247" }, // нил ягаан
  { tulkhuur: ["төлөөгүй", "цуцалсан", "идэвхгүй", "авлага"], ungu: "239, 68, 68" }, // улаан
  { tulkhuur: ["төлсөн", "идэвхтэй", "бүртгэлтэй", "холбогдсон", "нээсэн"], ungu: "22, 163, 74" }, // ногоон
  { tulkhuur: ["чөлөөтэй", "хөнгөлөлт", "тодорхойгүй", "магадлалтай"], ungu: "245, 158, 11" }, // шар
  { tulkhuur: ["түрээслэгч", "урьсан"], ungu: "249, 115, 22" }, // улбар шар
  { tulkhuur: ["сөх", "ажилтан", "камер"], ungu: "20, 184, 166" }, // ногоовтор цэнхэр
  { tulkhuur: ["нийт", "бүгд", "бусад"], ungu: "100, 116, 139" }, // саарал
];

/** Анхдагч — сэдвийн зөөлөн ногоон. */
const ANKHDAGCH = "34, 197, 94";

export function kartiinUngu(ner: string): string {
  const n = String(ner || "").trim().toLowerCase();
  const olson = UNGUNUUD.find((u) => u.tulkhuur.some((t) => n.includes(t)));
  return olson ? olson.ungu : ANKHDAGCH;
}

/** Карт (neu-panel) дээр шууд тавих style. */
export function kartiinUnguStyle(ner: string): React.CSSProperties {
  return { "--kart-ungu": kartiinUngu(ner) } as React.CSSProperties;
}
