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
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="bg-[color:var(--surface-bg)] rounded-3xl border border-[color:var(--surface-border)] p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[color:var(--surface-border)]">
            <div className="flex items-center gap-3.5">
              <button
                onClick={handleCloseForm}
                className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs"
                type="button"
              >
                Өмнөх
              </button>
              <div>
                <h2 className="text-xl text-[color:var(--panel-text)] tracking-tight">
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
                className="!rounded-xl"
              >
                Хаах
              </Button>
              <Button
                onClick={() => zogsoolRef.current?.khadgalya()}
                variant="primary"
                size="md"
                isLoading={isValidating}
                className="!rounded-xl"
              >
                Хадгалах
              </Button>
            </div>
          </div>

          <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] p-6 shadow-sm">
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
      <div className="bg-[color:var(--surface-bg)] rounded-3xl border border-[color:var(--surface-border)] p-6 lg:p-8 space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[color:var(--surface-border)]">
          <div>
            <h2 className="text-2xl text-[color:var(--panel-text)] tracking-tight">
              Зогсоолын тохиргоо
            </h2>
            <p className="text-xs text-[color:var(--muted-text)] mt-1">
              Нийт <span className="text-blue-600 dark:text-blue-400">{totalRecords}</span> талбай тохируулагдсан байна
            </p>
          </div>

          <Button
            onClick={openAdd}
            variant="primary"
            size="md"
            className="!rounded-xl"
          >
            Шинэ зогсоол нэмэх
          </Button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Нийт талбай</p>
              <p className="text-2xl text-slate-900 dark:text-white">{totalRecords}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Нийт багтаамж</p>
              <p className="text-2xl text-slate-900 dark:text-white">{totalCapacity} <span className="text-xs text-slate-400">машин</span></p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Холбосон хаалга</p>
              <p className="text-2xl text-slate-900 dark:text-white">{totalGates} <span className="text-xs text-slate-400">хаалга</span></p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {isValidating ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader size="md" />
            <span className="text-xs text-[color:var(--muted-text)]">Мэдээлэл уншиж байна...</span>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-[color:var(--surface-border)]">
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-center w-14">
                        №
                      </th>
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-left">
                        Зогсоолын нэр
                      </th>
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-center">
                        Багтаамж
                      </th>
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-right">
                        Үндсэн тариф
                      </th>
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-left">
                        Хаалганууд
                      </th>
                      <th className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 text-center w-28">
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
                            <td className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 text-xs">
                              {(page - 1) * pageSize + index + 1}
                            </td>
                            <td className="px-4 py-3.5 text-slate-900 dark:text-white">
                              <span className="text-slate-800 dark:text-slate-100">{record.ner}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200/60 dark:border-white/5">
                                {record.too} <span className="text-[10px] text-slate-400 ml-1">машин</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs border border-emerald-200/60 dark:border-emerald-500/20">
                                {formatNumber(record.undsenUne)} ₮
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1.5">
                                {record.khaalga && record.khaalga.length > 0 ? (
                                  record.khaalga.map((gate: any, gateIdx: number) => (
                                    <span
                                      key={gateIdx}
                                      className="inline-flex items-center px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs border border-indigo-200/60 dark:border-indigo-500/20"
                                    >
                                      {gate.ner}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    Хаалга холбоогүй
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEdit(record)}
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Засах
                                </button>
                                {record._id && (
                                  <button
                                    onClick={() => deleteZogsool(record._id!)}
                                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                                  >
                                    Устгах
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

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
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

