"use client";

import React, { useState } from "react";
import { DatePickerInput } from "@mantine/dates";
import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/tailanApi";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

export default function ProfitLossPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const body: any = {
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: barilgiinId || undefined,
        ekhlekhOgnoo: dateRange?.[0] || undefined,
        duusakhOgnoo: dateRange?.[1] || undefined,
      };
      const resp = await tailanApi.postAshigAldagdal(token, body);
      setReport(resp.data || resp);
      openSuccessOverlay("Ашиг/Алдагдал тайлан буцаж ирлээ", 900);
    } catch (e) {
      console.error(e);
      openErrorOverlay("Ашиг/Алдагдал тайлан дуудагдах үед алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Нийт ашиг / Алдагдал</h1>
      <div className="mb-4 flex items-center gap-3">
        <DatePickerInput
          type="range"
          locale="mn"
          value={dateRange}
          onChange={setDateRange}
          valueFormat="YYYY-MM-DD"
          placeholder="Эхлэх - Дуусах"
          clearable
        />
        <button
          className="btn-minimal"
          onClick={fetchReport}
          disabled={loading}
        >
          {loading ? "Татаж байна..." : "Татах"}
        </button>
        <button
          className="btn-minimal"
          onClick={async () => {
            if (!token) return openErrorOverlay("Токен алга");
            try {
              const body = {
                report: "ashig-aldagdal",
                baiguullagiinId: ajiltan?.baiguullagiinId,
                barilgiinId,
                ekhlekhOgnoo: dateRange?.[0],
                duusakhOgnoo: dateRange?.[1],
                type: "csv",
              };
              const blobResp = await tailanApi.postExport(token, body);
              const blob = new Blob([blobResp.data], {
                type: "text/csv;charset=utf-8;",
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ashig_aldagdal_${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
              openErrorOverlay("CSV татаж авахад алдаа гарлаа");
            }
          }}
        >
          Export CSV
        </button>
      </div>

      <div className="neu-panel p-4 rounded-2xl">
        {loading ? (
          <div>Татаж байна...</div>
        ) : report ? (
          <div>
            <div className="text-theme">
              Нийт орлого: {report.totalIncome ?? "-"} ₮
            </div>
            <div className="text-theme">
              Нийт зарлага: {report.totalExpense ?? "-"} ₮
            </div>
            <div className="text-xl font-bold mt-2">
              Ашиг / Алдагдал: {report.profitLoss ?? "-"} ₮
            </div>
            <div className="mt-4">
              {Array.isArray(report.jagsaalt || report.rows || report.data) ? (
                <div className="overflow-auto">
                  <table className="table-ui text-xs min-w-full">
                    <thead>
                      <tr>
                        {Object.keys(
                          (report.jagsaalt || report.rows || report.data)[0] ||
                            {}
                        ).map((k) => (
                          <th
                            key={k}
                            className="p-2 text-left text-xs font-semibold"
                          >
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(report.jagsaalt || report.rows || report.data).map(
                        (r: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            {Object.keys(r).map((k) => (
                              <td key={k} className="p-2 text-xs">
                                {String(r[k] ?? "-")}
                              </td>
                            ))}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(report, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div>Мэдээлэл олдсонгүй</div>
        )}
      </div>
    </div>
  );
}
