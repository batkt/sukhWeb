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
  maxHeight?: string | number;
}

export const EbarimtTable: React.FC<EbarimtTableProps> = ({
  data,
  loading = false,
  maxHeight = "calc(100vh - 500px)",
}) => {
  const columns: ColumnsType<EbarimtItem> = useMemo(
    () => [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: <span className="text-gray-900 dark:text-white">Огноо</span>,
        dataIndex: "date",
        key: "date",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Тоот</span>,
        dataIndex: "toot",
        key: "toot",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {item.toot || item.medeelel?.toot || item.orshinSuugch?.toot || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Гэрээний дугаар</span>
        ),
        dataIndex: "gereeniiDugaar",
        key: "gereeniiDugaar",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Төрөл</span>,
        dataIndex: "type",
        key: "type",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => {
          const isB2C = val === "B2C_RECEIPT";
          const isB2B = val === "B2B_RECEIPT";
          const label = isB2C ? "Иргэн" : isB2B ? "ААН" : val || "-";
          const badgeClass = isB2C
            ? "bg-green-500/10 text-green-600 dark:bg-green-900/40 dark:text-green-400 border border-green-500/20 dark:border-green-500/30"
            : isB2B
              ? "bg-blue-500/10 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30"
              : "bg-gray-500/10 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-500/20 dark:border-gray-500/30";
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
        title: <span className="text-gray-900 dark:text-white">ДДТД</span>,
        dataIndex: "ddtd",
        key: "ddtd",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string, item: EbarimtItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-mono text-xs">
            {item.ddtd || item.receiptId || "-"}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Дүн</span>,
        dataIndex: "total",
        key: "total",
        align: "right",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: number) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
            {formatNumber(val || 0)}
          </span>
        ),
      },
      {
        title: <span className="text-gray-900 dark:text-white">Үйлчилгээ</span>,
        dataIndex: "service",
        key: "service",
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
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
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record.id?.toString() ||
            record.receiptId ||
            Math.random().toString()
          }
          pagination={false}
          size="small"
          bordered
          loading={loading}
          className="guilgee-table min-w-[1000px]"
          scroll={{ x: "max-content", y: maxHeight }}
          rowClassName={(record, index) => `
            ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
            text-gray-900 dark:text-white
            hover:bg-gray-100 dark:hover:bg-gray-600
            transition-colors duration-200
          `}
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          summary={() =>
            data.length > 0 ? (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6} align="center">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Нийт:
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatNumber(totalAmount)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default EbarimtTable;
