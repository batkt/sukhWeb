"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
import {
  beltgeye,
  kameriinRtsp,
  urgasniiZam,
  WHEP_IDEVKHTEI,
} from "@/lib/urgatsSan";

/**
 * Нэвтрэхэд камеруудын урсгалыг УРЬДЧИЛЖ асаана.
 *
 * Хэрэглэгч `/camera` эсвэл `/zogsool/camera` хуудас нээхэд холболт аль
 * хэдийн бэлэн байх нь гол зорилго — өмнө нь хуудас нээгдсэний дараа л
 * WHEP хүсэлт явж, камер тус бүрт 2–4 секунд «Холбогдож байна...» гэж
 * хүлээдэг байсан.
 *
 * `(shell)` layout нь нэвтэрсэн бүх хуудсанд НЭГ л удаа mount болж,
 * навигац хооронд амьд байдаг. Тиймээс энэ компонентыг тэнд тавибал
 * урьдчилсан асаалт нэг л удаа явна.
 *
 * Холболтууд нь `@/lib/urgatsSan` дотор, React-ийн циклээс гадна тул энэ
 * компонент unmount болсон ч (гарахаас бусад тохиолдолд) урсгал үлдэнэ.
 */

/**
 * Хуучин схемийн өгөгдмөл нууц үг. Бодит нууц үг биш тул тавиагүйтэй
 * адилаар үзнэ — эс бөгөөс тэр мөрүүд үргэлж 401 авна.
 *
 * Rust worker дээр мөн ижил утга (`KHUUCHIN_NUUTS`).
 */
const KHUUCHIN_NUUTS = "Admin123";

/** Хэдэн камер урьдчилж асаах. `0` бол хязгаарлахгүй. */
const BELTGEKH_DEED = (() => {
  const utga = Number(process.env.NEXT_PUBLIC_URGATS_BELTGEKH);
  return Number.isFinite(utga) && utga >= 0 ? utga : 4;
})();

interface SokhKamer {
  ip?: string;
  port?: number | string;
  root?: string;
  username?: string;
  password?: string;
  enabled?: boolean;
}

export default function UrgatsBeltgegch() {
  const { token, ajiltan } = useAuth();
  const { selectedBuildingId } = useBuilding();

  /** Барилга тус бүрд нэг л удаа. Навигац бүрд дахин татахгүй. */
  const beltgesenRef = useRef<Set<string>>(new Set());

  const baiguullagiinId = ajiltan?.baiguullagiinId;

  useEffect(() => {
    if (!WHEP_IDEVKHTEI || !token || !baiguullagiinId) return;

    const barilgiinId = selectedBuildingId || ajiltan?.barilgiinId || "";
    const tulkhuur = `${baiguullagiinId}:${barilgiinId}`;
    if (beltgesenRef.current.has(tulkhuur)) return;
    beltgesenRef.current.add(tulkhuur);

    let active = true;

    (async () => {
      try {
        // `barilgiinId`-г params-аар дамжуулна: uilchilgee-ийн interceptor
        // URL дотор давхардуулж, Express тал массив хүлээн авч `find()`
        // эвдэрдэг.
        const res = await uilchilgee(token).get(
          `/baiguullaga/${baiguullagiinId}`,
          barilgiinId ? { params: { barilgiinId } } : {},
        );
        if (!active) return;

        const barilguud: any[] = res.data?.barilguud || [];
        const b = barilgiinId
          ? barilguud.find((x: any) => String(x._id) === String(barilgiinId)) ||
            barilguud[0]
          : barilguud[0];
        if (!b?._id) return;

        // Камерын мөр өөрийн ip/port/нэвтрэлтээ хадгалдаг ч тохиргооны UI
        // нь зөвхөн БАРИЛГЫН хэмжээний талбарыг гаргадаг. Хоёрыг нэгтгэнэ:
        // мөрд бодит утга байвал тэр, үгүй бол барилгынх. `/camera`
        // хуудастай ЯГ ижил дүрэм — эс бөгөөс зам зөрж 404 авна.
        const zamuud = ((b.sohCameruud ?? []) as SokhKamer[])
          .filter((cam) => cam?.enabled !== false)
          .map((cam) => {
            const murNuuts =
              cam.password && cam.password !== KHUUCHIN_NUUTS
                ? cam.password
                : "";
            return kameriinRtsp({
              ip: cam.ip || b.cameraIp || "",
              port: cam.port || b.cameraPort || 554,
              root: cam.root,
              username: cam.username || b.cameraUsername || "",
              password: murNuuts || b.cameraPassword || "",
            });
          })
          .map((rtsp) => urgasniiZam(String(b._id), rtsp))
          .filter((z) => !!z);

        if (!active || zamuud.length === 0) return;

        beltgeye(
          BELTGEKH_DEED > 0 ? zamuud.slice(0, BELTGEKH_DEED) : zamuud,
        );
      } catch {
        // Урьдчилсан асаалт нь зүгээр л хурдасгагч — бүтэхгүй бол хуудас
        // нээгдэхэд хуучин шигээ өөрөө холбогдоно. Хэрэглэгчид мэдэгдэхгүй.
        beltgesenRef.current.delete(tulkhuur);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, baiguullagiinId, selectedBuildingId, ajiltan?.barilgiinId]);

  return null;
}
