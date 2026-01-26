"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, Car, User, Phone, MapPin } from "lucide-react";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import moment from "moment";

interface ResidentParking {
  _id?: string;
  orshinSuugchId: string;
  orshinSuugchNer: string;
  utas: string;
  toot?: string;
  mashinuud: Array<{
    _id?: string;
    ulsiinDugaar: string;
    mark: string;
    zagvar?: string;
    zogsooliinBairlal?: string;
    tulburiinTurul?: "sariin" | "tsagiin";
    tulbur?: number;
    orokhOgnoo?: string;
  }>;
  niitTulbur?: number;
  tulburiinTuukh?: Array<{
    ognoo: string;
    dun: number;
    status: "paid" | "unpaid";
  }>;
}

export default function OrshinSuugch() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const shouldFetch =
    isInitialized && !!token && !!ajiltan?.baiguullagiinId;

  const { data: residentsData } = useSWR(
    shouldFetch
      ? [
          "/zogsool/orshinSuugch",
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

  const residents: ResidentParking[] = useMemo(
    () => residentsData?.jagsaalt || [],
    [residentsData]
  );

  const filteredResidents = useMemo(() => {
    if (!searchTerm) return residents;
    const term = searchTerm.toLowerCase();
    return residents.filter(
      (r) =>
        r.orshinSuugchNer?.toLowerCase().includes(term) ||
        r.utas?.includes(term) ||
        r.toot?.includes(term) ||
        r.mashinuud?.some(
          (m) =>
            m.ulsiinDugaar?.toLowerCase().includes(term) ||
            m.mark?.toLowerCase().includes(term)
        )
    );
  }, [residents, searchTerm]);

  const totalPages = Math.ceil(
    (residentsData?.niitMur || 0) / pageSize
  );

  return (
    <div className="h-full overflow-hidden custom-scrollbar">
      <div className="min-h-full p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[color:var(--panel-text)]">
            Оршин суугчийн зогсоол
          </h1>
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
        </div>

        <div className="space-y-4">
          {filteredResidents.length === 0 ? (
            <div className="neu-panel rounded-2xl p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50 text-[color:var(--muted-text)]" />
              <p className="text-[color:var(--muted-text)]">
                Оршин суугчийн мэдээлэл олдсонгүй
              </p>
            </div>
          ) : (
            filteredResidents.map((resident) => (
              <div
                key={resident._id}
                className="neu-panel rounded-2xl p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[color:var(--theme)]/10">
                      <User className="w-6 h-6 text-[color:var(--theme)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--panel-text)] mb-1">
                        {resident.orshinSuugchNer || "Нэр тодорхойгүй"}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted-text)]">
                        {resident.toot && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>Тоот: {resident.toot}</span>
                          </div>
                        )}
                        {resident.utas && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{resident.utas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {resident.niitTulbur !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-[color:var(--muted-text)] mb-1">
                        Нийт төлбөр
                      </p>
                      <p className="text-xl font-bold text-[color:var(--panel-text)]">
                        {resident.niitTulbur.toLocaleString()} ₮
                      </p>
                    </div>
                  )}
                </div>

                {resident.mashinuud && resident.mashinuud.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[color:var(--surface-border)]">
                    <h4 className="text-sm font-semibold text-[color:var(--panel-text)] mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Машинууд ({resident.mashinuud.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resident.mashinuud.map((mashin, idx) => (
                        <div
                          key={mashin._id || idx}
                          className="p-3 rounded-lg bg-[color:var(--surface)] border border-[color:var(--surface-border)]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-[color:var(--panel-text)]">
                              {mashin.ulsiinDugaar}
                            </span>
                            {mashin.tulburiinTurul && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                {mashin.tulburiinTurul === "sariin"
                                  ? "Сарын"
                                  : "Цагийн"}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-[color:var(--muted-text)] space-y-1">
                            {mashin.mark && (
                              <p>
                                {mashin.mark} {mashin.zagvar || ""}
                              </p>
                            )}
                            {mashin.zogsooliinBairlal && (
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {mashin.zogsooliinBairlal}
                              </p>
                            )}
                            {mashin.tulbur && (
                              <p className="font-semibold text-[color:var(--panel-text)]">
                                {mashin.tulbur.toLocaleString()} ₮
                              </p>
                            )}
                            {mashin.orokhOgnoo && (
                              <p className="text-xs">
                                Орох:{" "}
                                {moment(mashin.orokhOgnoo).format(
                                  "YYYY-MM-DD HH:mm"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resident.tulburiinTuukh &&
                  resident.tulburiinTuukh.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[color:var(--surface-border)]">
                      <h4 className="text-sm font-semibold text-[color:var(--panel-text)] mb-3">
                        Төлбөрийн түүх
                      </h4>
                      <div className="space-y-2">
                        {resident.tulburiinTuukh
                          .slice(0, 5)
                          .map((tulbur, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-[color:var(--surface)]"
                            >
                              <div>
                                <p className="text-sm text-[color:var(--panel-text)]">
                                  {moment(tulbur.ognoo).format("YYYY-MM-DD")}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-[color:var(--panel-text)]">
                                  {tulbur.dun.toLocaleString()} ₮
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    tulbur.status === "paid"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  }`}
                                >
                                  {tulbur.status === "paid" ? "Төлсөн" : "Төлөөгүй"}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
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
