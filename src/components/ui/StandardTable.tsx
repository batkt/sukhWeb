"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Table, { Pagination } from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";

/**
 * StandardTable — `@/components/ui/table`-ийн нимгэн адаптер.
 *
 * Хуучин `{ key, label }` баганын хэлбэрийг хадгалсан тул түүнийг ашигладаг
 * дэлгэцүүд өөрчлөлтгүй ажиллана; доор нь нэг л жишиг хүснэгт зурагдана.
 * ШИНЭ код бичиж байгаа бол шууд `@/components/ui/table`-ийг ашигла.
 */
interface Column<T> {
  key: string;
  label: React.ReactNode;
  width?: number | string;
  align?: "start" | "center" | "end" | "left" | "right";
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
  children?: Column<T>[];
  fixed?: "left" | "right";
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
  footer?: React.ReactNode;
  summary?: (rows: readonly T[]) => React.ReactNode;
  pagination?:
    | false
    | {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize?: number) => void;
      };
}

function mapAlign(align?: string): "left" | "center" | "right" {
  if (align === "center") return "center";
  if (align === "end" || align === "right") return "right";
  return "left";
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
  footer,
  summary,
  pagination,
}: StandardTableProps<T>) {
  const mapColumn = (col: Column<T>): any => ({
    key: col.key,
    dataIndex: col.children ? undefined : col.key,
    title: col.label,
    width: col.width,
    align: mapAlign(col.align),
    sorter: col.sorter,
    fixed: col.fixed,
    className: col.className,
    children: col.children?.map(mapColumn),
    render: col.children ? undefined : col.render,
  });

  const mapped: ColumnsType<T> = columns.map(mapColumn);

  const getRowKey = (item: T, index: number): React.Key => {
    if (typeof rowKey === "function") return rowKey(item);
    if (rowKey) return String(item[rowKey]);
    return index;
  };

  return (
    <div className={cn("flex w-full flex-col", containerClassName)}>
      <Table<T>
        columns={mapped}
        dataSource={data}
        rowKey={getRowKey}
        loading={loading}
        pagination={false}
        className={className}
        locale={{ emptyText: emptyMessage }}
        // Өндрийг бүрдэл өөрөө цонхны үлдсэн зайгаар тооцно.
        scroll={{ x: "max-content" }}
        summary={summary}
        onRow={(record) => ({
          onClick: onRowClick ? () => onRowClick(record) : undefined,
          style: { cursor: onRowClick ? "pointer" : "default" },
        })}
      />

      {pagination && typeof pagination === "object" && (
        <StandardPagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={pagination.onChange}
          onPageSizeChange={(newSize) => pagination.onChange(1, newSize)}
        />
      )}

      {footer && <div className="px-1 pt-2">{footer}</div>}
    </div>
  );
}

export function StandardPagination({
  current,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 200, 300, 500, 1000],
  className,
}: {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize?: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  return (
    <Pagination
      current={current}
      total={total}
      pageSize={pageSize}
      size="small"
      showSizeChanger={!!onPageSizeChange}
      pageSizeOptions={pageSizeOptions}
      className={className}
      showTotal={(t) => (
        <>
          Нийт <span className="font-medium text-[hsl(var(--zt-fg))]">{t}</span> мөр
        </>
      )}
      onChange={(page, size) => {
        if (size !== pageSize) {
          onPageSizeChange?.(size);
          onChange(1, size);
          return;
        }
        onChange(page, size);
      }}
    />
  );
}

export default StandardTable;
