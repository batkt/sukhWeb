"use client";

import React from "react";
import { ResidentsTable, ResidentItem } from "./ResidentsTable";
import { StandardPagination } from "@/components/ui/StandardTable";

type SortKey = string;

interface ResidentsSectionProps {
  isValidatingSuugch: boolean;
  currentResidents: any[];
  resPage: number;
  resPageSize: number;
  resTotalPages: number;
  totalResidents: number;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  toggleSortFor?: (key: string, order?: any) => void;
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Уншиж байна...
        </div>
      ) : (
        <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="p-1 allow-overflow no-scrollbar" id="residents-table">
            <ResidentsTable
              data={currentResidents as ResidentItem[]}
              loading={isValidatingSuugch}
              page={resPage}
              pageSize={resPageSize}
              sortKey={sortKey}
              sortOrder={sortOrder}
              tuluvByResidentId={tuluvByResidentId}
              maxHeight="calc(100vh - 460px)"
              onEdit={onEditResident}
              onDelete={onRequestDeleteResident}
              onSort={(key, order) => toggleSortFor?.(key, order)}
            />
          </div>
          <div id="resident-pagination">
            <StandardPagination
              current={resPage}
              total={totalResidents}
              pageSize={resPageSize}
              onChange={setResPage}
              onPageSizeChange={(v) => {
                setResPageSize(v);
                setResPage(1);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResidentsSection;
