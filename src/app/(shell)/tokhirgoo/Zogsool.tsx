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
import Button from "@/components/ui/Button";
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
          <span className="inline-flex items-center rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3 py-0.5">
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
          <span className="inline-flex items-center rounded-lg border border-theme/30 bg-theme/10 px-3 py-0.5 text-theme dark:border-theme dark:bg-theme/60 dark:text-theme">
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
                  className="inline-flex items-center rounded-lg border border-theme/30 bg-theme/10 px-3 py-0.5 text-theme dark:border-theme dark:bg-theme/60 dark:text-theme"
                >
                  {gate.ner}
                </span>
              ))
            ) : (
              <span className="italic opacity-60">Хаалга холбоогүй</span>
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
              className="rounded-lg p-1.5 text-theme transition-colors hover:bg-theme/10 dark:text-theme dark:hover:bg-theme/10"
              title="Засах"
            >
              <Edit className="h-4 w-4" />
            </button>
            {record._id && (
              <button
                onClick={() => deleteZogsool(record._id!)}
                className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10"
                title="Устгах"
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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] p-4 sm:p-6 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)] shrink-0">
            <div>
              <h2 className="text-lg text-[color:var(--panel-text)] tracking-tight">
                {editingItem ? "Зогсоол засах" : "Шинэ зогсоол бүртгэх"}
              </h2>
              <p className="text-xs text-[color:var(--muted-text)]">
                {editingItem ? `ID: ${editingItem._id || editingItem.key}` : "Системд шинэ зогсоолын талбай үүсгэх"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCloseForm}
                variant="ghost"
                size="sm"
                style={{ borderRadius: '10px' }}
                className="px-3"
              >
                Хаах
              </Button>
              <Button
                onClick={() => zogsoolRef.current?.khadgalya()}
                variant="primary"
                size="sm"
                isLoading={isValidating}
                style={{ borderRadius: '10px' }}
                className="px-4"
              >
                Хадгалах
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
            <ZogsoolBurtgekh
              ref={zogsoolRef}
              data={editingItem}
              jagsaalt={zogsoolData}
              barilgiinId={effectiveBarilgiinId || barilgiinId || undefined}
              token={token || ""}
              refresh={refreshZogsool}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] p-4 sm:p-5 space-y-4">
        {/* Top Header Row with Metrics */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[color:var(--surface-border)] shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <h2 className="text-xl text-[color:var(--panel-text)] tracking-tight">
                Зогсоолын тохиргоо
              </h2>
              <p className="text-xs text-[color:var(--muted-text)]">
                Нийт <span className="text-theme dark:text-theme">{totalRecords}</span> талбай тохируулагдсан
              </p>
            </div>
            
            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2 text-xs">
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-[color:var(--surface-hover)] text-[color:var(--panel-text)] dark:text-white border border-[color:var(--surface-border)] font-medium">
                Нийт талбай: <span className="text-theme dark:text-theme font-semibold">{totalRecords}</span>
              </span>
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-theme/10 dark:bg-theme/60 text-theme dark:text-theme border border-theme/30 dark:border-theme font-medium">
                Багтаамж: <span className="text-theme dark:text-theme font-semibold">{totalCapacity} машин</span>
              </span>
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-theme/10 dark:bg-theme/60 text-theme dark:text-theme border border-theme/30 dark:border-theme font-medium">
                Хаалга: <span className="text-theme dark:text-theme font-semibold">{totalGates}</span>
              </span>
            </div>
          </div>

          <Button
            onClick={openAdd}
            variant="primary"
            size="sm"
            style={{ borderRadius: '10px' }}
            className="shrink-0 px-4"
          >
            Шинэ зогсоол нэмэх
          </Button>
        </div>

        {/* Стандарт хүснэгт */}
        <>
          <Table<ZogsoolItem>
            columns={zogsoolColumns}
            dataSource={paginatedData}
            rowKey={(record, index) => record._id || record.key || index}
            loading={isValidating}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <div>
                  <p>Зогсоолын талбай бүртгэгдээгүй байна</p>
                  <p className="mt-1 text-xs opacity-70">
                    &quot;Шинэ зогсоол нэмэх&quot; товчийг дарж зогсоолын систем
                    тохируулна уу
                  </p>
                </div>
              ),
            }}
          />

            {/* Pagination Controls — Fixed at bottom */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 pt-1 border-t border-[color:var(--surface-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[color:var(--panel-text)]">
                    Нийт <span>{totalRecords}</span> талбай
                  </span>

                  {/* Page Size Selector */}
                  <div className="relative page-size-selector">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                      className="!rounded-xl border border-[color:var(--surface-border)] dark:border-white/10"
                    >
                      {pageSize} / хуудас
                    </Button>
                    {isPageSizeOpen && (
                      <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-2xl shadow-xl z-20 min-w-[110px] overflow-hidden p-1">
                        {[10, 20, 50, 100, 500].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setPageSize(size);
                              setPage(1);
                              setIsPageSizeOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 rounded-xl text-left text-xs transition-colors ${
                              pageSize === size
                                ? "bg-theme/10 text-theme dark:text-theme"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="!rounded-xl border border-[color:var(--surface-border)] dark:border-white/10"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Өмнөх
                  </Button>
                  <span className="text-xs text-[color:var(--panel-text)] px-3">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="!rounded-xl border border-[color:var(--surface-border)] dark:border-white/10"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            )}
        </>
      </div>
    </div>
  );
}

