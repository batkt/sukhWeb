"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, Plus, Edit, Trash2, Car } from "lucide-react";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";

interface Vehicle {
  _id?: string;
  ulsiinDugaar: string;
  mark: string;
  zagvar: string;
  ongo: string;
  ezemshliinNer: string;
  utas: string;
  orshinSuugchId?: string;
  zogsooliinBairlal?: string;
  tulburiinTurul?: "sariin" | "tsagiin";
  orokhOgnoo?: string;
  garakhOgnoo?: string;
  tulbur?: number;
  status?: "idle" | "active" | "expired";
}

export default function Jagsaalt() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const shouldFetch =
    isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: vehiclesData, mutate } = useSWR(
    shouldFetch
      ? [
          "/zogsool/jagsaalt",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
        ]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: page,
          khuudasniiKhemjee: pageSize,
          search: searchTerm || undefined,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const vehicles: Vehicle[] = useMemo(
    () => vehiclesData?.jagsaalt || [],
    [vehiclesData]
  );

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return vehicles;
    const term = searchTerm.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.ulsiinDugaar?.toLowerCase().includes(term) ||
        v.ezemshliinNer?.toLowerCase().includes(term) ||
        v.mark?.toLowerCase().includes(term) ||
        v.utas?.includes(term)
    );
  }, [vehicles, searchTerm]);

  const totalPages = Math.ceil(
    (vehiclesData?.niitMur || 0) / pageSize
  );

  return (
    <div className="h-full overflow-hidden custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl  text-[color:var(--panel-text)]">
            Зогсоолын жагсаалт
          </h1>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)]" />
              <input
                type="text"
                placeholder="Хайх..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--theme)] text-white hover:opacity-90 transition">
              <Plus className="w-4 h-4" />
              Машин нэмэх
            </button>
          </div>
        </div>

        <div className="neu-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[color:var(--surface)] border-b border-[color:var(--surface-border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Улсын дугаар
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Марк, загвар
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Өнгө
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Эзэмшлийн нэр
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Утас
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Зогсоолын байрлал
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Орох цаг
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Төлбөр
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[color:var(--panel-text)]">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-[color:var(--muted-text)]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Car className="w-12 h-12 opacity-50" />
                        <p>Машины мэдээлэл олдсонгүй</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle, idx) => (
                    <tr
                      key={vehicle._id || idx}
                      className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition"
                    >
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[color:var(--panel-text)]">
                        {vehicle.ulsiinDugaar || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.mark && vehicle.zagvar
                          ? `${vehicle.mark} ${vehicle.zagvar}`
                          : vehicle.mark || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.ongo || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.ezemshliinNer || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.utas || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.zogsooliinBairlal || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.orokhOgnoo
                          ? moment(vehicle.orokhOgnoo).format("YYYY-MM-DD HH:mm")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--panel-text)]">
                        {vehicle.tulbur ? `${vehicle.tulbur}₮` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-blue-600 transition"
                            title="Засах"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-[color:var(--surface-hover)] text-red-600 transition"
                            title="Устгах"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition"
            >
              Өмнөх
            </button>
            <span className="px-4 py-2 text-sm text-[color:var(--panel-text)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition"
            >
              Дараах
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
