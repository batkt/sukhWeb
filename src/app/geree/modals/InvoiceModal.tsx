"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import uilchilgee from "@/lib/uilchilgee";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import formatNumber, {
  formatCurrency,
} from "../../../../tools/function/formatNumber";
import { getPaymentStatusLabel } from "@/lib/utils";
import { useBuilding } from "@/context/BuildingContext";
import useBaiguullaga from "@/lib/useBaiguullaga";
import useJagsaalt from "@/lib/useJagsaalt";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { ledgerFilterYmdKey } from "@/app/tulbur/guilgeeTuukh/ledgerRunningBalances";
import { Search, Calendar, Printer, X, Eye } from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Button from "@/components/ui/Button";

/** .env: NEXT_PUBLIC_NEKHEMJLEKHIIN_DAVLAL_20_BAIGUULLAGIIN_IDS=id1,id2 */
const NEKHEMJLEKHIIN_DAVLAL_20_BAIGUULLAGIIN_IDS = new Set(
  String(
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_NEKHEMJLEKHIIN_DAVLAL_20_BAIGUULLAGIIN_IDS ??
          ""
      : "",
  )
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
  baiguullagiinId: string;
  token: string;
  liftFloors?: string[];
  barilgiinId?: string | null;
  refreshTrigger?: number;
  /** Хуулгын «Нийт» үлдэгдэл — HistoryModal-ын `ledgerFooterTotals.balance` */
  historyLedgerBalance?: number | null;
  /** Хуулгын нийт төлсөн — `ledgerFooterTotals.totalPayments` */
  historyLedgerTotalPayments?: number | null;
}

interface Zardal {
  _id: string;
  ner: string;
  tariff: number | null | undefined;
  dun: number | null | undefined;
  turul?: string;
  zardliinTurul?: string;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted ? createPortal(children as any, document.body) : null;
};

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4;
        margin: 0.8cm;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      body * {
        visibility: hidden;
      }

      .invoice-modal,
      .invoice-modal * {
        visibility: visible !important;
      }

      .invoice-modal {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
        height: auto !important;
        overflow: visible !important;
        display: block !important;
      }

      .invoice-modal * {
        color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .no-print {
        display: none !important;
      }

      table {
        page-break-inside: auto;
        width: 100% !important;
        margin-top: 4pt !important;
      }

      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }

      .invoice-modal h2 {
        font-size: 14pt !important;
        margin-bottom: 2pt !important;
        margin-top: 0 !important;
      }
      .invoice-modal h3 {
        font-size: 10pt !important;
        margin-bottom: 1pt !important;
        margin-top: 0 !important;
      }
      .invoice-modal p,
      .invoice-modal td,
      .invoice-modal th {
        font-size: 8.5pt !important;
        line-height: 1.1 !important;
        padding: 3px 5px !important;
      }

      .invoice-modal th {
        background-color: #f5f5f5 !important;
        font-weight: bold;
        border: 1pt solid #000 !important;
      }

      .invoice-modal td {
        border: 1pt solid #ccc !important;
      }

      .grid-cols-2 {
        gap: 8pt !important;
        margin-bottom: 8pt !important;
      }

      .p-6 {
        padding: 8pt !important;
      }

      .space-y-6 > * + * {
        margin-top: 8pt !important;
      }

      .pt-6 {
        padding-top: 6pt !important;
      }

      .rounded-2xl,
      .rounded-3xl {
        border-radius: 4pt !important;
      }

      html,
      body {
        height: 100%;
        overflow: hidden !important;
      }
    }
  `}</style>
);

/** Нэхэмжлэхийн «өөрийн» огноо — API өөр талбарт хадгалж болно. */
function pickInvoiceOgnoo(inv: any): string {
  if (!inv) return "";
  const v =
    inv.ognoo ??
    inv.nekhemjlekhiinOgnoo ??
    inv.medeelel?.ognoo ??
    inv.medeelel?.nekhemjlekhiinOgnoo;
  const s = v != null ? String(v).trim() : "";
  return s;
}

/**
 * 2026-02-04 гэх мэтийг локалын хуанлийн өдөр болгон уншина (UTC 00:00-ийн алдаанаас зайлсхийх).
 */
function parseInvoiceOgnooToLocalDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  const isoDate = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) {
    const y = Number(isoDate[1]);
    const mo = Number(isoDate[2]) - 1;
    const d = Number(isoDate[3]);
    if (Number.isFinite(y) && mo >= 0 && d >= 1)
      return new Date(y, mo, d, 12, 0, 0, 0);
  }
  const dot = s.replace(/\//g, ".").match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dot) {
    const y = Number(dot[1]);
    const mo = Number(dot[2]) - 1;
    const d = Number(dot[3]);
    if (Number.isFinite(y) && mo >= 0 && d >= 1)
      return new Date(y, mo, d, 12, 0, 0, 0);
  }
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : new Date(t);
}

/** Баримт, жагсаалт: `YYYY.MM.DD` — slash формат 04/02 гэх мэтийг сар/өдөр солихгүй гэж ойлгодог */
function formatInvoiceOgnooMn(inv: any): string {
  const raw = pickInvoiceOgnoo(inv);
  if (!raw) return "-";
  const d = parseInvoiceOgnooToLocalDate(raw);
  if (!d) return "-";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${day}`;
}

/** Шүүлт: YYYY-MM-DD түлхүүрээр харьцуулах */
function ymdKeyFromString(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  }
  const d = parseInvoiceOgnooToLocalDate(s);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function invoiceOgnooSortMs(inv: any): number {
  const raw = pickInvoiceOgnoo(inv);
  if (!raw) return 0;
  const d = parseInvoiceOgnooToLocalDate(raw);
  return d ? d.getTime() : 0;
}

/** Нэхэмжлэх/invoice-тай холбогдсон төлбөр: давталтад баримтын огноогоор (ognoo) оноох — tulsunOgnoo өмнөх сар байвал алдагдана. */
function ledgerRowIsInvoiceAnchoredPayment(row: any): boolean {
  const t = String(row?.turul || row?.type || "").toLowerCase();
  if (t.includes("invoice_payment")) return true;
  const kh = String(row?.khelber || "").toLowerCase();
  if (kh.includes("invoice_payment")) return true;
  const src = String(row?.sourceCollection || "").toLowerCase();
  if (
    src.includes("nekhemjlekhiintuukh") ||
    src.includes("nekhemjlekhiin_tuukh")
  ) {
    return true;
  }
  const isPayTurul =
    t === "tulult" ||
    t.includes("tulult") ||
    t.includes("төлөлт") ||
    t.includes("төлбөр");
  if (
    isPayTurul &&
    String(row?.parentInvoiceId ?? row?.nekhemjlekhiinTuukhId ?? "").trim()
  ) {
    return true;
  }
  return false;
}

/**
 * Хуулгын сарын шүүлт / баганын огноо.
 * Ерөнхий төлөлт: эхлээд tulsunOgnoo. Invoice-тай төлбөр: эхлээд ognoo (баримтын өдөр).
 */
function ledgerRowYmdKeyForMonth(row: any): string | null {
  const type = String(row?.turul || row?.type || "").toLowerCase();
  const fromRow = () =>
    ledgerFilterYmdKey(row?.ognoo) ||
    ledgerFilterYmdKey(row?.tulsunOgnoo) ||
    ledgerFilterYmdKey(row?.burtgesenOgnoo) ||
    null;

  if (ledgerRowIsInvoiceAnchoredPayment(row)) {
    return fromRow();
  }

  const isPayment =
    type === "tulult" ||
    type === "төлбөр" ||
    type === "төлөлт" ||
    type.includes("төлөлт") ||
    type.includes("төлбөр");
  if (isPayment) {
    const p = ledgerFilterYmdKey(row?.tulsunOgnoo);
    if (p) return p;
  }
  return fromRow();
}

function endOfMonthYmd(ym: string): string {
  const parts = ym.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return `${ym}-31`;
  }
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/**
 * Нэхэмжлэхийн «сарын» түлхүүр: cycleStartDay-оос дараа сарын (cycleStartDay-1) хүртэл.
 * cycleStartDay <= 1 бол хуанлийн YYYY-MM (огнооны сар).
 */
function invoiceBillingYmFromYmdKey(
  ymd: string | null,
  cycleStartDay: number,
): string | null {
  if (!ymd || ymd.length < 7) return null;
  if (!Number.isFinite(cycleStartDay) || cycleStartDay <= 1) {
    return ymd.slice(0, 7);
  }
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd.slice(0, 7);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return ymd.slice(0, 7);
  }
  if (d >= cycleStartDay) {
    return `${y}-${String(mo).padStart(2, "0")}`;
  }
  const pm = mo === 1 ? 12 : mo - 1;
  const py = mo === 1 ? y - 1 : y;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

function ledgerRowBillingYmFromRow(
  row: any,
  cycleStartDay: number,
): string | null {
  const k = ledgerRowYmdKeyForMonth(row);
  return invoiceBillingYmFromYmdKey(k, cycleStartDay);
}

/** Тухайн нэхэмжлэхийн давталтын сүүлийн өдөр (YYYY-MM-DD), үлдэгдлийг энэ огноо хүртэл авна. */
function billingPeriodEndYmd(cycleYm: string, cycleStartDay: number): string {
  if (!Number.isFinite(cycleStartDay) || cycleStartDay <= 1) {
    return endOfMonthYmd(cycleYm);
  }
  const parts = cycleYm.split("-");
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
    return endOfMonthYmd(cycleYm);
  }
  let nm = mo + 1;
  let ny = y;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  const endDay = cycleStartDay - 1;
  if (endDay < 1) return endOfMonthYmd(cycleYm);
  const lastInMonth = new Date(ny, nm, 0).getDate();
  const d = Math.min(endDay, lastInMonth);
  return `${ny}-${String(nm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Дараагийн нэхэмжлэхийн давталтын YYYY-MM (жишээ нь 2026-01 → 2026-02). */
function nextBillingCycleYm(ym: string): string | null {
  const parts = ym.split("-");
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) {
    return null;
  }
  let nm = mo + 1;
  let ny = y;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function compareHistoryLedgerRowsChrono(a: any, b: any): number {
  const ak = ledgerRowYmdKeyForMonth(a);
  const bk = ledgerRowYmdKeyForMonth(b);
  if (ak && bk && ak !== bk) return ak.localeCompare(bk);
  if (ak && !bk) return -1;
  if (!ak && bk) return 1;
  const timeA = new Date(
    a?.burtgesenOgnoo && a.burtgesenOgnoo !== "-"
      ? a.burtgesenOgnoo
      : a?.createdAt || a?.ognoo || 0,
  ).getTime();
  const timeB = new Date(
    b?.burtgesenOgnoo && b.burtgesenOgnoo !== "-"
      ? b.burtgesenOgnoo
      : b?.createdAt || b?.ognoo || 0,
  ).getTime();
  if (timeA !== timeB) return timeA - timeB;
  return String(a?._id || "").localeCompare(String(b?._id || ""));
}

/** HistoryModal backend ledger: ashiglalt мөр талбарууд заримдаа эсрэгээр ирнэ. */
function pickInvoiceModalLedgerTulukhTulsun(r: any): {
  tulukh: number;
  tulsun: number;
} {
  let tulukh = Number(r.tulukhDun ?? r.dun ?? r.niitDun ?? 0) || 0;
  let tulsun = Number(r.tulsunDun ?? r.tulsun ?? 0) || 0;
  const rowTurul = String(r.turul || "").toLowerCase();
  if (rowTurul === "ashiglalt" && tulukh > 0 && tulsun === 0) {
    tulsun = tulukh;
    tulukh = 0;
  }
  return { tulukh, tulsun };
}

/**
 * Converts a number to Mongolian words
 * This is a simplified version suitable for invoice totals
 */
/**
 * Converts a number to Mongolian words for official document currency representation
 */
function numberToMongolianWords(n: number): string {
  if (n === 0) return "Тэг төгрөг тэг мөнгө болно";
  const absN = Math.abs(n);
  const integerPart = Math.floor(absN);
  const decimalPart = Math.round((absN - integerPart) * 100);

  const units = [
    "",
    "нэг",
    "хоёр",
    "гурав",
    "дөрөв",
    "тав",
    "зургаа",
    "долоо",
    "найм",
    "ес",
  ];
  const nUnits = [
    "",
    "нэгэн",
    "хоёр",
    "гурван",
    "дөрвөн",
    "таван",
    "зургаан",
    "долоон",
    "найман",
    "есөн",
  ];
  const tens = [
    "",
    "арав",
    "хорь",
    "гуч",
    "дөч",
    "тавь",
    "жар",
    "дал",
    "ная",
    "ер",
  ];
  const nTens = [
    "",
    "арван",
    "хорин",
    "гучин",
    "дөчин",
    "тавин",
    "жаран",
    "далан",
    "наян",
    "ерэн",
  ];
  const scales = ["", "мянга", "сая", "тэрбум", "их наяд"];
  const nScales = ["", "мянган", "сая", "тэрбум", "их наяд"]; // Note: million+ often stay the same in casual/formal mix

  const formatGroup = (
    num: number,
    isLast: boolean,
    isMainCurrency: boolean,
  ): string => {
    let res = "";
    const h = Math.floor(num / 100);
    const remainder = num % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (h > 0) {
      if (t === 0 && u === 0 && !isLast) {
        res += nUnits[h] + " зуун ";
      } else {
        res += nUnits[h] + " зуун ";
      }
    }

    if (t > 0) {
      if (u === 0) {
        res += (isLast && !isMainCurrency ? tens[t] : nTens[t]) + " ";
      } else {
        res += nTens[t] + " ";
      }
    }

    if (u > 0) {
      if (isLast) {
        res += (isMainCurrency ? nUnits[u] : units[u]) + " ";
      } else {
        res += nUnits[u] + " ";
      }
    }
    return res;
  };

  const decodeInteger = (num: number): string => {
    if (num === 0) return "";
    let res = "";
    let temp = num;
    let groupIdx = 0;

    while (temp > 0) {
      const group = temp % 1000;
      if (group > 0) {
        const groupStr = formatGroup(group, groupIdx === 0, true);
        const scaleStr =
          groupIdx > 0
            ? temp >= 1000
              ? nScales[groupIdx]
              : scales[groupIdx]
            : "";
        res = groupStr + (scaleStr ? scaleStr + " " : "") + res;
      }
      temp = Math.floor(temp / 1000);
      groupIdx++;
    }
    return res.trim();
  };

  const decodeCents = (num: number): string => {
    if (num === 0) return "тэг";
    const t = Math.floor(num / 10);
    const u = num % 10;
    let res = "";
    if (t > 0) {
      if (u === 0) res += nTens[t];
      else res += nTens[t] + " " + units[u];
    } else if (u > 0) {
      res += units[u];
    }
    return res.trim();
  };

  const words = decodeInteger(integerPart);
  const cents = decodeCents(decimalPart);

  const result = (words || "Тэг") + " төгрөг " + cents + " мөнгө болно";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/** `/dans` мөр + байгууллага — нэхэмжлэгчийн хэсэгт харуулах утгууд */
function buildNekhemjlekhiinSenderDisplay(
  dansRow: any | null,
  baiguullaga: any | null | undefined,
  invoiceBaiguullagiinNer?: string | null,
) {
  const d = dansRow;
  const b = baiguullaga;
  const pickStr = (...vals: (string | null | undefined)[]) => {
    for (const v of vals) {
      const s = v != null ? String(v).trim() : "";
      if (s) return s;
    }
    return "";
  };
  const pickUtas = (u: any) => {
    if (u == null) return "";
    if (Array.isArray(u)) return String(u[0] ?? "").trim();
    return String(u).trim();
  };
  const bankLabel = (code: unknown) => {
    const c = String(code || "").trim();
    if (c === "khanbank") return "Хаан банк";
    if (c === "tdb") return "ХХБ";
    return c;
  };
  const bankNer =
    pickStr(d?.bankNer, d?.bankniinNer) ||
    bankLabel(d?.bank) ||
    pickStr(b?.bankNer);

  return {
    ner:
      pickStr(
        b?.ner,
        invoiceBaiguullagiinNer,
        d?.baiguullagiinNer,
        d?.dansniiNer,
        d?.ner,
      ) || "-",
    khayag: pickStr(d?.khayag, d?.hayag, b?.khayag) || "-",
    utas:
      pickStr(pickUtas(d?.utas), d?.utasFaks, d?.faks, pickUtas(b?.utas)) ||
      "-",
    email: pickStr(d?.email, b?.email) || "-",
    bankNer: bankNer || "-",
    dans: pickStr(d?.dugaar, d?.dans, b?.dans) || "-",
    dotoodNer:
      pickStr(
        d?.dansniiNer,
        d?.ezemshigch,
        d?.dansEzemshigch,
        d?.dotoodNer,
        b?.dotoodNer,
      ) || "-",
  };
}

/** Same criteria as HistoryModal nekhemjlekhiin rows (`isSystem` → table shows «Систем»). */
function nekhemjlekhiinTuukhIsSystem(inv: Record<string, unknown>): boolean {
  const med = inv.medeelel as Record<string, unknown> | undefined;
  const source = String(
    med?.uusgegsenEsekh ?? inv.uusgegsenEsekh ?? "garan",
  ).trim();
  return (
    source === "automataar" ||
    source === "cron" ||
    !String(inv.maililgeesenAjiltniiId ?? "").trim()
  );
}

function nekhemjlekhiinSkipResidentStaffName(
  label: string,
  resident?: { ner?: string; ovog?: string } | null,
): boolean {
  const resNer = String(resident?.ner ?? "").trim();
  const ovog = String(resident?.ovog ?? "").trim();
  const resFull = [ovog, resNer].filter(Boolean).join(" ").trim();
  if (!resNer && !resFull) return false;
  if (resNer && label === resNer) return true;
  if (resFull && label === resFull) return true;
  if (resNer && ovog && label === `${resNer} ${ovog}`.trim()) return true;
  return false;
}

/**
 * Sidebar «Ажилтан»: system-generated → «Систем»; else staff fields (not оршин суугч).
 * Some payloads duplicate resident in ajiltanNer — skip those matches.
 */
function nekhemjlekhiinTuukhSidebarAjiltanDisplay(
  inv: Record<string, unknown>,
  resident?: { ner?: string; ovog?: string } | null,
): string {
  if (nekhemjlekhiinTuukhIsSystem(inv)) return "Систем";

  const pick = (v: unknown): string | null => {
    const s = v != null ? String(v).trim() : "";
    if (!s || nekhemjlekhiinSkipResidentStaffName(s, resident)) return null;
    return s;
  };

  for (const v of [
    inv.maililgeesenAjiltniiNer,
    inv.burtgesenAjiltaniiNer,
    inv.guilgeeKhiisenAjiltniiNer,
    inv.ajiltan,
    inv.ajiltanNer,
  ]) {
    const p = pick(v);
    if (p) return p;
  }
  return "—";
}

/**
 * Printed «Нэхэмжлэл бичсэн» — align with HistoryModal Ажилтан for нэхэмжлэх мөрүүд.
 */
function nekhemjlekhiinBichsenDisplay(
  inv: Record<string, unknown> | null | undefined,
  resident?: { ner?: string; ovog?: string } | null,
): string {
  if (!inv) return "—";
  if (nekhemjlekhiinTuukhIsSystem(inv)) return "Систем";

  const pick = (v: unknown): string | null => {
    const s = v != null ? String(v).trim() : "";
    if (!s || nekhemjlekhiinSkipResidentStaffName(s, resident)) return null;
    return s;
  };

  for (const v of [
    inv.burtgesenAjiltaniiNer,
    inv.guilgeeKhiisenAjiltniiNer,
    inv.maililgeesenAjiltniiNer,
    inv.ajiltan,
    inv.ajiltanNer,
  ]) {
    const p = pick(v);
    if (p) return p;
  }

  const org = String(inv.baiguullagiinNer ?? "").trim();
  return org ? `${org} СӨХ` : "—";
}

function nekhemjlekhiinTuukhSidebarSearchHaystack(
  inv: Record<string, unknown>,
) {
  const med = inv.medeelel as Record<string, unknown> | undefined;
  return [
    inv.maililgeesenAjiltniiNer,
    inv.burtgesenAjiltaniiNer,
    inv.guilgeeKhiisenAjiltniiNer,
    inv.ajiltan,
    inv.ajiltanNer,
    inv.nekhemjlekhiinDugaar,
    inv.zagvar,
    inv.nekhemjlekhiinTurul,
    inv.ner,
    inv.ognoo,
    inv.nekhemjlekhiinOgnoo,
    med?.ognoo,
    med?.nekhemjlekhiinOgnoo,
  ]
    .map((x) => (x != null ? String(x) : ""))
    .join(" ")
    .toLowerCase();
}

/** Same 2dp rounding as HistoryModal ledger (`roundLedgerRunningStep`). */
function roundInvoiceMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function pickInvoiceStoredTulsun(inv: any): number | null {
  if (!inv) return null;
  const raw =
    inv.tulsunDun ??
    inv.niitTulsun ??
    inv.medeelel?.tulsunDun ??
    inv.medeelel?.niitTulsun;
  if (raw === null || raw === undefined || raw === "") return null;
  const t = Number(raw);
  return Number.isFinite(t) && t >= 0 ? roundInvoiceMoney(t) : null;
}

function normInvoiceDateKey(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const head = s.includes("T") ? s.split("T")[0]! : s.split(" ")[0]!;
  return head.replace(/\./g, "-").slice(0, 10);
}

/** paymentHistory нийлбэр (sync мөр орхино) — баримтын нийт дүнтэй харьцуулах. */
function sumPaymentHistoryPhAmount(list: any[]): number {
  return roundInvoiceMoney(
    (Array.isArray(list) ? list : []).reduce((s: number, p: any) => {
      const pt = String(p?.turul || "").toLowerCase();
      if (
        pt === "system_sync" ||
        pt.includes("system_sync") ||
        pt.includes("sync_neg") ||
        pt.includes("sync_pos") ||
        pt === "sync"
      ) {
        return s;
      }
      const v = Math.abs(
        Number(p?.dun ?? p?.tulsunDun ?? p?.tulukhDun ?? p?.undsenDun ?? 0) ||
          0,
      );
      return s + (Number.isFinite(v) ? v : 0);
    }, 0),
  );
}

/**
 * HistoryModal / nekhemjlekh-той ойролцоо: API заримдаа turul=tulbur, дүнг dun/tulukhDun-д өгнө.
 */
function guilgeeDocumentPaymentAmount(g: any): number {
  const t = String(g.turul || g.type || "")
    .trim()
    .toLowerCase();
  if (t === "avlaga" || t === "авлага") return 0;

  const tulsun = Number(g.tulsunDun ?? g.tulsun ?? 0);
  if (Number.isFinite(tulsun) && tulsun > 0) return Math.abs(tulsun);

  if (t === "ashiglalt" || t.includes("ашиглалт")) {
    const c = Number(g.tulukhDun ?? g.dun ?? 0);
    return Number.isFinite(c) && c > 0 ? Math.abs(c) : 0;
  }

  const isPayTurul =
    t.includes("төлөлт") ||
    t.includes("төлбөр") ||
    t.includes("invoice_payment") ||
    t === "tulult" ||
    t.includes("tulult") ||
    t === "tulbur" ||
    t.includes("tulbur") ||
    t === "prepayment" ||
    t.includes("prepayment");
  if (!isPayTurul) return 0;

  const dun = Number(g.dun ?? 0);
  const tul = Number(g.tulukhDun ?? 0);
  const fallback =
    dun > 0 ? dun : tul > 0 ? tul : Number(g.undsenDun ?? 0) || 0;
  return Number.isFinite(fallback) && fallback > 0
    ? Math.abs(fallback)
    : 0;
}

function resolveGereeIdForHistoryLedger(resident: any): string {
  if (!resident) return "";
  const explicit = String(
    resident.gereeniiId || resident.gereeId || resident._gereeniiId || "",
  ).trim();
  const looksNekh = Boolean(
    resident?.medeelel?.zardluud ||
    resident?.medeelel?.guilgeenuud ||
    (Array.isArray(resident?.zardluud) && resident.zardluud.length > 0) ||
    (Array.isArray(resident?.guilgeenuud) && resident.guilgeenuud.length > 0),
  );
  return (
    explicit || (!looksNekh && resident._id ? String(resident._id).trim() : "")
  );
}

export default function InvoiceModal({
  isOpen,
  onClose,
  resident,
  baiguullagiinId,
  token,
  liftFloors = [],
  barilgiinId,
  refreshTrigger = 0,
  historyLedgerBalance,
}: InvoiceModalProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useModalHotkeys({
    isOpen,
    onClose,
    container: containerRef.current,
  });

  const { selectedBuildingId } = useBuilding();
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);

  /** 1 = хуанлийн сар; 20 = сарын 20–дараа сарын 19 гэх мэт давталт. */
  const nekhemjlekhiinCycleStartDay = useMemo(() => {
    const raw = baiguullaga?.tokhirgoo?.nekhemjlekhiinDavlaliinEkhlekhUdur;
    if (raw != null && String(raw).trim() !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 1 && n <= 28) return Math.floor(n);
    }
    const gid = String(baiguullagiinId || "").trim();
    if (gid && NEKHEMJLEKHIIN_DAVLAL_20_BAIGUULLAGIIN_IDS.has(gid)) {
      return 20;
    }
    if (String(baiguullaga?.ner || "").trim() === "Найрамдал") {
      return 20;
    }
    return 1;
  }, [
    baiguullagiinId,
    baiguullaga?.ner,
    baiguullaga?.tokhirgoo?.nekhemjlekhiinDavlaliinEkhlekhUdur,
  ]);

  const gereeIdForLedgerFetch = useMemo(
    () => resolveGereeIdForHistoryLedger(resident),
    [
      resident?._id,
      resident?.gereeniiId,
      resident?.gereeId,
      resident?._gereeniiId,
    ],
  );

  const [ledgerBalanceFromFetch, setLedgerBalanceFromFetch] = useState<
    number | null
  >(null);
  const [ledgerRawRows, setLedgerRawRows] = useState<any[]>([]);

  const dansOrgQuery = useMemo(() => {
    const q: Record<string, any> = {};
    if (baiguullagiinId) q.baiguullagiinId = baiguullagiinId;
    q.barilgiinId = selectedBuildingId || barilgiinId || null;
    return q;
  }, [baiguullagiinId, selectedBuildingId, barilgiinId]);

  const { jagsaalt: dansJagsaalt } = useJagsaalt<any>(
    isOpen && baiguullagiinId ? DANS_ENDPOINT : "",
    dansOrgQuery,
    { createdAt: -1 },
    undefined,
    [],
    token,
  );

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setLedgerRawRows([]);
      setLedgerBalanceFromFetch(null);
      return;
    }
    if (
      !selectedInvoice?._id ||
      !token ||
      !baiguullagiinId ||
      !gereeIdForLedgerFetch
    ) {
      setLedgerRawRows([]);
      setLedgerBalanceFromFetch(null);
      return;
    }
    let cancelled = false;
    const gid = gereeIdForLedgerFetch;
    uilchilgee(token)
      .get(`/geree/${gid}/history-ledger`, {
        params: {
          baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          _t: Date.now(),
        },
      })
      .then((resp) => {
        if (cancelled) return;
        const rows = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data?.ledger)
            ? resp.data.ledger
            : Array.isArray(resp.data)
              ? resp.data
              : [];
        setLedgerRawRows(rows);

        const g = resp.data?.globalUldegdel;
        if (g != null && Number.isFinite(Number(g))) {
          setLedgerBalanceFromFetch(roundInvoiceMoney(Number(g)));
          return;
        }
        const sorted = [...rows].sort(compareHistoryLedgerRowsChrono);
        const last = sorted[sorted.length - 1];
        const u = last?.uldegdel != null ? Number(last.uldegdel) : NaN;
        setLedgerBalanceFromFetch(
          Number.isFinite(u) ? roundInvoiceMoney(u) : null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLedgerRawRows([]);
          setLedgerBalanceFromFetch(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    selectedInvoice?._id,
    token,
    baiguullagiinId,
    barilgiinId,
    selectedBuildingId,
    refreshTrigger,
    gereeIdForLedgerFetch,
  ]);

  useEffect(() => {
    if (isOpen) setDateRange([null, null]);
  }, [isOpen, resident?._id, resident?.gereeniiId]);

  const nekhemjlekhiinSender = useMemo(
    () =>
      buildNekhemjlekhiinSenderDisplay(
        Array.isArray(dansJagsaalt) && dansJagsaalt.length > 0
          ? dansJagsaalt[0]
          : null,
        baiguullaga,
        selectedInvoice?.baiguullagiinNer,
      ),
    [dansJagsaalt, baiguullaga, selectedInvoice?.baiguullagiinNer],
  );

  const fetchInvoices = async () => {
    if (!token || !baiguullagiinId || !resident?._id) return;
    setLoadingInvoices(true);
    try {
      const residentId = String(resident?._id || "").trim();
      const residentGereeId = String(resident?.gereeniiId || "").trim();

      const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
        params: {
          baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 2000,
        },
      });

      const list = Array.isArray(resp.data?.jagsaalt)
        ? resp.data.jagsaalt
        : Array.isArray(resp.data)
          ? resp.data
          : [];
      const residentInvoices = list.filter((item: any) => {
        const itemGid = String(item?.gereeniiId || item?.gereeId || "").trim();
        const itemRid = String(item?.orshinSuugchId || "").trim();
        return (
          (residentGereeId && itemGid === residentGereeId) ||
          (residentId && itemRid === residentId)
        );
      });

      const sorted = [...residentInvoices].sort((a: any, b: any) => {
        const aMs = invoiceOgnooSortMs(a);
        const bMs = invoiceOgnooSortMs(b);
        return bMs !== aMs
          ? bMs - aMs
          : new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime();
      });

      setInvoices(sorted);
      if (sorted.length > 0 && !selectedInvoice) {
        setSelectedInvoice(sorted[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvoices();
    }
  }, [
    isOpen,
    token,
    baiguullagiinId,
    resident?._id,
    selectedBuildingId,
    barilgiinId,
    refreshTrigger,
  ]);

  // When invoices are manually sent/created elsewhere, refresh the versions list live.
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") return;

    const handler = (e: any) => {
      // Refresh unconditionally while modal is open.
      // (Some screens send ids as contractId/gereeId, while InvoiceModal may only know residentId;
      // gating this can incorrectly block refresh.)
      fetchInvoices();
    };

    window.addEventListener("sukh:invoices-sent", handler as any);
    return () =>
      window.removeEventListener("sukh:invoices-sent", handler as any);
  }, [isOpen, token, baiguullagiinId, selectedBuildingId, barilgiinId]);

  const [expenseRows, setExpenseRows] = useState<any[]>([]);
  const [paymentRows, setPaymentRows] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedInvoice) {
      setExpenseRows([]);
      setPaymentRows([]);
      return;
    }

    const run = async () => {
      // Use the data specifically saved within this invoice record to show accurate month-by-month details
      const zRows = Array.isArray(selectedInvoice?.medeelel?.zardluud)
        ? selectedInvoice.medeelel.zardluud
        : Array.isArray(selectedInvoice?.zardluud)
          ? selectedInvoice.zardluud
          : [];

      const gRows = Array.isArray(selectedInvoice?.medeelel?.guilgeenuud)
        ? selectedInvoice.medeelel.guilgeenuud
        : Array.isArray(selectedInvoice?.guilgeenuud)
          ? selectedInvoice.guilgeenuud
          : [];

      const expenseMap = new Map<string, any>();
      zRows.forEach((z: any) => {
        const ner = String(z.ner || z.zardliinNer || "").trim();
        if (ner) {
          const amount = Number(z.dun || z.tulukhDun || z.tariff || 0);
          const existing = expenseMap.get(ner);
          if (existing) {
            existing.dun += amount;
          } else {
            expenseMap.set(ner, { ...z, ner, dun: amount });
          }
        }
      });

      // Also include receivable transactions (Авлага) as rows in the expense table.
      // IMPORTANT: Payments must NOT be mixed into invoice charges; we show them separately
      // and compute a unified paid/remaining that matches "Нийт дүн".
      gRows.forEach((g: any) => {
        const t = String(g.turul || "").toLowerCase();

        // Treat anything non-payment in guilgeenuud as an Avlaga/Charge if it has a positive amount
        if (
          t.includes("төлөлт") ||
          t.includes("төлбөр") ||
          t.includes("invoice_payment") ||
          t === "tulbur" ||
          t.includes("tulbur") ||
          t === "tulult" ||
          t.includes("tulult") ||
          t === "prepayment" ||
          t.includes("prepayment")
        )
          return;
        if (t === "ashiglalt" || t.includes("ашиглалт")) return;
        const ner = String(
          g.tailbar || g.medeelel?.tailbar || "Нэмэлт төлбөр",
        ).trim();
        const amount = Number(g.undsenDun || g.tulukhDun || g.dun || 0);
        if (amount > 0) {
          const existing = expenseMap.get(ner);
          if (existing) {
            existing.dun += amount;
          } else {
            expenseMap.set(ner, { ...g, ner, dun: amount });
          }
        }
      });

      // Include internal paymentHistory as PAYMENT rows (do not affect charges table)
      const phRaw = Array.isArray(selectedInvoice?.paymentHistory)
        ? selectedInvoice.paymentHistory
        : [];
      const invIdForPayments = String(selectedInvoice?._id || "").trim();
      const paymentParentKey = (p: any) =>
        String(
          p?.parentInvoiceId ??
            p?.nekhemjlekhiinTuukhId ??
            p?.invoiceId ??
            "",
        ).trim();
      const phHasExplicitInvoiceLink = phRaw.some(
        (p: any) => paymentParentKey(p) !== "",
      );
      const paymentMap = new Map<string, any>();
      const addPaymentRow = (
        ognoo: any,
        tailbar: any,
        amount: any,
        id: any,
      ) => {
        const amt = Math.abs(Number(amount ?? 0));
        if (!Number.isFinite(amt) || amt === 0) return;
        const idStr = id != null ? String(id).trim() : "";
        const key =
          idStr !== ""
            ? `id:${idStr}`
            : `m:${roundInvoiceMoney(amt)}|${normInvoiceDateKey(ognoo)}|${String(
                tailbar || "Төлөлт",
              )
                .trim()
                .toLowerCase()
                .slice(0, 120)}`;
        if (paymentMap.has(key)) return;
        paymentMap.set(key, {
          _id: idStr || key,
          ognoo,
          tailbar: String(tailbar || "Төлөлт").trim(),
          dun: amt,
        });
      };

      // Ensure ekhnii uldegdel is shown if provided but missing from rows
      const ekhniiVal = Number(
        selectedInvoice?.ekhniiUldegdel ??
          selectedInvoice?.medeelel?.ekhniiUldegdel ??
          0,
      );
      if (ekhniiVal !== 0 && !expenseMap.has("Эхний үлдэгдэл")) {
        expenseMap.set("Эхний үлдэгдэл", {
          ner: "Эхний үлдэгдэл",
          dun: ekhniiVal,
          _id: "extra-ekhnii",
        });
      }

      // Fallback alignment: if the rows do not sum up exactly to niitTulbur, there are missing charges.
      // Append a 'Бусад төлбөр' line to ensure mathematical perfection against the official invoice total.
      let mapTotal = 0;
      expenseMap.forEach((val) => {
        mapTotal += Number(val.dun || 0);
      });
      const officialNiitTulbur = Number(
        selectedInvoice?.niitTulbur ?? selectedInvoice?.niitDun ?? 0,
      );
      const diff = officialNiitTulbur - mapTotal;
      if (officialNiitTulbur !== 0 && diff > 0) {
        expenseMap.set("Бусад төлбөр (Авлага)", {
          ner: "Авлага",
          dun: diff,
          _id: "discrepancy-fill",
        });
      }

      let chargesAfterFill = 0;
      expenseMap.forEach((val) => {
        chargesAfterFill += Number(val.dun || 0);
      });
      chargesAfterFill = roundInvoiceMoney(chargesAfterFill);
      const refInvoiceTotal =
        officialNiitTulbur !== 0 && Number.isFinite(officialNiitTulbur)
          ? roundInvoiceMoney(officialNiitTulbur)
          : chargesAfterFill;

      let phRows: any[];
      if (phHasExplicitInvoiceLink) {
        phRows = phRaw.filter(
          (p: any) => paymentParentKey(p) === invIdForPayments,
        );
      } else {
        const sumPh = sumPaymentHistoryPhAmount(phRaw);
        const generousCeiling =
          refInvoiceTotal > 0.005
            ? roundInvoiceMoney(refInvoiceTotal * 1.18 + 300)
            : Number.POSITIVE_INFINITY;
        phRows =
          sumPh <= generousCeiling + 0.005 || sumPh < 0.005 ? phRaw : [];
      }

      const suulchiinVal = Number(
        selectedInvoice?.suulchiinUldegdel ??
          selectedInvoice?.medeelel?.suulchiinUldegdel ??
          0,
      );
      if (
        suulchiinVal !== 0 &&
        !expenseMap.has("Эхний үлдэгдэл") &&
        !expenseMap.has("Сүүлчийн үлдэгдэл")
      ) {
        // Some invoices might store final balance instead
      }

      // Fetch historical readings for the specific month of the invoice
      try {
        const invDate =
          parseInvoiceOgnooToLocalDate(pickInvoiceOgnoo(selectedInvoice)) ??
          new Date();
        const y = invDate.getFullYear();
        const m = invDate.getMonth();
        const startOfMonth = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
        const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

        const readingResp = await uilchilgee(token).get("/zaaltJagsaaltAvya", {
          params: {
            baiguullagiinId,
            ekhlekhOgnoo: startOfMonth,
            duusakhOgnoo: endOfMonth,
            gereeniiDugaar:
              selectedInvoice?.gereeniiDugaar || resident?.gereeniiId,
          },
        });

        if (
          readingResp.data?.success &&
          Array.isArray(readingResp.data?.data)
        ) {
          const readings = readingResp.data.data;
          const match = readings[0]; // Take the most relevant reading for this month

          if (match) {
            const keys = Array.from(expenseMap.keys());
            let tsahKey = keys.find((k) => k.trim() === "Цахилгаан");
            if (!tsahKey) {
              tsahKey = keys.find(
                (k) =>
                  k.toLowerCase().includes("цахилгаан") &&
                  !k.toLowerCase().includes("дундын"),
              );
            }

            if (tsahKey) {
              const existing = expenseMap.get(tsahKey);
              expenseMap.set(tsahKey, {
                ...existing,
                umnukh: match.umnukhZaalt ?? existing.umnukh,
                suuliin: match.suuliinZaalt ?? existing.suuliin,
              });
            }
          }
        }
      } catch (err) {
        console.error("Historical reading fetch error:", err);
      }

      const expenseList = Array.from(expenseMap.values()).filter((r: any) => {
        const dun = Number(r.dun || 0);
        const ner = String(r.ner || "").trim();
        if (ner === "Авлага" && dun < 0) return false;
        if (r._id === "discrepancy-fill" && dun < 0) return false;
        return true;
      });
      setExpenseRows(expenseList);

      const pRowsFromGuilgee = gRows
        .map((g: any, idx: number) => {
          const amt = guilgeeDocumentPaymentAmount(g);
          if (amt <= 0) return null;
          return {
            _id: g._id ? String(g._id) : `pay-${idx}`,
            ognoo: g.ognoo || g.tulsunOgnoo || g.createdAt,
            tailbar: g.tailbar || g.medeelel?.tailbar || "Төлөлт",
            dun: amt,
          };
        })
        .filter(Boolean) as {
        _id: string;
        ognoo: any;
        tailbar: string;
        dun: number;
      }[];

      // paymentHistory rows
      phRows.forEach((p: any) => {
        const pt = String(p.turul || "").toLowerCase();
        if (
          pt === "system_sync" ||
          pt.includes("system_sync") ||
          pt.includes("sync_neg") ||
          pt.includes("sync_pos") ||
          pt === "sync"
        ) {
          return;
        }
        addPaymentRow(
          p.ognoo || p.tulsunOgnoo || p.createdAt,
          p.tailbar || "Төлөлт",
          p.dun ?? p.tulsunDun ?? p.tulukhDun ?? p.undsenDun ?? 0,
          p._id,
        );
      });
      pRowsFromGuilgee.forEach((r: any) =>
        addPaymentRow(r.ognoo, r.tailbar, r.dun, r._id),
      );
      setPaymentRows(Array.from(paymentMap.values()));
    };

    run();
  }, [
    selectedInvoice,
    token,
    baiguullagiinId,
    barilgiinId,
    selectedBuildingId,
  ]);

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const startKey = ymdKeyFromString(dateRange[0]);
    const endKey = ymdKeyFromString(dateRange[1]);
    return invoices.filter((inv) => {
      const matchSearch =
        !q || nekhemjlekhiinTuukhSidebarSearchHaystack(inv).includes(q);
      const invKey = ymdKeyFromString(pickInvoiceOgnoo(inv));
      let matchDate = true;
      if (startKey && invKey && invKey < startKey) matchDate = false;
      if (endKey && invKey && invKey > endKey) matchDate = false;
      if ((startKey || endKey) && !invKey) matchDate = false;
      return matchSearch && matchDate;
    });
  }, [invoices, searchTerm, dateRange]);

  const invoiceTotal = useMemo(() => {
    const linesSum = expenseRows.reduce((s, r) => s + (Number(r?.dun) || 0), 0);
    const official = Number(
      selectedInvoice?.niitTulbur ?? selectedInvoice?.niitDun ?? 0,
    );
    // Хүснэгтэнд харагдаж буй мөрүүдийн нийлбэр = Нийт дүн (төлбөр аль хэдийн тусдаа баганад).
    // niitTulbur заримдаа гэрээний үлдэгдэл мэт буруу утга орсон байвал «Төлсөн»-ийг давтан хасна.
    if (linesSum > 0) return Math.round(linesSum * 100) / 100;
    if (Number.isFinite(official) && official !== 0) return official;
    return 0;
  }, [selectedInvoice, expenseRows]);

  const paidTotalFromRows = useMemo(() => {
    return roundInvoiceMoney(
      (paymentRows || []).reduce((s: number, r: any) => {
        const v = Number(r?.dun ?? 0);
        return s + (Number.isFinite(v) ? Math.abs(v) : 0);
      }, 0),
    );
  }, [paymentRows]);

  const resolvedHistoryLedgerBalance = useMemo(() => {
    if (
      historyLedgerBalance != null &&
      Number.isFinite(Number(historyLedgerBalance))
    ) {
      return roundInvoiceMoney(Number(historyLedgerBalance));
    }
    if (
      ledgerBalanceFromFetch != null &&
      Number.isFinite(ledgerBalanceFromFetch)
    ) {
      return ledgerBalanceFromFetch;
    }
    return null;
  }, [historyLedgerBalance, ledgerBalanceFromFetch]);

  const invoiceLedgerBreakdown = useMemo(() => {
    const sortedAsc = [...ledgerRawRows].sort(compareHistoryLedgerRowsChrono);
    const fullYmd = ymdKeyFromString(pickInvoiceOgnoo(selectedInvoice));
    const invoiceYm = fullYmd
      ? invoiceBillingYmFromYmdKey(fullYmd, nekhemjlekhiinCycleStartDay)
      : null;

    const invDayMatch = fullYmd?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const invDay = invDayMatch ? Number(invDayMatch[3]) : NaN;
    const mergeNextBillingCycle =
      nekhemjlekhiinCycleStartDay > 1 &&
      invoiceYm != null &&
      Number.isFinite(invDay) &&
      invDay < nekhemjlekhiinCycleStartDay;
    const bridgeNextYm =
      mergeNextBillingCycle && invoiceYm
        ? nextBillingCycleYm(invoiceYm)
        : null;
    const bridgeEndYmdKey =
      bridgeNextYm != null
        ? billingPeriodEndYmd(bridgeNextYm, nekhemjlekhiinCycleStartDay)
        : null;

    const monthRows = invoiceYm
      ? sortedAsc.filter((r) => {
          const rowYm = ledgerRowBillingYmFromRow(
            r,
            nekhemjlekhiinCycleStartDay,
          );
          if (rowYm === invoiceYm) return true;
          if (
            mergeNextBillingCycle &&
            bridgeNextYm &&
            bridgeEndYmdKey &&
            rowYm === bridgeNextYm
          ) {
            const rk = ledgerRowYmdKeyForMonth(r);
            return rk != null && rk <= bridgeEndYmdKey;
          }
          return false;
        })
      : [];

    const monthTulukh = roundInvoiceMoney(
      monthRows.reduce((s, r) => {
        const { tulukh } = pickInvoiceModalLedgerTulukhTulsun(r);
        return s + tulukh;
      }, 0),
    );
    const monthTulsun = roundInvoiceMoney(
      monthRows.reduce((s, r) => {
        const { tulsun } = pickInvoiceModalLedgerTulukhTulsun(r);
        return s + tulsun;
      }, 0),
    );

    let balEndMonth: number | null = null;
    if (invoiceYm && sortedAsc.length) {
      const endKey =
        mergeNextBillingCycle && bridgeEndYmdKey
          ? bridgeEndYmdKey
          : billingPeriodEndYmd(invoiceYm, nekhemjlekhiinCycleStartDay);
      for (const r of sortedAsc) {
        const rk = ledgerRowYmdKeyForMonth(r);
        if (rk && rk <= endKey) {
          const u = Number(r.uldegdel);
          if (Number.isFinite(u)) balEndMonth = roundInvoiceMoney(u);
        }
      }
    }

    const ledgerCycleHint =
      nekhemjlekhiinCycleStartDay > 1
        ? `${nekhemjlekhiinCycleStartDay}–${nekhemjlekhiinCycleStartDay - 1}`
        : null;

    const invoiceYmLabel =
      mergeNextBillingCycle && bridgeNextYm
        ? bridgeNextYm.replace("-", ".")
        : invoiceYm
          ? invoiceYm.replace("-", ".")
          : null;

    return {
      invoiceYm,
      invoiceYmLabel,
      ledgerCycleHint,
      monthRows,
      monthTulukh,
      monthTulsun,
      balEndMonth,
      sortedAsc,
    };
  }, [
    ledgerRawRows,
    selectedInvoice,
    nekhemjlekhiinCycleStartDay,
  ]);

  const showLedgerSummaryRows = Boolean(
    selectedInvoice &&
      (resolvedHistoryLedgerBalance != null || ledgerRawRows.length > 0),
  );

  /**
   * Баримтын Төлсөн/Үлдэгдэл: хуулгын «сарын эцсийн үлдэгдэл» (balEndMonth) байвал түүнийг
   * эх сурвалж болгоно — нэхэмжлэхийн мөр + буруу paymentHistory-ийн 181k нийлбэрээс сална.
   */
  const { paidDisplay, remainingDisplay } = useMemo(() => {
    const inv = selectedInvoice;
    const total = roundInvoiceMoney(Number(invoiceTotal) || 0);
    const balEnd = invoiceLedgerBreakdown.balEndMonth;

    if (
      balEnd != null &&
      Number.isFinite(balEnd) &&
      ledgerRawRows.length > 0
    ) {
      const rem = roundInvoiceMoney(balEnd);
      const paid = roundInvoiceMoney(total - rem);
      return {
        paidDisplay: paid,
        remainingDisplay: rem,
      };
    }

    let paid = paidTotalFromRows;
    const storedTulsun = pickInvoiceStoredTulsun(inv);
    const rowsEmpty = paidTotalFromRows < 0.005;
    if (
      storedTulsun != null &&
      paidTotalFromRows < storedTulsun - 0.005 &&
      (rowsEmpty || storedTulsun <= total + 0.02)
    ) {
      paid = storedTulsun;
    }
    return {
      paidDisplay: roundInvoiceMoney(paid),
      remainingDisplay: roundInvoiceMoney(total - paid),
    };
  }, [
    selectedInvoice,
    invoiceTotal,
    paidTotalFromRows,
    invoiceLedgerBreakdown.balEndMonth,
    ledgerRawRows.length,
  ]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <PrintStyles />
      <div
        className="fixed inset-0 bg-transparent z-[12000] no-print"
        onClick={onClose}
      />
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[12000] pointer-events-none"
      >
        <motion.div
          className="pointer-events-auto fixed left-1/2 top-1/2 z-[12001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1400px] h-[90vh] bg-[color:var(--surface-bg)] dark:border dark:border-[color:var(--surface-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          ref={containerRef}
          initial={false}
          drag
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragMomentum={false}
        >
          {/* Modal Title Bar */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="px-6 py-4 flex justify-between items-center bg-[color:var(--surface-bg)] border-b border-[color:var(--surface-border)] no-print cursor-move select-none"
          >
            <h2 className="text-xl font-bold text-theme dark:text-white">
              Нэхэмжлэлийн түүх
            </h2>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="p-2 hover:bg-[color:var(--surface-hover)] dark:hover:bg-emerald-900/30 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-[color:var(--panel-text)]" />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDEBAR - INVOICE LIST */}
            <div className="w-[400px] flex flex-col border-r border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/30 no-print">
              {/* Sidebar Filters */}
              <div className="p-4 space-y-3 bg-[color:var(--surface-bg)] border-b border-[color:var(--surface-border)]">
                <div className="flex gap-2">
                  <StandardDatePicker
                    isRange={true}
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Эхлэх огноо ... Дуусах огноо"
                    className="w-full text-xs"
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--panel-text)]" />
                  <input
                    type="text"
                    placeholder="Хайх /Ажилтан/"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-[color:var(--surface-hover)] dark:bg-gray-800 text-theme dark:text-white border-none rounded-lg focus:ring-2 focus:ring-[color:var(--theme)] transition-all"
                  />
                </div>
              </div>

              {/* Sidebar List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loadingInvoices ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs">Уншиж байна...</span>
                  </div>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <button
                      key={inv._id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`w-full p-4 rounded-xl text-left border transition-all ${
                        selectedInvoice?._id === inv._id
                          ? "neu-panel shadow-md border-[color:var(--theme)]/20"
                          : "bg-transparent border-transparent hover:bg-[color:var(--surface-hover)] hover:border-[color:var(--surface-border)] text-theme dark:text-white"
                      }`}
                    >
                      <div className="mb-1">
                        <span className="text-sm font-bold text-theme dark:text-white block">
                          {inv.zagvar ||
                            inv.nekhemjlekhiinTurul ||
                            "Үндсэн загвар"}
                        </span>
                        {inv.nekhemjlekhiinDugaar ? (
                          <span className="text-[11px] text-[color:var(--panel-text)] font-medium">
                            {inv.nekhemjlekhiinDugaar}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex justify-between items-end gap-2">
                        <div className="text-[11px] text-[color:var(--panel-text)] font-medium min-w-0">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {formatInvoiceOgnooMn(inv)}
                          </div>
                        </div>
                        <span className="text-[11px] text-[color:var(--theme)] font-semibold shrink-0 text-right max-w-[50%] truncate">
                          {nekhemjlekhiinTuukhSidebarAjiltanDisplay(
                            inv,
                            resident,
                          )}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Мэдээлэл олдсонгүй
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT CONTENT - INVOICE DETAILS */}
            <div className="flex-1 flex flex-col bg-[color:var(--surface-bg)] overflow-hidden relative">
              <PrintStyles />
              {selectedInvoice ? (
                <div className="invoice-modal flex-1 flex flex-col overflow-hidden">
                  {/* Invoice Header Details */}
                  <div className="p-6 bg-[color:var(--surface-hover)]/30 no-print border-b border-[color:var(--surface-border)]">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[color:var(--panel-text)] ">
                          Гэрээний дугаар:
                        </span>
                        <span className=" text-theme dark:text-white">
                          {selectedInvoice?.gereeniiDugaar ||
                            resident?.gereeniiId ||
                            "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[color:var(--panel-text)] ">
                          Нэр:
                        </span>
                        <span className=" text-theme dark:text-white">
                          {resident?.ovog} {resident?.ner}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[color:var(--panel-text)] ">
                          Тоот:
                        </span>
                        <span className=" text-theme dark:text-white">
                          {resident?.toot || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[color:var(--panel-text)] ">
                          Утас:
                        </span>
                        <span className=" text-theme dark:text-white">
                          {resident?.utas || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PDF/Printable Content Area */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-gray-900 font-noto">
                    <div className="max-w-[1000px] mx-auto text-[11px] text-theme dark:text-white leading-tight">
                      {/* Top Labels */}

                      {/* Invoice Title */}
                      <div className="text-center mb-6">
                        <h2 className="text-sm font-bold uppercase">
                          №{" "}
                          {selectedInvoice?.nekhemjlekhiinDugaar ||
                            invNumber(selectedInvoice)}
                        </h2>
                      </div>

                      {/* Sender & Payer Grid */}
                      <div className="grid grid-cols-2 gap-12 mb-8">
                        {/* Sender (Нэхэмжлэгч) */}
                        <div className="space-y-1">
                          <div className="font-bold text-[12px] mb-2 text-center  pb-1">
                            Нэхэмжлэгч:
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-x-2">
                            <span className="text-[color:var(--panel-text)]">
                              Байгууллагын нэр:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.ner}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Хаяг:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.khayag}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Утас, Факс:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.utas}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              И-мэйл:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.email}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Банкны нэр:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.bankNer}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Банкны дансны №:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.dans}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Данс эзэмшигч:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {nekhemjlekhiinSender.dotoodNer}
                            </span>
                          </div>
                        </div>

                        {/* Payer (Төлөгч) */}
                        <div className="space-y-1">
                          <div className="font-bold text-[12px] mb-2 text-center  pb-1">
                            Төлөгч:
                          </div>
                          <div className="grid grid-cols-[120px_1fr] gap-x-2">
                            <span className="text-[color:var(--panel-text)]">
                              Оршин суугч:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {resident?.ovog} {resident?.ner}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Тоот:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {resident?.toot ? `${resident.toot} тоот` : "-"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Гэрээний №:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {selectedInvoice?.gereeniiDugaar ||
                                resident?.gereeniiId ||
                                "-"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Нэхэмжилсэн огноо:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {formatInvoiceOgnooMn(selectedInvoice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Formal Document Table */}
                      <div className="border border-[color:var(--surface-border)] overflow-hidden mb-4">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-[color:var(--surface-hover)]/50 border-b border-[color:var(--surface-border)] font-bold text-center">
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-1 w-8">
                                №
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center w-48">
                                Материал
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-1 w-16">
                                Өмнөх заалт
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-1 w-16">
                                Сүүлийн заалт
                              </td>
                              {/* <td className="border-r border-slate-200 py-2 px-2 text-right w-24">Хөнгөлөлт</td> */}
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center w-24">
                                Дүн
                              </td>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[color:var(--surface-border)]">
                            {expenseRows.map((row, idx) => {
                              const total = Number(row.dun || 0);
                              const discount = Number(row.khungulult || 0);

                              return (
                                <tr
                                  key={row._id}
                                  className="text-center border-b border-[color:var(--surface-border)] last:border-0"
                                >
                                  <td className="border-r border-[color:var(--surface-border)] py-1.5 px-1">
                                    {idx + 1}
                                  </td>
                                  <td className="border-r border-[color:var(--surface-border)] py-1.5 px-2 text-left">
                                    {row.ner}
                                  </td>
                                  <td className="border-r border-[color:var(--surface-border)] py-1.5 px-1">
                                    {(() => {
                                      const val = row.umnukh || row.umnukhZaalt;
                                      return val != null && val !== ""
                                        ? formatNumber(val, 2)
                                        : "";
                                    })()}
                                  </td>
                                  <td className="border-r border-[color:var(--surface-border)] py-1.5 px-1">
                                    {(() => {
                                      const val =
                                        row.suuliin || row.suuliinZaalt;
                                      return val != null && val !== ""
                                        ? formatNumber(val, 2)
                                        : "";
                                    })()}
                                  </td>
                                  {/* <td className="border-r border-slate-200 py-1.5 px-2 text-right">{discount > 0 ? formatNumber(discount, 2) : "0.00"}</td> */}
                                  <td className="border-r border-[color:var(--surface-border)] py-1.5 px-2 text-right font-medium">
                                    {formatNumber(total, 2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/30 force-bold">
                              <td
                                colSpan={2}
                                className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center font-normal"
                              >
                                {numberToMongolianWords(Number(invoiceTotal))}
                              </td>
                              <td
                                colSpan={2}
                                className="border-r font-bold-f border-[color:var(--surface-border)] py-2 px-2 text-center "
                              >
                                Нийт дүн
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right ">
                                {formatNumber(Number(invoiceTotal), 2)}
                              </td>
                            </tr>
                            <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/10">
                              <td
                                colSpan={4}
                                className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center font-bold-f"
                              >
                                {showLedgerSummaryRows
                                  ? "Төлсөн дүн (баримт)"
                                  : "Төлсөн дүн"}
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right">
                                {formatNumber(Number(paidDisplay), 2)}
                              </td>
                            </tr>
                            <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/10">
                              <td
                                colSpan={4}
                                className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center font-bold-f"
                              >
                                {showLedgerSummaryRows
                                  ? "Үлдэгдэл (баримт)"
                                  : "Үлдэгдэл"}
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right">
                                {formatNumber(Number(remainingDisplay), 2)}
                              </td>
                            </tr>
                            {showLedgerSummaryRows ? (
                              <>
                                {invoiceLedgerBreakdown.invoiceYm &&
                                invoiceLedgerBreakdown.invoiceYmLabel ? (
                                  <>
                                    <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/5">
                                      <td
                                        colSpan={4}
                                        className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center text-[12px] text-[color:var(--panel-text)]"
                                      >
                                        Хуулга (
                                        {invoiceLedgerBreakdown.invoiceYmLabel}
                                        ) — төлөх нийт
                                      </td>
                                      <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right font-semibold text-theme dark:text-white">
                                        {formatNumber(
                                          invoiceLedgerBreakdown.monthTulukh,
                                          2,
                                        )}
                                      </td>
                                    </tr>
                                    <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/5">
                                      <td
                                        colSpan={4}
                                        className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center text-[12px] text-[color:var(--panel-text)]"
                                      >
                                        Хуулга (
                                        {invoiceLedgerBreakdown.invoiceYmLabel}
                                        ) — төлсөн нийт
                                      </td>
                                      <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right font-semibold text-theme dark:text-white">
                                        {formatNumber(
                                          invoiceLedgerBreakdown.monthTulsun,
                                          2,
                                        )}
                                      </td>
                                    </tr>
                                    {invoiceLedgerBreakdown.balEndMonth !=
                                    null ? (
                                      <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/5">
                                        <td
                                          colSpan={4}
                                          className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center text-[12px] text-[color:var(--panel-text)]"
                                        >
                                          Хуулга (
                                          {
                                            invoiceLedgerBreakdown.invoiceYmLabel
                                          }
                                          ) — сарын эцсийн үлдэгдэл
                                        </td>
                                        <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right font-semibold text-theme dark:text-white">
                                          {formatNumber(
                                            invoiceLedgerBreakdown.balEndMonth,
                                            2,
                                          )}
                                        </td>
                                      </tr>
                                    ) : null}
                                  </>
                                ) : null}
                                {resolvedHistoryLedgerBalance != null ? (
                                  <tr className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/5">
                                    <td
                                      colSpan={4}
                                      className="border-r border-[color:var(--surface-border)] py-2 px-2 text-center text-[12px] text-[color:var(--panel-text)]"
                                    >
                                      {resolvedHistoryLedgerBalance < -0.005
                                        ? "Одоогийн үлдэгдөл (хуулга, илүү төлөлт)"
                                        : "Одоогийн үлдэгдөл (хуулга)"}
                                    </td>
                                    <td
                                      className={`border-r border-[color:var(--surface-border)] py-2 px-2 text-right font-semibold ${
                                        resolvedHistoryLedgerBalance < -0.005
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-theme dark:text-white"
                                      }`}
                                    >
                                      {formatNumber(
                                        resolvedHistoryLedgerBalance,
                                        2,
                                      )}
                                    </td>
                                  </tr>
                                ) : null}
                              </>
                            ) : null}
                          </tfoot>
                        </table>
                      </div>

                      {invoiceLedgerBreakdown.invoiceYm &&
                      ledgerRawRows.length > 0 ? (
                        <div className="mb-4 border border-[color:var(--surface-border)] overflow-hidden">
                          <div className="bg-[color:var(--surface-hover)]/50 px-2 py-1.5 font-bold text-center text-[11px] border-b border-[color:var(--surface-border)]">
                            Хуулга — {invoiceLedgerBreakdown.invoiceYmLabel}{" "}
                            сарын гүйлгээ
                            {invoiceLedgerBreakdown.ledgerCycleHint
                              ? ` (${invoiceLedgerBreakdown.ledgerCycleHint})`
                              : ""}
                          </div>
                          <table className="w-full border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-[color:var(--surface-hover)]/30 border-b border-[color:var(--surface-border)] font-bold text-center">
                                <td className="border-r border-[color:var(--surface-border)] py-1 px-1 w-20">
                                  Огноо
                                </td>
                                <td className="border-r border-[color:var(--surface-border)] py-1 px-1 text-left">
                                  Тайлбар
                                </td>
                                <td className="border-r border-[color:var(--surface-border)] py-1 px-1 w-20 text-right">
                                  Төлөх
                                </td>
                                <td className="border-r border-[color:var(--surface-border)] py-1 px-1 w-20 text-right">
                                  Төлсөн
                                </td>
                                <td className="py-1 px-1 w-24 text-right">
                                  Үлдэгдэл
                                </td>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceLedgerBreakdown.monthRows.length ===
                              0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-2 px-2 text-center text-[color:var(--panel-text)]"
                                  >
                                    Энэ сард хуулгын мөр бүртгэгдээгүй
                                  </td>
                                </tr>
                              ) : (
                                invoiceLedgerBreakdown.monthRows.map(
                                  (r: any, idx: number) => {
                                    const { tulukh, tulsun } =
                                      pickInvoiceModalLedgerTulukhTulsun(r);
                                    const ymd = ledgerRowYmdKeyForMonth(r);
                                    const ognooCell = ymd
                                      ? ymd.replace(/-/g, ".")
                                      : "-";
                                    const aj = String(r.ajiltan ?? "").trim();
                                    const tailRest = String(
                                      r.tailbar ?? r.ner ?? r.khelber ?? "",
                                    ).trim();
                                    const tail =
                                      aj && tailRest
                                        ? `${aj} · ${tailRest}`
                                        : aj || tailRest || "—";
                                    const u = Number(r.uldegdel);
                                    return (
                                      <tr
                                        key={`lm-${idx}-${String(r._id ?? "")}`}
                                        className="border-b border-[color:var(--surface-border)] last:border-0"
                                      >
                                        <td className="border-r border-[color:var(--surface-border)] py-1 px-1 text-center">
                                          {ognooCell}
                                        </td>
                                        <td className="border-r border-[color:var(--surface-border)] py-1 px-1 text-left">
                                          {tail}
                                        </td>
                                        <td className="border-r border-[color:var(--surface-border)] py-1 px-1 text-right">
                                          {tulukh > 0.005
                                            ? formatNumber(tulukh, 2)
                                            : ""}
                                        </td>
                                        <td className="border-r border-[color:var(--surface-border)] py-1 px-1 text-right">
                                          {tulsun > 0.005
                                            ? formatNumber(tulsun, 2)
                                            : ""}
                                        </td>
                                        <td className="py-1 px-1 text-right font-medium">
                                          {Number.isFinite(u)
                                            ? formatNumber(u, 2)
                                            : ""}
                                        </td>
                                      </tr>
                                    );
                                  },
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : null}

                      {/* Signatures & Stamp Area */}
                      <div className="flex justify-between items-start mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="w-24 text-[color:var(--panel-text)] ">
                              Хүлээн авсан:
                            </span>
                            <span className="font-bold text-theme dark:text-white border-b border-[color:var(--surface-border)] min-w-[150px] inline-block text-center">
                              /{resident?.ovog?.charAt(0)}. {resident?.ner}/
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-24 text-[color:var(--panel-text)] ">
                              Нэхэмжлэл бичсэн:
                            </span>
                            <span className="font-bold text-theme dark:text-white border-b border-[color:var(--surface-border)] min-w-[150px] inline-block text-center">
                              {nekhemjlekhiinBichsenDisplay(
                                selectedInvoice as Record<string, unknown>,
                                resident,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Footer / Actions */}
                  <div className="p-6 border-t border-[color:var(--surface-border)] flex justify-end gap-3 bg-[color:var(--surface-bg)] no-print">
                    <Button
                      onClick={onClose}
                      variant="secondary"
                      className="px-6"
                    >
                      Хаах
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="primary"
                      className="px-8 no-print shadow-[color:var(--theme)]/20"
                    >
                      Хэвлэх
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[color:var(--panel-text)] ">
                  <Eye className="w-16 h-16 mb-4 " />
                  <p className="text-lg font-medium">Нэхэмжлэх сонгоно уу</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
}

function invNumber(inv: any) {
  if (!inv?._id) return "INV-000000";
  return `INV-${inv._id.slice(-6).toUpperCase()}`;
}
