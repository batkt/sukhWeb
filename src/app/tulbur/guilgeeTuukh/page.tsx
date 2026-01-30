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
import { message } from "antd";
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
  FileSpreadsheet,
  Eye,
  History,
  Columns,
  Banknote,
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
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TransactionModal, { type TransactionData } from "../modals/TransactionModal";
import HistoryModal from "../../geree/modals/HistoryModal";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

const formatCurrency = (amount: number) => {
  return `${formatNumber(amount)} ₮`;
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
  return mounted ? createPortal(children as any, document.body) : null;
};

type DateRangeValue = [string | null, string | null] | undefined;

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
  const ashiglaltParams = useMemo(() => ({
    token,
    baiguullagiinId,
    barilgiinId: selectedBuildingId || barilgiinId || null,
  }), [token, baiguullagiinId, selectedBuildingId, barilgiinId]);

  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud(ashiglaltParams);

  const invoiceNumber = `INV-${Math.random().toString(36).substr(2, 9)}`;
  const currentDate = new Date().toLocaleDateString("mn-MN");
  const isLiftExempt = liftFloors?.includes(String(resident?.davkhar));

  const isLiftItem = (z: Zardal) =>
    z.zardliinTurul === "Лифт" ||
    z.ner?.trim().toLowerCase() === "лифт" ||
    z.turul?.trim().toLowerCase() === "лифт";

  const baseZardluud = (ashiglaltiinZardluud as Zardal[]) || [];

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
      0,
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
          const aOgnoo = a?.ognoo ? new Date(a.ognoo).getTime() : 0;
          const bOgnoo = b?.ognoo ? new Date(b.ognoo).getTime() : 0;
          if (aOgnoo !== bOgnoo) {
            return bOgnoo - aOgnoo;
          }
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
                z.ognoo,
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
          latest?.niitTulbur ?? latest?.niitDun ?? latest?.total ?? 0,
        );
        setInvTotal(Number.isFinite(t) ? t : null);

        try {
          const cronResp = await uilchilgee(token).get(
            `/nekhemjlekhCron/${baiguullagiinId}`,
            {
              params: {
                barilgiinId: selectedBuildingId || barilgiinId || null,
              },
            },
          );
          if (cronResp.data?.success && Array.isArray(cronResp.data?.data)) {
            setCronData(cronResp.data.data[0] || null);
          } else {
            setCronData(null);
          }
        } catch (cronError) {
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
    if (guilgeeRows.length > 0) {
      return guilgeeRows;
    }
    if (invRows.length > 0) {
      return invRows;
    }
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
              .toLowerCase() === "лифт",
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
          v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v)),
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
    contractData,
    invRows,
    guilgeeRows,
  ]);

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
                <h2 className="text-xl  text-slate-800">
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
                    "",
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
                <h3 className="text-xl  text-slate-800 mb-3">
                  {baiguullaga?.ner}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Имэйл:</span>{" "}
                    {(() => {
                      const mailFromTokhirgoo = Array.isArray(
                        (baiguullaga as any)?.tokhirgoo?.mail,
                      )
                        ? (baiguullaga as any).tokhirgoo.mail[0]
                        : undefined;
                      const mailFromOrg = Array.isArray(
                        (baiguullaga as any)?.mail,
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
                        (baiguullaga as any)?.tokhirgoo?.utas,
                      )
                        ? (baiguullaga as any).tokhirgoo.utas[0]
                        : undefined;
                      const utasFromOrg = Array.isArray(
                        (baiguullaga as any)?.utas,
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
                      currentDate,
                    )}
                  </p>
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
                    {resident?.toots?.[0]?.toot || resident?.toot}
                  </p>
                  <p>
                    <span className="text-slate-500">Гэрээ №:</span>{" "}
                    {contractData?.gereeniiDugaar || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500">Утас:</span>{" "}
                    {Array.isArray(resident?.utas)
                      ? resident.utas[0]
                      : resident?.utas || "-"}
                  </p>
                </div>
              </div>

              {/* <div className="mt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Өмнөх сарын үлдэгдэл:
                    </span>{" "}
                    <span className="font-medium">
                      {contractData?.medeelel?.ekhniiUldegdel != null
                        ? formatCurrency(
                            Number(contractData.medeelel.ekhniiUldegdel),
                          )
                        : contractData?.ekhniiUldegdel != null
                          ? formatCurrency(Number(contractData.ekhniiUldegdel))
                          : "-"}
                    </span>
                  </div>
                </div>
              </div> */}
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
                        className={`py-2 px-3 ${row.discount
                          ? "text-green-700 font-medium italic"
                          : ""
                          }`}
                      >
                        {row.ner}
                      </td>
                      <td
                        className={`py-2 px-3 text-right ${row.discount
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
                        className={`py-2 px-3 text-right ${row.discount
                          ? "text-green-700 font-semibold line-through"
                          : ""
                          }`}
                      >
                        {row.tailbar}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-700">
                      Нийт дүн:
                    </td>
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3 text-right font-bold text-theme">
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
                        className={`badge-status ${paymentStatusLabel === "Төлсөн"
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
                    <span className=" text-slate-900">
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

export default function DansniiKhuulga() {
  const { mutate } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { searchTerm } = useSearch();
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;

  // Memoize empty objects to prevent infinite SWR re-validation loops
  const emptyQuery = useMemo(() => ({}), []);

  const [ekhlekhOgnoo, setEkhlekhOgnoo] = useState<DateRangeValue>(undefined);
  const [tuluvFilter, setTuluvFilter] = useState<
    "all" | "paid" | "unpaid" | "overdue"
  >("all");
  const [selectedOrtsFilter, setSelectedOrtsFilter] = useState<string>("");
  const [selectedDavkharFilter, setSelectedDavkharFilter] = useState<string>("");
  const [isKhungulultOpen, setIsKhungulultOpen] = useState(false);
  const khungulultRef = useRef<HTMLDivElement | null>(null);
  const [isZaaltDropdownOpen, setIsZaaltDropdownOpen] = useState(false);
  const zaaltButtonRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionResident, setSelectedTransactionResident] = useState<any>(null);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  // Map gereeId -> total paid amount (Төлсөн дүн)
  const [paidSummaryByGereeId, setPaidSummaryByGereeId] = useState<
    Record<string, number>
  >({});
  const [paidSummaryRequested, setPaidSummaryRequested] = useState<
    Record<string, boolean>
  >({});
  // Use a ref to track what's currently being requested across renders without causing loops
  const requestedGereeIdsRef = useRef<Set<string>>(new Set());

  const columnDefs = useMemo(
    () => [
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
      { key: "paid", label: "Төлсөн дүн", align: "center", minWidth: 110 },
      { key: "uldegdel", label: "Үлдэгдэл", align: "center", minWidth: 110 },
      { key: "tuluv", label: "Төлөв", align: "center", minWidth: 110 },
      {
        key: "lastLog",
        label: "Огноо",
        align: "center",
        minWidth: 140,
      },
      { key: "action", label: "Үйлдэл", align: "center", minWidth: 130 },
    ],
    []
  );
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() =>
    columnDefs.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const visibleColumns = useMemo(
    () => columnDefs.filter((col) => columnVisibility[col.key] !== false),
    [columnDefs, columnVisibility]
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
      ]
      : null,
    async ([url, tkn, orgId, branch]: [
      string,
      string,
      string,
      string | null
    ]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: orgId,
          ...(branch ? { barilgiinId: branch } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 20000,
          query: {
            baiguullagiinId: orgId,
            ...(branch ? { barilgiinId: branch } : {}),
          },
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const allHistoryItems = useMemo(() => {
    const raw = Array.isArray(historyData?.jagsaalt)
      ? historyData.jagsaalt
      : Array.isArray(historyData)
        ? historyData
        : [];
    if (!ekhlekhOgnoo || (!ekhlekhOgnoo[0] && !ekhlekhOgnoo[1])) return raw;
    const [start, end] = ekhlekhOgnoo;
    const s = start ? new Date(start).getTime() : Number.NEGATIVE_INFINITY;
    const e = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;
    return raw.filter((it: any) => {
      const d = new Date(
        it?.tulsunOgnoo || it?.ognoo || it?.createdAt || 0
      ).getTime();
      return d >= s && d <= e;
    });
  }, [historyData, ekhlekhOgnoo]);

  const { gereeGaralt } = useGereeJagsaalt(
    emptyQuery,
    token || undefined,
    ajiltan?.baiguullagiinId,
    effectiveBarilgiinId
  );
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    emptyQuery,
    effectiveBarilgiinId
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
        it?.barilgiinId ?? it?.barilga ?? it?.barilgaId ?? it?.branchId
      );
      if (itemBid) return itemBid === bid;
      // Derive from linked contract or resident if barilgiinId absent
      const cId = toStr(
        it?.gereeId ??
        it?.gereeniiId ??
        it?.contractId ??
        it?.kholbosonGereeniiId
      );
      const rId = toStr(it?.orshinSuugchId ?? it?.residentId);
      const c = cId ? (contractsById as any)[cId] : undefined;
      const r = rId ? (residentsById as any)[rId] : undefined;
      const cbid = toStr(
        c?.barilgiinId ?? c?.barilga ?? c?.barilgaId ?? c?.branchId
      );
      const rbid = toStr(
        r?.barilgiinId ?? r?.barilga ?? r?.barilgaId ?? r?.branchId
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
      return status === "Цуцалсан" || status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" || status.toLowerCase() === "tsutlsasan";
    });

    cancelledGerees.forEach((g: any) => {
      if (g?._id) cancelledGereeIds.add(String(g._id));
      if (g?.gereeniiDugaar) cancelledGereeDugaars.add(String(g.gereeniiDugaar));
    });

    return buildingHistoryItems.filter((it: any) => {
      const paid = isPaidLike(it);
      if (tuluvFilter === "paid") return paid;
      if (tuluvFilter === "unpaid")
        return isUnpaidLike(it) && !isOverdueLike(it);
      if (tuluvFilter === "overdue") {
        // Filter for cancelled receivables: items linked to cancelled gerees with unpaid invoices/zardal
        const itGereeId = String(it?.gereeniiId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const isLinkedToCancelledGeree = cancelledGereeIds.has(itGereeId) ||
          cancelledGereeDugaars.has(itGereeDugaar);

        if (!isLinkedToCancelledGeree) return false;

        // Check if invoice has unpaid amount
        const amount = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0);
        const isUnpaid = !isPaidLike(it) && amount > 0;

        // Check if invoice has zardal (expenses) that need to be paid
        const hasZardal = Array.isArray(it?.medeelel?.zardluud) &&
          it.medeelel.zardluud.length > 0;
        const hasGuilgee = Array.isArray(it?.medeelel?.guilgeenuud) &&
          it.medeelel.guilgeenuud.length > 0;

        return isUnpaid && (hasZardal || hasGuilgee || amount > 0);
      }

      // Additional filters: Орц and Давхар
      if (selectedOrtsFilter || selectedDavkharFilter) {
        const toStr = (v: any) => (v == null ? "" : String(v).trim());

        const cId = toStr(
          it?.gereeniiId ??
          it?.gereeId ??
          it?.kholbosonGereeniiId
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
          it?.ortsNer
        );
        const davkhar = toStr(
          r?.davkhar ?? c?.davkhar ?? it?.davkhar
        );

        if (selectedOrtsFilter) {
          if (!orts || orts !== toStr(selectedOrtsFilter)) return false;
        }
        if (selectedDavkharFilter) {
          if (!davkhar || davkhar !== toStr(selectedDavkharFilter)) return false;
        }
      }

      if (searchTerm) {
        if (!matchesSearch(it, searchTerm)) return false;
      }

      return true;
    });
  }, [
    buildingHistoryItems,
    tuluvFilter,
    searchTerm,
    gereeGaralt?.jagsaalt,
    contractsById,
    residentsById,
    selectedOrtsFilter,
    selectedDavkharFilter,
  ]);

  const totalSum = useMemo(() => {
    return filteredItems.reduce((s: number, it: any) => {
      const v = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
      return s + v;
    }, 0);
  }, [filteredItems]);

  // Deduplicate by resident (orshinSuugchId or ner+utas combination)
  const deduplicatedResidents = useMemo(() => {
    const map = new Map<string, any>();

    filteredItems.forEach((it: any) => {
      // Create a unique key for each resident
      const residentId = String(it?.orshinSuugchId || "").trim();
      const ner = String(it?.ner || "").trim().toLowerCase();
      const utas = (() => {
        if (Array.isArray(it?.utas) && it.utas.length > 0) {
          return String(it.utas[0] || "").trim();
        }
        return String(it?.utas || "").trim();
      })();
      const toot = String(it?.toot || it?.medeelel?.toot || "").trim();

      // Use residentId if available, otherwise use ner+utas+toot as key
      const key = residentId || `${ner}|${utas}|${toot}`;

      if (!key || key === "||") return; // Skip if no valid identifier

      if (!map.has(key)) {
        // First occurrence - store as base record
        map.set(key, {
          ...it,
          _historyCount: 1,
          _totalTulbur: Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0,
          _totalTulsun: Number(it?.tulsunDun ?? 0) || 0,
        });
      } else {
        // Aggregate values
        const existing = map.get(key);
        existing._historyCount += 1;
        existing._totalTulbur += Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0) || 0;
        existing._totalTulsun += Number(it?.tulsunDun ?? 0) || 0;
      }
    });

    return Array.from(map.values());
  }, [filteredItems]);

  const totalPages = Math.max(1, Math.ceil(deduplicatedResidents.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    return deduplicatedResidents.slice(
      (page - 1) * rowsPerPage,
      page * rowsPerPage
    );
  }, [deduplicatedResidents, page, rowsPerPage]);

  // Fetch total paid amount (Төлсөн дүн) per geree using /geree/tulsunSummary
  // CRITICAL FIX: Only fetch for the CURRENTLY VISIBLE (paginated) items.
  // This prevents firing 20,000 requests at once and stops the infinite loop.
  useEffect(() => {
    if (!token || !ajiltan?.baiguullagiinId || paginated.length === 0) return;

    const baiguullagiinId = ajiltan.baiguullagiinId;

    paginated.forEach((it: any) => {
      const gid =
        (it?.gereeniiId && String(it.gereeniiId)) ||
        (it?.gereeId && String(it.gereeId)) ||
        (it?.gereeniiDugaar &&
          String(
            (contractsByNumber as any)[String(it.gereeniiDugaar)]?._id || ""
          ));

      if (!gid) return;

      // If we already have the data or are currently fetching it, skip
      if (paidSummaryByGereeId[gid] !== undefined || requestedGereeIdsRef.current.has(gid)) {
        return;
      }

      // Mark as requested IMMEDIATELY to prevent concurrent duplicate requests
      requestedGereeIdsRef.current.add(gid);

      uilchilgee(token)
        .post("/tulsunSummary", {
          baiguullagiinId,
          gereeniiId: gid,
        })
        .then((resp) => {
          const total =
            Number(resp.data?.totalTulsunDun ?? resp.data?.totalInvoicePayment ?? 0) ||
            0;
          setPaidSummaryByGereeId((prev) => ({ ...prev, [gid]: total }));
        })
        .catch(() => {
          // On error, let it be eligible for retry if the user re-pages or refreshes
          requestedGereeIdsRef.current.delete(gid);
        });
    });
  }, [
    token,
    ajiltan?.baiguullagiinId,
    paginated, // Dependency on current page items ensures we only fetch what the user sees
    contractsByNumber,
    // CRITICAL: paidSummaryByGereeId MUST NOT be here as it's updated inside this effect
  ]);

  // Count cancelled gerees with unpaid invoices/zardal
  const cancelledGereesWithUnpaid = useMemo(() => {
    const cancelledGereeIds = new Set<string>();
    const allGerees = (gereeGaralt?.jagsaalt || []) as any[];

    // Find cancelled gerees
    const cancelledGerees = allGerees.filter((g: any) => {
      const status = String(g?.tuluv || g?.status || "").trim();
      return status === "Цуцалсан" || status.toLowerCase() === "цуцалсан" ||
        status === "tsutlsasan" || status.toLowerCase() === "tsutlsasan";
    });

    // For each cancelled geree, check if it has unpaid invoices/zardal
    cancelledGerees.forEach((geree: any) => {
      const gereeId = String(geree?._id || "");
      const gereeDugaar = String(geree?.gereeniiDugaar || "");

      // Check if there are unpaid invoices linked to this geree
      const hasUnpaidInvoice = buildingHistoryItems.some((it: any) => {
        const itGereeId = String(it?.gereeniiId || "");
        const itGereeDugaar = String(it?.gereeniiDugaar || "");
        const matchesGeree = (gereeId && itGereeId === gereeId) ||
          (gereeDugaar && itGereeDugaar === gereeDugaar);

        if (!matchesGeree) return false;

        // Check if invoice has unpaid amount
        const amount = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0);
        const isUnpaid = !isPaidLike(it) && amount > 0;

        // Check if invoice has zardal (expenses) that need to be paid
        const hasZardal = Array.isArray(it?.medeelel?.zardluud) &&
          it.medeelel.zardluud.length > 0;
        const hasGuilgee = Array.isArray(it?.medeelel?.guilgeenuud) &&
          it.medeelel.guilgeenuud.length > 0;

        return isUnpaid && (hasZardal || hasGuilgee || amount > 0);
      });

      if (hasUnpaidInvoice && gereeId) {
        cancelledGereeIds.add(gereeId);
      }
    });

    return cancelledGereeIds.size;
  }, [gereeGaralt?.jagsaalt, buildingHistoryItems]);

  const stats = useMemo(() => {
    const residentCount = deduplicatedResidents.length;
    const totalCount = filteredItems.length;
    const paidCount = filteredItems.filter((it: any) => isPaidLike(it)).length;
    const unpaidCount = filteredItems.filter(
      (it: any) => isUnpaidLike(it) && !isOverdueLike(it)
    ).length;

    return [
      { title: "Оршин суугч", value: residentCount },
      { title: "Нийт гүйлгээ", value: totalCount },
      { title: "Төлсөн", value: paidCount },
      { title: "Төлөөгүй", value: unpaidCount },
    ];
  }, [filteredItems, deduplicatedResidents, cancelledGereesWithUnpaid]);

  const zaaltOruulakh = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const hide = message.loading({
        content: "Заалтын Excel файл бэлдэж байна…",
        duration: 0,
      });

      const response = await uilchilgee(token).post(
        "/zaaltExcelDataAvya",
        {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
        },
        {
          responseType: "blob" as any,
        }
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
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1]
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

      message.success("Заалтын мэдээлэл амжилттай татагдлаа");
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      openErrorOverlay(errorMsg);
    }
  };

  const exceleerTatya = async () => {
    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
        return;
      }

      const body = {
        baiguullagiinId: ajiltan.baiguullagiinId,
        barilgiinId: effectiveBarilgiinId || null,
      };

      const path = "/zaaltExcelTemplateAvya";
      const hide = message.loading({
        content: "Excel загвар бэлдэж байна…",
        duration: 0,
      });
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
            { responseType: "blob" as any, baseURL: undefined as any }
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
          cd.match(/filename\*=UTF-8''([^;]+)/i)![1]
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
      message.success("Excel загвар татагдлаа");
    } catch (e) {
      console.error(e);
      message.error("Excel загвар татахад алдаа гарлаа");
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

      // Only mark as paid when transaction type is "busad" (Төлөлт)
      // For other types (avlaga, ashiglalt), create a transaction record without marking as paid
      if (data.type === "busad") {
        // Payment: mark invoices as paid
        const response = await uilchilgee(token).post("/markInvoicesAsPaid", {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          dun: data.amount,
          orshinSuugchId: data.residentId,
          gereeniiId: data.gereeniiId,
          tailbar: data.tailbar || `Төлөлт - ${data.date}`,
          markEkhniiUldegdel: false,
          createdBy: ajiltan._id,
          createdAt: new Date().toISOString(),
        });

        if (response.data.success || response.status === 200) {
          message.success("Төлөлт амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);
          // Refresh the history data - use filter to match any key containing nekhemjlekhiinTuukh
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true }
          );
        }
      } else {
        // Other transaction types (avlaga, ashiglalt): create a transaction record without marking as paid
        const response = await uilchilgee(token).post("/gereeniiGuilgeeKhadgalya", {
          baiguullagiinId: ajiltan.baiguullagiinId,
          barilgiinId: effectiveBarilgiinId,
          tukhainBaaziinKholbolt: ajiltan?.tukhainBaaziinKholbolt,
          turul: data.type,
          tulukhDun: data.amount,
          dun: data.amount,
          orshinSuugchId: data.residentId,
          gereeniiId: data.gereeniiId,
          tailbar: data.tailbar || `${data.type === "avlaga" ? "Авлага" : data.type === "ashiglalt" ? "Ашиглалт" : data.type} - ${data.date}`,
          ognoo: data.date,
          ekhniiUldegdelEsekh: data.ekhniiUldegdel, // Pass the initial balance flag
          createdBy: ajiltan._id,
          createdAt: new Date().toISOString(),
        });

        if (response.data.success || response.status === 200 || response.status === 201) {
          message.success("Гүйлгээ амжилттай бүртгэгдлээ");
          setIsTransactionModalOpen(false);
          setSelectedTransactionResident(null);
          // Refresh the history data - use filter to match any key containing nekhemjlekhiinTuukh
          mutate(
            (key: any) => Array.isArray(key) && key[0] === "/nekhemjlekhiinTuukh",
            undefined,
            { revalidate: true }
          );
        }
      }
    } catch (error: any) {
      openErrorOverlay(getErrorMessage(error));
    } finally {
      setIsProcessingTransaction(false);
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
      message.error("Зөвхөн Excel файл (.xlsx, .xls) оруулна уу");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      if (!token || !ajiltan?.baiguullagiinId) {
        message.warning("Нэвтэрсэн эсэхээ шалгана уу");
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

      message.loading({
        content: "Excel импорт хийж байна…",
        key: "import",
        duration: 0,
      });

      const resp: any = await uilchilgee(token).post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.destroy("import");

      const data = resp?.data;
      const failed = data?.result?.failed;
      if (Array.isArray(failed) && failed.length > 0) {
        const detailLines = failed.map(
          (f: any) => `Мөр ${f.row || "?"}: ${f.error || f.message || "Алдаа"}`
        );
        const details = detailLines.join("\n");
        const topMsg =
          data?.message || "Импортын явцад зарим мөр алдаатай байна";
        openErrorOverlay(`${topMsg}\n${details}`);
      } else {
        message.success("Excel импорт амжилттай");
        // Refresh the page data by reloading
        window.location.reload();
      }
    } catch (err: any) {
      message.destroy("import");
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
      const residentId = String(resident?._id || resident?.orshinSuugchId || "").trim();
      const residentGereeId = String(resident?.gereeniiId || "").trim();
      const residentGereeDugaar = String(resident?.gereeniiDugaar || "").trim();
      const residentToot = String(resident?.toot || "").trim();
      const residentNer = String(resident?.ner || "").trim().toLowerCase();
      const residentOvog = String(resident?.ovog || "").trim().toLowerCase();
      const residentUtas = Array.isArray(resident?.utas)
        ? String(resident.utas[0] || "").trim()
        : String(resident?.utas || "").trim();

      // Filter using multiple matching strategies
      const residentInvoices = list.filter((item: any) => {
        // Strategy 1: Match by orshinSuugchId
        if (residentId && String(item?.orshinSuugchId || "").trim() === residentId) {
          return true;
        }

        // Strategy 2: Match by gereeniiId
        if (residentGereeId && String(item?.gereeniiId || "").trim() === residentGereeId) {
          return true;
        }

        // Strategy 3: Match by gereeniiDugaar
        if (residentGereeDugaar && String(item?.gereeniiDugaar || "").trim() === residentGereeDugaar) {
          return true;
        }

        // Strategy 4: Match by toot + ner (if both exist)
        if (residentToot && residentNer) {
          const itemToot = String(item?.toot || item?.medeelel?.toot || "").trim();
          const itemNer = String(item?.ner || "").trim().toLowerCase();
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
          const itemOvog = String(item?.ovog || "").trim().toLowerCase();
          const itemNer = String(item?.ner || "").trim().toLowerCase();
          if (itemOvog === residentOvog && itemNer === residentNer) {
            return true;
          }
        }

        return false;
      });

      console.log("📜 History filter result:", {
        resident: { id: residentId, gereeId: residentGereeId, gereeDugaar: residentGereeDugaar, toot: residentToot, ner: residentNer },
        totalItems: list.length,
        matchedItems: residentInvoices.length
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
      } catch { }
    };
    fetchLiftFloors();
  }, [token, ajiltan?.baiguullagiinId, barilgiinId, selectedBuildingId]);

  // Handle modal body overflow
  useEffect(() => {
    document.body.style.overflow =
      isModalOpen || isHistoryOpen ? "hidden" : "";
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
    []
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
            const getFilterValue = (title: string): "all" | "paid" | "unpaid" | "overdue" | null => {
              if (title === "Нийт гүйлгээ") return "all";
              if (title === "Төлсөн") return "paid";
              if (title === "Төлөөгүй") return "unpaid";
              if (title === "Цуцласан авлага") return "overdue";
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
                className={`relative group rounded-2xl neu-panel transition-all cursor-pointer ${isActive
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
              <div id="dans-date" className="btn-minimal h-[40px] w-[320px] flex items-center px-3">
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
                      { value: "overdue", label: "Цуцласан авлага" },
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

            <div className="flex items-center gap-3">
              <div ref={zaaltButtonRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsZaaltDropdownOpen(!isZaaltDropdownOpen)}
                  className="btn-minimal inline-flex items-center gap-2"
                  id="zaalt-btn"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-xs">Заалт</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isZaaltDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </motion.button>

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
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleExcelImport}
                className="hidden"
              />
              <motion.div
                id="guilgee-excel-btn"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <IconTextButton
                  onClick={exceleerTatya}
                  icon={<Download className="w-5 h-5" />}
                  label={t("Excel татах")}
                />
              </motion.div>
              <div className="relative" ref={columnDropdownRef}>
                <motion.div
                  id="guilgee-columns-btn"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconTextButton
                    onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
                    icon={<Columns className="w-5 h-5" />}
                    label="Багана"
                  />
                </motion.div>
                <AnimatePresence>
                  {isColumnModalOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-64 menu-surface p-4 rounded-xl shadow-xl z-50 border border-[color:var(--surface-border)]"
                    >
                      <h4 className="text-sm font-semibold mb-3 text-theme">
                        Багана сонгох
                      </h4>
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {columnDefs.map((col) => {
                          const isChecked = columnVisibility[col.key] !== false;
                          return (
                            <label
                              key={col.key}
                              className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer hover:text-theme transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setColumnVisibility((prev) => {
                                    const currentlyVisible = Object.values(prev).filter(
                                      (v) => v !== false
                                    ).length;
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
                      return (
                        <th
                          key={col.key}
                          className={`p-1 text-sm font-normal text-theme whitespace-nowrap ${alignClass} ${stickyClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                          style={{
                            ...(col.sticky
                              ? { left: stickyOffsets[col.key] }
                              : {}),
                            minWidth: col.minWidth,
                          }}
                        >
                          {col.label}
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
                      <td colSpan={visibleColumnCount} className="p-8 text-center">
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
                          <div className="text-slate-500 font-medium">
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
                        (it?.orshinSuugch && typeof it.orshinSuugch === 'object' ? it.orshinSuugch : undefined) ||
                        undefined;
                      const dugaar = String(
                        it?.gereeniiDugaar || ct?.gereeniiDugaar || "-"
                      );
                      const total = Number(
                        it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0
                      );
                      // const khayag =
                      //   resident && resident.bairNer
                      //     ? String(resident.bairNer).trim()
                      //     : it.bairNer
                      //     ? String(it.bairNer).trim()
                      //     : "-";
                      const tuluvLabel = getPaymentStatusLabel(it);
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
                      // Get toot - prioritize contract (geree) data
                      const toot = String(ct?.toot || resident?.toot || it?.toot || "-");

                      // Get utas - can be string or array
                      // Priority: resident.utas (array or string) > it.utas (array or string)
                      const utas = (() => {
                        // Check resident's utas (array)
                        if (resident?.utas) {
                          if (Array.isArray(resident.utas) && resident.utas.length > 0) {
                            const firstUtas = resident.utas[0];
                            if (firstUtas !== undefined && firstUtas !== null && firstUtas !== "") {
                              return String(firstUtas);
                            }
                          } else if (typeof resident.utas === 'string' && resident.utas.trim() !== "") {
                            return String(resident.utas);
                          }
                        }
                        // Check transaction item's utas (array)
                        if (it?.utas) {
                          if (Array.isArray(it.utas) && it.utas.length > 0) {
                            const firstUtas = it.utas[0];
                            if (firstUtas !== undefined && firstUtas !== null && firstUtas !== "") {
                              return String(firstUtas);
                            }
                          } else if (typeof it.utas === 'string' && it.utas.trim() !== "") {
                            return String(it.utas);
                          }
                        }
                        return "-";
                      })();
                      // Get orts - prioritize contract (geree) data
                      const orts = String(
                        ct?.orts ??
                        ct?.ortsDugaar ??
                        ct?.ortsNer ??
                        resident?.orts ??
                        resident?.ortsDugaar ??
                        resident?.ortsNer ??
                        resident?.block ??
                        it?.orts ??
                        it?.ortsDugaar ??
                        it?.ortsNer ??
                        "-"
                      );
                      const davkhar = String(resident?.davkhar ?? it?.davkhar ?? "-");
                      const sentAt =
                        it?.ognoo || it?.nekhemjlekhiinOgnoo || it?.createdAt;
                      const paidAt = it?.tulsunOgnoo || it?.paidAt;
                      const lastLog =
                        paidAt != null
                          ? `Төлсөн • ${formatDate(paidAt)}`
                          : sentAt != null
                            ? `Илгээсэн • ${formatDate(sentAt)}`
                            : "-";

                      return (
                        <tr
                          key={it?._id || `${idx}`}
                          className="transition-colors border-b last:border-b-0"
                        >
                          {visibleColumns.map((col, colIdx) => {
                            const alignClass =
                              col.align === "left"
                                ? "text-left pl-2"
                                : col.key === "tulbur" || col.key === "paid" || col.key === "uldegdel"
                                  ? "text-right pr-2"
                                  : "text-center";
                            const stickyClass = col.sticky
                              ? "sticky z-10 bg-[color:var(--surface-bg)]"
                              : "";
                            const isLastCol = colIdx === visibleColumns.length - 1;
                            const cellClass = `p-1 text-theme whitespace-nowrap ${alignClass} ${stickyClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`;
                            const style = {
                              ...(col.sticky
                                ? { left: stickyOffsets[col.key] }
                                : {}),
                              minWidth: col.minWidth,
                            } as React.CSSProperties;

                            switch (col.key) {
                              case "index":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {(page - 1) * rowsPerPage + idx + 1}
                                  </td>
                                );
                              case "ner":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {ner}
                                  </td>
                                );
                              case "toot":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {toot}
                                  </td>
                                );
                              case "utas":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {utas}
                                  </td>
                                );
                              case "orts":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {orts}
                                  </td>
                                );
                              case "davkhar":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {davkhar}
                                  </td>
                                );
                              case "gereeniiDugaar":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {dugaar}
                                  </td>
                                );
                              case "tulbur":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {formatNumber(total)} ₮
                                  </td>
                                );
                              case "paid": {
                                const gid =
                                  (it?.gereeniiId && String(it.gereeniiId)) ||
                                  (ct?._id && String(ct._id)) ||
                                  "";
                                const paid = gid ? paidSummaryByGereeId[gid] ?? 0 : 0;
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {formatNumber(paid)} ₮
                                  </td>
                                );
                              }
                              case "uldegdel": {
                                // Prefer contract-level globalUldegdel from geree,
                                // then fall back to row-level uldegdel, then heuristics.
                                const contractUldegdelRaw =
                                  ct?.globalUldegdel ?? ct?.uldegdel;
                                const rowUldegdelRaw = it?.uldegdel;

                                const toNum = (v: any): number | null => {
                                  if (v === undefined || v === null || v === "") return null;
                                  const n = Number(v);
                                  return Number.isFinite(n) ? n : null;
                                };

                                let remaining =
                                  toNum(contractUldegdelRaw) ??
                                  toNum(rowUldegdelRaw) ??
                                  null;

                                if (remaining === null) {
                                  if (isPaid) {
                                    remaining = 0;
                                  } else {
                                    // Fallback: assume full amount is still outstanding
                                    remaining = total;
                                  }
                                }

                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    {formatNumber(remaining)} ₮
                                  </td>
                                );
                              }
                              case "tuluv":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    <div className="flex items-center justify-center gap-2">
                                      <span
                                        className={
                                          "px-2 py-0.5 rounded-full text-sm font-medium " +
                                          (isPaid
                                            ? "badge-paid"
                                            : tuluvLabel === "Төлөөгүй" ||
                                              tuluvLabel === "Хугацаа хэтэрсэн"
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
                                  <td key={col.key} className={cellClass} style={style}>
                                    {lastLog}
                                  </td>
                                );
                              case "action":
                                return (
                                  <td key={col.key} className={cellClass} style={style}>
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          // Create resident-like object from transaction data
                                          const residentData = resident || {
                                            _id: it?.orshinSuugchId,
                                            ner: ner,
                                            toot: toot,
                                            utas: utas,
                                            gereeniiDugaar: dugaar,
                                            gereeniiId: it?.gereeniiId || ct?._id,
                                            ...it,
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
                                            gereeniiId: it?.gereeniiId || ct?._id,
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
                                          // Create resident-like object from transaction data
                                          const residentData = resident || {
                                            _id: it?.orshinSuugchId,
                                            ovog: it?.ovog,
                                            ner: ner,
                                            toot: toot,
                                            utas: utas,
                                            gereeniiDugaar: dugaar,
                                            gereeniiId: it?.gereeniiId || ct?._id,
                                            ...it,
                                          };
                                          setSelectedTransactionResident(residentData);
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
                <tfoot className="sticky bottom-0 z-30 bg-slate-50 dark:bg-slate-800 border-t border-[color:var(--surface-border)]">
                  <tr className="font-bold">
                    {visibleColumns.map((col, colIdx) => {
                      const alignClass =
                        col.align === "right" || col.key === "tulbur" || col.key === "paid" || col.key === "uldegdel"
                          ? "text-right pr-2"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left pl-2";
                      const stickyClass = col.sticky
                        ? "sticky z-40 bg-slate-50 dark:bg-slate-800"
                        : "";
                      const isLastCol = colIdx === visibleColumns.length - 1;

                      // Calculate totals based on column key
                      let content: React.ReactNode = "";

                      if (col.key === "gereeniiDugaar") {
                        content = <span className="font-bold text-theme">Нийт</span>;
                      } else if (col.key === "tulbur") {
                        const total = deduplicatedResidents.reduce((sum: number, it: any) => {
                          return sum + Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0);
                        }, 0);
                        content = <span className="text-theme">{formatNumber(total, 0)} ₮</span>;
                      } else if (col.key === "paid") {
                        const total = deduplicatedResidents.reduce((sum: number, it: any) => {
                          const gid = (it?.gereeniiId && String(it.gereeniiId)) || "";
                          const paid = gid ? paidSummaryByGereeId[gid] ?? 0 : 0;
                          return sum + paid;
                        }, 0);
                        content = <span className="text-emerald-600 dark:text-emerald-400">{formatNumber(total, 0)} ₮</span>;
                      } else if (col.key === "uldegdel") {
                        const total = deduplicatedResidents.reduce((sum: number, it: any) => {
                          const tulbur = Number(it?.niitTulbur ?? it?.niitDun ?? it?.total ?? 0);
                          const gid = (it?.gereeniiId && String(it.gereeniiId)) || "";
                          const tulsun = gid ? paidSummaryByGereeId[gid] ?? 0 : 0;
                          return sum + (tulbur - tulsun);
                        }, 0);
                        content = <span className={total >= 0 ? "text-rose-500" : "text-emerald-600"}>{formatNumber(total, 0)} ₮</span>;
                      }

                      return (
                        <td
                          key={col.key}
                          className={`p-1.5 text-theme whitespace-nowrap ${alignClass} ${stickyClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                          style={{
                            ...(col.sticky ? { left: stickyOffsets[col.key] } : {}),
                            minWidth: col.minWidth
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
            <div className="text-theme/70">Нийт: {filteredItems.length}</div>

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
                  disabled={page * rowsPerPage >= filteredItems.length}
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
                <div className="font-semibold"></div>
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
      />
    </div>
  );
}
