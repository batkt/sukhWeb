"use client";

import React, { useMemo } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export interface FloorItem {
  orts?: string;
  floor: string;
  units: string[];
  filteredUnits: string[];
  activeToots: Set<string>;
  unitToResident: Record<string, any>;
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
  propertyTab?: "Тоот" | "Зогсоол" | "Агуулах";
  selectedFloor?: string | null;
  onSelectFloor?: (floor: string) => void;
}

export const UnitsTable: React.FC<UnitsTableProps> = ({
  data,
  actions,
  loading = false,
  page = 1,
  pageSize = 500,
  onAddUnit,
  onDeleteUnit,
  onDeleteFloor,
  sortKey,
  sortOrder,
  propertyTab = "Тоот",
  selectedFloor = null,
  onSelectFloor,
}) => {
  const columns: ColumnsType<FloorItem> = useMemo(() => {
    const cols: ColumnsType<FloorItem> = [
      {
        title: <span className="text-[color:var(--panel-text)]">№</span>,
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: (
          <span className="text-[color:var(--panel-text)]">Нийт тоот</span>
        ),
        dataIndex: "units",
        key: "unitsCount",
        align: "center",
        width: 100,
        sorter: true,
        sortOrder:
          sortKey === "unitsCount" || sortKey === "units"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        className: "font-medium",
        render: (units: string[]) => (
          <span className="text-[color:var(--panel-text)] whitespace-nowrap">
            {units ? units.length : 0}
          </span>
        ),
      },
      {
        title: <span className="text-[color:var(--panel-text)]">Орц</span>,
        dataIndex: "orts",
        key: "orts",
        align: "center",
        width: 100,
        sorter: true,
        sortOrder:
          sortKey === "orts"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] whitespace-nowrap">
            {val ? `${val}-р орц` : "-"}
          </span>
        ),
      },
      {
        title: (
          <span className="text-[color:var(--panel-text)]">Давхар</span>
        ),
        dataIndex: "floor",
        key: "floor",
        align: "center",
        width: 120,
        sorter: true,
        sortOrder:
          sortKey === "floor"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] whitespace-nowrap">
            {val}-р давхар
          </span>
        ),
      },
    ];

    // Нэг мөрөнд хамгийн олон тоот хэдэн ширхэг байгааг олж баганын өргөнийг
    // түүгээр тогтооно (чипний өргөн 48px + 6px зай + нүдний 16px хүрээ).
    const maxUnits = (data || []).reduce(
      (max, row) => Math.max(max, row.filteredUnits?.length || 0),
      0,
    );
    const tootuudWidth = Math.max(200, maxUnits * 54 + 16);

    cols.push({
      width: tootuudWidth,
      title: (
        <span className="text-[color:var(--panel-text)] text-center block font-semibold">
          {propertyTab === "Зогсоол"
            ? "Зогсоолын дугаарууд"
            : propertyTab === "Агуулах"
              ? "Агуулахын дугаарууд"
              : "Тоотууд"}
        </span>
      ),
      dataIndex: "filteredUnits",
      key: "filteredUnits",
      align: "center",
        render: (filteredUnits: string[], record: FloorItem) => {
          if (!filteredUnits || filteredUnits.length === 0) {
            return (
              <span className="italic text-[color:var(--muted-text)]">
                Хоосон
              </span>
            );
          }
          return (
            <div className="flex flex-nowrap items-center justify-center gap-1.5 py-0.5">
              {filteredUnits.map((unit) => {
                const unitStr = String(unit).trim();
                const hasActive = record.activeToots.has(unitStr);
                return (
                  <div
                    key={unitStr}
                    className={`group relative flex items-center justify-center w-[48px] h-[28px] rounded-lg border transition-all duration-150 ${
                      hasActive
                        ? "border-theme bg-theme/50 shadow-sm ring-1 ring-theme/10"
                        : "border-[color:var(--surface-border)] bg-white hover:border-theme shadow-sm"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        hasActive
                          ? "text-brand"
                          : "text-[color:var(--muted-text)]"
                      }`}
                    >
                      {unitStr}
                    </span>
                    {hasActive && (
                      <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-success animate-pulse" />
                    )}
                    <button
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-[color:var(--panel)] text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-danger z-20 scale-90 group-hover:scale-100"
                      aria-label={`Устгах ${unitStr}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUnit?.(record.floor, unitStr);
                      }}
                    >
                      <span className="leading-none">×</span>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        },
      });

    cols.push({
      title: <span className="text-[color:var(--panel-text)]">Үйлдэл</span>,
      key: "action",
      align: "center",
      width: 96,
      render: (_: any, record: FloorItem) => (
        <div className="flex items-center justify-center gap-1">
          <button
            className="p-1.5 rounded-md hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
            title="Шинэ тоот нэмэх"
            onClick={(e) => {
              e.stopPropagation();
              onAddUnit?.(record.floor);
            }}
          >
            <Plus className="w-4 h-4 text-brand" />
          </button>
          <button
            className={`p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-danger/10 ${
              record.units.length === 0
                ? "opacity-20 cursor-not-allowed grayscale"
                : ""
            }`}
            title={
              record.units.length === 0
                ? "Устгах тоот байхгүй"
                : "Давхрын тоотуудыг устгах"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (record.units.length > 0) {
                onDeleteFloor?.(record.floor);
              }
            }}
            disabled={record.units.length === 0}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      ),
    });

    return cols;
  }, [
    // Баганын өргөн нь мөрүүдийн тоотын тооноос хамаардаг тул `data` хэрэгтэй.
    data,
    page,
    pageSize,
    onAddUnit,
    onDeleteUnit,
    onDeleteFloor,
    propertyTab,
    sortKey,
    sortOrder,
  ]);

  return (
    <div className="w-full">
      <Table
        dataSource={data}
        columns={columns}
        rowKey={(record) => `${record.orts || ""}-${record.floor}`}
        pagination={false}
        loading={loading}
        onChange={(_: any, __: any, sorter: any) => {
          if (actions?.toggleSortFor) {
            actions.toggleSortFor(
              sorter.field || sorter.columnKey,
              sorter.order,
            );
          }
        }}
        onRow={(record) => ({
          onClick: () => {
            if (onSelectFloor) {
              onSelectFloor(record.floor);
            }
          },
        })}
        scroll={{ x: "max-content" }}
        rowClassName={(record) =>
          // Ээлжлэх/hover өнгийг стандарт хүснэгт өөрөө хийнэ — энд зөвхөн
          // сонгосон давхарын онцлолт үлдэнэ.
          `cursor-pointer${
            selectedFloor === record.floor ? " zt-row-selected font-semibold" : ""
          }`
        }
        locale={{
          emptyText: (
            <span className="text-[color:var(--muted-text)]">
              Давхарын мэдээлэл алга
            </span>
          ),
        }}
      />
    </div>
  );
};

export default UnitsTable;
