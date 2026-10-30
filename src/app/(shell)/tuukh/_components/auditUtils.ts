import dayjs from "dayjs";
import { TOKHIRGOO_MODEL_NER, auditTurulNer } from "@/lib/auditTurluud";

/** Гурван түүхийн хуудас нэг бүрдлийг ашиглана — ялгаа нь энэ төрөл. */
export type TuukhTurul = "zassan" | "ustgasan";

export interface AuditUurchlult {
  talbar: string;
  label: string;
  umnukh: unknown;
  shine: unknown;
}

/** API-ийн гурван өөр хэлбэрийн бичлэгийг нэг бүтэц болгосон мөр */
export interface AuditMur {
  _id: string;
  /** Model-ийн нэр (classType / modelName) */
  turul: string;
  /** Хүнд ойлгомжтой нэр (classNer эсвэл нөөц) */
  ner: string;
  /** Дугаар (classDugaar) */
  dugaar: string;
  /** Баримтын өөрийн (анх бүртгэгдсэн) огноо */
  bichlegiinOgnoo: string | null;
  ajiltniiId: string;
  ajiltniiNer: string;
  /** Үйлдэл хийсэн огноо */
  uildelOgnoo: string | null;
  /** Засварын утга учиртай өөрчлөлтүүд (зассан) */
  uurchlultuud: AuditUurchlult[];
  /** Засварт ирсэн нийт өөрчлөлтийн тоо (шүүхээс өмнө) */
  niitUurchlult: number;
  shaltgaan: string;
  /** Устгасан баримтын агшин зураг */
  deletedData: Record<string, unknown> | null;
  /** «Зассан түүх»-ийн төрөл (юу өөрчлөгдсөнөөр): burtgel, umch, … */
  angilal: string;
  /** Төрлийн харагдах нэр: «Бүртгэл», «Өмч бүртгэл» … */
  angilalNer: string;
}

/* ------------------------- засварын төрөл ------------------------- */

/**
 * «Зассан түүх»-ийн төрлүүд — юу өөрчлөгдсөнөөр нь ангилна. Дараалал нь
 * шүүлтүүрийн дараалал; «Тохиргоо» нь сүүлд, бусад бүх засварыг багтаана.
 */
export const ZASVAR_ANGILAL_NER: Record<string, string> = {
  burtgel: "Оршин суугч / Харилцагч",
  umch: "Өмч бүртгэл",
  nekhemjlekh: "Нэхэмжлэх",
  khungulult: "Хөнгөлөлт",
  jagsaalt: "Жагсаалт",
  mashin: "Машин бүртгэл",
  khaalga: "Хаалт нээх эрх",
  gerBul: "Гэр бүлийн гишүүн урих",
  // Зөвхөн «Устгасан түүх»-д (засвар нь бүртгэгдэхгүй)
  ebarimt: "И-баримт",
  tokhirgoo: "Тохиргоо",
};

/** Төрлийн жагсаалт (шүүлтүүрийн дарааллаар) — хуудас бүрт */
export const angilaluudKhuudsaar = (turul: TuukhTurul) =>
  Object.entries(ZASVAR_ANGILAL_NER).filter(([k]) => turul === "ustgasan" || k !== "ebarimt");

const ANGILAL_MODEL: Record<string, string[]> = {
  khungulult: ["khungulult", "khungulultiinTuukh"],
  nekhemjlekh: [
    "nekhemjlekh", "nekhemjlekhiinTuukh", "guilgeeAvlaguud", "guilgee", "bankniiGuilgee",
    "zaaltUnshlalt",
  ],
  jagsaalt: ["uilchluulegch", "blockMashin"],
  mashin: ["mashin", "orshinSuugchMashin", "khariltsagchMashin", "uneguiMashin"],
  umch: ["tootBurtgel", "talbai"],
  burtgel: ["orshinSuugch", "khariltsagch", "geree"],
  gerBul: ["gerBuliinUrilga"],
  ebarimt: ["ebarimt", "ebarimtShine", "easyRegisterUser"],
};

/**
 * Талбараар тодорхойлогдох төрөл (model-оос давуу). Оршин суугчийн
 * «холбогдсон тоот» нь оршин суугчийн бүртгэлд үлдэнэ — «Өмч бүртгэл» нь
 * тоотын бүртгэл өөрөө (tootBurtgel).
 */
const ANGILAL_TALBAR: Record<string, string[]> = {
  khungulult: ["khungulult", "khungulultuud"],
  nekhemjlekh: ["zardluud", "ekhniiUldegdel", "ehniiUldegdel"],
  mashin: ["mashin", "mashinuud", "mashiniiDugaar"],
  khaalga: ["khaalga", "khaalganuud", "khaalganiiErkh", "khaalgaNeekhErkh"],
  gerBul: ["gishuuniiErkh", "gerBuliinGishuud", "gishuud"],
};

/** Нэг өөрчлөлтийн төрөл: эхлээд талбараар, дараа нь model-оор */
function uurchlultiinAngilal(model: string, talbar: string): string | null {
  const ekh = talbar.split(".")[0];
  for (const [a, talbaruud] of Object.entries(ANGILAL_TALBAR)) {
    if (talbaruud.includes(ekh)) return a;
  }
  for (const [a, modeluud] of Object.entries(ANGILAL_MODEL)) {
    if (modeluud.includes(model)) return a;
  }
  return null;
}

/** Model-оор л тодорхойлогдох төрөл; аль ч бүлэгт ороогүй бол «Тохиргоо» */
function modeliinAngilal(model: string): string {
  for (const [a, modeluud] of Object.entries(ANGILAL_MODEL)) {
    if (modeluud.includes(model)) return a;
  }
  return "tokhirgoo";
}

/**
 * Нэг засварыг төрөл бүрээр мөр болгон салгана: оршин суугчийн утас солиод
 * гараж нэмсэн бол «Бүртгэл», «Өмч бүртгэл» гэсэн хоёр мөр.
 */
export function angilalaarSalgakh(m: AuditMur): AuditMur[] {
  const tokhiruulakh = (a: string) => ({ angilal: a, angilalNer: ZASVAR_ANGILAL_NER[a] });
  if (m.uurchlultuud.length === 0) return [{ ...m, ...tokhiruulakh(modeliinAngilal(m.turul)) }];
  const buleg = new Map<string, AuditUurchlult[]>();
  m.uurchlultuud.forEach((c) => {
    const a = uurchlultiinAngilal(m.turul, c.talbar) || modeliinAngilal(m.turul);
    buleg.set(a, [...(buleg.get(a) || []), c]);
  });
  return Array.from(buleg.entries()).map(([a, jagsaalt]) => ({
    ...m,
    _id: buleg.size > 1 ? `${m._id}:${a}` : m._id,
    uurchlultuud: jagsaalt,
    ...tokhiruulakh(a),
  }));
}

/* ------------------------- устгасан товч ------------------------- */

const mungu = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" && v !== null ? `${n.toLocaleString("en-US")}₮` : null;
};

/**
 * Устгасан баримтыг нэг өгүүлбэрээр («Нэхэмжлэхээс 1 ашиглалтын зардал
 * устгасан») + зөвхөн хамааралтай талбарууд. Тодорхой загваргүй бол null —
 * тэр үед бүх талбарыг харуулна.
 */
export function ustgasanTovch(
  m: AuditMur,
): { garchig: string; delgerengui: string | null; talbaruud: string[] } | null {
  const d = (m.deletedData || {}) as Record<string, unknown>;
  const s = (k: string) => (d[k] == null ? "" : String(d[k]).trim());
  if (m.turul === "guilgeeAvlaguud") {
    const dun = mungu(d.dun ?? d.tulukhDun ?? d.undsenDun);
    const talbaruud = ["zardliinNer", "dun", "toot", "gereeniiDugaar", "ognoo", "nemeltTailbar"];
    if (d.ekhniiUldegdelEsekh === true || d.ekhniiUldegdelEsekh === "true")
      return {
        garchig: "Нэхэмжлэхээс 1 эхний үлдэгдэл устгасан",
        delgerengui: dun,
        talbaruud: ["dun", "toot", "gereeniiDugaar", "ognoo", "tailbar"],
      };
    if (s("zardliinNer") || s("zardliinId"))
      return {
        garchig: "Нэхэмжлэхээс 1 ашиглалтын зардал устгасан",
        delgerengui: [s("zardliinNer") || s("tailbar"), dun].filter(Boolean).join(" — ") || null,
        talbaruud,
      };
    return {
      garchig: "1 гүйлгээ устгасан",
      delgerengui: [s("tailbar"), mungu(d.tulsunDun) || dun].filter(Boolean).join(" — ") || null,
      talbaruud: ["tulsunDun", "dun", "toot", "gereeniiDugaar", "ognoo", "tailbar"],
    };
  }
  return null;
}

/** Нууц үгийн талбар — hash-ийг хэзээ ч харуулахгүй */
const NUUTS_TALBAR = new Set(["nuutsUg", "password", "nuutsKod", "pinKod"]);

/* ------------------------------ талбарууд ------------------------------ */

export const TALBARIIN_NER: Record<string, string> = {
  ner: "Нэр",
  ovog: "Овог",
  utas: "Утас",
  utas2: "Утас 2",
  mail: "Имэйл",
  email: "Имэйл",
  register: "Регистр",
  rd: "Регистр",
  toot: "Тоот",
  toots: "Тоотууд",
  davkhar: "Давхар",
  orts: "Орц",
  bairniiNer: "Барилгын нэр",
  baiguullagiinNer: "Байгууллагын нэр",
  baiguullagiinRegister: "Байгууллагын регистр",
  ekhniiUldegdel: "Эхний үлдэгдэл",
  ehniiUldegdel: "Эхний үлдэгдэл",
  tsahilgaaniiZaalt: "Цахилгаан кВт",
  tailbar: "Тайлбар",
  status: "Төлөв",
  tuluv: "Төлөв",
  tuluw: "Төлөв",
  zardluud: "Зардлууд",
  segmentuud: "Сегментүүд",
  khungulultuud: "Хөнгөлөлтүүд",
  khonogoorBodokhEsekh: "Хоногоор бодох эсэх",
  bodokhKhonog: "Бодох хоног",
  gereeniiDugaar: "Гэрээний дугаар",
  nekhemjlekhiinDugaar: "Нэхэмжлэхийн дугаар",
  dugaar: "Дугаар",
  ognoo: "Огноо",
  ekhlekhOgnoo: "Эхлэх огноо",
  duusakhOgnoo: "Дуусах огноо",
  nuusenOgnoo: "Нүүсэн огноо",
  guilgeeniiDugaar: "Гүйлгээний дугаар",
  tulukhDun: "Төлөх дүн",
  tulsunDun: "Төлсөн дүн",
  niitTulbur: "Нийт нэхэмжилсэн",
  uldegdel: "Үлдэгдэл",
  uld: "Үлдэгдэл",
  globalUldegdel: "Нийт үлдэгдэл",
  khasagdsanEsekh: "Хасагдсан эсэх",
  kholbooBarih: "Холбоо барих",
  torguuli: "Торгууль",
  aldangi: "Алданги",
  shugam: "Шугам",
  ashiglalt: "Ашиглалт",
  turul: "Төрөл",
  kod: "Код",
  khayag: "Хаяг",
  duureg: "Дүүрэг",
  horoo: "Хороо",
  soh: "СӨХ",
  nevtrekhNer: "Нэвтрэх нэр",
  erkh: "Эрх",
  une: "Үнэ",
  khemjee: "Хэмжээ",
  talbai: "Тоот",
  zoriulalt: "Зориулалт",
  dun: "Дүн",
  barimtDugaar: "Баримтын дугаар",
  sar: "Сар",
  jil: "Жил",
  uilchilgee: "Үйлчилгээ",
  mashiniiDugaar: "Машины дугаар",
  danDugaar: "Дансны дугаар",
  dansniiNer: "Дансны нэр",
  bank: "Банк",
  khariutsagch: "Хариуцагч",
  isCompany: "Байгууллага эсэх",
  tulbur: "Төлбөр",
  niitDun: "Нийт дүн",
  medeelel: "Мэдээлэл",
  guilgeenuud: "Гүйлгээнүүд",
  paymentHistory: "Төлөлтийн түүх",
  repliedAt: "Хариулсан огноо",
  repliedBy: "Хариулсан ажилтан",
  walletUserId: "Wallet ID",
  createdAt: "Бүртгэсэн огноо",
  updatedAt: "Шинэчилсэн огноо",
  // Зогсоол / зочин
  tuukh: "Түүх",
  tsagiinTuukh: "Цагийн түүх",
  orsonTsag: "Орсон цаг",
  garsanTsag: "Гарсан цаг",
  orsonKhaalga: "Орсон хаалга",
  garsanKhaalga: "Гарсан хаалга",
  niitKhugatsaa: "Нийт хугацаа (мин)",
  undsenUne: "Үндсэн үнэ",
  urisanMashin: "Урьсан машин",
  urisanMashiniiDugaar: "Урьсан машины дугаар",
  davtamjiinTurul: "Давтамжийн төрөл",
  ezemshigchiinNer: "Эзэмшигчийн нэр",
  ezemshigchiinRegister: "Эзэмшигчийн регистр",
  ezemshigchiinUtas: "Эзэмшигчийн утас",
  khungulult: "Хөнгөлөлт",
  khungulultMinut: "Хөнгөлөлт (мин)",
  tulsunEsekh: "Төлсөн эсэх",
  uneguiMinut: "Үнэгүй минут",
  zochinTurul: "Зочны төрөл",
  mashin: "Машин",
  mashinuud: "Машинууд",
  zogsool: "Зогсоол",
  garsanEsekh: "Гарсан эсэх",
  idevkhtei: "Идэвхтэй",
  idevkhteiEsekh: "Идэвхтэй эсэх",
  units: "Тоотууд",
  gereeniiZagvar: "Гэрээний загвар",
  sariinTulbur: "Сарын төлбөр",
  niitTulukhDun: "Нийт төлөх дүн",
  khariult: "Хариулт",
  khaalga: "Хаалга",
  khaalganuud: "Хаалганууд",
  khaalganiiErkh: "Хаалга нээх эрх",
  ajiltnuud: "Ажилтнууд",
  gishuuniiErkh: "Гишүүний эрх",
  gishuud: "Гишүүд",
  // Банкны гүйлгээ
  kholbosonAjiltniiNer: "Холбосон ажилтан",
  kholbosonDun: "Холбосон дүн",
  oruulsanAjiltniiNer: "Оруулсан ажилтан",
  magadlaltaiGereenuud: "Магадлалтай гэрээнүүд",
  description: "Гүйлгээний утга",
  amount: "Дүн",
  tranAmount: "Гүйлгээний дүн",
  accName: "Дансны нэр",
  accNum: "Дансны дугаар",
  dansniiDugaar: "Дансны дугаар",
  relatedAccount: "Харьцсан данс",
  tranDate: "Гүйлгээний огноо",
  postDate: "Гүйлгээний огноо",
  tranPostedDate: "Гүйлгээний огноо",
  ebarimtAvsanEsekh: "И-баримт авсан эсэх",
  income: "Орлого",
  outcome: "Зарлага",
  balance: "Үлдэгдэл",
  // Гүйлгээ / авлага
  zardliinNer: "Зардлын нэр",
  zardliinTurul: "Зардлын төрөл",
  undsenDun: "Үндсэн дүн",
  tulukhAldangi: "Төлөх алданги",
  tulsunAldangi: "Төлсөн алданги",
  aldangiinTurul: "Алдангийн төрөл",
  nekhemjlekhDeerKharagdakh: "Нэхэмжлэх дээр харагдах",
  nemeltTailbar: "Нэмэлт тайлбар",
  khungulsunDun: "Хөнгөлсөн дүн",
  khungulultKhuvi: "Хөнгөлөлтийн хувь",
  khungulultKhonog: "Хөнгөлөлтийн хоног",
  ekhniiUldegdelEsekh: "Эхний үлдэгдэл эсэх",
  nuatBodokhEsekh: "НӨАТ бодох эсэх",
  khonogTootsokhEsekh: "Хоног тооцох эсэх",
  tulsunDans: "Төлсөн данс",
  khelber: "Хэлбэр",
  source: "Эх сурвалж",
  guilgeeKhiisenAjiltniiNer: "Гүйлгээ хийсэн ажилтан",
  avlagaGuilgeeIndex: "Дараалал",
  nuutsUg: "Нууц үг",
  password: "Нууц үг",
  nuutsKod: "Нууц код",
  pinKod: "ПИН код",
  hasCustomName: "Өөрчилсөн нэртэй эсэх",
  customName: "Өөрчилсөн нэр",
  taniltsuulgaKharakhEsekh: "Танилцуулга харах эсэх",
  tanilsuulgaKharakhEsekh: "Танилцуулга харах эсэх",
  garchig: "Гарчиг",
  aguulga: "Агуулга",
};

/**
 * Засварын жагсаалтад харуулахгүй талбарууд (жижиг үсгээр): техникийн, мөн
 * «харсан/уншсан» мэт нээхэд автоматаар солигддог төлөв — хүний засвар биш.
 */
const NUUKH_TALBAR = new Set([
  "createdat", "updatedat", "__v", "_id",
  "kharsanesekh", "unshsanesekh", "kharsan", "unshsan", "kharsanognoo", "unshsanognoo",
  "kharsanajiltnuud", "unshsanajiltnuud", "isread", "readat", "seen", "seenat",
]);

/** Устгасан агшин зурагт харуулахгүй талбарууд */
export const USTGASAN_NUUKH_TALBAR = new Set([
  "_id",
  "__v",
  "baiguullagiinId",
  "barilgiinId",
  "nuutsUg",
  "password",
  "taniltsuulgaKharakhEsekh",
  "tanilsuulgaKharakhEsekh",
]);

const suuliinKheseg = (talbar: string) => {
  const parts = talbar.split(".").filter((p) => !/^\d+$/.test(p));
  return parts[parts.length - 1] || talbar;
};

export function nuukhTalbarEsekh(talbar: string): boolean {
  return NUUKH_TALBAR.has(suuliinKheseg(talbar).toLowerCase());
}

/** camelCase → «Niit khugatsaa» (толь бичигт байхгүй үед ядаж уншигдахуйц) */
const camelUgNer = (t: string) => {
  const ug = t.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_.]+/g, " ").trim().toLowerCase();
  return ug.charAt(0).toUpperCase() + ug.slice(1);
};

export function talbariinNer(talbar: string, talbarNer?: string | null): string {
  const suul = suuliinKheseg(talbar);
  const toli = TALBARIIN_NER[talbar] || TALBARIIN_NER[suul];
  if (toli) return toli;
  // Backend-ийн talbarNer нь ихэвчлэн «Niit Khugatsaa» гэх мэт латин — зөвхөн
  // кирилл агуулсан бол ашиглана
  const tsever = (talbarNer || "").trim();
  if (tsever && /[А-Яа-яӨөҮүЁё]/.test(tsever)) return tsever;
  return camelUgNer(suul);
}

/** Объектын ID талбар (харуулах шаардлагагүй): baiguullagiinId, zogsooliinId… */
const idTalbarEsekh = (k: string, v: unknown) =>
  /(^id$|Id$|^_)/.test(k) && (typeof v !== "object" || v === null);

export interface DedUurchlult {
  zam: string;
  label: string;
  umnukh: string | null;
  shine: string | null;
  /** Жагсаалтын аль мөрийнх вэ (Орон сууц · 103 · 1-р орц) */
  kontekst?: string;
}

/** Mongo-гийн {$oid}, {$date}, {$numberDecimal} мэт боодлыг энгийн утга болгоно */
function mongoUtga(v: unknown): unknown {
  if (!v || typeof v !== "object" || Array.isArray(v)) return v;
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length !== 1 || !keys[0].startsWith("$")) return v;
  const x = (v as Record<string, unknown>)[keys[0]];
  if (x && typeof x === "object" && "$numberLong" in (x as Record<string, unknown>)) {
    return (x as Record<string, unknown>).$numberLong;
  }
  return x;
}

/**
 * Хоёр харуулах утга ижил эсэх. Хоосон ↔ 0 ↔ «Үгүй» нь систем анхны утга
 * тавьсан төдий (хүн хоосон утгад 0 гэж бичдэггүй) тул өөрчлөлт биш.
 */
function adilUtga(a: string | null, b: string | null): boolean {
  const khevjuul = (u: string | null) =>
    u === null || /^-?0+(\.0+)?$/.test(u.trim()) || u === "Үгүй" ? null : u;
  return khevjuul(a) === khevjuul(b);
}

/** Объект/массивыг «a.b.0.c» зам → энгийн утга болгон задлана */
function khavtgailakh(v: unknown, zam = "", out: Record<string, unknown> = {}, gun = 0) {
  v = mongoUtga(v);
  if (gun > 6) {
    out[zam] = v;
    return out;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) out[zam] = null;
    else if (v.every((x) => typeof x !== "object" || x === null)) out[zam] = v;
    else v.forEach((x, i) => khavtgailakh(x, zam ? `${zam}.${i}` : String(i), out, gun + 1));
    return out;
  }
  if (v && typeof v === "object" && !(v instanceof Date)) {
    Object.entries(v as Record<string, unknown>).forEach(([k, val]) => {
      if (NUUKH_TALBAR.has(k.toLowerCase()) || idTalbarEsekh(k, val)) return;
      khavtgailakh(val, zam ? `${zam}.${k}` : k, out, gun + 1);
    });
    return out;
  }
  out[zam] = v;
  return out;
}

/** «tsagiinTuukh.0.orsonTsag» → «Цагийн түүх 1 · Орсон цаг» */
const zamiinNer = (zam: string) =>
  zam
    .split(".")
    .map((p) => (/^\d+$/.test(p) ? String(Number(p) + 1) : talbariinNer(p)))
    .join(" · ")
    .replace(/ · (\d+) · /g, " $1 · ");

/** Объект/массив утгыг «шошго: утга» мөрүүд болгоно (энгийн утга бол null) */
export function objectMurnuud(raw: unknown): { label: string; utga: string }[] | null {
  const v = jsonZadlakh(raw);
  if (v === null || typeof v !== "object" || v instanceof Date) return null;
  if (Array.isArray(v) && v.every((x) => typeof x !== "object" || x === null)) return null;
  return Object.entries(khavtgailakh(v))
    .map(([zam, u]) => ({ label: zamiinNer(zam) || "Утга", utga: utgaFormat(u) }))
    .filter((m): m is { label: string; utga: string } => m.utga !== null);
}

/**
 * Хоёр утгын аль нэг нь объект/массив бол зөвхөн өөрчлөгдсөн дэд талбаруудыг
 * буцаана. Энгийн утга бол `null` (энгийн өмнө → одоо харуулна).
 */
export function dedUurchlultuud(umnukhRaw: unknown, shineRaw: unknown): DedUurchlult[] | null {
  const umnukh = jsonZadlakh(umnukhRaw);
  const shine = jsonZadlakh(shineRaw);
  const obj = (v: unknown) => v !== null && typeof v === "object" && !(v instanceof Date);
  if (!obj(umnukh) && !obj(shine)) return null;
  const a = obj(umnukh) ? khavtgailakh(umnukh) : {};
  const b = obj(shine) ? khavtgailakh(shine) : {};
  const zamuud = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  return zamuud
    .map((zam) => ({
      zam,
      label: zamiinNer(zam) || "Утга",
      umnukh: utgaFormat(a[zam]),
      shine: utgaFormat(b[zam]),
    }))
    .filter((d) => !adilUtga(d.umnukh, d.shine));
}

/* -------------------------- массивын өөрчлөлт -------------------------- */

export interface MassiviinUurchlult {
  /** Шинээр нэмэгдсэн мөрүүдийн товч тайлбар */
  nemsen: string[];
  /** Хасагдсан мөрүүдийн товч тайлбар */
  khassan: string[];
  /** Хэвээр үлдсэн мөрүүдийн өөрчлөгдсөн талбарууд */
  uurchlugdsun: DedUurchlult[];
}

/** Мөр бүрийг хүнд ойлгомжтой нэг мөр болгох (Орон сууц 201 · 2-р орц · 2 давхар) */
/** «Тоот» бол «Орон сууц»-ын хуучин нэр — нэг утга гэж үзнэ */
const tootTurul = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s === "Тоот" ? "Орон сууц" : s;
};

function murTovch(m: Record<string, unknown>): string {
  const u = (k: string) => utgaFormat(m[k]);
  const khesguud = [
    tootTurul(m.turul) || null,
    u("toot") || u("dugaar") || u("mashiniiDugaar") || u("ner"),
    u("orts") ? `${u("orts")}-р орц` : null,
    u("davkhar") ? `${u("davkhar")} давхар` : null,
    Number(m.ekhniiUldegdel) ? `эхний үлдэгдэл ${u("ekhniiUldegdel")}` : null,
  ].filter(Boolean);
  return khesguud.length ? khesguud.join(" · ") : "Мөр";
}

/** Мөрийг таних түлхүүр — дарааллаас биш, утгаар нь тааруулна */
function murTulkhuur(m: Record<string, unknown>, i: number): string {
  const id = [tootTurul(m.turul), m.toot ?? m.dugaar ?? m.mashiniiDugaar ?? m.ner, m.barilgiinId]
    .map((x) => (x == null ? "" : String(x).trim()))
    .join("|");
  return id.replace(/\|/g, "") ? id : `#${i}`;
}

/** Хадгалахад автоматаар цэвэрлэгддэг/дүүргэгддэг талбарууд — өөрчлөлт биш */
const AUTO_TALBAR = new Set([
  "duureg", "horoo", "horoo.ner", "horoo.kod", "bairniiNer", "soh", "sohNer",
  "source", "sukhBairshil",
]);

/**
 * Объектын массив (Тоотууд г.м.) бол мөрүүдийг утгаар нь тааруулж зөвхөн
 * нэмэгдсэн / хасагдсан / өөрчлөгдсөн хэсгийг буцаана. Массив биш бол null.
 */
export function massiviinUurchlult(umnukhRaw: unknown, shineRaw: unknown): MassiviinUurchlult | null {
  const a = jsonZadlakh(umnukhRaw);
  const b = jsonZadlakh(shineRaw);
  if ((a != null && !Array.isArray(a)) || (b != null && !Array.isArray(b))) return null;
  if (!Array.isArray(a) && !Array.isArray(b)) return null;
  const objMassiv = (v: unknown) =>
    Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object");

  // Энгийн утгын массив (шошго г.м.): зөвхөн нэмсэн / хассан утгууд
  if (!(objMassiv(a) || objMassiv(b))) {
    const tekst = (v: unknown) =>
      ((v as unknown[]) || []).map((x) => utgaFormat(x)).filter((x): x is string => x !== null);
    const ta = tekst(a);
    const tb = tekst(b);
    const ugA = new Set(ta);
    const ugB = new Set(tb);
    return {
      nemsen: tb.filter((x) => !ugA.has(x)),
      khassan: ta.filter((x) => !ugB.has(x)),
      uurchlugdsun: [],
    };
  }

  const murA = ((a as Record<string, unknown>[]) || []).filter((x) => x && typeof x === "object");
  const murB = ((b as Record<string, unknown>[]) || []).filter((x) => x && typeof x === "object");

  const nemsen: string[] = [];
  const khassan: string[] = [];
  const uurchlugdsun: DedUurchlult[] = [];
  const khosuud: [Record<string, unknown>, Record<string, unknown>][] = [];

  // 1) _id-аар, 2) утгын түлхүүрээр тааруулна
  const usedB = new Set<number>();
  const uldsenA: Record<string, unknown>[] = [];
  const idStr = (m: Record<string, unknown>) => (m._id == null ? "" : String(mongoUtga(m._id)));
  const tulkhuurB = murB.map((m, i) => murTulkhuur(m, i));
  murA.forEach((m, i) => {
    let j = idStr(m) ? murB.findIndex((x, k) => !usedB.has(k) && idStr(x) === idStr(m)) : -1;
    if (j < 0) {
      const t = murTulkhuur(m, i);
      j = tulkhuurB.findIndex((x, k) => !usedB.has(k) && x === t);
    }
    if (j < 0) uldsenA.push(m);
    else {
      usedB.add(j);
      khosuud.push([m, murB[j]]);
    }
  });
  const uldsenB = murB.filter((_, k) => !usedB.has(k));

  // 3) Үлдсэнийг дарааллаар хослуулна — талбаруудын ихэнх нь ижил бол
  //    «засварласан мөр» (зөвхөн ялгааг), эс бөгөөс нэмсэн/хассан
  const talbarToo = (m: Record<string, unknown>) => Object.keys(khavtgailakh(m)).length || 1;
  uldsenA.forEach((m) => {
    const s2 = uldsenB[0];
    if (s2) {
      const ded = dedUurchlultuud(m, s2) || [];
      if (ded.length <= Math.max(talbarToo(m), talbarToo(s2)) / 2) {
        uldsenB.shift();
        khosuud.push([m, s2]);
        return;
      }
    }
    khassan.push(murTovch(m));
  });
  uldsenB.forEach((m) => nemsen.push(murTovch(m)));

  khosuud.forEach(([m, s2]) => {
    (dedUurchlultuud(m, s2) || [])
      // Автомат талбар хоосорсон бол засвар биш
      .filter((d) => !(AUTO_TALBAR.has(d.zam) && d.shine === null))
      // «Тоот» ↔ «Орон сууц» — нэр солигдсон төдий, засвар биш
      .filter((d) => !(d.zam === "turul" && tootTurul(d.umnukh) === tootTurul(d.shine)))
      .forEach((d) => {
        // Танигдах талбаргүй мөр бол «Мөр» гэж бичихгүй
        const tovch = murTovch(s2);
        uurchlugdsun.push({ ...d, kontekst: tovch === "Мөр" ? undefined : tovch });
      });
  });
  return { nemsen, khassan, uurchlugdsun };
}

/* ------------------------------- утгууд ------------------------------- */

const ISO_OGNOO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function jsonZadlakh(raw: unknown): unknown {
  const v = mongoUtga(raw);
  if (typeof v !== "string") return v;
  const s = v.trim();
  // Backend зарим утгыг JSON мөр болгож хадгалдаг: "\"2026-09-24T07:08:10Z\""
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    try {
      return JSON.parse(s);
    } catch {
      return s.slice(1, -1);
    }
  }
  if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
    try {
      return JSON.parse(s);
    } catch {
      return v;
    }
  }
  return v;
}

/** Объектыг JSON биш «Шошго: утга» мөрүүд болгоно */
function objectTovch(obj: Record<string, unknown>, tusgaarlagch = "\n"): string | null {
  const murnuud = Object.entries(khavtgailakh(obj))
    .map(([zam, u]) => {
      const t = utgaFormat(u);
      return t === null ? null : `${zamiinNer(zam) || "Утга"}: ${t}`;
    })
    .filter(Boolean);
  return murnuud.length ? murnuud.join(tusgaarlagch) : null;
}

/** Массивын нэг мөрийг товч тайлбар болгоно (Тоот 201 · 2-р орц …) */
function elementTovch(x: unknown): string | null {
  const v = mongoUtga(x);
  if (!v || typeof v !== "object") return utgaFormat(v);
  if (Array.isArray(v)) return utgaFormat(v);
  const tovch = murTovch(v as Record<string, unknown>);
  return tovch !== "Мөр" ? tovch : objectTovch(v as Record<string, unknown>, " · ");
}

const khoosonEsekh = (v: unknown) =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && (v.trim() === "" || v === "null" || v === "undefined"));

/** Англи төлөв/төрлийн түлхүүр үгс → монгол */
const UTGA_NER: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  done: "Шийдэгдсэн",
  rejected: "Татгалзсан",
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  cancelled: "Цуцалсан",
  canceled: "Цуцалсан",
  paid: "Төлсөн",
  unpaid: "Төлөөгүй",
  partiallypaid: "Хэсэгчлэн төлсөн",
  overdue: "Хугацаа хэтэрсэн",
  approved: "Батлагдсан",
  draft: "Ноорог",
  sent: "Илгээсэн",
  failed: "Амжилтгүй",
  success: "Амжилттай",
  sanal: "Санал",
  gomdol: "Гомдол",
  income: "Орлого",
  expense: "Зарлага",
};

/** 24 оронтой MongoDB ID */
export const objectIdEsekh = (v: unknown) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v.trim());

/**
 * Утгыг харуулах мөр болгоно. `null` бол «хоосон».
 * ISO огноо → YYYY-MM-DD HH:mm, массив/объект → «Шошго: утга» мөрүүд (JSON биш).
 */
export function utgaFormat(raw: unknown): string | null {
  const v = jsonZadlakh(raw);
  if (khoosonEsekh(v)) return null;
  if (typeof v === "boolean") return v ? "Тийм" : "Үгүй";
  if (v === "true") return "Тийм";
  if (v === "false") return "Үгүй";
  if (typeof v === "string" && UTGA_NER[v.trim().toLowerCase()]) return UTGA_NER[v.trim().toLowerCase()];
  if (v instanceof Date) return dayjs(v).format("YYYY-MM-DD HH:mm");
  if (typeof v === "string" && ISO_OGNOO.test(v)) {
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : v;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (v.every((x) => typeof x !== "object" || x === null)) {
      return v.map((x) => utgaFormat(x) ?? "-").join(", ");
    }
    const murnuud = v.map(elementTovch).filter((t): t is string => t !== null);
    if (murnuud.length === 0) return null;
    return murnuud.length === 1 ? murnuud[0] : murnuud.map((t, i) => `${i + 1}. ${t}`).join("\n");
  }
  if (v && typeof v === "object") {
    return objectTovch(v as Record<string, unknown>);
  }
  return String(v);
}

/* ----------------------------- хэвийн болгох ----------------------------- */

type AnyRec = Record<string, any>;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const ognooStr = (v: unknown): string | null => {
  if (!v) return null;
  const d = dayjs(v as string);
  return d.isValid() ? d.toISOString() : null;
};

/** Устгасан агшин зургаас хүнд ойлгомжтой нэр гаргана */
function nerDataaas(d: AnyRec | null | undefined): string {
  if (!d || typeof d !== "object") return "";
  const ner = d.ner;
  if (ner && typeof ner === "object") {
    const n = `${str(ner.ovog || ner.over)} ${str(ner.ner)}`.trim();
    if (n) return n;
  }
  const ovogNer = `${str(d.ovog)} ${typeof ner === "string" ? ner.trim() : ""}`.trim();
  return (
    ovogNer ||
    str(d.name) ||
    str(d.gereeniiDugaar) ||
    str(d.toot) ||
    str(d.mashiniiDugaar) ||
    str(d.dugaar)
  );
}

/** Нэр хадгалаагүй хуучин засварт өөрчлөлтийн утгуудаас нэр/дугаар хайна */
function nerUurchlultaas(r: AnyRec): string {
  const raw: AnyRec[] = Array.isArray(r.uurchlult) ? r.uurchlult : [];
  const TULKHUUR = ["mashiniiDugaar", "urisanMashiniiDugaar", "ner", "garchig", "title", "gereeniiDugaar", "toot", "dugaar"];
  for (const t of TULKHUUR) {
    const c = raw.find((x) => str(x.talbar) === t);
    const v = c ? str(c.shineUtga || c.umnukhUtga) : "";
    if (v) return v;
  }
  for (const c of raw) {
    for (const v of [c.shineUtga, c.umnukhUtga]) {
      const o = jsonZadlakh(v);
      if (o && typeof o === "object" && !Array.isArray(o)) {
        const rec = o as AnyRec;
        for (const t of TULKHUUR) if (str(rec[t])) return str(rec[t]);
      }
    }
  }
  return "";
}

/** Харилцагчийн тоотуудын жагсаалт ба түүний «гол тоот» хуулбар талбарууд */
const TOOT_JAGSAALT = new Set(["toots", "units"]);
const TOOT_KHUULBAR = new Set(["toot", "davkhar", "orts", "bairniiNer", "talbai"]);

/** «…Id», «…Ids», «…Idnuud» нэртэй талбар */
const idNerTalbarEsekh = (talbar: string) =>
  /(^id$|Id$|Ids$|Idnuud$|ID$)/.test(suuliinKheseg(talbar));

/** Хоёр утга хоёулаа хоосон эсвэл зөвхөн ObjectId(-ууд) бол */
function zuvkhunIdEsekh(a: unknown, b: unknown): boolean {
  const idOnly = (v: unknown) => {
    const u = utgaFormat(v);
    return u === null || u.split(/[,\n]\s*/).every((x) => objectIdEsekh(x.replace(/^\d+\.\s*/, "")));
  };
  return idOnly(a) && idOnly(b);
}

function uurchlultuudAvya(r: AnyRec): { jagsaalt: AuditUurchlult[]; niit: number } {
  const raw: AnyRec[] = Array.isArray(r.uurchlult)
    ? r.uurchlult
    : Array.isArray(r.changes)
      ? r.changes
      : [];
  // Тоотуудын жагсаалт өөрчлөгдсөн бол харилцагчийн toot/davkhar/orts нь
  // зөвхөн «сүүлийн тоот»-ын хуулбар — «Гараж 11 → 106» мэт буруу ойлгогдоно
  const tootJagsaaltTai = raw.some((c) => TOOT_JAGSAALT.has(str(c.talbar || c.field)));
  const jagsaalt = raw
    .filter((c) => !(tootJagsaaltTai && TOOT_KHUULBAR.has(str(c.talbar || c.field))))
    .map((c) => {
      const talbar = str(c.talbar || c.field) || "-";
      return {
        talbar,
        label: talbariinNer(talbar, c.talbarNer),
        umnukh: c.umnukhUtga ?? c.oldValue,
        shine: c.shineUtga ?? c.newValue,
      };
    })
    .filter((c) => !nuukhTalbarEsekh(c.talbar))
    // Зөвхөн ID хадгалдаг талбар (kholbosonGereeniiId г.м.) — хүнд утгагүй,
    // харгалзах нэрийн талбар нь (kholbosonAjiltniiNer) тусдаа харагдана
    .filter((c) => !idNerTalbarEsekh(c.talbar) && !zuvkhunIdEsekh(c.umnukh, c.shine))
    // Объект/жагсаалтыг товч тайлбараар биш, талбар бүрээр нь харьцуулна
    .filter((c) => {
      const ded = dedUurchlultuud(c.umnukh, c.shine);
      if (ded !== null) return ded.length > 0;
      return !adilUtga(utgaFormat(c.umnukh), utgaFormat(c.shine));
    })
    // Объектын зөвхөн ID/огноо/дараалал өөрчлөгдсөн бол утгагүй. Мөн бүхэлдээ
    // нэмэгдсэн/хасагдсан том объект (Түүх, Урьсан машин г.м.) нь засвар биш
    // бүтцийн агшин зураг — зөвхөн утга нь зассан мөрүүдийг үлдээнэ.
    .filter((c) => {
      // Жагсаалт: нэмсэн/хассан/өөрчилсөн юу ч үлдээгүй бол харуулахгүй
      const massiv = massiviinUurchlult(c.umnukh, c.shine);
      if (massiv && massiv.nemsen.length + massiv.khassan.length + massiv.uurchlugdsun.length === 0)
        return false;
      const ded = dedUurchlultuud(c.umnukh, c.shine);
      if (ded === null) return true;
      if (ded.length === 0) return false;
      return utgaFormat(c.umnukh) !== null && utgaFormat(c.shine) !== null;
    })
    // Гол талбарууд эхэнд, бусад нь нэрээр
    .sort((x, y) => {
      const d = golTalbarEremb(x.talbar) - golTalbarEremb(y.talbar);
      return d !== 0 ? d : x.label.localeCompare(y.label, "mn");
    })
    // Нууц үг: hash-ийг харуулахгүй, зөвхөн «солигдсон» гэж
    .map((c) =>
      NUUTS_TALBAR.has(suuliinKheseg(c.talbar))
        ? { ...c, umnukh: "••••••", shine: "Солигдсон" }
        : c,
    );
  return { jagsaalt, niit: raw.length };
}

/** Гол талбарууд — жагсаалтад эхэнд, энэ дарааллаар */
export const GOL_TALBAR = [
  "ner", "ovog", "utas", "mail", "register", "toot", "davkhar", "orts",
  "mashiniiDugaar", "gereeniiDugaar", "nekhemjlekhiinDugaar", "dugaar",
  "turul", "tuluv", "dun", "tulukhDun", "tulsunDun", "uldegdel", "ognoo", "tailbar",
];

const golTalbarEremb = (talbar: string) => {
  const i = GOL_TALBAR.indexOf(suuliinKheseg(talbar));
  return i < 0 ? 999 : i;
};

/**
 * Мөрийг хайхад ашиглах текст — хүснэгтийн БҮХ баганын утга: огноо, төрөл,
 * нэр/дугаар, ажилтан, үйлдлийн огноо, шалтгаан, өөрчлөгдсөн талбар/утгууд.
 */
export function murKhailtTekst(m: AuditMur, turulNer = ""): string {
  const khesguud = [
    ognooKharuulakh(m.bichlegiinOgnoo),
    turulNer || m.turul,
    m.ner,
    m.dugaar,
    m.ajiltniiNer,
    ognooKharuulakh(m.uildelOgnoo, true),
    m.shaltgaan,
  ];
  m.uurchlultuud.forEach((c) => {
    khesguud.push(c.label, utgaFormat(c.umnukh) || "", utgaFormat(c.shine) || "");
  });
  return khesguud.join(" ").toLowerCase();
}

const jsonUnshikh = (v: unknown): unknown => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

/** Барилгуудын ялгаа зөвхөн tokhirgoo дотор байгаа эсэх */
function barilguudTokhirgooOnlyEsekh(umnukh: unknown, shine: unknown): boolean {
  const a = jsonUnshikh(umnukh);
  const b = jsonUnshikh(shine);
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const tsever = (x: any) => {
    if (!x || typeof x !== "object") return JSON.stringify(x);
    const { tokhirgoo: _t, updatedAt: _u, ...busad } = x;
    return JSON.stringify(busad);
  };
  return a.every((x, i) => tsever(x) === tsever(b[i]));
}

/** Байгууллагын засвар зөвхөн тохиргоо өөрчилсөн бол «Тохиргоо» төрөлд оруулна */
function tokhirgooZasvarEsekh(turul: string, uurchlultuud: AuditUurchlult[]): boolean {
  if (turul !== "baiguullaga" || uurchlultuud.length === 0) return false;
  return uurchlultuud.every(
    (c) =>
      c.talbar === "tokhirgoo" ||
      c.talbar.startsWith("tokhirgoo.") ||
      /^barilguud\.\d+\.tokhirgoo(\.|$)/.test(c.talbar) ||
      (c.talbar === "barilguud" && barilguudTokhirgooOnlyEsekh(c.umnukh, c.shine)),
  );
}

export function murKhevjuulekh(r: AnyRec): AuditMur {
  const deletedData =
    (r.deletedData || r.deletedDocument || null) as Record<string, unknown> | null;
  const { jagsaalt, niit } = uurchlultuudAvya(r);
  const dugaar = str(r.classDugaar);
  const turul = str(r.classType || r.modelName || r.className);
  const ner =
    TOKHIRGOO_MODEL_NER[turul] ||
    str(r.classNer) ||
    nerDataaas(deletedData) ||
    nerUurchlultaas(r);
  return {
    _id: str(r._id),
    turul: tokhirgooZasvarEsekh(turul, jagsaalt) ? "tokhirgoo" : turul,
    ner,
    dugaar,
    bichlegiinOgnoo: ognooStr(
      r.classOgnoo || r.documentCreatedAt || (deletedData as AnyRec | null)?.createdAt,
    ),
    ajiltniiId: str(r.ajiltniiId || r.ajiltanId || r.ajiltan?._id),
    ajiltniiNer: str(r.ajiltniiNer || r.ajiltan?.ner) || "Систем",
    uildelOgnoo: ognooStr(r.createdAt || r.ognoo),
    uurchlultuud: jagsaalt,
    niitUurchlult: niit,
    shaltgaan: str(r.reason || r.shaltgaan),
    deletedData,
    // Анхдагч: model-ийн нэрээр (Устгасан түүх). Зассан түүх нь
    // angilalaarSalgakh-аар өөрчлөлтийн төрлөөр дахин ангилна.
    angilal: `model:${turul}`,
    angilalNer: auditTurulNer(turul),
  };
}

export const ognooKharuulakh = (iso: string | null, tsagtai = false) =>
  iso ? dayjs(iso).format(tsagtai ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD") : "-";
