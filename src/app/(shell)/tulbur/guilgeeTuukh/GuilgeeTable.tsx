"use client";

import React, { useCallback, useMemo } from "react";
import { Spin, Tooltip } from "antd";
import Table from "@/components/ui/table";
import useSWR from "swr";
import { Eye, History, Banknote } from "lucide-react";
import formatNumber from "../../../../../tools/function/formatNumber";
import { getPaymentStatusLabel } from "@/lib/utils";
import { pickMonthSlice } from "./guilgeeMonthMatrix";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

/** Мөнгөн дүнтэй баганууд — хөл мөрөнд нийлбэр гарна */
const MONEY_KEYS = new Set([
  "ekhniiUldegdel",
  "uldegdel",
  "sariinTurees",
  "paid",
  "khungulult",
  "sariinUldegdel",
]);

/** NaN/Infinity-г 0 болгож, нүдэнд харагдах 2 оронтой утга руу бөөрөнхийлнө */
const toDisplayAmount = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

interface GuilgeeTableProps {
  data: any[];
  loading: boolean;
  visibleColumns: any[];
  selectedGereeIds: string[];
  onSelectionChange: (selectedKeys: string[]) => void;
  contractsById: Record<string, any>;
  contractsByNumber: Record<string, any>;
  residentsById: Record<string, any>;
  /** Сонгосон сарын төлсөн дүн (Гүйцэтгэл) — `monthlyMatrixRange`-тай нийцнэ */
  monthPaidByGereeId: Record<string, number>;
  khungulultMap?: Record<string, number>;
  bestKnownBalances: Record<string, number>;
  sortField: string | null;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string | null, order: "asc" | "desc") => void;
  page: number;
  rowsPerPage: number;
  deduplicatedResidents: any[];
  getGereeId: (it: any) => string;
  monthlyDataByGereeId?: Map<string, any>;
  monthlyPeriods?: string[];
  /** YYYY-MM from the date picker — must match matrix `months` keys for the selected month */
  matrixMonthKey?: string;
  /** Үлдэгдэл/түүх шүүлтэнд л хэрэглэнэ; Гүйцэтгэл үргэлж `monthPaidByGereeId` */
  historyScopedByDate?: boolean;
  onViewInvoice: (resident: any) => void;
  onViewHistory: (resident: any) => void;
  onTransaction: (resident: any, remainingValue: number) => void;
  canCreateTransaction?: boolean;
  token?: string | null;
  ajiltan?: any;
  effectiveBarilgiinId?: string | null;
  ekhlekhOgnoo?: any;
}


export default function GuilgeeTable({
  data,
  loading,
  visibleColumns,
  selectedGereeIds,
  onSelectionChange,
  contractsById,
  contractsByNumber,
  residentsById,
  monthPaidByGereeId,
  khungulultMap = {},
  bestKnownBalances,
  sortField,
  sortOrder,
  onSortChange,
  page,
  rowsPerPage,
  deduplicatedResidents,
  getGereeId,
  monthlyDataByGereeId,
  monthlyPeriods,
  matrixMonthKey,
  historyScopedByDate = false,
  onViewInvoice,
  onViewHistory,
  onTransaction,
  canCreateTransaction = true,
  ajiltan,
  effectiveBarilgiinId,
  ekhlekhOgnoo,
}: GuilgeeTableProps) {
  // Check if checkbox column is visible
  const isCheckboxVisible = visibleColumns.some(
    (col) => col.key === "checkbox",
  );

  /**
   * Мөнгөн баганын нүдэнд ХАРАГДАХ утга. Нүд болон хөл мөрийн нийлбэр хоёулаа
   * үүнийг ашиглана — ингэснээр нийлбэр нь яг харагдаж буй тоонуудын нийлбэр болно.
   */
  const getMoneyValue = useCallback(
    (key: string, record: any): number => {
      const gid = getGereeId(record);
      const resolveMonthSlice = () => {
        const gDugaar =
          record?.gereeniiDugaar ||
          (record?.gereeniiId &&
            contractsById[String(record.gereeniiId)]?.gereeniiDugaar);
        const monthlyData = gid
          ? monthlyDataByGereeId?.get(gid)
          : gDugaar
            ? monthlyDataByGereeId?.get(String(gDugaar))
            : null;
        return pickMonthSlice(monthlyData, monthlyPeriods, matrixMonthKey);
      };
      switch (key) {
        case "ekhniiUldegdel":
          return toDisplayAmount(record?._ekhniiUldegdelAmount ?? 0);
        case "paid":
          return toDisplayAmount(gid ? (monthPaidByGereeId[gid] ?? 0) : 0);
        case "khungulult":
          return toDisplayAmount(gid ? (khungulultMap[gid] ?? 0) : 0);
        case "sariinTurees": {
          const monthSlice = resolveMonthSlice();
          return toDisplayAmount(
            monthSlice != null
              ? (monthSlice.billed ?? 0)
              : (record?._totalTulbur ?? 0),
          );
        }
        case "uldegdel":
          return toDisplayAmount(bestKnownBalances[gid] ?? 0);
        case "sariinUldegdel": {
          // 1. Сервер тооцсон үлдэгдэл (uldegdelBodyo) 2. Сарын матриц 3. Дотоод нэгтгэл
          const serverBalance = gid ? bestKnownBalances[gid] : null;
          if (serverBalance != null) return toDisplayAmount(serverBalance);
          const monthSlice = resolveMonthSlice();
          if (monthSlice != null) return toDisplayAmount(monthSlice.uldegdel ?? 0);
          return toDisplayAmount(
            Number(record?._totalTulburMonth || 0) -
              Number(record?._totalTulsunMonth || 0),
          );
        }
        default:
          return 0;
      }
    },
    [
      getGereeId,
      contractsById,
      monthlyDataByGereeId,
      monthlyPeriods,
      matrixMonthKey,
      monthPaidByGereeId,
      khungulultMap,
      bestKnownBalances,
    ],
  );

  // Мөр тус бүрийн SMS товч хасагдсан — Төлбөрийн цонхны дээд талаас
  // сонгосон бүх гэрээнд НЭГ дарахад илгээдэг болов
  // (`/nekhemjlekh/send-reminder-sms-bulk`).

  // Build Ant Design columns from visibleColumns
  const columns = useMemo(() => {
    return visibleColumns
      .filter((col) => col.key !== "checkbox")
      .map((col): any => {
        const baseColumn = {
          key: col.key,
          dataIndex: col.key,
          title: (
            <span className="text-inherit text-center w-full block">
              {col.label}
            </span>
          ),
          width: col.minWidth || col.width,
          minWidth: col.minWidth,
          align: col.align || "center",
          sorter:
            ["uldegdel", "paid", "toot", "orts", "khungulult"].includes(col.key),
          fixed: col.sticky ? ("left" as const) : undefined,
          onCell: () => ({
            className:
              (col.align === "end"
                ? "!text-right"
                : col.align === "start"
                  ? "!text-left"
                  : "!text-center") +
              "" +
              (MONEY_KEYS.has(col.key) ? " tabular-nums" : ""),
          }),
        };

        // Custom render functions
        if (col.key === "index") {
          return {
            ...baseColumn,
            onHeaderCell: () => ({
              className: isCheckboxVisible
                ? "!border-l !border-[hsl(var(--zt-border))] !text-center"
                : "!text-center",
            }),
            onCell: () => ({
              className: `!text-center ${
                isCheckboxVisible
                  ? "!border-l !border-[hsl(var(--zt-border))]"
                  : ""
              }`,
            }),
            render: (_: any, __: any, index: number) =>
              (page - 1) * rowsPerPage + index + 1,
          };
        }

        if (col.key === "ner") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const ner = resident
                ? [resident.ner]
                  .map((v) => (v ? String(v).trim() : ""))
                  .filter(Boolean)
                  .join(" ") || "-"
                : [record.ner]
                  .map((v) => (v ? String(v).trim() : ""))
                  .filter(Boolean)
                  .join(" ") || "-";
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">{ner}</span>
              );
            },
          };
        }

        if (col.key === "toot") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              const residentToot =
                Array.isArray(resident?.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.toot
                  : resident?.toot;
              const displayToot = ct?.toot || record?.toot || residentToot || "-";
              return (
                <span className="text-center block text-[color:var(--panel-text)] dark:text-white leading-tight">
                  {displayToot}
                </span>
              );
            },
          };
        }

        if (col.key === "utas") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const utas = (() => {
                if (resident?.utas) {
                  if (
                    Array.isArray(resident.utas) &&
                    resident.utas.length > 0
                  ) {
                    const first = resident.utas[0];
                    if (first !== undefined && first !== null)
                      return String(first);
                  } else if (
                    typeof resident.utas === "string" &&
                    resident.utas.trim() !== ""
                  ) {
                    return String(resident.utas);
                  }
                }
                if (record?.utas) {
                  if (Array.isArray(record.utas) && record.utas.length > 0) {
                    const first = record.utas[0];
                    if (first !== undefined && first !== null)
                      return String(first);
                  } else if (
                    typeof record.utas === "string" &&
                    record.utas.trim() !== ""
                  ) {
                    return String(record.utas);
                  }
                }
                return "-";
              })();
              return (
                <span className="text-center block text-[color:var(--panel-text)] dark:text-white">
                  {utas}
                </span>
              );
            },
          };
        }

        if (col.key === "orts") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const residentOrts =
                Array.isArray(resident?.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.orts
                  : null;
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">
                  {String(
                    ct?.orts ??
                    ct?.ortsDugaar ??
                    ct?.ortsNer ??
                    record?.orts ??
                    record?.ortsDugaar ??
                    record?.ortsNer ??
                    residentOrts ??
                    resident?.orts ??
                    resident?.ortsDugaar ??
                    resident?.ortsNer ??
                    resident?.block ??
                    "-",
                  )}
                </span>
              );
            },
          };
        }

        if (col.key === "davkhar") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const residentDavkhar =
                Array.isArray(resident?.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.davkhar
                  : resident?.davkhar;
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">
                  {String(ct?.davkhar ?? record?.davkhar ?? residentDavkhar ?? "-")}
                </span>
              );
            },
          };
        }

        if (col.key === "gereeniiDugaar") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              return (
                <span className="text-center block text-[color:var(--panel-text)] dark:text-white">
                  {String(record?.gereeniiDugaar || ct?.gereeniiDugaar || "-")}
                </span>
              );
            },
          };
        }

        if (col.key === "ekhniiUldegdel") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const amt = getMoneyValue("ekhniiUldegdel", record);
              return (
                <span
                  className={
                    amt <= 0
                      ? "!text-success dark:!text-success"
                      : "!text-danger dark:!text-danger"
                  }
                >
                  {formatNumber(amt, 2)}
                </span>
              );
            },
          };
        }

        if (col.key === "paid") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const paidDisplay = getMoneyValue("paid", record);
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">
                  {formatNumber(paidDisplay, 2)}
                </span>
              );
            },
          };
        }

        if (col.key === "khungulult") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const discVal = getMoneyValue("khungulult", record);
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">
                  {formatNumber(discVal, 2)}
                </span>
              );
            },
          };
        }

        if (col.key === "sariinTurees") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const billedDisplay = getMoneyValue("sariinTurees", record);
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">
                  {formatNumber(billedDisplay, 2)}
                </span>
              );
            },
          };
        }

        if (col.key === "uldegdel") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const balance = getMoneyValue("uldegdel", record);
              return (
                <span
                  className={
                    balance < 0.01
                      ? "!text-success dark:!text-success font-medium"
                      : "!text-danger dark:!text-danger font-medium"
                  }
                >
                  {formatNumber(balance, 2)}
                </span>
              );
            },
          };
        }
        if (col.key === "sariinUldegdel") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const b = getMoneyValue("sariinUldegdel", record);
              return (
                <span className={b < 0.01 ? "!text-success dark:!text-success font-medium" : "!text-danger dark:!text-danger font-medium"}>
                  {formatNumber(b, 2)}
                </span>
              );
            },
          };
        }

        if (col.key === "tuluv") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const gid = getGereeId(record);
              const historyAggregate =
                Number(record?._totalTulbur || 0) -
                Number(record?._totalTulsun || 0);
              const remainingValue = historyAggregate;
              const paidForTuluv = gid
                ? Number(monthPaidByGereeId[gid] ?? 0)
                : 0;
              const itForTuluv = {
                ...record,
                uldegdel: remainingValue,
                _paidFromSummary: paidForTuluv,
              };
              let tuluvLabel: string = getPaymentStatusLabel(itForTuluv);
              const cObj =
                (gid && contractsById[gid]) ||
                (record?.gereeniiDugaar ? contractsByNumber[String(record.gereeniiDugaar)] : null);
              const cStatus = String(cObj?.tuluv || cObj?.status || "").trim().toLowerCase();
              const isContractCancelled = cStatus === "цуцалсан" || cStatus === "tsutlsasan";
              if (isContractCancelled) {
                tuluvLabel = "Цуцалсан";
              }
              if (remainingValue < 0.01) {
                tuluvLabel = "Төлсөн";
              }
              const isPaid = tuluvLabel === "Төлсөн";
              return (
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full " +
                      (isPaid
                        ? "badge-paid"
                        : tuluvLabel === "Цуцалсан"
                          ? "bg-danger/10 text-danger"
                          : tuluvLabel === "Төлөөгүй" ||
                            tuluvLabel === "Хугацаа хэтэрсэн"
                            ? "badge-unpaid"
                            : "badge-neutral")
                    }
                  >
                    {tuluvLabel}
                  </span>
                </div>
              );
            },
          };
        }

        if (col.key === "lastLog") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const sentAt =
                record?.ognoo ||
                record?.nekhemjlekhiinOgnoo ||
                record?.createdAt;
              const paidAt = record?.tulsunOgnoo || record?.paidAt;
              const lastLog =
                paidAt != null
                  ? `Төлсөн • ${formatDate(paidAt)}`
                  : sentAt != null
                    ? `Илгээсэн • ${formatDate(sentAt)}`
                    : "-";
              return (
                <span className="text-[color:var(--panel-text)] dark:text-white">{lastLog}</span>
              );
            },
          };
        }

        if (col.key === "action") {
          return {
            ...baseColumn,
            // 3 дүрс: 3 × 32px + 2 × 4px = 104px (+ нүдний зай 16px)
            width: 124,
            render: (_: any, record: any) => {
              const resident =
                (record?.orshinSuugchId &&
                  residentsById[String(record.orshinSuugchId)]) ||
                (record?.orshinSuugch && typeof record.orshinSuugch === "object"
                  ? record.orshinSuugch
                  : undefined);
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              const dugaar = String(
                record?.gereeniiDugaar || ct?.gereeniiDugaar || "-",
              );
              const ner = resident
                ? [resident.ner]
                  .map((v) => (v ? String(v).trim() : ""))
                  .filter(Boolean)
                  .join(" ") || "-"
                : [record.ner]
                  .map((v) => (v ? String(v).trim() : ""))
                  .filter(Boolean)
                  .join(" ") || "-";
              const residentToot =
                Array.isArray(resident?.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.toot
                  : resident?.toot;
              const toot = String(
                ct?.toot || residentToot || record?.toot || "-",
              );
              const utas = (() => {
                if (resident?.utas) {
                  if (
                    Array.isArray(resident.utas) &&
                    resident.utas.length > 0
                  ) {
                    const first = resident.utas[0];
                    if (first !== undefined && first !== null)
                      return String(first);
                  } else if (
                    typeof resident.utas === "string" &&
                    resident.utas.trim() !== ""
                  ) {
                    return String(resident.utas);
                  }
                }
                if (record?.utas) {
                  if (Array.isArray(record.utas) && record.utas.length > 0) {
                    const first = record.utas[0];
                    if (first !== undefined && first !== null)
                      return String(first);
                  } else if (
                    typeof record.utas === "string" &&
                    record.utas.trim() !== ""
                  ) {
                    return String(record.utas);
                  }
                }
                return "-";
              })();
              const gid = getGereeId(record);
              const historyAggregate =
                Number(record?._totalTulbur || 0) -
                Number(record?._totalTulsun || 0);
              const remainingValue = historyScopedByDate
                ? (bestKnownBalances[gid] ?? historyAggregate)
                : (bestKnownBalances[gid] ??
                  (historyAggregate || Number(record?.uldegdel ?? 0)));

              const contractToot = ct?.toot || record?.toot;
              const residentData = resident
                ? {
                  ...resident,
                  toot: contractToot || residentToot || resident.toot,
                  gereeniiDugaar: dugaar,
                  gereeniiId: gid || record?.gereeniiId || ct?._id,
                }
                : {
                  _id: record?.orshinSuugchId,
                  ner: ner,
                  toot: contractToot || toot,
                  utas: utas,
                  gereeniiDugaar: dugaar,
                  gereeniiId: gid || record?.gereeniiId || ct?._id,
                  ...record,
                };

              return (
                <div className="flex items-center justify-center gap-1 py-0">
                  {canCreateTransaction && (
                    <Tooltip title="Гүйлгээ хийх">
                      <button
                        type="button"
                        onClick={() => onTransaction(residentData, remainingValue)}
                        className="rounded-md border-0 bg-transparent p-1.5 text-success transition-colors hover:bg-[color:var(--surface-hover)] focus:outline-none"
                      >
                        <Banknote className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip title="Түүх харах">
                    <button
                      type="button"
                      onClick={() => onViewHistory(residentData)}
                      className="rounded-md border-0 bg-transparent p-1.5 text-info transition-colors hover:bg-[color:var(--surface-hover)] focus:outline-none"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Нэхэмжлэх харах">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(residentData)}
                      className="rounded-md border-0 bg-transparent p-1.5 text-brand transition-colors hover:bg-[color:var(--surface-hover)] focus:outline-none"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              );
            },
          };
        }

        return baseColumn;
      });
  }, [
    visibleColumns,
    page,
    rowsPerPage,
    contractsById,
    contractsByNumber,
    residentsById,
    monthPaidByGereeId,
    bestKnownBalances,
    getGereeId,
    monthlyDataByGereeId,
    monthlyPeriods,
    matrixMonthKey,
    historyScopedByDate,
    canCreateTransaction,
    getMoneyValue,
    isCheckboxVisible,
    onTransaction,
    onViewHistory,
    onViewInvoice,
  ]);

  // Handle table change (sorting)
  const handleTableChange = (_: any, __: any, sorter: any) => {
    if (sorter?.field) {
      const newOrder =
        sorter.order === "ascend"
          ? "asc"
          : sorter.order === "descend"
            ? "desc"
            : "asc";
      onSortChange(sorter.field, newOrder);
    }
  };

  // Хөл мөр: шүүгдсэн БҮХ мөрийн (зөвхөн энэ хуудас биш — `deduplicatedResidents`)
  // нүдэнд харагдах утгуудын нийлбэр. Нүд бүр өөрийн баганын доор (leafIndex)
  // байрлаж, түгжсэн баганууд биеийн нүдтэй ижил зайд наалдана.
  const getSummary = () => {
    // `columns`-той яг ижил дараалал — checkbox нь rowSelection-оор тусдаа зурагдана
    const dataCols = visibleColumns.filter((col) => col.key !== "checkbox");
    // Эхний дараалсан түгжсэн (мөнгөн бус) баганууд → «Нийт» гэсэн нэг нүд
    let labelSpan = 0;
    while (
      labelSpan < dataCols.length &&
      dataCols[labelSpan].sticky &&
      !MONEY_KEYS.has(dataCols[labelSpan].key)
    ) {
      labelSpan++;
    }

    const totals: Record<string, number> = {};
    dataCols.forEach((col) => {
      if (!MONEY_KEYS.has(col.key)) return;
      totals[col.key] = toDisplayAmount(
        deduplicatedResidents.reduce(
          (sum: number, it: any) => sum + getMoneyValue(col.key, it),
          0,
        ),
      );
    });

    const alignClass = (align?: string) =>
      align === "end" ? "text-right" : align === "start" ? "text-left" : "text-center";

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row>
          {isCheckboxVisible && (
            <Table.Summary.Cell fixed="left" className="w-8" />
          )}
          {labelSpan > 0 && (
            <Table.Summary.Cell
              key="__label"
              colSpan={labelSpan > 1 ? labelSpan : undefined}
              fixed="left"
              leafIndex={0}
              className={`text-left ${
                isCheckboxVisible && dataCols[0]?.key === "index"
                  ? "!border-l !border-[hsl(var(--zt-border))]"
                  : ""
              }`}
            >
              Нийт
            </Table.Summary.Cell>
          )}
          {dataCols.slice(labelSpan).map((col, i) => {
            const leafIndex = labelSpan + i;
            const hasTotal = col.key in totals;
            return (
              <Table.Summary.Cell
                key={col.key}
                leafIndex={leafIndex}
                fixed={col.sticky ? "left" : undefined}
                className={`${alignClass(col.align)} ${hasTotal ? "tabular-nums whitespace-nowrap" : ""}`}
              >
                {hasTotal ? formatNumber(totals[col.key], 2) : null}
              </Table.Summary.Cell>
            );
          })}
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  console.info("%c📊 [DASHBOARD SUMMARY] FINAL:", "color: purple; font-weight: bold;", {
    residents: deduplicatedResidents.length,
    paid: Object.values(monthPaidByGereeId).reduce((a, b) => a + (b || 0), 0),
    balance: deduplicatedResidents.reduce((s, it) => {
      const gid = getGereeId(it);
      const historyAggregate = Number(it?._totalTulbur || 0) - Number(it?._totalTulsun || 0);
      return s + (bestKnownBalances[gid] ?? (historyScopedByDate ? historyAggregate : (historyAggregate || Number(it?.uldegdel ?? 0))));
    }, 0)
  });

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full">
        <Table
          className=""
          dataSource={data}
          loading={loading}
          pagination={false}
          rowKey={(record: any) => record._id || Math.random().toString()}
          rowSelection={
            isCheckboxVisible
              ? {
                type: "checkbox",
                selectedRowKeys: selectedGereeIds,
                onChange: (selectedKeys) => {
                  onSelectionChange(selectedKeys as string[]);
                },
                getCheckboxProps: (record: any) => {
                  const gid = getGereeId(record);
                  return {
                    disabled: !gid || gid.length <= 5,
                  };
                },
              }
              : undefined
          }
          onChange={handleTableChange}
          scroll={{ x: "max-content" }}
          // Бүтэн өргөнд сунгахгүй — өргөн дэлгэц дээр илүү зай баганууд
          // (эсвэл «Нэр») дотор хуримтлагдаж хоосон харагдаж байв.
          fitContent
          locale={{
            emptyText: (
              <span className="text-[color:var(--muted-text)]">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          summary={getSummary}
          columns={columns}
          rowClassName={(record: any) => {
            // Ээлжлэх өнгө/hover нь стандарт хүснэгтэд шингэсэн — энд зөвхөн
            // цуцалсан мөрийг улаанаар ялгана.
            const gid = getGereeId(record);
            const historyAggregate =
              Number(record?._totalTulbur || 0) -
              Number(record?._totalTulsun || 0);
            const remainingValue = historyScopedByDate
              ? (bestKnownBalances[gid] ?? historyAggregate)
              : (bestKnownBalances[gid] ??
                (historyAggregate || Number(record?.uldegdel ?? 0)));
            const itForTuluv = {
              ...record,
              uldegdel: remainingValue,
              _paidFromSummary: gid ? Number(monthPaidByGereeId[gid] ?? 0) : 0,
            };
            let tuluvLabel: string = getPaymentStatusLabel(itForTuluv);
            const cObj =
              (gid && contractsById[gid]) ||
              (record?.gereeniiDugaar ? contractsByNumber[String(record.gereeniiDugaar)] : null);
            const cStatus = String(cObj?.tuluv || cObj?.status || "").trim().toLowerCase();
            const isContractCancelled = cStatus === "цуцалсан" || cStatus === "tsutlsasan";
            if (isContractCancelled) {
              tuluvLabel = "Цуцалсан";
            }
            if (remainingValue < 0.01) {
              tuluvLabel = "Төлсөн";
            }

            return tuluvLabel === "Цуцалсан" ? "zt-row-error" : "";
          }}
        />
      </div>
    </div>
  );
}
