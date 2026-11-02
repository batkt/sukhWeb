"use client";

import dayjs from "dayjs";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import type { AuditMur } from "./auditUtils";

/**
 * Нэхэмжлэхийн «Нийт нэхэмжилсэн» өөрчлөгдсөн засварт яг аль зардал
 * нэмэгдсэн / хасагдсаныг гаргана:
 *   Домофон      0    → 10000   (нэмсэн мөр)
 *   Домофон      5000 → 0       (устгасан мөр)
 *
 * Нэхэмжлэхийн дүн нь авлагын мөрүүдээс (guilgeeAvlaguud) бодогддог.
 * Устгасан мөр «Устгасан түүх»-д бичигддэг, харин нэмсэн мөр аудитад
 * бичигддэггүй тул гэрээний одоогийн мөрүүдээс засварын үеийн цонхонд
 * үүссэнийг нь олно.
 */

/** Засвараас өмнө хэр хугацааны мөрийн өөрчлөлтийг хамааруулах */
const UMNUKH_MIN = 15;
const DARAA_MIN = 2;

export interface ZadargaaMur {
  key: string;
  talbar: string;
  umnukh: string;
  shine: string;
}

type Rec = Record<string, unknown>;

const murNer = (r: Rec) => {
  if (r.ekhniiUldegdelEsekh === true || r.ekhniiUldegdelEsekh === "true") return "Эхний үлдэгдэл";
  return String(r.zardliinNer || r.tailbar || "Зардал").trim();
};

/** Авлагын (төлөх) дүн; төлбөрийн мөр бол null */
const murDun = (r: Rec): number | null => {
  if (Number(r.tulsunDun) > 0) return null;
  const n = Number(r.tulukhDun ?? r.dun ?? r.undsenDun);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

const zadargaaKheregtei = (mur: AuditMur | null, zassan: boolean) =>
  !!mur &&
  zassan &&
  !!mur.dugaar &&
  !!mur.uildelOgnoo &&
  mur.uurchlultuud.some((c) => c.talbar === "niitTulbur");

export function useZardalZadargaa(mur: AuditMur | null, zassan: boolean) {
  const { token, baiguullaga } = useAuth();
  const orgId = baiguullaga?._id;
  const idevkhtei = zadargaaKheregtei(mur, zassan) && !!token && !!orgId;

  const { data, isLoading } = useSWR(
    idevkhtei ? ["zardalZadargaa", token, orgId, mur!._id, mur!.dugaar, mur!.uildelOgnoo] : null,
    async ([, tkn, id, , dugaar, ognoo]) => {
      const t = dayjs(ognoo as string);
      const ekh = t.subtract(UMNUKH_MIN, "minute");
      const duus = t.add(DARAA_MIN, "minute");
      const tsonkhondEsekh = (v: unknown) => {
        const d = dayjs(v as string);
        return d.isValid() && !d.isBefore(ekh) && !d.isAfter(duus);
      };
      const api = uilchilgee(tkn as string);

      const [shineResp, ustgasanResp] = await Promise.all([
        api.get("/guilgeeAvlaguud", {
          params: {
            baiguullagiinId: id,
            query: JSON.stringify({ gereeniiDugaar: dugaar }),
            // Энэ endpoint эрэмбийг `order`-оор авдаг
            order: JSON.stringify({ createdAt: -1 }),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 500,
          },
        }),
        api.get("/audit/ustgakhTuukh", {
          params: {
            baiguullagiinId: id,
            modelName: "guilgeeAvlaguud",
            ekhlekhOgnoo: ekh.format("YYYY-MM-DD HH:mm:ss"),
            duusakhOgnoo: duus.format("YYYY-MM-DD HH:mm:ss"),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 1000,
          },
        }),
      ]);

      const jagsaalt = (d: any): Rec[] =>
        Array.isArray(d?.jagsaalt) ? d.jagsaalt : Array.isArray(d?.data) ? d.data : [];

      const out: ZadargaaMur[] = [];
      // Нэмсэн: засварын үеийн цонхонд үүссэн мөрүүд
      jagsaalt(shineResp.data)
        .filter((r) => tsonkhondEsekh(r.createdAt))
        .forEach((r, i) => {
          const dun = murDun(r);
          if (dun !== null)
            out.push({ key: `n${i}`, talbar: murNer(r), umnukh: "0", shine: String(dun) });
        });
      // Устгасан: тухайн гэрээний, цонхонд устгагдсан мөрүүд
      jagsaalt(ustgasanResp.data).forEach((u, i) => {
        const d = (u.deletedData || u.deletedDocument || {}) as Rec;
        if (String(d.gereeniiDugaar || "") !== dugaar) return;
        if (!tsonkhondEsekh(u.createdAt || u.ognoo)) return;
        const dun = murDun(d);
        if (dun !== null)
          out.push({ key: `k${i}`, talbar: murNer(d), umnukh: String(dun), shine: "0" });
      });
      // Ижил зардлыг хамт харуулна (Домофон 0 → 10000, Домофон 5000 → 0)
      return out.sort((a, b) => a.talbar.localeCompare(b.talbar, "mn"));
    },
    { revalidateOnFocus: false },
  );

  return { zadargaa: data || [], achaalj: idevkhtei && isLoading };
}
