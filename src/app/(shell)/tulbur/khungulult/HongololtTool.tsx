"use client";

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
import { MonthPickerInput } from "@/components/ui/MonthPickerInput";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { toast } from "sonner";
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
      const res = await uilchilgee(token).get("/orshinSuugch", {
        params: {
          baiguullagiinId,
          barilgiinId: barilgiinId || undefined,
          khuudasniiKhemjee: 2000,
        },
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
              t.gereeniiId || t.gereeId || item.gereeniiId || "",
            );
            const rowId = gid
              ? `${resId}_${gid}`
              : `${resId}_${tootStr}_${idx}`;

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

  const computeDiscount = (r: ResidentRow): number => {
    const val = parseFloat(hongololtUtga) || 0;
    const suuri =
      hongololtTurul === "percent"
        ? ((r.turesiinOrlogo || 0) * val) / 100
        : val;

    // Хоногийн горимд сарын дүнг 30 хоногт хувааж, сонгосон хоногоор авна.
    // Энэ горимд сарын үржүүлэгч хамаарахгүй — хугацаа нь хоногоор заагдана.
    if (khonogTootsokh) {
      const khonog = parseFloat(khungulultKhonog) || 0;
      if (khonog <= 0) return 0;
      return Math.round((suuri / 30) * khonog);
    }

    return Math.round(suuri) * sariinToo;
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
      toast.error("Хөнгөлөх дүн гарсан оршин суугч алга");
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

  if (!inline && !show) return null;

  /**
   * Таб ба агуулга — модал ба хуудас хоёулаа үүнийг хуваалцана.
   * Ингэснээр нэг эх сурвалжтай үлдэж, зан төлөв зөрөхгүй.
   */
  const aguulga = (
    <>
      {/* ── Tabs ── */}
      <div className="flex gap-1 px-2 pt-1 pb-1 shrink-0">
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
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — ОРУУЛАХ ══ */}
      {activeTab === "oruulakh" && (
        <div className="flex flex-1 min-h-0 overflow-hidden gap-4 lg:gap-6 pt-3 px-2">
          {/* Left panel */}
          <div className="w-80 lg:w-[350px] xl:w-[380px] shrink-0 flex flex-col gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 overflow-y-auto">
            {/* Scope selector */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Хамрах хүрээ
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(
                  [
                    { v: "all", label: "Бүгд" },
                    { v: "selected", label: "Сонгосон" },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectMode(v)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-all ${selectMode === v
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Орц — барилгын тохиргооноос */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0 w-16">
                Орц :
              </label>
              <select
                value={orts}
                onChange={(e) => setOrts(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Бүх орц</option>
                {ortsSongoltuud.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Давхар */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0 w-16">
                Давхар :
              </label>
              <select
                value={davkhar}
                onChange={(e) => setDavkhar(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Бүх давхар</option>
                {davkharSongoltuud.map((d: string) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Хөнгөлөх сар — муж. Апп даяар хэрэглэдэг сонгогч. */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                * Хөнгөлөх сар
              </label>
              <MonthPickerInput
                type="range"
                value={[selectedMonth, duusakhSar]}
                placeholder="Эхлэх сар → Дуусах сар"
                onChange={(v: any) => {
                  const [ekhlekh, duusakh] = Array.isArray(v)
                    ? v
                    : [null, null];
                  if (ekhlekh) setSelectedMonth(ekhlekh);
                  // Ганц сар сонгоход дуусахыг эхлэлтэй нь ижил болгоно
                  setDuusakhSar(duusakh || ekhlekh || "");
                }}
                classNames={{ input: "w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" }}
              />

            </div>



            {/* Discount type */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Хөнгөлөлт төрөл
              </label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(
                  [
                    { v: "percent", label: "Хувь (%)" },
                    { v: "amount", label: "Дүн (₮)" },
                  ] as const
                ).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHongololtTurul(v)}
                    className={`flex-1 py-1.5 text-xs font-medium transition-all ${hongololtTurul === v
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount value */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                * Хөнгөлөх {hongololtTurul === "percent" ? "хувь" : "дүн"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={
                    hongololtTurul === "percent" ? deedKhuvi ?? 100 : undefined
                  }
                  placeholder={hongololtTurul === "percent" ? "0 – 100" : "0"}
                  value={hongololtUtga}
                  onChange={(e) => setHongololtUtga(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                  {hongololtTurul === "percent" ? "%" : "₮"}
                </span>
              </div>
              {hongololtTurul === "percent" && deedKhuvi != null && (
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  Байгууллагын дээд хязгаар: {deedKhuvi}%
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Шалтгаан
              </label>
              <textarea
                rows={1}
                placeholder="Шалтгаан"
                value={shaltgaan}
                onChange={(e) => setShaltgaan(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">

              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Нийт хөнгөлөгдсөн дүн :</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {fmt(totalDun)}₮
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={loading}
                className="flex-1 py-2 text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || fetching}
                className="flex-1 py-2 text-xs font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Хадгалах
              </button>
            </div>
          </div>

          {/* Right panel: resident table */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/20">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Тоот, нэр эсвэл утасны дугаараар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={loadResidents}
                disabled={fetching}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Дахин ачааллах"
              >
                <RefreshCw
                  className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`}
                />
              </button>
              {selectMode === "selected" && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {selectedIds.size} сонгосон
                </span>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {fetching ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Уншиж байна...
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-xs">
                  Оршин суугч олдсонгүй
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                      <th className="w-10 px-3 py-2.5 text-center border-r border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={toggleAll}
                          className="text-gray-400 hover:text-emerald-500 transition-colors"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Нэр
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Дугаар
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Орц
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Давхар
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Тоот
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                        Үлдэгдэл
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                        Хөнгөлөгдөх дүн
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((r, idx) => {
                      const isSelected = selectedIds.has(r._id);
                      const isTarget = selectMode === "all" || isSelected;
                      const discountDun = computeDiscount(r);
                      return (
                        <tr
                          key={r._id}
                          onClick={() => toggleOne(r._id)}
                          className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${isSelected
                              ? "bg-emerald-50 dark:bg-emerald-500/10"
                              : idx % 2 === 0
                                ? "bg-white dark:bg-transparent"
                                : "bg-gray-50/50 dark:bg-gray-800/20"
                            } hover:bg-emerald-50 dark:hover:bg-emerald-500/5`}
                        >
                          <td className="w-10 px-3 py-2 text-center border-r border-gray-200 dark:border-gray-700">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 inline" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 inline" />
                            )}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-700">
                            <div className="font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {r.ovog ? `${r.ovog} ` : ""}
                              {r.ner}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {r.utas || "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {r.orts || "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {r.davkhar || "—"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-medium">
                            {r.toot || "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            <span
                              className={
                                (r.uldegdel || 0) > 0
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }
                            >
                              {fmt(r.uldegdel || 0)}₮
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                            {isTarget && discountDun > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                -{fmt(discountDun)}₮
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 2 — ТҮҮХ ══ */}
      {activeTab === "tuukh" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pt-3 px-2">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/20 shadow-xs">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900/20 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-64">
                  <DatePickerInput
                    mode="range"
                    value={histDateRange}
                    onChange={(val) => {
                      setHistDateRange(val as [string | null, string | null]);
                      setHistPage(1);
                    }}
                    placeholder="Огноо сонгох"
                  />
                </div>
                <div className="w-36">
                  <input
                    type="text"
                    placeholder="Бүгд"
                    value={histSearch}
                    onChange={(e) => {
                      setHistSearch(e.target.value);
                      setHistPage(1);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="w-28">
                  <select
                    value={histDavkhar}
                    onChange={(e) => {
                      setHistDavkhar(e.target.value);
                      setHistPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors border border-gray-200 dark:border-gray-700"
                  title="Дахин ачааллах"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${histFetching ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-4 py-1.5 text-xs font-medium rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
                >
                  Excel
                </button>
              </div>
            </div>

            {/* History table */}
            <div className="flex-1 overflow-auto">
              {histFetching ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Уншиж байна...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs gap-2">
                  <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  Хөнгөлөлтийн түүх байхгүй
                </div>
              ) : (
                <table className="w-full text-xs border-collapse min-w-[1300px]">
                  <thead>
                    <tr className="bg-gray-50/90 dark:bg-gray-800/80 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Огноо
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Хөнгөлөлт
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Гэрээнүүд
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Талбай дугаар
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Түрээслэгчид
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Эхлэх хугацаа
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Дуусах хугацаа
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Хөнгөлөх төрөл
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Төлөх дүн
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Хөнгөлөх дүн
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Төлсөн дүн
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Төрөл
                      </th>
                      <th className="px-3 py-2.5 text-left font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Шалтгаан
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-center">
                          <span>Ажилтан</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                        Зассан
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium whitespace-nowrap w-16">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedHistory.map((h, idx) => (
                      <tr
                        key={h._id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-transparent"
                            : "bg-gray-50/40 dark:bg-gray-800/20"
                        }`}
                      >
                        {/* Огноо */}
                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {fmtDateTime(h.createdAt || h.ognoo)}
                        </td>
                        {/* Хөнгөлөлт */}
                        <td className="px-3 py-2 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          <span className="text-blue-600 dark:text-blue-400 font-normal hover:underline cursor-pointer">
                            Олон ({h.bichlegiinToo || 3})
                          </span>
                        </td>
                        {/* Гэрээнүүд */}
                        <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {h.gereeniiDugaar || "—"}
                        </td>
                        {/* Талбай дугаар */}
                        <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {h.toot || "—"}
                        </td>
                        {/* Түрээслэгчид */}
                        <td className="px-3 py-2 text-left text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {h.ner || "—"}
                        </td>
                        {/* Эхлэх хугацаа */}
                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h.ekhlekhOgnoo || "—"}
                        </td>
                        {/* Дуусах хугацаа */}
                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h.duusakhOgnoo || "—"}
                        </td>
                        {/* Хөнгөлөх төрөл */}
                        <td className="px-3 py-1.5 text-center border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 rounded-md text-xs font-normal bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-2xs">
                            {h.khungulukhTurul || "Гэрээнээс"}
                          </span>
                        </td>
                        {/* Төлөх дүн */}
                        <td className="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {fmt2(h.tulukhDun || 0)}
                        </td>
                        {/* Хөнгөлөх дүн */}
                        <td className="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {fmt2(Math.abs(h.dun || 0))}
                        </td>
                        {/* Төлсөн дүн */}
                        <td className="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap font-normal">
                          {fmt2(h.tulsunDun || 0)}
                        </td>
                        {/* Төрөл */}
                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h.turul || "Шаталсан"}
                        </td>
                        {/* Шалтгаан */}
                        <td
                          className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 max-w-[120px] truncate border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
                          title={h.tailbar || ""}
                        >
                          {h.tailbar || "—"}
                        </td>
                        {/* Ажилтан */}
                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h.guilgeeKhiisenAjiltniiNer || "CAdmin"}
                        </td>
                        {/* Зассан */}
                        <td className="px-3 py-2 text-center text-gray-400 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h.zassan || "-"}
                        </td>
                        {/* Үйлдэл */}
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteDiscount(h)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Устгах"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 font-bold bg-white dark:bg-gray-900/40">
                      <td colSpan={8} className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap text-gray-900 dark:text-white font-bold">
                        {fmt2(totalTulukhDun)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap text-gray-900 dark:text-white font-bold">
                        {fmt2(totalKhungulukhDun)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap text-gray-900 dark:text-white font-bold">
                        {fmt2(totalTulsunDun)}
                      </td>
                      <td colSpan={5} className="px-3 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 text-xs text-gray-600 dark:text-gray-400 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                  disabled={histPage <= 1}
                  className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-[28px] text-center px-2 py-0.5 rounded border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30">
                  {histPage}
                </span>
                <button
                  type="button"
                  onClick={() => setHistPage((p) => Math.min(totalPages, p + 1))}
                  disabled={histPage >= totalPages}
                  className="p-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
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
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 cursor-move select-none shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white leading-tight">
                    Хөнгөлөлт
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Оршин суугчдад хөнгөлөлт бүртгэх
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
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
