"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Камерын урсгалыг VPS дээрх MediaMTX-ээс WHEP-ээр авч тоглуулна.
 *
 * ── Яагаад P2P-г орлуулав ───────────────────────────────────────────────
 * Хуучин плеер нь барилгын компьютер РҮҮ шууд холбогддог байв. Хоёр тал
 * NAT-ын ард байхад ICE бүтэхгүй (TURN тохируулаагүй), үзэгч бүр камер руу
 * тусдаа RTSP сесс нээдэг, доголдол бүрт 3–15 секунд хүлээж бүхэлд нь
 * дахин барьдаг байсан — «Холбогдож байна» давтагдахын үндсэн шалтгаан.
 *
 * Одоо нөгөө тал нь НИЙТИЙН тогтмол хаягтай сервер. Тиймээс:
 *
 *   • ICE-ийн бүх хүлээлт УСТСАН — relay candidate хүлээх, 1.5s таслалт,
 *     TURN тохиргоо аль нь ч хэрэггүй. Хөтөч зөвхөн host candidate-аар
 *     серверийн нийтийн хаяг руу шалгалт явуулахад сервер эх хаягийг нь
 *     peer-reflexive болгон таньдаг.
 *   • Камер дээрх ачаалал үзэгчийн тооноос хамаарахаа болино.
 *
 * ── Хаягийг хэрхэн бодох вэ ─────────────────────────────────────────────
 * Урсгалын зам нь `{barilgiinId}/{камерын-ip-зураастай}`. Rust worker-ийн
 * `Config::stream_path` ЯГ ижил дүрмээр нийтэлдэг тул шинэ API, шинэ
 * өгөгдлийн талбар хэрэггүй — IP нь өгөгдсөн `rtspUrl` дотор аль хэдийн бий.
 */

interface WhepVideoPlayerProps {
  rtspUrl: string;
  barilgiinId: string;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Энэ камер MediaMTX дээр БАЙХГҮЙ үед дуудагдана.
   *
   * Барилгууд нэг дор биш, ээлжлэн шилждэг тул шилжээгүй барилгын камерыг
   * хуучин P2P замаар үзэх боломжтой байх ёстой. Дуудагч тал үүнийг барьж
   * аваад хуучин плеер рүү сэлгэнэ.
   */
  onUnavailable?: () => void;
}

type Status = "connecting" | "connected" | "failed" | "retrying";

/** Жишээ: `https://amarhome.mn/whep` */
const WHEP_BASE = (process.env.NEXT_PUBLIC_WHEP_BASE || "").replace(/\/+$/, "");

/**
 * ICE цуглуулгын дээд хүлээлт.
 *
 * Хуучин P2P урсгалд relay candidate хүлээх ёстой байсан тул 1.5s байв.
 * Сервер нийтийн болсон учир host candidate хангалттай — энэ нь ердөө
 * хамгаалалтын тааз, ихэвчлэн хэдхэн миллисекундэд дуусна.
 */
const ICE_TIMEOUT_MS = 800;

/** «disconnected» нь ихэвчлэн өөрөө эдгэрдэг — шууд нурааж барихгүй. */
const DISCONNECT_GRACE_MS = 4000;

/** Дахин холбох хүлээлтийн дээд хязгаар (холбогдох нь хурдан болсон). */
const MAX_BACKOFF_MS = 8000;

/** `rtsp://user:pass@192.168.1.110:554/...` → `192.168.1.110` */
export function rtspIpAvya(rtspUrl: string): string {
  const m = /^rtsps?:\/\/(?:[^@/]*@)?([^:/?#]+)/i.exec(String(rtspUrl || "").trim());
  return m ? m[1] : "";
}

/** Rust worker-ийн `Config::stream_path`-тай ижил дүрэм. */
export function urgasniiZam(barilgiinId: string, rtspUrl: string): string {
  const ip = rtspIpAvya(rtspUrl);
  if (!barilgiinId || !ip) return "";
  return `${barilgiinId}/${ip.replace(/\./g, "-")}`;
}

export default function WhepVideoPlayer({
  rtspUrl,
  barilgiinId,
  className,
  style,
  onUnavailable,
}: WhepVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  /** WHEP сессийн хаяг — салахдаа DELETE явуулна. */
  const resourceRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  /** Хуучирсан оролдлогын хариу ирвэл таньж хаяхад. */
  const attemptRef = useRef(0);
  /** Дараалан амжилтгүй болсон тоо — нөөц зам руу шилжих шийдэлд. */
  const aldaaRef = useRef(0);
  /** Дуудагчид нэгээс олон удаа мэдэгдэхгүй. */
  const medegdsenRef = useRef(false);

  const [status, setStatus] = useState<Status>("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const zam = urgasniiZam(barilgiinId, rtspUrl);

  const clearTimers = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    attemptRef.current += 1;

    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      // Хаахаас ӨМНӨ дэгээг салгана — эс бөгөөс `closed` нь дахин
      // холбогдох оролдлого өдөөнө.
      pc.onconnectionstatechange = null;
      pc.ontrack = null;
      try {
        pc.close();
      } catch {
        /* аль хэдийн хаагдсан */
      }
    }

    const res = resourceRef.current;
    resourceRef.current = null;
    if (res) {
      // Сесс цэвэрлэх нь "хийвэл сайн" — амжилтгүй болсон ч хэрэглэгчид
      // нөлөөлөхгүй, сервер өөрөө хугацаагаар цэвэрлэнэ.
      fetch(res, { method: "DELETE", keepalive: true }).catch(() => {});
    }

    if (videoRef.current) videoRef.current.srcObject = null;
  }, [clearTimers]);

  const connectRef = useRef<() => void>(() => {});

  /**
   * Энэ камерыг WHEP-ээр үзэх боломжгүй гэдгийг дуудагчид НЭГ УДАА хэлнэ.
   *
   * 404 бол эцсийн хариу: тухайн зам MediaMTX дээр огт байхгүй, өөрөөр
   * хэлбэл тэр барилгын компьютер хараахан шилжээгүй байна — дахин
   * оролдох нь утгагүй. Бусад алдааг (сүлжээ, 502) хоёр удаа оролдсоны
   * дараа л эцэслэнэ, учир нь тэдгээр нь түр зуурын байж болно.
   */
  const bolomjgui = useCallback(() => {
    if (medegdsenRef.current || !onUnavailable) return false;
    medegdsenRef.current = true;
    clearTimers();
    onUnavailable();
    return true;
  }, [onUnavailable, clearTimers]);

  const scheduleRetry = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimers();
    retryCountRef.current += 1;
    const delay = Math.min(1000 * 2 ** (retryCountRef.current - 1), MAX_BACKOFF_MS);
    setStatus("retrying");
    retryTimerRef.current = setTimeout(() => connectRef.current(), delay);
  }, [clearTimers]);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;

    if (!WHEP_BASE) {
      setErrorMsg("NEXT_PUBLIC_WHEP_BASE тохируулаагүй байна");
      setStatus("failed");
      return;
    }
    if (!zam) {
      setErrorMsg("Камерын хаягаас IP олдсонгүй");
      setStatus("failed");
      return;
    }

    stop();
    const attempt = attemptRef.current;
    setStatus(retryCountRef.current > 0 ? "retrying" : "connecting");
    setErrorMsg("");

    try {
      // Сервер нийтийн тул STUN/TURN шаардлагагүй.
      const pc = new RTCPeerConnection({ iceServers: [] });
      pcRef.current = pc;

      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (!mountedRef.current || pcRef.current !== pc) return;
        switch (pc.connectionState) {
          case "connected":
            if (graceTimerRef.current) {
              clearTimeout(graceTimerRef.current);
              graceTimerRef.current = null;
            }
            retryCountRef.current = 0;
            aldaaRef.current = 0;
            setStatus("connected");
            break;
          case "disconnected":
            // Түр зуурын саатал — өөрөө эдгэрэх боломж өгнө.
            if (!graceTimerRef.current) {
              graceTimerRef.current = setTimeout(() => {
                graceTimerRef.current = null;
                if (pcRef.current === pc && pc.connectionState !== "connected") {
                  scheduleRetry();
                }
              }, DISCONNECT_GRACE_MS);
            }
            break;
          case "failed":
          case "closed":
            scheduleRetry();
            break;
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // WHEP нь нэг удаагийн offer/answer. Host candidate агшин зуур
      // бэлэн болдог тул энэ хүлээлт бараг мэдэгдэхгүй.
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        const done = () => {
          pc.removeEventListener("icegatheringstatechange", onState);
          clearTimeout(timer);
          resolve();
        };
        const onState = () => {
          if (pc.iceGatheringState === "complete") done();
        };
        pc.addEventListener("icegatheringstatechange", onState);
        const timer = setTimeout(done, ICE_TIMEOUT_MS);
      });

      const whepUrl = `${WHEP_BASE}/${zam}/whep`;
      const res = await fetch(whepUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: pc.localDescription!.sdp,
      });

      if (attempt !== attemptRef.current || !mountedRef.current) return;

      if (!res.ok) {
        // 404 = тухайн зам сервер дээр байхгүй. Барилга шилжээгүй байна.
        if (res.status === 404 && bolomjgui()) return;
        throw new Error(
          res.status === 404
            ? "Урсгал олдсонгүй — камер нийтлэгдээгүй байна"
            : `WHEP ${res.status}`,
        );
      }

      // Сессийн хаяг. Харьцангуй бол бүтэн хаяг болгоно.
      const loc = res.headers.get("location");
      if (loc) resourceRef.current = new URL(loc, whepUrl).toString();

      const answer = await res.text();
      if (attempt !== attemptRef.current || !mountedRef.current) return;
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (err: any) {
      if (attempt !== attemptRef.current || !mountedRef.current) return;
      aldaaRef.current += 1;
      // Сервер огт хүрэхгүй байвал хуучин зам ажиллаж магадгүй — хоёр
      // оролдсоны дараа тэр рүү шилжинэ.
      if (aldaaRef.current >= 2 && bolomjgui()) return;
      setErrorMsg(err?.message || "Холболт амжилтгүй");
      scheduleRetry();
    }
  }, [zam, stop, scheduleRetry, bolomjgui]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Харагдахгүй байгаа плеер урсгал татах шаардлагагүй — нэг хуудсанд
  // хэд хэдэн камер байхад энэ нь мэдэгдэхүйц ялгаа гаргана.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (isVisible) {
      retryCountRef.current = 0;
      connect();
    } else {
      stop();
      setStatus("connecting");
    }
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [zam, isVisible, connect, stop]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black ${className ?? ""}`}
      style={style}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
        style={{
          // `display:none` нь элементийг урсгалаас гаргадаг тул буцаж
          // харагдахад хөтөч autoPlay-г чимээгүй татгалздаг.
          opacity: status === "connected" ? 1 : 0,
          visibility: status === "connected" ? "visible" : "hidden",
          position: status === "connected" ? "relative" : "absolute",
        }}
      />

      {status !== "connected" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
          {(status === "connecting" || status === "retrying") && (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              <span className="text-[11px] font-mono">
                {status === "retrying"
                  ? `Дахин холбогдож байна... (${retryCountRef.current})`
                  : "Холбогдож байна..."}
              </span>
            </>
          )}
          {status === "failed" && (
            <>
              <svg
                className="w-8 h-8 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span className="text-[11px] font-mono text-center px-2 text-danger line-clamp-2">
                {errorMsg || "Холболт амжилтгүй"}
              </span>
              <button
                onClick={() => {
                  retryCountRef.current = 0;
                  connect();
                }}
                className="mt-1 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] transition-colors"
              >
                Дахин оролдох
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
