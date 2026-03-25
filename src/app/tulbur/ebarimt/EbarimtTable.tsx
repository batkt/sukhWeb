"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import formatNumber from "../../../../tools/function/formatNumber";

export interface EbarimtItem {
  id?: string | number;
  receiptId?: string;
  ddtd?: string;
  date?: string;
  month?: string;
  total?: number;
  toot?: string;
  gereeniiDugaar?: string;
  totalVAT?: number;
  totalCityTax?: number;
  type?: string;
  payStatus?: string;
  payCode?: string;
  service?: string;
  [key: string]: any;
}

interface EbarimtTableProps {
  data: EbarimtItem[];
  loading?: boolean;
}

export const EbarimtTable: React.FC<EbarimtTableProps> = ({
  data,
  loading = false,
}) => {
  const columns: ColumnsType<EbarimtItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Огноо",
        dataIndex: "date",
        key: "date",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Тоот",
        dataIndex: "toot",
        key: "toot",
        align: "center",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-theme whitespace-nowrap">
            {item.toot || item.medeelel?.toot || item.orshinSuugch?.toot || "-"}
          </span>
        ),
      },
      {
        title: "Гэрээний дугаар",
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Төрөл",
        dataIndex: "type",
        key: "type",
        align: "center",
        render: (val: string) => {
          const isB2C = val === "B2C_RECEIPT";
          const isB2B = val === "B2B_RECEIPT";
          const label = isB2C ? "Иргэн" : isB2B ? "ААН" : val || "-";
          const badgeClass = isB2C
            ? "bg-green-500/10 text-green-600 border border-green-500/20"
            : isB2B
              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              : "bg-gray-500/10 text-gray-600 border border-gray-500/20";
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${badgeClass}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        title: "ДДТД",
        dataIndex: "ddtd",
        key: "ddtd",
        align: "center",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-theme whitespace-nowrap font-mono text-xs">
            {item.ddtd || item.receiptId || "-"}
          </span>
        ),
      },
      {
        title: "Дүн",
        dataIndex: "total",
        key: "total",
        align: "right",
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap font-medium">
            {formatNumber(val || 0)}
          </span>
        ),
      },
      {
        title: "Үйлчилгээ",
        dataIndex: "service",
        key: "service",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
    ],
    [],
  );

  const totalAmount = useMemo(
    () => data.reduce((sum, item) => sum + (item.total || 0), 0),
    [data],
  );

  return (
    <div className="guilgee-table-wrap">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) =>
          record.id?.toString() || record.receiptId || Math.random().toString()
        }
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content", y: 480 }}
        locale={{ emptyText: "Хайсан мэдээлэл алга байна" }}
        summary={() =>
          data.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6} align="center">
                <span className="font-bold text-theme">Нийт:</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <span className="font-bold text-theme">
                  {formatNumber(totalAmount)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="center">
                -
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null
        }
      />
    </div>
  );
};

export default EbarimtTable;
