"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";

interface AvlagiinNasjiltItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  ner: string;
  utas?: string[];
  toot?: string;
  davkhar?: string;
  orts?: string;
  ognoo: string;
  tulukhOgnoo?: string;
  niitTulbur?: number;
  avlaga: number;
  tuluv?: string;
  daysOverdue?: number;
  monthsOverdue?: number;
  ageBucket?: string;
  nasjilt: string;
  dugaalaltDugaar?: string | null;
  khuvi: number;
}

export default function AvlagiinNasjiltPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [data, setData] = useState<AvlagiinNasjiltItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);
  const [summary, setSummary] = useState<any>(null);

  const [formData, setFormData] = useState({
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    view: "delgerengui",
    khuudasniiDugaar: 1,
    khuudasniiKhemjee: 20,
  });
  const [filters, setFilters] = useState({
    orshinSuugch: "",
    toot: "",
    davkhar: "",
    gereeniiDugaar: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([null, null]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId || !baiguullaga) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        baiguullagiinId: baiguullaga._id,
        barilgiinId: selectedBuildingId,
        ekhlekhOgnoo: dateRange?.[0] || formData.ekhlekhOgnoo,
        duusakhOgnoo: dateRange?.[1] || formData.duusakhOgnoo,
        view: formData.view,
        khuudasniiDugaar: formData.khuudasniiDugaar,
        khuudasniiKhemjee: formData.khuudasniiKhemjee,
        orshinSuugch: debouncedFilters.orshinSuugch || undefined,
        toot: debouncedFilters.toot || undefined,
        davkhar: debouncedFilters.davkhar || undefined,
        gereeniiDugaar: debouncedFilters.gereeniiDugaar || undefined,
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/avlagiin-nasjilt",
        payload
      );
      setData(response.data?.jagsaalt || response.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.aldaa || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

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
        view: formData.view,
        khuudasniiDugaar: formData.khuudasniiDugaar,
        khuudasniiKhemjee: 1000, // Get all data for client-side pagination
        orshinSuugch: debouncedFilters.orshinSuugch || undefined,
        toot: debouncedFilters.toot || undefined,
        davkhar: debouncedFilters.davkhar || undefined,
        gereeniiDugaar: debouncedFilters.gereeniiDugaar || undefined,
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/avlagiin-nasjilt",
        payload
      );
      const fetchedData = response.data?.detailed?.list || [];
      const summaryData = response.data?.summary || null;

      // Map fields to match the expected interface
      const mappedData = Array.isArray(fetchedData)
        ? fetchedData.map((item: any) => {
            // Map ageBucket to nasjilt (aging category)
            let nasjilt = "Шинэ"; // Default
            if (item.ageBucket === "0-30") nasjilt = "Шинэ";
            else if (item.ageBucket === "31-60") nasjilt = "Хуучин";
            else if (item.ageBucket === "61-90" || item.ageBucket === "91-180")
              nasjilt = "Маш хуучин";
            else if (item.ageBucket === "180+") nasjilt = "Маш хуучин";

            const avlaga = item.niitTulbur || 0;
            const totalAmount = summaryData?.total || 1; // Avoid division by zero
            const khuvi = totalAmount > 0 ? (avlaga / totalAmount) * 100 : 0;

            return {
              _id: item.gereeniiId || item._id,
              gereeniiDugaar: item.gereeniiDugaar,
              bairNer: item.bairNer,
              ner: `${item.ner || ""}`.trim(),
              ognoo: item.ognoo,
              avlaga: avlaga,
              nasjilt: nasjilt,
              khuvi: khuvi,
              // Keep original fields for potential future use
              ...item,
            };
          })
        : [];

      // Sort newest first: prefer createdAt, then ognoo, then fallback to _id string
      const sortByNewest = (list: any[]) =>
        list.slice().sort((a: any, b: any) => {
          const getTime = (x: any) => {
            const d = x?.createdAt || x?.ognoo || x?.ognoo;
            const t = d ? new Date(d).getTime() : NaN;
            return isNaN(t) ? 0 : t;
          };
          const ta = getTime(a);
          const tb = getTime(b);
          if (tb !== ta) return tb - ta;
          return String(b._id || "").localeCompare(String(a._id || ""));
        });

      setData(sortByNewest(mappedData));
      setSummary(summaryData);
    } catch (err: any) {
      setError(err?.response?.data?.aldaa || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBuildingId, baiguullaga, dateRange, formData, debouncedFilters]);

  const totalAvlaga = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.avlaga || 0), 0);
  }, [data]);

  const totalKhuvi = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.khuvi || 0), 0);
  }, [data]);

  return (
    <div className="p-6">
      <h1 className="text-2xl  mb-6">Авлагийн насжилт</h1>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl">
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
              placeholder="Огноо сонгох"
              classNames={{
                input:
                  "neu-panel text-theme placeholder:text-theme !h-[40px] !py-2 !w-full",
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neu-panel p-3 rounded-xl">
            <label className="block text-sm font-medium text-theme/80 mb-1.5">Оршин суугч</label>
            <input
              type="text"
              value={filters.orshinSuugch}
              onChange={(e) => setFilters((p) => ({ ...p, orshinSuugch: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Овог, нэрээр хайх"
            />
          </div>
          <div className="neu-panel p-3 rounded-xl">
            <label className="block text-sm font-medium text-theme/80 mb-1.5">Тоот</label>
            <input
              type="text"
              value={filters.toot}
              onChange={(e) => setFilters((p) => ({ ...p, toot: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Тоот"
            />
          </div>
          <div className="neu-panel p-3 rounded-xl">
            <label className="block text-sm font-medium text-theme/80 mb-1.5">Давхар</label>
            <input
              type="text"
              value={filters.davkhar}
              onChange={(e) => setFilters((p) => ({ ...p, davkhar: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="Давхар"
            />
          </div>
          <div className="neu-panel p-3 rounded-xl">
            <label className="block text-sm font-medium text-theme/80 mb-1.5">Гэрээний дугаар</label>
            <input
              type="text"
              value={filters.gereeniiDugaar}
              onChange={(e) => setFilters((p) => ({ ...p, gereeniiDugaar: e.target.value }))}
              className="w-full p-2 rounded-lg neu-panel text-theme placeholder:text-theme/50 !h-[40px]"
              placeholder="ГД"
            />
          </div>
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

      {/* Summary Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Нийт авлага</h3>
          <p className="text-2xl  text-red-600">
            {formatNumber(totalAvlaga)} ₮
          </p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Нийт хувь</h3>
          <p className="text-2xl  text-blue-600">
            {formatNumber(totalKhuvi)}%
          </p>
        </div>
      </div> */}

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Гэрээний дугаар
                  </th>
                  
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Утас
                  </th>
                  {/* <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Давхар
                  </th> */}
                  {/* <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Байр
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Орц
                  </th> */}
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Огноо
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлөх огноо
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Нийт төлбөр
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Хугацаа хэтэрсэн хоног
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Хугацаа хэтэрсэн сар
                  </th>
                  {/* <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Насжилтын ангилал
                  </th>
                  <th className="z-10 p-2 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    дугаар
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={17} className="p-8 text-center text-theme/70">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="p-8 text-center text-theme/60">
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
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.gereeniiDugaar}
                        </td>
                        
                        <td className="p-2 text-left text-theme whitespace-nowrap">
                          {item.ner || ""}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {Array.isArray(item.utas)
                            ? item.utas.join(", ")
                            : item.utas || ""}
                        </td>
                        {/* <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.toot || ""}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.davkhar || ""}
                        </td> */}
                        {/* <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.bairNer || ""}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.orts || ""}
                        </td> */}
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.ognoo
                            ? item.ognoo.split("T")[0].replace(/-/g, ".")
                            : item.ognoo}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.tulukhOgnoo
                            ? item.tulukhOgnoo.split("T")[0].replace(/-/g, ".")
                            : item.tulukhOgnoo}
                        </td>
                        <td className="p-2 text-right text-theme whitespace-nowrap">
                          <span className="font-semibold text-red-600">
                            {formatNumber(item.niitTulbur ?? item.avlaga ?? 0)}{" "}
                            ₮
                          </span>
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.tuluv || ""}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.daysOverdue ?? ""}
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.monthsOverdue ?? ""}
                        </td>
                        {/* <td className="p-2 text-center text-theme whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.nasjilt === "Шинэ"
                                ? "badge-paid"
                                : item.nasjilt === "Хуучин"
                                ? "bg-yellow-500 text-yellow-800"
                                : item.nasjilt === "Маш хуучин"
                                ? "badge-unpaid"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.nasjilt}
                          </span>
                        </td>
                        <td className="p-2 text-center text-theme whitespace-nowrap">
                          {item.dugaalaltDugaar || ""}
                        </td> */}
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

                  <td className="p-3 text-right text-theme whitespace-nowrap ">
                    Нийт: {formatNumber(totalAvlaga)} ₮
                  </td>
                  <td className="p-3 text-right text-theme whitespace-nowrap  text-red-600"></td>

                  <td className="p-3 text-right text-theme whitespace-nowrap "></td>
                  <td className="p-3 text-right text-theme whitespace-nowrap ">
                    {formatNumber(totalKhuvi)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-theme/70">
          Нийт: {summary?.count || data.length}
        </div>
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
