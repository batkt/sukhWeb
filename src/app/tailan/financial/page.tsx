"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import * as tailanApi from "@/lib/useTailan";

import { openSuccessOverlay } from "@/components/ui/SuccessOverlay";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";
import ReportsControls from "@/components/tailan/ReportsControls";
import TusgaiZagvar from "components/selectZagvar/tusgaiZagvar";
import { useBuilding } from "@/context/BuildingContext";
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

  // Auto-fetch once dependencies are ready so the table has data on first load
  useEffect(() => {
    const ready = Boolean(
      token && ajiltan?.baiguullagiinId && (selectedBuildingId || barilgiinId)
    );
    if (ready) {
      fetchReport();
    }
    // We intentionally depend only on identity inputs so it re-fetches
    // when organization or building context changes.
  }, [token, ajiltan?.baiguullagiinId, selectedBuildingId, barilgiinId]);

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
        flat.push(["Орон суугчдын тоо", s.numResidents]);
      if (s.numContracts != null) flat.push(["Гэрээний тоо", s.numContracts]);
      if (s.invoices?.total != null)
        flat.push(["Нэхэмжлэлийн тоо", s.invoices.total]);
      if (s.payments?.totalAmount != null)
        flat.push(["Төлбөрийн нийт дүн", s.payments.totalAmount]);
      if (s.ebarimt?.totalAmount != null)
        flat.push(["Е-Баримтын нийт дүн", s.ebarimt.totalAmount]);
      return flat.map(([k, v], i) => (
        <tr key={i} className="border-b last:border-b-0">
          <td className="p-2">{k}</td>
          <td className="p-2 text-right">
            {typeof v === "number" ? `${formatNumber(v)} ₮` : String(v)}
          </td>
        </tr>
      ));
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
      return rows.map((r: any, i: number) => (
        <tr key={r._id ?? i} className="border-b last:border-b-0">
          <td className="p-2">{r.gereeniiDugaar}</td>
          <td className="p-2">{r.ovog}</td>
          <td className="p-2">{r.ner}</td>
          <td className="p-2">
            {Array.isArray(r.utas) ? r.utas.join("/") : r.utas || "-"}
          </td>
          <td className="p-2">{r.toot}</td>
          <td className="p-2">{r.davkhar}</td>
          <td className="p-2">{r.bairNer}</td>
          <td className="p-2">
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
      return rows.map((t: any, i: number) => (
        <tr key={t._id ?? i} className="border-b last:border-b-0">
          <td className="p-2">
            {t.tranDate
              ? String(t.tranDate).slice(0, 19).replace("T", " ")
              : "-"}
          </td>
          <td className="p-2">{t.bank}</td>
          <td className="p-2 text-right">
            {formatNumber(t.amount || t.income || t.outcome || 0)} ₮
          </td>
          <td className="p-2">{t.description}</td>
          <td className="p-2">{t.dansniiDugaar}</td>
          <td className="p-2">{t.accNum}</td>
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

  return (
    <div className="min-h-screen">
      <h1 className="text-2xl font-semibold mb-4">Санхүүгийн тайлан</h1>

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
          <option value="summary">Нийт тайлан</option>
          <option value="avlaga">Өр / Авлага</option>
          <option value="orlogo-zarlaga">Орлого / Зарлага</option>
          <option value="ashig-aldagdal">Ашиг / Алдагдал</option>
          <option value="guilegee">Гүйлгээний түүх</option>
        </TusgaiZagvar>

        <button
          className="btn-minimal disabled:opacity-60"
          onClick={fetchReport}
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
          Export Excel
        </button>
      </div>
      <div className="neu-panel p-4 rounded-2xl">
        <div className="table-surface overflow-visible rounded-2xl w-full">
          <div className="rounded-3xl p-4 sm:p-6 mb-1 neu-table allow-overflow relative">
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto custom-scrollbar w-full">
              <table className="table-ui text-[11px] sm:text-xs min-w-full">
                <thead>
                  <tr>
                    {columnsByType[reportType]?.map((c) => (
                      <th
                        key={c}
                        className={`p-2 ${
                          reportType === "summary" ? "text-left" : "text-center"
                        }`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderRows() || (
                    <tr>
                      <td
                        className="p-4 text-center text-theme/60"
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
        </div>
      </div>
    </div>
  );
}
