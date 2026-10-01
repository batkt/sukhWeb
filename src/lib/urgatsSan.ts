"use client";

/**
 * Камерын WHEP урсгалуудын ТӨВЛӨРСӨН сан.
 *
 * ── Яагаад компонентоос гаргав ──────────────────────────────────────────
 * Холболт нь `WhepVideoPlayer`-ийн дотор байхад плеер бүр өөрийн
 * `RTCPeerConnection`-ийг эзэмшдэг байсан. Үүний хоёр үр дагавар:
 *
 *   1. Гүйлгэхэд салдаг. `IntersectionObserver` нь харагдахаа болиход
 *      сессийг хааж, дээш гүйлгэхэд «Холбогдож байна...» гэж дахин
 *      2-4 секунд хүлээлгэдэг.
 *   2. Хуудас солиход бүгд үгүй болдог. Камер рүү буцахад дахин
 *      бүх холболтыг шинээр үүсгэнэ.
 *
 * Сан нь холболтыг React-ийн ажлын циклээс ГАДНА хадгална. Плеер зөвхөн
 * `MediaStream`-ийг залгаж харуулах бөгөөд unmount болохдоо холболтыг
 * ХААХГҮЙ — бичиглэлээ л цуцална.
 *
 * ── Хязгаар ─────────────────────────────────────────────────────────────
 * Урсгал бүр нь барилгын компьютерээс VPS рүү ~700 kbps байнгын ачаалал
 * (нэг сувгаар хэмжсэн). 30 камер зэрэг нээлттэй байвал ~20 Mbps болж
 * барилгын upload-ыг дүүргэнэ — энэ нь өмнө нь минутын саатал үүсгэсэн
 * шалтгаан. Тиймээс `ZERGTSEE` хязгаар тавив: хэтэрвэл хэн ч үзэхгүй
 * байгаа ХАМГИЙН ХУУЧИН урсгалыг хааж зай гаргана. Үзэгчтэй урсгалыг
 * хэзээ ч хаахгүй.
 */

const WHEP_BASE = (process.env.NEXT_PUBLIC_WHEP_BASE ?? "").replace(/\/+$/, "");

/**
 * WHEP-ийн УНТРААЛГА.
 *
 * `NEXT_PUBLIC_WHEP=0` (эсвэл `false` / `off` / `no`) бол бүх камер
 * хуучин P2P замаар явна. `NEXT_PUBLIC_WHEP_BASE`-ыг устгах бас
 * ижил нөлөөтэй, гэхдээ тэгвэл тохиргоог бүрэн алдах тул буцааж
 * асаахад дахин бичих шаардлагатай болно.
 *
 * АНХААР: `NEXT_PUBLIC_*` нь build-time бөгөөд Next тэднийг
 * bundle дотор шигтгэдэг. Сольсны дараа `next build` ЗААВАЛ
 * — зүгээр restart хийвэл хүчинтэй болохгүй.
 */
export const WHEP_IDEVKHTEI = (() => {
  if (!WHEP_BASE) return false;
  const untraa = (process.env.NEXT_PUBLIC_WHEP ?? "").trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(untraa);
})();

/** Host candidate агшин зуур бэлэн болдог — энэ хүлээлт мэдэгдэхгүй. */
const ICE_TIMEOUT_MS = 800;

/** «disconnected» нь ихэвчлэн өөрөө эдгэрдэг. */
const DISCONNECT_GRACE_MS = 4000;

const MAX_BACKOFF_MS = 8000;

/**
 * Сесс байгуулагдсанаас хойш медиа ирэхийг хүлээх дээд хугацаа.
 *
 * ── Яагаад шаардлагатай ─────────────────────────────────────────────────
 * Камер тус бүрийн нөөцлөлт нь «WHEP 404 → хуучин P2P зам» дүрэм дээр
 * тогтсон. Гэвч MediaMTX-д `all_others` дээр `runOnDemand` тохируулсан тул
 * зам БҮР байгаа юм шиг харагдана: сервер 404 биш, 201 буцаагаад публишер
 * гарч ирэхийг `runOnDemandStartTimeout` (20с) хүртэл хүлээдэг.
 *
 * Иймд шилжээгүй барилгын камер хуучин зам руу хэзээ ч буухгүй — 20 секунд
 * хоосон эргэлдээд дахин оролдоно. Хэрэглэгчийн хувьд «юу ч болохгүй».
 *
 * Серверийн 20 секундээс БАГА байх нь чухал: бид өмнө нь шийдвэрээ гаргаж,
 * хуучин зам руу шилжинэ.
 */
const MEDIA_MS = 8000;

/**
 * ЗЭРЭГ явуулах WHEP хүсэлтийн дээд тоо.
 *
 * Камерын хуудас 30+ плеерийг нэг мөчид mount хийдэг. Бүгд зэрэг хүсэлт
 * явуулбал:
 *
 *   • Хөтөч нэг origin-д HTTP/1.1-ээр 6 холболт л барьдаг тул 7-оос
 *     хойшхи нь дараалалд гацна (devtools тэр хүлээлтийг хугацаанд
 *     тоолдог — «whep 20.1 s» мөрүүдийн дийлэнх нь үнэндээ хүлээлт).
 *   • POST бүр MediaMTX-ийн `runOnDemand` хүйтэн асаалтыг хүлээдэг:
 *     backend → socket → worker → ffmpeg → RTSP. Хэдэн арваныг зэрэг
 *     өдөөвөл барилгын PC дээр ffmpeg-үүд бөөнөөр асаж, NVR-ын сессийн
 *     хязгаарт тулж, гинж бүхэлдээ удааширна.
 *
 * Тиймээс оролдлогыг дараалалд оруулж, зэрэг цөөхнийг л явуулна. Хүсэлт
 * дуусмагц (SDP хариу авмагц) дараагийнх нь шууд эхэлнэ — ICE холбогдохыг
 * хүлээхгүй тул энэ нь нийт хугацааг уртасгахгүй.
 */
const KHOLBOKH_ZERGTSEE = (() => {
  const utga = Number(process.env.NEXT_PUBLIC_URGATS_KHOLBOKH);
  return Number.isFinite(utga) && utga >= 1 ? utga : 2;
})();

/**
 * Зэрэг нээлттэй байж болох урсгалын дээд тоо.
 *
 * ӨГӨГДМӨЛ 4 нь таамаг биш, ХЭМЖСЭН тоо. Найрамдал дээр 31 камерыг зэрэг
 * өдөөхөд MediaMTX-ийн логт ердөө 5 нь `is publishing` хүртэл явж, 4 нь
 * тогтвортой үлдээд бусад нь `connection reset by peer` болов. Шалтгаан
 * нь зурвас бус: 31 ffmpeg НЭГ NVR (192.168.1.243) рүү зэрэг холбогдохыг
 * оролдоход NVR-ын зэрэг татах сессийн хязгаарт тулдаг. Өмнө нь Dahua
 * дээр яг ижил зүйл 16 холболт дээр 401 болж гарсан.
 *
 * Хязгаарыг өсгөхийн тулд эхлээд NVR-ын substream-ийг хөнгөвчилж
 * (640×360 / 15fps / 384 kbps) тэр хязгаарыг шалгах нь зөв дараалал.
 *
 * `NEXT_PUBLIC_URGATS_ZERGTSEE=0` бол хязгаарлахгүй.
 */
const ZERGTSEE = (() => {
  const utga = Number(process.env.NEXT_PUBLIC_URGATS_ZERGTSEE);
  return Number.isFinite(utga) && utga >= 0 ? utga : 4;
})();

export type Tuluv =
  | "connecting"
  | "connected"
  | "retrying"
  | "failed"
  /** MediaMTX дээр тэр зам огт байхгүй — барилга шилжээгүй байна. */
  | "bolomjgui";

export interface UrgatsToyim {
  tuluv: Tuluv;
  stream: MediaStream | null;
  aldaa: string;
  dakhin: number;
}

interface Urgats extends UrgatsToyim {
  zam: string;
  pc: RTCPeerConnection | null;
  /** WHEP сессийн хаяг — салахдаа DELETE явуулна. */
  resource: string | null;
  /** Хуучирсан оролдлогын хариуг таньж хаяхад. */
  oroldlogo: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
  graceTimer: ReturnType<typeof setTimeout> | null;
  /** Сесс байгуулагдсан ч медиа ирэхгүй байгааг барих цаг. */
  mediaTimer: ReturnType<typeof setTimeout> | null;
  bichigchid: Set<(t: UrgatsToyim) => void>;
  /** LRU — хамгийн сүүлд хэрэгцээтэй байсан хугацаа. */
  kheregtseeTs: number;
  /** Дараалсан алдааны тоо — нөөц зам руу шилжих шийдэлд. */
  aldaaToo: number;
  /** Холбогдох дараалалд хүлээж байгаа эсэх — давхардлыг сэргийлнэ. */
  daraalaldBaigaa: boolean;
}

const san = new Map<string, Urgats>();

// ─── Замын дүрэм ────────────────────────────────────────────────────────
//
// Rust worker (`config::rtsp_ip` / `rtsp_suvag` / `nemelt_zam`) болон
// Flutter апп (`whep_player.dart`) гуравтайгаа ЯГ ижил. Зөрвөл хөтөч өөр
// зам хүсч 404 авна — 17 тохиолдлоор тулгаж баталсан.

/** `rtsp://user:pass@192.168.1.110:554/...` → `192.168.1.110` */
export function rtspIpAvya(rtspUrl: string): string {
  const s = String(rtspUrl || "").trim();
  const doorkh = s.toLowerCase();
  if (!doorkh.startsWith("rtsp://") && !doorkh.startsWith("rtsps://")) return "";

  const after = s.split("://")[1];
  if (!after) return "";

  // СҮҮЛИЙН `@` — нууц үг дотор `@` байж болно.
  const at = after.lastIndexOf("@");
  const host = at >= 0 ? after.slice(at + 1) : after;

  const tues = host.search(/[:/?#]/);
  return tues < 0 ? host : host.slice(0, tues);
}

/**
 * RTSP хаягаас СУВГИЙН дугаарыг салгана.
 *
 * NVR бол НЭГ IP дээр олон камер: зөвхөн IP-гээр зам нэрлэвэл бүх суваг
 * нэг зам руу орж, бие биенээ түлхэнэ.
 *
 * `Streaming/Channels/102` → `102`
 * `cam/realmonitor?channel=2&subtype=1` → `2`
 * `stream` → ``
 */
export function rtspSuvagAvya(rtspUrl: string): string {
  const u = String(rtspUrl || "").trim();

  const channels = /\/Channels\/(\d+)/i.exec(u);
  if (channels) return channels[1];

  const query = /[?&]channel=(\d+)/i.exec(u);
  if (query) return query[1];

  return "";
}

/** Rust worker-ийн `Config::nemelt_zam` / `stream_path`-тай ижил дүрэм. */
export function urgasniiZam(barilgiinId: string, rtspUrl: string): string {
  const ip = rtspIpAvya(rtspUrl);
  if (!barilgiinId || !ip) return "";
  const suvag = rtspSuvagAvya(rtspUrl);
  return `${barilgiinId}/${ip.replace(/\./g, "-")}${suvag ? `-${suvag}` : ""}`;
}

/**
 * Камерын мөрөөс RTSP хаяг — `/camera` хуудастай ЯГ ижил дүрэм.
 *
 * Нэр/нууц үгийг кодлоно: нууц үг дотор `@` байвал кодлохгүй тохиолдолд
 * хаяг хоёр `@`-тай болж зам зөрнө. Хоёулан байхад л нэвтрэлт нэмнэ —
 * `rtsp://:@host/...` гэсэн хоосон хос нь анонимоор үйлчилдэг NVR-ыг
 * 401 буцаахад хүргэдэг.
 */
export function kameriinRtsp(cam: {
  ip?: string;
  port?: number | string;
  root?: string;
  username?: string;
  password?: string;
}): string {
  const ip = String(cam.ip ?? "").trim();
  if (!ip) return "";
  const port = String(cam.port ?? 554).trim() || "554";
  const root = String(cam.root ?? "").trim() || "stream";
  const user = String(cam.username ?? "").trim();
  const pass = String(cam.password ?? "");

  return user && pass
    ? `rtsp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${ip}:${port}/${root}`
    : `rtsp://${ip}:${port}/${root}`;
}

// ─── Дотоод ─────────────────────────────────────────────────────────────

function toyim(u: Urgats): UrgatsToyim {
  return { tuluv: u.tuluv, stream: u.stream, aldaa: u.aldaa, dakhin: u.dakhin };
}

function medegdey(u: Urgats) {
  const t = toyim(u);
  u.bichigchid.forEach((cb) => {
    try {
      cb(t);
    } catch {
      /* бичигчийн алдаа бусдад нөлөөлөхгүй */
    }
  });
}

function tsagAriltgaya(u: Urgats) {
  if (u.retryTimer) {
    clearTimeout(u.retryTimer);
    u.retryTimer = null;
  }
  if (u.graceTimer) {
    clearTimeout(u.graceTimer);
    u.graceTimer = null;
  }
  if (u.mediaTimer) {
    clearTimeout(u.mediaTimer);
    u.mediaTimer = null;
  }
}

/** Холболтыг таслана. Санд бичлэг үлдэнэ (тулуv-ыг л сольдог). */
function salgaya(u: Urgats) {
  tsagAriltgaya(u);
  u.oroldlogo += 1;

  const pc = u.pc;
  u.pc = null;
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

  const res = u.resource;
  u.resource = null;
  if (res) {
    // Сесс цэвэрлэх нь "хийвэл сайн" — амжилтгүй болсон ч хэрэглэгчид
    // нөлөөлөхгүй, сервер өөрөө хугацаагаар цэвэрлэнэ.
    fetch(res, { method: "DELETE", keepalive: true }).catch(() => { });
  }

  u.stream = null;
}

function dakhinTseglee(u: Urgats) {
  tsagAriltgaya(u);
  u.dakhin += 1;
  const delay = Math.min(1000 * 2 ** (u.dakhin - 1), MAX_BACKOFF_MS);
  u.tuluv = "retrying";
  medegdey(u);
  u.retryTimer = setTimeout(() => {
    tseglee(u);
  }, delay);
}

/**
 * Хязгаар хэтэрвэл зай гаргана.
 *
 * ЗӨВХӨН үзэгчгүй урсгалыг хаана, хамгийн хуучнаас. Үзэгчтэй урсгалыг
 * хаавал хэрэглэгчийн дэлгэц хоосорно — түүнээс хязгаар хэтрэх нь дээр.
 */
function zaiGargaya() {
  if (ZERGTSEE === 0) return;

  const idevkhtei = [...san.values()].filter((x) => x.pc !== null);
  if (idevkhtei.length < ZERGTSEE) return;

  const sul = idevkhtei
    .filter((x) => x.bichigchid.size === 0)
    .sort((a, b) => a.kheregtseeTs - b.kheregtseeTs);

  const khereg = idevkhtei.length - ZERGTSEE + 1;
  for (let i = 0; i < khereg && i < sul.length; i += 1) {
    const kh = sul[i];
    salgaya(kh);
    kh.tuluv = "connecting";
    kh.dakhin = 0;
    kh.aldaa = "";
  }
}

// ─── Холбогдох оролдлогын дараалал ──────────────────────────────────────

let yavajBaigaa = 0;
const daraalal: Urgats[] = [];

/** Дараалалд оруулна. Аль хэдийн дараалалд байвал давхардуулахгүй. */
function tseglee(u: Urgats) {
  if (u.daraalaldBaigaa) return;
  u.daraalaldBaigaa = true;
  daraalal.push(u);
  khudulgeye();
}

function khudulgeye() {
  while (yavajBaigaa < KHOLBOKH_ZERGTSEE && daraalal.length > 0) {
    const u = daraalal.shift()!;
    u.daraalaldBaigaa = false;

    // Хүлээж байх зуур хэрэгцээгүй болсон байж магадгүй.
    if (u.tuluv === "bolomjgui") continue;

    yavajBaigaa += 1;
    void kholbogdoyo(u).finally(() => {
      yavajBaigaa -= 1;
      khudulgeye();
    });
  }
}

async function kholbogdoyo(u: Urgats) {
  if (u.tuluv === "bolomjgui") return;

  if (!WHEP_IDEVKHTEI) {
    // Унтраалттай үед оролдохгүй — дуудагч нь хуучин зам руу шилжинэ.
    u.tuluv = "bolomjgui";
    u.aldaa = "WHEP унтраалттай";
    medegdey(u);
    return;
  }

  salgaya(u);
  zaiGargaya();

  const oroldlogo = u.oroldlogo;
  u.tuluv = u.dakhin > 0 ? "retrying" : "connecting";
  u.aldaa = "";
  medegdey(u);

  try {
    // Сервер нийтийн тул STUN/TURN шаардлагагүй.
    const pc = new RTCPeerConnection({ iceServers: [] });
    u.pc = pc;

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (e) => {
      if (u.pc !== pc || !e.streams[0]) return;
      u.stream = e.streams[0];
      medegdey(u);
    };

    pc.onconnectionstatechange = () => {
      if (u.pc !== pc) return;
      switch (pc.connectionState) {
        case "connected":
          if (u.graceTimer) {
            clearTimeout(u.graceTimer);
            u.graceTimer = null;
          }
          if (u.mediaTimer) {
            clearTimeout(u.mediaTimer);
            u.mediaTimer = null;
          }
          u.dakhin = 0;
          u.aldaaToo = 0;
          u.tuluv = "connected";
          medegdey(u);
          break;
        case "disconnected":
          // Түр зуурын саатал — өөрөө эдгэрэх боломж өгнө.
          if (!u.graceTimer) {
            u.graceTimer = setTimeout(() => {
              u.graceTimer = null;
              if (u.pc === pc && pc.connectionState !== "connected") {
                dakhinTseglee(u);
              }
            }, DISCONNECT_GRACE_MS);
          }
          break;
        case "failed":
        case "closed":
          dakhinTseglee(u);
          break;
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // WHEP нь нэг удаагийн offer/answer — ICE-г цуглуулж дуусахыг хүлээнэ.
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

    const whepUrl = `${WHEP_BASE}/${u.zam}/whep`;
    const res = await fetch(whepUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: pc.localDescription!.sdp,
    });

    if (oroldlogo !== u.oroldlogo) return;

    if (!res.ok) {
      // 404 = тухайн зам сервер дээр байхгүй. Барилга шилжээгүй байна —
      // дахин оролдох нь утгагүй, нөөц зам руу шилжинэ.
      if (res.status === 404) {
        salgaya(u);
        u.tuluv = "bolomjgui";
        u.aldaa = "Урсгал олдсонгүй — камер нийтлэгдээгүй байна";
        medegdey(u);
        return;
      }
      throw new Error(`WHEP ${res.status}`);
    }

    // Сессийн хаяг. Харьцангуй бол бүтэн хаяг болгоно.
    const loc = res.headers.get("location");
    if (loc) u.resource = new URL(loc, whepUrl).toString();

    const answer = await res.text();
    if (oroldlogo !== u.oroldlogo) return;
    await pc.setRemoteDescription({ type: "answer", sdp: answer });

    // Сесс байгуулагдлаа. Одоо медиа ирэхийг хүлээнэ — ирэхгүй бол тэр
    // барилга шилжээгүй гэж тооцож хуучин зам руу шилжүүлнэ.
    if (u.mediaTimer) clearTimeout(u.mediaTimer);
    u.mediaTimer = setTimeout(() => {
      u.mediaTimer = null;
      if (u.pc !== pc || u.tuluv === "connected") return;
      salgaya(u);
      u.tuluv = "bolomjgui";
      u.aldaa = "Урсгал ирсэнгүй — камер нийтлэгдээгүй байна";
      medegdey(u);
    }, MEDIA_MS);
  } catch (err: unknown) {
    if (oroldlogo !== u.oroldlogo) return;
    u.aldaaToo += 1;
    // Сервер огт хүрэхгүй байвал хуучин зам ажиллаж магадгүй — хоёр
    // оролдсоны дараа тэр рүү шилжинэ.
    if (u.aldaaToo >= 2) {
      salgaya(u);
      u.tuluv = "bolomjgui";
      u.aldaa = err instanceof Error ? err.message : "Холболт амжилтгүй";
      medegdey(u);
      return;
    }
    u.aldaa = err instanceof Error ? err.message : "Холболт амжилтгүй";
    dakhinTseglee(u);
  }
}

function bichlegAvya(zam: string): Urgats {
  const baigaa = san.get(zam);
  if (baigaa) return baigaa;

  const shine: Urgats = {
    zam,
    pc: null,
    resource: null,
    stream: null,
    tuluv: "connecting",
    aldaa: "",
    dakhin: 0,
    oroldlogo: 0,
    retryTimer: null,
    graceTimer: null,
    mediaTimer: null,
    bichigchid: new Set(),
    kheregtseeTs: Date.now(),
    aldaaToo: 0,
    daraalaldBaigaa: false,
  };
  san.set(zam, shine);
  return shine;
}

// ─── Гадаад API ─────────────────────────────────────────────────────────

/**
 * Тухайн зам асаалттай байхыг шаардана. Аль хэдийн асаалттай бол юу ч
 * хийхгүй — тэр нь гүйлгэхэд дахин холбогдохгүй байгаагийн гол шалтгаан.
 */
export function nekhye(zam: string): UrgatsToyim {
  if (!zam) {
    return { tuluv: "failed", stream: null, aldaa: "Камерын хаягаас IP олдсонгүй", dakhin: 0 };
  }
  const u = bichlegAvya(zam);
  u.kheregtseeTs = Date.now();
  if (
    !u.pc &&
    u.tuluv !== "bolomjgui" &&
    !u.retryTimer &&
    !u.daraalaldBaigaa
  ) {
    tseglee(u);
  }
  return toyim(u);
}

/**
 * Төлөв солигдох үед мэдэгдэнэ. Буцаах функц нь ЗӨВХӨН бичиглэлийг
 * цуцална — холболт хэвээр үлдэнэ.
 */
export function bichiglekhye(zam: string, cb: (t: UrgatsToyim) => void): () => void {
  if (!zam) return () => { };
  const u = bichlegAvya(zam);
  u.bichigchid.add(cb);
  return () => {
    u.bichigchid.delete(cb);
    u.kheregtseeTs = Date.now();
  };
}

/** Гараар дахин оролдох — «Дахин оролдох» товчинд. */
export function shineeerOroldoyo(zam: string) {
  const u = san.get(zam);
  if (!u) {
    nekhye(zam);
    return;
  }
  u.dakhin = 0;
  u.aldaaToo = 0;
  u.tuluv = "connecting";
  u.aldaa = "";
  tseglee(u);
}

/** LRU-д «сүүлд харагдсан» гэж тэмдэглэнэ. */
export function kheregtseeTemdegley(zam: string) {
  const u = san.get(zam);
  if (u) u.kheregtseeTs = Date.now();
}

/**
 * Жагсаалтыг ШАТЛАН урьдчилж асаана.
 *
 * Нэг мөчид бүгдийг асаавал хөтөч хэдэн арван `fetch` болон ICE-ийг
 * зэрэг гүйцэтгэж, эхний камер харагдах хугацаа УРТАСНА. Зай авбал
 * эхнийх нь бараг тэр дороо гарч ирнэ.
 */
export function beltgeye(zamuud: string[]) {
  // Давхардлыг нэгтгэнэ: нэг NVR-ын сувгууд өөр зам тул давхардахгүй,
  // гэхдээ хуудас хооронд дуудагдахад ижил зам хоёр удаа орж магадгүй.
  const jagsaalt = [...new Set(zamuud.filter((z) => !!z))];

  // Цаг хойшлуулахгүй — дарааллыг `KHOLBOKH_ZERGTSEE` өөрөө сааруулна.
  // Ингэснээр эхний хэд нь ТЭР ДОРОО эхэлж, дараагийнх нь өмнөх хүсэлт
  // дуусмагц шууд орно. Тогтмол зай авбал сүлжээ сул байсан ч дэмий
  // хүлээдэг байсан.
  jagsaalt.forEach((zam) => {
    nekhye(zam);
  });
}

/** Гарахад бүгдийг цэвэрлэнэ. */
export function bukhniigKhaaya() {
  san.forEach((u) => {
    salgaya(u);
    u.bichigchid.clear();
  });
  san.clear();
}

/** Тухайн зам WHEP дээр байхгүй гэж аль хэдийн шийдэгдсэн эсэх. */
export function bolomjguiEsekh(zam: string): boolean {
  return san.get(zam)?.tuluv === "bolomjgui";
}
