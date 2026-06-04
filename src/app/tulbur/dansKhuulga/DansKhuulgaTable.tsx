"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, ExclamationOutlined } from "@ant-design/icons";
import formatNumber from "../../../../tools/function/formatNumber";

export interface DansKhuulgaItem {
  id: string | number;
  date: string;
  month: string;
  total: number;
  action: string;
  contractIds?: string[];
  account?: string;
  raw?: any;
  [key: string]: any;
}

interface DansKhuulgaTableProps {
  data: DansKhuulgaItem[];
  loading?: boolean;
  page?: number;
  rowsPerPage?: number;
  maxHeight?: string | number;
  onLink?: (item: DansKhuulgaItem) => void;
  onUnlink?: (item: DansKhuulgaItem) => void;
}

export const DansKhuulgaTable: React.FC<DansKhuulgaTableProps> = ({
  data,
  loading = false,
  page = 1,
  rowsPerPage = 100,
  maxHeight = "calc(100vh - 500px)",
  onLink,
  onUnlink,
}) => {
  const columns: ColumnsType<DansKhuulgaItem> = useMemo(
    () => [
      {
        title: <span className="text-gray-900 dark:text-white">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, __: any, index: number) =>
          (page - 1) * rowsPerPage + index + 1,
      },
      {
        title: <span className="text-gray-900 dark:text-white">Огноо</span>,
        dataIndex: "date",
        key: "date",
        align: "center",
        width: 150,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">Гүйлгээний утга</span>
        ),
        dataIndex: "action",
        align: "left",
        key: "action",
        width: 350,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-gray-900 dark:text-white" title={val}>
            {item.action || item.raw?.uilchilgeeniiUtga || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white text-center block w-full">Гүйлгээний дүн</span>
        ),
        dataIndex: "total",
        key: "total",
        align: "right",
        width: 140,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: number) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
            {formatNumber(val || 0, 2)}₮
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Шилжүүлсэн данс</span>
        ),
        dataIndex: "account",
        key: "account",
        align: "center",
        width: 180,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-mono text-xs">
            {item.account || item.raw?.bairlal || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Холбосон огноо</span>
        ),
        dataIndex: "updatedAt",
        key: "linkedDate",
        align: "center",
        width: 150,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, item: DansKhuulgaItem) => {
          const isLinked = (item.contractIds?.length || 0) > 0;
          if (!isLinked) return "-";
          const dateVal = item.raw?.updatedAt || null;
          const d = dateVal ? new Date(dateVal) : null;
          if (!d) return "-";
          const pad = (n: number) => String(n).padStart(2, "0");
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Төлөв</span>
        ),
        key: "status",
        align: "center",
        width: 100,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, item: DansKhuulgaItem) => {
          const isLinked = (item.contractIds?.length || 0) > 0;
          return (
            <div className="flex items-center justify-center">
              {isLinked ? (
                <button
                  onClick={() => onUnlink?.(item)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Холболт салгах"
                >
                  <CheckOutlined className="text-base" />
                </button>
              ) : (
                <button
                  onClick={() => onLink?.(item)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="Гүйлгээ холбох"
                >
                  <ExclamationOutlined className="text-base" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [page, rowsPerPage, onLink, onUnlink],
  );

  const totalSum = useMemo(
    () => data.reduce((sum, item) => sum + (item.total || 0), 0),
    [data],
  );

  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto hide-scrollbar">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) => record.id?.toString() || Math.random().toString()}
          pagination={false}
          size="small"
          bordered
          loading={loading}
          className="guilgee-table min-w-[1000px] dark:bg-gray-900 dark:text-gray-100"
          scroll={{ x: "max-content", y: maxHeight }}
          rowClassName={(record, index) => `
          ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
          text-gray-900 dark:text-white
          hover:bg-gray-100 dark:hover:bg-gray-600
          transition-colors duration-200
        `}
          locale={{
            emptyText: (
              <div className="py-8 text-center bg-white dark:bg-gray-900">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Гүйлгээний мэдээлэл олдсонгүй
                </span>
              </div>
            ),
          }}
          summary={() =>
            data.length > 0 ? (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row className="bg-gray-50 dark:bg-gray-800">
                  <Table.Summary.Cell
                    index={0}
                    colSpan={2}
                    align="center"
                    className="dark:border-gray-700"
                  />
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="dark:border-gray-700"
                  >
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Нийт дүн:
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={2}
                    align="right"
                    className="dark:border-gray-700"
                  >
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {formatNumber(totalSum, 2)}₮
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={3}
                    align="center"
                    className="dark:border-gray-700"
                  >
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

export default DansKhuulgaTable;
