"use client";

import { useState, useEffect, useMemo } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";

interface SariinTulburItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  ner: string;
  sar: string;
  on: number;
  tulbur: number;
  tuluv: string;
}

export default function SariinTulburPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [data, setData] = useState<SariinTulburItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formData, setFormData] = useState({
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    turul: "uliral",
    view: "delgerengui",
  });

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([null, null]);

  const fetchData = async () => {
    if (!selectedBuildingId || !baiguullaga) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        ekhlekhOgnoo: dateRange?.[0] || formData.ekhlekhOgnoo,
        duusakhOgnoo: dateRange?.[1] || formData.duusakhOgnoo,
        turul: formData.turul,
        view: formData.view,
        khuudasniiKhemjee: 1000, // Get all data for client-side pagination
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/sariin-tulbur",
        payload
      );
      const fetchedData = response.data?.detailed?.list || [];
      // Map fields if they have different names in API
      const mappedData = Array.isArray(fetchedData)
        ? fetchedData.map((item: any) => {
            // Parse period "2025-11" to sar (month) and on (year)
            const [year, month] = item.period
              ? item.period.split("-")
              : ["", ""];

            return {
              ...item,
              tulbur: item.niitTulbur || item.tulbur || 0,
              sar: month || item.sar || "",
              on: parseInt(year) || item.on || "",
              bairNer: item.bairNer || "N/A", // Handle empty bairNer
            };
          })
        : [];
      // Sort newest-first (prefer createdAt then ognoo)
      const sortByNewest = (list: any[]) =>
        list.slice().sort((a: any, b: any) => {
          const getTime = (x: any) => {
            const d = x?.createdAt || x?.ognoo || x?.period;
            const t = d ? new Date(d).getTime() : NaN;
            return isNaN(t) ? 0 : t;
          };
          const ta = getTime(a);
          const tb = getTime(b);
          if (tb !== ta) return tb - ta;
          return String(b._id || "").localeCompare(String(a._id || ""));
        });

      setData(sortByNewest(mappedData));
    } catch (err: any) {
      setError(err?.response?.data?.aldaa || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBuildingId, baiguullaga, token, formData, dateRange]);

  // Adjust date range based on selected type
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);

      if (formData.turul === "sar") {
        // For month selection, ensure range is within the same month
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endOfMonth = new Date(startYear, startMonth + 1, 0);

        if (endDate > endOfMonth) {
          setDateRange([dateRange[0], endOfMonth.toISOString().split("T")[0]]);
        }
      } else if (formData.turul === "uliral") {
        // For quarter selection, ensure range spans 3 months
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const quarterEndMonth = startMonth + 3;
        const endOfQuarter = new Date(startYear, quarterEndMonth, 0);

        if (endDate.getTime() !== endOfQuarter.getTime()) {
          setDateRange([
            dateRange[0],
            endOfQuarter.toISOString().split("T")[0],
          ]);
        }
      }
    }
  }, [formData.turul, dateRange]);

  const totalTulbur = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.tulbur || 0), 0);
  }, [data]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Сарын төлбөр</h1>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className=" p-4 rounded-xl">
            <DatePickerInput
              type="range"
              locale="mn"
              value={dateRange}
              onChange={setDateRange}
              size="sm"
              radius="md"
              variant="filled"
              dropdownType="popover"
              popoverProps={{
                position: "bottom-start",
                withinPortal: true,
                width: 320,
              }}
              clearable
              placeholder={
                formData.turul === "sar" ? "Сар сонгох" : "Улирал сонгох"
              }
              classNames={{
                input:
                  "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-full",
              }}
            />
          </div>
          <div className=" p-4 rounded-xl">
            <TusgaiZagvar
              value={formData.turul}
              onChange={(v: string) => setFormData({ ...formData, turul: v })}
              options={[
                { value: "sar", label: "Сар" },
                { value: "uliral", label: "Улирал" },
              ]}
              placeholder="Төрөл сонгох"
              className="h-[40px] w-full"
            />
          </div>
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Харагдац</label>
            <TusgaiZagvar
              value={formData.view}
              onChange={(v: string) => setFormData({ ...formData, view: v })}
              options={[
                { value: "delgerengui", label: "Дэлгэрэнгүй" },
                { value: "togtvor", label: "Товч" },
              ]}
              placeholder="Харагдац сонгох"
              className="h-[40px] w-full"
            />
          </div> */}
        </div>
        {/* <button
          type="submit"
          disabled={loading}
          className="neu-panel px-6 py-2 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? "Уншиж байна..." : "Хайх"}
        </button> */}
      </div>

      {error && <div className="text-red-500 mb-4">Алдаа: {error}</div>}

      {/* Summary Card */}
      {/* <div className="neu-panel p-4 rounded-xl mb-6">
        <h3 className="font-semibold mb-2">Нийт төлбөр</h3>
        <p className="text-2xl font-bold text-blue-600">
          {formatNumber(totalTulbur)} ₮
        </p>
      </div> */}

      {/* Data Table */}
      <div className=" overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[45vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Гэрээний дугаар
                  </th>
                  {/* <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Байрны нэр
                  </th> */}
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Сар
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Он
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлбөр
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-theme/70">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-theme/60">
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : (
                  data
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((item, idx) => (
                      <tr
                        key={item._id || idx}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.gereeniiDugaar}
                        </td>
                        {/* <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.bairNer}
                        </td> */}
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.ner}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.sar}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.on}
                        </td>
                        <td className="p-3 text-right text-theme whitespace-nowrap">
                          <span className="font-semibold">
                            {formatNumber(item.tulbur)} ₮
                          </span>
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.tuluv === "Төлсөн"
                                ? "badge-paid"
                                : item.tuluv === "Төлөөгүй"
                                ? "badge-unpaid"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.tuluv}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t dark:border-gray-800 border-gray-100">
            <table className="text-sm min-w-full">
              <tbody>
                <tr>
                  <td className="p-3 text-center text-theme whitespace-nowrap w-12"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-right text-theme whitespace-nowrap font-bold">
                    Нийт: {formatNumber(totalTulbur)} ₮
                  </td>
                  <td className="p-3 text-right text-theme whitespace-nowrap font-bold"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-theme/70">Нийт: {data.length}</div>
        <div className="flex items-center gap-3">
          <PageSongokh
            value={pageSize}
            onChange={(v) => {
              setPageSize(v);
              setCurrentPage(1);
            }}
            className="text-xs"
          />
          <div className="flex items-center gap-1">
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Өмнөх
            </button>
            <div className="text-theme/70 px-1">{currentPage}</div>
            <button
              className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
              disabled={currentPage * pageSize >= data.length}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
