"use client";

/**
 * Барилгын групп чат (ажилтан).
 *
 * Барилга бүрт нэг групп чат — тухайн барилгын оршин суугчид (апп) болон
 * байгууллагын ажилтнууд (вэб) автоматаар гишүүн. Ажилтан эрхтэй
 * барилгуудынхаа чатыг зүүн талаас сонгоно.
 *
 * Backend: sukhBackv2 routes/barilgiinChatRoute.js
 *   GET  /barilgiinChat/minii
 *   GET  /barilgiinChat/:barilgiinId/messejuud?umnukh=&khemjee=
 *   POST /barilgiinChat/:barilgiinId/messej
 *   POST /barilgiinChat/:barilgiinId/messej/:messejId/zasakh   (зөвхөн өөрийн)
 * «Бүх байр» (байгууллагын бүх байрны нийтлэг) чатын түлхүүр нь
 * `buh_<baiguullagiinId>`. Оршин суугчид тоотоороо харагдана.
 * Бодит цаг: socket "barilgiinChat:join" { token, barilgiinId } → room
 * `chat:<barilgiinId>`; шинэ мессеж "barilgiinChat:messej", засвар "barilgiinChat:zasvar".
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { notification } from "antd";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Loader2,
  MessageSquare,
  Send,
  ArrowLeft,
  Users,
  Reply,
  Pencil,
  X,
  ImagePlus,
  Info,
  Play,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { useSocket } from "@/context/SocketContext";
import uilchilgee, { getApiUrl, getErrorMessage } from "@/lib/uilchilgee";

interface SuuliinMessej {
  text?: string;
  ilgeegchNer?: string;
  ilgeegchTurul?: string;
  ognoo?: string;
}

interface Chat {
  _id: string;
  baiguullagiinId: string;
  barilgiinId: string;
  turul?: "barilga" | "buh";
  ner: string;
  miniiNer?: string;
  suuliinMessej?: SuuliinMessej | null;
}

interface Khariu {
  messejId: string;
  ilgeegchNer?: string;
  text?: string;
}

interface Khavsralt {
  ner?: string;
  turul: "zurag" | "video";
  zam: string;
  /** Илгээж буй үеийн локал урьдчилсан харагдац (blob URL) */
  local?: string;
}

interface MediaMur {
  messejId: string;
  ilgeegchNer?: string;
  createdAt: string;
  turul: "zurag" | "video";
  zam: string;
}

interface Messej {
  _id: string;
  barilgiinId: string;
  ilgeegchId: string;
  ilgeegchTurul: "ajiltan" | "orshinSuugch";
  ilgeegchNer?: string;
  ilgeegchTailbar?: string;
  text: string;
  clientId?: string;
  khariu?: Khariu | null;
  khavsralt?: Khavsralt[];
  zassanEsekh?: boolean;
  createdAt: string;
  /** Илгээж буй (серверээс хариу ирээгүй) мөр */
  _pending?: boolean;
  _failed?: boolean;
}

const KHUUDAS = 30;
const MAX_KHAVSRALT = 10;
const ZURAG_MAX = 20 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;

/** Серверийн харьцангуй замыг (barilgiinChat/file/...) бүтэн URL болгоно */
const failUrl = (zam: string) => `${getApiUrl().replace(/\/?$/, "/")}${zam}`;

const urdchilsan = (m: { text?: string; khavsralt?: Khavsralt[] }) =>
  m.text ||
  (m.khavsralt?.some((k) => k.turul === "video")
    ? "🎥 Видео"
    : m.khavsralt?.length
      ? "📷 Зураг"
      : "");

const initialsOf = (ner?: string) =>
  String(ner || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");

const formatListTime = (d?: string) => {
  if (!d) return "";
  const m = moment(d);
  return m.isSame(moment(), "day") ? m.format("HH:mm") : m.format("MM/DD");
};

const formatDayLabel = (d: string) => {
  const m = moment(d);
  if (m.isSame(moment(), "day")) return "Өнөөдөр";
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Өчигдөр";
  return m.format("YYYY.MM.DD");
};

const shineClientId = () =>
  `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function BarilgiinChatPage() {
  const { t } = useTranslation();
  const { token, ajiltan } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const socket = useSocket();

  const [chatuud, setChatuud] = useState<Chat[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatAldaa, setChatAldaa] = useState<string | null>(null);
  const [songoson, setSongoson] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [messejuud, setMessejuud] = useState<Messej[]>([]);
  const [messejLoading, setMessejLoading] = useState(false);
  const [dakhiadBii, setDakhiadBii] = useState(false);
  const [umnukhLoading, setUmnukhLoading] = useState(false);
  const [input, setInput] = useState("");
  const [ilgeej, setIlgeej] = useState(false);
  const [khariulakh, setKhariulakh] = useState<Messej | null>(null);
  const [zasakh, setZasakh] = useState<Messej | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const failInputRef = useRef<HTMLInputElement>(null);
  /** Илгээхээр сонгосон файлууд (тайлбар бичээд хамт илгээнэ) */
  const [failuud, setFailuud] = useState<{ file: File; url: string; video: boolean }[]>([]);
  const [khajuu, setKhajuu] = useState(false); // «Чатын дэлгэрэнгүй» самбар
  const [nuurZurag, setNuurZurag] = useState<Khavsralt | null>(null); // бүтэн дэлгэцийн зураг

  const scrollRef = useRef<HTMLDivElement>(null);
  const dooshGuilgekh = useRef(true);
  const songosonRef = useRef<string | null>(null);
  songosonRef.current = songoson;

  const minii = String(ajiltan?._id || "");
  const songosonChat = useMemo(
    () => chatuud.find((c) => c.barilgiinId === songoson) || null,
    [chatuud, songoson],
  );

  /* ── Чатын жагсаалт ── */
  const chatuudTatya = useCallback(async () => {
    if (!token) return;
    setChatAldaa(null);
    try {
      const res = await uilchilgee(token).get("/barilgiinChat/minii");
      const list: Chat[] = res.data?.chatuud || [];
      setChatuud(list);
      setSongoson((prev) => {
        if (prev && list.some((c) => c.barilgiinId === prev)) return prev;
        const tukhain = list.find((c) => c.barilgiinId === selectedBuildingId);
        return tukhain?.barilgiinId || list[0]?.barilgiinId || null;
      });
    } catch (e) {
      setChatAldaa(getErrorMessage(e));
    } finally {
      setChatLoading(false);
    }
  }, [token, selectedBuildingId]);

  useEffect(() => {
    chatuudTatya();
  }, [chatuudTatya]);

  /* ── Мессежийн түүх ── */
  const messejTatya = useCallback(
    async (barilgiinId: string, umnukh?: string) => {
      if (!token) return;
      const res = await uilchilgee(token).get(
        `/barilgiinChat/${barilgiinId}/messejuud`,
        { params: { khemjee: KHUUDAS, ...(umnukh ? { umnukh } : {}) } },
      );
      return {
        list: (res.data?.messejuud || []) as Messej[],
        dakhiadBii: !!res.data?.dakhiadBii,
      };
    },
    [token],
  );

  useEffect(() => {
    if (!songoson) return;
    let tsutslagdsan = false;
    setMessejuud([]);
    setDakhiadBii(false);
    setKhariulakh(null);
    setZasakh(null);
    setFailuud((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url));
      return [];
    });
    setMessejLoading(true);
    dooshGuilgekh.current = true;
    messejTatya(songoson)
      .then((r) => {
        if (tsutslagdsan || !r) return;
        setMessejuud(r.list);
        setDakhiadBii(r.dakhiadBii);
      })
      .catch(() => {})
      .finally(() => !tsutslagdsan && setMessejLoading(false));
    return () => {
      tsutslagdsan = true;
    };
  }, [songoson, messejTatya]);

  const umnukhiigTatya = async () => {
    if (!songoson || umnukhLoading || !messejuud.length) return;
    const el = scrollRef.current;
    const umnukhUndur = el?.scrollHeight || 0;
    setUmnukhLoading(true);
    try {
      const r = await messejTatya(songoson, messejuud[0]._id);
      if (!r) return;
      dooshGuilgekh.current = false;
      setMessejuud((prev) => [...r.list, ...prev]);
      setDakhiadBii(r.dakhiadBii);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - umnukhUndur;
      });
    } catch {
      // дараа дахин оролдоно
    } finally {
      setUmnukhLoading(false);
    }
  };

  useEffect(() => {
    if (!dooshGuilgekh.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messejuud]);

  /* ── Бодит цаг: эрхтэй бүх барилгын room-д нэгдэнэ ── */
  const barilgiinIdnuud = useMemo(
    // Эрэмбэлсэн: шинэ мессежээр жагсаалт дахин эрэмбэлэгдэхэд room-оос гарч орохгүй
    () => chatuud.map((c) => c.barilgiinId).sort().join(","),
    [chatuud],
  );

  useEffect(() => {
    if (!socket || !token || !barilgiinIdnuud) return;
    const idnuud = barilgiinIdnuud.split(",");
    const negdye = () => {
      idnuud.forEach((barilgiinId) =>
        socket.emit("barilgiinChat:join", { token, barilgiinId }),
      );
    };
    const shineMessej = (m: Messej) => {
      if (!m?._id) return;
      setChatuud((prev) =>
        prev
          .map((c) =>
            c.barilgiinId === m.barilgiinId
              ? {
                  ...c,
                  suuliinMessej: {
                    text: urdchilsan(m),
                    ilgeegchNer: m.ilgeegchNer,
                    ilgeegchTurul: m.ilgeegchTurul,
                    ognoo: m.createdAt,
                  },
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.suuliinMessej?.ognoo || 0).getTime() -
              new Date(a.suuliinMessej?.ognoo || 0).getTime(),
          ),
      );
      if (m.barilgiinId !== songosonRef.current) return;
      const el = scrollRef.current;
      dooshGuilgekh.current =
        !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120 || m.ilgeegchId === minii;
      setMessejuud((prev) => {
        if (prev.some((x) => x._id === m._id)) return prev;
        const i = m.clientId ? prev.findIndex((x) => x.clientId === m.clientId) : -1;
        if (i >= 0) {
          const next = prev.slice();
          next[i] = m;
          return next;
        }
        return [...prev, m];
      });
    };

    const zasvar = (m: Messej) => {
      if (!m?._id || m.barilgiinId !== songosonRef.current) return;
      setMessejuud((prev) => prev.map((x) => (x._id === m._id ? m : x)));
    };

    if (socket.connected) negdye();
    socket.on("connect", negdye);
    socket.on("barilgiinChat:messej", shineMessej);
    socket.on("barilgiinChat:zasvar", zasvar);
    return () => {
      socket.off("connect", negdye);
      socket.off("barilgiinChat:messej", shineMessej);
      socket.off("barilgiinChat:zasvar", zasvar);
      idnuud.forEach((barilgiinId) => socket.emit("barilgiinChat:leave", { barilgiinId }));
    };
  }, [socket, token, barilgiinIdnuud, minii]);

  /* ── Илгээх ── */
  const textUndurSergeekh = () => {
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
  };

  const boliulakh = () => {
    if (zasakh) setInput("");
    setZasakh(null);
    setKhariulakh(null);
    textUndurSergeekh();
  };

  const zasvarKhadgalakh = async () => {
    const m = zasakh;
    const text = input.trim();
    if (!m || !songoson || !token || (!text && !m.khavsralt?.length)) return;
    if (text === m.text) return boliulakh();
    setIlgeej(true);
    try {
      const res = await uilchilgee(token).post(
        `/barilgiinChat/${songoson}/messej/${m._id}/zasakh`,
        { text },
      );
      const shine: Messej | undefined = res.data?.messej;
      if (shine?._id) setMessejuud((prev) => prev.map((x) => (x._id === shine._id ? shine : x)));
      setZasakh(null);
      setInput("");
      textUndurSergeekh();
    } catch (e) {
      notification.error({ message: getErrorMessage(e) || t("Засвар хадгалагдсангүй") });
    } finally {
      setIlgeej(false);
    }
  };

  /** Дахин илгээхэд хэрэглэх анхны файлууд (clientId → File[]) */
  const dakhinFailuud = useRef(new Map<string, File[]>());

  const failNemekh = (list: FileList | null) => {
    if (!list?.length) return;
    const shine: { file: File; url: string; video: boolean }[] = [];
    for (const file of Array.from(list)) {
      const video = file.type.startsWith("video/");
      if (!video && !file.type.startsWith("image/")) {
        notification.warning({ message: t("Зөвхөн зураг эсвэл видео илгээх боломжтой") });
        continue;
      }
      if (file.size > (video ? VIDEO_MAX : ZURAG_MAX)) {
        notification.warning({
          message: video ? t("Видео хэт том байна (100MB хүртэл)") : t("Зураг хэт том байна (20MB хүртэл)"),
        });
        continue;
      }
      shine.push({ file, url: URL.createObjectURL(file), video });
    }
    setFailuud((prev) => {
      const niit = [...prev, ...shine];
      if (niit.length > MAX_KHAVSRALT) {
        notification.warning({ message: t("Нэг удаад 10 хүртэл файл илгээнэ") });
        niit.slice(MAX_KHAVSRALT).forEach((f) => URL.revokeObjectURL(f.url));
      }
      return niit.slice(0, MAX_KHAVSRALT);
    });
    textareaRef.current?.focus();
  };

  const failUpload = async (barilgiinId: string, file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await uilchilgee(token!).post(`/barilgiinChat/${barilgiinId}/file`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 5 * 60 * 1000,
    });
    const ner = res.data?.khavsralt?.ner;
    if (!ner) throw new Error(t("Файл илгээгдсэнгүй"));
    return ner;
  };

  const ilgeeye = async (dakhin?: Messej) => {
    if (!dakhin && zasakh) return zasvarKhadgalakh();
    const text = (dakhin ? dakhin.text : input).trim();
    const clientId = dakhin?.clientId || shineClientId();
    const files: File[] = dakhin
      ? dakhinFailuud.current.get(clientId) || []
      : failuud.map((f) => f.file);
    if (!songoson || !token || (!text && !files.length)) return;
    const khariu: Khariu | null = dakhin
      ? dakhin.khariu || null
      : khariulakh
        ? { messejId: khariulakh._id, ilgeegchNer: khariulakh.ilgeegchNer, text: urdchilsan(khariulakh) }
        : null;
    if (files.length) dakhinFailuud.current.set(clientId, files);
    const lokalKhavsralt: Khavsralt[] = dakhin
      ? dakhin.khavsralt || []
      : failuud.map((f) => ({ turul: f.video ? "video" : "zurag", zam: "", local: f.url }));
    const tur: Messej = {
      _id: `tmp-${clientId}`,
      barilgiinId: songoson,
      ilgeegchId: minii,
      ilgeegchTurul: "ajiltan",
      ilgeegchNer: songosonChat?.miniiNer || ajiltan?.ner || "",
      text,
      clientId,
      khariu,
      khavsralt: lokalKhavsralt,
      createdAt: new Date().toISOString(),
      _pending: true,
    };
    dooshGuilgekh.current = true;
    setMessejuud((prev) =>
      dakhin ? prev.map((x) => (x.clientId === clientId ? tur : x)) : [...prev, tur],
    );
    if (!dakhin) {
      setInput("");
      setKhariulakh(null);
      setFailuud([]); // blob URL-ууд илгээж буй мөрөнд үргэлжлэн хэрэглэгдэнэ
      textUndurSergeekh();
    }
    const chatId = songoson;
    setIlgeej(true);
    try {
      const nernuud: string[] = [];
      for (const f of files) nernuud.push(await failUpload(chatId, f));
      const res = await uilchilgee(token).post(`/barilgiinChat/${chatId}/messej`, {
        text,
        clientId,
        ...(khariu ? { khariuId: khariu.messejId } : {}),
        ...(nernuud.length ? { khavsralt: nernuud.map((ner) => ({ ner })) } : {}),
      });
      dakhinFailuud.current.delete(clientId);
      const m: Messej | undefined = res.data?.messej;
      if (m?._id) {
        setMessejuud((prev) => {
          const busad = prev.filter((x) => x._id !== m._id);
          const i = busad.findIndex((x) => x.clientId === clientId);
          if (i < 0) return [...busad, m];
          busad[i] = m;
          return busad;
        });
      }
    } catch (e) {
      if (files.length) notification.error({ message: getErrorMessage(e) || t("Файл илгээгдсэнгүй") });
      setMessejuud((prev) =>
        prev.map((x) =>
          x.clientId === clientId ? { ...x, _pending: false, _failed: true } : x,
        ),
      );
    } finally {
      setIlgeej(false);
    }
  };

  /* ── Чатын дэлгэрэнгүй: илгээгдсэн зураг, видео ── */
  const [media, setMedia] = useState<MediaMur[]>([]);
  const [mediaTurul, setMediaTurul] = useState<"zurag" | "video">("zurag");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUmnukh, setMediaUmnukh] = useState<string | null>(null);
  const [mediaDakhiad, setMediaDakhiad] = useState(false);

  const mediaTatya = useCallback(
    async (barilgiinId: string, umnukh?: string | null) => {
      if (!token) return;
      setMediaLoading(true);
      try {
        const res = await uilchilgee(token).get(`/barilgiinChat/${barilgiinId}/media`, {
          params: { khemjee: 30, ...(umnukh ? { umnukh } : {}) },
        });
        const list: MediaMur[] = res.data?.media || [];
        setMedia((prev) => (umnukh ? [...prev, ...list] : list));
        setMediaUmnukh(res.data?.umnukh || null);
        setMediaDakhiad(!!res.data?.dakhiadBii);
      } catch (e) {
        notification.error({ message: getErrorMessage(e) });
      } finally {
        setMediaLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (khajuu && songoson) mediaTatya(songoson);
    else setMedia([]);
  }, [khajuu, songoson, mediaTatya]);

  /* ── UI ── */
  return (
    <div className="flex w-full flex-col gap-3 pb-14 text-[color:var(--panel-text)]">
      <div className="flex min-h-0 gap-3 md:h-[calc(100vh-12rem)] md:min-h-[520px]">
        {/* Барилгын жагсаалт */}
        <div
          className={`w-full md:w-[300px] lg:w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] shadow-[var(--ctl-shadow)] ${
            showDetail ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--ctl-border)] px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
              {t("Барилгын чат")}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-[color:var(--muted-text)]">
              {chatuud.length}
            </span>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto md:min-h-0">
            {chatLoading ? (
              <div className="divide-y divide-[color:var(--ctl-border)]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3.5">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[color:var(--surface-hover)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[color:var(--surface-hover)]" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-[color:var(--surface-hover)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chatAldaa ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="text-[13px] text-danger">{chatAldaa}</div>
                <button
                  type="button"
                  onClick={() => {
                    setChatLoading(true);
                    chatuudTatya();
                  }}
                  className="btn-minimal h-9 !px-3 text-[13px]"
                >
                  {t("Дахин оролдох")}
                </button>
              </div>
            ) : chatuud.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-hover)]">
                  <Building2 className="h-5 w-5 text-[color:var(--muted-text)]" />
                </div>
                <div className="text-[13px] text-[color:var(--muted-text)]">
                  {t("Танд хандах эрхтэй барилга алга")}
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--ctl-border)]">
                {/* «Бүх байр» эхэнд, дараа нь байрнууд */}
                {[...chatuud.filter((c) => c.turul === "buh"), ...chatuud.filter((c) => c.turul !== "buh")].map((c, idx, arr) => {
                  const idevkhtei = c.barilgiinId === songoson;
                  const buh = c.turul === "buh";
                  const gartsag =
                    !buh && (idx === 0 || arr[idx - 1].turul === "buh");
                  return (
                    <li key={c.barilgiinId}>
                      {gartsag && (
                        <div className="bg-[color:var(--surface-hover)]/50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--muted-text)]">
                          {t("Байрнууд")}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSongoson(c.barilgiinId);
                          setShowDetail(true);
                        }}
                        className={`relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                          idevkhtei ? "bg-theme/10" : "hover:bg-[color:var(--surface-hover)]"
                        }`}
                      >
                        {idevkhtei && (
                          <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-theme" />
                        )}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-theme/10 text-brand">
                          {buh ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                              {c.ner || t("Барилга")}
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--muted-text)]">
                              {formatListTime(c.suuliinMessej?.ognoo)}
                            </span>
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-[color:var(--muted-text)]">
                            {c.suuliinMessej?.text
                              ? `${c.suuliinMessej.ilgeegchNer ? `${c.suuliinMessej.ilgeegchNer}: ` : ""}${c.suuliinMessej.text}`
                              : t("Мессеж алга")}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Чат */}
        <div
          className={`min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--surface-bg)] ${
            showDetail
              ? "fixed inset-0 z-50 flex md:static md:z-auto md:rounded-2xl md:border md:border-[color:var(--ctl-border)] md:shadow-[var(--ctl-shadow)]"
              : "hidden md:flex md:rounded-2xl md:border md:border-[color:var(--ctl-border)] md:shadow-[var(--ctl-shadow)]"
          }`}
        >
          {songosonChat ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--ctl-border)] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowDetail(false)}
                  className="-ml-1 flex shrink-0 rounded-[10px] p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] md:hidden"
                  aria-label={t("Буцах")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{songosonChat.ner}</div>
                  <div className="text-[11px] text-[color:var(--muted-text)]">
                    {songosonChat.turul === "buh"
                      ? t("Байгууллагын бүх байрны оршин суугчид болон ажилтнууд")
                      : t("Барилгын оршин суугчид болон ажилтнууд")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setKhajuu((v) => !v)}
                  className={`flex shrink-0 rounded-[10px] p-1.5 transition-colors cursor-pointer ${
                    khajuu
                      ? "bg-theme/10 text-brand"
                      : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                  }`}
                  title={t("Чатын дэлгэрэнгүй")}
                  aria-label={t("Чатын дэлгэрэнгүй")}
                >
                  <Info className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div
                ref={scrollRef}
                className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[color:var(--surface-hover)]/40 px-4 py-4"
              >
                {messejLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-[color:var(--muted-text)]">
                    <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    <span className="text-xs">{t("Уншиж байна...")}</span>
                  </div>
                ) : messejuud.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[color:var(--muted-text)]">
                    <MessageSquare className="h-7 w-7 opacity-40" />
                    <span className="text-xs">{t("Одоогоор мессеж алга. Эхний мессежээ бичээрэй.")}</span>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2.5">
                    {dakhiadBii && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={umnukhiigTatya}
                          disabled={umnukhLoading}
                          className="btn-minimal h-8 !px-3 text-xs"
                        >
                          {umnukhLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            t("Өмнөх мессежүүд")
                          )}
                        </button>
                      </div>
                    )}
                    {messejuud.map((m, idx) => {
                      const minii_ = m.ilgeegchId === minii;
                      const prev = idx > 0 ? messejuud[idx - 1] : null;
                      const showDay =
                        !prev || !moment(prev.createdAt).isSame(moment(m.createdAt), "day");
                      const showNer =
                        !minii_ && (!prev || prev.ilgeegchId !== m.ilgeegchId || showDay);
                      return (
                        <React.Fragment key={m._id}>
                          {showDay && (
                            <div className="my-1 flex justify-center">
                              <span className="rounded-full bg-[color:var(--surface-bg)] px-2.5 py-0.5 text-[11px] text-[color:var(--muted-text)] shadow-[var(--ctl-shadow)]">
                                {formatDayLabel(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`group/msg flex items-end gap-2 ${minii_ ? "justify-end" : "justify-start"}`}>
                            {!minii_ && (
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                                  showNer ? "" : "invisible"
                                } ${
                                  m.ilgeegchTurul === "ajiltan"
                                    ? "bg-theme/15 text-brand"
                                    : "bg-[color:var(--surface-bg)] border border-[color:var(--ctl-border)] text-[color:var(--muted-text)]"
                                }`}
                              >
                                {initialsOf(m.ilgeegchNer) || "?"}
                              </div>
                            )}
                            {/* Хариулах / засах — hover дээр гарна */}
                            {minii_ && !m._pending && !m._failed && (
                              <div className="flex shrink-0 self-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
                                <button type="button" onClick={() => { setZasakh(null); setKhariulakh(m); textareaRef.current?.focus(); }} className="rounded-md p-1 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] cursor-pointer" title={t("Хариулах")}>
                                  <Reply className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => { setKhariulakh(null); setZasakh(m); setInput(m.text); textareaRef.current?.focus(); }} className="rounded-md p-1 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] cursor-pointer" title={t("Засах")}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] sm:max-w-[70%] ${
                                minii_
                                  ? "rounded-br-md bg-theme text-white"
                                  : "rounded-bl-md border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] text-[color:var(--panel-text)]"
                              } ${m._pending ? "opacity-70" : ""}`}
                            >
                              {showNer && (
                                <div className="mb-0.5 text-[11px] text-brand">
                                  {m.ilgeegchNer || t("Хэрэглэгч")}
                                  {m.ilgeegchTailbar && (
                                    <span className="ml-1.5 text-[color:var(--muted-text)]">
                                      · {m.ilgeegchTailbar}
                                    </span>
                                  )}
                                </div>
                              )}
                              {m.khariu?.messejId && (
                                <div
                                  className={`mb-1 rounded-md border-l-[3px] px-2 py-1 text-[12px] ${
                                    minii_
                                      ? "border-white/80 bg-white/15 text-white/90"
                                      : "border-theme bg-[color:var(--surface-hover)] text-[color:var(--muted-text)]"
                                  }`}
                                >
                                  <div className={`font-medium ${minii_ ? "text-white" : "text-brand"}`}>
                                    {m.khariu.ilgeegchNer}
                                  </div>
                                  <div className="line-clamp-2 break-words">{m.khariu.text}</div>
                                </div>
                              )}
                              {!!m.khavsralt?.length && (
                                <div
                                  className={`mb-1 grid gap-1 ${
                                    m.khavsralt.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                  } ${m.text ? "" : "-mx-1"}`}
                                >
                                  {m.khavsralt.map((k, ki) => {
                                    const src = k.local || failUrl(k.zam);
                                    const negIn = m.khavsralt!.length === 1;
                                    return k.turul === "video" ? (
                                      <video
                                        key={ki}
                                        src={src}
                                        controls={!m._pending}
                                        preload="metadata"
                                        playsInline
                                        className={`rounded-lg bg-black ${negIn ? "max-h-[320px] w-[260px] max-w-full" : "h-[130px] w-[130px] object-cover"}`}
                                      />
                                    ) : (
                                       
                                      <img
                                        key={ki}
                                        src={src}
                                        alt=""
                                        loading="lazy"
                                        onClick={() => !m._pending && setNuurZurag(k)}
                                        className={`rounded-lg object-cover ${m._pending ? "" : "cursor-zoom-in"} ${
                                          negIn ? "max-h-[320px] w-auto max-w-[260px]" : "h-[130px] w-[130px]"
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              )}
                              {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                              <div
                                className={`mt-1 text-right text-[10px] tabular-nums ${
                                  minii_ ? "text-white/70" : "text-[color:var(--muted-text)]"
                                }`}
                              >
                                {m._failed ? (
                                  <button
                                    type="button"
                                    onClick={() => ilgeeye(m)}
                                    className="underline cursor-pointer"
                                  >
                                    {t("Илгээгдсэнгүй · дахин оролдох")}
                                  </button>
                                ) : m._pending ? (
                                  t("Илгээж байна...")
                                ) : (
                                  `${m.zassanEsekh ? `${t("засварласан")} · ` : ""}${moment(m.createdAt).format("HH:mm")}`
                                )}
                              </div>
                            </div>
                            {!minii_ && !m._pending && (
                              <button
                                type="button"
                                onClick={() => { setZasakh(null); setKhariulakh(m); textareaRef.current?.focus(); }}
                                className="shrink-0 self-center rounded-md p-1 text-[color:var(--muted-text)] opacity-0 transition-opacity hover:bg-[color:var(--surface-hover)] group-hover/msg:opacity-100 cursor-pointer"
                                title={t("Хариулах")}
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {(zasakh || khariulakh) && (
                  <div className="mb-2 flex items-center gap-2 rounded-[10px] border-l-[3px] border-theme bg-[color:var(--surface-hover)] py-1.5 pl-3 pr-1">
                    {zasakh ? (
                      <Pencil className="h-3.5 w-3.5 shrink-0 text-brand" />
                    ) : (
                      <Reply className="h-3.5 w-3.5 shrink-0 text-brand" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-brand">
                        {zasakh ? t("Мессеж засах") : khariulakh?.ilgeegchNer || t("Хэрэглэгч")}
                      </div>
                      <div className="truncate text-[12px] text-[color:var(--muted-text)]">
                        {urdchilsan(zasakh || khariulakh || {})}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={boliulakh}
                      className="rounded-md p-1 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-bg)] cursor-pointer"
                      aria-label={t("Болих")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {failuud.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {failuud.map((f, i) => (
                      <div
                        key={f.url}
                        className="relative h-16 w-16 overflow-hidden rounded-lg border border-[color:var(--ctl-border)] bg-black/5"
                      >
                        {f.video ? (
                          <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                            <Film className="h-5 w-5" />
                          </div>
                        ) : (
                           
                          <img src={f.url} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFailuud((prev) => {
                              URL.revokeObjectURL(prev[i].url);
                              return prev.filter((_, j) => j !== i);
                            })
                          }
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white cursor-pointer"
                          aria-label={t("Хасах")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={failInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    failNemekh(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex items-end gap-2">
                  {!zasakh && (
                    <button
                      type="button"
                      onClick={() => failInputRef.current?.click()}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--ctl-border)] text-[color:var(--muted-text)] transition hover:bg-[color:var(--surface-hover)] hover:text-brand cursor-pointer"
                      title={t("Зураг, видео хавсаргах")}
                    >
                      <ImagePlus className="h-[18px] w-[18px]" />
                    </button>
                  )}
                  <div className="flex min-h-9 flex-1 items-center rounded-[10px] border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-3 shadow-[var(--ctl-shadow)] transition focus-within:border-theme focus-within:shadow-[var(--ctl-focus-ring)]">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      maxLength={2000}
                      onPaste={(e) => {
                        // Хуулсан зургийг шууд хавсаргана
                        if (!zasakh && e.clipboardData.files.length) {
                          e.preventDefault();
                          failNemekh(e.clipboardData.files);
                        }
                      }}
                      onChange={(e) => {
                        setInput(e.target.value);
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          ilgeeye();
                        } else if (e.key === "Escape" && (zasakh || khariulakh)) {
                          boliulakh();
                        }
                      }}
                      placeholder={t("Мессеж бичих...")}
                      className="block max-h-[120px] w-full resize-none bg-transparent py-2 text-[13px] leading-5 text-[color:var(--panel-text)] outline-none placeholder:text-[color:var(--muted-text)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => ilgeeye()}
                    disabled={ilgeej || (!input.trim() && !failuud.length && !zasakh?.khavsralt?.length)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-theme !text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer sm:w-auto sm:gap-1.5 sm:px-4 sm:text-[13px] sm:font-medium"
                    title={t("Илгээх")}
                  >
                    {ilgeej ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="hidden sm:inline">{t("Илгээх")}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-[color:var(--muted-text)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--surface-hover)]">
                <MessageSquare className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-[13px]">{t("Чатлах барилгаа сонгоно уу")}</p>
            </div>
          )}
        </div>

        {/* Чатын дэлгэрэнгүй — илгээгдсэн зураг, видео */}
        {khajuu && songosonChat && (
          <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[color:var(--surface-bg)] md:static md:z-auto md:w-[300px] md:shrink-0 md:rounded-2xl md:border md:border-[color:var(--ctl-border)] md:shadow-[var(--ctl-shadow)] lg:w-[340px]">
            <div className="flex shrink-0 items-center gap-2 border-b border-[color:var(--ctl-border)] px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {t("Чатын дэлгэрэнгүй")}
              </span>
              <button
                type="button"
                onClick={() => setKhajuu(false)}
                className="rounded-[10px] p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] cursor-pointer"
                aria-label={t("Хаах")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-3 px-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-theme/10 text-brand">
                {songosonChat.turul === "buh" ? <Users className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium">{songosonChat.ner}</div>
                <div className="text-[11px] text-[color:var(--muted-text)]">
                  {songosonChat.turul === "buh" ? t("Бүх байрны нийтлэг чат") : t("Байрны чат")}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1 border-b border-[color:var(--ctl-border)] px-3">
              {(["zurag", "video"] as const).map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setMediaTurul(tr)}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] cursor-pointer ${
                    mediaTurul === tr
                      ? "border-theme font-medium text-brand"
                      : "border-transparent text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                  }`}
                >
                  {tr === "zurag" ? <ImageIcon className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                  {tr === "zurag" ? t("Зураг") : t("Видео")}
                </button>
              ))}
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
              {(() => {
                const list = media.filter((x) => x.turul === mediaTurul);
                if (!list.length && mediaLoading)
                  return (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    </div>
                  );
                if (!list.length)
                  return (
                    <div className="py-10 text-center text-[13px] text-[color:var(--muted-text)]">
                      {mediaTurul === "zurag" ? t("Илгээсэн зураг алга") : t("Илгээсэн видео алга")}
                    </div>
                  );
                return (
                  <div className="grid grid-cols-3 gap-1">
                    {list.map((x, i) =>
                      x.turul === "video" ? (
                        <a
                          key={`${x.messejId}-${i}`}
                          href={failUrl(x.zam)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-black"
                          title={`${x.ilgeegchNer || ""} · ${moment(x.createdAt).format("YYYY.MM.DD HH:mm")}`}
                        >
                          <video src={failUrl(x.zam)} preload="metadata" muted className="h-full w-full object-cover opacity-80" />
                          <Play className="absolute h-6 w-6 text-white drop-shadow" />
                        </a>
                      ) : (
                        <button
                          key={`${x.messejId}-${i}`}
                          type="button"
                          onClick={() => setNuurZurag({ turul: "zurag", zam: x.zam })}
                          className="aspect-square overflow-hidden rounded-md bg-[color:var(--surface-hover)] cursor-zoom-in"
                          title={`${x.ilgeegchNer || ""} · ${moment(x.createdAt).format("YYYY.MM.DD HH:mm")}`}
                        >
                          { }
                          <img src={failUrl(x.zam)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </button>
                      ),
                    )}
                  </div>
                );
              })()}
              {mediaDakhiad && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={mediaLoading}
                    onClick={() => songoson && mediaTatya(songoson, mediaUmnukh)}
                    className="btn-minimal h-8 !px-3 text-xs"
                  >
                    {mediaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("Цааш үзэх")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Бүтэн дэлгэцийн зураг */}
      {nuurZurag && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setNuurZurag(null)}
        >
          <button
            type="button"
            onClick={() => setNuurZurag(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
            aria-label={t("Хаах")}
          >
            <X className="h-5 w-5" />
          </button>
          { }
          <img
            src={nuurZurag.local || failUrl(nuurZurag.zam)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
