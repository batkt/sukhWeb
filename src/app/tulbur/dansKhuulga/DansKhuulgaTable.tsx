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
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * rowsPerPage + index + 1,
      },
      {
        title: "Огноо",
        dataIndex: "date",
        key: "date",
        align: "center",
        width: 100,
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val || "-"}</span>
        ),
      },
      {
        title: "Гүйлгээний утга",
        dataIndex: "action",
        align: "center",
        key: "action",
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-theme" title={val}>
            {item.action || item.raw?.uilchilgeeniiUtga || "-"}
          </span>
        ),
      },
      {
        title: "Гүйлгээний дүн",
        dataIndex: "total",
        key: "total",
        align: "center",
        width: 140,
        render: (val: number) => (
          <span className="text-theme whitespace-nowrap font-medium">
            {formatNumber(val || 0, 0)}
          </span>
        ),
      },
      {
        title: "Шилжүүлсэн данс",
        dataIndex: "account",
        key: "account",
        align: "center",
        width: 180,
        render: (val: string, item: DansKhuulgaItem) => (
          <span className="text-theme whitespace-nowrap font-mono text-xs">
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
        className="guilgee-table min-w-[1000px]"
        scroll={{ x: "max-content", y: maxHeight }}
        locale={{ emptyText: "Гүйлгээний мэдээлэл олдсонгүй" }}
        summary={() =>
          data.length > 0 ? (
            <Table.Summary fixed="bottom">
              <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2} align="center">
                <span className="font-bold text-theme">Нийт:</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Нийт дүн:
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <span className="font-bold text-theme text-xs">
                  {formatNumber(totalSum, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="center">
                -
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
