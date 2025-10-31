"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import uilchilgee from "lib/uilchilgee";
import { DatePickerInput } from "@mantine/dates";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import { useOrshinSuugchJagsaalt } from "@/lib/useOrshinSuugch";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";

export default function DebtReportPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const [bair, setBair] = useState("");
  const [orts, setOrts] = useState("");
  const [davkhar, setDavkhar] = useState("");
  const [toot, setToot] = useState<string | number>("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);
  const { orshinSuugchGaralt } = useOrshinSuugchJagsaalt(
    undefined as any,
    undefined as any,
    {}
  );
  const { zardluud } = useAshiglaltiinZardluud();
  // small convenience: resident options
  const residents = orshinSuugchGaralt?.jagsaalt || [];
  const [stats, setStats] = useState<any[]>([]);

  const search = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        bair,
        orts,
        davkhar,
        toot,
        limit: rowsPerPage,
      };
      if (dateRange && Array.isArray(dateRange)) {
        params.from = dateRange[0] || undefined;
        params.to = dateRange[1] || undefined;
      }
      const resp = await uilchilgee(token).get("/tailan/debt", { params });
      setData(resp.data?.results || resp.data || []);
      openSuccessOverlay("Өгөгдөл ачааллаа", 900);
    } catch (err) {
      console.error("debt search", err);
      setData([]);
      openErrorOverlay("Өр тайлан татахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
    // derive small dashboard stats
    try {
      const list = (data || []) as any[];
      const total = list.reduce(
        (s, it) => s + (Number(it?.balance ?? it?.debt ?? 0) || 0),
        0
      );
      const paidCount = list.filter(
        (r) => Number(r?.balance ?? r?.debt ?? 0) <= 0
      ).length;
      const unpaidCount = list.length - paidCount;
      const max = list.reduce(
        (m, it) => Math.max(m, Number(it?.balance ?? it?.debt ?? 0) || 0),
        0
      );
      setStats([
        { title: "Төлсөн", value: paidCount },
        { title: "Төлөөгүй", value: unpaidCount },
        { title: "Нийт өр", value: `${total.toLocaleString("mn-MN")} ₮` },
        { title: "Хамгийн их өр", value: `${max.toLocaleString("mn-MN")} ₮` },
      ]);
    } catch (e) {
      setStats([]);
    }
  };

  const exportExcel = async () => {
    if (!token) return;
    try {
      const resp = await uilchilgee(token).get("/tailan/debt/export", {
        params: {
          bair,
          orts,
          davkhar,
          toot,
          baiguullagiinId: ajiltan?.baiguullagiinId,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `debt_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Өр, авлагын тайлан</h1>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="neu-panel p-4 rounded-2xl">
              <div className="text-2xl font-bold">
                {typeof s.value === "number"
                  ? s.value.toLocaleString("mn-MN")
                  : s.value}
              </div>
              <div className="text-xs text-theme/70">{s.title}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <DatePickerInput
              type="range"
              locale="mn"
              value={dateRange}
              onChange={setDateRange}
              valueFormat="YYYY-MM-DD"
              placeholder="Огноо сонгох"
              clearable
            />
            <input
              value={bair}
              onChange={(e) => setBair(e.target.value)}
              placeholder="Байрны нэр"
              className="p-2 border rounded"
            />
            <input
              value={orts}
              onChange={(e) => setOrts(e.target.value)}
              placeholder="Орц"
              className="p-2 border rounded"
            />
            <input
              value={davkhar}
              onChange={(e) => setDavkhar(e.target.value)}
              placeholder="Давхар"
              className="p-2 border rounded"
            />
            <input
              value={String(toot)}
              onChange={(e) => setToot(Number(e.target.value) || "")}
              placeholder="Тоот"
              className="p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <button className="btn-minimal" onClick={search} disabled={loading}>
              {loading ? "Татаж байна..." : "Хайх"}
            </button>
            <button className="btn-minimal" onClick={exportExcel}>
              Excel татах
            </button>
          </div>

          <div className="table-surface rounded-2xl p-4">
            <div className="overflow-auto">
              <table className="table-ui text-xs min-w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Байр</th>
                    <th>Орц</th>
                    <th>Давхар</th>
                    <th>Тоот</th>
                    <th>Нэр</th>
                    <th>Гэрээ</th>
                    <th>Нэхэмжлэхийн төлөв</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center">
                        Мэдээлэл алга
                      </td>
                    </tr>
                  ) : (
                    data.map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 text-center">{i + 1}</td>
                        <td className="p-2">
                          {row.bair || row.bairniiNer || "-"}
                        </td>
                        <td className="p-2">{row.orts || "-"}</td>
                        <td className="p-2">{row.davkhar || "-"}</td>
                        <td className="p-2">{row.toot ?? "-"}</td>
                        <td className="p-2">{row.ner || "-"}</td>
                        <td className="p-2">{row.gereeniiDugaar || "-"}</td>
                        <td className="p-2">
                          {row.invoiceStatus || row.tuluv || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
