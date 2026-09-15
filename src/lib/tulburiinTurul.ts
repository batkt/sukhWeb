/**
 * Төлбөрийн хэрэгслийн төрлийг НЭГ жишигт оруулах цорын ганц эх сурвалж.
 *
 * Backend нь ижил утгатай төлбөрийг олон янзаар бичдэг:
 *   • QPay  — `qpay` (controller/qpayController.js), `QPay` (routes/qpayRoute.js),
 *             `toki` (routes/parkingRoute.js), мөн `GadaaQR` / `DotorQR` /
 *             `bankQR` / `tseneglelt` / `киоск`
 *   • Карт  — `khaan`, `card`, `golomt` (controller/cgw.js), `tdb`, `has`, `pos`
 *   • Бэлэн — `belen`, `cash`, `Бэлэн` ...
 *
 * Жагсаалт цонхны ШҮҮЛТ эдгээрийг аль хэдийн зөв бүлэглэдэг байсан ч
 * "Төлбөрийн хэлбэр" задаргаа нь ТҮҮХИЙ `turul`-аар нь бүлэглэдэг байв.
 * Үүнээс болж нэг QPay гүйлгээ "QPay", "toki", "GadaaQR" гэсэн тус тусдаа
 * (шошгогүй, саарал) мөр болж задарч, шүүлттэйгээ ч, бодит байдалтай ч
 * таарахгүй байсан.
 *
 * Шүүлт ба задаргаа ХОЁУЛАА эндээс уншина — ингэснээр дахин салахгүй.
 */

export type TulburiinBuleg =
  | "belen"
  | "kart"
  | "dans"
  | "qpay"
  | "khungulult"
  | "busad";

/**
 * Бүлэг бүрийн мэддэг түүхий утгууд. Жагсаалт цонхны шүүлт яг эдгээрийг
 * MongoDB `$in` болгон явуулдаг тул тэндээс хуулж авав.
 */
export const TULBURIIN_BULEG_UTGUUD: Record<
  Exclude<TulburiinBuleg, "busad">,
  string[]
> = {
  qpay: [
    "qpay",
    "QPay",
    "Qpay",
    "qPay",
    "GadaaQR",
    "DotorQR",
    "bankQR",
    "toki",
    "киоск",
    "tseneglelt",
  ],
  kart: [
    "khaan",
    "card",
    "Card",
    "Khaan",
    "Карт",
    "карт",
    "golomt",
    "tdb",
    "has",
    "Golomt",
    "TDB",
    "Has",
    "pos",
    "POS",
  ],
  belen: ["belen", "cash", "Cash", "Belen", "Бэлэн", "бэлэн"],
  dans: [
    "khariltsakh",
    "transfer",
    "Transfer",
    "Khariltsakh",
    "Dans",
    "dans",
    "Dansaar",
    "Дансаар",
    "дансаар",
  ],
  khungulult: ["khungulult", "hungulult", "discount", "Хөнгөлөлт", "хөнгөлөлт"],
};

const KHAIKH_ZURAGLAL: Record<string, TulburiinBuleg> = (() => {
  const zuraglal: Record<string, TulburiinBuleg> = {};
  (
    Object.entries(TULBURIIN_BULEG_UTGUUD) as [
      Exclude<TulburiinBuleg, "busad">,
      string[],
    ][]
  ).forEach(([buleg, utguud]) => {
    utguud.forEach((utga) => {
      zuraglal[utga.toLowerCase()] = buleg;
    });
  });
  return zuraglal;
})();

/**
 * Түүхий `tulbur[].turul`-ыг бүлэг рүү хөрвүүлнэ.
 *
 * Хөнгөлөлт нь "Хөнгөлөлт/ 24 цаг", "Хөнгөлөлт/ 2 цаг" гэх мэт чөлөөт
 * бичвэрээр ч хадгалагддаг (routes/parkingRoute.js доторх хөнгөлөлтийн
 * таслалт мөн `includes("Хөнгөлөлт")` гэж шалгадаг) тул агуулгаар нь ч
 * шалгана.
 */
export function tulburiinBulegAvya(turul?: string | null): TulburiinBuleg {
  const tsever = String(turul ?? "").trim();
  if (!tsever) return "busad";

  const shuud = KHAIKH_ZURAGLAL[tsever.toLowerCase()];
  if (shuud) return shuud;

  const jijig = tsever.toLowerCase();
  if (jijig.includes("хөнгөлөлт") || jijig.includes("khungulult"))
    return "khungulult";
  if (jijig.includes("qr") || jijig.includes("qpay")) return "qpay";

  return "busad";
}

export const TULBURIIN_BULEGIIN_NER: Record<TulburiinBuleg, string> = {
  belen: "Бэлэн",
  kart: "Карт",
  dans: "Дансаар",
  qpay: "QPay",
  khungulult: "Хөнгөлөлт",
  busad: "Бусад",
};

export const TULBURIIN_BULEGIIN_UNGU: Record<TulburiinBuleg, string> = {
  belen: "bg-emerald-500",
  kart: "bg-sky-500",
  dans: "bg-violet-500",
  qpay: "bg-amber-500",
  khungulult: "bg-rose-500",
  busad: "bg-slate-500",
};

/** Задаргаанд харуулах дараалал (дүнгээр эрэмбэлэхээс өмнөх тогтвортой суурь). */
export const TULBURIIN_BULEGIIN_DARAALAL: TulburiinBuleg[] = [
  "belen",
  "kart",
  "qpay",
  "dans",
  "busad",
  "khungulult",
];
