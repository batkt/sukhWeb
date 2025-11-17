"use client";

import { useState, useEffect, useMemo } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../components/selectZagvar/tusgaiZagvar";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import uilchilgee from "../../../../lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";

interface NekhemjlekhiinTuukhItem {
  _id: string;
  gereeniiDugaar: string;
  bairNer: string;
  davkhar: string;
  toot: string;
  ovog: string;
  ner: string;
  ognoo: string;
  tulbur: number;
  tuluv: string;
  tuukh: string;
}

export default function NekhemjlekhiinTuukhPage() {
  const { selectedBuildingId, setSelectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );

  // Filter buildings that belong to this organization (baiguullagiinId) or lack the field
  const orgBuildings = useMemo(() => {
    if (!Array.isArray(baiguullaga?.barilguud)) return [];
    return baiguullaga!.barilguud!.filter(
      (b: any) =>
        !b?.baiguullagiinId ||
        String(b.baiguullagiinId) === String(baiguullaga?._id)
    );
  }, [baiguullaga?.barilguud, baiguullaga?._id]);

  const [data, setData] = useState<NekhemjlekhiinTuukhItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [formData, setFormData] = useState({
    ekhlekhOgnoo: "",
    duusakhOgnoo: "",
    tuluv: "Төлөөгүй",
    gereeniiDugaar: "",
    bairNer: "",
    davkhar: "",
    toot: "",
    ovog: "",
    ner: "",
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
        tuluv: formData.tuluv,
        gereeniiDugaar: formData.gereeniiDugaar || undefined,
        bairNer: formData.bairNer || undefined,
        davkhar: formData.davkhar || undefined,
        toot: formData.toot || undefined,
        ovog: formData.ovog || undefined,
        ner: formData.ner || undefined,
        khuudasniiKhemjee: 1000, // Get all data for client-side pagination
      };

      const response = await uilchilgee(token ?? undefined).post(
        "/tailan/nekhemjlekhiin-tuukh",
        payload
      );
      const rawData = Array.isArray(response.data?.list)
        ? response.data.list
        : [];
      // Map niitTulbur to tulbur for consistency
      const mappedData = rawData.map((item: any) => ({
        ...item,
        tulbur: item.niitTulbur || item.tulbur || 0,
      }));

      // Sort newest-first (prefer createdAt then ognoo)
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
    } catch (err: any) {
      setError(err?.response?.data?.aldaa || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBuildingId, baiguullaga, token, formData, dateRange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchData();
  };

  const totalTulbur = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    return data.reduce((sum, item) => sum + (item.tulbur || 0), 0);
  }, [data]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Нэхэмжлэхийн түүх</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                  "text-theme neu-panel placeholder:text-theme !h-[40px] !py-2 !w-full",
              }}
            />
          </div>
          <div className="p-4 rounded-xl">
            <TusgaiZagvar
              value={formData.tuluv}
              onChange={(v: string) => setFormData({ ...formData, tuluv: v })}
              options={[
                { value: "Төлсөн", label: "Төлсөн" },
                { value: "Төлөөгүй", label: "Төлөөгүй" },

                // { value: "Хэсэгчлэн төлсөн", label: "Хэсэгчлэн төлсөн" },
              ]}
              placeholder="Төлөв сонгох"
              className="h-[40px] w-full"
            />
          </div>
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Гэрээний дугаар</label>
            <input
              type="text"
              value={formData.gereeniiDugaar}
              onChange={(e) =>
                setFormData({ ...formData, gereeniiDugaar: e.target.value })
              }
              className="w-full p-2 rounded-lg border neu-panel"
              placeholder="Гэрээний дугаар"
            />
          </div> */}
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Байрны нэр</label>
            <TusgaiZagvar
              value={formData.bairNer}
              onChange={(v: string) => setFormData({ ...formData, bairNer: v })}
              options={[
                { value: "", label: "Бүгд" },
                ...orgBuildings.map((b: any) => ({
                  value: b.ner,
                  label: b.ner,
                })),
              ]}
              placeholder="Байрны нэр сонгох"
              className="h-[40px] w-full"
            />
          </div> */}
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Барилга</label>
            <TusgaiZagvar
              value={selectedBuildingId || ""}
              onChange={(v: string) => {
                // Update the global building selection
                if (v) {
                  setSelectedBuildingId(v);
                }
              }}
              options={orgBuildings.map((b: any) => ({
                value: b._id,
                label: b.ner,
              }))}
              placeholder="Барилга сонгох"
              className="h-[40px] w-full"
            />
          </div> */}
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Давхар</label>
            <input
              type="text"
              value={formData.davkhar}
              onChange={(e) =>
                setFormData({ ...formData, davkhar: e.target.value })
              }
              className="w-full p-2 rounded-lg border neu-panel"
              placeholder="Давхар"
            />
          </div>
          <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Тоот</label>
            <input
              type="text"
              value={formData.toot}
              onChange={(e) =>
                setFormData({ ...formData, toot: e.target.value })
              }
              className="w-full p-2 rounded-lg border neu-panel"
              placeholder="Тоот"
            />
          </div> */}
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Овог</label>
            <input
              type="text"
              value={formData.ovog}
              onChange={(e) =>
                setFormData({ ...formData, ovog: e.target.value })
              }
              className="w-full p-2 rounded-lg border neu-panel"
              placeholder="Овог"
            />
          </div>
          <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Нэр</label>
            <input
              type="text"
              value={formData.ner}
              onChange={(e) =>
                setFormData({ ...formData, ner: e.target.value })
              }
              className="w-full p-2 rounded-lg border neu-panel"
              placeholder="Нэр"
            />
          </div> */}
          {/* <div className="neu-panel p-4 rounded-xl">
            <label className="block font-semibold mb-2">Хуудасны хэмжээ</label>
            <PageSongokh
              value={formData.khuudasniiKhemjee}
              onChange={(v: number) =>
                setFormData({ ...formData, khuudasniiKhemjee: v })
              }
              options={[20, 50, 100]}
              className="h-[40px] w-full"
            />
          </div> */}
        </div>
      </form>

      {error && <div className="text-red-500 mb-4">Алдаа: {error}</div>}

      {/* Summary Card
      <div className="neu-panel p-4 rounded-xl mb-6">
        <h3 className="font-semibold mb-2">Нийт төлбөр</h3>
        <p className="text-2xl font-bold text-blue-600">
          {formatNumber(totalTulbur)} ₮
        </p>
      </div> */}

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[48vh] overflow-y-auto custom-scrollbar w-full">
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
                    Давхар
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Овог
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Огноо
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлбөр
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Түүх
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-theme/70">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-theme/60">
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
                          {item.davkhar}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.toot}
                        </td>
                        <td className="p-3 text-left text-theme whitespace-nowrap">
                          {item.ovog}
                        </td>
                        <td className="p-3 text-left text-theme whitespace-nowrap">
                          {item.ner}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.ognoo
                            ? item.ognoo.split("T")[0].replace(/-/g, ".")
                            : item.ognoo}
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
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.tuukh}
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
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
                  <td className="p-3 text-center text-theme whitespace-nowrap font-bold">
                    Нийт: {formatNumber(totalTulbur)} ₮
                  </td>

                  <td className="p-3 text-center text-theme whitespace-nowrap"></td>
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
