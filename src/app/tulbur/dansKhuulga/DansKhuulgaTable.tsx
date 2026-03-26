"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
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
}

export const DansKhuulgaTable: React.FC<DansKhuulgaTableProps> = ({
  data,
  loading = false,
  page = 1,
  rowsPerPage = 100,
  maxHeight = "calc(100vh - 500px)",
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
        width: 100,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Гүйлгээний утга</span>
        ),
        dataIndex: "action",
        align: "center",
        key: "action",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-gray-900 dark:text-white" title={val}>
            {item.action || item.raw?.uilchilgeeniiUtga || "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-gray-900 dark:text-white">Гүйлгээний дүн</span>
        ),
        dataIndex: "total",
        key: "total",
        align: "center",
        width: 140,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (val: number) => (
          <span className="text-gray-900 dark:text-white whitespace-nowrap font-medium">
            {formatNumber(val || 0, 0)}
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
    ],
    [page, rowsPerPage],
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
                  >
                    <span className="font-bold text-gray-900 dark:text-white">
                      Нийт:
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={1}
                    align="right"
                    className="dark:border-gray-700"
                  >
                    <span className="text-[10px] text-gray-900 dark:text-gray-400 uppercase tracking-widest">
                      Нийт дүн:
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell
                    index={2}
                    align="right"
                    className="dark:border-gray-700"
                  >
                    <span className="font-bold text-gray-900 dark:text-white text-xs">
                      {formatNumber(totalSum, 0)}
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
