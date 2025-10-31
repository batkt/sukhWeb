"use client";

import React, { useState, useMemo } from "react";

import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/tailanApi";
import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import { useBuilding } from "@/context/BuildingContext";
import { useSpinner } from "@/context/SpinnerContext";
import formatNumber from "../../../../tools/function/formatNumber";

export default function PerformanceReportsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);
  const [filters, setFilters] = useState<any>({});
  const [reportType, setReportType] = useState<string>("sariin");
  const [report, setReport] = useState<any>(null);

  const fetchPerformance = async () => {
    if (!token) {
      alert("Та нэвтрээгүй байна. Эхлээд нэвтэрнэ үү.");
      return;
    }

    if (!ajiltan?.baiguullagiinId) {
      alert("Байгууллагын мэдээлэл олдсонгүй.");
      return;
    }

    if (!selectedBuildingId && !barilgiinId) {
      alert(
        "Барилга сонгоогүй байна. Дээд талд байрлах барилгын сонголтоос барилга сонгоно уу."
      );
      return;
    }

    showSpinner();
    try {
      const body: any = {
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || null,
        ekhlekhOgnoo: dateRange?.[0] || undefined,
        duusakhOgnoo: dateRange?.[1] || undefined,
        ...filters,
      };

      console.log("API call query params:", body);

      let resp: any;
      switch (reportType) {
        case "sariin":
          resp = await tailanApi.postSariin(token, body);
          break;
        case "uliral":
          resp = await tailanApi.postUliral(token, body);
          break;
        default:
          resp = await tailanApi.postSummary(token, body);
      }

      setReport(resp?.data ?? resp);
      openSuccessOverlay("Гүйцэтгэлийн тайлан ирлээ", 900);
    } catch (e: any) {
      console.error(e);
      console.error("Error details:", e?.response?.data || e?.message || e);
      openErrorOverlay("Гүйцэтгэлийн тайлан дуудахад алдаа гарлаа");
    } finally {
      hideSpinner();
    }
  };

  const exportReport = async (type: "csv" | "xlsx" = "csv") => {
    if (!token) return openErrorOverlay("Токен алга");
    try {
      const body = {
        report: reportType,
        baiguullagiinId: ajiltan?.baiguullagiinId,
        barilgiinId: selectedBuildingId || barilgiinId || null,
        ekhlekhOgnoo: dateRange?.[0] || undefined,
        duusakhOgnoo: dateRange?.[1] || undefined,
        type: type === "csv" ? "csv" : "xlsx",
        ...filters,
      };
      const blobResp = await tailanApi.postExport(token, body);
      const mime =
        type === "csv" ? "text/csv;charset=utf-8;" : "application/octet-stream";
      const ext = type === "csv" ? "csv" : "xlsx";
      const blob = new Blob([blobResp.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tailan_${reportType}_${new Date()
        .toISOString()
        .slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("exportReport error", e);
      openErrorOverlay("Файлыг татаж авахад алдаа гарлаа");
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Гүйцэтгэлийн тайлан</h1>

      <ReportsControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        filters={filters}
        setFilters={setFilters}
      />

      <div className="mb-4 flex items-center gap-3">
        <TusgaiZagvar
          className="rounded-2xl border px-3 py-2"
          value={reportType}
          onChange={(v: string) => setReportType(v)}
        >
          <option value="sariin">Сарын тайлан</option>
          <option value="uliral">Улиралын тайлан</option>
          <option value="summary">Товч тойм</option>
        </TusgaiZagvar>

        <button className="btn-minimal" onClick={fetchPerformance}>
          Татах
        </button>

        <button className="btn-minimal" onClick={() => exportReport("csv")}>
          Export CSV
        </button>

        <button className="btn-minimal" onClick={() => exportReport("xlsx")}>
          Export Excel
        </button>
      </div>

      <div className="neu-panel p-4 rounded-2xl">
        {report ? (
          <div>
            {/* Flexible table renderer: array of rows, or summary object */}
            {(() => {
              // Normalize to rows array when possible
              const rows = Array.isArray(report)
                ? report
                : Array.isArray(report?.jagsaalt)
                ? report.jagsaalt
                : Array.isArray(report?.rows)
                ? report.rows
                : null;

              if (rows && rows.length > 0) {
                const cols = Object.keys(rows[0]);
                return (
                  <div className="table-surface overflow-visible rounded-2xl w-full">
                    <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow relative">
                      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar w-full">
                        <table className="table-ui text-xs min-w-full">
                          <thead>
                            <tr>
                              <th className="p-2 text-center w-12">#</th>
                              {cols.map((c) => (
                                <th key={c} className="p-2 text-center">
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r: any, i: number) => (
                              <tr
                                key={r._id ?? i}
                                className="border-b last:border-b-0"
                              >
                                <td className="p-2 text-center">{i + 1}</td>
                                {cols.map((c) => (
                                  <td key={c} className="p-2 text-center">
                                    {typeof r[c] === "object"
                                      ? JSON.stringify(r[c])
                                      : r[c] === null || r[c] === undefined
                                      ? "-"
                                      : typeof r[c] === "number" &&
                                        c.toLowerCase().includes("dun")
                                      ? formatNumber(r[c]) + " ₮"
                                      : String(r[c])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              }

              const summary = report?.summary ?? report;
              if (summary && typeof summary === "object") {
                const entries = Object.entries(summary);
                return (
                  <div className="table-surface overflow-visible rounded-2xl w-full">
                    <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow relative">
                      <table className="table-ui text-sm min-w-full">
                        <thead>
                          <tr>
                            <th className="p-2 text-left">Тайлбар</th>
                            <th className="p-2 text-right">Утга</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([k, v]) => (
                            <tr key={k} className="border-b last:border-b-0">
                              <td className="p-2">{k}</td>
                              <td className="p-2 text-right">
                                {typeof v === "object"
                                  ? JSON.stringify(v)
                                  : typeof v === "number" &&
                                    k.toLowerCase().includes("dun")
                                  ? formatNumber(v) + " ₮"
                                  : String(v)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return <div>Мэдээлэл байхгүй</div>;
            })()}

            <div className="mt-4 text-sm text-theme/70">
              Энэ тайлан нь дараах тайлануудыг агуулна: сарын төлөвлөгөө vs
              бодит орлого, зардлын төсвийн vs бодит зардал, гүйцэтгэлийн график
              гэх мэт. Backend-д тус тусын endpoint-ууд (sariin, uliral, export,
              ашиглалтын зардал гэх мэт) нэмэгдсэн тохиолдолд энэ хуудсыг
              өргөжнө.
            </div>
          </div>
        ) : (
          <div>Мэдээлэл байхгүй</div>
        )}
      </div>
    </div>
  );
}
