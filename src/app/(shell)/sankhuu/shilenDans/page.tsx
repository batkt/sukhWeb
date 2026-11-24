"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { ArrowDownRight, ArrowUpRight, Calendar, Eye, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
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
 * Шилэн данс — СӨХ-ийн өдөр тутмын орлого, зарлагын ил тод тайлан.
 *
 *  - Орлого (төлсөн) — сонгосон хугацаанд төлөгдсөн орлогын дүн
 *  - Зардал — СӨХ-ийн бодит зарлага
 *  - Төлөөгүй — хугацааны эцсийн нийт үлдэгдэл
 *  - Хугацаа хэтэрсэн — 30 хоногоос дээш хугацаагаар төлөгдөөгүй дүн
 *  - Хүснэгт — сонгосон сарын өдөр бүрийн орлого, зарлага, зөрүү
 *  - Өдөр дээр дарахад — тухайн өдрийн орлого, зарлагын дэлгэрэнгүй жагсаалт
 */

interface ZarlagaMur {
  _id: string;
  ognoo: string;
  dun: number;
  angilal: string;
  tailbar?: string;
  ajiltniiNer?: string;
}

interface OrlogoMur {
  _id: string;
  ognoo: string;
  dun: number;
  toot?: string;
  tailbar?: string;
  turul?: string;
}

interface UdriinMur {
  ognoo: string;
  ognooLabel: string;
  garig: string;
  orlogo: number;
  zarlaga: number;
  zuruu: number;
  orlogoToo: number;
  zarlagaToo: number;
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
  orloguud?: OrlogoMur[];
  zarlagaAngilalaar: { angilal: string; dun: number }[];
  ailuud?: any[];
}

const GARIGUUD = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

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
  const [shinechlekh, setShinechlekh] = useState(0);

  // Сонгосон өдөр (дарж дэлгэрэнгүй харах)
  const [songosonUdur, setSongosonUdur] = useState<string | null>(null);

  // Зарлага нэмэх/засах модал
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

  // ── Сарын өдрүүдийг байгуулах ──
  const zarlaguud = data?.zarlaguud || [];
  const orloguud = data?.orloguud || [];

  const udruud = useMemo<UdriinMur[]>(() => {
    const ekhStr = dateRange?.[0];
    const duusStr = dateRange?.[1];
    if (!ekhStr || !duusStr) return [];
    const ekh = new Date(ekhStr);
    const duus = new Date(duusStr);
    if (isNaN(ekh.getTime()) || isNaN(duus.getTime())) return [];

    const orlogoMap = new Map<string, { niit: number; count: number }>();
    orloguud.forEach((o) => {
      const dStr = ognooKharuul(o.ognoo);
      const curr = orlogoMap.get(dStr) || { niit: 0, count: 0 };
      curr.niit += Number(o.dun) || 0;
      curr.count += 1;
      orlogoMap.set(dStr, curr);
    });

    const zarlagaMap = new Map<string, { niit: number; count: number }>();
    zarlaguud.forEach((z) => {
      const dStr = ognooKharuul(z.ognoo);
      const curr = zarlagaMap.get(dStr) || { niit: 0, count: 0 };
      curr.niit += Number(z.dun) || 0;
      curr.count += 1;
      zarlagaMap.set(dStr, curr);
    });

    const list: UdriinMur[] = [];
    const curr = new Date(ekh);
    curr.setHours(0, 0, 0, 0);
    const end = new Date(duus);
    end.setHours(23, 59, 59, 999);

    const pad = (n: number) => String(n).padStart(2, "0");

    while (curr <= end && list.length < 62) {
      const dStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
      const garig = GARIGUUD[curr.getDay()];
      const o = orlogoMap.get(dStr) || { niit: 0, count: 0 };
      const z = zarlagaMap.get(dStr) || { niit: 0, count: 0 };
      list.push({
        ognoo: dStr,
        ognooLabel: `${dStr} (${garig})`,
        garig,
        orlogo: o.niit,
        zarlaga: z.niit,
        zuruu: o.niit - z.niit,
        orlogoToo: o.count,
        zarlagaToo: z.count,
      });
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [dateRange, orloguud, zarlaguud]);

  const khaikhUg = (searchTerm || "").trim().toLowerCase();
  const kharagdakhUdruud = useMemo(() => {
    if (!khaikhUg) return udruud;
    return udruud.filter(
      (u) =>
        u.ognoo.includes(khaikhUg) ||
        u.garig.toLowerCase().includes(khaikhUg) ||
        String(u.orlogo).includes(khaikhUg) ||
        String(u.zarlaga).includes(khaikhUg),
    );
  }, [udruud, khaikhUg]);

  const udriinNiit = useMemo(() => {
    return kharagdakhUdruud.reduce(
      (s, u) => ({
        orlogo: s.orlogo + u.orlogo,
        zarlaga: s.zarlaga + u.zarlaga,
        zuruu: s.zuruu + u.zuruu,
        orlogoToo: s.orlogoToo + u.orlogoToo,
        zarlagaToo: s.zarlagaToo + u.zarlagaToo,
      }),
      { orlogo: 0, zarlaga: 0, zuruu: 0, orlogoToo: 0, zarlagaToo: 0 },
    );
  }, [kharagdakhUdruud]);

  // Сонгосон өдрийн орлого, зарлагын жагсаалт
  const songosonUdriinOrloguud = useMemo(() => {
    if (!songosonUdur) return [];
    return orloguud.filter((o) => ognooKharuul(o.ognoo) === songosonUdur);
  }, [songosonUdur, orloguud]);

  const songosonUdriinZarlaguud = useMemo(() => {
    if (!songosonUdur) return [];
    return zarlaguud.filter((z) => ognooKharuul(z.ognoo) === songosonUdur);
  }, [songosonUdur, zarlaguud]);

  const songosonUdriinOrlogoNiit = useMemo(
    () => songosonUdriinOrloguud.reduce((s, o) => s + (Number(o.dun) || 0), 0),
    [songosonUdriinOrloguud],
  );
  const songosonUdriinZarlagaNiit = useMemo(
    () => songosonUdriinZarlaguud.reduce((s, z) => s + (Number(z.dun) || 0), 0),
    [songosonUdriinZarlaguud],
  );

  const tuluuguiToo = data?.ailuud?.filter((a: any) => a.etssiin > 0).length || 0;
  const khetersenKhonog = data?.khetersenKhonog ?? 30;

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
        ["Төлөөгүй (нийт)", data.tuluugui],
        ["Хугацаа хэтэрсэн", data.khetersen],
        ["Хугацаа хэтэрсэн айл", data.khetersenAilToo],
      ]),
      "Хураангуй",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Огноо", "Гариг", "Орлого", "Зарлага", "Зөрүү", "Орлогын тоо", "Зарлагын тоо"],
        ...udruud.map((u) => [
          u.ognoo,
          u.garig,
          u.orlogo,
          u.zarlaga,
          u.zuruu,
          u.orlogoToo,
          u.zarlagaToo,
        ]),
      ]),
      "Өдөр тутмын тооцоо",
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
        ["Огноо", "Тоот", "Төрөл", "Тайлбар", "Дүн"],
        ...orloguud.map((o) => [
          ognooKharuul(o.ognoo),
          o.toot || "",
          o.turul || "",
          o.tailbar || "",
          o.dun,
        ]),
      ]),
      "Орлого",
    );
    XLSX.writeFile(wb, `Шилэн_данс_${dateRange?.[0] || ""}_${dateRange?.[1] || ""}.xlsx`);
  };

  // ── Өдөр тутмын хүснэгтийн баганууд ──
  const udriinBaganuud = [
    {
      title: "Огноо",
      dataIndex: "ognoo",
      key: "ognoo",
      width: 170,
      render: (_: any, r: UdriinMur) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[color:var(--muted-text)]" />
          <span className="font-medium text-[color:var(--panel-text)]">{r.ognooLabel}</span>
        </div>
      ),
    },
    {
      title: "Орлого",
      dataIndex: "orlogo",
      key: "orlogo",
      align: "right" as const,
      width: 150,
      render: (v: number) => (
        <span className={`tabular-nums font-medium ${v > 0 ? "text-success" : "text-[color:var(--muted-text)]"}`}>
          {v > 0 ? `+${mungu(v)}` : "0.00"}
        </span>
      ),
    },
    {
      title: "Зардал",
      dataIndex: "zarlaga",
      key: "zarlaga",
      align: "right" as const,
      width: 150,
      render: (v: number) => (
        <span className={`tabular-nums font-medium ${v > 0 ? "text-danger" : "text-[color:var(--muted-text)]"}`}>
          {v > 0 ? `-${mungu(v)}` : "0.00"}
        </span>
      ),
    },
    {
      title: "Зөрүү",
      dataIndex: "zuruu",
      key: "zuruu",
      align: "right" as const,
      width: 160,
      render: (v: number) => (
        <span
          className={`tabular-nums font-semibold ${
            v > 0 ? "text-success" : v < 0 ? "text-danger" : "text-[color:var(--muted-text)]"
          }`}
        >
          {mungu(v)}
        </span>
      ),
    },
    {
      title: "Гүйлгээ",
      key: "guilgee",
      render: (_: any, r: UdriinMur) => (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {r.orlogoToo > 0 && (
            <span className="rounded-md bg-success/10 px-2 py-0.5 font-medium text-success">
              {r.orlogoToo} орлого
            </span>
          )}
          {r.zarlagaToo > 0 && (
            <span className="rounded-md bg-danger/10 px-2 py-0.5 font-medium text-danger">
              {r.zarlagaToo} зардал
            </span>
          )}
          {r.orlogoToo === 0 && r.zarlagaToo === 0 && (
            <span className="text-[color:var(--muted-text)] opacity-70">Гүйлгээгүй</span>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "uildel",
      width: 90,
      align: "center" as const,
      render: (_: any, r: UdriinMur) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSongosonUdur(r.ognoo);
          }}
          className="btn-minimal inline-flex h-8 items-center gap-1 !px-2.5 text-xs text-brand hover:bg-theme/10"
        >
          <Eye className="h-3.5 w-3.5" />
          Харах
        </button>
      ),
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

  // Нийт 4 карт — бүгд 1 мөрөнд багтана (Нэхэмжилсэн, Хуримтлал хасагдсан)
  const kartuud = [
    { nershil: "Орлого (төлсөн)", utga: mungu(data?.tulsun || 0), ungu: "text-success" },
    { nershil: "Зардал", utga: mungu(data?.zardal || 0), ungu: "text-danger" },
    {
      nershil: "Төлөөгүй (нийт)",
      utga: mungu(data?.tuluugui || 0),
      ungu: "text-danger",
      tailbar: `${tuluuguiToo} айл`,
    },
    {
      nershil: "Хугацаа хэтэрсэн",
      utga: mungu(data?.khetersen || 0),
      ungu: "text-warning",
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

      {/* 4 карт — бүгд 1 мөрөнд байрлана */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kartuud.map((k) => (
          <div
            key={k.nershil}
            className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] px-5 py-4 text-left shadow-[var(--ctl-shadow)]"
          >
            <div className={`text-2xl font-medium leading-tight tabular-nums ${k.ungu}`}>
              {loading ? "…" : k.utga}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[color:var(--muted-text)]">
              <span>{k.nershil}</span>
              {k.tailbar && <span>{k.tailbar}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Өдөр тутмын орлого, зарлагын үндсэн хүснэгт */}
      <Khavtas
        garchig="Өдөр тутмын орлого, зарлага"
        tailbar="Сонгосон хугацааны өдөр бүрийн орлого, зарлага, цэвэр үлдэгдэл. Өдөр дээр дарж тухайн өдрийн гүйлгээнүүдийг дэлгэрэнгүй харна уу."
      >
        <Table
          dataSource={kharagdakhUdruud}
          columns={udriinBaganuud}
          rowKey="ognoo"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content", y: 560 }}
          locale={{ emptyText: "Мэдээлэл алга" }}
          onRow={(r: UdriinMur) => ({
            onClick: () => setSongosonUdur(r.ognoo),
            className: "cursor-pointer transition-colors hover:bg-theme/5",
          })}
          summary={() =>
            kharagdakhUdruud.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-theme/5 font-medium">
                  <Table.Summary.Cell index={0} className="text-[13px]">
                    Нийт ({kharagdakhUdruud.length} өдөр)
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right" className="text-[13px] tabular-nums text-success">
                    +{mungu(udriinNiit.orlogo)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right" className="text-[13px] tabular-nums text-danger">
                    -{mungu(udriinNiit.zarlaga)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={3}
                    align="right"
                    className={`text-[13px] tabular-nums ${
                      udriinNiit.zuruu > 0 ? "text-success" : udriinNiit.zuruu < 0 ? "text-danger" : ""
                    }`}
                  >
                    {mungu(udriinNiit.zuruu)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={2} className="text-[12px] text-[color:var(--muted-text)]">
                    Нийт: {udriinNiit.orlogoToo} орлого · {udriinNiit.zarlagaToo} зарлага
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </Khavtas>

      {/* Зарлагын ангилал ба нийт зарлагын жагсаалт */}
      <Khavtas
        garchig="СӨХ-ийн зарлагын задаргаа"
        tailbar="СӨХ-ийн бодит зарлагууд ангиллаар."
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
          scroll={{ x: "max-content", y: 380 }}
          locale={{ emptyText: "Энэ хугацаанд зарлага бүртгэгдээгүй" }}
        />
      </Khavtas>

      {/* ── ТУХАЙН ӨДРИЙН ОРЛОГО, ЗАРЛАГЫН ДЭЛГЭРЭНГҮЙ МОДАЛ ── */}
      {songosonUdur && (
        <ModalPortal>
          <div className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-sm" onClick={() => setSongosonUdur(null)} />
          <div
            style={{ "--modal-max-w": "840px", width: "min(840px, 95vw)" } as React.CSSProperties}
            className="modal-surface fixed left-1/2 top-1/2 z-[12001] flex max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-brand" />
                <h2 className="text-base font-semibold text-[color:var(--panel-text)]">
                  {songosonUdur} — Өдрийн орлого, зарлага
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSongosonUdur(null)}
                className="rounded-xl p-1.5 text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)]"
                aria-label="Хаах"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick summary header inside modal */}
            <div className="grid grid-cols-3 gap-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/50 px-6 py-3">
              <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                <div className="text-xs text-[color:var(--muted-text)]">Өдрийн орлого</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-success">
                  +{mungu(songosonUdriinOrlogoNiit)}
                </div>
                <div className="text-[11px] text-[color:var(--muted-text)]">{songosonUdriinOrloguud.length} гүйлгээ</div>
              </div>
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                <div className="text-xs text-[color:var(--muted-text)]">Өдрийн зардал</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums text-danger">
                  -{mungu(songosonUdriinZarlagaNiit)}
                </div>
                <div className="text-[11px] text-[color:var(--muted-text)]">{songosonUdriinZarlaguud.length} зарлага</div>
              </div>
              <div className="rounded-xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-3">
                <div className="text-xs text-[color:var(--muted-text)]">Цэвэр зөрүү</div>
                <div
                  className={`mt-0.5 text-lg font-semibold tabular-nums ${
                    songosonUdriinOrlogoNiit - songosonUdriinZarlagaNiit >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {mungu(songosonUdriinOrlogoNiit - songosonUdriinZarlagaNiit)}
                </div>
                <div className="text-[11px] text-[color:var(--muted-text)]">Орлого − Зарлага</div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Орлогын жагсаалт */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-success" />
                    <h3 className="text-sm font-semibold text-[color:var(--panel-text)]">
                      Орлого ({songosonUdriinOrloguud.length})
                    </h3>
                  </div>
                </div>

                {songosonUdriinOrloguud.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--ctl-border)] py-6 text-center text-xs text-[color:var(--muted-text)]">
                    Энэ өдөр орлого ороогүй байна
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[color:var(--ctl-border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] border-b border-[color:var(--ctl-border)]">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Тоот</th>
                          <th className="px-4 py-2.5 font-medium">Төрөл / Тайлбар</th>
                          <th className="px-4 py-2.5 text-right font-medium">Дүн</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--surface-border)]">
                        {songosonUdriinOrloguud.map((o) => (
                          <tr key={o._id} className="hover:bg-[color:var(--surface-hover)]">
                            <td className="px-4 py-2.5 font-medium text-[color:var(--panel-text)]">
                              {o.toot ? `${o.toot} тоот` : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-[color:var(--panel-text)]">
                              <span>{o.tailbar || "Төлбөр"}</span>
                              {o.turul && o.turul !== o.tailbar && (
                                <span className="ml-1.5 rounded bg-[color:var(--surface-border)] px-1.5 py-0.5 text-[10px] text-[color:var(--muted-text)]">
                                  {o.turul}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums text-success">
                              +{mungu(o.dun)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Зарлагын жагсаалт */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-danger" />
                    <h3 className="text-sm font-semibold text-[color:var(--panel-text)]">
                      Зарлага ({songosonUdriinZarlaguud.length})
                    </h3>
                  </div>
                  {zasakhEsekh && (
                    <button
                      type="button"
                      onClick={() =>
                        setTsonkh({
                          ognoo: songosonUdur,
                          dun: "",
                          angilal: "",
                          tailbar: "",
                        })
                      }
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-theme px-2.5 text-xs font-medium text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Зарлага нэмэх
                    </button>
                  )}
                </div>

                {songosonUdriinZarlaguud.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--ctl-border)] py-6 text-center text-xs text-[color:var(--muted-text)]">
                    Энэ өдөр зарлага бүртгэгдээгүй байна
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[color:var(--ctl-border)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[color:var(--surface-bg)] text-[color:var(--muted-text)] border-b border-[color:var(--ctl-border)]">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Ангилал</th>
                          <th className="px-4 py-2.5 font-medium">Тайлбар</th>
                          <th className="px-4 py-2.5 font-medium">Бүртгэсэн</th>
                          <th className="px-4 py-2.5 text-right font-medium">Дүн</th>
                          {zasakhEsekh && <th className="px-3 py-2.5 text-center font-medium w-16"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--surface-border)]">
                        {songosonUdriinZarlaguud.map((z) => (
                          <tr key={z._id} className="hover:bg-[color:var(--surface-hover)]">
                            <td className="px-4 py-2.5 font-medium text-[color:var(--panel-text)]">
                              {z.angilal}
                            </td>
                            <td className="px-4 py-2.5 text-[color:var(--panel-text)]">
                              {z.tailbar || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-[color:var(--muted-text)]">
                              {z.ajiltniiNer || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums text-danger">
                              -{mungu(z.dun)}
                            </td>
                            {zasakhEsekh && (
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTsonkh({
                                        _id: z._id,
                                        ognoo: ognooKharuul(z.ognoo),
                                        dun: Number(z.dun).toFixed(2),
                                        angilal: z.angilal,
                                        tailbar: z.tailbar || "",
                                      })
                                    }
                                    className="rounded p-1 text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => zarlagaUstgakh(z)}
                                    className="rounded p-1 text-[color:var(--muted-text)] hover:text-danger"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-[color:var(--surface-border)] px-6 py-3">
              <button
                type="button"
                onClick={() => setSongosonUdur(null)}
                className="btn-minimal h-9 px-4 text-xs font-medium"
              >
                Хаах
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Зарлага нэмэх/засах модал */}
      {tsonkh && (
        <ModalPortal>
          <div className="fixed inset-0 z-[12000] bg-black/30" onClick={() => setTsonkh(null)} />
          <div
            ref={tsonkhRef}
            onClick={(e) => e.stopPropagation()}
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
