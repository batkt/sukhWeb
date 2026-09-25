"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Car, ChevronLeft, ChevronRight, DoorOpen, Layers, DollarSign, CheckCircle2 } from "lucide-react";
import ZogsoolBurtgekh from "./ZogsoolBurtgekh";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { Loader } from "@mantine/core";
import { SettingsCard } from "./SettingsRow";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";

interface ZogsoolItem {
  _id?: string;
  key?: number;
  ner: string;
  ajiltniiNer?: string;
  khaalga?: any[];
  too: number;
  undsenUne: number | string;
  ognoo?: Date | string;
  createdAt?: string;
}

interface ZogsoolProps {
  ajiltan?: any;
  baiguullaga?: any;
  token?: string;
  setSongogdsonTsonkhniiIndex?: (index: number) => void;
}

export default function Zogsool({
  ajiltan,
  baiguullaga,
  token: propToken,
  setSongogdsonTsonkhniiIndex,
}: ZogsoolProps) {
  const { token: authToken, barilgiinId, ajiltan: authAjiltan } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const token = propToken || authToken || "";

  const effectiveAjiltan = ajiltan || authAjiltan;
  const effectiveBaiguullagiinId = effectiveAjiltan?.baiguullagiinId;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [editingItem, setEditingItem] = useState<ZogsoolItem | null>(null);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const zogsoolRef = useRef<any>(null);

  const shouldFetch = !!token && !!effectiveBaiguullagiinId;

  const { data: zogsoolDataResponse, mutate: mutateZogsool, isValidating } = useSWR(
    shouldFetch
      ? [
          "/parking",
          token,
          effectiveBaiguullagiinId,
          effectiveBarilgiinId,
          page,
        ]
      : null,
    async ([url, tkn, bId, barId, p]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: p,
          khuudasniiKhemjee: 10000, // Fetch all for client-side pagination
        },
      });

      const data = resp.data;
      if (Array.isArray(data)) {
        return {
          jagsaalt: data,
          niitMur: data.length,
          niitKhuudas: Math.ceil(data.length / pageSize),
        };
      }
      return data;
    },
    { revalidateOnFocus: false }
  );

  const zogsoolData: ZogsoolItem[] = useMemo(() => {
    const data = zogsoolDataResponse;
    if (!data) return [];
    if (Array.isArray(data?.jagsaalt)) return data.jagsaalt;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.data?.jagsaalt)) return data.data.jagsaalt;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [zogsoolDataResponse]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return zogsoolData.slice(start, end);
  }, [zogsoolData, page, pageSize]);

  const totalPages = Math.ceil(zogsoolData.length / pageSize);
  const totalRecords = zogsoolData.length;

  const totalCapacity = useMemo(() => {
    return zogsoolData.reduce((sum, item) => sum + (Number(item.too) || 0), 0);
  }, [zogsoolData]);

  const totalGates = useMemo(() => {
    return zogsoolData.reduce((sum, item) => sum + (Array.isArray(item.khaalga) ? item.khaalga.length : 0), 0);
  }, [zogsoolData]);

  const deleteZogsool = async (id: string) => {
    if (!confirm("Устгахдаа итгэлтэй байна уу?")) return;
    try {
      await uilchilgee(token).delete(`/parking/${id}`);
      openSuccessOverlay("Амжилттай устгалаа");
      mutateZogsool();
    } catch (error: any) {
      openErrorOverlay(error?.message || "Алдаа гарлаа");
    }
  };

  const refreshZogsool = () => {
    mutateZogsool();
  };

  const [view, setView] = useState<"list" | "form">("list");

  const openAdd = () => {
    setEditingItem(null);
    setView("form");
  };

  const openEdit = (item: ZogsoolItem) => {
    setEditingItem(item);
    setView("form");
  };

  const handleCloseForm = () => {
    setView("list");
    setEditingItem(null);
  };

  const formatNumber = (num: any, decimals = 2) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) return "0.00";
    return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Close page size dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".page-size-selector")) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const zogsoolColumns: ColumnsType<ZogsoolItem> = useMemo(
    () => [
      {
        title: "№",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      { title: "Зогсоолын нэр", dataIndex: "ner", key: "ner", width: 240 },
      {
        title: "Багтаамж",
        dataIndex: "too",
        key: "too",
        width: 120,
        align: "center",
        render: (v: any) => (
          <span className="inline-flex items-center rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-2.5 py-1 text-[13px]">
            {v} <span className="ml-1 opacity-70">машин</span>
          </span>
        ),
      },
      {
        title: "Үндсэн тариф",
        dataIndex: "undsenUne",
        key: "undsenUne",
        width: 150,
        align: "right",
        render: (v: any) => (
          <span className="inline-flex items-center rounded-lg border border-theme/30 bg-theme/10 px-2.5 py-1 text-[13px] text-brand">
            {formatNumber(v)} ₮
          </span>
        ),
      },
      {
        title: "Хаалганууд",
        dataIndex: "khaalga",
        key: "khaalga",
        render: (khaalga: any[]) => (
          <div className="flex flex-wrap gap-1.5">
            {khaalga && khaalga.length > 0 ? (
              khaalga.map((gate: any, gateIdx: number) => (
                <span
                  key={gateIdx}
                  className="inline-flex items-center rounded-lg border border-theme/30 bg-theme/10 px-2.5 py-1 text-[13px] text-brand"
                >
                  {gate.ner}
                </span>
              ))
            ) : (
              <span className="text-[13px] text-[color:var(--muted-text)]">Хаалга холбоогүй</span>
            )}
          </div>
        ),
      },
      {
        title: "Үйлдэл",
        key: "action",
        width: 96,
        align: "center",
        render: (_: any, record: ZogsoolItem) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => openEdit(record)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand transition-colors hover:bg-theme/10"
              title="Засах"
              aria-label="Засах"
            >
              <Edit className="h-4 w-4" />
            </button>
            {record._id && (
              <button
                onClick={() => deleteZogsool(record._id!)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-danger transition-colors hover:bg-danger/10"
                title="Устгах"
              aria-label="Устгах"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
     
    [page, pageSize],
  );

  if (view === "form") {
    return (
      <div className="w-full">
        <SettingsCard
          icon={<Car className="h-4 w-4" />}
          title={editingItem ? "Зогсоол засах" : "Шинэ зогсоол бүртгэх"}
          stickyHead
          subtitle={
            editingItem
              ? `ID: ${editingItem._id || editingItem.key}`
              : "Системд шинэ зогсоолын талбай үүсгэх"
          }
          toggle={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="stg-btn stg-btn-ghost"
              >
                Хаах
              </button>
              <button
                type="button"
                onClick={() => zogsoolRef.current?.khadgalya()}
                disabled={isValidating}
                className="stg-btn stg-btn-primary"
              >
                {isValidating ? <Loader size="xs" color="white" /> : null}
                Хадгалах
              </button>
            </div>
          }
        >
          <ZogsoolBurtgekh
            ref={zogsoolRef}
            data={editingItem}
            jagsaalt={zogsoolData}
            barilgiinId={effectiveBarilgiinId || barilgiinId || undefined}
            token={token || ""}
            refresh={refreshZogsool}
            onClose={handleCloseForm}
          />
        </SettingsCard>
      </div>
    );
  }

  return (
    <div className="w-full">
      <SettingsCard
        icon={<Car className="h-4 w-4" />}
        title="Зогсоолууд"
        subtitle={
          <>
            Нийт {totalRecords} талбай · Багтаамж {totalCapacity} машин · Хаалга{" "}
            {totalGates}
          </>
        }
        toggle={
          <button
            type="button"
            onClick={openAdd}
            className="stg-btn stg-btn-primary"
          >
            <Plus className="h-4 w-4" />
            Шинэ зогсоол нэмэх
          </button>
        }
      >
        <div className="space-y-4">
          <Table<ZogsoolItem>
            columns={zogsoolColumns}
            dataSource={paginatedData}
            rowKey={(record, index) => record._id || record.key || index}
            loading={isValidating}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <div className="py-4">
                  <p className="text-sm text-[color:var(--panel-text)]">
                    Зогсоолын талбай бүртгэгдээгүй байна
                  </p>
                  <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
                    Дээрх «Шинэ зогсоол нэмэх» товчийг дарж зогсоолоо
                    тохируулна уу
                  </p>
                </div>
              ),
            }}
          />

          {/* Хуудаслалт */}
          {totalPages > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[color:var(--surface-border)]">
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[color:var(--muted-text)]">
                  Нийт{" "}
                  <span className="text-[color:var(--panel-text)]">
                    {totalRecords}
                  </span>{" "}
                  талбай
                </span>

                {/* Page Size Selector */}
                <div className="relative page-size-selector">
                  <button
                    type="button"
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    className="stg-btn stg-btn-ghost"
                  >
                    {pageSize} / хуудас
                  </button>
                  {isPageSizeOpen && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-xl shadow-md z-20 min-w-[120px] overflow-hidden p-1">
                      {[10, 20, 50, 100, 500].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setPage(1);
                            setIsPageSizeOpen(false);
                          }}
                          className={`w-full h-9 px-3 rounded-lg text-left text-sm transition-colors ${
                            pageSize === size
                              ? "bg-theme/10 text-brand"
                              : "text-[color:var(--panel-text)] hover:bg-[color:var(--surface-hover)]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="stg-btn stg-btn-ghost"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Өмнөх
                </button>
                <span className="text-sm text-[color:var(--panel-text)] px-2">
                  {page} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="stg-btn stg-btn-ghost"
                >
                  Дараах
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}
