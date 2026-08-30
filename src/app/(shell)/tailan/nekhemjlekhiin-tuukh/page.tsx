"use client";

import { useState, useEffect, useMemo } from "react";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import TusgaiZagvar from "../../../../../components/selectZagvar/tusgaiZagvar";
import { StandardDatePicker } from "@/components/ui/StandardDatePicker";
import { getDefaultDateRange } from "@/lib/utils";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../../tools/function/formatNumber";
import PageSongokh from "../../../../../components/selectZagvar/pageSongokh";
import { FileSpreadsheet, Printer } from "lucide-react";

const PrintStyles = () => (
  <style jsx global>{`
    @media print {
      @page { size: A4 landscape; margin: 0.5cm; }
      body * { visibility: hidden !important; }
      .print-container, .print-container * { visibility: visible !important; }
      .print-container { 
        position: absolute !important; 
        left: 0 !important; 
        top: 0 !important; 
        width: 100% !important; 
        padding: 0 !important; 
        margin: 0 !important;
      }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      
      .max-h-[48vh], .custom-scrollbar { 
        max-height: none !important; 
        height: auto !important;
        overflow: visible !important; 
      }
      .neu-panel, .neu-table {
        box-shadow: none !important;
        border: 1px solid #eee !important;
        background: white !important;
      }
      
      table { 
        width: 100% !important; 
        border-collapse: collapse !important; 
        table-layout: auto !important;
        font-size: 8pt !important;
      }
      th, td { 
        border: 1px solid #ddd !important; 
        padding: 4px 2px !important; 
        white-space: normal !important;
      }
      th { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
      .text-right { text-align: right !important; }
    }
    .print-only { display: none; }
  `}</style>
);

/** Серверийн буцаадаг `type`-ийн монгол нэр. */
const TUROL_NER: Record<string, string> = {
  invoice: "Нэхэмжлэх",
  receivable: "Авлага",
  payment: "Төлөлт",
};

const TUROL_ANGI: Record<string, string> = {
  invoice:
    "bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
  receivable:
    "bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700",
  payment:
    "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
};

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
  /** Сервер гурван төрлийн бичлэгийг нэг жагсаалтад нийлүүлж буцаадаг. */
  type?: "invoice" | "receivable" | "payment";
  uldegdel?: number;
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
  const [pageSize, setPageSize] = useState(500);

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
  >(getDefaultDateRange);

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

  /**
   * Гурван төрлийн бичлэгийг тусад нь нийлбэрлэнэ.
   *
   * Сервер (`/tailan/nekhemjlekhiin-tuukh`) нэхэмжлэх, авлага, төлөлт гэсэн
   * ГУРВАН өөр төрлийн бичлэгийг нэг жагсаалтад нийлүүлж, дүнг нь бүгдийг
   * `niitTulbur` талбарт хийж буцаадаг. Өмнө нь бүгдийг нь ялгалгүй нэмж
   * "Нийт" гэж харуулдаг байсан нь 100₮-ийн нэхэмжлэх, түүнийг төлсөн 100₮
   * хоёрыг нийлүүлж 200₮ гаргадаг байв. Тиймээс төрлөөр нь салгав.
   */
  const dungiinKhuraangui = useMemo(() => {
    const empty = { nekhemjilsen: 0, tulsun: 0, uldegdel: 0 };
    if (!Array.isArray(data)) return empty;

    let nekhemjilsen = 0;
    let tulsun = 0;
    for (const item of data) {
      const dun = item.tulbur || 0;
      if (item.type === "payment") tulsun += dun;
      else nekhemjilsen += dun;
    }
    return { nekhemjilsen, tulsun, uldegdel: nekhemjilsen - tulsun };
  }, [data]);

  const totalTulbur = dungiinKhuraangui.nekhemjilsen;

  const exportToExcel = () => {
    if (!data.length) return;
    
    // 1. Metadata Rows
    const buildingName = baiguullaga?.ner || "";
    const dateStr = dateRange?.[0] && dateRange?.[1]
      ? `${new Date(dateRange[0]).toLocaleDateString("mn-MN")} - ${new Date(dateRange[1]).toLocaleDateString("mn-MN")}`
      : "Бүх хугацаа";

    const metaRows = [
      ["Нэхэмжлэхийн түүх тайлан"],
      [`Байгууллага: ${buildingName}`],
      [`Төлөв: ${formData.tuluv}`],
      [`Огноо: ${dateStr}`],
      [`Тайлан татсан: ${new Date().toLocaleString("mn-MN")}`],
      [""],
      ["Нийт нэхэмжилсэн:", dungiinKhuraangui.nekhemjilsen, ""],
      ["Төлсөн дүн:", dungiinKhuraangui.tulsun, ""],
      ["Нийт үлдэгдэл:", dungiinKhuraangui.uldegdel, ""],
      [""]
    ];

    // 2. Headers
    const headers = ["№", "Гэрээний дугаар", "Давхар", "Тоот", "Овог", "Нэр", "Огноо", "Төрөл", "Дүн", "Үлдэгдэл", "Төлөв", "Түүх"];

    // 3. Data Rows
    const rows = data.map((item, idx) => [
      idx + 1,
      item.gereeniiDugaar || "",
      item.davkhar || "",
      item.toot || "",
      item.ovog || "",
      item.ner || "",
      item.ognoo?.split("T")[0] || "",
      TUROL_NER[item.type || "invoice"] || "",
      item.tulbur || 0,
      item.uldegdel ?? "",
      item.tuluv || "",
      item.tuukh || "",
    ]);

    const escapeCsv = (val: any) => {
      const s = String(val);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      ...metaRows.map(r => r.map(escapeCsv).join(",")),
      headers.map(escapeCsv).join(","),
      ...rows.map(r => r.map(escapeCsv).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nekhemjlekhiin_tuukh_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 print-container bg-[color:var(--surface-bg)] min-h-screen h-full flex flex-col">
      <PrintStyles />

      {/* Print-only Header */}
      <div className="print-only mb-6">
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold uppercase">Нэхэмжлэхийн түүх тайлан</h1>
            <p className="text-sm mt-1">{baiguullaga?.ner || "Байгууллагын нэр"}</p>
          </div>
          <div className="text-right text-sm">
            <p>Огноо: {dateRange?.[0] && dateRange?.[1] 
              ? `${new Date(dateRange[0]).toLocaleDateString("mn-MN")} - ${new Date(dateRange[1]).toLocaleDateString("mn-MN")}`
              : "Бүх хугацаа"}</p>
            <p>Төлөв: {formData.tuluv}</p>
            <p>Хэвлэсэн: {new Date().toLocaleString("mn-MN")}</p>
          </div>
        </div>
        
        <div className="mt-6 border p-4 rounded bg-gray-50 flex justify-between items-center">
          <p className="font-semibold text-gray-700">НИЙТ ТӨЛБӨР:</p>
          <p className="text-2xl font-bold text-blue-700">{formatNumber(totalTulbur)} </p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Нэхэмжлэхийн түүх</h1>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel татах
          </button>
{/* <button
            onClick={handlePrint}
            className="neu-panel px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            Хэвлэх
          </button> */}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6 no-print">
        <div className="flex flex-col md:flex-row flex-wrap gap-4 no-print items-end">
          <div className="rounded-xl btn-minimal h-[40px] w-full md:w-[320px] flex items-center px-3">
            <StandardDatePicker
              isRange={true}
              value={dateRange}
              onChange={setDateRange}
              allowClear
              placeholder="Огноо сонгох"
              className="!h-full !w-full text-theme !px-0 flex items-center justify-center text-center border-0 shadow-none"
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
            <label className="block  mb-2">Гэрээний дугаар</label>
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
            <label className="block  mb-2">Байрны нэр</label>
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
            <label className="block  mb-2">Барилга</label>
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
            <label className="block  mb-2">Давхар</label>
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
            <label className="block  mb-2">Тоот</label>
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
            <label className="block  mb-2">Овог</label>
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
            <label className="block  mb-2">Нэр</label>
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
            <label className="block  mb-2">Хуудасны хэмжээ</label>
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

      {/* Дүнгийн хураангуй */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          {
            label: "Нийт нэхэмжилсэн",
            utga: dungiinKhuraangui.nekhemjilsen,
            tailbar: "Нэхэмжлэх + авлага",
            angi: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Төлсөн дүн",
            utga: dungiinKhuraangui.tulsun,
            tailbar: "Бүртгэгдсэн төлөлт",
            angi: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Нийт үлдэгдэл",
            utga: dungiinKhuraangui.uldegdel,
            tailbar: "Нэхэмжилсэн − төлсөн",
            angi:
              dungiinKhuraangui.uldegdel > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="neu-panel rounded-2xl p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-theme opacity-70">{k.label}</span>
            <span className={`text-xl font-semibold ${k.angi}`}>
              {formatNumber(k.utga)}₮
            </span>
            <span className="text-[11px] text-theme opacity-50">
              {k.tailbar}
            </span>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[48vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Гэрээний дугаар
                  </th>
                  {/* <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Байрны нэр
                  </th> */}
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Давхар
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Тоот
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Овог
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Огноо
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төрөл
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-right whitespace-nowrap">
                    Дүн
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-right whitespace-nowrap">
                    Үлдэгдэл
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Төлөв
                  </th>
                  <th className="z-10 p-3 text-xs  text-theme text-center whitespace-nowrap">
                    Түүх
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-theme">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-theme">
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
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] border ${
                              TUROL_ANGI[item.type || "invoice"] ||
                              TUROL_ANGI.invoice
                            }`}
                          >
                            {TUROL_NER[item.type || "invoice"] || "Нэхэмжлэх"}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right whitespace-nowrap ${
                            item.type === "payment"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-theme"
                          }`}
                        >
                          {item.type === "payment" ? "+" : ""}
                          {formatNumber(item.tulbur)}₮
                        </td>
                        <td className="p-3 text-right text-theme whitespace-nowrap">
                          {typeof item.uldegdel === "number"
                            ? `${formatNumber(item.uldegdel)}₮`
                            : "—"}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs  ${
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
              {/* Доод нийлбэрийг ӨӨР <table>-д биш, мөн хүснэгтийн <tfoot>-д
                  байрлуулав — өмнө нь тусдаа хүснэгт байсан тул баганын өргөн
                  таарахгүй, тоо нь өөр багана дээр буудаг байв. */}
              {data.length > 0 && (
                <tfoot className="border-t dark:border-gray-800 border-gray-100">
                  <tr>
                    <td colSpan={7} className="p-3 text-right text-theme text-xs opacity-70">
                      Нийт {data.length} бичлэг
                    </td>
                    <td className="p-3 text-center text-theme text-xs opacity-70">
                      Дүн
                    </td>
                    <td className="p-3 text-right text-theme whitespace-nowrap font-semibold">
                      {formatNumber(dungiinKhuraangui.nekhemjilsen)}₮
                    </td>
                    <td className="p-3 text-right whitespace-nowrap font-semibold text-rose-600 dark:text-rose-400">
                      {formatNumber(dungiinKhuraangui.uldegdel)}₮
                    </td>
                    <td className="p-3" />
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="text-sm text-theme">Нийт: {data.length}</div>
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
            <div className="text-theme px-1">{currentPage}</div>
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
