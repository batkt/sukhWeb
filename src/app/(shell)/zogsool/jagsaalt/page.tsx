"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Car,
  Copy,
  Clock,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronDown,
  Info,
  ExternalLink,
  MoreHorizontal,
  X,
  Download,
  Receipt,
  Banknote,
  CreditCard,
  Landmark,
  Tag,
  Wallet,
  ArrowRight,
  TrendingUp,
  Ban,
  ShieldCheck,
  Loader2,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ConfigProvider } from "antd";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import formatNumber from "../../../../../tools/function/formatNumber";
import { toast } from "react-hot-toast";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { StandardPagination } from "@/components/ui/StandardTable";
import { PaymentPopup } from "../camera/PaymentPopup";

/** Улсын дугаар: эхний 4 нь тоо, сүүлийн 3 нь монгол кирилл үсэг (ж: 1234УБА) */
const MASHINII_DUGAARIIN_ZAGVAR = /^\d{4}[А-ЯӨҮЁ]{3}$/;

/** Латин гараас бичсэн ч монгол кирилл рүү хөрвүүлнэ (бусад цонхтой ижил дүрэм) */
const LATIN_KIRILL: Record<string, string> = {
  A: "А", B: "В", C: "С", D: "Д", E: "Е", G: "Г", H: "Н", I: "И",
  J: "Ж", K: "К", L: "Л", M: "М", N: "Н", O: "О", P: "Р", Q: "Ө",
  R: "Р", S: "С", T: "Т", U: "У", V: "В", W: "В", X: "Х", Y: "Ү",
  Z: "З",
};

/**
 * Оруулсан текстийг улсын дугаарын хэлбэрт цэвэрлэнэ: том үсэг болгож,
 * зай авч, эхний 4 байрлалд зөвхөн тоо, сүүлийн 3-д зөвхөн кирилл үсэг үлдээнэ.
 */
function mashiniiDugaarTseverle(orolt: string): string {
  const utga = orolt.toUpperCase().replace(/\s/g, "").slice(0, 7);
  const toonuud = utga.slice(0, 4).replace(/\D/g, "");
  const useguud = Array.from(utga.slice(4))
    .map((useg) => LATIN_KIRILL[useg] || useg)
    .filter((useg) => /^[А-ЯӨҮЁ]$/.test(useg))
    .join("");
  return toonuud + useguud;
}

/** Excel-ээр олноор блоклоход шаардагдах баганууд */
const BLOCK_EXCEL_BAGANA = ["Улсын дугаар", "Шалтгаан"] as const;

/** Excel-ээс уншсан нэг мөр — хадгалахын өмнө хэрэглэгчид харуулна */
interface BlockExcelMur {
  /** Excel дэх мөрийн дугаар (гарчиг 1-р мөр тул +2) */
  excelMur: number;
  dugaar: string;
  tailbar: string;
  aldaanuud: string[];
}

const RealTimeDuration = ({
  orsonTsag,
  garsanTsag,
  niitKhugatsaa,
}: {
  orsonTsag?: string;
  garsanTsag?: string;
  niitKhugatsaa?: number;
}) => {
  const [now, setNow] = useState(moment());
  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);
  if (!orsonTsag) return <span />;
  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));
  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();
  if (!garsanTsag) {
    return (
      <span className="text-[11px] font-mono">
        {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} :{" "}
        {String(seconds).padStart(2, "0")}
      </span>
    );
  }
  const khugatsaaMin =
    niitKhugatsaa ?? Math.max(0, Math.ceil(diff.asMinutes()));
  const h = Math.floor(khugatsaaMin / 60);
  const m = khugatsaaMin % 60;
  return (
    <span className="text-[10px] uppercase tracking-wide">
      {h > 0 ? `${h} цаг ${m} мин` : `${m} мин`}
    </span>
  );
};

interface Vehicle {
  _id?: string;
  mashiniiDugaar: string;
  niitDun?: number;
  zurchil?: string;
  turul?: string; // Type
  toot?: string;
  ezenToot?: string;
  orshinSuugchiinNer?: string;
  mashin?: {
    turul?: string;
    ezenToot?: string;
    ezemshigchiinNer?: string;
    orshinSuugchiinId?: string;
  };
  tuukh?: Array<{
    tsagiinTuukh?: Array<{
      orsonTsag?: string;
      garsanTsag?: string;
    }>;
    turul?: string;
    khungulult?: string;
    tulsunDun?: number;
    ebarimtId?: string;
    tuluv?: number;
    garsanKhaalga?: string;
    niitKhugatsaa?: number;
    burtgesenAjiltaniiNer?: string;
    uneguiGarsan?: boolean;
    tulbur?: Array<{
      turul?: string;
      dun?: number;
    }>;
  }>;
}


export default function Jagsaalt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const { searchTerm, setSearchTerm } = useSearch();
  const [page, setPage] = useState(1);
  const pageSize = 1000;

  const [durationFilter, setDurationFilter] = useState("latest_out");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenueDateRange, setRevenueDateRange] = useState<[string | null, string | null] | undefined>(() => {
    const today = moment().format("YYYY-MM-DD");
    return [today, today];
  });
  const [revenueListData, setRevenueListData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Хуулагдлаа");
  };

  // ── Машин блоклох ─────────────────────────────────────────────────────────
  const [blockModal, setBlockModal] = useState<{
    dugaar: string;
    tailbar: string;
  } | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockSearch, setBlockSearch] = useState("");

  // Excel-ээр олноор блоклох — уншсан мөрүүдийг эхлээд урьдчилан харуулна
  const excelFileRef = useRef<HTMLInputElement | null>(null);
  const [excelMuruud, setExcelMuruud] = useState<BlockExcelMur[]>([]);
  const [excelFileNer, setExcelFileNer] = useState("");
  const [excelUnshij, setExcelUnshij] = useState(false);
  const [excelKhadgalj, setExcelKhadgalj] = useState(false);
  const [excelYavts, setExcelYavts] = useState(0);

  // null = explicitly cleared (no date filter), undefined = not yet init
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | null | undefined
  >(getDefaultDateRange);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (dateRange === null) return { start: "", end: "" };
    const range = dateRange || getDefaultDateRange();
    return {
      start: range[0] || "",
      end: range[1] || "",
    };
  }, [dateRange]);

  const shouldFetch = isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: vehiclesData, mutate } = useSWR(
    shouldFetch
      ? [
        "/zogsoolUilchluulegchJagsaalt",
        token,
        ajiltan?.baiguullagiinId,
        effectiveBarilgiinId,
        page,
        searchTerm,
        rangeStart,
        rangeEnd,
        durationFilter,
        statusFilter,
        paymentMethodFilter,
      ]
      : null,
    async ([
      url,
      tkn,
      bId,
      barId,
      pg,
      search,
      start,
      end,
      dur,
      status,
      payMethod,
    ]): Promise<any> => {
      // Build query similar to fetchList in camera page
      const query: any = {
        baiguullagiinId: bId,
        barilgiinId: barId || undefined,
      };
      if (start && end) {
        query.createdAt = {
          $gte: `${start} 00:00:00`,
          $lte: `${end} 23:59:59`,
        };
      }

      if (search) {
        query.mashiniiDugaar = { $regex: search, $options: "i" };
      }

      if (status === "active") {
        query["tuukh.garsanKhaalga"] = { $exists: false };
      } else if (status === "cancelled") {
        query.$or = [
          { "tuukh.tuluv": -2 },
          { "tuukh.tuluv": -1 },
          { "tuukh.0.tuluv": -2 },
          { "tuukh.0.tuluv": -1 },
          { gereeniiTuluv: "Цуцлагдсан" },
          { "geree.gereeniiTuluv": "Цуцлагдсан" }
        ];
      } else if (status === "paid") {
        query["tuukh.tuluv"] = { $in: [1, 2] };
      } else if (status === "unpaid") {
        query.$and = [
          {
            $or: [
              { "tuukh.tuluv": -4 },
              {
                "tuukh.tuluv": 0,
                niitDun: { $gt: 0 },
                "tuukh.garsanKhaalga": { $exists: true }
              }
            ]
          }
        ];
      } else if (status === "free") {
        query["tuukh.garsanKhaalga"] = { $exists: true };
        query.niitDun = 0;
        query["tuukh.0.tuluv"] = { $nin: [-1, -2] };
      }

      if (payMethod && payMethod !== "all") {
        if (payMethod === "qpay") {
          query["tuukh.0.tulbur.turul"] = { $in: ["qpay", "QPay", "Qpay", "qPay", "GadaaQR", "DotorQR", "bankQR", "toki", "киоск", "tseneglelt"] };
        } else if (payMethod === "card") {
          query["tuukh.0.tulbur.turul"] = { $in: ["khaan", "card", "Card", "Khaan", "Карт", "карт", "golomt", "tdb", "has", "Golomt", "TDB", "Has", "pos", "POS"] };
        } else if (payMethod === "cash") {
          query["tuukh.0.tulbur.turul"] = { $in: ["belen", "cash", "Cash", "Belen", "Бэлэн", "бэлэн"] };
        } else if (payMethod === "transfer") {
          query["tuukh.0.tulbur.turul"] = { $in: ["khariltsakh", "transfer", "Transfer", "Khariltsakh", "Dans", "dans", "Dansaar", "Дансаар", "дансаар"] };
        }
      }

      const sortObj =
        dur === "longest"
          ? { "tuukh.0.niitKhugatsaa": -1 }
          : dur === "latest_in"
            ? {
              "tuukh.tsagiinTuukh.garsanTsag": 1,
              niitDun: 1,
              "tuukh.tuluv": 1,
              "tuukh.tsagiinTuukh.orsonTsag": -1,
              zurchil: 1,
            }
            : { "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 };

      const resp = await uilchilgee(tkn).get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: pageSize,
          query: JSON.stringify(query),
          order: JSON.stringify(sortObj),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const vehicles: Vehicle[] = useMemo(() => {
    const list = vehiclesData?.jagsaalt || [];
    // Normalize: ensure turul is populated at root level from mashin object
    return list.map((v: any) => {
      const mashin = v.mashin;
      const hasResidentData = mashin?.ezenToot || mashin?.orshinSuugchiinId || mashin?.ezemshigchiinNer;
      const mashinTurul = mashin?.turul;
      
      // If root turul is missing but mashin has it, or mashin has resident indicators
      if (!v.turul && (mashinTurul || hasResidentData)) {
        return {
          ...v,
          turul: mashinTurul || "Оршин суугч",
          toot: v.toot || mashin?.ezenToot,
          orshinSuugchiinNer: v.orshinSuugchiinNer || mashin?.ezemshigchiinNer,
        };
      }
      return v;
    });
  }, [vehiclesData]);

  // Force revalidate when searchTerm changes
  useEffect(() => {
    if (shouldFetch) {
      mutate();
    }
  }, [searchTerm, mutate, shouldFetch]);

  // Vehicles are already filtered by search on the API side

  const totalPages = Math.ceil((vehiclesData?.niitMur || 0) / pageSize);

  // ── Блоклосон машины жагсаалт ─────────────────────────────────────────────
  // Хаалганы SDK нь blockMashin цуглуулгаас { dugaar, barilgiinId }-аар
  // шалгаж машиныг оруулахгүй тул энд яг тэр цуглуулга руу бичнэ.
  const { data: blockData, mutate: blockMutate } = useSWR(
    shouldFetch
      ? ["/blockMashin", token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000,
          query: JSON.stringify({
            baiguullagiinId: bId,
            ...(barId ? { barilgiinId: barId } : {}),
          }),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const blockedMap = useMemo(() => {
    const map = new Map<string, any>();
    (blockData?.jagsaalt || []).forEach((b: any) => {
      const key = String(b?.dugaar || "").trim().toUpperCase();
      if (key) map.set(key, b);
    });
    return map;
  }, [blockData]);

  const blockolsonEsekh = useCallback(
    (dugaar?: string) =>
      blockedMap.get(String(dugaar || "").trim().toUpperCase()) || null,
    [blockedMap],
  );

  const blockList = useMemo(() => {
    const list = [...(blockData?.jagsaalt || [])];
    list.sort((a: any, b: any) =>
      String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")),
    );
    const q = blockSearch.trim().toUpperCase();
    if (!q) return list;
    return list.filter((b: any) =>
      `${b?.dugaar || ""} ${b?.tailbar || ""}`.toUpperCase().includes(q),
    );
  }, [blockData, blockSearch]);

  const blokloyo = useCallback(async () => {
    if (!blockModal || !token) return;
    const dugaar = blockModal.dugaar.trim().toUpperCase();
    if (!dugaar) {
      toast.error("Улсын дугаар оруулна уу");
      return;
    }
    if (!MASHINII_DUGAARIIN_ZAGVAR.test(dugaar)) {
      toast.error("Улсын дугаар 4 тоо + 3 монгол кирилл үсэг байх ёстой");
      return;
    }
    const tailbar = blockModal.tailbar.trim();
    if (!tailbar) {
      toast.error("Блоклох шалтгааныг заавал бөглөнө үү");
      return;
    }
    if (blockedMap.has(dugaar)) {
      toast.error(`${dugaar} аль хэдийн блоклогдсон байна`);
      return;
    }
    // Хаалганы SDK нь { dugaar, barilgiinId }-аар шалгадаг тул барилгагүй
    // хадгалсан блок хаалган дээр хүчин төгөлдөр болохгүй.
    if (!effectiveBarilgiinId) {
      toast.error("Эхлээд барилга сонгоно уу");
      return;
    }
    setBlockSaving(true);
    try {
      await uilchilgee(token).post("/blockMashin", {
        baiguullagiinId: ajiltan?.baiguullagiinId,
        ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
        dugaar,
        tailbar,
        burtgesenAjiltaniiId: ajiltan?._id,
        burtgesenAjiltaniiNer: ajiltan?.ner,
      });
      toast.success(`${dugaar} дугаартай машиныг блоклолоо`);
      setBlockModal({ dugaar: "", tailbar: "" });
      blockMutate();
    } catch (e) {
      console.error(e);
      toast.error("Блоклоход алдаа гарлаа");
    } finally {
      setBlockSaving(false);
    }
  }, [blockModal, blockedMap, token, ajiltan, effectiveBarilgiinId, blockMutate]);

  const blockGargaya = useCallback(
    async (blockRecord: any) => {
      if (!token || !blockRecord?._id) return;
      try {
        await uilchilgee(token).delete(`/blockMashin/${blockRecord._id}`);
        toast.success(`${blockRecord.dugaar} блокоос гаргалаа`);
        blockMutate();
      } catch (e) {
        console.error(e);
        toast.error("Блокоос гаргахад алдаа гарлаа");
      }
    },
    [token, blockMutate],
  );

  const excelZuvMuruud = useMemo(
    () => excelMuruud.filter((mur) => mur.aldaanuud.length === 0),
    [excelMuruud],
  );

  const excelTsutslaya = useCallback(() => {
    setExcelMuruud([]);
    setExcelFileNer("");
    setExcelYavts(0);
  }, []);

  /** Хоосон загвар татах — хэрэглэгч ямар багана хэрэгтэйг эндээс мэднэ */
  const excelZagvarTatya = useCallback(async () => {
    // xlsx хүнд тул зөвхөн хэрэгтэй үед нь ачаална
    const XLSX = await import("xlsx");
    const jishee = [
      { "Улсын дугаар": "1234УБА", Шалтгаан: "Төлбөрөө төлөөгүй" },
    ];
    const ws = XLSX.utils.json_to_sheet(jishee, {
      header: BLOCK_EXCEL_BAGANA as unknown as string[],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Блоклох машин");
    XLSX.writeFile(wb, "Блоклох_машин_загвар.xlsx");
  }, []);

  /** Файлыг уншиж шалгаад урьдчилан харах хүснэгт рүү тавина (хадгалахгүй) */
  const excelFileSongoyo = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Ижил файлыг дахин сонгоход onChange асахын тулд утгыг тэглэнэ
      e.target.value = "";
      if (!file) return;

      setExcelUnshij(true);
      setExcelFileNer(file.name);

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const XLSX = await import("xlsx");
          const wb = XLSX.read(evt.target?.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const tuukhii: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

          if (tuukhii.length === 0) {
            toast.error("Excel файл хоосон байна");
            setExcelMuruud([]);
            return;
          }

          const uzegdsen = new Set<string>();
          const muruud: BlockExcelMur[] = tuukhii.map((mur, i) => {
            const dugaar = mashiniiDugaarTseverle(
              String(mur["Улсын дугаар"] ?? "").trim(),
            );
            const tailbar = String(mur["Шалтгаан"] ?? "").trim();
            const aldaanuud: string[] = [];

            if (!dugaar) {
              aldaanuud.push("Улсын дугаар хоосон");
            } else if (!MASHINII_DUGAARIIN_ZAGVAR.test(dugaar)) {
              aldaanuud.push("4 тоо + 3 монгол кирилл үсэг байх ёстой");
            } else if (blockedMap.has(dugaar)) {
              aldaanuud.push("Аль хэдийн блоклогдсон");
            } else if (uzegdsen.has(dugaar)) {
              aldaanuud.push("Файлд давхардсан");
            }

            if (!tailbar) aldaanuud.push("Шалтгаан хоосон");
            if (dugaar) uzegdsen.add(dugaar);

            return { excelMur: i + 2, dugaar, tailbar, aldaanuud };
          });

          setExcelMuruud(muruud);

          const buruu = muruud.length - muruud.filter((m) => m.aldaanuud.length === 0).length;
          if (buruu > 0) {
            toast.error(`${muruud.length} мөрөөс ${buruu} мөрөнд алдаа байна`);
          } else {
            toast.success(`${muruud.length} мөр уншигдлаа — шалгаад хадгална уу`);
          }
        } catch {
          toast.error("Excel файл уншихад алдаа гарлаа");
          setExcelMuruud([]);
        } finally {
          setExcelUnshij(false);
        }
      };
      reader.onerror = () => {
        toast.error("Файл уншихад алдаа гарлаа");
        setExcelUnshij(false);
      };
      reader.readAsBinaryString(file);
    },
    [blockedMap],
  );

  /**
   * Хэрэглэгч урьдчилан харснаа баталгаажуулсны дараа л хадгална.
   * Сервер тал багц endpoint-гүй тул мөр тутамд /blockMashin руу дараалуулж
   * илгээнэ — зэрэг илгээвэл давхардсан бичлэг үүсэх эрсдэлтэй.
   */
  const excelBlokloyo = useCallback(async () => {
    if (!token) return;
    if (excelZuvMuruud.length === 0) {
      toast.error("Блоклох боломжтой мөр алга");
      return;
    }
    if (!effectiveBarilgiinId) {
      toast.error("Эхлээд барилга сонгоно уу");
      return;
    }

    setExcelKhadgalj(true);
    setExcelYavts(0);
    let amjiltgui = 0;

    for (let i = 0; i < excelZuvMuruud.length; i++) {
      const mur = excelZuvMuruud[i];
      try {
        await uilchilgee(token).post("/blockMashin", {
          baiguullagiinId: ajiltan?.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          dugaar: mur.dugaar,
          tailbar: mur.tailbar,
          burtgesenAjiltaniiId: ajiltan?._id,
          burtgesenAjiltaniiNer: ajiltan?.ner,
        });
      } catch (err) {
        console.error(err);
        amjiltgui += 1;
      }
      setExcelYavts(i + 1);
    }

    setExcelKhadgalj(false);
    blockMutate();

    const amjilttai = excelZuvMuruud.length - amjiltgui;
    if (amjilttai > 0) toast.success(`${amjilttai} машиныг блоклолоо`);
    if (amjiltgui > 0) {
      toast.error(`${amjiltgui} мөр амжилтгүй боллоо`);
    } else {
      excelTsutslaya();
    }
  }, [
    token,
    excelZuvMuruud,
    effectiveBarilgiinId,
    ajiltan,
    blockMutate,
    excelTsutslaya,
  ]);

  const fetchRevenueData = useCallback(async (start: string, end: string) => {
    if (!token || !start || !end) return;
    setRevenueLoading(true);
    try {
      const resp = await uilchilgee(token).get("/zogsoolUilchluulegchJagsaalt", {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000,
          query: JSON.stringify({
            baiguullagiinId: ajiltan?.baiguullagiinId,
            ...(effectiveBarilgiinId ? { barilgiinId: effectiveBarilgiinId } : {}),
            createdAt: { $gte: `${start} 00:00:00`, $lte: `${end} 23:59:59` },
          }),
        },
      });
      setRevenueListData(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRevenueLoading(false);
    }
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const [start, end] = revenueDateRange || [null, null];
    if (start && end) fetchRevenueData(start, end);
  }, [revenueModalOpen, revenueDateRange, fetchRevenueData]);

  useEffect(() => {
    if (!revenueModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setRevenueModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [revenueModalOpen]);

  useEffect(() => {
    if (blockModal) return;
    setExcelMuruud([]);
    setExcelFileNer("");
    setExcelYavts(0);
  }, [blockModal]);

  useEffect(() => {
    if (!blockModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blockSaving && !excelKhadgalj)
        setBlockModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [blockModal, blockSaving, excelKhadgalj]);

  const revenueModalBreakdown = useMemo(() => {
    const allList = revenueListData?.jagsaalt || [];
    const methodLabels: Record<string, string> = {
      belen: "Бэлэн", cash: "Бэлэн", khaan: "Карт",
      khariltsakh: "Дансаар", transfer: "Дансаар", qpay: "QPay",
      khungulult: "Хөнгөлөлт", discount: "Хөнгөлөлт",
    };
    const methodIcons: Record<string, React.ReactNode> = {
      belen: <Banknote className="w-4 h-4" />, cash: <Banknote className="w-4 h-4" />,
      khaan: <CreditCard className="w-4 h-4" />, khariltsakh: <ArrowRight className="w-4 h-4" />,
      transfer: <ArrowRight className="w-4 h-4" />, qpay: <Landmark className="w-4 h-4" />,
      khungulult: <Tag className="w-4 h-4" />, discount: <Tag className="w-4 h-4" />,
    };
    const methodColors: Record<string, string> = {
      belen: "bg-emerald-500", cash: "bg-emerald-500", khaan: "bg-sky-500",
      khariltsakh: "bg-violet-500", transfer: "bg-violet-500", qpay: "bg-amber-500",
      khungulult: "bg-rose-500", discount: "bg-rose-500",
    };
    const methodMap: Record<string, { amount: number; count: number }> = {};
    allList.forEach((t: any) => {
      (t.tuukh?.[0]?.tulbur || []).forEach((p: any) => {
        const rawTurul = p.turul || "unknown";
        const m = (rawTurul === "discount" || rawTurul === "Хөнгөлөлт") ? "khungulult" : rawTurul;
        if (!methodMap[m]) methodMap[m] = { amount: 0, count: 0 };
        methodMap[m].amount += Math.abs(p.dun || 0);
        methodMap[m].count += 1;
      });
    });
    const totalAmount = Object.values(methodMap).reduce((s, v) => s + v.amount, 0);
    const items = Object.entries(methodMap)
      .map(([key, val]) => ({
        key,
        name: methodLabels[key] || key,
        icon: methodIcons[key] || <Wallet className="w-4 h-4" />,
        color: methodColors[key] || "bg-slate-500",
        amount: val.amount,
        count: val.count,
        pct: totalAmount > 0 ? ((val.amount / totalAmount) * 100).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.amount - a.amount);
    return { items, totalAmount };
  }, [revenueListData]);

  const downloadExcel = async () => {
    if (!vehicles.length) {
      toast.error("Татаж авах мэдээлэл байхгүй");
      return;
    }
    // Loaded here rather than imported: xlsx is ~400 kB and is only needed on
    // an actual export, so it stays out of the route's entry chunk.
    const XLSX = await import("xlsx");

    const STATUS_LABEL: Record<number, string> = {
      1: "Төлсөн", 2: "Төлсөн", 0: "Идэвхтэй", [-2]: "Идэвхтэй", [-4]: "Төлбөртэй",
    };

    const rows: any[] = vehicles.map((t, i) => {
      const mur = t.tuukh?.[0];
      const tsag = mur?.tsagiinTuukh?.[0];
      const orsonTsag = tsag?.orsonTsag;
      const garsanTsag = tsag?.garsanTsag;
      const niitDun = t.niitDun || 0;
      const tuluv = mur?.tuluv;
      const isCurrentlyIn = !mur?.garsanKhaalga;

      // Calculate payment and discount separately from tulbur array
      const tulburArray = mur?.tulbur || [];
      const payments = Array.isArray(tulburArray) ? tulburArray.filter((p: any) => {
        const turul = p.turul || "";
        const dun = p.dun || 0;
        return turul !== "discount" && turul !== "khungulult" && turul !== "Хөнгөлөлт" && dun >= 0;
      }) : [];
      const discounts = Array.isArray(tulburArray) ? tulburArray.filter((p: any) => {
        const turul = p.turul || "";
        const dun = p.dun || 0;
        return turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0;
      }) : [];
      const paymentAmount = payments.reduce((s: number, p: any) => s + (p.dun || 0), 0);
      const discountAmount = discounts.reduce((s: number, p: any) => s + Math.abs(p.dun || 0), 0);

      const khugatsaa = (() => {
        if (!orsonTsag) return "";
        const s = moment(orsonTsag);
        const e = garsanTsag ? moment(garsanTsag) : moment();
        const mins = Math.max(0, Math.ceil(e.diff(s, "minutes", true)));
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}ц ${m}м` : `${m}м`;
      })();

      const status = isCurrentlyIn
        ? "Идэвхтэй"
        : tuluv !== undefined
          ? STATUS_LABEL[tuluv] ?? "Гарсан"
          : niitDun > 0 ? "Төлбөртэй" : "Гарсан";

      const gereeTuluv = (() => {
        if ((t as any).tsutsalsanOgnoo || (t as any).geree?.tsutsalsanOgnoo || (t as any).gereeniiTuluv === "Цуцалсан" || (t as any).geree?.tuluv === "Цуцалсан") {
          return "Цуцалсан";
        }
        const raw = (t as any).gereeTuluv || (t as any).gereeniiTuluv || (t as any).geree?.gereeniiTuluv || (t as any).geree?.tuluv || (t as any).geree?.status;
        if (!raw) return t.turul || "Идэвхтэй";
        const s = String(raw).toLowerCase();
        if (s.includes("цуц") || s.includes("cancel")) return "Цуцалсан";
        if (s.includes("идэвх") || s.includes("active")) return "Идэвхтэй";
        return String(raw);
      })();

      return {
        "№": i + 1,
        "Улсын дугаар": t.mashiniiDugaar || "",
        "Гэрээний төлөв": gereeTuluv,
        "Орсон": orsonTsag ? moment(orsonTsag).format("YYYY-MM-DD HH:mm:ss") : "",
        "Гарсан": garsanTsag ? moment(garsanTsag).format("YYYY-MM-DD HH:mm:ss") : "",
        "Хугацаа": khugatsaa,
        "Бодогдсон дүн": Number((niitDun || 0).toFixed(2)),
        "Төлбөр": Number((paymentAmount || 0).toFixed(2)),
        "Хөнгөлөлт": Number((discountAmount || 0).toFixed(2)),
        "Төлөв": status,
        "Шалтгаан": t.zurchil || "",
        "Бүртгэсэн": mur?.burtgesenAjiltaniiNer || "",
        "И-Баримт": mur?.ebarimtId || "",
      };
    });

    // Calculate totals across all vehicles
    const totalNiitDun = vehicles.reduce((sum, t) => sum + (Number(t.niitDun) || 0), 0);
    const totalPaymentAmount = vehicles.reduce((sum, t) => {
      const tulburArray = t.tuukh?.[0]?.tulbur || [];
      const totalPaid = Array.isArray(tulburArray)
        ? tulburArray.reduce((s: number, p: any) => {
            const turul = p.turul || "";
            const dun = p.dun || 0;
            if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) return s;
            return s + dun;
          }, 0)
        : 0;
      return sum + totalPaid;
    }, 0);
    const totalDiscountAmount = vehicles.reduce((sum, t) => {
      const tulburArray = t.tuukh?.[0]?.tulbur || [];
      const totalDiscount = Array.isArray(tulburArray)
        ? tulburArray.reduce((s: number, p: any) => {
            const turul = p.turul || "";
            const dun = p.dun || 0;
            if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) {
              return s + Math.abs(dun);
            }
            return s;
          }, 0)
        : 0;
      return sum + totalDiscount;
    }, 0);

    // Append Total Summary Row
    rows.push({
      "№": "НИЙТ",
      "Улсын дугаар": "",
      "Гэрээний төлөв": "",
      "Орсон": "",
      "Гарсан": "",
      "Хугацаа": "",
      "Бодогдсон дүн": Number(totalNiitDun.toFixed(2)),
      "Төлбөр": Number(totalPaymentAmount.toFixed(2)),
      "Хөнгөлөлт": Number(totalDiscountAmount.toFixed(2)),
      "Төлөв": "",
      "Шалтгаан": "",
      "Бүртгэсэн": "",
      "И-Баримт": "",
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
      { wch: 16 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Зогсоолын жагсаалт");

    const startDateStr = rangeStart || "бүгд";
    const endDateStr = rangeEnd || "бүгд";
    const fileName = `Зогсоолын_жагсаалт_${startDateStr}_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`${vehicles.length} мөр мэдээлэл (Нийт дүнтэй) татагдлаа`);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--shell-topbar-h)-3.5rem-2px)] min-h-[420px] overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col gap-4 max-w-[1700px] mx-auto w-full overflow-hidden">
        <div className="relative z-10 flex-shrink-0 px-1">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Date picker + Search */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-[50px] sm:w-40 lg:w-[300px] h-11 [&_.ant-picker-input]:!bg-transparent [&_input]:!bg-transparent [&_.ant-picker-input-active]:!bg-transparent dark:[&_.ant-picker-suffix]:!text-white dark:[&_.ant-picker-suffix_svg]:!fill-white dark:[&_.ant-picker:hover]:!bg-slate-700 dark:[&_.ant-picker-focused]:!bg-slate-700 [&_.ant-picker-range-separator]:!text-slate-400 dark:[&_.ant-picker-range-separator]:!text-slate-400">
                <StandardDatePicker
                  isRange={true}
                  value={dateRange ?? undefined}
                  onChange={(date: any, dateString: [string, string]) => {
                    setDateRange(dateString);
                    setPage(1);
                  }}
                  format="YYYY-MM-DD"
                  className="w-full !bg-white dark:!bg-slate-700 hover:!bg-white dark:hover:!bg-slate-700 !border-slate-200 dark:!border-slate-500 hover:!border-slate-300 dark:hover:!border-slate-500 shadow-sm"
                  classNames={{
                    input: "!bg-transparent !border-0 !shadow-none text-[11px] !text-slate-700 dark:!text-slate-100 px-2",
                  }}
                  allowClear
                />
              </div>

            </div>

            {/* Right: Export + Revenue Report */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBlockModal({ dugaar: "", tailbar: "" })}
                  className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-red-500 hover:bg-red-400 active:bg-red-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Блок
                  {blockedMap.size > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold">
                      {blockedMap.size}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setRevenueModalOpen(true)}
                  className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Орлого тайлан
                </button>
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-2 h-11 px-5 rounded-[30px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel татах
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}

        </div>
        <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-2xl flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full border-collapse min-w-[1300px] relative">
              <thead className="bg-slate-900 dark:bg-slate-950 border-b border-white/5 sticky top-0 z-20">
                <tr className="overflow-x-auto whitespace-nowrap">
                  {[
                    { id: "no", label: "№", width: "w-12" },
                    { id: "orson", label: "Орсон" },
                    { id: "garsan", label: "Гарсан" },
                    { id: "dugaar", label: "Дугааp" },
                    {
                      id: "duration",
                      label: "Хугацаа/мин",
                      filter: true,
                      current: durationFilter,
                      set: setDurationFilter,
                      options: [
                        { label: "Удаан зогссон эхэнд", value: "longest" },
                        { label: "Сүүлд орсон эхэнд", value: "latest_in" },
                        { label: "Сүүлд гарсан эхэнд", value: "latest_out" },
                      ],
                    },
                    { id: "calc", label: "Бодогдсон" },
                    {
                      id: "payment",
                      label: "Төлбөр",
                      filter: true,
                      current: paymentMethodFilter,
                      set: setPaymentMethodFilter,
                      options: [
                        { label: "Бүгд", value: "all" },
                        { label: "Бэлэн", value: "cash" },
                        { label: "Карт", value: "card" },
                        { label: "Дансаар", value: "transfer" },
                        { label: "QPay", value: "qpay" },
                      ],
                    },
                    { id: "discount", label: "Хөнгөлөлт" },
                    { id: "ebarimt", label: "И-Баримт" },
                    {
                      id: "status",
                      label: "Төлөв",
                      filter: true,
                      current: statusFilter,
                      set: setStatusFilter,
                      options: [
                        { label: "Бүгд", value: "all" },
                        { label: "Идэвхтэй", value: "active" },
                        { label: "Төлсөн", value: "paid" },
                        { label: "Төлөөгүй", value: "unpaid" },
                        { label: "Үнэгүй", value: "free" },
                      ],
                    },
                    { id: "reason", label: "Шалтгаан" },
                    { id: "staff", label: "Бүртгэсэн" },
                    { id: "block", label: "Блок", width: "w-[84px]" },
                  ].map((h) => (
                    <th
                      key={h.id}
                      className={`group relative py-4 px-4 text-slate-400 uppercase tracking-tighter text-[10px] font-black text-center ${h.width || ""}`}
                    >
                      <div
                        className="flex items-center justify-center gap-2 w-full cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          if (!h.filter) return;
                          setOpenFilter(openFilter === h.id ? null : h.id);
                        }}
                      >
                        {h.filter && (
                          <Filter className={`w-3 h-3 transition-colors ${h.current !== "all" && h.current !== undefined
                            ? "text-blue-400"
                            : "text-slate-500 group-hover:text-blue-400"
                            }`} />
                        )}
                        {h.label}
                      </div>

                      {h.options && (
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/98 backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 transition-all duration-300 z-[100] border border-white/5 overflow-hidden ring-1 ring-white/10 ${openFilter === h.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-3 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"}`}
                        >
                          <div className="relative flex flex-col gap-1 z-10">
                            <div className="px-3 py-1.5 mb-1 text-[9px]  text-slate-500 uppercase tracking-widest border-b border-white/5">
                              Сонгох
                            </div>
                            {h.options.map((opt, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  h.set?.(opt.value);
                                  setPage(1);
                                  setOpenFilter(null);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${h.current === opt.value
                                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40"
                                  : "hover:bg-white/10 text-slate-300 hover:text-white"
                                  }`}
                              >
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Car className="w-12 h-12 opacity-50" />
                        <p>Машины мэдээлэл олдсонгүй</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vehicles.map((transaction, idx) => {
                    const mur = transaction.tuukh?.[0];
                    const tsag = mur?.tsagiinTuukh?.[0];
                    const orsonTsag = tsag?.orsonTsag;
                    const garsanTsag = tsag?.garsanTsag;
                    const tuluv = mur?.tuluv;
                    const niitDun = transaction.niitDun || 0;
                    const isCurrentlyIn = !mur?.garsanKhaalga;
                    const isFreeExit = !!mur?.uneguiGarsan && tuluv !== -2 && tuluv !== -1;
                    const rawTulbur = mur?.tulbur;
                    const tulburArr: any[] = Array.isArray(rawTulbur) ? rawTulbur : (rawTulbur ? [rawTulbur] : []);
                    const discountTotal = tulburArr
                      .filter((p: any) => p?.turul === "khungulult" || p?.turul === "discount" || p?.turul === "Хөнгөлөлт")
                      .reduce((s: number, p: any) => s + Math.abs(p?.dun ?? 0), 0);
                    const effectiveOwed = Math.max(0, niitDun - discountTotal);
                    const positivePaid = tulburArr.reduce((s: number, p: any) => s + (p?.dun > 0 ? p.dun : 0), 0);
                    const isDebt = !isFreeExit && (tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn));
                    const hasRemainingBalance = tuluv === 1 && effectiveOwed > 0 && !isCurrentlyIn && positivePaid < effectiveOwed;
                    const blockRecord = blockolsonEsekh(transaction.mashiniiDugaar);
                    const getStatusColor = () => {
                      if (tuluv === -2 || tuluv === -1) return "bg-red-500 border-red-600";
                      if (hasRemainingBalance) return "bg-amber-500 border-amber-600";
                      if (isFreeExit) return "bg-gray-500 border-gray-600";
                      if (tuluv === 1) return isCurrentlyIn && niitDun === 0 ? "bg-blue-500 border-blue-600" : "bg-emerald-500 border-emerald-600";
                      if (!isCurrentlyIn && (niitDun > 0 || isDebt)) return "bg-amber-500 border-amber-600";
                      if (!isCurrentlyIn && niitDun === 0) return "bg-gray-500 border-gray-600";
                      return "bg-blue-500 border-blue-600";
                    };

                    return (
                      <tr
                        key={transaction._id || idx}
                        className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group relative ${idx % 2 === 0
                          ? "bg-slate-100 dark:bg-slate-800/40"
                          : "bg-white dark:bg-transparent"
                          }`}
                      >
                        <td className="py-4 px-3 text-center text-[10px] text-slate-400 ">
                          {isCurrentlyIn && (
                            <div className="absolute left-0 top-1 bottom-1 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          )}
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-4 px-3 whitespace-nowrap text-center">
                          <div className="flex flex-col">
                            <span className="text-[11px]  text-slate-700 dark:text-slate-300">
                              {orsonTsag
                                ? moment(orsonTsag).format("MM-DD HH:mm:ss")
                                : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-3 whitespace-nowrap text-center">
                          <span className="text-[11px]  text-slate-500 dark:text-slate-400">
                            {garsanTsag
                              ? moment(garsanTsag).format("MM-DD HH:mm:ss")
                              : ""}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center gap-2 group/copy">
                            <span
                              title={
                                blockRecord
                                  ? `Блоклсон${blockRecord.tailbar ? ": " + blockRecord.tailbar : ""}`
                                  : undefined
                              }
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold !text-white tracking-widest font-[family-name:var(--font-mono)] ${blockRecord ? "bg-red-600" : "bg-blue-600"}`}
                            >
                              {transaction.mashiniiDugaar || ""}
                            </span>
                            <Copy
                              className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-all opacity-0 group-hover/copy:opacity-100 scale-90 group-hover/copy:scale-100"
                              onClick={() =>
                                copyToClipboard(transaction.mashiniiDugaar)
                              }
                            />
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div
                            className={`flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1 rounded-[6px] overflow-hidden border text-[10px] text-white ${getStatusColor()}`}
                            style={{ borderRadius: "6px", color: "white" }}
                          >
                            <RealTimeDuration
                              orsonTsag={orsonTsag}
                              garsanTsag={garsanTsag}
                              niitKhugatsaa={mur?.niitKhugatsaa}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-[family-name:var(--font-mono)]">
                            {formatNumber(niitDun, 2)}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const payHistory: any[] = (transaction.tuukh || []).flatMap((th: any) => {
                              const raw = th?.tulbur;
                              if (Array.isArray(raw)) return raw;
                              if (raw && typeof raw === "object") return [raw];
                              return [];
                            });
                            // Filter only actual payments (not discounts)
                            const paymentHistory = payHistory.filter((p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              return turul !== "discount" && turul !== "khungulult" && turul !== "Хөнгөлөлт" && dun >= 0;
                            });
                            if (!paymentHistory.length) return <span />;
                            const totalPaid = paymentHistory.reduce((s: number, p: any) => s + (p.dun || 0), 0);
                            const uniqueTypes = [...new Set(paymentHistory.map((p: any) => p.turul).filter(Boolean))] as string[];
                            return (
                              <PaymentPopup
                                payHistory={paymentHistory}
                                totalPaid={totalPaid}
                                uniqueTypes={uniqueTypes}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const payHistory: any[] = (transaction.tuukh || []).flatMap((th: any) => {
                              const raw = th?.tulbur;
                              if (Array.isArray(raw)) return raw;
                              if (raw && typeof raw === "object") return [raw];
                              return [];
                            });
                            // Filter only discounts
                            const discountHistory = payHistory.filter((p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              return turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0;
                            });
                            if (!discountHistory.length) return <span />;
                            const totalDiscount = discountHistory.reduce((s: number, p: any) => s + Math.abs(p.dun || 0), 0);
                            const uniqueTypes = [...new Set(discountHistory.map((p: any) => p.turul).filter(Boolean))] as string[];
                            return (
                              <PaymentPopup
                                payHistory={discountHistory}
                                totalPaid={totalDiscount}
                                uniqueTypes={uniqueTypes}
                              />
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 text-[11px] text-slate-500 text-center">
                          {mur?.ebarimtId || ""}
                        </td>
                        <td className="py-4 px-3 text-center">
                          {(() => {
                            const badgeClass = `flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border ${getStatusColor()}`;
                            const label =
                              tuluv === -2 || tuluv === -1 ? "Зөрчилтэй"
                                : hasRemainingBalance ? "Төлбөр"
                                  : isFreeExit ? "Төлсөн"
                                    : tuluv === 1 ? (isCurrentlyIn && niitDun === 0 ? "Идэвхтэй" : "Төлсөн")
                                      : isCurrentlyIn ? "Идэвхтэй"
                                        : niitDun > 0 || isDebt ? "Төлбөртэй"
                                          : "Үнэгүй";
                            return (
                              <div className={badgeClass} style={{ borderRadius: "6px" }}>
                                <span className="text-[10px] !text-white uppercase whitespace-nowrap">{label}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-3 max-w-[150px]">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate group-hover:whitespace-normal text-center">
                            {transaction.zurchil || ""}
                          </p>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-slate-600 dark:text-slate-400">
                              {mur?.burtgesenAjiltaniiNer || ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center w-[84px]">
                          {blockRecord ? (
                            <button
                              onClick={() => blockGargaya(blockRecord)}
                              title={
                                blockRecord.tailbar
                                  ? `Блокоос гаргах — ${blockRecord.tailbar}`
                                  : "Блокоос гаргах"
                              }
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-400 active:bg-red-600 text-white shadow-sm transition-all"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setBlockModal({
                                  dugaar: mashiniiDugaarTseverle(
                                    transaction.mashiniiDugaar || "",
                                  ),
                                  tailbar: "",
                                })
                              }
                              disabled={!transaction.mashiniiDugaar}
                              title="Машиныг блоклох"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all opacity-40 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white sticky bottom-0 z-10">
                <tr>
                  <td
                    colSpan={5}
                    className="py-3 px-3 text-right text-[11px] font-black uppercase tracking-wider border-r border-slate-200 dark:border-white/5"
                  >
                    Нийт Дүн:
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {formatNumber(
                      vehicles.reduce(
                        (sum, t) => sum + (Number(t.niitDun) || 0),
                        0,
                      ), 2)}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {formatNumber(
                      vehicles.reduce(
                        (sum, t) => {
                          const tulburArray = t.tuukh?.[0]?.tulbur || [];
                          const totalPaid = Array.isArray(tulburArray)
                            ? tulburArray.reduce((s: number, p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) return s;
                              return s + dun;
                            }, 0)
                            : 0;
                          return sum + totalPaid;
                        },
                        0,
                      ), 2)}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-white/5 text-xs font-black font-[family-name:var(--font-mono)] whitespace-nowrap">
                    {formatNumber(
                      vehicles.reduce(
                        (sum, t) => {
                          const tulburArray = t.tuukh?.[0]?.tulbur || [];
                          const totalDiscount = Array.isArray(tulburArray)
                            ? tulburArray.reduce((s: number, p: any) => {
                              const turul = p.turul || "";
                              const dun = p.dun || 0;
                              if (turul === "discount" || turul === "khungulult" || turul === "Хөнгөлөлт" || dun < 0) {
                                return s + Math.abs(dun);
                              }
                              return s;
                            }, 0)
                            : 0;
                          return sum + totalDiscount;
                        },
                        0,
                      ), 2)}
                  </td>
                  <td
                    colSpan={5}
                    className="border-r border-slate-200 dark:border-white/5"
                  />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <StandardPagination
          current={page}
          total={vehiclesData?.niitMur || 0}
          pageSize={pageSize}
          onChange={setPage}
        />
        {blockModal && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() =>
              !blockSaving && !excelKhadgalj && setBlockModal(null)
            }
          >
            <div
              className={`relative ${excelMuruud.length > 0 ? "w-[780px]" : "w-[580px]"} max-w-full max-h-[85vh] flex flex-col rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06] transition-[width] duration-200`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Толгой */}
              <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 opacity-80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <Ban className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                        Машин блоклох
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Блоклосон машиныг хаалга оруулахгүй
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBlockModal(null)}
                    disabled={blockSaving}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Шинэ дугаар бүртгэх */}
              <div className="px-7 py-5 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0">
                <div className="flex items-end gap-3">
                  <div className="w-[150px] flex-shrink-0 space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Улсын дугаар <span className="text-red-500">*</span>
                    </label>
                    <input
                      autoFocus
                      value={blockModal.dugaar}
                      onChange={(e) =>
                        setBlockModal((st) =>
                          st
                            ? {
                                ...st,
                                dugaar: mashiniiDugaarTseverle(e.target.value),
                              }
                            : st,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") blokloyo();
                      }}
                      placeholder="1234УБА"
                      maxLength={7}
                      className="w-full h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-[13px] font-bold tracking-widest text-center font-[family-name:var(--font-mono)] text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-normal placeholder:tracking-normal outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Шалтгаан <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={blockModal.tailbar}
                      onChange={(e) =>
                        setBlockModal((st) =>
                          st ? { ...st, tailbar: e.target.value } : st,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") blokloyo();
                      }}
                      placeholder="Төлбөрөө төлөөгүй"
                      className="w-full h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                  <button
                    onClick={blokloyo}
                    disabled={
                      blockSaving ||
                      !MASHINII_DUGAARIIN_ZAGVAR.test(blockModal.dugaar) ||
                      !blockModal.tailbar.trim()
                    }
                    className="h-10 px-5 rounded-[30px] bg-red-500 hover:bg-red-400 active:bg-red-600 text-white text-[11px] font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 flex-shrink-0"
                  >
                    {blockSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Нэмэх
                  </button>
                </div>
              </div>

              {/* Excel-ээр олноор бүртгэх */}
              <div className="px-7 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex-shrink-0 flex items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Excel-ээр машин бүртгэх
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-white/[0.06]" />
                <button
                  onClick={excelZagvarTatya}
                  disabled={excelKhadgalj}
                  className="h-8 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  Загвар
                </button>
                <button
                  onClick={() => excelFileRef.current?.click()}
                  disabled={excelUnshij || excelKhadgalj}
                  className="h-8 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white text-[11px] font-semibold shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  {excelUnshij ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Файл сонгох
                </button>
                <input
                  ref={excelFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={excelFileSongoyo}
                  className="hidden"
                />
              </div>

              {excelMuruud.length > 0 ? (
                <>
                  {/* Урьдчилан харах — хэрэглэгч шалгасны дараа л хадгална */}
                  <div className="px-7 py-4 flex items-center justify-between gap-3 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Урьдчилан харах
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
                        <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{excelFileNer}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold whitespace-nowrap">
                        Зөв: {excelZuvMuruud.length}
                      </span>
                      {excelMuruud.length - excelZuvMuruud.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 text-[11px] font-semibold whitespace-nowrap">
                          Алдаатай: {excelMuruud.length - excelZuvMuruud.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-7 overflow-y-auto flex-1 min-h-0">
                    <div className="rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                          <tr className="text-[11px] uppercase font-semibold text-slate-400">
                            <th className="py-2.5 px-3 w-14 text-center">Мөр</th>
                            <th className="py-2.5 px-3 text-center w-[130px]">
                              Улсын дугаар
                            </th>
                            <th className="py-2.5 px-3 text-left">Шалтгаан</th>
                            <th className="py-2.5 px-3 text-left w-[250px]">
                              Төлөв
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[13px] divide-y divide-slate-100 dark:divide-white/[0.05]">
                          {excelMuruud.map((mur) => (
                            <tr
                              key={mur.excelMur}
                              className={
                                mur.aldaanuud.length > 0
                                  ? "bg-red-50/60 dark:bg-red-950/20"
                                  : ""
                              }
                            >
                              <td className="py-2.5 px-3 text-center text-[11px] text-slate-400">
                                {mur.excelMur}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {mur.dugaar ? (
                                  <span className="px-3 py-0.5 rounded-full bg-red-600 text-[11px] font-bold !text-white tracking-wider whitespace-nowrap font-[family-name:var(--font-mono)]">
                                    {mur.dugaar}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 italic">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-left text-slate-600 dark:text-slate-300">
                                {mur.tailbar || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-left">
                                {mur.aldaanuud.length === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    Бэлэн
                                  </span>
                                ) : (
                                  <span className="inline-flex items-start gap-1 text-[11px] font-semibold text-red-500">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
                                    {mur.aldaanuud.join(", ")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="px-7 py-4 mt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 flex-shrink-0">
                    <p className="text-[11px] text-slate-400">
                      {excelKhadgalj
                        ? `Илгээж байна... ${excelYavts} / ${excelZuvMuruud.length}`
                        : `${excelZuvMuruud.length} машин блоклоход бэлэн`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={excelTsutslaya}
                        disabled={excelKhadgalj}
                        className="h-10 px-5 rounded-[30px] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-40"
                      >
                        Болих
                      </button>
                      <button
                        onClick={excelBlokloyo}
                        disabled={excelKhadgalj || excelZuvMuruud.length === 0}
                        className="h-10 px-5 rounded-[30px] bg-red-500 hover:bg-red-400 active:bg-red-600 text-white text-[11px] font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                      >
                        {excelKhadgalj ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        Блоклох ({excelZuvMuruud.length})
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                {/* Блоклсон машинууд */}
                <div className="px-7 py-4 flex items-center justify-between gap-3 flex-shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Блоклсон <span className="text-red-500">{blockedMap.size}</span>{" "}
                    машин
                  </span>
                  {blockedMap.size > 5 && (
                    <div className="relative flex-1 max-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={blockSearch}
                        onChange={(e) => setBlockSearch(e.target.value)}
                        placeholder="Хайх..."
                        className="w-full h-9 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-red-400 transition-colors"
                      />
                    </div>
                  )}
                </div>

                <div className="px-7 pb-6 overflow-y-auto flex-1 min-h-0">
                  {blockList.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                      <ShieldCheck className="w-10 h-10" />
                      <p className="text-[11px]">
                        {blockSearch
                          ? "Хайлтад тохирох машин олдсонгүй"
                          : "Блоклсон машин алга"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blockList.map((b: any) => (
                        <div
                          key={b._id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/[0.04]"
                        >
                          <span className="px-3 py-0.5 rounded-full bg-red-600 text-[11px] font-bold !text-white tracking-wider whitespace-nowrap font-[family-name:var(--font-mono)] flex-shrink-0">
                            {b.dugaar}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                              {b.tailbar || "—"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {[
                                b.burtgesenAjiltaniiNer,
                                b.createdAt
                                  ? moment(b.createdAt).format("YYYY-MM-DD HH:mm")
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            onClick={() => blockGargaya(b)}
                            title="Блокоос гаргах"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
        {revenueModalOpen && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() => setRevenueModalOpen(false)}
          >
            <div
              className="relative w-[420px] max-w-full rounded-[28px] overflow-hidden shadow-2xl border bg-white dark:bg-[#18181b] border-slate-200/40 dark:border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-7 pt-6 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 opacity-80" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.06]">
                      <Receipt className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-[15px] text-slate-800 dark:text-white tracking-tight">
                        Орлого тайлан
                      </h2>
                      <div className="mt-1.5 min-w-[220px]">
                        <ConfigProvider theme={{ token: { zIndexPopupBase: 10000 } }}>
                          <StandardDatePicker
                            isRange={true}
                            value={revenueDateRange}
                            onChange={(_: any, dateStrings: [string, string]) => setRevenueDateRange(dateStrings)}
                            format="YYYY-MM-DD"
                            classNames={{
                              input: "flex items-center gap-2 rounded-full border border-slate-200/40 dark:border-white/[0.06] h-8 px-3 text-[11px] text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/10 transition-all",
                            }}
                            allowClear
                            getPopupContainer={() => document.body}
                          />
                        </ConfigProvider>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRevenueModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">
                  Төлбөрийн хэлбэр
                </p>
                {revenueLoading && (
                  <div className="text-center py-8 text-[11px] text-slate-400">Уншиж байна...</div>
                )}
                {!revenueLoading && revenueModalBreakdown.items.map((item) => (
                  <div
                    key={item.key}
                    className="relative flex items-center gap-3 py-2.5 px-3 rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] overflow-hidden"
                  >
                    {/* Percentage fill background */}
                    <div
                      className={`absolute inset-y-0 left-0 ${item.color} opacity-[0.08] dark:opacity-[0.06] transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                    <div
                      className={`w-1 h-8 rounded-full ${item.color} shrink-0 relative z-10`}
                    />
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 relative z-10">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <span className="text-[12px] text-slate-700 dark:text-slate-200 block">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[13px] font-black text-slate-800 dark:text-white font-[family-name:var(--font-mono)] shrink-0 relative z-10">
                      {formatNumber(item.amount)}₮
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)] w-6 text-center shrink-0 relative z-10">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-[family-name:var(--font-mono)] w-12 text-right shrink-0 relative z-10">
                      {item.pct}%
                    </span>
                  </div>
                ))}
                {!revenueLoading && revenueModalBreakdown.items.length === 0 && (
                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-8">
                    Төлбөрийн мэдээлэл олдсонгүй
                  </p>
                )}
              </div>

              {/* Footer total */}
              <div className="px-7 pb-6 pt-2">
                <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Нийт орлого
                  </span>
                  <span className="text-[14px] font-black text-emerald-700 dark:text-emerald-400 font-[family-name:var(--font-mono)]">
                    {formatNumber(revenueModalBreakdown.totalAmount)}₮
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
