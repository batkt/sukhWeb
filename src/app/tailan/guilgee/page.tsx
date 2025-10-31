"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "lib/uilchilgee";
import { DatePickerInput } from "@mantine/dates";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import useJagsaalt from "@/lib/useJagsaalt";
import { DANS_ENDPOINT } from "@/lib/endpoints";
import * as tailanApi from "../../../lib/tailanApi";

export default function TransactionsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({
    dateRange: undefined as [string | null, string | null] | undefined,
    type: "",
    resident: "",
    zardal: "",
    minAmount: "",
    maxAmount: "",
    dansId: "",
    status: "",
  });

  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    undefined as any,
    undefined as any,
    {}
  );
  const { zardluud } = useAshiglaltiinZardluud();
  const residents = orshinSuugchGaralt?.jagsaalt || [];
  const zardalOptions = (zardluud || []).map((z: any) => ({
    value: String(z._id),
    label: z.ner || String(z._id),
  }));

  const { jagsaalt: allDans } = useJagsaalt(
    DANS_ENDPOINT,
    { baiguullagiinId: ajiltan?.baiguullagiinId || undefined, barilgiinId },
    { createdAt: -1 }
  );

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {
        ...filters,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId,
      };
      if (filters.dateRange && Array.isArray(filters.dateRange)) {
        params.from = filters.dateRange[0] || undefined;
        params.to = filters.dateRange[1] || undefined;
        delete params.dateRange;
      }
      if (params.resident) {
        params.orshinSuugchId = params.resident;
        delete params.resident;
      }
      if (params.zardal) {
        params.ashiglaltiinZardalId = params.zardal;
        params.zardalId = params.zardal;
        delete params.zardal;
      }
      const resp = await uilchilgee(token).get("/tailan/transactions", {
        params,
      });
      setRows(resp.data?.results || resp.data || []);
      openSuccessOverlay("Мэдээлэл ачааллаа", 900);
    } catch (err) {
      console.error(err);
      setRows([]);
      openErrorOverlay("Гүйлгээ татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateRange: undefined,
      type: "",
      resident: "",
      zardal: "",
      minAmount: "",
      maxAmount: "",
      dansId: "",
      status: "",
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.dateRange ||
      filters.type ||
      filters.resident ||
      filters.zardal ||
      filters.minAmount ||
      filters.maxAmount ||
      filters.dansId ||
      filters.status
    );
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const getTypeLabel = (type: string) => {
    if (type === "income") return "Орлого";
    if (type === "expense") return "Зарлага";
    return type || "-";
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
          Батлагдсан
        </span>
      );
    if (status === "pending")
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
          Хүлээгдэж буй
        </span>
      );
    return <span className="text-gray-400">{status || "-"}</span>;
  };

  const formatAmount = (amount: number, type: string) => {
    if (!amount && amount !== 0) return "-";
    const formatted = new Intl.NumberFormat("mn-MN").format(amount);
    const color = type === "income" ? "text-green-600" : "text-red-600";
    const sign = type === "income" ? "+" : "-";
    return (
      <span className={`font-medium ${color}`}>
        {sign}
        {formatted}₮
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header with filters inline */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Гүйлгээний түүх
          </h1>
          <p className="text-sm text-gray-500">{rows.length} гүйлгээ олдлоо</p>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters() && (
            <button className="btn-minimal text-sm" onClick={clearFilters}>
              Цэвэрлэх
            </button>
          )}
          <button className="btn-minimal" onClick={load} disabled={loading}>
            {loading ? "Ачааллаж байна..." : "Шинэчлэх"}
          </button>
          <button
            className="btn-minimal"
            onClick={async () => {
              if (!token) return openErrorOverlay("Токен алга");
              try {
                const body = {
                  baiguullagiinId: ajiltan?.baiguullagiinId,
                  barilgiinId: barilgiinId || undefined,
                  ekhlekhOgnoo: filters.dateRange?.[0] || undefined,
                  duusakhOgnoo: filters.dateRange?.[1] || undefined,
                  bairNer: filters.bair || undefined,
                  orts: filters.orts || undefined,
                  davkhar: filters.davkhar || undefined,
                  toot: filters.toot || undefined,
                };
                const resp = await tailanApi.postSummary(token, body);
                openSuccessOverlay("Тайлан буцаж ирлээ", 900);
                console.log("summary", resp.data || resp);
              } catch (e) {
                console.error(e);
                openErrorOverlay("Тайлан дуудагдах үед алдаа гарлаа");
              }
            }}
          >
            ТАЙЛАН
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <DatePickerInput
          type="range"
          locale="mn"
          value={filters.dateRange}
          onChange={(v) => setFilters((f: any) => ({ ...f, dateRange: v }))}
          valueFormat="YYYY-MM-DD"
          placeholder="Эхлэх - Дуусах"
          className="w-full"
          clearable
        />

        <TusgaiZagvar
          value={filters.type}
          onChange={(v: string) => setFilters((f: any) => ({ ...f, type: v }))}
          className="h-[40px]"
          tone="theme"
        >
          <option value="">Бүгд</option>
          <option value="income">Орлого</option>
          <option value="expense">Зарлага</option>
        </TusgaiZagvar>

        <TusgaiZagvar
          value={filters.zardal || ""}
          onChange={(v: string) =>
            setFilters((f: any) => ({ ...f, zardal: v }))
          }
          options={zardalOptions}
          placeholder="Зардлын төрөл"
          className="h-[40px]"
          tone="theme"
        />

        <TusgaiZagvar
          value={filters.status}
          onChange={(v: string) =>
            setFilters((f: any) => ({ ...f, status: v }))
          }
          className="h-[40px]"
          tone="theme"
        >
          <option value="">Төлөв</option>
          <option value="pending">Хүлээгдэж буй</option>
          <option value="approved">Батлагдсан</option>
        </TusgaiZagvar>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Доод дүн"
          value={filters.minAmount}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, minAmount: e.target.value }))
          }
          className="flex-1 p-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="Дээд дүн"
          value={filters.maxAmount}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, maxAmount: e.target.value }))
          }
          className="flex-1 p-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <TusgaiZagvar
          value={filters.dansId || ""}
          onChange={(v: string) =>
            setFilters((f: any) => ({ ...f, dansId: v }))
          }
          options={(allDans || []).map((d: any) => ({
            value: String(d._id),
            label: `${d.dugaar || ""} ${d.dansniiNer || ""}`,
          }))}
          placeholder="Данс сонгох"
          className="flex-1 h-[40px]"
          tone="theme"
        />
      </div>

      {/* Table */}
      <div className="neu-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="mt-4 text-gray-600">Татаж байна...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Гүйлгээ олдсонгүй
            </h3>
            <p className="text-gray-500">
              Шүүлтүүрийг өөрчилж дахин оролдоно уу
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    №
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Огноо
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Төрөл
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Дүн
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Тайлбар
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Данс
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Төлөв
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {r.date || r.createdAt || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.type === "income"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {getTypeLabel(r.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {formatAmount(r.amount, r.type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {r.note || r.invoice || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.bank || r.account || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(r.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
