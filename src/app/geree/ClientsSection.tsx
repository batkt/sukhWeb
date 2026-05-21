"use client";

import React from "react";
import { ClientsTable, ClientItem } from "./ClientsTable";
import { StandardPagination } from "@/components/ui/StandardTable";

type SortKey = string;

interface ClientsSectionProps {
  isValidatingSuugch: boolean;
  currentClients: any[];
  resPage: number;
  resPageSize: number;
  resTotalPages: number;
  totalClients: number;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  toggleSortFor?: (key: string, order?: any) => void;
  onEditClient: (Client: any) => void;
  onRequestDeleteClient: (Client: any) => void;
  onRemoveToot?: (ClientId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  currentBaiguullagiinId?: string;
  setResPageSize: (size: number) => void;
  setResPage: (page: number) => void;
}

const ClientsSection: React.FC<ClientsSectionProps> = ({
  isValidatingSuugch,
  currentClients,
  resPage,
  resPageSize,
  resTotalPages,
  totalClients,
  sortKey,
  sortOrder,
  toggleSortFor,
  onEditClient,
  onRequestDeleteClient,
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
        <div className="table-surface w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="p-1 allow-overflow no-scrollbar" id="Clients-table">
            <ClientsTable
              data={currentClients as ClientItem[]}
              loading={isValidatingSuugch}
              page={resPage}
              pageSize={resPageSize}
              sortKey={sortKey}
              sortOrder={sortOrder}
              currentBaiguullagiinId={currentBaiguullagiinId}
              maxHeight="calc(100vh - 460px)"
              onEdit={onEditClient}
              onDelete={onRequestDeleteClient}
              onRemoveToot={onRemoveToot}
              onSort={(key, order) => toggleSortFor?.(key, order)}
            />
          </div>
          <div id="Client-pagination">
            <StandardPagination
              current={resPage}
              total={totalClients}
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

export default ClientsSection;
