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
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { Search, Calendar, Printer, X, Eye } from "lucide-react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import Button from "@/components/ui/Button";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
  baiguullagiinId: string;
  token: string;
  liftFloors?: string[];
  barilgiinId?: string | null;
  refreshTrigger?: number;
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

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

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

export default function InvoiceModal({
  isOpen,
  onClose,
  resident,
  baiguullagiinId,
  token,
  liftFloors = [],
  barilgiinId,
  refreshTrigger = 0,
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

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

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
        const aOgnoo = a?.ognoo ? new Date(a.ognoo).getTime() : 0;
        const bOgnoo = b?.ognoo ? new Date(b.ognoo).getTime() : 0;
        return bOgnoo !== aOgnoo
          ? bOgnoo - aOgnoo
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
  const [totalPaidFromApi, setTotalPaidFromApi] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedInvoice) {
      setExpenseRows([]);
      setPaymentRows([]);
      return;
    }

    const run = async () => {
      setTotalPaidFromApi(null);

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
        if (t.includes("төлөлт") || t.includes("төлбөр")) return;
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
      const phRows = Array.isArray(selectedInvoice?.paymentHistory)
        ? selectedInvoice.paymentHistory
        : [];
      const paymentMap = new Map<string, any>();
      const addPaymentRow = (
        ognoo: any,
        tailbar: any,
        amount: any,
        id: any,
      ) => {
        const amt = Math.abs(Number(amount ?? 0));
        if (!Number.isFinite(amt) || amt === 0) return;
        const key = String(
          id || `${String(tailbar || "Төлөлт")}::${String(ognoo || "")}`,
        );
        paymentMap.set(key, {
          _id: id || key,
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

      if (officialNiitTulbur !== 0 && Math.abs(diff) > 0) {
        expenseMap.set("Бусад төлбөр (Авлага)", {
          ner: "Авлага",
          dun: diff,
          _id: "discrepancy-fill",
        });
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
        const invDate = selectedInvoice?.ognoo
          ? new Date(selectedInvoice.ognoo)
          : new Date();
        const startOfMonth = new Date(
          invDate.getFullYear(),
          invDate.getMonth(),
          1,
        ).toISOString();
        const endOfMonth = new Date(
          invDate.getFullYear(),
          invDate.getMonth() + 1,
          0,
          23,
          59,
          59,
        ).toISOString();

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

      setExpenseRows(Array.from(expenseMap.values()));

      const pRowsFromGuilgee = gRows
        .filter((g: any) => {
          const t = String(g.turul || "").toLowerCase();
          return (
            t !== "avlaga" &&
            t !== "авлага" &&
            (Number(g.tulsunDun || 0) > 0 || Number(g.dun || 0) > 0)
          );
        })
        .map((g: any, idx: number) => ({
          _id: g._id || `pay-${idx}`,
          ognoo: g.ognoo || g.tulsunOgnoo || g.createdAt,
          tailbar: g.tailbar || g.medeelel?.tailbar || "Төлөлт",
          dun: Math.abs(Number(g.tulsunDun || g.dun || 0)),
        }));

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
          p.dun || p.tulsunDun || 0,
          p._id,
        );
      });
      pRowsFromGuilgee.forEach((r: any) =>
        addPaymentRow(r.ognoo, r.tailbar, r.dun, r._id),
      );
      setPaymentRows(Array.from(paymentMap.values()));

      // We can still fetch the total paid summary if needed, but the row data MUST come from the invoice
      const gereeId =
        selectedInvoice?.gereeniiId ||
        selectedInvoice?.gereeId ||
        resident?.gereeniiId;
      if (token && baiguullagiinId && gereeId) {
        uilchilgee(token)
          .post("/tulsunSummary", { baiguullagiinId, gereeniiId: gereeId })
          .then((r) =>
            setTotalPaidFromApi(
              Number(
                r.data?.totalTulsunDun ?? r.data?.totalInvoicePayment ?? 0,
              ),
            ),
          )
          .catch(() => setTotalPaidFromApi(null));
      }
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
    return invoices.filter((inv) => {
      const matchSearch = String(
        inv.ajiltanNer || inv.nekhemjlekhiinDugaar || inv.zagvar || "",
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const date = inv.ognoo ? new Date(inv.ognoo) : null;
      let matchDate = true;
      if (dateRange[0]) {
        matchDate =
          matchDate && date !== null && date >= new Date(dateRange[0]);
      }
      if (dateRange[1]) {
        const end = new Date(dateRange[1]);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && date !== null && date <= end;
      }
      return matchSearch && matchDate;
    });
  }, [invoices, searchTerm, dateRange]);

  // Contract-wide remaining across ALL invoices shown in the list (invoice-scoped uldegdel summed).
  // This makes the "Үлдэгдэл" in invoice screen reflect all months, not only the latest invoice.
  const totalInvoiceUldegdel = useMemo(() => {
    return (filteredInvoices || []).reduce((sum: number, inv: any) => {
      const v = Number(inv?.uldegdel ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [filteredInvoices]);

  const invoiceTotal = useMemo(() => {
    const official = Number(
      selectedInvoice?.niitTulbur ?? selectedInvoice?.niitDun ?? 0,
    );
    if (Number.isFinite(official) && official !== 0) return official;
    return expenseRows.reduce((s, r) => s + (Number(r?.dun) || 0), 0);
  }, [selectedInvoice, expenseRows]);

  const paidTotal = useMemo(() => {
    return (paymentRows || []).reduce((s: number, r: any) => {
      const v = Number(r?.dun ?? 0);
      return s + (Number.isFinite(v) ? Math.abs(v) : 0);
    }, 0);
  }, [paymentRows]);

  // For display: don't show "paid > total" on the invoice itself
  const paidDisplay = useMemo(
    () => Math.min(invoiceTotal, paidTotal),
    [invoiceTotal, paidTotal],
  );

  const remainingDisplay = useMemo(
    () => Math.max(0, invoiceTotal - paidTotal),
    [invoiceTotal, paidTotal],
  );
  const currentUldegdel = useMemo(
    () => Number(resident?.uldegdel ?? 0),
    [resident?.uldegdel],
  );

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <PrintStyles />
      <div
        className="fixed inset-0 bg-transparent z-[9999] no-print"
        onClick={onClose}
      />
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        <motion.div
          className="pointer-events-auto w-[95vw] max-w-[1400px] h-[90vh] bg-[color:var(--surface-bg)] dark:border dark:border-[color:var(--surface-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          ref={containerRef}
          initial={false}
          drag
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragMomentum={false}
          style={{ margin: "auto" }}
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
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold text-theme dark:text-white">
                          {inv.zagvar ||
                            inv.nekhemjlekhiinTurul ||
                            "Үндсэн загвар"}
                        </span>
                        <span className="text-sm font-bold text-theme dark:text-white">
                          {formatNumber(inv.niitTulbur || inv.niitDun || 0, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[11px] text-[color:var(--panel-text)]  font-medium">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Calendar className="w-3 h-3" />
                            {inv.ognoo
                              ? new Date(inv.ognoo).toLocaleString("mn-MN")
                              : "-"}
                          </div>
                        </div>
                        <span className="text-[11px] text-[color:var(--theme)] font-semibold">
                          {inv.ajiltanNer || "CAdmin"}
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
                              {baiguullaga?.ner || "Computer Mall"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Хаяг:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {baiguullaga?.khayag || "sukhbaatar 9th district"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Утас, Факс:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {Array.isArray(baiguullaga?.utas)
                                ? baiguullaga.utas[0]
                                : baiguullaga?.utas || "70107010"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              И-мэйл:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {baiguullaga?.email || "-"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Банкны нэр:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {String(baiguullaga?.bankNer || "").trim() || "-"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Банкны дансны №:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {String(baiguullaga?.dans || "").trim() || "-"}
                            </span>

                            <span className="text-[color:var(--panel-text)]">
                              Данс эзэмшигч:
                            </span>
                            <span className=" text-right text-theme dark:text-white">
                              {String(
                                baiguullaga?.dotoodNer ||
                                  baiguullaga?.ner ||
                                  "",
                              ).trim() || "-"}
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
                              {formatDate(selectedInvoice?.ognoo)}
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
                                Төлсөн дүн
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
                                Үлдэгдэл
                              </td>
                              <td className="border-r border-[color:var(--surface-border)] py-2 px-2 text-right">
                                {formatNumber(Number(remainingDisplay), 2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

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
                              {selectedInvoice?.baiguullagiinNer + " " + "СӨХ"}
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
