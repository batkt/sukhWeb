"use client";

import React from "react";
import { Table, Spin, Pagination, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Mail,
  Trash2,
  FileText,
} from "lucide-react";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";

interface Column<T> {
  key: string;
  label: React.ReactNode;
  width?: number | string;
  align?: "start" | "center" | "end" | "left" | "right";
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
}

interface StandardTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | ((item: T) => string);
  className?: string;
  containerClassName?: string;
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  footer?: React.ReactNode;
  maxHeight?: string | number;
  pagination?:
    | false
    | {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize?: number) => void;
      };
}

export function StandardTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage = "Мэдээлэл олдсонгүй",
  rowKey,
  className,
  containerClassName,
  onRowClick,
  stickyHeader = false,
  footer,
  maxHeight,
  pagination,
}: StandardTableProps<T>) {
  const getRowKey = (item: T, index: number): string => {
    if (typeof rowKey === "function") return rowKey(item);
    if (rowKey) return String(item[rowKey]);
    return String(index);
  };

  const getAlign = (align?: string) => {
    if (align === "center") return "center";
    if (align === "end" || align === "right") return "right";
    return "left";
  };

  // Convert our Column type to Ant Design's TableColumnsType with dark mode support
  const antColumns: TableColumnsType<T> = columns.map((col) => ({
    key: col.key,
    dataIndex: col.key,
    title: col.label,
    width: col.width,
    align: getAlign(col.align) as "left" | "center" | "right",
    sorter: col.sorter,
    className: `
      bg-gray-50 dark:bg-gray-900 
      text-gray-900 dark:text-white 
      border-b border-gray-200 dark:border-gray-700
      font-semibold
      ${col.className || ""}
    `,
    render: (value: any, record: T, index: number) => {
      return col.render ? (
        col.render(value, record, index)
      ) : (
        <span className="text-gray-900 dark:text-white">{value}</span>
      );
    },
  }));

  // Prepare data with keys for Ant Design
  const dataWithKeys = data.map((item, index) => ({
    ...item,
    key: getRowKey(item, index),
  }));

  const handleRowClick = (record: T) => {
    if (onRowClick) {
      // Remove the key we added before passing to callback
      const { key, ...rest } = record as any;
      onRowClick(rest as T);
    }
  };

  return (
    <div className={cn("w-full overflow-hidden", containerClassName)}>
      <div className="w-full overflow-x-auto hide-scrollbar">
        <div
          className={cn(
            "rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 backdrop-blur-xl shadow-2xl overflow-hidden min-w-[800px]",
            className,
          )}
        >
          <Spin spinning={loading} tip="Уншиж байна..." size="small">
            <Table<T>
              columns={antColumns}
              dataSource={dataWithKeys}
              pagination={false}
              locale={{
                emptyText: (
                  <div className="py-12 text-center bg-transparent">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {emptyMessage}
                    </span>
                  </div>
                ),
              }}
              sticky={stickyHeader}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: onRowClick ? "pointer" : "default" },
              })}
              className="min-w-full"
              scroll={{
                x: "max-content",
                ...(maxHeight ? { y: maxHeight } : {}),
              }}
              rowClassName={(record, index) => `
                ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
                text-gray-900 dark:text-white
                hover:bg-gray-100 dark:hover:bg-gray-600
                transition-colors duration-200
                border-b border-slate-100 dark:border-slate-800/50
              `}
            />
          </Spin>

          {pagination && typeof pagination === "object" && (
            <StandardPagination
              current={pagination.current}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onChange={pagination.onChange}
              onPageSizeChange={(newSize) => pagination.onChange(1, newSize)}
            />
          )}

          {footer && <div className="mt-4 px-4 pb-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function StandardPagination({
  current,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 500, 1000],
}: {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  const itemRender = (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactNode,
  ) => {
    if (type === "prev") {
      return (
        <button className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          <ChevronLeft className="w-3 h-3 text-theme/70" />
        </button>
      );
    }
    if (type === "next") {
      return (
        <button className="w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          <ChevronRight className="w-3 h-3 text-theme/70" />
        </button>
      );
    }
    if (type === "page") {
      const isActive = page === current;
      return (
        <button
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-xs transition-all bg-white dark:bg-slate-800",
            isActive
              ? "text-theme font-medium"
              : "text-theme/60 hover:bg-slate-50 dark:hover:bg-slate-700",          )}
        >
          {page}
        </button>
      );
    }
    return originalElement;
  };

  return (
    <div className="flex flex-row items-center justify-between w-full px-6 py-2 rounded-b-2xl">
      {/* Total */}
      <div className="text-[11px] text-theme/60 font-medium whitespace-nowrap">
        Нийт: {total}
      </div>

      {/* Page Size + Pagination Buttons */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <PageSongokh
            value={pageSize}
            onChange={(v) => {
              onPageSizeChange(v);
              onChange(1);
            }}
            options={pageSizeOptions}
            suffix="/ хуудас"
            className="!py-0 !h-6 !px-2 !rounded-lg !shadow-none !border-slate-200 dark:!border-slate-700"
          />
        )}
        <Pagination
          current={current}
          total={total}
          pageSize={pageSize}
          onChange={onChange}
          itemRender={itemRender}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}

export default StandardTable;
