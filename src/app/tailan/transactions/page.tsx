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
import * as tailanApi from "../../../lib/tailanApi";

export default function TransactionsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({
    // mantine DatePickerInput range -> [from, to]
    dateRange: undefined as [string | null, string | null] | undefined,
    type: "",
    resident: "",
    zardal: "",
    minAmount: "",
    maxAmount: "",
    bank: "",
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
      // normalize filter keys expected by API
      if (params.resident) {
        params.orshinSuugchId = params.resident;
        delete params.resident;
      }
      if (params.zardal) {
        params.ashiglaltiinZardalId = params.zardal;
        params.zardalId = params.zardal; // some endpoints might expect this
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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Гүйлгээний түүх</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <DatePickerInput
          type="range"
          locale="mn"
          value={filters.dateRange}
          onChange={(v) => setFilters((f: any) => ({ ...f, dateRange: v }))}
          valueFormat="YYYY-MM-DD"
          placeholder="Огноо сонгох"
          className="w-full"
          clearable
        />
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, type: e.target.value }))
          }
          className="p-2 border rounded"
        >
          <option value="">Бүгд</option>
          <option value="income">Орлого</option>
          <option value="expense">Зарлага</option>
        </select>
        <TusgaiZagvar
          value={filters.resident || ""}
          onChange={(v: string) =>
            setFilters((f: any) => ({ ...f, resident: v }))
          }
          options={residents.map((r: any) => ({
            value: String(r._id),
            label: `${r.ovog || ""} ${r.ner || ""}`,
          }))}
          placeholder="Оршин суугч"
          className="h-[40px]"
          tone="theme"
        />
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
      </div>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Мин дүн"
          value={filters.minAmount}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, minAmount: e.target.value }))
          }
          className="p-2 border rounded"
        />
        <input
          placeholder="Макс дүн"
          value={filters.maxAmount}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, maxAmount: e.target.value }))
          }
          className="p-2 border rounded"
        />
        <input
          placeholder="Банк / Дансны дугаар"
          value={filters.bank}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, bank: e.target.value }))
          }
          className="p-2 border rounded"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f: any) => ({ ...f, status: e.target.value }))
          }
          className="p-2 border rounded"
        >
          <option value="">Бүгд</option>
          <option value="pending">Хүлээгдэж буй</option>
          <option value="approved">Батлагдсан</option>
        </select>
        <button className="btn-minimal" onClick={load}>
          Хайх
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
              const resp = await tailanApi.postAvlaga(token, body);
              openSuccessOverlay("Авлага тайлан буцаж ирлээ", 900);
              console.log("avlaga", resp.data || resp);
            } catch (e) {
              console.error(e);
              openErrorOverlay("Авлага тайлан дуудагдах үед алдаа гарлаа");
            }
          }}
        >
          Авлага
        </button>
      </div>

      <div className="neu-panel p-3 rounded-2xl">
        {loading ? (
          <div>Татаж байна...</div>
        ) : (
          <div className="overflow-auto">
            <table className="table-ui text-xs min-w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Огноо</th>
                  <th>Төрөл</th>
                  <th>Дүн</th>
                  <th>Тайлбар / Нэхэмжлэл</th>
                  <th>Банк / Данс</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center">
                      Мэдээлэл алга
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{r.date || r.createdAt || "-"}</td>
                      <td className="p-2">{r.type || "-"}</td>
                      <td className="p-2">{r.amount ?? "-"}</td>
                      <td className="p-2">{r.note || r.invoice || "-"}</td>
                      <td className="p-2">{r.bank || r.account || "-"}</td>
                      <td className="p-2">{r.status || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
