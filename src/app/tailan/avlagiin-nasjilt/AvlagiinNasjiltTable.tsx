"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import formatNumber from "../../../../tools/function/formatNumber";

export interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  ner: string;
  toot: string;
  davkhar: string;
  register: string;
  undsenDun: number;
  aldangi: number;
  khungulult: number;
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
  totals?: {
    undsenDun: number;
    khungulult: number;
    tulsunDun: number;
    uldegdel: number;
    p0_30: number;
    p31_60: number;
    p61_90: number;
    p91_120: number;
    p120plus: number;
  };
}

export const AvlagiinNasjiltTable: React.FC<AvlagiinNasjiltTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 200,
  totals,
}) => {
  const columns: ColumnsType<AvlagiinNasjiltItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        fixed: "left",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Гэрээ",
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        width: 100,
        align: "center",
        fixed: "left",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap font-medium">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Оршин суугч",
        dataIndex: "ner",
        key: "ner",
        width: 150,
        fixed: "left",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap font-medium truncate max-w-[140px]" title={val}>
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Давхар",
        dataIndex: "davkhar",
        key: "davkhar",
        width: 70,
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        width: 70,
        align: "center",
        render: (val: string, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {val || record.talbainDugaar || "-"}
          </span>
        ),
      },
      {
        title: "Нийт",
        dataIndex: "undsenDun",
        key: "undsenDun",
        width: 100,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.niitDun)}
          </span>
        ),
      },
      {
        title: "Хөнгөлөлт",
        dataIndex: "khungulult",
        key: "khungulult",
        width: 100,
        align: "right",
        render: (val: number) => (
          <span className="text-theme/60 whitespace-nowrap">
            {formatNumber(val)}
          </span>
        ),
      },
      {
        title: "Төлсөн",
        dataIndex: "tulsunDun",
        key: "tulsunDun",
        width: 100,
        align: "right",
        render: (val: number) => (
          <span className="text-emerald-600 whitespace-nowrap">
            {formatNumber(val)}
          </span>
        ),
      },
      {
        title: "Авлага",
        dataIndex: "uldegdel",
        key: "uldegdel",
        width: 100,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-red-500 font-bold whitespace-nowrap">
            {formatNumber(val ?? record.tulukhDun)}
          </span>
        ),
      },
      {
        title: "0-30",
        dataIndex: "p0_30",
        key: "p0_30",
        width: 80,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.avalaga0)}
          </span>
        ),
      },
      {
        title: "31-60",
        dataIndex: "p31_60",
        key: "p31_60",
        width: 80,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.avlaga31)}
          </span>
        ),
      },
      {
        title: "61-90",
        dataIndex: "p61_90",
        key: "p61_90",
        width: 80,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.avlaga61)}
          </span>
        ),
      },
      {
        title: "91-120",
        dataIndex: "p91_120",
        key: "p91_120",
        width: 80,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.avlaga91)}
          </span>
        ),
      },
      {
        title: "120+",
        dataIndex: "p120plus",
        key: "p120plus",
        width: 80,
        align: "right",
        render: (val: number, record: AvlagiinNasjiltItem) => (
          <span className="text-theme whitespace-nowrap">
            {formatNumber(val ?? record.avlaga120)}
          </span>
        ),
      },
    ],
    [page, pageSize]
  );

  return (
    <div className="guilgee-table-wrap">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record._id || Math.random().toString()}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content", y: 480 }}
        locale={{ emptyText: "Мэдээлэл олдсонгүй" }}
        summary={() =>
          totals && data.length > 0 ? (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="center">
                  <span className="font-bold text-theme text-xs uppercase tracking-wider">
                    НИЙТ
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <span className="font-semibold text-theme">
                    {formatNumber(totals.undsenDun)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <span className="text-theme/60">
                    {formatNumber(totals.khungulult)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span className="text-emerald-600">
                    {formatNumber(totals.tulsunDun)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <span className="text-red-500 font-semibold">
                    {formatNumber(totals.uldegdel)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <span className="text-theme/70">
                    {formatNumber(totals.p0_30)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <span className="text-theme/70">
                    {formatNumber(totals.p31_60)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <span className="text-theme/70">
                    {formatNumber(totals.p61_90)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <span className="text-theme/70">
                    {formatNumber(totals.p91_120)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right">
                  <span className="text-theme/70">
                    {formatNumber(totals.p120plus)}
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
      />
    </div>
  );
};

export default AvlagiinNasjiltTable;
