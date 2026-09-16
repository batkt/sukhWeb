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
} from "lucide-react";
import useModalHotkeys from "@/lib/useModalHotkeys";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { MonthPickerInput } from "@/components/ui/MonthPickerInput";
import { toast } from "sonner";
import {
  getResidentField,
  getResidentToots,
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
  ognoo: string;
  tailbar?: string;
  dun: number;
  toot?: string;
  ner?: string;
  gereeniiId?: string;
  createdAt?: string;
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

      const rows: ResidentRow[] = raw.map((item: any) => ({
        _id: String(item._id),
        ner: item.ner || "Нэргүй",
        ovog: item.ovog || "",
        utas: item.utas || item.utas1 || "",
        toot:
          String(getResidentToots(item) || getResidentField(item, "toot") || item.toot || "-"),
        orts: String(
          getResidentField(item, "orts") ?? item.orts ?? "",
        ),
        davkhar: String(
          getResidentField(item, "davkhar") ?? item.davkhar ?? "",
        ),
        gereeniiId: item.gereeniiId || "",
        uldegdel: Number(item.uldegdel) || 0,
        turesiinOrlogo: Number(item.turesiinOrlogo || item.sariniiTureeSan) || 0,
      }));

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
      const res = await uilchilgee(token).get("/guilgeeAvlaguud", {
        params: {
          baiguullagiinId,
          query: JSON.stringify({ turul: "Хөнгөлөлт" }),
          sort: JSON.stringify({ ognoo: -1, createdAt: -1 }),
          khuudasniiKhemjee: 500,
        },
      });
      const raw = Array.isArray(res.data?.jagsaalt) ? res.data.jagsaalt : [];
      setHistory(raw);
    } catch {
      toast.error("Хөнгөлөлтийн түүх татахад алдаа гарлаа");
    } finally {
      setHistFetching(false);
    }
  }, [token, baiguullagiinId]);

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

  const filteredHistory = useMemo(() => {
    const q = histSearch.toLowerCase();
    return history.filter(
      (h) =>
        !q ||
        (h.ner || "").toLowerCase().includes(q) ||
        (h.toot || "").includes(q) ||
        (h.tailbar || "").toLowerCase().includes(q)
    );
  }, [history, histSearch]);

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
      <div className="flex gap-1 px-6 pt-3 shrink-0">
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
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panel */}
          <div className="w-80 lg:w-[350px] xl:w-[380px] shrink-0 flex flex-col gap-4 p-5 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
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
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Орц
              </label>
              <select
                value={orts}
                onChange={(e) => setOrts(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Бүх орц</option>
                {ortsSongoltuud.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Зардал сонгох — хоосон бол нийт төлбөрөөс хөнгөлнө */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Зардал сонгох
              </label>
              <select
                value={zardliinId}
                onChange={(e) => setZardliinId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Нийт төлбөрөөс</option>
                {zardluud.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.ner}
                  </option>
                ))}
              </select>
            </div>

            {/* Хоногийн хөнгөлөлт */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                <input
                  type="checkbox"
                  checked={khonogTootsokh}
                  onChange={(e) => setKhonogTootsokh(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                />
                Хоногийн хөнгөлөлт эсэх
              </label>
              {khonogTootsokh && (
                <>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Хөнгөлөх хоног"
                    value={khungulultKhonog}
                    onChange={(e) => setKhungulultKhonog(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    Сарын дүнг 30 хоногт хувааж, сонгосон хоногоор бодно
                  </p>
                </>
              )}
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

            {/* Давхар */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Давхар
              </label>
              <select
                value={davkhar}
                onChange={(e) => setDavkhar(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Бүх давхар</option>
                {davkharSongoltuud.map((d: string) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
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
                rows={3}
                placeholder="Шалтгаан"
                value={shaltgaan}
                onChange={(e) => setShaltgaan(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Нийт тоот тоо :</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {summaryRows.length}
                </span>
              </div>
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
                Цуцрэлах
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
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
                      <th className="w-10 px-3 py-2.5 text-center">
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
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                        Оршин суугч
                      </th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">
                        Гараа
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
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
                          className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${isSelected
                            ? "bg-emerald-50 dark:bg-emerald-500/10"
                            : idx % 2 === 0
                              ? "bg-white dark:bg-transparent"
                              : "bg-gray-50/50 dark:bg-gray-800/20"
                            } hover:bg-emerald-50 dark:hover:bg-emerald-500/5`}
                        >
                          <td className="w-10 px-3 py-2 text-center">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 inline" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 inline" />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {r.ovog ? `${r.ovog} ` : ""}
                              {r.ner}
                            </div>
                            {r.utas && (
                              <div className="text-gray-400 text-[11px]">
                                {r.utas}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                            {r.toot}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
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
                          <td className="px-3 py-2 text-right tabular-nums">
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
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Тоот, нэр эсвэл тайлбараар хайх..."
                value={histSearch}
                onChange={(e) => setHistSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={loadHistory}
              disabled={histFetching}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${histFetching ? "animate-spin" : ""}`}
              />
            </button>
            <span className="ml-auto text-xs text-gray-400">
              Нийт: {filteredHistory.length}
            </span>
          </div>

          {/* History table */}
          <div className="flex-1 overflow-y-auto">
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
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      №
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Огноо
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Тоот
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Оршин суугч
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Тайлбар
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                      Дүн
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h, idx) => (
                    <tr
                      key={h._id}
                      className={`border-b border-gray-100 dark:border-gray-800 ${idx % 2 === 0
                        ? "bg-white dark:bg-transparent"
                        : "bg-gray-50/50 dark:bg-gray-800/20"
                        }`}
                    >
                      <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        {fmtDate(h.ognoo || h.createdAt || "")}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                        {h.toot || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        {h.ner || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {h.tailbar || "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                        -{fmt(Math.abs(h.dun))}₮
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
