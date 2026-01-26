"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import { Search, Calendar, DollarSign, Video, VideoOff, Maximize2, Minimize2, X } from "lucide-react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import moment from "moment";
import useSWR from "swr";
import uilchilgee from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import R2WPlayerComponent from "@/components/R2WPlayerComponent";
import { useParkingSocket, type Uilchluulegch } from "@/lib/useParkingSocket";
import { Wifi, WifiOff, Bell } from "lucide-react";

export default function Camera() {
  const { token, ajiltan, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => toISODate(today), [today]);
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toISODate(d);
  }, [today]);

  const [dateRange, setDateRange] = useState<
    [string | null, string | null] | undefined
  >([defaultStart, defaultEnd]);

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    const end = (dateRange?.[1] as string) || defaultEnd;
    const start = (dateRange?.[0] as string) || defaultStart;
    return { start, end };
  }, [dateRange, defaultEnd, defaultStart]);

  const shouldFetch = !!token && !!ajiltan?.baiguullagiinId;

  // Socket.IO for real-time parking entries
  const { parkingEntries, isConnected: isSocketConnected, connectionError: socketError, clearEntries: clearParkingEntries, isLoadingInitial } = useParkingSocket({
    baiguullagiinId: ajiltan?.baiguullagiinId,
    barilgiinId: effectiveBarilgiinId,
    token: token || undefined,
    enabled: !!ajiltan?.baiguullagiinId,
    maxEntries: 20, // Keep last 20 real-time entries
    loadInitialEntries: true,
  });

  // Fetch parking configuration to get camera IPs
  const { data: parkingConfigData } = useSWR(
    shouldFetch
      ? ["/parking", token, ajiltan?.baiguullagiinId, effectiveBarilgiinId]
      : null,
    async ([url, tkn, bId, barId]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 100,
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  // Extract cameras from parking configuration
  const cameras = useMemo(() => {
    const parkingList = Array.isArray(parkingConfigData?.jagsaalt)
      ? parkingConfigData.jagsaalt
      : Array.isArray(parkingConfigData)
      ? parkingConfigData
      : [];
    
    const allCameras: Array<{
      cameraIP: string;
      cameraPort: number; // RTSP port
      httpPort?: number; // HTTP port for fallback
      cameraType: "entry" | "exit";
      cameraName?: string;
      gateName?: string;
      cameraUsername?: string;
      cameraPassword?: string;
      root?: string; // Stream path (ROOT from tokhirgoo)
      tokhirgoo?: {
        USER?: string;
        PASSWD?: string;
        ROOT?: string;
        PORT?: string;
        dotorKamerEsekh?: boolean;
      };
    }> = [];

    parkingList.forEach((parking: any) => {
      if (Array.isArray(parking?.khaalga)) {
        parking.khaalga.forEach((gate: any) => {
          if (Array.isArray(gate?.camera)) {
            gate.camera.forEach((cam: any) => {
              if (cam?.cameraIP) {
                // For RTSP, use tokhirgoo.PORT if available, otherwise default to 554 (RTSP standard port)
                // For HTTP fallback, use cameraPort or 80
                const rtspPort = cam.tokhirgoo?.PORT 
                  ? Number(cam.tokhirgoo.PORT) 
                  : 554; // RTSP default port
                const httpPort = cam.cameraPort || 80;
                
                // Extract username and password from tokhirgoo object
                const username = cam.tokhirgoo?.USER || cam.cameraUsername || "";
                const password = cam.tokhirgoo?.PASSWD || cam.cameraPassword || "";
                
                allCameras.push({
                  cameraIP: cam.cameraIP,
                  cameraPort: rtspPort, // Use RTSP port for streaming
                  httpPort: httpPort, // Keep HTTP port for fallback
                  cameraType: cam.cameraType || (gate.turul === "Орох" ? "entry" : "exit"),
                  cameraName: cam.cameraName || cam.cameraIP,
                  gateName: gate.ner,
                  cameraUsername: username,
                  cameraPassword: password,
                  tokhirgoo: cam.tokhirgoo,
                  root: cam.tokhirgoo?.ROOT || "stream", // Use ROOT from tokhirgoo, default to "stream"
                });
              }
            });
          }
        });
      }
    });

    return allCameras;
  }, [parkingConfigData]);

  // Separate entry and exit cameras
  const entryCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "entry"),
    [cameras]
  );
  const exitCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "exit"),
    [cameras]
  );

  // Fetch Uilchluulegch list
  const { data: transactionsData } = useSWR(
    shouldFetch && rangeStart && rangeEnd
      ? [
          "/uilchluulegch",
          token,
          ajiltan?.baiguullagiinId,
          effectiveBarilgiinId,
          rangeStart,
          rangeEnd,
          page,
          searchTerm,
        ]
      : null,
    async ([url, tkn, bId, barId, start, end, p, search]): Promise<any> => {
      const resp = await uilchilgee(tkn).get(url, {
        params: {
          baiguullagiinId: bId,
          ...(barId ? { barilgiinId: barId } : {}),
          khuudasniiDugaar: p,
          khuudasniiKhemjee: pageSize,
          ...(search ? { search: search } : {}),
          ...(start ? { startDate: start } : {}),
          ...(end ? { endDate: end } : {}),
        },
      });
      return resp.data;
    },
    { revalidateOnFocus: false }
  );

  const transactions: Uilchluulegch[] = useMemo(() => {
    const data = transactionsData;
    if (!data) return [];
    
    // Handle different response formats
    if (Array.isArray(data?.jagsaalt)) return data.jagsaalt;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    
    return [];
  }, [transactionsData]);

  const stats = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + (t.niitDun || 0), 0);
    // Paid: tuluv !== 0 (exited/paid), Unpaid: tuluv === 0 (active/unpaid)
    const paid = transactions
      .filter((t) => t.tuukh?.[0]?.tuluv !== 0 && t.tuukh?.[0]?.tuluv !== undefined)
      .reduce((sum, t) => sum + (t.niitDun || 0), 0);
    const unpaid = transactions
      .filter((t) => t.tuukh?.[0]?.tuluv === 0)
      .reduce((sum, t) => sum + (t.niitDun || 0), 0);
    const count = transactions.length;
    const paidCount = transactions.filter((t) => t.tuukh?.[0]?.tuluv !== 0 && t.tuukh?.[0]?.tuluv !== undefined).length;

    return { total, paid, unpaid, count, paidCount };
  }, [transactions]);

  const totalPages = Math.ceil(
    (transactionsData?.niitMur || transactionsData?.count || transactions.length) / pageSize
  );

  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="min-h-full p-3 sm:p-4 pb-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[color:var(--panel-text)]">
                Камер касс
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[color:var(--muted-text)]" />
                <input
                  type="text"
                  placeholder="Хайх..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.currentTarget.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme)]"
                />
              </div>
              <div className="min-w-[200px]">
                <DatePickerInput
                  type="range"
                  value={dateRange}
                  onChange={(v: any) => {
                    setDateRange(v);
                    setPage(1);
                  }}
                  valueFormat="YYYY-MM-DD"
                  className="w-full"
                  clearable
                />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Parking Entries Notification */}
        {parkingEntries.length > 0 && (
          <div className="neu-panel rounded-lg p-3 mb-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-[color:var(--panel-text)]">
                  Шинэ орлого ({parkingEntries.length})
                </h3>
              </div>
              <button
                onClick={clearParkingEntries}
                className="text-xs text-[color:var(--muted-text)] hover:text-[color:var(--panel-text)] transition"
              >
                Цэвэрлэх
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {parkingEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-2 rounded bg-[color:var(--surface)] border border-[color:var(--surface-border)]"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${entry.tuukh?.[0]?.tuluv === 0 ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                    <span className="text-xs font-medium text-[color:var(--panel-text)]">
                      {entry.mashiniiDugaar}
                    </span>
                    <span className="text-xs text-[color:var(--muted-text)]">
                      {entry.tuukh?.[0]?.orsonKhaalga || 'N/A'}
                    </span>
                    {entry.niitDun !== undefined && entry.niitDun > 0 && (
                      <span className="text-xs font-semibold text-green-600">
                        {formatCurrency(entry.niitDun)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[color:var(--muted-text)]">
                    {entry.createdAt ? moment(entry.createdAt).format("HH:mm:ss") : '-'}
                  </span>
                </div>
              ))}
              {parkingEntries.length > 5 && (
                <div className="text-xs text-center text-[color:var(--muted-text)] pt-1">
                  +{parkingEntries.length - 5} илүү
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Streaming Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          {/* Entry Camera Stream */}
          <div className="neu-panel rounded-xl overflow-hidden border-l-4 border-l-green-500">
            <div className="p-3 border-b border-[color:var(--surface-border)] bg-green-50/50 dark:bg-green-900/10">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-green-500" />
                <h2 className="text-base font-semibold text-green-700 dark:text-green-400">
                  Орох камер
                </h2>
                {entryCameras.length > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    {entryCameras.length}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              {entryCameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <VideoOff className="w-10 h-10 text-[color:var(--muted-text)] opacity-50 mb-2" />
                  <p className="text-sm text-[color:var(--muted-text)]">
                    Орох камер тохиргоогүй байна
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entryCameras.map((camera, idx) => (
                    <div key={idx} className="space-y-2 group/cam">
                      {camera.gateName && (
                        <p className="text-xs font-medium text-[color:var(--panel-text)]">
                          {camera.gateName} - {camera.cameraName}
                        </p>
                      )}
                      <div className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-green-500/30 group-hover/cam:border-green-500 transition-all duration-200" style={{ aspectRatio: "16/9", transform: "translateZ(0)", willChange: "transform" }}>
                        <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="entry"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exit Camera Stream */}
          <div className="neu-panel rounded-xl overflow-hidden border-l-4 border-l-red-500">
            <div className="p-3 border-b border-[color:var(--surface-border)] bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                <h2 className="text-base font-semibold text-red-700 dark:text-red-400">
                  Гарах камер
                </h2>
                {exitCameras.length > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                    {exitCameras.length}
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              {exitCameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <VideoOff className="w-10 h-10 text-[color:var(--muted-text)] opacity-50 mb-2" />
                  <p className="text-sm text-[color:var(--muted-text)]">
                    Гарах камер тохиргоогүй байна
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exitCameras.map((camera, idx) => (
                    <div key={idx} className="space-y-2 group/cam">
                      {camera.gateName && (
                        <p className="text-xs font-medium text-[color:var(--panel-text)]">
                          {camera.gateName} - {camera.cameraName}
                        </p>
                      )}
                      <div className="relative w-full bg-black rounded-lg overflow-hidden border-2 border-red-500/30 group-hover/cam:border-red-500 transition-all duration-200" style={{ aspectRatio: "16/9", transform: "translateZ(0)", willChange: "transform" }}>
                        <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="exit"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="neu-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--surface)] border-b border-[color:var(--surface-border)]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    №
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Дугаар
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Орсон
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Гарсан
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Хугацаа/мин
                  </th>
                   <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                     Камер
                   </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Хөнгөлөлт
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Дүн
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Төлбөр
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    И-Баримт
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Төлөв
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[color:var(--panel-text)]">
                    Шалтгаан
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-[color:var(--muted-text)]"
                    >
                      Гүйлгээний мэдээлэл олдсонгүй
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, idx) => {
                    const orsonTsag = transaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag;
                    const garsanTsag = transaction.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag;
                    const durationMinutes = orsonTsag && garsanTsag
                      ? Math.round(moment(garsanTsag).diff(moment(orsonTsag), 'minutes', true))
                      : orsonTsag
                      ? Math.round(moment().diff(moment(orsonTsag), 'minutes', true))
                      : null;
                    
                    // Calculate payment amount from tulbur array
                    const tulburAmount = transaction.tuukh?.[0]?.tulbur?.reduce((sum: number, t: any) => sum + (t.tulbur || 0), 0) || 0;
                    
                    // Status: tuluv === 0 means active/unpaid, tuluv !== 0 means exited/paid
                    const isPaid = transaction.tuukh?.[0]?.tuluv !== 0 && transaction.tuukh?.[0]?.tuluv !== undefined;
                    
                    return (
                      <tr
                        key={transaction._id || idx}
                        className="border-b border-[color:var(--surface-border)] hover:bg-[color:var(--surface-hover)] transition"
                      >
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-[color:var(--panel-text)]">
                          {transaction.mashiniiDugaar || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {orsonTsag
                            ? moment(orsonTsag).format("YYYY-MM-DD HH:mm")
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {garsanTsag
                            ? moment(garsanTsag).format("YYYY-MM-DD HH:mm")
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {durationMinutes !== null ? durationMinutes : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {transaction.tuukh?.[0]?.orsonKhaalga || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {/* Хөнгөлөлт - discount, if available */}
                          {"-"}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-[color:var(--panel-text)]">
                          {transaction.niitDun ? formatCurrency(transaction.niitDun) : "0.00 ₮"}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold text-[color:var(--panel-text)]">
                          {tulburAmount > 0 ? formatCurrency(tulburAmount) : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {/* И-Баримт - invoice number, if available */}
                          {"-"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium ${
                              isPaid
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {isPaid ? "Төлсөн" : "Төлөөгүй"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-[color:var(--panel-text)]">
                          {transaction.zurchil || "-"}
                        </td>
                      </tr>
                    );
                  })
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
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Өмнөх
            </button>
            <span className="px-4 py-2 text-sm text-[color:var(--panel-text)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Дараах
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт орлого
                </p>
                <p className="text-lg font-bold text-[color:var(--panel-text)]">
                  {formatCurrency(stats.total)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлсөн
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.paid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Төлөөгүй
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(stats.unpaid)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт тоо
                </p>
                <p className="text-lg font-bold text-[color:var(--panel-text)]">
                  {stats.count}
                </p>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Төлсөн: {stats.paidCount}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Camera Stream Component using R2WPlayer
function CameraStream({
  ip,
  port,
  name,
  username,
  password,
  root = "stream",
  gateName,
  cameraType,
}: {
  ip: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
  root?: string; // Stream path (ROOT from tokhirgoo, e.g., "live", "stream")
  gateName?: string;
  cameraType?: "entry" | "exit";
}) {
  const [error, setError] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  const handleError = (err: any) => {
    console.error("R2WPlayer error:", err);
    setError(true);
  };

  const handleConnectionStateChange = (state: string) => {
    setConnectionState(state);
    if (state === "failed" || state === "disconnected") {
      setError(true);
    } else if (state === "connected") {
      setError(false);
    }
  };

  const toggleFullscreen = () => {
    if (!streamContainerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (streamContainerRef.current.requestFullscreen) {
        streamContainerRef.current.requestFullscreen();
      } else if ((streamContainerRef.current as any).webkitRequestFullscreen) {
        (streamContainerRef.current as any).webkitRequestFullscreen();
      } else if ((streamContainerRef.current as any).msRequestFullscreen) {
        (streamContainerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'F' to toggle fullscreen (when not in input/textarea)
      if (e.key === 'f' || e.key === 'F') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Press 'Escape' to exit fullscreen
      if (e.key === 'Escape') {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        );
        if (isCurrentlyFullscreen) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative p-6 rounded-3xl bg-gray-900/80 backdrop-blur-sm border border-red-500/30">
            <VideoOff className="w-16 h-16 mb-4 mx-auto opacity-75 animate-pulse" />
            <p className="text-base font-semibold mb-2 text-center">Камер холбогдохгүй байна</p>
            <p className="text-xs opacity-60 text-center mb-3 font-mono">{ip}:{port}</p>
            {connectionState && (
              <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-xs opacity-80 text-center">Төлөв: {connectionState}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={streamContainerRef}
      className="absolute inset-0 w-full h-full group/stream"
      style={isFullscreen ? { 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#000'
      } : {}}
    >
      <R2WPlayerComponent
        Camer={ip}
        PORT={port}
        USER={username}
        PASSWD={password}
        ROOT={root}
        serverPath="/api/camera/stream"
        onError={handleError}
        onConnectionStateChange={handleConnectionStateChange}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-all duration-200 ${
          isFullscreen ? 'opacity-100' : 'opacity-0 group-hover/stream:opacity-100'
        } focus:opacity-100`}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Бүтэн дэлгэцнээс гарах (ESC)" : "Бүтэн дэлгэц (F)"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Camera Info Overlay */}
      {!isFullscreen && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
          {gateName && <span className="hidden sm:inline">{gateName} - </span>}
          <span className="font-mono">{ip}:{port}</span>
        </div>
      )}
      
      {/* Fullscreen overlay info */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 z-30 px-3 py-2 rounded-lg bg-black/70 text-white">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cameraType === 'entry' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <div>
              <p className="font-semibold text-xs">{gateName || name}</p>
              <p className="text-xs opacity-75 font-mono">{ip}:{port}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display connection state for debugging */}
      {process.env.NODE_ENV === "development" && connectionState && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1.5 text-center z-10">
          {connectionState}
        </div>
      )}
    </div>
  );
}
