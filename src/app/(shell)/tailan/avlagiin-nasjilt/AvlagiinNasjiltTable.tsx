"use client";

import React, { useMemo } from "react";
import formatNumber from "tools/function/formatNumber";
import { StandardTable } from "@/components/ui/StandardTable";
import { Tooltip } from "antd";
import Table from "@/components/ui/table";

export interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  ner: string;
  toot: string;
  davkhar: string;
  register: string;
  undsenDun: number;
  khungulult?: number;
  tulsunDun: number;
  uldegdel: number;
  avlagiinKhonog: number;
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
    khungulult?: number;
    tulsunDun: number;
    uldegdel: number;
    avlagiinKhonog?: number;
    p0_30: number;
    p31_60: number;
    p61_90: number;
    p91_120: number;
    p120plus: number;
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
  pageSize = 500,
  totalCount = 0,
  onPageChange,
  totals,
}) => {
  const columns = useMemo(() => [
    {
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">№</span>
        </div>
      ),
      key: "index",
      width: 40,
      align: "center" as const,
      fixed: "left" as const,
      render: (_: any, __: any, idx: number) => (
        <span className="text-black dark:text-white px-0 leading-normal">
          {(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      key: "ner",
      label: (
        <div className="flex justify-start w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Оршин суугч</span>
        </div>
      ),
      width: 130,
      align: "center" as const,
      fixed: "left" as const,
      render: (v: string) => (
        <Tooltip title={v}>
          <div className="text-left text-black dark:text-white truncate py-0.5 leading-normal">
            {formatNer(v)}
          </div>
        </Tooltip>
      ),
    },
    {
      key: "toot",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Тоот</span>
        </div>
      ),
      width: 50,
      align: "center" as const,
      fixed: "left" as const,
      render: (v: string) => <span className="text-black dark:text-white leading-normal">{v}</span>,
    },
    {
      key: "undsenDun",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Төлөх</span>
        </div>
      ),
      width: 90,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{formatNumber(v, 2)}</span>,
    },
    {
      key: "khungulult",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium text-brand">Хөнгөлөлт</span>
        </div>
      ),
      width: 90,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-brand font-medium leading-normal">
          {Number(v) > 0 ? formatNumber(v, 2) : "-"}
        </span>
      ),
    },
    {
      key: "tulsunDun",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Төлсөн</span>
        </div>
      ),
      width: 90,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{formatNumber(v, 2)}</span>,
    },
    {
      key: "uldegdel",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Үлдэгдэл</span>
        </div>
      ),
      width: 95,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-black dark:text-white leading-normal">
          {formatNumber(v, 2)}
        </span>
      ),
    },
    {
      key: "avlagiinKhonog",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">Авлагын хоног</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => (
        <span className="text-black dark:text-white leading-normal">
          {Number(v) > 0 ? Number(v) : ""}
        </span>
      ),
    },
    {
      key: "p0_30",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">0-30</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p31_60",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">31-60</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p61_90",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">61-90</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p91_120",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">91-120</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
    {
      key: "p120plus",
      label: (
        <div className="flex justify-center w-full py-0.5">
          <span className="leading-normal pb-0.5 font-medium">120+</span>
        </div>
      ),
      width: 85,
      align: "center" as const,
      render: (v: number) => <span className="text-black dark:text-white leading-normal">{v !== 0 ? formatNumber(v, 2) : ""}</span>,
    },
  ], [page, pageSize]);

  // Хүснэгтийн доорх тусдаа dashboard-ын оронд баганатайгаа зэрэгцсэн хөл мөр
  const summary = () => {
    if (!totals || data.length === 0) return null;
    const dun = (v?: number) => (Number(v) ? formatNumber(Number(v), 2) : "");
    const nuduud: { key: string; utga: React.ReactNode; cls?: string }[] = [
      { key: "undsenDun", utga: dun(totals.undsenDun) },
      { key: "khungulult", utga: dun(totals.khungulult) || "-", cls: "text-brand" },
      { key: "tulsunDun", utga: dun(totals.tulsunDun) },
      { key: "uldegdel", utga: dun(totals.uldegdel), cls: totals.uldegdel > 0 ? "text-danger" : "" },
      { key: "avlagiinKhonog", utga: totals.avlagiinKhonog ? `${totals.avlagiinKhonog} (их)` : "" },
      { key: "p0_30", utga: dun(totals.p0_30) },
      { key: "p31_60", utga: dun(totals.p31_60) },
      { key: "p61_90", utga: dun(totals.p61_90) },
      { key: "p91_120", utga: dun(totals.p91_120) },
      { key: "p120plus", utga: dun(totals.p120plus) },
    ];
    return (
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={3} fixed="left" className="text-[12px]">
          Нийт {data.length} мөр
        </Table.Summary.Cell>
        {nuduud.map((n, i) => (
          <Table.Summary.Cell key={n.key} index={i + 1} align="center" className={`tabular-nums ${n.cls || ""}`}>
            {n.utga}
          </Table.Summary.Cell>
        ))}
      </Table.Summary.Row>
    );
  };

  return (
    <>
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
      summary={summary}
    />
    </>
  );
};

export default AvlagiinNasjiltTable;
