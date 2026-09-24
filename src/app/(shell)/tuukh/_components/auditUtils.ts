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

export function talbariinNer(talbar: string, talbarNer?: string | null): string {
  const tsever = (talbarNer || "").trim();
  // Backend заримдаа talbarNer-т техникийн нэрийг л давтаж өгдөг
  if (tsever && tsever !== talbar && tsever.toUpperCase() !== tsever) return tsever;
  const suul = suuliinKheseg(talbar);
  return TALBARIIN_NER[talbar] || TALBARIIN_NER[suul] || tsever || talbar;
}

/* ------------------------------- утгууд ------------------------------- */

const ISO_OGNOO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function jsonZadlakh(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
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
    .filter((c) => utgaFormat(c.umnukh) !== utgaFormat(c.shine));
  return { jagsaalt, niit: raw.length };
}

export function murKhevjuulekh(r: AnyRec): AuditMur {
  const deletedData =
    (r.deletedData || r.deletedDocument || null) as Record<string, unknown> | null;
  const { jagsaalt, niit } = uurchlultuudAvya(r);
  const dugaar = str(r.classDugaar);
  const ner = str(r.classNer) || nerDataaas(deletedData);
  return {
    _id: str(r._id),
    turul: str(r.classType || r.modelName || r.className),
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
