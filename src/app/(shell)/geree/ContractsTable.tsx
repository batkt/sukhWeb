"use client";

import React, { useMemo } from "react";
import { Tooltip } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { FileText, Eye, CalendarX2, Edit, Trash2 } from "lucide-react";
import { ALL_COLUMNS } from "./columns";
import { StandardPagination } from "@/components/ui/StandardTable";

type SortKey = string;

interface ContractsTableProps {
  ajiltan: any;
  currentContracts: any[];
  totalContracts: number;
  visibleColumns: string[];
  selectAllContracts: boolean;
  setSelectAllContracts: (value: boolean) => void;
  selectedContracts: string[];
  setSelectedContracts: (
    value: string[] | ((prev: string[]) => string[]),
  ) => void;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  toggleSortFor: (key: string, order?: any) => void;
  startIndex: number;
  renderCellValue: (contract: any, columnKey: string) => React.ReactNode;
  handleEdit: (contract: any) => void;
  handlePreviewContractTemplate: (contract: any) => void;
  /** Админ эрхтэй үед цуцлагдсан гэрээний мөрөнд устгах товч гарна. */
  handleAdminDelete?: (contract: any) => void;

  currentPage: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (size: number) => void;
}

export const ContractsTable: React.FC<ContractsTableProps> = React.memo(({
  ajiltan,
  currentContracts,
  totalContracts,
  visibleColumns,
  selectAllContracts,
  setSelectAllContracts,
  selectedContracts,
  setSelectedContracts,
  sortKey,
  sortOrder,
  toggleSortFor,
  startIndex,
  renderCellValue,
  handleEdit,
  handlePreviewContractTemplate,
  handleAdminDelete,

  currentPage,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
}) => {
  // Устгах товч зөвхөн админд. `hasPermission` нь erkh === "admin"-д бүх эрх
  // өгдөг тул шууд түүгээр шалгав.
  const isAdmin = String(ajiltan?.erkh || "").toLowerCase() === "admin"
    || String(ajiltan?.erkh || "") === "SuperAdmin";

  const columns: ColumnsType<any> = useMemo(() => {
    const baseColumns: ColumnsType<any> = [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) => startIndex + index + 1,
      },
    ];

    const dynamicColumns: ColumnsType<any> = visibleColumns.map(
      (columnKey, colIdx) => {
        const column = ALL_COLUMNS.find((col) => col.key === columnKey);
        const isSortable =
          column?.key === "toot" ||
          column?.key === "orts" ||
          column?.key === "davkhar" ||
          column?.key === "ognoo" ||
          column?.key === "ner" ||
          column?.key === "tuluv" ||
          column?.key === "gereeniiDugaar";

        const alignClass =
          columnKey === "ner" || columnKey === "bairniiNer" || columnKey === "gereeniiDugaar"
            ? "left"
            : columnKey === "sariinTurees" ||
                columnKey === "baritsaaniiUldegdel"
              ? "right"
              : "center";

        let colWidth: number | undefined = undefined;
        if (columnKey === "ner") colWidth = 200;
        else if (columnKey === "horoo" || columnKey === "bairniiNer")
          colWidth = 150;
        else if (
          columnKey === "toot" ||
          columnKey === "orts" ||
          columnKey === "davkhar"
        )
          colWidth = 80;
        else if (
          columnKey === "tuluv" ||
          columnKey === "sariinTurees" ||
          columnKey === "baritsaaniiUldegdel"
        )
          colWidth = 120;
        else if (columnKey === "gereeniiDugaar") colWidth = 100;
        else colWidth = 120;

        if (columnKey === "toot") {
          const targetKey = "toot";
          const renderTootCell = (_: any, record: any) => {
            const allUnits: { toot: string; turul: string }[] = [];
            if (record.toot != null && String(record.toot).trim() !== "") {
              allUnits.push({
                toot: String(record.toot).trim(),
                turul: record.turul || "Орон сууц",
              });
            }
            if (Array.isArray(record.nemeltTootnuud)) {
              record.nemeltTootnuud.forEach((n: any) => {
                if (n && n.toot != null && String(n.toot).trim() !== "") {
                  allUnits.push({
                    toot: String(n.toot).trim(),
                    turul: n.turul || "Зогсоол",
                  });
                }
              });
            }

            if (allUnits.length === 0) {
              const rawVal = renderCellValue(record, "toot");
              return <span className="text-gray-900 dark:text-white">{rawVal}</span>;
            }

            if (allUnits.length === 1) {
              return (
                <span className="text-gray-900 dark:text-white font-medium">
                  {allUnits[0].toot}
                </span>
              );
            }

            const tooltipContent = (
              <div className="space-y-1.5 p-1.5 max-w-[220px]">
                {allUnits.map((u: any, idx: number) => {
                  const label = u.turul === "Гараж" ? "Зогсоол" : u.turul;
                  return (
                    <div key={idx} className="flex items-center gap-3 py-0.5">
                      <span className="text-white font-medium">
                        Тоот {u.toot} {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );

            return (
              <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
                <span className="inline-flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  {allUnits[0].toot}
                  <span className="text-slate-500 font-bold">
                    +{allUnits.length - 1}
                  </span>
                </span>
              </Tooltip>
            );
          };

          return {
            title: (
              <span
                className={`text-gray-900 dark:text-white ${alignClass === "center" ? "text-center block" : ""}`}
              >
                {column?.label}
              </span>
            ),
            dataIndex: columnKey,
            key: columnKey,
            align: alignClass as any,
            width: colWidth,
            sorter: true,
            sortOrder:
              sortKey === targetKey
                ? sortOrder === "asc"
                  ? "ascend"
                  : "descend"
                : null,
            render: renderTootCell,
          };
        }

        if (isSortable) {
          const keyMap: Record<string, string> = {
            ognoo: "createdAt",
            toot: "toot",
            orts: "orts",
            davkhar: "davkhar",
            ner: "ner",
            tuluv: "tuluv",
            gereeniiDugaar: "gereeniiDugaar",
          };
          const targetKey =
            keyMap[column?.key || "ognoo"] || (column?.key as string);

          return {
            title: (
              <span
                className={`text-gray-900 dark:text-white ${alignClass === "center" || columnKey === "ner" || columnKey === "gereeniiDugaar" ? "text-center block" : ""}`}
              >
                {column?.label}
              </span>
            ),
            dataIndex: columnKey,
            key: columnKey,
            align: alignClass as any,
            width: colWidth,
            sorter: true,
            sortOrder:
              sortKey === targetKey
                ? sortOrder === "asc"
                  ? "ascend"
                  : "descend"
                : null,
            render: (_: any, record: any) => (
              <span className="text-gray-900 dark:text-white">
                {renderCellValue(record, columnKey)}
              </span>
            ),
          };
        }

        return {
          title: (
            <span
              className={`text-gray-900 dark:text-white ${alignClass === "center" || columnKey === "ner" || columnKey === "gereeniiDugaar" ? "text-center block" : ""}`}
            >
              {column?.label}
            </span>
          ),
          dataIndex: columnKey,
          key: columnKey,
          align: alignClass as any,
          width: colWidth,
          render: (_: any, record: any) => (
            <span className="text-gray-900 dark:text-white">
              {renderCellValue(record, columnKey)}
            </span>
          ),
        };
      },
    );

    const actionColumn: ColumnsType<any> = [
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 96,
        render: (_: any, record: any, index: number) => {
          const tuluv = String(record?.tuluv || "").trim();
          const isCancelled = tuluv === "Цуцалсан" || tuluv.toLowerCase() === "цуцалсан";
          const cancelDateRaw =
            record?.tsutsalsanOgnoo ||
            record?.tsutlsasanOgnoo ||
            record?.tsutlsanOgnoo ||
            record?.updatedAt;
          const cancelDate = cancelDateRaw
            ? new Date(cancelDateRaw).toLocaleDateString("mn-MN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : null;

          return (
            <div className="flex gap-1 justify-center items-center">
              <button
                onClick={() => handlePreviewContractTemplate(record)}
                className="p-1.5 rounded-md hover-surface transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Гэрээний загвар харах"
              >
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleEdit(record)}
                className="p-1.5 rounded-md hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                id={index === 0 ? "geree-edit-btn" : undefined}
                title="Засах"
              >
                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
              {isCancelled && isAdmin && handleAdminDelete && (
                <button
                  onClick={() => handleAdminDelete(record)}
                  className="p-1.5 rounded-md hover-surface transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/30"
                  title={
                    cancelDate
                      ? `${cancelDate}-нд цуцлагдсан · Гэрээг авлагатай нь устгах`
                      : "Цуцлагдсан гэрээг авлагатай нь устгах"
                  }
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </button>
              )}
            </div>
          );
        },
      },
    ];

    return [...baseColumns, ...dynamicColumns, ...actionColumn];
  }, [
    visibleColumns,
    sortKey,
    sortOrder,
    toggleSortFor,
    renderCellValue,

    handlePreviewContractTemplate,
    handleAdminDelete,
    isAdmin,
    startIndex,
  ]);

  return (
    <div className="w-full overflow-hidden" id="contracts-table">
      <div className="w-full" id="geree-table">
        <Table
          dataSource={currentContracts}
          columns={columns}
          rowKey={(record) => record._id || record.id}
          pagination={false}
          className="min-w-[1000px]"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <span className="text-gray-500 dark:text-gray-400">
                Гэрээ олдсонгүй
              </span>
            ),
          }}
          onRow={(record) => ({
            onClick: () => {
              if (ajiltan?.erkh === "Admin") {
                const id = String(record._id);
                setSelectedContracts((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                );
              }
            },
            className: `cursor-pointer${
              selectedContracts.includes(String(record._id))
                ? " zt-row-selected"
                : ""
            }`,
          })}
          onChange={(_: any, __: any, sorter: any) => {
            const keyMap: Record<string, string> = {
              ognoo: "createdAt",
              toot: "toot",
              orts: "orts",
              davkhar: "davkhar",
              ner: "ner",
              tuluv: "tuluv",
              gereeniiDugaar: "gereeniiDugaar",
            };
            const field = sorter.field || sorter.columnKey;
            const targetKey = field
              ? keyMap[field as string] || (field as string)
              : undefined;
            toggleSortFor(targetKey || "createdAt", sorter.order);
          }}
        />
      </div>
      <div id="geree-pagination">
        <StandardPagination
          current={currentPage}
          total={totalContracts}
          pageSize={rowsPerPage}
          onChange={setCurrentPage}
          onPageSizeChange={(v) => {
            setRowsPerPage(v);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
});

export default ContractsTable;
