"use client";

import ExcelButton from "@/components/ui/ExcelButton";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ModalPortal } from "../../../../../components/shell/ModalPortal";
import {
  X,
  Search,
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
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
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
}

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

const fmt = (n: number) =>
  n.toLocaleString("mn-MN", { minimumFractionDigits: 0 });

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
  /** Тодорхой зардлыг хөнгөлөх бол түүний ID. Хоосон = нийт төлбөрөөс. */
  const [zardliinId, setZardliinId] = useState("");
  /** Хоногоор тооцох эсэх — сарын дүнг хоногт хувааж, сонгосон хоногоор. */
  const [khonogTootsokh, setKhonogTootsokh] = useState(false);
  const [khungulultKhonog, setKhungulultKhonog] = useState("");

  /* Right-panel data */
  const [fetching, setFetching] = useState(false);
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState<"all" | "selected">("all");

  /* History tab */
  const [histFetching, setHistFetching] = useState(false);
  const [history, setHistory] = useState<DiscountHistoryRow[]>([]);
  const [histSearch, setHistSearch] = useState("");
  const [histDavkhar, setHistDavkhar] = useState("");
  const [histDateRange, setHistDateRange] = useState<[string | null, string | null]>([
    dayjs().format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(100);

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
                "",
            );
            // Тоот бүр ТУСДАА мөр — гэрээ олдоогүй ч давхцахгүй.
            const rowId = `${resId}_${gid || "x"}_${tootStr}_${idx}`;

            rows.push({
              _id: rowId,
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
      const [guilgeeRes, gereeRes] = await Promise.all([
        uilchilgee(token).get("/guilgeeAvlaguud", {
          params: {
            baiguullagiinId,
            query: JSON.stringify({ turul: "Хөнгөлөлт" }),
            sort: JSON.stringify({ ognoo: -1, createdAt: -1 }),
            khuudasniiKhemjee: 1000,
          },
        }),
        uilchilgee(token)
          .get("/geree", {
            params: {
              baiguullagiinId,
              barilgiinId: barilgiinId || undefined,
              khuudasniiKhemjee: 1000,
            },
          })
          .catch(() => ({ data: { jagsaalt: [] } })),
      ]);

      const rawGuilgee = Array.isArray(guilgeeRes.data?.jagsaalt)
        ? guilgeeRes.data.jagsaalt
        : [];
      const gereeList = Array.isArray(gereeRes.data?.jagsaalt)
        ? gereeRes.data.jagsaalt
        : [];

      const gereeMap = new Map<string, any>();
      gereeList.forEach((g: any) => {
        if (g._id) gereeMap.set(String(g._id), g);
        if (g.gereeniiDugaar) gereeMap.set(String(g.gereeniiDugaar), g);
      });

      const enriched: DiscountHistoryRow[] = rawGuilgee.map((h: any) => {
        const g =
          (h.gereeniiId && gereeMap.get(String(h.gereeniiId))) ||
          (h.gereeniiDugaar && gereeMap.get(String(h.gereeniiDugaar)));

        const gDugaar =
          h.gereeniiDugaar ||
          g?.gereeniiDugaar ||
          (h.gereeniiId ? `ГД${String(h.gereeniiId).slice(-6)}` : "—");

        const toot = h.toot || g?.toot || "—";
        const ner = h.ner || g?.ner || g?.orshinSuugchNer || "—";
        const davkhar = g?.davkhar || h.davkhar || "";
        const orts = g?.orts || h.orts || "";
        const ekhlekhOgnoo = g?.ekhlekhOgnoo
          ? dayjs(g.ekhlekhOgnoo).format("YYYY-MM-DD")
          : h.ognoo
          ? dayjs(h.ognoo).format("YYYY-MM-DD")
          : "—";
        const duusakhOgnoo = g?.duusakhOgnoo
          ? dayjs(g.duusakhOgnoo).format("YYYY-MM-DD")
          : "—";
        const tulukhDun =
          g?.sariinTulbur || g?.suhTulbur || g?.ashiglaltiinZardal || 0;
        const dun = Math.abs(Number(h.dun) || 0);
        const tulsunDun = Number(h.tulsunDun) || 0;
        const turul = h.khungulultKhuvi
          ? `${h.khungulultKhuvi}%`
          : h.khonogTootsokhEsekh
          ? "Хоногоор"
          : h.turul || "Шаталсан";
        const ajiltan = h.guilgeeKhiisenAjiltniiNer || "CAdmin";

        return {
          ...h,
          gereeniiDugaar: gDugaar,
          toot,
          ner,
          davkhar,
          orts,
          ekhlekhOgnoo,
          duusakhOgnoo,
          tulukhDun,
          dun,
          tulsunDun,
          khungulukhTurul: h.khungulukhTurul || "Гэрээнээс",
          turul,
          guilgeeKhiisenAjiltniiNer: ajiltan,
          zassan: h.zassan || "-",
          bichlegiinToo: h.khungulultKhonog ? Number(h.khungulultKhonog) : (h.bichlegiinToo || 3),
        };
      });

      setHistory(enriched);
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
      setSearchTerm("");
      setHongololtUtga("");
      setShaltgaan("");
      setDavkhar("");
      setActiveTab("oruulakh");
      setHistory([]);
      setHistSearch("");
      setHistDavkhar("");
      setHistPage(1);
    }
  }, [show]);

  useEffect(() => {
    if ((inline || show) && activeTab === "tuukh") {
      loadHistory();
    }
  }, [show, activeTab]);

  /* ── Filtered list ── */
  const filteredResidents = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return residents.filter((r) => {
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
  }, [residents, searchTerm, orts, davkhar]);

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

  const { totalTulukhDun, totalKhungulukhDun, totalTulsunDun } = useMemo(() => {
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
        "Хөнгөлөлт": `Олон (${h.bichlegiinToo || 3})`,
        "Гэрээнүүд": h.gereeniiDugaar || "",
        "Талбай дугаар": h.toot || "",
        "Түрээслэгчид": h.ner || "",
        "Эхлэх хугацаа": h.ekhlekhOgnoo || "",
        "Дуусах хугацаа": h.duusakhOgnoo || "",
        "Хөнгөлөх төрөл": h.khungulukhTurul || "Гэрээнээс",
        "Төлөх дүн": h.tulukhDun || 0,
        "Хөнгөлөх дүн": Math.abs(h.dun || 0),
        "Төлсөн дүн": h.tulsunDun || 0,
        "Төрөл": h.turul || "Шаталсан",
        "Шалтгаан": h.tailbar || "",
        "Ажилтан": h.guilgeeKhiisenAjiltniiNer || "",
        "Зассан": h.zassan || "-",
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

  const handleDeleteDiscount = async (row: DiscountHistoryRow) => {
    const tailbar = window.prompt("Хөнгөлөлт устгах шалтгаанаа бичнэ үү:");
    if (!tailbar || !tailbar.trim()) return;
    try {
      const res = await uilchilgee(token).post("/khungulultUstgaya", {
        baiguullagiinId,
        id: row._id,
        tailbar: tailbar.trim(),
      });
      if (res.data?.success !== false) {
        toast.success("Хөнгөлөлт амжилттай устгагдлаа");
        loadHistory();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data?.message || "Устгахад алдаа гарлаа");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err.message || "Устгахад алдаа гарлаа"
      );
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
  const [suuriDun, setSuuriDun] = useState<Record<string, Record<string, number>>>({});
  const [suuriAchaalj, setSuuriAchaalj] = useState(false);
  React.useEffect(() => {
    if (!token || !baiguullagiinId || !selectedMonth) return;
    let khuchintei = true;
    setSuuriAchaalj(true);
    uilchilgee(token)
      .post("/khungulultSuuriAvya", {
        baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        ekhlekhSar: selectedMonth,
        duusakhSar: duusakhSar || selectedMonth,
        zardliinId: zardliinId || undefined,
      })
      .then((resp) => {
        if (khuchintei) setSuuriDun(resp.data?.suuri || {});
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
  }, [token, baiguullagiinId, barilgiinId, selectedMonth, duusakhSar, zardliinId]);

  const computeDiscount = (r: ResidentRow): number => {
    const val = parseFloat(hongololtUtga) || 0;
    if (val <= 0) return 0;
    const khonog = parseFloat(khungulultKhonog) || 0;

    if (hongololtTurul === "percent") {
      const saraar = (r.gereeniiId && suuriDun[r.gereeniiId]) || {};
      // Хоногийн горимд эхний сарын төлбөрийг 30 хоногт хувааж авна.
      if (khonogTootsokh) {
        if (khonog <= 0) return 0;
        const sar = saraar[selectedMonth] || 0;
        return Math.round(((sar * val) / 100 / 30) * khonog);
      }
      // Сар бүрийн бодит төлбөрөөс хувь — нийлбэр нь сарын үржүүлэгчийг
      // өөрөө агуулна.
      const niit = Object.values(saraar).reduce((a, b) => a + (Number(b) || 0), 0);
      return Math.round((niit * val) / 100);
    }

    // Дүнгээр: сар бүрт ижил дүн.
    if (khonogTootsokh) {
      if (khonog <= 0) return 0;
      return Math.round((val / 30) * khonog);
    }
    return Math.round(val) * sariinToo;
  };

  /* ── Summary ── */
  const summaryRows =
    selectMode === "all"
      ? filteredResidents
      : filteredResidents.filter((r) => selectedIds.has(r._id));
  const totalDun = summaryRows.reduce((s, r) => s + computeDiscount(r), 0);

  /* ── Submit ── */
  const handleSubmit = async () => {
    const val = parseFloat(hongololtUtga) || 0;
    if (!val || val <= 0) {
      toast.error("Хөнгөлөх утгаа оруулна уу");
      return;
    }
    if (selectMode === "selected" && selectedIds.size === 0) {
      toast.error("Оршин суугч сонгоно уу");
      return;
    }
    if (!shaltgaan.trim()) {
      toast.error("Шалтгаан оруулна уу");
      return;
    }

    // Байгууллагын тохируулсан дээд хувь. turees дээр яг ийм шалгалт
    // байдаг — sukh-ийн схемд талбар нь байсан ч ашиглагдаагүй байв.
    if (hongololtTurul === "percent" && deedKhuvi != null && val > deedKhuvi) {
      toast.error(`Тохируулсан дээд хувь (${deedKhuvi}%)-иас хэтэрсэн байна`);
      return;
    }

    const applyTo =
      selectMode === "all"
        ? filteredResidents
        : filteredResidents.filter((r) => selectedIds.has(r._id));

    if (applyTo.length === 0) {
      toast.error("Хөнгөлөлт оруулах оршин суугч олдсонгүй");
      return;
    }

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
      }))
      .filter((x) => x.dun > 0);

    if (ilgeekhGereenuud.length === 0) {
      setLoading(false);
      toast.error(
        hongololtTurul === "percent"
          ? "Сонгосон сард нэхэмжилсэн төлбөртэй гэрээ алга — хувиар хөнгөлөх суурь дүн 0₮"
          : "Хөнгөлөх дүн гарсан оршин суугч алга",
      );
      return;
    }

    try {
      const resp: any = await uilchilgee(token).post("/khungulultKhadgalya", {
        baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        gereenuud: ilgeekhGereenuud,
        ekhlekhSar: selectedMonth,
        duusakhSar: duusakhSar || selectedMonth,
        khonogTootsokhEsekh: khonogTootsokh,
        khungulultKhonog: khonogTootsokh
          ? Number(khungulultKhonog) || 0
          : undefined,
        khungulultKhuvi:
          hongololtTurul === "percent" ? parseFloat(hongololtUtga) || 0 : undefined,
        zardliinId: zardliinId || undefined,
        zardliinNer:
          zardluud.find((z) => z._id === zardliinId)?.ner || undefined,
        shaltgaan: `${shaltgaan.trim()}${khugatsaaTemdeglel}`,
      });

      const ur = resp?.data?.results;
      const amjilttai = ur?.success?.length ?? 0;
      const alggasan = ur?.alggasanGereenuud ?? [];
      const aldaatai = ur?.failed ?? [];

      if (amjilttai > 0) {
        toast.success(`${amjilttai} гэрээнд хөнгөлөлт бүртгэгдлээ`);
        onSuccess?.();
      }

      // Сонгосон сард төлбөргүй байсан гэрээг нэр заан мэдэгдэнэ —
      // чимээгүй алгасвал хэрэглэгч хөнгөлөлт суусан гэж эндүүрнэ.
      if (alggasan.length > 0) {
        toast.error(
          `${alggasan.length} гэрээнд хөнгөлөлт суугаагүй: ` +
          alggasan
            .slice(0, 3)
            .map((x: any) => x.toot || x.gereeniiDugaar)
            .join(", ") +
          (alggasan.length > 3 ? " …" : ""),
        );
      }
      if (aldaatai.length > 0) {
        toast.error(`${aldaatai.length} гэрээнд алдаа гарлаа`);
      }
      if (amjilttai > 0 && alggasan.length === 0 && aldaatai.length === 0) {
        onClose?.();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Хөнгөлөлт бүртгэхэд алдаа гарлаа",
      );
    }

    setLoading(false);
  };

  // Хөнгөлөлт олгох оршин суугчдын хүснэгтийн багана.
  const khungulultColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Нэр",
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
        dataIndex: "utas",
        key: "utas",
        width: 110,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Орц",
        dataIndex: "orts",
        key: "orts",
        width: 60,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        width: 65,
        align: "center",
        render: (v: any) => v || "—",
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        width: 70,
        align: "center",
        render: (v: any) => <span className="font-medium">{v || "—"}</span>,
      },
      {
        title: "Үлдэгдэл",
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 110,
        align: "right",
        render: (v: any) => (
          <span
            className={`tabular-nums whitespace-nowrap ${
              (v || 0) > 0 ? "text-danger" : "opacity-70"
            }`}
          >
            {fmt(v || 0)}₮
          </span>
        ),
      },
      {
        title: "Хөнгөлөгдөх дүн",
        key: "khungulult",
        width: 130,
        align: "right",
        render: (_: any, r: any) => {
          // "Бүгд" горимд сонголтоос үл хамааран бүх мөр хөнгөлөгдөнө.
          const isTarget = selectMode === "all" || selectedIds.has(r._id);
          const discountDun = computeDiscount(r);
          return isTarget && discountDun > 0 ? (
            <span className="font-medium tabular-nums whitespace-nowrap text-brand">
              -{fmt(discountDun)}₮
            </span>
          ) : (
            <span className="opacity-40">—</span>
          );
        },
      },
    ],
     
    [selectMode, selectedIds, computeDiscount],
  );

  // Хөнгөлөлтийн түүхийн хүснэгтийн багана.
  const tuukhiinColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Огноо",
        key: "ognoo",
        width: 160,
        align: "center" as const,
        render: (_: any, h: any) => (
          <span className="whitespace-nowrap tabular-nums text-xs">
            {fmtDateTime(h.createdAt || h.ognoo)}
          </span>
        ),
      },
      {
        title: "Гэрээний дугаар",
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        width: 130,
        align: "center" as const,
        render: (v: any) => (
          <span className="font-medium whitespace-nowrap">{v || "—"}</span>
        ),
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: 140,
        render: (v: any) => <span className="font-medium">{v || "—"}</span>,
      },
      {
        title: "Орц",
        dataIndex: "orts",
        key: "orts",
        width: 60,
        align: "center" as const,
        render: (v: any) => v || "—",
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        width: 70,
        align: "center" as const,
        render: (v: any) => (
          <span className="font-semibold text-[color:var(--panel-text)]">
            {v || "—"}
          </span>
        ),
      },
      {
        title: "Эхлэх хугацаа",
        dataIndex: "ekhlekhOgnoo",
        key: "ekhlekhOgnoo",
        width: 110,
        align: "center" as const,
        render: (v: any) => (
          <span className="whitespace-nowrap tabular-nums">{v || "—"}</span>
        ),
      },
      {
        title: "Дуусах хугацаа",
        dataIndex: "duusakhOgnoo",
        key: "duusakhOgnoo",
        width: 110,
        align: "center" as const,
        render: (v: any) => (
          <span className="whitespace-nowrap tabular-nums">{v || "—"}</span>
        ),
      },
      {
        title: "Төлөх дүн",
        dataIndex: "tulukhDun",
        key: "tulukhDun",
        width: 110,
        align: "right" as const,
        render: (v: any) => (
          <span className="tabular-nums whitespace-nowrap font-medium">
            {fmt2(v || 0)}
          </span>
        ),
      },
      {
        title: "Хөнгөлөх дүн",
        dataIndex: "dun",
        key: "dun",
        width: 110,
        align: "right" as const,
        render: (v: any) => (
          <span className="tabular-nums whitespace-nowrap font-semibold text-brand">
            {fmt2(Math.abs(v || 0))}
          </span>
        ),
      },
      {
        title: "Төлсөн дүн",
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        width: 110,
        align: "right" as const,
        render: (v: any) => (
          <span className="tabular-nums whitespace-nowrap font-medium">
            {fmt2(v || 0)}
          </span>
        ),
      },
      {
        title: "Ажилтан",
        dataIndex: "guilgeeKhiisenAjiltniiNer",
        key: "guilgeeKhiisenAjiltniiNer",
        width: 110,
        align: "center" as const,
        render: (v: any) => (
          <span className="text-xs text-[color:var(--muted-text)]">
            {v || "CAdmin"}
          </span>
        ),
      },
      {
        title: "Зассан",
        dataIndex: "zassan",
        key: "zassan",
        width: 90,
        align: "center" as const,
        render: (v: any) => (
          <span className="text-xs text-[color:var(--muted-text)]">
            {v || "-"}
          </span>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 100,
        align: "center" as const,
        render: (_: any, h: any) => (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => {
                // TODO: Edit discount modal
                toast.info("Засах функц удахгүй нэмэгдэнэ");
              }}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              title="Засах"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Засах
            </button>
            <span className="text-[color:var(--muted-text)]">|</span>
            <button
              type="button"
              onClick={() => handleDeleteDiscount(h)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
              title="Устгах"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Устгах
            </button>
          </div>
        ),
      },
    ],
     
    [],
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
            {selectMode === "selected" && (
              <span className="text-xs font-medium text-brand">
                {selectedIds.size} сонгосон
              </span>
            )}
            <label className="filter-field w-[280px] max-w-full">
              <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
              <input
                type="text"
                placeholder="Тоот, нэр, утсаар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
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
              <Mur shoshgo="Хамрах хүрээ">
                <div className="grid h-9 grid-cols-2 gap-0.5 rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-0.5">
                  {(
                    [
                      { v: "all", label: "Бүгд", too: filteredResidents.length },
                      { v: "selected", label: "Сонгосон", too: selectedIds.size },
                    ] as const
                  ).map(({ v, label, too }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectMode(v)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                        selectMode === v
                          ? "bg-theme !text-white"
                          : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                      }`}
                    >
                      {label}
                      <span className={`rounded-full px-1.5 text-[10px] ${selectMode === v ? "bg-white/20" : "bg-[color:var(--surface-hover)]"}`}>
                        {too}
                      </span>
                    </button>
                  ))}
                </div>
              </Mur>

              <Mur shoshgo="Зардал">
                <select
                  value={zardliinId}
                  onChange={(e) => setZardliinId(e.target.value)}
                  className={TALBAR}
                >
                  <option value="">Бүх зардал</option>
                  {zardluud.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.ner}
                    </option>
                  ))}
                </select>
              </Mur>

              <Mur shoshgo="">
                <label className="flex h-9 cursor-pointer items-center gap-2 text-[13px] text-[color:var(--panel-text)]">
                  <input
                    type="checkbox"
                    checked={khonogTootsokh}
                    onChange={(e) => setKhonogTootsokh(e.target.checked)}
                    className="h-4 w-4 accent-[color:var(--theme)]"
                  />
                  Хоногийн хөнгөлөлт
                </label>
              </Mur>

              {khonogTootsokh && (
                <Mur shoshgo="Хоног" shaardlagatai>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Хоног"
                    value={khungulultKhonog}
                    onChange={(e) => setKhungulultKhonog(e.target.value)}
                    className={TALBAR}
                  />
                </Mur>
              )}

              <Mur shoshgo="Хөнгөлөх сар" shaardlagatai>
                <div className="btn-minimal flex h-9 w-full items-center !px-2">
                  <StandardDatePicker
                    isRange
                    picker="month"
                    format="YYYY-MM"
                    value={
                      selectedMonth && duusakhSar
                        ? [selectedMonth, duusakhSar]
                        : selectedMonth
                        ? [selectedMonth, selectedMonth]
                        : undefined
                    }
                    onChange={(_: any, dateStrings: [string, string]) => {
                      if (dateStrings && Array.isArray(dateStrings) && (dateStrings[0] || dateStrings[1])) {
                        const [start, end] = dateStrings;
                        setSelectedMonth(start || "");
                        setDuusakhSar(end || start || "");
                      } else {
                        setSelectedMonth("");
                        setDuusakhSar("");
                      }
                    }}
                    placeholder={["Эхлэх сар", "Дуусах сар"]}
                    className="!h-full w-full text-[13px]"
                    allowClear
                  />
                </div>
              </Mur>

              <Mur shoshgo="Орц">
                <select value={orts} onChange={(e) => setOrts(e.target.value)} className={TALBAR}>
                  <option value="">Бүх орц</option>
                  {ortsSongoltuud.map((o: string) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Mur>

              <Mur shoshgo="Давхар">
                <select value={davkhar} onChange={(e) => setDavkhar(e.target.value)} className={TALBAR}>
                  <option value="">Бүх давхар</option>
                  {davkharSongoltuud.map((d: string) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Mur>

              <Mur shoshgo="Хөнгөлөх төрөл">
                <select
                  value={hongololtTurul}
                  onChange={(e) => setHongololtTurul(e.target.value as HongololtTurul)}
                  className={TALBAR}
                >
                  <option value="percent">Хувь (%)</option>
                  <option value="amount">Дүн (₮)</option>
                </select>
              </Mur>

              <Mur
                shoshgo={hongololtTurul === "percent" ? "Хөнгөлөх хувь" : "Хөнгөлөх дүн"}
                shaardlagatai
                tailbar={
                  hongololtTurul === "percent" && deedKhuvi != null
                    ? `Дээд хязгаар: ${deedKhuvi}%`
                    : undefined
                }
              >
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={hongololtTurul === "percent" ? deedKhuvi ?? 100 : undefined}
                    placeholder={hongololtTurul === "percent" ? "Хөнгөлөх хувь" : "Хөнгөлөх дүн"}
                    value={hongololtUtga}
                    onChange={(e) => setHongololtUtga(e.target.value)}
                    className={`${TALBAR} !pr-8`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--muted-text)]">
                    {hongololtTurul === "percent" ? "%" : "₮"}
                  </span>
                </div>
              </Mur>

              <Mur shoshgo="Шалтгаан">
                <input
                  type="text"
                  placeholder="Шалтгаан"
                  value={shaltgaan}
                  onChange={(e) => setShaltgaan(e.target.value)}
                  className={TALBAR}
                />
              </Mur>
            </div>

            {/* Хураангуй */}
            <div className="shrink-0 space-y-1.5 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-5 py-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Хөнгөлөгдөх о.суугч:</span>
                <span className="font-medium text-[color:var(--panel-text)]">{summaryRows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted-text)]">Нийт хөнгөлөгдсөн дүн:</span>
                <span className="font-semibold text-brand">{fmt(totalDun)}₮</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 justify-between gap-2 border-t border-[color:var(--surface-border)] px-5 py-3">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={loading}
                className="btn-minimal inline-flex h-9 min-w-[96px] items-center justify-center !px-4 text-[13px]"
              >
                Цуцлах
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
                  className="[&_td]:!py-2 [&_th]:!py-2.5"
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
                      // Мөр сонговол «Сонгосон» горимд шилжинэ — «Бүгд» дээр
                      // сонголт ямар ч нөлөөгүй байсан тул чек «сонин» санагддаг байв.
                      if ((keys as string[]).length > 0) setSelectMode("selected");
                    },
                  }}
                  onRow={(r) => ({
                    onClick: (e: React.MouseEvent) => {
                      // Checkbox-ийн даралт мөрийн onClick руу ч хөөрдөг тул
                      // хоёр удаа сэлгэгдээд буцаад хэвэндээ ордог байв.
                      if ((e.target as HTMLElement).closest("input,label,.zt-checkbox,[role=checkbox]")) return;
                      toggleOne(r._id);
                      setSelectMode("selected");
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
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[color:var(--surface-border)] shrink-0 bg-[color:var(--surface-bg)] flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-64 h-[36px]">
                  <StandardDatePicker
                    isRange
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
                    allowClear
                    className="w-full !rounded-xl text-xs"
                  />
                </div>
                <div className="w-40">
                  <input
                    type="text"
                    placeholder="Хайлт..."
                    value={histSearch}
                    onChange={(e) => {
                      setHistSearch(e.target.value);
                      setHistPage(1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] dark:text-white placeholder-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme h-[36px]"
                  />
                </div>
                <div className="w-28">
                  <select
                    value={histDavkhar}
                    onChange={(e) => {
                      setHistDavkhar(e.target.value);
                      setHistPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-theme"
                  >
                    <option value="">Давхар</option>
                    {davkharOptions.map((d) => (
                      <option key={d} value={d}>
                        {d} давхар
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={histFetching}
                  className="p-1.5 rounded-xl hover:bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] transition-colors border border-[color:var(--surface-border)]"
                  title="Дахин ачааллах"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${histFetching ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div>
                <ExcelButton onClick={handleExportExcel} />
              </div>
            </div>

            {/* History table — гүйлгэлтийг хүснэгт өөрөө хариуцна */}
            <div className="min-h-0 flex-1">
              <Table<any>
                  className="[&_td]:!py-2 [&_th]:!py-2.5"
                  columns={tuukhiinColumns}
                  dataSource={paginatedHistory}
                  rowKey={(h) => h._id}
                  loading={histFetching}
                  locale={{ emptyText: "Хөнгөлөлтийн түүх байхгүй" }}
                  pagination={false}
                  scroll={{ x: 1300 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={8} />
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                        {fmt2(totalTulukhDun)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                        {fmt2(totalKhungulukhDun)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right" className="tabular-nums whitespace-nowrap">
                        {fmt2(totalTulsunDun)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell colSpan={5} />
                    </Table.Summary.Row>
                  )}
                />
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs text-[color:var(--muted-text)] shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                  disabled={histPage <= 1}
                  className="p-1 rounded border border-[color:var(--surface-border)] disabled:opacity-30 hover:bg-[color:var(--surface-hover)] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-[28px] text-center px-2 py-0.5 rounded border border-theme text-brand font-medium bg-theme/10">
                  {histPage}
                </span>
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.min(totalPages, p + 1))}
                  disabled={histPage >= totalPages}
                  className="p-1 rounded border border-[color:var(--surface-border)] disabled:opacity-30 hover:bg-[color:var(--surface-hover)] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={histPageSize}
                onChange={(e) => {
                  setHistPageSize(Number(e.target.value));
                  setHistPage(1);
                }}
                className="px-2 py-1 rounded border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs focus:outline-none focus:ring-1 focus:ring-theme"
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
                  <h3 className="font-semibold text-base text-[color:var(--panel-text)] dark:text-white leading-tight">
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
