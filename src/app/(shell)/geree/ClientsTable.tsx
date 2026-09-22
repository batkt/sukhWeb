"use client";

import React, { useMemo, useState } from "react";
import { Tooltip } from "antd";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Edit, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import { getPaymentStatusLabel } from "@/lib/utils";
import {
  getResidentToot,
  getResidentDavkhar,
  getResidentOrts,
  getResidentToots,
  getResidentDavkhauraud,
  getResidentOrtsuud,
} from "@/lib/residentDataHelper";

export interface ClientItem {
  _id?: string;
  ner?: string | { ner?: string; kod?: string };
  utas?: string;
  toot?: string;
  davkhar?: string;
  orts?: string;
  [key: string]: any;
}

type SortKey = string;
type SortOrder = "asc" | "desc";

interface ClientsTableProps {
  data: ClientItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
  currentBaiguullagiinId?: string;
  onEdit?: (Client: ClientItem) => void;
  onDelete?: (Client: ClientItem) => void;
  onRemoveToot?: (ClientId: string, baiguullagiinId: string, barilgiinId: string, toot: string) => void;
  onSort?: (key: SortKey, order?: "ascend" | "descend" | null) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = React.memo(({
  data,
  loading = false,
  page = 1,
  pageSize = 500,
  sortKey = "createdAt",
  sortOrder = "desc",
  currentBaiguullagiinId,
  onEdit,
  onDelete,
  onRemoveToot,
  onSort,
}) => {
  const [pendingTootRemove, setPendingTootRemove] = useState<{
    clientId: string;
    baiguullagiinId: string;
    barilgiinId: string;
    toot: string;
    label: string;
  } | null>(null);

  const columns: ColumnsType<ClientItem> = useMemo(
    () => [
      // ... (index and ner columns omitted for brevity, keeping them as they are)
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: "Нэр",
        dataIndex: "ner",
        key: "ner",
        width: 250,
        sorter: true,
        sortOrder:
          sortKey === "ner"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "left",
        render: (val: string | { ner?: string; kod?: string }) => {
          const name =
            typeof val === "object"
              ? `${val?.ner || ""} ${val?.kod || ""}`.trim() || "-"
              : val || "-";
          return (
            <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
              {name}
            </span>
          );
        },
      },

      {
        title: "Зогсоол / Агуулах",
        key: "garage_storage",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "garage_storage"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (_: any, record: ClientItem) => {
          let toots =
            Array.isArray(record.toots) && record.toots.length > 0
              ? record.toots
              : [
                  {
                    toot: record.toot,
                    baiguullagiinId: record.baiguullagiinId,
                    barilgiinId: record.barilgiinId,
                    turul: record.turul || "Орон сууц",
                  },
                ];
          
          // Filter by currentBaiguullagiinId if provided
          if (currentBaiguullagiinId) {
            toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
          }

          // Only show Zogsool or Aguulakh
          toots = toots.filter((t: any) => t.turul === "Гараж" || t.turul === "Агуулах");

          // Deduplicate toots array
          const seenToots = new Set<string>();
          toots = toots.filter((t: any) => {
            const key = `${t.toot}_${t.barilgiinId || ""}_${t.turul || ""}`;
            if (seenToots.has(key)) return false;
            seenToots.add(key);
            return true;
          });

          if (toots.length === 0) return "-";



          const tooltipContent = (
            <div className="space-y-1.5 p-1.5 max-w-[220px]">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : "Агуулах";
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="text-white font-medium">Тоот {t.toot} {label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingTootRemove({
                          clientId: String(record._id),
                          baiguullagiinId: t.baiguullagiinId,
                          barilgiinId: t.barilgiinId,
                          toot: t.toot,
                          label: `${t.toot} (${t.turul === "Гараж" ? "Зогсоол" : "Агуулах"})`,
                        });
                      }}
                      className="p-0.5 text-danger hover:text-danger rounded hover:bg-danger/30 transition-colors"
                      title="Хасах"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );

          return (
            <Tooltip title={tooltipContent} placement="top" color="#1e293b" trigger="hover">
              <span className="inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-0.5 rounded-md bg-[color:var(--surface-hover)] font-semibold text-[color:var(--panel-text)] border border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors">
                {toots[0].toot}
                {toots.length > 1 && (
                  <span className="text-[color:var(--muted-text)] font-bold">
                    +{toots.length - 1}
                  </span>
                )}
              </span>
            </Tooltip>
          );
        },
      },
      {
        title: "Утас",
        dataIndex: "utas",
        key: "utas",
        width: 140,
        sorter: true,
        sortOrder:
          sortKey === "utas"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (val: string) => (
          <span className="text-[color:var(--panel-text)] dark:text-white whitespace-nowrap">
            {val || "-"}
          </span>
        ),
      },
      {
        title: "Төлөв",
        key: "tuluv",
        width: 110,
        sorter: true,
        sortOrder:
          sortKey === "tuluv"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "center",
        render: (_: any, record: any) => {
          const uldegdel = Number(record?.uldegdel ?? record?.ekhniiUldegdel ?? 0);
          const payLabel = uldegdel <= 0 ? "Төлсөн" : "Төлөөгүй";
          const payClass = payLabel === "Төлсөн" ? "badge-paid" : "badge-unpaid";
          return (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2 py-0.5 font-normal rounded-full ${payClass}`}>
                {payLabel}
              </span>
            </div>
          );
        },
      },
      {
        title: "Үйлдэл",
        key: "action",
        align: "center",
        width: 96,
        render: (_: any, record: ClientItem, index: number) => (
          <div className="flex gap-1 justify-center">
            <button
              type="button"
              onClick={() => onEdit?.(record)}
              className="p-1.5 rounded-md action-edit hover-surface transition-colors hover:bg-theme/10 dark:hover:bg-theme/30"
              id={index === 0 ? "Client-edit-btn" : undefined}
              title="Засах"
            >
              <Edit className="w-4 h-4 text-brand" />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(record)}
              className="p-1.5 rounded-md action-delete hover-surface transition-colors hover:bg-danger/10"
              id={index === 0 ? "Client-delete-btn" : undefined}
              title="Устгах"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </button>
          </div>
        ),
      },
    ],
    [
      page,
      pageSize,
      sortKey,
      sortOrder,
      onEdit,
      onDelete,
      onRemoveToot,
      onSort,
      setPendingTootRemove,
    ],
  );

  return (
    <>
    <div className="w-full overflow-hidden">
      <div className="w-full">
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) =>
            record._id ||
            `res_${String(typeof record.ner === "object" ? record.ner?.ner : record.ner)}_${record.toot}_${record.utas}`
          }
          pagination={false}
          loading={loading}
          className="min-w-[1000px]"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <span className="text-[color:var(--muted-text)]">
                Хайсан мэдээлэл алга байна
              </span>
            ),
          }}
          onChange={(_: any, __: any, sorter: any) => {
            if (onSort) {
              onSort((sorter.field || sorter.columnKey) as SortKey, sorter.order);
            }
          }}
        />
      </div>
    </div>

    <ConfirmCloseDialog
      open={!!pendingTootRemove}
      title="Тоот хасах уу?"
      description={`"${pendingTootRemove?.label}" тоотыг харилцагчаас хасах гэж байна.`}
      confirmLabel="Хасах"
      cancelLabel="Болих"
      confirmVariant="danger"
      onCancel={() => setPendingTootRemove(null)}
      onConfirm={() => {
        if (pendingTootRemove) {
          onRemoveToot?.(
            pendingTootRemove.clientId,
            pendingTootRemove.baiguullagiinId,
            pendingTootRemove.barilgiinId,
            pendingTootRemove.toot,
          );
        }
        setPendingTootRemove(null);
      }}
    />
    </>
  );
});


export default ClientsTable;
