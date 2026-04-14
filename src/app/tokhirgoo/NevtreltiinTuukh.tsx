"use client";

import React, { useMemo, useState } from "react";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { Clock, User, Globe, Monitor, MapPin } from "lucide-react";
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
  const [pageSize, setPageSize] = useState(10);
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
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="bg-[color:var(--surface-bg)] rounded-2xl border border-[color:var(--surface-border)] shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[color:var(--surface-border)]">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl text-[color:var(--panel-text)]">
              {t("Нэвтрэлтийн түүх")}
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div
            id="nevtrel-date"
            className="btn-minimal h-[40px] w-full sm:w-[320px] flex items-center px-3"
          >
            <StandardDatePicker
              isRange={true}
              value={dateRange}
              onChange={handleDateChange}
              allowClear
              placeholder="Огноо сонгох"
              classNames={{
                root: "!h-full !w-full",
                input:
                  "text-theme placeholder:text-theme h-full w-full !px-0 !bg-transparent !border-0 shadow-none flex items-center justify-center text-center",
              }}
            />
          </div>

          <div className="border border-[color:var(--surface-border)] rounded-2xl bg-[color:var(--surface-bg)] h-[40px] w-full sm:w-[220px] flex items-center px-3 gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Хайх..."
              className="w-full text-[color:var(--panel-text)] placeholder:text-[color:var(--muted-text)] text-sm"
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
                  align: "center",
                  render: (value: any) => (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
                {
                  key: "ip",
                  label: "IP хаяг",
                  align: "center",
                  render: (value: any) => (
                    <span className="font-mono">{value || "-"}</span>
                  ),
                },
                {
                  key: "bairshilKhot",
                  label: "Байршил",
                  align: "center",
                  render: (value: any, record: any) => (
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4 text-[color:var(--muted-text)]" />
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
                  align: "center",
                  render: (value: any) => (
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
                {
                  key: "uildliinSystem",
                  label: "Төхөөрөмж",
                  align: "center",
                  render: (value: any) => (
                    <div className="flex items-end gap-2">
                      <Monitor className="w-4 h-4 text-[color:var(--muted-text)]" />
                      {value || "-"}
                    </div>
                  ),
                },
              ]}
              rowKey="_id"
              loading={isLoading}
              emptyMessage="Нэвтрэлтийн түүх олдсонгүй"
              className="rounded-2xl guilgee-table border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] overflow-hidden"
              maxHeight={pageSize * 60}
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
