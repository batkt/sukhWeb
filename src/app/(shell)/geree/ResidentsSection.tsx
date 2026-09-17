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
  onEditResident: (resident: any) => void;
  onViewResident?: (resident: any) => void;
  onRequestDeleteResident: (resident: any) => void;
  onRemoveToot?: (residentId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  currentBaiguullagiinId?: string;
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
  onEditResident,
  onViewResident,
  onRequestDeleteResident,
  onRemoveToot,
  currentBaiguullagiinId,
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
        <div className="w-full">
          <div className="allow-overflow no-scrollbar" id="residents-table">
            <ResidentsTable
              data={currentResidents as ResidentItem[]}
              loading={isValidatingSuugch}
              page={resPage}
              pageSize={resPageSize}
              sortKey={sortKey}
              sortOrder={sortOrder}
              currentBaiguullagiinId={currentBaiguullagiinId}
              onEdit={onEditResident}
              onView={onViewResident}
              onDelete={onRequestDeleteResident}
              onRemoveToot={onRemoveToot}
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
