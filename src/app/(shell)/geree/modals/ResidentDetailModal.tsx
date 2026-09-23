"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
  Check,
  Plus,
  Car,
  Warehouse,
  Home,
  Users,
  User,
  Building2,
  Trash2,
  AlertCircle,
  ChevronDown,
  ShieldCheck,
  Eye,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import { useAuth } from "@/lib/useAuth";

type Props = {
  show: boolean;
  onClose: () => void;
  residentId?: string | null;
  token?: string | null;
  baiguullagiinId?: string | null;
  onEdit?: (resident: any) => void;
};

const ognooKharuul = (utga: unknown) => {
  if (!utga) return "—";
  const o = new Date(String(utga));
  if (isNaN(o.getTime())) return "—";
  return o.toISOString().slice(0, 10);
};

const tekst = (utga: unknown) => {
  if (utga === null || utga === undefined || utga === "") return "—";
  if (typeof utga === "object") return "—";
  return String(utga);
};

/** Улсын дугаар: эхний 4 нь тоо, сүүлийн 3 нь монгол кирилл үсэг (ж: 1234УБА) */
const MASHINII_DUGAARIIN_ZAGVAR = /^\d{4}[А-ЯӨҮЁ]{3}$/;

/** Латин гараас бичсэн ч монгол кирилл рүү хөрвүүлнэ */
const LATIN_KIRILL: Record<string, string> = {
  A: "А", B: "Б", C: "С", D: "Д", E: "Е", F: "Ф", G: "Г", H: "Х",
  I: "И", J: "Ж", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "П",
  Q: "Ө", R: "Р", S: "С", T: "Т", U: "У", V: "В", W: "В", X: "Х",
  Y: "Ү", Z: "З",
};

function mashiniiDugaarTseverle(orolt: string): string {
  const raw = orolt.toUpperCase().replace(/\s/g, "");
  let toonuud = "";
  let useguud = "";

  for (const ch of raw) {
    if (toonuud.length < 4) {
      // Эхний 4 орон заавал зөвхөн тоо байх ёстой — үсэг огт зөвшөөрөхгүй
      if (/\d/.test(ch)) {
        toonuud += ch;
      }
    } else if (useguud.length < 3) {
      // 4 тооны дараа л зөвхөн 3 монгол кирилл үсэг зөвшөөрнө
      const cyrillic = LATIN_KIRILL[ch] || ch;
      if (/^[А-ЯӨҮЁ]$/.test(cyrillic)) {
        useguud += cyrillic;
      }
    }
  }

  return toonuud + useguud;
}

const getTurulCategory = (t: any): "Орон сууц" | "Гараж" | "Агуулах" => {
  const turul = String(t?.turul || "").toLowerCase().trim();
  const davkhar = String(t?.davkhar || "").toLowerCase().trim();
  if (turul.includes("агуулах")) return "Агуулах";
  if (
    turul.includes("гараж") ||
    turul.includes("граш") ||
    turul.includes("зогсоол") ||
    turul === "b1" ||
    davkhar === "b1"
  ) {
    return "Гараж";
  }
  return "Орон сууц";
};

export const ResidentDetailModal: React.FC<Props> = ({
  show,
  onClose,
  residentId,
  token,
  baiguullagiinId,
  onEdit,
}) => {
  const [medeelel, setMedeelel] = useState<any>(null);
  const [unshij, setUnshij] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

  // Car addition state (direct input)
  const [shineMashiniiDugaar, setShineMashiniiDugaar] = useState("");
  const [shineMashinToot, setShineMashinToot] = useState("");
  const [mashinJagsaalt, setMashinJagsaalt] = useState<any[]>([]);
  /** Засаж байгаа машины индекс (null бол засаж байхгүй). */
  const [zasajBaigaaMashin, setZasajBaigaaMashin] = useState<number | null>(null);
  const [zasakhDugaar, setZasakhDugaar] = useState("");
  /** Машины жагсаалт сүүлд татсанаасаа хойш өөрчлөгдсөн эсэх. */
  const [mashinOorchlogdson, setMashinOorchlogdson] = useState(false);
  const [mashinUnshijBaina, setMashinUnshijBaina] = useState(false);

  const { baiguullaga } = useAuth();

  /**
   * Нэг оршин суугч дээр бүртгэж болох машины дээд тоо.
   *
   * Вебийн «Нэмэлт тохиргоо → Машины бүртгэлийн хязгаар»-аас тохируулна.
   * Барилга → байгууллагын дарааллаар уншина; 0 бол тохируулаагүй тул
   * хязгаарлахгүй (backend-ийн `mashiniiKhyazgaarOlya`-тай ижил дүрэм).
   */
  const mashiniiKhyazgaar = useMemo(() => {
    const org = baiguullaga as any;
    const barilga = org?.barilguud?.find(
      (b: any) =>
        String(b?._id || b?.id) === String(medeelel?.barilgiinId || ""),
    );

    const utga =
      barilga?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      barilga?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.tokhirgoo?.zochinTokhirgoo?.orshinSuugchMashiniiLimit ??
      org?.zochinTokhirgoo?.orshinSuugchMashiniiLimit;

    const toon = Number(utga);
    return Number.isFinite(toon) && toon > 0 ? Math.floor(toon) : 0;
  }, [baiguullaga, medeelel?.barilgiinId]);

  /**
   * Гэр бүлийн гишүүн урих боломжтой эсэх.
   *
   * Вебийн «Нэмэлт тохиргоо → Гэр бүлийн гишүүн урих» чекээс. Барилга →
   * байгууллагын дарааллаар уншина; тохируулаагүй бол зөвшөөрнө
   * (backend-ийн `gerBuliinGishuunZovshoorokhEsekh`-тэй ижил дүрэм).
   */
  const gerBuliinGishuunZovshoorson = useMemo(() => {
    const org = baiguullaga as any;
    const barilga = org?.barilguud?.find(
      (b: any) =>
        String(b?._id || b?.id) === String(medeelel?.barilgiinId || ""),
    );

    const utga =
      barilga?.tokhirgoo?.gerBuliinGishuunEsekh ??
      org?.tokhirgoo?.gerBuliinGishuunEsekh;

    return utga === undefined || utga === null ? true : utga !== false;
  }, [baiguullaga, medeelel?.barilgiinId]);

  /* Гэр бүлийн гишүүд цэс болон засах төлөв */
  const [tovchMenuGishuunId, setTovchMenuGishuunId] = useState<string | null>(null);
  const [zasajBuiGishuun, setZasajBuiGishuun] = useState<any | null>(null);
  const [gishuunKhadgaljBaina, setGishuunKhadgaljBaina] = useState(false);

  /* Хувийн мэдээлэл засах */
  const [zasajBuiKhuvi, setZasajBuiKhuvi] = useState(false);
  const [bugdKhadgaljBaina, setBugdKhadgaljBaina] = useState(false);
  const [khuviinMedeelel, setKhuviinMedeelel] = useState({
    ovog: "",
    ner: "",
    utas: "",
    mail: "",
    tailbar: "",
  });

  /* Гэр бүлийн гишүүн нэмэх форм */
  const [gishuunNemejBaina, setGishuunNemejBaina] = useState(false);
  const [shineGishuun, setShineGishuun] = useState({
    ovog: "",
    ner: "",
    utas: "",
    kholboo: "Бусад",
    erkh: "Харах + Төлөх",
  });

  const [zasajBuiToot, setZasajBuiToot] = useState(false);
  const [tootJagsaalt, setTootJagsaalt] = useState<any[]>([]);
  const [omchFilter, setOmchFilter] = useState<"Орон сууц" | "Гараж" | "Агуулах" | "Бүгд">("Орон сууц");

  const tataya = useCallback(async () => {
    if (!token || !residentId) return;
    setUnshij(true);
    setAldaa(null);
    try {
      const resp = await uilchilgee(token).get(`/orshinSuugch/${residentId}`, {
        params: { baiguullagiinId, delgerengui: true },
      });
      const data = resp.data;
      setMedeelel(data);
      setMashinJagsaalt(Array.isArray(data?.mashinuud) ? data.mashinuud : []);
      setMashinOorchlogdson(false);
      setTootJagsaalt(Array.isArray(data?.toots) ? data.toots : []);
    } catch {
      setAldaa("Мэдээлэл татахад алдаа гарлаа");
    } finally {
      setUnshij(false);
    }
  }, [token, residentId, baiguullagiinId]);

  useEffect(() => {
    if (show) {
      tataya();
      setZasajBuiToot(false);
      setOmchFilter("Орон сууц");
      setShineMashiniiDugaar("");
      setShineMashinToot("");
      setTovchMenuGishuunId(null);
      setZasajBuiGishuun(null);
    } else {
      setMedeelel(null);
      setMashinJagsaalt([]);
      setMashinOorchlogdson(false);
      setTootJagsaalt([]);
      setOmchFilter("Орон сууц");
      setTovchMenuGishuunId(null);
      setZasajBuiGishuun(null);
    }
  }, [show, tataya]);

  useEffect(() => {
    if (!show) return;
    const tovch = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", tovch);
    return () => document.removeEventListener("keydown", tovch);
  }, [show, onClose]);

  useEffect(() => {
    if (!tovchMenuGishuunId) return;
    const haaya = () => setTovchMenuGishuunId(null);
    window.addEventListener("click", haaya);
    return () => window.removeEventListener("click", haaya);
  }, [tovchMenuGishuunId]);

  /**
   * Гишүүнийг ШУУД нэмнэ (баталгаажуулалтгүй).
   *
   * Оршин суугчийн апп дахь `/gerBuliinGishuunUrikh` нь үндсэн эзэмшигчийг
   * токеноос олдог тул админ талаас ажиллахгүй. Эндээс `undsenId`-г
   * шууд заадаг `/gerBuliinGishuunNemekh` рүү хандана.
   */
  const gishuunNemye = async (): Promise<boolean> => {
    const utas = shineGishuun.utas.replace(/\D/g, "");
    if (utas.length < 8) {
      openErrorOverlay("Утасны дугаараа зөв оруулна уу");
      return false;
    }
    if (!token || !residentId) return false;

    try {
      await uilchilgee(token).post("/gerBuliinGishuunNemekh", {
        undsenId: residentId,
        utas,
        ovog: shineGishuun.ovog.trim(),
        ner: shineGishuun.ner.trim(),
        kholboo: shineGishuun.kholboo,
        erkh: shineGishuun.erkh,
      });
      setShineGishuun({
        ovog: "",
        ner: "",
        utas: "",
        kholboo: "Бусад",
        erkh: "Харах + Төлөх",
      });
      setGishuunNemejBaina(false);
      await tataya();
      return true;
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Гишүүн нэмэхэд алдаа гарлаа",
      );
      return false;
    }
  };

  /** Гишүүний эрх солих (Харах + Төлөх <-> Зөвхөн харах) */
  const gishuunErkhSoliyo = async (gishuuniiId: string, shineErkh: string) => {
    if (!token || !residentId) return;
    setTovchMenuGishuunId(null);
    try {
      await uilchilgee(token).put("/gerBuliinGishuunErkh", {
        undsenId: residentId,
        gishuuniiId,
        erkh: shineErkh,
      });
      openSuccessOverlay("Гишүүний эрх амжилттай солигдлоо");
      await tataya();
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Эрх солиход алдаа гарлаа",
      );
    }
  };

  /** Гишүүн хасах / устгах */
  const gishuunUstgaya = async (g: any) => {
    if (!token || !residentId) return;
    setTovchMenuGishuunId(null);
    const nernuud = [g.ovog, g.ner].filter(Boolean).join(" ") || g.utas;
    if (
      !confirm(
        `${nernuud ? `«${nernuud}» г` : "Г"}эр бүлийн гишүүнийг хасахдаа итгэлтэй байна уу?`,
      )
    ) {
      return;
    }
    try {
      await uilchilgee(token).post("/gerBuliinGishuunUstgakh", {
        undsenId: residentId,
        gishuuniiId: g._id,
        utas: g.utas,
      });
      openSuccessOverlay("Гэр бүлийн гишүүн хасагдлаа");
      await tataya();
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Гишүүн хасахад алдаа гарлаа",
      );
    }
  };

  /** Гишүүний мэдээлэл засаж хадгалах */
  const gishuunZasajKhadgalya = async () => {
    if (!zasajBuiGishuun || !token || !residentId) return;
    const utas = (zasajBuiGishuun.utas || "").replace(/\D/g, "");
    if (utas.length < 8) {
      openErrorOverlay("Утасны дугаараа зөв оруулна уу");
      return;
    }
    setGishuunKhadgaljBaina(true);
    try {
      await uilchilgee(token).post("/gerBuliinGishuunZasakh", {
        undsenId: residentId,
        gishuuniiId: zasajBuiGishuun._id,
        ovog: zasajBuiGishuun.ovog,
        ner: zasajBuiGishuun.ner,
        utas,
        kholboo: zasajBuiGishuun.kholboo,
        erkh: zasajBuiGishuun.erkh,
      });
      openSuccessOverlay("Гишүүний мэдээлэл шинэчлэгдлээ");
      setZasajBuiGishuun(null);
      await tataya();
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Гишүүний мэдээлэл засахад алдаа гарлаа",
      );
    } finally {
      setGishuunKhadgaljBaina(false);
    }
  };

  // Real family members only (no static data)
  const gerBuliinGishuud: any[] = useMemo(() => {
    return Array.isArray(medeelel?.gerBuliinGishuud)
      ? medeelel.gerBuliinGishuud
      : [];
  }, [medeelel]);

  // ── Handlers for Car (Direct input add & delete with auto-save) ──
  const shuudMashinNemekh = async () => {
    const cleaned = mashiniiDugaarTseverle(shineMashiniiDugaar);
    if (!cleaned) {
      openErrorOverlay("Улсын дугаараа оруулна уу");
      return;
    }
    if (!MASHINII_DUGAARIIN_ZAGVAR.test(cleaned)) {
      openErrorOverlay(
        "Улсын дугаар 4 тоо, 3 монгол кирилл үсэг байх ёстой (Жишээ: 1234УБА)",
      );
      return;
    }
    if (
      mashinJagsaalt.some(
        (m) => (m.mashiniiDugaar || "").trim().toUpperCase() === cleaned,
      )
    ) {
      openErrorOverlay("Энэ улсын дугаар аль хэдийн бүртгэгдсэн байна");
      return;
    }
    // Тохиргооны хязгаар (Нэмэлт тохиргоо → Машины бүртгэлийн хязгаар).
    // Backend ч мөн шалгадаг — энд шалгах нь хэрэглэгчид шалтгааныг товчийг
    // дарахаас өмнө хэлэх зорилготой.
    if (mashiniiKhyazgaar > 0 && mashinJagsaalt.length >= mashiniiKhyazgaar) {
      openErrorOverlay(
        `Нэг оршин суугч дээр хамгийн олон ${mashiniiKhyazgaar} машин бүртгэх боломжтой. Хязгаарыг Нэмэлт тохиргооноос өөрчилнө.`,
      );
      return;
    }
    if (!token || !residentId) return;

    const newCar = {
      mashiniiDugaar: cleaned,
      ezenToot: shineMashinToot || tootJagsaalt[0]?.toot || medeelel?.toot || "",
    };
    const jagsaalt = [...mashinJagsaalt, newCar];

    setMashinUnshijBaina(true);
    try {
      const resp = await uilchilgee(token).post(
        "/orshinSuugchiinMashinKhadgalya",
        {
          orshinSuugchiinId: residentId,
          baiguullagiinId,
          mashinuud: jagsaalt.map((m: any) => ({
            mashiniiDugaar: m.mashiniiDugaar,
            ezenToot: m.ezenToot,
          })),
        },
      );
      const shineJagsaalt = Array.isArray(resp.data?.mashinuud)
        ? resp.data.mashinuud
        : jagsaalt;
      setMashinJagsaalt(shineJagsaalt);
      setMedeelel((prev: any) => ({ ...prev, mashinuud: shineJagsaalt }));
      setShineMashiniiDugaar("");
      setMashinOorchlogdson(false);
      openSuccessOverlay("Машин амжилттай бүртгэгдлээ");
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Машин нэмэхэд алдаа гарлаа",
      );
    } finally {
      setMashinUnshijBaina(false);
    }
  };

  const mashinUstgakh = async (index: number) => {
    if (!token || !residentId) return;
    const uldsenMashinuud = mashinJagsaalt.filter((_, i) => i !== index);

    setMashinUnshijBaina(true);
    try {
      const resp = await uilchilgee(token).post(
        "/orshinSuugchiinMashinKhadgalya",
        {
          orshinSuugchiinId: residentId,
          baiguullagiinId,
          mashinuud: uldsenMashinuud.map((m: any) => ({
            mashiniiDugaar: m.mashiniiDugaar,
            ezenToot: m.ezenToot,
          })),
        },
      );
      const shineJagsaalt = Array.isArray(resp.data?.mashinuud)
        ? resp.data.mashinuud
        : uldsenMashinuud;
      setMashinJagsaalt(shineJagsaalt);
      setMedeelel((prev: any) => ({ ...prev, mashinuud: shineJagsaalt }));
      setMashinOorchlogdson(false);
      openSuccessOverlay("Машин хасагдлаа");
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Машин устгахад алдаа гарлаа",
      );
    } finally {
      setMashinUnshijBaina(false);
    }
  };

  // ── Машины дугаар ЗАСАХ ─────────────────────────────────────────────
  // Хадгалах endpoint нь БҮТЭН жагсаалтыг авч дарж бичдэг тул засах нь
  // нэг мөрийн дугаарыг сольж, жагсаалтыг бүтнээр илгээх л юм.
  const mashinZasajEkhleye = (index: number) => {
    setZasajBaigaaMashin(index);
    setZasakhDugaar(
      String(mashinJagsaalt[index]?.mashiniiDugaar || "").toUpperCase(),
    );
  };

  const mashinZasvarBoliya = () => {
    setZasajBaigaaMashin(null);
    setZasakhDugaar("");
  };

  const mashinZasvarKhadgalya = async () => {
    if (zasajBaigaaMashin === null) return;
    const cleaned = mashiniiDugaarTseverle(zasakhDugaar);

    if (!MASHINII_DUGAARIIN_ZAGVAR.test(cleaned)) {
      openErrorOverlay(
        "Улсын дугаар 4 тоо, 3 монгол кирилл үсэг байх ёстой (Жишээ: 1234УБА)",
      );
      return;
    }

    // Давхардлыг шалгахдаа ӨӨРИЙГӨӨ тооцохгүй — эс тэгвээс хөндөөгүй
    // дугаараа хадгалахад «аль хэдийн бүртгэгдсэн» гэж хаана.
    const davkhardsan = mashinJagsaalt.some(
      (m, i) =>
        i !== zasajBaigaaMashin &&
        String(m.mashiniiDugaar || "").trim().toUpperCase() === cleaned,
    );
    if (davkhardsan) {
      openErrorOverlay("Энэ улсын дугаар аль хэдийн бүртгэгдсэн байна");
      return;
    }

    // Өөрчлөгдөөгүй бол сервер зовоохгүй
    if (
      cleaned ===
      String(mashinJagsaalt[zasajBaigaaMashin]?.mashiniiDugaar || "")
        .trim()
        .toUpperCase()
    ) {
      mashinZasvarBoliya();
      return;
    }

    if (!token || !residentId) return;

    const jagsaalt = mashinJagsaalt.map((m: any, i: number) =>
      i === zasajBaigaaMashin ? { ...m, mashiniiDugaar: cleaned } : m,
    );

    setMashinUnshijBaina(true);
    try {
      const resp = await uilchilgee(token).post(
        "/orshinSuugchiinMashinKhadgalya",
        {
          orshinSuugchiinId: residentId,
          baiguullagiinId,
          mashinuud: jagsaalt.map((m: any) => ({
            mashiniiDugaar: m.mashiniiDugaar,
            ezenToot: m.ezenToot,
          })),
        },
      );
      const shineJagsaalt = Array.isArray(resp.data?.mashinuud)
        ? resp.data.mashinuud
        : jagsaalt;
      setMashinJagsaalt(shineJagsaalt);
      setMedeelel((prev: any) => ({ ...prev, mashinuud: shineJagsaalt }));
      setMashinOorchlogdson(false);
      mashinZasvarBoliya();
      openSuccessOverlay("Машины дугаар шинэчлэгдлээ");
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Машины дугаар засахад алдаа гарлаа",
      );
    } finally {
      setMashinUnshijBaina(false);
    }
  };

  // ── Handlers for Toot editing ──
  const tootNemekh = () => {
    setTootJagsaalt((prev) => [
      ...prev,
      {
        toot: "",
        turul: "Орон сууц",
        davkhar: "",
        orts: "",
        tsahilgaaniiZaalt: 0,
      },
    ]);
  };

  const tootUstgakh = (index: number) => {
    setTootJagsaalt((prev) => prev.filter((_, i) => i !== index));
  };

  const tootFieldSolikh = (index: number, field: string, val: any) => {
    setTootJagsaalt((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  /**
   * Гараж / Агуулах-д холбоотой Орон сууцны тоотыг олно.
   */
  const getAssociatedAptToot = useCallback(
    (t: any): string => {
      if (t?.linkedAptToot) return String(t.linkedAptToot).trim();
      if (t?.linkedToot) return String(t.linkedToot).trim();
      if (t?.aptToot) return String(t.aptToot).trim();

      // Хэрэв гэрээний ID-тай холбогдсон бол оршин суугчийн гэрээнүүдээс шалгах
      if (t?.gereeniiId && Array.isArray(medeelel?.gereenuud)) {
        const linkedGeree = medeelel.gereenuud.find(
          (g: any) =>
            String(g._id || g.id) === String(t.gereeniiId) ||
            String(g.gereeniiDugaar) === String(t.gereeniiId),
        );
        if (
          linkedGeree?.toot &&
          linkedGeree.turul !== "Гараж" &&
          linkedGeree.turul !== "Зогсоол" &&
          linkedGeree.turul !== "Агуулах"
        ) {
          return String(linkedGeree.toot).trim();
        }
        if (linkedGeree?.linkedAptToot) {
          return String(linkedGeree.linkedAptToot).trim();
        }
      }

      // Оршин суугчийн бүртгэлтэй Орон сууцны тоотуудаас хамгийн эхнийхийг сонгох
      const aptItem = tootJagsaalt.find(
        (item: any) =>
          item !== t &&
          getTurulCategory(item) === "Орон сууц" &&
          item.toot,
      );
      if (aptItem?.toot) {
        return String(aptItem.toot).trim();
      }

      // Оршин суугчийн үндсэн тоот руу шилжих
      if (medeelel?.toot) {
        return String(medeelel.toot).trim();
      }

      return "";
    },
    [medeelel, tootJagsaalt],
  );

  const oronSuutsCount = useMemo(
    () => tootJagsaalt.filter((t) => getTurulCategory(t) === "Орон сууц").length,
    [tootJagsaalt],
  );
  const garajCount = useMemo(
    () => tootJagsaalt.filter((t) => getTurulCategory(t) === "Гараж").length,
    [tootJagsaalt],
  );
  const aguulakhCount = useMemo(
    () => tootJagsaalt.filter((t) => getTurulCategory(t) === "Агуулах").length,
    [tootJagsaalt],
  );

  /**
   * Тоотуудыг замбараагүй биш дэс дараалалтай (Орон сууц -> Гараж -> Агуулах)
   * болгож эрэмбэлэн шүүлтүүрээр шүүнэ.
   */
  const filteredTootJagsaalt = useMemo(() => {
    const list = [...tootJagsaalt];
    const priorityMap: Record<string, number> = {
      "Орон сууц": 1,
      "Гараж": 2,
      "Агуулах": 3,
    };
    list.sort((a, b) => {
      const prioA = priorityMap[getTurulCategory(a)] || 99;
      const prioB = priorityMap[getTurulCategory(b)] || 99;
      if (prioA !== prioB) return prioA - prioB;
      return String(a.toot || "").localeCompare(String(b.toot || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    if (omchFilter === "Бүгд") return list;
    return list.filter((t) => getTurulCategory(t) === omchFilter);
  }, [tootJagsaalt, omchFilter]);

  const bairNer = useMemo(() => {
    if (medeelel?.bairniiNer) return medeelel.bairniiNer;
    const fromToots = Array.from(
      new Set(
        tootJagsaalt
          .map((t: any) => t?.bairniiNer || t?.bair)
          .filter(Boolean),
      ),
    ).join(", ");
    if (fromToots) return fromToots;
    if (medeelel?.bair) return medeelel.bair;
    if (medeelel?.barilgiinNer) return medeelel.barilgiinNer;
    return "";
  }, [medeelel, tootJagsaalt]);

  /** Засах горимд шилжихэд талбаруудыг одоогийн утгаар дүүргэнэ. */
  const khuviiZasya = () => {
    setKhuviinMedeelel({
      ovog: medeelel?.ovog || "",
      ner: medeelel?.ner || "",
      utas: medeelel?.utas || "",
      mail: medeelel?.mail || "",
      tailbar: medeelel?.tailbar || "",
    });
    setZasajBuiKhuvi(true);
  };

  /**
   * Хувийн мэдээллийг хадгална.
   *
   * `Нэвтрэх нэр`, `Төлөв`, `Эрх`, `Бүртгэгдсэн` дөрвийг ЗОРИУД оруулаагүй —
   * эдгээр нь системээс тодорхойлогддог (нэвтрэх нэр нь утаснаас, эрх нь
   * бүртгэлийн төрлөөс). Эндээс гараар өөрчилвөл нэвтрэлт эвдэрч болно.
   */
  const khuviiKhadgalya = async (): Promise<boolean> => {
    if (!token || !residentId) return false;
    const utas = khuviinMedeelel.utas.replace(/[^0-9]/g, "");
    if (utas && utas.length < 8) {
      openErrorOverlay("Утасны дугаараа зөв оруулна уу");
      return false;
    }

    try {
      const shinechlelt = {
        ovog: khuviinMedeelel.ovog.trim(),
        ner: khuviinMedeelel.ner.trim(),
        utas: utas || khuviinMedeelel.utas.trim(),
        mail: khuviinMedeelel.mail.trim(),
        tailbar: khuviinMedeelel.tailbar.trim(),
      };
      await uilchilgee(token).put(`/orshinSuugch/${residentId}`, {
        ...shinechlelt,
        baiguullagiinId,
      });
      setMedeelel((prev: any) => ({ ...prev, ...shinechlelt }));
      setZasajBuiKhuvi(false);
      return true;
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa || "Хувийн мэдээлэл хадгалахад алдаа гарлаа",
      );
      return false;
    }
  };

  const tootKhadgalya = async (): Promise<boolean> => {
    if (!token || !residentId) return false;
    try {
      await uilchilgee(token).put(`/orshinSuugch/${residentId}`, {
        toots: tootJagsaalt,
        baiguullagiinId,
      });
      setMedeelel((prev: any) => ({
        ...prev,
        toots: tootJagsaalt,
      }));
      setZasajBuiToot(false);
      return true;
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa || "Тоот хадгалахад алдаа гарлаа",
      );
      return false;
    }
  };

  /**
   * Машины жагсаалтыг серверт хадгална.
   *
   * Машин нь `orshinSuugch` бичлэг дээр биш, тусдаа цуглуулгад байдаг тул
   * `PUT /orshinSuugch/:id` ажиллахгүй — жагсаалтыг бүхэлд нь тавьдаг
   * тусгай зам руу явуулна.
   *
   * Талбарт бичсэн хэрнээ «Нэмэх» дараагүй дугаарыг ч оруулж өгнө —
   * хэрэглэгч бичээд шууд Хадгалах дарвал алдагдах ёсгүй.
   */
  const mashinKhadgalya = async (): Promise<boolean> => {
    if (!token || !residentId) return false;
    const rawNemelt = shineMashiniiDugaar.trim();
    let nemelt = "";
    if (rawNemelt) {
      nemelt = mashiniiDugaarTseverle(rawNemelt);
      if (!MASHINII_DUGAARIIN_ZAGVAR.test(nemelt)) {
        openErrorOverlay(
          "Улсын дугаар 4 тоо, 3 монгол кирилл үсэг байх ёстой (Жишээ: 1234УБА)"
        );
        return false;
      }
      if (
        mashinJagsaalt.some(
          (m) => (m.mashiniiDugaar || "").trim().toUpperCase() === nemelt
        )
      ) {
        openErrorOverlay("Энэ улсын дугаар аль хэдийн бүртгэгдсэн байна");
        return false;
      }
    }
    const jagsaalt = nemelt
      ? [
        ...mashinJagsaalt,
        {
          mashiniiDugaar: nemelt,
          ezenToot: shineMashinToot || tootJagsaalt[0]?.toot || "",
        },
      ]
      : mashinJagsaalt;

    try {
      const resp = await uilchilgee(token).post(
        "/orshinSuugchiinMashinKhadgalya",
        {
          orshinSuugchiinId: residentId,
          baiguullagiinId,
          mashinuud: jagsaalt.map((m: any) => ({
            mashiniiDugaar: m.mashiniiDugaar,
            ezenToot: m.ezenToot,
          })),
        },
      );
      const shineJagsaalt = Array.isArray(resp.data?.mashinuud)
        ? resp.data.mashinuud
        : jagsaalt;
      setMashinJagsaalt(shineJagsaalt);
      setMedeelel((prev: any) => ({ ...prev, mashinuud: shineJagsaalt }));
      setShineMashiniiDugaar("");
      setMashinOorchlogdson(false);
      return true;
    } catch (err: any) {
      openErrorOverlay(
        err?.response?.data?.aldaa ||
        err?.response?.data?.message ||
        "Машин хадгалахад алдаа гарлаа",
      );
      return false;
    }
  };

  /** Машины хэсэгт хадгалагдаагүй өөрчлөлт байгаа эсэх. */
  const mashinKhadgalakhShaardlagatai =
    mashinOorchlogdson || Boolean(shineMashiniiDugaar.trim());

  /**
   * Хадгалах зүйл нээлттэй байгаа эсэх.
   *
   * Гишүүний маягт нээлттэй бол хоосон ч гэсэн энд тооцно — эс тэгвэл
   * хэрэглэгч талбараа бөглөөд Хадгалах дарахад товч идэвхгүй хэвээр
   * байж «яагаад хадгалагдахгүй байгаа юм бэ» гэсэн асуулт төрүүлнэ.
   * Бөглөлтийн шалгалтыг `gishuunNemye` өөрөө хийж мэдэгдэнэ.
   */
  const khadgalakhShaardlagatai =
    zasajBuiKhuvi ||
    zasajBuiToot ||
    gishuunNemejBaina ||
    mashinKhadgalakhShaardlagatai;

  /**
   * Бүх нээлттэй засварыг нэг товчоор хадгална.
   *
   * Хэсэг бүр өөрийн жижиг Хадгалах товчтой байсныг болиулав — модал дотор
   * гурав, дөрвөн хадгалах товч зэрэг харагдах нь ойлгомжгүй, шинэ хэсэг
   * нэмэх бүрт бас нэгийг нэмэх шаардлагатай болдог байлаа. Одоо ганц цэг.
   *
   * Аль нэг нь амжилтгүй болбол тэндээ зогсоно — тухайн хэсгийн алдааны
   * мэдэгдэл аль хэдийн гарсан байх тул дээр нь давхар мэдэгдэл харуулахгүй.
   */
  const bugdiigKhadgalya = async () => {
    if (!khadgalakhShaardlagatai) {
      openErrorOverlay("Хадгалах засвар алга байна");
      return;
    }
    setBugdKhadgaljBaina(true);
    try {
      let amjilt = 0;
      if (zasajBuiKhuvi) {
        if (!(await khuviiKhadgalya())) return;
        amjilt += 1;
      }
      if (zasajBuiToot) {
        if (!(await tootKhadgalya())) return;
        amjilt += 1;
      }
      if (mashinKhadgalakhShaardlagatai) {
        if (!(await mashinKhadgalya())) return;
        amjilt += 1;
      }
      if (gishuunNemejBaina) {
        if (!(await gishuunNemye())) return;
        amjilt += 1;
      }
      if (amjilt) openSuccessOverlay("Мэдээлэл хадгалагдлаа");
    } finally {
      setBugdKhadgaljBaina(false);
    }
  };

  if (!show) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shadow-2xl transition-all text-[color:var(--panel-text)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-5 border-b border-[color:var(--surface-border)]">
            {/* Left: Avatar & Resident details */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-theme/10 text-brand">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg sm:text-xl font-bold text-[color:var(--panel-text)] dark:text-white">
                  {tekst(medeelel?.ovog)} {tekst(medeelel?.ner)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-[color:var(--muted-text)]">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                    <span>{tekst(medeelel?.utas)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                    <span>{tekst(medeelel?.mail)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status pill & Close button on the same line */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-theme/25 bg-theme/10 px-3 py-1 text-xs font-medium text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-theme animate-pulse shrink-0" />
                <span>
                  {tekst(medeelel?.tuluv) === "—" || !medeelel?.tuluv
                    ? "Идэвхтэй"
                    : tekst(medeelel.tuluv)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
                title="Хаах"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Modal Body (Direct 2x2 Grid, No Tabs) ── */}
          <div className="max-h-[76vh] overflow-y-auto p-5 sm:p-6 bg-[color:var(--surface-hover)]">
            {unshij && (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-xs text-[color:var(--muted-text)]">
                <Loader2 className="h-6 w-6 animate-spin text-theme" />
                <span>Мэдээлэл уншиж байна...</span>
              </div>
            )}

            {!unshij && aldaa && (
              <div className="py-20 text-center text-xs text-danger font-medium">
                {aldaa}
              </div>
            )}

            {!unshij && !aldaa && medeelel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Хувийн мэдээлэл Card (Edit button removed) */}
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[color:var(--surface-border)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-brand">
                          <User className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                          Хувийн мэдээлэл
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          zasajBuiKhuvi ? setZasajBuiKhuvi(false) : khuviiZasya()
                        }
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-theme transition hover:bg-theme/10 dark:hover:bg-theme/20"
                      >
                        {zasajBuiKhuvi ? "Болих" : "Засах"}
                      </button>
                    </div>

                    {/* Засах горим. Уншигдах хүснэгтийг нуугаад форм гаргана —
                        ингэснээр байгаа бүтэц хэвээр үлдэнэ. */}
                    {zasajBuiKhuvi && (
                      <div className="pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-[color:var(--muted-text)] mb-1">Овог</p>
                            <input
                              value={khuviinMedeelel.ovog}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ovog: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-[color:var(--muted-text)] mb-1">Нэр</p>
                            <input
                              value={khuviinMedeelel.ner}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ner: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-[color:var(--muted-text)] mb-1">Утас</p>
                            <input
                              inputMode="numeric"
                              value={khuviinMedeelel.utas}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  utas: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-[color:var(--muted-text)] mb-1">E-mail</p>
                            <input
                              type="email"
                              value={khuviinMedeelel.mail}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  mail: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-[color:var(--muted-text)] mb-1">
                              Тайлбар
                            </p>
                            <input
                              value={khuviinMedeelel.tailbar}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  tailbar: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 py-1.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-[color:var(--muted-text)]">
                          Эрх, Бүртгэгдсэн огноо нь системээс
                          тодорхойлогддог тул эндээс өөрчлөгдөхгүй.
                        </p>
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 pt-4 ${zasajBuiKhuvi ? "hidden" : ""
                        }`}
                    >
                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Овог
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {tekst(medeelel.ovog)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Нэр
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {tekst(medeelel.ner)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Байр
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {tekst(bairNer)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Утас
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {tekst(medeelel.utas)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          E-mail
                        </p>
                        <p
                          className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5 truncate"
                          title={tekst(medeelel.mail)}
                        >
                          {tekst(medeelel.mail)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Эрх
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {medeelel.erkh === "OrshinSuugch"
                            ? "Оршин суугч"
                            : tekst(medeelel.erkh)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[color:var(--muted-text)]">
                          Бүртгэгдсэн
                        </p>
                        <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                          {ognooKharuul(medeelel.createdAt)}
                        </p>
                      </div>

                      {medeelel.tailbar && (
                        <div className="col-span-2 sm:col-span-3 pt-2 border-t border-[color:var(--surface-border)]">
                          <p className="text-[11px] text-[color:var(--muted-text)]">
                            Тайлбар
                          </p>
                          <p className="text-xs font-normal text-[color:var(--panel-text)] mt-0.5">
                            {tekst(medeelel.tailbar)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Машин Card (Direct Input) */}
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[color:var(--surface-border)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-brand">
                          <Car className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                          Машин (
                          {mashiniiKhyazgaar > 0
                            ? `${mashinJagsaalt.length}/${mashiniiKhyazgaar}`
                            : mashinJagsaalt.length}
                          )
                        </h3>
                      </div>
                    </div>

                    {/* Direct car addition input */}
                    <div className="pt-3 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                          <input
                            type="text"
                            value={shineMashiniiDugaar}
                            maxLength={7}
                            onChange={(e) =>
                              setShineMashiniiDugaar(
                                mashiniiDugaarTseverle(e.target.value)
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                shuudMashinNemekh();
                              }
                            }}
                            placeholder="Улсын дугаар (жишээ: 1234УБА)..."
                            className={`w-full h-9 pl-9 pr-3 rounded-xl border bg-[color:var(--surface-bg)] text-xs font-mono font-semibold tracking-wider uppercase placeholder:text-[color:var(--muted-text)] placeholder:font-normal placeholder:tracking-normal focus:outline-none transition shadow-2xs ${shineMashiniiDugaar.length === 0
                              ? "border-[color:var(--surface-border)] text-[color:var(--panel-text)] dark:text-white focus:ring-2 focus:ring-theme"
                              : !MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar)
                                ? "border-danger text-danger focus:ring-2 focus:ring-danger/20"
                                : "border-success text-success focus:ring-2 focus:ring-success/20"
                              }`}
                          />
                        </div>
                        {tootJagsaalt.length > 1 && (
                          <div className="relative shrink-0">
                            <select
                              value={shineMashinToot}
                              onChange={(e) => setShineMashinToot(e.target.value)}
                              className="h-9 appearance-none pl-3 pr-8 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-theme transition shadow-2xs cursor-pointer"
                            >
                              {tootJagsaalt.map((t, i) => (
                                <option key={i} value={t.toot}>
                                  {t.toot} тоот
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={shuudMashinNemekh}
                          disabled={!MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar) || mashinUnshijBaina}
                          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-theme hover:bg-theme/90 disabled:opacity-40 text-white text-xs font-medium shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                        >
                          {mashinUnshijBaina ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span>Нэмэх</span>
                        </button>
                      </div>
                      {shineMashiniiDugaar.length > 0 && !MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar) && (
                        <p className="text-[11px] text-danger mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-in fade-in duration-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {shineMashiniiDugaar.length < 4
                              ? `Эхний 4 орон тоо байх ёстой (${shineMashiniiDugaar.length}/4)`
                              : `Сүүлийн 3 орон монгол кирилл үсэг байх ёстой (${shineMashiniiDugaar.length - 4}/3)`}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Car List */}
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto pr-1">
                      {mashinJagsaalt.length === 0 ? (
                        <p className="py-5 text-center text-xs text-[color:var(--muted-text)]">
                          Бүртгэлтэй машин одоогоор алга байна.
                        </p>
                      ) : (
                        mashinJagsaalt.map((m: any, idx: number) => {
                          const zasajBaina = zasajBaigaaMashin === idx;
                          const zasvarZuv =
                            MASHINII_DUGAARIIN_ZAGVAR.test(zasakhDugaar);
                          return (
                          <div
                            key={m._id || idx}
                            className="flex items-center justify-between rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3.5 py-2.5"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme/15 text-brand">
                                <Car className="h-4 w-4" />
                              </div>
                              {zasajBaina ? (
                                <div className="min-w-0 flex-1">
                                  <input
                                    autoFocus
                                    value={zasakhDugaar}
                                    onChange={(e) =>
                                      setZasakhDugaar(
                                        mashiniiDugaarTseverle(e.target.value),
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        mashinZasvarKhadgalya();
                                      }
                                      if (e.key === "Escape") {
                                        e.preventDefault();
                                        mashinZasvarBoliya();
                                      }
                                    }}
                                    placeholder="1234УБА"
                                    maxLength={7}
                                    className={`h-8 w-full min-w-0 rounded-lg border bg-[color:var(--surface-bg)] px-2.5 text-xs font-semibold tracking-wide text-[color:var(--panel-text)] uppercase focus:outline-none ${
                                      zasakhDugaar && !zasvarZuv
                                        ? "border-danger focus:border-danger"
                                        : "border-[color:var(--surface-border)] focus:border-theme"
                                    }`}
                                  />
                                  {zasakhDugaar.length > 0 && !zasvarZuv && (
                                    <p className="mt-1 text-[10px] text-danger">
                                      4 тоо + 3 монгол кирилл үсэг
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-semibold text-[color:var(--panel-text)] dark:text-white truncate">
                                    {tekst(m.mashiniiDugaar)}
                                  </h4>
                                  {m.ezenToot && (
                                    <p className="text-[11px] text-[color:var(--muted-text)]">
                                      Тоот: {m.ezenToot}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              {zasajBaina ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={mashinZasvarKhadgalya}
                                    disabled={!zasvarZuv || mashinUnshijBaina}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-brand transition cursor-pointer hover:bg-theme/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Хадгалах"
                                  >
                                    {mashinUnshijBaina ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={mashinZasvarBoliya}
                                    disabled={mashinUnshijBaina}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition cursor-pointer hover:text-[color:var(--panel-text)] disabled:opacity-40"
                                    title="Болих"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => mashinZasajEkhleye(idx)}
                                    disabled={mashinUnshijBaina}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition cursor-pointer hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Засах"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => mashinUstgakh(idx)}
                                    disabled={mashinUnshijBaina}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted-text)] hover:text-danger transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Устгах"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Гараж / B1 Card (Edit implemented) */}
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[color:var(--surface-border)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-brand">
                          <Warehouse className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                          Өмч бүртгэл
                        </h3>
                      </div>

                      {/* Edit button implemented for Граш / B1 */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEdit) {
                              onEdit(medeelel);
                            } else {
                              setZasajBuiToot(!zasajBuiToot);
                            }
                          }}
                          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-normal transition cursor-pointer ${zasajBuiToot
                            ? "border-theme bg-theme/10 text-brand"
                            : "border-[color:var(--surface-border)] text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                            }`}
                        >
                          <Pencil className="h-3 w-3 text-[color:var(--muted-text)]" />
                          <span>{zasajBuiToot ? "Болих" : "Засах"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Edit Mode View for Граш / B1 */}
                    {zasajBuiToot ? (
                      <div className="pt-4 space-y-3">
                        {tootJagsaalt.length === 0 && (
                          <p className="text-center text-xs text-[color:var(--muted-text)] py-3">
                            Одоогоор бүртгэлтэй тоот/граш алга.
                          </p>
                        )}
                        {tootJagsaalt.map((t, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-3 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-[color:var(--muted-text)]">
                                Хаяг #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => tootUstgakh(idx)}
                                className="text-danger hover:text-danger p-1 cursor-pointer"
                                title="Устгах"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">
                                  Тоот
                                </label>
                                <input
                                  type="text"
                                  value={t.toot || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "toot", e.target.value)
                                  }
                                  placeholder="101"
                                  className="w-full h-8 px-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">
                                  Төрөл
                                </label>
                                <div className="relative">
                                  <select
                                    value={t.turul || "Орон сууц"}
                                    onChange={(e) =>
                                      tootFieldSolikh(idx, "turul", e.target.value)
                                    }
                                    className="w-full h-8 appearance-none pl-2 pr-7 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs cursor-pointer"
                                  >
                                    <option value="Орон сууц">Орон сууц</option>
                                    <option value="Гараж">Гараж</option>
                                    <option value="Граш">Граш</option>
                                    <option value="B1">B1</option>
                                    <option value="Агуулах">Агуулах</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">
                                  Давхар
                                </label>
                                <input
                                  type="text"
                                  value={t.davkhar || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "davkhar", e.target.value)
                                  }
                                  placeholder="1"
                                  className="w-full h-8 px-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs"
                                />
                              </div>
                              {getTurulCategory(t) === "Орон сууц" && (
                                <div>
                                  <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">
                                    Цахилгааны заалт
                                  </label>
                                  <input
                                    type="number"
                                    value={t.tsahilgaaniiZaalt ?? 0}
                                    onChange={(e) =>
                                      tootFieldSolikh(idx, "tsahilgaaniiZaalt", Number(e.target.value))
                                    }
                                    className="w-full h-8 px-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs"
                                  />
                                </div>
                              )}
                            </div>
                            {getTurulCategory(t) !== "Орон сууц" && (
                              <div className="pt-2 border-t border-[color:var(--surface-border)]">
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">
                                  Холбоотой тоот (Орон сууц)
                                </label>
                                <input
                                  type="text"
                                  value={t.linkedAptToot || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "linkedAptToot", e.target.value)
                                  }
                                  placeholder={getAssociatedAptToot(t) || "101"}
                                  className="w-full max-w-xs h-8 px-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs"
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        <div className="flex items-center pt-2">
                          <button
                            type="button"
                            onClick={tootNemekh}
                            className="flex items-center gap-1 text-xs text-theme hover:text-theme font-medium cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Хаяг нэмэх</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode for Өмч бүртгэл */
                      <div className="pt-3">
                        {/* Filter Tabs: Бүгд, Орон сууц, Гараж, Агуулах */}
                        <div className="flex items-center gap-1.5 pb-3 overflow-x-auto no-scrollbar">
                          {(
                            [
                              { key: "Орон сууц", label: "Орон сууц", count: oronSuutsCount },
                              { key: "Гараж", label: "Гараж", count: garajCount },
                              { key: "Агуулах", label: "Агуулах", count: aguulakhCount },
                              { key: "Бүгд", label: "Бүгд", count: tootJagsaalt.length },
                            ] as const
                          ).map((tab) => {
                            const isActive = omchFilter === tab.key;
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setOmchFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${isActive
                                    ? "bg-theme/10 text-brand border border-theme/30"
                                    : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] border border-transparent"
                                  }`}
                              >
                                <span>{tab.label}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive
                                      ? "bg-theme text-white"
                                      : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
                                    }`}
                                >
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {tootJagsaalt.length === 0 ? (
                          <div className="h-[175px] flex flex-col items-center justify-center text-xs text-[color:var(--muted-text)]">
                            <Warehouse className="mx-auto mb-2 h-7 w-7 text-[color:var(--muted-text)]" />
                            <p className="text-[color:var(--muted-text)] font-medium">
                              Өмч бүртгэлгүй байна
                            </p>
                            <button
                              type="button"
                              onClick={() => (onEdit ? onEdit(medeelel) : setZasajBuiToot(true))}
                              className="mt-2 text-theme hover:underline cursor-pointer"
                            >
                              + Хаяг бүртгэх
                            </button>
                          </div>
                        ) : filteredTootJagsaalt.length === 0 ? (
                          <div className="h-[175px] flex flex-col items-center justify-center text-xs text-[color:var(--muted-text)]">
                            <p className="text-[color:var(--muted-text)] font-medium">
                              {omchFilter} бүртгэлгүй байна
                            </p>
                          </div>
                        ) : (
                          <div className="h-[175px] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {filteredTootJagsaalt.map((t: any, i: number) => {
                                const category = getTurulCategory(t);
                                const isB1 =
                                  t.davkhar === "B1" ||
                                  category === "Гараж" ||
                                  t.turul === "B1";
                                const associatedToot = getAssociatedAptToot(t);

                                return (
                                  <div
                                    key={t._id || i}
                                    className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-2.5 flex flex-col justify-between space-y-2"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-theme/10 text-brand font-bold text-xs">
                                          {category === "Гараж" ? (
                                            isB1 && t.turul === "B1" ? (
                                              <span className="text-[10px] font-semibold">B1</span>
                                            ) : (
                                              <Car className="h-3.5 w-3.5" />
                                            )
                                          ) : category === "Агуулах" ? (
                                            <Warehouse className="h-3.5 w-3.5" />
                                          ) : (
                                            <Building2 className="h-3.5 w-3.5" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-[color:var(--muted-text)] leading-tight">
                                            {tekst(t.turul || "Орон сууц")}
                                          </p>
                                          <p className="text-sm font-bold text-[color:var(--panel-text)] dark:text-white leading-tight">
                                            {tekst(t.toot)}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => (onEdit ? onEdit(medeelel) : setZasajBuiToot(true))}
                                        className="text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] cursor-pointer p-0.5"
                                        title="Засах"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                    </div>

                                    <div className="pt-1.5 border-t border-[color:var(--surface-border)] text-[10px] space-y-0.5">
                                      {/* Гараж or Агуулах: rename Байр into Тоот and show associated Орон сууц тоот. For Орон сууц: remove it completely */}
                                      {category !== "Орон сууц" && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[color:var(--muted-text)]">Тоот</span>
                                          <span className="text-[color:var(--panel-text)] font-medium">
                                            {associatedToot
                                              ? associatedToot.toLowerCase().includes("тоот")
                                                ? associatedToot
                                                : `${associatedToot} тоот`
                                              : "—"}
                                          </span>
                                        </div>
                                      )}

                                      {category === "Орон сууц" && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[color:var(--muted-text)]">
                                            Цахилгааны заалт
                                          </span>
                                          <span className="text-[color:var(--panel-text)]">
                                            {tekst(t.tsahilgaaniiZaalt ?? 0)}
                                          </span>
                                        </div>
                                      )}
                                      {(() => {
                                        const uldegdelVal =
                                          t.uldegdel !== undefined && t.uldegdel !== null
                                            ? t.uldegdel
                                            : t.ekhniiUldegdel;
                                        const hasUldegdel =
                                          uldegdelVal !== undefined &&
                                          uldegdelVal !== null &&
                                          uldegdelVal !== "" &&
                                          Number(uldegdelVal) !== 0;
                                        return (
                                          <div className="flex items-center justify-between">
                                            <span className="text-[color:var(--muted-text)]">Үлдэгдэл</span>
                                            <span
                                              className={
                                                hasUldegdel
                                                  ? "text-[color:var(--panel-text)] font-medium"
                                                  : "text-[color:var(--muted-text)]"
                                              }
                                            >
                                              {hasUldegdel ? `${formatNumber(uldegdelVal)}₮` : "Байхгүй"}
                                            </span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч Card (Edit button removed, Real data only) */}
                <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-[color:var(--surface-border)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-brand">
                          <Home className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[color:var(--panel-text)] dark:text-white">
                          Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч ({gerBuliinGishuud.length})
                        </h3>
                      </div>
                      {/* Байрын удирдлага урихыг хаасан бол нэмэх боломжгүй
                          — backend ч татгалздаг тул товчийг харуулахгүй. */}
                      {gerBuliinGishuunZovshoorson ? (
                        <button
                          type="button"
                          onClick={() => {
                            setZasajBuiGishuun(null);
                            setGishuunNemejBaina((n) => !n);
                          }}
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-theme transition hover:bg-theme/10 dark:hover:bg-theme/20 cursor-pointer"
                        >
                          {gishuunNemejBaina ? "Цуцлах" : "+ Гишүүн нэмэх"}
                        </button>
                      ) : (
                        <span
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-[color:var(--muted-text)]"
                          title="Нэмэлт тохиргоо → «Гэр бүлийн гишүүн урих»-аас идэвхжүүлнэ"
                        >
                          Урих боломж хаалттай
                        </span>
                      )}
                    </div>

                    <div className="h-[215px] pt-3 overflow-hidden">
                      {gishuunNemejBaina ? (
                        /* Шууд нэмэх форм — үндсэн хайрцаг дотор харагдана */
                        <div className="h-full overflow-y-auto pr-1">
                          <div className="rounded-xl border border-theme/30 bg-theme/5 p-3/25/10 space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                placeholder="Овог"
                                value={shineGishuun.ovog}
                                onChange={(e) =>
                                  setShineGishuun((g) => ({
                                    ...g,
                                    ovog: e.target.value,
                                  }))
                                }
                                className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                              />
                              <input
                                placeholder="Нэр"
                                value={shineGishuun.ner}
                                onChange={(e) =>
                                  setShineGishuun((g) => ({
                                    ...g,
                                    ner: e.target.value,
                                  }))
                                }
                                className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                              />
                              <input
                                placeholder="Утас *"
                                inputMode="numeric"
                                maxLength={8}
                                value={shineGishuun.utas}
                                onChange={(e) => {
                                  const num = e.target.value.replace(/\D/g, "").slice(0, 8);
                                  setShineGishuun((g) => ({
                                    ...g,
                                    utas: num,
                                  }));
                                }}
                                className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                              />
                              <div className="relative">
                                <select
                                  value={shineGishuun.kholboo}
                                  onChange={(e) =>
                                    setShineGishuun((g) => ({
                                      ...g,
                                      kholboo: e.target.value,
                                    }))
                                  }
                                  className="w-full h-8 appearance-none rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] pl-2.5 pr-7 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme cursor-pointer"
                                >
                                  <option value="Эхнэр/Нөхөр">Эхнэр/Нөхөр</option>
                                  <option value="Үр хүүхэд">Үр хүүхэд</option>
                                  <option value="Эцэг/Эх">Эцэг/Эх</option>
                                  <option value="Ах/Эгч/Дүү">Ах/Эгч/Дүү</option>
                                  <option value="Түрээслэгч">Түрээслэгч</option>
                                  <option value="Бусад">Бусад</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                              </div>
                              <div className="relative col-span-2">
                                <select
                                  value={shineGishuun.erkh}
                                  onChange={(e) =>
                                    setShineGishuun((g) => ({
                                      ...g,
                                      erkh: e.target.value,
                                    }))
                                  }
                                  className="w-full h-8 appearance-none rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] pl-2.5 pr-7 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme cursor-pointer"
                                >
                                  <option value="Харах + Төлөх">Харах + Төлөх</option>
                                  <option value="Харах">Зөвхөн харах</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <p className="text-[10px] text-[color:var(--muted-text)]">
                                Баталгаажуулалт шаардахгүй.
                              </p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setGishuunNemejBaina(false)}
                                  className="px-2.5 py-1 rounded-lg border border-[color:var(--surface-border)] text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] text-xs transition cursor-pointer"
                                >
                                  Цуцлах
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const ok = await gishuunNemye();
                                    if (ok) openSuccessOverlay("Гэр бүлийн гишүүн нэмэгдлээ");
                                  }}
                                  className="px-3 py-1 rounded-lg bg-theme hover:bg-theme/90 text-white text-xs font-medium transition cursor-pointer shadow-xs active:scale-95"
                                >
                                  Нэмэх
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : zasajBuiGishuun ? (
                        /* Гишүүн засах форм — үндсэн хайрцаг дотор */
                        <div className="h-full overflow-y-auto pr-1">
                          <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-3 space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[color:var(--surface-border)]">
                              <h4 className="text-xs font-semibold text-[color:var(--panel-text)]">
                                Мэдээлэл засах
                              </h4>
                              <button
                                type="button"
                                onClick={() => setZasajBuiGishuun(null)}
                                className="text-xs text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] cursor-pointer"
                              >
                                Болих
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">Овог</label>
                                <input
                                  placeholder="Овог"
                                  value={zasajBuiGishuun.ovog}
                                  onChange={(e) =>
                                    setZasajBuiGishuun((prev: any) => ({ ...prev, ovog: e.target.value }))
                                  }
                                  className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">Нэр</label>
                                <input
                                  placeholder="Нэр"
                                  value={zasajBuiGishuun.ner}
                                  onChange={(e) =>
                                    setZasajBuiGishuun((prev: any) => ({ ...prev, ner: e.target.value }))
                                  }
                                  className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">Утас *</label>
                                <input
                                  placeholder="Утас"
                                  inputMode="numeric"
                                  maxLength={8}
                                  value={zasajBuiGishuun.utas}
                                  onChange={(e) => {
                                    const num = e.target.value.replace(/\D/g, "").slice(0, 8);
                                    setZasajBuiGishuun((prev: any) => ({ ...prev, utas: num }));
                                  }}
                                  className="w-full h-8 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2.5 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">Холбоо</label>
                                <div className="relative">
                                  <select
                                    value={zasajBuiGishuun.kholboo}
                                    onChange={(e) =>
                                      setZasajBuiGishuun((prev: any) => ({ ...prev, kholboo: e.target.value }))
                                    }
                                    className="w-full h-8 appearance-none rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] pl-2.5 pr-7 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme cursor-pointer"
                                  >
                                    <option value="Эхнэр/Нөхөр">Эхнэр/Нөхөр</option>
                                    <option value="Үр хүүхэд">Үр хүүхэд</option>
                                    <option value="Эцэг/Эх">Эцэг/Эх</option>
                                    <option value="Ах/Эгч/Дүү">Ах/Эгч/Дүү</option>
                                    <option value="Түрээслэгч">Түрээслэгч</option>
                                    <option value="Бусад">Бусад</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                                </div>
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-[color:var(--muted-text)] block mb-0.5">Эрх</label>
                                <div className="relative">
                                  <select
                                    value={zasajBuiGishuun.erkh}
                                    onChange={(e) =>
                                      setZasajBuiGishuun((prev: any) => ({ ...prev, erkh: e.target.value }))
                                    }
                                    className="w-full h-8 appearance-none rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] pl-2.5 pr-7 text-xs text-[color:var(--panel-text)] outline-none focus:border-theme cursor-pointer"
                                  >
                                    <option value="Харах + Төлөх">Харах + Төлөх</option>
                                    <option value="Зөвхөн харах">Зөвхөн харах</option>
                                    <option value="Харах">Зөвхөн харах</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[color:var(--surface-border)]">
                              <button
                                type="button"
                                onClick={() => setZasajBuiGishuun(null)}
                                className="px-2.5 py-1 rounded-lg border border-[color:var(--surface-border)] text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] text-xs transition cursor-pointer"
                              >
                                Цуцлах
                              </button>
                              <button
                                type="button"
                                onClick={gishuunZasajKhadgalya}
                                disabled={gishuunKhadgaljBaina}
                                className="px-3 py-1 rounded-lg bg-theme hover:bg-theme/90 text-white text-xs font-medium transition cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {gishuunKhadgaljBaina ? "Хадгалж байна…" : "Хадгалах"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Table эсвэл хоосон төлөв — тогтмол өндөртэй */
                        <div className="h-full overflow-y-auto pr-1">
                          {gerBuliinGishuud.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-xs text-[color:var(--muted-text)]">
                              <Users className="mx-auto mb-2 h-7 w-7 text-[color:var(--muted-text)]" />
                              <p>Бүртгэлтэй гэр бүлийн гишүүн байхгүй байна</p>
                            </div>
                          ) : (
                            <table className="w-full text-[11px] sm:text-xs">
                              <thead>
                                <tr className="text-[10px] sm:text-[11px] text-[color:var(--muted-text)] border-b border-[color:var(--surface-border)] sticky top-0 bg-[color:var(--surface-bg)] z-10">
                                  <th className="pb-2 text-left font-normal w-6">№</th>
                                  <th className="pb-2 text-left font-normal">Овог нэр</th>
                                  <th className="pb-2 text-left font-normal">Утас</th>
                                  <th className="pb-2 text-left font-normal">Эрх</th>
                                  <th className="pb-2 text-center font-normal">Төлөв</th>
                                  <th className="pb-2 text-right font-normal">Үйлдэл</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[color:var(--surface-border)] text-[color:var(--panel-text)]">
                                {gerBuliinGishuud.map((g: any, i: number) => (
                                  <tr
                                    key={g._id || i}
                                    className="hover:bg-[color:var(--surface-hover)] transition"
                                  >
                                    <td className="py-2.5 font-normal text-[color:var(--panel-text)]">
                                      {i + 1}
                                    </td>
                                    <td className="py-2.5 font-normal text-[color:var(--panel-text)]">
                                      {g.ovog ? `${g.ovog[0]}. ` : ""}
                                      {tekst(g.ner)}
                                    </td>
                                    <td className="py-2.5 text-[color:var(--muted-text)] font-normal">
                                      {tekst(g.utas)}
                                    </td>
                                    <td className="py-2.5 text-[color:var(--muted-text)] font-normal">
                                      {tekst(
                                        g.gishuuniiErkh ||
                                        g.gishuuniiKholboo ||
                                        "Гэр бүлийн гишүүн",
                                      )}
                                    </td>
                                    <td className="py-2.5 text-center">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-theme/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                                        {tekst(g.gishuuniiTuluv) === "—"
                                          ? "Идэвхтэй"
                                          : tekst(g.gishuuniiTuluv)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTovchMenuGishuunId((cur) =>
                                            cur === (g._id || String(i)) ? null : (g._id || String(i))
                                          );
                                        }}
                                        className="rounded-lg p-1 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--muted-text)] cursor-pointer transition"
                                        title="Үйлдэл"
                                      >
                                        <MoreHorizontal className="h-4 w-4 inline" />
                                      </button>

                                      {tovchMenuGishuunId === (g._id || String(i)) && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] py-1 shadow-lg text-left text-xs animate-in fade-in zoom-in-95 duration-150"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentErkh = g.gishuuniiErkh || g.erkh;
                                              const nextErkh =
                                                currentErkh === "Зөвхөн харах" || currentErkh === "Харах"
                                                  ? "Харах + Төлөх"
                                                  : "Зөвхөн харах";
                                              gishuunErkhSoliyo(g._id, nextErkh);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
                                          >
                                            <ShieldCheck className="h-3.5 w-3.5 text-theme" />
                                            <span>
                                              {(g.gishuuniiErkh || g.erkh) === "Зөвхөн харах" ||
                                              (g.gishuuniiErkh || g.erkh) === "Харах"
                                                ? "«Харах + Төлөх» болгох"
                                                : "«Зөвхөн харах» болгох"}
                                            </span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTovchMenuGishuunId(null);
                                              setGishuunNemejBaina(false);
                                              setZasajBuiGishuun({
                                                _id: g._id,
                                                ovog: g.ovog || "",
                                                ner: g.ner || "",
                                                utas: g.utas || "",
                                                kholboo: g.gishuuniiKholboo || g.kholboo || "Бусад",
                                                erkh: g.gishuuniiErkh || g.erkh || "Харах + Төлөх",
                                              });
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
                                          >
                                            <Pencil className="h-3.5 w-3.5 text-[color:var(--muted-text)]" />
                                            <span>Мэдээлэл засах</span>
                                          </button>
                                          <div className="my-1 border-t border-[color:var(--surface-border)]" />
                                          <button
                                            type="button"
                                            onClick={() => gishuunUstgaya(g)}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 transition cursor-pointer"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Гишүүн хасах</span>
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-6 py-1.5 text-xs font-normal text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)] transition shadow-2xs active:scale-95 cursor-pointer"
            >
              Хаах
            </button>
            {/* Модал даяарх ганц Хадгалах — нээлттэй байгаа бүх засварыг
                нэг дор хадгална. Юу ч засаагүй бол идэвхгүй. */}
            <button
              type="button"
              onClick={bugdiigKhadgalya}
              disabled={bugdKhadgaljBaina}
              title="Нээлттэй засваруудыг хадгална"
              className="rounded-xl bg-theme px-6 py-1.5 text-xs font-normal text-white hover:bg-theme/90 disabled:opacity-40 disabled:hover:bg-theme transition shadow-2xs active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {bugdKhadgaljBaina ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ResidentDetailModal;
