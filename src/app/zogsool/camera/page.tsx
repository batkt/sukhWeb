"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/useAuth";
import { useBuilding } from "@/context/BuildingContext";
import {
  Search,
  Calendar,
  DollarSign,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  X,
  Wifi,
  WifiOff,
  Bell,
  Clock,
  Copy,
  Settings,
  Share2,
  ExternalLink,
  Info,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Filter,
  ArrowUpDown,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import moment from "moment";
import useSWR from "swr";
import axios from "axios";
import uilchilgee, { socket as getSocket, aldaaBarigch } from "@/lib/uilchilgee";
import formatNumber from "../../../../tools/function/formatNumber";
import R2WPlayerComponent from "@/components/R2WPlayerComponent";
import { type Uilchluulegch } from "@/lib/useParkingSocket";
import PaymentModal from "./PaymentModal";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";


const RealTimeDuration = ({ orsonTsag, garsanTsag }: { orsonTsag?: string; garsanTsag?: string }) => {

  const [now, setNow] = useState(moment());

  useEffect(() => {
    if (!garsanTsag) {
      const interval = setInterval(() => {
        setNow(moment());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [garsanTsag]);

  if (!orsonTsag) return <span>00 : 00 : 00</span>;

  const start = moment(orsonTsag);
  const end = garsanTsag ? moment(garsanTsag) : now;
  const diff = moment.duration(end.diff(start));

  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (!garsanTsag) {
     return (
        <span className="text-[11px]  font-mono text-slate-800">
           {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} : {String(seconds).padStart(2, "0")}
        </span>
     );
  }

  return (
    <span className="text-[10px]  uppercase tracking-wide text-slate-800">
      {hours > 0 ? `${hours} цаг ${minutes} мин` : `${minutes} мин`}
    </span>
  );
};

const RealTimeClock = () => {
  const [time, setTime] = useState(moment());
  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="text-right hidden md:block">
      <p className="text-sm font-black text-slate-800 dark:text-gray-200">{time.format("YYYY-MM-DD")}</p>
      <p className="text-[10px]  text-slate-400 uppercase tracking-widest">{time.format("HH:mm:ss")}</p>
    </div>
  );
};


export default function Camera() {
  const { token, ajiltan, baiguullaga, barilgiinId } = useAuth();
  const { selectedBuildingId, isInitialized } = useBuilding();
  const effectiveBarilgiinId = selectedBuildingId || barilgiinId || undefined;
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Uilchluulegch | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Record<string, Uilchluulegch>>({});
  const [activeEntryIP, setActiveEntryIP] = useState<string>("");
  const [activeExitIP, setActiveExitIP] = useState<string>("");
  const [confirmExitId, setConfirmExitId] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const [durationFilter, setDurationFilter] = useState("latest_out");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ebarimtResult, setEbarimtResult] = useState<any>(null);

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
    { 
      revalidateOnFocus: false, 
      revalidateIfStale: false, 
      revalidateOnReconnect: false 
    },
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
                const username =
                  cam.tokhirgoo?.USER || cam.cameraUsername || "";
                const password =
                  cam.tokhirgoo?.PASSWD || cam.cameraPassword || "";

                allCameras.push({
                  cameraIP: cam.cameraIP,
                  cameraPort: rtspPort, // Use RTSP port for streaming
                  httpPort: httpPort, // Keep HTTP port for fallback
                  cameraType:
                    cam.cameraType ||
                    (gate.turul === "Орох" ? "entry" : "exit"),
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

  const socketRef = useRef<any>(null);

  // Stabilize cameras reference to prevent socket effector from re-running unnecessarily
  const camerasHash = useMemo(() => JSON.stringify(cameras), [cameras]);

  const entryCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "entry"),
    [camerasHash],
  );
  const exitCameras = useMemo(
    () => cameras.filter((cam) => cam.cameraType === "exit"),
    [camerasHash],
  );

  // Reset live updates when filters or page change
  useEffect(() => {
    setLiveUpdates({});
  }, [page, searchTerm, dateRange, effectiveBarilgiinId]);

  // Sync active camera IPs when cameras load
  useEffect(() => {
    if (entryCameras.length > 0 && !activeEntryIP) {
      setActiveEntryIP(entryCameras[0].cameraIP);
    }
    if (exitCameras.length > 0 && !activeExitIP) {
      setActiveExitIP(exitCameras[0].cameraIP);
    }
  }, [entryCameras, exitCameras]);

  // State for transaction list
  const [listData, setListData] = useState<any>({
    jagsaalt: [],
    niitMur: 0,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Helper to fetch list via REST (as a fallback or for filters)
  const fetchList = useCallback(async () => {
    if (!rangeStart || !rangeEnd || !token) return;
    
    // archive.md logic: Handle Archive collections based on date range
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const startObj = new Date(rangeStart);
    const endObj = new Date(rangeEnd);
    const startYear = startObj.getFullYear();
    const startMonth = startObj.getMonth() + 1;
    const endYear = endObj.getFullYear();
    const endMonth = endObj.getMonth() + 1;

    let archiveName = undefined;
    
    // Spans multiple months?
    if (startYear !== endYear || startMonth !== endMonth) {
      archiveName = "multi-month";
    } else if (startYear !== currentYear || startMonth !== currentMonth) {
      // Past month
      archiveName = `Uilchluulegch${startYear}${String(startMonth).padStart(2, "0")}`;
    }

    const query: any = {
      baiguullagiinId: ajiltan?.baiguullagiinId,
      barilgiinId: effectiveBarilgiinId || undefined,
    };

    if (searchTerm) {
      query.mashiniiDugaar = { $regex: searchTerm, $options: "i" };
    }

    if (typeFilter !== 'all') {
      query.turul = 'Үйлчлүүлэгч';
    }

    if (statusFilter === 'active') {
      // Идэвхтэй: Currently in (no exit) and no payment due
      query["tuukh.garsanKhaalga"] = { $exists: false };
      query["tuukh.tsagiinTuukh.garsanTsag"] = { $exists: false };
      query.niitDun = 0;
    } else if (statusFilter === 'paid') {
      // Төлсөн: Payment completed (tuluv === 1 and exited, or tuluv === 2)
      query["tuukh.tuluv"] = { $in: [1, 2] };
    } else if (statusFilter === 'unpaid') {
      // Төлбөртэй: Has debt or unpaid amount
      query.$and = [
        {
          $or: [
            { "tuukh.tuluv": -4 },
            { "tuukh.tuluv": 0, niitDun: { $gt: 0 }, "tuukh.garsanKhaalga": { $exists: true } }
          ]
        }
      ];
    } else if (statusFilter === 'free') {
      // Үнэгүй: Exited with no payment
      query["tuukh.garsanKhaalga"] = { $exists: true };
      query.niitDun = 0;
    }

    // The mandatory $or structure for date filtering as requested
    const exitCameraIP = activeExitIP || (exitCameras[0]?.cameraIP);
    
    const dateOr = [
      {
        ...(exitCameraIP ? { "tuukh.0.garsanKhaalga": exitCameraIP } : {}),
        "tuukh.tsagiinTuukh.garsanTsag": {
          $gte: `${rangeStart} 00:00:00`,
          $lte: `${rangeEnd} 23:59:59`
        }
      },
      {
        "tuukh.0.garsanKhaalga": { $exists: false },
        createdAt: {
          $gte: `${rangeStart} 00:00:00`,
          $lte: `${rangeEnd} 23:59:59`
        }
      }
    ];
    
    // Merge date filter with status filter
    if (statusFilter === 'unpaid' && query.$and) {
      query.$and.push({ $or: dateOr });
    } else {
      query.$or = dateOr;
    }

    const sortObj = durationFilter === 'longest' 
      ? { "tuukh.0.niitKhugatsaa": -1 }
      : (durationFilter === 'latest_in' 
          ? { 
              "tuukh.tsagiinTuukh.garsanTsag": 1,
              niitDun: 1,
              "tuukh.tuluv": 1,
              "tuukh.tsagiinTuukh.orsonTsag": -1,
              zurchil: 1,
            } 
          : { "tuukh.0.tsagiinTuukh.0.garsanTsag": -1 });

    try {
      const resp = await uilchilgee(token).get("/zogsoolUilchluulegch", {
        params: {
          khuudasniiDugaar: 1,
          khuudasniiKhemjee: 10000, // Fetch all data for client-side filtering and pagination
          query: JSON.stringify(query),
          order: JSON.stringify(sortObj),
          archiveName: archiveName,
        },
      });
      setListData(resp.data);
    } catch (e) {
      console.error("Fetch error", e);
    } finally {
      setIsInitialLoading(false);
    }
  }, [
    rangeStart, 
    rangeEnd, 
    token, 
    ajiltan?.baiguullagiinId, 
    effectiveBarilgiinId, 
    searchTerm, 
    typeFilter, 
    statusFilter, 
    activeExitIP, 
    exitCameras, 
    durationFilter
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, rangeStart, rangeEnd, typeFilter, durationFilter, statusFilter]);

  // Initial fetch and fetch on changes
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const khaalgaNeey = useCallback((ip: string) => {
    if (!ip) return;
    // Call local .NET service directly as requested
    axios.get(`http://localhost:5000/api/neeye/${ip}`)
      .catch((err) => {
        console.error("Local gate error, falling back to server:", err);
        if (token) {
          uilchilgee(token)
            .get("/neeye/" + ip)
            .catch(aldaaBarigch);
        }
      });
  }, [token]);

  async function handleManualExit(transaction: Uilchluulegch, type: 'pay' | 'free') {
    if (type === 'pay') {
      setSelectedTransaction(transaction);
      setConfirmExitId(null);
    } else {
      // SDK Exit Call
      try {
        const payload = {
          mashiniiDugaar: transaction.mashiniiDugaar,
          CAMERA_IP: activeExitIP || (exitCameras[0]?.cameraIP),
          barilgiinId: effectiveBarilgiinId
        };

        const resp = await axios.post("https://amarhome.mn/api/zogsoolSdkService", payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
        if (resp.status === 200 || resp.data === "Amjilttai") {
          toast.success("Гаралтын команд амжилттай");
          setConfirmExitId(null);
          fetchList();
        } else {
          toast.error("Алдаа: " + (resp.data?.message || "Амжилтгүй"));
        }
      } catch (err) {
        console.error("SDK Error:", err);
        toast.error("Команд илгээхэд алдаа гарлаа");
      }
    }
  }

  // QPay listener (zogsool.md lines 916-953)
  useEffect(() => {
    if (!baiguullaga?._id || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    exitCameras.forEach((cam) => {
      const eventName = `qpayMobileSdk${baiguullaga?._id}${cam.cameraIP}`;
      const handleGarahTulsun = (data: any) => {
        if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
          return;
        khaalgaNeey(data.cameraIP);
      };
      s.on(eventName, handleGarahTulsun);
      cleanup.push(() => s.off(eventName, handleGarahTulsun));
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, exitCameras]);

  useEffect(() => {
    const bId = ajiltan?.baiguullagiinId || baiguullaga?._id;
    if (!bId || !cameras.length) return;
    if (!socketRef.current) {
      socketRef.current = getSocket();
    }

    const s = socketRef.current;
    const cleanup: (() => void)[] = [];

    s.on("connect", () => {
      setIsConnected(true);
    });
    s.on("disconnect", () => setIsConnected(false));
    setIsConnected(s.connected);

    const handleGeneralUpdate = (data: any) => {
      if (data?._id && data?.baiguullagiinId === bId) {
        setLiveUpdates((prev: Record<string, Uilchluulegch>) => {
          const newState: Record<string, Uilchluulegch> = { ...prev, [data._id]: data };
          // If we have a synthetic entry (key == plate), remove it now that we have the real data
          if (data.mashiniiDugaar && newState[data.mashiniiDugaar]) {
            delete newState[data.mashiniiDugaar];
          }
          return newState;
        });
        fetchList();
      }
    };

    s.on(`zogsool${bId}`, handleGeneralUpdate);
    cleanup.push(() => s.off(`zogsool${bId}`, handleGeneralUpdate));

    const handleOroh = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== bId)
        return;

      if (!data?.oruulakhguiEsekh) {
        khaalgaNeey(data.cameraIP);
      }

      // Create synthetic update to avoid REST fetch and update "Идэвхтэй" list
      // Use plate as ID to ensure we only have one entry for this car in liveUpdates
      const plate = data.mashiniiDugaar;
      setLiveUpdates((prev) => ({
        ...prev,
        [plate]: {
          _id: plate, // Use plate as stable ID for synthetic entry
          mashiniiDugaar: plate,
          baiguullagiinId: data.baiguullagiinId,
          createdAt: new Date().toISOString(),
          tuukh: [
            {
              tsagiinTuukh: [{ orsonTsag: new Date().toISOString() }],
              orsonKhaalga: data.cameraIP,
              tuluv: 0,
            },
          ],
        },
      }));

      fetchList();
      const dugaar = data.mashiniiDugaar?.replace("???", "");
    };

    const handleGarah = (u: any) => {
      if (!u || !u?.mashiniiDugaar || !u?.baiguullagiinId || u?.baiguullagiinId !== bId)
        return;

      let dugaar = u.mashiniiDugaar?.replace("???", "");
      const garsanKhaalga = u?.tuukh?.[0]?.garsanKhaalga;
      let niit = u?.niitDun || 0;
      if (u?.tuukh?.[0]?.tulbur?.length > 0) {
        niit = u.niitDun - u.tuukh.reduce((s: number, t: any) => 
          s + (t?.tulbur?.reduce((a: number, b: any) => a + (b?.dun || 0), 0) || 0), 0);
      }
      if (niit < 0) niit = 0;

      let url = `/sambar/${garsanKhaalga}/${dugaar}/${niit}`;
      if (bId === "65cf2f027fbc788f85e50b90" || bId === "6549bbe0d437e6d25d557341") {
        const start = moment(u?.createdAt).format("YYYY-MM-DD HH:mm:ss");
        const end = moment().format("YYYY-MM-DD HH:mm:ss");
        url = `/sambarOgnootoi/${garsanKhaalga}/${dugaar}/${niit}/${start}/${end}`;
      }

      if (u?.turul === "Үнэгүй" || niit === 0) {
        if (u?.tuukh?.[0]?.garsanKhaalga) {
          khaalgaNeey(u.tuukh[0].garsanKhaalga);
        }
      }
      if (u?._id) handleGeneralUpdate(u);
    };

    const handleGarahTulsun = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== bId)
        return;
      khaalgaNeey(data.cameraIP);
      fetchList();
    };

    entryCameras.forEach((cam) => {
      const eventName = `zogsoolOroh${bId}${cam.cameraIP}`;
      s.on(eventName, handleOroh);
      cleanup.push(() => s.off(eventName, handleOroh));
    });

    exitCameras.forEach((cam) => {
      const e1 = `zogsoolGarakh${bId}${cam.cameraIP}`;
      const e2 = `zogsoolGarahTulsun${bId}${cam.cameraIP}`;

      s.on(e1, handleGarah);
      s.on(e2, handleGarahTulsun);

      cleanup.push(() => {
        s.off(e1, handleGarah);
        s.off(e2, handleGarahTulsun);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, ajiltan?.baiguullagiinId, camerasHash, token, fetchList]);

  const isSocketConnected = isConnected;





  const { transactions, totalFiltered } = useMemo(() => {
    const data = listData;
    let list: Uilchluulegch[] = [];

    if (Array.isArray(data?.jagsaalt)) list = data.jagsaalt;
    else if (Array.isArray(data?.list)) list = data.list;
    else if (Array.isArray(data?.data)) list = data.data;
    else if (Array.isArray(data)) list = data;

    const transactionMap = new Map<string, Uilchluulegch>();
    const platesWithRealId = new Set<string>();

    list.forEach((item, index) => {
      const key = item._id || `list_${index}_${item.mashiniiDugaar || "unknown"}`;
      transactionMap.set(key, item);
      if (item._id && item._id !== item.mashiniiDugaar) {
        platesWithRealId.add(item.mashiniiDugaar);
      }
    });

    // First pass of liveUpdates to identify more real IDs
    Object.values(liveUpdates).forEach((update: any) => {
      if (update._id && update._id !== update.mashiniiDugaar) {
        platesWithRealId.add(update.mashiniiDugaar);
      }
    });

    Object.values(liveUpdates).forEach((update: any) => {
      // If synthetic (id == plate) and we have a real record for this plate, skip the synthetic one
      if (update._id === update.mashiniiDugaar && platesWithRealId.has(update.mashiniiDugaar)) {
        return;
      }
      const key = update._id || update.mashiniiDugaar;
      if (key) transactionMap.set(key, update);
    });

    let merged = Array.from(transactionMap.values());

    // Filter Type
    if (typeFilter !== 'all') {
      merged = merged.filter(t => {
         const type = t.turul || t.tuukh?.[0]?.turul || "Үйлчлүүлэгч"; 
         return type === 'Үйлчлүүлэгч';
      });
    }

    // Filter Status
    if (statusFilter !== 'all') {
      merged = merged.filter(t => {
        const mur = t.tuukh?.[0];
        const tsag = mur?.tsagiinTuukh?.[0];
        const garsanTsag = tsag?.garsanTsag;
        // Check both garsanKhaalga and garsanTsag - if either exists, car has exited
        const isCurrentlyIn = !mur?.garsanKhaalga && !garsanTsag;
        const niitDun = t.niitDun || 0;
        const tuluv = mur?.tuluv;
        const isDebt = tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);
        
        if (statusFilter === 'active') {
          // Идэвхтэй: Currently in and no payment due
          return isCurrentlyIn && niitDun === 0;
        }
        if (statusFilter === 'paid') {
          // Төлсөн: Payment completed (tuluv === 1 and not currently in, or tuluv === 2)
          return (tuluv === 1 && !isCurrentlyIn) || tuluv === 2;
        }
        if (statusFilter === 'unpaid') {
          // Төлбөртэй: Has debt or unpaid amount
          return !isCurrentlyIn && (niitDun > 0 || isDebt);
        }
        if (statusFilter === 'free') {
          // Үнэгүй: Exited with no payment
          return !isCurrentlyIn && niitDun === 0;
        }
        return true;
      });
    }

    // Sort
    merged.sort((a, b) => {
      const getInTime = (t: Uilchluulegch) => t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag).getTime() : (t.createdAt ? new Date(t.createdAt).getTime() : 0);
      const getOutTime = (t: Uilchluulegch) => t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag).getTime() : 0;
      
      // Sorting by duration filter (which includes exit time sorting)
      if (durationFilter === 'longest') {
         const durA = getOutTime(a) ? (getOutTime(a) - getInTime(a)) : (Date.now() - getInTime(a));
         const durB = getOutTime(b) ? (getOutTime(b) - getInTime(b)) : (Date.now() - getInTime(b));
         return durB - durA;
      } else if (durationFilter === 'latest_in') {
         return getInTime(b) - getInTime(a);
      } else {
         // latest_out - sort by exit time (latest exit first), fallback to entry time if not exited
         const timeA = getOutTime(a) || getInTime(a);
         const timeB = getOutTime(b) || getInTime(b);
         return timeB - timeA;
      }
    });

    // Calculate total BEFORE pagination
    const totalFiltered = merged.length;

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const transactions = merged.slice(startIndex, endIndex);

    return { transactions, totalFiltered };
  }, [listData, liveUpdates, page, pageSize, durationFilter, typeFilter, statusFilter]);

  const total = totalFiltered;

  const stats = useMemo(() => {
    const total = transactions.reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const paid = transactions
      .filter(
        (t) => t.tuukh?.[0]?.tuluv === 1 || t.tuukh?.[0]?.tuluv === 2,
      )
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const unpaid = transactions
      .filter((t) => (t.tuukh?.[0]?.tuluv === 0 || t.tuukh?.[0]?.tuluv === -4) && (t.niitDun || 0) > 0)
      .reduce((sum: number, t: Uilchluulegch) => sum + (t.niitDun || 0), 0);
    const count = transactions.length;
    const paidCount = transactions.filter(
      (t) => t.tuukh?.[0]?.tuluv === 1 || t.tuukh?.[0]?.tuluv === 2,
    ).length;

    return { total, paid, unpaid, count, paidCount };
  }, [transactions]);

  const totalPages = Math.ceil(total / pageSize);

  // Keyboard Shortcuts (shortcut.md / zogsool.md)
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          if (entryCameras[0]) khaalgaNeey(entryCameras[0].cameraIP);
          break;
        case "F2":
          e.preventDefault();
          if (exitCameras[0]) khaalgaNeey(exitCameras[0].cameraIP);
          break;
        case "F4":
          e.preventDefault();
          if (transactions[0] && (transactions[0].niitDun || 0) > 0) {
            setSelectedTransaction(transactions[0]);
          }
          break;
        case "F7":
          e.preventDefault();
          if (transactions[0]) {
            handleManualExit(transactions[0], "free");
          }
          break;
        case "F8":
        case "+":
          e.preventDefault();
          setActiveEntryIP(entryCameras[0]?.cameraIP || "");
          setIsRegModalOpen(true);
          break;
        case "-":
          e.preventDefault();
          setActiveEntryIP(exitCameras[0]?.cameraIP || ""); // Using registration for exit if needed
          setIsRegModalOpen(true);
          break;
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [entryCameras, exitCameras, transactions, khaalgaNeey, handleManualExit]);

  // Click outside listener for action menu
  useEffect(() => {
    if (!confirmExitId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setConfirmExitId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [confirmExitId]);

  // Click outside listener for page size dropdown
  useEffect(() => {
    if (!isPageSizeOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPageSizeOpen]);

  function formatCurrency(n: number) {
    return `${formatNumber(n)} ₮`;
  }

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${text.toUpperCase()} дугаарыг хууллаа`);
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[color:var(--surface-bg)]">
      <div className="min-h-full p-4 lg:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-1.5 h-6 bg-theme rounded-full"></div>
                 <h1 className="text-2xl font-black text-[color:var(--panel-text)] tracking-tighter uppercase">Хяналтын самбар</h1>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[10px]  text-[color:var(--muted-text)] uppercase tracking-widest opacity-60">КАМЕР БОЛОН ГҮЙЛГЭЭНИЙ ХЯНАЛТ</p>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${isSocketConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  {isSocketConnected ? 'Socket Connected' : 'Socket Offline'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <RealTimeClock />
            </div>
          </div>
        </div>


        {/* Camera Streaming Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Entry Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
               <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Орох Камер</span>
               </div>
            </div>
            
            <div className="aspect-video relative">
              {entryCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                  <VideoOff className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Тохиргоогүй байна</p>
                </div>
              ) : (
                <div className="h-full">
                  {/* Camera Selection Dropdown */}
                  {entryCameras.length > 1 && (
                    <div className="absolute top-4 right-4 z-[50]">
                      <div className="relative group/dropdown">
                        <select
                          value={activeEntryIP}
                          onChange={(e) => setActiveEntryIP(e.target.value)}
                          className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:bg-black/80 transition-all outline-none"
                        >
                          {entryCameras.map((cam) => (
                            <option key={cam.cameraIP} value={cam.cameraIP} className="bg-zinc-900 text-white">
                              {cam.cameraIP}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                      </div>
                    </div>
                  )}

                  {entryCameras.filter(c => c.cameraIP === activeEntryIP || (!activeEntryIP && entryCameras[0]?.cameraIP === c.cameraIP)).map((camera, i) => (
                    <div key={`entry-${camera.cameraIP}-${i}`} className="h-full relative overflow-hidden group/cam">
                       <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="entry"
                          onOpenGate={khaalgaNeey}
                        />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exit Camera Stream */}
          <div className="relative group/camera overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500">
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
               <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Гарах Камер</span>
               </div>
            </div>
            
            <div className="aspect-video relative">
              {exitCameras.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                  <VideoOff className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Тохиргоогүй байна</p>
                </div>
              ) : (
                <div className="h-full">
                  {/* Camera Selection Dropdown */}
                  {exitCameras.length > 1 && (
                    <div className="absolute top-4 right-4 z-[50]">
                      <div className="relative group/dropdown">
                        <select
                          value={activeExitIP}
                          onChange={(e) => setActiveExitIP(e.target.value)}
                          className="appearance-none bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2 pr-10 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:bg-black/80 transition-all outline-none"
                        >
                          {exitCameras.map((cam) => (
                            <option key={cam.cameraIP} value={cam.cameraIP} className="bg-zinc-900 text-white">
                              {cam.cameraIP}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/60 pointer-events-none group-hover/dropdown:text-white transition-colors" />
                      </div>
                    </div>
                  )}

                  {exitCameras.filter(c => c.cameraIP === activeExitIP || (!activeExitIP && exitCameras[0]?.cameraIP === c.cameraIP)).map((camera, i) => (
                    <div key={`exit-${camera.cameraIP}-${i}`} className="h-full relative overflow-hidden group/cam">
                       <CameraStream
                          ip={camera.cameraIP}
                          port={camera.cameraPort}
                          name={camera.cameraName || camera.cameraIP}
                          username={camera.cameraUsername}
                          password={camera.cameraPassword}
                          root={camera.root || "stream"}
                          gateName={camera.gateName}
                          cameraType="exit"
                          onOpenGate={khaalgaNeey}
                        />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="space-y-4">
          {/* ─── Top Bar ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-slate-200/30 dark:border-white/[0.04] shadow-sm" style={{ zIndex: 1 }}>
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl ">
                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-[13px] text-slate-700 dark:text-slate-300 tracking-tight leading-none">Жагсаалт</h3>
                <p className="text-[10px]  text-slate-500 dark:text-slate-500 mt-0.5">Зогсоолын бүртгэл</p>
              </div>
            </div>

            {/* Right: Search + Register + DatePicker */}
            <div className="flex items-center gap-2.5 flex-wrap font-[family-name:var(--font-mono)]">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Улсын дугаар хайх..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-56 pl-10 pr-4 h-9 rounded-full bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/[0.06] text-[11px] text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500/20 dark:focus:border-blue-500/20 outline-none transition-all"
                />
              </div>

              {/* Date picker */}
              <div className="min-w-[220px]">
                <DatePickerInput
                  type="range"
                  value={dateRange}
                  onChange={(v: any) => {
                    setDateRange(v);
                    setPage(1);
                  }}
                  valueFormat="YYYY-MM-DD"
                  leftSection={<Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                  rightSection={null}
                  classNames={{
                    input: "flex items-center gap-2 rounded-full bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/[0.06] h-9 px-4 text-[11px] text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/10 transition-all font-[family-name:var(--font-mono)]"
                  }}
                  clearable
                />
              </div>

              {/* Register button */}
              <Button
                onClick={() => setIsRegModalOpen(true)}
                variant="secondary"
                size="sm"
                className="rounded-lg h-8 px-4 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm"
              >
                Машин бүртгэх
              </Button>
            </div>
          </div>

          <div className="relative rounded-3xl border border-[color:var(--surface-border)] bg-white/40 backdrop-blur-md shadow-xl dark:bg-black/20 min-h-[600px] flex flex-col" style={{ overflow: 'visible' }}>
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1" style={{ maxHeight: `${pageSize * 60}px` }}>
              <table className="w-full text-[11px] border-collapse bg-white dark:bg-slate-950/50">
                <thead className="sticky top-0 z-20">
                   <tr className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10 shadow-sm">
                      {[
                        { id: 'no', label: "№", width: 'w-12' },
                        { id: 'dugaar', label: "Дугаар", width: 'w-28' },
                        { id: 'orson', label: "Орсон", width: 'w-36' },
                        { 
                          id: 'garsan', 
                          label: "Гарсан", 
                          width: 'w-36', 
                          sortable: true,
                          onClick: () => {
                            // Toggle between latest_out and other duration filters
                            if (durationFilter === 'latest_out') {
                              setDurationFilter('latest_in');
                            } else {
                              setDurationFilter('latest_out');
                            }
                            setPage(1);
                          }
                        },
                        { 
                          id: 'duration', 
                          label: "Хугацаа/мин", 
                          width: 'w-42',
                          filter: true, 
                          current: durationFilter,
                          set: (v: string) => { setDurationFilter(v); setPage(1); },
                          options: [
                            { label: "Удаан зогссон эхэнд", value: "longest" },
                            { label: "Сүүлд орсон эхэнд", value: "latest_in" },
                            { label: "Сүүлд гарсан эхэнд", value: "latest_out" }
                          ] 
                        },
                        { 
                          id: 'type', 
                          label: "Төрөл", 
                          width: 'w-28',
                          filter: true,
                          current: typeFilter,
                          set: (v: string) => { setTypeFilter(v); setPage(1); },
                          options: [
                             { label: "Бүгд", value: "all" },
                             { label: "Төлбөртэй", value: "client" }
                          ]
                        },
                        { id: 'discount', label: "Хөнгөлөлт", width: 'w-28' },
                        { id: 'amount', label: "Дүн", width: 'w-28' },
                        { id: 'payment', label: "Төлбөр", width: 'w-36' },
                        { id: 'ebarimt', label: "И-Баримт", width: 'w-28' },
                        { 
                          id: 'status', 
                          label: "Төлөв",
                          width: 'w-36',
                          filter: true,
                          current: statusFilter,
                          set: (v: string) => { setStatusFilter(v); setPage(1); },
                          options: [
                            { label: "Бүгд", value: "all" },
                            { label: "Идэвхтэй", value: "active"},
                            { label: "Төлсөн", value: "paid" },
                            { label: "Төлөөгүй", value: "unpaid"},
                            { label: "Үнэгүй", value: "free" }
                          ]
                        },
                        { id: 'reason', label: "Шалтгаан", width: 'w-36' },
                      ].map((h, i) => (
                        <th key={h.id} className={`group relative py-4 px-3 text-slate-700 dark:text-slate-300  uppercase tracking-wider text-xs border-r border-slate-200 dark:border-white/5 last:border-r-0 text-center ${h.width || ''} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                          <div 
                            className="flex items-center justify-center gap-2 cursor-pointer h-full"
                            onClick={() => (h as any).onClick?.()}
                          >
                             {h.filter && <Filter className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 transition-colors" />}
                             <span>{h.label}</span>
                             {h.sortable && <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />}
                          </div>

                           {h.options && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] translate-y-2 group-hover:translate-y-0 overflow-hidden scale-95 group-hover:scale-100 origin-top text-left">
                                 <div className="relative flex flex-col gap-0 z-10">
                                   <div className="px-3 py-2 mb-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                      {h.label} Сонгох
                                   </div>
                                   {h.options.map((opt, idx, arr) => (
                                     <div key={idx}>
                                       <div 
                                         onClick={() => (h as any).set?.(opt.value)}
                                         className={`px-3 py-2.5 rounded-md text-[11px] text-left flex items-center justify-between cursor-pointer transition-all duration-200 border border-transparent ${
                                            (h as any).current === opt.value 
                                              ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                                              : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                         }`}
                                         style={{
                                           borderRadius: '0.375rem',
                                         }}
                                         onMouseEnter={(e) => {
                                           e.currentTarget.style.borderRadius = '0.5rem';
                                         }}
                                         onMouseLeave={(e) => {
                                           e.currentTarget.style.borderRadius = '0.375rem';
                                         }}
                                       >
                                         <span>{opt.label}</span>
                                         {(h as any).current === opt.value && (
                                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                         )}
                                       </div>
                                       {idx < arr.length - 1 && (
                                         <div className="h-px bg-slate-200 dark:bg-white/10 mx-2 my-1" />
                                       )}
                                     </div>
                                   ))}
                                 </div>
                              </div>
                           )}
                        </th>
                      ))}
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-40 text-center bg-slate-50/10 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-b-3xl">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                           <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800/50 shadow-inner">
                              <Calendar className="w-12 h-12 text-slate-400" />
                           </div>
                           <p className="text-base uppercase tracking-[0.2em] text-slate-400">Одоогоор мэдээлэл байхгүй байна</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction, idx) => {
                      const mur = transaction.tuukh?.[0];
                      // ... (unchanged logic variables) ...
                      const tsag = mur?.tsagiinTuukh?.[0];
                      const orsonTsag = tsag?.orsonTsag;
                      const garsanTsag = tsag?.garsanTsag;
                      const tuluv = mur?.tuluv;
                      const niitDun = transaction.niitDun || 0;
                      const isCurrentlyIn = !mur?.garsanKhaalga;
                      const isPaid = tuluv === 1;
                      const isDebt = tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);
                      const isActive = isCurrentlyIn; 
                      const showActionBtn = isCurrentlyIn || isDebt;
                      const hasPayment = niitDun > 0 || isDebt;

                      return (
                          <tr
                            key={transaction._id || idx}
                            className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 group border-b border-slate-200 dark:border-white/5 ${isActive ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                          >
                          <td className="py-3 px-3 text-center text-gray-400 border-r border-slate-200 dark:border-white/5 text-xs">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 dark:border-white/5 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <span className=" text-slate-700 dark:text-slate-300  font-[family-name:var(--font-mono)] text-sm">{transaction.mashiniiDugaar || "-"}</span>
                                <Copy 
                                  className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-colors" 
                                  onClick={() => copyToClipboard(transaction.mashiniiDugaar)}
                                />
                             </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap border-r border-slate-200 dark:border-white/5 text-center">
                             <span className=" text-slate-600 dark:text-slate-400  font-[family-name:var(--font-mono)] text-xs">
                               {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
                             </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap border-r border-slate-200 dark:border-white/5 text-center">
                             <span className=" text-slate-600 dark:text-slate-400  font-[family-name:var(--font-mono)] text-xs">
                               {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : ""}
                             </span>
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 dark:border-white/5 text-center">
                             {(() => {
                                // Match duration color to status color - must follow exact same logic order as status column
                                const getStatusColor = () => {
                                  if (tuluv === 1) {
                                    return (isCurrentlyIn && niitDun === 0) 
                                      ? "bg-blue-500 text-white border-blue-600" 
                                      : "bg-green-500 text-white border-green-600";
                                  }
                                  if (!isCurrentlyIn && (niitDun > 0 || isDebt)) {
                                    return "bg-yellow-500 text-white border-yellow-600";
                                  }
                                  if (tuluv === -2 || tuluv === -1) {
                                    return "bg-red-500 text-white border-red-600";
                                  }
                                  if (!isCurrentlyIn && niitDun === 0) {
                                    return "bg-gray-500 text-white border-gray-600";
                                  }
                                  return "bg-blue-500 text-white border-blue-600";
                                };
                                
                                return (
                                  <div className={`flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border shadow-sm text-xs ${getStatusColor()}`} style={{ borderRadius: '6px' }}>
                                    <RealTimeDuration orsonTsag={orsonTsag} garsanTsag={garsanTsag} />
                                  </div>
                                );
                             })()}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-center  border-r border-slate-200 dark:border-white/5 text-sm">
                             {transaction.turul || transaction.tuukh?.[0]?.turul || "Үйлчлүүлэгч"}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-right  border-r border-slate-200 dark:border-white/5 text-sm">
                             {transaction.tuukh?.[0]?.khungulult || "0"}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-right  border-r border-slate-200 dark:border-white/5 font-[family-name:var(--font-mono)] text-sm">
                             {formatNumber(transaction.niitDun || 0)}
                          </td>
                          <td className="py-3 px-3 text-right  relative border-r border-slate-200 dark:border-white/5 text-sm">
                             {(() => {
                                const history = transaction.tuukh?.[0];
                                const tulsunDun = history?.tulsunDun || 0;
                                // Ensure tulbur is always an array - handle both array and single object cases
                                const rawTulbur = history?.tulbur;
                                let payHistory: any[] = [];
                                
                                if (Array.isArray(rawTulbur)) {
                                  // It's already an array - use it directly
                                  payHistory = rawTulbur;
                                } else if (rawTulbur && typeof rawTulbur === 'object') {
                                  // It's a single object - wrap it in an array
                                  payHistory = [rawTulbur];
                                } else {
                                  // It's null/undefined - use empty array
                                  payHistory = [];
                                }
                                
                                // ... (labels logic) ...
                                const labels: Record<string, string> = { 
                                  belen: "Бэлэн", cash: "Бэлэн",
                                  khaan: "Карт",
                                  qpay: "QPay",
                                  khariltsakh: "Дансаар", transfer: "Дансаар",
                                  khungulult: "Хөнгөлөлт", discount: "Хөнгөлөлт",
                                  free: "Үнэгүй",
                                  monpay: "MonPay", socialpay: "SocialPay", toki: "Toki"
                                };
                                const colorMap: Record<string, string> = {
                                  belen: "bg-emerald-100 text-emerald-700 border-emerald-200",
                                  cash: "bg-emerald-100 text-emerald-700 border-emerald-200",
                                  khaan: "bg-teal-100 text-teal-700 border-teal-200",
                                  qpay: "bg-purple-100 text-purple-700 border-purple-200",
                                  khariltsakh: "bg-blue-100 text-blue-700 border-blue-200",
                                  transfer: "bg-blue-100 text-blue-700 border-blue-200",
                                  khungulult: "bg-amber-100 text-amber-700 border-amber-200",
                                  discount: "bg-amber-100 text-amber-700 border-amber-200",
                                };
                                const textColorMap: Record<string, string> = {
                                  belen: "text-emerald-600 dark:text-emerald-400",
                                  cash: "text-emerald-600 dark:text-emerald-400",
                                  khaan: "text-teal-600 dark:text-teal-400",
                                  qpay: "text-purple-600 dark:text-purple-400",
                                  khariltsakh: "text-blue-600 dark:text-blue-400",
                                  transfer: "text-blue-600 dark:text-blue-400",
                                  khungulult: "text-amber-600 dark:text-amber-400",
                                  discount: "text-amber-600 dark:text-amber-400",
                                };
                                if (payHistory.length > 0) {
                                  const totalPaid = payHistory.reduce((s: number, p: any) => s + (p.dun || 0), 0);
                                  return (
                                    <div className="group/pay relative inline-block cursor-pointer ml-auto">
                                      <span className="text-sm  text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors border-b border-dashed border-slate-300 dark:border-slate-600 pb-0.5 font-[family-name:var(--font-mono)]">
                                        {formatNumber(totalPaid)}
                                        {payHistory.length > 1 && <span className="ml-1 text-[10px] text-slate-400">({payHistory.length})</span>}
                                      </span>
                                      
                                      {/* Popup reused logic */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[99999] min-w-[220px] max-w-[320px] max-h-[400px] overflow-y-auto p-3.5 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-0 invisible group-hover/pay:opacity-100 group-hover/pay:visible transition-all duration-200 translate-y-1 group-hover/pay:translate-y-0 scale-95 group-hover/pay:scale-100 pointer-events-none group-hover/pay:pointer-events-auto text-left" style={{ position: 'absolute', zIndex: 99999 }}>
                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 pb-2 border-b border-slate-100 dark:border-white/5 sticky top-0 bg-white dark:bg-slate-900 backdrop-blur-sm z-10">
                                          Төлбөрийн дэлгэрэнгүй ({payHistory.length})
                                        </div>
                                        <div className="space-y-2">
                                          {payHistory && payHistory.length > 0 ? (
                                            payHistory.map((p: any, pi: number) => {
                                              // Use a unique key combining index, turul, and dun to ensure proper rendering
                                              const uniqueKey = `${pi}-${p.turul || 'unknown'}-${p.dun || 0}-${p.ognoo || ''}`;
                                              return (
                                                <div key={uniqueKey} className="flex items-center justify-between gap-4 py-1">
                                                  <span className={`text-[10px]  ${textColorMap[p.turul] || 'text-slate-600 dark:text-slate-400'}`}>
                                                    {labels[p.turul] || p.turul || 'Төлбөр'}
                                                  </span>
                                                  <span className="text-[11px] text-slate-800 dark:text-gray-200 whitespace-nowrap font-[family-name:var(--font-mono)] ">{formatNumber(p.dun || 0)}</span>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="text-[10px] text-slate-400 text-center py-2">Төлбөр байхгүй</div>
                                          )}
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center sticky bottom-0 bg-white dark:bg-slate-900 backdrop-blur-sm z-10">
                                          <span className="text-[10px] font-black text-slate-400 uppercase">НИЙТ</span>
                                          <span className="text-sm font-black text-emerald-600 font-[family-name:var(--font-mono)]">{formatNumber(totalPaid)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                if (tulsunDun > 0) {
                                  return <span className="text-sm  text-slate-700 dark:text-slate-300 font-[family-name:var(--font-mono)]">{formatNumber(tulsunDun)}</span>;
                                }

                                if (!history && !garsanTsag) return <span className="text-slate-300">0</span>;
                                
                                if ((history as any)?.zurchil === "Үнэгүй хугацаанд" || (transaction as any).zurchil === "Үнэгүй хугацаанд" || (garsanTsag && tulsunDun === 0)) {
                                  return <span className="text-emerald-600 dark:text-emerald-400  text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded inline-block">Үнэгүй</span>
                                }

                                return <span className="font-[family-name:var(--font-mono)] text-slate-700 dark:text-slate-300 text-sm">{formatNumber(tulsunDun)}</span>;
                             })()}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-right  border-r border-slate-200 dark:border-white/5 font-[family-name:var(--font-mono)] text-sm">
                             {transaction.tuukh?.[0]?.ebarimtId || ""}
                          </td>
                          <td className="py-3 px-3 relative border-r border-slate-200 dark:border-white/5 text-center">
                                {showActionBtn ? (
                                    <div className="flex items-center justify-center gap-1 action-menu-container">
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmExitId(confirmExitId === transaction._id ? null : transaction._id);
                                        }}
                                        variant={
                                          (isPaid && niitDun > 0)
                                            ? "success"
                                            : (!isCurrentlyIn && isDebt)
                                            ? "warning"
                                            : (tuluv === -1 || tuluv === -2)
                                            ? "danger"
                                            : "primary"
                                        }
                                        size="sm"
                                        className="group/btn w-[100px] min-w-[100px] max-w-[100px] mx-auto uppercase tracking-wide overflow-hidden"
                                        style={{ borderRadius: '6px', overflow: 'hidden' }}
                                      >
                                        {!isCurrentlyIn 
                                          ? (isDebt ? "Төлбөртэй" : "Дууссан") 
                                          : (isPaid && niitDun > 0) 
                                            ? "Төлсөн" 
                                            : (tuluv === 2) 
                                              ? "Төлбөртэй" 
                                              : (niitDun > 0) 
                                                ? "Төлбөр" 
                                                : "Идэвхтэй"
                                        }
                                      </Button>
                                      {/* ... dropdown menu code ... */}
                                      {confirmExitId === transaction._id && (
                                         <div className="absolute right-0 top-full mt-2 z-[60] min-w-[170px] p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                                            {/* ... dropdown content ... */}
                                            <div className="space-y-0">
                                                {/* Re-implement dropdown buttons with same logic but larger padding text */}
                                                {(isCurrentlyIn ? [
                                                    { label: "Хөнгөлөлт", icon: Tag, color: "amber", action: () => handleManualExit(transaction, "pay") },
                                                    { label: "Гаргах", icon: ArrowUpDown, color: "blue", action: () => (isPaid || niitDun === 0) ? handleManualExit(transaction, "free") : handleManualExit(transaction, "pay") }
                                                ] : [
                                                    { label: "Төлөх", icon: DollarSign, color: "emerald", action: () => handleManualExit(transaction, "pay") },
                                                    { label: "Үнэгүй", icon: Info, color: "slate", action: () => handleManualExit(transaction, "free") }
                                                ]).map((btn, bi, arr) => (
                                                    <div key={bi}>
                                                        <button 
                                                            onClick={btn.action}
                                                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-md text-[11px] text-slate-700 dark:text-slate-300 transition-all duration-200 group/item ${
                                                                btn.color === 'amber' 
                                                                    ? 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10' 
                                                                    : btn.color === 'blue'
                                                                    ? 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10'
                                                                    : btn.color === 'emerald'
                                                                    ? 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10'
                                                                    : 'hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-500/10'
                                                            } hover:rounded-lg`}
                                                            style={{
                                                                borderRadius: '0.375rem',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderRadius = '0.5rem';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderRadius = '0.375rem';
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <btn.icon className={`w-3.5 h-3.5 ${
                                                                    btn.color === 'amber' 
                                                                        ? 'text-amber-600 dark:text-amber-400' 
                                                                        : btn.color === 'blue'
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : btn.color === 'emerald'
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-slate-600 dark:text-slate-400'
                                                                } group-hover/item:scale-110 transition-transform`} />
                                                                <span>{btn.label}</span>
                                                            </div>
                                                        </button>
                                                        {bi < arr.length - 1 && (
                                                            <div className="h-px bg-slate-200 dark:bg-white/10 mx-2 my-1" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                         </div>
                                      )}
                                    </div>
                                ) : (
                                  (() => {
                                    // Status badges logic
                                    const badgeClass = "flex items-center justify-center flex-nowrap w-[100px] min-w-[100px] max-w-[100px] mx-auto px-2 py-1.5 rounded-[6px] overflow-hidden border";
                                    if (tuluv === 1) return (
                                      <div className={`${badgeClass} ${(isCurrentlyIn && niitDun === 0) ? "bg-blue-500 !text-white border-blue-600 shadow-sm" : "bg-green-500 !text-white border-green-600 shadow-sm"}`} style={{ borderRadius: '6px' }}>
                                        <span className="text-[10px] !text-white uppercase whitespace-nowrap">
                                          {(isCurrentlyIn && niitDun === 0) ? "Идэвхтэй" : "Төлсөн"}
                                        </span>
                                      </div>
                                    );
                                    if (!isCurrentlyIn && (niitDun > 0 || isDebt)) return (
                                      <div className={`${badgeClass} bg-yellow-500 !text-white border-yellow-600 shadow-sm`} style={{ borderRadius: '6px' }}>
                                        <span className="text-[10px] !text-white uppercase whitespace-nowrap">Төлбөртэй</span>
                                      </div>
                                    );
                                    if (tuluv === -2 || tuluv === -1) return (
                                      <div className={`${badgeClass} bg-red-500 !text-white border-red-600 shadow-sm`} style={{ borderRadius: '6px' }}>
                                        <span className="text-[10px] !text-white uppercase whitespace-nowrap">Зөрчилтэй</span>
                                      </div>
                                    );
                                    if (!isCurrentlyIn && niitDun === 0) return (
                                      <div className={`${badgeClass} bg-gray-500 !text-white border-gray-600 shadow-sm`} style={{ borderRadius: '6px' }}>
                                        <span className="text-[10px] !text-white uppercase whitespace-nowrap">Үнэгүй</span>
                                      </div>
                                    );
                                    return (
                                      <div className={`${badgeClass} bg-blue-500 !text-white border-blue-600 shadow-sm`} style={{ borderRadius: '6px' }}>
                                        <span className="text-[10px] !text-white uppercase tracking-tight whitespace-nowrap text-center">Идэвхтэй</span>
                                      </div>
                                    );
                                  })()
                                )}
                             </td>
                          <td className="py-3 px-3 text-gray-400 italic truncate max-w-[100px] border-r border-slate-200 dark:border-white/5 text-[10px] text-center">
                             {transaction.zurchil || ""}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-white/10  text-slate-800 dark:text-white sticky bottom-0 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                    <tr>
                      <td colSpan={6} className="py-3 px-3 text-right text-xs uppercase tracking-wider border-r border-slate-200 dark:border-white/5">
                        Нийт Дүн:
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-white/5 text-sm font-[family-name:var(--font-mono)] whitespace-nowrap">
                          {formatNumber(transactions.reduce((sum, t) => sum + (Number(t.tuukh?.[0]?.khungulult) || 0), 0))}
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-white/5 text-sm font-[family-name:var(--font-mono)] whitespace-nowrap">
                          {formatNumber(transactions.reduce((sum, t) => sum + (Number(t.niitDun) || 0), 0))}
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 dark:border-white/5 text-sm font-[family-name:var(--font-mono)] whitespace-nowrap">
                          {formatNumber(transactions.reduce((sum, t) => sum + (Number(t.tuukh?.[0]?.tulsunDun) || 0), 0))}
                      </td>
                      <td colSpan={4} className="border-r border-slate-200 dark:border-white/5"></td>
                    </tr>
                  </tfoot>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 rounded-b-2xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="relative" ref={pageSizeRef}>
                  <button
                    onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300  cursor-pointer hover:bg-slate-200/80 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-sm"
                  >
                    <span>{pageSize}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isPageSizeOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-1.5 z-50">
                      {[10, 20, 50, 100, 500].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setPage(1);
                            setIsPageSizeOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs  text-left transition-all duration-200 ${
                            pageSize === size
                              ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                              : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          style={{
                            borderRadius: '0.5rem',
                          }}
                          onMouseEnter={(e) => {
                            if (pageSize !== size) {
                              e.currentTarget.style.borderRadius = '0.625rem';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pageSize !== size) {
                              e.currentTarget.style.borderRadius = '0.5rem';
                            }
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Нийт {total} бичлэг
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                />
                <div className="flex items-center gap-1.5 px-2">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-xs  text-slate-900 dark:text-white">
                    {page}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">/</span>
                  <span className="text-xs  text-slate-600 dark:text-slate-300">
                    {Math.ceil(total / pageSize)}
                  </span>
                </div>
                <Button
                  onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  variant="ghost"
                  size="sm"
                  className="p-2 rounded-xl"
                  leftIcon={<ChevronRight className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

        </div>

        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="neu-panel rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--muted-text)] mb-1">
                  Нийт орлого
                </p>
                <p className="text-lg  text-[color:var(--panel-text)]">
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
                <p className="text-lg  text-green-600">
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
                <p className="text-lg  text-red-600">
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
                <p className="text-lg  text-[color:var(--panel-text)]">
                  {stats.count}
                </p>
                <p className="text-xs text-[color:var(--muted-text)] mt-0.5">
                  Төлсөн: {stats.paidCount}
                </p>
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div> */}
        
        {selectedTransaction && (
          <PaymentModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onConfirm={async (amount, method, extraData) => {
              try {
                const zogsooliinId = selectedTransaction.tuukh?.[0]?.zogsooliinId || selectedTransaction.barilgiinId || effectiveBarilgiinId;
                
                // Build tulbur array from split entries (pay.md)
                const splitEntries = extraData?.tulbur || [{ turul: method, dun: amount, ognoo: new Date().toISOString() }];
                const tulburArray = splitEntries
                  .filter((t: any) => t.dun > 0 || amount === 0) // keep zero for free exits
                  .map((t: any) => ({
                    ...t,
                    baiguullagiinId: ajiltan?.baiguullagiinId,
                    barilgiinId: effectiveBarilgiinId,
                    burtgesenAjiltaniiId: ajiltan?._id,
                    burtgesenAjiltaniiNer: ajiltan?.ner,
                    zogsooliinId: zogsooliinId,
                  }));

                const payload = {
                  id: selectedTransaction._id,
                  tulbur: tulburArray,
                };

                const resp = await uilchilgee(token || "").post("/zogsooliinTulburTulye", payload);
                
                if (resp.status === 200 || resp.data === "Amjilttai") {
                  toast.success("Төлбөр амжилттай бүртгэгдлээ");

                  // E-Barimt (payment.md section 3)
                  if (extraData?.ebarimt) {
                    try {
                      const ebResp = await uilchilgee(token || "").post("/ebarimtShivye", {
                        id: selectedTransaction._id,
                        type: extraData.ebarimt.type,
                        register: extraData.ebarimt.register
                      });
                      if (ebResp.data?.success || ebResp.data?.qrData) {
                        setEbarimtResult(ebResp.data);
                        toast.success("И-Баримт амжилттай үүслээ");
                      }
                    } catch (ebErr) {
                      console.error("Ebarimt error:", ebErr);
                      toast.error("И-Баримт үүсгэхэд алдаа гарлаа");
                    }
                  }

                  // Hardware Gate Kick (payment.md section 5)
                  const parkingList = parkingConfigData?.jagsaalt || parkingConfigData || [];
                  const parking = Array.isArray(parkingList) ? parkingList.find((p: any) => p._id === zogsooliinId) : parkingList;
                  
                  if (parking?.garakhKhaalgaGarTokhirgoo === true) {
                    const exitIP = activeExitIP || exitCameras[0]?.cameraIP;
                    if (exitIP) {
                      khaalgaNeey(exitIP);
                    }
                  }

                  setSelectedTransaction(null);
                  fetchList();
                } else {
                  toast.error("Алдаа гарлаа: " + (resp.data?.message || "Үл мэдэгдэх алдаа"));
                }
              } catch (err) {
                console.error("Payment registration error:", err);
                toast.error("Төлбөр бүртгэхэд алдаа гарлаа");
              }
            }}
          />
        )}
        {isRegModalOpen && (
          <VehicleRegistrationModal
            onClose={() => setIsRegModalOpen(false)}
            token={token || ""}
            barilgiinId={effectiveBarilgiinId}
            entryCameras={entryCameras}
            selectedCameraIP={activeEntryIP}
            onSuccess={() => fetchList()}
          />
        )}
      </div>
    </div>
  );
}

// Camera Stream Component using R2WPlayer
const CameraStream = React.memo(({
  ip,
  port,
  name,
  username,
  password,
  root = "stream",
  gateName,
  cameraType,
  onOpenGate,
}: {
  ip: string;
  port: number;
  name: string;
  username?: string;
  password?: string;
  root?: string; // Stream path (ROOT from tokhirgoo, e.g., "live", "stream")
  gateName?: string;
  cameraType?: "entry" | "exit";
  onOpenGate?: (ip: string) => void;
}) => {
  const [error, setError] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback((err: any) => {
    console.error("R2WPlayer error:", err);
    setError(true);
  }, []);

  const handleConnectionStateChange = useCallback((state: string) => {
    setConnectionState(state);
    if (state === "failed" || state === "disconnected") {
      setError(true);
    } else if (state === "connected") {
      setError(false);
    }
  }, []);

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
      if (e.key === "f" || e.key === "F") {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Press 'Escape' to exit fullscreen
      if (e.key === "Escape") {
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
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
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
            <p className="text-base mb-2 text-center">
              Камер холбогдохгүй байна
            </p>
            <p className="text-xs opacity-60 text-center mb-3 font-mono">
              {ip}:{port}
            </p>
            {connectionState && (
              <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                <p className="text-xs opacity-80 text-center">
                  Төлөв: {connectionState}
                </p>
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
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "#000",
            }
          : {}
      }
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

      {/* Manual Gate Control Button - Modernized */}
      <div className="absolute bottom-6 left-6 z-40 transition-all duration-300 group-hover/stream:translate-y-0 translate-y-2 group-hover/stream:opacity-100 opacity-0 sm:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenGate?.(ip);
          }}
          className={`
            relative flex items-center gap-3 px-8 py-3 rounded-full 
            font-black text-[11px] uppercase tracking-[0.2em]
            transition-all duration-300 active:scale-90
            backdrop-blur-xl border-2
            shadow-[0_8px_32px_rgba(0,0,0,0.3)]
            ${cameraType === 'entry' 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-white hover:bg-emerald-500 hover:border-emerald-400' 
              : 'bg-rose-500/20 border-rose-500/40 text-white hover:bg-rose-500 hover:border-rose-400'
            }
          `}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${cameraType === 'entry' ? 'bg-emerald-400' : 'bg-rose-400'} group-hover:bg-white `}></div>
          <span className="!text-white">Нээх</span>
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>


      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-all duration-200 ${
          isFullscreen
            ? "opacity-100"
            : "opacity-0 group-hover/stream:opacity-100"
        } focus:opacity-100`}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={
          isFullscreen ? "Бүтэн дэлгэцнээс гарах (ESC)" : "Бүтэн дэлгэц (F)"
        }
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Camera Info Overlay */}
      {!isFullscreen && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-black/60 text-white text-xs  opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
          {gateName && <span className="hidden sm:inline">{gateName} - </span>}
          <span className="font-mono">
            {ip}:{port}
          </span>
        </div>
      )}

      {/* Fullscreen overlay info */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 z-30 px-3 py-2 rounded-lg bg-black/70 text-white">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${cameraType === "entry" ? "bg-green-500" : "bg-red-500"} animate-pulse`}
            ></div>
            <div>
              <p className=" text-xs">{gateName || name}</p>
              <p className="text-xs opacity-75 font-mono">
                {ip}:{port}
              </p>
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
});
