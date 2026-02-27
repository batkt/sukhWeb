"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@/context/SearchContext";
import useSWR, { useSWRConfig } from "swr";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
// import KhungulultPage from "../khungulult/page";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useGereeJagsaalt } from "@/lib/useGeree";
import uilchilgee from "@/lib/uilchilgee";
import toast from "react-hot-toast";
import { Tooltip } from "antd";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { set } from "lodash";
import IconTextButton from "@/components/ui/IconTextButton";
import {
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Eye,
  History,
  Columns,
  Banknote,
  Send,
} from "lucide-react";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import matchesSearch from "@/tools/function/matchesSearch";
import DatePickerInput from "@/components/ui/DatePickerInput";
import {
  getPaymentStatusLabel,
  isPaidLike,
  isUnpaidLike,
  isOverdueLike,
} from "@/lib/utils";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import { useBuilding } from "@/context/BuildingContext";
import { useSocket } from "@/context/SocketContext";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TransactionModal, {
  type TransactionData,
} from "../modals/TransactionModal";
import HistoryModal from "../../geree/modals/HistoryModal";
import InitialBalanceExcelModal from "../modals/InitialBalanceExcelModal";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

const formatCurrency = (amount: number) => {
  return `${formatNumber(amount)} ₮`;
};



interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
  baiguullagiinId: string;
  token: string;
  liftFloors: string[];
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

type DateRangeValue = [string | null, string | null] | undefined;

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

      /* Compact layouts */
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

      .rounded-2xl, .rounded-3xl {
        border-radius: 4pt !important;
      }

      /* Force single page if possible */
      html, body {
        height: 100%;
        overflow: hidden !important;
      }
    }
  `}</style>
);


const InvoiceModal = ({
  isOpen,
  onClose,
  resident,
  baiguullagiinId,
  token,
  liftFloors,
  barilgiinId,
  refreshTrigger = 0,
}: InvoiceModalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useModalHotkeys({
    isOpen,
    onClose,
    container: containerRef.current,
  });
  const { selectedBuildingId } = useBuilding();
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);
  const ashiglaltParams = useMemo(
    () => ({
      token,
      baiguullagiinId,
      barilgiinId: selectedBuildingId || barilgiinId || null,
    }),
    [token, baiguullagiinId, selectedBuildingId, barilgiinId],
  );

  const { zardluud: ashiglaltiinZardluud } =
    useAshiglaltiinZardluud(ashiglaltParams);

  const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9)}`;
  const currentDate = new Date().toLocaleDateString("mn-MN");
  // Get davkhar from toots array first, then fallback to top-level
  const residentDavkhar =
    Array.isArray(resident?.toots) && resident.toots.length > 0
      ? resident.toots[0]?.davkhar
      : resident?.davkhar;
  const isLiftExempt = liftFloors?.includes(String(residentDavkhar));

  const isLiftItem = (z: Zardal) =>
    z.zardliinTurul === "Лифт" ||
    z.ner?.trim().toLowerCase() === "лифт" ||
    z.turul?.trim().toLowerCase() === "лифт";

  const baseZardluud = (ashiglaltiinZardluud as Zardal[]) || [];

  const [expenseRows, setExpenseRows] = React.useState<any[]>([]);
  const [paymentRows, setPaymentRows] = React.useState<any[]>([]);
  const [latestInvoice, setLatestInvoice] = React.useState<any>(null);
  const [nekhemjlekhData, setNekhemjlekhData] = React.useState<any>(null);
  const [paymentStatusLabel, setPaymentStatusLabel] = React.useState<
    "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй"
  >("Тодорхойгүй");
  const [cronData, setCronData] = React.useState<any>(null);
  const [totalPaidFromApi, setTotalPaidFromApi] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    const run = async () => {
      setTotalPaidFromApi(null);
      try {
        if (!isOpen || !token || !baiguullagiinId || !resident?._id) return;

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

        const list = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt : (Array.isArray(resp.data) ? resp.data : []);
        const residentInvoices = list.filter((item: any) => {
          const itemGid = String(item?.gereeniiId || item?.gereeId || "").trim();
          const itemRid = String(item?.orshinSuugchId || "").trim();
          return (residentGereeId && itemGid === residentGereeId) || (residentId && itemRid === residentId);
        });

        const latest = [...residentInvoices].sort((a: any, b: any) => {
          const aOgnoo = a?.ognoo ? new Date(a.ognoo).getTime() : 0;
          const bOgnoo = b?.ognoo ? new Date(b.ognoo).getTime() : 0;
          return bOgnoo !== aOgnoo ? bOgnoo - aOgnoo : (new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
        })[0];

        setLatestInvoice(latest || null);
        setNekhemjlekhData(latest || null);

        const zRows = Array.isArray(latest?.medeelel?.zardluud) ? latest.medeelel.zardluud : (Array.isArray(latest?.zardluud) ? latest.zardluud : []);
        const gRows = Array.isArray(latest?.medeelel?.guilgeenuud) ? latest.medeelel.guilgeenuud : (Array.isArray(latest?.guilgeenuud) ? latest.guilgeenuud : []);

        const pickAmount = (obj: any) => {
          const n = (v: any) => { const num = Number(v); return Number.isFinite(num) ? num : null; };
          const dun = n(obj?.dun);
          if (dun !== null && dun > 0) return dun;
          const td = n(obj?.tulukhDun);
          if (td !== null && td > 0) return td;
          const tar = n(obj?.tariff);
          return tar ?? 0;
        };

        // Aggregrate Expenses with deduplication
        const expenseMap = new Map<string, any>();
        const addToExpenseMap = (list: any[]) => {
          list.forEach((z: any) => {
            const isEkhnii = z.isEkhniiUldegdel === true || 
                            String(z.ner || "").startsWith("Эхний үлдэгдэл") || 
                            String(z.zardliinNer || "").startsWith("Эхний үлдэгдэл");
            const amt = pickAmount(z);
            if (isEkhnii && amt <= 0) return;
            
            const ner = isEkhnii ? "Эхний үлдэгдэл" : String(z.ner || z.name || "").trim();
            const key = ner || z._id || `z-${Math.random()}`;
            const existing = expenseMap.get(key);
            if (!existing || amt > pickAmount(existing)) {
              expenseMap.set(key, { ...z, ner, dun: amt });
            }
          });
        };

        addToExpenseMap(zRows);
        addToExpenseMap(gRows.filter((g: any) => String(g.turul || "").toLowerCase() === "avlaga" || String(g.turul || "").toLowerCase() === "авлага"));

        if (!Array.from(expenseMap.values()).some(z => String(z.ner).trim() === "Цахилгаан")) {
          const tsahAmt = Number(latest?.tsahilgaanNekhemjlekh ?? 0);
          if (tsahAmt > 0) expenseMap.set("Цахилгаан", { ner: "Цахилгаан", tariff: tsahAmt, dun: tsahAmt });
        }

        setExpenseRows(Array.from(expenseMap.values()).map((z, idx) => ({
          _id: z._id || `exp-${idx}`,
          ner: z.ner,
          tariff: Number(z.tariff) || 0,
          dun: z.dun,
          tailbar: z.tailbar || latest?.medeelel?.tailbar || latest?.tailbar || ""
        })));

        // Process Payments
        const pRows = gRows.filter((g: any) => {
          const t = String(g.turul || "").toLowerCase();
          const isTulsun = Number(g.tulsunDun) > 0 || (t !== "avlaga" && t !== "авлага" && Number(g.dun) > 0);
          return t !== "avlaga" && t !== "авлага" && isTulsun;
        }).map((g: any, idx: number) => ({
          _id: g._id || `pay-${idx}`,
          ognoo: g.ognoo || g.tulsunOgnoo,
          tailbar: g.tailbar || g.medeelel?.tailbar || "Төлөлт",
          dun: Number(g.tulsunDun || g.dun || 0),
          turul: g.turul || "Төлбөр",
          ajiltan: g.ajiltanNer || "Систем",
        }));
        setPaymentRows(pRows);

        setPaymentStatusLabel(getPaymentStatusLabel(latest));

        const gereeId = latest?.gereeniiId || latest?.gereeId;
        if (gereeId) {
          // 1. Get Summary
          uilchilgee(token).post("/tulsunSummary", { baiguullagiinId, gereeniiId: gereeId })
            .then(r => setTotalPaidFromApi(Number(r.data?.totalTulsunDun ?? r.data?.totalInvoicePayment ?? 0)))
            .catch(() => setTotalPaidFromApi(null));

          // 2. Fetch actual payment records to show "details like how its displaying on historyModal"
          uilchilgee(token).get("/gereeniiTulsunAvlaga", {
            params: {
              baiguullagiinId,
              khuudasniiDugaar: 1,
              khuudasniiKhemjee: 500,
            }
          }).then(resp => {
            const allPayments = Array.isArray(resp.data?.jagsaalt) ? resp.data.jagsaalt : [];
            const matched = allPayments.filter((p: any) => String(p.gereeniiId) === String(gereeId));
            
            if (matched.length > 0) {
              const enriched = matched.map((p: any, idx: number) => ({
                _id: p._id || `api-pay-${idx}`,
                ognoo: p.ognoo || p.createdAt,
                tailbar: p.tailbar || p.zardliinNer || "Төлөлт",
                dun: Number(p.tulsunDun || p.dun || 0),
                turul: p.turul || "Төлбөр",
                ajiltan: p.guilgeeKhiisenAjiltniiNer || "Систем",
              }));
              
              setPaymentRows(prev => {
                const combined = [...prev, ...enriched];
                const seen = new Set();
                return combined.filter(c => {
                  if (seen.has(c._id)) return false;
                  seen.add(c._id);
                  return true;
                }).sort((a, b) => new Date(b.ognoo).getTime() - new Date(a.ognoo).getTime());
              });
            }
          }).catch(err => console.error("Details fetch failed", err));
        }
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [isOpen, token, baiguullagiinId, resident?._id, selectedBuildingId, barilgiinId, refreshTrigger]);

  const contractData = latestInvoice || nekhemjlekhData;
  // Cleaned up redundant memos - logic is now handled in the useEffect run()
  // Use backend-calculated totals when available to avoid mismatch with shown rows
  const totalSum = React.useMemo(() => {
    // 1) Prefer niitTulburOriginal from invoice data (exact backend total)
    if (contractData?.niitTulburOriginal != null) {
      return Number(contractData.niitTulburOriginal);
    }
    // 2) Fallback to niitTulbur/niitDun/total from invoice if present
    if (contractData?.niitTulbur != null) {
      return Number(contractData.niitTulbur);
    }
    if (contractData?.niitDun != null) {
      return Number(contractData.niitDun);
    }
    if (contractData?.total != null) {
      return Number(contractData.total);
    }
    // 3) Last resort: calculate from visible expense rows
    return expenseRows.reduce((s, r) => s + (Number(r?.dun) || 0), 0);
  }, [expenseRows, contractData]);

  const uldegdelDun = useMemo(() => {
    const total = totalSum;
    // Use API-paid amount for correct balance (consistent with summary display)
    if (totalPaidFromApi !== null) {
      return total - totalPaidFromApi;
    }
    // Fallback to table balance if API summary is unavailable
    if (resident?._contractBalance != null) {
      return Number(resident._contractBalance);
    }
    const inv = latestInvoice || nekhemjlekhData;
    if (inv?.uldegdel != null) return Number(inv.uldegdel);
    const paid = Number(inv?.tulsunDun ?? 0) || 0;
    return total - paid;
  }, [
    totalSum,
    totalPaidFromApi,
    latestInvoice,
    nekhemjlekhData,
    resident?._contractBalance,
  ]);

  const effectivePaymentStatus =
    uldegdelDun <= 0 ? "Төлсөн" : paymentStatusLabel;

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <PrintStyles />
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] no-print"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] modal-surface modal-responsive rounded-3xl shadow-2xl overflow-hidden z-[9999] pointer-events-auto print-modal-container"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
      >
        <div className="invoice-modal h-full flex flex-col bg-white">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl">
            <div>
              <h2 className="text-xl text-slate-800 font-bold">Үйлчилгээний нэхэмжлэх</h2>
              <p className="text-sm text-slate-500">
                № {latestInvoice?.nekhemjlekhiinDugaar || "-"} | {formatDate(latestInvoice?.ognoo)}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors no-print">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-8">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                <h3 className="text-sm font-bold text-emerald-600 mb-2 border-b border-emerald-100 pb-1">Нэхэмжлэгч</h3>
                <div className="text-sm text-slate-700 space-y-1">
                  <p className="font-bold">{baiguullaga?.ner}</p>
                  <p>Утас: {Array.isArray(baiguullaga?.utas) ? baiguullaga.utas[0] : (baiguullaga?.utas || "-")}</p>
                  <p>Хаяг: {baiguullaga?.khayag || "-"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
                <h3 className="text-sm font-bold text-blue-600 mb-2 border-b border-blue-100 pb-1">Төлөгч</h3>
                <div className="text-sm text-slate-700 space-y-1">
                  <p className="font-bold">{resident?.ovog} {resident?.ner}</p>
                  <p>Тоот: {resident?.toot}</p>
                  <p>Утас: {resident?.utas}</p>
                  <p>Гэрээ: {latestInvoice?.gereeniiDugaar || "-"}</p>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div>
              <h4 className="font-bold mb-2 text-slate-700">Зардлын жагсаалт</h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm font-noto expense-table">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-gray-100">Зардал</th>
                      <th className="py-2.5 px-3 text-center font-bold text-slate-600 border-r border-gray-100">Дүн</th>
                      <th className="py-2.5 px-3 text-center font-bold text-slate-600 ">Тайлбар</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenseRows.map((row) => (
                      <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-left text-slate-800 border-r border-gray-100 border-b border-gray-100">{row.ner}</td>
                        <td className="py-2.5 px-3 text-right text-slate-900 font-bold border-r border-gray-100 border-b border-gray-100">
                          {formatNumber(row.dun)} ₮
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 italic border-b border-gray-100">{row.tailbar}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr className="font-bold">
                      <td className="py-3 px-3 text-slate-700">Нийт дүн:</td>
                      <td className="py-3 px-3 text-right text-slate-900 text-base">
                        {formatNumber(totalSum)} ₮
                      </td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payments Table */}
            {paymentRows.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h4 className="font-bold mb-2 text-slate-700">Төлөлтийн мэдээлэл</h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm payment-table">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center font-bold text-slate-600">Огноо</th>
                        <th className="py-2.5 px-4 text-center font-bold text-slate-600">Тайлбар</th>
                        <th className="py-2.5 px-3 text-center font-bold text-slate-600">Дүн</th>
                        
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentRows.map((row) => (
                        <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-2.5 px-3 border-r border-gray-100 border-b text-center text-slate-600 whitespace-nowrap">{formatDate(row.ognoo)}</td>
                          <td className="py-2.5 px-3 border-r border-gray-100 border-b text-center text-slate-800">{row.tailbar}</td>
                          <td className="py-2.5 px-3 border-b text-right text-green-700 font-bold border-gray-100">-{formatNumber(row.dun)} ₮</td>
                      
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr className="font-bold text-green-700">
                        <td colSpan={2} className="py-3 px-3">Нийт төлсөн дүн:</td>
                        <td className="py-3 px-3 text-right text-base">
                          {formatNumber(paymentRows.reduce((s, r) => s + (Number(r.dun) || 0), 0))} ₮
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Төлбөрийн төлөв:</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                  effectivePaymentStatus === "Төлсөн" 
                  ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-500" 
                  : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500"
                }`}>
                  {effectivePaymentStatus}
                </span>
              </div>
              
              {/* <div className="w-full max-w-[320px] space-y-2 text-right">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Нийт нэхэмжилсэн:</span>
                  <span className="text-slate-900 font-medium">{formatNumber(totalSum)} ₮</span>
                </div>
                {totalPaidFromApi !== null && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Нийт төлсөн:</span>
                    <span className="text-green-700 font-medium">-{formatNumber(totalPaidFromApi)} ₮</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-800">Үлдэгдэл дүн:</span>
                  <span className={`text-xl font-bold ${uldegdelDun > 0 ? "text-red-600" : "text-slate-900"}`}>
                    {formatNumber(uldegdelDun)} ₮
                  </span>
                </div>
              </div> */}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 no-print rounded-b-3xl">
            <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-2xl hover:bg-gray-100 transition-colors font-medium">Хаах</button>
            <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-md transition-all active:scale-95 font-medium">Хэвлэх</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};


import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";

export default function DansniiKhuulga() {
  const { mutate } = useSWRConfig();
  const socket = useSocket();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const { searchTerm } = useSearch();
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  // Memoize empty objects to prevent infinite SWR re-validation loops
  const emptyQuery = useMemo(() => ({}), []);

  const todayStr = new Date().toISOString().split("T")[0];
  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [tuluvFilter, setTuluvFilter] = useState<
    "all" | "paid" | "unpaid" | "overdue"
  >("all");
  const [selectedOrtsFilter, setSelectedOrtsFilter] = useState<string>("");
  const [selectedTootFilter, setSelectedTootFilter] = useState<string>("");
  const [selectedDavkharFilter, setSelectedDavkharFilter] =
    useState<string>("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isKhungulultOpen, setIsKhungulultOpen] = useState(false);
  const khungulultRef = useRef<HTMLDivElement | null>(null);
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionResident, setSelectedTransactionResident] =
    useState<any>(null);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [isInitialBalanceModalOpen, setIsInitialBalanceModalOpen] =
    useState(false);
  const [invoiceRefreshTrigger, setInvoiceRefreshTrigger] = useState(0);
  // Map gereeId -> total paid amount (Төлсөн дүн)
  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<
    Record<string, number>
  >({});
  const [paidSummaryRequested, setPaidSummaryRequested] = useState<
    Record<string, boolean>
  >({});
  // Use a ref to track what's currently being requested across renders without causing loops
  const requestedGereeIdsRef = useRef<Set<string>>(new Set());

  // Socket: revalidate data when payment, avlaga, or delete happens (from any tab/source)
  useEffect(() => {
    const baiguullagiinId = ajiltan?.baiguullagiinId;
    if (!socket || !baiguullagiinId) return;
    const event = `tulburUpdated:${baiguullagiinId}`;
    const handler = () => {
      mutate(
        (key: any) =>
          Array.isArray(key) &&
          (key[0] === "/nekhemjlekhiinTuukh" ||
            key[0] === "/gereeniiTulukhAvlaga" ||
            key[0] === "/gereeniiTulsunAvlaga" ||
            key[0] === "/geree" ||
            key[0] === "/orshinSuugch"),
        undefined,
        { revalidate: true },
      );
      setPaidSummaryByGereeId({});
      requestedGereeIdsRef.current.clear();
      setInvoiceRefreshTrigger((t) => t + 1);
    };
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, ajiltan?.baiguullagiinId, mutate]);

  // Selection state for "Send Invoice"
  const [selectedGereeIds, setSelectedGereeIds] = useState<string[]>([]);
  const [isSendingInvoices, setIsSendingInvoices] = useState(false);

  const columnDefs = useMemo(
    () => [
      {
        key: "checkbox",
        label: "",
        align: "center",
        sticky: true,
        width: 40,
        minWidth: 40,
      },
      {
        key: "index",
        label: "№",
        align: "center",
        sticky: true,
        width: 48,
        minWidth: 48,
      },
      {
        key: "ner",
        label: "Нэр",
        align: "center",
        sticky: true,
        width: 150,
        minWidth: 150,
      },
      {
        key: "toot",
        label: "Тоот",
        align: "center",
        sticky: true,
        width: 80,
        minWidth: 80,
      },
      {
        key: "utas",
        label: "Утас",
        align: "center",
        sticky: true,
        width: 100,
        minWidth: 100,
      },
      { key: "orts", label: "Орц", align: "center", minWidth: 80 },
      { key: "davkhar", label: "Давхар", align: "center", minWidth: 80 },
      {
        key: "gereeniiDugaar",
        label: "Гэрээний дугаар",
        align: "center",
        minWidth: 140,
      },
      { key: "tulbur", label: "Төлбөр", align: "center", minWidth: 110 },
      {
        key: "ekhniiUldegdel",
        label: "Эхний үлдэгдэл",
        align: "center",
        minWidth: 110,
      },
      { key: "uldegdel", label: "Үлдэгдэл", align: "center", minWidth: 110 },
      { key: "paid", label: "Гүйцэтгэл", align: "center", minWidth: 110 },
      { key: "tuluv", label: "Төлөв", align: "center", minWidth: 110 },
      {
        key: "lastLog",
        label: "Огноо",
        align: "center",
        minWidth: 140,
      },
      { key: "action", label: "Үйлдэл", align: "center", minWidth: 130 },
    ],
    [],
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const hiddenByDefault = [
      "orts",
      "davkhar",
      "tulbur",
      "ekhniiUldegdel",
      "tuluv",
      "lastLog",
    ];
    return columnDefs.reduce(
      (acc, col) => {
        acc[col.key] = !hiddenByDefault.includes(col.key);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });
  const visibleColumns = useMemo(
    () => columnDefs.filter((col) => columnVisibility[col.key] !== false),
    [columnDefs, columnVisibility],
  );

  // Columns that appear in "Багана сонгох" modal (exclude structural checkbox, index, action)
  const selectableColumnKeys = [
    "ner",
    "toot",
    "utas",
    "orts",
    "davkhar",
    "gereeniiDugaar",
    "tulbur",
    "ekhniiUldegdel",
    "uldegdel",
    "paid",
    "tuluv",
    "lastLog",
  ] as const;
  const selectableColumnDefs = useMemo(
    () =>
      columnDefs.filter((col) =>
        selectableColumnKeys.includes(
          col.key as (typeof selectableColumnKeys)[number],
        ),
      ),
    [columnDefs],
  );
  const stickyOffsets = useMemo(() => {
    let left = 0;
    const offsets: Record<string, number> = {};
    visibleColumns.forEach((col) => {
      if (!col.sticky) return;
      offsets[col.key] = left;
      left += col.width || 0;
    });
    return offsets;
  }, [visibleColumns]);
  const visibleColumnCount = visibleColumns.length;

  // Invoice and History modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [historyResident, setHistoryResident] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement | null>(null);

  // Paid history modal state
  // History modal removed; showing org-scoped list directly

  // Fetch org-scoped payment history
  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/nekhemjlekhiinTuukh",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
          ekhlekhOgnoo?.[0] || null,
          ekhlekhOgnoo?.[1] || null,
        ]
      : null,
    async ([url, tkn, orgId, branch, start, end]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          barilgiinId: branch || undefined,
          ekhlekhOgnoo: start || undefined,
          duusakhOgnoo: end || undefined,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const { data: receivableData } = useSWR(
    token && ajiltan?.baiguullagiinId
      ? [
          "/gereeniiTulukhAvlaga",
          token,
          ajiltan.baiguullagiinId,
          effectiveBarilgiinId || null,
          ekhlekhOgnoo?.[0] || null,
          ekhlekhOgnoo?.[1] || null,
        ]
      : null,
    async ([url, tkn, orgId, branch, start, end]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          barilgiinId: branch || undefined,
          ekhlekhOgnoo: start || undefined,
          duusakhOgnoo: end || undefined,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const allHistoryItems = useMemo(() => {
    const invoices = Array.isArray(historyData?.jagsaalt)
      ? historyData.jagsaalt
      : Array.isArray(historyData)
        ? historyData
        : [];

    const receivables = Array.isArray(receivableData?.jagsaalt)
      ? receivableData.jagsaalt
      : Array.isArray(receivableData)
        ? receivableData
        : [];

    // Combine and deduplicate by ID.
    // If an ID exists in both (meaning it was merged into an invoice), the invoice version wins.
    const combined = [...invoices];

    // Collect all IDs that should be considered "already tracked by an invoice"
    // This includes the invoice ID itself AND any merged transaction IDs inside the medeelel.guilgeenuud array
    const trackingIds = new Set(invoices.map((it: any) => String(it._id)));
    invoices.forEach((it: any) => {
      const gList = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];
      gList.forEach((g: any) => {
        if (g?._id) trackingIds.add(String(g._id));
      });
    });

    receivables.forEach((r: any) => {
      if (!trackingIds.has(String(r._id))) {
        combined.push(r);
      }
    });

    if (!ekhlekhOgnoo || (!ekhlekhOgnoo[0] && !ekhlekhOgnoo[1]))
      return combined;
    const [start, end] = ekhlekhOgnoo;
    const startObj = start ? new Date(start) : null;
    if (startObj) startObj.setHours(0, 0, 0, 0);
    const endObj = end ? new Date(end) : null;
    if (endObj) endObj.setHours(23, 59, 59, 999);

    const s = startObj ? startObj.getTime() : Number.NEGATIVE_INFINITY;
    const e = endObj ? endObj.getTime() : Number.POSITIVE_INFINITY;

    return combined.filter((it: any) => {
      const d = new Date(
        it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0,
      ).getTime();
      return d >= s && d <= e;
    });
  }, [historyData, receivableData, ekhlekhOgnoo]);

  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId,
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    emptyQuery,
    effectiveBarilgiinId,
  );

  const contractsById = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?._id) map[String(g._id)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const contractsByNumber = useMemo(() => {
    const list = (gereeGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((g) => {
      if (g?.gereeniiDugaar) map[String(g.gereeniiDugaar)] = g;
    });
    return map;
  }, [gereeGaralt?.jagsaalt]);

  const residentsById = useMemo(() => {
    const list = (orshinSuugchGaralt?.jagsaalt || []) as any[];
    const map: Record<string, any> = {};
    list.forEach((r) => {
      if (r?._id) map[String(r._id)] = r;
    });
    return map;
  }, [orshinSuugchGaralt?.jagsaalt]);

  // Ensure history is scoped to the selected building on the client too,
  // in case backend returns org-wide data.
  const buildingHistoryItems = useMemo(() => {
    const bid = String(effectiveBarilgiinId || "");
    if (!bid) return allHistoryItems;
    const toStr = (v: any) => (v == null ? "" : String(v));
    return allHistoryItems.filter((it: any) => {
      const itemBid = toStr(
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId,
      );
      if (itemBid) return itemBid === bid;
      // Derive from linked contract or resident if barilgiinId absent
      const cId = toStr(
        it?.gereeId ??
          it?.gereeniiId ??
          it?.contractId ??
          it?.kholbosonGereeniiId,
      );
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? (contractsById as any)[cId] : undefined;
      const r = rId ? (residentsById as any)[rId] : undefined;
      const cbid = toStr(
        c?.barilgiinId ?? c?.barilga ?? c?.barilgaId ?? c?.branchId,
      );
      const rbid = toStr(
        r?.barilgiinId ?? r?.barilga ?? r?.barilgaId ?? r?.branchId,
      );
      if (cbid) return cbid === bid;
      if (rbid) return rbid === bid;
      return false;
    });
  }, [allHistoryItems, effectiveBarilgiinId, contractsById, residentsById]);

  // Filter by paid/unpaid + Орц + Давхар
  const filteredItems = useMemo(() => {
    // Get cancelled geree IDs for filtering
    const cancelledGereeIds = new Set<string>();
    const cancelledGereeDugaars = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    cancelledGerees.forEach((g: any) => {
      if (g?._id) cancelledGereeIds.add(String(g._id));
      if (g?.gereeniiDugaar)
        cancelledGereeDugaars.add(String(g.gereeniiDugaar));
    });

    return buildingHistoryItems.filter((it: any) => {
      const paid = isPaidLike(it);
      if (tuluvFilter === "paid") {
        if (!paid) return false;
        // Also require resident has at least one payment record (excludes e.g. negative initial balance with no payments)
        const gid =
          String(it?.gereeniiId ?? it?.gereeId ?? "").trim() ||
          (it?.gereeniiDugaar &&
            String(
              (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
            )) ||
          "";
        const paidAmt = gid ? paidSummaryByGereeId[gid] : undefined;
        if (paidAmt === undefined) return true; // Not fetched yet, rely on isPaidLike
        return paidAmt > 0;
      }
      if (tuluvFilter === "unpaid")
        return isUnpaidLike(it) && !isOverdueLike(it);
      if (tuluvFilter === "overdue") {
        // Filter for cancelled receivables: items linked to cancelled gerees with unpaid invoices/zardal
        const itGereeId = String(it?.gereeniiId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const isLinkedToCancelledGeree =
          cancelledGereeIds.has(itGereeId) ||
          cancelledGereeDugaars.has(itGereeDugaar);

        if (!isLinkedToCancelledGeree) return false;

        // Check if invoice has unpaid amount
        const amount = Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        );
        const isUnpaid = !isPaidLike(it) && amount > 0;

        // Check if invoice has zardal (expenses) that need to be paid
        const hasZardal =
          Array.isArray(it?.medeelel?.zardluud) &&
          it.medeelel.zardluud.length > 0;
        const hasGuilgee =
          Array.isArray(it?.medeelel?.guilgeenuud) &&
          it.medeelel.guilgeenuud.length > 0;

        return isUnpaid && (hasZardal || hasGuilgee || amount > 0);
      }

      // Additional filters: Орц and Давхар
      if (selectedOrtsFilter || selectedDavkharFilter || selectedTootFilter) {
        const toStr = (v: any) => (v == null ? "" : String(v).trim());

        const cId = toStr(
          it?.gereeniiId ?? it?.gereeId ?? it?.kholbosonGereeniiId,
        );
        const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
        const c = cId ? (contractsById as any)[cId] : undefined;
        const r = rId ? (residentsById as any)[rId] : undefined;

        const orts = toStr(
          c?.orts ??
            c?.ortsDugaar ??
            c?.ortsNer ??
            r?.orts ??
            r?.ortsDugaar ??
            r?.ortsNer ??
            r?.block ??
            it?.orts ??
            it?.ortsDugaar ??
            it?.ortsNer,
        );
        const davkhar = toStr(r?.davkhar ?? c?.davkhar ?? it?.davkhar);
        const currentToot = toStr(
          r?.toot ?? c?.toot ?? it?.toot ?? it?.medeelel?.toot,
        );

        if (selectedOrtsFilter) {
          if (!orts || orts !== toStr(selectedOrtsFilter)) return false;
        }
        if (selectedDavkharFilter) {
          if (!davkhar || davkhar !== toStr(selectedDavkharFilter))
            return false;
        }
        if (selectedTootFilter) {
          // Robust case-insensitive partial matching for toot
          const filterVal = toStr(selectedTootFilter).toLowerCase();
          const targetToot = currentToot.toLowerCase();
          if (targetToot !== filterVal && !targetToot.includes(filterVal))
            return false;
        }
      }

      if (searchTerm) {
        // Augment item with resident/contract data so invoices match search even when
        // they only have orshinSuugchId/gereeniiId (ner/utas come from lookup)
        const cId = String(it?.gereeniiId ?? it?.gereeId ?? "").trim();
        const contract = cId ? (contractsById as any)[cId] : undefined;
        const rId = String(
          it?.orshinSuugchId ??
            it?.residentId ??
            contract?.orshinSuugchId ??
            "",
        ).trim();
        const resident = rId ? (residentsById as any)[rId] : undefined;
        const augmented = {
          ...it,
          _searchNer: resident?.ner ?? it?.ner ?? contract?.ner,
          _searchOvog: resident?.ovog ?? it?.ovog ?? contract?.ovog,
          _searchUtas: resident?.utas ?? it?.utas ?? contract?.utas,
          _searchGereeDugaar: contract?.gereeniiDugaar ?? it?.gereeniiDugaar,
        };
        if (!matchesSearch(augmented, searchTerm)) return false;
      }

      return true;
    });
  }, [
    buildingHistoryItems,
    tuluvFilter,
    searchTerm,
    gereeGaralt?.jagsaalt,
    contractsById,
    contractsByNumber,
    residentsById,
    selectedOrtsFilter,
    selectedDavkharFilter,
    selectedTootFilter,
    paidSummaryByGereeId,
  ]);

  // Same as filteredItems but WITHOUT tuluvFilter - for stats (dashboard numbers stay fixed)
  const filteredItemsAll = useMemo(() => {
    const cancelledGereeIds = new Set<string>();
    const cancelledGereeDugaars = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    cancelledGerees.forEach((g: any) => {
      if (g?._id) cancelledGereeIds.add(String(g._id));
      if (g?.gereeniiDugaar)
        cancelledGereeDugaars.add(String(g.gereeniiDugaar));
    });

    return buildingHistoryItems.filter((it: any) => {
      // Skip tuluvFilter - include all items for stats
      if (selectedOrtsFilter || selectedDavkharFilter || selectedTootFilter) {
        const toStr = (v: any) => (v == null ? "" : String(v).trim());
        const cId = toStr(
          it?.gereeniiId ?? it?.gereeId ?? it?.kholbosonGereeniiId,
        );
        const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
        const c = cId ? (contractsById as any)[cId] : undefined;
        const r = rId ? (residentsById as any)[rId] : undefined;
        const orts = toStr(
          c?.orts ??
            c?.ortsDugaar ??
            c?.ortsNer ??
            r?.orts ??
            r?.ortsDugaar ??
            r?.ortsNer ??
            r?.block ??
            it?.orts ??
            it?.ortsDugaar ??
            it?.ortsNer,
        );
        const davkhar = toStr(r?.davkhar ?? c?.davkhar ?? it?.davkhar);
        const currentToot = toStr(
          r?.toot ?? c?.toot ?? it?.toot ?? it?.medeelel?.toot,
        );
        if (selectedOrtsFilter && (!orts || orts !== toStr(selectedOrtsFilter)))
          return false;
        if (
          selectedDavkharFilter &&
          (!davkhar || davkhar !== toStr(selectedDavkharFilter))
        )
          return false;
        if (selectedTootFilter) {
          const filterVal = toStr(selectedTootFilter).toLowerCase();
          const targetToot = currentToot.toLowerCase();
          if (targetToot !== filterVal && !targetToot.includes(filterVal))
            return false;
        }
      }
      if (searchTerm) {
        const cId = String(it?.gereeniiId ?? it?.gereeId ?? "").trim();
        const contract = cId ? (contractsById as any)[cId] : undefined;
        const rId = String(
          it?.orshinSuugchId ??
            it?.residentId ??
            contract?.orshinSuugchId ??
            "",
        ).trim();
        const resident = rId ? (residentsById as any)[rId] : undefined;
        const augmented = {
          ...it,
          _searchNer: resident?.ner ?? it?.ner ?? contract?.ner,
          _searchOvog: resident?.ovog ?? it?.ovog ?? contract?.ovog,
          _searchUtas: resident?.utas ?? it?.utas ?? contract?.utas,
          _searchGereeDugaar: contract?.gereeniiDugaar ?? it?.gereeniiDugaar,
        };
        if (!matchesSearch(augmented, searchTerm)) return false;
      }
      return true;
    });
  }, [
    buildingHistoryItems,
    searchTerm,
    gereeGaralt?.jagsaalt,
    contractsById,
    residentsById,
    selectedOrtsFilter,
    selectedDavkharFilter,
    selectedTootFilter,
  ]);

  const totalSum = useMemo(() => {
    return filteredItems.reduce((s: number, it: any) => {
      const v =
        Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        ) || 0;
      return s + v;
    }, 0);
  }, [filteredItems]);

  // Deduplicate by resident (orshinSuugchId or ner+utas combination)
  // CRITICAL: Use buildingHistoryItems for amount calculation so negative ekhniiUldegdel (e.g. -87.79)
  // is always included even when filtered out. Filter which residents to show via filteredItems.
  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();

    // Build set of resident keys that pass the current filter (tuluv, orts, davkhar, search)
    const residentKeysFromFiltered = new Set<string>();
    filteredItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;
      if (key && key !== "||") residentKeysFromFiltered.add(key);
    });

    // FIRST PASS: Identify contracts/residents that have INVOICES containing ekhniiUldegdel in their zardluud
    const contractsWithEkhniiUldegdelInInvoice = new Set<string>();

    buildingHistoryItems.forEach((it: any) => {
      // Check if this is an invoice (has zardluud or medeelel.zardluud)
      const zardluud = Array.isArray(it?.medeelel?.zardluud)
        ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud)
          ? it.zardluud
          : [];
      const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];

      // Check if invoice contains ekhniiUldegdel in its zardluud (include negative)
      const hasEkhniiUldegdelInZardluud = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        const isEkhUld =
          z?.isEkhniiUldegdel === true ||
          ner.includes("эхний үлдэгдэл") ||
          ner.includes("ekhniuldegdel") ||
          ner.includes("ekhnii uldegdel");
        const amt = Number(z?.dun || z?.tariff || 0);
        return isEkhUld && amt !== 0;
      });
      // Also check guilgeenuud for ekhniiUldegdel (e.g. Excel-ээр оруулсан эхний үлдэгдэл)
      const hasEkhniiUldegdelInGuilgee = guilgeenuud.some((g: any) => {
        if (g?.ekhniiUldegdelEsekh !== true) return false;
        const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
        return amt !== 0;
      });

      if (hasEkhniiUldegdelInZardluud || hasEkhniiUldegdelInGuilgee) {
        const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
        if (gereeId) contractsWithEkhniiUldegdelInInvoice.add(gereeId);
        if (gereeDugaar) contractsWithEkhniiUldegdelInInvoice.add(gereeDugaar);
      }
    });

    // SECOND PASS: Build deduplicated residents from buildingHistoryItems (all data for correct totals)
    // Only include residents that have at least one item in filteredItems
    buildingHistoryItems.forEach((it: any) => {
      // Create a unique key for each resident
      const residentId = String(it?.orshinSuugchId || "").trim();
      let gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      // For receivables, gereeId might be missing - resolve from gereeDugaar via contractsByNumber
      if (
        !gereeId &&
        gereeDugaar &&
        (contractsByNumber as any)[gereeDugaar]?._id
      ) {
        gereeId = String((contractsByNumber as any)[gereeDugaar]._id);
      }
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();

      // Priority grouping: GereeId > ResidentId > GereeDugaar > Name+Utas
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return; // Skip if no valid identifier
      if (!residentKeysFromFiltered.has(key)) return; // Only include residents that pass the filter

      // Check if this is a standalone ekhniiUldegdel record from gereeniiTulukhAvlaga
      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      const standaloneAmount =
        Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0;

      // SKIP this record if it's a standalone ekhniiUldegdel AND the contract already has ekhniiUldegdel in an invoice
      // This prevents double-counting. BUT: never skip NEGATIVE standalone (e.g. Excel-ээр оруулсан эхний үлдэгдэл -87.79)
      // because invoice's ekhniiUldegdel is typically positive - they are different entries.
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar &&
            contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));

        if (contractHasEkhniiUldegdelInInvoice && standaloneAmount >= 0) {
          // Skip only when positive - invoice's ekhniiUldegdel covers it
          return;
        }
      }

      // For standalone ekhniiUldegdel records (that don't have an invoice), use undsenDun (original amount)
      // For invoices/other items, base on niitTulbur/niitDun/total (sum of zardluud),
      // matching HistoryModal's charge calculation and avoiding double-counting niitTulburOriginal.
      let itemAmount = isStandaloneEkhniiUldegdel
        ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
        : Number(
            it?.niitTulbur ??
              it?.niitDun ??
              it?.total ??
              it?.tulukhDun ??
              it?.undsenDun ??
              it?.dun ??
              0,
          ) || 0;

      let ekhniiUldegdelDelta = isStandaloneEkhniiUldegdel ? itemAmount : 0;
      if (!isStandaloneEkhniiUldegdel) {
        // For invoices: base on niitTulbur/niitDun/total (sum of zardluud/expenses),
        // which matches what HistoryModal derives from zardluud.
        const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
          ? it.medeelel.guilgeenuud
          : Array.isArray(it?.guilgeenuud)
            ? it.guilgeenuud
            : [];
        
        itemAmount = Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        ) || 0;

        // Extract ekhniiUldegdel from invoice zardluud and guilgeenuud for column display
        const zardluud = Array.isArray(it?.medeelel?.zardluud)
          ? it.medeelel.zardluud
          : Array.isArray(it?.zardluud)
            ? it.zardluud
            : [];
        const fromZardluud = zardluud.reduce((s: number, z: any) => {
          const ner = String(z?.ner || "").toLowerCase();
          const isEkh =
            z?.isEkhniiUldegdel === true ||
            ner.includes("эхний үлдэгдэл") ||
            ner.includes("ekhniuldegdel") ||
            ner.includes("ekhnii uldegdel");
          if (!isEkh) return s;
          const amt = Number(z?.dun ?? z?.tariff ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        const fromGuilgee = guilgeenuud.reduce((s: number, g: any) => {
          if (g?.ekhniiUldegdelEsekh !== true) return s;
          const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        ekhniiUldegdelDelta = fromZardluud + fromGuilgee;
      }

      if (!map.has(key)) {
        // First occurrence - store as base record
        map.set(key, {
          ...it,
          _historyCount: 1,
          _totalTulbur: itemAmount,
          _totalTulsun: Number(it?.tulsunDun ?? 0) || 0,
          _hasEkhniiUldegdel:
            isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0,
          _ekhniiUldegdelAmount: ekhniiUldegdelDelta,
        });
      } else {
        // Aggregate values
        const existing = map.get(key);
        existing._historyCount += 1;
        existing._totalTulbur += itemAmount;
        existing._totalTulsun += Number(it?.tulsunDun ?? 0) || 0;
        if (isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0) {
          existing._hasEkhniiUldegdel = true;
          existing._ekhniiUldegdelAmount =
            (existing._ekhniiUldegdelAmount || 0) + ekhniiUldegdelDelta;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredItems, buildingHistoryItems, contractsByNumber]);

  // Full resident set (no tuluvFilter) - for stats so dashboard numbers stay fixed when clicking filters
  const deduplicatedResidentsAll = useMemo(() => {
    const map = new Map<string, any>();
    const residentKeysFromFiltered = new Set<string>();
    filteredItemsAll.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;
      if (key && key !== "||") residentKeysFromFiltered.add(key);
    });

    const contractsWithEkhniiUldegdelInInvoice = new Set<string>();
    buildingHistoryItems.forEach((it: any) => {
      const zardluud = Array.isArray(it?.medeelel?.zardluud)
        ? it.medeelel.zardluud
        : Array.isArray(it?.zardluud)
          ? it.zardluud
          : [];
      const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
        ? it.medeelel.guilgeenuud
        : Array.isArray(it?.guilgeenuud)
          ? it.guilgeenuud
          : [];
      const hasEkhniiUldegdelInZardluud = zardluud.some((z: any) => {
        const ner = String(z?.ner || "").toLowerCase();
        const isEkhUld =
          z?.isEkhniiUldegdel === true ||
          ner.includes("эхний үлдэгдэл") ||
          ner.includes("ekhniuldegdel") ||
          ner.includes("ekhnii uldegdel");
        const amt = Number(z?.dun || z?.tariff || 0);
        return isEkhUld && amt !== 0;
      });
      const hasEkhniiUldegdelInGuilgee = guilgeenuud.some((g: any) => {
        if (g?.ekhniiUldegdelEsekh !== true) return false;
        const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
        return amt !== 0;
      });
      if (hasEkhniiUldegdelInZardluud || hasEkhniiUldegdelInGuilgee) {
        const gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
        const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
        if (gereeId) contractsWithEkhniiUldegdelInInvoice.add(gereeId);
        if (gereeDugaar) contractsWithEkhniiUldegdelInInvoice.add(gereeDugaar);
      }
    });

    buildingHistoryItems.forEach((it: any) => {
      const residentId = String(it?.orshinSuugchId || "").trim();
      let gereeId = String(it?.gereeniiId || it?.gereeId || "").trim();
      const gereeDugaar = String(it?.gereeniiDugaar || "").trim();
      if (
        !gereeId &&
        gereeDugaar &&
        (contractsByNumber as any)[gereeDugaar]?._id
      ) {
        gereeId = String((contractsByNumber as any)[gereeDugaar]._id);
      }
      const ner = String(it?.ner || "")
        .trim()
        .toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();
      const key =
        gereeId || residentId || gereeDugaar || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return;
      if (!residentKeysFromFiltered.has(key)) return;

      const isStandaloneEkhniiUldegdel = it?.ekhniiUldegdelEsekh === true;
      const standaloneAmount =
        Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0;
      if (isStandaloneEkhniiUldegdel) {
        const contractHasEkhniiUldegdelInInvoice =
          (gereeId && contractsWithEkhniiUldegdelInInvoice.has(gereeId)) ||
          (gereeDugaar &&
            contractsWithEkhniiUldegdelInInvoice.has(gereeDugaar));
        if (contractHasEkhniiUldegdelInInvoice && standaloneAmount >= 0) return;
      }

    let itemAmount = isStandaloneEkhniiUldegdel
      ? Number(it?.undsenDun ?? it?.tulukhDun ?? it?.uldegdel ?? 0) || 0
      : Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        ) || 0;

      // Determine if this item is a CHARGE (increases total) or a PAYMENT (increases paid)
      // Usually "tulult" (payment) or "tsutlsasan" (cancelled) records are payments/deductions
      const type = String(it?.turul || it?.type || "").toLowerCase();
      const isPayment = type === "tulult" || type === "төлбөр" || type === "төлөлт" || (itemAmount < 0 && !isStandaloneEkhniiUldegdel);

      let ekhniiUldegdelDelta = isStandaloneEkhniiUldegdel ? itemAmount : 0;
      if (!isStandaloneEkhniiUldegdel) {
        const guilgeenuud = Array.isArray(it?.medeelel?.guilgeenuud)
          ? it.medeelel.guilgeenuud
          : Array.isArray(it?.guilgeenuud)
            ? it.guilgeenuud
            : [];
        const zardluud = Array.isArray(it?.medeelel?.zardluud)
          ? it.medeelel.zardluud
          : Array.isArray(it?.zardluud)
            ? it.zardluud
            : [];
        const fromZardluud = zardluud.reduce((s: number, z: any) => {
          const ner = String(z?.ner || "").toLowerCase();
          const isEkh =
            z?.isEkhniiUldegdel === true ||
            ner.includes("эхний үлдэгдэл") ||
            ner.includes("ekhniuldegdel") ||
            ner.includes("ekhnii uldegdel");
          if (!isEkh) return s;
          const amt = Number(z?.dun ?? z?.tariff ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        const fromGuilgee = guilgeenuud.reduce((s: number, g: any) => {
          if (g?.ekhniiUldegdelEsekh !== true) return s;
          const amt = Number(g?.tulukhDun ?? g?.undsenDun ?? 0);
          return s + (amt !== 0 ? amt : 0);
        }, 0);
        ekhniiUldegdelDelta = fromZardluud + fromGuilgee;
      }

      const chargeAmt = isPayment ? 0 : Math.abs(itemAmount);
      // For payments, use Math.abs(itemAmount) because payments are often stored as negative in the history
      const paidAmt = isPayment ? Math.abs(itemAmount) : (Number(it?.tulsunDun ?? it?.tulsun ?? 0) || 0);

      if (!map.has(key)) {
        map.set(key, {
          ...it,
          _historyCount: 1,
          _totalTulbur: chargeAmt,
          _totalTulsun: paidAmt,
          _hasEkhniiUldegdel:
            isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0,
          _ekhniiUldegdelAmount: ekhniiUldegdelDelta,
        });
      } else {
        const existing = map.get(key);
        existing._historyCount += 1;
        existing._totalTulbur += chargeAmt;
        existing._totalTulsun += paidAmt;
        if (isStandaloneEkhniiUldegdel || ekhniiUldegdelDelta !== 0) {
          existing._hasEkhniiUldegdel = true;
          existing._ekhniiUldegdelAmount =
            (existing._ekhniiUldegdelAmount || 0) + ekhniiUldegdelDelta;
        }
      }
    });
    return Array.from(map.values());
  }, [filteredItemsAll, buildingHistoryItems, contractsByNumber]);

  const sortedResidents = useMemo(() => {
    const result = Array.from(deduplicatedResidents);
    if (!sortField) return result;

    result.sort((a, b) => {
      let aVal: any, bVal: any;

      const getGid = (it: any) =>
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?.gereeId && String(it.gereeId)) ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
          )) ||
        "";

      if (sortField === "uldegdel" || sortField === "paid") {
        if (sortField === "paid") {
          const gidA = getGid(a);
          const gidB = getGid(b);
          aVal = gidA ? (paidSummaryByGereeId[gidA] ?? 0) : 0;
          bVal = gidB ? (paidSummaryByGereeId[gidB] ?? 0) : 0;
        } else {
          // Just use uldegdel directly from data - NO calculation
          aVal = Number(a?.uldegdel ?? 0);
          bVal = Number(b?.uldegdel ?? 0);
        }
      } else if (sortField === "toot") {
        const getTootVal = (it: any) => {
          const rid = it.orshinSuugchId ? String(it.orshinSuugchId) : null;
          const res = rid ? residentsById[rid] : null;
          const resToot =
            Array.isArray(res?.toots) && res.toots.length > 0
              ? res.toots[0]?.toot
              : res?.toot;
          const cid = it.gereeniiId ? String(it.gereeniiId) : null;
          const con = cid
            ? contractsById[cid]
            : it.gereeniiDugaar
              ? contractsByNumber[it.gereeniiDugaar]
              : null;
          return String(
            con?.toot || resToot || it.toot || it.medeelel?.toot || "",
          );
        };
        aVal = getTootVal(a);
        bVal = getTootVal(b);
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : bVal.localeCompare(aVal, undefined, {
              numeric: true,
              sensitivity: "base",
            });
      }

      return sortOrder === "asc"
        ? aVal < bVal
          ? -1
          : 1
        : aVal > bVal
          ? -1
          : 1;
    });

    return result;
  }, [
    deduplicatedResidents,
    sortField,
    sortOrder,
    paidSummaryByGereeId,
    residentsById,
    contractsById,
    contractsByNumber,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedResidents.length / rowsPerPage),
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    return sortedResidents.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [sortedResidents, page, rowsPerPage]);

  // Helper to resolve gereeId from resident (used for paidSummary lookup)
  const getGereeId = (it: any) =>
    (it?.gereeniiId && String(it.gereeniiId)) ||
    (it?.gereeId && String(it.gereeId)) ||
    (it?.gereeniiDugaar &&
      String(
        (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || "",
      )) ||
    "";

  // Fetch total paid amount (Төлсөн дүн) per geree using /geree/tulsunSummary
  // Fetch for ALL deduplicatedResidentsAll so stats and footer have correct paid data.
  // Limit to 500 to prevent firing too many requests for very large datasets.
  useEffect(() => {
    if (
      !token ||
      !ajiltan?.baiguullagiinId ||
      deduplicatedResidentsAll.length === 0
    )
      return;

    const baiguullagiinId = ajiltan.baiguullagiinId;
    const toFetch = deduplicatedResidentsAll.slice(0, 500);

    toFetch.forEach((it: any) => {
      const gid = getGereeId(it);
      if (!gid) return;

      if (
        paidSummaryByGereeId[gid] !== undefined ||
        requestedGereeIdsRef.current.has(gid)
      ) {
        return;
      }

      requestedGereeIdsRef.current.add(gid);

      uilchilgee(token)
        .post("/tulsunSummary", {
          baiguullagiinId,
          gereeniiId: gid,
        })
        .then((resp) => {
          const total =
            Number(
              resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0,
            ) || 0;
          setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => {
          requestedGereeIdsRef.current.delete(gid);
        });
    });
  }, [
    token,
    ajiltan?.baiguullagiinId,
    deduplicatedResidentsAll,
    contractsByNumber,
  ]);

  // Count cancelled gerees with unpaid invoices/zardal
  const cancelledGereesWithUnpaid = useMemo(() => {
    const cancelledGereeIds = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    // Find cancelled gerees
    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return (
        status === "Цуцалсан" ||
        status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" ||
        status.toLowerCase() === "tsutlsasan"
      );
    });

    // For each cancelled geree, check if it has unpaid invoices/zardal
    cancelledGerees.forEach((geree: any) => {
      const gereeId = String(geree?._id || "");
      const gereeDugaar = String(geree?.gereeniiDugaar || "");

      // Check if there are unpaid invoices linked to this geree
      const hasUnpaidInvoice = buildingHistoryItems.some((it: any) => {
        const itGereeId = String(it?.gereeniiId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const matchesGeree =
          (gereeId && itGereeId === gereeId) ||
          (gereeDugaar && itGereeDugaar === gereeDugaar);

        if (!matchesGeree) return false;

        // Check if invoice has unpaid amount
        const amount = Number(
          it?.niitTulbur ??
            it?.niitDun ??
            it?.total ??
            it?.tulukhDun ??
            it?.undsenDun ??
            it?.dun ??
            0,
        );
        const isUnpaid = !isPaidLike(it) && amount > 0;

        // Check if invoice has zardal (expenses) that need to be paid
        const hasZardal =
          Array.isArray(it?.medeelel?.zardluud) &&
          it.medeelel.zardluud.length > 0;
        const hasGuilgee =
          Array.isArray(it?.medeelel?.guilgeenuud) &&
          it.medeelel.guilgeenuud.length > 0;

        return isUnpaid && (hasZardal || hasGuilgee || amount > 0);
      });

      if (hasUnpaidInvoice && gereeId) {
        cancelledGereeIds.add(gereeId);
      }
    });

    return cancelledGereeIds.size;
  }, [gereeGaralt?.jagsaalt, buildingHistoryItems]);

  // Stats use deduplicatedResidentsAll so dashboard numbers stay fixed when clicking filters
  const stats = useMemo(() => {
    const residentCount = deduplicatedResidentsAll.length;
    const paidCount = deduplicatedResidentsAll.filter((r: any) => {
      // Use uldegdel directly from data
      const uldegdel = Number(r?.uldegdel ?? 0);
      return uldegdel <= 0;
    }).length;
    const unpaidCount = residentCount - paidCount;

    return [
      { title: "Оршин суугч", value: residentCount },
      { title: "Цуцласан гэрээний авлага", value: cancelledGereesWithUnpaid },
      { title: "Төлсөн", value: paidCount },
      { title: "Төлөөгүй", value: unpaidCount },
    ];
  }, [
    deduplicatedResidentsAll,
    cancelledGereesWithUnpaid,
    paidSummaryByGereeId,
    contractsByNumber,
  ]);

  const zaaltOruulakh = async () => {
    const loadingToastId = toast.loading("Заалтын Excel файл бэлдэж байна…");
    const hide = () => toast.dismiss(loadingToastId);

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        hide();
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const response = await uilchilgee(token).post(
        "/zaaltExcelDataAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        {
          responseType: "blob" as any,
        },
      );

      hide();

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Try to infer filename from headers or fallback
      const cd = (response.headers?.["content-disposition"] ||
        response.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_data.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Заалтын мэдээлэл амжилттай татагдлаа");
    } catch (err: any) {
      hide();

      // Handle blob error response - when responseType is 'blob', error response may be Blob or ArrayBuffer
      let errorMsg = "Алдаа гарлаа";

      try {
        const responseData = err?.response?.data;

        if (responseData instanceof Blob) {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (responseData instanceof ArrayBuffer) {
          const decoder = new TextDecoder("utf-8");
          const errorText = decoder.decode(responseData);
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (typeof responseData === "string") {
          try {
            const errorJson = JSON.parse(responseData);
            errorMsg =
              errorJson.aldaa ||
              errorJson.message ||
              errorJson.error ||
              errorMsg;
          } catch {
            errorMsg = responseData || errorMsg;
          }
        } else if (responseData && typeof responseData === "object") {
          errorMsg =
            responseData.aldaa ||
            responseData.message ||
            responseData.error ||
            errorMsg;
        } else {
          errorMsg = getErrorMessage(err);
        }
      } catch {
        // If all parsing fails, try getErrorMessage as fallback
        const fallback = getErrorMessage(err);
        if (fallback && fallback !== "Алдаа гарлаа") {
          errorMsg = fallback;
        }
      }

      openErrorOverlay(errorMsg);
    }
  };

  const exceleerTatya = async () => {
    const loadingToastId = toast.loading("Excel загвар бэлдэж байна…");
    const hide = () => toast.dismiss(loadingToastId);

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        hide();
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId || null,
      };

      const path = "/zaaltExcelTemplateAvya";
      let resp: any;
      try {
        resp = await uilchilgee(token).post(path, body, {
          responseType: "blob" as any,
        });
      } catch (err: any) {
        if (err?.response?.status === 404 && typeof window !== "undefined") {
          resp = await uilchilgee(token).post(
            `${window.location.origin}${path}`,
            body,
            { responseType: "blob" as any, baseURL: undefined as any },
          );
        } else {
          throw err;
        }
      }
      hide();

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      // Try to infer filename from headers or fallback
      const cd = (resp.headers?.["content-disposition"] ||
        resp.headers?.["Content-Disposition"]) as string | undefined;
      let filename = "zaalt_template.xlsx";
      if (cd && /filename\*=UTF-8''([^;]+)/i.test(cd)) {
        filename = decodeURIComponent(
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1],
        );
      } else if (cd && /filename="?([^";]+)"?/i.test(cd)) {
        filename = cd.match(/filename="?([^";]+)"?/i)![1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel загвар татагдлаа");
    } catch (err: any) {
      hide();
      console.error(err);

      // Handle blob error response - when responseType is 'blob', error response may be Blob or ArrayBuffer
      let errorMsg = "Excel загвар татахад алдаа гарлаа";

      try {
        const responseData = err?.response?.data;

        if (responseData instanceof Blob) {
          const errorText = await responseData.text();
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (responseData instanceof ArrayBuffer) {
          const decoder = new TextDecoder("utf-8");
          const errorText = decoder.decode(responseData);
          const errorJson = JSON.parse(errorText);
          errorMsg =
            errorJson.aldaa || errorJson.message || errorJson.error || errorMsg;
        } else if (typeof responseData === "string") {
          try {
            const errorJson = JSON.parse(responseData);
            errorMsg =
              errorJson.aldaa ||
              errorJson.message ||
              errorJson.error ||
              errorMsg;
          } catch {
            errorMsg = responseData || errorMsg;
          }
        } else if (responseData && typeof responseData === "object") {
          errorMsg =
            responseData.aldaa ||
            responseData.message ||
            responseData.error ||
            errorMsg;
        } else {
          const parsed = getErrorMessage(err);
          if (parsed && parsed !== "Алдаа гарлаа") {
            errorMsg = parsed;
          }
        }
      } catch {
        // If all parsing fails, try getErrorMessage as fallback
        const fallback = getErrorMessage(err);
        if (fallback && fallback !== "Алдаа гарлаа") {
          errorMsg = fallback;
        }
      }

      openErrorOverlay(errorMsg);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zaaltButtonRef.current &&
        !zaaltButtonRef.current.contains(event.target as Node)
      ) {
        setIsZaaltDropdownOpen(false);
      }
    };

    if (isZaaltDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isZaaltDropdownOpen]);

  // Handle column dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setIsColumnModalOpen(false);
      }
    };

    if (isColumnModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside as any);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside as any);
      };
    }
  }, [isColumnModalOpen]);

  // Excel Import handler
  const handleTransactionSubmit = async (data: TransactionData) => {
    try {
      setIsProcessingTransaction(true);

      if (!token || !ajiltan?.baiguullagiinId) {
        openErrorOverlay("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      // Only mark as paid when transaction type is "tulult" (Төлөлт)
      // For other types (avlaga, ashiglalt), create a transaction record without marking as paid
      if (data.type === "tulult") {
        // Payment: mark invoices as paid
        const response = await uilchilgee(token).post("/markInvoicesAsPaid", {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          dun: data.amount,
          orshinSuugchId: data.residentId,
          gereeniiId: data.gereeniiId,
          tailbar:
            data.tailbar ||
            (data.ekhniiUldegdel
              ? `Эхний үлдэгдэл - ${data.date}`
              : `Төлөлт - ${data.date}`),
          ognoo: data.date,
          ...(data.ekhniiUldegdel && { markEkhniiUldegdel: true }),
          createdBy: ajiltan._id,
          createdAt: new Date().toISOString(),
        });

        if (response.data.success || response.status === 200) {
          toast.success("Төлөлт амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);

          // Instant UI Update: Clear local caches for this contract so they refetch immediately
          if (data.gereeniiId) {
            const gid = data.gereeniiId;
            requestedGereeIdsRef.current.delete(gid);
            setPaidSummaryByGereeId((prev) => {
              const updated = { ...prev };
              delete (updated as any)[gid];
              return updated;
            });
          }

          // Global Revalidation: Refresh history, contracts, and residents
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/nekhemjlekhiinTuukh" ||
                key[0] === "/geree" ||
                key[0] === "/orshinSuugch" ||
                key[0] === "/gereeniiTulukhAvlaga"),
            undefined,
            { revalidate: true },
          );
          setInvoiceRefreshTrigger((t) => t + 1);
        }
      } else {
        // Other transaction types (avlaga, ashiglalt): create a transaction record without marking as paid
        const response = await uilchilgee(token).post(
          "/gereeniiGuilgeeKhadgalya",
          {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: effectiveBarilgiinId,
            tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
            turul: data.type,
            tulukhDun: data.amount,
            dun: data.amount,
            orshinSuugchId: data.residentId,
            gereeniiId: data.gereeniiId,
            tailbar:
              data.tailbar ||
              (data.ekhniiUldegdel
                ? `Эхний үлдэгдэл - ${data.date}`
                : `${data.type === "avlaga" ? "Авлага" : data.type === "ashiglalt" ? "Ашиглалт" : data.type} - ${data.date}`),
            ognoo: data.date,
            ...(data.ekhniiUldegdel && { ekhniiUldegdelEsekh: true }), // Only include when checked
            createdBy: ajiltan._id,
            createdAt: new Date().toISOString(),
          },
        );

        if (
          response.data.success ||
          response.status === 200 ||
          response.status === 201
        ) {
          toast.success("Гүйлгээ амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);

          // Instant UI Update: Clear local caches for this contract so they refetch immediately
          if (data.gereeniiId) {
            const gid = data.gereeniiId;
            requestedGereeIdsRef.current.delete(gid);
            setPaidSummaryByGereeId((prev) => {
              const updated = { ...prev };
              delete (updated as any)[gid];
              return updated;
            });
          }

          // Global Revalidation: Refresh history, contracts, and residents
          mutate(
            (key: any) =>
              Array.isArray(key) &&
              (key[0] === "/nekhemjlekhiinTuukh" ||
                key[0] === "/geree" ||
                key[0] === "/orshinSuugch" ||
                key[0] === "/gereeniiTulukhAvlaga"),
            undefined,
            { revalidate: true },
          );
          setInvoiceRefreshTrigger((t) => t + 1);
        }
      }
    } catch (error: any) {
      openErrorOverlay(getErrorMessage(error));
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible items that have a valid gereeniiId
      const allIds = paginated
        .map((it: any) => {
          const gid =
            (it?.gereeniiId && String(it.gereeniiId)) ||
            (it?.gereeId && String(it.gereeId)) ||
            (it?.gereeniiDugaar &&
              String(
                (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id ||
                  "",
              ));
          return gid;
        })
        .filter((id) => id && id.length > 5); // Filter out invalid IDs

      // Use Set to ensure uniqueness when adding to existing selection if needed,
      // but "Select All" usually implies "replace selection with all current page" or "add all current page"
      // Let's implement "Add current page to selection" to match Gmail-style behavior if we want multi-page,
      // but Geree logic was "Select all currentContracts".
      // Let's assume user wants to select everything on current page.

      setSelectedGereeIds((prev) => Array.from(new Set([...prev, ...allIds])));
    } else {
      // Deselect all items on current page
      const pageIds = new Set(
        paginated
          .map((it: any) => {
            const gid =
              (it?.gereeniiId && String(it.gereeniiId)) ||
              (it?.gereeId && String(it.gereeId)) ||
              (it?.gereeniiDugaar &&
                String(
                  (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id ||
                    "",
                ));
            return gid;
          })
          .filter((id) => id),
      );

      setSelectedGereeIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleRow = (gereeId: string, checked: boolean) => {
    if (!gereeId) return;
    setSelectedGereeIds((prev) => {
      if (checked) {
        return [...prev, gereeId];
      }
      return prev.filter((id) => id !== gereeId);
    });
  };

  // Manual send invoice handler
  const handleSendInvoices = async () => {
    if (!token || !ajiltan?.baiguullagiinId) {
      openErrorOverlay("Нэвтэрч орсон хэрэглэгч олдсонгүй");
      return;
    }

    if (selectedGereeIds.length === 0) {
      openErrorOverlay("Нэхэмжлэх илгээх гэрээ сонгоно уу");
      return;
    }

    setIsSendingInvoices(true);
    try {
      // Get current month and year as default
      const now = new Date();

      const body = {
        gereeIds: selectedGereeIds,
        baiguullagiinId: ajiltan.baiguullagiinId,
        override: false,
        targetMonth: now.getMonth() + 1,
        targetYear: now.getFullYear(),
      };

      const response = await uilchilgee(token).post("/manualSend", body);

      if (response.data?.success) {
        const message =
          response.data.message ||
          `${response.data.data?.created || 0} нэхэмжлэх амжилттай үүсгэгдлээ`;
        openSuccessOverlay(message);
        setSelectedGereeIds([]); // Clear selection on success

        // If there are errors, show them
        if (
          response.data.data?.errors > 0 &&
          response.data.data?.errorsList?.length > 0
        ) {
          const errorMessages = response.data.data.errorsList
            .map((err: any) => `${err.gereeniiDugaar || "Гэрээ"}: ${err.error}`)
            .join("\n");
          openErrorOverlay(`Зарим алдаа гарлаа:\n${errorMessages}`);
        }

        // Refresh data
        mutate(
          (key: any) =>
            Array.isArray(key) &&
            (key[0] === "/nekhemjlekhiinTuukh" ||
              key[0] === "/geree" ||
              key[0] === "/orshinSuugch" ||
              key[0] === "/gereeniiTulukhAvlaga"),
          undefined,
          { revalidate: true },
        );
        setInvoiceRefreshTrigger((t) => t + 1);
      }
    } catch (error: any) {
      const msg = getErrorMessage(error);
      openErrorOverlay(`Нэхэмжлэх илгээхэд алдаа гарлаа: ${msg}`);
    } finally {
      setIsSendingInvoices(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      ".xlsx",
      ".xls",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isValidType) {
      toast.error("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let importToastId: string | undefined;
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        toast.error("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const form = new FormData();
      form.append("file", file); // Field name must be "file" as expected by backend
      form.append("baiguullagiinId", ajiltan.baiguullagiinId);
      if (effectiveBarilgiinId) {
        form.append("barilgiinId", effectiveBarilgiinId);
      }
      // Add ognoo (date) field - using current date in YYYY-MM-DD format
      const today = new Date();
      const ognoo = today.toISOString().split("T")[0]; // YYYY-MM-DD format
      form.append("ognoo", ognoo);

      const endpoint = "/zaaltExcelTatya";

      importToastId = toast.loading("Excel импорт хийж байна…");

      const resp: any = await uilchilgee(token).post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (importToastId) toast.dismiss(importToastId);

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map(
          (f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`,
        );
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        toast.success("Excel импорт амжилттай");
        // Refresh the page data by reloading
        window.location.reload();
      }
    } catch (err: any) {
      toast.dismiss(importToastId);
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const t = (text: string) => text;

  useEffect(() => {
    const open = isKhungulultOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isKhungulultOpen]);

  // Keyboard: Esc to close, Enter to trigger primary action within modal
  useModalHotkeys({
    isOpen: isKhungulultOpen,
    onClose: () => setIsKhungulultOpen(false),
    container: khungulultRef.current,
  });

  // Handle opening history modal
  const handleOpenHistory = async (resident: any) => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    setHistoryResident(resident);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryIndex(0);
    setHistoryItems([]);
    try {
      const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 2000,
        },
      });
      const data = resp.data;
      let list = Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data)
          ? data
          : [];

      // Extract identifiers from the resident object
      const residentId = String(
        resident?._id || resident?.orshinSuugchId || "",
      ).trim();
      const residentGereeId = String(resident?.gereeniiId || "").trim();
      const residentGereeDugaar = String(resident?.gereeniiDugaar || "").trim();
      // Get toot from toots array first, then fallback to top-level
      const residentToot = String(
        (Array.isArray(resident?.toots) && resident.toots.length > 0
          ? resident.toots[0]?.toot
          : null) ??
          resident?.toot ??
          "",
      ).trim();
      const residentNer = String(resident?.ner || "")
        .trim()
        .toLowerCase();
      const residentOvog = String(resident?.ovog || "")
        .trim()
        .toLowerCase();
      const residentUtas = Array.isArray(resident?.utas)
        ? String(resident.utas[0] || "").trim()
        : String(resident?.utas || "").trim();

      // Filter using multiple matching strategies
      const residentInvoices = list.filter((item: any) => {
        // Strategy 1: Match by orshinSuugchId
        if (
          residentId &&
          String(item?.orshinSuugchId || "").trim() === residentId
        ) {
          return true;
        }

        // Strategy 2: Match by gereeniiId
        if (
          residentGereeId &&
          String(item?.gereeniiId || "").trim() === residentGereeId
        ) {
          return true;
        }

        // Strategy 3: Match by gereeniiDugaar
        if (
          residentGereeDugaar &&
          String(item?.gereeniiDugaar || "").trim() === residentGereeDugaar
        ) {
          return true;
        }

        // Strategy 4: Match by toot + ner (if both exist)
        if (residentToot && residentNer) {
          const itemToot = String(
            item?.toot || item?.medeelel?.toot || "",
          ).trim();
          const itemNer = String(item?.ner || "")
            .trim()
            .toLowerCase();
          if (itemToot === residentToot && itemNer === residentNer) {
            return true;
          }
        }

        // Strategy 5: Match by phone number
        if (residentUtas && residentUtas.length >= 8) {
          const itemUtas = Array.isArray(item?.utas)
            ? String(item.utas[0] || "").trim()
            : String(item?.utas || "").trim();
          if (itemUtas === residentUtas) {
            return true;
          }
        }

        // Strategy 6: Match by ovog + ner combination
        if (residentOvog && residentNer) {
          const itemOvog = String(item?.ovog || "")
            .trim()
            .toLowerCase();
          const itemNer = String(item?.ner || "")
            .trim()
            .toLowerCase();
          if (itemOvog === residentOvog && itemNer === residentNer) {
            return true;
          }
        }

        return false;
      });

      console.log("📜 History filter result:", {
        resident: {
          id: residentId,
          gereeId: residentGereeId,
          gereeDugaar: residentGereeDugaar,
          toot: residentToot,
          ner: residentNer,
        },
        totalItems: list.length,
        matchedItems: residentInvoices.length,
      });

      setHistoryItems(residentInvoices);
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch lift floors
  useEffect(() => {
    const fetchLiftFloors = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await uilchilgee(token).get("/liftShalgaya", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
          },
        });
        const data = resp.data;
        const list = Array.isArray(data?.jagsaalt) ? data.jagsaalt : [];
        const toStr = (v: any) => (v == null ? "" : String(v));
        const branchMatches = barilgiinId
          ? list.filter(
              (x: any) => toStr(x?.barilgiinId) === toStr(barilgiinId),
            )
          : [];
        const pickLatest = (arr: any[]) =>
          [...arr].sort(
            (a, b) =>
              new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
              new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
          )[0];
        let chosen =
          branchMatches.length > 0 ? pickLatest(branchMatches) : null;
        if (!chosen) {
          const orgDefaults = list.filter(
            (x: any) => x?.barilgiinId == null || toStr(x.barilgiinId) === "",
          );
          chosen =
            orgDefaults.length > 0 ? pickLatest(orgDefaults) : pickLatest(list);
        }
        const floors: string[] = Array.isArray(chosen?.choloolugdokhDavkhar)
          ? chosen.choloolugdokhDavkhar.map((f: any) => String(f))
          : [];
        setLiftFloors(floors);
      } catch {}
    };
    fetchLiftFloors();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId, selectedBuildingId]);

  // Handle modal body overflow
  useEffect(() => {
    document.body.style.overflow = isModalOpen || isHistoryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isHistoryOpen]);

  // Modal keyboard shortcuts for history modal
  useModalHotkeys({
    isOpen: isHistoryOpen,
    onClose: () => setIsHistoryOpen(false),
    container: historyRef.current,
  });

  // Register guided tour for /tulbur/guilgeeTuukh
  const tourSteps = useMemo<DriverStep[]>(
    () => [
      {
        element: "#guilgee-status-filter",
        popover: {
          title: "Төлөвийн шүүлтүүр",
          description:
            "Төлсөн, Төлөөгүй эсвэл Хугацаа хэтэрсэн гэх мэт төлөвөөр ялгана.",
        },
      },
      {
        element: "#guilgee-nekhemjlekh-btn",
        popover: {
          title: "Нэхэмжлэх",
          description: "Энд дарж нэхэмжлэхийн цонх нээнэ.",
        },
      },
      {
        element: "#guilgee-excel-btn",
        popover: {
          title: "Excel татах",
          description: "Жагсаалтыг Excel файл хэлбэрээр татна.",
        },
      },
      {
        element: "#guilgee-table",
        popover: {
          title: "Жагсаалт",
          description: "Гүйлгээний түүх энд харагдана.",
        },
      },
      {
        element: "#guilgee-pagination",
        popover: {
          title: "Хуудаслалт",
          description: "Эндээс хуудсуудын хооронд шилжинэ.",
        },
      },
    ],
    [],
  );
  useRegisterTourSteps("/tulbur/guilgeeTuukh", tourSteps);

  return (
    <div className="min-h-screen">
      {/* <div className="flex items-center gap-3 mb-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl  text-theme bg-clip-text text-transparent drop-shadow-sm"
        >
          Гүйлгээний түүх
        </motion.h1>
        <div style={{ width: 44, height: 44 }} className="flex items-center">
          <DotLottieReact
            src="https://lottie.host/740ab27b-f4f0-49c5-a202-a23a70cd8e50/eNy8Ct6t4y.lottie"
            loop
            autoplay
            style={{ width: 44, height: 44 }}
          />
        </div>
      </div> */}

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            // Map stat titles to filter values
            const getFilterValue = (
              title: string,
            ): "all" | "paid" | "unpaid" | "overdue" | null => {
              if (title === "Оршин суугч" || title === "Нийт гүйлгээ")
                return "all";
              if (title === "Төлсөн") return "paid";
              if (title === "Төлөөгүй") return "unpaid";
              if (title === "Цуцласан гэрээний авлага") return "overdue";
              return null;
            };

            const filterValue = getFilterValue(stat.title);
            const isActive = filterValue && tuluvFilter === filterValue;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (filterValue) {
                    setTuluvFilter(filterValue);
                  }
                }}
                className={`relative group rounded-2xl neu-panel transition-all cursor-pointer ${
                  isActive
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:bg-[color:var(--surface-hover)] hover:scale-105"
                }`}
              >
                <div className="relative rounded-2xl p-5 overflow-hidden">
                  <div className="text-3xl  mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-theme">
                    {stat.value}
                  </div>
                  <div className="text-xs text-theme leading-tight">
                    {stat.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div
                id="dans-date"
                className="btn-minimal h-[40px] w-[320px] flex items-center px-3"
              >
                <DatePickerInput
                  type="range"
                  locale="mn"
                  value={ekhlekhOgnoo}
                  onChange={setEkhlekhOgnoo}
                  size="sm"
                  radius="md"
                  variant="filled"
                  dropdownType="popover"
                  popoverProps={{
                    position: "bottom",
                    withinPortal: true,
                    width: 320,
                  }}
                  clearable
                  placeholder="Огноо сонгох"
                  classNames={{
                    root: "!h-full !w-full",
                    input:
                      "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div id="guilgee-status-filter">
                  <TusgaiZagvar
                    value={tuluvFilter}
                    onChange={(v: string) =>
                      setTuluvFilter(v as "all" | "paid" | "unpaid" | "overdue")
                    }
                    options={[
                      { value: "all", label: "Бүгд" },
                      { value: "paid", label: "Төлсөн" },
                      { value: "overdue", label: "Цуцласан гэрээний авлага" },
                      { value: "unpaid", label: "Төлөөгүй" },
                    ]}
                    placeholder="Төлөв"
                    className="h-[40px] w-[140px]"
                  />
                </div>

                {/* Орц filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Орц:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="text"
                      value={selectedOrtsFilter}
                      onChange={(e) => setSelectedOrtsFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Тоот:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="text"
                      value={selectedTootFilter}
                      onChange={(e) => setSelectedTootFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>

                {/* Давхар filter */}
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-theme/60 whitespace-nowrap  tracking-wider font-normal">
                    Давхар:
                  </label>
                  <div className="w-[100px]">
                    <input
                      type="number"
                      min={1}
                      value={selectedDavkharFilter}
                      onChange={(e) => setSelectedDavkharFilter(e.target.value)}
                      className="w-full h-[40px] px-3 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/60 text-sm focus:outline-none focus:ring-1 focus:ring-[color:var(--theme)] focus:border-[color:var(--theme)] transition-all"
                      placeholder="Бүгд"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div ref={zaaltButtonRef} className="relative">
                <Tooltip title="Заалт">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setIsZaaltDropdownOpen(!isZaaltDropdownOpen)}
                    className="btn-minimal inline-flex items-center gap-1 h-[40px] px-2"
                    id="zaalt-btn"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden">Заалт</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isZaaltDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>
                </Tooltip>

                {isZaaltDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] menu-surface rounded-xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Excel импорт</span>
                    </button>
                    <button
                      onClick={() => {
                        exceleerTatya();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Заалт татах</span>
                    </button>
                    <button
                      onClick={() => {
                        zaaltOruulakh();
                        setIsZaaltDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Заалт жагсаалт авах</span>
                    </button>
                  </div>
                )}
              </div>
              <Tooltip title="Эхний үлдэгдэл">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={() => setIsInitialBalanceModalOpen(true)}
                    icon={<Upload className="w-5 h-5" />}
                    label="Эхний үлдэгдэл"
                    className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                  />
                </motion.div>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleExcelImport}
                className="hidden"
              />
              <Tooltip title={t("Excel татах")}>
                <motion.div
                  id="guilgee-excel-btn"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={exceleerTatya}
                    icon={<Download className="w-5 h-5" />}
                    label={t("Excel татах")}
                    className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                  />
                </motion.div>
              </Tooltip>
              <div
                className="relative flex items-center gap-2"
                ref={columnDropdownRef}
              >
                <Tooltip title="Багана">
                  <motion.div
                    id="guilgee-columns-btn"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconTextButton
                      onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
                      icon={<Columns className="w-5 h-5" />}
                      label="Багана"
                      className="w-[40px] h-[40px] !p-0 justify-center [&>span]:hidden"
                    />
                  </motion.div>
                </Tooltip>

                {ajiltan?.erkh === "Admin" && (
                  <Tooltip title="Нэхэмжлэх илгээх">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconTextButton
                        onClick={handleSendInvoices}
                        icon={
                          isSendingInvoices ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )
                        }
                        label="Нэхэмжлэх илгээх"
                        showLabelFrom="xl"
                        disabled={
                          isSendingInvoices || selectedGereeIds.length === 0
                        }
                        className={
                          selectedGereeIds.length > 0
                            ? "bg-theme text-white border-transparent hover:bg-theme/90"
                            : ""
                        }
                      />
                    </motion.div>
                  </Tooltip>
                )}

                <AnimatePresence>
                  {isColumnModalOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-64 menu-surface p-4 rounded-xl shadow-xl z-50 border border-[color:var(--surface-border)]"
                    >
                      <h4 className="text-sm  mb-3 text-theme">
                        Багана сонгох
                      </h4>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {selectableColumnDefs.map((col) => {
                          const isChecked = columnVisibility[col.key] !== false;
                          return (
                            <label
                              key={col.key}
                              className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer hover:text-theme transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setColumnVisibility((prev) => {
                                    const currentlyVisible = Object.values(
                                      prev,
                                    ).filter((v) => v !== false).length;
                                    if (isChecked && currentlyVisible <= 1)
                                      return prev;
                                    return {
                                      ...prev,
                                      [col.key]: !isChecked,
                                    };
                                  })
                                }
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={isChecked ? "text-theme" : ""}>
                                {col.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setIsKhungulultOpen(true)}
                  className="btn-minimal"
                >
                  Хөнгөлөлт
                </button>
              </motion.div> */}
            </div>
          </div>
        </div>
        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
            <div
              className="max-h-[40vh] overflow-y-auto custom-scrollbar w-full"
              id="guilgee-table"
            >
              <table className="table-ui text-sm min-w-full border border-[color:var(--surface-border)]">
                <thead>
                  <tr>
                    {visibleColumns.map((col, colIdx) => {
                      const alignClass =
                        col.align === "left"
                          ? "text-left pl-2"
                          : col.align === "right"
                            ? "text-right pr-2"
                            : "text-center";
                      const stickyClass = col.sticky
                        ? "sticky z-20 bg-[color:var(--surface-bg)]"
                        : "z-10";
                      const isLastCol = colIdx === visibleColumns.length - 1;
                      const isSortable =
                        col.key === "uldegdel" ||
                        col.key === "paid" ||
                        col.key === "toot";
                      const handleSort = () => {
                        if (!isSortable) return;
                        if (sortField === col.key) {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField(col.key);
                          setSortOrder("asc");
                        }
                      };
                      return (
                        <th
                          key={col.key}
                          className={`p-0 text-sm font-normal text-theme whitespace-nowrap ${stickyClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""} ${isSortable ? "cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors" : ""}`}
                          style={{
                            ...(col.sticky
                              ? { left: stickyOffsets[col.key] }
                              : {}),
                            minWidth: col.minWidth,
                          }}
                        >
                          {col.key === "checkbox" ? (
                            <div className="flex justify-center items-center h-full p-1">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                onChange={(e) =>
                                  handleToggleSelectAll(e.target.checked)
                                }
                                checked={
                                  paginated.length > 0 &&
                                  paginated.every((it: any) => {
                                    const gid =
                                      (it?.gereeniiId &&
                                        String(it.gereeniiId)) ||
                                      (it?.gereeId && String(it.gereeId)) ||
                                      (it?.gereeniiDugaar &&
                                        String(
                                          (contractsByNumber as any)[
                                            String(it.gereeniiDugaar)
                                          ]?._id || "",
                                        ));
                                    return (
                                      gid && selectedGereeIds.includes(gid)
                                    );
                                  })
                                }
                              />
                            </div>
                          ) : isSortable ? (
                            <button
                              type="button"
                              onClick={handleSort}
                              className={`w-full h-full p-1 inline-flex items-center gap-2 ${
                                alignClass.includes("text-left")
                                  ? "justify-start"
                                  : alignClass.includes("text-right")
                                    ? "justify-end"
                                    : "justify-center"
                              }`}
                              title={`Эрэмбэлэх: ${col.label}`}
                            >
                              <span>{col.label}</span>
                              <div className="flex flex-col items-center">
                                <ChevronUp
                                  className={`w-3 h-3 ${
                                    sortField === col.key && sortOrder === "asc"
                                      ? "text-blue-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                                <ChevronDown
                                  className={`w-3 h-3 ${
                                    sortField === col.key &&
                                    sortOrder === "desc"
                                      ? "text-blue-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              </div>
                            </button>
                          ) : (
                            <div className={`p-1 ${alignClass}`}>
                              {col.label}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        className="p-8 text-center text-theme/70"
                      >
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </td>
                    </tr>
                  ) : deduplicatedResidents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumnCount}
                        className="p-8 text-center"
                      >
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg
                            className="w-16 h-16 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="text-slate-500 ">
                            Хайсан мэдээлэл алга байна
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((it: any, idx: number) => {
                      const ct =
                        (it?.gereeniiId &&
                          contractsById[String(it.gereeniiId)]) ||
                        (it?.gereeniiDugaar &&
                          contractsByNumber[String(it.gereeniiDugaar)]) ||
                        undefined;
                      // Try multiple ways to find resident data
                      const resident =
                        (it?.orshinSuugchId &&
                          residentsById[String(it.orshinSuugchId)]) ||
                        // Sometimes resident data might be embedded in the transaction
                        (it?.orshinSuugch && typeof it.orshinSuugch === "object"
                          ? it.orshinSuugch
                          : undefined) ||
                        undefined;
                      const dugaar = String(
                        it?.gereeniiDugaar || ct?.gereeniiDugaar || "-",
                      );
                      const total = Number(
                        it?._totalTulbur ??
                          it?.niitTulbur ??
                          it?.niitDun ??
                          it?.total ??
                          it?.tulukhDun ??
                          it?.undsenDun ??
                          it?.dun ??
                          0,
                      );
                      const gidForPaid =
                        (it?.gereeniiId && String(it.gereeniiId)) ||
                        (ct?._id && String(ct._id)) ||
                        "";
                      const paidFromSummary = gidForPaid
                        ? (paidSummaryByGereeId[gidForPaid] ?? 0)
                        : 0;
                      // Enrich with authoritative paid so getPaymentStatusLabel uses it (not backend tuluv)
                      const itForTuluv = {
                        ...it,
                        _paidFromSummary: paidFromSummary,
                      };
                      let tuluvLabel: string =
                        getPaymentStatusLabel(itForTuluv);
                      if (
                        itForTuluv?.tuluv === "Цуцалсан" ||
                        itForTuluv?.status === "Цуцалсан"
                      ) {
                        tuluvLabel = "Цуцалсан";
                      }
                      const isPaid = tuluvLabel === "Төлсөн";
                      const ner = resident
                        ? [resident.ner]
                            .map((v) => (v ? String(v).trim() : ""))
                            .filter(Boolean)
                            .join(" ") || "-"
                        : [it.ner]
                            .map((v) => (v ? String(v).trim() : ""))
                            .filter(Boolean)
                            .join(" ") || "-";
                      // Get toot - prioritize toots array, then contract (geree) data
                      const residentToot =
                        Array.isArray(resident?.toots) &&
                        resident.toots.length > 0
                          ? resident.toots[0]?.toot
                          : resident?.toot;
                      const toot = String(
                        ct?.toot || residentToot || it?.toot || "-",
                      );

                      // Get utas - can be string or array
                      // Priority: resident.utas (array or string) > it.utas (array or string)
                      const utas = (() => {
                        // Check resident's utas (array)
                        if (resident?.utas) {
                          if (
                            Array.isArray(resident.utas) &&
                            resident.utas.length > 0
                          ) {
                            const firstUtas = resident.utas[0];
                            if (
                              firstUtas !== undefined &&
                              firstUtas !== null &&
                              firstUtas !== ""
                            ) {
                              return String(firstUtas);
                            }
                          } else if (
                            typeof resident.utas === "string" &&
                            resident.utas.trim() !== ""
                          ) {
                            return String(resident.utas);
                          }
                        }
                        // Check transaction item's utas (array)
                        if (it?.utas) {
                          if (Array.isArray(it.utas) && it.utas.length > 0) {
                            const firstUtas = it.utas[0];
                            if (
                              firstUtas !== undefined &&
                              firstUtas !== null &&
                              firstUtas !== ""
                            ) {
                              return String(firstUtas);
                            }
                          } else if (
                            typeof it.utas === "string" &&
                            it.utas.trim() !== ""
                          ) {
                            return String(it.utas);
                          }
                        }
                        return "-";
                      })();
                      // Get orts - prioritize toots array, then contract (geree) data
                      const residentOrts =
                        Array.isArray(resident?.toots) &&
                        resident.toots.length > 0
                          ? resident.toots[0]?.orts
                          : null;
                      const orts = String(
                        ct?.orts ??
                          ct?.ortsDugaar ??
                          ct?.ortsNer ??
                          residentOrts ??
                          resident?.orts ??
                          resident?.ortsDugaar ??
                          resident?.ortsNer ??
                          resident?.block ??
                          it?.orts ??
                          it?.ortsDugaar ??
                          it?.ortsNer ??
                          "-",
                      );
                      // Get davkhar - prioritize toots array
                      const residentDavkhar =
                        Array.isArray(resident?.toots) &&
                        resident.toots.length > 0
                          ? resident.toots[0]?.davkhar
                          : resident?.davkhar;
                      const davkhar = String(
                        residentDavkhar ?? it?.davkhar ?? "-",
                      );
                      const sentAt =
                        it?.ognoo || it?.nekhemjlekhiinOgnoo || it?.createdAt;
                      const paidAt = it?.tulsunOgnoo || it?.paidAt;
                      const lastLog =
                        paidAt != null
                          ? `Төлсөн • ${formatDate(paidAt)}`
                          : sentAt != null
                            ? `Илгээсэн • ${formatDate(sentAt)}`
                            : "-";

                      const isItemCancelled =
                        tuluvLabel === "Цуцалсан" ||
                        String(it.tuluv || "").trim() === "Цуцалсан" ||
                        String(it.status || "").trim() === "Цуцалсан" ||
                        String(it.tuluv || "")
                          .trim()
                          .toLowerCase() === "цуцалсан" ||
                        String(it.status || "")
                          .trim()
                          .toLowerCase() === "цуцалсан";

                      return (
                        <tr
                          key={it?._id || `${idx}`}
                          className={`transition-colors border-b last:border-b-0 ${isItemCancelled ? "!bg-red-100 dark:!bg-red-500" : ""}`}
                        >
                          {visibleColumns.map((col, colIdx) => {
                            const alignClass =
                              col.align === "left"
                                ? "text-left pl-2"
                                : col.key === "tulbur" ||
                                    col.key === "paid" ||
                                    col.key === "uldegdel" ||
                                    col.key === "ekhniiUldegdel"
                                  ? "text-right pr-2"
                                  : "text-center";
                            const stickyBg = isItemCancelled
                              ? "!bg-red-100 dark:!bg-red-900"
                              : "bg-[color:var(--surface-bg)]";
                            const stickyClass = col.sticky
                              ? `sticky z-10 ${stickyBg}`
                              : "";
                            const itemBg = isItemCancelled
                              ? "!bg-red-100 dark:!bg-red-900"
                              : "";
                            const isLastCol =
                              colIdx === visibleColumns.length - 1;
                            const cellClass = `p-1 text-theme whitespace-nowrap ${alignClass} ${stickyClass} ${itemBg} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`;
                            const style = {
                              ...(col.sticky
                                ? { left: stickyOffsets[col.key] }
                                : {}),
                              minWidth: col.minWidth,
                            } as React.CSSProperties;

                            switch (col.key) {
                              case "checkbox": {
                                const gid =
                                  (it?.gereeniiId && String(it.gereeniiId)) ||
                                  (it?.gereeId && String(it.gereeId)) ||
                                  (it?.gereeniiDugaar &&
                                    String(
                                      (contractsByNumber as any)[
                                        String(it.gereeniiDugaar)
                                      ]?._id || "",
                                    ));

                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    <div
                                      className="flex justify-center items-center h-full"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {gid ? (
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          checked={selectedGereeIds.includes(
                                            gid,
                                          )}
                                          onChange={(e) =>
                                            handleToggleRow(
                                              gid,
                                              e.target.checked,
                                            )
                                          }
                                        />
                                      ) : (
                                        <span className="text-gray-300">-</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                              case "index":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {(page - 1) * rowsPerPage + idx + 1}
                                  </td>
                                );
                              case "ner":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {ner}
                                  </td>
                                );
                              case "toot":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {toot}
                                  </td>
                                );
                              case "utas":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {utas}
                                  </td>
                                );
                              case "orts":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {orts}
                                  </td>
                                );
                              case "davkhar":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {davkhar}
                                  </td>
                                );
                              case "gereeniiDugaar":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {dugaar}
                                  </td>
                                );
                              case "tulbur":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {formatNumber(total)} ₮
                                  </td>
                                );
                              case "ekhniiUldegdel": {
                                const amt = Number(
                                  it?._ekhniiUldegdelAmount ?? 0,
                                );
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    <span
                                      className={
                                        amt < 0
                                          ? "!text-emerald-600 dark:!text-emerald-400"
                                          : amt > 0
                                            ? "!text-red-500 dark:!text-red-400"
                                            : "text-theme"
                                      }
                                    >
                                      {formatNumber(amt, 2)} ₮
                                    </span>
                                  </td>
                                );
                              }
                              case "paid": {
                                const gid =
                                  (it?.gereeniiId && String(it.gereeniiId)) ||
                                  (ct?._id && String(ct._id)) ||
                                  "";
                                const paid = gid
                                  ? (paidSummaryByGereeId[gid] ?? 0)
                                  : 0;
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {formatNumber(paid, 2)} ₮
                                  </td>
                                );
                              }
                              case "uldegdel": {
                                // Just show uldegdel directly from data - NO calculation
                                const remaining = Number(it?.uldegdel ?? 0);

                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    <span
                                      className={
                                        (remaining < 0
                                          ? "!text-emerald-600 dark:!text-emerald-400"
                                          : remaining > 0
                                            ? "!text-red-500 dark:!text-red-400"
                                            : "text-theme") + " "
                                      }
                                    >
                                      {formatNumber(remaining, 2)} ₮
                                    </span>
                                  </td>
                                );
                              }
                              case "tuluv":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span
                                        className={
                                          "px-2 py-0.5 rounded-full text-sm  " +
                                          (isPaid
                                            ? "badge-paid"
                                            : tuluvLabel === "Цуцалсан"
                                              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                              : tuluvLabel === "Төлөөгүй" ||
                                                  tuluvLabel ===
                                                    "Хугацаа хэтэрсэн"
                                                ? "badge-unpaid"
                                                : "badge-neutral")
                                        }
                                      >
                                        {tuluvLabel}
                                      </span>
                                    </div>
                                  </td>
                                );
                              case "lastLog":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    {lastLog}
                                  </td>
                                );
                              case "action":
                                return (
                                  <td
                                    key={col.key}
                                    className={cellClass}
                                    style={style}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          // Use uldegdel directly from data - NO calculation
                                          const contractBalance = Number(it?.uldegdel ?? 0);
                                          const residentData = resident || {
                                            _id: it?.orshinSuugchId,
                                            ner: ner,
                                            toot: toot,
                                            utas: utas,
                                            gereeniiDugaar: dugaar,
                                            gereeniiId:
                                              it?.gereeniiId || ct?._id,
                                            ...it,
                                            _contractBalance: contractBalance,
                                          };
                                          setSelectedResident(residentData);
                                          setIsModalOpen(true);
                                        }}
                                        className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors"
                                        title="Нэхэмжлэх харах"
                                      >
                                        <Eye className="w-5 h-5 text-blue-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          // Create resident-like object from transaction data
                                          const residentData = resident || {
                                            _id: it?.orshinSuugchId,
                                            ner: ner,
                                            toot: toot,
                                            utas: utas,
                                            gereeniiDugaar: dugaar,
                                            gereeniiId:
                                              it?.gereeniiId || ct?._id,
                                            ...it,
                                          };
                                          setHistoryResident(residentData);
                                          setIsHistoryOpen(true);
                                        }}
                                        className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors"
                                        title="Түүх харах"
                                      >
                                        <History className="w-5 h-5 text-green-500" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          // Create resident-like object from transaction data; include цахилгаан from geree or orshinSuugch
                                          const residentId =
                                            resident?._id ||
                                            it?.orshinSuugchId ||
                                            ct?.orshinSuugchId;
                                          const residentData = resident
                                            ? {
                                                ...it,
                                                ...resident,
                                                _id: residentId,
                                                ovog: resident.ovog ?? it?.ovog,
                                                ner: ner,
                                                toot: toot,
                                                utas: utas,
                                                gereeniiDugaar: dugaar,
                                                gereeniiId:
                                                  it?.gereeniiId || ct?._id,
                                                tsahilgaaniiZaalt:
                                                  resident.tsahilgaaniiZaalt ??
                                                  ct?.suuliinZaalt ??
                                                  ct?.umnukhZaalt,
                                                umnukhZaalt:
                                                  ct?.umnukhZaalt ??
                                                  resident.tsahilgaaniiZaalt ??
                                                  ct?.suuliinZaalt,
                                                suuliinZaalt:
                                                  ct?.suuliinZaalt ??
                                                  resident.tsahilgaaniiZaalt ??
                                                  ct?.umnukhZaalt,
                                              }
                                            : {
                                                ...it,
                                                _id: residentId,
                                                ovog: it?.ovog,
                                                ner: ner,
                                                toot: toot,
                                                utas: utas,
                                                gereeniiDugaar: dugaar,
                                                gereeniiId:
                                                  it?.gereeniiId || ct?._id,
                                                tsahilgaaniiZaalt:
                                                  ct?.suuliinZaalt ??
                                                  ct?.umnukhZaalt ??
                                                  it?.tsahilgaaniiZaalt,
                                                umnukhZaalt:
                                                  ct?.umnukhZaalt ??
                                                  ct?.suuliinZaalt,
                                                suuliinZaalt:
                                                  ct?.suuliinZaalt ??
                                                  ct?.umnukhZaalt,
                                              };
                                          setSelectedTransactionResident(
                                            residentData,
                                          );
                                          setIsTransactionModalOpen(true);
                                        }}
                                        className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors group"
                                        title="Гүйлгээ хийх"
                                      >
                                        <Banknote className="w-5 h-5 text-[color:var(--theme)] group-hover:opacity-80 transition-opacity" />
                                      </button>
                                    </div>
                                  </td>
                                );
                              default:
                                return null;
                            }
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 z-30 bg-slate-200 dark:bg-slate-800 border-t border-[color:var(--surface-border)]">
                  <tr className="">
                    {visibleColumns.map((col, colIdx) => {
                      const alignClass =
                        col.align === "right" ||
                        col.key === "tulbur" ||
                        col.key === "paid" ||
                        col.key === "uldegdel" ||
                        col.key === "ekhniiUldegdel"
                          ? "text-right pr-2"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left pl-2";
                      const stickyClass = col.sticky
                        ? "sticky z-40 bg-slate-200 dark:bg-slate-800"
                        : "";
                      const isLastCol = colIdx === visibleColumns.length - 1;

                      // Calculate totals based on column key
                      let content: React.ReactNode = "";

                      if (col.key === "gereeniiDugaar") {
                      } else if (col.key === "tulbur") {
                        // _totalTulbur now includes ekhniiUldegdel from gereeniiTulukhAvlaga
                        const total = deduplicatedResidents.reduce(
                          (sum: number, it: any) => {
                            return sum + Number(it?._totalTulbur ?? 0);
                          },
                          0,
                        );
                        content = (
                          <span className="text-theme">
                            {formatNumber(total, 2)} ₮
                          </span>
                        );
                      } else if (col.key === "ekhniiUldegdel") {
                        const total = deduplicatedResidents.reduce(
                          (sum: number, it: any) => {
                            return sum + Number(it?._ekhniiUldegdelAmount ?? 0);
                          },
                          0,
                        );
                        content = (
                          <span
                            className={
                              total < 0
                                ? "!text-emerald-600 dark:!text-emerald-400"
                                : total > 0
                                  ? "!text-red-500 dark:!text-red-400"
                                  : "text-theme"
                            }
                          >
                            {formatNumber(total, 2)} ₮
                          </span>
                        );
                      } else if (col.key === "paid") {
                        const total = deduplicatedResidents.reduce(
                          (sum: number, it: any) => {
                            const gid = getGereeId(it);
                            const paid = gid
                              ? (paidSummaryByGereeId[gid] ?? 0)
                              : 0;
                            return sum + paid;
                          },
                          0,
                        );
                        content = (
                          <span className="text-theme">
                            {formatNumber(total, 2)} ₮
                          </span>
                        );
                      } else if (col.key === "uldegdel") {
                        // Just sum uldegdel directly from data - NO calculation
                        const total = deduplicatedResidents.reduce(
                          (sum: number, it: any) => {
                            return sum + Number(it?.uldegdel ?? 0);
                          },
                          0,
                        );
                        content = (
                          <span
                            className={
                              total < 0
                                ? "!text-emerald-600 dark:!text-emerald-400"
                                : total > 0
                                  ? "!text-red-500 dark:!text-red-400"
                                  : "text-theme"
                            }
                          >
                            {formatNumber(total, 2)} ₮
                          </span>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          className={`p-1.5 whitespace-nowrap ${alignClass} ${stickyClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                          style={{
                            ...(col.sticky
                              ? { left: stickyOffsets[col.key] }
                              : {}),
                            minWidth: col.minWidth,
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 gap-3 text-md">
            <div className="text-theme/70">
              Нийт: {deduplicatedResidents.length}
            </div>

            <div className="flex items-center gap-3">
              <span id="guilgee-page-size">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setPage(1);
                  }}
                  className="text-sm px-2 py-1"
                />
              </span>

              <div id="guilgee-pagination" className="flex items-center gap-1">
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Өмнөх
                </button>
                <div className="text-theme/70 px-1">{page}</div>
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                  disabled={page * rowsPerPage >= deduplicatedResidents.length}
                  onClick={() => setPage(page + 1)}
                >
                  Дараах
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isKhungulultOpen && (
        <ModalPortal>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
              onClick={() => setIsKhungulultOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1100px] rounded-3xl overflow-hidden shadow-2xl modal-surface modal-responsive"
              onClick={(e) => e.stopPropagation()}
              ref={khungulultRef}
            >
              <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-slate-800">
                <div className=""></div>
                <button
                  onClick={() => setIsKhungulultOpen(false)}
                  className="btn-cancel btn-minimal"
                  data-modal-primary
                >
                  Хаах
                </button>
              </div>
              {/* <div className="p-2 overflow-auto max-h-[calc(90vh-48px)] ">
                <KhungulultPage />
              </div> */}
            </motion.div>
          </>
        </ModalPortal>
      )}

      {/* Invoice Modal */}
      {isModalOpen && selectedResident && (
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedResident(null);
          }}
          resident={selectedResident}
          baiguullagiinId={ajiltan?.baiguullagiinId || ""}
          token={token || ""}
          liftFloors={liftFloors}
          barilgiinId={selectedBuildingId || barilgiinId || null}
          refreshTrigger={invoiceRefreshTrigger}
        />
      )}

      {/* History Modal - Using Premium HistoryModal Component */}
      <HistoryModal
        show={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        contract={historyResident}
        token={token}
        baiguullagiinId={ajiltan?.baiguullagiinId ?? null}
        barilgiinId={selectedBuildingId || barilgiinId || null}
        onRefresh={() => {
          // Clear cache and revalidate all relevant data
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulsunAvlaga",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulukhAvlaga",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/geree",
            undefined,
            { revalidate: true },
          );

          // Clear payment summary state to force re-fetch
          setPaidSummaryByGereeId({});
          requestedGereeIdsRef.current.clear();
          setInvoiceRefreshTrigger((t) => t + 1);
        }}
      />

      {/* Per-resident history modal removed */}

      {/* Transaction Modal */}
      <TransactionModal
        show={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);
        }}
        resident={selectedTransactionResident}
        onSubmit={handleTransactionSubmit}
        isProcessing={isProcessingTransaction}
        token={token ?? undefined}
        baiguullagiinId={ajiltan?.baiguullagiinId}
        barilgiinId={effectiveBarilgiinId ?? undefined}
      />

      {/* Initial Balance Excel Import Modal */}
      <InitialBalanceExcelModal
        show={isInitialBalanceModalOpen}
        onClose={() => setIsInitialBalanceModalOpen(false)}
        baiguullagiinId={ajiltan?.baiguullagiinId || ""}
        barilgiinId={selectedBuildingId || barilgiinId || undefined}
        onSuccess={() => {
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/geree",
            undefined,
            { revalidate: true },
          );
          mutate(
            (key: any) =>
              Array.isArray(key) && key[0] === "/gereeniiTulukhAvlaga",
            undefined,
            { revalidate: true },
          );
          // Clear payment summary state to force re-fetch
          setPaidSummaryByGereeId({});
          requestedGereeIdsRef.current.clear();
        }}
      />
    </div>
  );
}
