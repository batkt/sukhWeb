"use client";

import React, { useMemo } from "react";
import formatNumber from "tools/function/formatNumber";
import { StandardTable } from "@/components/ui/StandardTable";
import { Tooltip } from "antd";

export interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  ner: string;
  toot: string;
  davkhar: string;
  register: string;
  undsenDun: number;
  tulsunDun: number;
  uldegdel: number;
  p0_30: number;
  p31_60: number;
  p61_90: number;
  p91_120: number;
  p120plus: number;
  [key: string]: any;
}

interface AvlagiinNasjiltTableProps {
  data: AvlagiinNasjiltItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
  totals?: {
    undsenDun: number;
    tulsunDun: number;
    uldegdel: number;
    p0_30: number;
    p31_60: number;
    p61_90: number;
    p91_120: number;
    p120plus: number;
  };
  authoritativeTotals?: {
    totalPaid: number;
    totalUldegdel: number;
    totalBilled: number;
    totalEkhniiUldegdel: number;
    paidByGereeId: Record<string, number>;
    billedByGereeId: Record<string, number>;
    uldegdelByGereeId: Record<string, number>;
  };
}

const formatNer = (val: string) => {
  if (!val) return "-";
  const parts = val.trim().split(/\s+/);
  if (parts.length >= 2) {
    const abbreviated = parts[0] ? `${parts[0].charAt(0)}.` : "";
    return [abbreviated, parts.slice(1).join(" ")].filter(Boolean).join(" ");
  }
  return val;
};

export const AvlagiinNasjiltTable: React.FC<AvlagiinNasjiltTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  totalCount = 0,
  onPageChange,
  totals,
  authoritativeTotals,
}) => {
  const columns = useMemo(() => [
    {
      label: "№",
      key: "index",
      width: 40,
      align: "center" as const,
      fixed: "left" as const,
      render: (_: any, __: any, idx: number) => (
        <span className="text-[11px] text-black dark:text-white px-0">
          {(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      key: "ner",
      label: "Оршин суугч",
      width: 130,
      align: "center" as const,
      fixed: "left" as const,
      render: (v: string) => (
        <Tooltip title={v}>
          <div className="text-left text-[11px] text-black dark:text-white truncate">
            {formatNer(v)}
          </div>
        </Tooltip>
      ),
    },
    {
      key: "toot",
      label: "Тоот",
      width: 50,
      align: "center" as const,
      fixed: "left" as const,
      render: (v: string) => <span className="text-[11px] text-black dark:text-white">{v}</span>,
    },
    {
      key: "undsenDun",
      label: "Төлөх",
      width: 90,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{formatNumber(v, 2)}</span>,
    },
    {
      key: "tulsunDun",
      label: "Төлсөн",
      width: 90,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{formatNumber(v, 2)}</span>,
    },
    {
      key: "uldegdel",
      label: "Үлдэгдэл",
      width: 95,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-[11px] text-black dark:text-white">
          {formatNumber(v, 2)}
        </span>
      ),
    },
    {
      key: "p0_30",
      label: "0-30",
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p31_60",
      label: "31-60",
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p61_90",
      label: "61-90",
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p91_120",
      label: "91-120",
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p120plus",
      label: "120+",
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-[11px] text-black dark:text-white">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
  ], [page, pageSize]);

  const footer = useMemo(() => {
    if (!totals || data.length === 0) return null;
    const finalTotals = authoritativeTotals ? {
      undsenDun: authoritativeTotals.totalBilled + authoritativeTotals.totalEkhniiUldegdel,
      tulsunDun: authoritativeTotals.totalPaid,
      uldegdel: authoritativeTotals.totalUldegdel,
      p0_30: totals.p0_30,
      p31_60: totals.p31_60,
      p61_90: totals.p61_90,
      p91_120: totals.p91_120,
      p120plus: totals.p120plus,
    } : totals;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 font-sans">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Нийт Төлөх</span>
          <span className="text-[13px] text-slate-900 dark:text-white">{formatNumber(finalTotals.undsenDun, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Нийт Төлсөн</span>
          <span className="text-[13px] text-slate-900 dark:text-white">{formatNumber(finalTotals.tulsunDun, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Нийт Үлдэгдэл</span>
          <span className="text-[13px] text-slate-900 dark:text-white">{formatNumber(finalTotals.uldegdel, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">0-30</span>
          <span className="text-[13px] text-slate-700 dark:text-slate-300">{formatNumber(finalTotals.p0_30, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">31-60</span>
          <span className="text-[13px] text-slate-700 dark:text-slate-300">{formatNumber(finalTotals.p31_60, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">61-90</span>
          <span className="text-[13px] text-slate-700 dark:text-slate-300">{formatNumber(finalTotals.p61_90, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">91-120</span>
          <span className="text-[13px] text-slate-700 dark:text-slate-300">{formatNumber(finalTotals.p91_120, 2)}₮</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">120+</span>
          <span className="text-[13px] text-slate-700 dark:text-slate-300">{formatNumber(finalTotals.p120plus, 2)}₮</span>
        </div>
      </div>
    );
  }, [totals, data.length, authoritativeTotals]);

  return (
    <>
      <style jsx global>{`
        .compact-table .ant-table-cell {
          padding: 4px 8px !important;
          font-size: 11px !important;
          line-height: 1 !important;
        }
        .compact-table .ant-table-thead > tr > th {
          padding: 6px 8px !important;
          background: #f8fafc !important;
          font-weight: 500 !important;
        }
        .dark .compact-table .ant-table-thead > tr > th {
          background: #1e293b !important;
        }
      `}</style>
      <StandardTable
      className="compact-table"
      columns={columns}
      data={data}
      loading={loading}
      pagination={
        onPageChange
          ? {
              current: page,
              pageSize: pageSize,
              total: totalCount,
              onChange: onPageChange,
            }
          : false
      }
      footer={footer}
      maxHeight="calc(100vh - 350px)"
    />
    </>
  );
};

export default AvlagiinNasjiltTable;
