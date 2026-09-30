"use client";
import { useEffect, useRef, useState } from "react";
import {
  bichiglekhye,
  kheregtseeTemdegley,
  nekhye,
  shineeerOroldoyo,
  urgasniiZam,
  type UrgatsToyim,
} from "@/lib/urgatsSan";

/**
 * Камерын урсгалыг VPS дээрх MediaMTX-ээс WHEP-ээр авч тоглуулна.
 *
 * ── Яагаад P2P-г орлуулав ───────────────────────────────────────────────
 * Хуучин плеер нь барилгын компьютер РҮҮ шууд холбогддог байв. Хоёр тал
 * NAT-ын ард байхад ICE бүтэхгүй (TURN тохируулаагүй), үзэгч бүр камер руу
 * тусдаа RTSP сесс нээдэг, доголдол бүрт 3–15 секунд хүлээж бүхэлд нь
 * дахин барьдаг байсан — «Холбогдож байна» давтагдахын үндсэн шалтгаан.
 *
 * Одоо нөгөө тал нь НИЙТИЙН тогтмол хаягтай сервер: ICE-ийн бүх хүлээлт
 * устаж, камер дээрх ачаалал үзэгчийн тооноос хамаарахаа болив.
 *
 * ── Холболт нь ЭНД БАЙХГҮЙ ──────────────────────────────────────────────
 * `RTCPeerConnection` нь `@/lib/urgatsSan` дотор, React-ийн ажлын циклээс
 * гадна байна. Энэ компонент зөвхөн `MediaStream`-ийг залгаж харуулна.
 * Иймд:
 *
 *   • Гүйлгэж харагдахаа болиход урсгал ТАСРАХГҮЙ — буцаж ирэхэд зураг
 *     шууд байна, «Холбогдож байна» гэж дахин хүлээхгүй.
 *   • Хуудас солиход холболт хэвээр — камер рүү буцахад хүлээлт үгүй.
 *   • Нэвтрэхэд `beltgeye` нь урьдчилан асаасан байвал энэ компонент
 *     mount болохдоо бэлэн урсгалыг л авна.
 *
 * ── Хаягийг хэрхэн бодох вэ ─────────────────────────────────────────────
 * Урсгалын зам нь `{barilgiinId}/{камерын-ip-зураастай}[-суваг]`. Rust
 * worker болон Flutter апп ЯГ ижил дүрмээр боддог тул шинэ API, шинэ
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

// Замын дүрмийг санд нэгтгэсэн. Одоо байгаа дуудагчид (`CameraPlayer`)
// эндээс импортолдог тул дахин экспортолно.
export { rtspIpAvya, rtspSuvagAvya, urgasniiZam } from "@/lib/urgatsSan";

export default function WhepVideoPlayer({
  rtspUrl,
  barilgiinId,
  className,
  style,
  onUnavailable,
}: WhepVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Дуудагчид нэгээс олон удаа мэдэгдэхгүй. */
  const medegdsenRef = useRef(false);

  const zam = urgasniiZam(barilgiinId, rtspUrl);

  const [toyim, setToyim] = useState<UrgatsToyim>(() => ({
    tuluv: "connecting",
    stream: null,
    aldaa: "",
    dakhin: 0,
  }));

  // Санд бичиглээд урсгалыг шаардана. Цэвэрлэгээ нь ЗӨВХӨН бичиглэлийг
  // цуцална — холболт үлдэнэ.
  useEffect(() => {
    if (!zam) {
      setToyim({
        tuluv: "failed",
        stream: null,
        aldaa: "Камерын хаягаас IP олдсонгүй",
        dakhin: 0,
      });
      return;
    }
    medegdsenRef.current = false;
    const salya = bichiglekhye(zam, setToyim);
    setToyim(nekhye(zam));
    return salya;
  }, [zam]);

  // Харагдаж байгааг санд мэдэгдэнэ. Урсгалыг ХААХГҮЙ — хязгаар хэтрэхэд
  // аль урсгалыг хаях шийдэлд л хэрэглэгдэнэ (сүүлд харагдсан нь үлдэнэ).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !zam || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) kheregtseeTemdegley(zam);
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [zam]);

  // Урсгалыг видео элементэд залгана.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== toyim.stream) {
      el.srcObject = toyim.stream;
      if (toyim.stream) el.play().catch(() => {});
    }
  }, [toyim.stream]);

  // 404 = тэр зам сервер дээр огт байхгүй. Дуудагчид нэг л удаа хэлнэ.
  useEffect(() => {
    if (toyim.tuluv !== "bolomjgui" || medegdsenRef.current) return;
    medegdsenRef.current = true;
    onUnavailable?.();
  }, [toyim.tuluv, onUnavailable]);

  const kholbogdson = toyim.tuluv === "connected";
  const kholbogdoj = toyim.tuluv === "connecting" || toyim.tuluv === "retrying";
  const unasan = toyim.tuluv === "failed" || toyim.tuluv === "bolomjgui";

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
          opacity: kholbogdson ? 1 : 0,
          visibility: kholbogdson ? "visible" : "hidden",
          position: kholbogdson ? "relative" : "absolute",
        }}
      />

      {!kholbogdson && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
          {kholbogdoj && (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              <span className="text-[11px] font-mono">
                {toyim.tuluv === "retrying"
                  ? `Дахин холбогдож байна... (${toyim.dakhin})`
                  : "Холбогдож байна..."}
              </span>
            </>
          )}
          {unasan && (
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
                {toyim.aldaa || "Холболт амжилтгүй"}
              </span>
              <button
                onClick={() => shineeerOroldoyo(zam)}
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
