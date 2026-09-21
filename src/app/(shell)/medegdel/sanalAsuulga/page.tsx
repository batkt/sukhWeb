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
  Circle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Check,
  Search,
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

const TULUV_ANGI: Record<string, string> = {
  noots:
    "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] border border-[color:var(--surface-border)]",
  idevkhtei:
    "bg-warning/10 text-warning border border-warning/80",
  duussan:
    "bg-success/10 text-success border border-success/80",
};
const TULUV_NER: Record<string, string> = {
  noots: "Ноорог",
  idevkhtei: "Явагдаж байна",
  duussan: "Дууссан",
};

function StatusBadge({ tuluv }: { tuluv: "noots" | "idevkhtei" | "duussan" | string }) {
  if (tuluv === "idevkhtei") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-normal bg-warning/10 text-warning border border-warning/80 shrink-0 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse shrink-0" />
        <span>Явагдаж байна</span>
      </span>
    );
  }
  if (tuluv === "duussan") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-normal bg-theme/10 text-brand border border-theme/80 shrink-0 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-theme shrink-0" />
        <span>Дууссан</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-normal bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] border border-[color:var(--surface-border)] shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--panel)] shrink-0" />
      <span>Ноорог</span>
    </span>
  );
}

const TURLIIN_NER: Record<AsuultiinTurul, string> = {
  songolt: "Сонголттой (нэг сонголт)",
  olonSongolt: "Олон сонголттой",
  tekst: "Бусад (текст хариулт)",
};

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

  // Auto-select active main building (e.g. "Их наяд") by default if no building is selected
  useEffect(() => {
    if (barilguud.length > 0 && songogdsonBarilga.length === 0) {
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

    return (
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 text-[color:var(--panel-text)]">
        {/* Top Action Bar: Search Bar on left, "+ Шинэ асуулга үүсгэх" on right */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--surface-border)] pb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted-text)]" />
            <input
              type="text"
              value={hailtUg}
              onChange={(e) => setHailtUg(e.target.value)}
              placeholder="Санал асуулга хайх..."
              className="w-full h-9.5 pl-9 pr-8 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-xs text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-theme transition shadow-2xs"
            />
            {hailtUg && (
              <button
                type="button"
                onClick={() => setHailtUg("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[color:var(--muted-text)] hover:text-[color:var(--muted-text)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              formTseverleye();
              setGorim("uusgekh");
            }}
            className="flex items-center gap-2 rounded-xl bg-theme px-4 py-2 text-xs font-normal !text-white transition duration-200 hover:bg-theme shadow-md shadow-theme/20 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Шинэ асуулга үүсгэх</span>
          </button>
        </div>

        {/* ── Summary Stat KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Polls */}
          <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[color:var(--muted-text)] uppercase tracking-wider">
                Нийт асуулга
              </p>
              <p className="text-2xl font-medium text-[color:var(--panel-text)] dark:text-white">
                {niitToo}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-theme/10 text-brand flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>

          {/* In Progress (Amber / Yellow) */}
          <div className="rounded-2xl border border-warning/80 bg-warning/40 p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-warning uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />
                Явагдаж байна
              </p>
              <p className="text-2xl font-medium text-warning">
                {idevkhteiToo}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Completed (Emerald / Green) */}
          <div className="rounded-2xl border border-theme/80 bg-theme/40 p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-brand uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-theme shrink-0" />
                Дууссан
              </p>
              <p className="text-2xl font-medium text-brand">
                {duussanToo}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-theme/10 text-brand flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Total Responses */}
          <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[color:var(--muted-text)] uppercase tracking-wider">
                Нийт хариулт
              </p>
              <p className="text-2xl font-medium text-[color:var(--panel-text)] dark:text-white">
                {niitKhariultToo}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-theme/10 text-brand flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-1">
          <button
            type="button"
            onClick={() => setFilterTuluv("bugd")}
            className={`px-3 py-1.5 text-xs font-normal rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterTuluv === "bugd"
                ? "bg-[color:var(--panel)] text-white dark:bg-white shadow-xs"
                : "bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)]"
            }`}
          >
            <span>Бүгд</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterTuluv === "bugd"
                  ? "bg-white/20 text-white"
                  : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
              }`}
            >
              {niitToo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTuluv("idevkhtei")}
            className={`px-3 py-1.5 text-xs font-normal rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterTuluv === "idevkhtei"
                ? "bg-warning text-white shadow-xs"
                : "bg-[color:var(--surface-bg)] text-warning border border-warning/80 hover:bg-warning/10"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                filterTuluv === "idevkhtei" ? "bg-[color:var(--surface-bg)]" : "bg-warning animate-pulse"
              }`}
            />
            <span>Явагдаж байна</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterTuluv === "idevkhtei"
                  ? "bg-white/20 text-white"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {idevkhteiToo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTuluv("duussan")}
            className={`px-3 py-1.5 text-xs font-normal rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterTuluv === "duussan"
                ? "bg-theme text-white shadow-xs"
                : "bg-[color:var(--surface-bg)] text-brand border border-theme/80 hover:bg-theme/10 dark:hover:bg-theme/10"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                filterTuluv === "duussan" ? "bg-[color:var(--surface-bg)]" : "bg-theme"
              }`}
            />
            <span>Дууссан</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterTuluv === "duussan"
                  ? "bg-white/20 text-white"
                  : "bg-theme/10 text-brand"
              }`}
            >
              {duussanToo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTuluv("noots")}
            className={`px-3 py-1.5 text-xs font-normal rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterTuluv === "noots"
                ? "bg-[color:var(--panel)] text-white shadow-xs"
                : "bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)]"
            }`}
          >
            <span>Ноорог</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filterTuluv === "noots"
                  ? "bg-white/20 text-white"
                  : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
              }`}
            >
              {nootsToo}
            </span>
          </button>
        </div>

        {/* ── Content Area: Loading / Empty / Grid Cards ── */}
        {achaalj ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-xs text-[color:var(--muted-text)]">Ачаалж байна...</p>
          </div>
        ) : shuugdsanJagsaalt.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-[color:var(--surface-bg)] py-20 border border-[color:var(--surface-border)] shadow-xs">
            <ClipboardList className="h-12 w-12 text-[color:var(--muted-text)]" />
            <p className="text-sm font-normal text-[color:var(--muted-text)]">
              {hailtUg
                ? "Хайлтад тохирох асуулга олдсонгүй"
                : filterTuluv !== "bugd"
                ? `"${TULUV_NER[filterTuluv]}" төлөвтэй асуулга олдсонгүй`
                : "Одоогоор санал асуулга бүртгэгдээгүй байна"}
            </p>
            <button
              type="button"
              onClick={() => {
                formTseverleye();
                setGorim("uusgekh");
              }}
              className="mt-2 text-xs font-normal text-brand hover:underline cursor-pointer"
            >
              + Шинэ санал асуулга үүсгэх
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {shuugdsanJagsaalt.map((a) => (
              <div
                key={a._id}
                className="flex flex-col rounded-2xl bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                {/* Header */}
                <div className="p-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
                    <h3 className="min-w-0 flex-1 text-sm font-normal text-[color:var(--panel-text)] dark:text-white line-clamp-2 leading-snug group-hover:text-brand dark:group-hover:text-brand transition-colors">
                      {a.garchig}
                    </h3>
                    <StatusBadge tuluv={a.tuluv} />
                  </div>

                  {a.tailbar && (
                    <p className="line-clamp-2 text-xs text-[color:var(--muted-text)] leading-relaxed">
                      {a.tailbar}
                    </p>
                  )}
                </div>

                {/* Metadata strip */}
                <div className="px-5 py-2.5 bg-[color:var(--surface-hover)] border-y border-[color:var(--surface-border)] text-[11px] text-[color:var(--muted-text)] flex flex-wrap items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[color:var(--muted-text)] shrink-0" />
                    {a.ekhlekhOgnoo || a.duusakhOgnoo ? (
                      <span>
                        {ognooFormat(a.ekhlekhOgnoo)} — {ognooFormat(a.duusakhOgnoo)}
                      </span>
                    ) : (
                      <span>{ognooFormat(a.createdAt)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5 text-[color:var(--muted-text)] shrink-0" />
                      {a.asuultuud?.length || 0} асуулт
                    </span>
                    <span className="inline-flex items-center gap-1 font-normal text-brand bg-theme/10 px-2 py-0.5 rounded-md text-[10px]">
                      <Users className="h-3 w-3 shrink-0" />
                      {a.khariultiinToo || 0} хариулт
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => dungAvya(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[color:var(--surface-hover)] hover:bg-[color:var(--panel)] px-3 py-2 text-xs font-normal text-[color:var(--panel-text)] transition cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-brand" />
                    <span>Үр дүн</span>
                  </button>

                  {a.tuluv === "noots" && (
                    <button
                      type="button"
                      onClick={() => tuluvSolyo(a, "idevkhtei")}
                      className="flex items-center gap-1.5 rounded-xl bg-theme hover:bg-theme px-3.5 py-2 text-xs font-normal !text-white transition cursor-pointer shadow-xs"
                      title="Санал асуулгыг оршин суугчдад нийтлэх"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Илгээх</span>
                    </button>
                  )}

                  {a.tuluv === "idevkhtei" && (
                    <button
                      type="button"
                      onClick={() => tuluvSolyo(a, "duussan")}
                      className="flex items-center gap-1.5 rounded-xl bg-warning/15 hover:bg-warning/25 border border-warning/30 text-warning px-3.5 py-2 text-xs font-normal transition cursor-pointer"
                      title="Санал асуулгыг хааж дуусгах"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-warning" />
                      <span>Хаах</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => ustgaya(a)}
                    aria-label="Устгах"
                    title="Устгах"
                    className="rounded-xl p-2 text-[color:var(--muted-text)] hover:bg-danger/10 hover:text-danger transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Үүсгэх (Шинэ дизайн: Split 2-Column with Live Interactive Device Preview) ── */

  if (gorim === "uusgekh") {
    const activeQuestion =
      asuultuud[previewQuestionIndex] || asuultuud[0] || shineAsuult();

    return (
      <div className="w-full space-y-6 text-[color:var(--panel-text)]">
        {/* Top Header Bar for Create Mode */}
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--surface-border)] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGorim("jagsaalt")}
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] transition cursor-pointer"
              title="Буцах"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-normal text-[color:var(--panel-text)] dark:text-white">
              Шинэ санал асуулга үүсгэх
            </h1>
          </div>
        </div>

        {/* ── Main Split Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column: Form Controls (8 Cols) ── */}
          <div ref={leftColRef} className="lg:col-span-8 space-y-6">
            {/* Card 1: Санал асуулгын мэдээлэл */}
            <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between border-b border-[color:var(--surface-border)] pb-3 gap-3">
                <h2 className="text-xs font-normal uppercase tracking-wider text-[color:var(--panel-text)] shrink-0">
                  Санал асуулгын мэдээлэл
                </h2>
                <div className="w-72 shrink-0">
                  <StandardDatePicker
                    isRange
                    value={[ekhlekhOgnoo, duusakhOgnoo]}
                    onChange={(_dates, dateStrings) => {
                      setEkhlekhOgnoo(dateStrings[0] || "");
                      setDuusakhOgnoo(dateStrings[1] || "");
                    }}
                    placeholder={["Эхлэх огноо", "Дуусах огноо"]}
                    className="w-full !h-9 !rounded-xl"
                  />
                </div>
              </div>

              {/* Title Input with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-normal text-[color:var(--muted-text)]">
                    Гарчиг <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] font-normal text-[color:var(--muted-text)]">
                    {garchig.length}/100
                  </span>
                </div>
                <input
                  value={garchig}
                  maxLength={100}
                  onChange={(e) => setGarchig(e.target.value)}
                  placeholder="Оршин суугчдын сэтгэл ханамж 2024 оны эхний хагас жил"
                  className="h-11 w-full rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3.5 text-xs text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:border-theme focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Description Input with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-normal text-[color:var(--muted-text)]">
                    Товч тайлбар
                  </label>
                  <span className="text-[11px] font-normal text-[color:var(--muted-text)]">
                    {tailbar.length}/200
                  </span>
                </div>
                <textarea
                  value={tailbar}
                  maxLength={200}
                  onChange={(e) => setTailbar(e.target.value)}
                  rows={3}
                  placeholder="Таны үнэлгээ, санал хүсэлт нь бидний үйлчилгээ, орчныг сайжруулахад чухал нөлөөтэй."
                  className="w-full resize-none rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3 text-xs text-[color:var(--panel-text)] dark:text-white placeholder:text-[color:var(--muted-text)] focus:border-theme focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Building selector filter */}
              {barilguud.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-normal text-[color:var(--muted-text)]">
                    Хамаарах барилга{" "}
                    <span className="font-normal text-[color:var(--muted-text)]">
                      (Сонгохгүй бол бүх оршин суугчдад харагдана)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {barilguud.map((b: any) => {
                      const isSelected = songogdsonBarilga.includes(b._id);
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() =>
                            setSongogdsonBarilga((prev) =>
                              prev.includes(b._id)
                                ? prev.filter((x) => x !== b._id)
                                : [...prev, b._id]
                            )
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-normal transition cursor-pointer ${isSelected
                            ? "bg-theme text-white shadow-xs"
                            : "bg-[color:var(--surface-hover)] text-[color:var(--muted-text)] hover:bg-[color:var(--panel)]"
                            }`}
                        >
                          {b.ner}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Асуулт & хариултууд */}
            <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-6 shadow-xs space-y-5">
              <h2 className="text-xs font-normal uppercase tracking-wider text-[color:var(--panel-text)] border-b border-[color:var(--surface-border)] pb-3">
                Асуулт & хариултууд
              </h2>

              <div className="space-y-4">
                {asuultuud.map((a, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleQuestionDragStart(e, i)}
                    onDragOver={handleQuestionDragOver}
                    onDrop={(e) => handleQuestionDrop(e, i)}
                    onDragEnd={() => setDraggedQuestionIndex(null)}
                    className={`p-5 rounded-2xl border transition-all ${draggedQuestionIndex === i
                      ? "opacity-30 border-theme bg-theme/20 scale-[0.99]"
                      : "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]"
                      } space-y-4 relative group`}
                  >
                    {/* Question Header Row */}
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1 rounded-lg hover:bg-[color:var(--panel)] cursor-grab active:cursor-grabbing text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition shrink-0"
                        title="Чирж байрлал солих"
                      >
                        <GripVertical className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="text-xs font-normal text-[color:var(--panel-text)] shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        value={a.asuult}
                        onChange={(e) =>
                          asuultZasya(i, { asuult: e.target.value })
                        }
                        placeholder="Асуултын текстаа энд бичнэ үү..."
                        className="h-10 flex-1 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 text-xs font-normal text-[color:var(--panel-text)] dark:text-white focus:border-theme focus:outline-none"
                      />
                      {asuultuud.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAsuultuud((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="p-2 rounded-xl text-[color:var(--muted-text)] hover:text-danger hover:bg-danger/10 transition cursor-pointer"
                          title="Асуулт устгах"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Question Type Selector */}
                    <div className="pl-6">
                      <select
                        value={a.turul}
                        onChange={(e) =>
                          asuultZasya(i, {
                            turul: e.target.value as AsuultiinTurul,
                          })
                        }
                        className="h-9 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 text-xs font-normal text-[color:var(--panel-text)] focus:border-theme focus:outline-none cursor-pointer"
                      >
                        <option value="songolt">
                          Сонголттой (нэг сонголт)
                        </option>
                        <option value="olonSongolt">
                          Олон сонголттой
                        </option>
                        <option value="tekst">Чөлөөт текст хариулт</option>
                      </select>
                    </div>

                    {/* Options Row for Choices */}
                    {a.turul !== "tekst" && (
                      <div className="pl-6 space-y-2.5">
                        {a.songoltuud.map((s, si) => (
                          <div
                            key={si}
                            className="flex items-center gap-2.5"
                          >
                            <Circle className="h-3.5 w-3.5 text-[color:var(--muted-text)] shrink-0" />
                            <input
                              value={s}
                              onChange={(e) =>
                                songoltZasya(i, si, e.target.value)
                              }
                              placeholder={`Сонголт ${si + 1}`}
                              className="h-9 flex-1 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 text-xs text-[color:var(--panel-text)] dark:text-white focus:border-theme focus:outline-none"
                            />
                            {a.songoltuud.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  asuultZasya(i, {
                                    songoltuud: a.songoltuud.filter(
                                      (_, j) => j !== si
                                    ),
                                  })
                                }
                                className="p-1 text-[color:var(--muted-text)] hover:text-danger transition cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Custom Writing Item Preview when busadTekst is checked */}
                        {a.busadTekst && (
                          <div className="flex items-center gap-2.5 pt-0.5">
                            <Circle className="h-3.5 w-3.5 text-[color:var(--muted-text)] shrink-0" />
                            <div className="h-9 flex-1 flex items-center gap-2 rounded-xl border border-dashed border-theme/60 bg-theme/40 px-3 text-xs text-brand">
                              <span className="font-normal shrink-0">Бусад:</span>
                              <input
                                disabled
                                readOnly
                                value=""
                                placeholder="Оршин суугч өөрийн хариултыг гараар бичих хэсэг..."
                                className="w-full bg-transparent text-xs text-[color:var(--muted-text)] placeholder:text-[color:var(--muted-text)] focus:outline-none cursor-not-allowed italic"
                              />
                            </div>
                          </div>
                        )}

                        {/* Option Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              asuultZasya(i, {
                                songoltuud: [...a.songoltuud, ""],
                              })
                            }
                            className="text-xs font-normal text-brand hover:underline cursor-pointer"
                          >
                            + Сонголт нэмэх
                          </button>

                          <label className="flex items-center gap-1.5 text-xs text-[color:var(--muted-text)] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!a.busadTekst}
                              onChange={(e) =>
                                asuultZasya(i, {
                                    busadTekst: e.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5 accent-theme rounded"
                            />
                            <span>Бусад (текст хариулт)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 80/20 Action Bar: Add Question (80%) & Save & Publish (20%) */}
            <div className="grid grid-cols-10 gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setAsuultuud((prev) => [
                    ...prev,
                    shineAsuult(),
                  ])
                }
                className="col-span-8 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] text-xs font-normal text-[color:var(--panel-text)] hover:text-brand dark:hover:text-brand hover:border-theme hover:bg-theme/10 transition cursor-pointer shadow-2xs"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Асуулт нэмэх</span>
              </button>

              <button
                type="button"
                onClick={() => khadgalya(true)}
                disabled={khadgalj}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-theme hover:bg-theme active:scale-95 px-3 py-3.5 text-xs font-normal text-white transition duration-150 shadow-lg shadow-theme/25 disabled:opacity-50 cursor-pointer text-center whitespace-nowrap"
              >
                <span>Хадгалах</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* ── Right Column: Live Interactive Device Preview Panel (4 Cols) ── */}
          <div
            ref={rightColRef}
            style={{
              transform: `translate3d(0, ${previewTranslateY}px, 0)`,
            }}
            className="lg:col-span-4 space-y-3 transition-transform duration-75 ease-out z-20"
          >

            {/* Authentic iPhone 16 / 17 Device Container */}
            <div className="relative mx-auto w-full max-w-[320px]">
              {/* Main Phone Body with realistic 640px iPhone height */}
              <div className="relative z-10 w-full h-[640px] rounded-[44px] border-[8px] border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3.5 pt-7 pb-3 shadow-2xl flex flex-col justify-between overflow-hidden box-border">
                {/* Top Dynamic Island / Pill Cutout */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[color:var(--panel)] rounded-full flex items-center justify-between px-2 z-30 shadow-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--panel)]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-theme/80" />
                </div>

                {/* Phone Status Bar */}
                <div className="flex items-center justify-between px-1 text-[9px] font-normal text-[color:var(--muted-text)] pt-0.5 shrink-0">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3.5 h-1.5 rounded-xs border border-[color:var(--surface-border)] flex items-center p-0.5">
                      <div className="h-full w-1.5 bg-[color:var(--panel)] rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Scrollable Screen Body Area */}
                <div className="flex-1 overflow-y-auto pr-0.5 space-y-3 scrollbar-none">
                  {/* Status Badges Row */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 text-[9px] font-normal rounded-full bg-warning/10 text-warning">
                      Явагдаж байна
                    </span>
                    <span className="text-[9px] font-normal text-warning flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Дуусахад 5 хоног үлдлээ
                    </span>
                  </div>

                  {/* Live Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-normal text-[color:var(--panel-text)] dark:text-white leading-snug">
                      {garchig || "Оршин суугчдын сэтгэл ханамж 2024"}
                    </h4>
                    <p className="text-[11px] text-[color:var(--muted-text)] leading-relaxed">
                      {tailbar ||
                        "Таны үнэлгээ, санал хүсэлт нь бидний үйлчилгээ, орчныг сайжруулахад чухал нөлөөтэй."}
                    </p>
                  </div>

                  {/* Metadata Grid Cards */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-[10px]">
                    <div>
                      <span className="block text-[8px] font-normal text-[color:var(--muted-text)] uppercase">
                        Эхлэх огноо
                      </span>
                      <span className="font-normal text-[color:var(--panel-text)]">
                        {ognooTsagFormat(ekhlekhOgnoo)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-normal text-[color:var(--muted-text)] uppercase">
                        Дуусах огноо
                      </span>
                      <span className="font-normal text-[color:var(--panel-text)]">
                        {ognooTsagFormat(duusakhOgnoo)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-[color:var(--surface-border)] flex items-center justify-between">
                      <span className="text-[9px] font-normal text-[color:var(--muted-text)]">
                        👥 Оролцогч:
                      </span>
                      <span className="font-normal text-brand">
                        {songogdsonBarilga.length > 0
                          ? `${songogdsonBarilga.length} барилга`
                          : "2,468 эрх (Бүгд)"}
                      </span>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="border-b border-[color:var(--surface-border)]" />

                  {/* Live Interactive Question Render */}
                  <div className="space-y-2.5">
                    <h5 className="text-[11px] font-normal text-[color:var(--panel-text)] dark:text-white">
                      {previewQuestionIndex + 1}.{" "}
                      {activeQuestion.asuult || "Асуултын текст..."}
                    </h5>

                    {activeQuestion.turul !== "tekst" ? (
                      <div className="space-y-1.5">
                        {activeQuestion.songoltuud.map((opt, optIdx) => {
                          const isSelected =
                            previewAnswers[previewQuestionIndex] === opt;
                          return (
                            <div
                              key={optIdx}
                              onClick={() =>
                                setPreviewAnswers((prev) => ({
                                  ...prev,
                                  [previewQuestionIndex]: opt,
                                }))
                              }
                              className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-normal cursor-pointer transition ${isSelected
                                ? "border-theme bg-theme/50 text-brand font-normal"
                                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] hover:border-[color:var(--surface-border)]"
                                }`}
                            >
                              <div
                                className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                  ? "border-theme bg-theme text-white"
                                  : "border-[color:var(--surface-border)]"
                                  }`}
                              >
                                {isSelected && (
                                  <Check className="h-2 w-2 stroke-[3]" />
                                )}
                              </div>
                              <span className="truncate">
                                {opt || `Хувилбар ${optIdx + 1}`}
                              </span>
                            </div>
                          );
                        })}

                        {/* Custom Writing Option Item in Phone Preview when busadTekst is enabled */}
                        {activeQuestion.busadTekst && (
                          <div
                            onClick={() =>
                              setPreviewAnswers((prev) => ({
                                ...prev,
                                [previewQuestionIndex]: "Бусад",
                              }))
                            }
                            className={`flex flex-col gap-1.5 p-2 rounded-xl border text-[11px] font-normal cursor-pointer transition ${
                              previewAnswers[previewQuestionIndex]?.startsWith("Бусад")
                                ? "border-theme bg-theme/50 text-brand font-normal"
                                : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] hover:border-[color:var(--surface-border)]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  previewAnswers[previewQuestionIndex]?.startsWith("Бусад")
                                    ? "border-theme bg-theme text-white"
                                    : "border-[color:var(--surface-border)]"
                                }`}
                              >
                                {previewAnswers[previewQuestionIndex]?.startsWith("Бусад") && (
                                  <Check className="h-2 w-2 stroke-[3]" />
                                )}
                              </div>
                              <span>Бусад (бусад утга бичих)</span>
                            </div>
                            {previewAnswers[previewQuestionIndex]?.startsWith("Бусад") && (
                              <input
                                type="text"
                                placeholder="Хариултаа бичнэ үү..."
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-7 px-2 text-[10px] rounded-lg border border-theme/30 bg-[color:var(--surface-bg)] text-[color:var(--panel-text)] dark:text-white focus:outline-none"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        placeholder="Хариултаа энд бичнэ үү..."
                        className="w-full rounded-xl border border-[color:var(--surface-border)] p-2 text-[11px] bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] dark:text-white"
                      />
                    )}

                    {/* Mock Submit Button */}
                    <button
                      type="button"
                      className="w-full py-2 rounded-xl bg-theme text-white font-normal text-[11px] shadow-sm shadow-theme/20 active:scale-95 transition cursor-pointer"
                    >
                      Илгээх
                    </button>
                  </div>

                  {/* Pagination Switcher for Preview Questions */}
                  {asuultuud.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-1.5 border-t border-[color:var(--surface-border)] text-[10px] font-normal text-[color:var(--muted-text)]">
                      <button
                        type="button"
                        disabled={previewQuestionIndex === 0}
                        onClick={() =>
                          setPreviewQuestionIndex((prev) => Math.max(0, prev - 1))
                        }
                        className="p-1 rounded-lg hover:bg-[color:var(--surface-hover)] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span>
                        {previewQuestionIndex + 1} / {asuultuud.length}
                      </span>
                      <button
                        type="button"
                        disabled={previewQuestionIndex === asuultuud.length - 1}
                        onClick={() =>
                          setPreviewQuestionIndex((prev) =>
                            Math.min(asuultuud.length - 1, prev + 1)
                          )
                        }
                        className="p-1 rounded-lg hover:bg-[color:var(--surface-hover)] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom iOS Home Indicator Pill */}
                <div className="w-28 h-1 bg-[color:var(--panel)] rounded-full mx-auto shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Үр дүн харах ─────────────────────────────────────────────────── */

  if (gorim === "dun") {
    return (
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 text-[color:var(--panel-text)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[color:var(--surface-border)] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGorim("jagsaalt")}
              aria-label="Буцах"
              className="rounded-xl p-2 text-[color:var(--muted-text)] transition hover:bg-[color:var(--surface-hover)] dark:hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-normal tracking-tight text-[color:var(--panel-text)] dark:text-white">
                  {songogdsonAsuulga?.garchig}
                </h1>
                {songogdsonAsuulga && (
                  <StatusBadge tuluv={songogdsonAsuulga.tuluv} />
                )}
              </div>
              <p className="text-xs text-[color:var(--muted-text)] mt-1">
                Нийт {dun?.niitKhariult || 0} оршин суугч хариулт өгсөн байна
              </p>
            </div>
          </div>

          {songogdsonAsuulga?.tuluv === "idevkhtei" && (
            <button
              type="button"
              onClick={() => songogdsonAsuulga && tuluvSolyo(songogdsonAsuulga, "duussan")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-theme/30 bg-theme/10 text-xs font-normal text-brand hover:bg-theme/10 dark:hover:bg-theme/50 transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <span>Санал асуулга дуусгах</span>
            </button>
          )}
        </div>

        {dunAchaalj ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left: Consolidated Questions Stats */}
            <div className="lg:col-span-7 space-y-4">
              {dun?.asuultuud.map((a, i) => (
                <div
                  key={a.asuultiinId}
                  className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs space-y-4"
                >
                  <h3 className="text-sm font-normal text-[color:var(--panel-text)] dark:text-white">
                    {i + 1}. {a.asuult}
                  </h3>

                  {a.turul !== "tekst" ? (
                    <div className="space-y-3">
                      {Object.entries(a.toolol || {}).map(([opt, count]) => {
                        const pct =
                          a.khariulsanToo > 0
                            ? Math.round((count / a.khariulsanToo) * 100)
                            : 0;

                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-normal">
                              <span className="text-[color:var(--panel-text)]">
                                {opt}
                              </span>
                              <span className="text-brand">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[color:var(--surface-hover)] overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full rounded-full bg-theme transition-all duration-500"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {a.tekstuud.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[color:var(--surface-hover)] text-xs border border-[color:var(--surface-border)]"
                        >
                          <div className="flex items-center justify-between font-normal text-[color:var(--panel-text)] mb-1">
                            <span>{t.orshinSuugchNer}</span>
                            <span className="text-[10px] text-[color:var(--muted-text)]">
                              {t.toot} тоот
                            </span>
                          </div>
                          <p className="text-[color:var(--muted-text)]">
                            {t.tekst}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right: Resident Responses List */}
            <div className="lg:col-span-5 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-normal text-[color:var(--panel-text)] dark:text-white border-b border-[color:var(--surface-border)] pb-3">
                Хариулсан оршин суугчид ({khariultuud.length})
              </h3>

              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 divide-y divide-[color:var(--surface-border)] custom-scrollbar">
                {khariultuud.map((k) => (
                  <div key={k._id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-normal text-[color:var(--panel-text)] dark:text-white">
                      <span>{k.orshinSuugchNer || "Оршин суугч"}</span>
                      {k.toot && (
                        <span className="px-2 py-0.5 rounded-md bg-theme/10 text-brand text-[10px]">
                          {k.toot} тоот
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[color:var(--muted-text)]">
                      {k.createdAt ? new Date(k.createdAt).toLocaleString("mn-MN") : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
