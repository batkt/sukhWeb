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
          title: <span className="text-inherit">{col.label}</span>,
          width: col.minWidth || col.width,
          minWidth: col.minWidth,
          align:
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
          className:
            "text-[11px] bg-gray-50/50 dark:bg-slate-900/50 text-[color:var(--panel-text)] py-1",
          onCell: () => ({
            className:
              col.key === "paid" ||
              col.key === "uldegdel" ||
              col.key === "ekhniiUldegdel"
                ? "!text-right"
                : col.key === "ner"
                  ? "!text-left"
                  : "!text-center",
          }),
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
              return (
                <span className="text-gray-900 dark:text-white">
                  {String(ct?.toot || residentToot || record?.toot || "-")}
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
                <span className="text-gray-900 dark:text-white">{utas}</span>
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
                      residentOrts ??
                      resident?.orts ??
                      resident?.ortsDugaar ??
                      resident?.ortsNer ??
                      resident?.block ??
                      record?.orts ??
                      record?.ortsDugaar ??
                      record?.ortsNer ??
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
              return (
                <span className="text-gray-900 dark:text-white">
                  {String(residentDavkhar ?? record?.davkhar ?? "-")}
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
                <span className="text-gray-900 dark:text-white">
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
              const paidFromSummary = gid
                ? (paidSummaryByGereeId[gid] ??
                  Number(record?._totalTulsun ?? 0))
                : Number(record?._totalTulsun ?? 0);
              return (
                <span className="text-gray-900 dark:text-white">
                  {formatNumber(paidFromSummary, 2)}
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
              return (
                <span className="text-gray-900 dark:text-white">{lastLog}</span>
              );
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
                <div className="flex items-center justify-center gap-1 divide-x divide-gray-200 dark:divide-gray-700">
                  <button
                    onClick={() => onViewInvoice(residentData)}
                    className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    title="Нэхэмжлэх харах"
                  >
                    <Eye className="w-5 h-5 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300" />
                  </button>
                  <button
                    onClick={() => onViewHistory(residentData)}
                    className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    title="Түүх харах"
                  >
                    <History className="w-5 h-5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" />
                  </button>
                  <button
                    onClick={() => onTransaction(residentData, remainingValue)}
                    className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                    title="Гүйлгээ хийх"
                  >
                    <Banknote className="w-5 h-5 text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300" />
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
        <Table.Summary.Row className="bg-gray-50 dark:bg-gray-800">
          {/* Empty cell for checkbox column alignment */}
          {isCheckboxVisible && (
            <Table.Summary.Cell index={0} className="text-center">
              -
            </Table.Summary.Cell>
          )}
          {dataCols.map((col, colIdx) => {
            let content: React.ReactNode = "";

            if (col.key === "ekhniiUldegdel") {
              const total = deduplicatedResidents.reduce(
                (sum: number, it: any) => {
                  return sum + Number(it?._ekhniiUldegdelAmount ?? 0);
                },
                0,
              );
              content = (
                <span
                  className={
                    (total < 0
                      ? "!text-emerald-600 dark:!text-emerald-400"
                      : total > 0
                        ? "!text-red-500 dark:!text-red-400 font bold"
                        : "text-[color:var(--panel-text)]") + " font-bold"
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
                    ? (paidSummaryByGereeId[gid] ??
                      Number(it?._totalTulsun ?? 0))
                    : Number(it?._totalTulsun ?? 0);
                  return sum + paid;
                },
                0,
              );
              content = (
                <span className="text-slate-900 dark:!text-white font-bold">
                  {formatNumber(total, 2)} ₮
                </span>
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
                    (total < 0.01
                      ? "!text-emerald-600 dark:!text-emerald-400"
                      : "!text-red-500 dark:!text-red-400") + " font-bold"
                  }
                >
                  {formatNumber(total, 2)} ₮
                </span>
              );
            }

            return (
              <Table.Summary.Cell
                key={col.key}
                index={colIdx + checkboxOffset}
                className={`${
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
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          summary={getSummary}
          columns={columns}
          rowClassName={(record: any, index: number) => {
            // Base alternating row colors
            const baseClass =
              index % 2 === 0
                ? "bg-white dark:bg-gray-800"
                : "bg-gray-50 dark:bg-gray-700/50";

            // Highlight cancelled items with red background
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
            };
            let tuluvLabel: string = getPaymentStatusLabel(itForTuluv);
            if (record?.tuluv === "Цуцалсан" || record?.status === "Цуцалсан") {
              tuluvLabel = "Цуцалсан";
            }
            if (remainingValue < 0.01) {
              tuluvLabel = "Төлсөн";
            }

            const cancelledClass =
              tuluvLabel === "Цуцалсан" ? " row-cancelled" : "";
            return `${baseClass} text-gray-900 dark:text-white transition-colors compact-row${cancelledClass}`;
          }}
        />
      </div>
    </div>
  );
}
