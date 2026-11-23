"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Info, Pencil, Plus, Printer, Trash2, Wallet, X } from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import FilterSelect from "@/components/ui/FilterSelect";
import ExcelButton from "@/components/ui/ExcelButton";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Table from "@/components/ui/table";
import ModalPortal from "../../../../../components/shell/ModalPortal";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { hasPermission } from "@/lib/permissionUtils";
import { shaltgaanAsuuya } from "@/lib/shaltgaan";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";

/**
 * Шилэн данс — СӨХ-ийн дансны үлдэгдэл, орлого, зарлага, авлага.
 *
 * Банкны хуулга (CGW) ашиглахгүй, бүгд гараар:
 *  - Эхний үлдэгдлийг ажилтан огноотой нь оруулна.
 *  - Орлого = оршин суугчдын төлсөн мөнгө, авлага = төлөөгүй мөнгө.
 *  - Бусад орлого, зарлагыг ажилтан «Гүйлгээ нэмэх»-ээр гараар бүртгэнэ.
 * Өгөгдөл: sukhBackv2 controller/shilenDans.js.
 */

type GuilgeeTurul = "orlogo" | "zarlaga";

interface GuilgeeMur {
  _id: string;
  turul: GuilgeeTurul;
  ognoo: string;
  dun: number;
  angilal: string;
  tailbar?: string;
  ajiltniiNer?: string;
}

interface ShilenDansKhariu {
  zarlagiinAngilaluud: string[];
  orlogiinAngilaluud: string[];
  ekhniiUldegdelBichlel: { ognoo: string; dun: number; ajiltniiNer: string } | null;
  ekhniiUldegdel: number | null;
  orlogo: number;
  tulsunOrlogo: number;
  garOrlogo: number;
  zarlaga: number;
  etssiinUldegdel: number | null;
  avlaga: number;
  guilgeenuud: GuilgeeMur[];
  orlogoAngilalaar: { angilal: string; dun: number }[];
  zarlagaAngilalaar: { angilal: string; dun: number }[];
  zogsool: {
    niit: number;
    turlaar: { turul: string; dun: number }[];
  } | null;
}

const TULBURIIN_KHELBER: Record<string, string> = {
  belen: "Бэлэн",
  cash: "Бэлэн",
  khaan: "Хаан банк",
  qpay: "QPay",
  card: "Карт",
  kart: "Карт",
  dans: "Данс",
  busad: "Бусад",
};
const khelberNer = (k: string) => TULBURIIN_KHELBER[String(k).toLowerCase()] || k;

function ognooKharuul(utga: string | null | undefined): string {
  if (!utga) return "-";
  const d = new Date(utga);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const mungu = (v: number | null | undefined) =>
  v === null || v === undefined ? "-" : formatNumber(v, 2);

const aldaaZurvas = (err: any, ankhdagch: string) =>
  err?.response?.data?.message || err?.response?.data?.aldaa || err?.message || ankhdagch;

const OROLT =
  "h-11 w-full rounded-xl border border-[color:var(--surface-border)] " +
  "bg-[color:var(--surface-bg)] px-3 text-sm text-[color:var(--panel-text)] " +
  "placeholder:text-[color:var(--muted-text)] transition-colors " +
  "focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20";

function Khavtas({
  garchig,
  tailbar,
  uildel,
  children,
}: {
  garchig: string;
  tailbar?: string;
  uildel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)]">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-[color:var(--panel-text)]">{garchig}</h2>
          {tailbar && (
            <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">{tailbar}</p>
          )}
        </div>
        {uildel}
      </div>
      {children}
    </section>
  );
}

function MurUtga({ ner, utga, ungu }: { ner: string; utga: string; ungu?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--ctl-border)] py-2 text-[13px] last:border-b-0">
      <span className="text-[color:var(--muted-text)]">{ner}</span>
      <span className={`font-medium tabular-nums ${ungu || "text-[color:var(--panel-text)]"}`}>
        {utga}
      </span>
    </div>
  );
}

/** Ангиллын задаргаа — мөр бүрт нийтэд эзлэх хувь. */
function AngilalZadargaa({
  garchig,
  niit,
  jagsaalt,
  ungu,
}: {
  garchig: string;
  niit: number;
  jagsaalt: { angilal: string; dun: number }[];
  ungu: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-medium text-[color:var(--muted-text)]">{garchig}</div>
      {jagsaalt.length === 0 ? (
        <div className="text-[13px] text-[color:var(--muted-text)]">—</div>
      ) : (
        jagsaalt.map((a) => {
          const khuvi = niit ? Math.round((a.dun / niit) * 100) : 0;
          return (
            <div key={a.angilal} className="flex items-center gap-3 text-[13px]">
              <span className="w-40 shrink-0 truncate text-[color:var(--panel-text)]">
                {a.angilal}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-theme/10">
                <div className={`h-full rounded-full ${ungu}`} style={{ width: `${khuvi}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right tabular-nums">
                {formatNumber(a.dun, 2)}
              </span>
              <span className="w-10 shrink-0 text-right text-[color:var(--muted-text)]">
                {khuvi}%
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

function Shoshgo({ ner, children }: { ner: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[color:var(--panel-text)]">
        {ner} <span className="text-danger">*</span>
      </span>
      {children}
    </label>
  );
}

/** Энгийн цонх — гарчиг, хаах товч, агуулга, Хадгалах/Болих. */
function Tsonkh({
  garchig,
  onClose,
  onSave,
  khadgalj,
  children,
  tsonkhRef,
}: {
  garchig: string;
  onClose: () => void;
  onSave: () => void;
  khadgalj: boolean;
  children: React.ReactNode;
  tsonkhRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[12000] bg-black/30" onClick={onClose} />
      <div
        ref={tsonkhRef}
        onClick={(e) => e.stopPropagation()}
        // .modal-surface өргөнийг --modal-max-w-ээр хязгаарладаг
        style={{ "--modal-max-w": "440px", width: "min(440px, 95vw)" } as React.CSSProperties}
        className="modal-surface fixed left-1/2 top-1/2 z-[12001] flex -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
          <h2 className="flex-1 text-base font-medium text-[color:var(--panel-text)]">{garchig}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
            aria-label="Хаах"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[color:var(--surface-border)] px-5 py-3">
          <button type="button" onClick={onClose} className="btn-minimal h-9 px-4 text-[13px]">
            Болих
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={khadgalj}
            className="h-9 rounded-[10px] bg-theme px-4 text-[13px] font-medium text-white disabled:opacity-60"
          >
            {khadgalj ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

/**
 * Мөнгөн дүнгийн оролт — бичих явцад «000,000.00» хэлбэрээр харуулна.
 * Утгыг таслалгүй мөр (ж: "1250000.5") болгож дамжуулна; гарахад 2 оронтой.
 */
function dunTseverlekh(utga: string, khasakhZuvshuurukh: boolean): string {
  let s = utga.replace(khasakhZuvshuurukh ? /[^\d.-]/g : /[^\d.]/g, "");
  const khasakh = khasakhZuvshuurukh && s.startsWith("-");
  s = s.replace(/-/g, "");
  const [bukhel, ...busad] = s.split(".");
  const butarkhai = busad.join("").slice(0, 2);
  const tseverBukhel = bukhel.replace(/^0+(?=\d)/, "");
  return (khasakh ? "-" : "") + tseverBukhel + (busad.length ? "." + butarkhai : "");
}

function dunKharuulakh(utga: string): string {
  if (!utga) return "";
  const khasakh = utga.startsWith("-");
  const [bukhel, butarkhai] = utga.replace("-", "").split(".");
  const tasltai = bukhel.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (khasakh ? "-" : "") + tasltai + (butarkhai !== undefined ? "." + butarkhai : "");
}

function DunOrolt({
  value,
  onChange,
  khasakhZuvshuurukh = false,
}: {
  value: string;
  onChange: (v: string) => void;
  khasakhZuvshuurukh?: boolean;
}) {
  return (
    <input
      inputMode="decimal"
      value={dunKharuulakh(value)}
      onChange={(e) => onChange(dunTseverlekh(e.target.value, khasakhZuvshuurukh))}
      onBlur={() => {
        if (!value || value === "-") return;
        const n = Number(value);
        if (Number.isFinite(n)) onChange(n.toFixed(2));
      }}
      placeholder="0.00"
      className={`${OROLT} text-right tabular-nums`}
    />
  );
}

const ognooUtga = (d: any): string => {
  if (!d) return "";
  const v = typeof d?.format === "function" ? d.format("YYYY-MM-DD") : String(d);
  return v.slice(0, 10);
};

export default function ShilenDansPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const zasakhEsekh =
    ajiltan?.erkh?.toLowerCase?.() === "admin" ||
    hasPermission(ajiltan, "sankhuu.shilenDansZasakh") ||
    hasPermission(ajiltan, "/sankhuu/shilenDansZasakh");

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const [data, setData] = useState<ShilenDansKhariu | null>(null);
  const [loading, setLoading] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);
  const [shinechlekh, setShinechlekh] = useState(0);

  // Гүйлгээний (орлого/зарлага) цонх
  const [zarlagaTsonkh, setZarlagaTsonkh] = useState<null | {
    _id?: string;
    turul: GuilgeeTurul;
    ognoo: string;
    dun: string;
    angilal: string;
    tailbar: string;
  }>(null);
  // Эхний үлдэгдлийн цонх
  const [uldegdelTsonkh, setUldegdelTsonkh] = useState<null | { ognoo: string; dun: string }>(
    null,
  );
  const [khadgalj, setKhadgalj] = useState(false);
  const tsonkhRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || !selectedBuildingId) return;
    let tsutslagdsan = false;
    (async () => {
      setLoading(true);
      setAldaa(null);
      try {
        const resp = await uilchilgee(token).post("/shilenDans/tailan", {
          barilgiinId: selectedBuildingId,
          ekhlekhOgnoo: dateRange?.[0] || undefined,
          duusakhOgnoo: dateRange?.[1] || undefined,
        });
        if (!tsutslagdsan) setData(resp.data);
      } catch (err: any) {
        if (!tsutslagdsan) setAldaa(aldaaZurvas(err, "Алдаа гарлаа"));
      } finally {
        if (!tsutslagdsan) setLoading(false);
      }
    })();
    return () => {
      tsutslagdsan = true;
    };
  }, [token, selectedBuildingId, dateRange, shinechlekh]);

  const dakhinAchaalakh = useCallback(() => setShinechlekh((n) => n + 1), []);

  const zarlagaKhadgalakh = async () => {
    if (!zarlagaTsonkh || !token) return;
    const dun = Number(String(zarlagaTsonkh.dun).replace(/[^\d.]/g, ""));
    if (!zarlagaTsonkh.ognoo || !(dun > 0) || !zarlagaTsonkh.angilal) {
      openErrorOverlay("Огноо, дүн, ангиллыг бөглөнө үү");
      return;
    }
    const body = {
      barilgiinId: selectedBuildingId,
      turul: zarlagaTsonkh.turul,
      ognoo: zarlagaTsonkh.ognoo,
      dun,
      angilal: zarlagaTsonkh.angilal,
      tailbar: zarlagaTsonkh.tailbar.trim(),
    };
    setKhadgalj(true);
    try {
      if (zarlagaTsonkh._id) {
        await uilchilgee(token).put(`/shilenDansGuilgee/${zarlagaTsonkh._id}`, body);
      } else {
        await uilchilgee(token).post("/shilenDansGuilgee", body);
      }
      openSuccessOverlay(zarlagaTsonkh._id ? "Гүйлгээ засагдлаа" : "Гүйлгээ нэмэгдлээ");
      setZarlagaTsonkh(null);
      dakhinAchaalakh();
    } catch (err: any) {
      openErrorOverlay(aldaaZurvas(err, "Хадгалахад алдаа гарлаа"));
    } finally {
      setKhadgalj(false);
    }
  };

  const zarlagaUstgakh = async (mur: GuilgeeMur) => {
    if (!token) return;
    const shaltgaan = await shaltgaanAsuuya({
      title: mur.turul === "orlogo" ? "Орлого устгах" : "Зарлага устгах",
      message: `${ognooKharuul(mur.ognoo)} · ${mur.angilal} · ${formatNumber(mur.dun, 2)}₮`,
      confirmLabel: "Устгах",
    });
    if (!shaltgaan) return;
    try {
      await uilchilgee(token).delete(`/shilenDansGuilgee/${mur._id}`);
      openSuccessOverlay("Гүйлгээ устгагдлаа");
      dakhinAchaalakh();
    } catch (err: any) {
      openErrorOverlay(aldaaZurvas(err, "Устгахад алдаа гарлаа"));
    }
  };

  const uldegdelKhadgalakh = async () => {
    if (!uldegdelTsonkh || !token) return;
    const dun = Number(String(uldegdelTsonkh.dun).replace(/[^\d.-]/g, ""));
    if (!uldegdelTsonkh.ognoo || !Number.isFinite(dun) || uldegdelTsonkh.dun === "") {
      openErrorOverlay("Огноо, дүнг бөглөнө үү");
      return;
    }
    const body = { barilgiinId: selectedBuildingId, ognoo: uldegdelTsonkh.ognoo, dun };
    setKhadgalj(true);
    try {
      if (data?.ekhniiUldegdelBichlel) {
        await uilchilgee(token).put("/shilenDans/ekhniiUldegdel", body);
      } else {
        await uilchilgee(token).post("/shilenDans/ekhniiUldegdel", body);
      }
      openSuccessOverlay("Эхний үлдэгдэл хадгалагдлаа");
      setUldegdelTsonkh(null);
      dakhinAchaalakh();
    } catch (err: any) {
      openErrorOverlay(aldaaZurvas(err, "Хадгалахад алдаа гарлаа"));
    } finally {
      setKhadgalj(false);
    }
  };

  const khugatsaa = `${dateRange?.[0] || ""} — ${dateRange?.[1] || ""}`;
  const ekhniiBichlel = data?.ekhniiUldegdelBichlel || null;

  const excelTatakh = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Шилэн данс", khugatsaa],
        [],
        ["Үзүүлэлт", "Дүн"],
        ["Эхний үлдэгдэл", data.ekhniiUldegdel ?? ""],
        ["Орлого", data.orlogo],
        ["  Оршин суугчдын төлбөр", data.tulsunOrlogo],
        ["  Бусад орлого", data.garOrlogo],
        ["Зарлага", data.zarlaga],
        ["Эцсийн үлдэгдэл", data.etssiinUldegdel ?? ""],
        [],
        ["Авлага (төлөөгүй мөнгө)", data.avlaga],
      ]),
      "Хураангуй",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Огноо", "Төрөл", "Ангилал", "Тайлбар", "Бүртгэсэн", "Дүн"],
        ...data.guilgeenuud.map((z) => [
          ognooKharuul(z.ognoo),
          z.turul === "orlogo" ? "Орлого" : "Зарлага",
          z.angilal,
          z.tailbar || "",
          z.ajiltniiNer || "",
          z.turul === "orlogo" ? z.dun : -z.dun,
        ]),
      ]),
      "Гүйлгээ",
    );
    XLSX.writeFile(wb, `Шилэн_данс_${dateRange?.[0] || ""}_${dateRange?.[1] || ""}.xlsx`);
  };

  const zarlagaBaganuud = [
    {
      title: "Огноо",
      dataIndex: "ognoo",
      key: "ognoo",
      width: 110,
      render: (v: string) => ognooKharuul(v),
    },
    {
      title: "Төрөл",
      dataIndex: "turul",
      key: "turul",
      width: 90,
      render: (v: GuilgeeTurul) => (
        <span className={v === "orlogo" ? "text-success" : "text-danger"}>
          {v === "orlogo" ? "Орлого" : "Зарлага"}
        </span>
      ),
    },
    { title: "Ангилал", dataIndex: "angilal", key: "angilal", width: 170 },
    {
      title: "Тайлбар",
      dataIndex: "tailbar",
      key: "tailbar",
      render: (v: string) => v || "-",
    },
    {
      title: "Бүртгэсэн",
      dataIndex: "ajiltniiNer",
      key: "ajiltniiNer",
      width: 150,
      render: (v: string) => v || "-",
    },
    {
      title: "Дүн",
      dataIndex: "dun",
      key: "dun",
      align: "right" as const,
      width: 140,
      render: (v: number, r: GuilgeeMur) =>
        r.turul === "orlogo" ? (
          <span className="text-success">+{formatNumber(v, 2)}</span>
        ) : (
          <span className="text-danger">−{formatNumber(v, 2)}</span>
        ),
    },
    ...(zasakhEsekh
      ? [
          {
            title: "",
            key: "uildel",
            width: 84,
            align: "center" as const,
            render: (_: unknown, r: GuilgeeMur) => (
              <div className="flex justify-center gap-1 no-print">
                <button
                  type="button"
                  title="Засах"
                  aria-label="Засах"
                  onClick={() =>
                    setZarlagaTsonkh({
                      _id: r._id,
                      turul: r.turul,
                      ognoo: ognooKharuul(r.ognoo),
                      dun: Number(r.dun).toFixed(2),
                      angilal: r.angilal,
                      tailbar: r.tailbar || "",
                    })
                  }
                  className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Устгах"
                  aria-label="Устгах"
                  onClick={() => zarlagaUstgakh(r)}
                  className="rounded-lg p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const kartuud = [
    { nershil: "Эхний үлдэгдэл", utga: mungu(data?.ekhniiUldegdel), ungu: "text-[color:var(--panel-text)]" },
    { nershil: "Орлого", utga: formatNumber(data?.orlogo || 0, 2), ungu: "text-success" },
    { nershil: "Зарлага", utga: formatNumber(data?.zarlaga || 0, 2), ungu: "text-danger" },
    { nershil: "Эцсийн үлдэгдэл", utga: mungu(data?.etssiinUldegdel), ungu: "text-[color:var(--panel-text)]" },
  ];

  if (!selectedBuildingId) {
    return (
      <div className="p-6 text-center text-[13px] text-[color:var(--muted-text)]">
        Барилга сонгоно уу.
      </div>
    );
  }

  return (
    <div className="print-container flex w-full flex-col gap-3 pb-14">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <FilterDatePicker
          id="shilen-dans-date"
          value={dateRange}
          onChange={(_d, mur) =>
            setDateRange(mur?.[0] && mur?.[1] ? [mur[0], mur[1]] : getDefaultDateRange())
          }
          placeholder="Огноо сонгох"
          className="w-full sm:w-[284px]"
        />
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-minimal flex h-9 items-center gap-1.5 px-3 text-[13px]"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} />
            Хэвлэх
          </button>
          <ExcelButton onClick={excelTatakh} disabled={!data || loading} />
        </div>
      </div>

      {aldaa && (
        <div className="rounded-xl border border-[color:var(--ctl-border)] px-4 py-3 text-[13px] text-danger">
          Алдаа: {aldaa}
        </div>
      )}

      {/* Эхний үлдэгдэл оруулаагүй бол анхааруулга */}
      {data && !ekhniiBichlel && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--ctl-border)] px-4 py-3 text-[13px] text-[color:var(--panel-text)]">
          <Info className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} />
          <span className="flex-1">
            Дансны эхний үлдэгдэл оруулаагүй байна. Үлдэгдлийг тооцохын тулд эхлэх огноо, дүнг оруулна уу.
          </span>
          {zasakhEsekh && (
            <button
              type="button"
              onClick={() => setUldegdelTsonkh({ ognoo: "", dun: "" })}
              className="h-9 rounded-[10px] bg-theme px-4 text-[13px] font-medium text-white"
            >
              Эхний үлдэгдэл оруулах
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kartuud.map((k) => (
          <div
            key={k.nershil}
            className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-5 py-4 shadow-[var(--ctl-shadow)]"
          >
            <div className={`text-2xl font-medium leading-tight tabular-nums ${k.ungu}`}>
              {loading ? "…" : k.utga}
            </div>
            <div className="mt-1 text-xs text-[color:var(--muted-text)]">{k.nershil}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Khavtas
          garchig="Дансны эхний үлдэгдэл"
          tailbar="Үлдэгдэл = эхний үлдэгдэл + төлсөн мөнгө − зарлага (энэ огнооноос хойш)."
          uildel={
            zasakhEsekh && ekhniiBichlel ? (
              <button
                type="button"
                onClick={() =>
                  setUldegdelTsonkh({
                    ognoo: ognooKharuul(ekhniiBichlel.ognoo),
                    dun: Number(ekhniiBichlel.dun).toFixed(2),
                  })
                }
                className="btn-minimal flex h-8 items-center gap-1.5 px-3 text-[12px] no-print"
              >
                <Pencil className="h-3.5 w-3.5" />
                Засах
              </button>
            ) : null
          }
        >
          {ekhniiBichlel ? (
            <>
              <MurUtga ner="Огноо" utga={ognooKharuul(ekhniiBichlel.ognoo)} />
              <MurUtga ner="Дүн" utga={formatNumber(ekhniiBichlel.dun, 2)} />
              {ekhniiBichlel.ajiltniiNer && (
                <MurUtga ner="Оруулсан" utga={ekhniiBichlel.ajiltniiNer} />
              )}
            </>
          ) : (
            <p className="text-[13px] text-[color:var(--muted-text)]">Оруулаагүй</p>
          )}
        </Khavtas>

        <Khavtas garchig="Авлага" tailbar="Оршин суугчдын төлөөгүй мөнгө (хугацааны эцэст).">
          <MurUtga
            ner="Авлага (төлөөгүй мөнгө)"
            utga={loading ? "…" : mungu(data?.avlaga)}
            ungu={(data?.avlaga || 0) > 0 ? "text-danger" : undefined}
          />
        </Khavtas>

        <Khavtas garchig="Зогсоолын орлого" tailbar="Мэдээллийн зорилгоор — үлдэгдэлд тооцогдохгүй.">
          {data?.zogsool ? (
            <>
              {data.zogsool.turlaar.map((t) => (
                <MurUtga key={t.turul} ner={khelberNer(t.turul)} utga={formatNumber(t.dun, 2)} />
              ))}
              <MurUtga ner="Нийт" utga={formatNumber(data.zogsool.niit, 2)} ungu="text-success" />
            </>
          ) : (
            <p className="text-[13px] text-[color:var(--muted-text)]">
              {loading ? "Ачаалж байна…" : "Зогсоолын мэдээлэл алга"}
            </p>
          )}
        </Khavtas>
      </div>

      <Khavtas
        garchig="Гүйлгээ"
        tailbar="Оршин суугчдын төлбөр автоматаар орлогод орно. Бусад орлого, зарлагыг энд гараар бүртгэнэ — үлдэгдэлд нэмэгдэж/хасагдана. Зарлага аппын «Зарцуулалт»-д ангиллаар харагдана."
        uildel={
          zasakhEsekh ? (
            <button
              type="button"
              onClick={() =>
                setZarlagaTsonkh({
                  turul: "zarlaga",
                  ognoo: ognooKharuul(new Date().toISOString()),
                  dun: "",
                  angilal: "",
                  tailbar: "",
                })
              }
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-theme px-4 text-[13px] font-medium text-white no-print"
            >
              <Plus className="h-4 w-4" />
              Гүйлгээ нэмэх
            </button>
          ) : null
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AngilalZadargaa
            garchig="Орлого"
            niit={data?.orlogo || 0}
            jagsaalt={data?.orlogoAngilalaar || []}
            ungu="bg-success"
          />
          <AngilalZadargaa
            garchig="Зарлага"
            niit={data?.zarlaga || 0}
            jagsaalt={data?.zarlagaAngilalaar || []}
            ungu="bg-danger"
          />
        </div>
        <Table
          dataSource={data?.guilgeenuud || []}
          columns={zarlagaBaganuud}
          rowKey="_id"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content", y: 480 }}
          locale={{ emptyText: "Энэ хугацаанд гараар бүртгэсэн гүйлгээ алга" }}
        />
      </Khavtas>

      {zarlagaTsonkh && (
        <Tsonkh
          garchig={zarlagaTsonkh._id ? "Гүйлгээ засах" : "Гүйлгээ нэмэх"}
          onClose={() => setZarlagaTsonkh(null)}
          onSave={zarlagaKhadgalakh}
          khadgalj={khadgalj}
          tsonkhRef={tsonkhRef}
        >
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[color:var(--surface-border)] p-1">
            {(["orlogo", "zarlaga"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setZarlagaTsonkh((z) =>
                    z && z.turul !== t ? { ...z, turul: t, angilal: "" } : z,
                  )
                }
                className={`h-9 rounded-lg text-[13px] transition-colors ${
                  zarlagaTsonkh.turul === t
                    ? t === "orlogo"
                      ? "bg-success/15 font-medium text-success"
                      : "bg-danger/15 font-medium text-danger"
                    : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                }`}
              >
                {t === "orlogo" ? "Орлого" : "Зарлага"}
              </button>
            ))}
          </div>
          <Shoshgo ner="Огноо">
            <StandardDatePicker
              value={zarlagaTsonkh.ognoo || null}
              onChange={(d) => setZarlagaTsonkh((z) => (z ? { ...z, ognoo: ognooUtga(d) } : z))}
              placeholder="Огноо сонгох"
              className="!h-11 w-full !rounded-xl"
              getPopupContainer={() => tsonkhRef.current || document.body}
              popupStyle={{ zIndex: 13010 }}
            />
          </Shoshgo>
          <Shoshgo ner="Ангилал">
            <FilterSelect
              value={zarlagaTsonkh.angilal}
              onChange={(v) => setZarlagaTsonkh((z) => (z ? { ...z, angilal: v } : z))}
              options={(
                (zarlagaTsonkh.turul === "orlogo"
                  ? data?.orlogiinAngilaluud
                  : data?.zarlagiinAngilaluud) || []
              ).map((a) => ({ value: a, label: a }))}
              placeholder="Ангилал сонгох"
              bugdLabel={null}
              allowClear={false}
              className="w-full"
            />
          </Shoshgo>
          <Shoshgo ner="Дүн (₮)">
            <DunOrolt
              value={zarlagaTsonkh.dun}
              onChange={(v) => setZarlagaTsonkh((z) => (z ? { ...z, dun: v } : z))}
            />
          </Shoshgo>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[color:var(--panel-text)]">Тайлбар</span>
            <textarea
              rows={3}
              maxLength={500}
              value={zarlagaTsonkh.tailbar}
              onChange={(e) =>
                setZarlagaTsonkh((z) => (z ? { ...z, tailbar: e.target.value } : z))
              }
              placeholder={
                zarlagaTsonkh.turul === "orlogo"
                  ? "Жишээ: 1-р давхрын лангууны түрээс"
                  : "Жишээ: 11-р сарын цэвэрлэгээний цалин"
              }
              className={`${OROLT} h-auto py-2`}
            />
          </label>
        </Tsonkh>
      )}

      {uldegdelTsonkh && (
        <Tsonkh
          garchig={ekhniiBichlel ? "Эхний үлдэгдэл засах" : "Эхний үлдэгдэл оруулах"}
          onClose={() => setUldegdelTsonkh(null)}
          onSave={uldegdelKhadgalakh}
          khadgalj={khadgalj}
          tsonkhRef={tsonkhRef}
        >
          <div className="flex items-start gap-2 text-[12px] text-[color:var(--muted-text)]">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span>
              Тухайн өдрийн эхэнд дансанд байсан мөнгө. Үүнээс хойших төлсөн мөнгө нэмэгдэж,
              зарлага хасагдана.
            </span>
          </div>
          <Shoshgo ner="Огноо">
            <StandardDatePicker
              value={uldegdelTsonkh.ognoo || null}
              onChange={(d) => setUldegdelTsonkh((u) => (u ? { ...u, ognoo: ognooUtga(d) } : u))}
              placeholder="Огноо сонгох"
              className="!h-11 w-full !rounded-xl"
              getPopupContainer={() => tsonkhRef.current || document.body}
              popupStyle={{ zIndex: 13010 }}
            />
          </Shoshgo>
          <Shoshgo ner="Дүн (₮)">
            <DunOrolt
              khasakhZuvshuurukh
              value={uldegdelTsonkh.dun}
              onChange={(v) => setUldegdelTsonkh((u) => (u ? { ...u, dun: v } : u))}
            />
          </Shoshgo>
        </Tsonkh>
      )}
    </div>
  );
}
