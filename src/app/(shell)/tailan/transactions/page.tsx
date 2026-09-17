"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import PageSongokh from "components/selectZagvar/pageSongokh";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { getErrorMessage } from "@/lib/uilchilgee";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { useBuilding } from "@/context/BuildingContext";
import IconTextButton from "@/components/ui/IconTextButton";
import { getDefaultDateRange } from "@/lib/utils";
import { Download, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import formatNumber from "../../../../../tools/function/formatNumber";
import Table from "@/components/ui/table";
import type { ColumnsType } from "@/components/ui/table";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page {
        size: A4 landscape;
        margin: 1cm;
      }
      body * {
        visibility: hidden !important;
      }
      .print-container,
      .print-container * {
        visibility: visible !important;
      }
      .print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      th,
      td {
        border: 1px solid #ddd !important;
        padding: 4px !important;
        font-size: 8pt !important;
      }
      .max-h-[60vh] {
        max-height: none !important;
        overflow: visible !important;
      }
      .custom-scrollbar {
        overflow: visible !important;
      }
    }
  `}</style>
);

export default function TransactionsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(getDefaultDateRange);
  const [filters, setFilters] = useState<any>({});

  const [type, setType] = useState<string>(""); // income / expense
  const [status, setStatus] = useState<string>(""); // approved / pending
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [bank, setBank] = useState<string>("");

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(500);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize]);

  const buildBody = () => ({
    baiguullagiinId: ajiltan?.baiguullagiinId,
    barilgiinId: selectedBuildingId || barilgiinId || null,
    ekhlekhOgnoo: dateRange?.[0] || undefined,
    duusakhOgnoo: dateRange?.[1] || undefined,
    type: type || undefined,
    status: status || undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    note: note || undefined,
    bank: bank || undefined,
    page,
    pageSize,
    ...filters,
  });

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const body = buildBody();
      const resp = await tailanApi.postGuilegee(token, body);
      const data = resp?.data ?? resp;
      setRows(data?.jagsaalt || data?.rows || data || []);
      setTotal(
        data?.totalCount ?? data?.niitMur ?? (data?.jagsaalt || []).length,
      );
    } catch (e) {
      console.error(e);
      openErrorOverlay(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    if (!token)
      return openErrorOverlay(getErrorMessage(new Error("Токен алга")));
    try {
      const body = { ...buildBody(), report: "guilegee", type: "csv" };
      const blobResp = await tailanApi.postExport(token, body);
      const blob = new Blob([blobResp.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guilgeenuud_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      openErrorOverlay(getErrorMessage(e));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const transactionColumns: ColumnsType<any> = React.useMemo(
    () => [
      {
        title: "#",
        key: "index",
        width: 40,
        align: "center",
        render: (_: any, __: any, i: number) => (page - 1) * pageSize + i + 1,
      },
      {
        title: "Огноо",
        key: "ognoo",
        align: "center",
        render: (_: any, r: any) => r.ognoo || r.date || "-",
      },
      {
        title: "Төрөл",
        dataIndex: "type",
        key: "type",
        align: "center",
        render: (v: any) => v || "-",
      },
      {
        title: "Дүн",
        key: "amount",
        align: "right",
        render: (_: any, r: any) =>
          r.amount ? formatNumber(Number(r.amount)) : "-",
      },
      {
        title: "Данс/Банк",
        key: "bank",
        align: "center",
        render: (_: any, r: any) => r.bank || r.account || "-",
      },
      {
        title: "Тайлбар / Нэх.",
        key: "note",
        render: (_: any, r: any) => r.note || r.invoiceId || "-",
      },
      {
        title: "Төлөв",
        dataIndex: "status",
        key: "status",
        align: "center",
        render: (v: any) => v || "-",
      },
    ],
    [page, pageSize],
  );

  return (
    <div className="min-h-screen p-6 print-container h-full flex flex-col">
      <PrintStyles />
      <div className="flex justify-between items-center mb-3 no-print">
        <h1 className="text-2xl font-bold">Гүйлгээний түүх</h1>
        <div className="flex gap-3">
          <IconTextButton
            onClick={exportCsv}
            icon={<Download className="w-4 h-4 text-emerald-600" />}
            label="CSV татах"
            className="neu-panel px-4 py-2 rounded-xl text-sm"
          />
          {/* <button
            onClick={handlePrint}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Хэвлэх
          </button> */}
        </div>
      </div>

      <div className="no-print">
        <ReportsControls
          dateRange={dateRange}
          setDateRange={setDateRange}
          filters={filters}
          setFilters={setFilters}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <TusgaiZagvar
          value={type}
          onChange={setType}
          options={[
            { value: "", label: "Бүгд" },
            { value: "income", label: "Орлого" },
            { value: "expense", label: "Зарлага" },
          ]}
        />
        <TusgaiZagvar
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "Бүгд" },
            { value: "approved", label: "Батлагдсан" },
            { value: "pending", label: "Хүлээгдэж буй" },
          ]}
        />
        <div className="flex gap-2">
          <input
            placeholder="Мин дүн"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="rounded-2xl border px-3 py-2 w-full"
          />
          <input
            placeholder="Макс дүн"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="rounded-2xl border px-3 py-2 w-full"
          />
        </div>
        <input
          placeholder="Тайлбар / Нэх. дугаар"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-2xl border px-3 py-2 col-span-1 sm:col-span-2"
        />
        <input
          placeholder="Банк / Данс"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="rounded-2xl border px-3 py-2"
        />
      </div>

      <div className="mb-4 flex items-center gap-3 no-print">
        <button
          className="btn-minimal"
          onClick={() => {
            setPage(1);
            fetchTransactions();
          }}
          disabled={loading}
        >
          {loading ? "Татаж байна..." : "Хайх"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <PageSongokh
            value={pageSize}
            onChange={(v: number) => {
              setPageSize(v);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Table<any>
        columns={transactionColumns}
        dataSource={rows}
        rowKey={(r, idx) => r._id || idx}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Мэдээлэл олдсонгүй" }}
      />

      <div className="flex items-center justify-between mt-4 no-print">
        <div>Нийт: {total}</div>
        <div className="flex items-center gap-2">
          <IconTextButton
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            icon={<ChevronLeft className="w-4 h-4" />}
            label="Өмнөх"
          />
          <div>Хуудас {page}</div>
          <IconTextButton
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
            icon={<ChevronRight className="w-4 h-4" />}
            label="Дараах"
          />
        </div>
      </div>
    </div>
  );
}
