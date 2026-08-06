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
                Нийт <span className="text-blue-600 dark:text-blue-400">{totalRecords}</span> талбай тохируулагдсан
              </p>
            </div>
            
            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2 text-xs">
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-medium">
                Нийт талбай: <span className="text-blue-700 dark:text-blue-400 font-semibold">{totalRecords}</span>
              </span>
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 font-medium">
                Багтаамж: <span className="text-emerald-800 dark:text-emerald-300 font-semibold">{totalCapacity} машин</span>
              </span>
              <span style={{ borderRadius: '10px' }} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 border border-blue-300 dark:border-blue-700 font-medium">
                Хаалга: <span className="text-blue-800 dark:text-blue-300 font-semibold">{totalGates}</span>
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

        {/* Table Section — Fits content height naturally */}
        {isValidating ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size="md" />
            <span className="text-xs text-[color:var(--muted-text)]">Мэдээлэл уншиж байна...</span>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: '14px' }} className="border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-[color:var(--surface-border)]">
                    <tr>
                      <th className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-12">
                        №
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-left w-1/4">
                        Зогсоолын нэр
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-28">
                        Багтаамж
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-right w-36">
                        Үндсэн тариф
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-left">
                        Хаалганууд
                      </th>
                      <th className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 text-center w-24">
                        Үйлдэл
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--surface-border)]">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[color:var(--muted-text)]"
                        >
                          <div>
                            <p className="text-slate-700 dark:text-slate-200">
                              Зогсоолын талбай бүртгэгдээгүй байна
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              "Шинэ зогсоол нэмэх" товчийг дарж зогсоолын систем тохируулна уу
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((record, index) => {
                        return (
                          <tr
                            key={record._id || record.key || index}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-3 py-2.5 text-center text-slate-500 dark:text-slate-400 text-xs">
                              {(page - 1) * pageSize + index + 1}
                            </td>
                            <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                              <span className="text-slate-800 dark:text-slate-100">{record.ner}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span style={{ borderRadius: '8px' }} className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs border border-slate-300 dark:border-slate-700">
                                {record.too} <span className="text-[10px] text-slate-600 dark:text-slate-300 ml-1">машин</span>
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span style={{ borderRadius: '8px' }} className="inline-flex items-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 text-xs border border-emerald-300 dark:border-emerald-700">
                                {formatNumber(record.undsenUne)} ₮
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap gap-1.5">
                                {record.khaalga && record.khaalga.length > 0 ? (
                                  record.khaalga.map((gate: any, gateIdx: number) => (
                                    <span
                                      key={gateIdx}
                                      style={{ borderRadius: '8px' }}
                                      className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-100 text-xs border border-blue-300 dark:border-blue-700"
                                    >
                                      {gate.ner}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500 italic">
                                    Хаалга холбоогүй
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openEdit(record)}
                                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                  title="Засах"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {record._id && (
                                  <button
                                    onClick={() => deleteZogsool(record._id!)}
                                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                    title="Устгах"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
                      className="!rounded-xl border border-slate-200 dark:border-white/10"
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
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
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
                    className="!rounded-xl border border-slate-200 dark:border-white/10"
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
                    className="!rounded-xl border border-slate-200 dark:border-white/10"
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

