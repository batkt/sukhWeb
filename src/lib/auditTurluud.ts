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
  tokhirgoo: "Тохиргоо",
  geree: "Гэрээ",
  orshinSuugch: "Оршин суугч",
  khariltsagch: "Харилцагч",
  ajiltan: "Ажилтан",
  baiguullaga: "Байгууллага",
  barilga: "Барилга",
  talbai: "Тоот",
  tootBurtgel: "Тоот бүртгэл",
  nekhemjlekh: "Нэхэмжлэх",
  nekhemjlekhiinTuukh: "Нэхэмжлэх",
  nekhemjlekhiinZagvar: "Нэхэмжлэхийн загвар",
  guilgee: "Гүйлгээ",
  guilgeeAvlaguud: "Гүйлгээ / авлага",
  bankniiGuilgee: "Банкны гүйлгээ",
  dans: "Данс",
  accountNumber: "Дансны дугаар",
  ebarimt: "И-баримт (хуучин)",
  ebarimtShine: "И-баримт",
  ashiglaltiinZardluud: "Ашиглалтын зардал",
  uilchilgeeniiZardluud: "Үйлчилгээний зардал",
  gereeniiZagvar: "Гэрээний загвар",
  gereeniiZaalt: "Гэрээний заалт",
  zaaltUnshlalt: "Заалт",
  mashin: "Машин",
  orshinSuugchMashin: "Оршин суугчийн машин",
  khariltsagchMashin: "Харилцагчийн машин",
  uneguiMashin: "Үнэгүй машин",
  zogsool: "Зогсоол",
  zochinZogsooliinTuukh: "Зочны зогсоол",
  ezenUrisanMashin: "Зочны урилга",
  uilchluulegch: "Зогсоолын үйлчлүүлэгч",
  medegdel: "Мэдэгдэл",
  sonorduulga: "Сонордуулга",
  blog: "Нийтлэл",
  sanalAsuulga: "Санал асуулга",
  sanalAsuulgiinKhariult: "Санал асуулгын хариулт",
  license: "Лиценз",
  appVersion: "Апп хувилбар",
  gerBuliinUrilga: "Гэр бүлийн урилга",
  tseverlegee: "Цэвэрлэгээ",
  liftShalgaya: "Лифт шалгалт",
  tatvariinAlba: "Татварын алба",
  qpayObject: "QPay",
  walletInvoice: "Wallet нэхэмжлэх",
  walletPayment: "Wallet төлбөр",
  easyRegisterUser: "И-баримт хэрэглэгч",
  kassCameraKhaalt: "Касс / камер",
  pdfFile: "PDF файл",
  ashiglaltiinExcel: "Ашиглалтын Excel",
  uilchilgeeniiExcel: "Үйлчилгээний Excel",
  khungulultiinTuukh: "Хөнгөлөлтийн түүх",
  khungulult: "Хөнгөлөлт",
  nekhemjlekhCron: "Нэхэмжлэхийн хуваарь",
  cronSchedule: "Автомат хуваарь",
  backTuukh: "Буцаалтын түүх",
  batalgaajuulahCode: "Баталгаажуулах код",
  zevtabsNevtreltCode: "Нэвтрэх код",
  ipTuukh: "IP түүх",
  khaalgaNeeyeTuukh: "Хаалга нээсэн түүх",
  msgTuukh: "Мессежийн түүх",
  nevtreltiinTuukh: "Нэвтрэлтийн түүх",
  session: "Нэвтрэлтийн сесс",
  udriinKhaalt: "Өдрийн хаалт",
  ustgakhTuukh: "Устгасан түүх",
  zasakhTuukh: "Зассан түүх",
  zassanBarimt: "Зассан баримт",
  ustsanBarimt: "Устгасан баримт",
  zogsoolGaraarOrlogo: "Зогсоолын гар орлого",
  zogsooliinIp: "Зогсоолын IP",
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
  "walletInvoice",
  "walletPayment",
  "qpayObject",
];

/** Серверт илгээх model-ийн нэр (виртуал төрлийг жинхэнэ model руу) */
export const auditServerModel = (m: string) => (m === "tokhirgoo" ? "baiguullaga" : m);

export interface AuditAngilal {
  value: string;
  label: string;
  too: number;
}

/**
 * Сонгосон хугацаанд байгаа ангилал бүрийн тоо. Ижил монгол нэртэй
 * model-уудыг (nekhemjlekh + nekhemjlekhiinTuukh гэх мэт) тусдаа үлдээнэ —
 * шүүлт нь model-ийн нэрээр явдаг.
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

  // Бичлэгтэй төрлүүд эхэнд (олноос нь), дараа нь бусад бүх төрөл
  const tooMap = new Map((data || []).map((r) => [r.modelName, r.too]));
  const niit = (data || []).reduce((s, r) => s + r.too, 0);
  const angilaluud: AuditAngilal[] = Array.from(
    new Set([...BUKH_AUDIT_TURLUUD, ...(data || []).map((r) => r.modelName)]),
  )
    .map((value) => ({ value, label: auditAngilalNer(value), too: tooMap.get(value) || 0 }))
    .sort((a, b) => b.too - a.too || a.label.localeCompare(b.label, "mn"));
  return { angilaluud, niit, isLoading };
}
