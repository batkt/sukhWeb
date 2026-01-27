import React from "react";
import { ChevronDown, ChevronUp, Edit, Eye, FileText } from "lucide-react";
import { ALL_COLUMNS } from "./columns";

type SortKey = "createdAt" | "toot" | "orts" | "davkhar";

interface ContractsTableProps {
  ajiltan: any;
  currentContracts: any[];
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
}

export const ContractsTable: React.FC<ContractsTableProps> = ({
  ajiltan,
  currentContracts,
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
}) => {
  const handleToggleSelectAll = (checked: boolean) => {
    setSelectAllContracts(checked);
    if (!checked) return;
    const ids = currentContracts.map((c: any) => String(c._id));
    setSelectedContracts(ids);
  };

  const handleToggleRow = (contract: any, checked: boolean) => {
    const id = String(contract._id);
    setSelectedContracts((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, id]));
      }
      return prev.filter((x) => x !== id);
    });
  };

  return (
    <div className="table-surface overflow-visible rounded-2xl w-full">
      <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow relative">
        <div
          className="max-h-[45vh] overflow-y-auto custom-scrollbar w-full"
          id="geree-table"
        >
          <table className="table-ui text-xs min-w-full">
            <thead className="z-10 bg-white dark:bg-gray-800">
              <tr>
                {ajiltan?.erkh === "Admin" && (
                  <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                    <input
                      id="geree-select-all"
                      type="checkbox"
                      checked={selectAllContracts}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                <th className="p-3 text-xs font-semibold text-theme text-center w-12 bg-inherit">
                  №
                </th>
                {visibleColumns.map((columnKey) => {
                  const column = ALL_COLUMNS.find((col) => col.key === columnKey);
                  const isSortable =
                    column?.key === "toot" ||
                    column?.key === "orts" ||
                    column?.key === "davkhar" ||
                    column?.key === "ognoo";

                  if (isSortable) {
                    const keyMap: Record<string, SortKey> = {
                      ognoo: "createdAt",
                      toot: "toot",
                      orts: "orts",
                      davkhar: "davkhar",
                    };
                    const targetKey = keyMap[column?.key || "ognoo"];
                    return (
                      <th
                        key={columnKey}
                        className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSortFor(targetKey)}
                          className="w-full inline-flex items-center justify-center gap-2"
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

                  return (
                    <th
                      key={columnKey}
                      className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit"
                    >
                      {column?.label}
                    </th>
                  );
                })}
                <th className="p-1 text-xs font-semibold text-theme text-center whitespace-nowrap bg-inherit">
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
                currentContracts.map((contract: any, idx: number) => (
                  <tr
                    key={contract._id || idx}
                    className="transition-colors border-b last:border-b-0"
                  >
                    {ajiltan?.erkh === "Admin" && (
                      <td className="p-1 text-center text-theme w-12">
                        <input
                          type="checkbox"
                          checked={selectedContracts.includes(String(contract._id))}
                          onChange={(e) =>
                            handleToggleRow(contract, e.target.checked)
                          }
                        />
                      </td>
                    )}
                    <td className="p-1 text-center text-theme">
                      {startIndex + idx + 1}
                    </td>
                    {visibleColumns.map((columnKey) => {
                      const alignClass =
                        columnKey === "ner" || columnKey === "bairniiNer"
                          ? "cell-left"
                          : columnKey === "sariinTurees" ||
                            columnKey === "baritsaaniiUldegdel"
                          ? "cell-right"
                          : "text-center";
                      return (
                        <td
                          key={columnKey}
                          className={`p-1 text-theme whitespace-nowrap ${alignClass}`}
                        >
                          {renderCellValue(contract, columnKey)}
                        </td>
                      );
                    })}
                    <td className="p-1 whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="p-1 rounded-2xl action-edit hover-surface transition-colors"
                          title="Засах"
                          id="geree-edit-btn"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handlePreviewContractTemplate(String(contract._id))
                          }
                          className="p-1 rounded-2xl hover-surface transition-colors"
                          title="Гэрээний загвар харах"
                          id="geree-eye-btn"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePreviewInvoice(contract)}
                          className="p-1 rounded-2xl hover-surface transition-colors"
                          title="Нэхэмжлэх харах"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContractsTable;

