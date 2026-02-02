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
  ArrowUpDown
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
        <span className="text-[11px] font-medium font-mono text-slate-800">
           {String(hours).padStart(2, "0")} : {String(minutes).padStart(2, "0")} : {String(seconds).padStart(2, "0")}
        </span>
     );
  }

  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-800">
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
  const pageSize = 100;
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
  const fetchList = async () => {
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
      query["tuukh.tuluv"] = { $in: [0, -2] };
      query["tuukh.garsanKhaalga"] = { $exists: false };
    } else if (statusFilter === 'paid') {
      query["tuukh.tuluv"] = { $in: [1, 2] };
    } else if (statusFilter === 'unpaid') {
      query["tuukh.tuluv"] = { $in: [0, -4] };
      query.niitDun = { $gt: 0 };
    } else if (statusFilter === 'free') {
      query.niitDun = 0;
      query["tuukh.tuluv"] = { $nin: [0, -2] };
    }

    // The mandatory $or structure for date filtering as requested
    const exitCameraIP = activeExitIP || (exitCameras[0]?.cameraIP);
    
    query.$or = [
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
          khuudasniiDugaar: page,
          khuudasniiKhemjee: pageSize,
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
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, rangeStart, rangeEnd, typeFilter, durationFilter, statusFilter]);

  // Initial fetch and fetch on changes
  useEffect(() => {
    fetchList();
  }, [page, searchTerm, rangeStart, rangeEnd, token, typeFilter, durationFilter, statusFilter, activeExitIP]);

  const khaalgaNeey = useCallback((ip: string) => {
    if (!ip) return;
    // Call local .NET service directly as requested
    axios.get(`http://localhost:5000/api/neeye/${ip}`)
      .then(() => console.log(`Gate opened locally: ${ip}`))
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
    if (!baiguullaga?._id || !cameras.length) return;
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
      if (data?._id && data?.baiguullagiinId === baiguullaga?._id) {
        setLiveUpdates((prev) => ({ ...prev, [data._id]: data }));
      }
    };

    s.on(`zogsool${baiguullaga._id}`, handleGeneralUpdate);
    cleanup.push(() => s.off(`zogsool${baiguullaga._id}`, handleGeneralUpdate));

    const handleOroh = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
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

      const dugaar = data.mashiniiDugaar?.replace("???", "");
      // Removed: uilchilgee(token || undefined).get(url).catch(() => {});
      // Removed: zurchilteiMashinMsgilgeekh(dugaar);
    };

    const handleGarah = (u: any) => {
      if (!u || !u?.mashiniiDugaar || !u?.baiguullagiinId || u?.baiguullagiinId !== baiguullaga?._id)
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
      if (baiguullaga?._id === "65cf2f027fbc788f85e50b90" || baiguullaga?._id === "6549bbe0d437e6d25d557341") {
        const start = moment(u?.createdAt).format("YYYY-MM-DD HH:mm:ss");
        const end = moment().format("YYYY-MM-DD HH:mm:ss");
        url = `/sambarOgnootoi/${garsanKhaalga}/${dugaar}/${niit}/${start}/${end}`;
      }

      if (u?.turul === "Үнэгүй" || niit === 0) {
        if (u?.tuukh?.[0]?.garsanKhaalga) {
          khaalgaNeey(u.tuukh[0].garsanKhaalga);
        }
      }
      // Removed: uilchilgee(token || undefined).get(url).catch(() => {});
      if (u?._id) handleGeneralUpdate(u);
    };

    const handleGarahTulsun = (data: any) => {
      if (!data || !data?.mashiniiDugaar || !data?.baiguullagiinId || data?.baiguullagiinId !== baiguullaga?._id)
        return;
      khaalgaNeey(data.cameraIP);
    };

    entryCameras.forEach((cam) => {
      const eventName = `zogsoolOroh${baiguullaga._id}${cam.cameraIP}`;
      s.on(eventName, handleOroh);
      cleanup.push(() => s.off(eventName, handleOroh));
    });

    exitCameras.forEach((cam) => {
      const e1 = `zogsoolGarakh${baiguullaga?._id}${cam.cameraIP}`;
      const e2 = `zogsoolGarahTulsun${baiguullaga?._id}${cam.cameraIP}`;

      s.on(e1, handleGarah);
      s.on(e2, handleGarahTulsun);

      cleanup.push(() => {
        s.off(e1, handleGarah);
        s.off(e2, handleGarahTulsun);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, [baiguullaga?._id, camerasHash, token]);

  const isSocketConnected = isConnected;





  const transactions: Uilchluulegch[] = useMemo(() => {
    const data = listData;
    let list: Uilchluulegch[] = [];

    if (Array.isArray(data?.jagsaalt)) list = data.jagsaalt;
    else if (Array.isArray(data?.list)) list = data.list;
    else if (Array.isArray(data?.data)) list = data.data;
    else if (Array.isArray(data)) list = data;

    const transactionMap = new Map<string, Uilchluulegch>();

    list.forEach((item, index) => {
      const key = item._id || `list_${index}_${item.mashiniiDugaar || "unknown"}`;
      transactionMap.set(key, item);
    });

    Object.values(liveUpdates).forEach((update: any) => {
      const key = update._id || update.mashiniiDugaar;
      if (key) transactionMap.set(key, update);
    });

    let merged = Array.from(transactionMap.values());

    // Filter Type
    if (typeFilter !== 'all') {
      merged = merged.filter(t => {
         const type = t.tuukh?.[0]?.turul || "Үйлчлүүлэгч"; 
         return type === 'Үйлчлүүлэгч';
      });
    }

    // Filter Status
    if (statusFilter !== 'all') {
      merged = merged.filter(t => {
        const tuluv = t.tuukh?.[0]?.tuluv;
        if (statusFilter === 'active') return tuluv === 0 || tuluv === -2;
        if (statusFilter === 'paid') return tuluv === 1 || tuluv === 2;
        if (statusFilter === 'unpaid') return (tuluv === 0 || tuluv === -4) && (t.niitDun || 0) > 0;
        if (statusFilter === 'free') return (t.niitDun || 0) === 0 && (tuluv !== 0 && tuluv !== -2);
        return true;
      });
    }

    // Sort
    merged.sort((a, b) => {
      const getInTime = (t: Uilchluulegch) => t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.orsonTsag).getTime() : (t.createdAt ? new Date(t.createdAt).getTime() : 0);
      const getOutTime = (t: Uilchluulegch) => t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag ? new Date(t.tuukh?.[0]?.tsagiinTuukh?.[0]?.garsanTsag).getTime() : 0;
      
      if (durationFilter === 'longest') {
         const durA = getOutTime(a) ? (getOutTime(a) - getInTime(a)) : (Date.now() - getInTime(a));
         const durB = getOutTime(b) ? (getOutTime(b) - getInTime(b)) : (Date.now() - getInTime(b));
         return durB - durA;
      } else if (durationFilter === 'latest_in') {
         return getInTime(b) - getInTime(a);
      } else {
         const timeA = getOutTime(a) || getInTime(a);
         const timeB = getOutTime(b) || getInTime(b);
         return timeB - timeA;
      }
    });

    if (page === 1) {
      return merged.slice(0, pageSize);
    }

    return merged;
  }, [listData, liveUpdates, page, durationFilter, typeFilter, statusFilter]);

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

  const totalPages = Math.ceil(
    (listData?.niitMur ||
      transactions.length) / pageSize,
  );

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-slate-900 text-white shadow-lg">
                  <Calendar className="w-4 h-4" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Жагсаалт</h3>
                
               </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="flex items-center gap-2 px-6 h-10 rounded-2xl bg-[#4285F4] border border-[#4285F4] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Машин бүртгэх</span>
              </button>

              <div className="min-w-[240px]">
                <DatePickerInput
                  type="range"
                  value={dateRange}
                  onChange={(v: any) => {
                    setDateRange(v);
                    setPage(1);
                  }}
                  valueFormat="YYYY-MM-DD"
                  leftSection={<Calendar className="w-3.5 h-3.5 text-slate-400" />}
                  rightSection={<ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  classNames={{ input: "flex items-center gap-2 rounded-2xl bg-white hover:bg-slate-50 transition-all h-10 px-4 font-black text-[10px] uppercase tracking-widest text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border-0" }}
                  clearable
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--surface-border)] bg-white/40 backdrop-blur-md shadow-xl dark:bg-black/20">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[11px] border-collapse bg-white dark:bg-slate-950/50">
                <thead>
                   <tr className="bg-slate-900 border-b border-white/10">
                      {[
                        { id: 'no', label: "№", width: 'w-12' },
                        { id: 'dugaar', label: "Дугаар" },
                        { id: 'orson', label: "Орсон" },
                        { id: 'garsan', label: "Гарсан", sortable: true },
                        { 
                          id: 'duration', 
                          label: "Хугацаа/мин", 
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
                          filter: true,
                          current: typeFilter,
                          set: (v: string) => { setTypeFilter(v); setPage(1); },
                          options: [
                             { label: "Бүгд", value: "all" },
                             { label: "Төлбөртэй", value: "client" }
                          ]
                        },
                        { id: 'discount', label: "Хөнгөлөлт" },
                        { id: 'amount', label: "Дүн" },
                        { id: 'payment', label: "Төлбөр" },
                        { id: 'ebarimt', label: "И-Баримт" },
                        { 
                          id: 'status', 
                          label: "Төлөв",
                          filter: true,
                          current: statusFilter,
                          set: (v: string) => { setStatusFilter(v); setPage(1); },
                          options: [
                            { label: "Бүгд", value: "all" },
                            { label: "Идэвхтэй", value: "active" },
                            { label: "Төлсөн", value: "paid" },
                            { label: "Төлөөгүй", value: "unpaid" },
                            { label: "Үнэгүй", value: "free" }
                          ]
                        },
                        { id: 'reason', label: "Шалтгаан" },
                        { id: 'actions', label: "" },
                      ].map((h, i) => (
                        <th key={h.id} className={`group relative py-3 px-3 text-slate-400 uppercase tracking-tighter text-[10px] text-center ${h.width || ''}`}>
                          <div className={`flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors ${h.width ? '' : 'w-full'}`}>
                             {h.filter && <Filter className="w-3 h-3" />}
                             {h.label}
                             {h.sortable && <ArrowUpDown className="w-3 h-3" />}
                          </div>

                           {h.options && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] border border-white/10 translate-y-3 group-hover:translate-y-0 ring-1 ring-black/50 overflow-hidden">
                                 <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-white/10"></div>
                                 <div className="relative flex flex-col gap-1 z-10">
                                   <div className="px-3 py-1.5 mb-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                      {h.label} Сонгох
                                   </div>
                                   {h.options.map((opt, idx) => (
                                     <div 
                                       key={idx} 
                                       onClick={() => (h as any).set?.(opt.value)}
                                       className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold text-left flex items-center justify-between cursor-pointer transition-all duration-200 border border-transparent ${
                                          (h as any).current === opt.value 
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-1 ring-emerald-400/50' 
                                            : 'hover:bg-white/10 text-slate-300 hover:text-white'
                                       }`}
                                     >
                                       <span>{opt.label}</span>
                                       {(h as any).current === opt.value && (
                                         <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
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
                      <td colSpan={14} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                           <Calendar className="w-12 h-12 mb-2" />
                           <p className="text-xs font-black uppercase tracking-widest">Мэдээлэл олдсонгүй</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction, idx) => {
                      const mur = transaction.tuukh?.[0];
                      const tsag = mur?.tsagiinTuukh?.[0];
                      const orsonTsag = tsag?.orsonTsag;
                      const garsanTsag = tsag?.garsanTsag;
                      
                      const tuluv = mur?.tuluv;
                      const niitDun = transaction.niitDun || 0;
                      const isCurrentlyIn = !mur?.garsanKhaalga;
                      
                      // Debt logic: marked as debt (-4) OR left without payment (tuluv 0, out, balance > 0)
                      const isDebt = tuluv === -4 || (tuluv === 0 && niitDun > 0 && !isCurrentlyIn);
                      // Active logic: still inside and not yet paid (tuluv 0 or 2)
                      const isActive = isCurrentlyIn && (tuluv === 0 || tuluv === 2);
                      const showActionBtn = isActive || isDebt;

                      return (
                        <tr
                          key={transaction._id || idx}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group"
                        >
                          <td className="py-2.5 px-3 text-center text-gray-400">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                             <div className="flex items-center gap-2">
                                <span className=" text-slate-700 dark:text-slate-300">{transaction.mashiniiDugaar || "-"}</span>
                                <Copy 
                                  className="w-3 h-3 text-slate-300 dark:text-slate-600 cursor-pointer hover:text-blue-500 transition-colors" 
                                  onClick={() => copyToClipboard(transaction.mashiniiDugaar)}
                                />
                             </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                             <span className=" text-slate-800 dark:text-slate-300">
                               {orsonTsag ? moment(orsonTsag).format("MM-DD HH:mm:ss") : "-"}
                             </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                             <span className=" text-slate-800 dark:text-slate-300">
                               {garsanTsag ? moment(garsanTsag).format("MM-DD HH:mm:ss") : "-"}
                             </span>
                          </td>
                          <td className="py-2.5 px-3">
                             <div className={`px-2 py-1.5 rounded-2xl text-center w-[130px] inline-block whitespace-nowrap border ${
                               !garsanTsag 
                                 ? "bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-100 font-medium" 
                                 : "bg-emerald-50 border-emerald-100 text-slate-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-100 font-medium"
                             }`}>
                                <RealTimeDuration orsonTsag={orsonTsag} garsanTsag={garsanTsag} />
                             </div>

                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300 ">
                             {transaction.tuukh?.[0]?.turul || "Үйлчлүүлэгч"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300 ">
                             {transaction.tuukh?.[0]?.khungulult || ""}
                          </td>
                          <td className="py-2.5 px-3  text-slate-800 dark:text-slate-300">
                             {transaction.niitDun || 0}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300 ">
                             {transaction.tuukh?.[0]?.tulsunDun || ""}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300 ">
                             {transaction.tuukh?.[0]?.ebarimtId || 0}
                          </td>
                            <td className="py-2.5 px-3 relative">
                                {showActionBtn ? (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                           if (niitDun > 0 || isDebt) {
                                              setSelectedTransaction(transaction);
                                              setConfirmExitId(null);
                                           } else {
                                              setConfirmExitId(confirmExitId === transaction._id ? null : transaction._id);
                                           }
                                        }}
                                        className={`flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter shadow-sm active:scale-95 transition-all border ${
                                           isDebt 
                                           ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-400" 
                                           : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 dark:hover:bg-blue-900/50"
                                        }`}
                                      >
                                         <span className={`w-1.5 h-1.5 rounded-full ${isDebt ? "bg-amber-500" : "bg-blue-500 animate-pulse"}`}></span>
                                         <span>{isDebt ? "Төлбөр" : "Идэвхтэй"}</span>
                                      </button>
                                      {confirmExitId === transaction._id && (
                                         <div className="absolute left-0 mt-8 z-50 flex items-center gap-1 bg-white p-2 rounded-xl shadow-2xl border border-gray-100 min-w-[200px]">
                                            <button 
                                              onClick={() => handleManualExit(transaction, "pay")}
                                              className="flex-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-600 transition-colors"
                                            >
                                              Төлөх
                                            </button>
                                            <button 
                                              onClick={() => handleManualExit(transaction, "free")}
                                              className="flex-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase hover:bg-amber-600 transition-colors"
                                            >
                                              Үнэгүй
                                            </button>
                                            <button 
                                              onClick={() => setConfirmExitId(null)}
                                              className="p-1.5 text-gray-400 hover:text-gray-600"
                                            >
                                               <X className="w-4 h-4" />
                                            </button>
                                         </div>
                                      )}
                                    </div>
                                ) : (
                                  (() => {
                                    if (tuluv === 1) return (
                                      <div className="flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[9px] font-bold uppercase">Төлсөн</span>
                                      </div>
                                    );
                                    if (tuluv === 2) return (
                                      <div className="flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        <span className="text-[9px] font-bold uppercase">Урьдчилсан</span>
                                      </div>
                                    );
                                    if (tuluv === -2 || tuluv === -1) return (
                                      <div className="flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <span className="text-[9px] font-bold uppercase">Зөрчилтэй</span>
                                      </div>
                                    );
                                    if (!isCurrentlyIn && niitDun === 0) return (
                                      <div className="flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                        <span className="text-[9px] font-bold uppercase">Үнэгүй</span>
                                      </div>
                                    );
                                    return (
                                      <div className="flex items-center justify-center gap-1.5 w-[90px] px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        <span className="text-[9px] font-bold uppercase">Идэвхтэй</span>
                                      </div>
                                    );
                                  })()
                                )}
                             </td>
                          <td className="py-2.5 px-3 text-gray-400 italic truncate max-w-[100px]">
                             {transaction.zurchil || ""}
                          </td>
                          <td className="py-2.5 px-3">
                             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <Info className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="p-1.5 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                   <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50/50 border-t border-gray-100  text-[10px]">
                   <tr>
                      <td colSpan={6} className="py-3 px-3 text-right text-gray-400 uppercase">Нийт дүн</td>
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td className="py-3 px-3 text-gray-700">0</td>
                      <td colSpan={3}></td>
                   </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Өмнөх
            </button>
            <span className="px-4 py-2 text-sm text-[color:var(--panel-text)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-[color:var(--panel-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--surface-hover)] transition text-sm"
            >
              Дараах
            </button>
          </div>
        )}

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
                
                const payload = {
                  id: selectedTransaction._id,
                  tulbur: [
                    {
                      ognoo: new Date().toISOString(),
                      baiguullagiinId: ajiltan?.baiguullagiinId,
                      barilgiinId: effectiveBarilgiinId,
                      burtgesenAjiltaniiId: ajiltan?._id,
                      burtgesenAjiltaniiNer: ajiltan?.ner,
                      dun: amount,
                      turul: method,
                      zogsooliinId: zogsooliinId,
                    }
                  ]
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
            <p className="text-base font-semibold mb-2 text-center">
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
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100 hover:bg-emerald-500 hover:text-white hover:border-emerald-400' 
              : 'bg-rose-500/20 border-rose-500/40 text-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-400'
            }
          `}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${cameraType === 'entry' ? 'bg-emerald-400' : 'bg-rose-400'} group-hover:bg-white`}></div>
          <span>Нээх</span>
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
        <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium opacity-0 group-hover/stream:opacity-100 transition-opacity duration-200">
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
              <p className="font-semibold text-xs">{gateName || name}</p>
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
