"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Info, Printer } from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import ExcelButton from "@/components/ui/ExcelButton";
import FilterSelect from "@/components/ui/FilterSelect";
import Table from "@/components/ui/table";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import formatNumber from "../../../../../tools/function/formatNumber";

/**
 * Шилэн данс — СӨХ-ийн тухайн хугацааны орлого, зарлага, авлага, дансны
 * үлдэгдлийг гишүүдэд ил тод харуулах тайлан. Өгөгдөл: POST /shilenDans/tailan
 * (sukhBackv2 controller/shilenDans.js).
 *
 * Зарлагын ангиллыг ажилтан мөр бүрд онооно (POST /shilenDans/zarlagaAngilal).
 * Төсөв одоогоор байхгүй — тусдаа model хэрэгтэй.
 */

interface DansMur {
  dansniiDugaar: string;
  bank: string;
  orlogo: number;
  zarlaga: number;
  ekhniiUldegdel: number | null;
  etssiinUldegdel: number | null;
  guilgeeniiToo: number;
}

interface ZarlagaMur {
  _id: string;
  ognoo: string;
  dun: number;
  dansniiDugaar: string;
  bank: string;
  utga: string;
  kharitsakhDans: string;
  kharitsakhNer: string;
  angilal: string;
}

interface ShilenDansKhariu {
  bank: {
    orlogo: number;
    zarlaga: number;
    dansuud: DansMur[];
    zarlaguud: ZarlagaMur[];
    zarlagaAngilalaar: { angilal: string; dun: number }[];
  };
  zarlagiinAngilaluud: string[];
  /** Төлсөн мөнгө = орлого, төлөөгүй мөнгө = авлага. */
  avlaga: {
    tulsun: number;
    etssiinAvlaga: number;
  };
  zogsool: {
    niit: number;
    kamer: number;
    garaar: number;
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
  khariltsakh: "Харилцах",
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
  v === null || v === undefined ? "-" : formatNumber(v);

function Khavtas({
  garchig,
  tailbar,
  children,
}: {
  garchig: string;
  tailbar?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)]">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[color:var(--panel-text)]">{garchig}</h2>
        {tailbar && (
          <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">{tailbar}</p>
        )}
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

export default function ShilenDansPage() {
  const { selectedBuildingId } = useBuilding();
  const { token } = useAuth();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const [data, setData] = useState<ShilenDansKhariu | null>(null);
  const [loading, setLoading] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);

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
        if (!tsutslagdsan) {
          setAldaa(
            err?.response?.data?.aldaa ||
              err?.response?.data?.message ||
              err?.message ||
              "Алдаа гарлаа",
          );
        }
      } finally {
        if (!tsutslagdsan) setLoading(false);
      }
    })();
    return () => {
      tsutslagdsan = true;
    };
  }, [token, selectedBuildingId, dateRange]);

  const angilalOnooy = async (mur: ZarlagaMur, angilal: string) => {
    const umnukh = data;
    // Шууд харуулна; алдаа гарвал буцаана
    setData((d) => {
      if (!d) return d;
      const zarlaguud = d.bank.zarlaguud.map((z) =>
        z._id === mur._id ? { ...z, angilal } : z,
      );
      const map: Record<string, number> = {};
      zarlaguud.forEach((z) => {
        const k = z.angilal || "Ангилаагүй";
        map[k] = (map[k] || 0) + z.dun;
      });
      return {
        ...d,
        bank: {
          ...d.bank,
          zarlaguud,
          zarlagaAngilalaar: Object.entries(map)
            .map(([a, dun]) => ({ angilal: a, dun }))
            .sort((a, b) => b.dun - a.dun),
        },
      };
    });
    try {
      await uilchilgee(token ?? undefined).post("/shilenDans/zarlagaAngilal", {
        id: mur._id,
        angilal,
      });
    } catch (err: any) {
      setData(umnukh);
      openErrorOverlay(
        err?.response?.data?.message || err?.message || "Ангилал хадгалахад алдаа гарлаа",
      );
    }
  };

  const bank = data?.bank;
  const avlaga = data?.avlaga;
  const zogsool = data?.zogsool;

  const bankUldegdel = useMemo(() => {
    const dansuud = bank?.dansuud || [];
    const medeeltei = dansuud.filter((d) => d.ekhniiUldegdel !== null);
    if (medeeltei.length === 0) return { ekhnii: null, etssiin: null };
    return {
      ekhnii: medeeltei.reduce((s, d) => s + (d.ekhniiUldegdel || 0), 0),
      etssiin: medeeltei.reduce((s, d) => s + (d.etssiinUldegdel || 0), 0),
    };
  }, [bank]);

  const khugatsaa = `${dateRange?.[0] || ""} — ${dateRange?.[1] || ""}`;

  const excelTatakh = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const khuraangui = [
      ["Шилэн данс", khugatsaa],
      [],
      ["Үзүүлэлт", "Дүн"],
      ["Дансны эхний үлдэгдэл", bankUldegdel.ekhnii ?? ""],
      ["Дансны орлого", bank?.orlogo ?? 0],
      ["Дансны зарлага", bank?.zarlaga ?? 0],
      ["Дансны эцсийн үлдэгдэл", bankUldegdel.etssiin ?? ""],
      [],
      ["Орлого (төлсөн мөнгө)", avlaga?.tulsun ?? 0],
      ["Авлага (төлөөгүй мөнгө)", avlaga?.etssiinAvlaga ?? 0],
      [],
      ["Зогсоолын орлого", zogsool?.niit ?? 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(khuraangui), "Хураангуй");

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Данс", "Банк", "Эхний үлдэгдэл", "Орлого", "Зарлага", "Эцсийн үлдэгдэл"],
        ...(bank?.dansuud || []).map((d) => [
          d.dansniiDugaar,
          d.bank,
          d.ekhniiUldegdel ?? "",
          d.orlogo,
          d.zarlaga,
          d.etssiinUldegdel ?? "",
        ]),
      ]),
      "Данс",
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Огноо", "Данс", "Гүйлгээний утга", "Харьцсан данс", "Харьцсан нэр", "Ангилал", "Дүн"],
        ...(bank?.zarlaguud || []).map((z) => [
          ognooKharuul(z.ognoo),
          z.dansniiDugaar,
          z.utga,
          z.kharitsakhDans,
          z.kharitsakhNer,
          z.angilal || "Ангилаагүй",
          z.dun,
        ]),
      ]),
      "Зарлага",
    );

    XLSX.writeFile(
      wb,
      `Шилэн_данс_${dateRange?.[0] || ""}_${dateRange?.[1] || ""}.xlsx`,
    );
  };

  const dansBaganuud = [
    { title: "Данс", dataIndex: "dansniiDugaar", key: "dansniiDugaar" },
    { title: "Банк", dataIndex: "bank", key: "bank" },
    {
      title: "Эхний үлдэгдэл",
      dataIndex: "ekhniiUldegdel",
      key: "ekhniiUldegdel",
      align: "right" as const,
      render: (v: number | null) => mungu(v),
    },
    {
      title: "Орлого",
      dataIndex: "orlogo",
      key: "orlogo",
      align: "right" as const,
      render: (v: number) => <span className="text-success">{formatNumber(v)}</span>,
    },
    {
      title: "Зарлага",
      dataIndex: "zarlaga",
      key: "zarlaga",
      align: "right" as const,
      render: (v: number) => <span className="text-danger">{formatNumber(v)}</span>,
    },
    {
      title: "Эцсийн үлдэгдэл",
      dataIndex: "etssiinUldegdel",
      key: "etssiinUldegdel",
      align: "right" as const,
      render: (v: number | null) => mungu(v),
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
    { title: "Данс", dataIndex: "dansniiDugaar", key: "dansniiDugaar", width: 140 },
    { title: "Гүйлгээний утга", dataIndex: "utga", key: "utga" },
    {
      title: "Харьцсан",
      key: "kharitsakh",
      render: (_: unknown, r: ZarlagaMur) =>
        [r.kharitsakhNer, r.kharitsakhDans].filter(Boolean).join(" · ") || "-",
    },
    {
      title: "Ангилал",
      key: "angilal",
      width: 200,
      render: (_: unknown, r: ZarlagaMur) => (
        <FilterSelect
          value={r.angilal || ""}
          onChange={(v) => angilalOnooy(r, v)}
          options={(data?.zarlagiinAngilaluud || []).map((a) => ({ value: a, label: a }))}
          placeholder="Ангилаагүй"
          bugdLabel={null}
          className="w-[180px]"
        />
      ),
    },
    {
      title: "Дүн",
      dataIndex: "dun",
      key: "dun",
      align: "right" as const,
      width: 140,
      render: (v: number) => <span className="text-danger">{formatNumber(v)}</span>,
    },
  ];

  const kartuud = [
    { nershil: "Дансны эхний үлдэгдэл", utga: mungu(bankUldegdel.ekhnii), ungu: "text-[color:var(--panel-text)]" },
    { nershil: "Орлого", utga: formatNumber(bank?.orlogo || 0), ungu: "text-success" },
    { nershil: "Зарлага", utga: formatNumber(bank?.zarlaga || 0), ungu: "text-danger" },
    { nershil: "Дансны эцсийн үлдэгдэл", utga: mungu(bankUldegdel.etssiin), ungu: "text-[color:var(--panel-text)]" },
  ];

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

      {/* 1. Товч үзүүлэлт */}
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

      <Khavtas
        garchig="Данс тус бүрээр"
        tailbar="Банкны хуулгаас. Өөрийн данс хооронд шилжүүлсэн гүйлгээ орлого, зарлага хоёуланд нь тусна."
      >
        <Table
          dataSource={bank?.dansuud || []}
          columns={dansBaganuud}
          rowKey="dansniiDugaar"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "Энэ хугацаанд банкны гүйлгээ алга" }}
        />
      </Khavtas>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {/* 2. Орлого ба авлага — төлсөн мөнгө орлого, төлөөгүй мөнгө авлага */}
        <Khavtas garchig="Орлого ба авлага" tailbar="Оршин суугчдын төлбөр.">
          <MurUtga
            ner="Орлого (төлсөн мөнгө)"
            utga={loading ? "…" : mungu(avlaga?.tulsun)}
            ungu="text-success"
          />
          <MurUtga
            ner="Авлага (төлөөгүй мөнгө)"
            utga={loading ? "…" : mungu(avlaga?.etssiinAvlaga)}
            ungu={(avlaga?.etssiinAvlaga || 0) > 0 ? "text-danger" : undefined}
          />
        </Khavtas>

        <div className="flex flex-col gap-3">
          {/* 3. Зогсоолын орлого */}
          <Khavtas garchig="Зогсоолын орлого" tailbar="Камер касс болон гараар бүртгэсэн төлбөр.">
            {zogsool ? (
              <>
                {zogsool.turlaar.map((t) => (
                  <MurUtga key={t.turul} ner={khelberNer(t.turul)} utga={formatNumber(t.dun)} />
                ))}
                <MurUtga ner="Нийт" utga={formatNumber(zogsool.niit)} ungu="text-success" />
              </>
            ) : (
              <p className="text-[13px] text-[color:var(--muted-text)]">
                {loading ? "Ачаалж байна…" : "Зогсоолын мэдээлэл алга"}
              </p>
            )}
          </Khavtas>
        </div>
      </div>

      {/* 5. Зарлага */}
      <Khavtas
        garchig="Зарлага"
        tailbar="Банкны данснаас гарсан гүйлгээ. Мөр бүрд ангилал онооход оршин суугчийн аппын «Зарцуулалт» хэсэгт ангиллаар харагдана."
      >
        {(bank?.zarlagaAngilalaar || []).length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {(bank?.zarlagaAngilalaar || []).map((a) => {
              const khuvi = bank?.zarlaga ? Math.round((a.dun / bank.zarlaga) * 100) : 0;
              return (
                <div key={a.angilal} className="flex items-center gap-3 text-[13px]">
                  <span className="w-40 shrink-0 truncate text-[color:var(--panel-text)]">
                    {a.angilal}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-theme/10">
                    <div
                      className={`h-full rounded-full ${a.angilal === "Ангилаагүй" ? "bg-[color:var(--muted-text)]" : "bg-theme"}`}
                      style={{ width: `${khuvi}%` }}
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right tabular-nums">{formatNumber(a.dun)}</span>
                  <span className="w-10 shrink-0 text-right text-[color:var(--muted-text)]">{khuvi}%</span>
                </div>
              );
            })}
          </div>
        )}
        <Table
          dataSource={bank?.zarlaguud || []}
          columns={zarlagaBaganuud}
          rowKey="_id"
          pagination={false}
          loading={loading}
          scroll={{ x: "max-content", y: 480 }}
          locale={{ emptyText: "Энэ хугацаанд зарлага алга" }}
        />
      </Khavtas>

      <div className="flex items-start gap-2 px-1 text-xs text-[color:var(--muted-text)] no-print">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span>
          Төсөв ба гүйцэтгэлийн харьцуулалт нь тусдаа бүртгэл шаардах тул дараагийн шатанд
          нэмэгдэнэ. Аппад харуулах эсэхийг «Тохиргоо → Нэмэлт → Шилэн данс аппад харуулах»-аас.
        </span>
      </div>
    </div>
  );
}
