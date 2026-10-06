import dayjs from "dayjs";

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
}

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
  garchig: "Гарчиг",
  aguulga: "Агуулга",
};

/** Засварын жагсаалтад харуулахгүй техникийн талбарууд (жижиг үсгээр) */
const NUUKH_TALBAR = new Set(["createdat", "updatedat", "__v", "_id"]);

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
}

/** Объект/массивыг «a.b.0.c» зам → энгийн утга болгон задлана */
function khavtgailakh(v: unknown, zam = "", out: Record<string, unknown> = {}, gun = 0) {
  if (gun > 4) {
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
    .filter((d) => d.umnukh !== d.shine);
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
function murTovch(m: Record<string, unknown>): string {
  const u = (k: string) => utgaFormat(m[k]);
  const khesguud = [
    u("turul"),
    u("toot") || u("dugaar") || u("mashiniiDugaar") || u("ner"),
    u("orts") ? `${u("orts")}-р орц` : null,
    u("davkhar") ? `${u("davkhar")} давхар` : null,
    Number(m.ekhniiUldegdel) ? `эхний үлдэгдэл ${u("ekhniiUldegdel")}` : null,
  ].filter(Boolean);
  return khesguud.length ? khesguud.join(" · ") : "Мөр";
}

/** Мөрийг таних түлхүүр — дарааллаас биш, утгаар нь тааруулна */
function murTulkhuur(m: Record<string, unknown>, i: number): string {
  const id = [m.turul, m.toot ?? m.dugaar ?? m.mashiniiDugaar ?? m.ner, m.barilgiinId]
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
  const objMassiv = (v: unknown) =>
    Array.isArray(v) && v.length > 0 && v.every((x) => x && typeof x === "object");
  if (!(objMassiv(a) || objMassiv(b))) return null;
  if ((a != null && !Array.isArray(a)) || (b != null && !Array.isArray(b))) return null;

  const umnukh = new Map<string, Record<string, unknown>>();
  ((a as Record<string, unknown>[]) || []).forEach((m, i) => umnukh.set(murTulkhuur(m, i), m));
  const shine = new Map<string, Record<string, unknown>>();
  ((b as Record<string, unknown>[]) || []).forEach((m, i) => shine.set(murTulkhuur(m, i), m));

  const nemsen: string[] = [];
  const khassan: string[] = [];
  const uurchlugdsun: DedUurchlult[] = [];
  shine.forEach((m, k) => {
    if (!umnukh.has(k)) nemsen.push(murTovch(m));
  });
  umnukh.forEach((m, k) => {
    const s2 = shine.get(k);
    if (!s2) {
      khassan.push(murTovch(m));
      return;
    }
    const ded = dedUurchlultuud(m, s2) || [];
    ded
      // Автомат талбар хоосорсон бол засвар биш
      .filter((d) => !(AUTO_TALBAR.has(d.zam) && d.shine === null))
      .forEach((d) => uurchlugdsun.push({ ...d, label: `${murTovch(s2)} · ${d.label}` }));
  });
  return { nemsen, khassan, uurchlugdsun };
}

/* ------------------------------- утгууд ------------------------------- */

const ISO_OGNOO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function jsonZadlakh(v: unknown): unknown {
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

/** JSON харуулахдаа техникийн талбаруудыг хасна */
function tseverlekh(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(tseverlekh);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(v as Record<string, unknown>).forEach(([k, val]) => {
      if (NUUKH_TALBAR.has(k.toLowerCase())) return;
      out[k] = tseverlekh(val);
    });
    return out;
  }
  return v;
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
 * ISO огноо → YYYY-MM-DD HH:mm, массив/объект → нягт JSON.
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
    return v.map((x) => JSON.stringify(tseverlekh(x))).join("\n");
  }
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (Object.keys(obj).length === 0) return null;
    return JSON.stringify(tseverlekh(obj));
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

function uurchlultuudAvya(r: AnyRec): { jagsaalt: AuditUurchlult[]; niit: number } {
  const raw: AnyRec[] = Array.isArray(r.uurchlult)
    ? r.uurchlult
    : Array.isArray(r.changes)
      ? r.changes
      : [];
  const jagsaalt = raw
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
    .filter((c) => utgaFormat(c.umnukh) !== utgaFormat(c.shine))
    // Объектын зөвхөн ID/огноо/дараалал өөрчлөгдсөн бол утгагүй. Мөн бүхэлдээ
    // нэмэгдсэн/хасагдсан том объект (Түүх, Урьсан машин г.м.) нь засвар биш
    // бүтцийн агшин зураг — зөвхөн утга нь зассан мөрүүдийг үлдээнэ.
    .filter((c) => {
      const ded = dedUurchlultuud(c.umnukh, c.shine);
      if (ded === null) return true;
      if (ded.length === 0) return false;
      return utgaFormat(c.umnukh) !== null && utgaFormat(c.shine) !== null;
    });
  return { jagsaalt, niit: raw.length };
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
  const ner = str(r.classNer) || nerDataaas(deletedData) || nerUurchlultaas(r);
  const turul = str(r.classType || r.modelName || r.className);
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
  };
}

export const ognooKharuulakh = (iso: string | null, tsagtai = false) =>
  iso ? dayjs(iso).format(tsagtai ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD") : "-";
