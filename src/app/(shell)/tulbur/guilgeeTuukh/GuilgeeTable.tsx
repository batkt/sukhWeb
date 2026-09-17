"use client";

import React, { useMemo } from "react";
import { Spin, Tooltip } from "antd";
import Table from "@/components/ui/table";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Eye, History, Banknote, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import formatNumber from "../../../../../tools/function/formatNumber";
import { getPaymentStatusLabel } from "@/lib/utils";
import { pickMonthSlice } from "./guilgeeMonthMatrix";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("mn-MN") : "-";

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
  token,
  ajiltan,
  effectiveBarilgiinId,
  ekhlekhOgnoo,
}: GuilgeeTableProps) {
  // Check if checkbox column is visible
  const isCheckboxVisible = visibleColumns.some(
    (col) => col.key === "checkbox",
  );

  const [sendingSmsId, setSendingSmsId] = React.useState<string | null>(null);

  const handleSendReminderSms = async (record: any) => {
    if (!token) return;
    const gid = getGereeId(record);
    if (!gid) {
      toast.error("Гэрээний ID олдсонгүй.");
      return;
    }
    setSendingSmsId(gid);
    try {
      const res = await uilchilgee(token).post(`/nekhemjlekh/${gid}/send-reminder-sms`);
      if (res.data?.success) {
        toast.success(res.data.message || "Төлбөр сануулах SMS амжилттай илгээгдлээ.");
      } else {
        toast.error(res.data?.message || "SMS илгээхэд алдаа гарлаа.");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
        e?.message ||
        "SMS илгээхэд алдаа гарлаа."
      );
    } finally {
      setSendingSmsId(null);
    }
  };

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
            col.key === "uldegdel" || col.key === "paid" || col.key === "toot"
              ? true
              : false,
          fixed: col.sticky ? ("left" as const) : undefined,
          onCell: () => ({
            className:
              (col.align === "end"
                ? "!text-right"
                : col.align === "start"
                  ? "!text-left"
                  : "!text-center") + " !py-0.5 !leading-tight",
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
                <span className="text-gray-900 dark:text-white">{ner}</span>
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
                <span className="text-center block text-gray-900 dark:text-white leading-tight">
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
                <span className="text-center block text-gray-900 dark:text-white">
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
                <span className="text-gray-900 dark:text-white">
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
                <span className="text-gray-900 dark:text-white">
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
                <span className="text-center block text-gray-900 dark:text-white">
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
              const amt = Number(record?._ekhniiUldegdelAmount ?? 0);
              return (
                <span
                  className={
                    amt <= 0
                      ? "!text-emerald-600 dark:!text-emerald-400"
                      : "!text-red-500 dark:!text-red-400"
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
              const gid = getGereeId(record);
              const paidDisplay = gid
                ? Number(monthPaidByGereeId[gid] ?? 0)
                : 0;
              return (
                <span className="text-gray-900 dark:text-white">
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
              const gid = getGereeId(record);
              const discVal = gid && khungulultMap[gid] ? Number(khungulultMap[gid]) : 0;
              return (
                <span className="text-gray-900 dark:text-white">
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
              const gid = getGereeId(record);
              const gDugaar = record?.gereeniiDugaar || (record?.gereeniiId && contractsById[String(record.gereeniiId)]?.gereeniiDugaar);

              const monthlyData = gid ? monthlyDataByGereeId?.get(gid) : (gDugaar ? monthlyDataByGereeId?.get(String(gDugaar)) : null);

              const monthSlice = pickMonthSlice(
                monthlyData,
                monthlyPeriods,
                matrixMonthKey,
              );
              const billedDisplay =
                monthSlice != null
                  ? Number(monthSlice.billed ?? 0)
                  : Number(record?._totalTulbur ?? 0);
              return (
                <span className="text-gray-900 dark:text-white">
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
              const gid = getGereeId(record);
              const balance = bestKnownBalances[gid] ?? 0;
              return (
                <span
                  className={
                    balance < 0.01
                      ? "!text-emerald-600 dark:!text-emerald-400 font-medium"
                      : "!text-red-500 dark:!text-red-400 font-medium"
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
              const gid = getGereeId(record);
              const gDugaar = record?.gereeniiDugaar || (record?.gereeniiId && contractsById[String(record.gereeniiId)]?.gereeniiDugaar);

              // 1. Prioritize server-computed balance (uldegdelBodyo)
              const serverBalance = gid ? bestKnownBalances[gid] : null;
              if (serverBalance != null) {
                return (
                  <span className={serverBalance < 0.01 ? "!text-emerald-600 dark:!text-emerald-400 font-medium" : "!text-red-500 dark:!text-red-400 font-medium"}>
                    {formatNumber(serverBalance, 2)}
                  </span>
                );
              }

              // 2. Fallback to monthly matrix
              const monthlyData = gid ? monthlyDataByGereeId?.get(gid) : (gDugaar ? monthlyDataByGereeId?.get(String(gDugaar)) : null);
              const monthSlice = pickMonthSlice(monthlyData, monthlyPeriods, matrixMonthKey);
              if (monthSlice != null) {
                const b = Number(monthSlice.uldegdel ?? 0);
                return (
                  <span className={b < 0.01 ? "!text-emerald-600 dark:!text-emerald-400 font-medium" : "!text-red-500 dark:!text-red-400 font-medium"}>
                    {formatNumber(b, 2)}
                  </span>
                );
              }

              // 3. Last resort: local aggregation
              const aggB = Number(record?._totalTulburMonth || 0) - Number(record?._totalTulsunMonth || 0);
              return (
                <span className={aggB < 0.01 ? "!text-emerald-600 dark:!text-emerald-400 font-medium" : "!text-red-500 dark:!text-red-400 font-medium"}>
                  {formatNumber(aggB, 2)}
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
                          ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
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
                <span className="text-gray-900 dark:text-white">{lastLog}</span>
              );
            },
          };
        }

        if (col.key === "action") {
          return {
            ...baseColumn,
            width: 160,
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
                <div className="flex items-center justify-center gap-2 py-0">
                  {canCreateTransaction && (
                    <Tooltip title="Гүйлгээ хийх">
                      <button
                        type="button"
                        onClick={() => onTransaction(residentData, remainingValue)}
                        className="bg-transparent border-0 p-1 text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none"
                      >
                        <Banknote className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip title="Төлбөр сануулах SMS">
                    <button
                      type="button"
                      onClick={() => handleSendReminderSms(record)}
                      disabled={sendingSmsId === gid}
                      className="bg-transparent border-0 p-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors disabled:opacity-40 focus:outline-none"
                    >
                      {sendingSmsId === gid ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip title="Түүх харах">
                    <button
                      type="button"
                      onClick={() => onViewHistory(residentData)}
                      className="bg-transparent border-0 p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none"
                    >
                      <History className="w-5 h-5" />
                    </button>
                  </Tooltip>
                  <Tooltip title="Нэхэмжлэх харах">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(residentData)}
                      className="bg-transparent border-0 p-1 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors focus:outline-none"
                    >
                      <Eye className="w-5 h-5" />
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
    deduplicatedResidents,
    monthlyDataByGereeId,
    monthlyPeriods,
    matrixMonthKey,
    historyScopedByDate,
    canCreateTransaction,
    sendingSmsId,
    handleSendReminderSms,
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

  // Calculate summary/footer data
  const getSummary = () => {
    const dataCols = visibleColumns.filter((col) => col.key !== "checkbox");
    const checkboxOffset = isCheckboxVisible ? 1 : 0;

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row className="bg-gray-50 dark:bg-gray-800">
          {isCheckboxVisible && (
            <Table.Summary.Cell
              index={0}
              className="text-center text border-r border-[hsl(var(--zt-border))]"
            >
              -
            </Table.Summary.Cell>
          )}
          {dataCols.map((col, colIdx) => {
            let content: React.ReactNode = "";

            if (col.key === "ekhniiUldegdel") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => sum + Number(it?._ekhniiUldegdelAmount ?? 0),
                0,
              );
              content = (
                <span className="font-bold text-slate-900 dark:!text-white">
                  {formatNumber(total, 2)} ₮
                </span>
              );
            } else if (col.key === "sariinTurees") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const gid = getGereeId(it);
                  const monthlyData = gid ? monthlyDataByGereeId?.get(gid) : null;
                  const monthSlice = pickMonthSlice(monthlyData, monthlyPeriods, matrixMonthKey);
                  const v = monthSlice != null ? Number(monthSlice.billed ?? 0) : Number(it?._totalTulbur ?? 0);
                  return sum + v;
                },
                0,
              );
              content = (
                <span className="text-slate-900 dark:!text-white font-bold">
                  {formatNumber(total, 2)} ₮
                </span>
              );
            } else if (col.key === "paid") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const gid = getGereeId(it);
                  const v = gid ? Number(monthPaidByGereeId[gid] ?? 0) : 0;
                  return sum + v;
                },
                0,
              );
              content = (
                <span className="text-slate-900 dark:!text-white font-bold">
                  {formatNumber(total, 2)} ₮
                </span>
              );
            } else if (col.key === "uldegdel") {
              const totalBalance = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const gid = getGereeId(it);
                  return sum + (bestKnownBalances[gid] ?? 0);
                },
                0,
              );
              content = (
                <span className="font-bold text-slate-900 dark:!text-white">
                  {formatNumber(totalBalance, 2)} ₮
                </span>
              );
            } else if (col.key === "sariinUldegdel") {
              const total = deduplicatedResidents.reduce((sum: number, it: any) => {
                const gid = getGereeId(it);
                const serverB = gid ? bestKnownBalances[gid] : null;
                if (serverB != null) return sum + serverB;

                const gD = it?.gereeniiDugaar || (it?.gereeniiId && contractsById[String(it.gereeniiId)]?.gereeniiDugaar);
                const mData = gid ? monthlyDataByGereeId?.get(gid) : (gD ? monthlyDataByGereeId?.get(String(gD)) : null);
                const mSlice = pickMonthSlice(mData, monthlyPeriods, matrixMonthKey);
                if (mSlice != null) return sum + Number(mSlice.uldegdel ?? 0);

                return sum + (Number(it?._totalTulburMonth || 0) - Number(it?._totalTulsunMonth || 0));
              }, 0);

              content = (
                <span className="font-bold text-slate-900 dark:!text-white">
                  {formatNumber(total, 2)} ₮
                </span>
              );
            }

            return (
              <Table.Summary.Cell
                key={col.key}
                index={colIdx + checkboxOffset}
                className={`${col.align === "end"
                  ? "text-right"
                  : col.align === "start"
                    ? "text-left"
                    : "text-center"
                  }`}
              >
                {content}
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
          className="[&_td]:!py-0.5 [&_td]:!leading-tight"
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
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
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
