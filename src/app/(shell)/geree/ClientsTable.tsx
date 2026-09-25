"use client";

import React, { useMemo, useState } from "react";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";
import { Edit, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { ConfirmCloseDialog } from "@/components/ui/ConfirmCloseDialog";
import { getPaymentStatusLabel } from "@/lib/utils";
import useSWR from "swr";
import dayjs from "dayjs";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import uilchilgee from "@/lib/uilchilgee";
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
  /** `mashin` коллекциос залгагдсан дугаар(ууд), олон бол таслалаар */
  mashiniiDugaar?: string;
  tailbar?: string;
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

  /**
   * Энэ сард үүссэн нэхэмжлэхүүд — Зогсоол/Агуулахын тоот бүрд энэ сарын
   * нэхэмжлэх илгээгдсэн эсэхийг харуулна. Гэрээний ID-аар, эс бөгөөс
   * тоотоор таарууна.
   */
  const { token, baiguullaga } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const baiguullagiinId = currentBaiguullagiinId || (baiguullaga?._id ? String(baiguullaga._id) : "");
  const { data: sariinNekhemjlekh } = useSWR(
    token && baiguullagiinId
      ? ["/nekhemjlekhiinTuukh", "khariltsagch-sar", token, baiguullagiinId, selectedBuildingId || "", dayjs().format("YYYY-MM")]
      : null,
    async () => {
      const ekhlel = dayjs().startOf("month").toISOString();
      const tugsgul = dayjs().endOf("month").toISOString();
      const resp = await uilchilgee(token || undefined).get("/nekhemjlekhiinTuukh", {
        params: {
          baiguullagiinId,
          ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 5000,
          query: JSON.stringify({
            baiguullagiinId,
            ...(selectedBuildingId ? { barilgiinId: selectedBuildingId } : {}),
            ognoo: { $gte: ekhlel, $lte: tugsgul },
          }),
        },
      });
      const jagsaalt: any[] = resp.data?.jagsaalt || (Array.isArray(resp.data) ? resp.data : []);
      const gereenuud = new Set<string>();
      const tootuud = new Set<string>();
      jagsaalt.forEach((n) => {
        if (n?.gereeniiId) gereenuud.add(String(n.gereeniiId));
        if (n?.toot) tootuud.add(String(n.toot).trim());
      });
      return { gereenuud, tootuud };
    },
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );
  /** Харилцагчийн Зогсоол/Агуулахын тоотууд (давхардалгүй) */
  const zogsoolAguulakh = (record: ClientItem): any[] => {
    let toots: any[] = Array.isArray(record.toots) ? record.toots : [];
    if (currentBaiguullagiinId)
      toots = toots.filter((t: any) => String(t.baiguullagiinId) === String(currentBaiguullagiinId));
    const seen = new Set<string>();
    return toots.filter((t: any) => {
      if (t.turul !== "Гараж" && t.turul !== "Агуулах") return false;
      const k = `${t.toot}_${t.barilgiinId || ""}_${t.turul}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const ilgeesenEsekh = (t: any): boolean => {
    if (!sariinNekhemjlekh) return false;
    const gid = String(t?.gereeniiId || t?.gereeId || "");
    if (gid && sariinNekhemjlekh.gereenuud.has(gid)) return true;
    return !!t?.toot && sariinNekhemjlekh.tootuud.has(String(t.toot).trim());
  };

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
        title: "Машины дугаар",
        dataIndex: "mashiniiDugaar",
        key: "mashiniiDugaar",
        width: 130,
        align: "center",
        // Дугаар нь `khariltsagch` дээр БИШ, `mashin` коллекцид байдаг —
        // жагсаалтын route нь нэг query-ээр залгаж `mashiniiDugaar` (олон
        // бол таслалаар) болгож буцаана.
        render: (val: string) => (
          <span
            title={val || undefined}
            className="block truncate text-[color:var(--panel-text)] dark:text-white"
          >
            {val || "-"}
          </span>
        ),
      },

      {
        title: "Зогсоол / Агуулах",
        key: "garage_storage",
        width: 220,
        sorter: true,
        sortOrder:
          sortKey === "garage_storage"
            ? sortOrder === "asc"
              ? "ascend"
              : "descend"
            : null,
        align: "left",
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



          // Бүх тоот нэг мөрөнд — hover хийх шаардлагагүй. Хасах × нь
          // шошгон дээр очиход л гарна.
          return (
            <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
              {toots.map((t: any, idx: number) => {
                const label = t.turul === "Гараж" ? "Зогсоол" : "Агуулах";
                return (
                  <span
                    key={idx}
                    title={`Тоот ${t.toot} · ${label}`}
                    className="group inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-2 py-0.5 text-[color:var(--panel-text)]"
                  >
                    <span className="tabular-nums">{t.toot}</span>
                    <span className="text-[10px] text-[color:var(--muted-text)]">{label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingTootRemove({
                          clientId: String(record._id),
                          baiguullagiinId: t.baiguullagiinId,
                          barilgiinId: t.barilgiinId,
                          toot: t.toot,
                          label: `${t.toot} (${label})`,
                        });
                      }}
                      className="-mr-1 inline-flex rounded p-0.5 text-danger opacity-0 transition-opacity hover:bg-danger/10 focus:opacity-100 group-hover:opacity-100"
                      title="Хасах"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        title: "Нэхэмжлэх",
        key: "nekhemjlekh",
        width: 120,
        align: "left",
        // Энэ сард Зогсоол/Агуулахын нэхэмжлэх илгээгдсэн эсэх
        render: (_: any, record: ClientItem) => {
          const toots = zogsoolAguulakh(record);
          if (toots.length === 0) return "-";
          const too = toots.filter(ilgeesenEsekh).length;
          const ungu =
            too === toots.length ? "bg-success" : too > 0 ? "bg-warning" : "bg-[color:var(--muted-text)]/40";
          const tekst =
            too === toots.length ? "Илгээсэн" : too > 0 ? `${too}/${toots.length}` : "Илгээгээгүй";
          return (
            <span
              title={`Энэ сарын нэхэмжлэх: ${too}/${toots.length} илгээсэн`}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                too > 0 ? "text-[color:var(--panel-text)]" : "text-[color:var(--muted-text)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ungu}`} />
              {tekst}
            </span>
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
        title: "Тайлбар",
        dataIndex: "tailbar",
        key: "tailbar",
        width: 160,
        align: "center",
        render: (val: string) => (
          <span
            title={val || undefined}
            className="block truncate text-[color:var(--muted-text)]"
          >
            {val || "-"}
          </span>
        ),
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
      currentBaiguullagiinId,
      sariinNekhemjlekh,
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
