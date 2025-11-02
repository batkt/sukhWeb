"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import PageSongokh from "components/selectZagvar/pageSongokh";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { DatePickerInput } from "@mantine/dates";
import { useBuilding } from "@/context/BuildingContext";

export default function TransactionsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);
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
  const [pageSize, setPageSize] = useState<number>(20);
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
        data?.totalCount ?? data?.niitMur ?? (data?.jagsaalt || []).length
      );
    } catch (e) {
      console.error(e);
      openErrorOverlay("Гүйлгээ татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    if (!token) return openErrorOverlay("Токен алга");
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
      openErrorOverlay("CSV экспорт алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Гүйлгээний түүх</h1>

      <ReportsControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        filters={filters}
        setFilters={setFilters}
      />

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      <div className="mb-4 flex items-center gap-3">
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
        <button className="btn-minimal" onClick={exportCsv}>
          Export CSV
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

      <div className="table-surface rounded-2xl overflow-hidden">
        <div className="rounded-3xl p-6 neu-table">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="table-ui text-xs min-w-full">
              <thead>
                <tr>
                  <th className="p-2 text-center w-12">#</th>
                  <th className="p-2 text-center">Огноо</th>
                  <th className="p-2 text-center">Төрөл</th>
                  <th className="p-2 text-center">Дүн</th>
                  <th className="p-2 text-center">Данс/Банк</th>
                  <th className="p-2 text-center">Тайлбар / Нэх.</th>
                  <th className="p-2 text-center">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-subtle">
                      Мэдээлэл олдсонгүй
                    </td>
                  </tr>
                ) : (
                  rows.map((r: any, idx: number) => (
                    <tr key={r._id || idx} className="border-b last:border-b-0">
                      <td className="p-2 text-center">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="p-2 text-center">
                        {r.ognoo || r.date || "-"}
                      </td>
                      <td className="p-2 text-center">{r.type || "-"}</td>
                      <td className="p-2 text-center">
                        {r.amount
                          ? Number(r.amount).toLocaleString() + " ₮"
                          : "-"}
                      </td>
                      <td className="p-2 text-center">
                        {r.bank || r.account || "-"}
                      </td>
                      <td className="p-2 text-center">
                        {r.note || r.invoiceId || "-"}
                      </td>
                      <td className="p-2 text-center">{r.status || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>Нийт: {total}</div>
        <div className="flex items-center gap-2">
          <button
            className="btn-minimal"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Өмнөх
          </button>
          <div>Хуудас {page}</div>
          <button
            className="btn-minimal"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Дараах
          </button>
        </div>
      </div>
    </div>
  );
}
