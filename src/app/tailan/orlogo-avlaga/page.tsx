"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye } from "lucide-react";
import { useAshiglaltiinZardluud } from "@/lib/useAshiglaltiinZardluud";
import { useBuilding } from "@/context/BuildingContext";
import { useAuth } from "@/lib/useAuth";
import useBaiguullaga from "@/lib/useBaiguullaga";
import uilchilgee from "@/lib/uilchilgee";
import DatePickerInput from "../../../components/ui/DatePickerInput";
import formatNumber from "../../../../tools/function/formatNumber";
import PageSongokh from "../../../../components/selectZagvar/pageSongokh";

interface OrlogoAvlagaItem {
  gereeniiDugaar: string;
  ovog: string;
  ner: string;
  utas: string[];
  toot: string;
  davkhar: string;
  bairNer?: string;
  orts?: string;
}

export default function OrlogoAvlagaPage() {
  const { selectedBuildingId } = useBuilding();
  const { token, ajiltan } = useAuth();
  const { baiguullaga } = useBaiguullaga(
    token || null,
    ajiltan?.baiguullagiinId || null
  );
  const [data, setData] = useState<OrlogoAvlagaItem[]>([]);
  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([null, null]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isNekhOpen, setIsNekhOpen] = useState(false);
  // nekhData will hold { grouped: {month, items, total}[], allZardluud: any[] }
  const [nekhData, setNekhData] = useState<any | null>(null);
  const [nekhLoading, setNekhLoading] = useState(false);
  const [nekhError, setNekhError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const { zardluud: globalZardluud } = useAshiglaltiinZardluud({
    token: token ?? undefined,
    baiguullagiinId: baiguullaga?._id,
    barilgiinId: selectedBuildingId || null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBuildingId || !baiguullaga) return;

      try {
        setLoading(true);
        const response = await uilchilgee(token ?? undefined).post(
          "/tailan/orlogo-avlaga",
          {
            baiguullagiinId: baiguullaga._id,
            barilgiinId: selectedBuildingId,
            bairNer: undefined,
            orts: undefined,
            davkhar: undefined,
            toot: undefined,
            ekhlekhOgnoo: dateRange?.[0] || undefined,
            duusakhOgnoo: dateRange?.[1] || undefined,
          }
        );
        setApiResponse(response.data);
        // merge paid and unpaid lists and sort newest-first (prefer createdAt, then ognoo)
        const paid = Array.isArray(response.data?.paid?.list)
          ? response.data.paid.list
          : [];
        const unpaid = Array.isArray(response.data?.unpaid?.list)
          ? response.data.unpaid.list
          : [];
        const combined = paid.concat(unpaid);
        combined.sort((a: any, b: any) => {
          const ta = a?.createdAt
            ? new Date(a.createdAt).getTime()
            : a?.ognoo
            ? new Date(a.ognoo).getTime()
            : 0;
          const tb = b?.createdAt
            ? new Date(b.createdAt).getTime()
            : b?.ognoo
            ? new Date(b.ognoo).getTime()
            : 0;
          return tb - ta;
        });
        setData(combined);
      } catch (err: any) {
        setError(err?.response?.data?.aldaa || err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBuildingId, baiguullaga, token, dateRange]);

  const totalOrlogo = useMemo(() => {
    return apiResponse?.paid?.sum || 0;
  }, [apiResponse]);

  const totalZarlaga = useMemo(() => {
    return apiResponse?.unpaid?.sum || 0;
  }, [apiResponse]);

  const totalUldegdel = useMemo(() => {
    return totalOrlogo - totalZarlaga;
  }, [totalOrlogo, totalZarlaga]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Уншиж байна...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Алдаа: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl ">Орлого авлага</h1>
        <div className="w-full md:w-[320px]">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Нийт орлого</h3>
          <p className="text-2xl  text-green-600">
            {formatNumber(totalOrlogo)} ₮
          </p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Нийт зарлага</h3>
          <p className="text-2xl  text-red-600">
            {formatNumber(totalZarlaga)} ₮
          </p>
        </div>
        <div className="neu-panel p-4 rounded-xl">
          <h3 className="font-semibold mb-2">Үлдэгдэл</h3>
          <p
            className={`text-2xl  ${
              totalUldegdel >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatNumber(totalUldegdel)} ₮
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl w-full">
        <div className="rounded-3xl p-6 mb-1 neu-table allow-overflow">
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar w-full">
            <table className="table-ui text-sm min-w-full">
              <thead>
                <tr>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap w-12">
                    №
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Гэрээний дугаар
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Овог
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Нэр
                  </th>

                  {/* <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">Тоот</th> */}
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Давхар
                  </th>
                  <th className="z-10 p-3 text-xs font-semibold text-theme text-center whitespace-nowrap">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-theme/60">
                      Мэдээлэл алга байна
                    </td>
                  </tr>
                ) : (
                  data
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((item, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors border-b last:border-b-0"
                      >
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.gereeniiDugaar}
                        </td>
                        <td className="p-3 text-left text-theme whitespace-nowrap">
                          {item.ovog}
                        </td>
                        <td className="p-3 text-left text-theme whitespace-nowrap">
                          {item.ner}
                        </td>

                        {/* <td className="p-3 text-center text-theme whitespace-nowrap">{item.toot}</td> */}
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          {item.davkhar}
                        </td>
                        <td className="p-3 text-center text-theme whitespace-nowrap">
                          <button
                            className="btn-minimal-sm btn-minimal px-2 py-1 text-xs"
                            onClick={async () => {
                              setSelectedContract(item.gereeniiDugaar || null);
                              setIsNekhOpen(true);
                              setNekhLoading(true);
                              setNekhError(null);
                              try {
                                const resp = await uilchilgee(
                                  token ?? undefined
                                ).post("/tailan/nekhemjlekhiin-tuukh", {
                                  baiguullagiinId: baiguullaga?._id,
                                  barilgiinId: selectedBuildingId,
                                  gereeniiDugaar: item.gereeniiDugaar,
                                  khuudasniiKhemjee: 1000,
                                });
                                const raw = Array.isArray(resp.data?.list)
                                  ? resp.data.list
                                  : Array.isArray(resp.data)
                                  ? resp.data
                                  : [];
                                const groups: Record<string, any[]> = {};
                                const allZardluud: any[] = [];
                                raw.forEach((r: any) => {
                                  const month = r.ognoo
                                    ? r.ognoo.split("T")[0].slice(0, 7)
                                    : "unknown";
                                  if (!groups[month]) groups[month] = [];
                                  groups[month].push(r);

                                  // Collect ashiglaltiin zardluud from each record (if present)
                                  const z = Array.isArray(r?.medeelel?.zardluud)
                                    ? r.medeelel.zardluud
                                    : Array.isArray(r?.zardluud)
                                    ? r.zardluud
                                    : [];
                                  z.forEach((zz: any) => allZardluud.push(zz));
                                });
                                const grouped = Object.keys(groups)
                                  .sort((a, b) => b.localeCompare(a))
                                  .map((m) => ({
                                    month: m,
                                    items: groups[m],
                                    total: groups[m].reduce(
                                      (s: any, it: any) =>
                                        s + (it.niitTulbur || it.tulbur || 0),
                                      0
                                    ),
                                  }));
                                setNekhData({ grouped, allZardluud, raw });
                              } catch (e: any) {
                                setNekhError(
                                  e?.response?.data?.aldaa ||
                                    e.message ||
                                    "Unknown error"
                                );
                              } finally {
                                setNekhLoading(false);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
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

          {/* <div className="flex items-center justify-between px-2 py-1 text-xs mt-4">
            <div className="text-theme/70">Нийт: {data.length}</div>
            <div className="flex items-center gap-3">
              <PageSongokh
                value={pageSize}
                onChange={(v) => {
                  setPageSize(v);
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1"
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
          </div> */}
        </div>
      </div>

      {isNekhOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsNekhOpen(false)}
          />
          <div className="bg-white max-h-[80vh] dark:bg-gray-900 rounded-2xl shadow-lg z-10 w-full max-w-3xl overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">
                Нэхэмжлэхийн түүх - {selectedContract}
              </h3>
              <button
                className="btn-minimal"
                onClick={() => setIsNekhOpen(false)}
              >
                Хаах
              </button>
            </div>
            <div className="p-4">
              {nekhLoading ? (
                <div className="p-6 text-center">Уншиж байна...</div>
              ) : nekhError ? (
                <div className="text-red-500 p-4">Алдаа: {nekhError}</div>
              ) : !nekhData ||
                (Array.isArray(nekhData.grouped) &&
                  nekhData.grouped.length === 0 &&
                  (!Array.isArray(nekhData.allZardluud) ||
                    nekhData.allZardluud.length === 0)) ? (
                <div className="p-4">Мэдээлэл алга байна</div>
              ) : (
                <div className="space-y-6">
                  {/* Show aggregated ashiglaltiin zardluud first */}
                  {Array.isArray(nekhData.allZardluud) &&
                    nekhData.allZardluud.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Зардлууд</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {(() => {
                            const map = new Map<
                              string,
                              {
                                key: string;
                                name: string;
                                amount: number;
                                count: number;
                              }
                            >();
                            (nekhData.allZardluud || []).forEach((z: any) => {
                              const key =
                                z._id ||
                                z.zardalId ||
                                String(z.ner || z.name || "unknown");
                              const amt =
                                Number(z.dun ?? z.tulukhDun ?? z.tariff ?? 0) ||
                                0;
                              const existing = map.get(key) || {
                                key,
                                name: z.ner || z.name || "",
                                amount: 0,
                                count: 0,
                              };
                              existing.amount += amt;
                              existing.count += 1;
                              if (!existing.name) {
                                const g = (globalZardluud || []).find(
                                  (gg: any) => String(gg._id) === String(key)
                                );
                                if (g) existing.name = g.ner || existing.name;
                              }
                              map.set(key, existing);
                            });
                            const arr = Array.from(map.values());
                            return arr.map((it) => (
                              <div
                                key={it.key}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <div className="truncate">
                                  {it.name || it.key}
                                </div>
                                <div className="font-medium">
                                  {formatNumber(it.amount)} ₮
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                  {/* Then show grouped monthly invoice items */}
                  {Array.isArray(nekhData.grouped) &&
                    nekhData.grouped.length > 0 &&
                    nekhData.grouped.map((g: any) => (
                      <div key={g.month} className="mb-4">
                        <h4 className="font-medium mb-2">
                          {g.month} — Нийт: {formatNumber(g.total)} ₮
                        </h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left p-2">Огноо</th>
                              <th className="text-right p-2">Төлбөр</th>
                              <th className="p-2 text-right">Төлөв</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.items.map((it: any, i: number) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">
                                  {it.ognoo
                                    ? it.ognoo.split("T")[0].replace(/-/g, ".")
                                    : it.ognoo}
                                </td>
                                <td className="p-2 text-right">
                                  {formatNumber(
                                    it.niitTulbur || it.tulbur || 0
                                  )}{" "}
                                  ₮
                                </td>
                                <td className="p-2 text-right">{it.tuluv || ""}</td>
                              </tr>
                            ))}

                        
                            {/* {Array.isArray(nekhData.raw) &&
                              nekhData.raw.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Бичлэгүүд (nekhemjlekhiinTuukh)
                                  </h4>
                                  <div className="space-y-3 text-sm">
                                    {nekhData.raw.map(
                                      (rec: any, ri: number) => {
                                        const recDate =
                                          rec.ognoo || rec.createdAt || "-";
                                        const recNumber =
                                          rec.dugaalaltDugaar ||
                                          rec.gereeniiDugaar ||
                                          rec.invoiceNo ||
                                          `#${ri + 1}`;
                                        const recTotal = Number(
                                          rec.niitTulbur ??
                                            rec.niitDun ??
                                            rec.total ??
                                            0
                                        );
                                        const rows = Array.isArray(
                                          rec?.medeelel?.zardluud
                                        )
                                          ? rec.medeelel.zardluud
                                          : Array.isArray(rec?.zardluud)
                                          ? rec.zardluud
                                          : [];
                                        return (
                                          <div
                                            key={ri}
                                            className="p-3 border rounded-2xl"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="text-sm">
                                                <div className="font-medium">
                                                  {recNumber}
                                                </div>
                                                <div className="text-xs text-theme/70">
                                                  {recDate &&
                                                    String(recDate)
                                                      .split("T")[0]
                                                      .replace(/-/g, ".")}
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="font-medium">
                                                  {formatNumber(recTotal)} ₮
                                                </div>
                                              </div>
                                            </div>
                                            {rows.length === 0 ? (
                                              <div className="text-theme/60 text-sm">
                                                Зардал оруулаагүй
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-1 gap-2">
                                                {rows.map(
                                                  (z: any, zi: number) => (
                                                    <div
                                                      key={zi}
                                                      className="flex items-center justify-between text-sm"
                                                    >
                                                      <div className="truncate">
                                                        {z.ner ||
                                                          z.name ||
                                                          z.tailbar ||
                                                          "-"}
                                                      </div>
                                                      <div className="font-medium">
                                                        {formatNumber(
                                                          z.dun ||
                                                            z.tulukhDun ||
                                                            z.tariff ||
                                                            0
                                                        )}{" "}
                                                        ₮
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )} */}
                          </tbody>
                        </table>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
