"use client";

/**
 * Барилга нэмэх / засах — тусдаа хуудас (modal биш).
 *   /tokhirgoo/barilga/shine  → шинэ барилга
 *   /tokhirgoo/barilga/<_id>  → тухайн барилгыг засах
 *
 * Орц, давхрын тоогоор «Тоот бүртгэл» хүснэгт гарна: орц × давхар бүрт
 * тоотуудыг оруулна. Тоотууд `tokhirgoo.davkhariinToonuud`-д `орц::давхар`
 * түлхүүрээр хадгалагдана — «Тоот бүртгэл», гэрээний хуудсуудтай ижил хэлбэр.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Download, Home, MapPin, Save, Upload } from "lucide-react";
import uilchilgee from "@/lib/uilchilgee";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import Button from "@/components/ui/Button";
import createMethod from "../../../../../../tools/function/createMethod";
import updateMethod from "../../../../../../tools/function/updateMethod";
import TusgaiZagvar from "../../../../../../components/selectZagvar/tusgaiZagvar";
import { districts, subDistricts } from "../../barilgaKhayag";

const BUTSAKH_KHAYAG = "/tokhirgoo?tsonkh=tokhirgoo.barilga";

const INPUT_CLASS =
  "w-full px-4 py-3 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-theme/20 focus:border-theme transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]";

/** `101, 102;103` → ["101","102","103"]. Массив ч хүлээн авна. */
function tootJagsaalt(val: any): string[] {
  if (Array.isArray(val)) return val.flatMap((v) => tootJagsaalt(v));
  return String(val ?? "")
    .split(/[\s,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** useGereeData-ийн composeKey-тэй ижил: орцгүй бол зөвхөн давхар. */
const tootiinTulkhuur = (o: string, d: string) => (o ? `${o}::${d}` : d);

/**
 * Нэг орц × давхрын тоотууд — «Тоот бүртгэл» хуудасны товчлууртай ижил
 * хэв маяг. Идэвхтэй (гэрээтэй) тоот ногоон хүрээ + цэгтэй, хасагдахгүй.
 */
function TootNud({
  toonuud,
  idevkhtei,
  davkhardsan,
  onChange,
}: {
  toonuud: string[];
  idevkhtei: (t: string) => boolean;
  davkhardsan: (t: string) => boolean;
  onChange: (next: string[]) => void;
}) {
  const [shine, setShine] = useState("");
  const nemekh = () => {
    const nemelt = tootJagsaalt(shine);
    if (nemelt.length) onChange(Array.from(new Set([...toonuud, ...nemelt])));
    setShine("");
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {toonuud.map((t) => {
        const id = idevkhtei(t);
        const dv = davkhardsan(t);
        return (
          <span
            key={t}
            title={id ? "Идэвхтэй — гэрээтэй тоот" : dv ? "Давхардсан тоот" : undefined}
            className={`group relative inline-flex h-8 min-w-[48px] items-center justify-center rounded-lg border px-2 text-[13px] shadow-sm ${
              dv
                ? "border-danger text-danger"
                : id
                  ? "border-success text-success"
                  : "border-[color:var(--surface-border)] text-[color:var(--panel-text)]"
            } bg-[color:var(--surface-bg)]`}
          >
            {id && <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-success" />}
            {t}
            {!id && (
              <button
                type="button"
                onClick={() => onChange(toonuud.filter((x) => x !== t))}
                className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] leading-none text-white group-hover:flex"
                title="Хасах"
                aria-label={`${t} хасах`}
              >
                ×
              </button>
            )}
          </span>
        );
      })}
      <input
        type="text"
        value={shine}
        onChange={(e) => setShine(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            nemekh();
          }
        }}
        onBlur={nemekh}
        placeholder="+"
        className="h-8 w-14 rounded-lg border border-dashed border-[color:var(--surface-border)] bg-transparent px-1 text-center text-[13px] text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:w-24 focus:border-theme focus:outline-none"
      />
    </div>
  );
}

export default function BarilgaZasakhKhuudas() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");
  const shine = id === "shine";

  const { baiguullaga, token, baiguullagaMutate } = useAuth();
  const { setSelectedBuildingId } = useBuilding();

  const barilga = useMemo(
    () =>
      shine
        ? null
        : (baiguullaga?.barilguud || []).find((b: any) => String(b._id) === id) || null,
    [baiguullaga, id, shine],
  );

  const [ner, setNer] = useState("");
  const [duureg, setDuureg] = useState("");
  const [horoo, setHoroo] = useState("");
  const [ortsCount, setOrtsCount] = useState<number | "">("");
  const [davkharCount, setDavkharCount] = useState<number | "">("");
  const [zogsoolCount, setZogsoolCount] = useState<number | "">("");
  const [tootBichvner, setTootBichvner] = useState<Record<string, string>>({});
  const [davkhartTootToo, setDavkhartTootToo] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);
  // Засахад: хуучин орцгүй (`давхар`) түлхүүрээс уншсан бол хадгалахад устгана
  const [ortsguiTulkhuuruud, setOrtsguiTulkhuuruud] = useState<string[]>([]);
  const [achaalsan, setAchaalsan] = useState(false);

  // Засах үед одоогийн утгуудыг нэг удаа бөглөнө
  useEffect(() => {
    if (shine || achaalsan || !barilga) return;
    const tok: any = barilga.tokhirgoo || {};
    setNer(barilga.ner || "");
    setDuureg(tok.duuregNer || "");
    setHoroo(tok.horoo?.ner || "");
    const ortsNum = Array.isArray(tok.orts) ? tok.orts.length : Number(tok.orts) || 0;
    const davFrom: string[] = Array.isArray(tok.davkhar)
      ? tok.davkhar.map((d: any) => String(d?.davkhar ?? d))
      : [];
    const engiin = davFrom.filter((d) => /^\d+$/.test(d));
    const bDavkhar = davFrom.filter((d) => /^B\d+$/i.test(d));
    setOrtsCount(ortsNum);
    setDavkharCount(engiin.length);
    setZogsoolCount(bDavkhar.length);

    const map = (tok.davkhariinToonuud || {}) as Record<string, any>;
    const bichvner: Record<string, string> = {};
    const ortsgui: string[] = [];
    const ortsuud = ortsNum > 0 ? Array.from({ length: ortsNum }, (_, i) => String(i + 1)) : [""];
    ortsuud.forEach((o) =>
      engiin.forEach((d) => {
        const k = tootiinTulkhuur(o, d);
        let list = tootJagsaalt(map[k]);
        // Хуучин өгөгдөл орцгүй түлхүүртэй байж болно — 1-р орцонд харуулна
        if (list.length === 0 && o === "1" && map[d] !== undefined) {
          list = tootJagsaalt(map[d]);
          if (list.length) ortsgui.push(d);
        }
        if (list.length) bichvner[k] = list.join(", ");
      }),
    );
    setTootBichvner(bichvner);
    setOrtsguiTulkhuuruud(ortsgui);
    setAchaalsan(true);
  }, [barilga, shine, achaalsan]);

  // Идэвхтэй тоот — тухайн барилгын цуцлаагүй гэрээтэй тоот («Тоот бүртгэл»
  // хуудастай ижил дүрэм). Түлхүүр: `орц::давхар|тоот` ба `давхар|тоот`.
  const [idevkhteiToot, setIdevkhteiToot] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (shine || !token || !baiguullaga?._id || !id) return;
    let bolisokh = false;
    const baiguullagiinId = String(baiguullaga._id);
    uilchilgee(token)
      .get("/geree", {
        params: {
          baiguullagiinId,
          barilgiinId: id,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          query: JSON.stringify({ baiguullagiinId, barilgiinId: id }),
        },
      })
      .then((res) => {
        if (bolisokh) return;
        const d = res.data;
        const list: any[] = Array.isArray(d?.jagsaalt) ? d.jagsaalt : Array.isArray(d) ? d : [];
        const s = new Set<string>();
        list.forEach((c) => {
          const tuluv = String(c?.tuluv || c?.status || "").trim().toLowerCase();
          if (["цуцалсан", "tsutlsasan", "идэвхгүй"].includes(tuluv)) return;
          if (c?.barilgiinId && String(c.barilgiinId) !== id) return;
          const nemekh = (o: any, f: any, t: any) => {
            const toot = String(t ?? "").trim();
            const davkhar = String(f ?? "").trim();
            if (!toot) return;
            const orts = String(o ?? "").trim();
            // Орцтой бол орцоор нь, орцгүй бол зөвхөн давхар+тоотоор
            s.add(orts ? `${orts}::${davkhar}|${toot}` : `${davkhar}|${toot}`);
          };
          nemekh(c.orts, c.davkhar, c.toot);
          (Array.isArray(c.nemeltTootnuud) ? c.nemeltTootnuud : []).forEach((n: any) =>
            nemekh(n?.orts ?? c.orts, n?.davkhar, n?.toot),
          );
        });
        setIdevkhteiToot(s);
      })
      .catch(() => {});
    return () => {
      bolisokh = true;
    };
  }, [shine, token, baiguullaga?._id, id]);
  const idevkhteiEsekh = (o: string, d: string, t: string) =>
    idevkhteiToot.has(`${tootiinTulkhuur(o, d)}|${t}`) ||
    // Орцгүй хадгалсан гэрээ — давхар+тоотоор
    idevkhteiToot.has(`${d}|${t}`);

  const ortsNum = Math.max(0, Number(ortsCount) || 0);
  const davNum = Math.max(0, Number(davkharCount) || 0);
  const zogsoolNum = Math.max(0, Number(zogsoolCount) || 0);
  const ortsuud = useMemo(
    () => (ortsNum > 0 ? Array.from({ length: ortsNum }, (_, i) => String(i + 1)) : [""]),
    [ortsNum],
  );
  const davkharuud = useMemo(
    () => Array.from({ length: davNum }, (_, i) => String(i + 1)),
    [davNum],
  );

  // Одоогийн орц/давхрын хүрээн дэх тоотууд
  const davkhariinToonuud = useMemo(() => {
    const out: Record<string, string[]> = {};
    ortsuud.forEach((o) =>
      davkharuud.forEach((d) => {
        const list = tootJagsaalt(tootBichvner[tootiinTulkhuur(o, d)]);
        if (list.length) out[tootiinTulkhuur(o, d)] = list;
      }),
    );
    return out;
  }, [tootBichvner, ortsuud, davkharuud]);

  const davkhardsanToot = useMemo(() => {
    const toolol: Record<string, number> = {};
    Object.values(davkhariinToonuud)
      .flat()
      .forEach((t) => {
        toolol[t] = (toolol[t] || 0) + 1;
      });
    return Object.keys(toolol).filter((t) => toolol[t] > 1);
  }, [davkhariinToonuud]);
  const niitToot = Object.values(davkhariinToonuud).reduce((s, l) => s + l.length, 0);

  // Давхар бүрт N тоот — орц тус бүрээр, доороос дээш дараалсан дугаар
  const avtomataarBuglukh = () => {
    const n = Number(davkhartTootToo) || 0;
    if (n <= 0) {
      openErrorOverlay("Давхар бүрийн тоотын тоог оруулна уу");
      return;
    }
    let dugaar = 1;
    const next: Record<string, string> = {};
    ortsuud.forEach((o) =>
      davkharuud.forEach((d) => {
        next[tootiinTulkhuur(o, d)] = Array.from({ length: n }, () => String(dugaar++)).join(", ");
      }),
    );
    setTootBichvner(next);
  };

  // ── Excel: «Орц | Давхар | Тоот» багана. Тоот нүдэнд нэг эсвэл таслалаар олон.
  const excelInputRef = React.useRef<HTMLInputElement>(null);

  const excelZagvarTatakh = async () => {
    const XLSX = await import("xlsx");
    const mur: (string | number)[][] = [["Орц", "Давхар", "Тоот"]];
    ortsuud.forEach((o) =>
      davkharuud.forEach((d) => {
        const list = davkhariinToonuud[tootiinTulkhuur(o, d)] || [];
        if (list.length) list.forEach((t) => mur.push([o, d, t]));
        else mur.push([o, d, ""]);
      }),
    );
    if (mur.length === 1) mur.push(["1", "1", "101"], ["1", "1", "102"]);
    const ws = XLSX.utils.aoa_to_sheet(mur);
    ws["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Тоот");
    XLSX.writeFile(wb, `${(ner || "barilga").trim()}_toot.xlsx`);
  };

  const excelUnshikh = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const murnuud = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
      // Толгойн нэрийг жижиг үсэг, хоосон зайгүйгээр тааруулна
      const utga = (r: Record<string, any>, nernuud: string[]) => {
        const k = Object.keys(r).find((key) =>
          nernuud.includes(key.trim().toLowerCase().replace(/\s+/g, "")),
        );
        return k ? String(r[k]).trim() : "";
      };
      const next: Record<string, string[]> = {};
      let maxOrts = 0;
      let maxDavkhar = 0;
      let algassan = 0;
      murnuud.forEach((r) => {
        const o = utga(r, ["орц", "orts"]).replace(/\D/g, "");
        const d = utga(r, ["давхар", "davkhar"]).replace(/\s*давхар\s*/i, "");
        const toot = tootJagsaalt(utga(r, ["тоот", "toot"]));
        // Зөвхөн энгийн (тоон) давхар — зогсоолын B давхрыг алгасна
        if (!/^\d+$/.test(d) || toot.length === 0) {
          algassan++;
          return;
        }
        const ortsKey = ortsNum > 0 || o ? o || "1" : "";
        const k = tootiinTulkhuur(ortsKey, d);
        next[k] = Array.from(new Set([...(next[k] || []), ...toot]));
        maxOrts = Math.max(maxOrts, Number(ortsKey) || 0);
        maxDavkhar = Math.max(maxDavkhar, Number(d));
      });
      const too = Object.values(next).reduce((s, l) => s + l.length, 0);
      if (too === 0) {
        openErrorOverlay("Excel-ээс тоот олдсонгүй. «Орц», «Давхар», «Тоот» баганатай эсэхийг шалгана уу.");
        return;
      }
      // Excel-д илүү орц/давхар байвал тоог нь нэмэгдүүлнэ
      if (maxOrts > ortsNum) setOrtsCount(maxOrts);
      if (maxDavkhar > davNum) setDavkharCount(maxDavkhar);
      setTootBichvner(
        Object.fromEntries(Object.entries(next).map(([k, l]) => [k, l.join(", ")])),
      );
      openSuccessOverlay(
        `Excel-ээс ${too} тоот орууллаа${algassan ? ` (${algassan} мөр алгассан)` : ""}. Хадгалахаа мартуузай.`,
      );
    } catch {
      openErrorOverlay("Excel файлыг уншиж чадсангүй");
    }
  };

  const fetchFreshOrg = async () => {
    if (!token || !baiguullaga?._id) return null;
    const res = await uilchilgee(token).get(`/baiguullaga/${baiguullaga._id}`, {
      headers: { "X-Org-Only": "1" },
    });
    return res.data;
  };

  const khayagiinTokhirgoo = () => ({
    ...(duureg && { duuregNer: duureg, districtCode: duureg + (horoo || "") }),
    ...(horoo && { horoo: { ner: horoo, kod: horoo } }),
  });

  const davkharJagsaalt = () => [
    ...Array.from({ length: davNum }, (_, i) => String(i + 1)),
    ...Array.from({ length: zogsoolNum }, (_, i) => `B${i + 1}`),
  ];

  const shineKhadgalakh = async (org: any, name: string) => {
    const baiguullagiinId = String(baiguullaga?._id || "");
    const newBuilding: any = {
      ner: name,
      baiguullagiinId,
      tokhirgoo: {
        orts: String(ortsNum),
        davkhar: davkharJagsaalt(),
        ...(Object.keys(davkhariinToonuud).length > 0 && { davkhariinToonuud }),
        ...khayagiinTokhirgoo(),
      },
    };
    const existing = org.barilguud || [];
    const res = await createMethod(`baiguullaga/${baiguullagiinId}`, token, {
      ...org,
      barilguud: [...existing, newBuilding],
    });
    const serverData = res?.data?.result || res?.data;
    if (serverData) {
      await baiguullagaMutate(serverData, false);
      const existingIds = new Set(existing.map((b: any) => String(b._id)));
      const created = (serverData.barilguud || []).find(
        (b: any) => b.ner === name && !existingIds.has(String(b._id)),
      );
      if (created?._id) setSelectedBuildingId(String(created._id));
    }
  };

  const zasvarKhadgalakh = async (org: any, name: string) => {
    const updated = (org.barilguud || []).map((b: any) => {
      if (String(b._id) !== id) return b;

      // Хасагдсан зогсоолын давхрын (B) нэгжийг цэвэрлэнэ
      const zogsoolMap = { ...((b.tokhirgoo?.davkhariinZogsoolnuud || {}) as Record<string, any>) };
      Object.keys(zogsoolMap).forEach((k) => {
        const f = String(k.includes("::") ? k.split("::")[1] : k).trim();
        const m = f.match(/^b(\d+)$/i);
        if (m && parseInt(m[1], 10) > zogsoolNum) delete zogsoolMap[k];
      });

      // Тоот: хүрээнээс гарсан энгийн давхрыг устгаад, хүснэгтийн утгаар дарна
      const tootMap = { ...((b.tokhirgoo?.davkhariinToonuud || {}) as Record<string, any>) };
      Object.keys(tootMap).forEach((k) => {
        const [o, f] = k.includes("::") ? k.split("::") : ["", k];
        const m = String(f).trim().match(/^(\d+)$/);
        if (!m) return; // B давхар гэх мэтэд хүрэхгүй
        const fNum = parseInt(m[1], 10);
        const oNum = parseInt(String(o || "0"), 10) || 0;
        if (fNum > davNum || (o && ortsNum > 0 && oNum > ortsNum)) delete tootMap[k];
      });
      ortsguiTulkhuuruud.forEach((k) => delete tootMap[k]);
      ortsuud.forEach((o) =>
        davkharuud.forEach((d) => {
          const k = tootiinTulkhuur(o, d);
          if (davkhariinToonuud[k]) tootMap[k] = davkhariinToonuud[k];
          else delete tootMap[k];
        }),
      );

      const davkharuudShuusen = Array.isArray(b.davkharuud)
        ? b.davkharuud.filter((d: any) => {
            const s = String(d?.davkhar ?? d).trim();
            const bm = s.match(/^b(\d+)$/i);
            if (bm) return parseInt(bm[1], 10) <= zogsoolNum;
            const nm = s.match(/^(\d+)$/);
            if (nm) return parseInt(nm[1], 10) <= davNum;
            return true;
          })
        : b.davkharuud;

      return {
        ...b,
        ner: name,
        tokhirgoo: {
          ...(b.tokhirgoo || {}),
          orts: String(ortsNum),
          davkhar: davkharJagsaalt(),
          davkhariinZogsoolnuud: zogsoolMap,
          davkhariinToonuud: tootMap,
          ...khayagiinTokhirgoo(),
        },
        ...(davkharuudShuusen !== undefined ? { davkharuud: davkharuudShuusen } : {}),
      };
    });
    const res = await updateMethod("baiguullaga", token, { ...org, barilguud: updated });
    if (res?.data) await baiguullagaMutate(res.data.result || res.data, false);
  };

  const khadgalakh = async () => {
    if (!token) return openErrorOverlay("Нэвтрэх шаардлагатай");
    if (!baiguullaga?._id) return openErrorOverlay("Байгууллагын мэдээлэл олдсонгүй");
    const name = ner.trim();
    if (!name) return openErrorOverlay("Барилгын нэр оруулна уу");
    if (davNum <= 0) return openErrorOverlay("Барилгын давхарын тоо оруулна уу");
    if (davkhardsanToot.length > 0) {
      return openErrorOverlay(`Давхардсан тоот байна: ${davkhardsanToot.slice(0, 10).join(", ")}`);
    }

    setIsSaving(true);
    try {
      const org = await fetchFreshOrg();
      if (!org) {
        openErrorOverlay("Байгууллагын мэдээлэл шинэчлэхэд алдаа гарлаа");
        return;
      }
      if (shine) await shineKhadgalakh(org, name);
      else await zasvarKhadgalakh(org, name);
      await baiguullagaMutate();
      openSuccessOverlay(shine ? "Шинэ барилга амжилттай нэмэгдлээ" : "Барилга амжилттай засагдлаа");
      router.push(BUTSAKH_KHAYAG);
    } catch {
      openErrorOverlay(shine ? "Шинэ барилга нэмэх явцад алдаа гарлаа" : "Барилга засах явцад алдаа гарлаа");
    } finally {
      setIsSaving(false);
    }
  };

  if (!shine && baiguullaga && !barilga) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center text-[color:var(--muted-text)]">
        Барилга олдсонгүй.{" "}
        <Link href={BUTSAKH_KHAYAG} className="text-brand underline">
          Буцах
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5">
      {/* Толгой */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={BUTSAKH_KHAYAG}
            className="rounded-lg p-2 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
            title="Буцах"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Building2 className="h-5 w-5 text-brand" />
          <div>
            <h1 className="text-xl text-[color:var(--panel-text)]">
              {shine ? "Шинэ барилга нэмэх" : `Барилга засах${barilga?.ner ? ` — ${barilga.ner}` : ""}`}
            </h1>
            <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
              Барилгын мэдээлэл, орц, давхар болон тоотуудыг оруулна
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push(BUTSAKH_KHAYAG)} disabled={isSaving}>
            Болих
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={khadgalakh}
            id="barilgiin-new-save"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Хадгалах
          </Button>
        </div>
      </div>

      {/* Зүүн (30%): барилгын мэдээлэл · Баруун (70%): тоот бүртгэл */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[3fr_7fr]">
      <div className="space-y-6 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5">
        {/* Нэр */}
        <div className="space-y-2">
          <label className="block text-sm text-[color:var(--panel-text)]">
            Барилгын нэр <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={ner}
            onChange={(e) => setNer(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Жишээ: А барилга, Б барилга..."
            className={INPUT_CLASS}
          />
        </div>

        {/* Байршил */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--surface-border)] pb-2">
            <MapPin className="h-4 w-4 text-brand" />
            <h2 className="text-sm text-[color:var(--panel-text)]">Байршил</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-[color:var(--panel-text)]">Дүүрэг</label>
              <TusgaiZagvar
                value={duureg}
                onChange={(v) => {
                  setDuureg(v);
                  setHoroo("");
                }}
                options={Object.keys(districts).flatMap((city) =>
                  districts[city].map((d) => ({ value: d, label: d })),
                )}
                placeholder="Дүүрэг сонгоно уу"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-[color:var(--panel-text)]">Хороо</label>
              <TusgaiZagvar
                value={horoo}
                onChange={(v) => setHoroo(v)}
                options={(subDistricts[duureg] || []).map((h) => ({ value: h, label: h }))}
                placeholder={duureg ? "Хороо сонгоно уу" : "Эхлээд дүүрэг сонгоно уу"}
                className="w-full"
                disabled={!duureg}
              />
            </div>
          </div>
        </div>

        {/* Орц, давхар */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--surface-border)] pb-2">
            <Home className="h-4 w-4 text-brand" />
            <h2 className="text-sm text-[color:var(--panel-text)]">Барилгын дэлгэрэнгүй</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(
              [
                ["Нийт орцын тоо", ortsCount, setOrtsCount, true],
                ["Нийт давхарын тоо", davkharCount, setDavkharCount, true],
                ["Зогсоолын давхарын тоо (B1, B2...)", zogsoolCount, setZogsoolCount, false],
              ] as const
            ).map(([label, val, setVal, zaaval]) => (
              <div key={label} className="space-y-2">
                <label className="block text-sm text-[color:var(--panel-text)]">
                  {label} {zaaval && <span className="text-danger">*</span>}
                </label>
                <input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => setVal(e.target.value === "" ? "" : Number(e.target.value))}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
        </div>

      </div>

        {/* Тоот бүртгэл */}
        <div className="min-w-0 space-y-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--surface-border)] pb-2">
            <Home className="h-4 w-4 text-brand" />
            <h2 className="text-sm text-[color:var(--panel-text)]">Тоот бүртгэл</h2>
            <span className="text-xs text-[color:var(--muted-text)]">
              {niitToot > 0 ? `${niitToot} тоот` : "Заавал биш — «Тоот бүртгэл» хуудаснаас ч нэмж болно"}
            </span>
          </div>

          {/* Excel — «Орц | Давхар | Тоот» */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={excelUnshikh}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => excelInputRef.current?.click()}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Excel-ээс оруулах
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={excelZagvarTatakh}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Загвар татах
            </Button>
            <span className="text-xs text-[color:var(--muted-text)]">
              Багана: Орц, Давхар, Тоот — мөр бүрт нэг тоот
            </span>
          </div>

          {davNum === 0 ? (
            <p className="text-xs text-[color:var(--muted-text)]">
              Орц, давхрын тоог оруулбал (эсвэл Excel оруулбал) давхар бүрийн тоот оруулах талбар гарна.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <label className="block text-xs text-[color:var(--muted-text)]">
                    Давхар бүрийн тоотын тоо
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={davkhartTootToo}
                    onChange={(e) => setDavkhartTootToo(e.target.value === "" ? "" : Number(e.target.value))}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Жишээ: 4"
                    className="w-32 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-sm text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={avtomataarBuglukh}>
                  Автоматаар бөглөх
                </Button>
                {niitToot > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      // Идэвхтэй (гэрээтэй) тоотууд үлдэнэ
                      setTootBichvner((prev) => {
                        const next: Record<string, string> = {};
                        ortsuud.forEach((o) =>
                          davkharuud.forEach((d) => {
                            const k = tootiinTulkhuur(o, d);
                            const uldekh = tootJagsaalt(prev[k]).filter((t) => idevkhteiEsekh(o, d, t));
                            if (uldekh.length) next[k] = uldekh.join(", ");
                          }),
                        );
                        return next;
                      })
                    }
                  >
                    Цэвэрлэх
                  </Button>
                )}
              </div>
              <p className="text-xs text-[color:var(--muted-text)]">
                Нүдэнд тоот бичээд Enter дарж нэмнэ (таслалаар олныг нэг дор). Ногоон цэгтэй нь
                идэвхтэй (гэрээтэй) тоот — хасах боломжгүй.
              </p>

              <div className="overflow-x-auto rounded-xl border border-[color:var(--surface-border)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[color:var(--surface-hover)]">
                      <th className="w-24 px-3 py-2 text-left text-xs font-normal text-[color:var(--muted-text)]">
                        Давхар
                      </th>
                      {ortsuud.map((o) => (
                        <th
                          key={o || "orts"}
                          className="min-w-[220px] px-3 py-2 text-center text-xs font-normal text-[color:var(--muted-text)]"
                        >
                          {o ? `${o}-р орц` : "Тоот"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...davkharuud].reverse().map((d) => (
                      <tr key={d} className="border-t border-[color:var(--surface-border)]">
                        <td className="px-3 py-1.5 text-[color:var(--panel-text)]">{d}-р давхар</td>
                        {ortsuud.map((o) => {
                          const k = tootiinTulkhuur(o, d);
                          const toonuud = tootJagsaalt(tootBichvner[k]);
                          return (
                            <td key={k} className="px-2 py-1.5">
                              <TootNud
                                toonuud={toonuud}
                                idevkhtei={(t) => idevkhteiEsekh(o, d, t)}
                                davkhardsan={(t) => davkhardsanToot.includes(t)}
                                onChange={(next) =>
                                  setTootBichvner((prev) => ({ ...prev, [k]: next.join(", ") }))
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {davkhardsanToot.length > 0 && (
                <p className="text-xs text-danger">
                  Давхардсан тоот: {davkhardsanToot.slice(0, 10).join(", ")}
                  {davkhardsanToot.length > 10 ? "…" : ""}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
