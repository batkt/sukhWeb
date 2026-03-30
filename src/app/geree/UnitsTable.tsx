"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Trash2 } from "lucide-react";

export interface FloorItem {
  orts?: string;
  floor: string;
  units: string[];
  filteredUnits: string[];
  activeToots: Set<string>;
}

interface UnitsTableProps {
  data: FloorItem[];
  actions: any;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onAddUnit?: (floor: string) => void;
  onDeleteUnit?: (floor: string, unit: string) => void;
  onDeleteFloor?: (floor: string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}

export const UnitsTable: React.FC<UnitsTableProps> = ({
  data,
  actions,
  loading = false,
  page = 1,
  pageSize = 10,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
  sortKey,
  sortOrder,
}) => {
  const columns: ColumnsType<FloorItem> = useMemo(
    () => [
      {
        title: <span className="text-slate-900 dark:text-slate-200">№</span>,
        key: "index",
        width: 50,
        align: "center",
        className: "text-slate-900 dark:text-slate-200",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: <span className="text-slate-900 dark:text-slate-200">Нийт тоот</span>,
        dataIndex: "units",
        key: "unitsCount",
        align: "center",
        width: 100,
        sorter: true,
        sortOrder: (sortKey === "unitsCount" || sortKey === "units") ? (sortOrder === "asc" ? "ascend" : "descend") : null,
        className: "text-slate-900 dark:text-slate-200 font-medium",
        render: (units: string[]) => (
          <span className="text-slate-900 dark:text-slate-200 whitespace-nowrap">
            {units ? units.length : 0}
          </span>
        ),
      },
      {
        title: <span className="text-slate-900 dark:text-slate-200">Орц</span>,
        dataIndex: "orts",
        key: "orts",
        align: "center",
        width: 100,
        sorter: true,
        sortOrder: sortKey === "orts" ? (sortOrder === "asc" ? "ascend" : "descend") : null,
        className: "text-slate-900 dark:text-slate-200",
        render: (val: string) => (
          <span className="text-slate-900 dark:text-slate-200 whitespace-nowrap">
            {val ? `${val}-р орц` : "-"}
          </span>
        ),
      },
      {
        title: <span className="text-slate-900 dark:text-slate-200">Давхар</span>,
        dataIndex: "floor",
        key: "floor",
        align: "center",
        width: 120,
        sorter: true,
        sortOrder: sortKey === "floor" ? (sortOrder === "asc" ? "ascend" : "descend") : null,
        className: "text-slate-900 dark:text-slate-200",
        render: (val: string) => (
          <span className="text-slate-900 dark:text-slate-200 whitespace-nowrap">
            {val}-р давхар
          </span>
        ),
      },
      {
        title: <span className="text-slate-900 dark:text-slate-200">Тоотууд</span>,
        dataIndex: "filteredUnits",
        key: "filteredUnits",
        className: "text-slate-900 dark:text-slate-200",
        render: (filteredUnits: string[], record: FloorItem) => {
          if (!filteredUnits || filteredUnits.length === 0) {
            return (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic uppercase tracking-wider">
                Хоосон
              </span>
            );
          }
          return (
            <div
              className="grid gap-1.5 py-1"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))",
                justifyItems: "center",
              }}
            >
              {filteredUnits.map((unit) => {
                const unitStr = String(unit).trim();
                const hasActive = record.activeToots.has(unitStr);
                return (
                  <div
                    key={unitStr}
                    className={`group relative flex items-center justify-center w-[48px] h-[28px] rounded-lg border transition-all duration-150 ${
                      hasActive
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-600 shadow-sm ring-1 ring-emerald-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-400 shadow-sm"
                    }`}
                  >
                    <span
                      className={`text-[13px] font-semibold ${
                        hasActive
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {unitStr}
                    </span>
                    {hasActive && (
                      <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <button
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 z-20 scale-90 group-hover:scale-100"
                      aria-label={`Устгах ${unitStr}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUnit?.(record.floor, unitStr);
                      }}
                    >
                      <span className="text-[10px] leading-none mb-0.5">×</span>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        title: <span className="text-slate-900 dark:text-slate-200">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 120,
        className: "text-slate-900 dark:text-slate-200",
        render: (_: any, record: FloorItem) => (
          <div className="flex items-center justify-center gap-2">
            <button
              className="p-1 rounded-xl hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              title="Шинэ тоот нэмэх"
              onClick={() => onAddUnit?.(record.floor)}
            >
              <Plus className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </button>
            <button
              className={`p-1 rounded-xl action-delete hover-surface transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 ${
                record.units.length === 0
                  ? "opacity-20 cursor-not-allowed grayscale"
                  : ""
              }`}
              title={
                record.units.length === 0
                  ? "Устгах тоот байхгүй"
                  : "Давхрын тоотуудыг устгах"
              }
              onClick={() =>
                record.units.length > 0 && onDeleteFloor?.(record.floor)
              }
              disabled={record.units.length === 0}
            >
              <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
            </button>
          </div>
        ),
      },
    ],
    [page, pageSize, onAddUnit, onDeleteUnit, onDeleteFloor],
  );

  return (
    <div className="guilgee-table-wrap bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => `${record.orts || ""}-${record.floor}`}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        onChange={(_: any, __: any, sorter: any) => {
          if (actions?.toggleSortFor) {
            actions.toggleSortFor(sorter.field || sorter.columnKey, sorter.order);
          }
        }}
        scroll={{ x: "max-content", y: 320 }}
        rowClassName={(record, index) => `
          ${index % 2 === 0 ? "bg-white dark:bg-slate-900/40" : "bg-slate-50 dark:bg-slate-800/40"}
          text-slate-900 dark:text-slate-200
          hover:bg-slate-100 dark:hover:bg-slate-800/60
          transition-colors duration-200
        `}
        locale={{
          emptyText: (
            <span className="text-gray-500 dark:text-gray-400">
              Давхарын мэдээлэл алга
            </span>
          ),
        }}
      />
    </div>
  );
};

export default UnitsTable;
