"use client";

/**
 * Хуулга (HistoryModal) — Төрийн банк (BPay) горимтой байгууллагад хуучин хүснэгтийн
 * загвараар (№, Огноо, Ажилтан, Төлөх дүн, Төлсөн дүн, … Үлдэгдэл) харуулна.
 *
 * Сар бүрийн ашиглалтын зардлын задаргаа (гараж орно) нь «Төлөх» мөр, алданги нь
 * тусдаа мөр, төлөгдсөн сар нь «Төлөлт» мөр болно. Backend: GET /bpay/khuulga.
 * Төрийн банк горимгүй байгууллагад юу ч зурахгүй.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "@/lib/uilchilgee";
import { formatCurrency } from "../../../../../tools/function/formatNumber";

type Mur = { ner: string; dun: number; turul?: string };
type Sar = {
  id?: string;
  sar: string;
  tuluv: "Төлөгдөөгүй" | "Төлөгдсөн";
  dun: number;
  aldangi: number;
  aldangitaiDun: number;
  tulsunOgnoo?: string | null;
  tulsunDun?: number | null;
  zadargaa: Mur[];
  taarsan: boolean;
};
type Khariu = { bpay: boolean; saruud?: Sar[] };

type Mur2 = {
  key: string;
  sar: string;
  ognoo: string;
  tulukh: number;
  tulsun: number;
  uldegdel: number;
  khelber: string;
  tailbar: string;
};

const garaj = (t?: string) => t === "Зогсоол" || t === "Гараж";
const ymd = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
};

/** HistoryModal-тай ижил дүрмээр гэрээний id-г олно. */
function gereeniiIdOlokh(contract: any): string {
  const explicit = String(contract?.gereeniiId || contract?.gereeId || contract?._gereeniiId || "").trim();
  if (explicit) return explicit;
  const nekhemjlekhMur = Boolean(
    contract?.medeelel?.zardluud ||
      contract?.medeelel?.guilgeenuud ||
      contract?.nekhemjlekhiinDugaar ||
      contract?.turul === "nekhemjlekh",
  );
  return !nekhemjlekhMur && contract?._id ? String(contract._id).trim() : "";
}

/** Сар бүрийн биллийг хуучин хуулгын мөрүүд болгоно (хуучин → шинэ, running үлдэгдэлтэй). */
function murBolgokh(saruud: Sar[]): Mur2[] {
  const gars: Mur2[] = [];
  let uldegdel = 0;
  const nem = (m: Omit<Mur2, "uldegdel">) => {
    uldegdel = Math.round((uldegdel + m.tulukh - m.tulsun) * 100) / 100;
    gars.push({ ...m, uldegdel });
  };
  // Сервер сарыг "2026-07" хэлбэрт буцаана; нэг сард хэд хэдэн билл байж болно (id-аар ялгана).
  const erembelsen = [...saruud].sort((a, b) => a.sar.localeCompare(b.sar) || String(a.id || "").localeCompare(String(b.id || "")));
  for (const [bi, m] of erembelsen.entries()) {
    const k = `${m.sar}-${m.id || bi}`;
    const ognoo = `${m.sar.replace("-", ".")}.01`;
    const zadargaatai = m.zadargaa?.length && m.taarsan;
    if (zadargaatai) {
      const muruud = [...m.zadargaa.filter((z) => !garaj(z.turul)), ...m.zadargaa.filter((z) => garaj(z.turul))];
      muruud.forEach((z, i) =>
        nem({
          key: `${k}-z${i}`,
          sar: m.sar,
          ognoo,
          tulukh: Number(z.dun) || 0,
          tulsun: 0,
          khelber: "Нэхэмжлэх",
          tailbar: garaj(z.turul) ? `Гараж — ${z.ner}` : z.ner,
        }),
      );
    } else {
      nem({
        key: `${k}-d`,
        sar: m.sar,
        ognoo,
        tulukh: Number(m.dun) || 0,
        tulsun: 0,
        khelber: "Нэхэмжлэх",
        tailbar: "Ашиглалтын зардал",
      });
    }
    if (m.aldangi > 0) {
      nem({ key: `${k}-a`, sar: m.sar, ognoo, tulukh: m.aldangi, tulsun: 0, khelber: "Алданги", tailbar: "Алданги" });
    }
    if (m.tuluv === "Төлөгдсөн") {
      const tulsun = Number(m.tulsunDun ?? m.aldangitaiDun ?? m.dun) || 0;
      nem({
        key: `${k}-t`,
        sar: m.sar,
        ognoo: ymd(m.tulsunOgnoo) || ognoo,
        tulukh: 0,
        tulsun,
        khelber: "Төлөлт",
        tailbar: `${m.sar} сарын төлбөр`,
      });
    }
  }
  return gars;
}

const td = "py-1 px-2 text-[13px] border-r border-b border-[color:var(--surface-border)] text-[color:var(--panel-text)]";
const th =
  "py-1 px-2 text-center text-[11px] border-r border-b border-[color:var(--surface-border)] text-[color:var(--panel-text)] font-medium";
const niitTd =
  "sticky bottom-0 z-10 bg-[color:var(--surface-bg)] py-1 px-2 text-[13px] font-medium text-[color:var(--panel-text)] text-right whitespace-nowrap border-t-2 border-r border-[color:var(--surface-border)]";

export default function BpayKhuulga({
  contract,
  show,
  dateRange,
  onIdevkhtei,
}: {
  contract: any;
  show: boolean;
  /** HistoryModal-ын огнооны шүүлт (YYYY-MM-DD) */
  dateRange?: [string | null, string | null];
  /** BPay хуулга харуулж байгаа эсэхийг эцэгт мэдэгдэнэ */
  onIdevkhtei?: (v: boolean) => void;
}) {
  const { token, baiguullaga } = useAuth() as { token?: string; baiguullaga?: any };
  const bpayGorim = baiguullaga?.tokhirgoo?.bpayAshiglakhEsekh === true;
  const gereeniiId = gereeniiIdOlokh(contract);
  const [khariu, setKhariu] = useState<Khariu | null>(null);
  const [achaalj, setAchaalj] = useState(false);

  useEffect(() => {
    if (!show || !bpayGorim || !token || !gereeniiId) {
      setKhariu(null);
      return;
    }
    let tsutsalsan = false;
    setAchaalj(true);
    uilchilgee(token)
      .get("/bpay/khuulga", { params: { gereeniiId } })
      .then(({ data }) => {
        if (!tsutsalsan) setKhariu(data);
      })
      .catch(() => {
        if (!tsutsalsan) setKhariu(null);
      })
      .finally(() => {
        if (!tsutsalsan) setAchaalj(false);
      });
    return () => {
      tsutsalsan = true;
    };
  }, [show, bpayGorim, token, gereeniiId]);

  const idevkhtei = Boolean(bpayGorim && gereeniiId && khariu?.bpay);
  useEffect(() => {
    onIdevkhtei?.(idevkhtei);
  }, [idevkhtei, onIdevkhtei]);

  const bukhMur = useMemo(() => murBolgokh(khariu?.saruud || []), [khariu]);
  const muruud = useMemo(() => {
    const ekh = dateRange?.[0] ? String(dateRange[0]).slice(0, 7) : "";
    const tugs = dateRange?.[1] ? String(dateRange[1]).slice(0, 7) : "";
    return bukhMur.filter((m) => (!ekh || m.sar >= ekh) && (!tugs || m.sar <= tugs)).reverse();
  }, [bukhMur, dateRange]);

  if (!bpayGorim || !gereeniiId) return null;
  if (!idevkhtei && !achaalj) return null;

  const niitTulukh = muruud.reduce((s, m) => s + m.tulukh, 0);
  const niitTulsun = muruud.reduce((s, m) => s + m.tulsun, 0);
  const uldegdel = muruud.length ? muruud[0].uldegdel : 0;
  const uldegdelAngi = (u: number) =>
    u < 0.01 ? "!text-success dark:!text-success" : "underline underline-offset-2 decoration-danger !text-danger dark:!text-danger";

  return (
    <table className="w-full text-[12px] border-collapse leading-tight">
      <thead className="sticky top-0 z-10 bg-white dark:bg-[color:var(--panel)]">
        <tr className="border-b border-[color:var(--surface-border)]">
          <th className={`${th} w-10 print:w-8`}>№</th>
          <th className={th}>Огноо</th>
          <th className={`${th} hidden sm:table-cell print:table-cell`}>Ажилтан</th>
          <th className={th}>Төлөх дүн</th>
          <th className={th}>Төлсөн дүн</th>
          <th className={th}>Хөнгөлөлт</th>
          <th className={th}>Үлдэгдэл сараар</th>
          <th className={`${th} hidden md:table-cell print:table-cell`}>Хэлбэр</th>
          <th className={`${th} hidden md:table-cell print:table-cell`}>Тайлбар</th>
          <th className={`${th} hidden lg:table-cell print:table-cell`}>Бүртгэсэн огноо</th>
          <th className="py-1 px-1 text-center text-[11px] border-b border-[color:var(--surface-border)] text-[color:var(--panel-text)] font-medium w-12">
            Үйлдэл
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[color:var(--surface-border)]">
        {achaalj && !khariu ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td colSpan={11} className="py-3 px-2">
                <div className="h-3 bg-[color:var(--surface-hover)] rounded w-full"></div>
              </td>
            </tr>
          ))
        ) : muruud.length === 0 ? (
          <tr>
            <td colSpan={11} className="py-12 text-center">
              <span className="text-[color:var(--muted-text)] text-[13px]">Мэдээлэл олдсонгүй</span>
            </td>
          </tr>
        ) : (
          <>
            {muruud.map((m, idx) => (
              <tr key={m.key} className="hover:bg-[color:var(--surface-hover)] transition-colors">
                <td className={`${td} py-1 px-1.5 whitespace-nowrap text-center tabular-nums w-10 print:w-8`}>{idx}</td>
                <td className={`${td} whitespace-nowrap text-center`}>{m.ognoo}</td>
                <td className={`${td} hidden sm:table-cell text-center`}>Систем</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatCurrency(m.tulukh)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatCurrency(m.tulsun)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>{formatCurrency(0)}</td>
                <td
                  data-print-balance={m.uldegdel < 0.01 ? "ok" : "due"}
                  className={`${td} text-right whitespace-nowrap ${uldegdelAngi(m.uldegdel)}`}
                >
                  {formatCurrency(m.uldegdel)}
                </td>
                <td className={`${td} hidden md:table-cell print:table-cell text-center capitalize`}>{m.khelber}</td>
                <td className={`${td} hidden md:table-cell print:table-cell`}>{m.tailbar}</td>
                <td
                  className={`${td} !text-[color:var(--muted-text)] hidden lg:table-cell print:table-cell whitespace-nowrap text-center`}
                >
                  -
                </td>
                <td className="py-1 px-1 border-b border-[color:var(--surface-border)] text-center w-12 text-[color:var(--muted-text)]">
                  -
                </td>
              </tr>
            ))}
            <tr className="history-print-total-row hm-niit-mur bg-[color:var(--surface-bg)]">
              <td colSpan={3} className={`${niitTd} text-left`}>
                Нийт
              </td>
              <td className={niitTd}>{formatCurrency(niitTulukh)} ₮</td>
              <td className={niitTd}>{formatCurrency(niitTulsun)} ₮</td>
              <td className={niitTd}>{formatCurrency(0)} ₮</td>
              <td
                data-print-balance={uldegdel < 0.01 ? "ok" : "due"}
                className={`sticky bottom-0 z-10 bg-[color:var(--surface-bg)] py-1 px-2 text-[14px] font-semibold text-right whitespace-nowrap border-t-2 border-r border-[color:var(--surface-border)] ${uldegdelAngi(uldegdel)}`}
              >
                {formatCurrency(uldegdel)} ₮
              </td>
              <td colSpan={4} className="sticky bottom-0 z-10 bg-[color:var(--surface-bg)] border-t-2 border-r border-[color:var(--surface-border)]"></td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
