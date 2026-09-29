"use client";

import { createPortal } from "react-dom";

import ExcelButton from "@/components/ui/ExcelButton";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import FilterSelect from "@/components/ui/FilterSelect";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import {
  X,
  RefreshCw,
  Tag,
  History,
  CheckSquare,
  Square,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  ArrowUpDown,  
} from "lucide-react";
import dayjs from "dayjs";
import useModalHotkeys from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useSearch } from "@/context/SearchContext";
import { toast } from "sonner";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import {
  getResidentField,
  getResidentToots,
  getResidentOrtsuud,
  getResidentDavkhauraud,
} from "@/lib/residentDataHelper";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ResidentRow {
  _id: string;
  ner: string;
  ovog?: string;
  utas?: string;
  toot: string;
  orts?: string;
  davkhar?: string;
  gereeniiId?: string;
  uldegdel?: number;
  turesiinOrlogo?: number;
  /** "Орон сууц" | "Агуулах" | "Зогсоол" — тоотын төрөл */
  turul?: string;
}

interface DiscountHistoryRow {
  _id: string;
  ognoo?: string;
  createdAt?: string;
  updatedAt?: string;
  tailbar?: string;
  dun: number;
  toot?: string;
  ner?: string;
  ovog?: string;
  gereeniiId?: string;
  gereeniiDugaar?: string;
  ekhlekhOgnoo?: string;
  duusakhOgnoo?: string;
  davkhar?: string;
  orts?: string;
  khungulukhTurul?: string;
  tulukhDun?: number;
  tulsunDun?: number;
  turul?: string;
  khungulultKhuvi?: number;
  khungulultKhonog?: number;
  khonogTootsokhEsekh?: boolean;
  zardliinNer?: string;
  guilgeeKhiisenAjiltniiNer?: string;
  zassan?: string;
  bichlegiinToo?: number;
  /** Шинэ бүртгэлтэй хөнгөлөлт (`khungulultiinTuukh`) */
  tuukhId?: string;
  /** "khuvi" | "dun" */
  khungulukhKod?: string;
  khungulukhUtga?: number;
  /** Нэг хөнгөлөлтөд хамаарах гэрээний тоо (засахад нөлөөлөх) */
  gereeniiToo?: number;
  sariinDun?: number;
}

/** Зардлын нэрээр ангилал (backend-ийн `angilalTaniya`-тай ижил). */
const angilalTaniya = (ner: string): string => {
  const n = String(ner || "").toLowerCase();
  if (n.includes("гараж") || n.includes("гараш") || n.includes("зогсоол")) return "Зогсоол";
  if (n.includes("агуулах")) return "Агуулах";
  return "Орон сууц";
};

interface HongololtToolProps {
  /** Модал горимд заавал. `inline` үед үл хэрэгсэнэ. */
  show?: boolean;
  onClose?: () => void;
  token: string;
  baiguullagiinId?: string;
  barilgiinId?: string;
  onSuccess?: () => void;
  /**
   * Хуудсан дээр байрлаж буй эсэх. Үнэн бол модалын бүрхүүлгүйгээр
   * зөвхөн таб ба агуулгыг дүрсэлнэ.
   */
  inline?: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

// Мөнгөн дүнг мянгатын таслалтай (1,312,340.00) — програмын бусад хэсэгтэй ижил.
// "mn-MN" нь зарим хөтөч дээр орон ялгахгүй эсвэл зайгаар ялгадаг байв.
const fmt = (n: number) =>
  (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmt2 = (n: number) =>
  (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDateTime = (d?: string | Date) => {
  if (!d) return "—";
  const dt = dayjs(d);
  return dt.isValid() ? dt.format("YYYY-MM-DD HH:mm:ss") : String(d);
};

const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

type HongololtTurul = "percent" | "amount";

/* ─── Component ─────────────────────────────────────────────────────────── */

/** Маягтын нэгдсэн талбарын загвар (globals.css-ийн `--ctl-*` токенууд) */
const TALBAR =
  "h-9 w-full rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-3 text-[13px] text-[color:var(--panel-text)] shadow-[var(--ctl-shadow)] placeholder:text-[color:var(--muted-text)] transition-colors hover:border-[color:var(--ctl-border-hover)] focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20";

/** «Шошго | талбар» нэг мөр */
function Mur({
  shoshgo,
  shaardlagatai,
  tailbar,
  children,
}: {
  shoshgo: string;
  shaardlagatai?: boolean;
  tailbar?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[112px_1fr] items-center gap-3">
      <span className="text-[13px] text-[color:var(--muted-text)]">
        {shaardlagatai && <span className="mr-0.5 text-danger">*</span>}
        {shoshgo}
        {shoshgo ? ":" : ""}
      </span>
      <div className="min-w-0">
        {children}
        {tailbar && (
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">{tailbar}</p>
        )}
      </div>
    </div>
  );
}

export default function HongololtTool({
  show = false,
  onClose,
  token,
  baiguullagiinId,
  barilgiinId,
  onSuccess,
  inline = false,
}: HongololtToolProps) {
  const { baiguullaga } = useAuth();
  const constraintsRef = React.useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  /* Tab */
  const [activeTab, setActiveTab] = useState<"oruulakh" | "tuukh">("oruulakh");

  /* Left-panel form */
  const now = new Date();
  const ekhniiSar = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  /**
   * Хөнгөлөх сар — turees шиг МУЖ. Нэг сар хөнгөлөхөд эхлэх/дуусахыг
   * ижил үлдээнэ. Олон сар сонгосон тохиолдолд дүн нь сарын тоогоор
   * үржинэ (`sariinToo`), turees-ийн `durationMultiplier`-тэй ижил.
   */
  const [selectedMonth, setSelectedMonth] = useState<string>(ekhniiSar);
  const [duusakhSar, setDuusakhSar] = useState<string>(ekhniiSar);

  /**
   * Байгууллагын зөвшөөрсөн дээд хөнгөлөлтийн хувь.
   * `barilguud[].tokhirgoo` дээр байвал түүнийг, үгүй бол
   * байгууллагын түвшнийхийг авна. Аль нь ч байхгүй бол хязгааргүй.
   */
  const deedKhuvi = React.useMemo(() => {
    const barilga = (baiguullaga as any)?.barilguud?.find(
      (b: any) => String(b?._id) === String(barilgiinId || ""),
    );
    const utga =
      barilga?.tokhirgoo?.deedKhungulultiinKhuvi ??
      (baiguullaga as any)?.tokhirgoo?.deedKhungulultiinKhuvi;
    const too = Number(utga);
    return Number.isFinite(too) && too > 0 ? too : null;
  }, [baiguullaga, barilgiinId]);
  const [orts, setOrts] = useState("");
  const [davkhar, setDavkhar] = useState("");

  /** Сонгосон барилгын баримт — орц/давхрын жагсаалтын эх сурвалж. */
  const songogdsonBarilga = React.useMemo(
    () =>
      (baiguullaga as any)?.barilguud?.find(
        (b: any) => String(b?._id) === String(barilgiinId || ""),
      ),
    [baiguullaga, barilgiinId],
  );

  /** Барилгын ашиглалтын зардлууд — «Зардал сонгох» жагсаалтад. */
  const [zardluud, setZardluud] = useState<
    { _id: string; ner: string }[]
  >([]);

  React.useEffect(() => {
    if (!token || !baiguullagiinId) return;
    let khuchintei = true;
    (async () => {
      try {
        const resp = await uilchilgee(token).get("/ashiglaltiinZardluudAvya", {
          params: { baiguullagiinId, barilgiinId: barilgiinId || undefined },
        });
        const jagsaalt = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
            ? resp.data
            : [];
        if (khuchintei) {
          setZardluud(
            jagsaalt.map((z: any) => ({
              _id: String(z._id),
              ner: z.ner || "Нэргүй",
            })),
          );
        }
      } catch {
        if (khuchintei) setZardluud([]);
      }
    })();
    return () => {
      khuchintei = false;
    };
  }, [token, baiguullagiinId, barilgiinId]);

  /** Орцын жагсаалт — `useGereeData`-гийн `ortsOptions`-той ижил дүрэм. */
  const ortsSongoltuud = React.useMemo(() => {
    const tok = songogdsonBarilga?.tokhirgoo?.orts;
    if (Array.isArray(tok) && tok.length > 0) return tok.map(String);
    const too = typeof tok === "number" ? tok : parseInt(tok);
    if (Number.isFinite(too) && too > 0)
      return Array.from({ length: too }, (_, i) => String(i + 1));
    if (typeof tok === "string" && tok.trim())
      return tok.split(/[\s,;|]+/).filter(Boolean);
    return [] as string[];
  }, [songogdsonBarilga]);

  /** Давхрын жагсаалт — `useGereeData`-гийн `davkharOptions`-той ижил. */
  const davkharSongoltuud = React.useMemo(() => {
    const tok = songogdsonBarilga?.tokhirgoo?.davkhar;
    if (Array.isArray(tok) && tok.length > 0)
      return tok.map((d: any) => String(d?.davkhar ?? d));
    const too = typeof tok === "number" ? tok : parseInt(tok);
    if (Number.isFinite(too) && too > 0)
      return Array.from({ length: too }, (_, i) => String(i + 1));
    const jagsaalt = songogdsonBarilga?.davkharuud;
    if (Array.isArray(jagsaalt) && jagsaalt.length > 0)
      return jagsaalt.map((d: any) => String(d?.davkhar ?? d));
    return [] as string[];
  }, [songogdsonBarilga]);
  const [hongololtTurul, setHongololtTurul] = useState<HongololtTurul>("percent");
  const [hongololtUtga, setHongololtUtga] = useState("");
  const [shaltgaan, setShaltgaan] = useState("");
  /** Зардал/хоногоор хөнгөлөх сонголтыг маягтаас хассан — нийт төлбөрөөс, сараар. */
  const zardliinId = "";
  const khonogTootsokh = false;
  const khungulultKhonog = "";

  /* Right-panel data */
  const [fetching, setFetching] = useState(false);
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  // Жагсаалтын хайлт — дээд талын (Topbar) нэгдсэн хайлтаас.
  const { searchTerm } = useSearch();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Хөнгөлөлт зөвхөн СОНГОСОН мөрүүдэд сууна — хураангуй ч зөвхөн тэднийг
  // тоолно. Бүгдийг хөнгөлөх бол толгойн checkbox-оор бүгдийг сонгоно.
  const selectMode = "selected" as "all" | "selected";

  /* History tab */
  const [histFetching, setHistFetching] = useState(false);
  const [history, setHistory] = useState<DiscountHistoryRow[]>([]);
  const histSearch = searchTerm;
  const [histDavkhar, setHistDavkhar] = useState("");
  const [histDateRange, setHistDateRange] = useState<[string | null, string | null]>([
    dayjs().format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(100);

  useEffect(() => {
    setHistPage(1);
  }, [histSearch]);

  /* Submitting */
  const [loading, setLoading] = useState(false);

  useModalHotkeys({ isOpen: !inline && show, onClose: onClose ?? (() => { }) });

  /* ── Load residents ── */
  const loadResidents = useCallback(async () => {
    if (!token || !baiguullagiinId) return;
    try {
      setFetching(true);
      // Тоот бүрийн гэрээг `/geree`-ээс олно: `orshinSuugch.toots[]` дээр
      // `gereeniiId` байдаггүй тул өмнө нь олон тооттой айлын БҮХ тоот нэг
      // `item.gereeniiId`-г авч, мөрүүд ижил `_id`-тай болдог байв — нэгийг
      // сонгоход бүгд сонгогдож, хөнгөлөлт нэг гэрээнд давхар бичигддэг байв.
      const [res, gereeRes] = await Promise.all([
        uilchilgee(token).get("/orshinSuugch", {
          params: {
            baiguullagiinId,
            barilgiinId: barilgiinId || undefined,
            khuudasniiKhemjee: 2000,
          },
        }),
        uilchilgee(token)
          .get("/geree", {
            params: {
              baiguullagiinId,
              barilgiinId: barilgiinId || undefined,
              khuudasniiKhemjee: 5000,
            },
          })
          .catch(() => ({ data: { jagsaalt: [] } })),
      ]);
      const gereeJagsaalt: any[] = Array.isArray(gereeRes.data?.jagsaalt)
        ? gereeRes.data.jagsaalt
        : [];
      /** `${orshinSuugchId}|${toot}` → идэвхтэй гэрээний _id */
      const tootiinGeree = new Map<string, string>();
      gereeJagsaalt.forEach((g: any) => {
        if (String(g.tuluv || "") === "Цуцалсан") return;
        const key = `${String(g.orshinSuugchId || "")}|${String(g.toot || "").trim()}`;
        if (!tootiinGeree.has(key)) tootiinGeree.set(key, String(g._id));
      });
      const raw = Array.isArray(res.data?.jagsaalt)
        ? res.data.jagsaalt
        : Array.isArray(res.data?.list)
          ? res.data.list
          : Array.isArray(res.data)
            ? res.data
            : [];

      const rows: ResidentRow[] = [];

      raw.forEach((item: any) => {
        const ner = item.ner || "Нэргүй";
        const ovog = item.ovog || "";
        const utas = item.utas || item.utas1 || "";
        const resId = String(item._id);

        const tootsList =
          Array.isArray(item.toots) && item.toots.length > 0
            ? item.toots.filter((t: any) => {
                if (!t || !t.toot) return false;
                if (
                  barilgiinId &&
                  t.barilgiinId &&
                  String(t.barilgiinId) !== String(barilgiinId)
                ) {
                  return false;
                }
                return true;
              })
            : [];

        if (tootsList.length > 0) {
          tootsList.forEach((t: any, idx: number) => {
            const tootStr = String(t.toot || "-");
            const gid = String(
              t.gereeniiId ||
                t.gereeId ||
                tootiinGeree.get(`${resId}|${tootStr.trim()}`) ||
                // Ганц тоот бол оршин суугчийн гэрээ нь л тэр
                (tootsList.length === 1 ? item.gereeniiId : "") ||
                // Гараж/агуулах тусдаа гэрээгүй бол орон сууцны гэрээнд нэмэлт
                // тоот болж багтдаг — тэр гэрээгээр ангиллын үлдэгдлийг харна.
                (String(t.turul || "").trim() && String(t.turul).trim() !== "Орон сууц" ? item.gereeniiId : "") ||
                "",
            );
            // Тоот бүр ТУСДАА мөр — гэрээ олдоогүй ч давхцахгүй.
            const rowId = `${resId}_${gid || "x"}_${tootStr}_${idx}`;

            const tRaw = String(t.turul || "").trim();
            const turul =
              tRaw === "Агуулах"
                ? "Агуулах"
                : tRaw === "Гараж" || tRaw === "Зогсоол"
                  ? "Зогсоол"
                  : "Орон сууц";
            rows.push({
              _id: rowId,
              turul,
              ner,
              ovog,
              utas,
              toot: tootStr,
              orts: String(
                t.orts ?? getResidentField(item, "orts") ?? item.orts ?? "",
              ),
              davkhar: String(
                t.davkhar ??
                  getResidentField(item, "davkhar") ??
                  item.davkhar ??
                  "",
              ),
              gereeniiId: gid,
              uldegdel:
                Number(
                  t.uldegdel !== undefined
                    ? t.uldegdel
                    : t.ekhniiUldegdel !== undefined
                      ? t.ekhniiUldegdel
                      : item.uldegdel,
                ) || 0,
              turesiinOrlogo:
                Number(
                  t.turesiinOrlogo ||
                    t.sariniiTureeSan ||
                    item.turesiinOrlogo ||
                    item.sariniiTureeSan,
                ) || 0,
            });
          });
        } else {
          const tootStr = String(
            item.toot || getResidentField(item, "toot") || "-",
          );
          const gid = String(item.gereeniiId || "");
          rows.push({
            turul: "Орон сууц",
            _id: gid ? `${resId}_${gid}` : resId,
            ner,
            ovog,
            utas,
            toot: tootStr,
            orts: String(getResidentField(item, "orts") ?? item.orts ?? ""),
            davkhar: String(
              getResidentField(item, "davkhar") ?? item.davkhar ?? "",
            ),
            gereeniiId: gid,
            uldegdel: Number(item.uldegdel) || 0,
            turesiinOrlogo:
              Number(item.turesiinOrlogo || item.sariniiTureeSan) || 0,
          });
        }
      });

      rows.sort((a, b) =>
        a.toot.localeCompare(b.toot, undefined, { numeric: true, sensitivity: "base" })
      );
      setResidents(rows);
    } catch {
      toast.error("Оршин суугчдын мэдээлэл татахад алдаа гарлаа");
    } finally {
      setFetching(false);
    }
  }, [token, baiguullagiinId, barilgiinId]);

  /* ── Load discount history ── */
  const loadHistory = useCallback(async () => {
    if (!token || !baiguullagiinId) return;
    try {
      setHistFetching(true);
      // Шинэ бүртгэлтэй хөнгөлөлтүүд + өмнөх (бүртгэлгүй) хуучин мөрүүд
      const [tuukhRes, khuuchinRes] = await Promise.all([
        uilchilgee(token).get("/khungulultiinTuukhJagsaalt", {
          params: { baiguullagiinId, barilgiinId: barilgiinId || undefined },
        }),
        uilchilgee(token)
          .get("/guilgeeAvlaguud", {
            params: {
              baiguullagiinId,
              query: JSON.stringify({
                turul: "Хөнгөлөлт",
                khungulultiinTuukhId: { $exists: false },
                ...(barilgiinId ? { barilgiinId } : {}),
              }),
              sort: JSON.stringify({ ognoo: -1, createdAt: -1 }),
              khuudasniiKhemjee: 1000,
            },
          })
          .catch(() => ({ data: { jagsaalt: [] } })),
      ]);

      const murnuud: DiscountHistoryRow[] = [];
      (tuukhRes.data?.jagsaalt || []).forEach((t: any) => {
        const sarToo = t.ognoonuud?.length || 1;
        const gereenuud = t.khamaataiGereenuud || [];
        gereenuud.forEach((k: any) => {
          murnuud.push({
            _id: `${t._id}_${k.gereeniiId}`,
            tuukhId: String(t._id),
            gereeniiId: k.gereeniiId,
            createdAt: t.createdAt,
            ognoo: t.createdAt,
            ner: k.ner || "—",
            gereeniiDugaar: k.gereeniiDugaar || "—",
            orts: k.orts || "",
            davkhar: k.davkhar || "",
            toot: k.toot || "—",
            ekhlekhOgnoo: t.ekhlekhSar,
            duusakhOgnoo: t.duusakhSar,
            sariinDun: Number(k.sariinDun) || 0,
            tulukhDun: (Number(k.sariinDun) || 0) * sarToo,
            dun: Number(k.khungulsunDun) || 0,
            khungulukhKod: t.khungulukhTurul,
            khungulukhUtga: Number(t.khungulukhUtga) || 0,
            turul:
              t.khungulukhTurul === "khuvi"
                ? `${t.khungulukhUtga}%`
                : `${fmt(Number(t.khungulukhUtga) || 0)}₮/сар`,
            tailbar: t.shaltgaan || "",
            guilgeeKhiisenAjiltniiNer: t.ajiltniiNer || "Систем",
            zassan: t.zassanAjiltniiNer || "",
            bichlegiinToo: sarToo,
            gereeniiToo: gereenuud.length,
          });
        });
      });
      (khuuchinRes.data?.jagsaalt || []).forEach((h: any) => {
        // Бүртгэлтэй хөнгөлөлтийн мөр дээр давхар харагдахгүй
        if (h.khungulultiinTuukhId) return;
        const sar = h.ognoo ? dayjs(h.ognoo).format("YYYY-MM") : "";
        murnuud.push({
          ...h,
          createdAt: h.createdAt || h.ognoo,
          ner: h.ner || "—",
          gereeniiDugaar: h.gereeniiDugaar || "—",
          toot: h.toot || "—",
          ekhlekhOgnoo: sar,
          duusakhOgnoo: sar,
          tulukhDun: 0,
          dun: Math.abs(Number(h.dun) || 0),
          turul: h.khungulultKhuvi ? `${h.khungulultKhuvi}%` : "Дүнгээр",
          guilgeeKhiisenAjiltniiNer: h.guilgeeKhiisenAjiltniiNer || "Систем",
          zassan: "",
        });
      });
      murnuud.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
      setHistory(murnuud);
    } catch {
      toast.error("Хөнгөлөлтийн түүх татахад алдаа гарлаа");
    } finally {
      setHistFetching(false);
    }
  }, [token, baiguullagiinId, barilgiinId]);

  useEffect(() => {
    if (inline || show) {
      loadResidents();
    } else {
      setResidents([]);
      setSelectedIds(new Set());
      setHongololtUtga("");
      setShaltgaan("");
      setDavkhar("");
      setActiveTab("oruulakh");
      setHistory([]);
      setHistDavkhar("");
      setHistPage(1);
    }
    // loadResidents нь token/байгууллага/барилгаас хамаарна — F5 дарахад эдгээр
    // хоцорч ирдэг тул тэд ирмэгц дахин татна (өмнө нь зөвхөн [show] байсан
    // тул хоосон үлддэг байв).
  }, [show, inline, loadResidents]);

  useEffect(() => {
    if ((inline || show) && activeTab === "tuukh") {
      loadHistory();
    }
  }, [show, inline, activeTab, loadHistory]);

  /* ── Filtered list ── */
  /** Орон сууц / Агуулах / Зогсоол — тусад нь харуулна (холилдохгүй) */
  const [tootTurul, setTootTurul] = useState<string>("Орон сууц");
  const tootTurulToo = useMemo(() => {
    const m: Record<string, number> = {};
    residents.forEach((r) => {
      const k = r.turul || "Орон сууц";
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [residents]);
  const tootTurluud = ["Орон сууц", "Агуулах", "Зогсоол"].filter((k) => tootTurulToo[k]);

  const filteredResidents = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return residents.filter((r) => {
      if ((r.turul || "Орон сууц") !== tootTurul) return false;
      if (orts && String(r.orts || "") !== orts) return false;
      if (davkhar && String(r.davkhar || "") !== davkhar) return false;
      return (
        !q ||
        r.ner.toLowerCase().includes(q) ||
        r.toot.toLowerCase().includes(q) ||
        (r.utas || "").includes(q) ||
        (r.ovog || "").toLowerCase().includes(q)
      );
    });
  }, [residents, searchTerm, orts, davkhar, tootTurul]);

  const davkharOptions = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      if (h.davkhar) set.add(String(h.davkhar));
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = histSearch.trim().toLowerCase();
    return history.filter((h) => {
      if (histDavkhar && String(h.davkhar || "") !== histDavkhar) return false;

      const rowDate = h.ognoo || h.createdAt;
      if (rowDate && histDateRange[0] && histDateRange[1]) {
        const dStr = dayjs(rowDate).format("YYYY-MM-DD");
        if (dStr < histDateRange[0] || dStr > histDateRange[1]) {
          return false;
        }
      } else if (rowDate && histDateRange[0]) {
        const dStr = dayjs(rowDate).format("YYYY-MM-DD");
        if (dStr < histDateRange[0]) return false;
      }

      if (!q) return true;
      return (
        (h.ner || "").toLowerCase().includes(q) ||
        (h.toot || "").toLowerCase().includes(q) ||
        (h.gereeniiDugaar || "").toLowerCase().includes(q) ||
        (h.tailbar || "").toLowerCase().includes(q) ||
        (h.guilgeeKhiisenAjiltniiNer || "").toLowerCase().includes(q) ||
        (h.turul || "").toLowerCase().includes(q)
      );
    });
  }, [history, histSearch, histDavkhar, histDateRange]);

  const { totalTulukhDun, totalKhungulukhDun } = useMemo(() => {
    let tTulukh = 0;
    let tKhungulukh = 0;
    let tTulsun = 0;
    filteredHistory.forEach((h) => {
      tTulukh += Number(h.tulukhDun) || 0;
      tKhungulukh += Math.abs(Number(h.dun) || 0);
      tTulsun += Number(h.tulsunDun) || 0;
    });
    return {
      totalTulukhDun: tTulukh,
      totalKhungulukhDun: tKhungulukh,
      totalTulsunDun: tTulsun,
    };
  }, [filteredHistory]);

  const tuukhKhuraangui = useMemo(() => {
    const tuukhuud = new Set<string>();
    const suugchid = new Set<string>();
    filteredHistory.forEach((h) => {
      tuukhuud.add(h.tuukhId || h._id);
      if (h.gereeniiId) suugchid.add(String(h.gereeniiId));
    });
    return {
      too: tuukhuud.size,
      suugch: suugchid.size,
      dundaj: suugchid.size ? totalKhungulukhDun / suugchid.size : 0,
    };
  }, [filteredHistory, totalKhungulukhDun]);

  const totalPages = Math.ceil(filteredHistory.length / histPageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (histPage - 1) * histPageSize;
    return filteredHistory.slice(start, start + histPageSize);
  }, [filteredHistory, histPage, histPageSize]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const data = filteredHistory.map((h, i) => ({
        "№": i + 1,
        "Огноо": fmtDateTime(h.createdAt || h.ognoo),
        "Оршин суугч": h.ner || "",
        "Гэрээний дугаар": h.gereeniiDugaar || "",
        "Орц": h.orts || "",
        "Тоот": h.toot || "",
        "Эхлэх сар": h.ekhlekhOgnoo || "",
        "Дуусах сар": h.duusakhOgnoo || "",
        "Сарын тоо": h.bichlegiinToo || 1,
        "Хөнгөлөх": h.turul || "",
        "Хөнгөлөлтгүй дүн": Number(h.tulukhDun) || 0,
        "Хөнгөлөлт": Math.abs(Number(h.dun) || 0),
        "Шалтгаан": h.tailbar || "",
        "Ажилтан": h.guilgeeKhiisenAjiltniiNer || "",
        "Зассан": h.zassan || "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Хөнгөлөлт түүх");
      XLSX.writeFile(
        wb,
        `khungulult_tuukh_${dayjs().format("YYYY-MM-DD")}.xlsx`
      );
      toast.success("Excel амжилттай татагдлаа");
    } catch (e: any) {
      toast.error("Excel татахад алдаа гарлаа: " + (e?.message || ""));
    }
  };

  const handleDeleteDiscount = async (row: DiscountHistoryRow, tailbar: string) => {
    if (!tailbar || !tailbar.trim()) return false;
    try {
      const res = await uilchilgee(token).post(
        "/khungulultUstgaya",
        row.tuukhId
          ? { baiguullagiinId, tuukhId: row.tuukhId, gereeniiId: row.gereeniiId, tailbar: tailbar.trim() }
          : { baiguullagiinId, id: row._id, tailbar: tailbar.trim() },
      );
      if (res.data?.success === true) {
        toast.success(res.data?.message || "Хөнгөлөлт устгагдлаа");
        loadHistory();
        setSuuriShinechlel((n) => n + 1);
        if (onSuccess) onSuccess();
        return true;
      }
      toast.error(res.data?.message || "Хөнгөлөлт устгагдсангүй. Дахин оролдоно уу.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Устгахад алдаа гарлаа"
      );
    }
    return false;
  };

  /** Хөнгөлөлтийн хувь/дүнг засна — тухайн хөнгөлөлтийн БҮХ гэрээнд */
  const handleEditDiscount = async (row: DiscountHistoryRow, utga: number, tailbar: string) => {
    if (!row.tuukhId || !(utga > 0) || !tailbar.trim()) return false;
    try {
      await uilchilgee(token).post("/khungulultZasvarlaya", {
        baiguullagiinId,
        id: row.tuukhId,
        khungulukhUtga: utga,
        tailbar: tailbar.trim(),
      });
      toast.success("Хөнгөлөлт засагдлаа — бүх сарын дүн шинэчлэгдлээ");
      loadHistory();
      setSuuriShinechlel((n) => n + 1);
      if (onSuccess) onSuccess();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Засахад алдаа гарлаа");
      return false;
    }
  };

  /* ── Selection helpers ── */
  const isAllSelected =
    filteredResidents.length > 0 &&
    filteredResidents.every((r) => selectedIds.has(r._id));

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResidents.map((r) => r._id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Compute discount amount per resident ── */
  /**
   * Сонгосон мужид хэдэн сар багтаж байгаа. turees дээрх
   * `durationMultiplier` — 8-р сараас 10-р сар = 3.
   */
  const sariinToo = React.useMemo(() => {
    const [ey, em] = (selectedMonth || "").split("-").map(Number);
    const [dy, dm] = (duusakhSar || "").split("-").map(Number);
    if (!ey || !em || !dy || !dm) return 1;
    const zuruu = (dy - ey) * 12 + (dm - em);
    return zuruu >= 0 ? zuruu + 1 : 1;
  }, [selectedMonth, duusakhSar]);

  /**
   * Хувиар хөнгөлөх СУУРЬ — сонгосон сар(ууд)-д гэрээнд БОДИТ нэхэмжилсэн
   * төлбөр (зардал сонгосон бол зөвхөн тэр зардал). Өмнө нь
   * `turesiinOrlogo`-оос бодож байсан ч энэ талбар sukh-д байхгүй тул хувь
   * үргэлж 0₮ гарч «Хөнгөлөх дүн гарсан оршин суугч алга» алдаа заадаг байв.
   */
  /** Гэрээ бүрийн САРЫН төлбөр (turees: сарын түрээс) — хувийн суурь */
  const [suuriDun, setSuuriDun] = useState<
    Record<
      string,
      {
        sariinDun: number;
        zadargaa: { ner: string; dun: number }[];
        /** Ангилал бүрийн сарын төлбөр: Орон сууц / Агуулах / Зогсоол (гараж) */
        angilal?: Record<string, number>;
      }
    >
  >({});
  /** Гэрээ бүрийн бодит үлдэгдэл (авлагын дэвтрээс) — `/khungulultSuuriAvya` */
  const [boditUldegdel, setBoditUldegdel] = useState<Record<string, number> | null>(null);
  /** Гэрээ × ангиллын үлдэгдэл — нэг гэрээнд багтсан гараж/агуулахыг тусад нь */
  const [uldegdelAngilal, setUldegdelAngilal] = useState<Record<string, Record<string, number>> | null>(null);
  const [suuriAchaalj, setSuuriAchaalj] = useState(false);
  /** Хадгалсны дараа үлдэгдлийг дахин татахад нэмэгдэнэ */
  const [suuriShinechlel, setSuuriShinechlel] = useState(0);
  // Суурь нь сараас хамаарахгүй (гэрээний сарын төлбөр) — барилга солигдох
  // эсвэл оршин суугчдын жагсаалт шинэчлэгдэхэд л дахин татна.
  const gereeniiIdnuud = React.useMemo(
    () => Array.from(new Set(residents.map((r) => r.gereeniiId).filter(Boolean))).sort(),
    [residents],
  );
  const gereeniiIdTulkhuur = gereeniiIdnuud.join(",");
  React.useEffect(() => {
    if (!token || !baiguullagiinId || gereeniiIdnuud.length === 0) return;
    let khuchintei = true;
    setSuuriAchaalj(true);
    uilchilgee(token)
      .post("/khungulultSuuriAvya", {
        baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        gereeniiIdnuud,
      })
      .then((resp) => {
        if (khuchintei) {
          setSuuriDun(resp.data?.suuri || {});
          setBoditUldegdel(resp.data?.uldegdel || null);
          setUldegdelAngilal(resp.data?.uldegdelAngilal || null);
        }
      })
      .catch(() => {
        if (khuchintei) setSuuriDun({});
      })
      .finally(() => {
        if (khuchintei) setSuuriAchaalj(false);
      });
    return () => {
      khuchintei = false;
    };
  }, [token, baiguullagiinId, barilgiinId, gereeniiIdTulkhuur, suuriShinechlel]);

  /** Сонгосон сарууд ("YYYY-MM") */
  const saruud = React.useMemo(() => {
    const [ey, em] = (selectedMonth || "").split("-").map(Number);
    if (!ey || !em) return [] as string[];
    return Array.from({ length: sariinToo }, (_, i) => {
      const d = new Date(ey, em - 1 + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, [selectedMonth, sariinToo]);

  /** Гэрээний нэг сарын төлбөр (turees: сарын түрээс) */
  // Хувийн суурь — зөвхөн мөрийн ангиллын сарын төлбөр.
  const sariinTulbur = (r: ResidentRow): number => {
    const s = r.gereeniiId ? suuriDun[r.gereeniiId] : undefined;
    if (!s) return 0;
    if (s.angilal) return Number(s.angilal[r.turul || "Орон сууц"]) || 0;
    return Number(s.sariinDun) || 0;
  };

  /** Сар бүрийн хөнгөлөх дүн — сервер ижил томьёогоор дахин бодно */
  const sarBureer = (r: ResidentRow): Record<string, number> => {
    const val = parseFloat(hongololtUtga) || 0;
    const out: Record<string, number> = {};
    if (val <= 0) return out;
    const sariin =
      hongololtTurul === "percent"
        ? Math.round((sariinTulbur(r) * val) / 100)
        : Math.round(val);
    saruud.forEach((sar) => {
      out[sar] = sariin;
    });
    return out;
  };

  /** Хувийн суурь — сарын төлбөр (баганад харуулна) */
  const suuriNiilber = (r: ResidentRow): number => sariinTulbur(r);

  /** Мөрийн үлдэгдэл — бодит дэвтрийн үлдэгдэл байвал тэр */
  // Мөрийн төрлийн (орон сууц / агуулах / гараж) үлдэгдэл — нэг гэрээнд
  // багтсан ч ангилал бүр өөрийн үлдэгдэлтэй харагдана.
  const murUldegdel = (r: ResidentRow): number => {
    const ang = r.gereeniiId ? uldegdelAngilal?.[r.gereeniiId] : undefined;
    if (ang) return Number(ang[r.turul || "Орон сууц"]) || 0;
    return boditUldegdel && r.gereeniiId
      ? Number(boditUldegdel[r.gereeniiId]) || 0
      : Number(r.uldegdel) || 0;
  };

  const computeDiscount = (r: ResidentRow): number => {
    const val = parseFloat(hongololtUtga) || 0;
    if (val <= 0) return 0;
    const khonog = parseFloat(khungulultKhonog) || 0;

    if (hongololtTurul === "percent") {
      // Хоногийн горимд сарын төлбөрийг 30 хоногт хувааж авна.
      if (khonogTootsokh) {
        if (khonog <= 0) return 0;
        return Math.round(((sariinTulbur(r) * val) / 100 / 30) * khonog);
      }
      // Сар бүрийн бодит төлбөрөөс хувь — нийлбэр нь сарын үржүүлэгчийг
      // өөрөө агуулна.
      return Object.values(sarBureer(r)).reduce((a, b) => a + b, 0);
    }

    // Дүнгээр: сар бүрт ижил дүн.
    if (khonogTootsokh) {
      if (khonog <= 0) return 0;
      return Math.round((val / 30) * khonog);
    }
    return Math.round(val) * sariinToo;
  };

  /* ── Summary ── */
  // Хайлт/шүүлтээр нуугдсан ч сонгосон мөр тооцоонд орно
  const summaryRows = residents.filter((r) => selectedIds.has(r._id));
  const totalDun = summaryRows.reduce((s, r) => s + computeDiscount(r), 0);
  /** Сонгосон мөрүүдийн хөнгөлөлтийн ӨМНӨХ үлдэгдэл (хураангуйд хөдөлдөггүй) */
  const tukhainSariinUldegdel = summaryRows.reduce((s, r) => s + murUldegdel(r), 0);
  /** Сонгосон оршин суугчдын үлдэгдлээс хөнгөлөлтийг хассан дүн */
  const niitUldegdel = summaryRows.reduce(
    (s, r) => s + murUldegdel(r) - computeDiscount(r),
    0,
  );

  /* ── Submit ── */
  const handleSubmit = async () => {
    const val = parseFloat(hongololtUtga) || 0;
    // Шалгалт — маягтын дарааллаар, юу дутуу байгааг тодорхой хэлнэ
    if (selectedIds.size === 0) {
      toast.error("Хөнгөлөх оршин суугчаа хүснэгтээс сонгоно уу. Бүгдийг сонгох бол толгойн checkbox-ыг дарна.");
      return;
    }
    if (!selectedMonth) {
      toast.error("Хөнгөлөх сараа «Огноо» талбараас сонгоно уу");
      return;
    }
    if (!val || val <= 0) {
      toast.error(
        hongololtTurul === "percent"
          ? "Хөнгөлөх хувиа оруулна уу (жишээ нь 10)"
          : "Сар бүр хөнгөлөх дүнгээ оруулна уу (жишээ нь 50,000)",
      );
      return;
    }
    if (hongololtTurul === "percent" && val > 100) {
      toast.error("Хөнгөлөх хувь 100%-иас их байж болохгүй");
      return;
    }
    // Байгууллагын тохируулсан дээд хувь
    if (hongololtTurul === "percent" && deedKhuvi != null && val > deedKhuvi) {
      toast.error(`Хөнгөлөх хувь ${val}% байна. Тохиргоогоор хамгийн ихдээ ${deedKhuvi}% хөнгөлөх боломжтой.`);
      return;
    }
    if (!shaltgaan.trim()) {
      toast.error("Хөнгөлөлт олгох шалтгаанаа бичнэ үү — түүх дээр харагдана");
      return;
    }
    if (hongololtTurul === "percent" && suuriAchaalj) {
      toast.error("Сарын төлбөрийг бодож байна, түр хүлээгээд дахин дарна уу");
      return;
    }

    const applyTo = residents.filter((r) => selectedIds.has(r._id));

    if (applyTo.length === 0) {
      toast.error("Сонгосон оршин суугч жагсаалтад алга. Жагсаалтаа шинэчлээд дахин сонгоно уу.");
      return;
    }
    const gereeguiToo = applyTo.filter((r) => !r.gereeniiId).length;

    // Олон сар сонгосон бол шалтгаанд хугацааг нь үлдээнэ — түүх дээрээс
    // яагаад дүн нь их байгаа нь ойлгомжтой байг.
    const khugatsaaTemdeglel =
      sariinToo > 1 && !khonogTootsokh
        ? ` (${selectedMonth} — ${duusakhSar}, ${sariinToo} сар)`
        : khonogTootsokh
          ? ` (${khungulultKhonog} хоног)`
          : "";

    if (khonogTootsokh && !(parseFloat(khungulultKhonog) > 0)) {
      toast.error("Хөнгөлөх хоногоо оруулна уу");
      return;
    }

    setLoading(true);

    // Нэг хүсэлтээр бөөнөөр. Өмнө нь гэрээ бүрт тусдаа POST явуулдаг
    // байсан тул 200 тоотод 200 хүсэлт үүсч, аль нь унасныг мэдэх ч
    // боломжгүй байв.
    const ilgeekhGereenuud = applyTo
      .filter((r) => r.gereeniiId)
      .map((r) => ({
        gereeniiId: r.gereeniiId,
        toot: r.toot,
        dun: computeDiscount(r),
        saraar: sarBureer(r),
      }))
      .filter((x) => x.dun > 0);

    if (ilgeekhGereenuud.length === 0) {
      setLoading(false);
      toast.error(
        gereeguiToo === applyTo.length
          ? "Сонгосон оршин суугчид гэрээгүй тул хөнгөлөлт оруулах боломжгүй"
          : hongololtTurul === "percent"
            ? "Сонгосон оршин суугчдын гэрээнд сарын төлбөр тохируулаагүй тул хувиар хөнгөлөх суурь 0₮ байна. Дүнгээр хөнгөлнө үү."
            : "Хөнгөлөх дүн бодогдсонгүй. Дүнгээ шалгана уу.",
      );
      return;
    }

    try {
      const resp: any = await uilchilgee(token).post("/khungulultKhadgalya", {
        baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        // Сервер дүнг өөрөө (гэрээний сарын төлбөрөөс) дахин бодно
        // Нэг гэрээнд ижил ангиллын хоёр мөр (жишээ 2 гараж) байж болох тул давхардуулахгүй
        gereenuud: Array.from(new Set(ilgeekhGereenuud.map((g) => g.gereeniiId))).map((gereeniiId) => ({ gereeniiId })),
        angilal: tootTurul,
        ekhlekhSar: selectedMonth,
        duusakhSar: duusakhSar || selectedMonth,
        khungulukhTurul: hongololtTurul === "percent" ? "khuvi" : "dun",
        khungulukhUtga: parseFloat(hongololtUtga) || 0,
        shaltgaan: `${shaltgaan.trim()}${khugatsaaTemdeglel}`,
      });

      const ur = resp?.data?.results;
      const amjilttai = ur?.success?.length ?? 0;
      const alggasan = ur?.alggasanGereenuud ?? [];
      const aldaatai = ur?.failed ?? [];

      if (amjilttai > 0) {
        toast.success(`${amjilttai} оршин суугчид хөнгөлөлт бүртгэгдлээ`);
        onSuccess?.();
        // Маягтыг цэвэрлэж, үлдэгдэл/түүхийг хуудас ачаалахгүйгээр шинэчилнэ
        setHongololtUtga("");
        setShaltgaan("");
        setSelectedIds(new Set());
        setSuuriShinechlel((n) => n + 1);
        loadHistory();
      }

      // Сонгосон сард төлбөргүй байсан гэрээг нэр заан мэдэгдэнэ —
      // чимээгүй алгасвал хэрэглэгч хөнгөлөлт суусан гэж эндүүрнэ.
      if (alggasan.length > 0) {
        toast.error(
          `${alggasan.length} оршин суугчид хөнгөлөлт суугаагүй: ` +
          alggasan
            .slice(0, 3)
            .map((x: any) => `${x.toot || x.gereeniiDugaar} тоот — ${x.shaltgaan || "шалтгаан тодорхойгүй"}`)
            .join("; ") +
          (alggasan.length > 3 ? " …" : ""),
          { duration: 7000 },
        );
      }
      if (aldaatai.length > 0) {
        toast.error(
          `${aldaatai.length} оршин суугчид хөнгөлөлт хадгалагдсангүй: ${aldaatai[0]?.error || "алдаа гарлаа"}`,
          { duration: 7000 },
        );
      }
      if (amjilttai > 0 && alggasan.length === 0 && aldaatai.length === 0) {
        onClose?.();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Хөнгөлөлт хадгалахад алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.",
      );
    }

    setLoading(false);
  };

  // Хөнгөлөлт олгох оршин суугчдын хүснэгтийн багана.
  const khungulultColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Нэр",
        sorter: (a: any, b: any) => String(a.ner || "").localeCompare(String(b.ner || "")),
        key: "ner",
        width: 220,
        render: (_: any, r: any) => (
          <div className="font-normal whitespace-nowrap">
            {r.ner || "—"}
          </div>
        ),
      },
      {
        title: "Дугаар",
        sorter: (a: any, b: any) => String(a.utas || "").localeCompare(String(b.utas || "")),
        dataIndex: "utas",
        key: "utas",
        width: 110,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Орц",
        sorter: (a: any, b: any) =>
          String(a.orts || "").localeCompare(String(b.orts || ""), undefined, { numeric: true }),
        dataIndex: "orts",
        key: "orts",
        width: 60,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Давхар",
        sorter: (a: any, b: any) =>
          String(a.davkhar || "").localeCompare(String(b.davkhar || ""), undefined, { numeric: true }),
        dataIndex: "davkhar",
        key: "davkhar",
        width: 65,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Тоот",
        sorter: (a: any, b: any) =>
          String(a.toot || "").localeCompare(String(b.toot || ""), undefined, { numeric: true }),
        dataIndex: "toot",
        key: "toot",
        width: 70,
        align: "center",
        render: (v: any) => <span className="font-medium">{v || "—"}</span>,
      },
      {
        title: "Үлдэгдэл",
        sorter: (a: any, b: any) => murUldegdel(a) - murUldegdel(b),
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 110,
        align: "right",
        render: (_: any, r: any) => {
          const v = murUldegdel(r);
          return (
            <span
              className={`tabular-nums whitespace-nowrap ${
                v > 0 ? "text-danger" : "opacity-70"
              }`}
            >
              {fmt(v)}
            </span>
          );
        },
      },
      // Хувиар хөнгөлөхөд суурь нь ҮЛДЭГДЭЛ биш — сонгосон сар(ууд)-ын
      // нэхэмжилсэн төлбөр. Харуулахгүй бол «10% нь яагаад ийм бага вэ» гэж
      // андуурдаг байв.
      ...(hongololtTurul === "percent"
        ? [
            {
              title: "Сарын төлбөр",
              key: "suuri",
              width: 120,
              align: "right" as const,
              sorter: (a: any, b: any) => suuriNiilber(a) - suuriNiilber(b),
              render: (_: any, r: any) => {
                const v = suuriNiilber(r);
                return (
                  <span
                    className={`tabular-nums whitespace-nowrap ${v > 0 ? "" : "text-[color:var(--muted-text)]"}`}
                    title={
                      (r.gereeniiId &&
                        suuriDun[r.gereeniiId]?.zadargaa
                          ?.filter((z) => angilalTaniya(z.ner) === (r.turul || "Орон сууц"))
                          .map((z) => `${z.ner}: ${fmt(z.dun)}₮`)
                          .join("\n")) ||
                      "Гэрээний сарын төлбөр — хувь үүнээс бодогдоно"
                    }
                  >
                    {suuriAchaalj && !(v > 0) ? "…" : fmt(v > 0 ? v : 0)}
                  </span>
                );
              },
            },
          ]
        : []),
      {
        title: "Хөнгөлөгдөх дүн",
        sorter: (a: any, b: any) => computeDiscount(a) - computeDiscount(b),
        key: "khungulult",
        width: 130,
        align: "right",
        render: (_: any, r: any) => {
          // "Бүгд" горимд сонголтоос үл хамааран бүх мөр хөнгөлөгдөнө.
          const isTarget = selectedIds.has(r._id);
          const discountDun = computeDiscount(r);
          return isTarget && discountDun > 0 ? (
            <span className="font-medium tabular-nums whitespace-nowrap text-brand">
              -{fmt(discountDun)}
            </span>
          ) : (
            <span className="tabular-nums text-[color:var(--muted-text)]">0</span>
          );
        },
      },
    ],
     
    [selectMode, selectedIds, computeDiscount, murUldegdel, hongololtTurul, suuriNiilber, suuriDun, suuriAchaalj],
  );

  // Хөнгөлөлтийн түүхийн хүснэгтийн багана.
  const tuukhiinColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Огноо",
        key: "ognoo",
        width: 150,
        sorter: (a: any, b: any) =>
          new Date(a.createdAt || a.ognoo || 0).getTime() - new Date(b.createdAt || b.ognoo || 0).getTime(),
        render: (_: any, h: any) => {
          const [udur, tsag] = String(fmtDateTime(h.createdAt || h.ognoo) || "").split(" ");
          return (
            <div className="leading-tight tabular-nums">
              <div className="text-[13px] text-[color:var(--panel-text)]">{udur || "—"}</div>
              {tsag && <div className="text-[12px] text-[color:var(--muted-text)]">{tsag}</div>}
            </div>
          );
        },
      },
      {
        // Нэр, гэрээ, орц, тоот — нэг баганад: хэн болохыг нэг харцаар
        title: "Оршин суугч",
        key: "ner",
        width: 240,
        sorter: (a: any, b: any) => String(a.ner || "").localeCompare(String(b.ner || "")),
        render: (_: any, h: any) => (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] text-[color:var(--panel-text)]">{h.ner || "—"}</div>
            <div className="truncate text-[12px] text-[color:var(--muted-text)]">
              {[h.gereeniiDugaar, h.orts ? `${h.orts}-р орц` : "", h.toot ? `${h.toot} тоот` : ""]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
          </div>
        ),
      },
      {
        title: "Хугацаа",
        key: "khugatsaa",
        width: 200,
        render: (_: any, h: any) => (
          <span className="whitespace-nowrap text-[13px] tabular-nums text-[color:var(--panel-text)]">
            {h.ekhlekhOgnoo || "—"}
            {h.duusakhOgnoo && h.duusakhOgnoo !== h.ekhlekhOgnoo && (
              <>
                <span className="mx-1.5 text-[color:var(--muted-text)]">→</span>
                {h.duusakhOgnoo}
              </>
            )}
            {(h.bichlegiinToo || 0) > 1 && (
              <span className="ml-1.5 text-[12px] text-[color:var(--muted-text)]">· {h.bichlegiinToo} сар</span>
            )}
          </span>
        ),
      },
      {
        title: "Хөнгөлөлтгүй дүн",
        dataIndex: "tulukhDun",
        key: "tulukhDun",
        width: 120,
        align: "right" as const,
        sorter: (a: any, b: any) => (a.tulukhDun || 0) - (b.tulukhDun || 0),
        render: (v: any) => <span className="whitespace-nowrap tabular-nums">{fmt2(v || 0)}</span>,
      },
      {
        title: "Хөнгөлөлт",
        dataIndex: "dun",
        key: "dun",
        width: 120,
        align: "right" as const,
        sorter: (a: any, b: any) => Math.abs(a.dun || 0) - Math.abs(b.dun || 0),
        render: (v: any) => (
          <span className="whitespace-nowrap tabular-nums text-brand">−{fmt2(Math.abs(v || 0))}</span>
        ),
      },
      {
        title: "Хөнгөлөх",
        key: "turul",
        width: 120,
        align: "center" as const,
        render: (_: any, h: any) => (
          <span className="inline-flex rounded-full bg-theme/10 px-2 py-0.5 text-[12px] text-brand whitespace-nowrap">
            {h.turul || "—"}
          </span>
        ),
      },
      {
        title: "Шалтгаан",
        key: "tailbar",
        width: 200,
        render: (_: any, h: any) => (
          <span
            className="block truncate text-[13px] text-[color:var(--muted-text)]"
            title={h.tailbar || undefined}
          >
            {h.tailbar || "—"}
          </span>
        ),
      },
      {
        title: "Ажилтан",
        key: "ajiltan",
        width: 150,
        render: (_: any, h: any) => (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] text-[color:var(--panel-text)]">
              {h.guilgeeKhiisenAjiltniiNer || "CAdmin"}
            </div>
            {h.zassan && h.zassan !== "-" && (
              <div className="truncate text-[12px] text-[color:var(--muted-text)]">Зассан: {h.zassan}</div>
            )}
          </div>
        ),
      },
      {
        title: "",
        key: "action",
        width: 88,
        align: "center" as const,
        // Засах функц бэлэн болоогүй тул зөвхөн устгах. Устгахад шалтгаан
        // заавал — мөрийн хажууд жижиг баталгаажуулах хэсэг гарна.
        render: (_: any, h: any) => (
          <div className="flex items-center justify-center gap-0.5">
            {h.tuukhId && (
              <ZasakhBatalgaa
                khuvi={h.khungulukhKod === "khuvi"}
                odoogiin={Number(h.khungulukhUtga) || 0}
                gereeniiToo={Number(h.gereeniiToo) || 1}
                onConfirm={(utga, tailbar) => handleEditDiscount(h, utga, tailbar)}
              />
            )}
            <UstgakhBatalgaa onConfirm={(tailbar) => handleDeleteDiscount(h, tailbar)} />
          </div>
        ),
      },
    ],
    [token, baiguullagiinId, loadHistory],
  );

  if (!inline && !show) return null;

  /**
   * Таб ба агуулга — модал ба хуудас хоёулаа үүнийг хуваалцана.
   * Ингэснээр нэг эх сурвалжтай үлдэж, зан төлөв зөрөхгүй.
   */
  const aguulga = (
    <>
      {/* ── Tabs + хайлт нэг эгнээнд ── */}
      <div className="flex flex-wrap items-center gap-1 px-2 pt-1 pb-1 shrink-0">
        {(
          [
            { id: "oruulakh", label: "Хөнгөлөлт оруулах", icon: Tag },
            { id: "tuukh", label: "Хөнгөлөлт түүх", icon: History },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-xl transition-all ${activeTab === id
              ? "bg-theme/15 text-brand"
              : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        {activeTab === "oruulakh" && (
          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                title="Сонголтыг цуцлах — шүүгдсэн бүх оршин суугчид хөнгөлөлт сууна"
                className="inline-flex items-center gap-1 rounded-lg bg-theme/10 px-2 py-1 text-xs text-brand hover:bg-theme/15"
              >
                {selectedIds.size} сонгосон
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={loadResidents}
              disabled={fetching}
              className="btn-minimal inline-flex h-9 w-9 items-center justify-center !p-0"
              title="Дахин ачааллах"
            >
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* ══ TAB 1 — ОРУУЛАХ ══ */}
      {activeTab === "oruulakh" && (
        <div className="flex flex-1 min-h-0 overflow-hidden gap-4 lg:gap-6 pt-3 px-2">
          {/* Left panel — «шошго | талбар» мөрүүд (turees-ийн маягттай ижил) */}
          <div className="w-80 lg:w-[380px] xl:w-[400px] shrink-0 flex flex-col rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <h3 className="text-[13px] font-medium text-[color:var(--panel-text)]">
                Хамрах хүрээ
              </h3>

              {/* Тоотын төрөл — орон сууц, агуулах, гаражийг тусад нь (анхдагч: Орон сууц) */}
              <Mur shoshgo="Төрөл">
                <FilterSelect
                  value={tootTurul}
                  onChange={(v: string) => {
                    if (!v) return;
                    setTootTurul(v);
                    setSelectedIds(new Set());
                  }}
                  options={["Орон сууц", "Агуулах", "Зогсоол"].map((k) => ({
                    value: k,
                    label: `${k === "Зогсоол" ? "Гараж" : k} (${tootTurulToo[k] || 0})`,
                  }))}
                  placeholder="Орон сууц"
                  bugdLabel={null}
                  className="w-full"
                />
              </Mur>

              <Mur shoshgo="Орц">
                <FilterSelect
                  value={orts}
                  onChange={setOrts}
                  options={ortsSongoltuud.map((o: string) => ({ value: o, label: o }))}
                  placeholder="Бүх орц"
                  bugdLabel="Бүх орц"
                  className="w-full"
                />
              </Mur>

              <Mur shoshgo="Давхар">
                <FilterSelect
                  value={davkhar}
                  onChange={setDavkhar}
                  options={davkharSongoltuud.map((d: string) => ({ value: d, label: d }))}
                  placeholder="Бүх давхар"
                  bugdLabel="Бүх давхар"
                  searchable={davkharSongoltuud.length > 8}
                  className="w-full"
                />
              </Mur>

              <Mur shoshgo="Огноо" shaardlagatai>
                <FilterDatePicker
                  picker="month"
                  value={
                    selectedMonth
                      ? [selectedMonth, duusakhSar || selectedMonth]
                      : null
                  }
                  onChange={(_, [start, end]) => {
                    setSelectedMonth(start || "");
                    setDuusakhSar(end || start || "");
                  }}
                  placeholder="Эхлэх сар → Дуусах сар"
                  className="w-full"
                />
              </Mur>

              <Mur shoshgo="Хөнгөлөх төрөл">
                <FilterSelect
                  value={hongololtTurul}
                  onChange={(v) => setHongololtTurul(v as HongololtTurul)}
                  options={[
                    { value: "percent", label: "Хувь (%)" },
                    { value: "amount", label: "Дүн (₮)" },
                  ]}
                  bugdLabel={null}
                  allowClear={false}
                  className="w-full"
                />
              </Mur>

              <Mur
                shoshgo={hongololtTurul === "percent" ? "Хөнгөлөх хувь" : "Хөнгөлөх дүн"}
                shaardlagatai
              >
                <div className="relative">
                  {/* Дүнг мянгатын таслалтай харуулна, төлөвт цэвэр тоо хадгална.
                      Дээд хязгаарыг доор нь биш placeholder-т — мөрүүд нэг
                      эгнээндээ үлдэнэ. */}
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={
                      hongololtTurul === "percent"
                        ? `0 – ${deedKhuvi ?? 100}`
                        : "0"
                    }
                    value={
                      hongololtTurul === "amount" && hongololtUtga
                        ? (() => {
                            const [bukhel, butarkhai] = hongololtUtga.split(".");
                            const f = Number(bukhel || 0).toLocaleString("en-US");
                            return butarkhai !== undefined ? `${f}.${butarkhai}` : f;
                          })()
                        : hongololtUtga
                    }
                    onChange={(e) => {
                      // Зөвхөн тоо ба нэг цэг үлдээнэ
                      let v = e.target.value.replace(/[^0-9.]/g, "");
                      const i = v.indexOf(".");
                      if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
                      setHongololtUtga(v);
                    }}
                    className={`${TALBAR} !pr-8 tabular-nums`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--muted-text)]">
                    {hongololtTurul === "percent" ? "%" : "₮"}
                  </span>
                </div>
              </Mur>

              {/* Шалтгаан — бусад талбартай нэг эгнээнд (шошго зүүн, талбар баруун) */}
              <div className="grid grid-cols-[112px_1fr] items-start gap-3">
                <label htmlFor="khungulult-shaltgaan" className="pt-2 text-[13px] text-[color:var(--muted-text)]">
                  <span className="mr-0.5 text-danger">*</span>Шалтгаан:
                </label>
                <textarea
                  id="khungulult-shaltgaan"
                  rows={4}
                  placeholder="Хөнгөлөлт олгох шалтгаанаа бичнэ үү"
                  value={shaltgaan}
                  onChange={(e) => setShaltgaan(e.target.value)}
                  className={`${TALBAR} !h-auto min-h-[96px] resize-y py-2 leading-relaxed`}
                />
              </div>
            </div>

            {/* Хураангуй */}
            <div className="shrink-0 space-y-1.5 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-5 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Нийт хөнгөлөх тоо:</span>
                <span className="font-medium tabular-nums text-[color:var(--panel-text)]">
                  {summaryRows.length}
                </span>
              </div>
              {/* Хөнгөлөлт оруулахаас үл хамааран хөдөлдөггүй — сонгосон мөрүүдийн
                  тухайн сарын үлдэгдэл (хөнгөлөлтийн өмнөх). */}
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Тухайн сарын үлдэгдэл:</span>
                <span className="font-medium tabular-nums text-[color:var(--panel-text)]">
                  {fmt(summaryRows.length ? tukhainSariinUldegdel : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Нийт хөнгөлсөн дүн:</span>
                <span className="font-medium tabular-nums text-brand">
                  {fmt(summaryRows.length ? totalDun : 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Нийт үлдэгдэл:</span>
                <span className={`font-medium tabular-nums ${summaryRows.length && niitUldegdel > 0 ? "text-danger" : "text-[color:var(--panel-text)]"}`}>
                  {fmt(summaryRows.length ? niitUldegdel : 0)}
                </span>
              </div>
              
            </div>

            {/* Actions */}
            <div className="flex shrink-0 justify-between gap-2 border-t border-[color:var(--surface-border)] px-5 py-3">
              {/* Хуудсан (inline) дээр onClose байхгүй тул өмнө нь товч юу ч
                  хийдэггүй байв — одоо маягтыг цэвэрлэнэ, модал бол хаана. */}
              <button
                type="button"
                onClick={() => {
                  if (!inline && onClose) {
                    onClose();
                    return;
                  }
                  setHongololtUtga("");
                  setShaltgaan("");
                  setSelectedIds(new Set());
                }}
                disabled={loading}
                className="btn-minimal inline-flex h-9 min-w-[96px] items-center justify-center !px-4 text-[13px]"
              >
                {inline ? "Цэвэрлэх" : "Цуцлах"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || fetching || (hongololtTurul === "percent" && suuriAchaalj)}
                className="inline-flex h-9 min-w-[120px] items-center justify-center gap-1.5 rounded-[10px] bg-theme px-4 text-[13px] font-medium !text-white shadow-[var(--ctl-shadow)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Хадгалах
              </button>
            </div>
          </div>

          {/* Right panel: resident table */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Table — гүйлгэлтийг хүснэгт өөрөө хариуцна */}
            <div className="min-h-0 flex-1">
              <Table<any>
                  fillHeight={inline}
                 
                  columns={khungulultColumns}
                  dataSource={filteredResidents}
                  rowKey={(r) => r._id}
                  loading={fetching}
                  locale={{ emptyText: "Оршин суугч олдсонгүй" }}
                  pagination={false}
                  rowSelection={{
                    selectedRowKeys: Array.from(selectedIds),
                    onChange: (keys) => {
                      setSelectedIds(new Set(keys as string[]));
                      // Сонгосон мөр байвал зөвхөн тэдэнд хөнгөлөлт сууна (selectMode)
                    },
                  }}
                  onRow={(r) => ({
                    onClick: (e: React.MouseEvent) => {
                      // Checkbox-ийн даралт мөрийн onClick руу ч хөөрдөг тул
                      // хоёр удаа сэлгэгдээд буцаад хэвэндээ ордог байв.
                      if ((e.target as HTMLElement).closest("input,label,.zt-checkbox,[role=checkbox]")) return;
                      toggleOne(r._id);
                    },
                    className: "cursor-pointer",
                  })}
                />
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 2 — ТҮҮХ ══ */}
      {activeTab === "tuukh" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-3 px-2">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <FilterDatePicker
                  value={
                      histDateRange[0] && histDateRange[1]
                        ? [histDateRange[0], histDateRange[1]]
                        : undefined
                    }
                  onChange={(_: any, dateStrings: [string, string]) => {
                      if (dateStrings && Array.isArray(dateStrings) && (dateStrings[0] || dateStrings[1])) {
                        setHistDateRange([dateStrings[0] || null, dateStrings[1] || null]);
                      } else {
                        setHistDateRange([null, null]);
                      }
                      setHistPage(1);
                    }}
                  format="YYYY-MM-DD"
                  placeholder={["Эхлэх огноо", "Дуусах огноо"]}
                  className="w-full sm:w-[284px]"
                />
                <FilterSelect
                  label="Давхар"
                  value={histDavkhar}
                  onChange={(v) => {
                    setHistDavkhar(v);
                    setHistPage(1);
                  }}
                  options={davkharOptions.map((d) => ({ value: String(d), label: `${d} давхар` }))}
                />
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={histFetching}
                  className="btn-minimal inline-flex h-9 w-9 items-center justify-center !p-0"
                  title="Дахин ачааллах"
                  aria-label="Дахин ачааллах"
                >
                  <RefreshCw className={`h-4 w-4 ${histFetching ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div>
                <ExcelButton onClick={handleExportExcel} />
              </div>
            </div>

            {/* Хураангуй — шүүсэн хугацааны хөнгөлөлт нэг харцаар */}
            <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { ner: "Хөнгөлөлт", utga: String(tuukhKhuraangui.too), tailbar: "удаа" },
                { ner: "Хамрагдсан", utga: String(tuukhKhuraangui.suugch), tailbar: "оршин суугч" },
                { ner: "Нийт хөнгөлсөн", utga: fmt2(totalKhungulukhDun), tailbar: "₮", brand: true },
                { ner: "Дундаж", utga: fmt2(tuukhKhuraangui.dundaj), tailbar: "₮ / оршин суугч" },
              ].map((k) => (
                <div key={k.ner} className="rounded-xl border border-[color:var(--surface-border)] px-3.5 py-2.5">
                  <div className="text-[12px] text-[color:var(--muted-text)]">{k.ner}</div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className={`text-[18px] tabular-nums ${k.brand ? "text-brand" : "text-[color:var(--panel-text)]"}`}>
                      {k.utga}
                    </span>
                    <span className="text-[12px] text-[color:var(--muted-text)]">{k.tailbar}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* History table — гүйлгэлтийг хүснэгт өөрөө хариуцна */}
            <div className="min-h-0 flex-1">
              <Table<any>
                  className=""
                  columns={tuukhiinColumns}
                  dataSource={paginatedHistory}
                  rowKey={(h) => h._id}
                  loading={histFetching}
                  locale={{ emptyText: "Хөнгөлөлтийн түүх байхгүй" }}
                  pagination={false}
                  scroll={{ x: 1380 }}
                  fillHeight={inline}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={3}>
                        <span className="text-[13px] text-[color:var(--muted-text)]">
                          Нийт {filteredHistory.length} хөнгөлөлт
                        </span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                        {fmt2(totalTulukhDun)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                        <span className="text-brand">−{fmt2(totalKhungulukhDun)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                      </Table.Summary.Cell>
                      <Table.Summary.Cell colSpan={3} />
                    </Table.Summary.Row>
                  )}
                />
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-end gap-3 px-1 pt-3 text-[13px] text-[color:var(--muted-text)] shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                  disabled={histPage <= 1}
                  className="btn-minimal inline-flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-theme/40 bg-theme/10 px-2 tabular-nums text-brand">
                  {histPage}
                </span>
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.min(totalPages, p + 1))}
                  disabled={histPage >= totalPages}
                  className="btn-minimal inline-flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <select
                value={histPageSize}
                onChange={(e) => {
                  setHistPageSize(Number(e.target.value));
                  setHistPage(1);
                }}
                className="stg-select !h-9 text-[13px]"
              >
                <option value={20}>20 / хуудас</option>
                <option value={50}>50 / хуудас</option>
                <option value={100}>100 / хуудас</option>
                <option value={200}>200 / хуудас</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Хуудсан дээр байрлах үед модалын бүрхүүл (portal, дэвсгэр,
  // чирэх толгой, хаах товч) шаардлагагүй.
  if (inline) {
    return <div className="flex flex-col">{aguulga}</div>;
  }

  /* ─── JSX ─────────────────────────────────────────────────────────────── */
  return (
    <AnimatePresence>
      <ModalPortal>
        <motion.div
          ref={constraintsRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onClick={(e) => e.stopPropagation()}
            className="w-full flex flex-col modal-surface rounded-2xl shadow-2xl text-sm relative overflow-hidden"
            style={{ maxWidth: "1200px", maxHeight: "92vh" }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[color:var(--surface-border)] cursor-move select-none shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-theme/15 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <h3 className="font-medium text-base text-[color:var(--panel-text)] dark:text-white leading-tight">
                    Хөнгөлөлт
                  </h3>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Оршин суугчдад хөнгөлөлт бүртгэх
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] transition-colors p-1.5 rounded-xl hover:bg-[color:var(--surface-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aguulga}
          </motion.div>
        </motion.div>
      </ModalPortal>
    </AnimatePresence>
  );
}

/** Устгах товч + жижиг баталгаажуулах хэсэг (шалтгаан заавал) */
function UstgakhBatalgaa({ onConfirm }: { onConfirm: (tailbar: string) => Promise<boolean> }) {
  const [neelttei, setNeelttei] = useState(false);
  const [shaltgaan, setShaltgaan] = useState("");
  const [ustgaj, setUstgaj] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const [bairlal, setBairlal] = useState<{ top: number; left: number } | null>(null);

  // Хүснэгт дотроо гүйдэг тул popover-ыг body-д fixed байрлалаар гаргана;
  // доор зай байхгүй бол дээш нээнэ.
  React.useLayoutEffect(() => {
    if (!neelttei || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const undur = 170;
    const urgun = 280;
    const deesh = window.innerHeight - r.bottom < undur + 12;
    setBairlal({
      top: deesh ? r.top - undur - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - urgun, window.innerWidth - urgun - 8)),
    });
  }, [neelttei]);

  React.useEffect(() => {
    if (!neelttei) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setNeelttei(false);
    };
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) setNeelttei(false);
    };
    window.addEventListener("scroll", onScroll, true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNeelttei(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [neelttei]);

  const batalgaajuulakh = async () => {
    if (!shaltgaan.trim() || ustgaj) return;
    setUstgaj(true);
    const ok = await onConfirm(shaltgaan.trim());
    setUstgaj(false);
    if (ok) {
      setNeelttei(false);
      setShaltgaan("");
    }
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setNeelttei((v) => !v)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          neelttei ? "bg-danger/10 text-danger" : "text-[color:var(--muted-text)] hover:bg-danger/10 hover:text-danger"
        }`}
        title="Устгах"
        aria-label="Устгах"
        aria-expanded={neelttei}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {neelttei && bairlal && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Хөнгөлөлт устгах"
          style={{ position: "fixed", top: bairlal.top, left: bairlal.left, zIndex: 13000 }}
          className="w-[280px] rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3 text-left shadow-xl"
        >
          <p className="text-[14px] text-[color:var(--panel-text)]">Хөнгөлөлтийг устгах уу?</p>
          <p className="mt-0.5 text-[12px] text-[color:var(--muted-text)]">
            Оршин суугчийн төлөх дүн буцаж нэмэгдэнэ.
          </p>
          <input
            autoFocus
            value={shaltgaan}
            onChange={(e) => setShaltgaan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && batalgaajuulakh()}
            placeholder="Устгах шалтгаан (заавал)"
            className="stg-input mt-2.5 !h-9 text-[13px]"
          />
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNeelttei(false)}
              className="btn-minimal inline-flex h-9 items-center !px-3 text-[13px]"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={batalgaajuulakh}
              disabled={!shaltgaan.trim() || ustgaj}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-danger px-3 text-[13px] !text-white disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {ustgaj ? "Устгаж байна..." : "Устгах"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Засах товч + жижиг хэсэг: шинэ хувь/дүн ба засах шалтгаан */
function ZasakhBatalgaa({
  khuvi,
  odoogiin,
  gereeniiToo,
  onConfirm,
}: {
  khuvi: boolean;
  odoogiin: number;
  gereeniiToo: number;
  onConfirm: (utga: number, tailbar: string) => Promise<boolean>;
}) {
  const [neelttei, setNeelttei] = useState(false);
  const [utga, setUtga] = useState(String(odoogiin || ""));
  const [shaltgaan, setShaltgaan] = useState("");
  const [khadgalj, setKhadgalj] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const [bairlal, setBairlal] = useState<{ top: number; left: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!neelttei || !ref.current) return;
    setUtga(String(odoogiin || ""));
    const r = ref.current.getBoundingClientRect();
    const undur = 230;
    const urgun = 290;
    const deesh = window.innerHeight - r.bottom < undur + 12;
    setBairlal({
      top: deesh ? r.top - undur - 6 : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - urgun, window.innerWidth - urgun - 8)),
    });
  }, [neelttei, odoogiin]);

  React.useEffect(() => {
    if (!neelttei) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !popRef.current?.contains(t)) setNeelttei(false);
    };
    const onScroll = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) setNeelttei(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNeelttei(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [neelttei]);

  const too = Number(String(utga).replace(/,/g, ""));
  const zuv = too > 0 && (!khuvi || too <= 100) && shaltgaan.trim().length > 0;
  const khadgalakh = async () => {
    if (!zuv || khadgalj) return;
    setKhadgalj(true);
    const ok = await onConfirm(too, shaltgaan.trim());
    setKhadgalj(false);
    if (ok) {
      setNeelttei(false);
      setShaltgaan("");
    }
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setNeelttei((v) => !v)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          neelttei ? "bg-theme/10 text-brand" : "text-[color:var(--muted-text)] hover:bg-theme/10 hover:text-brand"
        }`}
        title="Засах"
        aria-label="Засах"
        aria-expanded={neelttei}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      {neelttei && bairlal && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Хөнгөлөлт засах"
          style={{ position: "fixed", top: bairlal.top, left: bairlal.left, zIndex: 13000 }}
          className="w-[290px] rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3 text-left shadow-xl"
        >
          <p className="text-[14px] text-[color:var(--panel-text)]">
            {khuvi ? "Хөнгөлөх хувийг засах" : "Сарын хөнгөлөх дүнг засах"}
          </p>
          {gereeniiToo > 1 && (
            <p className="mt-0.5 text-[12px] text-warning">
              Энэ хөнгөлөлт {gereeniiToo} гэрээнд хамаатай — бүгдэд нь өөрчлөгдөнө.
            </p>
          )}
          <div className="relative mt-2.5">
            <input
              autoFocus
              inputMode="decimal"
              value={utga}
              onChange={(e) => setUtga(e.target.value.replace(/[^0-9.]/g, ""))}
              className="stg-input !h-9 !pr-8 text-[13px] tabular-nums"
              aria-label={khuvi ? "Хувь" : "Дүн"}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[color:var(--muted-text)]">
              {khuvi ? "%" : "₮"}
            </span>
          </div>
          <input
            value={shaltgaan}
            onChange={(e) => setShaltgaan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && khadgalakh()}
            placeholder="Засах шалтгаан (заавал)"
            className="stg-input mt-2 !h-9 text-[13px]"
          />
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setNeelttei(false)}
              className="btn-minimal inline-flex h-9 items-center !px-3 text-[13px]"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={khadgalakh}
              disabled={!zuv || khadgalj}
              className="inline-flex h-9 items-center rounded-[10px] bg-theme px-3 text-[13px] !text-white disabled:opacity-50"
            >
              {khadgalj ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
