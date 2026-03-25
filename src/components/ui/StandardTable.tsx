"use client";

import React from "react";
import { Table, Spin, Pagination } from "antd";
import type { TableColumnsType } from "antd";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: React.ReactNode;
  width?: number | string;
  align?: "start" | "center" | "end" | "left" | "right";
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: any, item: T, index: number) => React.ReactNode;
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

  // Convert our Column type to Ant Design's TableColumnsType
  const antColumns: TableColumnsType<T> = columns.map((col) => ({
    key: col.key,
    dataIndex: col.key,
    title: col.label,
    width: col.width,
    align: getAlign(col.align) as "left" | "center" | "right",
    sorter: col.sorter,
    render: (value: any, record: T, index: number) => {
      return col.render ? col.render(value, record, index) : value;
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
    <div className={cn("w-full", containerClassName)}>
      <div
        className={cn(
          "rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden",
          className,
        )}
      >
        <Spin spinning={loading} tip="Уншиж байна..." size="small">
          <Table<T>
            columns={antColumns}
            dataSource={dataWithKeys}
            pagination={
              pagination === false
                ? false
                : { ...pagination, position: ["bottomCenter"] }
            }
            locale={{ emptyText: emptyMessage }}
            sticky={stickyHeader}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: onRowClick ? "pointer" : "default" },
            })}
            className="min-w-full"
            rowClassName="border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
            scroll={maxHeight ? { y: maxHeight } : undefined}
          />
        </Spin>
        {footer && <div className="mt-4 px-4 pb-4">{footer}</div>}
      </div>
    </div>
  );
}

export function StandardPagination({
  current,
  total,
  pageSize,
  onChange,
}: {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const itemRender = (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactNode,
  ) => {
    if (type === "prev") {
      return (
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-tighter font-bold">
          Өмнөх
        </button>
      );
    }
    if (type === "next") {
      return (
        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-tighter font-bold">
          Дараах
        </button>
      );
    }
    if (type === "page") {
      const isActive = page === current;
      return (
        <button
          className={cn(
            "min-w-[32px] h-[32px] flex items-center justify-center rounded-xl text-xs transition-all",
            isActive
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400",
          )}
        >
          {page}
        </button>
      );
    }
    return originalElement;
  };

  return (
    <div className="flex justify-center items-center gap-4 py-8 mt-auto w-full">
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={onChange}
        itemRender={itemRender}
        showSizeChanger={false}
        showTotal={(total, range) => (
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">
            {range[0]} - {range[1]} / {total}
          </span>
        )}
      />
    </div>
  );
}

export default StandardTable;
