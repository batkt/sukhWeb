"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FileText, Eye, CalendarX2, Edit } from "lucide-react";
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

  currentPage: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (size: number) => void;
  /** Viewport-based scroll height (same idea as /tulbur) */
  maxHeight?: string | number;
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

  currentPage,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
  maxHeight = "calc(100vh - 460px)",
}) => {
  const columns: ColumnsType<any> = useMemo(() => {
    const baseColumns: ColumnsType<any> = [
      {
        title: "№",
        key: "index",
        width: 50,
        align: "center",
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
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

        const headerClassName =
          "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold";

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
            className: headerClassName,
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
          className: headerClassName,
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
        title: <span className="text-gray-900 dark:text-white">Үйлдэл</span>,
        key: "action",
        align: "center",
        width: 140,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
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
                className="p-2 rounded-2xl hover-surface transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Гэрээний загвар харах"
              >
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => handleEdit(record)}
                className="p-2 rounded-2xl hover-surface transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
                id={index === 0 ? "geree-edit-btn" : undefined}
                title="Засах"
              >
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>
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
    startIndex,
  ]);

  return (
    <div className="table-surface rounded-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="p-1 allow-overflow no-scrollbar" id="contracts-table">
        <div className="w-full overflow-hidden" id="geree-table">
          <div className="w-full overflow-x-auto hide-scrollbar">
            <Table
              dataSource={currentContracts}
              columns={columns}
              rowKey={(record) => record._id || record.id}
              pagination={false}
              size="small"
              bordered
              className="guilgee-table geree-equal-height min-w-[1000px] dark:bg-gray-900 dark:text-gray-300"
              scroll={{ x: "max-content", y: maxHeight as any }}
              rowClassName={(record, index) => `
                ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700/50"}
                text-gray-900 dark:text-white
                hover:bg-gray-100 dark:hover:bg-gray-600
                transition-colors duration-200
              `}
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
                className: `transition-colors cursor-pointer hover:bg-[color:var(--surface-hover)] dark:hover:bg-gray-800 ${
                  selectedContracts.includes(String(record._id))
                    ? "bg-[color:var(--surface-hover)]/50 dark:bg-gray-800/50"
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
        </div>
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
