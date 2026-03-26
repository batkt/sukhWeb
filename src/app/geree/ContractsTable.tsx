"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ChevronDown, ChevronUp, Edit, Eye, FileText } from "lucide-react";
import { ALL_COLUMNS } from "./columns";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";

type SortKey = "createdAt" | "toot" | "orts" | "davkhar";

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
  toggleSortFor: (key: SortKey) => void;
  startIndex: number;
  renderCellValue: (contract: any, columnKey: string) => React.ReactNode;
  handleEdit: (contract: any) => void;
  handlePreviewContractTemplate: (id: string) => void;
  handlePreviewInvoice: (contract: any) => void;
  currentPage: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (size: number) => void;
}

export const ContractsTable: React.FC<ContractsTableProps> = ({
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
  handlePreviewInvoice,
  currentPage,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
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
          column?.key === "ognoo";
        const isLastCol = colIdx === visibleColumns.length - 1;

        const alignClass =
          columnKey === "ner" || columnKey === "bairniiNer"
            ? "left"
            : columnKey === "sariinTurees" ||
                columnKey === "baritsaaniiUldegdel"
              ? "right"
              : "center";

        const headerClassName =
          "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold";

        if (isSortable) {
          const keyMap: Record<string, SortKey> = {
            ognoo: "createdAt",
            toot: "toot",
            orts: "orts",
            davkhar: "davkhar",
          };
          const targetKey = keyMap[column?.key || "ognoo"];

          return {
            title: (
              <button
                type="button"
                onClick={() => toggleSortFor(targetKey)}
                className={`w-full inline-flex items-center gap-2 ${
                  alignClass === "left"
                    ? "justify-start"
                    : alignClass === "right"
                      ? "justify-end"
                      : "justify-center"
                }`}
                title={`Эрэмбэлэх: ${column?.label}`}
              >
                <span className="text-gray-900 dark:text-white">
                  {column?.label}
                </span>
                <span className="flex flex-col items-center">
                  <ChevronUp
                    className={`w-3 h-3 ${
                      sortKey === targetKey && sortOrder === "asc"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  <ChevronDown
                    className={`w-3 h-3 ${
                      sortKey === targetKey && sortOrder === "desc"
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </span>
              </button>
            ),
            dataIndex: columnKey,
            key: columnKey,
            align: alignClass as any,
            className: headerClassName,
            render: (_: any, record: any) => (
              <span className="text-gray-900 dark:text-white">
                {renderCellValue(record, columnKey)}
              </span>
            ),
          };
        }

        return {
          title: (
            <span className="text-gray-900 dark:text-white">
              {column?.label}
            </span>
          ),
          dataIndex: columnKey,
          key: columnKey,
          align: alignClass as any,
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
        width: 80,
        className: "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        render: (_: any, record: any) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handlePreviewInvoice(record)}
              className="p-2 rounded-2xl hover-surface transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Нэхэмжлэх харах"
            >
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        ),
      },
    ];

    return [...baseColumns, ...dynamicColumns, ...actionColumn];
  }, [
    visibleColumns,
    sortKey,
    sortOrder,
    toggleSortFor,
    renderCellValue,
    handlePreviewInvoice,
    startIndex,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalContracts / rowsPerPage));

  return (
    <div className="table-surface rounded-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="rounded-3xl p-1 allow-overflow">
        <div className="w-full overflow-hidden" id="geree-table">
          <div className="w-full overflow-x-auto hide-scrollbar">
            <Table
              dataSource={currentContracts}
              columns={columns}
              rowKey={(record) => record._id || Math.random().toString()}
              pagination={false}
              size="small"
              bordered
              className="guilgee-table min-w-[1000px] dark:bg-gray-900 dark:text-gray-300"
              scroll={{ x: "max-content", y: 400 }}
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
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1 text-md border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
        <div className="text-theme/70 dark:text-gray-400">
          Нийт: {totalContracts}
        </div>
        <div className="flex items-center gap-3">
          <PageSongokh
            value={rowsPerPage}
            onChange={(v) => {
              setRowsPerPage(v);
              setCurrentPage(1);
            }}
            className="text-sm px-2"
          />

          <div id="geree-pagination" className="flex items-center gap-1">
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
              }}
            >
              Өмнөх
            </button>
            <div className="text-theme/70 px-1">{currentPage}</div>
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
              }}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractsTable;
