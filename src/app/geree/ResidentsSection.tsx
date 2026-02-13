import React from "react";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";
import { getPaymentStatusLabel } from "@/lib/utils";
import { getResidentToot, getResidentDavkhar, getResidentOrts } from "@/lib/residentDataHelper";

type SortKey = "createdAt" | "toot" | "orts" | "davkhar";

interface ResidentsSectionProps {
  isValidatingSuugch: boolean;
  currentResidents: any[];
  resPage: number;
  resPageSize: number;
  resTotalPages: number;
  filteredResidents: any[];
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  toggleSortFor: (key: SortKey) => void;
  tuluvByResidentId: Record<
    string,
    "Төлсөн" | "Төлөөгүй" | "Хугацаа хэтэрсэн" | "Тодорхойгүй"
  >;
  onEditResident: (resident: any) => void;
  onRequestDeleteResident: (resident: any) => void;
  setResPageSize: (size: number) => void;
  setResPage: (page: number) => void;
}

const ResidentsSection: React.FC<ResidentsSectionProps> = ({
  isValidatingSuugch,
  currentResidents,
  resPage,
  resPageSize,
  resTotalPages,
  filteredResidents,
  sortKey,
  sortOrder,
  toggleSortFor,
  tuluvByResidentId,
  onEditResident,
  onRequestDeleteResident,
  setResPageSize,
  setResPage,
}) => {
  return (
    <>
      {isValidatingSuugch ? (
        <div className="text-center py-8 text-subtle">Уншиж байна...</div>
      ) : (
        <div className="table-surface overflow-hidden rounded-2xl w-full">
          <div className="rounded-3xl p-6 neu-table allow-overflow">
            <div
              className="max-h-[45vh] overflow-y-auto custom-scrollbar w-full"
              id="resident-table"
            >
              <table className="table-ui text-sm min-w-full border border-[color:var(--surface-border)]">
                <thead className="z-10 bg-white dark:bg-gray-800">
                  <tr>
                    <th className="p-1 text-sm font-normal text-theme text-center w-12 bg-inherit border-r border-[color:var(--surface-border)]">
                      №
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-left pl-2 whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      Нэр
                    </th>

                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      <button
                        type="button"
                        onClick={() => toggleSortFor("orts")}
                        className="w-full inline-flex items-center justify-center gap-2"
                        title="Орц-аар эрэмбэлэх"
                      >
                        <span>Орц</span>
                        <span className="flex flex-col items-center">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortKey === "orts" && sortOrder === "asc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 ${
                              sortKey === "orts" && sortOrder === "desc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                        </span>
                      </button>
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      <button
                        type="button"
                        onClick={() => toggleSortFor("davkhar")}
                        className="w-full inline-flex items-center justify-center gap-2"
                        title="Давхар-аар эрэмбэлэх"
                      >
                        <span>Давхар</span>
                        <span className="flex flex-col items-center">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortKey === "davkhar" && sortOrder === "asc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 ${
                              sortKey === "davkhar" && sortOrder === "desc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                        </span>
                      </button>
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      <button
                        type="button"
                        onClick={() => toggleSortFor("toot")}
                        className="w-full inline-flex items-center justify-center gap-2"
                        title="Тоот-аар эрэмбэлэх"
                      >
                        <span>Тоот</span>
                        <span className="flex flex-col items-center">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortKey === "toot" && sortOrder === "asc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 ${
                              sortKey === "toot" && sortOrder === "desc"
                                ? "text-blue-500"
                                : "text-subtle"
                            }`}
                          />
                        </span>
                      </button>
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      Холбоо барих
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap border-r border-[color:var(--surface-border)]">
                      Төлөв
                    </th>
                    <th className="p-1 text-sm font-normal text-theme text-center whitespace-nowrap">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!currentResidents.length ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-subtle">
                        Хайсан мэдээлэл алга байна
                      </td>
                    </tr>
                  ) : (
                    currentResidents.map((p: any, idx: number) => (
                      <tr
                        key={p._id || idx}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-1 text-center text-theme border-r border-[color:var(--surface-border)]">
                          {(resPage - 1) * resPageSize + idx + 1}
                        </td>
                        <td className="p-1 text-theme whitespace-nowrap cell-left border-r border-[color:var(--surface-border)]">
                          {typeof p.ner === "object"
                            ? `${p.ner?.ner || ""} ${
                                p.ner?.kod || ""
                              }`.trim() || "-"
                            : p.ner || "-"}
                        </td>

                        <td className="p-1 text-center border-r border-[color:var(--surface-border)]">{getResidentOrts(p) || "-"}</td>
                        <td className="p-1 text-center border-r border-[color:var(--surface-border)]">{getResidentDavkhar(p) || "-"}</td>
                        <td className="p-1 text-center border-r border-[color:var(--surface-border)]">{getResidentToot(p) || "-"}</td>
                        <td className="p-1 text-center border-r border-[color:var(--surface-border)]">
                          <div className="text-sm text-theme">{p.utas}</div>
                        </td>
                        <td className="p-1 text-center border-r border-[color:var(--surface-border)]">
                          {(() => {
                            const id = String(p?._id || "");
                            const label =
                              id && tuluvByResidentId[id]
                                ? (tuluvByResidentId[id] as any)
                                : getPaymentStatusLabel(p);
                            const cls =
                              label === "Төлсөн"
                                ? "badge-paid"
                                : label === "Хугацаа хэтэрсэн"
                                  ? "bg-red-500 text-red-800"
                                  : label === "Төлөөгүй"
                                    ? "badge-unpaid"
                                    : "badge-neutral";
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-normal ${cls}`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-1 whitespace-nowrap">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => onEditResident(p)}
                              className="p-2 rounded-2xl action-edit hover-surface transition-colors"
                              title="Засах"
                              id="resident-edit-btn"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteResident(p)}
                              className="p-2 rounded-2xl action-delete hover-surface transition-colors"
                              title="Устгах"
                              id="resident-delete-btn"
                            >
                              <Trash2 className="w-5 h-5" />
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
          <div className="flex items-center justify-between px-2 py-1 text-md">
            <div className="text-theme/70">
              Нийт: {filteredResidents.length}
            </div>
            <div className="flex items-center gap-3">
              <PageSongokh
                value={resPageSize}
                onChange={(v) => {
                  setResPageSize(v);
                  setResPage(1);
                }}
                className="text-sm px-2"
              />

              <div
                id="resident-pagination"
                className="flex items-center gap-1"
              >
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
                  disabled={resPage <= 1}
                  onClick={() => {
                    const newPage = Math.max(1, resPage - 1);
                    setResPage(newPage);
                  }}
                >
                  Өмнөх
                </button>
                <div className="text-theme/70 px-1">{resPage}</div>
                <button
                  className="btn-minimal-sm btn-minimal px-2 py-1 text-sm"
                  disabled={resPage >= resTotalPages}
                  onClick={() => {
                    const newPage = Math.min(resTotalPages, resPage + 1);
                    setResPage(newPage);
                  }}
                >
                  Дараах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResidentsSection;

