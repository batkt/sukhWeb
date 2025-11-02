"use client";

import React, { useState } from "react";

import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";

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
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
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
      openErrorOverlay(
        e?.response?.data?.message ||
          "Гүйцэтгэлийн тайлан дуудахад алдаа гарлаа"
      );
    } finally {
      setIsLoading(false);
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
        hideReportType
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TusgaiZagvar
          className="rounded-2xl px-3 py-2"
          value={reportType}
          onChange={(v: string) => setReportType(v)}
        >
          <option value="sariin">Сарын тайлан</option>
          <option value="uliral">Улиралын тайлан</option>
          <option value="summary">Товч тойм</option>
        </TusgaiZagvar>

        <button
          className="btn-minimal disabled:opacity-60"
          onClick={fetchPerformance}
          disabled={isLoading}
        >
          Татах
        </button>

        <button
          className="btn-minimal disabled:opacity-60"
          onClick={() => exportReport("csv")}
          disabled={isLoading}
        >
          Export CSV
        </button>

        <button
          className="btn-minimal disabled:opacity-60"
          onClick={() => exportReport("xlsx")}
          disabled={isLoading}
        >
          Excel
        </button>
      </div>

      <div className="neu-panel p-4 rounded-2xl">
        <div className="table-surface overflow-visible rounded-2xl w-full">
          <div className="rounded-3xl p-4 sm:p-6 mb-1 neu-table allow-overflow relative">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto custom-scrollbar w-full">
              <table className="table-ui text-[11px] sm:text-xs min-w-full">
                <thead>
                  <tr>
                    {reportType === "sariin" && (
                      <>
                        <th className="p-2 text-center">Жил</th>
                        <th className="p-2 text-center">Сар</th>
                        <th className="p-2 text-center">Нийт дүн</th>
                        <th className="p-2 text-center">Тоо</th>
                      </>
                    )}
                    {reportType === "uliral" && (
                      <>
                        <th className="p-2 text-center">Жил</th>
                        <th className="p-2 text-center">Улирал</th>
                        <th className="p-2 text-center">Нийт дүн</th>
                        <th className="p-2 text-center">Тоо</th>
                      </>
                    )}
                    {reportType === "summary" && (
                      <>
                        <th className="p-2 text-left">Тайлбар</th>
                        <th className="p-2 text-right">Утга</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (!report)
                      return (
                        <tr>
                          <td
                            className="p-4 text-center text-theme/60"
                            colSpan={4}
                          >
                            {isLoading ? "Уншиж байна..." : "Мэдээлэл байхгүй"}
                          </td>
                        </tr>
                      );
                    if (
                      reportType === "sariin" &&
                      Array.isArray(report?.months)
                    ) {
                      return report.months.map((m: any, i: number) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-2 text-center">{m?._id?.y}</td>
                          <td className="p-2 text-center">{m?._id?.m}</td>
                          <td className="p-2 text-right">
                            {formatNumber(m?.total || 0)} ₮
                          </td>
                          <td className="p-2 text-center">{m?.count || 0}</td>
                        </tr>
                      ));
                    }
                    if (
                      reportType === "uliral" &&
                      Array.isArray(report?.quarters)
                    ) {
                      return report.quarters.map((q: any, i: number) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-2 text-center">{q?._id?.y}</td>
                          <td className="p-2 text-center">{q?._id?.q}</td>
                          <td className="p-2 text-right">
                            {formatNumber(q?.total || 0)} ₮
                          </td>
                          <td className="p-2 text-center">{q?.count || 0}</td>
                        </tr>
                      ));
                    }
                    if (reportType === "summary") {
                      const s = report.summary ?? report;
                      const pairs: [string, any][] = [];
                      if (s?.numResidents != null)
                        pairs.push(["Орон суугчдын тоо", s.numResidents]);
                      if (s?.numContracts != null)
                        pairs.push(["Гэрээний тоо", s.numContracts]);
                      if (s?.invoices?.total != null)
                        pairs.push(["Нэхэмжлэлийн тоо", s.invoices.total]);
                      if (s?.payments?.totalAmount != null)
                        pairs.push([
                          "Төлбөрийн нийт дүн",
                          s.payments.totalAmount,
                        ]);
                      if (s?.ebarimt?.totalAmount != null)
                        pairs.push([
                          "Е-Баримтын нийт дүн",
                          s.ebarimt.totalAmount,
                        ]);
                      if (pairs.length === 0)
                        return (
                          <tr>
                            <td
                              className="p-4 text-center text-theme/60"
                              colSpan={2}
                            >
                              {isLoading
                                ? "Уншиж байна..."
                                : "Мэдээлэл байхгүй"}
                            </td>
                          </tr>
                        );
                      return pairs.map(([k, v], i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="p-2">{k}</td>
                          <td className="p-2 text-right">
                            {typeof v === "number"
                              ? `${formatNumber(v)} ₮`
                              : String(v)}
                          </td>
                        </tr>
                      ));
                    }
                    return null;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
