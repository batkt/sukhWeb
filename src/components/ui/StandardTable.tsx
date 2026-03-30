"use client";

import React from "react";
import { Table, Spin, Tooltip } from "antd";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";

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
  pageSizeOptions = [100, 200, 300, 400, 500, 1000],
}: {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize?: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  return (
    <div className="flex flex-row items-center justify-between w-full px-4 py-4 mt-2 gap-4">
      {/* Page Size & Total */}
      <div className="flex items-center gap-6">
        <Field orientation="horizontal" className="items-center">
          <FieldLabel className="text-sm">Нийт: {total}</FieldLabel>
        </Field>
        
        {onPageSizeChange && (
          <Field orientation="horizontal" className="items-center">
            <FieldLabel htmlFor="rows-per-page" className="text-sm">Хуудсанд:</FieldLabel>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(v) => {
                onPageSizeChange(parseInt(v));
                onChange(1, parseInt(v));
              }}
            >
              <SelectTrigger id="rows-per-page" className="w-[80px] h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(opt => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      {/* Pagination Controls */}
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-2">
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => current > 1 && onChange(current - 1, pageSize)}
              className={cn("cursor-pointer", current <= 1 && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
          
          {/* Simple Page Indicator */}
          <PaginationItem>
             <div className="flex items-center gap-1 px-4 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-emerald-500 shadow-sm">
               {current} / {Math.max(1, Math.ceil(total / pageSize))}
             </div>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext 
              onClick={() => current < Math.ceil(total / pageSize) && onChange(current + 1, pageSize)}
              className={cn("cursor-pointer", current >= Math.ceil(total / pageSize) && "pointer-events-none opacity-50")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default StandardTable;
