"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Printer } from "lucide-react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import ExcelButton from "@/components/ui/ExcelButton";
import Table from "@/components/ui/table";
import { useBuilding } from "@/context/BuildingContext";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { getDefaultDateRange } from "@/lib/utils";
import formatNumber from "../../../../../tools/function/formatNumber";

/**
 * Шилэн данс — оршин суугчдын төлбөрийн мэдээлэл.
 *
 *  - Нэхэмжилсэн / Төлсөн — сонгосон хугацаанд (цуцалсан гэрээний төлөлт ч орно)
 *  - Төлөөгүй — хугацааны эцсийн нийт үлдэгдэл
 *  - Хугацаа хэтэрсэн — 30 хоногоос хуучин төлөгдөөгүй нэхэмжлэл; картыг дарахад
 *    тэдгээр айл шүүгдэнэ
 * Вэб бүрэн мэдээлэл (нэр, утас, хоног) харна; апп зөвхөн тоот + дүн.
 * Өгөгдөл: sukhBackv2 controller/shilenDans.js (POST /shilenDans/tailan).
 */

/** Тоот (гэрээ) тус бүрийн тооцоо. Эхний + Дебет − Кредит = Эцсийн. */
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

interface ShilenDansKhariu {
  khetersenKhonog: number;
  nekhemjilsen: number;
  tulsun: number;
  khungulult: number;
  tuluugui: number;
  khetersen: number;
  khetersenAilToo: number;
  ailuud: AilMur[];
}

type Shuult = "bugd" | "tuluugui" | "khetersen";

const aldaaZurvas = (err: any, ankhdagch: string) =>
  err?.response?.data?.message || err?.response?.data?.aldaa || err?.message || ankhdagch;

const mungu = (v: number) => formatNumber(v || 0, 2);

export default function ShilenDansPage() {
  const { selectedBuildingId } = useBuilding();
  const { token } = useAuth();
  const { searchTerm } = useSearch();

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const [data, setData] = useState<ShilenDansKhariu | null>(null);
  const [loading, setLoading] = useState(false);
  const [aldaa, setAldaa] = useState<string | null>(null);
  const [shuult, setShuult] = useState<Shuult>("bugd");

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
  }, [token, selectedBuildingId, dateRange]);

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
      debet: s.debet + a.debet,
      kredit: s.kredit + a.kredit,
      etssiin: s.etssiin + a.etssiin,
      khetersen: s.khetersen + a.khetersen,
    }),
    { ekhnii: 0, debet: 0, kredit: 0, etssiin: 0, khetersen: 0 },
  );
  const tuluuguiToo = ailuud.filter((a) => a.etssiin > 0).length;
  const khetersenKhonog = data?.khetersenKhonog ?? 30;

  const excelTatakh = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Шилэн данс", `${dateRange?.[0] || ""} — ${dateRange?.[1] || ""}`],
        [],
        ["Нэхэмжилсэн", data.nekhemjilsen],
        ["Төлсөн", data.tulsun],
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
        [
          "Орц",
          "Тоот",
          "Нэр",
          "Утас",
          "Эхний үлдэгдэл",
          "Дебет",
          "Кредит",
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
          a.debet,
          a.kredit,
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

  const baganuud = [
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
    mungunBagana("Дебет", "debet"),
    mungunBagana("Кредит", "kredit", () => "text-success"),
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

  const kartuud: { nershil: string; utga: string; ungu: string; shuult?: Shuult; tailbar?: string }[] = [
    { nershil: "Нэхэмжилсэн", utga: mungu(data?.nekhemjilsen || 0), ungu: "text-[color:var(--panel-text)]" },
    {
      nershil: "Төлсөн",
      utga: mungu(data?.tulsun || 0),
      ungu: "text-success",
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
        <div className="flex flex-wrap gap-1">
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
              className={`h-9 rounded-[10px] px-4 text-[13px] transition-colors ${
                shuult === k
                  ? "bg-theme/15 font-medium text-brand"
                  : "text-[color:var(--muted-text)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--panel-text)]"
              }`}
            >
              {ner}
            </button>
          ))}
        </div>
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

      <section className="rounded-2xl border border-[color:var(--ctl-border)] bg-[color:var(--surface-bg)] p-4 shadow-[var(--ctl-shadow)]">
        <div className="mb-3">
          <h2 className="text-[15px] font-semibold text-[color:var(--panel-text)]">
            {shuult === "khetersen"
              ? "Хугацаа хэтэрсэн айлууд"
              : shuult === "tuluugui"
                ? "Төлөөгүй айлууд"
                : "Оршин суугчдын тооцоо"}
          </h2>
          <p className="mt-0.5 text-xs text-[color:var(--muted-text)]">
            Дебет = нэхэмжилсэн, Кредит = төлсөн + хөнгөлөлт. Эхний үлдэгдэл + Дебет − Кредит =
            Эцсийн үлдэгдэл. Хугацаа хэтэрсэн = {khetersenKhonog} хоногоос дээш төлөгдөөгүй.
          </p>
        </div>
        <Table
          dataSource={kharagdakh}
          columns={baganuud}
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
                  {(["ekhnii", "debet", "kredit", "etssiin", "khetersen"] as const).map((k, i) => (
                    <Table.Summary.Cell
                      key={k}
                      index={i + 4}
                      align="right"
                      className="text-[13px] font-medium tabular-nums"
                    >
                      {mungu(niit[k])}
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={9} />
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </section>
    </div>
  );
}
