"use client";
import { useCallback, useState } from "react";
import WebRTCVideoPlayer from "./WebRTCVideoPlayer";
import WhepVideoPlayer, { urgasniiZam } from "./WhepVideoPlayer";

/**
 * Камерын плеерийн НЭГ оролт — шинэ (WHEP) ба хуучин (P2P) замыг
 * КАМЕР ТУС БҮРЭЭР сонгоно.
 *
 * ── Яагаад камер тус бүрээр ─────────────────────────────────────────────
 * Барилгуудыг нэг дор шилжүүлэх боломжгүй: компьютер бүр дээр ffmpeg
 * суулгаж, `config.toml`-оо шинэчилж, үйлчилгээгээ дахин асаах хэрэгтэй.
 * Тиймээс глобал унтраалга тохирохгүй — шилжсэн барилга шинэ замаар,
 * шилжээгүй нь хуучин замаар зэрэг ажиллах ёстой.
 *
 * ── Хэрхэн шийддэг вэ ───────────────────────────────────────────────────
 * Жагсаалт хөтлөхгүй. Эхлээд WHEP-ээр оролдоно; MediaMTX `404` буцаавал
 * (тухайн зам байхгүй = барилга шилжээгүй) тэр камерыг хуучин плеер рүү
 * шилжүүлнэ. Барилга нийтэлж эхэлмэгц дараагийн ачаалалт дээр өөрөө шинэ
 * зам руу орно — тохиргоонд гар хүрэхгүй.
 *
 * `404` нь эцсийн хариу тул шийдвэрийг сесс дотор санана: хэдэн арван
 * камертай хуудсыг гүйлгэхэд дахин дахин амжилтгүй хүсэлт явуулахгүй.
 * Түр зуурын алдааг санахгүй — сервер сэргэвэл дахин оролдоно.
 */

interface CameraPlayerProps {
  rtspUrl: string;
  barilgiinId: string;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
}

const WHEP_IDEVKHTEI = !!process.env.NEXT_PUBLIC_WHEP_BASE;

/** Зам → «WHEP дээр байхгүй». Хуудас дахин ачаалахад цэвэрлэгдэнэ. */
const shiljeeguiZamuud = new Set<string>();

export default function CameraPlayer(props: CameraPlayerProps) {
  const zam = urgasniiZam(props.barilgiinId, props.rtspUrl);

  const [khuuchnaar, setKhuuchnaar] = useState<boolean>(
    () => !WHEP_IDEVKHTEI || !zam || shiljeeguiZamuud.has(zam),
  );

  const bolomjgui = useCallback(() => {
    if (zam) shiljeeguiZamuud.add(zam);
    setKhuuchnaar(true);
  }, [zam]);

  if (khuuchnaar) return <WebRTCVideoPlayer {...props} />;

  return <WhepVideoPlayer {...props} onUnavailable={bolomjgui} />;
}
