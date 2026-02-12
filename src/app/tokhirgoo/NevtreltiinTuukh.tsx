"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Settings, 
  MoreHorizontal, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Globe,
  Monitor,
  MapPin,
  Clock
} from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import Button from "@/components/ui/Button";

interface Props {
  token: string;
  baiguullaga: { _id: string };
  ajiltan: { _id: string; baiguullagiinId?: string };
}

interface LoginRecord {
  _id: string;
  ajiltniiId: string;
  ajiltniiNer: string;
  ognoo: string;
  ip: string;
  bairshilUls: string;
  bairshilKhot: string;
  uildliinSystem: string;
  browser: string;
  useragent: string;
  baiguullagiinId: string;
  baiguullagiinRegister: string;
  barilgiinId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NevtreltiinTuukh({
  token,
  baiguullaga,
  ajiltan,
}: Props) {
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().subtract(30, "days").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);

  // Build query for API
  const query = useMemo(() => {
    const q: any = {};
    
    if (baiguullaga?._id) {
      q.baiguullagiinId = baiguullaga._id;
    }
    
    if (dateRange[0] && dateRange[1]) {
      q.ognoo = {
        $gte: `${dateRange[0]} 00:00:00`,
        $lte: `${dateRange[1]} 23:59:59`,
      };
    }
    
    if (searchTerm) {
      q.$or = [
        { ajiltniiNer: { $regex: searchTerm, $options: "i" } },
        { ip: { $regex: searchTerm, $options: "i" } },
        { browser: { $regex: searchTerm, $options: "i" } },
        { uildliinSystem: { $regex: searchTerm, $options: "i" } },
        { bairshilKhot: { $regex: searchTerm, $options: "i" } },
        { bairshilUls: { $regex: searchTerm, $options: "i" } },
      ];
    }
    
    return q;
  }, [baiguullaga?._id, dateRange, searchTerm]);

  // Fetch login history
  const { data, isLoading, mutate } = useSWR(
    token && baiguullaga?._id
      ? [
          "/nevtreltiinTuukh",
          token,
          baiguullaga._id,
          JSON.stringify(query),
          page,
          pageSize,
        ]
      : null,
    async ([url, tkn, orgId, queryStr, pg, pgSize]) => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          khuudasniiDugaar: pg,
          khuudasniiKhemjee: 10000, // Fetch all for client-side filtering
          query: queryStr,
          order: JSON.stringify({ ognoo: -1 }), // Newest first
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const allRecords: LoginRecord[] = useMemo(
    () => (Array.isArray(data?.jagsaalt) ? data.jagsaalt : []),
    [data]
  );

  // Client-side filtering and pagination
  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ajiltniiNer?.toLowerCase().includes(term) ||
          r.ip?.toLowerCase().includes(term) ||
          r.browser?.toLowerCase().includes(term) ||
          r.uildliinSystem?.toLowerCase().includes(term) ||
          r.bairshilKhot?.toLowerCase().includes(term) ||
          r.bairshilUls?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [allRecords, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, page, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const totalRecords = filteredRecords.length;

  const handleDateChange = (
    dates: [string | null, string | null] | undefined
  ) => {
    setDateRange((dates || [null, null]) as [string | null, string | null]);
    setPage(1); // Reset to first page
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

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-[color:var(--panel-text)]">
              {t("Нэвтрэлтийн түүх")}
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Хайх (Ажилтны нэр, IP, Хөтөч, Төхөөрөмж, Байршил)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[color:var(--surface-bg)] border border-[color:var(--surface-border)] !rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)]"
                style={{ borderRadius: '0.5rem' }}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[color:var(--muted-text)]" />
            <DatePickerInput
              type="range"
              value={dateRange}
              onChange={handleDateChange}
              className="text-[color:var(--panel-text)]"
              locale="mn"
              valueFormat="YYYY-MM-DD"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
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
                        Огноо
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Ажилтны нэр
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        IP хаяг
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Байршил
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)]">
                        Хөтөч
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[color:var(--panel-text)] !rounded-tr-lg">
                        Төхөөрөмж
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-[color:var(--muted-text)]"
                        >
                          Нэвтрэлтийн түүх олдсонгүй
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record, index) => {
                        const isLast = index === paginatedRecords.length - 1;
                        return (
                        <tr
                          key={record._id}
                          className={`border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition-colors ${isLast ? 'last:border-b-0' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)] text-center">
                            {(page - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                            {moment(record.ognoo).format("YYYY-MM-DD HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-[color:var(--muted-text)]" />
                              {record.ajiltniiNer || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)] font-mono">
                            {record.ip || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <MapPin className="w-4 h-4 text-[color:var(--muted-text)]" />
                                  <span className="underline underline-offset-2">
                                    {record.bairshilKhot || "-"}
                                    {record.bairshilUls && `, ${record.bairshilUls}`}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {record.bairshilKhot && (
                                    <div>Хот: {record.bairshilKhot}</div>
                                  )}
                                  {record.bairshilUls && (
                                    <div>Улс: {record.bairshilUls}</div>
                                  )}
                                  {record.ip && <div>IP: {record.ip}</div>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[color:var(--muted-text)]" />
                              {record.browser || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4 text-[color:var(--muted-text)]" />
                              {record.uildliinSystem || "-"}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[color:var(--surface-border)]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[color:var(--panel-text)]">
                  Нийт {totalRecords} бичлэг
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
          </>
        )}
      </div>
    </div>
  );
}
