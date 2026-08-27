"use client";

/**
 * СӨХ-ийн ажилтан ↔ оршин суугчийн шууд чат.
 *
 * Хөвөгч чат товчны "Оршин суугч" таб дотор амьдарна. Өмнө нь энэ харилцаа
 * зөвхөн Мэдэгдэл → Санал хүсэлт гэсэн ЖАГСААЛТ хэлбэрээр л байсан тул
 * ажилтан хэд хэдэн оршин суугчтай зэрэг харилцахад хүндрэлтэй байв.
 *
 * Backend талд шинэ юм хэрэггүй - одоо байгаа medegdel thread-үүдийг ашиглана:
 *   GET  /medegdel                 - тухайн байгууллагын бүх мэдэгдэл
 *   GET  /medegdel/thread/:id      - нэг харилцааны бүх мессеж
 *   POST /medegdel/adminReply      - ажилтны хариу
 *   POST /medegdel/:id/kharsanEsekh - уншсан гэж тэмдэглэх
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Search,
  Send,
  MessageSquare,
  Home,
  Phone,
} from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useSocket } from "@/context/SocketContext";

interface MedegdelItem {
  _id: string;
  parentId?: string | null;
  orshinSuugchId?: string | null;
  baiguullagiinId?: string;
  title?: string;
  message?: string;
  kharsanEsekh?: boolean;
  turul?: string;
  createdAt: string;
  updatedAt?: string;
  repliedBy?: string;
  ajiltanId?: string;
  zurag?: string;
  duu?: string;
}

interface OrshinSuugchiinMedeelel {
  ner: string;
  toot: string;
  utas: string;
}

/** Санал/гомдлын төрөл латин ба кирилээр хоёуланг нь хадгалдаг */
const KHARILTSAANII_TURUL = new Set([
  "sanal",
  "санал",
  "gomdol",
  "гомдол",
]);

const tsagFormat = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const undur = new Date();
  const izhilUdur =
    d.getFullYear() === undur.getFullYear() &&
    d.getMonth() === undur.getMonth() &&
    d.getDate() === undur.getDate();
  return izhilUdur
    ? d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" });
};

/**
 * Мессеж АЖИЛТНААС илгээгдсэн эсэх.
 *
 * Backend нь илгээгчийг ЗӨВХӨН `turul`-аар ялгадаг (controller/medegdel.js):
 *   sanal | gomdol → оршин суугчийн анхны мессеж
 *   user_reply     → оршин суугчийн хариу
 *   khariu         → АЖИЛТНЫ хариу (medegdelAdminReply)
 *
 * `ajiltanId` нь req.body-оос уншигддаг ч баримт дээр ХАДГАЛАГДДАГГҮЙ, мөн
 * `repliedBy` ч бичигддэггүй - тэдгээрээр шалгавал бүх мессеж оршин суугчийнх
 * мэт нэг талд эгнэдэг байв.
 */
const ajiltnaasUu = (m: MedegdelItem) => {
  const t = (m.turul || "").toLowerCase();
  if (t === "khariu") return true;
  if (t === "user_reply" || KHARILTSAANII_TURUL.has(t)) return false;
  // Хуучин бичлэгүүдэд зориулсан нөөц шалгалт
  return !!(m.repliedBy || m.ajiltanId);
};

export default function ResidentChatPanel() {
  const { token, ajiltan } = useAuth();
  const socket = useSocket();
  const baiguullagiinId = ajiltan?.baiguullagiinId;

  const [kharilstuud, setKharilstuud] = useState<MedegdelItem[]>([]);
  const [songogdson, setSongogdson] = useState<MedegdelItem | null>(null);
  const [messejuud, setMessejuud] = useState<MedegdelItem[]>([]);
  const [khailt, setKhailt] = useState("");
  const [achaalj, setAchaalj] = useState(false);
  const [threadAchaalj, setThreadAchaalj] = useState(false);
  const [ilgeej, setIlgeej] = useState(false);
  const [bichvar, setBichvar] = useState("");
  /** orshinSuugchId → мэдээлэл. Нэг ID-г дахин татахгүй. */
  const [suugchidMap, setSuugchidMap] = useState<
    Record<string, OrshinSuugchiinMedeelel>
  >({});
  const tatsanIdRef = useRef<Set<string>>(new Set());

  const dooshRef = useRef<HTMLDivElement | null>(null);
  const songogdsonId = songogdson?._id || null;

  // ── Харилцааны жагсаалт ──────────────────────────────────────────────
  const jagsaaltAvya = useCallback(async () => {
    if (!token || !baiguullagiinId) return;
    setAchaalj(true);
    try {
      const { data } = await uilchilgee(token).get("/medegdel", {
        params: { baiguullagiinId, barilgiinId: ajiltan?.barilgiinId },
      });
      const buguud: MedegdelItem[] = Array.isArray(data?.data) ? data.data : [];
      // Зөвхөн ҮНДСЭН мессеж (parentId байхгүй) нь харилцааны толгой болно
      const undsen = buguud
        .filter((m) => !m.parentId)
        .filter((m) => KHARILTSAANII_TURUL.has((m.turul || "").toLowerCase()))
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        );
      setKharilstuud(undsen);
    } catch {
      /* товчлуур дээр дахин оролдоно */
    } finally {
      setAchaalj(false);
    }
  }, [token, baiguullagiinId, ajiltan?.barilgiinId]);

  useEffect(() => {
    jagsaaltAvya();
  }, [jagsaaltAvya]);

  // ── Нэг харилцааны мессежүүд ─────────────────────────────────────────
  const threadAvya = useCallback(
    async (rootId: string, chimeegui = false) => {
      if (!token || !baiguullagiinId) return;
      if (!chimeegui) setThreadAchaalj(true);
      try {
        const { data } = await uilchilgee(token).get(
          `/medegdel/thread/${rootId}`,
          { params: { baiguullagiinId } },
        );
        const jagsaalt: MedegdelItem[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setMessejuud(
          [...jagsaalt].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      } catch {
        /* хоосон үлдээнэ */
      } finally {
        if (!chimeegui) setThreadAchaalj(false);
      }
    },
    [token, baiguullagiinId],
  );

  useEffect(() => {
    if (!songogdsonId) {
      setMessejuud([]);
      return;
    }
    threadAvya(songogdsonId);
    // Уншсан гэж тэмдэглэнэ - алдвал чатыг зогсоохгүй
    if (token) {
      uilchilgee(token)
        .post(`/medegdel/${songogdsonId}/kharsanEsekh`, { baiguullagiinId })
        .catch(() => {});
    }
  }, [songogdsonId, threadAvya, token, baiguullagiinId]);

  // ── Шууд шинэчлэлт ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !baiguullagiinId) return;
    const suvag = `baiguullagiin${baiguullagiinId}`;
    const handler = () => {
      jagsaaltAvya();
      if (songogdsonId) threadAvya(songogdsonId, true);
    };
    socket.on(suvag, handler);
    return () => {
      socket.off(suvag, handler);
    };
  }, [socket, baiguullagiinId, songogdsonId, jagsaaltAvya, threadAvya]);

  // ── Оршин суугчийн мэдээлэл (нэр, тоот, утас) ────────────────────────
  // medegdel дээр зөвхөн orshinSuugchId байдаг тул нэрийг тусад нь татна.
  useEffect(() => {
    if (!token || !baiguullagiinId) return;
    const shineId = kharilstuud
      .map((m) => m.orshinSuugchId)
      .filter((id): id is string => !!id && !tatsanIdRef.current.has(id));
    if (shineId.length === 0) return;
    shineId.forEach((id) => tatsanIdRef.current.add(id));

    (async () => {
      const nemekh: Record<string, OrshinSuugchiinMedeelel> = {};
      await Promise.all(
        Array.from(new Set(shineId)).map(async (id) => {
          let r: any = null;
          // Эхлээд оршин суугч, олдоогүй бол харилцагчаас хайна
          for (const zam of ["/orshinSuugch/", "/khariltsagch/"]) {
            if (r?._id) break;
            try {
              const res = await uilchilgee(token).get(zam + id, {
                params: { baiguullagiinId },
              });
              r = res.data;
            } catch {
              /* дараагийнхыг оролдоно */
            }
          }
          if (!r?._id) return;
          nemekh[String(r._id)] = {
            ner: [r.ovog || "", r.ner || ""].join(" ").trim(),
            toot:
              Array.isArray(r.toots) && r.toots.length > 0
                ? r.toots.map((t: any) => t?.toot || t).join(", ")
                : r.toot || "",
            utas: Array.isArray(r.utas) ? r.utas[0] || "" : r.utas || "",
          };
        }),
      );
      if (Object.keys(nemekh).length > 0)
        setSuugchidMap((umnukh) => ({ ...umnukh, ...nemekh }));
    })();
  }, [kharilstuud, token, baiguullagiinId]);

  /** Харилцаанд харуулах нэр - мэдээлэл олдвол түүнийг эрхэмлэнэ */
  const suugchAvya = useCallback(
    (m: MedegdelItem): OrshinSuugchiinMedeelel => {
      const olson = m.orshinSuugchId ? suugchidMap[m.orshinSuugchId] : null;
      return {
        ner: olson?.ner || m.title || "Нэргүй",
        toot: olson?.toot || "",
        utas: olson?.utas || "",
      };
    },
    [suugchidMap],
  );

  // Шинэ мессеж ирэхэд доош гүйлгэнэ
  useEffect(() => {
    dooshRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messejuud.length]);

  const shuusenJagsaalt = useMemo(() => {
    const kh = khailt.trim().toLowerCase();
    if (!kh) return kharilstuud;
    return kharilstuud.filter((m) => {
      const su = suugchAvya(m);
      return [su.ner, su.toot, su.utas, m.message || ""]
        .join(" ")
        .toLowerCase()
        .includes(kh);
    });
  }, [kharilstuud, khailt, suugchAvya]);

  const ilgeeye = async () => {
    const tekst = bichvar.trim();
    if (!tekst || !songogdsonId || !token || !baiguullagiinId) return;
    setIlgeej(true);
    try {
      const { data } = await uilchilgee(token).post("/medegdel/adminReply", {
        parentId: songogdsonId,
        message: tekst,
        baiguullagiinId,
        ajiltanId: ajiltan?._id ? String(ajiltan._id) : undefined,
      });
      setBichvar("");
      const shine = data?.data;
      if (shine) setMessejuud((umnukh) => [...umnukh, shine]);
      else threadAvya(songogdsonId, true);
      jagsaaltAvya();
    } catch {
      /* дахин илгээхийг хэрэглэгч шийднэ */
    } finally {
      setIlgeej(false);
    }
  };

  // ── Жагсаалтын харагдац ──────────────────────────────────────────────
  if (!songogdson) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={khailt}
              onChange={(e) => setKhailt(e.target.value)}
              placeholder="Нэр, тоот, утсаар хайх"
              className="h-9 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {achaalj && kharilstuud.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            </div>
          ) : shuusenJagsaalt.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <p className="text-xs text-slate-400">
                {khailt ? "Илэрц олдсонгүй" : "Одоогоор харилцаа байхгүй"}
              </p>
            </div>
          ) : (
            shuusenJagsaalt.map((m) => {
              const su = suugchAvya(m);
              return (
              <button
                key={m._id}
                onClick={() => setSongogdson(m)}
                className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                  {su.ner.trim().charAt(0).toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-900">
                      {su.ner}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {tsagFormat(m.updatedAt || m.createdAt)}
                    </span>
                  </div>
                  {(su.toot || su.utas) && (
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                      {su.toot && (
                        <span className="inline-flex items-center gap-1">
                          <Home className="h-2.5 w-2.5" />
                          {su.toot}
                        </span>
                      )}
                      {su.utas && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" />
                          {su.utas}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {m.message || "—"}
                  </p>
                </div>
                {!m.kharsanEsekh && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                )}
              </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Чатын харагдац ───────────────────────────────────────────────────
  const idevkhteiSuugch = suugchAvya(songogdson);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5">
        <button
          onClick={() => setSongogdson(null)}
          aria-label="Буцах"
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
          {idevkhteiSuugch.ner.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">
            {idevkhteiSuugch.ner}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {idevkhteiSuugch.toot && (
              <span className="inline-flex items-center gap-1">
                <Home className="h-2.5 w-2.5" />
                {idevkhteiSuugch.toot}
              </span>
            )}
            {idevkhteiSuugch.utas && (
              <a
                href={"tel:" + idevkhteiSuugch.utas}
                className="inline-flex items-center gap-1 hover:text-emerald-600"
              >
                <Phone className="h-2.5 w-2.5" />
                {idevkhteiSuugch.utas}
              </a>
            )}
            <span className="truncate">
              {songogdson.turul || "Санал хүсэлт"}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
        {threadAchaalj ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          </div>
        ) : (
          messejuud.map((m) => {
            const minii = ajiltnaasUu(m);
            return (
              <div
                key={m._id}
                className={`flex ${minii ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    minii
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                    {m.message || m.title || ""}
                  </p>
                  <p
                    className={`mt-1 text-right text-[9px] ${
                      minii ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {tsagFormat(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={dooshRef} />
      </div>

      <div className="flex shrink-0 items-end gap-2 border-t border-slate-100 p-2.5">
        <textarea
          value={bichvar}
          onChange={(e) => setBichvar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ilgeeye();
            }
          }}
          rows={1}
          placeholder="Хариу бичих..."
          className="max-h-24 min-h-[36px] flex-1 resize-none rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={ilgeeye}
          disabled={ilgeej || !bichvar.trim()}
          aria-label="Илгээх"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
        >
          {ilgeej ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
