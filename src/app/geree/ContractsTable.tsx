import React from "react";
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
  setSelectedContracts: (value: string[] | ((prev: string[]) => string[])) => void;
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
  const totalPages = Math.max(1, Math.ceil(totalContracts / rowsPerPage));
  return (
    <div className="table-surface overflow-hidden rounded-2xl w-full">
      <div className="rounded-3xl p-6 neu-table allow-overflow">
        <div
          className="max-h-[45vh] overflow-y-auto custom-scrollbar w-full"
          id="geree-table"
        >
          <table className="table-ui text-sm min-w-full border border-[color:var(--surface-border)]">
            <thead className="z-10 bg-white dark:bg-gray-800">
              <tr>
                <th className="p-1 text-sm font-normal text-theme text-center w-12 bg-inherit border-r border-[color:var(--surface-border)]">
                  №
                </th>
                {visibleColumns.map((columnKey, colIdx) => {
                  const column = ALL_COLUMNS.find((col) => col.key === columnKey);
                  const isSortable =
                    column?.key === "toot" ||
                    column?.key === "orts" ||
                    column?.key === "davkhar" ||
                    column?.key === "ognoo";
                  const isLastCol = colIdx === visibleColumns.length - 1;

                  if (isSortable) {
                    const keyMap: Record<string, SortKey> = {
                      ognoo: "createdAt",
                      toot: "toot",
                      orts: "orts",
                      davkhar: "davkhar",
                    };
                    const targetKey = keyMap[column?.key || "ognoo"];
                    
                    const alignClass = 
                        columnKey === "ner" || columnKey === "bairniiNer" ? "text-left pl-2" :
                        columnKey === "sariinTurees" || columnKey === "baritsaaniiUldegdel" ? "text-right pr-2" : 
                        "text-center";

                    return (
                      <th
                        key={columnKey}
                        className={`p-1 text-sm font-normal text-theme ${alignClass} whitespace-nowrap bg-inherit ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSortFor(targetKey)}
                          className={`w-full inline-flex items-center gap-2 ${
                            alignClass.includes("left") ? "justify-start" : 
                            alignClass.includes("right") ? "justify-end" : 
                            "justify-center"
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
                      </th>
                    );
                  }

                  const alignClass = 
                      columnKey === "ner" || columnKey === "bairniiNer" ? "text-left pl-2" :
                      columnKey === "sariinTurees" || columnKey === "baritsaaniiUldegdel" ? "text-right pr-2" : 
                      "text-center";

                  return (
                    <th
                      key={columnKey}
                      className={`p-1 text-sm font-normal text-theme ${alignClass} whitespace-nowrap bg-inherit ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                    >
                      {column?.label}
                    </th>
                  );
                })}
                <th className="p-1 text-sm font-semibold text-theme text-center whitespace-nowrap bg-inherit">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody>
              {currentContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="p-8 text-center text-subtle"
                  >
                    Гэрээ олдсонгүй
                  </td>
                </tr>
              ) : (
                currentContracts.map((contract: any, idx: number) => {
                  const isSelected = selectedContracts.includes(String(contract._id));
                  return (
                  <tr
                    key={contract._id || idx}
                 
                    className={`transition-colors border-b last:border-b-0 ${
                      ajiltan?.erkh === "Admin" ? "cursor-pointer hover:bg-[color:var(--surface-hover)]" : ""
                    } ${isSelected ? "bg-[color:var(--surface-hover)]/50" : ""}`}
                  >
        
                    <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                      {startIndex + idx + 1}
                    </td>
                    {visibleColumns.map((columnKey, colIdx) => {
                      const alignClass =
                        columnKey === "ner" || columnKey === "bairniiNer"
                          ? "cell-left"
                          : columnKey === "sariinTurees" ||
                            columnKey === "baritsaaniiUldegdel"
                          ? "cell-right"
                          : "text-center";
                      const isLastCol = colIdx === visibleColumns.length - 1;
                      return (
                        <td
                          key={columnKey}
                          className={`p-1 text-theme whitespace-nowrap ${alignClass} ${!isLastCol ? "border-r border-[color:var(--surface-border)]" : ""}`}
                        >
                          {renderCellValue(contract, columnKey)}
                        </td>
                      );
                    })}
                    <td className="p-1 whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="p-2 rounded-2xl action-edit hover-surface transition-colors"
                          title="Засах"
                          id="geree-edit-btn"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            handlePreviewContractTemplate(String(contract._id))
                          }
                          className="p-2 rounded-2xl hover-surface transition-colors"
                          title="Гэрээний загвар харах"
                          id="geree-eye-btn"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePreviewInvoice(contract)}
                          className="p-2 rounded-2xl hover-surface transition-colors"
                          title="Нэхэмжлэх харах"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1 text-md">
        <div className="text-theme/70">
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

          <div
            id="geree-pagination"
            className="flex items-center gap-1"
          >
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

