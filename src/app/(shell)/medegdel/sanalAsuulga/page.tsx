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
  noots: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  idevkhtei:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  duussan: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};
const TULUV_NER: Record<string, string> = {
  noots: "Ноорог",
  idevkhtei: "Явагдаж байна",
  duussan: "Дууссан",
};

const TURLIIN_NER: Record<AsuultiinTurul, string> = {
  songolt: "Сонголттой (нэг сонголт)",
  olonSongolt: "Олон сонголттой",
  tekst: "Бусад (текст хариулт)",
};

const ognooFormat = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("mn-MN") : "-";

const ognooTsagFormat = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const shineAsuult = (index: number = 1): Asuult => ({
  asuult:
    index === 1
      ? "Amaphome-н үйлчилгээнд та хэр сэтгэл хангалуун байна вэ?"
      : "",
  turul: "songolt",
  songoltuud:
    index === 1
      ? ["Маш сайн", "Сайн", "Дунд зэрэг", "Муу", "Маш муу"]
      : ["", ""],
  zaavalEsekh: true,
  busadTekst: false,
});

export default function SanalAsuulgaPage() {
  const { token, ajiltan, baiguullaga } = useAuth();
  const baiguullagiinId = ajiltan?.baiguullagiinId;

  const [gorim, setGorim] = useState<"jagsaalt" | "uusgekh" | "dun">(
    "jagsaalt"
  );
  const [jagsaalt, setJagsaalt] = useState<Asuulga[]>([]);
  const [achaalj, setAchaalj] = useState(false);
  const [khadgalj, setKhadgalj] = useState(false);

  // Үүсгэх формын төлөв
  const [garchig, setGarchig] = useState(
    "Оршин суугчдын сэтгэл ханамж 2024 оны эхний хагас жил"
  );
  const [tailbar, setTailbar] = useState(
    "Таны үнэлгээ, санал хүсэлт нь бидний үйлчилгээ, орчныг сайжруулахад чухал нөлөөтэй."
  );
  const [songogdsonBarilga, setSongogdsonBarilga] = useState<string[]>([]);
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState("2024-05-20T09:00");
  const [duusakhOgnoo, setDuusakhOgnoo] = useState("2024-05-31T23:59");
  const [asuultuud, setAsuultuud] = useState<Asuult[]>([shineAsuult(1)]);

  // Live Interactive Preview State & Smooth Scroll Tracking
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, string>>(
    { 0: "Сайн" }
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
    setAsuultuud([shineAsuult(1)]);
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
    try {
      await uilchilgee(token).delete(`/sanalAsuulga/${a._id}`, {
        data: { baiguullagiinId },
      });
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

  if (gorim === "jagsaalt")
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Санал асуулга
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Оршин суугчид руу асуумж явуулж, үр дүнг хянах самбар
            </p>
          </div>
          <button
            onClick={() => {
              formTseverleye();
              setGorim("uusgekh");
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition duration-200 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Шинэ асуулга үүсгэх</span>
          </button>
        </div>

        {achaalj ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : jagsaalt.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white py-20 border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Одоогоор санал асуулга бүртгэгдээгүй байна
            </p>
            <button
              onClick={() => {
                formTseverleye();
                setGorim("uusgekh");
              }}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
            >
              + Энд дарж шинийг үүсгэнэ үү
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jagsaalt.map((a) => (
              <div
                key={a._id}
                className="flex flex-col gap-3 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs transition duration-200 hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {a.garchig}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${TULUV_ANGI[a.tuluv]
                      }`}
                  >
                    {TULUV_NER[a.tuluv]}
                  </span>
                </div>

                {a.tailbar && (
                  <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {a.tailbar}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1">
                  <span>{a.asuultuud?.length || 0} асуулт</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Users className="h-3 w-3" />
                    {a.khariultiinToo || 0} хариулт
                  </span>
                  <span>{ognooFormat(a.createdAt)}</span>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => dungAvya(a)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Үр дүн
                  </button>
                  {a.tuluv === "noots" && (
                    <button
                      onClick={() => tuluvSolyo(a, "idevkhtei")}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Илгээх
                    </button>
                  )}
                  {a.tuluv === "idevkhtei" && (
                    <button
                      onClick={() => tuluvSolyo(a, "duussan")}
                      className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 cursor-pointer"
                    >
                      Хаах
                    </button>
                  )}
                  <button
                    onClick={() => ustgaya(a)}
                    aria-label="Устгах"
                    className="ml-auto rounded-xl p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 cursor-pointer"
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

  /* ── Үүсгэх (Шинэ дизайн: Split 2-Column with Live Interactive Device Preview) ── */

  if (gorim === "uusgekh") {
    const activeQuestion =
      asuultuud[previewQuestionIndex] || asuultuud[0] || shineAsuult(1);

    return (
      <div className="w-full space-y-6 text-[color:var(--panel-text)]">
        {/* ── Main Split Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column: Form Controls (8 Cols) ── */}
          <div ref={leftColRef} className="lg:col-span-8 space-y-6">
            {/* Card 1: Санал асуулгын мэдээлэл */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Санал асуулгын мэдээлэл
              </h2>

              {/* Title Input with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Гарчиг <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {garchig.length}/100
                  </span>
                </div>
                <input
                  value={garchig}
                  maxLength={100}
                  onChange={(e) => setGarchig(e.target.value)}
                  placeholder="Оршин суугчдын сэтгэл ханамж 2024 оны эхний хагас жил"
                  className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 px-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Description Input with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Товч тайлбар
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    {tailbar.length}/200
                  </span>
                </div>
                <textarea
                  value={tailbar}
                  maxLength={200}
                  onChange={(e) => setTailbar(e.target.value)}
                  rows={3}
                  placeholder="Таны үнэлгээ, санал хүсэлт нь бидний үйлчилгээ, орчныг сайжруулахад чухал нөлөөтэй."
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Start & End Date Pickers using Custom StandardDatePicker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Эхлэх огноо
                  </label>
                  <StandardDatePicker
                    value={ekhlekhOgnoo}
                    onChange={(_date, dateString) => setEkhlekhOgnoo(dateString)}
                    placeholder="Эхлэх огноо"
                    className="w-full !h-10 !rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Дуусах огноо
                  </label>
                  <StandardDatePicker
                    value={duusakhOgnoo}
                    onChange={(_date, dateString) => setDuusakhOgnoo(dateString)}
                    placeholder="Дуусах огноо"
                    className="w-full !h-10 !rounded-xl"
                  />
                </div>
              </div>

              {/* Building selector filter */}
              {barilguud.length > 0 && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Хамаарах барилга{" "}
                    <span className="font-normal text-slate-400">
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
                          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${isSelected
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
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
                    className={`p-5 rounded-2xl border transition-all ${
                      draggedQuestionIndex === i
                        ? "opacity-30 border-emerald-500 bg-emerald-50/20 scale-[0.99]"
                        : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                    } space-y-4 relative group`}
                  >
                    {/* Question Header Row */}
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700/60 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
                        title="Чирж байрлал солих"
                      >
                        <GripVertical className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        value={a.asuult}
                        onChange={(e) =>
                          asuultZasya(i, { asuult: e.target.value })
                        }
                        placeholder="Асуултын текстаа энд бичнэ үү..."
                        className="h-10 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                      />
                      {asuultuud.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAsuultuud((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
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
                        className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none cursor-pointer"
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
                            <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            <input
                              value={s}
                              onChange={(e) =>
                                songoltZasya(i, si, e.target.value)
                              }
                              placeholder={`Сонголт ${si + 1}`}
                              className="h-9 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
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
                                className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Custom Writing Item Preview when busadTekst is checked */}
                        {a.busadTekst && (
                          <div className="flex items-center gap-2.5 pt-0.5">
                            <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                            <div className="h-9 flex-1 flex items-center gap-2 rounded-xl border border-dashed border-emerald-400/60 dark:border-emerald-600/50 bg-emerald-50/40 dark:bg-emerald-950/30 px-3 text-xs text-emerald-800 dark:text-emerald-300">
                              <span className="font-bold shrink-0">Бусад:</span>
                              <input
                                disabled
                                readOnly
                                value=""
                                placeholder="Оршин суугч өөрийн хариултыг гараар бичих хэсэг..."
                                className="w-full bg-transparent text-xs text-slate-500 placeholder:text-slate-400 focus:outline-none cursor-not-allowed italic"
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
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            + Сонголт нэмэх
                          </button>

                          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!a.busadTekst}
                              onChange={(e) =>
                                asuultZasya(i, {
                                  busadTekst: e.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5 accent-emerald-600 rounded"
                            />
                            <span>Бусад (текст хариулт)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Question Button */}
                <button
                  type="button"
                  onClick={() =>
                    setAsuultuud((prev) => [
                      ...prev,
                      shineAsuult(prev.length + 1),
                    ])
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Асуулт нэмэх</span>
                </button>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => khadgalya(true)}
                disabled={khadgalj}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-6 py-2.5 text-xs font-bold text-white transition duration-150 shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
              >
                <span>Хадгалах & Нийтлэх</span>
                <ChevronRight className="h-4 w-4" />
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

            {/* Authentic Phone Device Container with Reduced Width */}
            <div className="relative mx-auto w-full max-w-[290px]">
              {/* Physical Frame Hardware Side Buttons */}
              <div className="absolute -left-[9px] top-16 w-[3px] h-6 bg-slate-700 dark:bg-slate-600 rounded-l-md z-0" />
              <div className="absolute -left-[9px] top-26 w-[3px] h-6 bg-slate-700 dark:bg-slate-600 rounded-l-md z-0" />
              <div className="absolute -right-[9px] top-20 w-[3px] h-9 bg-slate-700 dark:bg-slate-600 rounded-r-md z-0" />

              {/* Main Phone Body */}
              <div className="relative z-10 w-full rounded-[40px] border-[6px] border-slate-900 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 pt-6 pb-3 shadow-xl space-y-3 overflow-hidden box-border">
                {/* Top Dynamic Island / Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-900 rounded-full flex items-center justify-between px-1.5 z-30">
                  <div className="h-1 w-1 rounded-full bg-slate-800" />
                  <div className="h-1 w-1 rounded-full bg-blue-900/60" />
                </div>

                {/* Phone Status Bar */}
                <div className="flex items-center justify-between px-1 text-[9px] font-semibold text-slate-400 pt-0.5">
                  <span>09:41</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <div className="w-3.5 h-1.5 rounded-xs border border-slate-400 flex items-center p-0.5">
                      <div className="h-full w-1.5 bg-slate-400 rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Идэвхтэй
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Дуусахад 5 хоног үлдлээ
                  </span>
                </div>

                {/* Live Title & Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                    {garchig || "Оршин суугчдын сэтгэл ханамж 2024"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tailbar ||
                      "Таны үнэлгээ, санал хүсэлт нь бидний үйлчилгээ, орчныг сайжруулахад чухал нөлөөтэй."}
                  </p>
                </div>

                {/* Metadata Grid Cards */}
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[10px]">
                  <div>
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">
                      Эхлэх огноо
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {ognooTsagFormat(ekhlekhOgnoo)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-semibold text-slate-400 uppercase">
                      Дуусах огноо
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {ognooTsagFormat(duusakhOgnoo)}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-slate-500">
                      👥 Оролцогч:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {songogdsonBarilga.length > 0
                        ? `${songogdsonBarilga.length} барилга`
                        : "2,468 эрх (Бүгд)"}
                    </span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="border-b border-slate-100 dark:border-slate-800" />

                {/* Live Interactive Question Render */}
                <div className="space-y-2.5">
                  <h5 className="text-[11px] font-bold text-slate-900 dark:text-white">
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
                            className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-medium cursor-pointer transition ${isSelected
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                              }`}
                          >
                            <div
                              className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
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
                          className={`flex flex-col gap-1.5 p-2 rounded-xl border text-[11px] font-medium cursor-pointer transition ${
                            previewAnswers[previewQuestionIndex]?.startsWith("Бусад")
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                previewAnswers[previewQuestionIndex]?.startsWith("Бусад")
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
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
                              className="w-full h-7 px-2 text-[10px] rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      rows={2}
                      placeholder="Хариултаа энд бичнэ үү..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-[11px] bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                    />
                  )}

                  {/* Mock Submit Button */}
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shadow-sm shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    Илгээх
                  </button>
                </div>

                {/* Pagination Switcher for Preview Questions */}
                {asuultuud.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-500">
                    <button
                      type="button"
                      disabled={previewQuestionIndex === 0}
                      onClick={() =>
                        setPreviewQuestionIndex((prev) => Math.max(0, prev - 1))
                      }
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
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
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Bottom Home Indicator Bar */}
                <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2" />
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
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 text-[color:var(--panel-text)]">
        <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <button
            onClick={() => setGorim("jagsaalt")}
            aria-label="Буцах"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {songogdsonAsuulga?.garchig} — Нэгтгэсэн үр дүн
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Нийт {dun?.niitKhariult || 0} оршин суугч хариулт өгсөн байна
            </p>
          </div>
        </div>

        {dunAchaalj ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left: Consolidated Questions Stats */}
            <div className="lg:col-span-7 space-y-4">
              {dun?.asuultuud.map((a, i) => (
                <div
                  key={a.asuultiinId}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
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
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-300">
                                {opt}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                            <span>{t.orshinSuugchNer}</span>
                            <span className="text-[10px] text-slate-400">
                              {t.toot} тоот
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
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
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Хариулсан оршин суугчид ({khariultuud.length})
              </h3>

              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
                {khariultuud.map((k) => (
                  <div key={k._id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{k.orshinSuugchNer || "Оршин суугч"}</span>
                      {k.toot && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
                          {k.toot} тоот
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
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
