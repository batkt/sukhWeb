"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  Phone,
  Mail,
  MoreHorizontal,
  Pencil,
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
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";

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
  /** Машины жагсаалт сүүлд татсанаасаа хойш өөрчлөгдсөн эсэх. */
  const [mashinOorchlogdson, setMashinOorchlogdson] = useState(false);

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
  const [omchFilter, setOmchFilter] = useState<"Бүгд" | "Орон сууц" | "Гараж" | "Агуулах">("Бүгд");

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
      setOmchFilter("Бүгд");
      setShineMashiniiDugaar("");
      setShineMashinToot("");
    } else {
      setMedeelel(null);
      setMashinJagsaalt([]);
      setMashinOorchlogdson(false);
      setTootJagsaalt([]);
      setOmchFilter("Бүгд");
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

  // Real family members only (no static data)
  const gerBuliinGishuud: any[] = useMemo(() => {
    return Array.isArray(medeelel?.gerBuliinGishuud)
      ? medeelel.gerBuliinGishuud
      : [];
  }, [medeelel]);

  // ── Handlers for Car (Direct input add & delete) ──
  const shuudMashinNemekh = () => {
    const cleaned = mashiniiDugaarTseverle(shineMashiniiDugaar);
    if (!cleaned) {
      openErrorOverlay("Улсын дугаараа оруулна уу");
      return;
    }
    if (!MASHINII_DUGAARIIN_ZAGVAR.test(cleaned)) {
      openErrorOverlay(
        "Улсын дугаар 4 тоо, 3 монгол кирилл үсэг байх ёстой (Жишээ: 1234УБА)"
      );
      return;
    }
    if (
      mashinJagsaalt.some(
        (m) => (m.mashiniiDugaar || "").trim().toUpperCase() === cleaned
      )
    ) {
      openErrorOverlay("Энэ улсын дугаар аль хэдийн бүртгэгдсэн байна");
      return;
    }
    const newCar = {
      _id: `car_${Date.now()}`,
      mashiniiDugaar: cleaned,
      ezenToot: shineMashinToot || tootJagsaalt[0]?.toot || "",
    };
    setMashinJagsaalt((prev) => [...prev, newCar]);
    setMashinOorchlogdson(true);
    setMedeelel((prev: any) => ({
      ...prev,
      mashinuud: [...(prev?.mashinuud || []), newCar],
    }));
    setShineMashiniiDugaar("");
  };

  const mashinUstgakh = (index: number) => {
    setMashinJagsaalt((prev) => prev.filter((_, i) => i !== index));
    setMashinOorchlogdson(true);
    setMedeelel((prev: any) => ({
      ...prev,
      mashinuud: (prev?.mashinuud || []).filter((_: any, i: number) => i !== index),
    }));
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
          className="my-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 transition-all text-slate-800 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Modal Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
            {/* Left: Avatar & Resident details */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-theme/10 text-theme dark:bg-theme/25 dark:text-theme">
                <User className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {tekst(medeelel?.ovog)} {tekst(medeelel?.ner)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tekst(medeelel?.utas)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tekst(medeelel?.mail)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status pill & Close button on the same line */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>
                  {tekst(medeelel?.tuluv) === "—" || !medeelel?.tuluv
                    ? "Идэвхтэй"
                    : tekst(medeelel.tuluv)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Хаах"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Modal Body (Direct 2x2 Grid, No Tabs) ── */}
          <div className="max-h-[76vh] overflow-y-auto p-5 sm:p-6 bg-slate-50/40 dark:bg-slate-950">
            {unshij && (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-xs text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-theme" />
                <span>Мэдээлэл уншиж байна...</span>
              </div>
            )}

            {!unshij && aldaa && (
              <div className="py-20 text-center text-xs text-rose-500 font-medium">
                {aldaa}
              </div>
            )}

            {!unshij && !aldaa && medeelel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Хувийн мэдээлэл Card (Edit button removed) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-theme dark:bg-theme/25 dark:text-theme">
                          <User className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Хувийн мэдээлэл
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          zasajBuiKhuvi ? setZasajBuiKhuvi(false) : khuviiZasya()
                        }
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-theme transition hover:bg-theme/10 dark:text-theme dark:hover:bg-theme/20"
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
                            <p className="text-[11px] text-slate-400 mb-1">Овог</p>
                            <input
                              value={khuviinMedeelel.ovog}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ovog: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Нэр</p>
                            <input
                              value={khuviinMedeelel.ner}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  ner: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">Утас</p>
                            <input
                              inputMode="numeric"
                              value={khuviinMedeelel.utas}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  utas: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400 mb-1">E-mail</p>
                            <input
                              type="email"
                              value={khuviinMedeelel.mail}
                              onChange={(e) =>
                                setKhuviinMedeelel((m) => ({
                                  ...m,
                                  mail: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-[11px] text-slate-400 mb-1">
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
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
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
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Овог
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {tekst(medeelel.ovog)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Нэр
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {tekst(medeelel.ner)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Байр
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {tekst(bairNer)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Утас
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {tekst(medeelel.utas)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          E-mail
                        </p>
                        <p
                          className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5 truncate"
                          title={tekst(medeelel.mail)}
                        >
                          {tekst(medeelel.mail)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Эрх
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {medeelel.erkh === "OrshinSuugch"
                            ? "Оршин суугч"
                            : tekst(medeelel.erkh)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Бүртгэгдсэн
                        </p>
                        <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                          {ognooKharuul(medeelel.createdAt)}
                        </p>
                      </div>

                      {medeelel.tailbar && (
                        <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Тайлбар
                          </p>
                          <p className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
                            {tekst(medeelel.tailbar)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Машин Card (Direct Input) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-theme dark:bg-theme/25 dark:text-theme">
                          <Car className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Машин ({mashinJagsaalt.length})
                        </h3>
                      </div>
                    </div>

                    {/* Direct car addition input */}
                    <div className="pt-3 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
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
                            className={`w-full h-9 pl-9 pr-3 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-semibold tracking-wider uppercase placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none transition shadow-2xs ${shineMashiniiDugaar.length === 0
                              ? "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-theme"
                              : !MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar)
                                ? "border-rose-500 dark:border-rose-500 text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/20"
                                : "border-emerald-500 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                              }`}
                          />
                        </div>
                        {tootJagsaalt.length > 1 && (
                          <div className="relative shrink-0">
                            <select
                              value={shineMashinToot}
                              onChange={(e) => setShineMashinToot(e.target.value)}
                              className="h-9 appearance-none pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-theme transition shadow-2xs cursor-pointer"
                            >
                              {tootJagsaalt.map((t, i) => (
                                <option key={i} value={t.toot}>
                                  {t.toot} тоот
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={shuudMashinNemekh}
                          disabled={!MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar)}
                          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-theme hover:bg-theme/90 disabled:opacity-40 text-white text-xs font-medium shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Нэмэх</span>
                        </button>
                      </div>
                      {shineMashiniiDugaar.length > 0 && !MASHINII_DUGAARIIN_ZAGVAR.test(shineMashiniiDugaar) && (
                        <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-in fade-in duration-200">
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
                        <p className="py-5 text-center text-xs text-slate-400">
                          Бүртгэлтэй машин одоогоор алга байна.
                        </p>
                      ) : (
                        mashinJagsaalt.map((m: any, idx: number) => (
                          <div
                            key={m._id || idx}
                            className="flex items-center justify-between rounded-xl border border-slate-100/90 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800/60 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme/15 text-theme dark:bg-theme/25 dark:text-theme">
                                <Car className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {tekst(m.mashiniiDugaar)}
                                </h4>
                                {m.ezenToot && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Тоот: {m.ezenToot}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => mashinUstgakh(idx)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Гараж / B1 Card (Edit implemented) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-theme dark:bg-theme/25 dark:text-theme">
                          <Warehouse className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
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
                            ? "border-theme bg-theme/10 text-theme dark:bg-theme/20 dark:text-theme"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}
                        >
                          <Pencil className="h-3 w-3 text-slate-500" />
                          <span>{zasajBuiToot ? "Болих" : "Засах"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Edit Mode View for Граш / B1 */}
                    {zasajBuiToot ? (
                      <div className="pt-4 space-y-3">
                        {tootJagsaalt.length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-3">
                            Одоогоор бүртгэлтэй тоот/граш алга.
                          </p>
                        )}
                        {tootJagsaalt.map((t, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                Хаяг #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => tootUstgakh(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Устгах"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Тоот
                                </label>
                                <input
                                  type="text"
                                  value={t.toot || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "toot", e.target.value)
                                  }
                                  placeholder="101"
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Төрөл
                                </label>
                                <div className="relative">
                                  <select
                                    value={t.turul || "Орон сууц"}
                                    onChange={(e) =>
                                      tootFieldSolikh(idx, "turul", e.target.value)
                                    }
                                    className="w-full h-8 appearance-none pl-2 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs cursor-pointer"
                                  >
                                    <option value="Орон сууц">Орон сууц</option>
                                    <option value="Гараж">Гараж</option>
                                    <option value="Граш">Граш</option>
                                    <option value="B1">B1</option>
                                    <option value="Агуулах">Агуулах</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Давхар
                                </label>
                                <input
                                  type="text"
                                  value={t.davkhar || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "davkhar", e.target.value)
                                  }
                                  placeholder="1"
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Цахилгааны заалт
                                </label>
                                <input
                                  type="number"
                                  value={t.tsahilgaaniiZaalt ?? 0}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "tsahilgaaniiZaalt", Number(e.target.value))
                                  }
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                                />
                              </div>
                            </div>
                            {getTurulCategory(t) !== "Орон сууц" && (
                              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                <label className="text-[10px] text-slate-400 block mb-0.5">
                                  Холбоотой тоот (Орон сууц)
                                </label>
                                <input
                                  type="text"
                                  value={t.linkedAptToot || ""}
                                  onChange={(e) =>
                                    tootFieldSolikh(idx, "linkedAptToot", e.target.value)
                                  }
                                  placeholder={getAssociatedAptToot(t) || "101"}
                                  className="w-full max-w-xs h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
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
                              { key: "Бүгд", label: "Бүгд", count: tootJagsaalt.length },
                              { key: "Орон сууц", label: "Орон сууц", count: oronSuutsCount },
                              { key: "Гараж", label: "Гараж", count: garajCount },
                              { key: "Агуулах", label: "Агуулах", count: aguulakhCount },
                            ] as const
                          ).map((tab) => {
                            const isActive = omchFilter === tab.key;
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setOmchFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${isActive
                                    ? "bg-theme/10 text-theme dark:bg-theme/20 dark:text-theme border border-theme/30"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 border border-transparent"
                                  }`}
                              >
                                <span>{tab.label}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive
                                      ? "bg-theme text-white"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                                >
                                  {tab.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {tootJagsaalt.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            <Warehouse className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
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
                          <div className="py-8 text-center text-xs text-slate-400">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                              {omchFilter} бүртгэлгүй байна
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/30 flex flex-col justify-between space-y-3"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-theme/10 text-theme dark:bg-theme/30 dark:text-theme font-bold text-xs">
                                        {category === "Гараж" ? (
                                          isB1 && t.turul === "B1" ? (
                                            <span className="text-[11px] font-semibold">B1</span>
                                          ) : (
                                            <Car className="h-4 w-4" />
                                          )
                                        ) : category === "Агуулах" ? (
                                          <Warehouse className="h-4 w-4" />
                                        ) : (
                                          <Building2 className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                          {tekst(t.turul || "Орон сууц")}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-white">
                                          {tekst(t.toot)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => (onEdit ? onEdit(medeelel) : setZasajBuiToot(true))}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                      title="Засах"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] space-y-1">
                                    {/* Гараж or Агуулах: rename Байр into Тоот and show associated Орон сууц тоот. For Орон сууц: remove it completely */}
                                    {category !== "Орон сууц" && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Тоот</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                                          {associatedToot
                                            ? associatedToot.toLowerCase().includes("тоот")
                                              ? associatedToot
                                              : `${associatedToot} тоот`
                                            : "—"}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">
                                        Цахилгааны заалт
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-200">
                                        {tekst(t.tsahilgaaniiZaalt ?? 0)}
                                      </span>
                                    </div>
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
                                          <span className="text-slate-400">Үлдэгдэл</span>
                                          <span
                                            className={
                                              hasUldegdel
                                                ? "text-slate-700 dark:text-slate-200 font-medium"
                                                : "text-slate-400 dark:text-slate-500"
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
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч Card (Edit button removed, Real data only) */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme/10 text-theme dark:bg-theme/25 dark:text-theme">
                          <Home className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          Гэр бүлийн гишүүд / Нэмэлт хэрэглэгч ({gerBuliinGishuud.length})
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGishuunNemejBaina((n) => !n)}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-theme transition hover:bg-theme/10 dark:text-theme dark:hover:bg-theme/20"
                      >
                        {gishuunNemejBaina ? "Цуцлах" : "+ Гишүүн нэмэх"}
                      </button>
                    </div>

                    {/* Шууд нэмэх форм — баталгаажуулалтгүй */}
                    {gishuunNemejBaina && (
                      <div className="mt-3 rounded-xl border border-theme/30 bg-theme/5 p-3 dark:border-theme/25 dark:bg-theme/10">
                        <div className="grid grid-cols-2 gap-2.5">
                          <input
                            placeholder="Овог"
                            value={shineGishuun.ovog}
                            onChange={(e) =>
                              setShineGishuun((g) => ({
                                ...g,
                                ovog: e.target.value,
                              }))
                            }
                            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                            className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                              className="w-full h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                            >
                              <option value="Эхнэр/Нөхөр">Эхнэр/Нөхөр</option>
                              <option value="Үр хүүхэд">Үр хүүхэд</option>
                              <option value="Эцэг/Эх">Эцэг/Эх</option>
                              <option value="Ах/Эгч/Дүү">Ах/Эгч/Дүү</option>
                              <option value="Түрээслэгч">Түрээслэгч</option>
                              <option value="Бусад">Бусад</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
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
                              className="w-full h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-xs text-slate-800 outline-none focus:border-theme dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                            >
                              <option value="Харах + Төлөх">Харах + Төлөх</option>
                              <option value="Харах">Зөвхөн харах</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-1">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Баталгаажуулалт шаардахгүй шууд идэвхжинэ.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setGishuunNemejBaina(false)}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 text-xs transition cursor-pointer"
                            >
                              Цуцлах
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await gishuunNemye();
                                if (ok) openSuccessOverlay("Гэр бүлийн гишүүн нэмэгдлээ");
                              }}
                              className="px-3.5 py-1 rounded-lg bg-theme hover:bg-theme/90 text-white text-xs font-medium transition cursor-pointer shadow-xs active:scale-95"
                            >
                              Нэмэх
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 overflow-x-auto">
                      {gerBuliinGishuud.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          <Users className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                          <p>Бүртгэлтэй гэр бүлийн гишүүн байхгүй байна</p>
                        </div>
                      ) : (
                        <table className="w-full text-[11px] sm:text-xs">
                          <thead>
                            <tr className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                              <th className="pb-2 text-left font-normal w-6">№</th>
                              <th className="pb-2 text-left font-normal">Овог нэр</th>
                              <th className="pb-2 text-left font-normal">Утас</th>
                              <th className="pb-2 text-left font-normal">Эрх</th>
                              <th className="pb-2 text-center font-normal">Төлөв</th>
                              <th className="pb-2 text-right font-normal">Үйлдэл</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                            {gerBuliinGishuud.map((g: any, i: number) => (
                              <tr
                                key={g._id || i}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                              >
                                <td className="py-2.5 font-normal text-slate-800 dark:text-slate-100">
                                  {i + 1}
                                </td>
                                <td className="py-2.5 font-normal text-slate-800 dark:text-slate-100">
                                  {g.ovog ? `${g.ovog[0]}. ` : ""}
                                  {tekst(g.ner)}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300 font-normal">
                                  {tekst(g.utas)}
                                </td>
                                <td className="py-2.5 text-slate-600 dark:text-slate-300 font-normal">
                                  {tekst(
                                    g.gishuuniiErkh ||
                                    g.gishuuniiKholboo ||
                                    "Гэр бүлийн гишүүн",
                                  )}
                                </td>
                                <td className="py-2.5 text-center">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    {tekst(g.gishuuniiTuluv) === "—"
                                      ? "Идэвхтэй"
                                      : tekst(g.gishuuniiTuluv)}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    type="button"
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    <MoreHorizontal className="h-4 w-4 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/90 bg-white px-6 py-1.5 text-xs font-normal text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-2xs active:scale-95 cursor-pointer"
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
