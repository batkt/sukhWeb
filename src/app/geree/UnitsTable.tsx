"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Trash2 } from "lucide-react";

export interface FloorItem {
  floor: string;
  units: string[];
  filteredUnits: string[];
  activeToots: Set<string>;
}

interface UnitsTableProps {
  data: FloorItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  onAddUnit?: (floor: string) => void;
  onDeleteUnit?: (floor: string, unit: string) => void;
  onDeleteFloor?: (floor: string) => void;
}

export const UnitsTable: React.FC<UnitsTableProps> = ({
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
}) => {
  const columns: ColumnsType<FloorItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Давхар",
        dataIndex: "floor",
        key: "floor",
        align: "center",
        render: (val: string) => (
          <span className="text-theme whitespace-nowrap">{val}-р давхар</span>
        ),
      },
      {
        title: "Тоотууд",
        dataIndex: "filteredUnits",
        key: "filteredUnits",
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
              className="grid gap-1 py-0.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(36px, 1fr))",
                justifyItems: "center",
              }}
            >
              {filteredUnits.map((unit) => {
                const unitStr = String(unit).trim();
                const hasActive = record.activeToots.has(unitStr);
                return (
                  <div
                    key={unitStr}
                    className={`group relative flex items-center justify-center w-[36px] h-[22px] rounded-lg border transition-all duration-150 ${
                      hasActive
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600"
                        : "border-slate-300 bg-white dark:bg-gray-800 dark:border-slate-600 hover:border-blue-400 shadow-sm"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-medium ${
                        hasActive
                          ? "text-green-700 dark:text-green-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {unitStr}
                    </span>
                    {hasActive && (
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-green-600 animate-pulse" />
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
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 120,
        render: (_: any, record: FloorItem) => (
          <div className="flex items-center justify-center gap-2">
            <button
              className="p-1 rounded-xl hover-surface transition-colors"
              title="Шинэ тоот нэмэх"
              onClick={() => onAddUnit?.(record.floor)}
            >
              <Plus className="w-4 h-4 text-blue-500" />
            </button>
            <button
              className={`p-1 rounded-xl action-delete hover-surface transition-colors ${
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
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [page, pageSize, onAddUnit, onDeleteUnit, onDeleteFloor],
  );

  return (
    <div className="guilgee-table-wrap">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => record.floor}
        pagination={false}
        size="small"
        bordered
        loading={loading}
        className="guilgee-table"
        scroll={{ x: "max-content", y: 320 }}
        locale={{ emptyText: "Давхарын мэдээлэл алга" }}
      />
    </div>
  );
};

export default UnitsTable;
