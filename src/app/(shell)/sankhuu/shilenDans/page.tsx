"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import FilterSelect from "@/components/ui/FilterSelect";
import ExcelButton from "@/components/ui/ExcelButton";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Table from "@/components/ui/table";
import ModalPortal from "../../../../../components/shell/ModalPortal";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { hasPermission } from "@/lib/permissionUtils";
import { shaltgaanAsuuya } from "@/lib/shaltgaan";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";

/**
 * Шилэн данс — оршин суугчдын төлбөр ба СӨХ-ийн зарлага.
 *
 *  - Орлого (төлсөн) / Нэхэмжилсэн — сонгосон хугацаанд (цуцалсан гэрээний төлөлт ч орно)
 *  - Зардал — СӨХ-ийн бодит зарлага, ажилтан гараар бүртгэнэ
 *  - Хуримтлал = Орлого − Зардал
 *  - Төлөөгүй — хугацааны эцсийн нийт үлдэгдэл
 *  - Хугацаа хэтэрсэн — 30 хоногоос хуучин төлөгдөөгүй; картыг дарахад тэр айлууд шүүгдэнэ
 * Вэб бүрэн мэдээлэл (нэр, утас, хоног) харна; апп хэтэрсэн айлыг зөвхөн тоот + дүнгээр.
 * Өгөгдөл: sukhBackv2 controller/shilenDans.js.
 */

/** Тоот (гэрээ) тус бүрийн тооцоо. debet/kredit-ийг сервер явуулдаг ч хүснэгтэд харуулахгүй. */
interface AilMur {
  gereeniiId: string;
  gereeniiDugaar: string;
  toot: string;
  orts: string;
  davkhar: string;
  ner: string;
  utas: string;
  tsutsalsan: boolean;
  ekhnii: number;
  debet: number;
  kredit: number;
  etssiin: number;
  khetersen: number;
  khonog: number;
}

interface ZarlagaMur {
  _id: string;
  ognoo: string;
  dun: number;
  angilal: string;
  tailbar?: string;
  ajiltniiNer?: string;
}

interface ShilenDansKhariu {
  khetersenKhonog: number;
  nekhemjilsen: number;
  tulsun: number;
  khungulult: number;
  tuluugui: number;
  khetersen: number;
  khetersenAilToo: number;
  zardal: number;
  khurimtlal: number;
  zarlagiinAngilaluud: string[];
  zarlaguud: ZarlagaMur[];
  zarlagaAngilalaar: { angilal: string; dun: number }[];
  ailuud: AilMur[];
}

type Shuult = "bugd" | "tuluugui" | "khetersen";

const aldaaZurvas = (err: any, ankhdagch: string) =>
  err?.response?.data?.message || err?.response?.data?.aldaa || err?.message || ankhdagch;

const mungu = (v: number) => formatNumber(v || 0, 2);

function ognooKharuul(utga: string | null | undefined): string {
  if (!utga) return "-";
  const d = new Date(utga);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const ognooUtga = (d: any): string => {
  if (!d) return "";
  const v = typeof d?.format === "function" ? d.format("YYYY-MM-DD") : String(d);
  return v.slice(0, 10);
};

const OROLT =
  "h-11 w-full rounded-xl border border-[color:var(--surface-border)] " +
  "bg-[color:var(--surface-bg)] px-3 text-sm text-[color:var(--panel-text)] " +
  "placeholder:text-[color:var(--muted-text)] transition-colors " +
  "focus:border-theme focus:outline-none focus:ring-2 focus:ring-theme/20";

/** Мөнгөн дүнгийн оролт — бичих явцад «000,000.00»; утгыг таслалгүй мөрөөр. */
function dunTseverlekh(utga: string): string {
  const s = utga.replace(/[^\d.]/g, "");
  const [bukhel, ...busad] = s.split(".");
  const butarkhai = busad.join("").slice(0, 2);
  return bukhel.replace(/^0+(?=\d)/, "") + (busad.length ? "." + butarkhai : "");
}

function dunKharuulakh(utga: string): string {
  if (!utga) return "";
  const [bukhel, butarkhai] = utga.split(".");
  const tasltai = bukhel.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return tasltai + (butarkhai !== undefined ? "." + butarkhai : "");
}

function DunOrolt({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="decimal"
      value={dunKharuulakh(value)}
      onChange={(e) => onChange(dunTseverlekh(e.target.value))}
      onBlur={() => {
        if (!value) return;
        const n = Number(value);
        if (Number.isFinite(n)) onChange(n.toFixed(2));
      }}
      placeholder="0.00"
      className={`${OROLT} text-right tabular-nums`}
    />
  );
}

function Shoshgo({
  ner,
  zaaval = true,
  children,
}: {
  ner: string;
  zaaval?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[color:var(--panel-text)]">
        {ner} {zaaval && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}

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
          {tailbar && <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">{tailbar}</p>}
        </div>
        {uildel}
      </div>
      {children}
    </section>
  );
}

export default function ShilenDansPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { searchTerm } = useSearch();
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
  const [shuult, setShuult] = useState<Shuult>("bugd");
  const [shinechlekh, setShinechlekh] = useState(0);

  const [tsonkh, setTsonkh] = useState<null | {
    _id?: string;
    ognoo: string;
    dun: string;
    angilal: string;
    tailbar: string;
  }>(null);
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
    if (!tsonkh || !token) return;
    const dun = Number(tsonkh.dun);
    if (!tsonkh.ognoo || !(dun > 0) || !tsonkh.angilal) {
      openErrorOverlay("Огноо, ангилал, дүнг бөглөнө үү");
      return;
    }
    const body = {
      barilgiinId: selectedBuildingId,
      ognoo: tsonkh.ognoo,
      dun,
      angilal: tsonkh.angilal,
      tailbar: tsonkh.tailbar.trim(),
    };
    setKhadgalj(true);
    try {
      if (tsonkh._id) {
        await uilchilgee(token).put(`/shilenDansZarlaga/${tsonkh._id}`, body);
      } else {
        await uilchilgee(token).post("/shilenDansZarlaga", body);
      }
      openSuccessOverlay(tsonkh._id ? "Зарлага засагдлаа" : "Зарлага нэмэгдлээ");
      setTsonkh(null);
      dakhinAchaalakh();
    } catch (err: any) {
      openErrorOverlay(aldaaZurvas(err, "Хадгалахад алдаа гарлаа"));
    } finally {
      setKhadgalj(false);
    }
  };

  const zarlagaUstgakh = async (mur: ZarlagaMur) => {
    if (!token) return;
    const shaltgaan = await shaltgaanAsuuya({
      title: "Зарлага устгах",
      message: `${ognooKharuul(mur.ognoo)} · ${mur.angilal} · ${mungu(mur.dun)}₮`,
      confirmLabel: "Устгах",
    });
    if (!shaltgaan) return;
    try {
      await uilchilgee(token).delete(`/shilenDansZarlaga/${mur._id}`);
      openSuccessOverlay("Зарлага устгагдлаа");
      dakhinAchaalakh();
    } catch (err: any) {
      openErrorOverlay(aldaaZurvas(err, "Устгахад алдаа гарлаа"));
    }
  };

  // ── Оршин суугчид ──
  const ailuud = data?.ailuud || [];
  const khaikhUg = (searchTerm || "").trim().toLowerCase();
  const kharagdakh = ailuud.filter(
    (a) =>
      (shuult === "bugd" ||
        (shuult === "tuluugui" && a.etssiin > 0) ||
        (shuult === "khetersen" && a.khetersen > 0)) &&
      (!khaikhUg ||
        [a.toot, a.ner, a.orts, a.utas, a.gereeniiDugaar].some((v) =>
          String(v || "").toLowerCase().includes(khaikhUg),
        )),
  );
  const niit = kharagdakh.reduce(
    (s, a) => ({
      ekhnii: s.ekhnii + a.ekhnii,
      etssiin: s.etssiin + a.etssiin,
      khetersen: s.khetersen + a.khetersen,
    }),
    { ekhnii: 0, etssiin: 0, khetersen: 0 },
  );
  const tuluuguiToo = ailuud.filter((a) => a.etssiin > 0).length;
  const khetersenKhonog = data?.khetersenKhonog ?? 30;
  const zarlaguud = data?.zarlaguud || [];

  const excelTatakh = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Шилэн данс", `${dateRange?.[0] || ""} — ${dateRange?.[1] || ""}`],
        [],
        ["Орлого (төлсөн)", data.tulsun],
        ["Зардал", data.zardal],
        ["Хуримтлал", data.khurimtlal],
        [],
        ["Нэхэмжилсэн", data.nekhemjilsen],
        ["Хөнгөлөлт", data.khungulult],
        ["Төлөөгүй (нийт)", data.tuluugui],
        ["Хугацаа хэтэрсэн", data.khetersen],
        ["Хугацаа хэтэрсэн айл", data.khetersenAilToo],
      ]),
      "Хураангуй",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Огноо", "Ангилал", "Тайлбар", "Бүртгэсэн", "Дүн"],
        ...zarlaguud.map((z) => [
          ognooKharuul(z.ognoo),
          z.angilal,
          z.tailbar || "",
          z.ajiltniiNer || "",
          z.dun,
        ]),
      ]),
      "Зарлага",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        [
          "Орц",
          "Тоот",
          "Нэр",
          "Утас",
          "Эхний үлдэгдэл",
          "Эцсийн үлдэгдэл",
          "Хугацаа хэтэрсэн",
          "Хоног",
          "Төлөв",
        ],
        ...kharagdakh.map((a) => [
          a.orts,
          a.toot,
          a.ner,
          a.utas,
          a.ekhnii,
          a.etssiin,
          a.khetersen,
          a.khetersen > 0 ? a.khonog : "",
          a.tsutsalsan ? "Цуцалсан" : "Идэвхтэй",
        ]),
      ]),
      "Оршин суугчид",
    );
    XLSX.writeFile(wb, `Шилэн_данс_${dateRange?.[0] || ""}_${dateRange?.[1] || ""}.xlsx`);
  };

  const mungunBagana = (title: string, key: keyof AilMur, ungu?: (v: number) => string) => ({
    title,
    dataIndex: key,
    key,
    align: "right" as const,
    width: 130,
    render: (v: number) => (
      <span className={`tabular-nums ${ungu ? ungu(v) : ""}`}>
        {v ? mungu(v) : <span className="text-[color:var(--muted-text)]">0.00</span>}
      </span>
    ),
  });

  const ailBaganuud = [
    { title: "Орц", dataIndex: "orts", key: "orts", width: 60, render: (v: string) => v || "-" },
    { title: "Тоот", dataIndex: "toot", key: "toot", width: 70, render: (v: string) => v || "-" },
    {
      title: "Нэр",
      dataIndex: "ner",
      key: "ner",
      render: (v: string, r: AilMur) => (
        <span>
          {v || "-"}
          {r.tsutsalsan && (
            <span className="ml-1.5 text-[11px] text-[color:var(--muted-text)]">(цуцалсан)</span>
          )}
        </span>
      ),
    },
    { title: "Утас", dataIndex: "utas", key: "utas", width: 110, render: (v: string) => v || "-" },
    mungunBagana("Эхний үлдэгдэл", "ekhnii"),
    mungunBagana("Эцсийн үлдэгдэл", "etssiin", (v) => (v > 0 ? "font-medium text-danger" : "")),
    mungunBagana("Хугацаа хэтэрсэн", "khetersen", (v) => (v > 0 ? "text-warning" : "")),
    {
      title: "Хоног",
      dataIndex: "khonog",
      key: "khonog",
      width: 70,
      align: "right" as const,
      render: (v: number, r: AilMur) => (r.khetersen > 0 ? v : "-"),
    },
  ];

  const zarlagaBaganuud = [
    {
      title: "Огноо",
      dataIndex: "ognoo",
      key: "ognoo",
      width: 110,
      render: (v: string) => ognooKharuul(v),
    },
    { title: "Ангилал", dataIndex: "angilal", key: "angilal", width: 170 },
    { title: "Тайлбар", dataIndex: "tailbar", key: "tailbar", render: (v: string) => v || "-" },
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
      render: (v: number) => <span className="tabular-nums text-danger">{mungu(v)}</span>,
    },
    ...(zasakhEsekh
      ? [
          {
            title: "",
            key: "uildel",
            width: 84,
            align: "center" as const,
            render: (_: unknown, r: ZarlagaMur) => (
              <div className="flex justify-center gap-1 no-print">
                <button
                  type="button"
                  title="Засах"
                  aria-label="Засах"
                  onClick={() =>
                    setTsonkh({
                      _id: r._id,
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

  const kartuud: {
    nershil: string;
    utga: string;
    ungu: string;
    shuult?: Shuult;
    tailbar?: string;
  }[] = [
    { nershil: "Орлого (төлсөн)", utga: mungu(data?.tulsun || 0), ungu: "text-success" },
    { nershil: "Зардал", utga: mungu(data?.zardal || 0), ungu: "text-danger" },
    {
      nershil: "Хуримтлал",
      utga: mungu(data?.khurimtlal || 0),
      ungu: (data?.khurimtlal || 0) < 0 ? "text-danger" : "text-[color:var(--panel-text)]",
      tailbar: "Орлого − Зардал",
    },
    {
      nershil: "Нэхэмжилсэн",
      utga: mungu(data?.nekhemjilsen || 0),
      ungu: "text-[color:var(--panel-text)]",
      tailbar: data?.khungulult ? `Хөнгөлөлт ${mungu(data.khungulult)}` : undefined,
    },
    {
      nershil: "Төлөөгүй (нийт)",
      utga: mungu(data?.tuluugui || 0),
      ungu: "text-danger",
      shuult: "tuluugui",
      tailbar: `${tuluuguiToo} айл`,
    },
    {
      nershil: "Хугацаа хэтэрсэн",
      utga: mungu(data?.khetersen || 0),
      ungu: "text-warning",
      shuult: "khetersen",
      tailbar: `${data?.khetersenAilToo || 0} айл · ${khetersenKhonog}+ хоног`,
    },
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kartuud.map((k) => {
          const idevkhtei = !!k.shuult && shuult === k.shuult;
          const agaar = (
            <>
              <div className={`text-2xl font-medium leading-tight tabular-nums ${k.ungu}`}>
                {loading ? "…" : k.utga}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[color:var(--muted-text)]">
                <span>{k.nershil}</span>
                {k.tailbar && <span>{k.tailbar}</span>}
              </div>
            </>
          );
          const angi = `rounded-2xl border bg-[color:var(--surface-bg)] px-5 py-4 text-left shadow-[var(--ctl-shadow)] ${
            idevkhtei ? "border-theme ring-2 ring-theme/20" : "border-[color:var(--ctl-border)]"
          }`;
          return k.shuult ? (
            <button
              key={k.nershil}
              type="button"
              onClick={() => setShuult(idevkhtei ? "bugd" : (k.shuult as Shuult))}
              className={`${angi} transition-colors hover:border-theme/60`}
              title={idevkhtei ? "Бүгдийг харуулах" : "Эдгээр айлыг харуулах"}
            >
              {agaar}
            </button>
          ) : (
            <div key={k.nershil} className={angi}>
              {agaar}
            </div>
          );
        })}
      </div>

      <Khavtas
        garchig={
          shuult === "khetersen"
            ? "Хугацаа хэтэрсэн айлууд"
            : shuult === "tuluugui"
              ? "Төлөөгүй айлууд"
              : "Оршин суугчдын тооцоо"
        }
        tailbar={`Эхний үлдэгдэл — хугацааны эхэнд, эцсийн үлдэгдэл — хугацааны эцэст төлөөгүй дүн. Хугацаа хэтэрсэн = ${khetersenKhonog} хоногоос дээш төлөгдөөгүй.`}
        uildel={
          <div className="flex flex-wrap gap-1 no-print">
            {(
              [
                ["bugd", `Бүгд (${ailuud.length})`],
                ["tuluugui", `Төлөөгүй (${tuluuguiToo})`],
                ["khetersen", `Хугацаа хэтэрсэн (${data?.khetersenAilToo || 0})`],
              ] as const
            ).map(([k, ner]) => (
              <button
                key={k}
                type="button"
                onClick={() => setShuult(k)}
                className={`h-8 rounded-[10px] px-3 text-[12px] transition-colors ${
                  shuult === k
                    ? "bg-theme/15 font-medium text-brand"
                    : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                }`}
              >
                {ner}
              </button>
            ))}
          </div>
        }
      >
        <Table
          dataSource={kharagdakh}
          columns={ailBaganuud}
          rowKey="gereeniiId"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content", y: 560 }}
          locale={{ emptyText: "Мэдээлэл алга" }}
          summary={() =>
            kharagdakh.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-theme/5">
                  <Table.Summary.Cell index={0} colSpan={4} className="text-[13px] font-medium">
                    Нийт ({kharagdakh.length})
                  </Table.Summary.Cell>
                  {(["ekhnii", "etssiin", "khetersen"] as const).map((k, i) => (
                    <Table.Summary.Cell
                      key={k}
                      index={i + 4}
                      align="right"
                      className="text-[13px] font-medium tabular-nums"
                    >
                      {mungu(niit[k])}
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={7} />
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </Khavtas>

      <Khavtas
        garchig="Зарлага"
        tailbar="СӨХ-ийн бодит зарлага (цалин, цэвэрлэгээ г.м.). Хуримтлал = Орлого − Зардал. Аппад «Энэ сарын зардал» болж харагдана."
        uildel={
          zasakhEsekh ? (
            <button
              type="button"
              onClick={() =>
                setTsonkh({
                  ognoo: ognooKharuul(new Date().toISOString()),
                  dun: "",
                  angilal: "",
                  tailbar: "",
                })
              }
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-theme px-4 text-[13px] font-medium text-white no-print"
            >
              <Plus className="h-4 w-4" />
              Зарлага нэмэх
            </button>
          ) : null
        }
      >
        {(data?.zarlagaAngilalaar || []).length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {(data?.zarlagaAngilalaar || []).map((a) => {
              const khuvi = data?.zardal ? Math.round((a.dun / data.zardal) * 100) : 0;
              return (
                <div key={a.angilal} className="flex items-center gap-3 text-[13px]">
                  <span className="w-40 shrink-0 truncate text-[color:var(--panel-text)]">
                    {a.angilal}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-theme/10">
                    <div className="h-full rounded-full bg-danger" style={{ width: `${khuvi}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right tabular-nums">{mungu(a.dun)}</span>
                  <span className="w-10 shrink-0 text-right text-[color:var(--muted-text)]">
                    {khuvi}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Table
          dataSource={zarlaguud}
          columns={zarlagaBaganuud}
          rowKey="_id"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content", y: 420 }}
          locale={{ emptyText: "Энэ хугацаанд зарлага бүртгэгдээгүй" }}
        />
      </Khavtas>

      {tsonkh && (
        <ModalPortal>
          <div className="fixed inset-0 z-[12000] bg-black/30" onClick={() => setTsonkh(null)} />
          <div
            ref={tsonkhRef}
            onClick={(e) => e.stopPropagation()}
            // .modal-surface өргөнийг --modal-max-w-ээр хязгаарладаг
            style={{ "--modal-max-w": "440px", width: "min(440px, 95vw)" } as React.CSSProperties}
            className="modal-surface fixed left-1/2 top-1/2 z-[12001] flex -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
              <h2 className="flex-1 text-base font-medium text-[color:var(--panel-text)]">
                {tsonkh._id ? "Зарлага засах" : "Зарлага нэмэх"}
              </h2>
              <button
                type="button"
                onClick={() => setTsonkh(null)}
                className="rounded-xl p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                aria-label="Хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <Shoshgo ner="Огноо">
                <StandardDatePicker
                  value={tsonkh.ognoo || null}
                  onChange={(d) => setTsonkh((z) => (z ? { ...z, ognoo: ognooUtga(d) } : z))}
                  placeholder="Огноо сонгох"
                  className="!h-11 w-full !rounded-xl"
                  getPopupContainer={() => tsonkhRef.current || document.body}
                  popupStyle={{ zIndex: 13010 }}
                />
              </Shoshgo>
              <Shoshgo ner="Ангилал">
                <FilterSelect
                  value={tsonkh.angilal}
                  onChange={(v) => setTsonkh((z) => (z ? { ...z, angilal: v } : z))}
                  options={(data?.zarlagiinAngilaluud || []).map((a) => ({ value: a, label: a }))}
                  placeholder="Ангилал сонгох"
                  bugdLabel={null}
                  allowClear={false}
                  className="w-full"
                />
              </Shoshgo>
              <Shoshgo ner="Дүн (₮)">
                <DunOrolt
                  value={tsonkh.dun}
                  onChange={(v) => setTsonkh((z) => (z ? { ...z, dun: v } : z))}
                />
              </Shoshgo>
              <Shoshgo ner="Тайлбар" zaaval={false}>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={tsonkh.tailbar}
                  onChange={(e) => setTsonkh((z) => (z ? { ...z, tailbar: e.target.value } : z))}
                  placeholder="Жишээ: 11-р сарын цэвэрлэгээний цалин"
                  className={`${OROLT} h-auto py-2`}
                />
              </Shoshgo>
            </div>
            <div className="flex justify-end gap-2 border-t border-[color:var(--surface-border)] px-5 py-3">
              <button
                type="button"
                onClick={() => setTsonkh(null)}
                className="btn-minimal h-9 px-4 text-[13px]"
              >
                Болих
              </button>
              <button
                type="button"
                onClick={zarlagaKhadgalakh}
                disabled={khadgalj}
                className="h-9 rounded-[10px] bg-theme px-4 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {khadgalj ? "Хадгалж байна…" : "Хадгалах"}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
