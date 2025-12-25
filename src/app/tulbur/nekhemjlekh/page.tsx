"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import {
  Calendar,
  Eye,
  Search,
  History,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
} from "lucide-react";
import IconTextButton from "@/components/ui/IconTextButton";
import {
  getPaymentStatusLabel,
  isPaidLike,
  isUnpaidLike,
  isOverdueLike,
} from "@/lib/utils";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import LordIcon from "@/components/ui/LordIcon";
import matchesSearch from "../../../tools/function/matchesSearch";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useBuilding } from "@/context/BuildingContext";
import formatNumber from "../../../../tools/function/formatNumber";

import { url as API_URL } from "@/lib/uilchilgee";
import uilchilgee from "@/lib/uilchilgee";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";

const formatCurrency = (amount: number) => {
  return `${formatNumber(amount)} ₮`;
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4;
        margin: 1.5cm;
      }

      body * {
        visibility: hidden;
      }

      .invoice-modal,
      .invoice-modal * {
        visibility: visible !important;
      }

      .invoice-modal {
        position: static !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        page-break-after: avoid;
        page-break-before: avoid;
        page-break-inside: avoid;
      }

      .invoice-modal * {
        color: black !important;
      }

      .no-print {
        display: none !important;
      }

      .print-break {
        break-inside: avoid;
      }

      table {
        page-break-inside: avoid;
      }

      .invoice-modal h2 {
        font-size: 18pt !important;
      }
      .invoice-modal h3 {
        font-size: 14pt !important;
      }
      .invoice-modal p,
      .invoice-modal td,
      .invoice-modal th {
        font-size: 11pt !important;
      }

      .invoice-modal table {
        border-collapse: collapse;
        width: 100%;
      }

      .invoice-modal th,
      .invoice-modal td {
        border: 1px solid #000;
        padding: 8px;
        text-align: left;
      }

      .invoice-modal th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
    }
  `}</style>
);

const LocalStyles = () => (
  <style jsx global>{`
    /* Scope all overrides so they don't affect other pages */
    .no-theme-scope {
      /* Force light/neutral tokens within this scope */
      --panel-text: #0f172a;
      --btn-text: #0f172a;
      --btn-bg: #ffffff;
      --btn-bg-hover: #f8fafc;
      --btn-bg-active: #f1f5f9;
      --btn-border: rgba(15, 23, 42, 0.12);
      --surface-bg: #ffffff;
      --surface-border: rgba(15, 23, 42, 0.12);
      --glass-tint: #ffffff;
      --glass-tint-2: #ffffff;
      --glass-border: rgba(15, 23, 42, 0.12);
      color: #0f172a !important;
      background: #ffffff !important;
    }
    .no-theme-scope *,
    .no-theme-scope :where(th, td, p, span, div, button, input, select, label) {
      color: #0f172a !important;
    }
    /* Table readability on white */
    .no-theme-scope .table-ui thead {
      background: #ffffff !important;
    }
    .no-theme-scope .table-ui th,
    .no-theme-scope .table-ui td {
      color: #0f172a !important;
      border-bottom-color: #e5e7eb !important; /* gray-200 */
    }
    .no-theme-scope .table-ui tbody tr:hover {
      background: #f8fafc !important;
    }
    /* Inputs: neutral borders */
    .no-theme-scope input,
    .no-theme-scope select,
    .no-theme-scope textarea {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #e5e7eb !important;
    }
    /* Buttons: minimal/neu visible on white */
    .no-theme-scope .btn-minimal,
    .no-theme-scope .btn-minimal-ghost,
    .no-theme-scope .btn-neu {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #e5e7eb !important;
      box-shadow: none !important;
    }
    .no-theme-scope .btn-minimal:hover,
    .no-theme-scope .btn-minimal-ghost:hover,
    .no-theme-scope .btn-neu:hover {
      background: #f8fafc !important;
    }
  `}</style>
);

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
  baiguullagiinId: string;
  token: string;
  liftFloors: string[];
  barilgiinId?: string | null;
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
  return mounted
    ? createPortal(children as React.ReactNode, document.body)
    : null;
};

const InvoiceModal = ({
  isOpen,
  onClose,
  resident,
  baiguullagiinId,
  token,
  liftFloors,
  barilgiinId,
}: InvoiceModalProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useModalHotkeys({
    isOpen,
    onClose,
    container: containerRef.current,
  });
  const { selectedBuildingId } = useBuilding();
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);
  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud({
    token,
    baiguullagiinId,
    barilgiinId: selectedBuildingId || barilgiinId || null,
  });

  const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9)}`;
  const currentDate = new Date().toLocaleDateString("mn-MN");
  const isLiftExempt = liftFloors?.includes(String(resident?.davkhar));

  // Prefer backend-provided rows and total when available to avoid double-discounting
  const isLiftItem = (z: Zardal) =>
    z.zardliinTurul === "Лифт" ||
    z.ner?.trim().toLowerCase() === "лифт" ||
    z.turul?.trim().toLowerCase() === "лифт";

  const baseZardluud = (ashiglaltiinZardluud as Zardal[]) || [];

  // Latest invoice rows and total for accurate amounts
  const [invRows, setInvRows] = React.useState<any[]>([]);
  const [invTotal, setInvTotal] = React.useState<number | null>(null);
  const [latestInvoice, setLatestInvoice] = React.useState<any>(null);
  const [nekhemjlekhData, setNekhemjlekhData] = React.useState<any>(null);
  const [paymentStatusLabel, setPaymentStatusLabel] = React.useState<
    "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй"
  >("Тодорхойгүй");
  const [cronData, setCronData] = React.useState<any>(null);
  const invValid = React.useMemo(() => {
    if (!Array.isArray(invRows) || invRows.length === 0) return false;
    const invSum = invRows.reduce(
      (s: number, r: any) => s + (Number(r?.tariff) > 0 ? Number(r.tariff) : 0),
      0
    );
    return invSum > 0;
  }, [invRows]);
  React.useEffect(() => {
    const run = async () => {
      try {
        if (!isOpen || !token || !baiguullagiinId || !resident?._id) return;

        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId,
            barilgiinId: selectedBuildingId || barilgiinId || null,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
          },
        });
        const data = resp.data;
        const list = Array.isArray(data?.jagsaalt)
          ? data.jagsaalt
          : Array.isArray(data)
          ? data
          : [];
        // Filter by resident to get the correct invoice
        // Match by ovog, ner, and utas (phone number)
        const residentInvoices = list.filter((item: any) => {
          const ovogMatch =
            !resident?.ovog ||
            !item?.ovog ||
            String(item.ovog).trim() === String(resident.ovog).trim();
          const nerMatch =
            !resident?.ner ||
            !item?.ner ||
            String(item.ner).trim() === String(resident.ner).trim();
          const utasMatch =
            !resident?.utas?.[0] ||
            !item?.utas?.[0] ||
            String(item.utas?.[0] || "").trim() ===
              String(resident.utas?.[0] || "").trim();
          return ovogMatch && nerMatch && utasMatch;
        });
        const latest = [
          ...(residentInvoices.length > 0 ? residentInvoices : list),
        ].sort((a: any, b: any) => {
          // Prioritize ognoo field for sorting to get the latest document
          const aOgnoo = a?.ognoo ? new Date(a.ognoo).getTime() : 0;
          const bOgnoo = b?.ognoo ? new Date(b.ognoo).getTime() : 0;
          if (aOgnoo !== bOgnoo) {
            return bOgnoo - aOgnoo;
          }
          // Fallback to createdAt if ognoo is not available
          const aCreated = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        })[0];
        setLatestInvoice(latest || null);
        setNekhemjlekhData(latest || null);
        const zardluudRows = Array.isArray(latest?.medeelel?.zardluud)
          ? latest.medeelel.zardluud
          : Array.isArray(latest?.zardluud)
          ? latest.zardluud
          : [];
        const guilgeenuudRows = Array.isArray(latest?.medeelel?.guilgeenuud)
          ? latest.medeelel.guilgeenuud
          : Array.isArray(latest?.guilgeenuud)
          ? latest.guilgeenuud
          : [];
        const rows = [...zardluudRows, ...guilgeenuudRows];
        setPaymentStatusLabel(getPaymentStatusLabel(latest));
        const pickAmount = (obj: any) => {
          const n = (v: any) => {
            const num = Number(v);
            return Number.isFinite(num) ? num : null;
          };
          const dun = n(obj?.dun);
          if (dun !== null && dun > 0) return dun;
          const td = n(obj?.tulukhDun);
          if (td !== null && td > 0) return td;
          const tar = n(obj?.tariff);
          return tar ?? 0;
        };
        const invoiceTailbar =
          latest?.medeelel?.tailbar || latest?.tailbar || "";
        const norm = (z: any, idx: number) => ({
          _id: z._id || `inv-${idx}`,
          ner:
            z.turul === "avlaga"
              ? `${z.tailbar || z.ner || z.name || ""}(авлага) ${formatDate(
                  z.ognoo
                )}`
              : z.ner || z.name || "",
          tariff: Number(z?.tariff) || 0,
          dun: pickAmount(z),
          turul: z.turul,
          zardliinTurul: z.zardliinTurul,
          tailbar: invoiceTailbar,
        });
        setInvRows(rows.map(norm));
        const t = Number(
          latest?.niitTulbur ?? latest?.niitDun ?? latest?.total ?? 0
        );
        setInvTotal(Number.isFinite(t) ? t : null);

        // Fetch cron data
        try {
          const cronResp = await uilchilgee(token).get(
            `/nekhemjlekhCron/${baiguullagiinId}`,
            {
              params: {
                barilgiinId: selectedBuildingId || barilgiinId || null,
              },
            }
          );
          if (cronResp.data?.success && Array.isArray(cronResp.data?.data)) {
            setCronData(cronResp.data.data[0] || null);
          } else {
            setCronData(null);
          }
        } catch (cronError) {
          // Silently fail for cron data - it's optional
          setCronData(null);
        }
      } catch (e) {
        setInvRows([]);
        setInvTotal(null);
        setPaymentStatusLabel("Тодорхойгүй");
        setLatestInvoice(null);
        setCronData(null);
      }
    };
    run();
  }, [
    isOpen,
    token,
    baiguullagiinId,
    resident?._id,
    selectedBuildingId,
    barilgiinId,
  ]);

  // Use data from nekhemjlekhiinTuukh response instead of geree service
  const contractData = latestInvoice || nekhemjlekhData;
  const backendRows: Zardal[] | null = React.useMemo(() => {
    const raw =
      contractData?.medeelel?.zardluud || contractData?.zardluud || [];
    const pickAmount = (obj: any) => {
      const n = (v: any) => {
        const num = Number(v);
        return Number.isFinite(num) ? num : null;
      };
      const dun = n(obj?.dun);
      if (dun !== null && dun > 0) return dun;
      const td = n(obj?.tulukhDun);
      if (td !== null && td > 0) return td;
      const tar = n(obj?.tariff);
      return tar ?? 0;
    };
    return Array.isArray(raw)
      ? raw.map((r: any, idx: number) => ({
          _id: r._id || `row-${idx}`,
          ner: r.ner || r.name || "",
          tariff: Number(r?.tariff) || 0,
          dun: pickAmount(r),
          turul: r.turul,
          zardliinTurul: r.zardliinTurul,
        }))
      : null;
  }, [contractData]);

  const backendTotal: number | null =
    typeof contractData?.niitTulbur === "number"
      ? Number(contractData.niitTulbur)
      : null;

  const guilgeeRows = React.useMemo(() => {
    const raw =
      contractData?.medeelel?.guilgeenuud || contractData?.guilgeenuud || [];
    return Array.isArray(raw)
      ? raw.map((g: any, idx: number) => ({
          _id: g._id || `guilgee-${idx}`,
          ner: `${g.tailbar || ""}(авлага) ${formatDate(g.ognoo)}`,
          tariff: 0,
          dun: Number(g.tulukhDun) || 0,
          turul: "avlaga",
          zardliinTurul: "Авлага",
          ognoo: g.ognoo,
        }))
      : [];
  }, [contractData]);

  const invoiceRows = React.useMemo(() => {
    // Prefer guilgeenuudForNekhemjlekh if available
    if (guilgeeRows.length > 0) {
      return guilgeeRows;
    }

    // Prefer invRows from API response if available (most complete and up-to-date)
    // The API response from /nekhemjlekhiinTuukh has the complete zardluud data
    if (invRows.length > 0) {
      return invRows;
    }

    // Fall back to backendRows from contractData if invRows is not available
    if (backendRows && backendRows.length > 0) {
      const raw =
        contractData?.medeelel?.zardluud || contractData?.zardluud || [];
      const liftEntries = Array.isArray(raw)
        ? raw.filter(
            (r: any) =>
              r.zardliinTurul === "Лифт" ||
              String(r.ner || "")
                .trim()
                .toLowerCase() === "лифт" ||
              String(r.turul || "")
                .trim()
                .toLowerCase() === "лифт"
          )
        : [];
      const pickAmount = (obj: any) => {
        const n = (v: any) => {
          const num = Number(v);
          return Number.isFinite(num) ? num : null;
        };
        const dun = n(obj?.dun);
        if (dun !== null && dun > 0) return dun;
        const td = n(obj?.tulukhDun);
        if (td !== null && td > 0) return td;
        const tar = n(obj?.tariff);
        return tar ?? 0;
      };
      const liftTariffAbs =
        liftEntries.length > 0 ? Math.abs(pickAmount(liftEntries[0])) : 0;

      const nonLift = backendRows.filter((z) => !isLiftItem(z));

      // If user is lift-exempt, we show a negative line for the lift discount
      // (and hide the original lift lines). Otherwise include the lift rows
      // as normal so their tariffs are visible on the invoice.
      if (isLiftExempt) {
        if (liftTariffAbs > 0) {
          return [
            ...nonLift,
            {
              _id: "lift-discount-display",
              ner: "Лифт хөнгөлөлт",
              tariff: 0,
              dun: -liftTariffAbs,
              discount: true as const,
            } as any,
          ];
        }
        return nonLift;
      }

      // Not exempt: include all backend rows (including lift entries)
      return backendRows;
    }

    const parseNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const normalize = (z: Zardal) => {
      const dunVal =
        parseNum((z as any)?.dun) ?? parseNum((z as any)?.tulukhDun);
      const tariffVal = parseNum((z as any)?.tariff);
      const isEmpty = dunVal === null && tariffVal === null;
      if (isLiftItem(z) && isEmpty) {
        return { ...z, tariff: null, dun: null };
      }
      return {
        ...z,
        tariff: tariffVal ?? 0,
        dun: dunVal ?? tariffVal ?? 0,
      } as Zardal;
    };

    const normalized = (baseZardluud as Zardal[]).map(normalize);

    if (!isLiftExempt) return normalized;

    const nonLift = normalized.filter((z) => !isLiftItem(z));
    const liftDuns = normalized
      .filter((z) => isLiftItem(z))
      .map((z) => (z as any)?.dun)
      .filter(
        (v) =>
          v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v))
      )
      .map((v) => Number(v));

    if (liftDuns.length === 0) {
      return nonLift;
    }

    const liftSum = liftDuns.reduce((s, v) => s + v, 0);

    return [
      ...nonLift,
      {
        _id: "lift-discount-fallback",
        ner: "Лифт хөнгөлөлт",
        tariff: 0,
        dun: liftSum === 0 ? 0 : -Math.abs(liftSum),
        discount: true as const,
      } as any,
    ];
  }, [
    baseZardluud,
    isLiftExempt,
    backendRows,
    backendTotal,
    contractData,
    invRows,
    invValid,
    guilgeeRows,
  ]);

  const useBackendRows = !!(backendRows && backendRows.length > 0);

  const totalSum = React.useMemo(() => {
    if (nekhemjlekhData?.niitTulbur != null) {
      return Number(nekhemjlekhData.niitTulbur);
    }
    if (invValid && invTotal !== null) return invTotal;
    const rowSum = invoiceRows
      .filter((item: any) => !item?.discount)
      .reduce((sum: any, item: any) => sum + Number(item?.dun ?? 0), 0);
    return rowSum;
  }, [invoiceRows, invTotal, invValid, nekhemjlekhData]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <PrintStyles />
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1800px] h-[95vh] max-h-[95vh] modal-surface modal-responsive rounded-3xl shadow-2xl overflow-hidden z-[9999] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
      >
        <div className="invoice-modal h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print-break no-print rounded-t-3xl">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Үйлчилгээний нэхэмжлэх
                </h2>
                <p className="text-sm text-slate-500">
                  Нэхэмжлэхийн дугаар:{" "}
                  {contractData?.nekhemjlekhiinDugaar ||
                    nekhemjlekhData?.nekhemjlekhiinDugaar ||
                    latestInvoice?.nekhemjlekhiinDugaar ||
                    "-"}
                </p>
                <p className="text-sm text-slate-500">
                  Огноо:{" "}
                  {formatDate(
                    contractData?.ognoo ||
                      nekhemjlekhData?.ognoo ||
                      latestInvoice?.ognoo ||
                      ""
                  ) || "-"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
              aria-label="Хаах"
              title="Хаах"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-slate-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto overflow-x-auto overscroll-contain custom-scrollbar">
            <div className="grid grid-cols-2 gap-6 print-break">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {baiguullaga?.ner}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Имэйл:</span>{" "}
                    {(() => {
                      const mailFromTokhirgoo = Array.isArray(
                        (baiguullaga as any)?.tokhirgoo?.mail
                      )
                        ? (baiguullaga as any).tokhirgoo.mail[0]
                        : undefined;
                      const mailFromOrg = Array.isArray(
                        (baiguullaga as any)?.mail
                      )
                        ? (baiguullaga as any).mail[0]
                        : undefined;
                      const mailLegacy = (baiguullaga as any)?.email;
                      return (
                        mailFromTokhirgoo || mailFromOrg || mailLegacy || "-"
                      );
                    })()}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Утас:</span>{" "}
                    {(() => {
                      const utasFromTokhirgoo = Array.isArray(
                        (baiguullaga as any)?.tokhirgoo?.utas
                      )
                        ? (baiguullaga as any).tokhirgoo.utas[0]
                        : undefined;
                      const utasFromOrg = Array.isArray(
                        (baiguullaga as any)?.utas
                      )
                        ? (baiguullaga as any).utas[0]
                        : undefined;
                      const utasLegacy = (baiguullaga as any)?.utas;
                      return (
                        utasFromTokhirgoo || utasFromOrg || utasLegacy || "-"
                      );
                    })()}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Хаяг:</span>{" "}
                    {baiguullaga?.khayag || "-"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-block text-left bg-transparent p-3 rounded-xl">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Огноо:</span>{" "}
                    {formatDate(
                      contractData?.ognoo ||
                        nekhemjlekhData?.ognoo ||
                        latestInvoice?.ognoo ||
                        currentDate
                    )}
                  </p>

                  {/* {cronData && (
                    <>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">
                          Нэхэмжлэх үүсгэх өдөр:
                        </span>{" "}
                        {cronData.nekhemjlekhUusgekhOgnoo || "-"}
                      </p>
                    </>
                  )} */}
                </div>
              </div>
            </div>

            <div className="border border-blue-400 rounded-xl p-4 print-break">
              <div className="flex items-center gap-3 mb-3">
                <div>
                  <h3 className="font-medium text-slate-800">
                    {resident?.ovog} {resident?.ner}
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500">Тоот:</span>{" "}
                    {resident?.toot}
                  </p>
                  <p>
                    <span className="text-slate-500">Гэрээ №:</span>{" "}
                    {contractData?.gereeniiDugaar || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500">Утас:</span>{" "}
                    {resident?.utas}
                  </p>
                </div>
              </div>
              {/* Initial balance / note (if provided on invoice medeelel) */}
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Өмнөх сарын үлдэгдэл:
                    </span>{" "}
                    <span className="font-medium">
                      {contractData?.medeelel?.ekhniiUldegdel != null
                        ? formatCurrency(
                            Number(contractData.medeelel.ekhniiUldegdel)
                          )
                        : contractData?.ekhniiUldegdel != null
                        ? formatCurrency(Number(contractData.ekhniiUldegdel))
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden print-break">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-slate-600">
                      Зардал
                    </th>
                    <th className="py-2 px-3 text-right text-slate-600">
                      Тариф
                    </th>
                    <th className="py-2 px-3 text-right text-slate-600">
                      Тайлбар
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoiceRows.map((row: any) => (
                    <tr key={row._id}>
                      <td
                        className={`py-2 px-3 ${
                          row.discount
                            ? "text-green-700 font-medium italic"
                            : ""
                        }`}
                      >
                        {row.ner}
                      </td>
                      <td
                        className={`py-2 px-3 text-right ${
                          row.discount
                            ? "text-green-700 font-semibold line-through"
                            : ""
                        }`}
                      >
                        {row.tariff == null
                          ? "-"
                          : formatNumber(Number(row.tariff))}
                        ₮
                      </td>
                      <td
                        className={`py-2 px-3 text-right ${
                          row.discount
                            ? "text-green-700 font-semibold line-through"
                            : ""
                        }`}
                      >
                        {row.tailbar}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="py-2 px-3 font-medium">
                      Нийт дүн:
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {formatNumber(totalSum)} ₮
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="border-t border-gray-100 pt-4 print-break">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {paymentStatusLabel !== "Тодорхойгүй" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        Төлбөрийн төлөв:
                      </span>
                      <span
                        className={`badge-status ${
                          paymentStatusLabel === "Төлсөн"
                            ? "badge-paid"
                            : paymentStatusLabel === "Төлөөгүй" ||
                              paymentStatusLabel === "Хугацаа хэтэрсэн"
                            ? "badge-unpaid"
                            : "badge-unknown"
                        }`}
                      >
                        {paymentStatusLabel}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-slate-500">
                    Нийт дүн:{" "}
                    <span className="font-bold text-slate-900">
                      {formatNumber(totalSum)} ₮
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-4 no-print rounded-b-3xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="btn-minimal btn-cancel"
                data-modal-primary
              >
                Хаах
              </button>
              <button
                onClick={() => window.print()}
                className="btn-minimal btn-print"
                data-prevent-enter
              >
                Хэвлэх
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default function InvoicingZardluud() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [tuluvByResidentId, setTuluvByResidentId] = useState<
    Record<string, "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "">
  >({});
  const [dateByResidentId, setDateByResidentId] = useState<
    Record<string, string>
  >({});
  const [selectedSukh, setSelectedSukh] = useState("");
  const [selectedDavkhar, setSelectedDavkhar] = useState("");
  // Default to the currently selected building ID from context
  const [selectedBarilga, setSelectedBarilga] = useState<string>(() =>
    String(selectedBuildingId || barilgiinId || "")
  );
  const [selectedTurul, setSelectedTurul] = useState("");
  const [selectedTuluv, setSelectedTuluv] = useState("");
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  // Align DatePickerInput value/onChange with string-based dates used across the app
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [davkharList, setDavkharList] = useState<string[]>([]);
  const [barilgaList, setBarilgaList] = useState<
    Array<{ _id: string; ner: string }>
  >([]);
  const [turulList, setTurulList] = useState<string[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [liftFloors, setLiftFloors] = useState<string[]>([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const [historyResident, setHistoryResident] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud();
  const baiguullagiinId = ajiltan?.baiguullagiinId || null;
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);

  // Populate davkharList from baiguullaga tokhirgoo
  useEffect(() => {
    if (baiguullaga && baiguullaga.barilguud) {
      const effectiveBuildingId = selectedBuildingId || barilgiinId;
      const building = baiguullaga.barilguud.find(
        (b: any) => b._id === effectiveBuildingId
      );
      if (
        building &&
        building.tokhirgoo &&
        Array.isArray(building.tokhirgoo.davkhar)
      ) {
        setDavkharList(building.tokhirgoo.davkhar);
      } else {
        setDavkharList([]);
      }
    }
  }, [baiguullaga, selectedBuildingId, barilgiinId]);

  const filterQuery = useMemo(() => {
    const query: any = {};
    if (selectedDavkhar) query.davkhar = selectedDavkhar;
    // Note: selectedBarilga is now a building ID, not a name
    // The backend filter might still use barilga name, but we filter by barilgiinId on client
    if (selectedBarilga) query.barilgiinId = selectedBarilga;
    if (selectedTurul) query.turul = selectedTurul;

    return query;
  }, [selectedDavkhar, selectedBarilga, selectedTurul]);

  // Use selectedBarilga if set (and not empty), otherwise fall back to global building selection
  // Empty string means "all buildings" (null), so we don't fall back in that case
  const effectiveBarilgiinId = useMemo(() => {
    if (selectedBarilga && selectedBarilga.trim() !== "") {
      return selectedBarilga;
    }
    return selectedBuildingId || barilgiinId || null;
  }, [selectedBarilga, selectedBuildingId, barilgiinId]);

  // State for nekhemjlekhiinTuukh data (invoices/residents)
  const [nekhemjlekhList, setNekhemjlekhList] = useState<any[]>([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;

      setIsLoadingExpenses(true);
      try {
        const response = await uilchilgee(token).get("/ashiglaltiinZardluud", {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: effectiveBarilgiinId,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
          },
        });
        setExpenses(response.data?.jagsaalt || []);
      } catch (error) {
        openErrorOverlay(getErrorMessage(error));
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    fetchExpenses();
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  // Fetch nekhemjlekhiinTuukh data instead of orshinSuugch
  useEffect(() => {
    const fetchNekhemjlekh = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      setIsLoadingResidents(true);
      try {
        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            barilgiinId: effectiveBarilgiinId,
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 1000,
          },
        });
        const list = Array.isArray(resp.data?.jagsaalt)
          ? resp.data.jagsaalt
          : Array.isArray(resp.data)
          ? resp.data
          : [];
        setNekhemjlekhList(list);
      } catch (error) {
        openErrorOverlay(getErrorMessage(error));
        setNekhemjlekhList([]);
      } finally {
        setIsLoadingResidents(false);
      }
    };
    fetchNekhemjlekh();
  }, [token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]);

  // Transform nekhemjlekhiinTuukh data into resident-like structure for table display
  // Group by unique resident (ovog + ner + utas) and get the latest invoice per resident
  const residents = useMemo(() => {
    const residentMap = new Map<string, any>();

    nekhemjlekhList.forEach((invoice: any) => {
      // Create a unique key for each resident
      const key = `${invoice.ovog || ""}_${invoice.ner || ""}_${
        invoice.utas?.[0] || ""
      }`;

      // Get existing or create new resident entry
      const existing = residentMap.get(key);
      const invoiceDate = new Date(
        invoice?.createdAt || invoice?.ognoo || 0
      ).getTime();

      if (
        !existing ||
        invoiceDate >
          new Date(existing?.createdAt || existing?.ognoo || 0).getTime()
      ) {
        // Use the latest invoice data for this resident
        residentMap.set(key, {
          _id: invoice._id || key, // Use invoice ID or key as ID
          ovog: invoice.ovog || "",
          ner: invoice.ner || "",
          utas: invoice.utas || [],
          toot: invoice.medeelel?.toot || invoice.toot || "",
          davkhar: invoice.davkhar || "",
          khayag: invoice.khayag || "",
          barilgiinId: invoice.barilgiinId || "",
          baiguullagiinId: invoice.baiguullagiinId || "",
          turul: invoice.turul || "",
          gereeniiId: invoice.gereeniiId || "",
          gereeniiDugaar: invoice.gereeniiDugaar || "",
          tuluv: invoice.tuluv || "",
          niitTulbur: invoice.niitTulbur || 0,
          createdAt: invoice.createdAt || invoice.ognoo || "",
          // Keep reference to the invoice for payment status
          _invoice: invoice,
        });
      }
    });

    return Array.from(residentMap.values());
  }, [nekhemjlekhList]);

  // Extract payment status and dates from nekhemjlekhiinTuukh data (already fetched)
  useEffect(() => {
    const byResident: Record<
      string,
      { label: string; ts: number; date: string }
    > = {};

    nekhemjlekhList.forEach((invoice: any) => {
      const key = `${invoice.ovog || ""}_${invoice.ner || ""}_${
        invoice.utas?.[0] || ""
      }`;
      const label = getPaymentStatusLabel(invoice);
      const ts = new Date(
        invoice?.tulsunOgnoo || invoice?.ognoo || invoice?.createdAt || 0
      ).getTime();
      const dateStr = new Date(
        invoice?.tulsunOgnoo || invoice?.ognoo || invoice?.createdAt || 0
      )
        .toISOString()
        .split("T")[0];

      const cur = byResident[key];
      if (!cur || ts >= cur.ts) {
        byResident[key] = { label, ts, date: dateStr };
      }
    });

    // Map to resident IDs
    const tuluvMap: Record<
      string,
      "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | ""
    > = {};
    const dateMap: Record<string, string> = {};

    residents.forEach((r: any) => {
      const key = `${r.ovog || ""}_${r.ner || ""}_${r.utas?.[0] || ""}`;
      const status = byResident[key];
      if (status) {
        const label = status.label as any;
        tuluvMap[r._id] =
          label === "Төлсөн" ||
          label === "Төлөөгүй" ||
          label === "Хугацаа хэтэрсэн"
            ? label
            : "";
        dateMap[r._id] = status.date;
      }
    });

    setTuluvByResidentId(tuluvMap);
    setDateByResidentId(dateMap);
  }, [nekhemjlekhList, residents]);

  const displayResidents = useMemo(() => {
    let items = [...residents];

    // Final guard: enforce org/branch scoping on client in case backend over-returns
    const orgItems = items.filter(
      (r: any) =>
        String(r?.baiguullagiinId || "") ===
        String(ajiltan?.baiguullagiinId || "")
    );
    let branchItems = orgItems;
    if (effectiveBarilgiinId) {
      branchItems = orgItems.filter(
        (r: any) =>
          r?.barilgiinId == null ||
          String(r.barilgiinId) === String(effectiveBarilgiinId)
      );
      // If branch filter yields nothing, fall back to org-only
      if (branchItems.length === 0) {
        branchItems = orgItems;
      }
    }
    items = branchItems;

    // Use deep-search helper for broader, nested matching
    if (searchTerm && String(searchTerm).trim() !== "") {
      items = items.filter((r: any) => matchesSearch(r, searchTerm));
    }

    if (selectedTuluv) {
      items = items.filter((r: any) => {
        const id = String(r?._id || "");
        const label =
          id && tuluvByResidentId[id]
            ? (tuluvByResidentId[id] as any)
            : getPaymentStatusLabel(r);
        return label === selectedTuluv;
      });
    }

    if (selectedDavkhar)
      items = items.filter((r: any) => r.davkhar === selectedDavkhar);
    if (selectedBarilga)
      items = items.filter(
        (r: any) => String(r.barilgiinId || "") === String(selectedBarilga)
      );
    if (selectedTurul)
      items = items.filter((r: any) => r.turul === selectedTurul);

    if (selectedDate) {
      items = items.filter((r: any) => {
        const id = String(r?._id || "");
        const invoiceDate = dateByResidentId[id];
        return invoiceDate === selectedDate;
      });
    }

    return items;
  }, [
    residents,
    searchTerm,
    selectedTuluv,
    selectedDavkhar,
    selectedBarilga,
    selectedTurul,
    selectedDate,
    dateByResidentId,
    tuluvByResidentId,
    effectiveBarilgiinId,
    ajiltan?.baiguullagiinId,
  ]);

  const totalRecords = displayResidents.length;

  // Update selectedBarilga when the global building selection changes
  // Only sync if selectedBarilga is empty (user hasn't made a selection yet)
  useEffect(() => {
    const effectiveBuildingId = selectedBuildingId || barilgiinId || "";
    // Only update if local selection is empty and we have a global selection
    // This allows user to manually change the filter without it being reset
    if (
      effectiveBuildingId &&
      (!selectedBarilga || selectedBarilga.trim() === "")
    ) {
      setSelectedBarilga(String(effectiveBuildingId));
    }
  }, [selectedBuildingId, barilgiinId]);

  useEffect(() => {
    // Populate building list from baiguullaga.barilguud, not from residents
    if (baiguullaga?.barilguud && Array.isArray(baiguullaga.barilguud)) {
      const buildings = baiguullaga.barilguud
        .filter((b: any) => b && b._id && b.ner)
        .map((b: any) => ({ _id: b._id, ner: b.ner }));
      setBarilgaList(buildings);

      // If no building is selected but we have a default building ID, set it
      if (!selectedBarilga && (selectedBuildingId || barilgiinId)) {
        const defaultId = selectedBuildingId || barilgiinId;
        if (defaultId) {
          const buildingExists = buildings.some(
            (b) => b._id === String(defaultId)
          );
          if (buildingExists) {
            setSelectedBarilga(String(defaultId));
          }
        }
      }
    } else {
      setBarilgaList([]);
    }

    // Populate turul list from residents
    if (displayResidents.length > 0) {
      const uniqueTurul = [
        ...new Set(displayResidents.map((r: any) => r.turul).filter(Boolean)),
      ];
      setTurulList(uniqueTurul as string[]);
    } else {
      setTurulList([]);
    }
  }, [
    baiguullaga?.barilguud,
    displayResidents,
    selectedBuildingId,
    barilgiinId,
    selectedBarilga,
  ]);

  const handleSelectAll = () => {
    if (selectedExpenses.length === displayResidents.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(displayResidents.map((res: any) => res._id));
    }
  };

  const handleSelectExpense = (id: string) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleViewInvoice = (resident: any) => {
    setSelectedResident(resident);
    setIsModalOpen(true);
  };

  const handleOpenHistory = async (resident: any) => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    setHistoryResident(resident);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryIndex(0);
    // Clear previous items to avoid stale display while loading
    setHistoryItems([]);
    try {
      // Use nekhemjlekhiinTuukh response which already contains all contract data
      const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: selectedBuildingId || barilgiinId || null,
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 500,
        },
      });
      const data = resp.data;

      let list = Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data)
        ? data
        : [];

      // Filter by resident to show only their invoices
      const residentInvoices = list.filter((item: any) => {
        const ovogMatch =
          !resident?.ovog ||
          !item?.ovog ||
          String(item.ovog).trim() === String(resident.ovog).trim();
        const nerMatch =
          !resident?.ner ||
          !item?.ner ||
          String(item.ner).trim() === String(resident.ner).trim();
        const utasMatch =
          !resident?.utas?.[0] ||
          !item?.utas?.[0] ||
          String(item.utas?.[0] || "").trim() ===
            String(resident.utas?.[0] || "").trim();
        return ovogMatch && nerMatch && utasMatch;
      });

      setHistoryItems(residentInvoices.length > 0 ? residentInvoices : list);
    } catch (e) {
      openErrorOverlay(getErrorMessage(e));
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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
        // Prefer branch-specific entries, fallback to org defaults (no barilgiinId)
        const toStr = (v: any) => (v == null ? "" : String(v));
        const branchMatches = barilgiinId
          ? list.filter(
              (x: any) => toStr(x?.barilgiinId) === toStr(barilgiinId)
            )
          : [];
        const pickLatest = (arr: any[]) =>
          [...arr].sort(
            (a, b) =>
              new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
              new Date(a?.updatedAt || a?.createdAt || 0).getTime()
          )[0];
        let chosen =
          branchMatches.length > 0 ? pickLatest(branchMatches) : null;
        if (!chosen) {
          const orgDefaults = list.filter(
            (x: any) => x?.barilgiinId == null || toStr(x.barilgiinId) === ""
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

  const isLoading = isLoadingExpenses || isLoadingResidents;

  useEffect(() => {
    document.body.style.overflow = isModalOpen || isHistoryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isHistoryOpen]);

  // Modal keyboard shortcuts for history modal as well
  useModalHotkeys({
    isOpen: isHistoryOpen,
    onClose: () => setIsHistoryOpen(false),
    container: historyRef.current,
  });

  if (!ajiltan || !ajiltan.baiguullagiinId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Мэдээлэл ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <LocalStyles />
      {/* Hidden title for modal context */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-theme bg-clip-text text-transparent drop-shadow-sm hidden"
      >
        Зардлын нэхэмжлэл
      </motion.h1>

      <div className="space-y-8">
        {/* Enhanced Dashboard with Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(() => {
            const totalResidents = displayResidents.length;
            const paidCount = displayResidents.filter((r: any) => {
              const id = String(r?._id || "");
              const label =
                id && tuluvByResidentId[id]
                  ? (tuluvByResidentId[id] as any)
                  : getPaymentStatusLabel(r);
              return label === "Төлсөн";
            }).length;
            const unpaidCount = displayResidents.filter((r: any) => {
              const id = String(r?._id || "");
              const label =
                id && tuluvByResidentId[id]
                  ? (tuluvByResidentId[id] as any)
                  : getPaymentStatusLabel(r);
              return label === "Төлөөгүй";
            }).length;
            const totalAmount = displayResidents.reduce(
              (sum: number, r: any) => {
                // This would need actual invoice data, for now using placeholder
                return sum + (r?.totalAmount || 0);
              },
              0
            );

            const stats = [
              { title: "Нийт оршин суугч", value: totalResidents },
              { title: "Төлсөн", value: paidCount },
              { title: "Төлөөгүй", value: unpaidCount },
              {
                title: "Нийт дүн",
                value: `${formatNumber(totalAmount)} ₮`,
              },
            ];
            return stats;
          })().map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative group rounded-3xl border border-white/30 shadow-lg overflow-hidden"
              whileHover={{ scale: 1.08, rotateY: 5 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500" />
              <div className="neu-panel relative rounded-3xl p-6 backdrop-blur-xl bg-white/80 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20">
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-white/30 via-white/10 to-white/30 opacity-0"
                  initial={{ opacity: 0, x: -100 }}
                  whileHover={{ opacity: 1, x: 100 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />

                <div className="text-4xl font-bold mb-2 text-theme">
                  {stat.title === "Нийт дүн"
                    ? stat.value
                    : typeof stat.value === "number"
                    ? stat.value
                    : String(stat.value)}
                </div>
                <div className="text-sm text-gray-600 font-medium leading-tight">
                  {stat.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="rounded-3xl p-8 bg-white/90 backdrop-blur-xl shadow-xl border border-white/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <DatePickerInput
                value={selectedDate}
                onChange={(v: string | null) => setSelectedDate(v)}
                placeholder="Огноо сонгох"
                className="!w-[360px]"
                clearable
                locale="mn"
                valueFormat="YYYY-MM-DD"
                classNames={{
                  input:
                    "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-[380px]",
                }}
              />
              <TusgaiZagvar
                value={selectedTurul}
                onChange={setSelectedTurul}
                options={[
                  { value: "", label: "Гэрээний төрөл" },
                  ...turulList.map((t) => ({ value: t, label: t })),
                ]}
                placeholder="Гэрээний төрөл"
                className="h-[40px] w-[180px]"
                tone="theme"
              />
              <TusgaiZagvar
                value={selectedTuluv}
                onChange={setSelectedTuluv}
                options={[
                  { value: "", label: "Бүх төлөв" },
                  { value: "Төлсөн", label: "Төлсөн" },
                  { value: "Хугацаа хэтэрсэн", label: "Хугацаа хэтэрсэн" },
                  { value: "Төлөөгүй", label: "Төлөөгүй" },
                ]}
                placeholder="Бүх төлөв"
                className="h-[40px] w-[140px]"
                tone="theme"
              />
              <TusgaiZagvar
                value={selectedDavkhar}
                onChange={setSelectedDavkhar}
                options={[...davkharList.map((d) => ({ value: d, label: d }))]}
                placeholder="Давхар"
                className="h-[40px] w-[120px]"
                tone="theme"
              />
              <TusgaiZagvar
                value={selectedBarilga}
                onChange={(v: string) => {
                  // Allow clearing the selection to show all buildings
                  setSelectedBarilga(v || "");
                }}
                options={[
                  ...barilgaList.map((b) => ({ value: b._id, label: b.ner })),
                ]}
                placeholder={
                  selectedBarilga
                    ? barilgaList.find((b) => b._id === selectedBarilga)?.ner
                    : "Бүх барилга"
                }
                className="h-[40px] w-[250px]"
                tone="theme"
              />
            </div>

            {/* <div className="flex flex-row gap-4 w-full lg:w-auto justify-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={exceleerTatya}
                  className="btn-minimal px-6 py-3 rounded-xl"
                >
                  Excel татах
                </button>
              </motion.div>
            </div> */}
          </div>
        </motion.div>

        {/* Enhanced Table */}
        <motion.div
          className="rounded-3xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-xl border border-white/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8">
            <div className="max-h-[50vh] overflow-y-auto overflow-x-auto custom-scrollbar w-full rounded-2xl border border-gray-100">
              <table className="table-ui text-sm min-w-full">
                <thead className="bg-white/95 backdrop-blur-sm top-0 z-10 border-b border-gray-200 shadow-sm">
                  <tr>
                    <th className="p-4 text-xs font-bold text-theme text-center w-12 rounded-tl-2xl bg-white/95">
                      №
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Оршин суугч
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Тоот
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Хаяг
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Утас
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap bg-white/95">
                      Төлөв
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-theme whitespace-nowrap rounded-tr-2xl bg-white/95">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <motion.div
                          className="flex flex-col items-center justify-center space-y-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                          >
                            <svg
                              className="w-20 h-20 text-gray-300"
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
                          </motion.div>
                          <div className="text-gray-500 font-semibold text-lg">
                            Уншиж байна...
                          </div>
                          <div className="text-gray-400 text-sm">
                            Мэдээлэл ачааллаж байна
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  ) : displayResidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <motion.div
                          className="flex flex-col items-center justify-center space-y-4"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 2,
                              ease: "linear",
                            }}
                          >
                            <svg
                              className="w-20 h-20 text-gray-300"
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
                          </motion.div>
                          <div className="text-gray-500 font-semibold text-lg">
                            Хайсан мэдээлэл алга байна
                          </div>
                          <div className="text-gray-400 text-sm">
                            Шүүлтүүрийг өөрчилж үзнэ үү
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    displayResidents.map((resident: any, index: number) => (
                      <motion.tr
                        key={resident._id}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="py-4 px-4 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-left">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-theme truncate">
                                {resident.ner}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500 text-blue-800 text-sm font-medium">
                            {resident.toot || "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center text-gray-700">
                          {resident.duureg && resident.horoo && resident.davkhar
                            ? `${resident.duureg}, ${resident.horoo}, ${resident.davkhar}`
                            : resident.khayag || "Хаяг тодорхойгүй"}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center text-gray-700 font-mono">
                          {resident.utas || "-"}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          {(() => {
                            const id = String(resident?._id || "");
                            const label =
                              id && tuluvByResidentId[id]
                                ? (tuluvByResidentId[id] as any)
                                : getPaymentStatusLabel(resident);
                            const cls =
                              label === "Төлсөн"
                                ? "badge-paid"
                                : label === "Төлөөгүй" ||
                                  label === "Хугацаа хэтэрсэн"
                                ? "badge-unpaid"
                                : "badge-neutral";
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div
                            className="flex justify-center items-center gap-2"
                            style={{ minWidth: 90 }}
                          >
                            <motion.button
                              onClick={() => handleViewInvoice(resident)}
                              className="p-3 sm:p-2 rounded-xl hover:shadow-md transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Нэхэмжлэл харах"
                              style={{ minWidth: 44, minHeight: 44 }}
                            >
                              <Eye className="w-6 h-6 sm:w-4 sm:h-4 text-blue-600" />
                            </motion.button>

                            <motion.button
                              onClick={() => handleOpenHistory(resident)}
                              className="p-3 sm:p-2 rounded-xl hover:shadow-md transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Түүх"
                              style={{ minWidth: 44, minHeight: 44 }}
                            >
                              <History className="w-6 h-6 sm:w-4 sm:h-4 text-purple-600" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resident={selectedResident}
        baiguullagiinId={ajiltan?.baiguullagiinId}
        token={token || ""}
        liftFloors={liftFloors}
        barilgiinId={selectedBuildingId || barilgiinId || null}
      />

      {isHistoryOpen && (
        <ModalPortal>
          <AnimatePresence>
            <>
              <motion.div
                key="hist-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                onClick={() => setIsHistoryOpen(false)}
              />
              <motion.div
                key="hist-modal"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[900px] max-h-[90vh] modal-surface modal-responsive rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                ref={historyRef}
                role="dialog"
                aria-modal="true"
              >
                <div className="p-5 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
                  <div>
                    <h3 className="text-xl font-semibold">Түүх</h3>
                    {historyResident && (
                      <p className="text-sm">
                        {historyResident.ovog} {historyResident.ner} —{" "}
                        {historyItems.length} Нийт
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 rounded-2xl hover:menu-surface/80"
                    data-modal-primary
                  ></button>
                </div>

                <div className="relative p-6 overflow-y-auto overflow-x-auto max-h-[calc(90vh-64px)] overscroll-contain custom-scrollbar">
                  {historyLoading ? (
                    <div className="py-16 text-center">Ачааллаж байна…</div>
                  ) : historyItems.length === 0 ? (
                    <div className="py-16 text-center">
                      Түүхийн мэдээлэл олдсонгүй
                    </div>
                  ) : (
                    <>
                      <div className="relative h-[360px]">
                        {historyItems
                          .slice(historyIndex, historyIndex + 4)
                          .map((item, i) => {
                            const depth = i;
                            const translate = depth * 16;
                            const scale = 1 - depth * 0.05;
                            const z = 50 - depth;

                            const dateStr =
                              item.ognoo ||
                              item.nekhemjlekhiinOgnoo ||
                              item.createdAt;
                            const numberStr =
                              item.dugaalaltDugaar ??
                              item.gereeniiDugaar ??
                              item.invoiceNo ??
                              "-";
                            const zardluudRows = Array.isArray(
                              item.medeelel?.zardluud
                            )
                              ? item.medeelel.zardluud
                              : Array.isArray(item.zardluud)
                              ? item.zardluud
                              : [];
                            const guilgeenuudRows = Array.isArray(
                              item.medeelel?.guilgeenuud
                            )
                              ? item.medeelel.guilgeenuud
                              : Array.isArray(item.guilgeenuud)
                              ? item.guilgeenuud
                              : [];
                            const rows = [...zardluudRows, ...guilgeenuudRows];

                            // Calculate total from expense items for accuracy
                            const total =
                              rows.reduce((sum: number, z: any) => {
                                const n = (v: any) => {
                                  const num = Number(v);
                                  return Number.isNaN(num) ? null : num;
                                };
                                const dun = n(z?.dun);
                                if (dun !== null && dun > 0) return sum + dun;
                                const td = n(z?.tulukhDun);
                                if (td !== null && td > 0) return sum + td;
                                const tariff = n(z?.tariff);
                                return sum + (tariff ?? 0);
                              }, 0) ||
                              Number(
                                item.niitTulbur ??
                                  item.niitDun ??
                                  item.total ??
                                  0
                              );

                            return (
                              <div
                                key={item._id || `${item.sar}-${i}`}
                                className="absolute inset-x-0 mx-auto w-[92%] menu-surface border rounded-2xl shadow-lg p-5 transition-transform"
                                style={{
                                  transform: `translateY(${translate}px) scale(${scale})`,
                                  zIndex: z,
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm">
                                      Огноо:{" "}
                                      <span className="font-medium">
                                        {dateStr
                                          ? new Date(
                                              dateStr
                                            ).toLocaleDateString("mn-MN")
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs">Нийт дүн</div>
                                    <div className="text-xl font-bold">
                                      {formatCurrency(total)}
                                    </div>
                                    <div className="mt-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                          total === 0
                                            ? "badge-paid"
                                            : "badge-unpaid"
                                        }`}
                                      >
                                        {total === 0
                                          ? "Төлөгдсөн"
                                          : "Төлөгдөөгүй"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Show initial balance/note for this history item if present */}
                                {(item?.medeelel?.ekhniiUldegdel != null ||
                                  item?.ekhniiUldegdel != null ||
                                  item?.medeelel?.ekhniiUldegdelUsgeer ||
                                  item?.ekhniiUldegdelUsgeer) && (
                                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-slate-500">
                                        Эхний үлдэгдэл:
                                      </span>{" "}
                                      <span className="font-medium">
                                        {item?.medeelel?.ekhniiUldegdel != null
                                          ? formatCurrency(
                                              Number(
                                                item.medeelel.ekhniiUldegdel
                                              )
                                            )
                                          : item?.ekhniiUldegdel != null
                                          ? formatCurrency(
                                              Number(item.ekhniiUldegdel)
                                            )
                                          : "-"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">
                                        Тайлбар:
                                      </span>{" "}
                                      <span className="font-medium">
                                        {item?.medeelel?.ekhniiUldegdelUsgeer ||
                                          item?.ekhniiUldegdelUsgeer ||
                                          "-"}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {rows.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                    {rows.map((z: any, zi: number) => {
                                      const amount = (() => {
                                        const n = (v: any) => {
                                          const num = Number(v);
                                          return Number.isNaN(num) ? null : num;
                                        };
                                        const dun = n(z?.dun);
                                        if (dun !== null && dun > 0) return dun;
                                        const td = n(z?.tulukhDun);
                                        if (td !== null && td > 0) return td;

                                        const tariff = n(z?.tariff);
                                        return tariff ?? 0;
                                      })();

                                      return (
                                        <div
                                          key={zi}
                                          className="flex items-center justify-between"
                                        >
                                          <span className="truncate">
                                            {z.ner || z.name}
                                          </span>
                                          <span className="font-medium">
                                            {formatNumber(amount)} ₮
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <IconTextButton
                          variant="minimal"
                          disabled={historyIndex <= 0}
                          onClick={() =>
                            setHistoryIndex((i) => Math.max(0, i - 1))
                          }
                          icon={<ChevronLeft className="w-4 h-4" />}
                          label="Өмнөх"
                          showLabelFrom="sm"
                        />
                        <div className="text-sm">
                          {Math.min(historyIndex + 1, historyItems.length)} /{" "}
                          {historyItems.length}
                        </div>
                        <IconTextButton
                          variant="minimal"
                          disabled={historyIndex >= historyItems.length - 1}
                          onClick={() =>
                            setHistoryIndex((i) =>
                              Math.min(historyItems.length - 1, i + 1)
                            )
                          }
                          icon={<ChevronRight className="w-4 h-4" />}
                          label="Дараах"
                          showLabelFrom="sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          </AnimatePresence>
        </ModalPortal>
      )}
    </div>
  );
}
