"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Car, ChevronLeft, ChevronRight, Loader as LoaderIcon } from "lucide-react";
import ZogsoolBurtgekh from "./ZogsoolBurtgekh";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { Loader } from "@mantine/core";
import Button from "@/components/ui/Button";

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
  const [pageSize, setPageSize] = useState(10);
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

  const formatNumber = (num: any, decimals = 0) => {
    const val = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(val)) return "0";
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

  if (view === "form") {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCloseForm}
                className="p-2 rounded-lg hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)]"
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--panel-text)]">
                  {editingItem ? "Зогсоол засах" : "Шинэ зогсоол бүртгэх"}
                </h2>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  {editingItem ? `ID: ${editingItem._id || editingItem.key}` : "Системд шинэ зогсоолын талбай үүсгэх"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCloseForm}
                variant="ghost"
                size="md"
                className="!rounded-lg"
                style={{ borderRadius: '0.5rem' }}
              >
                Болих
              </Button>
              <Button
                onClick={() => zogsoolRef.current?.khadgalya()}
                variant="primary"
                size="md"
                isLoading={isValidating}
                className="!rounded-lg"
                style={{ borderRadius: '0.5rem' }}
              >
                Хадгалах
              </Button>
            </div>
          </div>

          <div className="bg-[color:var(--surface-bg)] rounded-lg border border-[color:var(--surface-border)] p-4">
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
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--panel-text)]">
                Зогсоолын тохиргоо
              </h2>
              <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                Нийт {totalRecords} талбай тохируулагдсан байна
              </p>
            </div>
          </div>
          <Button
            onClick={openAdd}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="!rounded-lg"
            style={{ borderRadius: '0.5rem' }}
          >
            Шинэ зогсоол нэмэх
          </Button>
        </div>

        {/* Table */}
        {isValidating ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden" style={{ maxHeight: `${pageSize * 60}px`, overflowY: 'auto' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[color:var(--surface-hover)] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)] text-center w-16 !rounded-tl-lg">
                        #
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Зогсоолын нэр
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Багтаамж
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Тариф
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Хаалганууд
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)] text-center !rounded-tr-lg">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-[color:var(--muted-text)]"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-slate-100 dark:bg-white/5 text-slate-300">
                              <Car className="w-12 h-12" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-[color:var(--panel-text)]">
                                Мэдээлэл олдсонгүй
                              </p>
                              <p className="text-xs text-[color:var(--muted-text)] mt-1">
                                "Шинэ зогсоол нэмэх" товчийг дарж бүртгэнэ үү
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((record, index) => {
                        const isLast = index === paginatedData.length - 1;
                        return (
                          <tr
                            key={record._id || record.key || index}
                            className={`border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors ${isLast ? 'last:border-b-0' : ''}`}
                          >
                            <td className="px-4 py-3 text-sm text-[color:var(--panel-text)] text-center">
                              {(page - 1) * pageSize + index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                  {record.ner?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{record.ner}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                              <span className="font-medium">{record.too}</span>
                              <span className="text-xs text-[color:var(--muted-text)] ml-1">машин</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                              <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                                {formatNumber(record.undsenUne)} ₮
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                              <div className="flex flex-wrap gap-1.5">
                                {record.khaalga && record.khaalga.length > 0 ? (
                                  record.khaalga.map((gate: any, gateIdx: number) => (
                                    <span
                                      key={gateIdx}
                                      className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-white/10"
                                    >
                                      {gate.ner}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-[color:var(--muted-text)] italic">
                                    Тохируулаагүй
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(record)}
                                  className="!rounded-lg"
                                  style={{ borderRadius: '0.5rem' }}
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {record._id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteZogsool(record._id!)}
                                    className="!rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
                                    style={{ borderRadius: '0.5rem' }}
                                    title="Устгах"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[color:var(--surface-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[color:var(--panel-text)]">
                    Нийт {totalRecords} талбай
                  </span>
                  
                  {/* Page Size Selector */}
                  <div className="relative page-size-selector">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                      className="!rounded-lg"
                      style={{ borderRadius: '0.5rem' }}
                    >
                      {pageSize} / хуудас
                    </Button>
                    {isPageSizeOpen && (
                      <div className="absolute bottom-full mb-2 left-0 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] rounded-lg shadow-lg z-10 min-w-[100px] overflow-hidden">
                        {[10, 20, 50, 100, 500].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setPageSize(size);
                              setPage(1);
                              setIsPageSizeOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-[color:var(--surface-hover)] transition-colors ${
                              pageSize === size
                                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                                : "text-[color:var(--panel-text)]"
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
                    className="!rounded-lg"
                    style={{ borderRadius: '0.5rem' }}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Өмнөх
                  </Button>
                  <span className="text-sm text-[color:var(--panel-text)] px-3">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="!rounded-lg"
                    style={{ borderRadius: '0.5rem' }}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
