"use client";

import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";

/**
 * «Зассан / Устгасан түүх»-ийн ангилал.
 *
 * Backend-ийн глобал аудит plugin (sukhBackv2/utils/auditPlugin.js) БҮХ
 * model-ийн засвар/устгалыг бүртгэдэг болсон тул ангиллыг урьдчилан бичсэн
 * жагсаалтаар биш, `/audit/turluud`-ээс бодит өгөгдлөөр гаргана. Энд зөвхөн
 * model-ийн нэрийг монгол нэр болгоно — мэдэгдэхгүй нэр гарвал өөрийгөө
 * харуулна.
 */
export const AUDIT_ANGILAL_NER: Record<string, string> = {
  // Нэрс нь хажуугийн цэсний (lib/permissions.ts) нэртэй ижил — хэрэглэгч
  // тухайн өгөгдлийг аль цэснээс засдгаар нь танина.
  // Гэрээ
  orshinSuugch: "Оршин суугч",
  geree: "Гэрээ",
  gereeniiZaalt: "Гэрээ",
  khariltsagch: "Харилцагч",
  tootBurtgel: "Тоот бүртгэл",
  talbai: "Тоот бүртгэл",
  ajiltan: "Ажилтан",
  // Төлбөр
  nekhemjlekh: "Нэхэмжлэх",
  nekhemjlekhiinTuukh: "Нэхэмжлэх",
  nekhemjlekhCron: "Нэхэмжлэх",
  khungulult: "Хөнгөлөлт",
  khungulultiinTuukh: "Хөнгөлөлт",
  guilgee: "Гүйлгээний түүх",
  guilgeeAvlaguud: "Гүйлгээний түүх",
  zaaltUnshlalt: "Гүйлгээний түүх",
  bankniiGuilgee: "Дансны хуулга",
  ebarimt: "И-баримт",
  ebarimtShine: "И-баримт",
  easyRegisterUser: "И-баримт",
  // Мэдэгдэл
  medegdel: "Мэдэгдэл",
  sonorduulga: "Мэдэгдэл",
  sanalAsuulga: "Санал асуулга",
  sanalAsuulgiinKhariult: "Санал асуулга",
  // Зогсоол
  uilchluulegch: "Зогсоол · Жагсаалт",
  mashin: "Зогсоол · Жагсаалт",
  khariltsagchMashin: "Зогсоол · Жагсаалт",
  uneguiMashin: "Зогсоол · Жагсаалт",
  kassCameraKhaalt: "Зогсоол · Камер касс",
  zogsoolGaraarOrlogo: "Зогсоол · Камер касс",
  udriinKhaalt: "Зогсоол · Камер касс",
  orshinSuugchMashin: "Зогсоол · Оршин суугч",
  zochinZogsooliinTuukh: "Зогсоол · Оршин суугч",
  // Тохиргоо
  tokhirgoo: "Тохиргоо",
  baiguullaga: "Барилгын тохиргоо",
  barilga: "Барилгын тохиргоо",
  liftShalgaya: "Барилгын тохиргоо",
  ashiglaltiinZardluud: "Ашиглалтын зардал",
  uilchilgeeniiZardluud: "Ашиглалтын зардал",
  ashiglaltiinExcel: "Ашиглалтын зардал",
  uilchilgeeniiExcel: "Ашиглалтын зардал",
  dans: "Данс",
  accountNumber: "Данс",
  tatvariinAlba: "И-баримт",
  zogsool: "Зогсоол",
  // Хүснэгтэд «Тохиргоо», шүүлтүүрт ялгахын тулд бүтэн нэрээр
  ezenUrisanMashin: "Зочны тохиргоо",
  nekhemjlekhiinZagvar: "Нэхэмжлэх",
  gereeniiZagvar: "Гэрээ",
  // Цэсэнд байхгүй (апп/дотоод) — уншигдахуйц нэрээр
  blog: "Нийтлэл",
  gerBuliinUrilga: "Гэр бүлийн урилга",
  tseverlegee: "Цэвэрлэгээ",
  license: "Лиценз",
  appVersion: "Апп",
  qpayObject: "QPay",
  walletInvoice: "Wallet нэхэмжлэх",
  walletPayment: "Wallet төлбөр",
  pdfFile: "PDF файл",
  cronSchedule: "Автомат хуваарь",
  backTuukh: "Буцаалтын түүх",
  batalgaajuulahCode: "Баталгаажуулах код",
  zevtabsNevtreltCode: "Нэвтрэх код",
  ipTuukh: "IP түүх",
  khaalgaNeeyeTuukh: "Хаалга нээсэн түүх",
  msgTuukh: "Мессежийн түүх",
  nevtreltiinTuukh: "Нэвтрэлтийн түүх",
  session: "Нэвтрэлтийн сесс",
  ustgakhTuukh: "Устгасан түүх",
  zasakhTuukh: "Зассан түүх",
  zassanBarimt: "Зассан баримт",
  ustsanBarimt: "Устгасан баримт",
  zogsooliinIp: "Зогсоол",
};

export function auditAngilalNer(modelName?: string | null): string {
  if (!modelName) return "-";
  return (
    AUDIT_ANGILAL_NER[modelName] ||
    AUDIT_ANGILAL_NER[modelName.charAt(0).toLowerCase() + modelName.slice(1)] ||
    modelName
  );
}

/**
 * Шүүлтүүрт үргэлж харагдах бүх төрөл — тухайн хугацаанд бичлэггүй ч
 * сонгох боломжтой. «tokhirgoo» нь тусдаа model биш: байгууллагын зөвхөн
 * тохиргооны талбар (tokhirgoo, barilguud[].tokhirgoo) өөрчлөгдсөн засвар.
 */
export const BUKH_AUDIT_TURLUUD = [
  "tokhirgoo",
  "ashiglaltiinZardluud",
  "uilchilgeeniiZardluud",
  "nekhemjlekhCron",
  "liftShalgaya",
  "nekhemjlekhiinZagvar",
  "gereeniiZagvar",
  "gereeniiZaalt",
  "dans",
  "accountNumber",
  "tatvariinAlba",
  "baiguullaga",
  "ajiltan",
  "geree",
  "orshinSuugch",
  "khariltsagch",
  "tootBurtgel",
  "nekhemjlekhiinTuukh",
  "guilgeeAvlaguud",
  "bankniiGuilgee",
  "khungulultiinTuukh",
  "ebarimtShine",
  "ebarimt",
  "zaaltUnshlalt",
  "ashiglaltiinExcel",
  "uilchilgeeniiExcel",
  "udriinKhaalt",
  "zogsool",
  "mashin",
  "orshinSuugchMashin",
  "khariltsagchMashin",
  "uneguiMashin",
  "zochinZogsooliinTuukh",
  "ezenUrisanMashin",
  "uilchluulegch",
  "zogsoolGaraarOrlogo",
  "kassCameraKhaalt",
  "medegdel",
  "sonorduulga",
  "blog",
  "sanalAsuulga",
  "sanalAsuulgiinKhariult",
  "gerBuliinUrilga",
  "tseverlegee",
];

/** Хүснэгт/цонхонд «Тохиргоо» төрөлд харагдах model-ууд → тэдгээрийн нэр */
export const TOKHIRGOO_MODEL_NER: Record<string, string> = {
  ezenUrisanMashin: "Зочны тохиргоо",
};

/** Хүснэгт, цонхны «Төрөл» багана: тохиргооны model-ууд бүгд «Тохиргоо» */
export const auditTurulNer = (modelName?: string | null) =>
  modelName && TOKHIRGOO_MODEL_NER[modelName] ? "Тохиргоо" : auditAngilalNer(modelName);

/**
 * «Зассан түүх»-д харуулахгүй model-ууд: мэдэгдлийг нээх (харсан эсэх),
 * хариулах (тайлбар/төлөв/хариулсан) нь өгөгдлийн засвар биш.
 */
export const ZASSAN_KHASAKH_MODEL = new Set([
  "medegdel",
  "sonorduulga",
  // И-баримт зөвхөн «Устгасан түүх»-д
  "ebarimt",
  "ebarimtShine",
  "easyRegisterUser",
]);

/** Хэрэглэгчийн UI-д байхгүй дотоод төрлүүд — шүүлтүүрт хэзээ ч харуулахгүй */
const DOTOOD_TURLUUD = new Set(["qpayObject", "walletInvoice", "walletPayment"]);

/** Серверт илгээх model-ийн нэр (виртуал төрлийг жинхэнэ model руу) */
export const auditServerModel = (m: string) => (m === "tokhirgoo" ? "baiguullaga" : m);

export interface AuditAngilal {
  value: string;
  label: string;
  too: number;
}

/**
 * Сонгосон хугацаанд байгаа ангилал бүрийн тоо. Ижил цэсний нэртэй
 * model-ууд (ebarimt + ebarimtShine г.м.) нэг сонголт болж, value нь
 * таслалаар нийлсэн model-ийн нэрс байна.
 */
export function useAuditTurluud(
  token: string | null | undefined,
  baiguullagiinId: string | null | undefined,
  turul: "zassan" | "ustgasan",
  ekhlekhOgnoo?: string | null,
  duusakhOgnoo?: string | null,
) {
  const { data, isLoading } = useSWR(
    token && baiguullagiinId
      ? ["/audit/turluud", token, baiguullagiinId, turul, ekhlekhOgnoo || "", duusakhOgnoo || ""]
      : null,
    async ([url, tkn, orgId, t, s, e]) => {
      const resp = await uilchilgee(tkn as string).get(url as string, {
        params: {
          baiguullagiinId: orgId,
          turul: t,
          ...(s ? { ekhlekhOgnoo: `${s} 00:00:00` } : {}),
          ...(e ? { duusakhOgnoo: `${e} 23:59:59` } : {}),
        },
      });
      return (resp.data?.data || []) as { modelName: string; too: number }[];
    },
    { revalidateOnFocus: false },
  );

  // Зөвхөн сонгосон хугацаанд бичлэгтэй, хэрэглэгчид танигдах төрлүүд —
  // бичлэггүй/дотоод төрлийг (QPay, Wallet г.м.) шүүлтүүрт харуулахгүй
  const tooMap = new Map((data || []).map((r) => [r.modelName, r.too]));
  const niit = (data || []).reduce((s, r) => s + r.too, 0);
  const baigaa = (v: string) =>
    // «Тохиргоо» нь байгууллагын засвараас салгагддаг виртуал төрөл
    (tooMap.get(v === "tokhirgoo" ? "baiguullaga" : v) || 0) > 0;
  const angilaluud: AuditAngilal[] = Array.from(
    new Set([...BUKH_AUDIT_TURLUUD, ...(data || []).map((r) => r.modelName)]),
  )
    .filter(
      (v) =>
        baigaa(v) &&
        !DOTOOD_TURLUUD.has(v) &&
        !(turul === "zassan" && ZASSAN_KHASAKH_MODEL.has(v)),
    )
    // Нэг цэсний нэртэй model-уудыг нэг сонголт болгоно (value: «a,b»)
    .reduce<AuditAngilal[]>((acc, v) => {
      const label = auditAngilalNer(v);
      const too = tooMap.get(v) || 0;
      const baigaaMur = acc.find((a) => a.label === label);
      if (baigaaMur) {
        baigaaMur.value += `,${v}`;
        baigaaMur.too += too;
      } else acc.push({ value: v, label, too });
      return acc;
    }, [])
    .sort((a, b) => b.too - a.too || a.label.localeCompare(b.label, "mn"));
  return { angilaluud, niit, isLoading };
}
