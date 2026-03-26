"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import { Eye, History, Banknote } from "lucide-react";
import formatNumber from "../../../../tools/function/formatNumber";
import { getPaymentStatusLabel } from "@/lib/utils";

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
  paidSummaryByGereeId: Record<string, number>;
  bestKnownBalances: Record<string, number>;
  sortField: string | null;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string | null, order: "asc" | "desc") => void;
  page: number;
  rowsPerPage: number;
  deduplicatedResidents: any[];
  getGereeId: (it: any) => string;
  onViewInvoice: (resident: any) => void;
  onViewHistory: (resident: any) => void;
  onTransaction: (resident: any, remainingValue: number) => void;
  maxHeight?: string | number;
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
  paidSummaryByGereeId,
  bestKnownBalances,
  sortField,
  sortOrder,
  onSortChange,
  page,
  rowsPerPage,
  deduplicatedResidents,
  getGereeId,
  onViewInvoice,
  onViewHistory,
  onTransaction,
  maxHeight = "calc(100vh - 500px)",
}: GuilgeeTableProps) {
  // Check if checkbox column is visible
  const isCheckboxVisible = visibleColumns.some(
    (col) => col.key === "checkbox",
  );

  // Build Ant Design columns from visibleColumns
  const columns = useMemo(() => {
    return visibleColumns
      .filter((col) => col.key !== "checkbox")
      .map((col): any => {
        const baseColumn = {
          key: col.key,
          dataIndex: col.key,
          title: col.label,
          width: col.minWidth || col.width,
          minWidth: col.minWidth,
          align:
            col.align === "right" ||
            col.key === "tulbur" ||
            col.key === "paid" ||
            col.key === "uldegdel" ||
            col.key === "ekhniiUldegdel"
                ? "center"
                : "center",
          sorter:
            col.key === "uldegdel" || col.key === "paid" || col.key === "toot"
              ? true
              : false,
          fixed: col.sticky ? ("left" as const) : undefined,
          className: "text-xs",
        };

        // Custom render functions
        if (col.key === "index") {
          return {
            ...baseColumn,
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
              return ner;
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
              const residentToot =
                Array.isArray(resident?.toots) && resident.toots.length > 0
                  ? resident.toots[0]?.toot
                  : resident?.toot;
              const ct =
                (record?.gereeniiId &&
                  contractsById[String(record.gereeniiId)]) ||
                (record?.gereeniiDugaar &&
                  contractsByNumber[String(record.gereeniiDugaar)]) ||
                undefined;
              return String(ct?.toot || residentToot || record?.toot || "-");
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
              return utas;
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
              return String(
                ct?.orts ??
                  ct?.ortsDugaar ??
                  ct?.ortsNer ??
                  residentOrts ??
                  resident?.orts ??
                  resident?.ortsDugaar ??
                  resident?.ortsNer ??
                  resident?.block ??
                  record?.orts ??
                  record?.ortsDugaar ??
                  record?.ortsNer ??
                  "-",
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
              return String(residentDavkhar ?? record?.davkhar ?? "-");
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
              return String(
                record?.gereeniiDugaar || ct?.gereeniiDugaar || "-",
              );
            },
          };
        }

        if (col.key === "tulbur") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const niitDun = Number(
                record?.niitTulburOriginal ??
                  record?.niitTulbur ??
                  record?.niitDun ??
                  record?.total ??
                  0,
              );
              return formatNumber(niitDun, 2);
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
              const paidFromSummary = gid
                ? (paidSummaryByGereeId[gid] ??
                  Number(record?._totalTulsun ?? 0))
                : Number(record?._totalTulsun ?? 0);
              return formatNumber(paidFromSummary, 2);
            },
          };
        }

        if (col.key === "uldegdel") {
          return {
            ...baseColumn,
            render: (_: any, record: any) => {
              const gid = getGereeId(record);
              const historyAggregate =
                Number(record?._totalTulbur || 0) -
                Number(record?._totalTulsun || 0);
              const remainingValue =
                bestKnownBalances[gid] ??
                (historyAggregate || Number(record?.uldegdel ?? 0));
              return (
                <span
                  className={
                    remainingValue < 0.01
                      ? "!text-emerald-600 dark:!text-emerald-400"
                      : "!text-red-500 dark:!text-red-400"
                  }
                >
                  {formatNumber(remainingValue, 2)}
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
              const remainingValue =
                bestKnownBalances[gid] ??
                (historyAggregate || Number(record?.uldegdel ?? 0));
              const itForTuluv = {
                ...record,
                uldegdel: remainingValue,
                _paidFromSummary: gid
                  ? (paidSummaryByGereeId[gid] ??
                    Number(record?._totalTulsun ?? 0))
                  : Number(record?._totalTulsun ?? 0),
              };
              let tuluvLabel: string = getPaymentStatusLabel(itForTuluv);
              if (
                record?.tuluv === "Цуцалсан" ||
                record?.status === "Цуцалсан"
              ) {
                tuluvLabel = "Цуцалсан";
              }
              if (remainingValue < 0.01) {
                tuluvLabel = "Төлсөн";
              }
              const isPaid = tuluvLabel === "Төлсөн";
              return (
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full text-sm " +
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
              return lastLog;
            },
          };
        }

        if (col.key === "action") {
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
              const remainingValue =
                bestKnownBalances[gid] ??
                (historyAggregate || Number(record?.uldegdel ?? 0));

              const residentData = resident || {
                _id: record?.orshinSuugchId,
                ner: ner,
                toot: toot,
                utas: utas,
                gereeniiDugaar: dugaar,
                gereeniiId: record?.gereeniiId || ct?._id,
                ...record,
              };

              return (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onViewInvoice(residentData)}
                    className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors"
                    title="Нэхэмжлэх харах"
                  >
                    <Eye className="w-5 h-5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => onViewHistory(residentData)}
                    className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors"
                    title="Түүх харах"
                  >
                    <History className="w-5 h-5 text-green-500" />
                  </button>
                  <button
                    onClick={() => onTransaction(residentData, remainingValue)}
                    className="p-2 rounded hover:bg-[color:var(--surface-hover)] transition-colors group"
                    title="Гүйлгээ хийх"
                  >
                    <Banknote className="w-5 h-5 text-[color:var(--theme)] group-hover:opacity-80 transition-opacity" />
                  </button>
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
    paidSummaryByGereeId,
    bestKnownBalances,
    getGereeId,
    deduplicatedResidents,
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
    // Get visible columns excluding checkbox for alignment with data columns
    const dataCols = visibleColumns.filter((col) => col.key !== "checkbox");
    // Calculate index offset for summary cells when checkbox is visible
    const checkboxOffset = isCheckboxVisible ? 1 : 0;

    return (
      <Table.Summary fixed="bottom">
        <Table.Summary.Row>
          {/* Empty cell for checkbox column alignment */}
          {isCheckboxVisible && (
            <Table.Summary.Cell index={0} className="text-center">
              -
            </Table.Summary.Cell>
          )}
          {dataCols.map((col, colIdx) => {
            let content: React.ReactNode = "";

            if (col.key === "tulbur") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const niitDun = Number(
                    it?.niitTulburOriginal ??
                      it?.niitTulbur ??
                      it?.niitDun ??
                      it?.total ??
                      0,
                  );
                  return sum + niitDun;
                },
                0,
              );
              content = (
                <span className="text-theme">{formatNumber(total, 2)}</span>
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
                  {formatNumber(total, 2)}
                </span>
              );
            } else if (col.key === "paid") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const gid = getGereeId(it);
                  const paid = gid
                    ? (paidSummaryByGereeId[gid] ??
                      Number(it?._totalTulsun ?? 0))
                    : Number(it?._totalTulsun ?? 0);
                  return sum + paid;
                },
                0,
              );
              content = (
                <span className="text-theme">{formatNumber(total, 2)}</span>
              );
            } else if (col.key === "uldegdel") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  const gid =
                    String(it?.gereeniiId || it?.gereeId || "").trim() ||
                    (it?.gereeniiDugaar &&
                      String(
                        contractsByNumber[String(it.gereeniiDugaar)]?._id || "",
                      )) ||
                    "";
                  const historyAggregate =
                    Number(it?._totalTulbur || 0) -
                    Number(it?._totalTulsun || 0);
                  const balance =
                    bestKnownBalances[gid] ??
                    (historyAggregate || Number(it?.uldegdel ?? 0));
                  return sum + balance;
                },
                0,
              );
              content = (
                <span
                  className={
                    total < 0.01
                      ? "!text-emerald-600 dark:!text-emerald-400"
                      : "!text-red-500 dark:!text-red-400"
                  }
                >
                  {formatNumber(total, 2)}
                </span>
              );
            }

            return (
              <Table.Summary.Cell
                key={col.key}
                index={colIdx + checkboxOffset}
                className={`${
                  col.key === "tulbur" ||
                  col.key === "paid" ||
                  col.key === "uldegdel" ||
                  col.key === "ekhniiUldegdel"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
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

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          className="guilgee-table min-w-[1000px]"
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      bordered
      tableLayout="auto"
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
      scroll={{ x: "max-content", y: maxHeight }}
      locale={{ emptyText: "Хайсан мэдээлэл алга байна" }}
      summary={getSummary}
      columns={columns}
      rowClassName={(record: any) => {
        // Highlight cancelled items with red background
        const gid = getGereeId(record);
        const historyAggregate =
          Number(record?._totalTulbur || 0) - Number(record?._totalTulsun || 0);
        const remainingValue =
          bestKnownBalances[gid] ??
          (historyAggregate || Number(record?.uldegdel ?? 0));
        const itForTuluv = {
          ...record,
          uldegdel: remainingValue,
        };
        let tuluvLabel: string = getPaymentStatusLabel(itForTuluv);
        if (record?.tuluv === "Цуцалсан" || record?.status === "Цуцалсан") {
          tuluvLabel = "Цуцалсан";
        }
        if (remainingValue < 0.01) {
          tuluvLabel = "Төлсөн";
        }
        if (tuluvLabel === "Цуцалсан") {
          return "row-cancelled";
        }
        return "";
      }}
    />
      </div>
    </div>
  );
}
