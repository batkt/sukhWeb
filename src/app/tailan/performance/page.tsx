"use client";

import React, { useEffect, useRef, useState } from "react";
import IconTextButton from "@/components/ui/IconTextButton";
import { Download, FileDown } from "lucide-react";

import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";

import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Auto-load org-only data on mount and when the report type changes (like summary behavior)
  const lastQuickFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!token || !ajiltan?.baiguullagiinId) return;
    const orgId = String(ajiltan.baiguullagiinId);
    const key = `${reportType}:${orgId}`;
    if (lastQuickFetchKeyRef.current === key) return;
    (async () => {
      try {
        let resp: any;
        switch (reportType) {
          case "sariin":
            resp = await tailanApi.getSariinByOrg(token, orgId);
            break;
          case "uliral":
            resp = await tailanApi.getUliralByOrg(token, orgId);
            break;
          default:
            resp = await tailanApi.getSummaryByOrg(token, orgId);
        }
        setReport(resp?.data ?? resp);
      } catch (e) {
        // non-blocking; user can still use the button for full filters
      } finally {
        lastQuickFetchKeyRef.current = key;
      }
    })();
  }, [token, ajiltan?.baiguullagiinId, reportType]);

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

        <IconTextButton
          onClick={fetchPerformance}
          icon={<Download className="w-5 h-5" />}
          label="Татах"
          disabled={isLoading}
        />

        <IconTextButton
          onClick={() => exportReport("csv")}
          icon={<Download className="w-5 h-5" />}
          label="CSV"
          disabled={isLoading}
        />

        <IconTextButton
          onClick={() => exportReport("xlsx")}
          icon={<FileDown className="w-5 h-5" />}
          label="Excel"
          disabled={isLoading}
        />
      </div>

      <div className="neu-panel p-4 rounded-2xl">
        <div className="table-surface overflow-visible rounded-2xl w-full">
          <div className="rounded-3xl p-4 sm:p-6 mb-1 neu-table allow-overflow relative">
            <div className="max-h-[50vh] overflow-y-auto overflow-x-auto custom-scrollbar w-full">
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
                      const start = (currentPage - 1) * rowsPerPage;
                      const end = start + rowsPerPage;
                      return report.months
                        .slice(start, end)
                        .map((m: any, i: number) => (
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
                      const start = (currentPage - 1) * rowsPerPage;
                      const end = start + rowsPerPage;
                      return report.quarters
                        .slice(start, end)
                        .map((q: any, i: number) => (
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
                        pairs.push(["Оршин суугчдын тоо", s.numResidents]);
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
            {/* Pagination controls */}
            <div className="flex items-center justify-between px-2 py-1 text-xs">
              <div className="text-theme/70">
                Нийт:{" "}
                {(() => {
                  if (!report) return 0;
                  if (reportType === "sariin") {
                    return Array.isArray(report?.months)
                      ? report.months.length
                      : 0;
                  }
                  if (reportType === "uliral") {
                    return Array.isArray(report?.quarters)
                      ? report.quarters.length
                      : 0;
                  }
                  if (reportType === "summary") {
                    const s = report.summary ?? report;
                    let n = 0;
                    if (s?.numResidents != null) n++;
                    if (s?.numContracts != null) n++;
                    if (s?.invoices?.total != null) n++;
                    if (s?.payments?.totalAmount != null) n++;
                    if (s?.ebarimt?.totalAmount != null) n++;
                    return n;
                  }
                  return 0;
                })()}
              </div>
              <div className="flex items-center gap-3">
                <PageSongokh
                  value={rowsPerPage}
                  onChange={(v) => {
                    setRowsPerPage(v);
                    setCurrentPage(1);
                  }}
                  className="text-xs px-2 py-1"
                />
                <div className="flex items-center gap-1">
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    Өмнөх
                  </button>
                  <div className="text-theme/70 px-1">{currentPage}</div>
                  <button
                    className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                    disabled={(() => {
                      const total = (() => {
                        if (!report) return 0;
                        if (reportType === "sariin")
                          return Array.isArray(report?.months)
                            ? report.months.length
                            : 0;
                        if (reportType === "uliral")
                          return Array.isArray(report?.quarters)
                            ? report.quarters.length
                            : 0;
                        if (reportType === "summary") {
                          const s = report.summary ?? report;
                          let n = 0;
                          if (s?.numResidents != null) n++;
                          if (s?.numContracts != null) n++;
                          if (s?.invoices?.total != null) n++;
                          if (s?.payments?.totalAmount != null) n++;
                          if (s?.ebarimt?.totalAmount != null) n++;
                          return n;
                        }
                        return 0;
                      })();
                      return currentPage * rowsPerPage >= total;
                    })()}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Дараах
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
