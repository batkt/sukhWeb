"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";

import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import PageSongokh from "components/selectZagvar/pageSongokh";
import { useBuilding } from "@/context/BuildingContext";
import { useRegisterTourSteps, type DriverStep } from "@/context/TourContext";
import IconTextButton from "@/components/ui/IconTextButton";
import { useMemo } from "react";
import { Download, FileDown } from "lucide-react";
import { useSpinner } from "@/context/SpinnerContext";
import formatNumber from "../../../../tools/function/formatNumber";

export default function FinancialReportsPage() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId } = useBuilding();
  const { showSpinner, hideSpinner } = useSpinner();
  const [report, setReport] = useState<any>(null);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >(undefined);
  const [filters, setFilters] = useState<any>({});
  const [reportType, setReportType] = useState<string>("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const financialTourSteps: DriverStep[] = [
    {
      element: "#financial-reports-controls",
      popover: {
        title: "Огнооны сонголт",
        description: "Эндээс тайлангийн филтерийг сонгоно.",
      },
    },
    {
      element: "#financial-report-type",
      popover: {
        title: "Тайлангийн төрөл",
        description: "Тайлангийн төрлийг сонгоно.",
      },
    },
    {
      element: "#financial-fetch",
      popover: {
        title: "Тайлан татах",
        description: "Сонгосон тохиргоогоор тайланг татаж авна.",
      },
    },
    {
      element: "#financial-csv",
      popover: {
        title: "CSV экспорт",
        description: "Тайланг CSV форматаар татаж авна.",
      },
    },
    {
      element: "#financial-excel",
      popover: {
        title: "Excel экспорт",
        description: "Тайланг Excel форматаар татаж авна.",
      },
    },
    {
      element: "#financial-table",
      popover: {
        title: "Тайлангийн хүснэгт",
        description: "Тайлангийн мэдээлэл энд харуулагдана.",
      },
    },
    {
      element: "#financial-pagination",
      popover: {
        title: "Хуудаслалт",
        description: "Тайлангийн хуудсуудыг сольж болно.",
      },
    },
  ];

  useRegisterTourSteps("/tailan/financial", financialTourSteps);

  const fetchReport = async () => {
    console.log("Fetch report called");
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
        case "avlaga":
          resp = await tailanApi.postAvlaga(token, body);
          break;
        case "orlogo-zarlaga":
          resp = await tailanApi.postOrlogoZarlaga(token, body);
          break;
        case "ashig-aldagdal":
          resp = await tailanApi.postAshigAldagdal(token, body);
          break;
        case "guilegee":
          resp = await tailanApi.postGuilegee(token, body);
          break;
        default:
          resp = await tailanApi.postSummary(token, body);
      }

      const data = resp?.data ?? resp;
      console.log("API response data:", data);
      setReport({ ...data });
      console.log("Report set to:", { ...data });
      openSuccessOverlay("Тайлан амжилттай ирлээ", 900);
    } catch (e: any) {
      console.error("API call failed:", e);
      console.error("Error details:", e?.response?.data || e?.message || e);
      openErrorOverlay(
        e?.response?.data?.message || "Тайлан уншихад алдаа гарлаа"
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

  // Auto-load org-only data when page opens and when report type changes (like summary behavior)
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
          case "avlaga":
            resp = await tailanApi.getAvlagaByOrg(token, orgId);
            break;
          case "orlogo-zarlaga":
            resp = await tailanApi.getOrlogoZarlagaByOrg(token, orgId);
            break;
          case "ashig-aldagdal":
            resp = await tailanApi.getAshigAldagdalByOrg(token, orgId);
            break;
          case "guilegee":
            resp = await tailanApi.getGuilegeeByOrg(token, orgId);
            break;
          default:
            resp = await tailanApi.getSummaryByOrg(token, orgId);
        }
        const data = resp?.data ?? resp;
        setReport({ ...data });
      } catch (e) {
        // non-blocking
      } finally {
        lastQuickFetchKeyRef.current = key;
      }
    })();
  }, [token, ajiltan?.baiguullagiinId, reportType]);

  // Define table columns per report type so the table is always shown
  const columnsByType: Record<string, string[]> = {
    summary: ["Тайлбар", "Утга"],
    "orlogo-zarlaga": ["Орлого", "Зарлага", "Ашиг/Алдагдал"],
    "ashig-aldagdal": ["Орлого", "Зарлага", "Ашиг/Алдагдал"],
    avlaga: [
      "Гэрээний дугаар",
      "Овог",
      "Нэр",
      "Утас",
      "Тоот",
      "Давхар",
      "Байр",
      "Огноо",
      "Нийт төлбөр",
      "Төлөв",
    ],
    guilegee: [
      "Огноо",
      "Банк",
      "Дүн",
      "Гүйлгээний утга",
      "Дансны дугаар",
      "Данс код",
      "Төрөл",
    ],
  };

  const renderRows = () => {
    if (!report) return null;
    if (reportType === "summary") {
      const s = report.summary ?? report.totals ?? null;
      if (!s) return null;
      const flat: [string, any][] = [];
      if (s.numResidents != null)
        flat.push(["Оршин суугчдын тоо", s.numResidents]);
      if (s.numContracts != null) flat.push(["Гэрээний тоо", s.numContracts]);
      if (s.invoices?.total != null)
        flat.push(["Нэхэмжлэлийн тоо", s.invoices.total]);
      if (s.payments?.totalAmount != null)
        flat.push(["Төлбөрийн нийт дүн", s.payments.totalAmount]);
      if (s.ebarimt?.totalAmount != null)
        flat.push(["Е-Баримтын нийт дүн", s.ebarimt.totalAmount]);
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      return flat.slice(start, end).map(([k, v], i) => {
        const displayValue =
          typeof v === "number"
            ? k === "Оршин суугчдын тоо" || k === "Гэрээний тоо"
              ? formatNumber(v, 0)
              : `${formatNumber(v)} ₮`
            : String(v);
        let alignClass = "text-center";
        if (displayValue.includes("₮")) alignClass = "text-center";
        else if (k === "Оршин суугчдын тоо" || k === "Гэрээний тоо")
          alignClass = "text-center";
        return (
          <tr key={i} className="border-b last:border-b-0">
            <td className="p-2 text-left">{k}</td>
            <td
              className={`p-2 ${
                displayValue.includes("₮") ? "text-right" : "text-center"
              }`}
            >
              {displayValue}
            </td>
          </tr>
        );
      });
    }
    if (reportType === "orlogo-zarlaga" || reportType === "ashig-aldagdal") {
      const r = report;
      const orlogo = r.orlogo ?? 0;
      const zarlaga = r.zarlaga ?? 0;
      const ashig = orlogo - zarlaga;
      return (
        <tr>
          <td className="p-2 text-right">{formatNumber(orlogo)} ₮</td>
          <td className="p-2 text-right">{formatNumber(zarlaga)} ₮</td>
          <td
            className={`p-2 text-right ${
              ashig >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatNumber(ashig)} ₮
          </td>
        </tr>
      );
    }
    if (reportType === "avlaga") {
      const rows = [
        ...((report.paid?.list as any[]) || []),
        ...((report.unpaid?.list as any[]) || []),
      ];
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      return rows.slice(start, end).map((r: any, i: number) => (
        <tr key={r._id ?? i} className="border-b last:border-b-0">
          <td className="p-2 text-center">{r.gereeniiDugaar}</td>
          <td className="p-2 text-center">{r.ovog}</td>
          <td className="p-2 text-center">{r.ner}</td>
          <td className="p-2 text-center">
            {Array.isArray(r.utas) ? r.utas.join("/") : r.utas || "-"}
          </td>
          <td className="p-2 text-center">{r.toot}</td>
          <td className="p-2 text-center">{r.davkhar}</td>
          <td className="p-2 text-center">{r.bairNer}</td>
          <td className="p-2 text-center">
            {r.ognoo ? String(r.ognoo).slice(0, 10) : "-"}
          </td>
          <td className="p-2 text-right">
            {formatNumber(r.niitTulbur || 0)} ₮
          </td>
          <td className="p-2 text-center">{r.tuluv}</td>
        </tr>
      ));
    }
    if (reportType === "guilegee") {
      const rows = Array.isArray(report.list) ? report.list : [];
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      return rows.slice(start, end).map((t: any, i: number) => (
        <tr key={t._id ?? i} className="border-b last:border-b-0">
          <td className="p-2 text-center">
            {t.tranDate
              ? String(t.tranDate).slice(0, 19).replace("T", " ")
              : "-"}
          </td>
          <td className="p-2 text-center">{t.bank}</td>
          <td className="p-2 text-right">
            {formatNumber(t.amount || t.income || t.outcome || 0)} ₮
          </td>
          <td className="p-2 text-center">{t.description}</td>
          <td className="p-2 text-center">{t.dansniiDugaar}</td>
          <td className="p-2 text-center">{t.accNum}</td>
          <td className="p-2 text-center">
            {t.drOrCr === "CR"
              ? "Орлого"
              : t.drOrCr === "DR"
              ? "Зарлага"
              : t.drOrCr || "-"}
          </td>
        </tr>
      ));
    }
    return null;
  };

  const getTotalRows = () => {
    if (!report) return 0;
    if (reportType === "avlaga") {
      const paid = Array.isArray(report?.paid?.list)
        ? report.paid.list.length
        : 0;
      const unpaid = Array.isArray(report?.unpaid?.list)
        ? report.unpaid.list.length
        : 0;
      return paid + unpaid;
    }
    if (reportType === "guilegee") {
      return Array.isArray(report?.list) ? report.list.length : 0;
    }
    if (reportType === "summary") {
      const s = report.summary ?? report.totals ?? null;
      if (!s) return 0;
      let n = 0;
      if (s.numResidents != null) n++;
      if (s.numContracts != null) n++;
      if (s.invoices?.total != null) n++;
      if (s.payments?.totalAmount != null) n++;
      if (s.ebarimt?.totalAmount != null) n++;
      return n;
    }
    if (reportType === "orlogo-zarlaga" || reportType === "ashig-aldagdal") {
      return report ? 1 : 0;
    }
    return 0;
  };
  useRegisterTourSteps("/tailan/financial", financialTourSteps);

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4 p-4">Санхүүгийн тайлан</h1>

      <div id="financial-reports-controls">
        <ReportsControls
          dateRange={dateRange}
          setDateRange={setDateRange}
          filters={filters}
          setFilters={setFilters}
          hideReportType
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div id="financial-report-type">
          <TusgaiZagvar
            className="rounded-2xl px-3 py-2"
            value={reportType}
            onChange={(v: string) => setReportType(v)}
          >
            <option value="summary">Нийт тайлан</option>
            <option value="avlaga">Өр / Авлага</option>
            <option value="orlogo-zarlaga">Орлого / Зарлага</option>
            <option value="ashig-aldagdal">Ашиг / Алдагдал</option>
            <option value="guilegee">Гүйлгээний түүх</option>
          </TusgaiZagvar>
        </div>

        <IconTextButton
          id="financial-fetch"
          onClick={fetchReport}
          icon={<Download className="w-5 h-5" />}
          label="Татах"
          disabled={isLoading}
        />

        <IconTextButton
          id="financial-csv"
          onClick={() => exportReport("csv")}
          icon={<Download className="w-5 h-5" />}
          label="CSV"
          disabled={isLoading}
        />

        <IconTextButton
          id="financial-excel"
          onClick={() => exportReport("xlsx")}
          icon={<FileDown className="w-5 h-5" />}
          label="Excel"
          disabled={isLoading}
        />
      </div>
      <div className="neu-panel p-4 rounded-2xl">
        <div className="table-surface overflow-visible rounded-2xl w-full max-h-[55vh]">
          <div className="rounded-3xl p-4 sm:p-6 mb-1 neu-table allow-overflow relative">
            <div className="max-h-[50vh] overflow-y-auto overflow-x-auto custom-scrollbar w-full">
              <table
                id="financial-table"
                className="table-ui text-[11px] sm:text-xs min-w-full"
              >
                <thead>
                  <tr>
                    {columnsByType[reportType]?.map((c) => (
                      <th key={c} className="p-2 text-center">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderRows() || (
                    <tr>
                      <td
                        className="p-2 text-center text-theme/60"
                        colSpan={columnsByType[reportType]?.length || 1}
                      >
                        {isLoading ? "Уншиж байна..." : "Мэдээлэл байхгүй"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination controls */}
          <div
            id="financial-pagination"
            className="flex items-center justify-between px-2 py-1 text-xs"
          >
            <div className="text-theme/70">Нийт: {getTotalRows()}</div>
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
                  disabled={currentPage * rowsPerPage >= getTotalRows()}
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
  );
}
