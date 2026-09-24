"use client";

/**
 * Санал асуулга — оршин суугчдад зориулсан асуумж үүсгэх, удирах, үр дүн харах хуудас.
 *
 * Гурван горим:
 *   jagsaalt - санал асуулгуудын нэгдсэн жагсаалт
 *   uusgekh  - шинэ санал асуулга үүсгэх (интерактив урьдчилсан харагдацтай)
 *   dun      - үр дүн: нэгтгэсэн статистик + оршин суугчдын хариулт
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import {
  Plus,
  Trash2,
  Send,
  ArrowLeft,
  Loader2,
  BarChart3,
  Users,
  X,
  ClipboardList,
  GripVertical,
  Calendar,
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Check,
  Search,
  Copy,
  Building2,
  ListChecks,
  AlertCircle,
  PartyPopper,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";

type AsuultiinTurul = "songolt" | "olonSongolt" | "tekst";

interface Asuult {
  _id?: string;
  asuult: string;
  turul: AsuultiinTurul;
  songoltuud: string[];
  zaavalEsekh: boolean;
  busadTekst?: boolean;
}

interface Asuulga {
  _id: string;
  garchig: string;
  tailbar?: string;
  barilguud?: string[];
  asuultuud: Asuult[];
  tuluv: "noots" | "idevkhtei" | "duussan";
  ekhlekhOgnoo?: string;
  duusakhOgnoo?: string;
  createdAt: string;
  khariultiinToo?: number;
  ajiltniiNer?: string;
}

interface KhariultMur {
  _id: string;
  orshinSuugchNer?: string;
  toot?: string;
  utas?: string;
  createdAt: string;
  khariultuud: {
    asuultiinId: string;
    asuult?: string;
    songogdson?: string[];
    tekst?: string;
  }[];
}

interface DunAsuult {
  asuultiinId: string;
  asuult: string;
  turul: AsuultiinTurul;
  khariulsanToo: number;
  toolol: Record<string, number>;
  tekstuud: { orshinSuugchNer: string; toot: string; tekst: string }[];
}

const TULUV_NER: Record<string, string> = {
  noots: "Ноорог",
  idevkhtei: "Явагдаж байна",
  duussan: "Дууссан",
};

const TULUV_BADGE: Record<string, { cls: string; dot: string }> = {
  idevkhtei: { cls: "bg-warning/10 text-warning", dot: "bg-warning" },
  duussan: { cls: "bg-success/10 text-success", dot: "bg-success" },
  noots: {
    cls: "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]",
    dot: "bg-[color:var(--muted-text)]",
  },
};

function StatusBadge({ tuluv }: { tuluv: "noots" | "idevkhtei" | "duussan" | string }) {
  const t = TULUV_BADGE[tuluv] || TULUV_BADGE.noots;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${t.cls}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
      {TULUV_NER[tuluv] || TULUV_NER.noots}
    </span>
  );
}

/** Жижиг асаах/унтраах товч (асуултын тохиргоонд). */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-[color:var(--panel-text)]"
    >
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-theme" : "bg-[color:var(--ctl-border-hover)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

const ognooFormat = (iso?: string) => {
  if (!iso) return "-";
  const str = String(iso).trim();
  const datePart = str.includes("T") ? str.split("T")[0] : str.split(" ")[0];
  if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return datePart.replace(/-/g, ".");
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return str;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

const ognooTsagFormat = (iso?: string) => {
  if (!iso) return "-";
  const str = String(iso).trim();
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const datePart = str.includes("T") ? str.split("T")[0] : str.split(" ")[0];
    return datePart.replace(/-/g, ".");
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

const ognooParse = (iso?: string): Date | null => {
  if (!iso) return null;
  const str = String(iso).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/** Дуусах огноо хүртэл үлдсэн хоног (өнөөдөр = 0, өнгөрсөн бол сөрөг). */
const uldsenKhonog = (iso?: string): number | null => {
  const d = ognooParse(iso);
  if (!d) return null;
  const unuudur = new Date();
  unuudur.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - unuudur.getTime()) / 86400000);
};

const uldsenTekst = (n: number | null) => {
  if (n === null) return null;
  if (n < 0) return "Хугацаа дууссан";
  if (n === 0) return "Өнөөдөр дуусна";
  return `Дуусахад ${n} хоног үлдлээ`;
};

/** Эхлэх–дуусах хугацааны хэдэн хувь өнгөрсөн (0–100). */
const yavtsKhuvi = (ekh?: string, duus?: string): number | null => {
  const a = ognooParse(ekh);
  const b = ognooParse(duus);
  if (!a || !b || b.getTime() < a.getTime()) return null;
  const niit = b.getTime() - a.getTime() + 86400000;
  const unguursun = Date.now() - a.getTime();
  return Math.max(0, Math.min(100, Math.round((unguursun / niit) * 100)));
};

const inputCls =
  "w-full rounded-[10px] border bg-[color:var(--surface-bg)] px-3 text-[13px] text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] transition focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20";
const cardCls =
  "rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-[var(--ctl-shadow)]";
const btnSecondary =
  "btn-minimal inline-flex h-9 items-center gap-2 !px-3 text-[13px] disabled:opacity-50";
const btnPrimary =
  "inline-flex h-9 items-center gap-2 rounded-[10px] bg-theme px-4 text-[13px] font-medium !text-white transition hover:opacity-90 disabled:opacity-50";

/** Урьдчилсан харагдацын олон сонголтыг нэг мөрөнд хадгалах тусгаарлагч. */
const PREVIEW_SEP = "\u0001";

/**
 * Шинэ асуулт үргэлж хоосон эхэлнэ. Урьд нь эхний асуулт нь жишээ текст,
 * 5 бэлэн хариулттай үүсдэг байсан тул ажилтан бүрийг нь устгаж эхлэх
 * шаардлагатай, санамсаргүй хадгалбал жишээ асуулга нь оршин суугчид руу
 * очих эрсдэлтэй байв.
 */
const shineAsuult = (): Asuult => ({
  asuult: "",
  turul: "songolt",
  songoltuud: ["", ""],
  zaavalEsekh: true,
  busadTekst: false,
});

export default function SanalAsuulgaPage() {
  const { token, ajiltan, baiguullaga } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;

  const [gorim, setGorim] = useState<"jagsaalt" | "uusgekh" | "dun">(
    "jagsaalt"
  );
  const [hailtUg, setHailtUg] = useState("");
  const [filterTuluv, setFilterTuluv] = useState<
    "bugd" | "idevkhtei" | "duussan" | "noots"
  >("bugd");
  const [jagsaalt, setJagsaalt] = useState<Asuulga[]>([]);
  const [achaalj, setAchaalj] = useState(false);
  const [khadgalj, setKhadgalj] = useState(false);

  const niitToo = jagsaalt.length;
  const idevkhteiToo = useMemo(
    () => jagsaalt.filter((a) => a.tuluv === "idevkhtei").length,
    [jagsaalt]
  );
  const duussanToo = useMemo(
    () => jagsaalt.filter((a) => a.tuluv === "duussan").length,
    [jagsaalt]
  );
  const nootsToo = useMemo(
    () => jagsaalt.filter((a) => a.tuluv === "noots").length,
    [jagsaalt]
  );
  const niitKhariultToo = useMemo(
    () => jagsaalt.reduce((acc, a) => acc + (a.khariultiinToo || 0), 0),
    [jagsaalt]
  );

  // Үүсгэх формын төлөв
  const [garchig, setGarchig] = useState("");
  const [tailbar, setTailbar] = useState("");
  const [songogdsonBarilga, setSongogdsonBarilga] = useState<string[]>([]);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState("");
  const [duusakhOgnoo, setDuusakhOgnoo] = useState("");
  const [asuultuud, setAsuultuud] = useState<Asuult[]>([shineAsuult()]);

  // Live Interactive Preview State & Smooth Scroll Tracking
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, string>>(
    {}
  );

  // Drag & Drop reordering state for questions
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);

  const handleQuestionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedQuestionIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleQuestionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleQuestionDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedQuestionIndex === null || draggedQuestionIndex === targetIndex) return;

    setAsuultuud((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedQuestionIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedQuestionIndex(null);
  };

  const [previewTranslateY, setPreviewTranslateY] = useState(0);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gorim !== "uusgekh") return;

    const handleScroll = () => {
      if (!leftColRef.current || !rightColRef.current) return;
      // Жижиг дэлгэцэнд урьдчилсан харагдац формын доор байрлана — дагуулахгүй.
      if (window.innerWidth < 1280) {
        setPreviewTranslateY(0);
        return;
      }
      const leftRect = leftColRef.current.getBoundingClientRect();
      const rightHeight = rightColRef.current.offsetHeight;

      const targetTop = 80; // clearance under 56px topbar
      const scrollDistance = targetTop - leftRect.top;
      const maxTranslate = leftRect.height - rightHeight;

      if (scrollDistance <= 0) {
        setPreviewTranslateY(0);
      } else if (scrollDistance > maxTranslate) {
        setPreviewTranslateY(Math.max(0, maxTranslate));
      } else {
        setPreviewTranslateY(scrollDistance);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [gorim, asuultuud.length]);

  // Үр дүн
  const [songogdsonAsuulga, setSongogdsonAsuulga] = useState<Asuulga | null>(
    null
  );
  const [dun, setDun] = useState<{
    niitKhariult: number;
    asuultuud: DunAsuult[];
  } | null>(null);
  const [khariultuud, setKhariultuud] = useState<KhariultMur[]>([]);
  const [dunAchaalj, setDunAchaalj] = useState(false);

  const { selectedBuildingId } = useBuilding();

  const barilguud = useMemo(
    () => (Array.isArray(baiguullaga?.barilguud) ? baiguullaga.barilguud : []),
    [baiguullaga]
  );

  // Auto-select active main building (e.g. "Их наяд") by default — зөвхөн анх
  // ачаалахад. Дараа нь ажилтан бүх барилгыг болиулж "бүх оршин суугчид"
  // сонголт хийх боломжтой байх ёстой (тайлбар текст ингэж амласан).
  const barilgaAnkhSongoson = useRef(false);
  useEffect(() => {
    if (barilgaAnkhSongoson.current) return;
    if (barilguud.length > 0 && songogdsonBarilga.length === 0) {
      barilgaAnkhSongoson.current = true;
      const activeId =
        selectedBuildingId &&
          barilguud.some((b: any) => String(b._id) === String(selectedBuildingId))
          ? String(selectedBuildingId)
          : String(barilguud[0]._id);
      if (activeId) {
        setSongogdsonBarilga([activeId]);
      }
    }
  }, [barilguud, selectedBuildingId, songogdsonBarilga.length]);

  const jagsaaltAvya = useCallback(async () => {
    if (!token || !baiguullagiinId) return;
    setAchaalj(true);
    try {
      const { data } = await uilchilgee(token).get("/sanalAsuulga", {
        params: { baiguullagiinId },
      });
      setJagsaalt(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setAchaalj(false);
    }
  }, [token, baiguullagiinId]);

  useEffect(() => {
    jagsaaltAvya();
  }, [jagsaaltAvya]);

  /* ── Формын туслахууд ─────────────────────────────────────────────── */

  const formTseverleye = () => {
    setGarchig("");
    setTailbar("");
    const defaultBuildingId =
      selectedBuildingId &&
        barilguud.some((b: any) => String(b._id) === String(selectedBuildingId))
        ? String(selectedBuildingId)
        : barilguud[0]?._id
          ? String(barilguud[0]._id)
          : "";
    setSongogdsonBarilga(defaultBuildingId ? [defaultBuildingId] : []);
    setEkhlekhOgnoo("");
    setDuusakhOgnoo("");
    setAsuultuud([shineAsuult()]);
    setPreviewQuestionIndex(0);
    setPreviewAnswers({});
  };

  const asuultZasya = (i: number, uurchlult: Partial<Asuult>) =>
    setAsuultuud((umnukh) =>
      umnukh.map((a, idx) => (idx === i ? { ...a, ...uurchlult } : a))
    );

  const songoltZasya = (ai: number, si: number, utga: string) =>
    setAsuultuud((umnukh) =>
      umnukh.map((a, idx) =>
        idx === ai
          ? { ...a, songoltuud: a.songoltuud.map((s, j) => (j === si ? utga : s)) }
          : a
      )
    );

  const khadgalya = async (ilgeekhEsekh: boolean) => {
    if (!token || !baiguullagiinId) return;

    if (!garchig.trim()) return openErrorOverlay("Гарчиг бичнэ үү");
    for (const a of asuultuud) {
      if (!a.asuult.trim())
        return openErrorOverlay("Асуултын текст хоосон байна");
      if (a.turul !== "tekst") {
        const tsever = a.songoltuud.map((s) => s.trim()).filter(Boolean);
        if (tsever.length < 2)
          return openErrorOverlay(
            `"${a.asuult}" асуултад дор хаяж 2 хувилбар шаардлагатай`
          );
      }
    }

    setKhadgalj(true);
    try {
      await uilchilgee(token).post("/sanalAsuulga", {
        baiguullagiinId,
        barilguud: songogdsonBarilga,
        garchig: garchig.trim(),
        tailbar: tailbar.trim(),
        ekhlekhOgnoo: ekhlekhOgnoo || undefined,
        duusakhOgnoo: duusakhOgnoo || undefined,
        tuluv: ilgeekhEsekh ? "idevkhtei" : "noots",
        ajiltniiId: ajiltan?._id ? String(ajiltan._id) : undefined,
        ajiltniiNer: ajiltan?.ner || "",
        asuultuud: asuultuud.map((a) => ({
          asuult: a.asuult.trim(),
          turul: a.turul,
          zaavalEsekh: a.zaavalEsekh,
          songoltuud:
            a.turul === "tekst"
              ? []
              : a.songoltuud.map((s) => s.trim()).filter(Boolean),
        })),
      });
      openSuccessOverlay(
        ilgeekhEsekh
          ? "Санал асуулга оршин суугчид руу илгээгдлээ"
          : "Ноорог хадгалагдлаа"
      );
      formTseverleye();
      setGorim("jagsaalt");
      jagsaaltAvya();
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setKhadgalj(false);
    }
  };

  const tuluvSolyo = async (a: Asuulga, tuluv: Asuulga["tuluv"]) => {
    if (!token || !baiguullagiinId) return;
    try {
      await uilchilgee(token).put(`/sanalAsuulga/${a._id}`, {
        baiguullagiinId,
        tuluv,
      });
      setSongogdsonAsuulga((prev) =>
        prev && prev._id === a._id ? { ...prev, tuluv } : prev
      );
      openSuccessOverlay(
        tuluv === "idevkhtei" ? "Илгээгдлээ" : "Асуулга хаагдлаа"
      );
      jagsaaltAvya();
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    }
  };

  const ustgaya = async (a: Asuulga) => {
    if (!token || !baiguullagiinId) return;
    if (!window.confirm(`"${a.garchig}" санал асуулгыг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await uilchilgee(token).delete(`/sanalAsuulga/${a._id}`, {
        data: { baiguullagiinId },
      });
      openSuccessOverlay("Санал асуулга амжилттай устгагдлаа");
      jagsaaltAvya();
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    }
  };

  const dungAvya = async (a: Asuulga) => {
    if (!token || !baiguullagiinId) return;
    setSongogdsonAsuulga(a);
    setGorim("dun");
    setDunAchaalj(true);
    try {
      const [dunRes, khariultRes] = await Promise.all([
        uilchilgee(token).get(`/sanalAsuulga/${a._id}/dun`, {
          params: { baiguullagiinId },
        }),
        uilchilgee(token).get(`/sanalAsuulga/${a._id}/khariultuud`, {
          params: { baiguullagiinId },
        }),
      ]);
      setDun(dunRes.data?.data || null);
      setKhariultuud(
        Array.isArray(khariultRes.data?.data) ? khariultRes.data.data : []
      );
    } catch (err) {
      openErrorOverlay(getErrorMessage(err));
    } finally {
      setDunAchaalj(false);
    }
  };

  /* ── UI туслахууд (зөвхөн харагдац) ─────────────────────────────────── */

  // Хадгалах гэж оролдсоны дараа л хоосон талбаруудыг улаанаар тодруулна.
  const [oroldson, setOroldson] = useState(false);
  // Чирэх зөвхөн бариулаас эхэлнэ — эс бөгөөс input доторх текст сонголт эвдэрнэ.
  const [chirekhIdx, setChirekhIdx] = useState<number | null>(null);
  const [previewIlgeesen, setPreviewIlgeesen] = useState(false);

  const shineUusgeye = () => {
    formTseverleye();
    setOroldson(false);
    setPreviewIlgeesen(false);
    setGorim("uusgekh");
  };

  /** Байгаа асуулгаас хуулж шинэ ноорог эхлүүлэх (API-д шинээр үүснэ). */
  const khuulakh = (a: Asuulga) => {
    setGarchig(a.garchig || "");
    setTailbar(a.tailbar || "");
    setSongogdsonBarilga(
      Array.isArray(a.barilguud) ? a.barilguud.map((x) => String(x)) : []
    );
    setEkhlekhOgnoo("");
    setDuusakhOgnoo("");
    setAsuultuud(
      a.asuultuud?.length
        ? a.asuultuud.map((q) => ({
            asuult: q.asuult || "",
            turul: q.turul,
            songoltuud:
              q.turul !== "tekst" && q.songoltuud?.length
                ? [...q.songoltuud]
                : ["", ""],
            zaavalEsekh: q.zaavalEsekh ?? true,
            busadTekst: !!q.busadTekst,
          }))
        : [shineAsuult()]
    );
    setPreviewQuestionIndex(0);
    setPreviewAnswers({});
    setOroldson(false);
    setPreviewIlgeesen(false);
    setGorim("uusgekh");
  };

  const asuultKhuulya = (i: number) =>
    setAsuultuud((prev) => {
      const c = prev[i];
      if (!c) return prev;
      const updated = [...prev];
      updated.splice(i + 1, 0, {
        ...c,
        _id: undefined,
        songoltuud: [...c.songoltuud],
      });
      return updated;
    });

  const asuultUstgaya = (i: number) => {
    setAsuultuud((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewQuestionIndex((p) => Math.max(0, Math.min(p, asuultuud.length - 2)));
  };

  /* ── Жагсаалт ─────────────────────────────────────────────────────── */

  if (gorim === "jagsaalt") {
    const shuugdsanJagsaalt = jagsaalt.filter((a) => {
      if (filterTuluv !== "bugd" && a.tuluv !== filterTuluv) return false;
      if (!hailtUg.trim()) return true;
      const q = hailtUg.toLowerCase().trim();
      return (
        a.garchig?.toLowerCase().includes(q) ||
        (a.tailbar && a.tailbar.toLowerCase().includes(q))
      );
    });

    const kpiuud: {
      label: string;
      value: number;
      shuult: "bugd" | "idevkhtei" | "duussan" | null;
      dot?: string;
    }[] = [
      { label: "Нийт асуулга", value: niitToo, shuult: "bugd" },
      { label: "Явагдаж байна", value: idevkhteiToo, shuult: "idevkhtei", dot: "bg-warning" },
      { label: "Дууссан", value: duussanToo, shuult: "duussan", dot: "bg-success" },
      { label: "Нийт хариулт", value: niitKhariultToo, shuult: null },
    ];

    const tabuud: { key: typeof filterTuluv; label: string; too: number }[] = [
      { key: "bugd", label: "Бүгд", too: niitToo },
      { key: "idevkhtei", label: "Явагдаж байна", too: idevkhteiToo },
      { key: "duussan", label: "Дууссан", too: duussanToo },
      { key: "noots", label: "Ноорог", too: nootsToo },
    ];

    return (
      <div className="w-full space-y-4 p-4 text-[color:var(--panel-text)] sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="filter-field w-full sm:w-[280px]">
            <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
            <input
              aria-label="Санал асуулга хайх"
              value={hailtUg}
              onChange={(e) => setHailtUg(e.target.value)}
              placeholder="Санал асуулга хайх..."
            />
            {hailtUg && (
              <button
                type="button"
                onClick={() => setHailtUg("")}
                aria-label="Хайлт цэвэрлэх"
                className="shrink-0 rounded p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <button type="button" onClick={shineUusgeye} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Шинэ асуулга үүсгэх
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiuud.map((k) => {
            const idevkhtei =
              k.shuult !== null && k.shuult !== "bugd" && filterTuluv === k.shuult;
            const Tag = k.shuult ? "button" : "div";
            return (
              <Tag
                key={k.label}
                {...(k.shuult
                  ? {
                      type: "button" as const,
                      onClick: () =>
                        setFilterTuluv(
                          k.shuult === "bugd" || filterTuluv === k.shuult
                            ? "bugd"
                            : (k.shuult as typeof filterTuluv)
                        ),
                    }
                  : {})}
                className={`rounded-2xl border bg-[color:var(--surface-bg)] px-5 py-4 text-left shadow-[var(--ctl-shadow)] transition-colors ${
                  idevkhtei
                    ? "border-theme ring-2 ring-theme/20"
                    : "border-[color:var(--ctl-border)]"
                } ${k.shuult ? "cursor-pointer hover:border-[color:var(--ctl-border-hover)]" : ""}`}
              >
                <div className="text-2xl font-semibold leading-tight text-[color:var(--panel-text)]">
                  {k.value}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[color:var(--muted-text)]">
                  {k.dot && <span className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />}
                  {k.label}
                </div>
              </Tag>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabuud.map((t) => {
              const idevkhtei = filterTuluv === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilterTuluv(t.key)}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] px-4 text-[13px] transition-colors ${
                    idevkhtei
                      ? "bg-theme/15 font-medium text-brand"
                      : "text-[color:var(--muted-text)] hover:bg-[color:var(--ctl-hover-bg)] hover:text-[color:var(--panel-text)]"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-md px-1.5 text-[11px] ${
                      idevkhtei
                        ? "bg-theme/15 text-brand"
                        : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
                    }`}
                  >
                    {t.too}
                  </span>
                </button>
              );
            })}
          </div>
          {!achaalj && (hailtUg || filterTuluv !== "bugd") && (
            <span className="text-xs text-[color:var(--muted-text)]">
              {shuugdsanJagsaalt.length} илэрц
            </span>
          )}
        </div>

        {/* Content */}
        {achaalj ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
            <p className="text-xs text-[color:var(--muted-text)]">Ачаалж байна...</p>
          </div>
        ) : shuugdsanJagsaalt.length === 0 ? (
          <div className={`${cardCls} flex flex-col items-center gap-2 px-6 py-16 text-center`}>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-theme/10 text-brand">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium text-[color:var(--panel-text)]">
              {hailtUg
                ? "Хайлтад тохирох асуулга олдсонгүй"
                : filterTuluv !== "bugd"
                ? `"${TULUV_NER[filterTuluv]}" төлөвтэй асуулга алга`
                : "Санал асуулга бүртгэгдээгүй байна"}
            </p>
            <p className="max-w-sm text-xs text-[color:var(--muted-text)]">
              {hailtUg || filterTuluv !== "bugd"
                ? "Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү."
                : "Оршин суугчдын санал бодлыг цуглуулах анхны асуулгаа үүсгээрэй."}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {(hailtUg || filterTuluv !== "bugd") && (
                <button
                  type="button"
                  onClick={() => {
                    setHailtUg("");
                    setFilterTuluv("bugd");
                  }}
                  className={btnSecondary}
                >
                  Шүүлтүүр цэвэрлэх
                </button>
              )}
              <button type="button" onClick={shineUusgeye} className={btnPrimary}>
                <Plus className="h-4 w-4" />
                Шинэ асуулга үүсгэх
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {shuugdsanJagsaalt.map((a) => {
              const uldsen = uldsenKhonog(a.duusakhOgnoo);
              const yavts = yavtsKhuvi(a.ekhlekhOgnoo, a.duusakhOgnoo);
              return (
                <div
                  key={a._id}
                  className={`${cardCls} flex flex-col p-5 transition-colors hover:border-[color:var(--ctl-border-hover)]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[color:var(--panel-text)]">
                      {a.garchig}
                    </h3>
                    <StatusBadge tuluv={a.tuluv} />
                  </div>

                  <p
                    className={`mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-5 ${
                      a.tailbar
                        ? "text-[color:var(--muted-text)]"
                        : "italic text-[color:var(--muted-text)] opacity-70"
                    }`}
                  >
                    {a.tailbar || "Тайлбар оруулаагүй"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[color:var(--muted-text)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {a.ekhlekhOgnoo || a.duusakhOgnoo
                        ? `${ognooFormat(a.ekhlekhOgnoo)} — ${ognooFormat(a.duusakhOgnoo)}`
                        : ognooFormat(a.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 shrink-0" />
                      {a.asuultuud?.length || 0} асуулт
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      {a.khariultiinToo || 0} хариулт
                    </span>
                  </div>

                  {a.tuluv === "idevkhtei" && (yavts !== null || uldsen !== null) && (
                    <div className="mt-3 space-y-1.5">
                      {yavts !== null && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
                          <div
                            className="h-full rounded-full bg-warning"
                            style={{ width: `${yavts}%` }}
                          />
                        </div>
                      )}
                      {uldsen !== null && (
                        <p
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            uldsen <= 1 ? "text-danger" : "text-warning"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {uldsenTekst(uldsen)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="min-h-4 flex-1" />
                  <div className="flex items-center gap-2 border-t border-[color:var(--ctl-border)] pt-4">
                    <button
                      type="button"
                      onClick={() => dungAvya(a)}
                      className={`${btnSecondary} flex-1 justify-center`}
                    >
                      <BarChart3 className="h-4 w-4 text-brand" />
                      Үр дүн
                    </button>

                    {a.tuluv === "noots" && (
                      <button
                        type="button"
                        onClick={() => tuluvSolyo(a, "idevkhtei")}
                        className={btnPrimary}
                        title="Санал асуулгыг оршин суугчдад нийтлэх"
                      >
                        <Send className="h-4 w-4" />
                        Нийтлэх
                      </button>
                    )}

                    {a.tuluv === "idevkhtei" && (
                      <button
                        type="button"
                        onClick={() => tuluvSolyo(a, "duussan")}
                        className={btnSecondary}
                        title="Санал асуулгыг хааж дуусгах"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Хаах
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => khuulakh(a)}
                      aria-label="Хуулж шинээр үүсгэх"
                      title="Хуулж шинээр үүсгэх"
                      className={`${btnSecondary} w-9 justify-center !px-0 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => ustgaya(a)}
                      aria-label="Устгах"
                      title="Устгах"
                      className={`${btnSecondary} w-9 justify-center !px-0 text-[color:var(--muted-text)] hover:!border-danger/40 hover:text-danger`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Үүсгэх: 2 баганат форм + амьд урьдчилсан харагдац ───────────── */

  if (gorim === "uusgekh") {
    const pi = Math.min(previewQuestionIndex, Math.max(0, asuultuud.length - 1));
    const activeQuestion = asuultuud[pi] || shineAsuult();
    const previewUtga = previewAnswers[pi] || "";
    const previewSongogdson = previewUtga.split(PREVIEW_SEP).filter(Boolean);
    const previewKhariulsan =
      activeQuestion.turul === "tekst"
        ? previewUtga.trim().length > 0
        : previewSongogdson.length > 0;
    const suuliinAsuult = pi >= asuultuud.length - 1;
    const uldsen = uldsenKhonog(duusakhOgnoo);
    const mobile = previewDevice === "mobile";

    const previewSongoltDarya = (utga: string) =>
      setPreviewAnswers((prev) => {
        const cur = (prev[pi] || "").split(PREVIEW_SEP).filter(Boolean);
        const next =
          activeQuestion.turul === "olonSongolt"
            ? cur.includes(utga)
              ? cur.filter((x) => x !== utga)
              : [...cur, utga]
            : [utga];
        return { ...prev, [pi]: next.join(PREVIEW_SEP) };
      });

    const buglusunSongoltToo = (a: Asuult) =>
      a.songoltuud.filter((s) => s.trim()).length;

    const aldaatayToo = asuultuud.filter(
      (a) => !a.asuult.trim() || (a.turul !== "tekst" && buglusunSongoltToo(a) < 2)
    ).length;

    const hadgalakh = (ilgeekh: boolean) => {
      setOroldson(true);
      khadgalya(ilgeekh);
    };

    const helperTekst =
      activeQuestion.turul === "songolt"
        ? "Нэг хариулт сонгоно уу"
        : activeQuestion.turul === "olonSongolt"
        ? "Хэд хэдэн хариулт сонгож болно"
        : "Хариултаа чөлөөтэй бичнэ үү";

    const previewScreen = previewIlgeesen ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <PartyPopper className="h-7 w-7" />
        </div>
        <p className="text-[15px] font-semibold text-[color:var(--panel-text)]">
          Баярлалаа!
        </p>
        <p className="text-xs leading-5 text-[color:var(--muted-text)]">
          Таны хариулт амжилттай илгээгдлээ. (Урьдчилсан харагдац — жинхэнэ
          хариулт хадгалагдахгүй.)
        </p>
        <button
          type="button"
          onClick={() => {
            setPreviewIlgeesen(false);
            setPreviewAnswers({});
            setPreviewQuestionIndex(0);
          }}
          className={`${btnSecondary} mt-2`}
        >
          Дахин харах
        </button>
      </div>
    ) : (
      <>
        {/* Scroll body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3 scrollbar-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {uldsen !== null ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  uldsen <= 1 ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                }`}
              >
                <Clock className="h-3 w-3" />
                {uldsenTekst(uldsen)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-hover)] px-2 py-0.5 text-[11px] text-[color:var(--muted-text)]">
                <Clock className="h-3 w-3" />
                Хугацаа заагаагүй
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-hover)] px-2 py-0.5 text-[11px] text-[color:var(--muted-text)]">
              <Building2 className="h-3 w-3" />
              {songogdsonBarilga.length > 0
                ? `${songogdsonBarilga.length} барилга`
                : "Бүх оршин суугч"}
            </span>
          </div>

          <div className="space-y-1">
            <h4
              className={`text-[15px] font-semibold leading-snug ${
                garchig ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"
              }`}
            >
              {garchig || "Санал асуулгын гарчиг"}
            </h4>
            <p className="text-xs leading-5 text-[color:var(--muted-text)]">
              {tailbar || "Товч тайлбар энд харагдана."}
            </p>
            {duusakhOgnoo && (
              <p className="text-[11px] text-[color:var(--muted-text)]">
                Дуусах огноо: {ognooTsagFormat(duusakhOgnoo)}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[color:var(--muted-text)]">
              <span>
                Асуулт {pi + 1}/{asuultuud.length}
              </span>
              <span>{Math.round(((pi + 1) / Math.max(1, asuultuud.length)) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
              <div
                className="h-full rounded-full bg-theme transition-all duration-300"
                style={{ width: `${((pi + 1) / Math.max(1, asuultuud.length)) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="space-y-3">
            <div>
              <p
                className={`text-[14px] font-medium leading-snug ${
                  activeQuestion.asuult
                    ? "text-[color:var(--panel-text)]"
                    : "text-[color:var(--muted-text)]"
                }`}
              >
                {activeQuestion.asuult || "Асуултын текст..."}
                {activeQuestion.zaavalEsekh && <span className="ml-0.5 text-danger">*</span>}
              </p>
              <p className="mt-0.5 text-[11px] text-[color:var(--muted-text)]">{helperTekst}</p>
            </div>

            {activeQuestion.turul !== "tekst" ? (
              <div className="space-y-2">
                {activeQuestion.songoltuud.map((opt, optIdx) => {
                  const key = `o${optIdx}`;
                  const songogdson = previewSongogdson.includes(key);
                  const olon = activeQuestion.turul === "olonSongolt";
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => previewSongoltDarya(key)}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] transition-colors ${
                        songogdson
                          ? "border-theme bg-theme/10 text-[color:var(--panel-text)]"
                          : "border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] hover:border-[color:var(--ctl-border-hover)]"
                      }`}
                    >
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 transition-colors ${
                          olon ? "rounded-[5px]" : "rounded-full"
                        } ${
                          songogdson
                            ? "border-theme bg-theme !text-white"
                            : "border-[color:var(--ctl-border-hover)]"
                        }`}
                      >
                        {songogdson &&
                          (olon ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ))}
                      </span>
                      <span
                        className={`min-w-0 flex-1 break-words ${
                          opt ? "" : "text-[color:var(--muted-text)]"
                        }`}
                      >
                        {opt || `Сонголт ${optIdx + 1}`}
                      </span>
                    </button>
                  );
                })}

                {activeQuestion.busadTekst && (
                  <div
                    className={`rounded-xl border transition-colors ${
                      previewSongogdson.includes("busad")
                        ? "border-theme bg-theme/10"
                        : "border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] hover:border-[color:var(--ctl-border-hover)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => previewSongoltDarya("busad")}
                      className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] text-[color:var(--panel-text)]"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 ${
                          activeQuestion.turul === "olonSongolt" ? "rounded-[5px]" : "rounded-full"
                        } ${
                          previewSongogdson.includes("busad")
                            ? "border-theme bg-theme !text-white"
                            : "border-[color:var(--ctl-border-hover)]"
                        }`}
                      >
                        {previewSongogdson.includes("busad") &&
                          (activeQuestion.turul === "olonSongolt" ? (
                            <Check className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ))}
                      </span>
                      Бусад
                    </button>
                    {previewSongogdson.includes("busad") && (
                      <div className="px-3 pb-3">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Өөрийн хариултыг бичнэ үү..."
                          className={`${inputCls} h-9 border-[color:var(--ctl-border)]`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                rows={4}
                value={previewUtga}
                onChange={(e) =>
                  setPreviewAnswers((prev) => ({ ...prev, [pi]: e.target.value }))
                }
                placeholder="Хариултаа энд бичнэ үү..."
                className={`${inputCls} resize-none border-[color:var(--ctl-border)] py-2.5`}
              />
            )}

            {activeQuestion.zaavalEsekh && !previewKhariulsan && (
              <p className="text-[11px] text-[color:var(--muted-text)]">
                * Заавал хариулах асуулт
              </p>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex shrink-0 items-center gap-2 border-t border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-4 py-3">
          <button
            type="button"
            disabled={pi === 0}
            onClick={() => setPreviewQuestionIndex(Math.max(0, pi - 1))}
            aria-label="Өмнөх асуулт"
            className={`${btnSecondary} w-10 justify-center !px-0 disabled:cursor-not-allowed`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {suuliinAsuult ? (
            <button
              type="button"
              disabled={activeQuestion.zaavalEsekh && !previewKhariulsan}
              onClick={() => setPreviewIlgeesen(true)}
              className={`${btnPrimary} h-10 flex-1 justify-center disabled:cursor-not-allowed`}
            >
              <Send className="h-4 w-4" />
              Илгээх
            </button>
          ) : (
            <button
              type="button"
              disabled={activeQuestion.zaavalEsekh && !previewKhariulsan}
              onClick={() => setPreviewQuestionIndex(Math.min(asuultuud.length - 1, pi + 1))}
              className={`${btnPrimary} h-10 flex-1 justify-center disabled:cursor-not-allowed`}
            >
              Дараах
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </>
    );

    return (
      <div className="w-full space-y-4 text-[color:var(--panel-text)]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setGorim("jagsaalt")}
              className={`${btnSecondary} w-9 justify-center !px-0`}
              aria-label="Буцах"
              title="Буцах"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold text-[color:var(--panel-text)]">
                Шинэ санал асуулга үүсгэх
              </h1>
              <p className="text-xs text-[color:var(--muted-text)]">
                Асуултаа бүрдүүлээд баруун талд оршин суугчид хэрхэн харахыг шалгаарай
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          {/* ── Left: form ── */}
          <div ref={leftColRef} className="space-y-4 xl:col-span-8">
            {/* Info card */}
            <section className={`${cardCls} space-y-4 p-5`}>
              <div>
                <h2 className="text-[14px] font-semibold text-[color:var(--panel-text)]">
                  Ерөнхий мэдээлэл
                </h2>
                <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
                  Гарчиг, хугацаа болон хэнд харагдахыг тохируулна
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="sa-garchig"
                    className="text-[13px] font-medium text-[color:var(--panel-text)]"
                  >
                    Гарчиг <span className="text-danger">*</span>
                  </label>
                  <span className="text-xs tabular-nums text-[color:var(--muted-text)]">
                    {garchig.length}/100
                  </span>
                </div>
                <input
                  id="sa-garchig"
                  value={garchig}
                  maxLength={100}
                  onChange={(e) => setGarchig(e.target.value)}
                  placeholder="Жишээ: Оршин суугчдын сэтгэл ханамжийн судалгаа"
                  className={`${inputCls} h-10 ${
                    oroldson && !garchig.trim()
                      ? "border-danger/60"
                      : "border-[color:var(--ctl-border)]"
                  }`}
                />
                {oroldson && !garchig.trim() && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Гарчиг заавал оруулна
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="sa-tailbar"
                    className="text-[13px] font-medium text-[color:var(--panel-text)]"
                  >
                    Товч тайлбар
                  </label>
                  <span className="text-xs tabular-nums text-[color:var(--muted-text)]">
                    {tailbar.length}/200
                  </span>
                </div>
                <textarea
                  id="sa-tailbar"
                  value={tailbar}
                  maxLength={200}
                  onChange={(e) => setTailbar(e.target.value)}
                  rows={3}
                  placeholder="Асуулгын зорилгыг товч тайлбарлана уу. Жишээ: Таны санал үйлчилгээгээ сайжруулахад тусална."
                  className={`${inputCls} resize-none border-[color:var(--ctl-border)] py-2.5`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[color:var(--panel-text)]">
                  Хугацаа
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-full sm:w-80">
                    <StandardDatePicker
                      isRange
                      value={[ekhlekhOgnoo, duusakhOgnoo]}
                      onChange={(_dates, dateStrings) => {
                        setEkhlekhOgnoo(dateStrings[0] || "");
                        setDuusakhOgnoo(dateStrings[1] || "");
                      }}
                      placeholder={["Эхлэх огноо", "Дуусах огноо"]}
                      className="w-full !h-10 !rounded-[10px]"
                    />
                  </div>
                  <span className="text-xs text-[color:var(--muted-text)]">
                    {uldsen !== null
                      ? uldsenTekst(uldsen)
                      : "Сонгохгүй бол хаах хүртэл нээлттэй байна"}
                  </span>
                </div>
              </div>

              {barilguud.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-[13px] font-medium text-[color:var(--panel-text)]">
                      Хамаарах барилга
                    </label>
                    {barilguud.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSongogdsonBarilga((prev) =>
                            prev.length === barilguud.length
                              ? []
                              : barilguud.map((b: any) => b._id)
                          )
                        }
                        className="text-xs text-brand hover:underline"
                      >
                        {songogdsonBarilga.length === barilguud.length
                          ? "Бүгдийг болиулах"
                          : "Бүгдийг сонгох"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {barilguud.map((b: any) => {
                      const isSelected = songogdsonBarilga.includes(b._id);
                      return (
                        <button
                          key={b._id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setSongogdsonBarilga((prev) =>
                              prev.includes(b._id)
                                ? prev.filter((x) => x !== b._id)
                                : [...prev, b._id]
                            )
                          }
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors ${
                            isSelected
                              ? "border-theme/50 bg-theme/15 font-medium text-brand"
                              : "border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] hover:border-[color:var(--ctl-border-hover)] hover:text-[color:var(--panel-text)]"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5" />
                          )}
                          {b.ner}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-[color:var(--muted-text)]">
                    {songogdsonBarilga.length === 0
                      ? "Барилга сонгоогүй тул бүх оршин суугчдад харагдана."
                      : `Зөвхөн сонгосон ${songogdsonBarilga.length} барилгын оршин суугчдад харагдана.`}
                  </p>
                </div>
              )}
            </section>

            {/* Questions card */}
            <section className={`${cardCls} space-y-4 p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-[14px] font-semibold text-[color:var(--panel-text)]">
                    Асуултууд
                  </h2>
                  <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
                    {asuultuud.length} асуулт · бариулаас чирж дарааллыг өөрчилнө
                  </p>
                </div>
                {oroldson && aldaatayToo > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs text-danger">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {aldaatayToo} асуулт дутуу
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {asuultuud.map((a, i) => {
                  const asuultKhooson = oroldson && !a.asuult.trim();
                  const songoltDutuu =
                    oroldson && a.turul !== "tekst" && buglusunSongoltToo(a) < 2;
                  const idevkhtei = pi === i;
                  return (
                    <div
                      key={i}
                      draggable={chirekhIdx === i}
                      onDragStart={(e) => handleQuestionDragStart(e, i)}
                      onDragOver={handleQuestionDragOver}
                      onDrop={(e) => handleQuestionDrop(e, i)}
                      onDragEnd={() => {
                        setDraggedQuestionIndex(null);
                        setChirekhIdx(null);
                      }}
                      onFocusCapture={() => setPreviewQuestionIndex(i)}
                      onClick={() => setPreviewQuestionIndex(i)}
                      className={`space-y-3 rounded-2xl border bg-[color:var(--surface-bg)] p-4 transition-colors ${
                        draggedQuestionIndex === i
                          ? "border-theme opacity-40"
                          : asuultKhooson || songoltDutuu
                          ? "border-danger/40"
                          : idevkhtei
                          ? "border-theme/50 ring-2 ring-theme/10"
                          : "border-[color:var(--ctl-border)] hover:border-[color:var(--ctl-border-hover)]"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          onMouseDown={() => setChirekhIdx(i)}
                          onMouseUp={() => setChirekhIdx(null)}
                          className="-ml-1 cursor-grab rounded-md p-1 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)] active:cursor-grabbing"
                          title="Чирж байрлал солих"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-theme/15 px-1.5 text-xs font-semibold text-brand">
                          {i + 1}
                        </span>
                        <select
                          value={a.turul}
                          onChange={(e) =>
                            asuultZasya(i, { turul: e.target.value as AsuultiinTurul })
                          }
                          aria-label="Асуултын төрөл"
                          className="ml-auto h-9 cursor-pointer rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-3 text-[13px] text-[color:var(--panel-text)] focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20"
                        >
                          <option value="songolt">Нэг сонголттой</option>
                          <option value="olonSongolt">Олон сонголттой</option>
                          <option value="tekst">Чөлөөт текст хариулт</option>
                        </select>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            asuultKhuulya(i);
                          }}
                          className={`${btnSecondary} w-9 justify-center !px-0 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]`}
                          title="Асуулт хувилах"
                          aria-label="Асуулт хувилах"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={asuultuud.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            asuultUstgaya(i);
                          }}
                          className={`${btnSecondary} w-9 justify-center !px-0 text-[color:var(--muted-text)] hover:text-danger disabled:cursor-not-allowed`}
                          title={asuultuud.length <= 1 ? "Дор хаяж 1 асуулт шаардлагатай" : "Асуулт устгах"}
                          aria-label="Асуулт устгах"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Question text */}
                      <div>
                        <input
                          value={a.asuult}
                          onChange={(e) => asuultZasya(i, { asuult: e.target.value })}
                          placeholder="Асуултын текстээ энд бичнэ үү..."
                          aria-label={`Асуулт ${i + 1}`}
                          className={`${inputCls} h-10 font-medium ${
                            asuultKhooson ? "border-danger/60" : "border-[color:var(--ctl-border)]"
                          }`}
                        />
                        {asuultKhooson && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Асуултын текст оруулна уу
                          </p>
                        )}
                      </div>

                      {/* Options */}
                      {a.turul !== "tekst" ? (
                        <div className="space-y-2">
                          {a.songoltuud.map((s, si) => {
                            const khooson = songoltDutuu && !s.trim();
                            return (
                              <div key={si} className="group flex items-center gap-2">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-medium text-[color:var(--muted-text)] ${
                                    a.turul === "olonSongolt"
                                      ? "rounded-md border border-[color:var(--ctl-border-hover)]"
                                      : "rounded-full border border-[color:var(--ctl-border-hover)]"
                                  }`}
                                >
                                  {si + 1}
                                </span>
                                <input
                                  value={s}
                                  onChange={(e) => songoltZasya(i, si, e.target.value)}
                                  placeholder={`Сонголт ${si + 1}`}
                                  className={`${inputCls} h-9 flex-1 ${
                                    khooson ? "border-danger/60" : "border-[color:var(--ctl-border)]"
                                  }`}
                                />
                                <button
                                  type="button"
                                  disabled={a.songoltuud.length <= 2}
                                  onClick={() =>
                                    asuultZasya(i, {
                                      songoltuud: a.songoltuud.filter((_, j) => j !== si),
                                    })
                                  }
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted-text)] transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-0"
                                  aria-label="Сонголт устгах"
                                  title="Сонголт устгах"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}

                          {a.busadTekst && (
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[color:var(--ctl-border-hover)] text-[11px] text-[color:var(--muted-text)]">
                                …
                              </span>
                              <div className="flex h-9 flex-1 items-center rounded-[10px] border border-dashed border-[color:var(--ctl-border-hover)] px-3 text-[13px] text-[color:var(--muted-text)]">
                                Бусад: оршин суугч өөрөө бичнэ
                              </div>
                              <span className="h-8 w-8 shrink-0" />
                            </div>
                          )}

                          {songoltDutuu && (
                            <p className="flex items-center gap-1 text-xs text-danger">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Дор хаяж 2 сонголт бөглөнө үү
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-16 items-start rounded-[10px] border border-dashed border-[color:var(--ctl-border-hover)] px-3 py-2.5 text-[13px] text-[color:var(--muted-text)]">
                          Оршин суугч хариултаа чөлөөт текстээр бичнэ
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[color:var(--ctl-border)] pt-3">
                        {a.turul !== "tekst" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                asuultZasya(i, { songoltuud: [...a.songoltuud, ""] })
                              }
                              className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
                            >
                              <Plus className="h-4 w-4" />
                              Сонголт нэмэх
                            </button>
                            <Toggle
                              checked={!!a.busadTekst}
                              onChange={(v) => asuultZasya(i, { busadTekst: v })}
                              label="Бусад (текст хариулт)"
                            />
                          </>
                        )}
                        <div className="ml-auto">
                          <Toggle
                            checked={a.zaavalEsekh}
                            onChange={(v) => asuultZasya(i, { zaavalEsekh: v })}
                            label="Заавал хариулах"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAsuultuud((prev) => [...prev, shineAsuult()]);
                  setPreviewQuestionIndex(asuultuud.length);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[color:var(--ctl-border-hover)] text-[13px] font-medium text-[color:var(--muted-text)] transition-colors hover:border-theme hover:bg-theme/5 hover:text-brand"
              >
                <Plus className="h-4 w-4" />
                Асуулт нэмэх
              </button>
            </section>

            {/* Sticky action bar */}
            <div
              className={`${cardCls} sticky bottom-3 z-20 flex flex-wrap items-center gap-2 p-3`}
            >
              <button
                type="button"
                onClick={() => {
                  setAsuultuud((prev) => [...prev, shineAsuult()]);
                  setPreviewQuestionIndex(asuultuud.length);
                }}
                className={btnSecondary}
              >
                <Plus className="h-4 w-4" />
                Асуулт нэмэх
              </button>
              <span className="hidden text-xs text-[color:var(--muted-text)] sm:inline">
                {asuultuud.length} асуулт
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGorim("jagsaalt")}
                  className={`${btnSecondary} hidden md:inline-flex`}
                >
                  Болих
                </button>
                <button
                  type="button"
                  onClick={() => hadgalakh(false)}
                  disabled={khadgalj}
                  className={btnSecondary}
                >
                  Ноорог хадгалах
                </button>
                <button
                  type="button"
                  onClick={() => hadgalakh(true)}
                  disabled={khadgalj}
                  className={btnPrimary}
                >
                  {khadgalj ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Нийтлэх
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div
            ref={rightColRef}
            style={{ transform: `translate3d(0, ${previewTranslateY}px, 0)` }}
            className="z-10 transition-transform duration-75 ease-out xl:col-span-4"
          >
            <div className={`${cardCls} space-y-4 p-4`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[14px] font-semibold text-[color:var(--panel-text)]">
                    Урьдчилан харах
                  </h2>
                  <p className="text-xs text-[color:var(--muted-text)]">
                    Оршин суугчид ингэж харна
                  </p>
                </div>
                <div className="flex shrink-0 items-center rounded-[10px] border border-[color:var(--ctl-border)] p-0.5">
                  {(
                    [
                      ["mobile", Smartphone, "Утас"],
                      ["desktop", Monitor, "Дэлгэц"],
                    ] as const
                  ).map(([key, Icon, ner]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreviewDevice(key)}
                      aria-label={ner}
                      title={ner}
                      className={`flex h-7 w-8 items-center justify-center rounded-lg transition-colors ${
                        previewDevice === key
                          ? "bg-theme/15 text-brand"
                          : "text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {mobile ? (
                <div className="relative mx-auto w-full max-w-[310px]">
                  <div className="relative flex h-[620px] w-full flex-col overflow-hidden rounded-[42px] border-[7px] border-[color:var(--ctl-border-hover)] bg-[color:var(--surface-bg)] shadow-[var(--ctl-shadow)]">
                    {/* Dynamic island */}
                    <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-[color:var(--panel-text)] opacity-90" />
                    {/* Status bar */}
                    <div className="flex shrink-0 items-center justify-between px-6 pb-1 pt-2.5 text-[10px] font-medium text-[color:var(--panel-text)]">
                      <span>09:41</span>
                      <span>5G</span>
                    </div>
                    {/* App bar */}
                    <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--ctl-border)] px-3 py-2.5">
                      <ChevronLeft className="h-4 w-4 text-[color:var(--muted-text)]" />
                      <span className="text-[13px] font-medium text-[color:var(--panel-text)]">
                        Санал асуулга
                      </span>
                    </div>
                    {previewScreen}
                    <div className="mx-auto mb-2 mt-1 h-1 w-24 shrink-0 rounded-full bg-[color:var(--panel-text)] opacity-30" />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)]">
                  <div className="flex shrink-0 items-center gap-1.5 border-b border-[color:var(--ctl-border)] bg-[color:var(--surface-hover)] px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                    <span className="ml-2 text-[11px] text-[color:var(--muted-text)]">
                      Санал асуулга
                    </span>
                  </div>
                  {previewScreen}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Үр дүн харах ─────────────────────────────────────────────────── */

  if (gorim === "dun") {
    const uldsen = uldsenKhonog(songogdsonAsuulga?.duusakhOgnoo);
    const dunKpi = [
      { label: "Нийт хариулт", value: String(dun?.niitKhariult || 0) },
      {
        label: "Асуулт",
        value: String(dun?.asuultuud?.length ?? songogdsonAsuulga?.asuultuud?.length ?? 0),
      },
      {
        label: "Хугацаа",
        value:
          songogdsonAsuulga?.ekhlekhOgnoo || songogdsonAsuulga?.duusakhOgnoo
            ? `${ognooFormat(songogdsonAsuulga?.ekhlekhOgnoo)} — ${ognooFormat(
                songogdsonAsuulga?.duusakhOgnoo
              )}`
            : "Заагаагүй",
        small: true,
      },
      {
        label: "Үлдсэн хугацаа",
        value:
          songogdsonAsuulga?.tuluv === "duussan"
            ? "Дууссан"
            : uldsen === null
            ? "—"
            : uldsen < 0
            ? "Дууссан"
            : `${uldsen} хоног`,
        small: true,
      },
    ];

    return (
      <div className="w-full space-y-4 p-4 text-[color:var(--panel-text)] sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => setGorim("jagsaalt")}
              aria-label="Буцах"
              title="Буцах"
              className={`${btnSecondary} w-9 shrink-0 justify-center !px-0`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[16px] font-semibold text-[color:var(--panel-text)]">
                  {songogdsonAsuulga?.garchig}
                </h1>
                {songogdsonAsuulga && <StatusBadge tuluv={songogdsonAsuulga.tuluv} />}
              </div>
              {songogdsonAsuulga?.tailbar && (
                <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--muted-text)]">
                  {songogdsonAsuulga.tailbar}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {songogdsonAsuulga?.tuluv === "noots" && (
              <button
                type="button"
                onClick={() => tuluvSolyo(songogdsonAsuulga, "idevkhtei")}
                className={btnPrimary}
              >
                <Send className="h-4 w-4" />
                Нийтлэх
              </button>
            )}
            {songogdsonAsuulga?.tuluv === "idevkhtei" && (
              <button
                type="button"
                onClick={() => tuluvSolyo(songogdsonAsuulga, "duussan")}
                className={btnSecondary}
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
                Санал асуулга дуусгах
              </button>
            )}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dunKpi.map((k) => (
            <div key={k.label} className={`${cardCls} px-5 py-4`}>
              <div
                className={`font-semibold leading-tight text-[color:var(--panel-text)] ${
                  k.small ? "text-[15px] leading-8" : "text-2xl"
                }`}
              >
                {k.value}
              </div>
              <div className="mt-1 text-xs text-[color:var(--muted-text)]">{k.label}</div>
            </div>
          ))}
        </div>

        {dunAchaalj ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : !dun || !dun.asuultuud?.length ? (
          <div className={`${cardCls} flex flex-col items-center gap-2 px-6 py-16 text-center`}>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-theme/10 text-brand">
              <BarChart3 className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium">Үр дүн алга</p>
            <p className="text-xs text-[color:var(--muted-text)]">
              Оршин суугчид хариулт өгсний дараа энд нэгтгэл харагдана.
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-12">
            {/* Per-question stats */}
            <div className="space-y-3 lg:col-span-7 xl:col-span-8">
              {dun.asuultuud.map((a, i) => {
                const entries = Object.entries(a.toolol || {});
                const maxToo = entries.reduce((m, [, c]) => Math.max(m, c), 0);
                return (
                  <section key={a.asuultiinId} className={`${cardCls} space-y-4 p-5`}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-theme/15 px-1.5 text-xs font-semibold text-brand">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-medium leading-snug text-[color:var(--panel-text)]">
                          {a.asuult}
                        </h3>
                        <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
                          {a.turul === "songolt"
                            ? "Нэг сонголттой"
                            : a.turul === "olonSongolt"
                            ? "Олон сонголттой"
                            : "Чөлөөт текст"}{" "}
                          · {a.khariulsanToo} хариулт
                        </p>
                      </div>
                    </div>

                    {a.turul !== "tekst" ? (
                      entries.length === 0 ? (
                        <p className="text-xs text-[color:var(--muted-text)]">Хариулт алга</p>
                      ) : (
                        <div className="space-y-3">
                          {entries.map(([opt, count]) => {
                            const pct =
                              a.khariulsanToo > 0
                                ? Math.round((count / a.khariulsanToo) * 100)
                                : 0;
                            const terguun = count > 0 && count === maxToo;
                            return (
                              <div key={opt} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3 text-[13px]">
                                  <span
                                    className={`min-w-0 break-words ${
                                      terguun ? "font-medium" : ""
                                    } text-[color:var(--panel-text)]`}
                                  >
                                    {opt}
                                  </span>
                                  <span className="shrink-0 tabular-nums text-[color:var(--muted-text)]">
                                    {count} ·{" "}
                                    <span
                                      className={
                                        terguun
                                          ? "font-medium text-brand"
                                          : "text-[color:var(--panel-text)]"
                                      }
                                    >
                                      {pct}%
                                    </span>
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      terguun ? "bg-theme" : "bg-theme/50"
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : a.tekstuud.length === 0 ? (
                      <p className="text-xs text-[color:var(--muted-text)]">Хариулт алга</p>
                    ) : (
                      <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
                        {a.tekstuud.map((t, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-hover)] p-3"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                              <span className="font-medium text-[color:var(--panel-text)]">
                                {t.orshinSuugchNer || "Оршин суугч"}
                              </span>
                              {t.toot && (
                                <span className="text-[color:var(--muted-text)]">
                                  {t.toot} тоот
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-[13px] text-[color:var(--panel-text)]">
                              {t.tekst}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Respondents */}
            <section className={`${cardCls} p-5 lg:col-span-5 xl:col-span-4`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[color:var(--panel-text)]">
                  Хариулсан оршин суугчид
                </h3>
                <span className="rounded-md bg-[color:var(--surface-hover)] px-1.5 text-xs text-[color:var(--muted-text)]">
                  {khariultuud.length}
                </span>
              </div>

              {khariultuud.length === 0 ? (
                <p className="py-8 text-center text-xs text-[color:var(--muted-text)]">
                  Одоогоор хариулт ирээгүй байна
                </p>
              ) : (
                <div className="custom-scrollbar max-h-[560px] divide-y divide-[color:var(--ctl-border)] overflow-y-auto pr-1">
                  {khariultuud.map((k) => (
                    <div key={k._id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-theme/15 text-xs font-semibold text-brand">
                        {(k.orshinSuugchNer || "О").trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-[color:var(--panel-text)]">
                          {k.orshinSuugchNer || "Оршин суугч"}
                        </p>
                        <p className="text-xs text-[color:var(--muted-text)]">
                          {k.createdAt ? new Date(k.createdAt).toLocaleString("mn-MN") : ""}
                        </p>
                      </div>
                      {k.toot && (
                        <span className="shrink-0 rounded-md bg-theme/10 px-2 py-0.5 text-[11px] text-brand">
                          {k.toot} тоот
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    );
  }

  return null;
}
