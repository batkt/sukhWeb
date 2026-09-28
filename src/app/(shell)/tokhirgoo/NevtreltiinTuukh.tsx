"use client";

import React, { useMemo, useState } from "react";
import FilterDatePicker from "@/components/ui/FilterDatePicker";
import { Clock, User, Globe, Monitor, MapPin, Search } from "lucide-react";
import moment from "moment";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import { Loader } from "@mantine/core";
import {
  StandardTable,
  StandardPagination,
} from "@/components/ui/StandardTable";

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
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().endOf("month").format("YYYY-MM-DD"),
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch login history — page/pageSize NOT in key (client-side pagination)
  const { data, isLoading } = useSWR(
    token && baiguullaga?._id
      ? [
          "/nevtreltiinTuukh",
          token,
          baiguullaga._id,
          dateRange?.[0] || null,
          dateRange?.[1] || null,
          searchTerm,
        ]
      : null,
    async ([url, tkn, orgId, startDate, endDate, search]) => {
      const params: any = {
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 10000,
        order: JSON.stringify({ ognoo: -1 }),
      };

      if (startDate && endDate) {
        params.ekhlekhOgnoo = `${startDate} 00:00:00`;
        params.duusakhOgnoo = `${endDate} 23:59:59`;
      }

      const resp = await uilchilgee(tkn).get(url, { params });
      return resp.data;
    },
    { revalidateOnFocus: false },
  );

  const allRecords: LoginRecord[] = useMemo(
    () =>
      Array.isArray(data?.jagsaalt)
        ? data.jagsaalt
        : Array.isArray(data?.data)
          ? data.data
          : [],
    [data],
  );

  // Client-side search filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return allRecords;
    const term = searchTerm.toLowerCase();
    return allRecords.filter(
      (r) =>
        r.ajiltniiNer?.toLowerCase().includes(term) ||
        r.ip?.toLowerCase().includes(term) ||
        r.browser?.toLowerCase().includes(term) ||
        r.uildliinSystem?.toLowerCase().includes(term) ||
        r.bairshilKhot?.toLowerCase().includes(term) ||
        r.bairshilUls?.toLowerCase().includes(term),
    );
  }, [allRecords, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const totalRecords = filteredRecords.length;

  const handleDateChange = (
    dates: any,
    dateStrings?: [string, string] | string[],
  ) => {
    const ds = dateStrings as [string, string] | undefined;
    if (Array.isArray(ds) && ds[0] && ds[1]) {
      setDateRange([ds[0], ds[1]]);
    } else if (dates?.[0] && dates?.[1]) {
      setDateRange([
        dayjs(dates[0]).format("YYYY-MM-DD"),
        dayjs(dates[1]).format("YYYY-MM-DD"),
      ]);
    } else {
      setDateRange([null, null]);
    }
    setPage(1);
  };

  return (
    <div>
      <div className="stg-card space-y-4">
        {/* Шүүлтүүр — гарчгийг бүрхүүл зурна */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterDatePicker
            id="nevtrel-date"
            value={dateRange}
            onChange={handleDateChange}
            className="w-full sm:w-[284px]"
          />

          <label className={`filter-field w-full sm:w-[280px] ${searchTerm ? "is-active" : ""}`}>
            <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Ажилтан, IP, байршлаар хайх"
            />
          </label>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size="md" />
          </div>
        ) : (
          <>
            <StandardTable
              data={paginatedRecords}
              columns={[
                {
                  key: "index",
                  label: "#",
                  width: 60,
                  align: "center",
                  render: (_: any, __: any, index: number) =>
                    (page - 1) * pageSize + index + 1,
                },
                {
                  key: "ognoo",
                  label: "Огноо",
                  align: "center",
                  render: (value: any) =>
                    value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : "-",
                },
                {
                  key: "ajiltniiNer",
                  label: "Ажилтны нэр",
                  align: "left",
                  render: (value: any) => (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
                {
                  key: "ip",
                  label: "IP хаяг",
                  align: "left",
                  render: (value: any) => (
                    <span className="tabular-nums">{value || "-"}</span>
                  ),
                },
                {
                  key: "bairshilKhot",
                  label: "Байршил",
                  align: "left",
                  render: (value: any, record: any) => (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
                      <span>
                        {value || "-"}
                        {record.bairshilUls && `, ${record.bairshilUls}`}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "browser",
                  label: "Хөтөч",
                  align: "left",
                  render: (value: any) => (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
                {
                  key: "uildliinSystem",
                  label: "Төхөөрөмж",
                  align: "left",
                  render: (value: any) => (
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 shrink-0 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
              ]}
              rowKey="_id"
              loading={isLoading}
              emptyMessage="Нэвтрэлтийн түүх олдсонгүй"
            />

            <div className="pt-2 border-t border-[color:var(--surface-border)]">
              <StandardPagination
                current={page}
                total={totalRecords}
                pageSize={pageSize}
                onChange={(p, size) => {
                  setPage(p);
                  if (size) setPageSize(size);
                }}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                pageSizeOptions={[10, 20, 50, 100, 500]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
