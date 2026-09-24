import React, { useMemo } from "react";
import { Tooltip } from "antd";
import formatNumber from "tools/function/formatNumber";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";

export interface ZardalItem {
  ner?: string;
  turul?: string;
  dun: number;
  tailbar?: string;
  toot?: string;
}

export function isParkingCharge(name?: string, turul?: string): boolean {
  const n = (name || "").trim().toLowerCase();
  const t = (turul || "").trim().toLowerCase();
  if (t === "зогсоол" || t === "гараж") return true;
  if (!n) return false;
  if (n.includes("зочны")) return false;
  return n.includes("зогсоол") || n.includes("гараж");
}

export function extractParkingToot(z: { ner?: string; tailbar?: string; toot?: string }, fallbackToot?: string): string {
  if (z.toot && String(z.toot).trim()) {
    return String(z.toot).replace(/^тоот\s*[:#-]?\s*/i, "").trim();
  }
  const text = `${z.ner || ""} ${z.tailbar || ""}`.trim();
  if (!text) return fallbackToot ? String(fallbackToot).trim() : "";

  // 1. Matches "тоот: 101", "тоот 101", "тоот-101", "тоот #101", "(тоот 101)"
  const m1 = text.match(/тоот\s*[:#-]?\s*([a-zA-Z0-9_\u0400-\u04FF-]+)/i);
  if (m1 && m1[1]) {
    return m1[1].replace(/[()]/g, "").trim();
  }

  // 2. Matches "(B1-02)" or "(12)" right after zogsool/garaj
  const m2 = text.match(/(?:зогсоол|гараж)[^\d(]*\(([a-zA-Z0-9_\u0400-\u04FF-]+)\)/i);
  if (m2 && m2[1]) {
    const candidate = m2[1].trim();
    if (!/^(нэхэмжлэх|авлага|бусад|төлбөр)/i.test(candidate)) {
      return candidate.replace(/^тоот\s*[:#-]?\s*/i, "").trim();
    }
  }

  // 3. Matches "зогсоол 12" or "гараж 12"
  const m3 = text.match(/(?:зогсоол|гараж)\s+([a-zA-Z0-9_\u0400-\u04FF-]+)/i);
  if (m3 && m3[1]) {
    const candidate = m3[1].trim();
    if (!/^(төлбөр|хураамж|авлага|сарын)/i.test(candidate)) {
      return candidate.replace(/^тоот\s*[:#-]?\s*/i, "").trim();
    }
  }

  return fallbackToot ? String(fallbackToot).trim() : "";
}

export interface AvlagaItem {
  ognoo: string;
  tailbar: string;
  tulukhDun: number;
  toot?: string;
  zardluud?: ZardalItem[];
  khungulultuud?: any[];
}

export interface NegtgelTailanItem {
  _id?: any;
  gereeniiId?: string;
  gereeniiDugaar?: string;
  register?: string;
  ovog?: string;
  ner?: string;
  utas?: string | string[];
  toot?: string;
  davkhar?: string;
  bairNer?: string;
  orts?: string;
  niitTulukhDun?: number;
  niitKhungulult?: number;
  niitTulsunDun?: number;
  niitUldegdel?: number;
  globalUldegdel?: number;
  invoiceToo?: number;
  avlaga: AvlagaItem[];
}

interface NegtgelTailanTableProps {
  data: NegtgelTailanItem[];
  loading: boolean;
  /**
   * Серверээс ирсэн, хайлт/огнооны шүүлтийн дараах БҮХ бичлэгийн нийт дүн.
   * Өгөөгүй тохиолдолд зөвхөн харагдаж буй хуудсаар нийлбэрлэнэ.
   */
  niitUldegdel?: number;
  /**
   * Сонгосон сарын хүрээ ("YYYY-MM" хэлбэрээр). Өгсөн бол зөвхөн энэ хүрээнд
   * багтах сарын баганыг харуулна.
   */
  sarKhuree?: [string, string];
}

/* ── Загвар ───────────────────────────────────────────────────────────────
   Зааглах зураасыг border биш inset сүүдрээр зурна: border-collapse дээр
   зузаан хүрээ толгой/их биеийн нүдийг өөр өөрөөр шилжүүлж зураас таарахгүй
   болгодог, sticky нүдэн дээр ч хамт гүйдэггүй. Сүүдэр байршлыг хөдөлгөхгүй. */
// Класс нь globals.css-ийн `.negtgel-table` хэсэгт: нүд бүр 1px саарал
// босоо зураастай, сарын зааг тодхон, «Нийт»-ийн өмнө ганц зураас.
const BARUUN_ZAAG = "ng-zaag";
const ZUUN_ZAAG = "ng-niit";
const ZAAGGUI = "ng-zaaggui";

// Баруун талд түгжигдсэн «Нийт» бүлгийн баганууд (өргөн нь нийлбэр мөрийн
// sticky зайг тооцоход хэрэгтэй)
const NIIT_URGUN = { bodogdson: 110, khungulult: 100, uldegdel: 115 } as const;

const tooKharuul = (v: number) => (v > 0 ? formatNumber(v, 2) : "");

/** "2026-09" → "2026 · 9-р сар" */
const sarNer = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${y} · ${Number(m)}-р сар`;
};

const ognooSar = (b: AvlagaItem) => (b.ognoo ? b.ognoo.slice(0, 7) : "");

const khuvilbar = (b: AvlagaItem): ZardalItem[] =>
  Array.isArray(b.zardluud) && b.zardluud.length > 0
    ? b.zardluud
    : [{ ner: b.tailbar, dun: b.tulukhDun, turul: "Бусад", toot: b.toot }];

/** Баганын толгойд гаргахгүй ерөнхий/хог нэрс */
const khogNerEsekh = (n: string) =>
  !n ||
  n === "Бусад" ||
  n === "Бусад зардал" ||
  n === "Нэхэмжлэх" ||
  n === "Авлага" ||
  n === "Авлага (Нэхэмжлэхгүй)" ||
  n === "Найрамдал" ||
  n.length > 50;

interface MurniiDun {
  /** `${ym}|${tailbar}` → дүн */
  nud: Map<string, number>;
  /** `${ym}` → зогсоолын тоот бүрийн дүн */
  zogsool: Map<string, [string, number][]>;
  /** `${ym}` → тухайн сарын нийт (хөнгөлөлтгүй) */
  sar: Map<string, number>;
  bodogdson: number;
  khungulult: number;
  uldegdel: number;
}

function murniiDunBodyo(
  record: NegtgelTailanItem,
  turluud: { tailbar: string; ognoo: string }[],
): MurniiDun {
  const nud = new Map<string, number>();
  const zogsool = new Map<string, Map<string, number>>();
  const sar = new Map<string, number>();
  const baganuud = new Set(turluud.map((t) => `${t.ognoo}|${t.tailbar}`));
  const nemekh = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) || 0) + v);

  let khungulult = 0;
  (record.avlaga || []).forEach((b) => {
    const ym = ognooSar(b);
    const sarTai = turluud.some((t) => t.ognoo === ym);
    khuvilbar(b).forEach((z) => {
      const dun = Number(z.dun || 0);
      const zName = (z.ner || "").trim();
      if (zName === "Хөнгөлөлт" || z.turul === "Хөнгөлөлт") khungulult += Math.abs(dun);
      if (!sarTai || dun <= 0) return;
      if (isParkingCharge(zName, z.turul)) {
        const toot = extractParkingToot(z, b.toot);
        const m = zogsool.get(ym) || new Map<string, number>();
        nemekh(m, toot, dun);
        zogsool.set(ym, m);
        nemekh(nud, `${ym}|Зогсоол`, dun);
        nemekh(sar, ym, dun);
        return;
      }
      const key = `${ym}|${zName}`;
      if (!baganuud.has(key)) return;
      nemekh(nud, key, dun);
      if (zName !== "Хөнгөлөлт") nemekh(sar, ym, dun);
    });
    (b.khungulultuud || []).forEach((k: any) => {
      const v = Number(k.dun || k.khungulultiinDun || 0);
      khungulult += v;
      if (sarTai) nemekh(nud, `${ym}|Хөнгөлөлт`, v);
    });
  });

  const serveriinKhungulult = Number((record as any).niitKhungulult || 0);
  return {
    nud,
    zogsool: new Map(Array.from(zogsool.entries()).map(([k, m]) => [k, Array.from(m.entries())])),
    sar,
    bodogdson: Array.from(sar.values()).reduce((s, v) => s + v, 0),
    khungulult: serveriinKhungulult > 0 ? serveriinKhungulult : khungulult,
    uldegdel: Number(record.niitUldegdel ?? record.globalUldegdel ?? record.niitTulukhDun ?? 0),
  };
}

const TolgoiBichver = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <span className="block truncate" title={title}>
    {children}
  </span>
);

export function NegtgelTailanTable({ data, loading, niitUldegdel, sarKhuree }: NegtgelTailanTableProps) {
  const murnuud = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // ── Сар, зардлын төрлүүд (баганууд) ────────────────────────────────────
  const { months, avlagaTypes } = useMemo(() => {
    const monthSet = new Set<string>();
    const avlagaMap = new Map<string, { tailbar: string; ognoo: string }>();

    murnuud.forEach((row) => {
      (row.avlaga || []).forEach((b) => {
        const ym = ognooSar(b);
        if (!ym) return;
        if (sarKhuree && (ym < sarKhuree[0] || ym > sarKhuree[1])) return;
        khuvilbar(b).forEach((z) => {
          if (Number(z.dun) <= 0) return;
          let zName = (z.ner || "").trim();
          if (khogNerEsekh(zName)) return;
          if (isParkingCharge(zName, z.turul)) zName = "Зогсоол";
          monthSet.add(ym);
          const key = `${ym}|${zName}`;
          if (!avlagaMap.has(key)) avlagaMap.set(key, { tailbar: zName, ognoo: ym });
        });
        if ((b.khungulultuud || []).length > 0) {
          monthSet.add(ym);
          const key = `${ym}|Хөнгөлөлт`;
          if (!avlagaMap.has(key)) avlagaMap.set(key, { tailbar: "Хөнгөлөлт", ognoo: ym });
        }
      });
    });

    // Эрэмбэ: Эхний үлдэгдэл → бусад (цагаан толгойгоор) → Зогсоол → Хөнгөлөлт
    const jin = (t: string) =>
      t.includes("Эхний үлдэгдэл") ? 0 : t === "Хөнгөлөлт" ? 3 : t === "Зогсоол" ? 2 : 1;
    const avlagaTypes = Array.from(avlagaMap.values()).sort((a, b) => {
      if (a.ognoo !== b.ognoo) return a.ognoo.localeCompare(b.ognoo);
      if (jin(a.tailbar) !== jin(b.tailbar)) return jin(a.tailbar) - jin(b.tailbar);
      return a.tailbar.localeCompare(b.tailbar);
    });
    return { months: Array.from(monthSet).sort(), avlagaTypes };
  }, [murnuud, sarKhuree?.[0], sarKhuree?.[1]]);

  // ── Мөр бүрийн дүнг НЭГ удаа бодно (нүд, нийлбэр мөр хоёулаа ашиглана) ──
  const dunMap = useMemo(() => {
    const m = new WeakMap<NegtgelTailanItem, MurniiDun>();
    murnuud.forEach((r) => m.set(r, murniiDunBodyo(r, avlagaTypes)));
    return m;
  }, [murnuud, avlagaTypes]);
  const dunAvya = (r: NegtgelTailanItem) => dunMap.get(r) || murniiDunBodyo(r, avlagaTypes);

  const olonSar = months.length > 1;

  const columns = useMemo<ColumnsType<NegtgelTailanItem>>(() => {
    const cols: ColumnsType<NegtgelTailanItem> = [
      {
        key: "index",
        title: "№",
        width: 44,
        align: "center",
        fixed: "left",
        render: (_: any, __: any, index: number) => (
          <span className="tabular-nums text-[hsl(var(--zt-muted-fg))]">{index + 1}</span>
        ),
      },
      {
        key: "ner",
        title: <TolgoiBichver>Оршин суугч</TolgoiBichver>,
        width: 150,
        align: "left",
        fixed: "left",
        render: (_: any, record) => {
          const ovog = String(record._id?.ovog || record.ovog || "").trim();
          const ner = String(record._id?.ner || record.ner || "").trim();
          const buten = [ovog ? `${ovog.charAt(0)}.` : "", ner].filter(Boolean).join(" ") || "-";
          return (
            <span className="block truncate" title={[ovog, ner].filter(Boolean).join(" ")}>
              {buten}
            </span>
          );
        },
      },
      {
        key: "toot",
        title: "Тоот",
        width: 60,
        align: "center",
        fixed: "left",
        render: (_: any, record) => record._id?.toot || record.toot || "-",
      },
      {
        key: "orts",
        title: "Орц",
        width: 50,
        align: "center",
        fixed: "left",
        render: (_: any, record) => record._id?.orts || record.orts || "-",
      },
      {
        key: "utas",
        title: "Утас",
        width: 90,
        align: "center",
        fixed: "left",
        className: BARUUN_ZAAG,
        render: (_: any, record) => {
          const u = record._id?.utas || record.utas;
          return <span className="tabular-nums">{(Array.isArray(u) ? u[0] : u) || "-"}</span>;
        },
      },
    ];

    months.forEach((ym) => {
      const turluud = avlagaTypes.filter((v) => v.ognoo === ym);
      if (turluud.length === 0) return;

      const khuukhed: ColumnsType<NegtgelTailanItem> = turluud.map((t) => {
        const zogsoolEsekh = t.tailbar === "Зогсоол";
        const khungEsekh = t.tailbar === "Хөнгөлөлт";
        return {
          key: `${ym}|${t.tailbar}`,
          title: <TolgoiBichver title={t.tailbar}>{t.tailbar}</TolgoiBichver>,
          width: zogsoolEsekh ? 115 : 105,
          align: "right" as const,
          render: (_: any, record: NegtgelTailanItem) => {
            const d = dunAvya(record);
            const dun = d.nud.get(`${ym}|${t.tailbar}`) || 0;
            if (dun <= 0) return "";
            if (zogsoolEsekh) {
              const entries = d.zogsool.get(ym) || [];
              return (
                <Tooltip
                  title={
                    <div className="space-y-0.5 text-xs">
                      {entries.map(([toot, v]) => (
                        <div key={toot || "_"} className="flex justify-between gap-4">
                          <span>{toot ? `${toot} тоот` : "Зогсоол"}</span>
                          <span className="tabular-nums">{formatNumber(v, 2)}</span>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                    {entries.length > 1 && (
                      <span className="rounded bg-[hsl(var(--zt-muted))] px-1 text-[10px] text-[hsl(var(--zt-muted-fg))]">
                        {entries.length}
                      </span>
                    )}
                    {formatNumber(dun, 2)}
                  </span>
                </Tooltip>
              );
            }
            return (
              <span className={`tabular-nums ${khungEsekh ? "text-brand" : ""}`}>
                {khungEsekh ? "−" : ""}
                {formatNumber(dun, 2)}
              </span>
            );
          },
        };
      });

      // Олон сар сонгосон үед сар бүрийн дэд дүн
      if (olonSar) {
        khuukhed.push({
          key: `${ym}|__sar`,
          title: "Сарын дүн",
          width: 110,
          align: "right",
          render: (_: any, record: NegtgelTailanItem) => (
            <span className="tabular-nums text-[hsl(var(--zt-muted-fg))]">
              {tooKharuul(dunAvya(record).sar.get(ym) || 0)}
            </span>
          ),
        });
      }
      // Сарын сүүлийн баганад зааг; хамгийн сүүлийн сард «Нийт»-ийн зүүн
      // зураастай давхардахгүйн тулд зураасгүй
      const suuliinSarEsekh = ym === months[months.length - 1];
      const suuliin = khuukhed[khuukhed.length - 1] as any;
      suuliin.className = suuliinSarEsekh ? ZAAGGUI : BARUUN_ZAAG;

      cols.push({
        key: `group-${ym}`,
        title: sarNer(ym),
        align: "center",
        className: ym === months[months.length - 1] ? ZAAGGUI : BARUUN_ZAAG,
        children: khuukhed,
      });
    });

    cols.push({
      key: "niit",
      title: "Нийт",
      align: "center",
      fixed: "right",
      className: ZUUN_ZAAG,
      children: [
        {
          key: "niitBodogdson",
          title: "Бодогдсон",
          width: NIIT_URGUN.bodogdson,
          align: "right",
          fixed: "right",
          className: ZUUN_ZAAG,
          render: (_: any, record) => (
            <span className="tabular-nums">{tooKharuul(dunAvya(record).bodogdson) || "-"}</span>
          ),
        },
        {
          key: "niitKhungulult",
          title: "Хөнгөлөлт",
          width: NIIT_URGUN.khungulult,
          align: "right",
          fixed: "right",
          render: (_: any, record) => {
            const v = dunAvya(record).khungulult;
            return v > 0 ? (
              <span className="tabular-nums text-brand">−{formatNumber(v, 2)}</span>
            ) : (
              <span className="text-[hsl(var(--zt-muted-fg))]">-</span>
            );
          },
        },
        {
          key: "niitUldegdel",
          title: "Үлдэгдэл",
          width: NIIT_URGUN.uldegdel,
          align: "right",
          fixed: "right",
          render: (_: any, record) => {
            const v = dunAvya(record).uldegdel;
            return (
              <span
                className={`tabular-nums ${
                  v > 0 ? "text-danger" : v < 0 ? "text-success" : "text-[hsl(var(--zt-muted-fg))]"
                }`}
              >
                {formatNumber(v, 2)}
              </span>
            );
          },
        },
      ],
    });

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dunAvya нь dunMap-аас хамаарна
  }, [months, avlagaTypes, dunMap, olonSar]);

  // ── Нийлбэр мөр ───────────────────────────────────────────────────────
  const niilber = useMemo(() => {
    const nud = new Map<string, number>();
    const sar = new Map<string, number>();
    let bodogdson = 0;
    let khungulult = 0;
    let uldegdel = 0;
    murnuud.forEach((r) => {
      const d = dunAvya(r);
      d.nud.forEach((v, k) => nud.set(k, (nud.get(k) || 0) + v));
      d.sar.forEach((v, k) => sar.set(k, (sar.get(k) || 0) + v));
      bodogdson += d.bodogdson;
      khungulult += d.khungulult;
      uldegdel += d.uldegdel;
    });
    return { nud, sar, bodogdson, khungulult, uldegdel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [murnuud, dunMap]);

  // Сервер бүх хуудсыг хамарсан үлдэгдэл өгсөн бол түүнийг
  const niitUldegdelKharuulakh =
    typeof niitUldegdel === "number" && Number.isFinite(niitUldegdel) ? niitUldegdel : niilber.uldegdel;
  const khuudasKhesegKhen = Math.abs(niitUldegdelKharuulakh - niilber.uldegdel) >= 0.01;

  const summary = () => {
    const cells: React.ReactNode[] = [];
    // «Нийт» бүлгийн 3 навч багана хамгийн сүүлд — индексээр бодит зайг авна
    const navchToo =
      5 +
      months.reduce((s, ym) => {
        const n = avlagaTypes.filter((v) => v.ognoo === ym).length;
        return s + (n ? n + (olonSar ? 1 : 0) : 0);
      }, 0);
    let i = 0;
    cells.push(
      <Table.Summary.Cell key="lbl" index={i++} colSpan={5} fixed="left" className={`text-[12px] ${BARUUN_ZAAG}`}>
        Нийт {murnuud.length} мөр
      </Table.Summary.Cell>,
    );
    months.forEach((ym) => {
      const turluud = avlagaTypes.filter((v) => v.ognoo === ym);
      if (turluud.length === 0) return;
      const keys = turluud.map((t) => `${ym}|${t.tailbar}`);
      if (olonSar) keys.push(`${ym}|__sar`);
      keys.forEach((k, idx) => {
        const v = k.endsWith("|__sar") ? niilber.sar.get(ym) || 0 : niilber.nud.get(k) || 0;
        const khung = k.endsWith("|Хөнгөлөлт");
        cells.push(
          <Table.Summary.Cell
            key={k}
            index={i++}
            align="right"
            className={`tabular-nums ${khung ? "text-brand" : ""} ${
              idx === keys.length - 1 ? (ym === months[months.length - 1] ? ZAAGGUI : BARUUN_ZAAG) : ""
            }`}
          >
            {v > 0 ? `${khung ? "−" : ""}${formatNumber(v, 2)}` : ""}
          </Table.Summary.Cell>,
        );
      });
    });
    cells.push(
      <Table.Summary.Cell
        key="bod"
        index={i++}
        align="right"
        fixed="right"
        leafIndex={navchToo}
        className={`tabular-nums ${ZUUN_ZAAG}`}
      >
        {formatNumber(niilber.bodogdson, 2)}
      </Table.Summary.Cell>,
      <Table.Summary.Cell
        key="khung"
        index={i++}
        align="right"
        fixed="right"
        leafIndex={navchToo + 1}
        className="tabular-nums text-brand"
      >
        {niilber.khungulult > 0 ? `−${formatNumber(niilber.khungulult, 2)}` : "-"}
      </Table.Summary.Cell>,
      <Table.Summary.Cell key="uld" index={i++} align="right" fixed="right" leafIndex={navchToo + 2} className="tabular-nums">
        <Tooltip title={khuudasKhesegKhen ? `Энэ хуудас: ${formatNumber(niilber.uldegdel, 2)}` : undefined}>
          <span className={niitUldegdelKharuulakh > 0 ? "text-danger" : ""}>
            {formatNumber(niitUldegdelKharuulakh, 2)}
          </span>
        </Tooltip>
      </Table.Summary.Cell>,
    );
    return <Table.Summary.Row>{cells}</Table.Summary.Row>;
  };

  return (
    <Table<NegtgelTailanItem>
      className="negtgel-table"
      columns={columns}
      dataSource={murnuud}
      rowKey={(r, i) => `${r.gereeniiId || r._id?.gereeniiId || r.gereeniiDugaar || ""}-${i}`}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ x: "max-content" }}
      summary={summary}
      locale={{ emptyText: "Сонгосон хугацаанд мэдээлэл алга" }}
    />
  );
}
