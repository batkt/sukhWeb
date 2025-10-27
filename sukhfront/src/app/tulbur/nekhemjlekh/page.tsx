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
} from "lucide-react";
import { useModalHotkeys } from "@/lib/useModalHotkeys";
import LordIcon from "@/components/ui/LordIcon";
import { useAuth } from "@/lib/useAuth";
import { useOrshinSuugchJagsaalt } from "../../../lib/useOrshinSuugch";
import { useGereeJagsaalt } from "../../../lib/useGeree";
import useBaiguullaga from "@/lib/useBaiguullaga";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import toast from "react-hot-toast";
import { url as API_URL } from "../../../../lib/uilchilgee";
import uilchilgee from "../../../../lib/uilchilgee";
import { DatePickerInput } from "@mantine/dates";

const formatNumber = (num: number) => {
  return num?.toLocaleString("mn-MN") || "0";
};

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
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
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
  useModalHotkeys({ isOpen, onClose, container: containerRef.current });
  const { baiguullaga } = useBaiguullaga(token, baiguullagiinId);
  const { gereeGaralt } = useGereeJagsaalt(
    { orshinSuugchId: String(resident?._id || "") },
    token,
    baiguullagiinId
  );
  const { zardluud: ashiglaltiinZardluud } = useAshiglaltiinZardluud({
    token,
    baiguullagiinId,
    barilgiinId,
  });

  const gereeData = gereeGaralt?.jagsaalt?.[0];
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
        // Resolve contract ID for this resident
        let gereeniiId: string | undefined = undefined;
        try {
          const gResp = await uilchilgee(token).get(`/geree`, {
            params: {
              baiguullagiinId,
              ...(barilgiinId ? { barilgiinId } : {}),
              khuudasniiDugaar: 1,
              khuudasniiKhemjee: 50,
              query: JSON.stringify({
                baiguullagiinId,
                ...(barilgiinId ? { barilgiinId } : {}),
                orshinSuugchId: String(resident._id || ""),
              }),
            },
          });
          const gList = Array.isArray(gResp.data?.jagsaalt)
            ? gResp.data.jagsaalt
            : Array.isArray(gResp.data)
            ? gResp.data
            : [];
          const pick = gList.sort(
            (a: any, b: any) =>
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime()
          )[0];
          gereeniiId = pick?._id;
        } catch {}

        const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
          params: {
            baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 10,
            query: JSON.stringify({
              baiguullagiinId,
              ...(barilgiinId ? { barilgiinId } : {}),
              ...(gereeniiId
                ? { gereeniiId }
                : { orshinSuugchId: String(resident._id || "") }),
            }),
          },
        });
        const data = resp.data;
        const list = Array.isArray(data?.jagsaalt)
          ? data.jagsaalt
          : Array.isArray(data)
          ? data
          : [];
        const latest = [...list].sort(
          (a: any, b: any) =>
            new Date(b?.createdAt || b?.ognoo || 0).getTime() -
            new Date(a?.createdAt || a?.ognoo || 0).getTime()
        )[0];
        const rows = Array.isArray(latest?.medeelel?.zardluud)
          ? latest.medeelel.zardluud
          : Array.isArray(latest?.zardluud)
          ? latest.zardluud
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
        const norm = (z: any, idx: number) => ({
          _id: z._id || `inv-${idx}`,
          ner: z.ner || z.name || "",
          tariff: pickAmount(z),
          turul: z.turul,
          zardliinTurul: z.zardliinTurul,
        });
        setInvRows(rows.map(norm));
        const t = Number(
          latest?.niitTulbur ?? latest?.niitDun ?? latest?.total ?? 0
        );
        setInvTotal(Number.isFinite(t) ? t : null);
      } catch (e) {
        setInvRows([]);
        setInvTotal(null);
      }
    };
    run();
  }, [isOpen, token, baiguullagiinId, resident?._id]);

  const backendRows: Zardal[] | null = React.useMemo(() => {
    const raw = (gereeData as any)?.zardluud || [];
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
          tariff: pickAmount(r),
          turul: r.turul,
          zardliinTurul: r.zardliinTurul,
        }))
      : null;
  }, [gereeData]);

  const backendTotal: number | null =
    typeof (gereeData as any)?.niitTulbur === "number"
      ? Number((gereeData as any).niitTulbur)
      : null;

  const invoiceRows = React.useMemo(() => {
    // Prefer latest invoice rows if available AND they contain any positive amount
    if (invValid) return invRows;
    // If all tariffs are zero/empty, fall back to base utilization rows
    if (backendRows && backendRows.length > 0) {
      const raw = (gereeData as any)?.zardluud || [];
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

      if (isLiftExempt && liftTariffAbs > 0) {
        return [
          ...nonLift,
          {
            _id: "lift-discount-display",
            ner: "Лифт хөнгөлөлт",
            tariff: -liftTariffAbs,
            discount: true as const,
          } as any,
        ];
      }
      return nonLift;
    }

    const parseNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const normalize = (z: Zardal) => {
      const tar =
        parseNum((z as any)?.dun) ??
        parseNum((z as any)?.tulukhDun) ??
        parseNum((z as any)?.tariff);
      const isEmpty = tar === null;
      if (isLiftItem(z) && isEmpty) {
        return { ...z, tariff: null };
      }
      return { ...z, tariff: tar ?? 0 } as Zardal;
    };

    const normalized = (baseZardluud as Zardal[]).map(normalize);

    if (!isLiftExempt) return normalized;

    const nonLift = normalized.filter((z) => !isLiftItem(z));
    const liftTariffs = normalized
      .filter((z) => isLiftItem(z))
      .map((z) => (z as any)?.tariff)
      .filter(
        (v) =>
          v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v))
      )
      .map((v) => Number(v));

    if (liftTariffs.length === 0) {
      return nonLift;
    }

    const liftSum = liftTariffs.reduce((s, v) => s + v, 0);

    return [
      ...nonLift,
      {
        _id: "lift-discount-fallback",
        ner: "Лифт хөнгөлөлт",
        tariff: liftSum === 0 ? 0 : -Math.abs(liftSum),
        discount: true as const,
      } as any,
    ];
  }, [
    baseZardluud,
    isLiftExempt,
    backendRows,
    backendTotal,
    gereeData,
    invRows,
    invValid,
  ]);

  const useBackendRows = !!(backendRows && backendRows.length > 0);

  const totalSum = React.useMemo(() => {
    if (invValid && invTotal !== null) return invTotal;
    const rowSum = invoiceRows
      .filter((item: any) => !item?.discount)
      .reduce((sum, item: any) => sum + Number(item?.tariff ?? 0), 0);
    return rowSum;
  }, [invoiceRows, invTotal, invValid]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            <PrintStyles />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
              onClick={onClose}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] max-h-[1000px] bg-white rounded-3xl shadow-2xl overflow-hidden z-[9999]"
              onClick={(e) => e.stopPropagation()}
              ref={containerRef}
            >
              <div className="invoice-modal">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print-break no-print rounded-t-3xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      {/* Placeholder Lordicon, replace src with preferred asset */}
                      <LordIcon
                        src="https://cdn.lordicon.com/wloilxuq.json"
                        size={24}
                        trigger="hover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        Үйлчилгээний нэхэмжлэх
                      </h2>
                      <p className="text-sm text-slate-500">
                        Нэхэмжлэхийн дугаар: {invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="btn-minimal btn-minimal-ghost"
                    title="Хаах"
                    data-modal-primary
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/zmkotitn.json"
                      size={20}
                      trigger="hover"
                    />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6 print-break">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">
                        {baiguullaga?.ner}
                      </h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <LordIcon
                            src="https://cdn.lordicon.com/aycieyht.json"
                            size={18}
                            trigger="hover"
                          />
                          <span className="font-medium">Имэйл:</span>{" "}
                          {baiguullaga?.email || "-"}
                        </p>
                        <p className="flex items-center gap-2">
                          <LordIcon
                            src="https://cdn.lordicon.com/iltqorsz.json"
                            size={18}
                            trigger="hover"
                          />
                          <span className="font-medium">Утас:</span>{" "}
                          {baiguullaga?.utas || "-"}
                        </p>
                        <p className="flex items-center gap-2">
                          <LordIcon
                            src="https://cdn.lordicon.com/surcxhka.json"
                            size={18}
                            trigger="hover"
                          />
                          <span className="font-medium">Хаяг:</span>{" "}
                          {baiguullaga?.khayag || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="inline-block text-left bg-blue-50 p-3 rounded-xl">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Огноо:</span>{" "}
                          {currentDate}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">төлөх огноо:</span>{" "}
                          {formatDate(gereeData?.tulukhOgnoo || currentDate)}
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          <span className="font-medium">Банк:</span>{" "}
                          {baiguullaga?.bankNer || "-"}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Данс:</span>{" "}
                          {baiguullaga?.dans || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 print-break">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {resident?.ovog?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {resident?.ovog} {resident?.ner}
                        </h3>
                        <div className="text-xs text-slate-300 truncate">
                          {resident.register || "Регистр тодорхойгүй"}
                        </div>
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
                          {gereeData?.gereeniiDugaar}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p>
                          <span className="text-slate-500">Утас:</span>{" "}
                          {resident?.utas}
                        </p>
                        <p>
                          <span className="text-slate-500">Огноо:</span>{" "}
                          {formatDate(gereeData?.gereeniiOgnoo)}
                        </p>
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
                            Нийт
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">
                            Төлбөрийн төлөв:
                          </span>
                          <span
                            className={`badge-status ${
                              resident?.tuluv === "Төлсөн"
                                ? "badge-paid"
                                : resident?.tuluv === "Төлөөгүй"
                                ? "badge-unpaid"
                                : "badge-unknown"
                            }`}
                          >
                            {resident?.tuluv || "Тодорхойгүй"}
                          </span>
                        </div>
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
                      onClick={() => window.print()}
                      className="btn-minimal btn-print"
                      data-prevent-enter
                    >
                      <LordIcon
                        src="https://cdn.lordicon.com/pkmkagva.json"
                        size={18}
                        trigger="hover"
                      />
                      Хэвлэх
                    </button>
                    <button
                      onClick={onClose}
                      className="btn-minimal btn-cancel"
                      data-modal-primary
                    >
                      Хаах
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

export default function InvoicingZardluud() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const [selectedSukh, setSelectedSukh] = useState("");
  const [selectedDavkhar, setSelectedDavkhar] = useState("");
  const [selectedBarilga, setSelectedBarilga] = useState("");
  const [selectedTurul, setSelectedTurul] = useState("");
  const [selectedTuluv, setSelectedTuluv] = useState("");
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  // Align DatePickerInput value/onChange with string-based dates used across the app
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [davkharList, setDavkharList] = useState<string[]>([]);
  const [barilgaList, setBarilgaList] = useState<string[]>([]);
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

  const filterQuery = useMemo(() => {
    const query: any = {};
    if (selectedDavkhar) query.davkhar = selectedDavkhar;
    if (selectedBarilga) query.barilga = selectedBarilga;
    if (selectedTurul) query.turul = selectedTurul;

    return query;
  }, [selectedDavkhar, selectedBarilga, selectedTurul]);

  const {
    orshinSuugchGaralt,
    setOrshinSuugchKhuudaslalt,
    isValidating: isLoadingResidents,
  } = useOrshinSuugchJagsaalt(
    token || "",
    ajiltan?.baiguullagiinId || "",
    filterQuery,
    barilgiinId
  );

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;

      setIsLoadingExpenses(true);
      try {
        const response = await fetch(
          `http://103.143.40.46:8084/ashiglaltiinZardluud?baiguullagiinId=${
            ajiltan.baiguullagiinId
          }&barilgiinId=${
            barilgiinId ?? ""
          }&khuudasniiDugaar=1&khuudasniiKhemjee=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },  
          }
        );
        const data = await response.json();
        setExpenses(data.jagsaalt || []);
      } catch (error) {
        toast.error("Зардлын мэдээлэл татахад алдаа гарлаа");
        console.error(error);
      } finally {
        setIsLoadingExpenses(false);
      }
    };

    fetchExpenses();
  }, [token, ajiltan?.baiguullagiinId]);

  useEffect(() => {
    setOrshinSuugchKhuudaslalt({
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 100,
      search: searchTerm,
      davkhar: selectedDavkhar || undefined,
      barilga: selectedBarilga || undefined,
      turul: selectedTurul || undefined,
    });
  }, [selectedDavkhar, selectedBarilga, selectedTurul, searchTerm]);

  const residents = orshinSuugchGaralt?.jagsaalt || [];

  const displayResidents = useMemo(() => {
    let items = [...residents];

    // Final guard: enforce org/branch scoping on client in case backend over-returns
    const orgItems = items.filter(
      (r: any) =>
        String(r?.baiguullagiinId || "") ===
        String(ajiltan?.baiguullagiinId || "")
    );
    let branchItems = orgItems;
    if (barilgiinId) {
      branchItems = orgItems.filter(
        (r: any) =>
          r?.barilgiinId == null ||
          String(r.barilgiinId) === String(barilgiinId)
      );
      // If branch filter yields nothing, fall back to org-only
      if (branchItems.length === 0) {
        branchItems = orgItems;
      }
    }
    items = branchItems;

    const q = (searchTerm || "").trim().toLowerCase();
    if (q) {
      items = items.filter((r: any) => {
        const hayag =
          r.khayag || [r.duureg, r.horoo, r.davkhar].filter(Boolean).join(", ");
        return [r.ovog, r.ner, r.register, r.toot, r.utas, hayag]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
    }

    if (selectedTuluv) {
      items = items.filter((r: any) => r.tuluv === selectedTuluv);
    }

    if (selectedDavkhar)
      items = items.filter((r: any) => r.davkhar === selectedDavkhar);
    if (selectedBarilga)
      items = items.filter((r: any) => r.barilga === selectedBarilga);
    if (selectedTurul)
      items = items.filter((r: any) => r.turul === selectedTurul);

    return items;
  }, [
    residents,
    searchTerm,
    selectedTuluv,
    selectedDavkhar,
    selectedBarilga,
    selectedTurul,
  ]);

  const totalRecords = displayResidents.length;

  useEffect(() => {
    if (displayResidents.length > 0) {
      const uniqueDavkhar = [
        ...new Set(displayResidents.map((r: any) => r.davkhar).filter(Boolean)),
      ];
      const uniqueBarilga = [
        ...new Set(displayResidents.map((r: any) => r.barilga).filter(Boolean)),
      ];
      const uniqueTurul = [
        ...new Set(displayResidents.map((r: any) => r.turul).filter(Boolean)),
      ];
      setDavkharList(uniqueDavkhar as string[]);
      setBarilgaList(uniqueBarilga as string[]);
      setTurulList(uniqueTurul as string[]);
    } else {
      setDavkharList([]);
      setBarilgaList([]);
      setTurulList([]);
    }
  }, [displayResidents]);

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
      // First, resolve the user's contract (geree) id to fetch precise history
      let gereeniiId: string | undefined = undefined;
      try {
        // Fetch a reasonable page size and filter client-side to guard against backend over-return
        const gereeResp = await uilchilgee(token).get(`/geree`, {
          params: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            khuudasniiDugaar: 1,
            khuudasniiKhemjee: 100,
            query: JSON.stringify({
              baiguullagiinId: ajiltan.baiguullagiinId,
              ...(barilgiinId ? { barilgiinId } : {}),
              orshinSuugchId: String(resident?._id || ""),
            }),
          },
        });
        const gListRaw = Array.isArray(gereeResp.data?.jagsaalt)
          ? gereeResp.data.jagsaalt
          : Array.isArray(gereeResp.data)
          ? gereeResp.data
          : [];
        // Prefer exact match by toot and davkhar when available
        const matches = gListRaw.filter((g: any) => {
          const tootOk =
            resident?.toot != null
              ? String(g?.toot ?? "") === String(resident.toot)
              : true;
          const davkharOk =
            resident?.davkhar != null
              ? String(g?.davkhar ?? "") === String(resident.davkhar)
              : true;
          const orshOk =
            String(g?.orshinSuugchId || "") === String(resident?._id || "");
          return orshOk && tootOk && davkharOk;
        });
        const pick = (matches.length > 0 ? matches : gListRaw)
          // Prefer latest by createdAt if available
          .sort(
            (a: any, b: any) =>
              new Date(b?.createdAt || 0).getTime() -
              new Date(a?.createdAt || 0).getTime()
          )[0];
        gereeniiId = pick?._id;
      } catch (e) {
        // Non-fatal: we'll fall back to orshinSuugchId
      }

      // Use API's standard filtering mechanism: params.query for server-side filter
      const resp = await uilchilgee(token).get(`/nekhemjlekhiinTuukh`, {
        params: {
          baiguullagiinId: ajiltan.baiguullagiinId,
          ...(barilgiinId ? { barilgiinId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10,
          query: {
            baiguullagiinId: ajiltan.baiguullagiinId,
            ...(barilgiinId ? { barilgiinId } : {}),
            ...(gereeniiId
              ? { gereeniiId }
              : { orshinSuugchId: String(resident._id || "") }),
          },
        },
      });
      const data = resp.data;

      let list = Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data)
        ? data
        : [];

      // Final guard: if backend didn't filter correctly, enforce by contract id on client
      if (gereeniiId) {
        list = list.filter(
          (it: any) => String(it?.gereeniiId || "") === String(gereeniiId)
        );
      }

      setHistoryItems(list);
    } catch (e) {
      toast.error("Түүх татахад алдаа гарлаа");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchLiftFloors = async () => {
      if (!token || !ajiltan?.baiguullagiinId) return;
      try {
        const resp = await fetch(
          `${API_URL}/liftShalgaya?baiguullagiinId=${ajiltan.baiguullagiinId}&${
            barilgiinId ? `barilgiinId=${barilgiinId}&` : ""
          }khuudasniiDugaar=1&khuudasniiKhemjee=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resp.ok) return;
        const data = await resp.json();
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
  }, [token, ajiltan?.baiguullagiinId, barilgiinId]);

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
    <div className="min-h-screen  text-slate-900 no-theme-scope">
      <LocalStyles />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6  bg-clip-text text-slate-900 drop-shadow-sm"
      >
        Зардлын нэхэмжлэл
      </motion.h1>

      <div className="rounded-2xl p-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <DatePickerInput
            value={selectedDate}
            onChange={(v: string | null) => setSelectedDate(v)}
            placeholder="Огноо сонгох"
            className="w-[220px]"
            clearable
            locale="mn"
            valueFormat="YYYY-MM-DD"
          />
          <TusgaiZagvar
            value={selectedTurul}
            onChange={setSelectedTurul}
            options={[
              { value: "", label: "Гэрээний төрөл" },
              ...turulList.map((t) => ({ value: t, label: t })),
            ]}
            placeholder="Гэрээний төрөл"
          />

          <TusgaiZagvar
            value={selectedTuluv}
            onChange={setSelectedTuluv}
            options={[
              { value: "", label: "Бүх төлөв" },
              { value: "Төлсөн", label: "Төлсөн" },
              { value: "Төлөөгүй", label: "Төлөөгүй" },
              { value: "Тодорхойгүй", label: "Тодорхойгүй" },
            ]}
            placeholder="Бүх төлөв"
          />

          <TusgaiZagvar
            value={selectedDavkhar}
            onChange={setSelectedDavkhar}
            options={[
              { value: "", label: "Давхар" },
              ...davkharList.map((d) => ({ value: d, label: d })),
            ]}
            placeholder="Давхар"
          />

          <TusgaiZagvar
            value={selectedBarilga}
            onChange={setSelectedBarilga}
            options={[
              { value: "", label: "Бүх барилга" },
              ...barilgaList.map((b) => ({ value: b, label: b })),
            ]}
            placeholder="Бүх барилга"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Уншиж байна...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl">
            <div className="rounded-3xl p-6 mb-4 allow-overflow bg-white border border-gray-200">
              <div className="overflow-y-auto custom-scrollbar w-full">
                <table className="table-ui text-sm min-w-full">
                  <thead>
                    <tr className="text-slate-900">
                      <th className="w-[4%] p-3 text-center border-b border-gray-200 font-semibold">
                        №
                      </th>
                      <th className="w-[18%] p-3 text-center border-b border-gray-200 font-semibold">
                        Оршин суугч
                      </th>
                      <th className="w-[8%] p-3 text-center border-b border-gray-200 font-semibold">
                        Тоот
                      </th>
                      <th className="w-[22%] p-3 text-center border-b border-gray-200 font-semibold">
                        Хаяг
                      </th>
                      <th className="w-[12%] p-3 text-center border-b border-gray-200 font-semibold">
                        Утас
                      </th>
                      <th className="w-[10%] p-3 text-center border-b border-gray-200 font-semibold">
                        Төлөв
                      </th>
                      <th className="w-[10%] p-3 text-center border-b border-gray-200 font-semibold">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {displayResidents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-slate-900/60"
                        >
                          Мэдээлэл байхгүй байна
                        </td>
                      </tr>
                    ) : (
                      displayResidents.map((resident: any, index: number) => (
                        <tr
                          key={resident._id}
                          className="hover:shadow-md transition-colors"
                        >
                          <td className="p-3 text-center text-slate-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                  {resident.ovog} {resident.ner}
                                </div>
                                <div className="text-xs text-slate-900 truncate">
                                  {resident.register || "Регистр тодорхойгүй"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-2xl  text-slate-900 font-semibold text-sm">
                                {resident.toot || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-slate-900/70 text-center">
                              {resident.duureg &&
                              resident.horoo &&
                              resident.davkhar
                                ? `${resident.duureg}, ${resident.horoo}, ${resident.davkhar}`
                                : resident.khayag || "Хаяг тодорхойгүй"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm text-slate-900/70 text-center">
                              {resident.utas || "-"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-center">
                              <span
                                className={
                                  "px-3 py-1 rounded-full text-xs font-medium " +
                                  (resident.tuluv === "Төлсөн"
                                    ? "bg-green-100 text-green-700"
                                    : resident.tuluv === "Төлөөгүй"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700")
                                }
                              >
                                {resident.tuluv || "Тодорхойгүй"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewInvoice(resident)}
                                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                                title="Нэхэмжлэл харах"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleOpenHistory(resident)}
                                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                                title="Түүх"
                              >
                                <History className="w-4 h-4 text-slate-900" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="text-sm text-slate-900">
                  Нийт: <span className="font-semibold">{totalRecords}</span>{" "}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resident={selectedResident}
        baiguullagiinId={ajiltan?.baiguullagiinId}
        token={token || ""}
        liftFloors={liftFloors}
        barilgiinId={barilgiinId}
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
                className="fixed left-1/2 top-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[95vw] max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                ref={historyRef}
              >
                <div className="p-5 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Түүх
                    </h3>
                    {historyResident && (
                      <p className="text-sm text-slate-600">
                        {historyResident.ovog} {historyResident.ner} —{" "}
                        {historyItems.length} Нийт
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 rounded-2xl hover:bg-gray-100"
                    data-modal-primary
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/zmkotitn.json"
                      size={18}
                      trigger="hover"
                    />
                  </button>
                </div>

                <div className="relative p-6">
                  {historyLoading ? (
                    <div className="py-16 text-center text-slate-600">
                      Ачааллаж байна…
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="py-16 text-center text-slate-600">
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
                            const total = Number(
                              item.niitTulbur ?? item.niitDun ?? item.total ?? 0
                            );
                            const rows = Array.isArray(item.medeelel?.zardluud)
                              ? item.medeelel.zardluud
                              : Array.isArray(item.zardluud)
                              ? item.zardluud
                              : [];

                            return (
                              <div
                                key={item._id || `${item.sar}-${i}`}
                                className="absolute inset-x-0 mx-auto w-[92%] bg-white border border-gray-100 rounded-2xl shadow-lg p-5 transition-transform"
                                style={{
                                  transform: `translateY(${translate}px) scale(${scale})`,
                                  zIndex: z,
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <div className="text-sm text-slate-500">
                                      Огноо:{" "}
                                      <span className="font-medium text-slate-900">
                                        {dateStr
                                          ? new Date(
                                              dateStr
                                            ).toLocaleDateString("mn-MN")
                                          : "-"}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      Дугаар:{" "}
                                      <span className="font-medium text-slate-900">
                                        {numberStr}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500">
                                      Нийт дүн
                                    </div>
                                    <div className="text-xl font-bold text-slate-900">
                                      {formatCurrency(total)}
                                    </div>
                                  </div>
                                </div>

                                {rows.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                    {rows
                                      .slice(0, 6)
                                      .map((z: any, zi: number) => {
                                        const amount = (() => {
                                          const n = (v: any) => {
                                            const num = Number(v);
                                            return Number.isNaN(num)
                                              ? null
                                              : num;
                                          };
                                          const dun = n(z?.dun);
                                          if (dun !== null && dun > 0)
                                            return dun;
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
                                            <span className="text-slate-600 truncate">
                                              {z.ner || z.name}
                                            </span>
                                            <span className="font-medium text-slate-900">
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
                        <button
                          className="btn-minimal btn-back"
                          disabled={historyIndex <= 0}
                          onClick={() =>
                            setHistoryIndex((i) => Math.max(0, i - 1))
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Өмнөх
                        </button>
                        <div className="text-sm text-slate-600">
                          {Math.min(historyIndex + 1, historyItems.length)} /{" "}
                          {historyItems.length}
                        </div>
                        <button
                          className="btn-minimal btn-next"
                          disabled={historyIndex >= historyItems.length - 1}
                          onClick={() =>
                            setHistoryIndex((i) =>
                              Math.min(historyItems.length - 1, i + 1)
                            )
                          }
                        >
                          Дараах
                          <ChevronRight className="w-4 h-4" />
                        </button>
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
