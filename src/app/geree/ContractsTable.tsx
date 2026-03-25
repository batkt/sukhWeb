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
                <span>{column?.label}</span>
                <span className="flex flex-col items-center">
                  <ChevronUp
                    className={`w-3 h-3 ${
                      sortKey === targetKey && sortOrder === "asc"
                        ? "text-blue-500"
                        : "text-subtle"
                    }`}
                  />
                  <ChevronDown
                    className={`w-3 h-3 ${
                      sortKey === targetKey && sortOrder === "desc"
                        ? "text-blue-500"
                        : "text-subtle"
                    }`}
                  />
                </span>
              </button>
            ),
            dataIndex: columnKey,
            key: columnKey,
            align: alignClass as any,
            render: (_: any, record: any) => renderCellValue(record, columnKey),
          };
        }

        return {
          title: column?.label,
          dataIndex: columnKey,
          key: columnKey,
          align: alignClass as any,
          render: (_: any, record: any) => renderCellValue(record, columnKey),
        };
      },
    );

    const actionColumn: ColumnsType<any> = [
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 80,
        render: (_: any, record: any) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handlePreviewInvoice(record)}
              className="p-2 rounded-2xl hover-surface transition-colors"
              title="Нэхэмжлэх харах"
            >
              <FileText className="w-5 h-5" />
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
    <div className="table-surface overflow-hidden rounded-2xl w-full">
      <div className="rounded-3xl p-3 allow-overflow">
        <div className="guilgee-table-wrap" id="geree-table">
          <Table
            dataSource={currentContracts}
            columns={columns}
            rowKey={(record) => record._id || Math.random().toString()}
            pagination={false}
            size="small"
            bordered
            className="guilgee-table"
            scroll={{ x: "max-content", y: 480 }}
            locale={{ emptyText: "Гэрээ олдсонгүй" }}
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
              className: `transition-colors cursor-pointer hover:bg-[color:var(--surface-hover)] ${
                selectedContracts.includes(String(record._id))
                  ? "bg-[color:var(--surface-hover)]/50"
                  : ""
              }`,
            })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1 text-md">
        <div className="text-theme/70">Нийт: {totalContracts}</div>
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
