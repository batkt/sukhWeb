"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber, {
  formatCurrency,
} from "../../../../tools/function/formatNumber";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import InvoiceModal from "./InvoiceModal";
import { ModalPortal } from "../../../../components/golContent";
import { ledgerFilterYmdKey } from "@/app/tulbur/guilgeeTuukh/ledgerRunningBalances";

/** Хэвлэх мэтадата — нэвтэрсэн ажилтны нэр */
type HistoryModalPrintedBy = {
  ovog?: string;
  ner?: string;
  nevtrekhNer?: string;
} | null;

interface HistoryModalProps {
  show: boolean;
  onClose: () => void;
  contract: any;
  token: string | null;
  baiguullagiinId: string | null;
  barilgiinId?: string | null;
  onRefresh?: () => void;
  /** When opening from /tulbur (etc.), pre-fill the ledger date filter so it matches the list page. */
  pageDateRange?: [string | null, string | null] | undefined;
  /** Хэвлэсэн ажилтан (дэлгэц/хэвлэлд харуулна) */
  printedByAjiltan?: HistoryModalPrintedBy;
  /** Байгууллагын нэр — хэвлэгчийн толгойн гарчигт (document.title) */
  baiguullagiinNer?: string | null;
}

interface LedgerEntry {
  ognoo: string;
  ner: string;
  tulukhDun: number;
  tulsunDun: number;
  uldegdel: number;
  isSystem: boolean;
  ajiltan?: string;
  khelber?: string;
  tailbar?: string;
  burtgesenOgnoo?: string;
  _id?: string;
  parentInvoiceId?: string;
  sourceCollection?:
    | "nekhemjlekhiinTuukh"
    | "gereeniiTulsunAvlaga"
    | "gereeniiTulukhAvlaga";
}

type LedgerDetailSelection =
  | { kind: "row"; row: LedgerEntry }
  | {
      kind: "total";
      balance: number;
      totalCharges: number;
      totalPayments: number;
    };

/** ISO instant → UTC өдрийн YYYY-MM-DD (жишээ нь 2026-02-01T04:00:00.000Z → 2026-02-01, Америкийн TZ-д local Date-ээр 1.31 болдоггүй) */
function ledgerInstantToUtcYmd(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) {
    const t = raw.getTime();
    if (Number.isNaN(t)) return null;
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(raw.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  if (!s) return null;
  const dm = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dm) {
    return `${dm[1]}-${String(Number(dm[2])).padStart(2, "0")}-${String(Number(dm[3])).padStart(2, "0")}`;
  }
  const t = new Date(s).getTime();
  if (Number.isNaN(t)) return null;
  const x = new Date(t);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-${String(x.getUTCDate()).padStart(2, "0")}`;
}

/** RangePicker заримдаа Dayjs дамжуулдаг; жагсаалтын `setState`-ээр string биш орсон ч шүүлт зөв ажиллана. */
function coercePickerValueToYmd(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { format?: (f: string) => string }).format === "function"
  ) {
    try {
      const x = (v as { format: (f: string) => string }).format("YYYY-MM-DD");
      return x && String(x).trim() ? String(x).trim() : null;
    } catch {
      return null;
    }
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v ?? "").trim();
  if (!s) return null;
  const isoKey = ledgerFilterYmdKey(s);
  if (isoKey) return isoKey;
  // DD.MM.YYYY / DD/MM/YYYY
  const eu = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (eu) {
    const d = Number(eu[1]);
    const mo = Number(eu[2]);
    const y = Number(eu[3]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  // YYYY.MM.DD
  const ymdDots = s.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})$/);
  if (ymdDots) {
    return `${ymdDots[1]}-${String(Number(ymdDots[2])).padStart(2, "0")}-${String(Number(ymdDots[3])).padStart(2, "0")}`;
  }
  // Зөвхөн сар YYYY-MM — pickerBoundsToYmdKeys эхэнд 01, төгсгөлд сарын сүүл өдөр тавина
  const ym = s.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) {
    const mo = Number(ym[2]);
    if (mo >= 1 && mo <= 12) {
      return `${ym[1]}-${String(mo).padStart(2, "0")}`;
    }
  }
  const t = new Date(s).getTime();
  if (!Number.isNaN(t)) {
    const x = new Date(t);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  }
  return null;
}

/** Жагсаалтын `YYYY-MM` зэрэг богино огноог бүтэн YYYY-MM-DD түлхүүр болгоно. */
function pickerBoundsToYmdKeys(
  startNorm: string | null,
  endNorm: string | null,
): { startKey: string | null; endKey: string | null } {
  let startKey = startNorm ? ledgerFilterYmdKey(startNorm) : null;
  let endKey = endNorm ? ledgerFilterYmdKey(endNorm) : null;

  if (!startKey && startNorm) {
    const ym = String(startNorm)
      .trim()
      .match(/^(\d{4})-(\d{1,2})$/);
    if (ym) {
      const y = Number(ym[1]);
      const mo = Number(ym[2]);
      if (mo >= 1 && mo <= 12) {
        startKey = `${y}-${String(mo).padStart(2, "0")}-01`;
      }
    }
  }
  if (!endKey && endNorm) {
    const ym = String(endNorm)
      .trim()
      .match(/^(\d{4})-(\d{1,2})$/);
    if (ym) {
      const y = Number(ym[1]);
      const mo = Number(ym[2]);
      if (mo >= 1 && mo <= 12) {
        endKey = ymdEndOfCalendarMonth(
          `${y}-${String(mo).padStart(2, "0")}-01`,
        );
      }
    }
  }

  return { startKey, endKey };
}

function ymdEndOfCalendarMonth(ymd: string): string {
  const parts = ymd.split("-");
  const ys = Number(parts[0]);
  const ms = Number(parts[1]);
  const last = new Date(ys, ms, 0).getDate();
  return `${ys}-${String(ms).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function ymdStartOfCalendarMonth(ymd: string): string {
  const [ys, ms] = ymd.split("-").map((x) => Number(x));
  return `${ys}-${String(ms).padStart(2, "0")}-01`;
}

/** YYYY-MM-DD түлхүүрийг эрэмбэлэлтэд ашиглах бүхэл тоо (string харьцуулалтын алдаа гаргахгүй). */
function ymdKeyToSortNumber(ymd: string | null | undefined): number | null {
  if (ymd == null || !String(ymd).trim()) return null;
  const k = ledgerFilterYmdKey(String(ymd).trim());
  if (!k) return null;
  const m = k.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]);
}

/** Хүснэгтийн «Огноо» (`formatLedgerOgnooCell`)той ижил эхний дүрэм — prefix vs UTC зөрүүгээр 4-р сарын мөр 3-р сарын шүүлтэнд ордоггүй. */
function ledgerRowKeyMatchingDisplayColumn(ognoo: unknown): string | null {
  return ledgerInstantToUtcYmd(ognoo) ?? ledgerFilterYmdKey(ognoo);
}

function normalizeLedgerOgnooStorage(raw: unknown): string {
  return ledgerInstantToUtcYmd(raw) ?? String(raw ?? "").trim();
}

function formatLedgerOgnooCell(raw: unknown): string {
  const ymd = ledgerInstantToUtcYmd(raw);
  if (!ymd) return String(raw ?? "").trim() || "-";
  return ymd.replace(/-/g, ".");
}

function roundLedgerRunningStep(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Ижилхэн мөрүүд (давхар нэхэмжлэх/давхар invoice) — үлдэгдэл дахин 135k-аас эхэлж харагдана.
 * Эхний ижил түлхүүртэй мөрийг үлдээж, дараагийг алгасанаар хүснэгтийг цэвэрлэнэ.
 */
function dedupeSemanticallyIdenticalLedgerRows(
  rows: LedgerEntry[],
): LedgerEntry[] {
  const seen = new Set<string>();
  const out: LedgerEntry[] = [];
  for (const row of rows) {
    const o = normalizeLedgerOgnooStorage(row.ognoo);
    const k = [
      o,
      roundLedgerRunningStep(Number(row.tulukhDun || 0)),
      roundLedgerRunningStep(Number(row.tulsunDun || 0)),
      String(row.tailbar ?? "").trim(),
      String(row.khelber ?? "").trim(),
      String(row.ner ?? "").trim(),
      String(row.burtgesenOgnoo ?? "").trim(),
      String(row.sourceCollection ?? "").trim(),
    ].join("\u0001");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

function compareLedgerEntriesChrono(a: LedgerEntry, b: LedgerEntry): number {
  const dA = new Date(a.ognoo || 0);
  const dB = new Date(b.ognoo || 0);
  const dayA = new Date(
    dA.getFullYear(),
    dA.getMonth(),
    dA.getDate(),
  ).getTime();
  const dayB = new Date(
    dB.getFullYear(),
    dB.getMonth(),
    dB.getDate(),
  ).getTime();
  if (dayA !== dayB) return dayA - dayB;

  const timeA = new Date(
    a.burtgesenOgnoo && a.burtgesenOgnoo !== "-"
      ? a.burtgesenOgnoo
      : a.ognoo || 0,
  ).getTime();
  const timeB = new Date(
    b.burtgesenOgnoo && b.burtgesenOgnoo !== "-"
      ? b.burtgesenOgnoo
      : b.ognoo || 0,
  ).getTime();
  if (timeA !== timeB) return timeA - timeB;

  return String(a._id || "").localeCompare(String(b._id || ""));
}

function ledgerEntryYmKey(row: LedgerEntry): string {
  const ymd = ledgerRowKeyMatchingDisplayColumn(row.ognoo);
  if (ymd && ymd.length >= 7) return ymd.slice(0, 7);
  return "—";
}

function formatYmDisplayLabel(ym: string): string {
  if (ym === "—") return "Огноо тодорхойгүй";
  const [y, mo] = ym.split("-");
  return y && mo ? `${y}.${mo}` : ym;
}

type LedgerMonthBreakdownRow = {
  ym: string;
  displayMonth: string;
  tulukh: number;
  tulsun: number;
  balanceStart: number;
  balanceEnd: number;
};

/** Эхний мөрийн өмнөх үлдэгдэл: row.uldegdel = өмнөх + tulukhDun - tulsunDun */
function ledgerOpeningBeforeFirstEntry(first: LedgerEntry): number {
  const u = Number(first.uldegdel);
  if (!Number.isFinite(u)) return 0;
  return roundLedgerRunningStep(
    u - Number(first.tulukhDun || 0) + Number(first.tulsunDun || 0),
  );
}

type LedgerRunningMode = "fromZero" | "fromFirstRowPostedBalance";

/**
 * Давхар мөр хассаны дараа үлдэгдлийг дахин тооцно.
 * history-ledger: эхний мөрийн backend uldegdel-ээс өмнөх үлдэгдлийг нэхээд running гүйцүүлнэ.
 * invoice fallback: uldegdel placeholder 0 — тэгээс эхэлнэ.
 */
function recomputeLedgerRunningBalances(
  rows: LedgerEntry[],
  mode: LedgerRunningMode,
): void {
  if (rows.length === 0) return;
  let running =
    mode === "fromFirstRowPostedBalance"
      ? ledgerOpeningBeforeFirstEntry(rows[0])
      : 0;
  rows.forEach((row) => {
    running = roundLedgerRunningStep(
      running + Number(row.tulukhDun || 0) - Number(row.tulsunDun || 0),
    );
    row.uldegdel = running;
  });
}

/** Бүх гүйлгээг хуанлийн дарааллаар сар бүрээр нэгтгэж, үлдэгдлийг мөр мөрөөр тооцно. */
function buildLedgerMonthBreakdown(
  entries: LedgerEntry[],
): LedgerMonthBreakdownRow[] {
  const sorted = [...entries].sort(compareLedgerEntriesChrono);
  if (sorted.length === 0) return [];

  const monthOrder: string[] = [];
  const monthRows = new Map<string, LedgerEntry[]>();
  for (const row of sorted) {
    const ym = ledgerEntryYmKey(row);
    if (!monthRows.has(ym)) {
      monthRows.set(ym, []);
      monthOrder.push(ym);
    }
    monthRows.get(ym)!.push(row);
  }

  let running = ledgerOpeningBeforeFirstEntry(sorted[0]);
  const out: LedgerMonthBreakdownRow[] = [];

  for (const ym of monthOrder) {
    const rows = monthRows.get(ym) || [];
    const balanceStart = roundLedgerRunningStep(running);
    let tulukh = 0;
    let tulsun = 0;
    for (const row of rows) {
      const tTul = Number(row.tulukhDun || 0);
      const tTsu = Number(row.tulsunDun || 0);
      tulukh += tTul;
      tulsun += tTsu;
      running = roundLedgerRunningStep(running + tTul - tTsu);
    }
    const balanceEnd = running;
    const tulsunRounded = roundLedgerRunningStep(tulsun);
    const tulukhDisplay = roundLedgerRunningStep(
      balanceEnd - balanceStart + tulsunRounded,
    );
    out.push({
      ym,
      displayMonth: formatYmDisplayLabel(ym),
      tulukh: tulukhDisplay,
      tulsun: tulsunRounded,
      balanceStart,
      balanceEnd,
    });
  }

  return out;
}

function LedgerMonthlyBreakdownTable({
  rows,
  highlightYm,
}: {
  rows: LedgerMonthBreakdownRow[];
  highlightYm?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[12px] text-slate-500 dark:text-slate-400">
        Сарын задрал харахад хангалттай гүйлгээ алга.
      </p>
    );
  }

  const totalTulukh = roundLedgerRunningStep(
    rows.reduce((s, r) => s + r.tulukh, 0),
  );
  const totalTulsun = roundLedgerRunningStep(
    rows.reduce((s, r) => s + r.tulsun, 0),
  );
  const finalUldegdel = rows[rows.length - 1]?.balanceEnd ?? 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-[11px] sm:text-[12px] border-collapse min-w-[340px] font-normal">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-center text-[9px] uppercase tracking-wide text-slate-700 dark:text-slate-200">
            <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">
              Сар
            </th>
            <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">
              Өмнөх үлдэгдэл
            </th>
            <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">
              Төлөх нийт
            </th>
            <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">
              Төлсөн нийт
            </th>
            <th className="py-3 px-3 font-semibold whitespace-nowrap text-center">
              Сарын эцсийн үлдэгдэл
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const hi = highlightYm && r.ym === highlightYm;
            return (
              <tr
                key={r.ym}
                className={`border-b border-slate-100 dark:border-slate-800/80 ${
                  hi
                    ? "bg-sky-50/70 dark:bg-sky-950/25"
                    : "bg-white dark:bg-[#0f172a]"
                }`}
              >
                <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {r.displayMonth}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {formatCurrency(r.balanceStart)} ₮
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {formatCurrency(r.tulukh)} ₮
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {formatCurrency(r.tulsun)} ₮
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                  {formatCurrency(r.balanceEnd)} ₮
                </td>
              </tr>
            );
          })}
          <tr className="history-print-total-row border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <td
              colSpan={2}
              className="py-3 px-3 text-center text-slate-800 dark:text-slate-100 font-bold"
            >
              Нийт
            </td>
            <td className="py-3 px-3 text-right tabular-nums text-slate-800 dark:text-slate-100 whitespace-nowrap font-bold">
              {formatCurrency(totalTulukh)} ₮
            </td>
            <td className="py-3 px-3 text-right tabular-nums text-slate-800 dark:text-slate-100 whitespace-nowrap font-bold">
              {formatCurrency(totalTulsun)} ₮
            </td>
            <td className="py-3 px-3 text-right tabular-nums text-slate-800 dark:text-slate-100 whitespace-nowrap font-bold">
              {formatCurrency(finalUldegdel)} ₮
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Гэрээ / Тоот / Нэр / Утас — гол хуулга болон хэвлэх «Үлдэгдэл сараар» хуудас */
function HistoryContractInfoGrid({
  contract,
  className,
}: {
  contract: any;
  className?: string;
}) {
  const items = [
    { label: "Гэрээ", value: contract?.gereeniiDugaar || "-" },
    { label: "Тоот", value: contract?.toot || "-" },
    { label: "Нэр", value: contract?.ner || "-" },
    {
      label: "Утас",
      value: Array.isArray(contract?.utas)
        ? contract.utas[0]
        : contract?.utas || "-",
    },
  ];
  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-slate-300 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 print:bg-neutral-200 print:border-black print:text-black"
        >
          <span className="text-[9px] text-slate-400 uppercase tracking-wider block print:text-black">
            {item.label}
          </span>
          <span className="text-[13px] text-slate-700 dark:text-slate-200 truncate block print:text-black">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Бүртгэсэн / гүйлгээ хийсэн ажилтны нэр — API өөр өөр талбар ашиглана (history-ledger мөр ч орно). */
function coalesceRegisteredAjiltan(doc: any, fallback = "Admin"): string {
  const candidates = [
    doc?.ajiltan,
    doc?.burtgesenAjiltaniiNer,
    doc?.guilgeeKhiisenAjiltniiNer,
    doc?.maililgeesenAjiltniiNer,
  ];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  const fb = String(fallback ?? "").trim();
  return fb || "Admin";
}

function formatPrintedByAjiltan(a: HistoryModalPrintedBy | undefined): string {
  if (!a) return "—";
  const ovog = String(a.ovog ?? "").trim();
  const ner = String(a.ner ?? "").trim();
  if (ovog && ner) return `${ovog} ${ner}`;
  if (ner) return ner;
  const login = String(a.nevtrekhNer ?? "").trim();
  return login || "—";
}

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      html,
      body {
        height: auto !important;
        overflow: visible !important;
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /*
       * visibility:hidden still reserves layout — the full app can print as blank page 1.
       * Hide every other direct child of body so only the history modal mount paginates.
       */
      body > *:not(.history-print-mount) {
        display: none !important;
      }

      .history-print-mount {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        position: static !important;
      }

      /* Scrollport from screen layout — causes huge blank gaps when printing */
      .history-print-portal-wrap {
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: visible !important;
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .history-print-root {
        position: static !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
        translate: none !important;
        box-shadow: none !important;
        overflow: visible !important;
        display: flex !important;
        flex-direction: column !important;
        flex-wrap: nowrap !important;
        align-items: stretch !important;
        align-content: flex-start !important;
        gap: 0 !important;
        row-gap: 0 !important;
        column-gap: 0 !important;
        z-index: auto !important;
        background: transparent !important;
      }

      /* Screen: side-by-side on lg stretches columns to same height → empty void on paper */
      .history-print-container,
      .ledger-print-panel {
        position: relative !important;
        flex: 0 0 auto !important;
        flex-grow: 0 !important;
        flex-shrink: 0 !important;
        flex-basis: auto !important;
        align-self: stretch !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        min-height: 0 !important;
        margin: 0 0 8px 0 !important;
        background: #fff !important;
        color: #000 !important;
        box-sizing: border-box !important;
        transform: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        page-break-inside: auto !important;
      }

      /*
       * Үлдэгдэл сараар: шинэ хуудас заавал биш — бага өгөгдөлтэй үед хуулгатай нэг хуудас.
       * break-inside: avoid — хуудасны сүүлийн хагас үлдсэн ч хэсгээр бүү тасла (бүтэн блок дараагийн хуудас).
       */
      .ledger-print-panel {
        margin-bottom: 0 !important;
        break-before: auto !important;
        page-break-before: auto !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .history-print-container {
        display: flex !important;
        flex-direction: column !important;
      }

      .history-print-table-body,
      .history-print-ledger-body {
        flex: none !important;
        flex-grow: 0 !important;
        min-height: 0 !important;
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
      }

      .history-print-container .history-print-table-body {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
      }

      .history-print-container .history-print-table-body > table {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        table-layout: auto !important;
      }

      div[data-radix-portal],
      div[role="dialog"],
      .ModalPortal {
        position: static !important;
        transform: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }

      .no-print {
        display: none !important;
      }

      .history-print-root table {
        width: 100% !important;
        max-width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
      }

      .history-print-root thead {
        display: table-header-group !important;
      }

      .history-print-root tbody {
        display: table-row-group !important;
      }

      .history-print-root .sticky {
        position: static !important;
      }

      .history-print-root th,
      .history-print-root td {
        border: 1px solid #000 !important;
        padding: 3px 5px !important;
        font-size: 8pt !important;
        line-height: 1.25 !important;
        vertical-align: top !important;
        word-break: normal !important;
        overflow-wrap: normal !important;
        hyphens: none !important;
      }

      .history-print-root thead th {
        color: #000 !important;
        font-weight: 700 !important;
        background: #e5e5e5 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Урт тайлбар: эвдэж багтаах биш, нэг мөр — хуудас дараагийн хуудас руу үргэлжилнэ */
      .history-print-container tbody tr {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }

      .history-print-container thead th:nth-child(8),
      .history-print-container tbody td:nth-child(8) {
        white-space: nowrap !important;
        max-width: none !important;
      }

      .history-print-container thead th:last-child,
      .history-print-container tbody td:last-child {
        display: none !important;
      }

      .custom-scrollbar,
      .overflow-auto,
      .overflow-x-auto,
      .overflow-y-auto {
        overflow: visible !important;
        max-height: none !important;
      }

      .history-print-container h2 {
        font-size: 14pt !important;
        margin: 0 0 4px 0 !important;
        color: #000 !important;
      }

      .history-print-container .grid.grid-cols-2 {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 6px !important;
        margin-bottom: 6px !important;
      }

      .history-print-footer-meta {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: baseline !important;
        width: 100% !important;
        font-size: 8pt !important;
        line-height: 1.4 !important;
        color: #000 !important;
      }

      .history-print-root,
      .history-print-root * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color: #000 !important;
        text-decoration: none !important;
        text-underline-offset: 0 !important;
        text-decoration-line: none !important;
      }

      .history-print-root [data-print-balance],
      .history-print-root [data-print-balance-box] {
        color: #000 !important;
      }

      .history-print-root [data-print-balance-box] {
        background: #fff !important;
        border-color: #000 !important;
      }

      .history-print-total-row td,
      .history-print-total-row th {
        font-weight: 700 !important;
        color: #000 !important;
      }
    }
  `}</style>
);

export default function HistoryModal({
  show,
  onClose,
  contract,
  token,
  baiguullagiinId,
  barilgiinId,
  onRefresh,
  pageDateRange,
  printedByAjiltan,
  baiguullagiinNer,
}: HistoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [globalUldegdel, setGlobalUldegdel] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([null, null]);
  /** true: зөвхөн modal-ын сонголт (Арилгах = бүх түүх); false: хоосон үед pageDateRange-аар шүүх */
  const [modalDateFilterFromUser, setModalDateFilterFromUser] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: string;
    type: string;
  }>({ show: false, id: "", type: "" });
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceModalResident, setInvoiceModalResident] = useState<any>(null);
  const [ledgerDetailSelection, setLedgerDetailSelection] =
    useState<LedgerDetailSelection | null>(null);
  const [printSnapshot, setPrintSnapshot] = useState<{
    at: Date;
    operator: string;
  } | null>(null);

  useEffect(() => {
    if (!show) setPrintSnapshot(null);
  }, [show]);

  /** Framer Motion + Tailwind centering set inline transform; print engines often keep it → tiny box bottom-left */
  const clearPrintLayoutInline = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const keys = [
      "position",
      "inset",
      "left",
      "top",
      "right",
      "bottom",
      "width",
      "max-width",
      "height",
      "max-height",
      "min-height",
      "margin",
      "transform",
      "translate",
      "scale",
      "rotate",
      "overflow",
    ];
    keys.forEach((k) => el.style.removeProperty(k));
  }, []);

  const applyPrintLayoutFix = useCallback(() => {
    const wrap = constraintsRef.current;
    const modal = modalRef.current;
    if (wrap) {
      wrap.style.setProperty("position", "static", "important");
      wrap.style.setProperty("inset", "auto", "important");
      wrap.style.setProperty("width", "100%", "important");
      wrap.style.setProperty("height", "auto", "important");
      wrap.style.setProperty("max-height", "none", "important");
      wrap.style.setProperty("min-height", "0", "important");
      wrap.style.setProperty("overflow", "visible", "important");
      wrap.style.setProperty("margin", "0", "important");
      wrap.style.setProperty("padding", "0", "important");
    }
    if (modal) {
      modal.style.setProperty("position", "relative", "important");
      modal.style.setProperty("left", "auto", "important");
      modal.style.setProperty("top", "auto", "important");
      modal.style.setProperty("right", "auto", "important");
      modal.style.setProperty("bottom", "auto", "important");
      modal.style.setProperty("transform", "none", "important");
      modal.style.setProperty("translate", "none", "important");
      modal.style.setProperty("width", "100%", "important");
      modal.style.setProperty("max-width", "100%", "important");
      modal.style.setProperty("height", "auto", "important");
      modal.style.setProperty("max-height", "none", "important");
      modal.style.setProperty("min-height", "0", "important");
      modal.style.setProperty("margin", "0", "important");
      modal.style.setProperty("padding", "0", "important");
    }
  }, []);

  const restoreScreenLayoutInline = useCallback(() => {
    clearPrintLayoutInline(constraintsRef.current);
    clearPrintLayoutInline(modalRef.current);
  }, [clearPrintLayoutInline]);

  useEffect(() => {
    if (!show) return;
    const onBeforePrint = () => applyPrintLayoutFix();
    const onAfterPrint = () => restoreScreenLayoutInline();
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    const mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("print")
        : null;
    const mqListener = (e: MediaQueryListEvent) => {
      if (e.matches) applyPrintLayoutFix();
      else restoreScreenLayoutInline();
    };
    mq?.addEventListener?.("change", mqListener);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      mq?.removeEventListener?.("change", mqListener);
    };
  }, [show, applyPrintLayoutFix, restoreScreenLayoutInline]);

  const handleModalClose = useCallback(() => {
    if (ledgerDetailSelection) {
      setLedgerDetailSelection(null);
      return;
    }
    onClose();
  }, [ledgerDetailSelection, onClose]);

  useModalHotkeys({
    isOpen: show,
    onClose: handleModalClose,
    container: modalRef.current,
  });

  const fetchData = async () => {
    if (!token || !baiguullagiinId || !contract) return;

    /** Гэрээний Mongo _id — invoice/payment мөрнөөс нээхэд `contract._id` нь гэрээний id биш байж болно */
    const explicitGereeId = String(
      contract?.gereeniiId || contract?.gereeId || contract?._gereeniiId || "",
    ).trim();
    const looksLikeNekhemjlekhiinRow = Boolean(
      contract?.medeelel?.zardluud ||
      contract?.medeelel?.guilgeenuud ||
      (Array.isArray(contract?.zardluud) && contract.zardluud.length > 0) ||
      (Array.isArray(contract?.guilgeenuud) && contract.guilgeenuud.length > 0),
    );
    const contractIdToFetch =
      explicitGereeId ||
      (!looksLikeNekhemjlekhiinRow && contract?._id
        ? String(contract._id).trim()
        : "");

    // Silent Auto-Sync: Recalculate global balance on backend before fetching (if endpoint exists)
    // This is completely silent - no errors logged
    if (contractIdToFetch) {
      try {
        uilchilgee(token || undefined)
          .post("/nekhemjlekh/recalculate-balance", {
            gereeId: contractIdToFetch,
            baiguullagiinId,
          })
          .catch(() => {
            // Silently ignore all errors (endpoint may not exist)
          });
      } catch (e) {
        // Silently ignore sync errors
      }
    }

    setLoading(true);
    try {
      const commonParams = {
        baiguullagiinId: baiguullagiinId || undefined,
        barilgiinId: barilgiinId || null,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 5000,
      };

      // Fetch all necessary data concurrently
      const [historyResp, paymentResp, receivableResp] = await Promise.all([
        uilchilgee(token || undefined).get("/nekhemjlekhiinTuukh", {
          params: {
            ...commonParams,
            query: {
              baiguullagiinId: baiguullagiinId || undefined,
            },
            _t: Date.now(),
          },
        }),
        uilchilgee(token || undefined).get("/gereeniiTulsunAvlaga", {
          params: {
            ...commonParams,
            _t: Date.now(),
          },
        }),
        uilchilgee(token || undefined).get("/gereeniiTulukhAvlaga", {
          params: {
            ...commonParams,
            _t: Date.now(),
          },
        }),
      ]);

      const rawList = Array.isArray(historyResp.data?.jagsaalt)
        ? historyResp.data.jagsaalt
        : [];
      const paymentRecords = Array.isArray(paymentResp.data?.jagsaalt)
        ? paymentResp.data.jagsaalt
        : [];
      const receivableRecords = Array.isArray(receivableResp.data?.jagsaalt)
        ? receivableResp.data.jagsaalt
        : [];

      // Extract all possible identifiers from the contract/resident object
      const residentId = String(contract?.orshinSuugchId || "").trim();
      const gereeniiId = explicitGereeId;
      const gereeDugaar = String(contract?.gereeniiDugaar || "").trim();
      const toot = String(contract?.toot || "").trim();
      const ner = String(contract?.ner || "")
        .trim()
        .toLowerCase();
      const ovog = String(contract?.ovog || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(contract?.utas) && contract.utas.length > 0) {
          return String(contract.utas[0] || "").trim();
        }
        return String(contract?.utas || "").trim();
      })();

      // Filter for this specific contract/resident using multiple strategies
      // When gereeniiId is available, REQUIRE it to match - otherwise we'd pull in invoices
      // from other contracts (same resident, different apartment) and double-count charges
      const contractItems = rawList.filter((item: any) => {
        const itemGereeId = String(item?.gereeniiId || "").trim();
        const itemGereeDugaar = String(item?.gereeniiDugaar || "").trim();

        // If we have gereeniiId, require it to match - strict contract scoping
        if (gereeniiId && itemGereeId && itemGereeId === gereeniiId) {
          return true;
        }
        // If we have gereeDugaar but no gereeniiId, use dugaar
        if (gereeDugaar && itemGereeDugaar && itemGereeDugaar === gereeDugaar) {
          return true;
        }
        // Fallback: when no gereeniiId/gereeDugaar, use other strategies
        if (!gereeniiId && !gereeDugaar) {
          const itemResidentId = String(item?.orshinSuugchId || "").trim();
          if (residentId && itemResidentId && itemResidentId === residentId)
            return true;
          if (toot && ner) {
            const itemToot = String(
              item?.toot || item?.medeelel?.toot || "",
            ).trim();
            const itemNer = String(item?.ner || "")
              .trim()
              .toLowerCase();
            if (itemToot === toot && itemNer === ner) return true;
          }
          if (utas && utas.length >= 8) {
            const itemUtas =
              Array.isArray(item?.utas) && item.utas.length > 0
                ? String(item.utas[0] || "").trim()
                : String(item?.utas || "").trim();
            if (itemUtas === utas) return true;
          }
          if (ovog && ner) {
            const itemOvog = String(item?.ovog || "")
              .trim()
              .toLowerCase();
            const itemNer2 = String(item?.ner || "")
              .trim()
              .toLowerCase();
            if (itemOvog === ovog && itemNer2 === ner) return true;
          }
        }
        return false;
      });

      // Filter payment records for this contract (require gereeniiId when available)
      const matchedPayments = paymentRecords.filter((rec: any) => {
        const recGereeId = String(rec?.gereeniiId || "").trim();
        const recOrshinSuugchId = String(rec?.orshinSuugchId || "").trim();
        const recGereeDugaar = String(rec?.gereeniiDugaar || "").trim();
        if (gereeniiId && recGereeId && recGereeId === gereeniiId) return true;
        if (gereeDugaar && recGereeDugaar && recGereeDugaar === gereeDugaar)
          return true;
        if (
          !gereeniiId &&
          !gereeDugaar &&
          residentId &&
          recOrshinSuugchId &&
          recOrshinSuugchId === residentId
        )
          return true;
        return false;
      });

      // Filter receivable records for this contract (require gereeniiId when available)
      const matchedReceivables = receivableRecords.filter((rec: any) => {
        const recGereeId = String(rec?.gereeniiId || "").trim();
        const recOrshinSuugchId = String(rec?.orshinSuugchId || "").trim();
        const recGereeDugaar = String(rec?.gereeniiDugaar || "").trim();
        if (gereeniiId && recGereeId && recGereeId === gereeniiId) return true;
        if (gereeDugaar && recGereeDugaar && recGereeDugaar === gereeDugaar)
          return true;
        if (
          !gereeniiId &&
          !gereeDugaar &&
          residentId &&
          recOrshinSuugchId &&
          recOrshinSuugchId === residentId
        )
          return true;
        return false;
      });

      // 1. Process Invoices and their contents
      const flatLedger: LedgerEntry[] = [];
      const processedIds = new Set<string>();

      // Ensure we only process each unique invoice once, but allow multiple invoices per month
      const seenInvoiceIds = new Set<string>();
      const contractItemsToProcess = contractItems.filter((item: any) => {
        const id = item._id?.toString();
        if (!id || seenInvoiceIds.has(id)) return false;
        seenInvoiceIds.add(id);
        return true;
      });

      // Log first item for debugging
      if (contractItemsToProcess.length > 0) {
      }
      const invoiceIds = new Set(
        contractItemsToProcess.map((item: any) => item._id?.toString()),
      );

      contractItemsToProcess.forEach((item: any) => {
        const itemDate = normalizeLedgerOgnooStorage(
          item.ognoo ||
            item.nekhemjlekhiinOgnoo ||
            item.createdAt ||
            new Date().toISOString(),
        );
        // Use only employee fields - never item.ner (resident name) or createdBy?.ner (may be resident)
        const ajiltan =
          item.burtgesenAjiltaniiNer ||
          item.guilgeeKhiisenAjiltniiNer ||
          item.maililgeesenAjiltniiNer ||
          item.ajiltan ||
          "Admin";
        const source =
          item.medeelel?.uusgegsenEsekh || item.uusgegsenEsekh || "garan";
        const isSystem =
          source === "automataar" ||
          source === "cron" ||
          !item.maililgeesenAjiltniiId;

        const pickAmount = (obj: any) => {
          const n = (v: any) => {
            const num = Number(v);
            return Number.isFinite(num) ? num : null;
          };
          const dun = n(obj?.dun);
          if (dun !== null && dun !== 0) return dun;
          const td = n(obj?.tulukhDun);
          if (td !== null && td !== 0) return td;
          const tar = n(obj?.tariff);
          return tar ?? 0;
        };

        // 1. Process Expenses (Zardluud)
        const zardluud = Array.isArray(item?.medeelel?.zardluud)
          ? item.medeelel.zardluud
          : Array.isArray(item?.zardluud)
            ? item.zardluud
            : [];

        // Track if we found ekhniiUldegdel with value in invoice zardluud
        let foundEkhniiUldegdelInInvoice = false;

        const seenZardalMongoIds = new Set<string>();
        zardluud.forEach((z: any) => {
          const zMongoId = z._id?.toString();
          if (zMongoId && seenZardalMongoIds.has(zMongoId)) return;
          // Include all zardluud entries including zaalt (electricity) entries
          if (z.ner) {
            let amt = pickAmount(z);
            const isEkhniiUldegdel =
              z.isEkhniiUldegdel === true ||
              z.ner === "Эхний үлдэгдэл" ||
              (z.ner && z.ner.includes("Эхний үлдэгдэл"));

            // For "Эхний үлдэгдэл" entries with 0 value, SKIP them entirely
            // We'll use the gereeniiTulukhAvlaga record instead (which has the actual value)
            if (isEkhniiUldegdel && (amt === 0 || amt === undefined)) {
              return;
            }

            // Include ekhniiUldegdel even when negative (credit); regular charges need amt > 0
            if ((isEkhniiUldegdel && amt !== 0) || amt > 0) {
              // Use composite key: invoiceId-zardalId so entries stay unique when multiple
              // invoices share the same zardluud template (same _ids) -> fixes React duplicate key
              const rowId = `${item._id}-${z._id?.toString() || `z-${Math.random()}`}`;
              // Format tailbar to show expense name first, then tailbar text if it exists
              const zardalTailbar = z.tailbar || "";
              const displayTailbar = zardalTailbar
                ? `${z.ner} - ${zardalTailbar}`
                : z.ner;
              flatLedger.push({
                _id: rowId,
                parentInvoiceId: item._id,
                ognoo: itemDate,
                ner: z.ner,
                tulukhDun: amt,
                tulsunDun: 0,
                uldegdel: 0,
                isSystem,
                ajiltan,
                khelber: "Нэхэмжлэх",
                tailbar: displayTailbar,
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh",
              });
              if (zMongoId) seenZardalMongoIds.add(zMongoId);
              if (z._id) processedIds.add(z._id.toString());

              // Mark ALL ekhniiUldegdel records from gereeniiTulukhAvlaga as processed
              // if this invoice zardal is ekhniiUldegdel WITH value
              // This prevents double-counting
              if (isEkhniiUldegdel) {
                foundEkhniiUldegdelInInvoice = true;
                matchedReceivables.forEach((r: any) => {
                  if (r.ekhniiUldegdelEsekh === true && r._id) {
                    processedIds.add(r._id.toString());
                  }
                });
              }
            }
          }
        });

        // If we found ekhniiUldegdel in invoice, mark all gereeniiTulukhAvlaga ekhniiUldegdel as processed
        // (Double-check in case the loop missed some)
        if (foundEkhniiUldegdelInInvoice) {
          matchedReceivables.forEach((r: any) => {
            if (r.ekhniiUldegdelEsekh === true && r._id) {
              processedIds.add(r._id.toString());
            }
          });
        }

        // 1.5. Add Цахилгаан from tsahilgaanNekhemjlekh if it exists and is not already in zardluud
        // IMPORTANT: only when there is explicit meter-reading input (заалт).
        // This prevents showing "Цахилгаан" row when no заалт was entered.
        // Check for exact "Цахилгаан" (not "Дундын өмчлөл Цахилгаан")
        const hasTsahilgaanInZardluud = zardluud.some((z: any) => {
          const ner = String(z.ner || "").trim();
          // Only match exact "Цахилгаан", not partial matches like "Дундын өмчлөл Цахилгаан"
          return ner === "Цахилгаан";
        });
        const zaaltMeta = item?.medeelel?.zaalt;
        const hasExplicitZaaltInput =
          Number(zaaltMeta?.zoruu ?? 0) > 0 ||
          Number(zaaltMeta?.zaaltDun ?? 0) > 0 ||
          zaaltMeta?.umnukhZaalt != null ||
          zaaltMeta?.suuliinZaalt != null;
        if (
          !hasTsahilgaanInZardluud &&
          item.tsahilgaanNekhemjlekh &&
          hasExplicitZaaltInput
        ) {
          const tsahilgaanAmt = Number(item.tsahilgaanNekhemjlekh);
          if (tsahilgaanAmt > 0) {
            const rowId = `${item._id}-tsahilgaan`;
            // Check multiple possible tailbar locations for consistency
            const invoiceTailbar =
              item?.medeelel?.tailbar ||
              item?.medeelel?.temdeglel ||
              item?.tailbar ||
              item?.content?.split("\n")?.[1]?.replace("Тайлбар: ", "") ||
              "";
            // Always show "Цахилгаан" first, then tailbar if it exists
            // This ensures consistent formatting across all invoices
            const displayTailbar = invoiceTailbar
              ? `Цахилгаан - ${invoiceTailbar}`
              : "Цахилгаан";
            flatLedger.push({
              _id: rowId,
              parentInvoiceId: item._id,
              ognoo: itemDate,
              ner: "Цахилгаан",
              tulukhDun: tsahilgaanAmt,
              tulsunDun: 0,
              uldegdel: 0,
              isSystem,
              ajiltan,
              khelber: "Нэхэмжлэх",
              tailbar: displayTailbar,
              burtgesenOgnoo: item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh",
            });
          }
        }

        // 2. Process Manual Transactions (Guilgeenuud - Avlaga/Charges)
        const guilgeenuud = Array.isArray(item?.medeelel?.guilgeenuud)
          ? item.medeelel.guilgeenuud
          : Array.isArray(item?.guilgeenuud)
            ? item.guilgeenuud
            : [];

        const seenGuilgeeMongoIds = new Set<string>();
        guilgeenuud.forEach((g: any) => {
          const gMongoId = g._id?.toString();
          if (gMongoId && seenGuilgeeMongoIds.has(gMongoId)) return;
          const chargeAmt =
            Number(g.tulukhDun ?? g.dun ?? g.niitDun ?? g.niitTulbur ?? 0) || 0;
          const paidAmt = Number(g.tulsunDun ?? g.tulsun ?? 0) || 0;
          const guilgeeTurul = String(g.turul || "").toLowerCase();
          const isAshiglaltGuilgee = guilgeeTurul === "ashiglalt";

          // Ашиглалт: API заримдаа зөвхөн dun дамжуулж tulukhDun хоосон — дүнг төлсөн баганад (төслийн бусад хэсэгтэй ижил)
          if (isAshiglaltGuilgee && chargeAmt > 0) {
            const rowId = g._id?.toString() || `g-ashiglalt-${Math.random()}`;
            flatLedger.push({
              _id: rowId,
              parentInvoiceId: item._id,
              ognoo: g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              ner: "Ашиглалт",
              tulukhDun: 0,
              tulsunDun: chargeAmt,
              uldegdel: 0,
              isSystem: false,
              ajiltan: coalesceRegisteredAjiltan(g, ajiltan),
              khelber: "Төлбөр",
              tailbar: g.tailbar || "Ашиглалт",
              burtgesenOgnoo: g.createdAt || item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh",
            });
            if (g._id) processedIds.add(g._id.toString());
            if (gMongoId) seenGuilgeeMongoIds.add(gMongoId);
            return;
          }

          if (chargeAmt > 0) {
            const rowId = g._id?.toString() || `g-charge-${Math.random()}`;
            const isEkhniiUldegdel = g.ekhniiUldegdelEsekh === true;
            let rowTailbar = g.tailbar || "Гараар нэмсэн авлага";

            if (isEkhniiUldegdel) {
              const prefix = "Эхний үлдэгдэл";
              const dateStr = formatLedgerOgnooCell(
                g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              );
              if (rowTailbar && !rowTailbar.includes(prefix)) {
                rowTailbar = `${prefix} - ${rowTailbar} - ${dateStr}`;
              } else if (!rowTailbar) {
                rowTailbar = `${prefix} - ${dateStr}`;
              } else if (
                rowTailbar.includes(prefix) &&
                !rowTailbar.includes(dateStr)
              ) {
                rowTailbar = `${rowTailbar} - ${dateStr}`;
              }
            }

            flatLedger.push({
              _id: rowId,
              parentInvoiceId: item._id,
              ognoo: normalizeLedgerOgnooStorage(
                g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              ),
              ner: isEkhniiUldegdel ? "Эхний үлдэгдэл" : "Авлага",
              tulukhDun: chargeAmt,
              tulsunDun: 0,
              uldegdel: 0,
              isSystem: false,
              ajiltan: coalesceRegisteredAjiltan(g, ajiltan),
              khelber: "Авлага",
              tailbar: rowTailbar,
              burtgesenOgnoo: g.createdAt || item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh",
            });
            if (g._id) processedIds.add(g._id.toString());
          }
          if (paidAmt > 0) {
            const rowId = `${item._id}-g-paid-${g._id?.toString() || Math.random()}`;
            flatLedger.push({
              _id: rowId,
              ognoo: normalizeLedgerOgnooStorage(
                g.ognoo || g.guilgeeKhiisenOgnoo || itemDate,
              ),
              ner: "Төлөлт",
              tulukhDun: 0,
              tulsunDun: paidAmt,
              uldegdel: 0,
              isSystem: false,
              ajiltan: coalesceRegisteredAjiltan(g, ajiltan),
              khelber: g.khelber || "Төлбөр",
              tailbar: g.tailbar || "-",
              burtgesenOgnoo: g.createdAt || item.createdAt || "-",
              sourceCollection: "nekhemjlekhiinTuukh",
            });
            if (g._id) processedIds.add(g._id.toString());
          }
          if (gMongoId) seenGuilgeeMongoIds.add(gMongoId);
        });
        // 3. Process Standalone Transactions (Top-level item is the transaction)
        // If item has 'turul' and isn't just a container for zardluud/guilgeenuud
        const hasChildren = zardluud.length > 0 || guilgeenuud.length > 0;

        if (
          !hasChildren &&
          item.turul &&
          (item.turul === "ashiglalt" ||
            item.turul === "avlaga" ||
            item.turul === "tulult" ||
            item.turul === "voucher" ||
            item.turul === "turgul")
        ) {
          const type = item.turul;
          const amt = Number(item.tulukhDun || item.dun || 0);
          const tulsunAmt = Number(item.tulsunDun || 0);

          if (type === "tulult") {
            // Payment type - uses tulsunDun or tulukhDun
            const paymentAmt = tulsunAmt > 0 ? tulsunAmt : Math.abs(amt);
            if (paymentAmt > 0) {
              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: "Төлөлт",
                tulukhDun: 0,
                tulsunDun: paymentAmt,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Төлбөр",
                tailbar: item.tailbar || "-",
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh",
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          } else if (type === "ashiglalt") {
            // Ashiglalt type - like payment, reduces balance
            const paymentAmt = tulsunAmt > 0 ? tulsunAmt : Math.abs(amt);
            if (paymentAmt > 0) {
              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: "Ашиглалт",
                tulukhDun: 0,
                tulsunDun: paymentAmt,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Төлбөр",
                tailbar: item.tailbar || "Ашиглалт",
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh",
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          } else {
            // avlaga, turgul, voucher - adds to balance
            if (amt > 0) {
              let name = "Гүйлгээ";
              if (type === "avlaga") name = "Авлага";
              if (type === "turgul") name = "Торгууль";
              if (type === "voucher") name = "Voucher";

              const desc = item.tailbar || name;

              flatLedger.push({
                _id: item._id,
                ognoo: itemDate,
                ner: name,
                tulukhDun: amt,
                tulsunDun: 0,
                uldegdel: 0,
                isSystem: false,
                ajiltan,
                khelber: "Авлага",
                tailbar: desc,
                burtgesenOgnoo: item.createdAt || "-",
                sourceCollection: "nekhemjlekhiinTuukh",
              });
              if (item._id) processedIds.add(item._id.toString());
            }
          }
        }
      });

      // Process receivable records from gereeniiTulukhAvlaga
      // Track if we've already added ekhniiUldegdel from invoice zardluud WITH a value > 0
      const hasEkhniiUldegdelInInvoice = flatLedger.some((entry) => {
        const isEkhniiUldegdelName =
          entry.ner === "Эхний үлдэгдэл" ||
          (entry.ner && entry.ner.includes("Эхний үлдэгдэл"));
        const amt = Number(entry.tulukhDun || 0);
        return (
          isEkhniiUldegdelName &&
          entry.sourceCollection === "nekhemjlekhiinTuukh" &&
          amt !== 0
        );
      });

      matchedReceivables.forEach((rec: any) => {
        const recId = rec._id?.toString();
        // Skip if already processed in invoice loop
        if (recId && processedIds.has(recId)) {
          return;
        }

        // Skip orphans (has nekhemjlekhId but parent invoice is gone)
        if (rec.nekhemjlekhId && !invoiceIds.has(rec.nekhemjlekhId.toString()))
          return;

        // Skip ekhniiUldegdel records if they're already included in the invoice zardluud
        // This prevents duplicate "Эхний үлдэгдэл" entries
        if (rec.ekhniiUldegdelEsekh === true && hasEkhniiUldegdelInInvoice) {
          return;
        }

        const recDate = normalizeLedgerOgnooStorage(
          rec.ognoo || rec.createdAt || new Date().toISOString(),
        );
        const ajiltan = coalesceRegisteredAjiltan(rec);
        // For ekhniiUldegdel, use undsenDun (original amount) for the charge - payments are tracked separately
        const amt =
          rec.ekhniiUldegdelEsekh === true
            ? Number(rec.undsenDun ?? rec.tulukhDun ?? rec.uldegdel ?? 0)
            : Number(rec.tulukhDun || rec.undsenDun || 0);

        // Include ekhniiUldegdel even when negative (credit); other receivables need amt > 0
        if ((rec.ekhniiUldegdelEsekh === true && amt !== 0) || amt > 0) {
          const isEkhniiUldegdel = rec.ekhniiUldegdelEsekh === true;
          const rawRecName = String(rec.zardliinNer || rec.ner || "").trim();
          const rawRecNameLc = rawRecName.toLowerCase();
          const displayRecName =
            rawRecNameLc === "ашиглалт" || rawRecNameLc === "ashiglalt"
              ? "Цахилгаан"
              : rawRecName || "Авлага";
          let rowTailbar =
            rec.tailbar || rec.zardliinNer || "Гараар нэмсэн авлага";

          if (isEkhniiUldegdel) {
            const prefix = "Эхний үлдэгдэл";
            const dateStr = recDate.replace(/-/g, ".");
            if (rowTailbar && !rowTailbar.includes(prefix)) {
              rowTailbar = `${prefix} - ${rowTailbar} - ${dateStr}`;
            } else if (!rowTailbar) {
              rowTailbar = `${prefix} - ${dateStr}`;
            } else if (
              rowTailbar.includes(prefix) &&
              !rowTailbar.includes(dateStr)
            ) {
              rowTailbar = `${rowTailbar} - ${dateStr}`;
            }
          }

          flatLedger.push({
            _id: rec._id,
            ognoo: recDate,
            ner: isEkhniiUldegdel ? "Эхний үлдэгдэл" : displayRecName,
            tulukhDun: amt,
            tulsunDun: 0,
            uldegdel: 0,
            isSystem: false,
            ajiltan,
            khelber: "Авлага",
            tailbar: rowTailbar,
            burtgesenOgnoo: rec.createdAt || "-",
            sourceCollection: "gereeniiTulukhAvlaga",
          });
        }
      });

      // Process payment records from gereeniiTulsunAvlaga
      matchedPayments.forEach((payment: any) => {
        const pId = payment._id?.toString();
        // Skip if already processed in invoice loop
        if (pId && processedIds.has(pId)) return;

        // Skip orphans (has nekhemjlekhId but parent invoice is gone)
        if (
          payment.nekhemjlekhId &&
          !invoiceIds.has(payment.nekhemjlekhId.toString())
        )
          return;

        const paymentDate = normalizeLedgerOgnooStorage(
          payment.ognoo || payment.createdAt || new Date().toISOString(),
        );
        const ajiltan = coalesceRegisteredAjiltan(payment);
        const tulsunDun = Number(payment.tulsunDun || 0);
        const turul = payment.turul || "tulbur";

        // Determine the name based on type
        let name = "Төлөлт";
        let khelber = "Төлбөр";
        if (turul === "ashiglalt" || turul === "Ашиглалт") {
          name = "Ашиглалт";
          khelber = "Төлбөр";
        } else if (
          turul === "tulult" ||
          turul === "Төлөлт" ||
          turul === "tulbur"
        ) {
          name = "Төлөлт";
          khelber = "Төлбөр";
        } else if (
          turul === "prepayment" ||
          turul === "Урьдчилсан төлбөр" ||
          turul === "invoice_payment"
        ) {
          name = "Төлөлт";
          khelber = "Төлбөр";
        }

        if (tulsunDun > 0) {
          flatLedger.push({
            _id: payment._id,
            ognoo: paymentDate,
            ner: name,
            tulukhDun: 0,
            tulsunDun: tulsunDun,
            uldegdel: 0,
            isSystem: false,
            ajiltan,
            khelber,
            tailbar: payment.tailbar || payment.zardliinNer || name,
            burtgesenOgnoo: payment.createdAt || "-",
            sourceCollection: "gereeniiTulsunAvlaga",
          });
        }
      });

      // Deterministic Sort Function
      const sortLedger = (list: any[]) => {
        return list.sort((a, b) => {
          const dA = new Date(a.ognoo || a.tulsunOgnoo || a.createdAt || 0);
          const dB = new Date(b.ognoo || b.tulsunOgnoo || b.createdAt || 0);
          const dayA = new Date(
            dA.getFullYear(),
            dA.getMonth(),
            dA.getDate(),
          ).getTime();
          const dayB = new Date(
            dB.getFullYear(),
            dB.getMonth(),
            dB.getDate(),
          ).getTime();

          if (dayA !== dayB) return dayA - dayB;

          const timeA = new Date(
            a.burtgesenOgnoo && a.burtgesenOgnoo !== "-"
              ? a.burtgesenOgnoo
              : a.createdAt || a.ognoo,
          ).getTime();
          const timeB = new Date(
            b.burtgesenOgnoo && b.burtgesenOgnoo !== "-"
              ? b.burtgesenOgnoo
              : b.createdAt || b.ognoo,
          ).getTime();
          if (timeA !== timeB) return timeA - timeB;

          return String(a._id || "").localeCompare(String(b._id || ""));
        });
      };

      // Sort chronological Oldest -> Newest, then drop duplicate display rows (recompute үлдэгдэл)
      sortLedger(flatLedger);
      const flatLedgerDeduped =
        dedupeSemanticallyIdenticalLedgerRows(flatLedger);

      if (contractIdToFetch) {
        try {
          const ledgerResp = await uilchilgee(token || undefined).get(
            `/geree/${contractIdToFetch}/history-ledger`,
            {
              params: {
                baiguullagiinId: baiguullagiinId || undefined,
                barilgiinId: barilgiinId || null,
                _t: Date.now(),
              },
            },
          );
          const backendLedger = Array.isArray(ledgerResp.data?.jagsaalt)
            ? ledgerResp.data.jagsaalt
            : Array.isArray(ledgerResp.data?.ledger)
              ? ledgerResp.data.ledger
              : Array.isArray(ledgerResp.data)
                ? ledgerResp.data
                : [];
          const hasUldegdel = backendLedger.some(
            (r: any) =>
              r?.uldegdel != null && Number.isFinite(Number(r.uldegdel)),
          );
          if (backendLedger.length > 0 && hasUldegdel) {
            // Use backend ledger with uldegdel from each row - NO calculation, use backend values directly
            const mapped = backendLedger.map((r: any) => {
              let tulukhDun =
                Number(r.tulukhDun ?? r.dun ?? r.niitDun ?? 0) || 0;
              let tulsunDun = Number(r.tulsunDun ?? r.tulsun ?? 0) || 0;
              const rowTurul = String(r.turul || "").toLowerCase();
              if (
                rowTurul === "ashiglalt" &&
                tulukhDun > 0 &&
                tulsunDun === 0
              ) {
                tulsunDun = tulukhDun;
                tulukhDun = 0;
              }
              const entry: LedgerEntry = {
                ognoo: normalizeLedgerOgnooStorage(r.ognoo || ""),
                ner: r.ner || "",
                tulukhDun,
                tulsunDun,
                uldegdel: Number(r.uldegdel ?? 0), // Use uldegdel directly from backend - NO calculation
                isSystem: r.isSystem ?? false,
                ajiltan: coalesceRegisteredAjiltan(r),
                khelber: r.khelber,
                tailbar: r.tailbar,
                burtgesenOgnoo: r.burtgesenOgnoo,
                _id: r._id,
                parentInvoiceId: r.parentInvoiceId,
                sourceCollection: r.sourceCollection,
              };
              return entry;
            });
            // Store globalUldegdel from backend response for Нийт row
            const backendGlobalUldegdel = ledgerResp.data?.globalUldegdel;
            if (
              backendGlobalUldegdel != null &&
              Number.isFinite(Number(backendGlobalUldegdel))
            ) {
              setGlobalUldegdel(Number(backendGlobalUldegdel));
            } else {
              setGlobalUldegdel(null);
            }
            sortLedger(mapped);
            const mappedDeduped = dedupeSemanticallyIdenticalLedgerRows(mapped);
            recomputeLedgerRunningBalances(
              mappedDeduped,
              "fromFirstRowPostedBalance",
            );
            setData(mappedDeduped);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Backend endpoint not implemented or failed; fall back to frontend
        }
      }

      recomputeLedgerRunningBalances(flatLedgerDeduped, "fromZero");

      // Reset globalUldegdel when using frontend calculation
      setGlobalUldegdel(null);

      // Display chronological order (oldest first)
      setData(flatLedgerDeduped);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, type: string) => {
    setDeleteConfirm({ show: true, id, type });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    const entry = data.find((e) => e._id === id);
    const source = entry?.sourceCollection || "nekhemjlekhiinTuukh";

    setDeleteConfirm({ show: false, id: "", type: "" });

    try {
      let response;
      const endpoint =
        source === "gereeniiTulsunAvlaga"
          ? "/gereeniiTulsunAvlaga"
          : source === "gereeniiTulukhAvlaga"
            ? "/gereeniiTulukhAvlaga"
            : "/nekhemjlekhiinTuukh";

      // If it's a sub-item (zardal or guilgee) in an invoice
      if (entry?.parentInvoiceId && source === "nekhemjlekhiinTuukh") {
        // Extract actual zardal/guilgee _id from composite key (invoiceId-zardalId or invoiceId-g-guilgeeId)
        let zardalId = id;
        if (id.includes("-g-paid-")) zardalId = id.split("-g-paid-")[1] || id;
        else if (id.includes("-g-")) zardalId = id.split("-g-")[1] || id;
        else if (id.includes("-")) zardalId = id.substring(id.indexOf("-") + 1);
        response = await uilchilgee(token || undefined).post(
          `${endpoint}/deleteZardal`,
          {
            invoiceId: entry.parentInvoiceId,
            zardalId,
            baiguullagiinId: baiguullagiinId || undefined,
          },
        );
      } else {
        // Otherwise use standard delete for full documents
        response = await uilchilgee(token || undefined).delete(
          `${endpoint}/${id}`,
          {
            params: {
              baiguullagiinId: baiguullagiinId || undefined,
            },
          },
        );
      }

      if (
        response.data.success ||
        response.status === 200 ||
        response.status === 204
      ) {
        // Cascade delete related records when deleting from nekhemjlekhiinTuukh
        if (source === "nekhemjlekhiinTuukh" && contract?.gereeniiId) {
          // Delete related records from gereeniiTulsunAvlaga
          await uilchilgee(token || undefined)
            .delete(`/gereeniiTulsunAvlaga`, {
              params: {
                baiguullagiinId: baiguullagiinId || undefined,
                gereeniiId: contract.gereeniiId,
                nekhemjlekhiinId: id,
              },
            })
            .catch(() => {}); // Silently ignore if no records exist

          // Delete related records from gereeniiTulukhAvlaga
          await uilchilgee(token || undefined)
            .delete(`/gereeniiTulukhAvlaga`, {
              params: {
                baiguullagiinId: baiguullagiinId || undefined,
                gereeniiId: contract.gereeniiId,
                nekhemjlekhiinId: id,
              },
            })
            .catch(() => {}); // Silently ignore if no records exist
        }

        // Show success message
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 2000);

        // Refresh local data
        fetchData();

        // Notify parent to refresh (essential for updating totals/balances)
        // @ts-ignore
        if (onRefresh) {
          // @ts-ignore
          onRefresh();
        }
      } else {
        alert("Устгаж чадсангүй");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Алдаа гарлаа: " + (error as any).message);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: "", type: "" });
  };

  const pageRangeStart = pageDateRange?.[0] ?? null;
  const pageRangeEnd = pageDateRange?.[1] ?? null;
  /** Түлхүүр: гэрээний id байхгүй үед (жагсаалтын invoice-мөр) ч мөрийн солигдолтыг илрүүлнэ */
  const contractId =
    String(
      contract?.gereeniiId || contract?.gereeId || contract?._gereeniiId || "",
    ).trim() ||
    (contract?.gereeniiDugaar
      ? `dugaar:${String(contract.gereeniiDugaar).trim()}`
      : "") ||
    String(contract?._id || "") ||
    null;

  useEffect(() => {
    if (!show) {
      setLedgerDetailSelection(null);
      return;
    }
    if (show && contract) {
      setLedgerDetailSelection(null);
      setData([]);
      setGlobalUldegdel(null);
      // Хуулга modal эхний нээлтэд огноо автоматаар бүү сонго.
      // [null, null] + modalDateFilterFromUser=true => pageDateRange fallback-ийг унтраана.
      setModalDateFilterFromUser(true);
      setDateRange([null, null]);
      fetchData();
    }
  }, [show, contractId, pageRangeStart, pageRangeEnd]);

  const filteredData = useMemo(() => {
    const [dr0, dr1] = dateRange || [null, null];
    const m0 = coercePickerValueToYmd(dr0);
    const m1 = coercePickerValueToYmd(dr1);
    const pageS = coercePickerValueToYmd(pageDateRange?.[0] ?? null);
    const pageE = coercePickerValueToYmd(pageDateRange?.[1] ?? null);

    // «Арилгах»: modalDateFilterFromUser + хоёул null → жагсаалтын огноог үл тоомсорлож бүх түүх
    const clearedInModal =
      Boolean(modalDateFilterFromUser) && m0 == null && m1 == null;
    // RangePicker заримдаа нэг талыг null өгдөг; нөгөө талыг жагсаалтын сонголтоос нөхнө
    const startNorm = clearedInModal ? null : (m0 ?? pageS ?? null);
    const endNorm = clearedInModal ? null : (m1 ?? pageE ?? null);

    let { startKey, endKey } = pickerBoundsToYmdKeys(startNorm, endNorm);

    // Нэг өдөр сонгосон / RangePicker дунд үе: нөгөө тал хоосон бол тухайн сарын эх/төгсгөлөөр нөхнө
    if (startKey && !endKey) {
      endKey = ymdEndOfCalendarMonth(startKey);
    } else if (!startKey && endKey) {
      startKey = ymdStartOfCalendarMonth(endKey);
    }
    if (startKey && endKey && startKey > endKey) {
      const t = startKey;
      startKey = endKey;
      endKey = t;
    }

    const startN = ymdKeyToSortNumber(startKey);
    const endN = ymdKeyToSortNumber(endKey);

    const result =
      startKey || endKey
        ? data.filter((item) => {
            const rowKey = ledgerRowKeyMatchingDisplayColumn(item.ognoo);
            const rowN = ymdKeyToSortNumber(rowKey);
            if (rowN == null) return false;
            if (startN != null && rowN < startN) return false;
            if (endN != null && rowN > endN) return false;
            return true;
          })
        : data;

    // Reverse to show newest first (data is stored oldest-first)
    return [...result].reverse();
  }, [data, dateRange, pageDateRange, modalDateFilterFromUser]);

  /** Хуулгын бүх ачаалсан мөр — сарын задралд (шүүлтээс үл хамаарна) */
  const monthlyBreakdownFull = useMemo(
    () => buildLedgerMonthBreakdown(data),
    [data],
  );

  /** Шүүлттэй хугацааны мөрүүд, хуанлийн дараалал (хуучин → шинэ) */
  const chronologicalFilteredEntries = useMemo(() => {
    return [...filteredData].reverse();
  }, [filteredData]);

  const monthlyBreakdownFiltered = useMemo(
    () => buildLedgerMonthBreakdown(chronologicalFilteredEntries),
    [chronologicalFilteredEntries],
  );

  /**
   * Жагсаалтын «Нийт» мөрийн төлөх/төлсөн = мөрүүдийн нийлбэр.
   * Үлдэгдэл = `monthlyBreakdownFiltered`-ийн сүүлийн сарын эцсийн үлдэгдэлтэй яг ижил (мөрийн дарааллаар тооцсон running).
   */
  const ledgerFooterTotals = useMemo(() => {
    const totalCharges = roundLedgerRunningStep(
      filteredData.reduce((sum, row) => sum + Number(row.tulukhDun || 0), 0),
    );
    const totalPayments = roundLedgerRunningStep(
      filteredData.reduce((sum, row) => sum + Number(row.tulsunDun || 0), 0),
    );
    if (chronologicalFilteredEntries.length === 0) {
      const fallback =
        globalUldegdel != null && Number.isFinite(Number(globalUldegdel))
          ? Number(globalUldegdel)
          : Number(contract?.uldegdel ?? 0);
      return {
        totalCharges,
        totalPayments,
        balance: roundLedgerRunningStep(fallback),
      };
    }
    const lastMonth =
      monthlyBreakdownFiltered[monthlyBreakdownFiltered.length - 1];
    const balance =
      lastMonth != null
        ? lastMonth.balanceEnd
        : roundLedgerRunningStep(
            ledgerOpeningBeforeFirstEntry(chronologicalFilteredEntries[0]) +
              totalCharges -
              totalPayments,
          );
    return { totalCharges, totalPayments, balance };
  }, [
    filteredData,
    chronologicalFilteredEntries,
    monthlyBreakdownFiltered,
    globalUldegdel,
    contract?.uldegdel,
  ]);

  const ledgerDetailHighlightYm =
    ledgerDetailSelection?.kind === "row"
      ? ledgerEntryYmKey(ledgerDetailSelection.row)
      : null;

  const handleOpenInvoiceModal = (row: LedgerEntry) => {
    // We need to pass the resident data to InvoiceModal
    // HistoryModal already has contract which is usually the resident
    setInvoiceModalResident(contract);
    setShowInvoiceModal(true);
  };

  const handlePrint = useCallback(() => {
    applyPrintLayoutFix();
    flushSync(() => {
      setPrintSnapshot({
        at: new Date(),
        operator: formatPrintedByAjiltan(printedByAjiltan),
      });
    });
    applyPrintLayoutFix();
    requestAnimationFrame(() => {
      applyPrintLayoutFix();
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, [printedByAjiltan, applyPrintLayoutFix]);

  if (!show) return null;

  return (
    <ModalPortal>
      <div className="history-print-mount contents">
        <AnimatePresence>
          <PrintStyles />
          <div
            ref={constraintsRef}
            className="history-print-portal-wrap fixed inset-0 z-[9999999] overflow-y-auto custom-scrollbar"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-transparent no-print"
              onClick={handleModalClose}
            />

            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={constraintsRef}
              dragMomentum={false}
              className={`history-print-root fixed left-1/2 top-1/2 z-[10000000] -translate-x-1/2 -translate-y-1/2 flex gap-2 sm:gap-3 items-stretch max-h-[min(90vh,920px)] h-[min(90vh,920px)] lg:h-[82vh] lg:max-h-[82vh] ${
                ledgerDetailSelection
                  ? "flex-col lg:flex-row w-[min(98vw,1720px)] max-w-[1720px]"
                  : "flex-row w-[95vw] max-w-[1400px]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex flex-col overflow-hidden min-h-0 min-w-0 bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 history-print-container ${
                  ledgerDetailSelection
                    ? "flex-1 min-h-[42%] lg:min-h-0 lg:basis-[min(52%,780px)]"
                    : "w-full flex-1"
                }`}
              >
                <div className="hidden print:block w-full border-b border-black pb-2 mb-3 text-center text-[11pt] font-bold text-black">
                  {String(baiguullagiinNer ?? "").trim() || "—"}
                </div>

                {/* Header Section */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/50 select-none">
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="flex justify-between items-start mb-4 cursor-move print:justify-center"
                  >
                    <div className="print:w-full print:text-center">
                      <h2 className="text-lg sm:text-xl text-slate-800 dark:text-white print:text-black print:text-[14pt]">
                        <span className="print:hidden">Хуулга</span>
                        <span className="hidden print:inline">
                          Гүйлгээний түүх
                        </span>
                      </h2>
                      <div className="text-[13px] text-slate-400 print:hidden">
                        {contract?.ovog} {contract?.ner} • {data.length} мөр
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-lg no-print shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Info Cards - Compact Grid */}
                  <HistoryContractInfoGrid
                    contract={contract}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"
                  />

                  {/* Date Filter - Compact (хэвлэлд хэрэггүй) */}
                  <div className="no-print flex items-center gap-2 flex-wrap">
                    <div
                      className="w-full sm:w-[220px]"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <StandardDatePicker
                        isRange={true}
                        value={dateRange}
                        getPopupContainer={() => document.body}
                        popupStyle={{ zIndex: 10000050 }}
                        onChange={(date: any, dateString: any) => {
                          setModalDateFilterFromUser(true);
                          if (Array.isArray(date)) {
                            setDateRange([
                              date[0]?.isValid?.()
                                ? date[0].format("YYYY-MM-DD")
                                : null,
                              date[1]?.isValid?.()
                                ? date[1].format("YYYY-MM-DD")
                                : null,
                            ]);
                          } else if (Array.isArray(dateString)) {
                            setDateRange([
                              dateString[0] ? String(dateString[0]) : null,
                              dateString[1] ? String(dateString[1]) : null,
                            ]);
                          } else {
                            setDateRange([null, null]);
                          }
                        }}
                        size="small"
                        placeholder="Огноо"
                        classNames={{
                          input: "border-none h-8 text-[13px] ",
                        }}
                      />
                    </div>
                    {(dateRange?.[0] || dateRange?.[1]) && (
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setModalDateFilterFromUser(true);
                          setDateRange([null, null]);
                        }}
                        className="text-[10px]  text-rose-500 hover:underline"
                      >
                        Арилгах
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Section - Scrollable */}
                <div className="history-print-table-body flex-1 overflow-auto custom-scrollbar px-5 sm:px-6 print:px-0">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 z-10 bg-white dark:bg-[#0f172a]">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-1.5 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide w-10 print:w-8">
                          №
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide">
                          Огноо
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide hidden sm:table-cell print:table-cell">
                          Ажилтан
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide">
                          Төлөх дүн
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide">
                          Төлсөн дүн
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide">
                          Үлдэгдэл сараар
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide hidden md:table-cell print:table-cell">
                          Хэлбэр
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide hidden md:table-cell print:table-cell">
                          Тайлбар
                        </th>
                        <th className="py-2 px-2 text-center text-[9px] border-r text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide hidden lg:table-cell print:table-cell">
                          Бүртгэсэн огноо
                        </th>
                        <th className="py-2 px-3 text-center text-[9px] text-slate-800 dark:text-slate-100 uppercase font-semibold tracking-wide w-28">
                          Үйлдэл
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td colSpan={10} className="py-3 px-2">
                              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center">
                            <span className="text-slate-400 text-[13px]">
                              Мэдээлэл олдсонгүй
                            </span>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {filteredData.map((row, idx) => (
                            <tr
                              key={row._id || idx}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="py-2 px-1.5 text-[13px] border-r text-slate-600 dark:text-slate-300 whitespace-nowrap text-center tabular-nums w-10 print:w-8">
                                {idx}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-600 dark:text-slate-300 whitespace-nowrap text-center">
                                {formatLedgerOgnooCell(row.ognoo)}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-500 dark:text-slate-400 hidden sm:table-cell text-center">
                                {row.isSystem ? "Систем" : row.ajiltan}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">
                                {formatCurrency(row.tulukhDun)}
                              </td>
                              <td className="py-2 px-2 text-right border-r whitespace-nowrap text-slate-700 dark:text-slate-200">
                                {formatCurrency(row.tulsunDun)}
                              </td>
                              <td
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLedgerDetailSelection({
                                    kind: "row",
                                    row,
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setLedgerDetailSelection({
                                      kind: "row",
                                      row,
                                    });
                                  }
                                }}
                                data-print-balance={
                                  (row.uldegdel ?? 0) < 0.01 ? "ok" : "due"
                                }
                                className={`py-2 px-2 text-[13px] border-r text-right whitespace-nowrap cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 hover:bg-slate-100/90 dark:hover:bg-slate-800/50 transition-colors ${(row.uldegdel ?? 0) < 0.01 ? "no-underline !text-emerald-600 dark:!text-emerald-400" : "underline underline-offset-2 decoration-red-500 dark:decoration-red-400 !text-red-500 dark:!text-red-400"}`}
                                title="Дэлгэрэнгүй харах"
                              >
                                {typeof row.uldegdel === "number"
                                  ? formatCurrency(row.uldegdel)
                                  : row.uldegdel != null
                                    ? formatCurrency(Number(row.uldegdel))
                                    : "-"}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-500 dark:text-slate-400 hidden md:table-cell print:table-cell text-center">
                                {row.khelber || "-"}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-600 dark:text-slate-300 hidden md:table-cell print:table-cell">
                                {row.tailbar || "-"}
                              </td>
                              <td className="py-2 px-2 text-[13px] border-r text-slate-400 dark:text-slate-500 hidden lg:table-cell print:table-cell whitespace-nowrap text-center">
                                {row.burtgesenOgnoo &&
                                row.burtgesenOgnoo !== "-"
                                  ? new Date(row.burtgesenOgnoo).toLocaleString(
                                      "mn-MN",
                                      { hour12: false },
                                    )
                                  : "-"}
                              </td>
                              <td className="py-2 px-3 text-center flex items-center justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isDeletable =
                                      row._id &&
                                      row.sourceCollection !==
                                        "nekhemjlekhiinTuukh" &&
                                      !row.isSystem;

                                    if (isDeletable && row._id) {
                                      handleDeleteClick(
                                        row._id,
                                        row.ner || row.khelber || "",
                                      );
                                    }
                                  }}
                                  className={`p-2 transition-all rounded-lg ${
                                    row._id &&
                                    row.sourceCollection !==
                                      "nekhemjlekhiinTuukh" &&
                                    !row.isSystem
                                      ? "!text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                      : "text-gray-200 dark:text-gray-800 cursor-not-allowed opacity-50"
                                  }`}
                                  title={
                                    row.isSystem ||
                                    row.sourceCollection ===
                                      "nekhemjlekhiinTuukh"
                                      ? "Системээс эсвэл нэхэмжлэхээс үүсгэсэн - устгах боломжгүй"
                                      : row._id
                                        ? "Устгах"
                                        : "Устгах боломжгүй"
                                  }
                                  disabled={
                                    !row._id ||
                                    row.sourceCollection ===
                                      "nekhemjlekhiinTuukh" ||
                                    row.isSystem
                                  }
                                >
                                  <Trash2
                                    className={`h-5 w-5 ${
                                      row._id &&
                                      row.sourceCollection !==
                                        "nekhemjlekhiinTuukh" &&
                                      !row.isSystem
                                        ? "!text-red-500"
                                        : "text-slate-300 dark:text-slate-600"
                                    }`}
                                  />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {/* Total Summary Row — үлдэгдэл = эхний мөрийн өмнөх үлдэгдэл + Нийт төлөх - Нийт төлсөн (сарын задралын эцсийн дүнтэй ижил) */}
                          {(() => {
                            const { totalCharges, totalPayments, balance } =
                              ledgerFooterTotals;
                            const balanceClass =
                              balance < 0.01
                                ? "no-underline !text-emerald-600 dark:!text-emerald-400"
                                : "underline underline-offset-2 decoration-red-500 dark:decoration-red-400 !text-red-500 dark:!text-red-400";
                            return (
                              <tr className="history-print-total-row bg-slate-100 dark:bg-slate-800/50">
                                <td className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 px-1.5 text-[13px] text-slate-700 dark:text-slate-200 text-center border-t-2 border-slate-300 dark:border-slate-600 tabular-nums print:text-black">
                                  —
                                </td>
                                <td
                                  colSpan={2}
                                  className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 px-2 text-[13px]  text-slate-700 dark:text-slate-200 text-right border-t-2 border-slate-300 dark:border-slate-600"
                                >
                                  Нийт
                                </td>
                                <td className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 px-2 text-[13px]  text-slate-700 dark:text-slate-200 text-right whitespace-nowrap border-t-2 border-slate-300 dark:border-slate-600">
                                  {formatCurrency(totalCharges)} ₮
                                </td>
                                <td className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 px-2 text-[13px]  text-slate-700 dark:text-slate-200 text-right whitespace-nowrap border-t-2 border-slate-300 dark:border-slate-600">
                                  {formatCurrency(totalPayments)} ₮
                                </td>
                                <td
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLedgerDetailSelection({
                                      kind: "total",
                                      balance,
                                      totalCharges,
                                      totalPayments,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setLedgerDetailSelection({
                                        kind: "total",
                                        balance,
                                        totalCharges,
                                        totalPayments,
                                      });
                                    }
                                  }}
                                  data-print-balance={
                                    balance < 0.01 ? "ok" : "due"
                                  }
                                  className={`sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 py-2 px-2 text-[13px] text-right whitespace-nowrap border-t-2 border-slate-300 dark:border-slate-600 cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/50 transition-colors ${balanceClass}`}
                                  title="Дэлгэрэнгүй харах"
                                >
                                  {formatCurrency(balance)} ₮
                                </td>
                                <td
                                  colSpan={4}
                                  className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600"
                                ></td>
                              </tr>
                            );
                          })()}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {printSnapshot ? (
                  <div className="history-print-footer-meta hidden print:flex flex-row justify-between items-baseline gap-4 w-full px-5 sm:px-6 print:px-6 py-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 print:border-black print:text-black">
                    <div className="text-left shrink-0">
                      Хэвлэсэн огноо:{" "}
                      {printSnapshot.at.toLocaleString("mn-MN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </div>
                    <div className="text-right shrink-0">
                      Хэвлэсэн ажилтан: {printSnapshot.operator}
                    </div>
                  </div>
                ) : null}

                {/* Footer - Compact */}
                <div className="p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="ant-btn w-20 ant-btn-default no-print"
                  >
                    Хаах
                  </button>
                  <button
                    onClick={handlePrint}
                    className="ant-btn w-20 ant-btn-primary no-print"
                  >
                    Хэвлэх
                  </button>
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                  {deleteConfirm.show && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[100000] flex items-center justify-center bg-black/50 rounded-2xl sm:rounded-3xl"
                      onClick={handleDeleteCancel}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 !text-red-500 dark:!text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg  text-slate-800 dark:text-white mb-2">
                            Устгах уу?
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Та энэ гүйлгээг устгахдаа итгэлтэй байна уу? Энэ
                            үйлдлийг буцаах боломжгүй.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={handleDeleteCancel}
                              className="ant-btn ant-btn-default flex-1"
                            >
                              Хаах
                            </button>
                            <button
                              onClick={handleDeleteConfirm}
                              className="ant-btn ant-btn-danger flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              Устгах
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success Overlay */}
                <AnimatePresence>
                  {deleteSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[100001] flex items-center justify-center bg-black/30 rounded-2xl sm:rounded-3xl"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl"
                      >
                        <div className="text-center">
                          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <p className="text-lg  text-slate-800 dark:text-white">
                            Амжилттай устгалаа!
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="no-print">
                  <InvoiceModal
                    isOpen={showInvoiceModal}
                    onClose={() => setShowInvoiceModal(false)}
                    resident={invoiceModalResident}
                    baiguullagiinId={baiguullagiinId || ""}
                    token={token || ""}
                    barilgiinId={barilgiinId}
                    historyLedgerBalance={ledgerFooterTotals.balance}
                    historyLedgerTotalPayments={
                      ledgerFooterTotals.totalPayments
                    }
                  />
                </div>
              </div>

              <AnimatePresence>
                {ledgerDetailSelection && (
                  <motion.div
                    key="ledger-uldegdel-detail"
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 28 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className="ledger-print-panel flex flex-col overflow-hidden min-h-0 min-w-0 flex-none w-full max-h-[48%] lg:max-h-none lg:w-[min(48vw,580px)] lg:max-w-[min(94vw,620px)] bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="hidden print:block w-full border-b border-black pb-2 mb-2 text-center text-[11pt] font-bold text-black px-4">
                      {String(baiguullagiinNer ?? "").trim() || "—"}
                    </div>
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/50 shrink-0 relative">
                      <button
                        type="button"
                        onClick={() => setLedgerDetailSelection(null)}
                        className="no-print absolute right-3 top-3 sm:right-4 sm:top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-lg"
                        aria-label="Хаах"
                      >
                        ✕
                      </button>
                      <div className="text-center px-8 print:px-0">
                        <h3 className="text-base sm:text-lg text-slate-800 dark:text-white print:text-black print:text-[14pt]">
                          Үлдэгдэл сараар
                        </h3>
                      </div>
                    </div>
                    <HistoryContractInfoGrid
                      contract={contract}
                      className="hidden print:grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 w-full px-4 sm:px-5 print:px-4"
                    />
                    <div className="history-print-ledger-body flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
                      {ledgerDetailSelection.kind === "row" ? (
                        <>
                          <div
                            data-print-balance-box={
                              (ledgerDetailSelection.row.uldegdel ?? 0) < 0.01
                                ? "ok"
                                : "due"
                            }
                            className={`no-print rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800 ${
                              (ledgerDetailSelection.row.uldegdel ?? 0) < 0.01
                                ? "bg-emerald-50/80 dark:bg-emerald-950/25"
                                : "bg-rose-50/80 dark:bg-rose-950/20"
                            }`}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                              Үлдэгдэл дүн
                            </div>
                            <div
                              data-print-balance={
                                (ledgerDetailSelection.row.uldegdel ?? 0) < 0.01
                                  ? "ok"
                                  : "due"
                              }
                              className={`text-xl sm:text-2xl font-semibold tabular-nums ${
                                (ledgerDetailSelection.row.uldegdel ?? 0) < 0.01
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {formatCurrency(
                                Number(ledgerDetailSelection.row.uldegdel ?? 0),
                              )}{" "}
                              ₮
                            </div>
                          </div>
                          <LedgerMonthlyBreakdownTable
                            rows={monthlyBreakdownFull}
                            highlightYm={ledgerDetailHighlightYm}
                          />
                        </>
                      ) : (
                        <>
                          <div
                            data-print-balance-box={
                              ledgerDetailSelection.balance < 0.01
                                ? "ok"
                                : "due"
                            }
                            className={`no-print rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-800 ${
                              ledgerDetailSelection.balance < 0.01
                                ? "bg-emerald-50/80 dark:bg-emerald-950/25"
                                : "bg-rose-50/80 dark:bg-rose-950/20"
                            }`}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                              Үлдэгдэл (хамгийн сүүлийн мөр)
                            </div>
                            <div
                              data-print-balance={
                                ledgerDetailSelection.balance < 0.01
                                  ? "ok"
                                  : "due"
                              }
                              className={`text-xl sm:text-2xl font-semibold tabular-nums ${
                                ledgerDetailSelection.balance < 0.01
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {formatCurrency(ledgerDetailSelection.balance)} ₮
                            </div>
                          </div>
                          <LedgerMonthlyBreakdownTable
                            rows={monthlyBreakdownFiltered}
                          />
                        </>
                      )}
                    </div>
                    {printSnapshot ? (
                      <div className="history-print-footer-meta hidden print:flex flex-row justify-between items-baseline gap-4 w-full px-4 sm:px-5 print:px-6 py-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 print:border-black print:text-black shrink-0">
                        <div className="text-left shrink-0">
                          Хэвлэсэн огноо:{" "}
                          {printSnapshot.at.toLocaleString("mn-MN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </div>
                        <div className="text-right shrink-0">
                          Хэвлэсэн ажилтан: {printSnapshot.operator}
                        </div>
                      </div>
                    ) : null}
                    <div className="no-print p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLedgerDetailSelection(null)}
                        className="ant-btn w-20 ant-btn-default"
                      >
                        Хаах
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="ant-btn w-20 ant-btn-primary"
                      >
                        Хэвлэх
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </AnimatePresence>
      </div>
    </ModalPortal>
  );
}
