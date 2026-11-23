"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Info, Printer } from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import ExcelButton from "@/components/ui/ExcelButton";
import Table from "@/components/ui/table";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import formatNumber from "../../../../../tools/function/formatNumber";

/**
 * Шилэн данс — СӨХ-ийн тухайн хугацааны орлого, зарлага, авлага, дансны
 * үлдэгдлийг гишүүдэд ил тод харуулах тайлан. Өгөгдөл: POST /shilenDans/tailan
 * (sukhBackv2 controller/shilenDans.js).
 *
 * Төсөв ба зарлагын ангилал одоогоор байхгүй — тусдаа model хэрэгтэй.
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
}

interface ShilenDansKhariu {
  bank: {
    orlogo: number;
    zarlaga: number;
    dansuud: DansMur[];
    zarlaguud: ZarlagaMur[];
  };
  avlaga: {
    nekhemjilsen: number;
    tulsun: number;
    khungulult: number;
    ekhniiAvlaga: number;
    etssiinAvlaga: number;
    zardalaar: { ner: string; nekhemjilsen: number; tulsun: number }[];
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
      ["Нэхэмжилсэн", avlaga?.nekhemjilsen ?? 0],
      ["Төлөгдсөн", avlaga?.tulsun ?? 0],
      ["Хөнгөлөлт", avlaga?.khungulult ?? 0],
      ["Авлагын эхний үлдэгдэл", avlaga?.ekhniiAvlaga ?? 0],
      ["Авлагын эцсийн үлдэгдэл", avlaga?.etssiinAvlaga ?? 0],
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
        ["Зардал", "Нэхэмжилсэн", "Төлөгдсөн"],
        ...(avlaga?.zardalaar || []).map((z) => [z.ner, z.nekhemjilsen, z.tulsun]),
      ]),
      "Орлого",
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Огноо", "Данс", "Гүйлгээний утга", "Харьцсан данс", "Харьцсан нэр", "Дүн"],
        ...(bank?.zarlaguud || []).map((z) => [
          ognooKharuul(z.ognoo),
          z.dansniiDugaar,
          z.utga,
          z.kharitsakhDans,
          z.kharitsakhNer,
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

  const zardalBaganuud = [
    { title: "Зардлын нэр", dataIndex: "ner", key: "ner" },
    {
      title: "Нэхэмжилсэн",
      dataIndex: "nekhemjilsen",
      key: "nekhemjilsen",
      align: "right" as const,
      render: (v: number) => formatNumber(v),
    },
    {
      title: "Төлөгдсөн",
      dataIndex: "tulsun",
      key: "tulsun",
      align: "right" as const,
      render: (v: number) => <span className="text-success">{formatNumber(v)}</span>,
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
        {/* 2. Орлого — нэхэмжилсэн / төлөгдсөн */}
        <Khavtas
          garchig="Орлого (нэхэмжлэл)"
          tailbar="Оршин суугчдад нэхэмжилсэн ба төлөгдсөн дүн, зардлын төрлөөр. Өмнөх үеийн эхний үлдэгдэл орохгүй."
        >
          <Table
            dataSource={avlaga?.zardalaar || []}
            columns={zardalBaganuud}
            rowKey="ner"
            pagination={false}
            loading={loading}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "Мэдээлэл алга" }}
            summary={() =>
              avlaga && avlaga.zardalaar.length > 0 ? (
                <Table.Summary.Row className="bg-theme/5">
                  <Table.Summary.Cell index={0} className="text-[13px] font-medium">
                    Нийт
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right" className="text-[13px] font-medium">
                    {formatNumber(avlaga.nekhemjilsen)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right" className="text-[13px] font-medium">
                    {formatNumber(avlaga.tulsun)}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null
            }
          />
        </Khavtas>

        <div className="flex flex-col gap-3">
          {/* 4. Авлага */}
          <Khavtas garchig="Авлага" tailbar="Оршин суугчдын төлөөгүй үлдэгдэл.">
            <MurUtga ner="Эхний үлдэгдэл" utga={mungu(avlaga?.ekhniiAvlaga)} />
            <MurUtga ner="Нэхэмжилсэн" utga={`+ ${mungu(avlaga?.nekhemjilsen)}`} />
            <MurUtga ner="Төлөгдсөн" utga={`− ${mungu(avlaga?.tulsun)}`} ungu="text-success" />
            <MurUtga ner="Хөнгөлөлт" utga={`− ${mungu(avlaga?.khungulult)}`} />
            <MurUtga
              ner="Эцсийн үлдэгдэл"
              utga={mungu(avlaga?.etssiinAvlaga)}
              ungu={(avlaga?.etssiinAvlaga || 0) > 0 ? "text-danger" : undefined}
            />
          </Khavtas>

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
        tailbar="Банкны данснаас гарсан гүйлгээ. Зарлагын ангилал (цалин, ус, дулаан, засвар г.м.) дараагийн шатанд нэмэгдэнэ."
      >
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
          Төсөв ба гүйцэтгэлийн харьцуулалт, зарлагын ангилал нь тусдаа бүртгэл шаардах тул
          дараагийн шатанд нэмэгдэнэ.
        </span>
      </div>
    </div>
  );
}
