"use client";

import React from "react";
import { ResidentsTable, ResidentItem } from "./ResidentsTable";
import PageSongokh from "../../../components/selectZagvar/pageSongokh";

type SortKey = "createdAt" | "toot" | "orts" | "davkhar";

interface ResidentsSectionProps {
  isValidatingSuugch: boolean;
  currentResidents: any[];
  resPage: number;
  resPageSize: number;
  resTotalPages: number;
  totalResidents: number;
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
  totalResidents,
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
        <div className="table-surface overflow-hidden w-full">
          <div className="p-3 allow-overflow">
            <ResidentsTable
              data={currentResidents as ResidentItem[]}
              loading={isValidatingSuugch}
              page={resPage}
              pageSize={resPageSize}
              sortKey={sortKey}
              sortOrder={sortOrder}
              tuluvByResidentId={tuluvByResidentId}
              onEdit={onEditResident}
              onDelete={onRequestDeleteResident}
              onSort={toggleSortFor}
            />
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-1 text-md">
            <div className="text-theme/70">Нийт: {totalResidents}</div>
            <div className="flex items-center gap-3">
              <PageSongokh
                value={resPageSize}
                onChange={(v) => {
                  setResPageSize(v);
                  setResPage(1);
                }}
                className="text-sm px-2"
              />
              <div id="resident-pagination" className="flex items-center gap-1">
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
